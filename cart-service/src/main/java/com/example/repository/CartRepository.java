package com.example.repository;

import com.example.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    List<Cart> findAllByUserIdOrderByIdDesc(Long userId);

    default Optional<Cart> findByUserId(Long userId) {
        List<Cart> carts = findAllByUserIdOrderByIdDesc(userId);
        return carts.isEmpty() ? Optional.empty() : Optional.of(carts.get(0));
    }
}
