package com.example.carrier;

import com.example.carrier.http.CarrierHttp;
import com.example.carrier.http.CarrierJson;
import com.example.carrier.http.CarrierOrderReference;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Delhivery B2C express, direct integration.
 *
 * <p><b>Request and response shapes follow Delhivery's published API documentation and
 * have NOT been exercised against a live Delhivery account in this repository.</b> They
 * are covered by {@code MockRestServiceServer} tests only; run against the staging
 * account and record the result in CODE_REVIEW.md before relying on them
 * (docs/commerce-architecture.md §7.3).
 *
 * <p>Environment: {@code DELHIVERY_API_TOKEN} (required), {@code DELHIVERY_BASE_URL}
 * (defaults to staging), {@code DELHIVERY_PICKUP_LOCATION} (the warehouse name registered
 * with Delhivery; required to book).
 */
@Component
public class DelhiveryCarrierAdapter implements CarrierAdapter {

    public static final String KEY = "DELHIVERY";
    private static final String LABEL = "Delhivery";
    private static final String DEFAULT_BASE_URL = "https://staging-express.delhivery.com";

    private final RestClient http;
    private final String token;
    private final String pickupLocation;

    /** Spring's constructor: applies the 10-second timeouts to the injected builder. */
    @Autowired
    public DelhiveryCarrierAdapter(RestClient.Builder builder,
                                   @Value("${DELHIVERY_API_TOKEN:}") String token,
                                   @Value("${DELHIVERY_BASE_URL:" + DEFAULT_BASE_URL + "}") String baseUrl,
                                   @Value("${DELHIVERY_PICKUP_LOCATION:}") String pickupLocation) {
        this(token, baseUrl, pickupLocation, CarrierHttp.withTimeouts(builder));
    }

    /**
     * Uses the builder exactly as given, so a test can bind {@code MockRestServiceServer}
     * to it first. (Setting the timeout request factory here would replace the mock.)
     */
    DelhiveryCarrierAdapter(String token, String baseUrl, String pickupLocation, RestClient.Builder builder) {
        this.token = token == null ? "" : token.trim();
        this.pickupLocation = pickupLocation == null ? "" : pickupLocation.trim();
        String base = baseUrl == null || baseUrl.isBlank() ? DEFAULT_BASE_URL : baseUrl.trim();
        this.http = builder
            .baseUrl(base.endsWith("/") ? base.substring(0, base.length() - 1) : base)
            .defaultHeader("Authorization", "Token " + this.token)
            .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public String key() {
        return KEY;
    }

    @Override
    public String label() {
        return LABEL;
    }

    @Override
    public boolean isConfigured() {
        return !token.isBlank();
    }

    @Override
    public Set<CarrierCapability> capabilities() {
        return Set.of(CarrierCapability.LIVE_SERVICEABILITY, CarrierCapability.BOOKING,
            CarrierCapability.TRACKING, CarrierCapability.CANCELLATION);
    }

    @Override
    public List<String> requiredEnvironment() {
        return List.of("DELHIVERY_API_TOKEN", "DELHIVERY_BASE_URL", "DELHIVERY_PICKUP_LOCATION");
    }

    /** Delhivery answers "do you serve this pincode" only — no rate and no transit time. */
    @Override
    public Optional<List<LiveQuote>> liveServiceability(String pickupPincode, String deliveryPincode,
                                                        int weightGrams, boolean cod) {
        requireConfigured();
        JsonNode body = CarrierHttp.call(LABEL, () -> http.get()
            .uri("/c/api/pin-codes/json/?filter_codes={pin}", deliveryPincode)
            .retrieve()
            .body(JsonNode.class));
        JsonNode codes = CarrierJson.at(body, "delivery_codes");
        boolean serviceable = codes != null && codes.isArray() && !codes.isEmpty();
        return Optional.of(serviceable ? List.of(new LiveQuote(LABEL, null, null)) : List.of());
    }

    @Override
    public BookingResult book(BookingRequest request) {
        requireConfigured();
        if (pickupLocation.isBlank()) {
            throw new CarrierException("Delhivery is not configured to book: DELHIVERY_PICKUP_LOCATION "
                + "must name the pickup warehouse registered with Delhivery");
        }
        String form = "format=json&data="
            + URLEncoder.encode(CarrierJson.toJson(manifest(request)), StandardCharsets.UTF_8);

        JsonNode body = CarrierHttp.call(LABEL, () -> http.post()
            .uri("/api/cmu/create.json")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(JsonNode.class));

        JsonNode pkg = CarrierJson.first(body, "packages");
        String waybill = CarrierJson.text(pkg, "waybill");
        boolean success = body != null && body.path("success").asBoolean(false);
        if (!success || waybill == null) {
            String reason = CarrierJson.join(CarrierJson.at(pkg, "remarks"));
            if (reason == null) reason = CarrierJson.join(CarrierJson.at(body, "rmk"));
            throw new CarrierException("Delhivery rejected the booking: "
                + (reason == null ? "no reason was given" : CarrierJson.truncate(reason)));
        }
        return new BookingResult(waybill, false, null, CarrierJson.text(pkg, "refnum"), "Booked with Delhivery");
    }

    @Override
    public Optional<TrackingSnapshot> track(String awb) {
        requireConfigured();
        JsonNode body = CarrierHttp.call(LABEL, () -> http.get()
            .uri("/api/v1/packages/json/?waybill={awb}", awb)
            .retrieve()
            .body(JsonNode.class));
        JsonNode status = CarrierJson.at(CarrierJson.first(body, "ShipmentData"), "Shipment", "Status");
        if (status == null) {
            String error = CarrierJson.text(body, "Error");
            if (error != null) {
                throw new CarrierException("Delhivery could not track " + awb + ": " + CarrierJson.truncate(error));
            }
            return Optional.empty();
        }
        return Optional.of(new TrackingSnapshot(awb,
            CarrierJson.text(status, "Status"),
            CarrierJson.text(status, "StatusLocation"),
            CarrierJson.parseDateTime(CarrierJson.text(status, "StatusDateTime"))));
    }

    @Override
    public void cancel(String awb) {
        requireConfigured();
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("waybill", awb);
        payload.put("cancellation", "true");
        JsonNode body = CarrierHttp.call(LABEL, () -> http.post()
            .uri("/api/p/edit")
            .contentType(MediaType.APPLICATION_JSON)
            .body(payload)
            .retrieve()
            .body(JsonNode.class));
        if (body == null || !body.path("status").asBoolean(false)) {
            throw new CarrierException("Delhivery did not cancel " + awb + ": "
                + CarrierJson.errorText(body == null ? null : body.toString()));
        }
    }

    private Map<String, Object> manifest(BookingRequest request) {
        BigDecimal value = request.declaredValue() == null ? BigDecimal.ZERO : request.declaredValue();
        Map<String, Object> shipment = new LinkedHashMap<>();
        shipment.put("name", nullToEmpty(request.customerName()));
        shipment.put("add", nullToEmpty(request.deliveryAddress()));
        shipment.put("pin", nullToEmpty(request.deliveryPincode()));
        shipment.put("phone", nullToEmpty(request.customerPhone()));
        shipment.put("order", CarrierOrderReference.of(request.orderId(), request.fulfilmentKey()));
        shipment.put("payment_mode", request.cod() ? "COD" : "Prepaid");
        shipment.put("total_amount", value);
        shipment.put("cod_amount", request.cod() ? value : BigDecimal.ZERO);
        shipment.put("weight", request.weightGrams());

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("shipments", List.of(shipment));
        manifest.put("pickup_location", Map.of("name", pickupLocation));
        return manifest;
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new CarrierException("Delhivery is not configured: DELHIVERY_API_TOKEN is not set");
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
