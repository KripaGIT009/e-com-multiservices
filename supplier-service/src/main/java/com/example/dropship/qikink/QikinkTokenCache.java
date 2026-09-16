package com.example.dropship.qikink;

import java.time.Clock;
import java.time.Instant;
import java.util.function.Supplier;

/**
 * Holds Qikink's access token until shortly before it expires.
 *
 * <p>Only the token that was actually rejected is discarded on a 401, so a caller
 * holding a stale token cannot throw away a fresh one another thread just fetched.
 */
final class QikinkTokenCache {

    /** Renew this long before the advertised expiry so an in-flight call does not race it. */
    private static final long SAFETY_SECONDS = 60;

    private final Clock clock;
    private String token;
    private Instant expiresAt = Instant.EPOCH;

    QikinkTokenCache(Clock clock) {
        this.clock = clock;
    }

    /** @param fetch obtains a fresh token and its lifetime in seconds. */
    synchronized String get(Supplier<Issued> fetch) {
        if (token == null || !clock.instant().isBefore(expiresAt)) {
            Issued issued = fetch.get();
            token = issued.token();
            long lifetime = Math.max(issued.expiresInSeconds() - SAFETY_SECONDS, 30);
            expiresAt = clock.instant().plusSeconds(lifetime);
        }
        return token;
    }

    synchronized void invalidate(String rejected) {
        if (rejected != null && rejected.equals(token)) {
            token = null;
            expiresAt = Instant.EPOCH;
        }
    }

    record Issued(String token, long expiresInSeconds) {
    }
}
