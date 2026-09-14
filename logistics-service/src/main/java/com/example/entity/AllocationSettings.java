package com.example.entity;

import com.example.domain.AllocationStrategy;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Per-fulfilment-model allocation policy: an optional default courier, the strategy used
 * when nothing else decides, and whether a person may override the choice (§6.3).
 *
 * The key and the strategy are varchars rather than @Enumerated — Hibernate 6 adds a
 * CHECK constraint for enum columns that ddl-auto update never widens (ADR-0003).
 */
@Entity
@Table(name = "allocation_settings")
public class AllocationSettings {

    @Id
    @Column(length = 20)
    private String fulfilmentModel;

    /** NULL means no default: picking one is a business decision the seed does not make. */
    @Column(length = 20)
    private String defaultPartnerCode;

    @Column(length = 20)
    private String fallbackStrategy;

    private Boolean allowManualOverride;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() { updatedAt = LocalDateTime.now(); }

    public AllocationSettings() { }

    /** The out-of-the-box policy: FASTEST, no default, manual choice allowed — pre-M1 behaviour. */
    public static AllocationSettings defaultsFor(String fulfilmentModel) {
        AllocationSettings s = new AllocationSettings();
        s.fulfilmentModel = fulfilmentModel;
        s.fallbackStrategy = AllocationStrategy.FASTEST.name();
        s.allowManualOverride = true;
        return s;
    }

    public AllocationStrategy effectiveStrategy() {
        return AllocationStrategy.parse(fallbackStrategy).orElse(AllocationStrategy.FASTEST);
    }

    public boolean manualOverrideAllowed() {
        return allowManualOverride == null || allowManualOverride;
    }

    public String getFulfilmentModel() { return fulfilmentModel; }
    public void setFulfilmentModel(String v) { this.fulfilmentModel = v; }
    public String getDefaultPartnerCode() { return defaultPartnerCode; }
    public void setDefaultPartnerCode(String v) { this.defaultPartnerCode = v; }
    public String getFallbackStrategy() { return fallbackStrategy; }
    public void setFallbackStrategy(String v) { this.fallbackStrategy = v; }
    public Boolean getAllowManualOverride() { return allowManualOverride; }
    public void setAllowManualOverride(Boolean v) { this.allowManualOverride = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
