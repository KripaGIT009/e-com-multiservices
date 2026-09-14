package com.example.carrier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ShiprocketCarrierAdapterTest {

    private static final String BASE = "https://shiprocket.test/v1/external";
    private static final String EMAIL = "api@myindianstore.test";
    private static final String PASSWORD = "s3cret-pass";
    private static final String SERVICEABILITY = BASE
        + "/courier/serviceability/?pickup_postcode=110001&delivery_postcode=560001&weight=1.250&cod=1";

    private MockRestServiceServer server;
    private ShiprocketCarrierAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = adapter(EMAIL, PASSWORD);
    }

    private ShiprocketCarrierAdapter adapter(String email, String password) {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        return new ShiprocketCarrierAdapter(email, password, BASE, "Warehouse-DL", builder);
    }

    private void expectLogin(String token) {
        server.expect(requestTo(BASE + "/auth/login"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.email").value(EMAIL))
            .andExpect(jsonPath("$.password").value(PASSWORD))
            .andRespond(withSuccess("{\"token\": \"" + token + "\"}", MediaType.APPLICATION_JSON));
    }

    private static BookingRequest request() {
        return new BookingRequest("1042", "SELLER:3", "SHR", "Asha Rao", "9876543210",
            "12 MG Road, Bengaluru", "560001", "110001", 1250, true, new BigDecimal("1499.00"), null);
    }

    @Test
    void configuredOnlyWithEmailAndPassword() {
        assertThat(adapter.isConfigured()).isTrue();
        assertThat(adapter(EMAIL, "").isConfigured()).isFalse();
        assertThat(adapter("", PASSWORD).isConfigured()).isFalse();
        // The constructor Spring uses, which installs the timeout request factory.
        assertThat(new ShiprocketCarrierAdapter(RestClient.builder(), EMAIL, PASSWORD, "", "").isConfigured()).isTrue();
        assertThat(adapter.key()).isEqualTo("SHIPROCKET");
        assertThat(adapter.label()).isEqualTo("Shiprocket (aggregator)");
        assertThat(adapter.requiredEnvironment()).containsExactly(
            "SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_BASE_URL", "SHIPROCKET_PICKUP_LOCATION");
    }

    @Test
    void bookingCreatesTheOrderThenAssignsAnAwbWithOneLogin() {
        expectLogin("tok-1");
        server.expect(requestTo(BASE + "/orders/create/adhoc"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Authorization", "Bearer tok-1"))
            .andExpect(jsonPath("$.order_id").value("1042-SELLER-3"))
            .andExpect(jsonPath("$.order_date").value(org.hamcrest.Matchers.matchesPattern("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")))
            .andExpect(jsonPath("$.pickup_location").value("Warehouse-DL"))
            .andExpect(jsonPath("$.billing_customer_name").value("Asha Rao"))
            .andExpect(jsonPath("$.billing_address").value("12 MG Road, Bengaluru"))
            .andExpect(jsonPath("$.billing_pincode").value("560001"))
            .andExpect(jsonPath("$.billing_country").value("India"))
            .andExpect(jsonPath("$.billing_phone").value("9876543210"))
            .andExpect(jsonPath("$.shipping_is_billing").value(true))
            .andExpect(jsonPath("$.order_items[0].name").value("Order 1042"))
            .andExpect(jsonPath("$.order_items[0].sku").value("SELLER:3"))
            .andExpect(jsonPath("$.order_items[0].units").value(1))
            .andExpect(jsonPath("$.order_items[0].selling_price").value(1499.00))
            .andExpect(jsonPath("$.payment_method").value("COD"))
            .andExpect(jsonPath("$.sub_total").value(1499.00))
            .andExpect(jsonPath("$.length").value(10))
            .andExpect(jsonPath("$.weight").value(1.25))
            .andRespond(withSuccess("{\"order_id\": 98765, \"shipment_id\": 456, \"status\": \"NEW\"}",
                MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/courier/assign/awb"))
            .andExpect(header("Authorization", "Bearer tok-1"))
            .andExpect(jsonPath("$.shipment_id").value(456))
            .andRespond(withSuccess("""
                {"awb_assign_status": 1, "response": {"data": {"awb_code": "AWB777", "courier_name": "Blue Dart"}}}
                """, MediaType.APPLICATION_JSON));

        BookingResult result = adapter.book(request());

        server.verify();
        assertThat(result.trackingNumber()).isEqualTo("AWB777");
        assertThat(result.generated()).isFalse();
        assertThat(result.carrierReference()).isEqualTo("456");
        assertThat(result.note()).isEqualTo("Booked via Shiprocket with Blue Dart");
    }

    @Test
    void rejectedOrderCarriesShiprocketsValidationText() {
        expectLogin("tok-1");
        server.expect(requestTo(BASE + "/orders/create/adhoc"))
            .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY).contentType(MediaType.APPLICATION_JSON)
                .body("{\"message\": \"Oops! Invalid Data.\", \"errors\": {\"billing_phone\": [\"The billing phone must be 10 digits.\"]}}"));

        assertThatThrownBy(() -> adapter.book(request()))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("422")
            .hasMessageContaining("Oops! Invalid Data.")
            .hasMessageContaining("The billing phone must be 10 digits.")
            .satisfies(e -> assertThat(e.getMessage()).doesNotContain("tok-1").doesNotContain(PASSWORD));
    }

    @Test
    void missingAwbNamesTheShipmentAndShiprocketsMessage() {
        expectLogin("tok-1");
        server.expect(requestTo(BASE + "/orders/create/adhoc"))
            .andRespond(withSuccess("{\"order_id\": 1, \"shipment_id\": 456}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/courier/assign/awb"))
            .andRespond(withSuccess("{\"awb_assign_status\": 0, \"message\": \"Insufficient wallet balance\"}",
                MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> adapter.book(request()))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("456")
            .hasMessageContaining("Insufficient wallet balance");
    }

    @Test
    void expiredTokenTriggersOneReLoginAndOneRetry() {
        expectLogin("tok-old");
        server.expect(requestTo(SERVICEABILITY))
            .andExpect(header("Authorization", "Bearer tok-old"))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        expectLogin("tok-new");
        server.expect(requestTo(SERVICEABILITY))
            .andExpect(header("Authorization", "Bearer tok-new"))
            .andRespond(withSuccess("{\"data\": {\"available_courier_companies\": []}}", MediaType.APPLICATION_JSON));

        assertThat(adapter.liveServiceability("110001", "560001", 1250, true)).contains(List.of());
        server.verify();
    }

    @Test
    void secondUnauthorisedResponseIsNotRetriedAgain() {
        expectLogin("tok-1");
        server.expect(requestTo(SERVICEABILITY)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        expectLogin("tok-2");
        server.expect(requestTo(SERVICEABILITY)).andRespond(withStatus(HttpStatus.UNAUTHORIZED)
            .contentType(MediaType.APPLICATION_JSON).body("{\"message\": \"Unauthenticated.\"}"));

        assertThatThrownBy(() -> adapter.liveServiceability("110001", "560001", 1250, true))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("401")
            .hasMessageContaining("Unauthenticated.");
        server.verify();
    }

    @Test
    void failedLoginIsReportedWithoutThePassword() {
        server.expect(requestTo(BASE + "/auth/login"))
            .andRespond(withStatus(HttpStatus.BAD_REQUEST).contentType(MediaType.APPLICATION_JSON)
                .body("{\"message\": \"Invalid email and password combination\"}"));

        assertThatThrownBy(() -> adapter.liveServiceability("110001", "560001", 1250, true))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("login failed")
            .hasMessageContaining("Invalid email and password combination")
            .satisfies(e -> assertThat(e.getMessage()).doesNotContain(PASSWORD));
    }

    @Test
    void serviceabilityMapsEachCourierCompany() {
        expectLogin("tok-1");
        server.expect(requestTo(SERVICEABILITY))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess("""
                {"status": 200, "data": {"available_courier_companies": [
                  {"courier_name": "Delhivery Surface", "rate": 87.5, "estimated_delivery_days": "4"},
                  {"courier_name": "Xpressbees", "rate": "101.20", "estimated_delivery_days": ""}
                ]}}
                """, MediaType.APPLICATION_JSON));

        List<LiveQuote> quotes = adapter.liveServiceability("110001", "560001", 1250, true).orElseThrow();

        assertThat(quotes).containsExactly(
            new LiveQuote("Delhivery Surface", new BigDecimal("87.5"), 4),
            new LiveQuote("Xpressbees", new BigDecimal("101.20"), null));
    }

    @Test
    void serviceabilityNeedsAPickupPincode() {
        assertThatThrownBy(() -> adapter.liveServiceability(null, "560001", 500, false))
            .isInstanceOf(CarrierException.class)
            .hasMessage("Shiprocket needs a pickup pincode");
        server.verify();
    }

    @Test
    void trackingMapsTheLatestScan() {
        expectLogin("tok-1");
        server.expect(requestTo(BASE + "/courier/track/awb/AWB777"))
            .andExpect(header("Authorization", "Bearer tok-1"))
            .andRespond(withSuccess("""
                {"tracking_data": {"track_status": 1, "shipment_status": 6, "shipment_track": [
                  {"awb_code": "AWB777", "current_status": "Out For Delivery", "destination": "Bengaluru",
                   "updated_time": "2026-09-13 09:15:02"}]}}
                """, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/courier/track/awb/AWB888"))
            .andRespond(withSuccess("{\"tracking_data\": {\"track_status\": 0, \"shipment_status\": 7}}",
                MediaType.APPLICATION_JSON));

        TrackingSnapshot latest = adapter.track("AWB777").orElseThrow();
        TrackingSnapshot fallback = adapter.track("AWB888").orElseThrow();

        assertThat(latest).isEqualTo(new TrackingSnapshot("AWB777", "Out For Delivery", "Bengaluru",
            LocalDateTime.of(2026, 9, 13, 9, 15, 2)));
        assertThat(fallback).isEqualTo(new TrackingSnapshot("AWB888", "7", null, null));
    }

    @Test
    void cancellationPostsTheAwb() {
        expectLogin("tok-1");
        server.expect(requestTo(BASE + "/orders/cancel/shipment/awbs"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.awbs[0]").value("AWB777"))
            .andRespond(withSuccess("{\"message\": \"Bulk Shipment cancellation is in progress.\"}",
                MediaType.APPLICATION_JSON));

        adapter.cancel("AWB777");
        server.verify();
    }
}
