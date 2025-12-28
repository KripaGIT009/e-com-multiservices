package com.example.repository;

import com.example.entity.Return;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRepository extends JpaRepository<Return, Long> {

    List<Return> findByUserId(Long userId);

    List<Return> findByOrderId(Long orderId);

    Optional<Return> findByOrderIdAndUserId(Long orderId, Long userId);

    List<Return> findByStatus(String status);
}
