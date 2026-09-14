package com.example.controller;

import com.example.carrier.CarrierException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Errors leave this service as {"error": "<human message>"} — the shape the BFF and the
 * admin console already read (docs/commerce-architecture.md §9). Spring's default body
 * puts the message under "message" only when server.error.include-message is set, so a
 * validation failure would otherwise reach the operator as a bare status code.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> onStatus(ResponseStatusException e) {
        String message = e.getReason() != null ? e.getReason() : e.getStatusCode().toString();
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", message));
    }

    /** A configured carrier refused or failed. Its message is shown; nothing is invented in its place. */
    @ExceptionHandler(CarrierException.class)
    public ResponseEntity<Map<String, String>> onCarrier(CarrierException e) {
        log.warn("Carrier call failed: {}", e.getMessage());
        String message = e.getMessage() != null ? e.getMessage() : "The carrier could not process the request";
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", message));
    }

    /**
     * A unique constraint lost a race the service-level check could not see — two bookings
     * of the same group at once, or a tracking number already in use.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> onConflict(DataIntegrityViolationException e) {
        log.warn("Constraint violation: {}", e.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("error", "This conflicts with an existing record; reload and try again"));
    }
}
