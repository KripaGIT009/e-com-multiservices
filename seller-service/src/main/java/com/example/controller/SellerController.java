package com.example.controller;

import com.example.dto.SellerDtos.*;
import com.example.entity.SellerStatus;
import com.example.service.SellerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Internal API. The BFF owns the browser-facing session and never exposes this
 * service directly.
 */
@RestController
@RequestMapping("/api/sellers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SellerController {

    private final SellerService service;

    public SellerController(SellerService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<SellerResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<SellerResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(service.authenticate(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SellerResponse> updateProfile(@PathVariable Long id,
                                                        @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(service.updateProfile(id, req));
    }

    /** Admin: list all, or filter by status to find the approval queue. */
    @GetMapping
    public ResponseEntity<List<SellerResponse>> list(
            @RequestParam(required = false) SellerStatus status) {
        return ResponseEntity.ok(service.list(status));
    }

    /** Admin: approve, reject or suspend. */
    @PutMapping("/{id}/status")
    public ResponseEntity<SellerResponse> updateStatus(@PathVariable Long id,
                                                       @Valid @RequestBody StatusRequest req) {
        return ResponseEntity.ok(service.updateStatus(id, req));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "seller-service"));
    }
}
