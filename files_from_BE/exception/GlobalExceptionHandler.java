package com.dental.clinic.management.exception;

import com.dental.clinic.management.exception.account.AccountNotVerifiedException;
import com.dental.clinic.management.exception.authentication.InvalidTokenException;
import com.dental.clinic.management.exception.authentication.TokenExpiredException;
import com.dental.clinic.management.exception.time_off.ShiftNotFoundForLeaveException;
import com.dental.clinic.management.exception.time_off.TimeOffTypeInUseException;
import com.dental.clinic.management.exception.time_off.TimeOffTypeNotFoundException;
import com.dental.clinic.management.exception.validation.DuplicateTypeCodeException;
import com.dental.clinic.management.exception.validation.InvalidBalanceException;
import com.dental.clinic.management.utils.FormatRestResponse;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Global exception handler to return consistent RestResponse format for all
 * errors.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle Spring Security BadCredentialsException.
     * Returns 401 Unauthorized.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest request) {

        log.warn("Authentication failed at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.UNAUTHORIZED.value());
        res.setMessage("Invalid username or password");
        res.setError("error.authentication.failed");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
    }

    /**
     * Handle UsernameNotFoundException from Spring Security.
     * Returns 401 Unauthorized.
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleUsernameNotFound(
            UsernameNotFoundException ex,
            HttpServletRequest request) {

        log.warn("User not found at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.UNAUTHORIZED.value());
        res.setMessage("Invalid username or password");
        res.setError("error.authentication.failed");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
    }

    /**
     * Handle AccessDeniedException from Spring Security.
     * Returns 403 Forbidden.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        log.warn("Access denied at {}: {}", request.getRequestURI(), ex.getMessage());

        // Extract required permission from request URI for holiday endpoints
        String requiredPermission = null;
        String method = request.getMethod();

        if (request.getRequestURI().contains("/api/v1/holiday")) {
            if ("POST".equals(method)) {
                requiredPermission = "CREATE_HOLIDAY";
            } else if ("PATCH".equals(method) || "PUT".equals(method)) {
                requiredPermission = "UPDATE_HOLIDAY";
            } else if ("DELETE".equals(method)) {
                requiredPermission = "DELETE_HOLIDAY";
            } else if ("GET".equals(method)) {
                requiredPermission = "VIEW_HOLIDAY";
            }
        }

        // Use Vietnamese message for consistent error responses
        String message;
        if (requiredPermission != null) {
            message = "Không có quyền thực hiện thao tác này. Yêu cầu quyền: " + requiredPermission;
        } else if (ex.getMessage() == null || ex.getMessage().equals("Access Denied")) {
            message = "Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập.";
        } else {
            message = ex.getMessage();
        }

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.FORBIDDEN.value());
        res.setMessage(message);
        res.setError("FORBIDDEN");

        // Add required permission to response data
        if (requiredPermission != null) {
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("requiredPermission", requiredPermission);
            res.setData(data);
        } else {
            res.setData(null);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }

    /**
     * Handle ALL ErrorResponseException subclasses (custom exceptions).
     * This includes: AccountNotFoundException, EmployeeNotFoundException,
     * BadRequestAlertException, JwtValidationException, etc.
     */
    @SuppressWarnings("null")
    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleErrorResponseException(
            ErrorResponseException ex,
            HttpServletRequest request) {

    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());

    // Defensive extraction of ProblemDetail body (may be null in some cases)
    org.springframework.http.ProblemDetail body = ex.getBody();
    String title = body != null ? body.getTitle() : null;
    log.warn("{} exception at {}: {}", status, request.getRequestURI(), title != null ? title : ex.getMessage());

    FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
    res.setStatusCode(status.value());

    // Extract error code and message from ProblemDetail properties if available
    Object errorCodeProperty = null;
    Object messageProperty = null;
    if (body != null && body.getProperties() != null) {
        errorCodeProperty = body.getProperties().get("errorCode");
        messageProperty = body.getProperties().get("message");
    }

    // Set error code (use errorCode property if available, otherwise fallback to generic error)
    res.setError(errorCodeProperty != null
        ? errorCodeProperty.toString()
        : "error." + status.name().toLowerCase());

        // CRITICAL FIX: Use title (detailed message) instead of messageProperty for
        // user-facing messages
        // The title contains detailed conflict information (e.g., "Room P-01 is already
        // booked during this time. Conflicting appointment: APT-20251115-001")
        // messageProperty only contains error code (e.g., "error.ROOM_SLOT_TAKEN")
        res.setMessage(ex.getBody().getTitle() != null
                ? ex.getBody().getTitle()
                : (messageProperty != null ? messageProperty.toString() : ex.getBody().getDetail()));

    res.setData(null);

    return ResponseEntity.status(status).body(res);
    }

    /**
     * Handle slot conflict exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.SlotConflictException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleSlotConflict(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Slot conflict at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("SLOT_CONFLICT");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle time overlap conflict exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.TimeOverlapConflictException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleTimeOverlapConflict(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Time overlap conflict at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("TIME_OVERLAP_CONFLICT");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle past date not allowed exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.PastDateNotAllowedException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handlePastDateNotAllowed(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Past date not allowed at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("PAST_DATE_NOT_ALLOWED");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle exceeds maximum hours exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.ExceedsMaxHoursException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleExceedsMaxHours(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Exceeds max hours at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("EXCEEDS_MAX_HOURS");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle duplicate fixed shift registration exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.fixed_registration.DuplicateFixedShiftRegistrationException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleDuplicateFixedShiftRegistration(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Duplicate fixed shift registration at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("DUPLICATE_FIXED_SHIFT_REGISTRATION");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle invalid employee type exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.fixed_registration.InvalidEmployeeTypeException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidEmployeeType(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Invalid employee type at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("INVALID_EMPLOYEE_TYPE");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle fixed registration not found exception.
     * Returns 404 Not Found.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.fixed_registration.FixedRegistrationNotFoundException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleFixedRegistrationNotFound(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Fixed registration not found at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.NOT_FOUND.value());
        res.setError("FIXED_REGISTRATION_NOT_FOUND");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
    }

    /**
     * Handle employee ID required exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.fixed_registration.EmployeeIdRequiredException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleEmployeeIdRequired(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Employee ID required at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("EMPLOYEE_ID_REQUIRED");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle registration already cancelled exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.RegistrationAlreadyCancelledException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleRegistrationAlreadyCancelled(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Registration already cancelled at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("REGISTRATION_ALREADY_CANCELLED");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle holiday conflict exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.HolidayConflictException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleHolidayConflict(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Holiday conflict at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("HOLIDAY_CONFLICT");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle duplicate holiday definition exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.holiday.DuplicateHolidayDefinitionException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleDuplicateHolidayDefinition(
            com.dental.clinic.management.exception.holiday.DuplicateHolidayDefinitionException ex,
            HttpServletRequest request) {

        log.warn("Duplicate holiday definition at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("DUPLICATE_HOLIDAY_DEFINITION");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle duplicate holiday date exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.holiday.DuplicateHolidayDateException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleDuplicateHolidayDate(
            com.dental.clinic.management.exception.holiday.DuplicateHolidayDateException ex,
            HttpServletRequest request) {

        log.warn("Duplicate holiday date at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("DUPLICATE_HOLIDAY_DATE");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle invalid date range exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.holiday.InvalidDateRangeException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidDateRange(
            com.dental.clinic.management.exception.holiday.InvalidDateRangeException ex,
            HttpServletRequest request) {

        log.warn("Invalid date range at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("INVALID_DATE_RANGE");
        res.setMessage(ex.getMessage());

        // Add start and end dates to response data
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("startDate", ex.getStartDate().toString());
        data.put("endDate", ex.getEndDate().toString());
        res.setData(data);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle shift finalized exception.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.ShiftFinalizedException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleShiftFinalized(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Shift finalized at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setError("SHIFT_FINALIZED");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle shift not found exception.
     * Returns 404 Not Found.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.ShiftNotFoundException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleShiftNotFound(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Shift not found at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.NOT_FOUND.value());
        res.setError("SHIFT_NOT_FOUND");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
    }

    /**
     * Handle related resource not found exception (Employee, WorkShift not found).
     * Returns 404 Not Found.
     */
    @ExceptionHandler({
            com.dental.clinic.management.exception.employee_shift.RelatedResourceNotFoundException.class,
            com.dental.clinic.management.exception.overtime.RelatedResourceNotFoundException.class
    })
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleRelatedResourceNotFound(
            Exception ex,
            HttpServletRequest request) {

        // Extract clean message from ErrorResponseException
        String cleanMessage;
        if (ex instanceof org.springframework.web.ErrorResponseException errorResponseEx) {
            cleanMessage = errorResponseEx.getBody().getDetail();
            log.warn("Related resource not found at {}: {}", request.getRequestURI(), cleanMessage);
        } else {
            cleanMessage = ex.getMessage();
            log.warn("Related resource not found at {}: {}", request.getRequestURI(), cleanMessage);
        }

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.NOT_FOUND.value());
        res.setError("RELATED_RESOURCE_NOT_FOUND");
        res.setMessage(cleanMessage);
        res.setData(null);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
    }

    /**
     * Handle invalid status transition exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.InvalidStatusTransitionException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidStatusTransition(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Invalid status transition at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("INVALID_STATUS_TRANSITION");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle cannot cancel batch shift exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.CannotCancelBatchShiftException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleCannotCancelBatchShift(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Cannot cancel batch shift at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("CANNOT_CANCEL_BATCH");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle cannot cancel completed shift exception.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(com.dental.clinic.management.exception.employee_shift.CannotCancelCompletedShiftException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleCannotCancelCompletedShift(
            RuntimeException ex,
            HttpServletRequest request) {

        log.warn("Cannot cancel completed shift at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setError("CANNOT_CANCEL_COMPLETED");
        res.setMessage(ex.getMessage());
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle validation errors from @Valid annotations.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        log.warn("Validation failed at {}: {}", request.getRequestURI(), ex.getMessage());

        // Collect all field errors
        java.util.List<String> missingFields = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField())
                .collect(java.util.stream.Collectors.toList());

        // Get first error message
        String errorMessage = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Validation failed");

        // For holiday endpoints, provide Vietnamese message
        if (request.getRequestURI().contains("/api/v1/holiday")) {
            String fields = String.join(", ", missingFields);
            errorMessage = "Thiếu thông tin bắt buộc: " + fields;
        }

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(errorMessage);
        res.setError("VALIDATION_ERROR");

        // Add missing fields to response data
        if (!missingFields.isEmpty()) {
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("missingFields", missingFields);
            res.setData(data);
        } else {
            res.setData(null);
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle missing required request parameters.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleMissingParameter(
            MissingServletRequestParameterException ex,
            HttpServletRequest request) {

        log.warn("Missing parameter at {}: {}", request.getRequestURI(), ex.getMessage());

        // Special handling for date parameters in shift calendar endpoint
        String message;
        if (request.getRequestURI().contains("/api/v1/shifts") &&
                (ex.getParameterName().equals("start_date") || ex.getParameterName().equals("end_date"))) {
            message = "Vui lòng cung cấp ngày bắt đầu và ngày kết thúc hợp lệ.";
        } else {
            message = "Missing required parameter: " + ex.getParameterName();
        }

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(message);
        res.setError("INVALID_DATE_RANGE");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle type mismatch errors (e.g., invalid date format).
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        log.warn("Type mismatch at {}: {}", request.getRequestURI(), ex.getMessage());

        // Special handling for date parameters
        String message;
        String errorCode = "INVALID_PARAMETER_TYPE";

        if (ex.getName().equals("startDate") || ex.getName().equals("endDate") ||
                ex.getName().equals("holidayDate") || ex.getName().equals("date")) {
            message = "Định dạng ngày không hợp lệ: " + ex.getValue() +
                    ". Định dạng yêu cầu: yyyy-MM-dd";
            errorCode = "INVALID_DATE_FORMAT";
        } else {
            message = "Invalid parameter type: " + ex.getName();
        }

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(message);
        res.setError(errorCode);

        // Add format info for date errors
        if (errorCode.equals("INVALID_DATE_FORMAT")) {
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("expectedFormat", "yyyy-MM-dd");
            data.put("example", "2025-11-03");
            res.setData(data);
        } else {
            res.setData(null);
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle IllegalArgumentException.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        log.warn("Illegal argument at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage() != null ? ex.getMessage() : "Invalid argument");
        res.setError("error.bad.request");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle IllegalStateException (business logic violations).
     * Returns 409 Conflict - used for validation failures like overlapping registrations or existing shifts.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request) {

        log.warn("Business rule violation at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setMessage(ex.getMessage() != null ? ex.getMessage() : "Business rule violation");
        res.setError("error.conflict");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle AccountNotVerifiedException.
     * Returns 403 Forbidden.
     */
    @ExceptionHandler(AccountNotVerifiedException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleAccountNotVerified(
            AccountNotVerifiedException ex,
            HttpServletRequest request) {

        log.warn("Account not verified at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.FORBIDDEN.value());
        res.setMessage(ex.getMessage());
        res.setError("error.account.not.verified");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }

    /**
     * Handle TokenExpiredException.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleTokenExpired(
            TokenExpiredException ex,
            HttpServletRequest request) {

        log.warn("Token expired at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("error.token.expired");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle InvalidTokenException.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidToken(
            InvalidTokenException ex,
            HttpServletRequest request) {

        log.warn("Invalid token at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("error.token.invalid");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle ShiftNotFoundForLeaveException (V14 Hybrid - P5.1).
     * Returns 409 Conflict.
     */
    @ExceptionHandler(ShiftNotFoundForLeaveException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleShiftNotFoundForLeave(
            ShiftNotFoundForLeaveException ex,
            HttpServletRequest request) {

        log.warn("Shift not found for leave request at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setMessage(ex.getMessage());
        res.setError("SHIFT_NOT_FOUND_FOR_LEAVE");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle DuplicateTypeCodeException (P6.1).
     * Returns 409 Conflict.
     */
    @ExceptionHandler(DuplicateTypeCodeException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleDuplicateTypeCode(
            DuplicateTypeCodeException ex,
            HttpServletRequest request) {

        log.warn("Duplicate type code at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setMessage(ex.getMessage());
        res.setError("DUPLICATE_TYPE_CODE");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle TimeOffTypeNotFoundException (P6.1).
     * Returns 404 Not Found.
     */
    @ExceptionHandler(TimeOffTypeNotFoundException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleTimeOffTypeNotFound(
            TimeOffTypeNotFoundException ex,
            HttpServletRequest request) {

        log.warn("Time-off type not found at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.NOT_FOUND.value());
        res.setMessage(ex.getMessage());
        res.setError("TIMEOFF_TYPE_NOT_FOUND");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
    }

    /**
     * Handle TimeOffTypeInUseException (P6.1).
     * Returns 409 Conflict.
     */
    @ExceptionHandler(TimeOffTypeInUseException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleTimeOffTypeInUse(
            TimeOffTypeInUseException ex,
            HttpServletRequest request) {

        log.warn("Time-off type in use at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setMessage(ex.getMessage());
        res.setError("TIMEOFF_TYPE_IN_USE");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle InvalidBalanceException (P5.2).
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(InvalidBalanceException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidBalance(
            InvalidBalanceException ex,
            HttpServletRequest request) {

        log.warn("Invalid balance at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("INVALID_BALANCE");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Fallback handler for any other unexpected exceptions.
     * Returns 500 Internal Server Error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleGenericException(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error at {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
        res.setMessage("Internal server error");
        res.setError("error.internal");
        res.setData(null);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res);
    }

    /**
     * Handle TransactionSystemException which may wrap ErrorResponseException thrown inside
     * transactional boundaries. Unwrap and delegate to the ErrorResponseException handler
     * when possible so the original 4xx response is preserved.
     */
    @ExceptionHandler(org.springframework.transaction.TransactionSystemException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleTransactionSystemException(
            org.springframework.transaction.TransactionSystemException ex,
            HttpServletRequest request) {

        Throwable cause = ex.getRootCause();
        while (cause != null) {
            if (cause instanceof org.springframework.web.ErrorResponseException ere) {
                return handleErrorResponseException((org.springframework.web.ErrorResponseException) ere, request);
            }
            cause = cause.getCause();
        }

        // If we couldn't unwrap to a known ErrorResponseException, fall back to generic handler
        return handleGenericException(ex, request);
    }

    // ============================================
    // PART-TIME FLEX REGISTRATION ERROR HANDLERS
    // ============================================

    /**
     * Handle InvalidDayOfWeekException.
     * Returns 400 Bad Request with list of invalid and valid days.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.InvalidDayOfWeekException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidDayOfWeek(
            com.dental.clinic.management.working_schedule.exception.InvalidDayOfWeekException ex,
            HttpServletRequest request) {

        log.warn("Invalid day of week at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("INVALID_DAY_OF_WEEK");

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("invalidDays", ex.getInvalidDays());
        data.put("validDays", ex.getValidDays());
        res.setData(data);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle DateOutsideSlotRangeException.
     * Returns 400 Bad Request with slot and requested date ranges.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.DateOutsideSlotRangeException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleDateOutsideSlotRange(
            com.dental.clinic.management.working_schedule.exception.DateOutsideSlotRangeException ex,
            HttpServletRequest request) {

        log.warn("Date outside slot range at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("DATE_OUTSIDE_SLOT_RANGE");

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("slotEffectiveFrom", ex.getSlotEffectiveFrom().toString());
        data.put("slotEffectiveTo", ex.getSlotEffectiveTo().toString());
        data.put("requestedFrom", ex.getRequestedFrom().toString());
        data.put("requestedTo", ex.getRequestedTo().toString());
        res.setData(data);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle NoWorkingDaysFoundException.
     * Returns 400 Bad Request with requested days and date range.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.NoWorkingDaysFoundException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleNoWorkingDaysFound(
            com.dental.clinic.management.working_schedule.exception.NoWorkingDaysFoundException ex,
            HttpServletRequest request) {

        log.warn("No working days found at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("NO_WORKING_DAYS_FOUND");

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("requestedDays", ex.getRequestedDays());
        data.put("effectiveFrom", ex.getEffectiveFrom().toString());
        data.put("effectiveTo", ex.getEffectiveTo().toString());
        data.put("suggestion", "Try expanding your date range or selecting different days of the week");
        res.setData(data);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle PastDateNotAllowedException.
     * Returns 400 Bad Request with provided date and minimum allowed date.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.PastDateNotAllowedException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handlePastDateNotAllowedForRegistration(
            com.dental.clinic.management.working_schedule.exception.PastDateNotAllowedException ex,
            HttpServletRequest request) {

        log.warn("Past date not allowed at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("PAST_DATE_NOT_ALLOWED");

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("providedDate", ex.getProvidedDate().toString());
        data.put("minimumDate", ex.getMinimumDate().toString());
        res.setData(data);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle InvalidDateRangeException.
     * Returns 400 Bad Request with effectiveFrom and effectiveTo dates.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.InvalidDateRangeException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidDateRange(
            com.dental.clinic.management.working_schedule.exception.InvalidDateRangeException ex,
            HttpServletRequest request) {

        log.warn("Invalid date range at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.BAD_REQUEST.value());
        res.setMessage(ex.getMessage());
        res.setError("INVALID_DATE_RANGE");

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("effectiveFrom", ex.getEffectiveFrom().toString());
        data.put("effectiveTo", ex.getEffectiveTo().toString());
        res.setData(data);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    /**
     * Handle RegistrationConflictException (enhanced version).
     * Returns 409 Conflict with conflicting dates and existing registration ID.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.RegistrationConflictException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleRegistrationConflict(
            com.dental.clinic.management.working_schedule.exception.RegistrationConflictException ex,
            HttpServletRequest request) {

        log.warn("Registration conflict at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.CONFLICT.value());
        res.setMessage(ex.getMessage());
        res.setError("REGISTRATION_CONFLICT");

        if (ex.getConflictingDates() != null && ex.getExistingRegistrationId() != null) {
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("conflictingDates", ex.getConflictingDates().stream()
                    .map(java.time.LocalDate::toString)
                    .collect(java.util.stream.Collectors.toList()));
            data.put("existingRegistrationId", ex.getExistingRegistrationId());
            res.setData(data);
        } else {
            res.setData(null);
        }

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    /**
     * Handle InvalidEmployeeTypeForFlexRegistrationException.
     * Returns 403 Forbidden with employee type and required type.
     */
    @ExceptionHandler(com.dental.clinic.management.working_schedule.exception.InvalidEmployeeTypeForFlexRegistrationException.class)
    public ResponseEntity<FormatRestResponse.RestResponse<Object>> handleInvalidEmployeeTypeForFlexRegistration(
            com.dental.clinic.management.working_schedule.exception.InvalidEmployeeTypeForFlexRegistrationException ex,
            HttpServletRequest request) {

        log.warn("Invalid employee type for flex registration at {}: {}", request.getRequestURI(), ex.getMessage());

        FormatRestResponse.RestResponse<Object> res = new FormatRestResponse.RestResponse<>();
        res.setStatusCode(HttpStatus.FORBIDDEN.value());
        res.setMessage(ex.getMessage());
        res.setError("INVALID_EMPLOYEE_TYPE");

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("employeeType", ex.getEmployeeType().toString());
        data.put("requiredType", ex.getRequiredType().toString());
        res.setData(data);

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }
}
