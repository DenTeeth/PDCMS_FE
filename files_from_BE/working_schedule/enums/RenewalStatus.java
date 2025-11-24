package com.dental.clinic.management.working_schedule.enums;

/**
 * Status for shift renewal requests.
 * Represents the lifecycle of a fixed shift employee's renewal invitation.
 *
 * Two-Step Workflow:
 * 1. PENDING_ACTION: Created by Job P8, awaiting employee response
 * 2. CONFIRMED: Employee agreed, awaiting admin finalization with custom
 * duration
 * 3. FINALIZED: Admin completed extension with custom effective_to date
 * 4. DECLINED: Employee rejected
 * 5. EXPIRED: Employee didn't respond in time
 */
public enum RenewalStatus {
    /**
     * Renewal request created, awaiting employee response.
     */
    PENDING_ACTION,

    /**
     * Employee confirmed the renewal.
     * Original registration is NOT modified yet.
     * Awaiting Admin to finalize with custom effective_to date (3 months, 1 year,
     * etc.).
     */
    CONFIRMED,

    /**
     * Admin has finalized the renewal (after employee CONFIRMED).
     * New registration created with admin-specified effective_to date.
     * Old registration deactivated (is_active=FALSE).
     */
    FINALIZED,

    /**
     * Employee declined the renewal.
     * The shift registration will expire as originally scheduled.
     */
    DECLINED,

    /**
     * Renewal request expired (employee did not respond in time).
     * The shift registration will expire as originally scheduled.
     */
    EXPIRED
}
