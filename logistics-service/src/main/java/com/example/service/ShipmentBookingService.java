package com.example.service;

import com.example.carrier.BookingRequest;
import com.example.carrier.BookingResult;
import com.example.carrier.CarrierAdapter;
import com.example.carrier.CarrierAdapterRegistry;
import com.example.domain.ShipmentStatus;
import com.example.dto.BookShipmentRequest;
import com.example.dto.ShipmentBookingResponse;
import com.example.entity.DeliveryPartner;
import com.example.entity.Shipment;
import com.example.repository.DeliveryPartnerRepository;
import com.example.repository.ShipmentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Books one fulfilment group of an order with a courier (docs/commerce-architecture.md §7.1).
 *
 * Idempotent on (orderId, fulfilmentKey) — a double-clicked "Ship" or a retried request
 * returns the shipment already booked instead of lodging a second consignment (rule 7).
 *
 * | Partner's adapter                    | Result                                        |
 * | MANUAL, or API adapter not configured | booked manually, with a note naming the gap   |
 * | API adapter, configured, succeeds    | bookingMode API with the carrier's AWB        |
 * | API adapter, configured, fails       | CarrierException → 502; nothing is saved      |
 */
@Service
public class ShipmentBookingService {

    public static final String MODE_MANUAL = "MANUAL";
    public static final String MODE_API = "API";

    private final ShipmentRepository shipments;
    private final DeliveryPartnerRepository partners;
    private final CarrierAdapterRegistry registry;
    private final ShipmentEventPublisher events;
    private final int defaultWeightGrams;

    public ShipmentBookingService(ShipmentRepository shipments, DeliveryPartnerRepository partners,
                                  CarrierAdapterRegistry registry, ShipmentEventPublisher events,
                                  @Value("${DEFAULT_PARCEL_WEIGHT_GRAMS:500}") int defaultWeightGrams) {
        this.shipments = shipments;
        this.partners = partners;
        this.registry = registry;
        this.events = events;
        this.defaultWeightGrams = defaultWeightGrams;
    }

    @Transactional
    public ShipmentBookingResponse book(BookShipmentRequest request) {
        if (request == null) throw status(HttpStatus.BAD_REQUEST, "A request body is required");
        String orderId = required(request.orderId(), "orderId");
        String fulfilmentKey = required(request.fulfilmentKey(), "fulfilmentKey");
        String partnerCode = required(request.partnerCode(), "partnerCode").toUpperCase();
        if (fulfilmentKey.length() > 60) throw status(HttpStatus.BAD_REQUEST, "fulfilmentKey must be at most 60 characters");

        // Checked before the partner: a repeat must return the original booking even if
        // the courier has since been disabled or a different one is named.
        Optional<Shipment> existing = shipments.findByOrderIdAndFulfilmentKey(orderId, fulfilmentKey);
        if (existing.isPresent()) return ShipmentBookingResponse.from(existing.get(), true, null);

        DeliveryPartner partner = partners.findByCode(partnerCode)
            .orElseThrow(() -> status(HttpStatus.UNPROCESSABLE_ENTITY, "Unknown delivery partner " + partnerCode));
        if (!partner.isActive()) {
            throw status(HttpStatus.UNPROCESSABLE_ENTITY, partner.getName() + " is not active");
        }
        if (request.weightGrams() != null && request.weightGrams() <= 0) {
            throw status(HttpStatus.BAD_REQUEST, "weightGrams must be positive");
        }
        int weight = request.weightGrams() != null ? request.weightGrams() : defaultWeightGrams;

        CarrierAdapter adapter = registry.forType(partner.effectiveIntegrationType());
        CarrierAdapter manual = registry.forType(CarrierAdapterRegistry.MANUAL);
        String mode;
        String configurationNote = null;
        boolean isManualAdapter = CarrierAdapterRegistry.MANUAL.equalsIgnoreCase(adapter.key());
        if (!isManualAdapter && adapter.isConfigured()) {
            mode = MODE_API;
        } else {
            if (!isManualAdapter) {
                configurationNote = partner.getName() + " integration not configured ("
                    + String.join(", ", adapter.requiredEnvironment()) + ") — booked manually.";
            } else if (!CarrierAdapterRegistry.MANUAL.equalsIgnoreCase(partner.effectiveIntegrationType())) {
                // The row names an adapter this build does not contain; forType fell back to MANUAL.
                configurationNote = "Integration " + partner.effectiveIntegrationType()
                    + " is not available in this build — booked manually.";
            }
            adapter = manual;
            mode = MODE_MANUAL;
        }

        BookingRequest bookingRequest = new BookingRequest(orderId, fulfilmentKey, partner.getCode(),
            request.customerName(), request.customerPhone(), request.deliveryAddress(),
            request.deliveryPincode(), request.pickupPincode(), weight,
            Boolean.TRUE.equals(request.cod()), request.declaredValue(), trimToNull(request.trackingNumber()));
        // A CarrierException propagates as a 502 before anything is written: an API carrier
        // that failed never gets a locally invented tracking number in its place.
        BookingResult result = adapter.book(bookingRequest);

        Shipment shipment = new Shipment(
            "SHP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
            orderId,
            isBlank(request.customerId()) ? "UNKNOWN" : request.customerId().trim(),
            ShipmentStatus.LABEL_GENERATED,
            partner.getName(),
            result.trackingNumber(),
            LocalDateTime.now().plusDays(partner.getEstimatedDays() == null ? 0 : partner.getEstimatedDays()));
        shipment.setDeliveryAddress(truncate(request.deliveryAddress()));
        shipment.setCarrierTrackingUrl(truncate(partner.buildTrackingUrl(result.trackingNumber())));
        shipment.setFulfilmentKey(fulfilmentKey);
        shipment.setPartnerCode(partner.getCode());
        shipment.setBookingMode(mode);
        shipment.setLabelUrl(truncate(result.labelUrl()));
        shipment.setTrackingGenerated(result.generated());
        shipment.setBookingNote(truncate(joinNotes(configurationNote, result.note())));
        shipment.setLastStatusNote("Your package has been booked with " + partner.getName() + ".");

        Shipment saved = shipments.save(shipment);
        events.recordEvent(saved.getId(), "ShipmentBooked",
            truncate("Booked with " + partner.getName() + " (" + mode + ") for " + fulfilmentKey
                + (saved.getBookingNote() == null ? "" : ". " + saved.getBookingNote())));
        events.publish(saved, "ShipmentBooked");
        return ShipmentBookingResponse.from(saved, false, weight);
    }

    private static String required(String value, String field) {
        if (isBlank(value)) throw status(HttpStatus.BAD_REQUEST, field + " is required");
        return value.trim();
    }

    private static String joinNotes(String first, String second) {
        if (isBlank(first)) return isBlank(second) ? null : second;
        return isBlank(second) ? first : first + " " + second;
    }

    private static String truncate(String value) {
        return value == null || value.length() <= 512 ? value : value.substring(0, 512);
    }

    private static String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static ResponseStatusException status(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
}
