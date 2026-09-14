package com.example.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * A line of a supplier order. {@code unitPrice} is what the customer paid (from the
 * order snapshot); {@code unitCost} and {@code partnerSku} come from the listing and
 * are null while the order is FAILED for want of one.
 */
@Entity
@Table(name = "supplier_order_lines")
public class SupplierOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_order_id", nullable = false)
    private SupplierOrder supplierOrder;

    private Long itemId;

    @Column(length = 200)
    private String productName;

    @Column(length = 80)
    private String partnerSku;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(precision = 12, scale = 2)
    private BigDecimal unitPrice;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SupplierOrder getSupplierOrder() { return supplierOrder; }
    public void setSupplierOrder(SupplierOrder supplierOrder) { this.supplierOrder = supplierOrder; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getPartnerSku() { return partnerSku; }
    public void setPartnerSku(String partnerSku) { this.partnerSku = partnerSku; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
}
