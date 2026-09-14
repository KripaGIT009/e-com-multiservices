package com.example.repository;

import com.example.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findBySku(String sku);

    List<Item> findBySellerId(Long sellerId);

    List<Item> findByFulfilmentModelAndFulfilmentPartnerCode(String fulfilmentModel, String fulfilmentPartnerCode);

    /** Exact stored model — used for DROPSHIP, which no legacy (null-model) row can be. */
    List<Item> findByFulfilmentModel(String fulfilmentModel);

    /**
     * SELLER items, including legacy rows with a null model and a sellerId
     * (see {@link Item#resolvedFulfilmentModel()}).
     */
    @Query("SELECT i FROM Item i WHERE i.fulfilmentModel = :model "
            + "OR (i.fulfilmentModel IS NULL AND i.sellerId IS NOT NULL)")
    List<Item> findSellerFulfilled(@Param("model") String model);

    /**
     * FIRST_PARTY items, including legacy rows with a null model and no sellerId
     * (see {@link Item#resolvedFulfilmentModel()}).
     */
    @Query("SELECT i FROM Item i WHERE i.fulfilmentModel = :model "
            + "OR (i.fulfilmentModel IS NULL AND i.sellerId IS NULL)")
    List<Item> findFirstPartyFulfilled(@Param("model") String model);
}
