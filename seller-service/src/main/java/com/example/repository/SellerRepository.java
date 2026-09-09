package com.example.repository;

import com.example.entity.Seller;
import com.example.entity.SellerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByGstin(String gstin);
    List<Seller> findByStatusOrderByCreatedAtDesc(SellerStatus status);
    List<Seller> findAllByOrderByCreatedAtDesc();
}
