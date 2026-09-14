package com.example.repository;

import com.example.entity.AllocationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AllocationSettingsRepository extends JpaRepository<AllocationSettings, String> {
}
