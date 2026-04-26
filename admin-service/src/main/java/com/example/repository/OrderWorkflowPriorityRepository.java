package com.example.repository;

import com.example.entity.OrderWorkflowPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderWorkflowPriorityRepository extends JpaRepository<OrderWorkflowPriority, Long> {
    List<OrderWorkflowPriority> findAllByOrderByPriorityDescActionAsc();
    Optional<OrderWorkflowPriority> findByAction(String action);
}
