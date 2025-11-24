package com.dental.clinic.management.exception.validation;

/**
 * Exception thrown when leave balance becomes invalid (negative)
 * after adjustment or deduction (P5.2)
 */
public class InvalidBalanceException extends RuntimeException {

    public InvalidBalanceException(String message) {
        super(message);
    }

    public InvalidBalanceException(Double totalAllowed, Double used, Double remaining) {
        super(String.format(
                "Số dư phép không hợp lệ. Total allowed: %.1f, Used: %.1f, Remaining: %.1f",
                totalAllowed, used, remaining));
    }
}
