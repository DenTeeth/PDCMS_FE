package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception thrown when approving a registration would exceed weekly hours limit.
 * 
 * Business Rule: PART_TIME_FLEX employees cannot work more than 21h/week (50% of 42h).
 * 
 * Rationale:
 * - Part-time employees should maintain work-life balance
 * - Prevent excessive workload
 * - Comply with part-time employment regulations
 * - Full-time = 42h/week (8h × 6 days) → Part-time limit = 21h/week
 * 
 * Error Code: WEEKLY_HOURS_LIMIT_EXCEEDED
 */
public class WeeklyHoursExceededException extends ErrorResponseException {

    public static final String ERROR_CODE = "WEEKLY_HOURS_LIMIT_EXCEEDED";
    public static final String ERROR_TYPE_URI = "https://api.dentalclinic.com/errors/weekly-hours-exceeded";

    public WeeklyHoursExceededException(Integer employeeId, double attemptedHours, double limit) {
        super(HttpStatus.BAD_REQUEST, 
              createProblemDetail(employeeId, attemptedHours, limit, null, null), 
              null);
    }

    public WeeklyHoursExceededException(Integer employeeId, double attemptedHours, double limit, 
                                       double currentHours, double newRegistrationHours) {
        super(HttpStatus.BAD_REQUEST, 
              createProblemDetail(employeeId, attemptedHours, limit, currentHours, newRegistrationHours), 
              null);
    }

    private static ProblemDetail createProblemDetail(Integer employeeId, double attemptedHours, double limit,
                                                             Double currentHours, Double newRegistrationHours) {
        String detailMessage;
        if (currentHours != null && newRegistrationHours != null) {
            detailMessage = String.format(
                "Không thể duyệt đăng ký. Nhân viên %d sẽ vượt quá giới hạn giờ làm việc hàng tuần. " +
                "Tổng giờ hiện tại: %.1fh/tuần. Đăng ký mới: %.1fh/tuần. " +
                "Tổng giờ nếu duyệt: %.1fh/tuần (giới hạn: %.1fh/tuần).",
                employeeId, currentHours, newRegistrationHours, attemptedHours, limit
            );
        } else {
            detailMessage = String.format(
                "Không thể duyệt đăng ký. Nhân viên %d sẽ vượt quá giới hạn giờ làm việc hàng tuần. " +
                "Tổng giờ nếu duyệt: %.1fh/tuần (giới hạn: %.1fh/tuần).",
                employeeId, attemptedHours, limit
            );
        }
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                detailMessage
        );
        problemDetail.setTitle("Vượt Giới Hạn Giờ Làm Việc Hàng Tuần");
        problemDetail.setType(URI.create(ERROR_TYPE_URI));
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("employeeId", employeeId);
        problemDetail.setProperty("attemptedWeeklyHours", attemptedHours);
        problemDetail.setProperty("weeklyHoursLimit", limit);
        if (currentHours != null) {
            problemDetail.setProperty("currentWeeklyHours", currentHours);
        }
        if (newRegistrationHours != null) {
            problemDetail.setProperty("newRegistrationHours", newRegistrationHours);
        }
        return problemDetail;
    }
}
