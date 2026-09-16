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
 * supplied with the requirement; the notes record what a search for each partner's
 * public API actually found.
 */
@Component
public class DropshipPartnerInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DropshipPartnerInitializer.class);

    /**
     * @param notes what was actually found when looking for a public API (2026-09-14),
     *              so an operator knows why a partner is manual — see
     *              docs/commerce-architecture.md §8.2 for the sources
     */
    record Seed(String code, String name, String bestFor, String integrationPotential, String website,
                String notes) {
    }

    static final List<Seed> SEEDS = List.of(
        new Seed("QIKINK", "Qikink", "Print-on-demand, apparel, custom products", "Strong",
            "https://qikink.com",
            "Publishes a REST API (token exchange + order create; no status/tracking/webhook endpoint). "
                + "Adapter QIKINK exists; live API access is enabled per account from the Qikink dashboard."),
        new Seed("EKOMN", "eKomn", "Indian wholesale + dropship sourcing", "Potentially useful",
            "https://www.ekomn.com",
            "No public API. Integrates via Amazon/Shopify CSV templates and a WooCommerce plugin. Manual."),
        new Seed("BHARAT_DROPSHIP", "Bharat Dropship", "Multi-supplier dropshipping", "API + webhooks advertised",
            "https://www.bharatdropship.com",
            "Positions itself as a Shopify B2B2C marketplace; no public API or webhook documentation found. "
                + "Ask them for it before assuming one exists. Manual."),
        new Seed("DROPSETU", "DropSetu", "Connecting Indian suppliers with resellers",
            "Shopify/WooCommerce + supplier network", "https://dropsetu.com",
            "Waitlist-only at the time of writing; Shopify/WooCommerce plugin and dashboard ordering, no public API. Manual."),
        new Seed("DROPBARTER", "Dropbarter", "Indian suppliers/artisans", "Marketplace-style dropshipping",
            "https://dropbarter.com",
            "Marketplace-channel sync only; no public API or developer documentation found. Manual."),
        new Seed("ALI_SHIPPING", "Ali Shipping", "Indian dropshipping + shipping ecosystem", "Seller/supplier workflows",
            "https://alishipping.in",
            "A managed fulfilment service (Amazon SP-API on the seller's behalf); no partner API for resellers. Manual.")
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
            p.setWebsite(s.website());
            p.setNotes(s.notes());
            // Even Qikink starts MANUAL: switching to the API adapter is an admin decision
            // taken once credentials exist, and the console shows whether they do.
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
