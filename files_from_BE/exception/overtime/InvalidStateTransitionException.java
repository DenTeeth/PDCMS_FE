package com.dental.clinic.management.exception.overtime;

import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when attempting an invalid state transition for an overtime request.
 * For example, trying to approve/reject/cancel a request that is not in PENDING status.
 * Returns 409 CONFLICT status.
 */
public class InvalidStateTransitionException extends ErrorResponseException {

    public InvalidStateTransitionException(String requestId, RequestStatus currentStatus, RequestStatus attemptedStatus) {
        super(HttpStatus.CONFLICT, asProblemDetail(requestId, currentStatus, attemptedStatus), null);
    }

    public InvalidStateTransitionException(String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(message), null);
    }

    private static ProblemDetail asProblemDetail(String requestId, RequestStatus currentStatus, RequestStatus attemptedStatus) {
        String message = String.format(
            "Không thể cập nhật yêu cầu %s từ trạng thái %s sang %s. Yêu cầu phải ở trạng thái PENDING.",
            requestId, currentStatus, attemptedStatus
        );
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Invalid State Transition");
        problemDetail.setProperty("code", "INVALID_STATE_TRANSITION");
        problemDetail.setProperty("message", "Không thể cập nhật yêu cầu. Yêu cầu phải ở trạng thái PENDING.");
        problemDetail.setProperty("currentStatus", currentStatus.name());
        problemDetail.setProperty("attemptedStatus", attemptedStatus.name());
        return problemDetail;
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Invalid State Transition");
        problemDetail.setProperty("code", "INVALID_STATE_TRANSITION");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
