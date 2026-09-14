package com.example.carrier;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class DelhiveryCarrierAdapterTest {

    private static final String BASE = "https://delhivery.test";
    private static final String TOKEN = "secret-token-123";
    private static final ObjectMapper JSON = new ObjectMapper();

    private MockRestServiceServer server;
    private DelhiveryCarrierAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = adapter(TOKEN, "Main Warehouse");
    }

    private DelhiveryCarrierAdapter adapter(String token, String pickup) {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        return new DelhiveryCarrierAdapter(token, BASE, pickup, builder);
    }

    private static BookingRequest request(boolean cod) {
        return new BookingRequest("1042", "SELLER:3", "DLV", "Asha Rao", "9876543210",
            "12 MG Road, Bengaluru", "560001", "110001", 750, cod, new BigDecimal("1499.00"), null);
    }

    @Test
    void configuredOnlyWithAToken() {
        assertThat(adapter.isConfigured()).isTrue();
        assertThat(adapter("", "Main Warehouse").isConfigured()).isFalse();
        assertThat(adapter("   ", "Main Warehouse").isConfigured()).isFalse();
        // The constructor Spring uses, which installs the timeout request factory.
        assertThat(new DelhiveryCarrierAdapter(RestClient.builder(), "", "", "").isConfigured()).isFalse();
        assertThat(adapter.key()).isEqualTo("DELHIVERY");
        assertThat(adapter.requiredEnvironment())
            .containsExactly("DELHIVERY_API_TOKEN", "DELHIVERY_BASE_URL", "DELHIVERY_PICKUP_LOCATION");
    }

    @Test
    void bookingPostsTheDocumentedManifestAndMapsTheWaybill() {
        server.expect(requestTo(BASE + "/api/cmu/create.json"))
            .andExpect(method(org.springframework.http.HttpMethod.POST))
            .andExpect(header("Authorization", "Token " + TOKEN))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_FORM_URLENCODED))
            .andExpect(request -> {
                String body = ((MockClientHttpRequest) request).getBodyAsString();
                assertThat(body).startsWith("format=json&data=");
                JsonNode data = JSON.readTree(URLDecoder.decode(body.substring("format=json&data=".length()),
                    StandardCharsets.UTF_8));
                JsonNode shipment = data.get("shipments").get(0);
                assertThat(shipment.get("name").asText()).isEqualTo("Asha Rao");
                assertThat(shipment.get("add").asText()).isEqualTo("12 MG Road, Bengaluru");
                assertThat(shipment.get("pin").asText()).isEqualTo("560001");
                assertThat(shipment.get("phone").asText()).isEqualTo("9876543210");
                assertThat(shipment.get("order").asText()).isEqualTo("1042-SELLER-3");
                assertThat(shipment.get("payment_mode").asText()).isEqualTo("COD");
                assertThat(shipment.get("total_amount").decimalValue()).isEqualByComparingTo("1499.00");
                assertThat(shipment.get("cod_amount").decimalValue()).isEqualByComparingTo("1499.00");
                assertThat(shipment.get("weight").asInt()).isEqualTo(750);
                assertThat(data.get("pickup_location").get("name").asText()).isEqualTo("Main Warehouse");
            })
            .andRespond(withSuccess("""
                {"success": true, "packages": [{"waybill": "1234567890123", "refnum": "1042-SELLER-3", "status": "Success"}]}
                """, MediaType.APPLICATION_JSON));

        BookingResult result = adapter.book(request(true));

        server.verify();
        assertThat(result.trackingNumber()).isEqualTo("1234567890123");
        assertThat(result.generated()).isFalse();
        assertThat(result.carrierReference()).isEqualTo("1042-SELLER-3");
        assertThat(result.note()).isEqualTo("Booked with Delhivery");
    }

    @Test
    void prepaidBookingSendsZeroCod() {
        server.expect(requestTo(BASE + "/api/cmu/create.json"))
            .andExpect(request -> {
                String body = URLDecoder.decode(((MockClientHttpRequest) request).getBodyAsString(), StandardCharsets.UTF_8);
                assertThat(body).contains("\"payment_mode\":\"Prepaid\"").contains("\"cod_amount\":0");
            })
            .andRespond(withSuccess("{\"success\":true,\"packages\":[{\"waybill\":\"W1\"}]}", MediaType.APPLICATION_JSON));

        assertThat(adapter.book(request(false)).carrierReference()).isNull();
    }

    @Test
    void rejectedBookingCarriesDelhiverysRemarks() {
        server.expect(requestTo(BASE + "/api/cmu/create.json"))
            .andRespond(withSuccess("""
                {"success": false, "rmk": "ignored when remarks exist",
                 "packages": [{"waybill": "", "remarks": ["Pincode not serviceable", "Invalid phone"]}]}
                """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> adapter.book(request(false)))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("Pincode not serviceable; Invalid phone");
    }

    @Test
    void rejectedBookingWithoutPackagesUsesRmk() {
        server.expect(requestTo(BASE + "/api/cmu/create.json"))
            .andRespond(withSuccess("{\"success\": false, \"rmk\": \"ClientWarehouse matching query does not exist.\"}",
                MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> adapter.book(request(false)))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("ClientWarehouse matching query does not exist.");
    }

    @Test
    void httpErrorBecomesCarrierExceptionWithoutTheToken() {
        server.expect(requestTo(BASE + "/api/cmu/create.json"))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"detail\": \"Invalid token header.\"}"));

        assertThatThrownBy(() -> adapter.book(request(false)))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("401")
            .hasMessageContaining("Invalid token header.")
            .satisfies(e -> assertThat(e.getMessage()).doesNotContain(TOKEN));
    }

    @Test
    void bookingWithoutAPickupLocationFailsBeforeCallingDelhivery() {
        DelhiveryCarrierAdapter noPickup = adapter(TOKEN, "");
        assertThatThrownBy(() -> noPickup.book(request(false)))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("DELHIVERY_PICKUP_LOCATION");
        server.verify();
    }

    @Test
    void unconfiguredAdapterRefusesToBook() {
        DelhiveryCarrierAdapter unconfigured = adapter("", "Main Warehouse");
        assertThatThrownBy(() -> unconfigured.book(request(false)))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("DELHIVERY_API_TOKEN");
    }

    @Test
    void serviceabilityIsYesOrNoWithoutRates() {
        server.expect(requestTo(BASE + "/c/api/pin-codes/json/?filter_codes=560001"))
            .andExpect(header("Authorization", "Token " + TOKEN))
            .andRespond(withSuccess("{\"delivery_codes\": [{\"postal_code\": {\"pin\": 560001}}]}",
                MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/c/api/pin-codes/json/?filter_codes=999999"))
            .andRespond(withSuccess("{\"delivery_codes\": []}", MediaType.APPLICATION_JSON));

        Optional<List<LiveQuote>> yes = adapter.liveServiceability("110001", "560001", 500, false);
        Optional<List<LiveQuote>> no = adapter.liveServiceability("110001", "999999", 500, false);

        assertThat(yes).contains(List.of(new LiveQuote("Delhivery", null, null)));
        assertThat(no).contains(List.of());
    }

    @Test
    void trackingMapsTheLatestStatus() {
        server.expect(requestTo(BASE + "/api/v1/packages/json/?waybill=1234567890123"))
            .andRespond(withSuccess("""
                {"ShipmentData": [{"Shipment": {"AWB": "1234567890123", "Status": {
                  "Status": "In Transit", "StatusLocation": "Delhi_Bamnoli_Hub (Delhi)",
                  "StatusDateTime": "2026-09-12T18:04:31.117"}}}]}
                """, MediaType.APPLICATION_JSON));

        TrackingSnapshot snapshot = adapter.track("1234567890123").orElseThrow();

        assertThat(snapshot.awb()).isEqualTo("1234567890123");
        assertThat(snapshot.carrierStatus()).isEqualTo("In Transit");
        assertThat(snapshot.location()).isEqualTo("Delhi_Bamnoli_Hub (Delhi)");
        assertThat(snapshot.updatedAt()).isEqualTo(LocalDateTime.of(2026, 9, 12, 18, 4, 31, 117_000_000));
    }

    @Test
    void trackingToleratesAnUnreadableTimestamp() {
        server.expect(requestTo(BASE + "/api/v1/packages/json/?waybill=W1"))
            .andRespond(withSuccess("{\"ShipmentData\":[{\"Shipment\":{\"Status\":{\"Status\":\"Manifested\","
                + "\"StatusDateTime\":\"yesterday\"}}}]}", MediaType.APPLICATION_JSON));

        TrackingSnapshot snapshot = adapter.track("W1").orElseThrow();
        assertThat(snapshot.carrierStatus()).isEqualTo("Manifested");
        assertThat(snapshot.updatedAt()).isNull();
    }

    @Test
    void cancellationSendsTheWaybillAndChecksStatus() {
        server.expect(requestTo(BASE + "/api/p/edit"))
            .andExpect(method(org.springframework.http.HttpMethod.POST))
            .andExpect(jsonPath("$.waybill").value("W1"))
            .andExpect(jsonPath("$.cancellation").value("true"))
            .andRespond(withSuccess("{\"status\": true, \"remark\": \"Shipment has been cancelled.\"}",
                MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/p/edit"))
            .andRespond(withSuccess("{\"status\": false, \"remark\": \"Shipment already delivered\"}",
                MediaType.APPLICATION_JSON));

        adapter.cancel("W1");
        assertThatThrownBy(() -> adapter.cancel("W2"))
            .isInstanceOf(CarrierException.class)
            .hasMessageContaining("Shipment already delivered");
        server.verify();
    }
}
