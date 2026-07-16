package com.example.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "token:blacklist:";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    /**
     * Blacklist a token. The entry expires after the token's TTL so Redis
     * doesn't accumulate stale entries indefinitely.
     */
    public void blacklist(String token) {
        String key = BLACKLIST_PREFIX + token;
        redisTemplate.opsForValue().set(key, "1", jwtExpirationMs, TimeUnit.MILLISECONDS);
    }

    /**
     * Check if a token has been blacklisted.
     */
    public boolean isBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
