package com.example.repository;

import com.example.entity.SupplierOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupplierOrderRepository extends JpaRepository<SupplierOrder, Long> {

    /** Fetches lines eagerly: dispatch maps the result outside a transaction. */
    @EntityGraph(attributePaths = "lines")
    Optional<SupplierOrder> findByOrderIdAndPartnerCode(Long orderId, String partnerCode);

    List<SupplierOrder> findByOrderIdOrderByIdAsc(Long orderId);

    Optional<SupplierOrder> findFirstByPartnerCodeAndPartnerOrderRef(String partnerCode, String partnerOrderRef);

    List<SupplierOrder> findAllByOrderByCreatedAtDesc();

    // status is a varchar column; the entity exposes it as an enum, so bind the name.
    @Query("select s from SupplierOrder s where s.status = :status order by s.createdAt desc")
    List<SupplierOrder> findByStatusName(@Param("status") String status);

    List<SupplierOrder> findByPartnerCodeOrderByCreatedAtDesc(String partnerCode);

    @Query("select s from SupplierOrder s where s.status = :status and s.partnerCode = :partnerCode "
         + "order by s.createdAt desc")
    List<SupplierOrder> findByStatusNameAndPartnerCode(@Param("status") String status,
                                                       @Param("partnerCode") String partnerCode);
}
