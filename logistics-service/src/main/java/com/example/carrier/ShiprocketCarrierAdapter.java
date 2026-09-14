package com.example.carrier;

import com.example.carrier.http.CarrierHttp;
import com.example.carrier.http.CarrierJson;
import com.example.carrier.http.ExpiringTokenCache;
import com.example.carrier.http.ShiprocketPayloads;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

/**
 * Shiprocket, a courier aggregator: one account books across many couriers, and
 * Shiprocket picks (or we assign) the courier per shipment.
 *
 * <p><b>Request and response shapes follow Shiprocket's published API documentation and
 * have NOT been exercised against a live Shiprocket account in this repository.</b> They
 * are covered by {@code MockRestServiceServer} tests only; run against a real account and
 * record the result in CODE_REVIEW.md before relying on them
 * (docs/commerce-architecture.md §7.3).
 *
 * <p>Environment: {@code SHIPROCKET_EMAIL} and {@code SHIPROCKET_PASSWORD} (an API user,
 * both required), {@code SHIPROCKET_BASE_URL}, {@code SHIPROCKET_PICKUP_LOCATION} (the
 * pickup address nickname in the Shiprocket panel).
 *
 * <p>Authentication: the login token is cached for 9 days (Shiprocket issues 10-day
 * tokens). Any call answered 401 drops the cached token, logs in again and is retried once.
 */
@Component
public class ShiprocketCarrierAdapter implements CarrierAdapter {

    public static final String KEY = "SHIPROCKET";
    private static final String LABEL = "Shiprocket";
    private static final String DEFAULT_BASE_URL = "https://apiv2.shiprocket.in/v1/external";
    private static final Duration TOKEN_LIFETIME = Duration.ofDays(9);
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private final RestClient http;
    private final String email;
    private final String password;
    private final String pickupLocation;
    private final ExpiringTokenCache tokens = new ExpiringTokenCache(TOKEN_LIFETIME);

    /** Spring's constructor: applies the 10-second timeouts to the injected builder. */
    @Autowired
    public ShiprocketCarrierAdapter(RestClient.Builder builder,
                                    @Value("${SHIPROCKET_EMAIL:}") String email,
                                    @Value("${SHIPROCKET_PASSWORD:}") String password,
                                    @Value("${SHIPROCKET_BASE_URL:" + DEFAULT_BASE_URL + "}") String baseUrl,
                                    @Value("${SHIPROCKET_PICKUP_LOCATION:Primary}") String pickupLocation) {
        this(email, password, baseUrl, pickupLocation, CarrierHttp.withTimeouts(builder));
    }

    /**
     * Uses the builder exactly as given, so a test can bind {@code MockRestServiceServer}
     * to it first. (Setting the timeout request factory here would replace the mock.)
     */
    ShiprocketCarrierAdapter(String email, String password, String baseUrl, String pickupLocation,
                             RestClient.Builder builder) {
        this.email = email == null ? "" : email.trim();
        this.password = password == null ? "" : password;
        this.pickupLocation = pickupLocation == null || pickupLocation.isBlank() ? "Primary" : pickupLocation.trim();
        String base = baseUrl == null || baseUrl.isBlank() ? DEFAULT_BASE_URL : baseUrl.trim();
        this.http = builder
            .baseUrl(base.endsWith("/") ? base.substring(0, base.length() - 1) : base)
            .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public String key() {
        return KEY;
    }

    @Override
    public String label() {
        return "Shiprocket (aggregator)";
    }

    @Override
    public boolean isConfigured() {
        return !email.isBlank() && !password.isBlank();
    }

    @Override
    public Set<CarrierCapability> capabilities() {
        return Set.of(CarrierCapability.LIVE_SERVICEABILITY, CarrierCapability.BOOKING,
            CarrierCapability.TRACKING, CarrierCapability.CANCELLATION);
    }

    @Override
    public List<String> requiredEnvironment() {
        return List.of("SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_BASE_URL", "SHIPROCKET_PICKUP_LOCATION");
    }

    @Override
    public Optional<List<LiveQuote>> liveServiceability(String pickupPincode, String deliveryPincode,
                                                        int weightGrams, boolean cod) {
        requireConfigured();
        if (pickupPincode == null || pickupPincode.isBlank()) {
            throw new CarrierException("Shiprocket needs a pickup pincode");
        }
        JsonNode body = authorized(token -> http.get()
            .uri("/courier/serviceability/?pickup_postcode={p}&delivery_postcode={d}&weight={w}&cod={c}",
                pickupPincode.trim(), deliveryPincode, ShiprocketPayloads.kilograms(weightGrams), cod ? 1 : 0)
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(JsonNode.class));

        List<LiveQuote> quotes = new ArrayList<>();
        JsonNode couriers = CarrierJson.at(body, "data", "available_courier_companies");
        if (couriers != null && couriers.isArray()) {
            for (JsonNode courier : couriers) {
                quotes.add(new LiveQuote(CarrierJson.text(courier, "courier_name"),
                    decimal(CarrierJson.text(courier, "rate")),
                    integer(CarrierJson.text(courier, "estimated_delivery_days"))));
            }
        }
        return Optional.of(quotes);
    }

    @Override
    public BookingResult book(BookingRequest request) {
        requireConfigured();
        JsonNode order = authorized(token -> http.post()
            .uri("/orders/create/adhoc")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .body(ShiprocketPayloads.adhocOrder(request, pickupLocation, LocalDateTime.now(INDIA)))
            .retrieve()
            .body(JsonNode.class));
        String shipmentId = CarrierJson.text(order, "shipment_id");
        if (shipmentId == null) {
            throw new CarrierException("Shiprocket did not create the order: "
                + CarrierJson.errorText(order == null ? null : order.toString()));
        }

        JsonNode assigned = authorized(token -> http.post()
            .uri("/courier/assign/awb")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("shipment_id", order.get("shipment_id")))  // as Shiprocket sent it: a number
            .retrieve()
            .body(JsonNode.class));
        String awb = CarrierJson.text(assigned, "response", "data", "awb_code");
        if (awb == null) {
            String reason = CarrierJson.text(assigned, "message");
            if (reason == null) reason = CarrierJson.text(assigned, "response", "data", "awb_assign_error");
            // The Shiprocket order exists now; name it so an operator can finish or cancel it there.
            throw new CarrierException("Shiprocket created shipment " + shipmentId + " but assigned no AWB: "
                + (reason == null ? "no reason was given" : CarrierJson.truncate(reason)));
        }
        String courier = CarrierJson.text(assigned, "response", "data", "courier_name");
        return new BookingResult(awb, false, null, shipmentId,
            "Booked via Shiprocket with " + (courier == null ? "an unnamed courier" : courier));
    }

    @Override
    public Optional<TrackingSnapshot> track(String awb) {
        requireConfigured();
        JsonNode body = authorized(token -> http.get()
            .uri("/courier/track/awb/{awb}", awb)
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(JsonNode.class));
        JsonNode data = CarrierJson.at(body, "tracking_data");
        JsonNode latest = CarrierJson.first(data, "shipment_track");
        String status = CarrierJson.text(latest, "current_status");
        if (status == null) {
            status = CarrierJson.text(data, "shipment_status");
        }
        if (status == null) {
            String error = CarrierJson.text(data, "error");
            if (error != null) {
                throw new CarrierException("Shiprocket could not track " + awb + ": " + CarrierJson.truncate(error));
            }
            return Optional.empty();
        }
        return Optional.of(new TrackingSnapshot(awb, status,
            CarrierJson.text(latest, "destination"),
            CarrierJson.parseDateTime(CarrierJson.text(latest, "updated_time"))));
    }

    @Override
    public void cancel(String awb) {
        requireConfigured();
        authorized(token -> http.post()
            .uri("/orders/cancel/shipment/awbs")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("awbs", List.of(awb)))
            .retrieve()
            .toBodilessEntity());
    }

    /** Runs a call with the cached token; on 401, logs in afresh and retries exactly once. */
    private <T> T authorized(Function<String, T> call) {
        return CarrierHttp.call(LABEL, () -> {
            String token = tokens.get(this::login);
            try {
                return call.apply(token);
            } catch (HttpClientErrorException.Unauthorized expired) {
                tokens.invalidate(token);
                return call.apply(tokens.get(this::login));
            }
        });
    }

    private String login() {
        Map<String, String> credentials = new LinkedHashMap<>();
        credentials.put("email", email);
        credentials.put("password", password);
        JsonNode body;
        try {
            body = CarrierHttp.call(LABEL, () -> http.post()
                .uri("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(credentials)
                .retrieve()
                .body(JsonNode.class));
        } catch (CarrierException e) {
            throw new CarrierException("Shiprocket login failed — " + e.getMessage(), e);
        }
        String token = CarrierJson.text(body, "token");
        if (token == null) {
            throw new CarrierException("Shiprocket login returned no token");
        }
        return token;
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new CarrierException("Shiprocket is not configured: SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must both be set");
        }
    }

    private static BigDecimal decimal(String text) {
        try {
            return text == null ? null : new BigDecimal(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer integer(String text) {
        try {
            return text == null ? null : Integer.valueOf(text.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
