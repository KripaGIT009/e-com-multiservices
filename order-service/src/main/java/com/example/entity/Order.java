package com.example.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private String notes;

    /**
     * Delivery address as given at checkout. Snapshotted, not referenced — an order
     * must show where it was actually sent even if the customer later edits or
     * removes that address.
     */
    @Embedded
    private ShippingAddress shippingAddress;

    /**
     * Who placed it, as they were at the time. Held here so order history and the
     * admin view do not have to reach into user-service — which owns a different
     * database — and so a later profile edit cannot rewrite history.
     */
    @Column(name = "customer_name", length = 120)
    private String customerName;

    @Column(name = "customer_email", length = 160)
    private String customerEmail;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    /**
     * Courier assigned when the order was placed. Held on the order rather than
     * looked up later so the promise made to the customer is the one recorded.
     */
    @Column(name = "delivery_partner_code", length = 20)
    private String deliveryPartnerCode;

    @Column(name = "delivery_partner_name", length = 80)
    private String deliveryPartnerName;

    @Column(name = "expected_delivery")
    private LocalDateTime expectedDelivery;

    /**
     * Why {@link #deliveryPartnerCode} was chosen — MANUAL / RULE / DEFAULT / STRATEGY /
     * NONE — recorded with the courier (rule 5) so the decision stays explainable after
     * allocation rules change. Varchar rather than an enum: Hibernate 6 would add a CHECK
     * constraint that ddl-auto can never widen. Null on orders created before M1.
     */
    @Column(name = "delivery_assignment_reason", length = 20)
    private String deliveryAssignmentReason;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = OrderStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public BigDecimal calculateTotal() {
        return items.stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
