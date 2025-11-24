package com.dental.clinic.management.utils;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Utility class for generating custom IDs in the format: PREFIXYYMMDDSSS
 * Example: CTC251016001, CTH251016002, TOR251021001
 *
 * Thread-safe implementation with daily counter reset.
 */
@Component
public class IdGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");

    // Map to store counters for each prefix and date combination
    private final ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();

    /**
     * Generate a new ID with the given prefix (3 characters)
     *
     * @param prefix The prefix for the ID (e.g., "CTC", "CTH", "TOR", "ESR")
     * @return Generated ID in format PREFIXYYMMDDSSS (e.g., CTC251016001,
     *         TOR251021001)
     */
    public synchronized String generateId(String prefix) {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DATE_FORMATTER);
        String key = prefix + dateStr;

        // Get or create counter for this prefix-date combination
        AtomicInteger counter = counters.computeIfAbsent(key, k -> new AtomicInteger(0));

        // Increment and get the next sequence number
        int sequence = counter.incrementAndGet();

        // Format: PREFIXYYMMDDSSS (e.g., CTC251016001, TOR251021001)
        return String.format("%s%s%03d", prefix, dateStr, sequence);
    }

    /**
     * Clear counters for dates before today (cleanup old entries)
     * This method can be called periodically to prevent memory growth
     */
    public void cleanupOldCounters() {
        LocalDate today = LocalDate.now();
        String todayStr = today.format(DATE_FORMATTER);

        counters.keySet().removeIf(key -> !key.contains(todayStr));
    }
}
