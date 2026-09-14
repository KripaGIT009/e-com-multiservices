package com.example.service;

import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import com.example.event.SupplierOrderEventPublisher;
import com.example.repository.SupplierOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

/**
 * The one place a supplier order's status is changed by a person or a partner. Operator
 * updates (PUT /status) and partner webhooks both go through {@link #apply}, so they obey
 * the same status machine.
 */
@Component
public class SupplierOrderStatusUpdater {

    private final SupplierOrderRepository supplierOrders;
    private final SupplierOrderEventPublisher events;

    public SupplierOrderStatusUpdater(SupplierOrderRepository supplierOrders, SupplierOrderEventPublisher events) {
        this.supplierOrders = supplierOrders;
        this.events = events;
    }

    /**
     * @throws ResponseStatusException 409 for an illegal transition, 400 for SHIPPED with
     *         no tracking number
     */
    @Transactional
    public SupplierOrder apply(SupplierOrder so, SupplierOrderStatus target, String partnerOrderRef,
                               String trackingNumber, String carrierName, String trackingUrl, String note) {
        SupplierOrderStatus current = so.getStatus();
        if (target == SupplierOrderStatus.CREATED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot move from " + current
                + " to CREATED" + (current == SupplierOrderStatus.FAILED ? "; use retry" : ""));
        }
        if (current == null || !current.canTransitionTo(target)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot move from " + current + " to " + target);
        }
        if (target == SupplierOrderStatus.SHIPPED && isBlank(trackingNumber) && isBlank(so.getTrackingNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "A tracking number is required to mark a supplier order SHIPPED");
        }

        recordDetails(so, partnerOrderRef, trackingNumber, carrierName, trackingUrl, note);
        LocalDateTime now = LocalDateTime.now();
        switch (target) {
            case SUBMITTED -> {
                if (so.getSubmittedAt() == null) so.setSubmittedAt(now);
            }
            case SHIPPED -> so.setShippedAt(now);
            case DELIVERED -> so.setDeliveredAt(now);
            case FAILED -> so.setFailureReason(isBlank(note) ? "Marked failed by an operator"
                : SupplierOrderPlacement.truncate(note, 500));
            default -> { }
        }
        so.setStatus(target);
        SupplierOrder saved = supplierOrders.save(so);
        events.statusChanged(saved, current.name());
        return saved;
    }

    /** Stores whatever reference, tracking and note fields were supplied; blanks are ignored. */
    @Transactional
    public SupplierOrder recordDetails(SupplierOrder so, String partnerOrderRef, String trackingNumber,
                                       String carrierName, String trackingUrl, String note) {
        // Truncated because webhook payloads bypass request validation.
        if (!isBlank(partnerOrderRef)) so.setPartnerOrderRef(SupplierOrderPlacement.truncate(partnerOrderRef, 80));
        if (!isBlank(trackingNumber)) so.setTrackingNumber(SupplierOrderPlacement.truncate(trackingNumber, 60));
        if (!isBlank(carrierName)) so.setCarrierName(SupplierOrderPlacement.truncate(carrierName, 80));
        if (!isBlank(trackingUrl)) so.setTrackingUrl(SupplierOrderPlacement.truncate(trackingUrl, 512));
        if (!isBlank(note)) so.setLastNote(SupplierOrderPlacement.truncate(note, 500));
        return so;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
