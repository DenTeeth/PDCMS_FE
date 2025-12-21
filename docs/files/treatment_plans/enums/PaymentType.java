package com.dental.clinic.management.treatment_plans.enums;

/**
 * Payment type for treatment plan.
 */
public enum PaymentType {
    /**
     * Full payment upfront
     */
    FULL,

    /**
     * Payment by phases (pay for each phase when completed)
     */
    PHASED,

    /**
     * Installment payment (monthly payments)
     */
    INSTALLMENT
}
