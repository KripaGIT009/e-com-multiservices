package com.example.service;

import com.example.common.SagaEvent;
import com.example.dto.PaymentDTO;
import com.example.dto.ProcessPaymentRequest;
import com.example.entity.Payment;
import com.example.entity.PaymentStatus;
import com.example.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements IPaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, SagaEvent> kafkaTemplate;

    public PaymentDTO processPayment(ProcessPaymentRequest request) {
        log.info("Processing payment for order: {}", request.getOrderId());

        // Generate unique payment ID
        String paymentId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Create payment entity
        Payment payment = Payment.builder()
            .paymentId(paymentId)
            .orderId(request.getOrderId())
            .customerId(request.getCustomerId())
            .amount(request.getAmount())
            .status(PaymentStatus.PROCESSING)
            .paymentMethod(request.getPaymentMethod())
            .notes(request.getNotes())
            .build();

        // Save payment
        Payment savedPayment = paymentRepository.save(payment);
        log.info("Payment created: {}", paymentId);

        // Simulate payment processing
        boolean paymentSuccess = simulatePaymentProcessing();

        if (paymentSuccess) {
            savedPayment.setStatus(PaymentStatus.COMPLETED);
            savedPayment.setTransactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            log.info("Payment completed successfully: {}", paymentId);
        } else {
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setFailureReason("Insufficient funds or payment declined");
            log.warn("Payment failed: {}", paymentId);
        }

        savedPayment = paymentRepository.save(savedPayment);

        // Publish event to Kafka
        publishPaymentEvent(savedPayment);

        return mapToDTO(savedPayment);
    }

    private boolean simulatePaymentProcessing() {
        // Simulate 90% success rate
        return Math.random() < 0.9;
    }

    @Transactional(readOnly = true)
    public PaymentDTO getPaymentById(Long id) {
        log.info("Fetching payment with id: {}", id);
        Payment payment = paymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
        return mapToDTO(payment);
    }

    @Transactional(readOnly = true)
    public PaymentDTO getPaymentByPaymentId(String paymentId) {
        log.info("Fetching payment with paymentId: {}", paymentId);
        Payment payment = paymentRepository.findByPaymentId(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with paymentId: " + paymentId));
        return mapToDTO(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO> getPaymentsByOrderId(String orderId) {
        log.info("Fetching payments for order: {}", orderId);
        return paymentRepository.findByOrderId(orderId).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO> getPaymentsByCustomer(String customerId) {
        log.info("Fetching payments for customer: {}", customerId);
        return paymentRepository.findByCustomerId(customerId).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO> getPaymentsByStatus(PaymentStatus status) {
        log.info("Fetching payments with status: {}", status);
        return paymentRepository.findByStatus(status).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO> getAllPayments() {
        log.info("Fetching all payments");
        return paymentRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public PaymentDTO refundPayment(Long id) {
        log.info("Refunding payment with id: {}", id);
        Payment payment = paymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only completed payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        Payment refundedPayment = paymentRepository.save(payment);

        // Publish event to Kafka
        publishRefundEvent(refundedPayment);

        return mapToDTO(refundedPayment);
    }

    private void publishPaymentEvent(Payment payment) {
        String eventType = payment.getStatus() == PaymentStatus.COMPLETED 
            ? "PaymentCompleted" : "PaymentFailed";
        
        SagaEvent event = new SagaEvent(
            payment.getOrderId(),
            eventType,
            payment.getPaymentId()
        );
        kafkaTemplate.send("payment-events", event);
        log.info("Published {} event for payment: {}", eventType, payment.getPaymentId());
    }

    private void publishRefundEvent(Payment payment) {
        SagaEvent event = new SagaEvent(
            payment.getOrderId(),
            "PaymentRefunded",
            payment.getPaymentId()
        );
        kafkaTemplate.send("payment-events", event);
        log.info("Published PaymentRefunded event for payment: {}", payment.getPaymentId());
    }

    private PaymentDTO mapToDTO(Payment payment) {
        return PaymentDTO.builder()
            .id(payment.getId())
            .paymentId(payment.getPaymentId())
            .orderId(payment.getOrderId())
            .customerId(payment.getCustomerId())
            .amount(payment.getAmount())
            .status(payment.getStatus())
            .paymentMethod(payment.getPaymentMethod())
            .transactionReference(payment.getTransactionReference())
            .failureReason(payment.getFailureReason())
            .notes(payment.getNotes())
            .createdAt(payment.getCreatedAt())
            .updatedAt(payment.getUpdatedAt())
            .build();
    }
}
