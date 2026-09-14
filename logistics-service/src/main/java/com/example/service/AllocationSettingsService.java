package com.example.service;

import com.example.domain.AllocationStrategy;
import com.example.domain.FulfilmentModel;
import com.example.dto.AllocationSettingsRequest;
import com.example.dto.AllocationSettingsResponse;
import com.example.entity.AllocationSettings;
import com.example.repository.AllocationSettingsRepository;
import com.example.repository.DeliveryPartnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

@Service
public class AllocationSettingsService {

    private final AllocationSettingsRepository settings;
    private final DeliveryPartnerRepository partners;

    public AllocationSettingsService(AllocationSettingsRepository settings, DeliveryPartnerRepository partners) {
        this.settings = settings;
        this.partners = partners;
    }

    /**
     * One row per model, in model order. A row missing (the initializer failed, or a model
     * was added) is reported with the built-in defaults rather than left out.
     */
    @Transactional(readOnly = true)
    public List<AllocationSettingsResponse> list() {
        return Arrays.stream(FulfilmentModel.values())
            .map(m -> settings.findById(m.name()).orElseGet(() -> AllocationSettings.defaultsFor(m.name())))
            .map(AllocationSettingsResponse::from)
            .toList();
    }

    /** Seeds the FASTEST / no default / manual-allowed row for any model that has none. Never overwrites. */
    @Transactional
    public int seedMissing() {
        int created = 0;
        for (FulfilmentModel m : FulfilmentModel.values()) {
            if (!settings.existsById(m.name())) {
                settings.save(AllocationSettings.defaultsFor(m.name()));
                created++;
            }
        }
        return created;
    }

    @Transactional
    public AllocationSettingsResponse update(String modelParam, AllocationSettingsRequest request) {
        FulfilmentModel model = FulfilmentModel.parse(modelParam)
            .orElseThrow(() -> badRequest("Unknown fulfilment model " + modelParam));
        if (request == null) throw badRequest("A request body is required");

        AllocationSettings row = settings.findById(model.name())
            .orElseGet(() -> AllocationSettings.defaultsFor(model.name()));

        if (request.defaultPartnerCode() == null || request.defaultPartnerCode().isBlank()) {
            row.setDefaultPartnerCode(null);
        } else {
            String code = request.defaultPartnerCode().trim().toUpperCase();
            String stored = partners.findByCode(code)
                .orElseThrow(() -> badRequest("Unknown delivery partner " + code))
                .getCode();
            row.setDefaultPartnerCode(stored);
        }
        if (request.fallbackStrategy() != null) {
            AllocationStrategy strategy = AllocationStrategy.parse(request.fallbackStrategy())
                .orElseThrow(() -> badRequest("Unknown fallbackStrategy " + request.fallbackStrategy()
                    + "; valid values: FASTEST, CHEAPEST, PRIORITY"));
            row.setFallbackStrategy(strategy.name());
        }
        if (request.allowManualOverride() != null) row.setAllowManualOverride(request.allowManualOverride());

        return AllocationSettingsResponse.from(settings.save(row));
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
