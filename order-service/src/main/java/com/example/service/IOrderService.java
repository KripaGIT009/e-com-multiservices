package com.example.service;

import com.example.dto.CreateOrderRequest;
import com.example.dto.OrderDTO;
import com.example.dto.UpdateDeliveryRequest;
import com.example.entity.OrderStatus;
import java.util.List;

public interface IOrderService {
    OrderDTO createOrder(CreateOrderRequest request);
    OrderDTO getOrderById(Long id);
    OrderDTO getOrderByNumber(String orderNumber);
    List<OrderDTO> getOrdersByCustomer(String customerId);
    List<OrderDTO> getOrdersByStatus(OrderStatus status);
    List<OrderDTO> getAllOrders();
    OrderDTO updateOrderStatus(Long id, OrderStatus newStatus);
    OrderDTO updateDeliveryPartner(Long id, UpdateDeliveryRequest request);
    void deleteOrder(Long id);
}
