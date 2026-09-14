package com.example.entity;

/** Where we are with a dropship partner commercially — independent of whether it is active. */
public enum OnboardingStatus {
    NOT_STARTED,
    IN_DISCUSSION,
    SANDBOX,
    LIVE,
    PAUSED;

    /** Null when the value is not a known status. */
    public static OnboardingStatus parse(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
