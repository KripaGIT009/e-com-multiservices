package com.example.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * "Parcels to these pincodes or states go with this courier" (§6.3 step 2).
 *
 * partnerCode is a plain code, not a foreign key, so a rule survives a partner being
 * disabled; allocation simply skips a rule whose partner is not a candidate.
 *
 * fulfilmentModel is a varchar rather than @Enumerated: Hibernate 6 adds a CHECK
 * constraint for enum columns that ddl-auto update never widens (ADR-0003). NULL means
 * the rule applies to every model.
 */
@Entity
@Table(name = "courier_rules")
public class CourierRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 20)
    private String partnerCode;

    /** Comma-separated numeric prefixes, each 1–6 digits. */
    @Column(length = 500)
    private String pincodePrefixes;

    /** Comma-separated state names, compared case-insensitively. */
    @Column(length = 500)
    private String states;

    @Column(length = 20)
    private String fulfilmentModel;

    /** Lower runs first; NULL runs after every numbered rule. */
    private Integer priority;

    private Boolean active;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    public CourierRule() { }

    /** Trimmed, non-empty entries of a comma-separated column. */
    public static List<String> split(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public List<String> prefixList() { return split(pincodePrefixes); }

    public List<String> stateList() { return split(states); }

    public boolean isEnabled() { return Boolean.TRUE.equals(active); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String v) { this.partnerCode = v; }
    public String getPincodePrefixes() { return pincodePrefixes; }
    public void setPincodePrefixes(String v) { this.pincodePrefixes = v; }
    public String getStates() { return states; }
    public void setStates(String v) { this.states = v; }
    public String getFulfilmentModel() { return fulfilmentModel; }
    public void setFulfilmentModel(String v) { this.fulfilmentModel = v; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer v) { this.priority = v; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean v) { this.active = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
