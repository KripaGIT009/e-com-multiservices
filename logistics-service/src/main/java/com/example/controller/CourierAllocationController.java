package com.example.controller;

import com.example.dto.AllocationSettingsRequest;
import com.example.dto.AllocationSettingsResponse;
import com.example.dto.CourierRuleRequest;
import com.example.dto.CourierRuleResponse;
import com.example.dto.QuoteRequest;
import com.example.dto.QuoteResponse;
import com.example.service.AllocationSettingsService;
import com.example.service.CourierAllocationService;
import com.example.service.CourierRuleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Courier allocation, its rules and its per-model settings (§9.3). */
@RestController
@RequestMapping("/api")
public class CourierAllocationController {

    private final CourierAllocationService allocation;
    private final CourierRuleService rules;
    private final AllocationSettingsService settings;

    public CourierAllocationController(CourierAllocationService allocation, CourierRuleService rules,
                                       AllocationSettingsService settings) {
        this.allocation = allocation;
        this.rules = rules;
        this.settings = settings;
    }

    /** A decision, not a booking: nothing is written. */
    @PostMapping("/courier-allocation/quote")
    public QuoteResponse quote(@RequestBody(required = false) QuoteRequest request) {
        return allocation.quote(request);
    }

    @GetMapping("/courier-rules")
    public List<CourierRuleResponse> listRules() {
        return rules.list();
    }

    @PostMapping("/courier-rules")
    public ResponseEntity<CourierRuleResponse> createRule(@RequestBody(required = false) CourierRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rules.create(request));
    }

    @PutMapping("/courier-rules/{id}")
    public CourierRuleResponse updateRule(@PathVariable Long id,
                                          @RequestBody(required = false) CourierRuleRequest request) {
        return rules.update(id, request);
    }

    @DeleteMapping("/courier-rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        rules.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/allocation-settings")
    public List<AllocationSettingsResponse> listSettings() {
        return settings.list();
    }

    @PutMapping("/allocation-settings/{model}")
    public AllocationSettingsResponse updateSettings(@PathVariable String model,
                                                     @RequestBody(required = false) AllocationSettingsRequest request) {
        return settings.update(model, request);
    }
}
