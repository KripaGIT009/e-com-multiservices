package com.example.controller;

import com.example.dto.DeliveryPartnerRequest;
import com.example.dto.DeliveryPartnerResponse;
import com.example.service.DeliveryPartnerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-partners")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DeliveryPartnerController {

    private final DeliveryPartnerService service;

    public DeliveryPartnerController(DeliveryPartnerService service) {
        this.service = service;
    }

    /** Active partners by default; ?all=true for the admin view. */
    @GetMapping
    public ResponseEntity<List<DeliveryPartnerResponse>> list(
            @RequestParam(defaultValue = "false") boolean all) {
        return ResponseEntity.ok(service.list(all));
    }

    /** Which partners can deliver to a pincode, cheapest transit first. */
    @GetMapping("/serviceable/{pincode}")
    public ResponseEntity<List<DeliveryPartnerResponse>> serviceable(@PathVariable String pincode) {
        return ResponseEntity.ok(service.serviceable(pincode));
    }

    @PostMapping
    public ResponseEntity<DeliveryPartnerResponse> create(@RequestBody(required = false) DeliveryPartnerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryPartnerResponse> update(@PathVariable Long id,
                                                          @RequestBody(required = false) DeliveryPartnerRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }
}
