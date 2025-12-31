package com.example.itemservice.repository;

import com.example.itemservice.entity.CompareList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompareListRepository extends JpaRepository<CompareList, Long> {
    CompareList findByUserId(Long userId);
}
