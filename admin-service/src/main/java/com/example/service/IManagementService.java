package com.example.service;

import org.springframework.http.ResponseEntity;

public interface IManagementService {
    // User Management
    ResponseEntity<String> getAllUsers();
    ResponseEntity<String> getUserById(Long id);
    ResponseEntity<String> createUser(String userJson);
    ResponseEntity<String> updateUser(Long id, String userJson);
    ResponseEntity<String> deleteUser(Long id);

    // Item Management
    ResponseEntity<String> getAllItems();
    ResponseEntity<String> getItemById(Long id);
    ResponseEntity<String> createItem(String itemJson);
    ResponseEntity<String> updateItem(Long id, String itemJson);
    ResponseEntity<String> deleteItem(Long id);

    // Inventory Management
    ResponseEntity<String> getAllInventory();
    ResponseEntity<String> getInventoryBySku(String sku);
    ResponseEntity<String> addInventoryItem(String inventoryJson);
    ResponseEntity<String> reserveInventory(String reservationJson);
    ResponseEntity<String> releaseInventory(String releaseJson);

    // Order Management
    ResponseEntity<String> getAllOrders();
    ResponseEntity<String> getOrderById(Long id);
    ResponseEntity<String> getOrdersByCustomer(String customerId);
    ResponseEntity<String> updateOrderStatus(Long id, String status);

    // Payment Management
    ResponseEntity<String> getAllPayments();
    ResponseEntity<String> getPaymentById(Long id);
    ResponseEntity<String> refundPayment(Long id);

    // Shipment Management
    ResponseEntity<String> getAllShipments();
    ResponseEntity<String> getShipmentById(Long id);
    ResponseEntity<String> updateShipmentStatus(Long id, String statusJson);

    // Return Management
    ResponseEntity<String> getAllReturns();
    ResponseEntity<String> getReturnById(Long id);
    ResponseEntity<String> approveReturn(Long id);
    ResponseEntity<String> rejectReturn(Long id);

    // System Health
    ResponseEntity<String> getSystemHealth();
}
