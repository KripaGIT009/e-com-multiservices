package com.example.service;

import com.example.dropship.DropshipAdapter;
import com.example.dropship.DropshipAdapterRegistry;
import com.example.dropship.DropshipCapability;
import com.example.dropship.DropshipException;
import com.example.dropship.WebhookEvent;
import com.example.dto.DtoMapper;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.repository.DropshipPartnerRepository;
import com.example.repository.SupplierOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

/** Applies a partner's webhook to its supplier order through the normal status machine. */
@Service
public class WebhookService {

    private final DropshipPartnerRepository partners;
    private final SupplierOrderRepository supplierOrders;
    private final DropshipAdapterRegistry adapters;
    private final SupplierOrderStatusUpdater statusUpdater;

    public WebhookService(DropshipPartnerRepository partners,
                          SupplierOrderRepository supplierOrders,
                          DropshipAdapterRegistry adapters,
                          SupplierOrderStatusUpdater statusUpdater) {
        this.partners = partners;
        this.supplierOrders = supplierOrders;
        this.adapters = adapters;
        this.statusUpdater = statusUpdater;
    }

    @Transactional
    public SupplierOrderResponse handle(String partnerCode, Map<String, String> headers, byte[] body) {
        DropshipPartner partner = partners.findByCode(partnerCode).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Dropship partner " + partnerCode + " not found"));
        DropshipAdapter adapter = adapters.forType(partner.getIntegrationType());
        String noWebhooks = partner.getName() + " has no webhook integration";
        if (!adapter.capabilities().contains(DropshipCapability.WEBHOOKS)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, noWebhooks);
        }

        Optional<WebhookEvent> parsed;
        try {
            // The adapter verifies the partner's signature over these exact bytes.
            parsed = adapter.parseWebhook(headers, body == null ? new byte[0] : body);
        } catch (DropshipException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        WebhookEvent event = parsed.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, noWebhooks));
        if (event.partnerOrderRef() == null || event.partnerOrderRef().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook carries no partner order reference");
        }

        SupplierOrder so = supplierOrders.findFirstByPartnerCodeAndPartnerOrderRef(partner.getCode(), event.partnerOrderRef())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No supplier order with reference " + event.partnerOrderRef() + " for " + partner.getCode()));

        if (event.status() == null || event.status() == so.getStatus()) {
            // Partners redeliver webhooks; a repeat of the current status only refreshes details.
            statusUpdater.recordDetails(so, null, event.trackingNumber(), event.carrierName(), null, event.note());
            supplierOrders.save(so);
        } else {
            statusUpdater.apply(so, event.status(), null, event.trackingNumber(), event.carrierName(), null, event.note());
        }
        return DtoMapper.toResponse(so);
    }
}
