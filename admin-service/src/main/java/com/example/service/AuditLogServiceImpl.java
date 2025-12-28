package com.example.service;

import com.example.entity.AuditLog;
import com.example.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogServiceImpl implements IAuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void logAction(String adminUsername, String action, String entityType, 
                         String entityId, String details, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setAdminUsername(adminUsername);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByAdmin(String adminUsername) {
        return auditLogRepository.findByAdminUsername(adminUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByEntityType(String entityType) {
        return auditLogRepository.findByEntityType(entityType);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByTimestampBetween(start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }
}
