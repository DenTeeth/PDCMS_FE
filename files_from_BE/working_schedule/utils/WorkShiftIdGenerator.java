package com.dental.clinic.management.working_schedule.utils;

import java.time.LocalTime;

/**
 * Utility class for generating Work Shift IDs.
 * Format: WKS_{TIME_OF_DAY}_{SEQ}
 * Example: WKS_MORNING_01, WKS_AFTERNOON_02, WKS_NIGHT_03
 */
public class WorkShiftIdGenerator {

    private static final String PREFIX = "WKS_";
    
    // Time ranges for categorization (Clinic hours: 8:00 AM - 9:00 PM)
    private static final LocalTime MORNING_START = LocalTime.of(8, 0);   // 8:00 AM
    private static final LocalTime AFTERNOON_START = LocalTime.of(12, 0); // 12:00 PM (after lunch)
    private static final LocalTime EVENING_START = LocalTime.of(18, 0);   // 6:00 PM

    /**
     * Generate work shift ID based on start and end time.
     * @param startTime Start time of the shift
     * @param endTime End time of the shift
     * @param sequenceNumber Sequence number (auto-incremented)
     * @return Generated shift ID (e.g., WKS_MORNING_01)
     */
    public static String generateShiftId(LocalTime startTime, LocalTime endTime, int sequenceNumber) {
        String timeOfDay = determineTimeOfDay(startTime, endTime);
        return String.format("%s%s_%02d", PREFIX, timeOfDay, sequenceNumber);
    }

    /**
     * Determine time of day category based on start time.
     * Rules (Clinic hours: 8:00 AM - 9:00 PM):
     * - MORNING: starts between 08:00-11:59
     * - AFTERNOON: starts between 12:00-17:59
     * - EVENING: starts between 18:00-20:59
     */
    private static String determineTimeOfDay(LocalTime startTime, LocalTime endTime) {
        if (startTime.compareTo(EVENING_START) >= 0) {
            return "EVENING";
        } else if (startTime.compareTo(AFTERNOON_START) >= 0) {
            return "AFTERNOON";
        } else if (startTime.compareTo(MORNING_START) >= 0) {
            return "MORNING";
        } else {
            // Fallback (shouldn't happen due to validation)
            return "SHIFT";
        }
    }

    /**
     * Extract time of day from an existing shift ID.
     * @param shiftId Existing shift ID (e.g., WKS_MORNING_01)
     * @return Time of day (e.g., MORNING)
     */
    public static String extractTimeOfDay(String shiftId) {
        if (shiftId == null || !shiftId.startsWith(PREFIX)) {
            return null;
        }
        String withoutPrefix = shiftId.substring(PREFIX.length());
        int lastUnderscore = withoutPrefix.lastIndexOf('_');
        if (lastUnderscore == -1) {
            return null;
        }
        return withoutPrefix.substring(0, lastUnderscore);
    }
}
