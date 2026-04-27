package com.example.service;

import com.example.config.OrderWorkflowProperties;
import com.example.entity.OrderWorkflowPriority;
import com.example.repository.OrderWorkflowPriorityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagementServiceImpl implements IManagementService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final OrderWorkflowProperties orderWorkflowProperties;
    private final OrderWorkflowPriorityRepository orderWorkflowPriorityRepository;

    @Value("${service.urls.user}")
    private String userServiceUrl;

    @Value("${service.urls.item}")
    private String itemServiceUrl;

    @Value("${service.urls.inventory}")
    private String inventoryServiceUrl;

    @Value("${service.urls.order}")
    private String orderServiceUrl;

    @Value("${service.urls.payment}")
    private String paymentServiceUrl;

    @Value("${service.urls.logistics}")
    private String logisticsServiceUrl;

    @Value("${service.urls.return}")
    private String returnServiceUrl;

    @jakarta.annotation.PostConstruct
    public void logServiceUrls() {
        log.info("Service URLs - user: {}", userServiceUrl);
        log.info("Service URLs - item: {}", itemServiceUrl);
        log.info("Service URLs - inventory: {}", inventoryServiceUrl);
        log.info("Service URLs - order: {}", orderServiceUrl);
        log.info("Service URLs - payment: {}", paymentServiceUrl);
        log.info("Service URLs - logistics: {}", logisticsServiceUrl);
        log.info("Service URLs - return: {}", returnServiceUrl);
        ensurePrioritySeeded();
    }

    // User Management
    @Override
    public ResponseEntity<String> getAllUsers() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(userServiceUrl + "/users")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getUserById(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(userServiceUrl + "/users/" + id)
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("Error fetching user: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"User not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> createUser(String userJson) {
        try {
            String response = webClientBuilder.build()
                .post()
                .uri(userServiceUrl + "/users")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(userJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.status(HttpStatus.CREATED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("Error creating user: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> updateUser(Long id, String userJson) {
        try {
            String response = webClientBuilder.build()
                .put()
                .uri(userServiceUrl + "/users/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(userJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("Error updating user: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> deleteUser(Long id) {
        try {
            webClientBuilder.build()
                .delete()
                .uri(userServiceUrl + "/users/" + id)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting user: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // Item Management
    @Override
    public ResponseEntity<String> getAllItems() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(itemServiceUrl + "/items")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getItemById(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(itemServiceUrl + "/items/" + id)
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Item not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> createItem(String itemJson) {
        try {
            String response = webClientBuilder.build()
                .post()
                .uri(itemServiceUrl + "/items")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(itemJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.status(HttpStatus.CREATED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> updateItem(Long id, String itemJson) {
        try {
            String response = webClientBuilder.build()
                .put()
                .uri(itemServiceUrl + "/items/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(itemJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> deleteItem(Long id) {
        try {
            webClientBuilder.build()
                .delete()
                .uri(itemServiceUrl + "/items/" + id)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // Inventory Management
    @Override
    public ResponseEntity<String> getAllInventory() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(inventoryServiceUrl + "/inventory")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<String> getInventoryBySku(String sku) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(inventoryServiceUrl + "/inventory/" + sku)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Inventory not found");
        }
    }

    @Override
    public ResponseEntity<String> addInventoryItem(String inventoryJson) {
        try {
            String response = webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(inventoryJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> reserveInventory(String reservationJson) {
        try {
            String response = webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/inventory/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(reservationJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<String> releaseInventory(String releaseJson) {
        try {
            String response = webClientBuilder.build()
                .post()
                .uri(inventoryServiceUrl + "/inventory/release")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(releaseJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    // Order Management
    @Override
    public ResponseEntity<String> getAllOrders() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(orderServiceUrl + "/api/v1/orders")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getOrderById(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(orderServiceUrl + "/api/v1/orders/" + id)
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Order not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> getOrdersByCustomer(String customerId) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(orderServiceUrl + "/api/v1/orders/customer/" + customerId)
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> updateOrderStatus(Long id, String status) {
        try {
            String response = patchOrderStatus(id, status);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getOrderWorkflowActions(Long id) {
        try {
            String currentStatus = getOrderStatus(id);
            List<String> actions = availableActionsForStatus(currentStatus);
            Map<String, Integer> priorities = getEffectiveActionPriorities();
            String recommendedAction = resolveRecommendedAction(actions, priorities);

            ObjectNode response = objectMapper.createObjectNode();
            response.put("orderId", id);
            response.put("currentStatus", currentStatus);
            ArrayNode actionArray = response.putArray("availableActions");
            actions.forEach(actionArray::add);

            ObjectNode actionPriorities = response.putObject("actionPriorities");
            priorities
                .forEach(actionPriorities::put);

            if (recommendedAction != null) {
                response.put("recommendedAction", recommendedAction);
            }

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> executeOrderWorkflowAction(Long id, String action) {
        try {
            String normalizedAction = action == null ? "" : action.trim().toUpperCase();
            String currentStatus = getOrderStatus(id);
            List<String> allowedActions = availableActionsForStatus(currentStatus);

            if (!allowedActions.contains(normalizedAction)) {
                ObjectNode conflict = objectMapper.createObjectNode();
                conflict.put("error", "Action not allowed for current state");
                conflict.put("currentStatus", currentStatus);
                ArrayNode allowed = conflict.putArray("allowedActions");
                allowedActions.forEach(allowed::add);
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.writeValueAsString(conflict));
            }

            String targetStatus = mapActionToOrderStatus(normalizedAction);
            String updatedOrder = patchOrderStatus(id, targetStatus);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getOrderWorkflowPriorities() {
        try {
            Map<String, Integer> effectivePriorities = getEffectiveActionPriorities();
            ObjectNode response = objectMapper.createObjectNode();
            ObjectNode prioritiesNode = response.putObject("actionPriorities");
            effectivePriorities.forEach(prioritiesNode::put);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"Unable to load workflow priorities\"}");
        }
    }

    @Override
    public ResponseEntity<String> updateOrderWorkflowPriorities(String priorityJson) {
        try {
            JsonNode root = objectMapper.readTree(priorityJson);
            JsonNode prioritiesNode = root.path("actionPriorities");
            if (prioritiesNode.isMissingNode() || !prioritiesNode.isObject()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Payload must include object field actionPriorities\"}");
            }

            Map<String, Integer> updated = new LinkedHashMap<>();
            prioritiesNode.fields().forEachRemaining(entry -> {
                String action = entry.getKey() == null ? "" : entry.getKey().trim().toUpperCase();
                JsonNode valueNode = entry.getValue();
                if (action.isEmpty() || !valueNode.isInt()) {
                    throw new IllegalArgumentException("Each priority must use non-empty action key and integer value");
                }
                int value = valueNode.asInt();
                if (value < 0) {
                    throw new IllegalArgumentException("Priority values must be >= 0");
                }
                updated.put(action, value);
            });

            if (updated.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"actionPriorities cannot be empty\"}");
            }

            orderWorkflowPriorityRepository.deleteAllInBatch();
            List<OrderWorkflowPriority> entities = updated.entrySet().stream()
                .map(entry -> new OrderWorkflowPriority(null, entry.getKey(), entry.getValue()))
                .toList();
            orderWorkflowPriorityRepository.saveAll(entities);
            orderWorkflowProperties.setActionPriority(updated);
            return getOrderWorkflowPriorities();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"Invalid workflow priority payload\"}");
        }
    }

    // Payment Management
    @Override
    public ResponseEntity<String> getAllPayments() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(paymentServiceUrl + "/api/v1/payments")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<String> getPaymentById(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(paymentServiceUrl + "/api/v1/payments/" + id)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Payment not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> refundPayment(Long id) {
        try {
            String response = webClientBuilder.build()
                .post()
                .uri(paymentServiceUrl + "/api/v1/payments/" + id + "/refund")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // Shipment Management
    @Override
    public ResponseEntity<String> getAllShipments() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(logisticsServiceUrl + "/api/shipments")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getShipmentById(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(logisticsServiceUrl + "/api/shipments/" + id)
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Shipment not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> getShipmentByOrderId(String orderId) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(logisticsServiceUrl + "/api/shipments/order/" + orderId)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON).body("{\"error\":\"Shipment not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> getShipmentByTrackingNumber(String trackingNumber) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(logisticsServiceUrl + "/api/shipments/track/" + trackingNumber)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON).body("{\"error\":\"Shipment not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> getShipmentEvents(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(logisticsServiceUrl + "/api/shipments/" + id + "/events")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).contentType(MediaType.APPLICATION_JSON).body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> updateShipmentStatus(Long id, String statusJson) {
        try {
            String response = webClientBuilder.build()
                .put()
                .uri(logisticsServiceUrl + "/api/shipments/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(statusJson))
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // Return Management
    @Override
    public ResponseEntity<String> getAllReturns() {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(returnServiceUrl + "/api/returns")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (WebClientResponseException e) {
            // Some return-service builds do not expose GET /api/returns; use pending list as safe fallback.
            if (e.getStatusCode() == HttpStatus.METHOD_NOT_ALLOWED || e.getStatusCode() == HttpStatus.NOT_FOUND) {
                try {
                    String fallbackResponse = webClientBuilder.build()
                        .get()
                        .uri(returnServiceUrl + "/api/returns/pending")
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
                    return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(fallbackResponse);
                } catch (Exception fallbackException) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"" + fallbackException.getMessage() + "\"}");
                }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> getReturnById(Long id) {
        try {
            String response = webClientBuilder.build()
                .get()
                .uri(returnServiceUrl + "/api/returns/" + id)
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Return not found\"}");
        }
    }

    @Override
    public ResponseEntity<String> approveReturn(Long id) {
        try {
            String response = webClientBuilder.build()
                .put()
                .uri(returnServiceUrl + "/api/returns/" + id + "/approve")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> rejectReturn(Long id) {
        try {
            String response = webClientBuilder.build()
                .put()
                .uri(returnServiceUrl + "/api/returns/" + id + "/reject")
                .retrieve()
                .bodyToMono(String.class)
                .block();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    public ResponseEntity<String> resolveReturnAction(Long id, String action) {
        String normalizedAction = action == null ? "" : action.trim().toUpperCase();
        return switch (normalizedAction) {
            case "APPROVE" -> approveReturn(id);
            case "REJECT" -> rejectReturn(id);
            case "REFUND" -> processReturnRefund(id);
            default -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"Unsupported return action. Use APPROVE, REJECT or REFUND\"}");
        };
    }

    @Override
    public ResponseEntity<String> getOperationalWorkQueue() {
        try {
            ObjectNode queue = objectMapper.createObjectNode();
            queue.put("queueType", "amazon-like-admin-work-queue");
            queue.set("pendingOrders", getArrayOrEmpty(orderServiceUrl + "/api/v1/orders/status/PENDING"));
            queue.set("paymentProcessingOrders", getArrayOrEmpty(orderServiceUrl + "/api/v1/orders/status/PAYMENT_PROCESSING"));
            queue.set("readyToShipOrders", getArrayOrEmpty(orderServiceUrl + "/api/v1/orders/status/INVENTORY_RESERVED"));
            queue.set("pendingReturns", getArrayOrEmpty(returnServiceUrl + "/api/returns/pending"));
            queue.set("failedPayments", getArrayOrEmpty(paymentServiceUrl + "/api/v1/payments/status/FAILED"));

            ObjectNode summary = queue.putObject("summary");
            summary.put("pendingOrders", queue.path("pendingOrders").size());
            summary.put("paymentProcessingOrders", queue.path("paymentProcessingOrders").size());
            summary.put("readyToShipOrders", queue.path("readyToShipOrders").size());
            summary.put("pendingReturns", queue.path("pendingReturns").size());
            summary.put("failedPayments", queue.path("failedPayments").size());

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(queue));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"Unable to build work queue\"}");
        }
    }

    @Override
    public ResponseEntity<String> getSystemHealth() {
        StringBuilder health = new StringBuilder("{\"services\":[");
        String[] services = {"user", "item", "inventory", "order", "payment", "logistics", "return"};
        String[] urls = {userServiceUrl, itemServiceUrl, inventoryServiceUrl, orderServiceUrl, 
                        paymentServiceUrl, logisticsServiceUrl, returnServiceUrl};
        
        for (int i = 0; i < services.length; i++) {
            try {
                webClientBuilder.build()
                    .get()
                    .uri(urls[i] + "/actuator/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
                health.append("{\"name\":\"").append(services[i]).append("\",\"status\":\"UP\"}");
            } catch (Exception e) {
                health.append("{\"name\":\"").append(services[i]).append("\",\"status\":\"DOWN\"}");
            }
            if (i < services.length - 1) health.append(",");
        }
        health.append("]}");
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(health.toString());
    }

    private String getOrderStatus(Long id) throws Exception {
        JsonNode order = getJsonNode(orderServiceUrl + "/api/v1/orders/" + id);
        JsonNode statusNode = order.path("status");
        if (statusNode.isMissingNode() || statusNode.isNull()) {
            throw new IllegalStateException("Order status not present");
        }
        return statusNode.asText();
    }

    private String patchOrderStatus(Long id, String status) {
        String encodedStatus = UriUtils.encode(status, StandardCharsets.UTF_8);
        return webClientBuilder.build()
            .method(HttpMethod.PATCH)
            .uri(orderServiceUrl + "/api/v1/orders/" + id + "/status?status=" + encodedStatus)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    private ResponseEntity<String> processReturnRefund(Long id) {
        try {
            String response = webClientBuilder.build()
                .put()
                .uri(returnServiceUrl + "/api/returns/" + id + "/refund")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private JsonNode getJsonNode(String uri) throws Exception {
        String response = webClientBuilder.build()
            .get()
            .uri(uri)
            .retrieve()
            .bodyToMono(String.class)
            .block();
        return objectMapper.readTree(response);
    }

    private ArrayNode getArrayOrEmpty(String uri) {
        try {
            JsonNode node = getJsonNode(uri);
            if (node.isArray()) {
                return (ArrayNode) node;
            }
        } catch (WebClientResponseException ex) {
            log.warn("Work queue source unavailable: {} status={}", uri, ex.getStatusCode().value());
        } catch (Exception ex) {
            log.warn("Work queue source unavailable: {} reason={}", uri, ex.getMessage());
        }
        return objectMapper.createArrayNode();
    }

    private List<String> availableActionsForStatus(String status) {
        return switch (status) {
            case "PENDING" -> List.of("CONFIRM_PAYMENT", "CANCEL_ORDER");
            case "PAYMENT_PROCESSING" -> List.of("CONFIRM_PAYMENT", "CANCEL_ORDER");
            case "PAYMENT_COMPLETED" -> List.of("RESERVE_INVENTORY", "CANCEL_ORDER");
            case "INVENTORY_RESERVED" -> List.of("SHIP_ORDER", "CANCEL_ORDER");
            case "SHIPPED" -> List.of("MARK_DELIVERED");
            case "DELIVERED" -> List.of("ISSUE_REFUND");
            default -> Collections.emptyList();
        };
    }

    private String resolveRecommendedAction(List<String> actions, Map<String, Integer> priorities) {
        if (actions == null || actions.isEmpty()) {
            return null;
        }

        return actions.stream()
            .max(Comparator.comparingInt(action -> priorities.getOrDefault(action, 1)))
            .orElse(null);
    }

    private Map<String, Integer> getEffectiveActionPriorities() {
        ensurePrioritySeeded();
        List<OrderWorkflowPriority> entities = orderWorkflowPriorityRepository.findAllByOrderByPriorityDescActionAsc();
        if (entities.isEmpty()) {
            return orderWorkflowProperties.getActionPriority();
        }

        return entities.stream().collect(Collectors.toMap(
            OrderWorkflowPriority::getAction,
            OrderWorkflowPriority::getPriority,
            (a, b) -> b,
            LinkedHashMap::new
        ));
    }

    private void ensurePrioritySeeded() {
        if (orderWorkflowPriorityRepository.count() > 0) {
            return;
        }

        List<OrderWorkflowPriority> defaults = orderWorkflowProperties.getActionPriority().entrySet().stream()
            .map(entry -> new OrderWorkflowPriority(null, entry.getKey(), entry.getValue()))
            .toList();
        orderWorkflowPriorityRepository.saveAll(defaults);
    }

    private String mapActionToOrderStatus(String action) {
        return switch (action) {
            case "CONFIRM_PAYMENT" -> "PAYMENT_COMPLETED";
            case "RESERVE_INVENTORY" -> "INVENTORY_RESERVED";
            case "SHIP_ORDER" -> "SHIPPED";
            case "MARK_DELIVERED" -> "DELIVERED";
            case "CANCEL_ORDER" -> "CANCELLED";
            case "ISSUE_REFUND" -> "REFUNDED";
            default -> throw new IllegalArgumentException("Unsupported order action: " + action);
        };
    }
}
