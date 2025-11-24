package com.dental.clinic.management.authentication.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;

/**
 * Simple in-memory token blacklist service.
 * For production, consider using Redis or database.
 */
@Service
public class TokenBlacklistService {

    private final ConcurrentHashMap<String, Long> blacklistedTokens = new ConcurrentHashMap<>();
    private final JwtDecoder jwtDecoder;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public TokenBlacklistService(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
        // Cleanup expired tokens every hour
        scheduler.scheduleAtFixedRate(this::cleanupExpiredTokens, 1, 1, TimeUnit.HOURS);
    }

    /**
     * Add token to blacklist when user logs out
     */
    public void blacklistToken(String token) {
        try {
            Jwt jwt = jwtDecoder.decode(token);
            @SuppressWarnings("null")
            Long expiryTime = jwt.getExpiresAt() != null ? jwt.getExpiresAt().getEpochSecond() : null;
            if (expiryTime != null) {
                blacklistedTokens.put(token, expiryTime);
            }
        } catch (Exception e) {
            // Token already invalid, no need to blacklist
        }
    }

    /**
     * Check if token is blacklisted
     */
    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokens.containsKey(token);
    }

    /**
     * Remove expired tokens from blacklist
     */
    private void cleanupExpiredTokens() {
        long currentTime = System.currentTimeMillis() / 1000;
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < currentTime);
    }

    /**
     * Shutdown scheduler gracefully when application stops
     * This prevents memory leak warnings
     */
    @PreDestroy
    public void destroy() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
            try {
                // Wait for existing tasks to complete
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    // Force shutdown if tasks don't complete in time
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                // Force shutdown if interrupted
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}
