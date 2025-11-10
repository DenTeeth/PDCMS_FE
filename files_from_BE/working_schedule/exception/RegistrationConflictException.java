package com.dental.clinic.management.working_schedule.exception;

import java.time.LocalDate;
import java.util.List;

/**
 * Exception thrown when employee already has an approved registration that conflicts
 * with the requested dates.
 * Enhanced with conflicting dates and existing registration ID for better error context.
 */
public class RegistrationConflictException extends RuntimeException {
    private final List<LocalDate> conflictingDates;
    private final Integer existingRegistrationId;

    public RegistrationConflictException(List<LocalDate> conflictingDates, Integer existingRegistrationId) {
        super(buildMessage(conflictingDates, existingRegistrationId));
        this.conflictingDates = conflictingDates;
        this.existingRegistrationId = existingRegistrationId;
    }

    // Legacy constructor for backward compatibility
    public RegistrationConflictException(Integer employeeId) {
        super("Bạn đã có đăng ký ca làm việc active khác trùng giờ. Vui lòng hủy đăng ký cũ trước.");
        this.conflictingDates = null;
        this.existingRegistrationId = null;
    }

    private static String buildMessage(List<LocalDate> dates, Integer registrationId) {
        if (dates == null || dates.isEmpty()) {
            return String.format("Bạn đã có đăng ký được duyệt cho ca làm việc này (Registration ID: %d)", registrationId);
        }
        
        String dateStr;
        if (dates.size() <= 5) {
            dateStr = String.join(", ", dates.stream()
                    .map(LocalDate::toString)
                    .toArray(String[]::new));
        } else {
            String first5 = String.join(", ", dates.stream()
                    .limit(5)
                    .map(LocalDate::toString)
                    .toArray(String[]::new));
            dateStr = first5 + String.format(" (và %d ngày khác)", dates.size() - 5);
        }
        
        return String.format("Bạn đã có đăng ký được duyệt cho ca làm việc này vào %d ngày: %s (Registration ID: %d)",
                dates.size(), dateStr, registrationId);
    }

    public List<LocalDate> getConflictingDates() {
        return conflictingDates;
    }

    public Integer getExistingRegistrationId() {
        return existingRegistrationId;
    }
}
