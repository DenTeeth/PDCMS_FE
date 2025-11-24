package com.dental.clinic.management.exception;

import java.net.URI;

/**
 * Application constants for error handling and problem detail types.
 */
public final class ErrorConstants {

    public static final String ERR_CONCURRENCY_FAILURE = "error.concurrencyFailure";
    public static final String ERR_VALIDATION = "error.validation";
    public static final String PROBLEM_BASE_URL = "https://dentalclinic.com/problem";
    public static final URI DEFAULT_TYPE = URI.create(PROBLEM_BASE_URL + "/problem-with-message");
    public static final URI CONSTRAINT_VIOLATION_TYPE = URI.create(PROBLEM_BASE_URL + "/constraint-violation");
    public static final URI INVALID_PASSWORD_TYPE = URI.create(PROBLEM_BASE_URL + "/invalid-password");
    public static final URI ACCOUNT_NOT_FOUND_TYPE = URI.create(PROBLEM_BASE_URL + "/account-not-found");
    public static final URI BAD_CREDENTIALS_TYPE = URI.create(PROBLEM_BASE_URL + "/bad-credentials");
    public static final URI JWT_VALIDATION_FAILED_TYPE = URI.create(PROBLEM_BASE_URL + "/jwt-validation-failed");
    public static final URI EMPLOYEE_NOT_FOUND_TYPE = URI.create(PROBLEM_BASE_URL + "/employee-not-found");
    public static final URI PERMISSION_NOT_FOUND_TYPE = URI.create(PROBLEM_BASE_URL + "/permission-not-found");

    private ErrorConstants() {
    }
}
