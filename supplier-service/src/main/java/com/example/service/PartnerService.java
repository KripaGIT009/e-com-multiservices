package com.example.service;

import com.example.dropship.DropshipAdapter;
import com.example.dropship.DropshipAdapterRegistry;
import com.example.dto.DtoMapper;
import com.example.dto.PartnerDtos.CreatePartnerRequest;
import com.example.dto.PartnerDtos.IntegrationResponse;
import com.example.dto.PartnerDtos.PartnerResponse;
import com.example.dto.PartnerDtos.UpdatePartnerRequest;
import com.example.entity.DropshipPartner;
import com.example.entity.OnboardingStatus;
import com.example.repository.DropshipPartnerRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PartnerService {

    private final DropshipPartnerRepository partners;
    private final DropshipAdapterRegistry adapters;

    public PartnerService(DropshipPartnerRepository partners, DropshipAdapterRegistry adapters) {
        this.partners = partners;
        this.adapters = adapters;
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> list(boolean activeOnly) {
        List<DropshipPartner> rows = activeOnly ? partners.findByActiveTrueOrderByNameAsc()
            : partners.findAllByOrderByNameAsc();
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PartnerResponse get(String code) {
        return toResponse(find(code));
    }

    @Transactional
    public PartnerResponse create(CreatePartnerRequest request) {
        if (partners.existsByCode(request.code())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dropship partner " + request.code() + " already exists");
        }
        DropshipPartner p = new DropshipPartner();
        p.setCode(request.code());
        p.setName(request.name().trim());
        p.setBestFor(blankToNull(request.bestFor()));
        p.setIntegrationPotential(blankToNull(request.integrationPotential()));
        p.setWebsite(blankToNull(request.website()));
        p.setIntegrationType(request.integrationType() == null ? DropshipAdapterRegistry.MANUAL
            : integrationType(request.integrationType()));
        p.setOnboardingStatus(request.onboardingStatus() == null ? OnboardingStatus.NOT_STARTED
            : onboardingStatus(request.onboardingStatus()));
        p.setShipsWithOwnLogistics(request.shipsWithOwnLogistics() == null || request.shipsWithOwnLogistics());
        p.setWarehousePincode(blankToNull(request.warehousePincode()));
        p.setContactEmail(blankToNull(request.contactEmail()));
        p.setNotes(blankToNull(request.notes()));
        // A new partner is inactive unless the admin says otherwise (§7.3 step 3).
        p.setActive(Boolean.TRUE.equals(request.active()));
        try {
            return toResponse(partners.saveAndFlush(p));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dropship partner " + request.code() + " already exists");
        }
    }

    /** Patch: a null field is left as it is; an empty string clears an optional text field. */
    @Transactional
    public PartnerResponse update(String code, UpdatePartnerRequest r) {
        DropshipPartner p = find(code);
        if (r.name() != null) {
            if (r.name().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name cannot be blank");
            p.setName(r.name().trim());
        }
        if (r.bestFor() != null) p.setBestFor(blankToNull(r.bestFor()));
        if (r.integrationPotential() != null) p.setIntegrationPotential(blankToNull(r.integrationPotential()));
        if (r.website() != null) p.setWebsite(blankToNull(r.website()));
        if (r.integrationType() != null) p.setIntegrationType(integrationType(r.integrationType()));
        if (r.onboardingStatus() != null) p.setOnboardingStatus(onboardingStatus(r.onboardingStatus()));
        if (r.shipsWithOwnLogistics() != null) p.setShipsWithOwnLogistics(r.shipsWithOwnLogistics());
        if (r.warehousePincode() != null) p.setWarehousePincode(blankToNull(r.warehousePincode()));
        if (r.contactEmail() != null) p.setContactEmail(blankToNull(r.contactEmail()));
        if (r.notes() != null) p.setNotes(blankToNull(r.notes()));
        if (r.active() != null) p.setActive(r.active());
        return toResponse(partners.save(p));
    }

    public List<IntegrationResponse> integrations() {
        return adapters.all().stream()
            .map(a -> new IntegrationResponse(a.key(), a.label(), a.isConfigured(),
                a.capabilities().stream().map(Enum::name).sorted().toList(),
                List.copyOf(a.requiredEnvironment())))
            .toList();
    }

    private DropshipPartner find(String code) {
        return partners.findByCode(code).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Dropship partner " + code + " not found"));
    }

    private String integrationType(String value) {
        if (!adapters.isRegistered(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown integration type: " + value);
        }
        return value.trim().toUpperCase();
    }

    private static OnboardingStatus onboardingStatus(String value) {
        OnboardingStatus status = OnboardingStatus.parse(value);
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown onboarding status: " + value);
        }
        return status;
    }

    private PartnerResponse toResponse(DropshipPartner p) {
        DropshipAdapter adapter = adapters.forType(p.getIntegrationType());
        return DtoMapper.toResponse(p, adapter);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
