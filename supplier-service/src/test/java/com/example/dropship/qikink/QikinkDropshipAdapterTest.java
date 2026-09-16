package com.example.dropship.qikink;

import com.example.dropship.DropshipException;
import com.example.dropship.SubmissionResult;
import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderLine;
import com.example.entity.SupplierOrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class QikinkDropshipAdapterTest {

    static final String BASE = "https://sandbox.qikink.com";
    static final String TOKEN_OK = "{\"Accesstoken\":\"tok-1\",\"expires_in\":3600}";
    static final String ORDER_OK = "{\"status_code\":\"200\",\"order_id\":\"12345\",\"message\":\"Order created successfully\"}";

    MockRestServiceServer server;
    QikinkDropshipAdapter adapter;
    DropshipPartner partner = new DropshipPartner();

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        adapter = new QikinkDropshipAdapter(builder, "cid-123", "secret-xyz", BASE + "/", 1,
            Clock.fixed(Instant.parse("2026-09-14T10:00:00Z"), ZoneOffset.UTC));
        partner.setCode("QIKINK");
        partner.setName("Qikink");
    }

    static SupplierOrder order() {
        SupplierOrder so = new SupplierOrder();
        so.setId(9L);
        so.setOrderId(36L);
        so.setOrderNumber("ORD-464E6912");
        so.setPartnerCode("QIKINK");
        so.setStatus(SupplierOrderStatus.CREATED);
        so.setAttempts(1);
        so.setShipToName("Priya Sharma");
        so.setShipToLine1("88 MG Road");
        so.setShipToLine2("Indiranagar");
        so.setShipToCity("Bengaluru");
        so.setShipToState("Karnataka");
        so.setShipToPostalCode("560038");
        so.setShipToPhone("9876543299");
        so.setShipToEmail("priya@example.com");
        SupplierOrderLine line = new SupplierOrderLine();
        line.setItemId(49L);
        line.setProductName("Printed Tee");
        line.setPartnerSku("USs-Wh-M");
        line.setQuantity(2);
        line.setUnitPrice(new BigDecimal("699.00"));
        line.setUnitCost(new BigDecimal("350.00"));
        so.addLine(line);
        return so;
    }

    @Test
    void configuredOnlyWithBothCredentials() {
        assertThat(adapter.isConfigured()).isTrue();
        QikinkDropshipAdapter blank = new QikinkDropshipAdapter(RestClient.builder(), "cid", "", BASE, 1,
            Clock.systemUTC());
        assertThat(blank.isConfigured()).isFalse();
        assertThatThrownBy(() -> blank.submit(order(), partner))
            .isInstanceOf(DropshipException.class)
            .hasMessageContaining("QIKINK_CLIENT_SECRET");
    }

    @Test
    void logsInWithFormEncodedCredentialsThenCreatesTheOrder() {
        server.expect(requestTo(BASE + "/api/token"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_FORM_URLENCODED))
            .andExpect(content().formData(form("cid-123", "secret-xyz")))
            .andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("ClientId", "cid-123"))
            .andExpect(header("Accesstoken", "tok-1"))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.order_number").value("ORD-464E6912"))
            .andExpect(jsonPath("$.qikink_shipping").value("1"))
            .andExpect(jsonPath("$.gateway").value("Prepaid"))
            .andExpect(jsonPath("$.total_order_value").value("1398"))
            .andExpect(jsonPath("$.line_items[0].sku").value("USs-Wh-M"))
            .andExpect(jsonPath("$.line_items[0].search_from_my_products").value(1))
            .andExpect(jsonPath("$.line_items[0].quantity").value("2"))
            .andExpect(jsonPath("$.line_items[0].price").value("699"))
            .andExpect(jsonPath("$.shipping_address.first_name").value("Priya"))
            .andExpect(jsonPath("$.shipping_address.last_name").value("Sharma"))
            .andExpect(jsonPath("$.shipping_address.zip").value("560038"))
            .andExpect(jsonPath("$.shipping_address.province").value("Karnataka"))
            .andExpect(jsonPath("$.shipping_address.email").value("priya@example.com"))
            .andExpect(jsonPath("$.shipping_address.country_code").value("IN"))
            .andRespond(withSuccess(ORDER_OK, MediaType.APPLICATION_JSON));

        SubmissionResult result = adapter.submit(order(), partner);

        server.verify();
        assertThat(result.mode()).isEqualTo(SubmissionResult.MODE_API);
        assertThat(result.partnerOrderRef()).isEqualTo("12345");
        assertThat(result.status()).isEqualTo(SupplierOrderStatus.SUBMITTED);
        assertThat(result.note()).contains("12345").contains("dashboard");
    }

    @Test
    void reusesTheTokenAcrossSubmissions() {
        server.expect(requestTo(BASE + "/api/token")).andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create")).andRespond(withSuccess(ORDER_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create")).andRespond(withSuccess(ORDER_OK, MediaType.APPLICATION_JSON));

        adapter.submit(order(), partner);
        adapter.submit(order(), partner);

        server.verify();
    }

    @Test
    void reLogsInOnceWhenTheTokenIsRejected() {
        server.expect(requestTo(BASE + "/api/token")).andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create"))
            .andExpect(header("Accesstoken", "tok-1"))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"message\":\"Token expired\"}"));
        server.expect(requestTo(BASE + "/api/token"))
            .andRespond(withSuccess("{\"Accesstoken\":\"tok-2\",\"expires_in\":3600}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create"))
            .andExpect(header("Accesstoken", "tok-2"))
            .andRespond(withSuccess(ORDER_OK, MediaType.APPLICATION_JSON));

        assertThat(adapter.submit(order(), partner).partnerOrderRef()).isEqualTo("12345");
        server.verify();
    }

    @Test
    void aSecondRejectionIsReportedNotRetriedForever() {
        server.expect(requestTo(BASE + "/api/token")).andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create")).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        server.expect(requestTo(BASE + "/api/token")).andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create")).andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThatThrownBy(() -> adapter.submit(order(), partner))
            .isInstanceOf(DropshipException.class)
            .hasMessageContaining("HTTP 401");
        server.verify();
    }

    @Test
    void qikinkErrorsBecomeFailureReasonsInQikinksWords() {
        server.expect(requestTo(BASE + "/api/token")).andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create"))
            .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"status_code\":\"422\",\"message\":\"Invalid SKU\"}"));

        assertThatThrownBy(() -> adapter.submit(order(), partner))
            .isInstanceOf(DropshipException.class)
            .hasMessageContaining("Invalid SKU")
            .satisfies(e -> assertThat(e.getMessage()).doesNotContain("secret-xyz"));
    }

    @Test
    void aTwoHundredWithoutAnOrderIdIsNotASuccess() {
        server.expect(requestTo(BASE + "/api/token")).andRespond(withSuccess(TOKEN_OK, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/api/order/create"))
            .andRespond(withSuccess("{\"status_code\":\"400\",\"message\":\"Design code, Mockup Link and placement sku is mandatory\"}",
                MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> adapter.submit(order(), partner))
            .isInstanceOf(DropshipException.class)
            .hasMessageContaining("Mockup Link");
    }

    @Test
    void loginFailureNeverEchoesTheSecret() {
        server.expect(requestTo(BASE + "/api/token"))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"message\":\"Invalid client\"}"));

        assertThatThrownBy(() -> adapter.submit(order(), partner))
            .isInstanceOf(DropshipException.class)
            .hasMessageContaining("Qikink login failed")
            .satisfies(e -> assertThat(e.getMessage()).doesNotContain("secret-xyz"));
    }

    @Test
    void springConstructorBuilds() {
        QikinkDropshipAdapter spring = new QikinkDropshipAdapter(RestClient.builder(), "", "", BASE, 1);
        assertThat(spring.key()).isEqualTo("QIKINK");
        assertThat(spring.isConfigured()).isFalse();
        assertThat(spring.requiredEnvironment()).contains("QIKINK_CLIENT_ID", "QIKINK_CLIENT_SECRET");
    }

    private static org.springframework.util.MultiValueMap<String, String> form(String id, String secret) {
        org.springframework.util.LinkedMultiValueMap<String, String> m = new org.springframework.util.LinkedMultiValueMap<>();
        m.add("ClientId", id);
        m.add("client_secret", secret);
        return m;
    }
}
