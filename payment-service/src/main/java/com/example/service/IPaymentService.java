package com.example.service;

import com.example.dto.PaymentDTO;
import com.example.dto.ProcessPaymentRequest;
import com.example.entity.PaymentStatus;
import java.util.List;

public interface IPaymentService {
    PaymentDTO processPayment(ProcessPaymentRequest request);
    PaymentDTO getPaymentById(Long id);
    PaymentDTO getPaymentByPaymentId(String paymentId);
    List<PaymentDTO> getPaymentsByOrderId(String orderId);
    List<PaymentDTO> getPaymentsByCustomer(String customerId);
    List<PaymentDTO> getPaymentsByStatus(PaymentStatus status);
    List<PaymentDTO> getAllPayments();
    PaymentDTO refundPayment(Long id);
}
