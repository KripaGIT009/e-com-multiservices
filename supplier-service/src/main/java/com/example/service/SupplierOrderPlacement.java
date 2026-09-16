package com.example.service;

import com.example.client.OrderView;
import com.example.dropship.DropshipAdapter;
import com.example.dropship.DropshipAdapterRegistry;
import com.example.dropship.DropshipException;
import com.example.dropship.SubmissionResult;
import com.example.entity.DropshipListing;
import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderLine;
import com.example.entity.SupplierOrderStatus;
import com.example.repository.DropshipListingRepository;
import com.example.repository.DropshipPartnerRepository;
import com.example.repository.SupplierOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Builds, costs and submits one supplier order. A separate bean so that creation runs in
 * its own transaction: when two dispatches race, the loser's insert fails on the
 * (order_id, partner_code) constraint and only that transaction rolls back, leaving the
 * caller free to reload the winning row.
 */
@Component
public class SupplierOrderPlacement {

    private static final Logger log = LoggerFactory.getLogger(SupplierOrderPlacement.class);

    private final SupplierOrderRepository supplierOrders;
    private final DropshipPartnerRepository partners;
    private final DropshipListingRepository listings;
    private final DropshipAdapterRegistry adapters;

    public SupplierOrderPlacement(SupplierOrderRepository supplierOrders,
                                  DropshipPartnerRepository partners,
                                  DropshipListingRepository listings,
                                  DropshipAdapterRegistry adapters) {
        this.supplierOrders = supplierOrders;
        this.partners = partners;
        this.listings = listings;
        this.adapters = adapters;
    }

    /**
     * Creates the supplier order for one partner's lines and submits it.
     *
     * @throws org.springframework.dao.DataIntegrityViolationException when another dispatch
     *         already created the row for (orderId, partnerCode)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SupplierOrder create(OrderView order, String partnerCode, List<OrderView.Item> items) {
        SupplierOrder so = new SupplierOrder();
        so.setOrderId(order.id());
        so.setOrderNumber(order.orderNumber());
        so.setPartnerCode(partnerCode);
        so.setStatus(SupplierOrderStatus.CREATED);
        so.setAttempts(1);
        snapshotAddress(so, order.shippingAddress());
        so.setShipToEmail(truncate(order.customerEmail(), 160));
        for (OrderView.Item item : items) {
            SupplierOrderLine line = new SupplierOrderLine();
            line.setItemId(parseItemId(item.productId()));
            line.setProductName(item.productName());
            line.setQuantity(item.quantity() == null ? 0 : item.quantity());
            line.setUnitPrice(item.unitPrice());
            so.addLine(line);
        }
        DropshipPartner partner = resolve(so);
        // Flush now so a lost race surfaces here, before anything is sent to a partner.
        so = supplierOrders.saveAndFlush(so);
        if (partner != null) {
            submit(so, partner);
            so = supplierOrders.save(so);
        }
        return so;
    }

    /**
     * Re-costs a supplier order already in CREATED and submits it. Runs in the caller's
     * transaction (used by retry).
     */
    public SupplierOrder resolveAndSubmit(SupplierOrder so) {
        DropshipPartner partner = resolve(so);
        if (partner != null) submit(so, partner);
        return supplierOrders.save(so);
    }

    /**
     * Checks the partner and prices every line from its listing. On any problem the order
     * is marked FAILED with the reason and null is returned.
     */
    DropshipPartner resolve(SupplierOrder so) {
        so.setFailureReason(null);
        so.setCostTotal(null);
        for (SupplierOrderLine line : so.getLines()) {
            line.setPartnerSku(null);
            line.setUnitCost(null);
        }

        DropshipPartner partner = partners.findByCode(so.getPartnerCode()).orElse(null);
        if (partner == null) {
            return fail(so, "UNKNOWN".equals(so.getPartnerCode())
                ? "Dropship lines have no fulfilment partner code"
                : "Dropship partner " + so.getPartnerCode() + " is not registered");
        }
        if (!partner.isActive()) {
            return fail(so, "Dropship partner " + partner.getName() + " is inactive");
        }
        if (so.getLines().isEmpty()) {
            return fail(so, "Supplier order has no lines");
        }
        if (so.getShipToLine1() == null || so.getShipToPostalCode() == null) {
            return fail(so, "Order " + so.getOrderNumber() + " has no shipping address");
        }

        BigDecimal total = BigDecimal.ZERO;
        for (SupplierOrderLine line : so.getLines()) {
            String product = line.getProductName() != null ? "'" + line.getProductName() + "'" : "A product";
            if (line.getItemId() == null) {
                return fail(so, product + " has no catalogue item id");
            }
            if (line.getQuantity() == null || line.getQuantity() <= 0) {
                return fail(so, product + " has no quantity");
            }
            DropshipListing listing = listings.findByItemId(line.getItemId()).orElse(null);
            if (listing == null || !listing.isActive()) {
                return fail(so, "No active dropship listing for " + product + " (item " + line.getItemId() + ")");
            }
            if (!listing.getPartnerCode().equals(so.getPartnerCode())) {
                return fail(so, product + " is listed with " + listing.getPartnerCode()
                    + ", not " + so.getPartnerCode());
            }
            line.setPartnerSku(listing.getPartnerSku());
            line.setUnitCost(listing.getCostPrice());
            total = total.add(listing.getCostPrice().multiply(BigDecimal.valueOf(line.getQuantity())));
        }
        so.setCostTotal(total);
        return partner;
    }

    /** Hands a costed CREATED order to the partner's adapter and applies the result. */
    void submit(SupplierOrder so, DropshipPartner partner) {
        DropshipAdapter adapter = adapters.forType(partner.getIntegrationType());
        String prefix = "";
        if (!adapter.isConfigured()) {
            // P6: an adapter without credentials falls back to manual, labelled as manual.
            prefix = adapter.label() + " integration is not configured (missing "
                + String.join(", ", adapter.requiredEnvironment()) + "); handled manually. ";
            adapter = adapters.manual();
        }
        try {
            SubmissionResult result = adapter.submit(so, partner);
            SupplierOrderStatus next = result == null ? null : result.status();
            if (next == null || !SupplierOrderStatus.CREATED.canTransitionTo(next)) {
                fail(so, adapter.label() + " returned an invalid submission status: " + next);
                return;
            }
            so.setStatus(next);
            if (result.partnerOrderRef() != null) so.setPartnerOrderRef(result.partnerOrderRef());
            if (next == SupplierOrderStatus.SUBMITTED) so.setSubmittedAt(LocalDateTime.now());
            so.setLastNote(truncate(prefix + (result.note() == null ? "" : result.note()), 500));
            if (next == SupplierOrderStatus.FAILED && so.getFailureReason() == null) {
                so.setFailureReason(truncate(result.note(), 500));
            }
        } catch (DropshipException e) {
            log.warn("Submitting supplier order {} to {} failed: {}", so.getId(), partner.getCode(), e.getMessage());
            fail(so, e.getMessage());
        }
    }

    private DropshipPartner fail(SupplierOrder so, String reason) {
        so.setStatus(SupplierOrderStatus.FAILED);
        so.setFailureReason(truncate(reason, 500));
        return null;
    }

    private static void snapshotAddress(SupplierOrder so, OrderView.Address a) {
        if (a == null) return;
        so.setShipToName(truncate(a.fullName(), 120));
        so.setShipToLine1(truncate(a.addressLine1(), 200));
        so.setShipToLine2(truncate(a.addressLine2(), 200));
        so.setShipToCity(truncate(a.city(), 100));
        so.setShipToState(truncate(a.state(), 100));
        so.setShipToPostalCode(truncate(a.postalCode(), 10));
        so.setShipToPhone(truncate(a.phone(), 20));
    }

    static Long parseItemId(String productId) {
        if (productId == null) return null;
        try {
            return Long.valueOf(productId.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static String truncate(String value, int max) {
        if (value == null) return null;
        String v = value.trim();
        return v.length() <= max ? v : v.substring(0, max);
    }
}
