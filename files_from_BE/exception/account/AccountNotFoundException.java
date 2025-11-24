package com.dental.clinic.management.exception.account;

import com.dental.clinic.management.exception.ErrorConstants;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Thrown when an account is not found (ProblemDetail type:
 * ACCOUNT_NOT_FOUND_TYPE).
 */
public class AccountNotFoundException extends ErrorResponseException {

    public AccountNotFoundException(String username) {
        super(
                HttpStatus.NOT_FOUND,
                createProblemDetail(username),
                null);
    }

    private static ProblemDetail createProblemDetail(String username) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problemDetail.setType(ErrorConstants.ACCOUNT_NOT_FOUND_TYPE);
        problemDetail.setTitle("Account not found");
        problemDetail.setProperty("message", "error.account.notfound");
        problemDetail.setProperty("params", username);
        return problemDetail;
    }
}
