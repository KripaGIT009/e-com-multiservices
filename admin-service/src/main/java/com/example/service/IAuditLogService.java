package com.example.service;

import com.example.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.List;

public interface IAuditLogService {
    void logAction(String adminUsername, String action, String entityType, String entityId, String details, String ipAddress);
    List<AuditLog> getLogsByAdmin(String adminUsername);
    List<AuditLog> getLogsByEntityType(String entityType);
    List<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end);
    List<AuditLog> getAllLogs();
}
