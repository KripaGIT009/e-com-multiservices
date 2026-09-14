package com.example.service;

import com.example.carrier.CarrierAdapter;
import com.example.carrier.CarrierAdapterRegistry;
import com.example.dto.DeliveryPartnerRequest;
import com.example.dto.DeliveryPartnerResponse;
import com.example.entity.DeliveryPartner;
import com.example.repository.DeliveryPartnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DeliveryPartnerService {

    private static final Pattern CODE = Pattern.compile("^[A-Z0-9_]{2,20}$");

    private final DeliveryPartnerRepository repository;
    private final CarrierAdapterRegistry registry;

    public DeliveryPartnerService(DeliveryPartnerRepository repository, CarrierAdapterRegistry registry) {
        this.repository = repository;
        this.registry = registry;
    }

    @Transactional(readOnly = true)
    public List<DeliveryPartnerResponse> list(boolean all) {
        List<DeliveryPartner> partners = all ? repository.findAll()
                                             : repository.findByActiveTrueOrderByEstimatedDaysAsc();
        return partners.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DeliveryPartnerResponse> serviceable(String pincode) {
        return repository.findByActiveTrueOrderByEstimatedDaysAsc().stream()
            .filter(p -> p.servesPincode(pincode))
            .map(this::toResponse).toList();
    }

    @Transactional
    public DeliveryPartnerResponse create(DeliveryPartnerRequest request) {
        if (request == null) throw badRequest("A request body is required");
        String code = request.code() == null ? null : request.code().trim();
        if (code == null || !CODE.matcher(code).matches()) {
            throw badRequest("code must be 2–20 characters of A–Z, 0–9 or _");
        }
        if (request.name() == null || request.name().isBlank()) throw badRequest("name is required");
        if (repository.findByCode(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A delivery partner with code " + code + " already exists");
        }

        DeliveryPartner partner = new DeliveryPartner();
        partner.setCode(code);
        // A new row names its adapter explicitly; omitting it means a carrier with no API.
        partner.setIntegrationType(CarrierAdapterRegistry.MANUAL);
        partner.setActive(request.active() == null || request.active());
        apply(partner, request);
        return toResponse(repository.save(partner));
    }

    /** Patch: only supplied fields change. The code is not editable — rules and orders refer to it. */
    @Transactional
    public DeliveryPartnerResponse update(Long id, DeliveryPartnerRequest request) {
        if (request == null) throw badRequest("A request body is required");
        DeliveryPartner partner = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery partner not found: " + id));
        if (request.active() != null) partner.setActive(request.active());
        apply(partner, request);
        return toResponse(repository.save(partner));
    }

    private void apply(DeliveryPartner partner, DeliveryPartnerRequest r) {
        if (r.name() != null) {
            if (r.name().isBlank()) throw badRequest("name cannot be blank");
            partner.setName(r.name().trim());
        }
        if (r.trackingUrlTemplate() != null) partner.setTrackingUrlTemplate(r.trackingUrlTemplate().trim());
        if (r.estimatedDays() != null) {
            if (r.estimatedDays() < 1) throw badRequest("estimatedDays must be at least 1");
            partner.setEstimatedDays(r.estimatedDays());
        }
        if (r.baseRate() != null) {
            if (r.baseRate().compareTo(BigDecimal.ZERO) < 0) throw badRequest("baseRate cannot be negative");
            partner.setBaseRate(r.baseRate());
        }
        if (r.servicePincodePrefixes() != null) partner.setServicePincodePrefixes(r.servicePincodePrefixes().trim());
        if (r.integrationType() != null && !r.integrationType().isBlank()) {
            String type = r.integrationType().trim().toUpperCase();
            if (!registry.isRegistered(type)) {
                throw badRequest("Unknown integrationType " + type + "; valid values: " + validKeys());
            }
            partner.setIntegrationType(type);
        }
        if (r.aggregator() != null) partner.setAggregator(r.aggregator());
        if (r.priority() != null) partner.setPriority(r.priority());
        if (r.codSupported() != null) partner.setCodSupported(r.codSupported());
    }

    private String validKeys() {
        return registry.all().stream().map(CarrierAdapter::key).map(String::toUpperCase)
            .sorted().collect(Collectors.joining(", "));
    }

    private DeliveryPartnerResponse toResponse(DeliveryPartner partner) {
        return DeliveryPartnerResponse.from(partner, registry);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
