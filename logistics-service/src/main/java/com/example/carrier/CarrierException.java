package com.example.carrier;

/** A carrier refused or could not process a request. The message is safe to show an operator. */
public class CarrierException extends RuntimeException {
    public CarrierException(String message) {
        super(message);
    }

    public CarrierException(String message, Throwable cause) {
        super(message, cause);
    }
}
