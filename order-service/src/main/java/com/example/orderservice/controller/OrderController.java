package com.example.orderservice.controller;

import com.example.orderservice.entity.Order;
import com.example.orderservice.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Long userId) {
        List<Order> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable Long orderId) {
        Optional<Order> order = orderService.getOrder(orderId);
        return order.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        Order createdOrder = orderService.createOrder(
            order.getUserId(),
            order.getItems(),
            order.getTotalAmount(),
            order.getShippingAddress()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {
        Order updatedOrder = orderService.updateOrderStatus(orderId, status);
        if (updatedOrder != null) {
            return ResponseEntity.ok(updatedOrder);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long orderId) {
        Order cancelledOrder = orderService.cancelOrder(orderId);
        if (cancelledOrder != null) {
            return ResponseEntity.ok(cancelledOrder);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{orderId}/ship")
    public ResponseEntity<Order> shipOrder(
            @PathVariable Long orderId,
            @RequestParam String trackingNumber) {
        Order shippedOrder = orderService.shipOrder(orderId, trackingNumber);
        if (shippedOrder != null) {
            return ResponseEntity.ok(shippedOrder);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<Order> trackOrder(@PathVariable String trackingNumber) {
        List<Order> orders = orderService.getUserOrders(1L); // This would need proper implementation
        // For now, returning placeholder
        return ResponseEntity.ok(new Order());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable String status) {
        List<Order> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }
}
