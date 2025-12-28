package com.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagementServiceImpl implements IManagementService {

    private final WebClient.Builder webClientBuilder;

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
            String response = webClientBuilder.build()
                .put()
                .uri(orderServiceUrl + "/api/v1/orders/" + id + "/status?status=" + status)
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
}
