package com.example.carrier;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * One courier integration.
 *
 * A {@link com.example.entity.DeliveryPartner} names its adapter by {@link #key()} in
 * {@code integrationType}. Adding a carrier with an API is one {@code @Component}
 * implementing this interface; a carrier without one needs no code at all — it uses
 * the MANUAL adapter. See docs/commerce-architecture.md §7.
 *
 * Credentials are read from the environment by the adapter itself, never stored on the
 * partner row (CLAUDE.md rule 8).
 */
public interface CarrierAdapter {

    /** Matches {@code DeliveryPartner.integrationType}, e.g. "DELHIVERY". */
    String key();

    String label();

    /** True when every credential this adapter needs is present. */
    boolean isConfigured();

    Set<CarrierCapability> capabilities();

    /** Names of the environment variables this adapter reads. Never their values. */
    List<String> requiredEnvironment();

    /** Asks the carrier who can deliver. Empty when the carrier offers no such API. */
    default Optional<List<LiveQuote>> liveServiceability(String pickupPincode, String deliveryPincode,
                                                         int weightGrams, boolean cod) {
        return Optional.empty();
    }

    /**
     * Lodges a consignment with the carrier.
     *
     * @throws CarrierException when the carrier rejects the booking or cannot be reached.
     *         Callers must surface this — never substitute a locally generated number
     *         for an API carrier that failed.
     */
    BookingResult book(BookingRequest request);

    default Optional<TrackingSnapshot> track(String awb) {
        return Optional.empty();
    }

    default void cancel(String awb) {
        throw new UnsupportedOperationException(label() + " does not support cancellation");
    }
}
