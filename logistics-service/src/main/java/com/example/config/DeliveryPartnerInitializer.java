package com.example.config;

import com.example.carrier.CarrierAdapterRegistry;
import com.example.entity.DeliveryPartner;
import com.example.repository.DeliveryPartnerRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the couriers the marketplace can actually ship with.
 *
 * These are real Indian carriers with their real public tracking URLs, so a tracking
 * link opens the courier's own page. Rates and transit times are indicative defaults
 * that an admin is expected to replace with contracted figures — they are starting
 * values, not quoted prices.
 *
 * Idempotent: the base set is seeded only when the table is empty, and Shiprocket only
 * when its code is missing, so an operator's edits survive restarts. Existing rows are
 * never modified — a database from before M1 keeps DELHIVERY on MANUAL until an admin
 * switches it (docs/commerce-architecture.md §8.1).
 */
@Component
public class DeliveryPartnerInitializer {

    private static final Logger log = LoggerFactory.getLogger(DeliveryPartnerInitializer.class);
    private static final String MANUAL = CarrierAdapterRegistry.MANUAL;

    private final DeliveryPartnerRepository repository;

    public DeliveryPartnerInitializer(DeliveryPartnerRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void seed() {
        seedBaseSet();
        seedShiprocket();
    }

    private void seedBaseSet() {
        if (repository.count() > 0) return;

        repository.saveAll(List.of(
            // DELHIVERY's adapter falls back to manual booking until its credentials are set.
            partner("DELHIVERY", "Delhivery",
                "https://www.delhivery.com/track/package/{trackingNumber}",
                3, "55.00", "DELHIVERY"),
            partner("BLUEDART", "Blue Dart",
                "https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={trackingNumber}",
                2, "95.00", MANUAL),
            partner("DTDC", "DTDC",
                "https://www.dtdc.in/tracking/tracking_results.asp?strCnno={trackingNumber}",
                4, "60.00", MANUAL),
            partner("ECOMEXPRESS", "Ecom Express",
                "https://ecomexpress.in/tracking/?awb_field={trackingNumber}",
                4, "50.00", MANUAL),
            partner("XPRESSBEES", "XpressBees",
                "https://www.xpressbees.com/shipment/tracking?awb={trackingNumber}",
                4, "48.00", MANUAL),
            // India Post reaches pincodes the private carriers often will not.
            partner("INDIAPOST", "India Post",
                "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?tn={trackingNumber}",
                7, "35.00", MANUAL)
        ));
        log.info("Seeded {} delivery partners", repository.count());
    }

    /**
     * Shiprocket is an aggregator: it routes parcels to many couriers itself. It is seeded
     * INACTIVE with indicative transit and rate values — we hold no account with it, so it
     * must not be allocated until an admin has configured the integration and enabled it.
     */
    private void seedShiprocket() {
        if (repository.findByCode("SHIPROCKET").isPresent()) return;
        DeliveryPartner shiprocket = partner("SHIPROCKET", "Shiprocket",
            "https://shiprocket.co/tracking/{trackingNumber}", 4, "60.00", "SHIPROCKET");
        shiprocket.setAggregator(true);
        shiprocket.setActive(false);
        repository.save(shiprocket);
        log.info("Seeded Shiprocket as an inactive delivery partner");
    }

    private static DeliveryPartner partner(String code, String name, String template,
                                           int days, String rate, String integrationType) {
        DeliveryPartner p = new DeliveryPartner(code, name, template, days, new BigDecimal(rate), "");
        p.setIntegrationType(integrationType);
        return p;
    }
}
