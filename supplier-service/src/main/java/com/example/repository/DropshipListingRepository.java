package com.example.repository;

import com.example.entity.DropshipListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DropshipListingRepository extends JpaRepository<DropshipListing, Long> {

    Optional<DropshipListing> findByItemId(Long itemId);

    boolean existsByItemId(Long itemId);

    boolean existsByPartnerCodeAndPartnerSku(String partnerCode, String partnerSku);

    List<DropshipListing> findAllByOrderByIdDesc();

    List<DropshipListing> findByPartnerCodeOrderByIdDesc(String partnerCode);
}
