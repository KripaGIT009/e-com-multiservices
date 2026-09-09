package com.example.service;

import com.example.dto.SellerDtos.*;
import com.example.entity.Seller;
import com.example.entity.SellerStatus;
import com.example.repository.SellerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private final SellerRepository repository;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public SellerService(SellerRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public SellerResponse register(RegisterRequest req) {
        String email = req.email.trim().toLowerCase();
        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An account already exists for that email.");
        }
        if (req.gstin != null && !req.gstin.isBlank() && repository.existsByGstin(req.gstin)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "That GSTIN is already registered.");
        }

        Seller s = new Seller();
        s.setBusinessName(req.businessName.trim());
        s.setContactName(req.contactName.trim());
        s.setEmail(email);
        s.setPassword(encoder.encode(req.password));
        s.setPhone(req.phone);
        s.setGstin(req.gstin != null && !req.gstin.isBlank() ? req.gstin.trim().toUpperCase() : null);
        s.setPickupAddress(req.pickupAddress);
        s.setPickupCity(req.pickupCity);
        s.setPickupPostalCode(req.pickupPostalCode);
        // New sellers always start unapproved — an admin must let them sell.
        s.setStatus(SellerStatus.PENDING_APPROVAL);
        return SellerResponse.from(repository.save(s));
    }

    /**
     * Verifies credentials. Deliberately does not reject a PENDING seller: they may
     * sign in to prepare their catalogue, and publishing is gated separately, so the
     * caller gets the status and decides.
     */
    @Transactional(readOnly = true)
    public SellerResponse authenticate(LoginRequest req) {
        Seller s = repository.findByEmail(req.email.trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(req.password, s.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (s.getStatus() == SellerStatus.REJECTED || s.getStatus() == SellerStatus.SUSPENDED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                s.getStatusReason() != null ? s.getStatusReason()
                                            : "This seller account is not active.");
        }
        return SellerResponse.from(s);
    }

    @Transactional(readOnly = true)
    public SellerResponse get(Long id) {
        return SellerResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public List<SellerResponse> list(SellerStatus status) {
        List<Seller> sellers = status == null
            ? repository.findAllByOrderByCreatedAtDesc()
            : repository.findByStatusOrderByCreatedAtDesc(status);
        return sellers.stream().map(SellerResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public SellerResponse updateStatus(Long id, StatusRequest req) {
        Seller s = find(id);
        s.setStatus(req.status);
        s.setStatusReason(req.reason);
        return SellerResponse.from(repository.save(s));
    }

    @Transactional
    public SellerResponse updateProfile(Long id, RegisterRequest req) {
        Seller s = find(id);
        if (req.businessName != null) s.setBusinessName(req.businessName.trim());
        if (req.contactName != null) s.setContactName(req.contactName.trim());
        if (req.phone != null) s.setPhone(req.phone);
        if (req.pickupAddress != null) s.setPickupAddress(req.pickupAddress);
        if (req.pickupCity != null) s.setPickupCity(req.pickupCity);
        if (req.pickupPostalCode != null) s.setPickupPostalCode(req.pickupPostalCode);
        return SellerResponse.from(repository.save(s));
    }

    private Seller find(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found"));
    }
}
