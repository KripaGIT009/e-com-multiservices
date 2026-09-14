package com.example.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A dropship supplier. A partner with no API is just this row (P3); one with an API
 * also has a {@code DropshipAdapter} whose key is {@link #integrationType}.
 *
 * <p>Enum-valued columns are plain varchar. Hibernate 6 emits a CHECK constraint for
 * {@code @Enumerated(STRING)} and {@code ddl-auto: update} never widens it, so adding
 * a status later would make inserts fail on existing databases.
 */
@Entity
@Table(name = "dropship_partners")
public class DropshipPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 200)
    private String bestFor;

    @Column(length = 80)
    private String integrationPotential;

    @Column(length = 200)
    private String website;

    @Column(nullable = false, length = 30)
    private String integrationType = "MANUAL";

    @Column(nullable = false, length = 20)
    private String onboardingStatus = OnboardingStatus.NOT_STARTED.name();

    private Boolean shipsWithOwnLogistics;

    @Column(length = 10)
    private String warehousePincode;

    @Column(length = 160)
    private String contactEmail;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private Boolean active = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isActive() { return Boolean.TRUE.equals(active); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBestFor() { return bestFor; }
    public void setBestFor(String bestFor) { this.bestFor = bestFor; }
    public String getIntegrationPotential() { return integrationPotential; }
    public void setIntegrationPotential(String v) { this.integrationPotential = v; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getIntegrationType() { return integrationType; }
    public void setIntegrationType(String integrationType) { this.integrationType = integrationType; }
    public OnboardingStatus getOnboardingStatus() { return OnboardingStatus.parse(onboardingStatus); }
    public void setOnboardingStatus(OnboardingStatus status) { this.onboardingStatus = status.name(); }
    public Boolean getShipsWithOwnLogistics() { return shipsWithOwnLogistics; }
    public void setShipsWithOwnLogistics(Boolean v) { this.shipsWithOwnLogistics = v; }
    public String getWarehousePincode() { return warehousePincode; }
    public void setWarehousePincode(String warehousePincode) { this.warehousePincode = warehousePincode; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
