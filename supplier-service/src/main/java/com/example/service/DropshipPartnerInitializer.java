package com.example.service;

import com.example.dropship.DropshipAdapterRegistry;
import com.example.entity.DropshipPartner;
import com.example.entity.OnboardingStatus;
import com.example.repository.DropshipPartnerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the dropship partner registry of docs/commerce-architecture.md §8.2.
 *
 * <p>A partner is inserted only when its code is missing; an existing row is never
 * modified, so an admin's edits survive restarts. Every partner is seeded inactive,
 * NOT_STARTED and MANUAL because we hold no contract or credentials with any of them —
 * activating one is an admin decision. "Integration potential" is the assessment
 * supplied with the requirement, not something verified here. Websites are left blank
 * for an admin to fill in rather than guessed.
 */
@Component
public class DropshipPartnerInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DropshipPartnerInitializer.class);

    record Seed(String code, String name, String bestFor, String integrationPotential) {
    }

    static final List<Seed> SEEDS = List.of(
        new Seed("QIKINK", "Qikink", "Print-on-demand, apparel, custom products", "Strong"),
        new Seed("EKOMN", "eKomn", "Indian wholesale + dropship sourcing", "Potentially useful"),
        new Seed("BHARAT_DROPSHIP", "Bharat Dropship", "Multi-supplier dropshipping", "API + webhooks advertised"),
        new Seed("DROPSETU", "DropSetu", "Connecting Indian suppliers with resellers",
            "Shopify/WooCommerce + supplier network"),
        new Seed("DROPBARTER", "Dropbarter", "Indian suppliers/artisans", "Marketplace-style dropshipping"),
        new Seed("ALI_SHIPPING", "Ali Shipping", "Indian dropshipping + shipping ecosystem", "Seller/supplier workflows")
    );

    private final DropshipPartnerRepository partners;

    public DropshipPartnerInitializer(DropshipPartnerRepository partners) {
        this.partners = partners;
    }

    @Override
    public void run(ApplicationArguments args) {
        int inserted = seed();
        if (inserted > 0) log.info("Seeded {} dropship partner(s), all inactive", inserted);
    }

    /**
     * Each insert commits on its own (repository default), so a partial seed is kept and
     * the next start fills in the rest.
     *
     * @return how many partners were inserted
     */
    public int seed() {
        int inserted = 0;
        for (Seed s : SEEDS) {
            if (partners.existsByCode(s.code())) continue;
            DropshipPartner p = new DropshipPartner();
            p.setCode(s.code());
            p.setName(s.name());
            p.setBestFor(s.bestFor());
            p.setIntegrationPotential(s.integrationPotential());
            p.setWebsite(null);
            p.setIntegrationType(DropshipAdapterRegistry.MANUAL);
            p.setOnboardingStatus(OnboardingStatus.NOT_STARTED);
            p.setShipsWithOwnLogistics(true);
            p.setActive(false);
            partners.save(p);
            inserted++;
        }
        return inserted;
    }
}
