package com.example.service;

import com.example.entity.DropshipPartner;
import com.example.entity.OnboardingStatus;
import com.example.repository.DropshipPartnerRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DropshipPartnerInitializerTest {

    @Test
    void seedsTheSixPartnersInactiveManualAndNotStarted() {
        DropshipPartnerRepository repo = mock(DropshipPartnerRepository.class);
        when(repo.existsByCode(anyString())).thenReturn(false);

        int inserted = new DropshipPartnerInitializer(repo).seed();

        assertThat(inserted).isEqualTo(6);
        ArgumentCaptor<DropshipPartner> saved = ArgumentCaptor.forClass(DropshipPartner.class);
        verify(repo, times(6)).save(saved.capture());
        List<DropshipPartner> rows = saved.getAllValues();
        assertThat(rows).extracting(DropshipPartner::getCode)
            .containsExactly("QIKINK", "EKOMN", "BHARAT_DROPSHIP", "DROPSETU", "DROPBARTER", "ALI_SHIPPING");
        assertThat(rows).extracting(DropshipPartner::getName)
            .containsExactly("Qikink", "eKomn", "Bharat Dropship", "DropSetu", "Dropbarter", "Ali Shipping");
        assertThat(rows).allSatisfy(p -> {
            assertThat(p.getActive()).isFalse();
            assertThat(p.getIntegrationType()).isEqualTo("MANUAL");
            assertThat(p.getOnboardingStatus()).isEqualTo(OnboardingStatus.NOT_STARTED);
            assertThat(p.getShipsWithOwnLogistics()).isTrue();
            assertThat(p.getWebsite()).isNull();
            assertThat(p.getBestFor()).isNotBlank();
            assertThat(p.getIntegrationPotential()).isNotBlank();
        });
        assertThat(rows.get(0).getIntegrationPotential()).isEqualTo("Strong");
        assertThat(rows.get(2).getIntegrationPotential()).isEqualTo("API + webhooks advertised");
    }

    @Test
    void isIdempotentAndNeverTouchesExistingRows() {
        DropshipPartnerRepository repo = mock(DropshipPartnerRepository.class);
        Set<String> present = new HashSet<>();
        when(repo.existsByCode(anyString())).thenAnswer(inv -> present.contains(inv.<String>getArgument(0)));
        when(repo.save(any())).thenAnswer(inv -> {
            present.add(inv.<DropshipPartner>getArgument(0).getCode());
            return inv.getArgument(0);
        });
        DropshipPartnerInitializer initializer = new DropshipPartnerInitializer(repo);

        assertThat(initializer.seed()).isEqualTo(6);
        assertThat(initializer.seed()).isZero();
        verify(repo, times(6)).save(any());
        verify(repo, never()).findByCode(anyString());
    }

    @Test
    void fillsInOnlyMissingPartners() {
        DropshipPartnerRepository repo = mock(DropshipPartnerRepository.class);
        when(repo.existsByCode(anyString())).thenReturn(true);
        when(repo.existsByCode("DROPSETU")).thenReturn(false);

        assertThat(new DropshipPartnerInitializer(repo).seed()).isEqualTo(1);
        verify(repo).save(argThat(p -> "DROPSETU".equals(p.getCode())));
    }
}
