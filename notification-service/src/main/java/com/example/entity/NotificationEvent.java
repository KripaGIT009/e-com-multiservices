package com.example.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_events")
public class NotificationEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private String channel;

    @Column(nullable = false)
    private String templateCode;

    @Column(nullable = false)
    private String status;

    private String correlationId;

    @Column(length = 2000)
    private String payload;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NotificationEvent() {
    }

    public NotificationEvent(Long userId, String channel, String templateCode, String status, String correlationId, String payload) {
        this.userId = userId;
        this.channel = channel;
        this.templateCode = templateCode;
        this.status = status;
        this.correlationId = correlationId;
        this.payload = payload;
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
