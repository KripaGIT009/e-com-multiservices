package com.example.dropship.qikink;

import com.example.dropship.DropshipAdapter;
import com.example.dropship.DropshipCapability;
import com.example.dropship.DropshipException;
import com.example.dropship.SubmissionResult;
import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Qikink — print-on-demand and dropshipping.
 *
 * <p>Written against Qikink's published API (its Postman reference and an independent
 * integration write-up; docs/commerce-architecture.md §8.2): a form-encoded token
 * exchange at {@code POST /api/token} and {@code POST /api/order/create} authenticated
 * with {@code ClientId} and {@code Accesstoken} headers. <strong>It has not been
 * exercised against a Qikink account in this repository</strong> — live API access must
 * be requested from Qikink's dashboard (Integration → Custom API).
 *
 * <p>Only order submission is claimed. Qikink documents no order-status, tracking or
 * webhook endpoint, so tracking numbers are recorded by an operator from the Qikink
 * dashboard, exactly as for a manual partner.
 */
@Component
public class QikinkDropshipAdapter implements DropshipAdapter {

    public static final String KEY = "QIKINK";
    static final String TOKEN_PATH = "/api/token";
    static final String CREATE_ORDER_PATH = "/api/order/create";
    static final long DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;

    private static final Logger log = LoggerFactory.getLogger(QikinkDropshipAdapter.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP =
        new ParameterizedTypeReference<>() { };

    private final RestClient client;
    private final String clientId;
    private final String clientSecret;
    private final String baseUrl;
    private final int searchFromMyProducts;
    private final QikinkTokenCache tokens;

    @Autowired
    public QikinkDropshipAdapter(RestClient.Builder builder,
                                 @Value("${QIKINK_CLIENT_ID:}") String clientId,
                                 @Value("${QIKINK_CLIENT_SECRET:}") String clientSecret,
                                 @Value("${QIKINK_BASE_URL:https://sandbox.qikink.com}") String baseUrl,
                                 @Value("${QIKINK_SEARCH_FROM_MY_PRODUCTS:1}") int searchFromMyProducts) {
        this(builder.requestFactory(timeouts()), clientId, clientSecret, baseUrl, searchFromMyProducts,
            Clock.systemUTC());
    }

    /** For tests: the builder is used exactly as given so a mock server stays bound. */
    QikinkDropshipAdapter(RestClient.Builder builder, String clientId, String clientSecret,
                          String baseUrl, int searchFromMyProducts, Clock clock) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.clientSecret = clientSecret == null ? "" : clientSecret.trim();
        this.baseUrl = stripSlash(baseUrl);
        this.searchFromMyProducts = searchFromMyProducts;
        this.tokens = new QikinkTokenCache(clock);
        this.client = builder.baseUrl(this.baseUrl).build();
    }

    @Override
    public String key() {
        return KEY;
    }

    @Override
    public String label() {
        return "Qikink API";
    }

    @Override
    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    @Override
    public Set<DropshipCapability> capabilities() {
        return EnumSet.of(DropshipCapability.ORDER_SUBMISSION);
    }

    @Override
    public List<String> requiredEnvironment() {
        return List.of("QIKINK_CLIENT_ID", "QIKINK_CLIENT_SECRET", "QIKINK_BASE_URL",
            "QIKINK_SEARCH_FROM_MY_PRODUCTS");
    }

    @Override
    public SubmissionResult submit(SupplierOrder order, DropshipPartner partner) {
        if (!isConfigured()) {
            throw new DropshipException("Qikink integration is not configured (QIKINK_CLIENT_ID, QIKINK_CLIENT_SECRET)");
        }
        Map<String, Object> body = QikinkPayload.build(order, searchFromMyProducts);
        Map<String, Object> response = postWithRetry(body);

        Object orderId = response.get("order_id");
        if (orderId == null || String.valueOf(orderId).isBlank()) {
            throw new DropshipException("Qikink did not accept the order: " + messageOf(response));
        }
        String ref = String.valueOf(orderId);
        log.info("Supplier order {} accepted by Qikink as {}", order.getId(), ref);
        return new SubmissionResult(SubmissionResult.MODE_API, ref, SupplierOrderStatus.SUBMITTED,
            "Accepted by Qikink as order " + ref + ". Qikink's API exposes no tracking; "
                + "record the AWB from the Qikink dashboard when it ships.");
    }

    /** One transparent re-login when Qikink says the cached token is no longer good. */
    private Map<String, Object> postWithRetry(Map<String, Object> body) {
        String token = tokens.get(this::login);
        try {
            return createOrder(token, body);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() != HttpStatus.UNAUTHORIZED.value()) throw rejected(e);
            tokens.invalidate(token);
            String fresh = tokens.get(this::login);
            try {
                return createOrder(fresh, body);
            } catch (RestClientResponseException again) {
                throw rejected(again);
            }
        }
    }

    private Map<String, Object> createOrder(String token, Map<String, Object> body) {
        try {
            Map<String, Object> response = client.post()
                .uri(CREATE_ORDER_PATH)
                .header("ClientId", clientId)
                .header("Accesstoken", token)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(MAP);
            return response == null ? Map.of() : response;
        } catch (ResourceAccessException e) {
            throw new DropshipException("Qikink could not be reached: " + e.getMessage(), e);
        }
    }

    private QikinkTokenCache.Issued login() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("ClientId", clientId);
        form.add("client_secret", clientSecret);
        Map<String, Object> response;
        try {
            response = client.post()
                .uri(TOKEN_PATH)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .body(MAP);
        } catch (RestClientResponseException e) {
            // The secret never appears here: only Qikink's status and message do.
            throw new DropshipException("Qikink login failed (HTTP " + e.getStatusCode().value() + "): "
                + messageOf(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new DropshipException("Qikink could not be reached: " + e.getMessage(), e);
        }
        Object token = response == null ? null : response.get("Accesstoken");
        if (token == null || String.valueOf(token).isBlank()) {
            throw new DropshipException("Qikink login returned no access token: " + messageOf(response));
        }
        long lifetime = DEFAULT_TOKEN_LIFETIME_SECONDS;
        Object expires = response.get("expires_in");
        if (expires instanceof Number n) lifetime = n.longValue();
        else if (expires != null) {
            try { lifetime = Long.parseLong(String.valueOf(expires)); } catch (NumberFormatException ignored) { }
        }
        return new QikinkTokenCache.Issued(String.valueOf(token), lifetime);
    }

    private static DropshipException rejected(RestClientResponseException e) {
        return new DropshipException("Qikink rejected the order (HTTP " + e.getStatusCode().value() + "): "
            + messageOf(e.getResponseBodyAsString()));
    }

    /** Qikink's own words when it gives any, cut to a length that fits a failure reason. */
    private static String messageOf(Object response) {
        String text;
        if (response instanceof Map<?, ?> map) {
            Object m = map.get("message");
            text = m != null ? String.valueOf(m) : String.valueOf(map);
        } else {
            text = response == null ? "" : String.valueOf(response);
        }
        text = text.trim();
        if (text.isEmpty()) return "no details returned";
        return text.length() > 300 ? text.substring(0, 300) : text;
    }

    private static JdkClientHttpRequestFactory timeouts() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        return factory;
    }

    private static String stripSlash(String url) {
        String u = url == null ? "" : url.trim();
        return u.endsWith("/") ? u.substring(0, u.length() - 1) : u;
    }
}
