package com.example.service;

import com.example.common.SagaEvent;
import com.example.dto.CreateOrderRequest;
import com.example.dto.OrderDTO;
import com.example.entity.Order;
import com.example.entity.OrderItem;
import com.example.entity.OrderStatus;
import com.example.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, SagaEvent> kafkaTemplate;

    public OrderDTO createOrder(CreateOrderRequest request) {
        log.info("Creating new order for customer: {}", request.getCustomerId());

        // Generate unique order number
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Create order entity
        Order order = Order.builder()
            .orderNumber(orderNumber)
            .customerId(request.getCustomerId())
            .status(OrderStatus.PENDING)
            .notes(request.getNotes())
            .build();

        // Add order items
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<OrderItem> items = request.getItems().stream()
                .map(itemRequest -> OrderItem.builder()
                    .order(order)
                    .productId(itemRequest.getProductId())
                    .productName(itemRequest.getProductName())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(itemRequest.getUnitPrice())
                    .description(itemRequest.getDescription())
                    .build())
                .collect(Collectors.toList());
            order.setItems(items);
        }

        // Calculate total
        BigDecimal total = order.calculateTotal();
        order.setTotalAmount(total);

        // Save order
        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: {}", orderNumber);

        // Publish event to Kafka
        publishOrderCreatedEvent(savedOrder);

        return mapToDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long id) {
        log.info("Fetching order with id: {}", id);
        Order order = orderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return mapToDTO(order);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String orderNumber) {
        log.info("Fetching order with number: {}", orderNumber);
        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new RuntimeException("Order not found with number: " + orderNumber));
        return mapToDTO(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getOrdersByCustomer(String customerId) {
        log.info("Fetching orders for customer: {}", customerId);
        return orderRepository.findByCustomerId(customerId).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getOrdersByStatus(OrderStatus status) {
        log.info("Fetching orders with status: {}", status);
        return orderRepository.findByStatus(status).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        log.info("Fetching all orders");
        return orderRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public OrderDTO updateOrderStatus(Long id, OrderStatus newStatus) {
        log.info("Updating order {} status to: {}", id, newStatus);
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);

        // Publish event to Kafka
        publishOrderStatusChangedEvent(updatedOrder, oldStatus, newStatus);

        return mapToDTO(updatedOrder);
    }

    public void deleteOrder(Long id) {
        log.info("Deleting order with id: {}", id);
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found with id: " + id);
        }
        orderRepository.deleteById(id);
    }

    // Kafka event publishing methods
    private void publishOrderCreatedEvent(Order order) {
        SagaEvent event = new SagaEvent(
            order.getOrderNumber(),
            "OrderCreated",
            order.getCustomerId()
        );
        kafkaTemplate.send("order-events", event);
        log.info("Published OrderCreated event for order: {}", order.getOrderNumber());
    }

    private void publishOrderStatusChangedEvent(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        SagaEvent event = new SagaEvent(
            order.getOrderNumber(),
            "OrderStatusChanged",
            oldStatus.name() + " -> " + newStatus.name()
        );
        kafkaTemplate.send("order-events", event);
        log.info("Published OrderStatusChanged event for order: {}", order.getOrderNumber());
    }

    private OrderDTO mapToDTO(Order order) {
        return OrderDTO.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .customerId(order.getCustomerId())
            .status(order.getStatus())
            .totalAmount(order.getTotalAmount())
            .items(order.getItems().stream()
                .map(item -> com.example.dto.OrderItemDTO.builder()
                    .id(item.getId())
                    .productId(item.getProductId())
                    .productName(item.getProductName())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .description(item.getDescription())
                    .build())
                .collect(Collectors.toList()))
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .notes(order.getNotes())
            .build();
    }
}
