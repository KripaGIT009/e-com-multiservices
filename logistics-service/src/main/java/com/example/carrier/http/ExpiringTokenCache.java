package com.example.carrier.http;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.function.Supplier;

/**
 * One bearer token, reused until it is about to expire or the carrier rejects it.
 *
 * Thread-safe: concurrent callers share a single login. {@link #invalidate(String)} only
 * drops the token it was given, so a caller holding a stale token cannot throw away a
 * fresh one another thread has just obtained.
 */
public final class ExpiringTokenCache {

    private final Duration lifetime;
    private final Clock clock;
    private String token;
    private Instant expiresAt = Instant.MIN;

    public ExpiringTokenCache(Duration lifetime) {
        this(lifetime, Clock.systemUTC());
    }

    public ExpiringTokenCache(Duration lifetime, Clock clock) {
        this.lifetime = Objects.requireNonNull(lifetime);
        this.clock = Objects.requireNonNull(clock);
    }

    /** The cached token, or a new one from {@code login} when none is valid. */
    public synchronized String get(Supplier<String> login) {
        Instant now = clock.instant();
        if (token == null || !now.isBefore(expiresAt)) {
            token = login.get();
            expiresAt = now.plus(lifetime);
        }
        return token;
    }

    public synchronized void invalidate(String rejected) {
        if (rejected != null && rejected.equals(token)) {
            token = null;
            expiresAt = Instant.MIN;
        }
    }
}
