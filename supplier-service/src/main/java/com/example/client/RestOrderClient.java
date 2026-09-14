package com.example.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RestOrderClient implements OrderClient {

    private static final Logger log = LoggerFactory.getLogger(RestOrderClient.class);

    private final RestClient restClient;

    public RestOrderClient(RestClient.Builder builder,
                           @Value("${order-service.url}") String orderServiceUrl) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3_000);
        requestFactory.setReadTimeout(10_000);
        this.restClient = builder
            .baseUrl(orderServiceUrl)
            .requestFactory(requestFactory)
            .build();
    }

    @Override
    public OrderView getOrder(Long orderId) {
        try {
            OrderView order = restClient.get()
                .uri("/api/v1/orders/{id}", orderId)
                .retrieve()
                .body(OrderView.class);
            if (order == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not read the order from order-service");
            }
            return order;
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + orderId + " not found");
        } catch (RestClientException e) {
            log.warn("Reading order {} from order-service failed: {}", orderId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Could not read the order from order-service");
        }
    }
}
