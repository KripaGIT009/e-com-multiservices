package com.example.config;

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
 * Idempotent: seeds only when the table is empty, so an operator's edits survive
 * restarts.
 */
@Component
public class DeliveryPartnerInitializer {

    private static final Logger log = LoggerFactory.getLogger(DeliveryPartnerInitializer.class);
    private final DeliveryPartnerRepository repository;

    public DeliveryPartnerInitializer(DeliveryPartnerRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void seed() {
        if (repository.count() > 0) return;

        repository.saveAll(List.of(
            new DeliveryPartner("DELHIVERY", "Delhivery",
                "https://www.delhivery.com/track/package/{trackingNumber}",
                3, new BigDecimal("55.00"), ""),
            new DeliveryPartner("BLUEDART", "Blue Dart",
                "https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={trackingNumber}",
                2, new BigDecimal("95.00"), ""),
            new DeliveryPartner("DTDC", "DTDC",
                "https://www.dtdc.in/tracking/tracking_results.asp?strCnno={trackingNumber}",
                4, new BigDecimal("60.00"), ""),
            new DeliveryPartner("ECOMEXPRESS", "Ecom Express",
                "https://ecomexpress.in/tracking/?awb_field={trackingNumber}",
                4, new BigDecimal("50.00"), ""),
            new DeliveryPartner("XPRESSBEES", "XpressBees",
                "https://www.xpressbees.com/shipment/tracking?awb={trackingNumber}",
                4, new BigDecimal("48.00"), ""),
            // India Post reaches pincodes the private carriers often will not.
            new DeliveryPartner("INDIAPOST", "India Post",
                "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?tn={trackingNumber}",
                7, new BigDecimal("35.00"), "")
        ));
        log.info("Seeded {} delivery partners", repository.count());
    }
}
