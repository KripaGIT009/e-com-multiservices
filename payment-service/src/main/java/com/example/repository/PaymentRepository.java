package com.example.repository;

import com.example.entity.Payment;
import com.example.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentId(String paymentId);

    List<Payment> findByOrderId(String orderId);

    List<Payment> findByCustomerId(String customerId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByCustomerIdAndStatus(String customerId, PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.createdAt BETWEEN :startDate AND :endDate")
    List<Payment> findPaymentsByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p WHERE p.id = :id")
    Optional<Payment> findByIdWithDetails(Long id);
}
