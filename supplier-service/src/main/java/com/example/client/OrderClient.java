package com.example.client;

/** Reads orders from order-service. */
public interface OrderClient {

    /**
     * @throws org.springframework.web.server.ResponseStatusException 404 when the order does
     *         not exist, 502 when order-service could not be read
     */
    OrderView getOrder(Long orderId);
}
