package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;
import java.time.Instant;

/**
 * Exception thrown when trying to update a shift's time range to a different time-of-day
 * that conflicts with the shift ID prefix.
 * Example: WKS_MORNING_03 cannot be updated to afternoon hours (14:00-18:00).
 */
public class TimeOfDayMismatchException extends ErrorResponseException {

    private static final String ERROR_CODE = "TIME_OF_DAY_MISMATCH";

    public TimeOfDayMismatchException(String workShiftId, String expectedTimeOfDay, String actualTimeOfDay) {
        super(HttpStatus.CONFLICT, createProblemDetail(workShiftId, expectedTimeOfDay, actualTimeOfDay), null);
    }

    private static ProblemDetail createProblemDetail(String workShiftId, String expectedTimeOfDay, String actualTimeOfDay) {
        String message = String.format(
            "Không thể cập nhật ca làm việc '%s' vì thời gian mới (%s) không khớp với thời gian được định nghĩa trong mã ca (%s). " +
            "Ví dụ: ca có mã WKS_MORNING_* chỉ được có giờ bắt đầu từ 08:00-11:59, " +
            "WKS_AFTERNOON_* từ 12:00-17:59, WKS_EVENING_* từ 18:00-20:59.",
            workShiftId, actualTimeOfDay, expectedTimeOfDay
        );

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setType(URI.create("https://api.dentalclinic.com/errors/time-of-day-mismatch"));
        problemDetail.setTitle("Time of Day Mismatch");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("timestamp", Instant.now());
        problemDetail.setProperty("workShiftId", workShiftId);
        problemDetail.setProperty("expectedTimeOfDay", expectedTimeOfDay);
        problemDetail.setProperty("actualTimeOfDay", actualTimeOfDay);

        return problemDetail;
    }
}
