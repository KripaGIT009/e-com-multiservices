package com.example.service;

import com.example.config.DashboardProperties;
import com.example.dto.*;
import com.example.entity.AuditLog;
import com.example.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DashboardAnalyticsService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final DashboardProperties dashboardProperties;
    private final AuditLogRepository auditLogRepository;

    @Value("${service.urls.order}")
    private String orderServiceUrl;

    @Value("${service.urls.user}")
    private String userServiceUrl;

    @Value("${service.urls.item}")
    private String itemServiceUrl;

    @Value("${service.urls.inventory}")
    private String inventoryServiceUrl;

    @Value("${service.urls.payment}")
    private String paymentServiceUrl;

    public DashboardAnalyticsService(WebClient.Builder webClientBuilder,
                                     ObjectMapper objectMapper,
                                     DashboardProperties dashboardProperties,
                                     AuditLogRepository auditLogRepository) {
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
        this.dashboardProperties = dashboardProperties;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Fetches aggregated dashboard summary by calling downstream services in parallel.
     * Applies per-service fallback with default values and populates warnings on failure.
     * Enforces an overall timeout of 5 seconds.
     */
    public DashboardSummaryDTO fetchDashboardSummary() {
        Duration perServiceTimeout = Duration.ofMillis(dashboardProperties.getDownstreamTimeoutMs());

        // Order service call - returns totalOrders, totalRevenue, todayOrders, pendingOrders
        Mono<JsonNode> orderMono = webClientBuilder.build()
                .get()
                .uri(orderServiceUrl + "/api/v1/orders")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(perServiceTimeout)
                .map(this::parseJson)
                .onErrorResume(e -> {
                    log.warn("Order service call failed: {}", e.getMessage());
                    return Mono.just(objectMapper.createObjectNode().put("__failed", "order-service"));
                });

        // User service call - returns totalUsers, newUsersThisWeek
        Mono<JsonNode> userMono = webClientBuilder.build()
                .get()
                .uri(userServiceUrl + "/api/users")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(perServiceTimeout)
                .map(this::parseJson)
                .onErrorResume(e -> {
                    log.warn("User service call failed: {}", e.getMessage());
                    return Mono.just(objectMapper.createObjectNode().put("__failed", "user-service"));
                });

        // Item service call - returns totalProducts
        Mono<JsonNode> itemMono = webClientBuilder.build()
                .get()
                .uri(itemServiceUrl + "/items")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(perServiceTimeout)
                .map(this::parseJson)
                .onErrorResume(e -> {
                    log.warn("Item service call failed: {}", e.getMessage());
                    return Mono.just(objectMapper.createObjectNode().put("__failed", "item-service"));
                });

        // Inventory service call - returns low stock count
        Mono<JsonNode> inventoryMono = webClientBuilder.build()
                .get()
                .uri(inventoryServiceUrl + "/inventory")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(perServiceTimeout)
                .map(this::parseJson)
                .onErrorResume(e -> {
                    log.warn("Inventory service call failed: {}", e.getMessage());
                    return Mono.just(objectMapper.createObjectNode().put("__failed", "inventory-service"));
                });

        // Payment service call - returns paymentSuccessRate, totalRefunds
        Mono<JsonNode> paymentMono = webClientBuilder.build()
                .get()
                .uri(paymentServiceUrl + "/api/v1/payments")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(perServiceTimeout)
                .map(this::parseJson)
                .onErrorResume(e -> {
                    log.warn("Payment service call failed: {}", e.getMessage());
                    return Mono.just(objectMapper.createObjectNode().put("__failed", "payment-service"));
                });

        // Execute all calls in parallel using Mono.zip and enforce overall 5-second timeout
        return Mono.zip(orderMono, userMono, itemMono, inventoryMono, paymentMono)
                .timeout(Duration.ofSeconds(5))
                .map(tuple -> {
                    JsonNode orderData = tuple.getT1();
                    JsonNode userData = tuple.getT2();
                    JsonNode itemData = tuple.getT3();
                    JsonNode inventoryData = tuple.getT4();
                    JsonNode paymentData = tuple.getT5();

                    List<String> warnings = new ArrayList<>();

                    // Extract order data
                    long totalOrders = 0;
                    BigDecimal totalRevenue = BigDecimal.ZERO;
                    long todayOrders = 0;
                    long pendingOrders = 0;
                    if (isServiceFailed(orderData)) {
                        warnings.add("order-service");
                    } else {
                        totalOrders = extractOrderCount(orderData);
                        totalRevenue = extractTotalRevenue(orderData);
                        todayOrders = extractTodayOrders(orderData);
                        pendingOrders = extractPendingOrders(orderData);
                    }

                    // Extract user data
                    long totalUsers = 0;
                    long newUsersThisWeek = 0;
                    if (isServiceFailed(userData)) {
                        warnings.add("user-service");
                    } else {
                        totalUsers = extractUserCount(userData);
                        newUsersThisWeek = extractNewUsersThisWeek(userData);
                    }

                    // Extract item data
                    long totalProducts = 0;
                    if (isServiceFailed(itemData)) {
                        warnings.add("item-service");
                    } else {
                        totalProducts = extractProductCount(itemData);
                    }

                    // Extract inventory data
                    long lowStockCount = 0;
                    if (isServiceFailed(inventoryData)) {
                        warnings.add("inventory-service");
                    } else {
                        lowStockCount = extractLowStockCount(inventoryData);
                    }

                    // Extract payment data
                    double paymentSuccessRate = 0.0;
                    long totalRefunds = 0;
                    if (isServiceFailed(paymentData)) {
                        warnings.add("payment-service");
                    } else {
                        paymentSuccessRate = extractPaymentSuccessRate(paymentData);
                        totalRefunds = extractTotalRefunds(paymentData);
                    }

                    return DashboardSummaryDTO.builder()
                            .totalOrders(totalOrders)
                            .totalRevenue(totalRevenue)
                            .todayOrders(todayOrders)
                            .pendingOrders(pendingOrders)
                            .totalUsers(totalUsers)
                            .newUsersThisWeek(newUsersThisWeek)
                            .totalProducts(totalProducts)
                            .lowStockCount(lowStockCount)
                            .paymentSuccessRate(paymentSuccessRate)
                            .totalRefunds(totalRefunds)
                            .warnings(warnings)
                            .build();
                })
                .onErrorResume(e -> {
                    log.error("Overall dashboard summary fetch failed: {}", e.getMessage());
                    List<String> warnings = new ArrayList<>();
                    warnings.add("order-service");
                    warnings.add("user-service");
                    warnings.add("item-service");
                    warnings.add("inventory-service");
                    warnings.add("payment-service");
                    return Mono.just(DashboardSummaryDTO.builder()
                            .totalOrders(0)
                            .totalRevenue(BigDecimal.ZERO)
                            .todayOrders(0)
                            .pendingOrders(0)
                            .totalUsers(0)
                            .newUsersThisWeek(0)
                            .totalProducts(0)
                            .lowStockCount(0)
                            .paymentSuccessRate(0.0)
                            .totalRefunds(0)
                            .warnings(warnings)
                            .build());
                })
                .block();
    }

    private static final Set<String> VALID_PERIODS = Set.of("daily", "weekly", "monthly");

    /**
     * Fetches revenue time-series data for the specified period.
     * Returns 30 entries for "daily", 12 for "weekly", 12 for "monthly".
     *
     * @param period the time period: "daily", "weekly", or "monthly"
     * @return list of TimeSeriesEntryDTO with date labels and revenue values
     * @throws ResponseStatusException with 400 status if period is invalid
     */
    public List<TimeSeriesEntryDTO> fetchRevenueTimeSeries(String period) {
        if (period == null || !VALID_PERIODS.contains(period.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid period parameter. Must be one of: daily, weekly, monthly");
        }

        String normalizedPeriod = period.toLowerCase();
        int entryCount = getEntryCount(normalizedPeriod);

        // TODO: Replace with real order-service call when downstream API is finalized
        // Stub: generate simulated revenue data based on the period
        return generateSimulatedRevenueData(normalizedPeriod, entryCount);
    }

    private int getEntryCount(String period) {
        return switch (period) {
            case "daily" -> 30;
            case "weekly" -> 12;
            case "monthly" -> 12;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid period parameter. Must be one of: daily, weekly, monthly");
        };
    }

    private List<TimeSeriesEntryDTO> generateSimulatedRevenueData(String period, int entryCount) {
        List<TimeSeriesEntryDTO> entries = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = entryCount - 1; i >= 0; i--) {
            String label = generateLabel(period, today, i);
            BigDecimal value = generateRevenueValue(period, i);
            entries.add(new TimeSeriesEntryDTO(label, value));
        }

        return entries;
    }

    private String generateLabel(String period, LocalDate today, int offset) {
        return switch (period) {
            case "daily" -> today.minusDays(offset).format(DateTimeFormatter.ISO_LOCAL_DATE);
            case "weekly" -> {
                LocalDate weekStart = today.minusWeeks(offset);
                yield "Week of " + weekStart.format(DateTimeFormatter.ISO_LOCAL_DATE);
            }
            case "monthly" -> {
                LocalDate month = today.minusMonths(offset);
                yield month.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            }
            default -> "";
        };
    }

    private BigDecimal generateRevenueValue(String period, int offset) {
        // Generate deterministic but realistic-looking revenue values
        double baseRevenue = switch (period) {
            case "daily" -> 45000.0;
            case "weekly" -> 315000.0;
            case "monthly" -> 1350000.0;
            default -> 0.0;
        };

        // Add some variation based on offset to simulate realistic data
        double variation = Math.sin(offset * 0.5) * baseRevenue * 0.2 + baseRevenue;
        return BigDecimal.valueOf(variation).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Fetches top selling products from the order-service, sorted descending by
     * totalQuantitySold and capped at the configured top-products-limit (default 10).
     *
     * @return list of top selling products
     */
    public List<TopProductDTO> fetchTopSellingProducts() {
        int limit = dashboardProperties.getTopProductsLimit();
        Duration timeout = Duration.ofMillis(dashboardProperties.getDownstreamTimeoutMs());

        List<TopProductDTO> products = webClientBuilder.build()
                .get()
                .uri(orderServiceUrl + "/api/orders/top-products?limit=" + limit)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<TopProductDTO>>() {})
                .timeout(timeout)
                .onErrorResume(ex -> {
                    log.warn("Failed to fetch top selling products from order-service: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                })
                .block();

        if (products == null) {
            return Collections.emptyList();
        }

        // Sort descending by totalQuantitySold and cap at limit
        return products.stream()
                .sorted(Comparator.comparingLong(TopProductDTO::getTotalQuantitySold).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Fetches order status distribution from the order-service.
     * Calls the orders endpoint, groups orders by status, and returns a list of StatusCountDTO objects.
     *
     * @return list of StatusCountDTO with status name and count per status
     */
    public List<StatusCountDTO> fetchOrderStatusDistribution() {
        Duration timeout = Duration.ofMillis(dashboardProperties.getDownstreamTimeoutMs());

        try {
            String response = webClientBuilder.build()
                    .get()
                    .uri(orderServiceUrl + "/api/v1/orders")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(timeout)
                    .block();

            if (response == null || response.isBlank()) {
                log.warn("Empty response from order-service for status distribution");
                return java.util.Collections.emptyList();
            }

            JsonNode ordersArray = objectMapper.readTree(response);

            if (!ordersArray.isArray()) {
                log.warn("Unexpected response format from order-service: expected array");
                return java.util.Collections.emptyList();
            }

            java.util.Map<String, Long> statusCounts = java.util.stream.StreamSupport
                    .stream(ordersArray.spliterator(), false)
                    .map(order -> order.has("status") && !order.get("status").isNull()
                            ? order.get("status").asText()
                            : "UNKNOWN")
                    .collect(java.util.stream.Collectors.groupingBy(
                            status -> status,
                            java.util.stream.Collectors.counting()));

            return statusCounts.entrySet().stream()
                    .map(entry -> new StatusCountDTO(entry.getKey(), entry.getValue()))
                    .collect(java.util.stream.Collectors.toList());

        } catch (Exception e) {
            log.error("Error fetching order status distribution from order-service: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Fetches the most recent audit log entries as an activity feed.
     * Results are ordered by timestamp descending and limited to the configured
     * activity-feed-limit (default 20).
     *
     * @return list of ActivityFeedEntryDTO mapped from AuditLog entities
     */
    public List<ActivityFeedEntryDTO> fetchActivityFeed() {
        PageRequest pageable = PageRequest.of(0, dashboardProperties.getActivityFeedLimit());
        List<AuditLog> recentLogs = auditLogRepository.findAllByOrderByTimestampDesc(pageable);

        return recentLogs.stream()
                .map(this::mapToActivityFeedEntry)
                .collect(Collectors.toList());
    }

    private ActivityFeedEntryDTO mapToActivityFeedEntry(AuditLog auditLog) {
        return new ActivityFeedEntryDTO(
                auditLog.getAdminUsername(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getDetails(),
                auditLog.getTimestamp()
        );
    }

    // --- Helper methods for parsing downstream responses ---

    private JsonNode parseJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            log.error("Failed to parse JSON response: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    private boolean isServiceFailed(JsonNode data) {
        return data.has("__failed");
    }

    /**
     * Extracts total order count from the order service response.
     * Expects either an array of orders or an object with a totalOrders field.
     */
    private long extractOrderCount(JsonNode orderData) {
        if (orderData.isArray()) {
            return orderData.size();
        }
        if (orderData.has("totalOrders")) {
            return orderData.get("totalOrders").asLong(0);
        }
        return 0;
    }

    /**
     * Extracts total revenue by summing totalAmount fields from all orders.
     */
    private BigDecimal extractTotalRevenue(JsonNode orderData) {
        if (orderData.isArray()) {
            BigDecimal total = BigDecimal.ZERO;
            for (JsonNode order : orderData) {
                if (order.has("totalAmount")) {
                    total = total.add(new BigDecimal(order.get("totalAmount").asText("0")));
                }
            }
            return total;
        }
        if (orderData.has("totalRevenue")) {
            return new BigDecimal(orderData.get("totalRevenue").asText("0"));
        }
        return BigDecimal.ZERO;
    }

    /**
     * Extracts today's order count.
     * Expects either a todayOrders field or counts orders with today's date.
     */
    private long extractTodayOrders(JsonNode orderData) {
        if (orderData.has("todayOrders")) {
            return orderData.get("todayOrders").asLong(0);
        }
        if (orderData.isArray()) {
            String today = java.time.LocalDate.now().toString();
            long count = 0;
            for (JsonNode order : orderData) {
                if (order.has("createdAt")) {
                    String createdAt = order.get("createdAt").asText("");
                    if (createdAt.startsWith(today)) {
                        count++;
                    }
                } else if (order.has("orderDate")) {
                    String orderDate = order.get("orderDate").asText("");
                    if (orderDate.startsWith(today)) {
                        count++;
                    }
                }
            }
            return count;
        }
        return 0;
    }

    /**
     * Extracts pending order count.
     * Expects either a pendingOrders field or counts orders with PENDING status.
     */
    private long extractPendingOrders(JsonNode orderData) {
        if (orderData.has("pendingOrders")) {
            return orderData.get("pendingOrders").asLong(0);
        }
        if (orderData.isArray()) {
            long count = 0;
            for (JsonNode order : orderData) {
                if (order.has("status")) {
                    String status = order.get("status").asText("");
                    if ("PENDING".equalsIgnoreCase(status)) {
                        count++;
                    }
                }
            }
            return count;
        }
        return 0;
    }

    /**
     * Extracts user count from user service response.
     * Expects either an array of users or an object with totalUsers field.
     */
    private long extractUserCount(JsonNode userData) {
        if (userData.isArray()) {
            return userData.size();
        }
        if (userData.has("totalUsers")) {
            return userData.get("totalUsers").asLong(0);
        }
        return 0;
    }

    /**
     * Extracts new users this week count.
     * Expects either a newUsersThisWeek field or counts users created within the last 7 days.
     */
    private long extractNewUsersThisWeek(JsonNode userData) {
        if (userData.has("newUsersThisWeek")) {
            return userData.get("newUsersThisWeek").asLong(0);
        }
        if (userData.isArray()) {
            String weekAgo = java.time.LocalDate.now().minusDays(7).toString();
            long count = 0;
            for (JsonNode user : userData) {
                if (user.has("createdAt")) {
                    String createdAt = user.get("createdAt").asText("");
                    if (createdAt.compareTo(weekAgo) >= 0) {
                        count++;
                    }
                } else if (user.has("registrationDate")) {
                    String regDate = user.get("registrationDate").asText("");
                    if (regDate.compareTo(weekAgo) >= 0) {
                        count++;
                    }
                }
            }
            return count;
        }
        return 0;
    }

    /**
     * Extracts total product count from item service response.
     */
    private long extractProductCount(JsonNode itemData) {
        if (itemData.isArray()) {
            return itemData.size();
        }
        if (itemData.has("totalProducts")) {
            return itemData.get("totalProducts").asLong(0);
        }
        return 0;
    }

    /**
     * Extracts low stock count from inventory service response.
     * Counts items with available quantity below the configured threshold.
     */
    private long extractLowStockCount(JsonNode inventoryData) {
        int threshold = dashboardProperties.getLowStockThreshold();
        if (inventoryData.isArray()) {
            long count = 0;
            for (JsonNode item : inventoryData) {
                int availableQty = 0;
                if (item.has("availableQuantity")) {
                    availableQty = item.get("availableQuantity").asInt(0);
                } else if (item.has("quantity")) {
                    availableQty = item.get("quantity").asInt(0);
                }
                if (availableQty < threshold) {
                    count++;
                }
            }
            return count;
        }
        if (inventoryData.has("lowStockCount")) {
            return inventoryData.get("lowStockCount").asLong(0);
        }
        return 0;
    }

    /**
     * Extracts payment success rate from payment service response.
     * Calculates (successful / total) * 100, rounded to 1 decimal place.
     */
    private double extractPaymentSuccessRate(JsonNode paymentData) {
        if (paymentData.has("paymentSuccessRate")) {
            return paymentData.get("paymentSuccessRate").asDouble(0.0);
        }
        if (paymentData.isArray()) {
            long total = paymentData.size();
            if (total == 0) return 0.0;
            long successful = 0;
            for (JsonNode payment : paymentData) {
                if (payment.has("status")) {
                    String status = payment.get("status").asText("");
                    if ("SUCCESS".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                        successful++;
                    }
                }
            }
            double rate = ((double) successful / total) * 100.0;
            return Math.round(rate * 10.0) / 10.0;
        }
        return 0.0;
    }

    /**
     * Extracts total refund count from payment service response.
     */
    private long extractTotalRefunds(JsonNode paymentData) {
        if (paymentData.has("totalRefunds")) {
            return paymentData.get("totalRefunds").asLong(0);
        }
        if (paymentData.isArray()) {
            long count = 0;
            for (JsonNode payment : paymentData) {
                if (payment.has("status")) {
                    String status = payment.get("status").asText("");
                    if ("REFUNDED".equalsIgnoreCase(status) || "REFUND".equalsIgnoreCase(status)) {
                        count++;
                    }
                }
            }
            return count;
        }
        return 0;
    }
}
