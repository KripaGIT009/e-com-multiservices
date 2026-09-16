package com.example.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * One order placed with one dropship partner for the DROPSHIP lines of one customer
 * order. Unique on (order_id, partner_code): that constraint is what makes dispatch
 * idempotent (rule 7). Ship-to, product names and prices are snapshots (rule 5).
 */
@Entity
@Table(name = "supplier_orders",
       uniqueConstraints = @UniqueConstraint(name = "uk_supplier_order_order_partner",
                                             columnNames = {"order_id", "partner_code"}))
public class SupplierOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(length = 40)
    private String orderNumber;

    @Column(name = "partner_code", nullable = false, length = 30)
    private String partnerCode;

    /** Varchar, not @Enumerated — see DropshipPartner for why. */
    @Column(nullable = false, length = 30)
    private String status = SupplierOrderStatus.CREATED.name();

    @Column(length = 80)  private String partnerOrderRef;
    @Column(length = 60)  private String trackingNumber;
    @Column(length = 80)  private String carrierName;
    @Column(length = 512) private String trackingUrl;

    @Column(length = 120) private String shipToName;
    @Column(length = 200) private String shipToLine1;
    @Column(length = 200) private String shipToLine2;
    @Column(length = 100) private String shipToCity;
    @Column(length = 100) private String shipToState;
    @Column(length = 10)  private String shipToPostalCode;
    @Column(length = 20)  private String shipToPhone;
    /** Partners send delivery notifications here; snapshotted like the rest of the address. */
    @Column(length = 160) private String shipToEmail;

    @Column(precision = 12, scale = 2)
    private BigDecimal costTotal;

    @Column(length = 500) private String failureReason;
    @Column(length = 500) private String lastNote;

    private Integer attempts = 0;

    private LocalDateTime submittedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @OneToMany(mappedBy = "supplierOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<SupplierOrderLine> lines = new ArrayList<>();

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addLine(SupplierOrderLine line) {
        line.setSupplierOrder(this);
        lines.add(line);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public SupplierOrderStatus getStatus() { return SupplierOrderStatus.parse(status); }
    public void setStatus(SupplierOrderStatus status) { this.status = status.name(); }
    public String getPartnerOrderRef() { return partnerOrderRef; }
    public void setPartnerOrderRef(String partnerOrderRef) { this.partnerOrderRef = partnerOrderRef; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public String getCarrierName() { return carrierName; }
    public void setCarrierName(String carrierName) { this.carrierName = carrierName; }
    public String getTrackingUrl() { return trackingUrl; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }
    public String getShipToName() { return shipToName; }
    public void setShipToName(String v) { this.shipToName = v; }
    public String getShipToLine1() { return shipToLine1; }
    public void setShipToLine1(String v) { this.shipToLine1 = v; }
    public String getShipToLine2() { return shipToLine2; }
    public void setShipToLine2(String v) { this.shipToLine2 = v; }
    public String getShipToCity() { return shipToCity; }
    public void setShipToCity(String v) { this.shipToCity = v; }
    public String getShipToState() { return shipToState; }
    public void setShipToState(String v) { this.shipToState = v; }
    public String getShipToPostalCode() { return shipToPostalCode; }
    public void setShipToPostalCode(String v) { this.shipToPostalCode = v; }
    public String getShipToPhone() { return shipToPhone; }
    public void setShipToPhone(String v) { this.shipToPhone = v; }
    public String getShipToEmail() { return shipToEmail; }
    public void setShipToEmail(String v) { this.shipToEmail = v; }
    public BigDecimal getCostTotal() { return costTotal; }
    public void setCostTotal(BigDecimal costTotal) { this.costTotal = costTotal; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public String getLastNote() { return lastNote; }
    public void setLastNote(String lastNote) { this.lastNote = lastNote; }
    public Integer getAttempts() { return attempts; }
    public void setAttempts(Integer attempts) { this.attempts = attempts; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getShippedAt() { return shippedAt; }
    public void setShippedAt(LocalDateTime shippedAt) { this.shippedAt = shippedAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }
    public List<SupplierOrderLine> getLines() { return lines; }
}
