package com.example.controller;

import com.example.dto.PartnerDtos.CreatePartnerRequest;
import com.example.dto.PartnerDtos.IntegrationResponse;
import com.example.dto.PartnerDtos.PartnerResponse;
import com.example.dto.PartnerDtos.UpdatePartnerRequest;
import com.example.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Dropship partner registry and adapter integrations. Internal: called by the BFF. */
@RestController
@RequestMapping("/api/dropship")
public class PartnerController {

    private final PartnerService partners;

    public PartnerController(PartnerService partners) {
        this.partners = partners;
    }

    @GetMapping("/partners")
    public List<PartnerResponse> list(@RequestParam(name = "activeOnly", required = false) Boolean activeOnly) {
        return partners.list(Boolean.TRUE.equals(activeOnly));
    }

    @GetMapping("/partners/{code}")
    public PartnerResponse get(@PathVariable("code") String code) {
        return partners.get(code);
    }

    @PostMapping("/partners")
    @ResponseStatus(HttpStatus.CREATED)
    public PartnerResponse create(@Valid @RequestBody CreatePartnerRequest request) {
        return partners.create(request);
    }

    @PutMapping("/partners/{code}")
    public PartnerResponse update(@PathVariable("code") String code,
                                  @Valid @RequestBody UpdatePartnerRequest request) {
        return partners.update(code, request);
    }

    @GetMapping("/integrations")
    public List<IntegrationResponse> integrations() {
        return partners.integrations();
    }
}
