package com.example.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * A payment a gateway has already captured and the caller has already verified.
 *
 * Distinct from {@link ProcessPaymentRequest}, which runs this service's simulated
 * processing — that path randomly declines one payment in ten, which must never be
 * applied to money Razorpay has actually taken.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordCapturedPaymentRequest {
    @NotBlank
    private String orderId;
    @NotBlank
    private String customerId;
    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;
    /** The gateway's payment id, e.g. Razorpay's pay_… — the idempotency key. */
    @NotBlank
    private String gatewayPaymentId;
    private String notes;
}
