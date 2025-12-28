package com.example.controller;

import com.example.service.IManagementService;
import com.example.service.IAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/manage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ManagementController {

    private final IManagementService managementService;
    private final IAuditLogService auditLogService;

    // User Management
    @GetMapping("/users")
    public ResponseEntity<String> getAllUsers(HttpServletRequest request) {
        logAction(request, "VIEW", "USER", "all", "Viewed all users");
        return managementService.getAllUsers();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<String> getUserById(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "VIEW", "USER", id.toString(), "Viewed user");
        return managementService.getUserById(id);
    }

    @PostMapping("/users")
    public ResponseEntity<String> createUser(@RequestBody String userJson, HttpServletRequest request) {
        logAction(request, "CREATE", "USER", "new", "Created user");
        return managementService.createUser(userJson);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody String userJson, 
                                            HttpServletRequest request) {
        logAction(request, "UPDATE", "USER", id.toString(), "Updated user");
        return managementService.updateUser(id, userJson);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "DELETE", "USER", id.toString(), "Deleted user");
        return managementService.deleteUser(id);
    }

    // Item Management
    @GetMapping("/items")
    public ResponseEntity<String> getAllItems(HttpServletRequest request) {
        logAction(request, "VIEW", "ITEM", "all", "Viewed all items");
        return managementService.getAllItems();
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<String> getItemById(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "VIEW", "ITEM", id.toString(), "Viewed item");
        return managementService.getItemById(id);
    }

    @PostMapping("/items")
    public ResponseEntity<String> createItem(@RequestBody String itemJson, HttpServletRequest request) {
        logAction(request, "CREATE", "ITEM", "new", "Created item");
        return managementService.createItem(itemJson);
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<String> updateItem(@PathVariable Long id, @RequestBody String itemJson,
                                            HttpServletRequest request) {
        logAction(request, "UPDATE", "ITEM", id.toString(), "Updated item");
        return managementService.updateItem(id, itemJson);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<String> deleteItem(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "DELETE", "ITEM", id.toString(), "Deleted item");
        return managementService.deleteItem(id);
    }

    // Inventory Management
    @GetMapping("/inventory")
    public ResponseEntity<String> getAllInventory(HttpServletRequest request) {
        logAction(request, "VIEW", "INVENTORY", "all", "Viewed all inventory");
        return managementService.getAllInventory();
    }

    @GetMapping("/inventory/{sku}")
    public ResponseEntity<String> getInventoryBySku(@PathVariable String sku, HttpServletRequest request) {
        logAction(request, "VIEW", "INVENTORY", sku, "Viewed inventory");
        return managementService.getInventoryBySku(sku);
    }

    @PostMapping("/inventory")
    public ResponseEntity<String> addInventoryItem(@RequestBody String inventoryJson, HttpServletRequest request) {
        logAction(request, "CREATE", "INVENTORY", "new", "Added inventory item");
        return managementService.addInventoryItem(inventoryJson);
    }

    @PostMapping("/inventory/reserve")
    public ResponseEntity<String> reserveInventory(@RequestBody String reservationJson, HttpServletRequest request) {
        logAction(request, "UPDATE", "INVENTORY", "reserve", "Reserved inventory");
        return managementService.reserveInventory(reservationJson);
    }

    @PostMapping("/inventory/release")
    public ResponseEntity<String> releaseInventory(@RequestBody String releaseJson, HttpServletRequest request) {
        logAction(request, "UPDATE", "INVENTORY", "release", "Released inventory");
        return managementService.releaseInventory(releaseJson);
    }

    // Order Management
    @GetMapping("/orders")
    public ResponseEntity<String> getAllOrders(HttpServletRequest request) {
        logAction(request, "VIEW", "ORDER", "all", "Viewed all orders");
        return managementService.getAllOrders();
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<String> getOrderById(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "VIEW", "ORDER", id.toString(), "Viewed order");
        return managementService.getOrderById(id);
    }

    @GetMapping("/orders/customer/{customerId}")
    public ResponseEntity<String> getOrdersByCustomer(@PathVariable String customerId, HttpServletRequest request) {
        logAction(request, "VIEW", "ORDER", customerId, "Viewed customer orders");
        return managementService.getOrdersByCustomer(customerId);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<String> updateOrderStatus(@PathVariable Long id, @RequestParam String status,
                                                    HttpServletRequest request) {
        logAction(request, "UPDATE", "ORDER", id.toString(), "Updated order status to " + status);
        return managementService.updateOrderStatus(id, status);
    }

    // Payment Management
    @GetMapping("/payments")
    public ResponseEntity<String> getAllPayments(HttpServletRequest request) {
        logAction(request, "VIEW", "PAYMENT", "all", "Viewed all payments");
        return managementService.getAllPayments();
    }

    @GetMapping("/payments/{id}")
    public ResponseEntity<String> getPaymentById(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "VIEW", "PAYMENT", id.toString(), "Viewed payment");
        return managementService.getPaymentById(id);
    }

    @PostMapping("/payments/{id}/refund")
    public ResponseEntity<String> refundPayment(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "UPDATE", "PAYMENT", id.toString(), "Refunded payment");
        return managementService.refundPayment(id);
    }

    // Shipment Management
    @GetMapping("/shipments")
    public ResponseEntity<String> getAllShipments(HttpServletRequest request) {
        logAction(request, "VIEW", "SHIPMENT", "all", "Viewed all shipments");
        return managementService.getAllShipments();
    }

    @GetMapping("/shipments/{id}")
    public ResponseEntity<String> getShipmentById(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "VIEW", "SHIPMENT", id.toString(), "Viewed shipment");
        return managementService.getShipmentById(id);
    }

    @PutMapping("/shipments/{id}/status")
    public ResponseEntity<String> updateShipmentStatus(@PathVariable Long id, @RequestBody String statusJson,
                                                       HttpServletRequest request) {
        logAction(request, "UPDATE", "SHIPMENT", id.toString(), "Updated shipment status");
        return managementService.updateShipmentStatus(id, statusJson);
    }

    // Return Management
    @GetMapping("/returns")
    public ResponseEntity<String> getAllReturns(HttpServletRequest request) {
        logAction(request, "VIEW", "RETURN", "all", "Viewed all returns");
        return managementService.getAllReturns();
    }

    @GetMapping("/returns/{id}")
    public ResponseEntity<String> getReturnById(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "VIEW", "RETURN", id.toString(), "Viewed return");
        return managementService.getReturnById(id);
    }

    @PutMapping("/returns/{id}/approve")
    public ResponseEntity<String> approveReturn(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "UPDATE", "RETURN", id.toString(), "Approved return");
        return managementService.approveReturn(id);
    }

    @PutMapping("/returns/{id}/reject")
    public ResponseEntity<String> rejectReturn(@PathVariable Long id, HttpServletRequest request) {
        logAction(request, "UPDATE", "RETURN", id.toString(), "Rejected return");
        return managementService.rejectReturn(id);
    }

    // System Health
    @GetMapping("/health")
    public ResponseEntity<String> getSystemHealth() {
        return managementService.getSystemHealth();
    }

    private void logAction(HttpServletRequest request, String action, String entityType, 
                          String entityId, String details) {
        String adminUsername = (String) request.getAttribute("username");
        if (adminUsername == null) adminUsername = "unknown";
        auditLogService.logAction(adminUsername, action, entityType, entityId, details, 
                                  request.getRemoteAddr());
    }
}
