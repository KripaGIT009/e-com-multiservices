package com.example.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column
    private String description;

    /** Fulfilling seller, snapshotted. Null means first-party stock. */
    @Column(name = "seller_id")
    private Long sellerId;

    @Column(name = "seller_name", length = 160)
    private String sellerName;

    /**
     * How this line was fulfilled — FIRST_PARTY / SELLER / DROPSHIP — snapshotted from the
     * item at checkout (rule 5), so re-classifying a listing later cannot rewrite who was
     * responsible for shipping an existing order. A plain varchar, not {@code @Enumerated}:
     * Hibernate 6 would add a CHECK constraint that ddl-auto can never widen. Null on
     * lines created before M1; the DTO resolves those from {@link #sellerId}.
     */
    @Column(name = "fulfilment_model", length = 20)
    private String fulfilmentModel;

    /** Dropship partner code at checkout (e.g. QIKINK); null unless DROPSHIP. Snapshot. */
    @Column(name = "fulfilment_partner_code", length = 40)
    private String fulfilmentPartnerCode;

    public BigDecimal getLineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
