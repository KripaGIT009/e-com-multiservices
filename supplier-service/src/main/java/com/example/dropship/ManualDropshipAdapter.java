package com.example.dropship;

import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * The adapter for a partner with no API. It does not contact anyone: it marks the order
 * as waiting for an operator to place it on the partner's portal and record the
 * reference and tracking number. Always configured.
 */
@Component
public class ManualDropshipAdapter implements DropshipAdapter {

    static final String NOTE = "Place this order on the partner's portal, then record their reference here.";

    @Override
    public String key() {
        return DropshipAdapterRegistry.MANUAL;
    }

    @Override
    public String label() {
        return "Manual (partner portal)";
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public Set<DropshipCapability> capabilities() {
        return EnumSet.of(DropshipCapability.ORDER_SUBMISSION);
    }

    @Override
    public List<String> requiredEnvironment() {
        return List.of();
    }

    @Override
    public SubmissionResult submit(SupplierOrder order, DropshipPartner partner) {
        return new SubmissionResult(SubmissionResult.MODE_MANUAL, null,
            SupplierOrderStatus.AWAITING_MANUAL_PLACEMENT, NOTE);
    }
}
