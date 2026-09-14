package com.example.service;

/**
 * No order with the requested id or number. Mapped to 404 by
 * {@code com.example.controller.ApiExceptionHandler} — callers such as supplier-service
 * must be able to tell "does not exist" from a server failure.
 */
public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException(String message) {
        super(message);
    }

    public static OrderNotFoundException byId(Long id) {
        return new OrderNotFoundException("Order not found with id: " + id);
    }

    public static OrderNotFoundException byNumber(String orderNumber) {
        return new OrderNotFoundException("Order not found with number: " + orderNumber);
    }
}
