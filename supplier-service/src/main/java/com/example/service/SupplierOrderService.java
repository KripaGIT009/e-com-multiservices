package com.example.service;

import com.example.client.OrderClient;
import com.example.client.OrderView;
import com.example.dto.DtoMapper;
import com.example.dto.SupplierOrderDtos.DispatchResponse;
import com.example.dto.SupplierOrderDtos.StatusUpdateRequest;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import com.example.event.SupplierOrderEventPublisher;
import com.example.repository.SupplierOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SupplierOrderService {

    private static final Logger log = LoggerFactory.getLogger(SupplierOrderService.class);

    static final String DROPSHIP = "DROPSHIP";
    static final String UNKNOWN_PARTNER = "UNKNOWN";
    private static final Set<String> PAID = Set.of("PAYMENT_COMPLETED", "INVENTORY_RESERVED");

    private final OrderClient orderClient;
    private final SupplierOrderRepository supplierOrders;
    private final SupplierOrderPlacement placement;
    private final SupplierOrderStatusUpdater statusUpdater;
    private final SupplierOrderEventPublisher events;

    public SupplierOrderService(OrderClient orderClient,
                                SupplierOrderRepository supplierOrders,
                                SupplierOrderPlacement placement,
                                SupplierOrderStatusUpdater statusUpdater,
                                SupplierOrderEventPublisher events) {
        this.orderClient = orderClient;
        this.supplierOrders = supplierOrders;
        this.placement = placement;
        this.statusUpdater = statusUpdater;
        this.events = events;
    }

    /**
     * Creates and submits one supplier order per dropship partner in a paid order
     * (docs/commerce-architecture.md §9.4). Re-runnable: existing supplier orders are
     * returned untouched.
     *
     * <p>Deliberately not one transaction. Each supplier order is created in its own
     * (see {@link SupplierOrderPlacement}) so a lost unique-constraint race rolls back
     * only that insert, and a partner already submitted is never rolled back because a
     * later partner failed.
     */
    public DispatchResponse dispatch(Long orderId) {
        if (orderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId is required");
        }
        OrderView order = orderClient.getOrder(orderId);
        // P4: the caller is never trusted on payment — check the order itself.
        if (order.status() == null || !PAID.contains(order.status().trim().toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order is not paid");
        }

        Map<String, List<OrderView.Item>> groups = new LinkedHashMap<>();
        for (OrderView.Item item : order.items() == null ? List.<OrderView.Item>of() : order.items()) {
            if (item == null || !DROPSHIP.equalsIgnoreCase(item.fulfilmentModel())) continue;
            String code = item.fulfilmentPartnerCode() == null || item.fulfilmentPartnerCode().isBlank()
                ? UNKNOWN_PARTNER : item.fulfilmentPartnerCode().trim();
            groups.computeIfAbsent(code, k -> new ArrayList<>()).add(item);
        }

        int created = 0;
        int existing = 0;
        List<SupplierOrderResponse> results = new ArrayList<>();
        for (Map.Entry<String, List<OrderView.Item>> group : groups.entrySet()) {
            String partnerCode = group.getKey();
            SupplierOrder found = supplierOrders.findByOrderIdAndPartnerCode(orderId, partnerCode).orElse(null);
            if (found != null) {
                existing++;
                results.add(DtoMapper.toResponse(found));
                continue;
            }
            try {
                SupplierOrder so = placement.create(order, partnerCode, group.getValue());
                created++;
                results.add(DtoMapper.toResponse(so));
                events.created(so);
                log.info("Supplier order {} for order {} / {} is {}", so.getId(), orderId, partnerCode, so.getStatus());
            } catch (DataIntegrityViolationException race) {
                // Another dispatch inserted (orderId, partnerCode) first: theirs stands.
                SupplierOrder winner = supplierOrders.findByOrderIdAndPartnerCode(orderId, partnerCode)
                    .orElseThrow(() -> race);
                existing++;
                results.add(DtoMapper.toResponse(winner));
            }
        }
        return new DispatchResponse(orderId, created, existing, results);
    }

    @Transactional(readOnly = true)
    public List<SupplierOrderResponse> list(String status, String partnerCode) {
        String partner = partnerCode == null || partnerCode.isBlank() ? null : partnerCode.trim();
        List<SupplierOrder> rows;
        if (status == null || status.isBlank()) {
            rows = partner == null ? supplierOrders.findAllByOrderByCreatedAtDesc()
                : supplierOrders.findByPartnerCodeOrderByCreatedAtDesc(partner);
        } else {
            String name = parseStatus(status).name();
            rows = partner == null ? supplierOrders.findByStatusName(name)
                : supplierOrders.findByStatusNameAndPartnerCode(name, partner);
        }
        return rows.stream().map(DtoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SupplierOrderResponse get(Long id) {
        return DtoMapper.toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public List<SupplierOrderResponse> forOrder(Long orderId) {
        return supplierOrders.findByOrderIdOrderByIdAsc(orderId).stream().map(DtoMapper::toResponse).toList();
    }

    @Transactional
    public SupplierOrderResponse updateStatus(Long id, StatusUpdateRequest request) {
        SupplierOrder so = find(id);
        SupplierOrderStatus target = parseStatus(request.status());
        statusUpdater.apply(so, target, request.partnerOrderRef(), request.trackingNumber(),
            request.carrierName(), request.trackingUrl(), request.note());
        return DtoMapper.toResponse(so);
    }

    /** FAILED only: back to CREATED, re-cost from current listings, resubmit. */
    @Transactional
    public SupplierOrderResponse retry(Long id) {
        SupplierOrder so = find(id);
        SupplierOrderStatus previous = so.getStatus();
        if (previous != SupplierOrderStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Only a FAILED supplier order can be retried; this one is " + previous);
        }
        so.setStatus(SupplierOrderStatus.CREATED);
        so.setAttempts((so.getAttempts() == null ? 0 : so.getAttempts()) + 1);
        so = placement.resolveAndSubmit(so);
        events.statusChanged(so, previous.name());
        return DtoMapper.toResponse(so);
    }

    private SupplierOrder find(Long id) {
        return supplierOrders.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier order " + id + " not found"));
    }

    static SupplierOrderStatus parseStatus(String value) {
        SupplierOrderStatus status = SupplierOrderStatus.parse(value);
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown supplier order status: " + value);
        }
        return status;
    }
}
