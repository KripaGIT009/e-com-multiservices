package com.example.controller;

import com.example.entity.DeliveryPartner;
import com.example.repository.DeliveryPartnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-partners")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DeliveryPartnerController {

    private final DeliveryPartnerRepository repository;

    public DeliveryPartnerController(DeliveryPartnerRepository repository) {
        this.repository = repository;
    }

    /** Active partners by default; ?all=true for the admin view. */
    @GetMapping
    public ResponseEntity<List<DeliveryPartner>> list(
            @RequestParam(defaultValue = "false") boolean all) {
        return ResponseEntity.ok(all ? repository.findAll()
                                     : repository.findByActiveTrueOrderByEstimatedDaysAsc());
    }

    /** Which partners can deliver to a pincode, cheapest transit first. */
    @GetMapping("/serviceable/{pincode}")
    public ResponseEntity<List<DeliveryPartner>> serviceable(@PathVariable String pincode) {
        return ResponseEntity.ok(repository.findByActiveTrueOrderByEstimatedDaysAsc()
            .stream().filter(p -> p.servesPincode(pincode)).toList());
    }

    @PostMapping
    public ResponseEntity<DeliveryPartner> create(@RequestBody DeliveryPartner partner) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(partner));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryPartner> update(@PathVariable Long id,
                                                   @RequestBody DeliveryPartner incoming) {
        return repository.findById(id).map(p -> {
            if (incoming.getName() != null) p.setName(incoming.getName());
            if (incoming.getTrackingUrlTemplate() != null) p.setTrackingUrlTemplate(incoming.getTrackingUrlTemplate());
            if (incoming.getEstimatedDays() != null) p.setEstimatedDays(incoming.getEstimatedDays());
            if (incoming.getBaseRate() != null) p.setBaseRate(incoming.getBaseRate());
            if (incoming.getServicePincodePrefixes() != null) p.setServicePincodePrefixes(incoming.getServicePincodePrefixes());
            p.setActive(incoming.isActive());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }
}
