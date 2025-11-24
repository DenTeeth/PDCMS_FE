package com.dental.clinic.management.treatment_plans.enums;

/**
 * Status of a patient treatment plan.
 * Lifecycle: PENDING → IN_PROGRESS → COMPLETED or CANCELLED
 */
public enum TreatmentPlanStatus {
    /**
     * Plan created but not yet started
     */
    PENDING,

    /**
     * Plan is currently being executed
     */
    IN_PROGRESS,

    /**
     * All phases and items completed successfully
     */
    COMPLETED,

    /**
     * Plan was cancelled before completion
     */
    CANCELLED
}
