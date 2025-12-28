package com.example.common;

public record SagaEvent(String orderId, String type, String data) {}
