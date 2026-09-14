package com.example.service;

import com.example.dropship.DropshipAdapterRegistry;
import com.example.dropship.ManualDropshipAdapter;
import com.example.dto.PartnerDtos.CreatePartnerRequest;
import com.example.dto.PartnerDtos.PartnerResponse;
import com.example.dto.PartnerDtos.UpdatePartnerRequest;
import com.example.repository.DropshipPartnerRepository;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static com.example.service.Fixtures.partner;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PartnerServiceTest {

    DropshipPartnerRepository repo;
    PartnerService service;

    @BeforeEach
    void setUp() {
        repo = mock(DropshipPartnerRepository.class);
        service = new PartnerService(repo, new DropshipAdapterRegistry(List.of(new ManualDropshipAdapter())));
        when(repo.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CreatePartnerRequest request(String code, String integrationType, String onboarding) {
        return new CreatePartnerRequest(code, "Acme Supply", null, null, null, integrationType, onboarding,
            null, null, null, null, null);
    }

    private static void expect(Runnable call, HttpStatus status) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(ResponseStatusException.class,
            e -> assertThat(e.getStatusCode()).isEqualTo(status));
    }

    @Test
    void createDefaultsToManualNotStartedInactive() {
        PartnerResponse r = service.create(request("ACME", null, null));
        assertThat(r.integrationType()).isEqualTo("MANUAL");
        assertThat(r.onboardingStatus()).isEqualTo("NOT_STARTED");
        assertThat(r.active()).isFalse();
        assertThat(r.integrationConfigured()).isTrue();
        assertThat(r.integrationLabel()).isNotBlank();
    }

    @Test
    void codeMustMatchPattern() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        assertThat(validator.validate(request("acme", null, null))).isNotEmpty();
        assertThat(validator.validate(request("A", null, null))).isNotEmpty();
        assertThat(validator.validate(request("ACME_2", null, null))).isEmpty();
    }

    @Test
    void duplicateCodeIs409() {
        when(repo.existsByCode("ACME")).thenReturn(true);
        expect(() -> service.create(request("ACME", null, null)), HttpStatus.CONFLICT);
    }

    @Test
    void unregisteredIntegrationTypeIs400() {
        expect(() -> service.create(request("ACME", "QIKINK_API", null)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void invalidOnboardingStatusIs400() {
        expect(() -> service.create(request("ACME", null, "SIGNED")), HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateIsAPatch() {
        when(repo.findByCode("QIKINK")).thenReturn(Optional.of(partner("QIKINK", "Qikink", false)));

        PartnerResponse r = service.update("QIKINK", new UpdatePartnerRequest(null, null, null,
            "https://example.com", null, "IN_DISCUSSION", null, null, null, null, true));

        assertThat(r.name()).isEqualTo("Qikink");
        assertThat(r.website()).isEqualTo("https://example.com");
        assertThat(r.onboardingStatus()).isEqualTo("IN_DISCUSSION");
        assertThat(r.active()).isTrue();
    }

    @Test
    void unknownPartnerIs404() {
        when(repo.findByCode("NOPE")).thenReturn(Optional.empty());
        expect(() -> service.get("NOPE"), HttpStatus.NOT_FOUND);
    }
}
