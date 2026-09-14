package com.example.dropship;

/**
 * A configured adapter could not complete a call against its partner. The message is
 * recorded as the supplier order's failure reason; nothing is invented in its place (P6).
 */
public class DropshipException extends RuntimeException {

    public DropshipException(String message) {
        super(message);
    }

    public DropshipException(String message, Throwable cause) {
        super(message, cause);
    }
}
