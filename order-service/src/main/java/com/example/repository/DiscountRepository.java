package com.example.repository;

import com.example.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    Optional<Discount> findByCodeIgnoreCase(String code);
    List<Discount> findByIsActiveTrueAndValidFromLessThanEqualAndValidUntilGreaterThan(LocalDateTime now1, LocalDateTime now2);
}
