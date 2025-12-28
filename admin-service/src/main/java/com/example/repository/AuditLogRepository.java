package com.example.repository;

import com.example.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByAdminUsername(String adminUsername);
    List<AuditLog> findByEntityType(String entityType);
    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
