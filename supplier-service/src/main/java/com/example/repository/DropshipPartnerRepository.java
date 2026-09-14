package com.example.repository;

import com.example.entity.DropshipPartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DropshipPartnerRepository extends JpaRepository<DropshipPartner, Long> {

    Optional<DropshipPartner> findByCode(String code);

    boolean existsByCode(String code);

    List<DropshipPartner> findAllByOrderByNameAsc();

    List<DropshipPartner> findByActiveTrueOrderByNameAsc();
}
