package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO for Admin to finalize a renewal request with custom effective_to date.
 * <p>
 * ADMIN TWO-STEP WORKFLOW:
 * 1. Employee responds CONFIRMED (via P7 API)
 * 2. Admin reviews and negotiates extension duration with employee
 * 3. Admin calls this API with custom newEffectiveTo (3 months, 1 year, etc.)
 * 4. System deactivates old registration and creates new one
 * <p>
 * USE CASE EXAMPLES:
 * - Short-term extension: 3 months trial period
 * - Standard extension: 1 year contract renewal
 * - Custom extension: 6 months based on project duration
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FinalizeRenewalRequest {

    /**
     * The renewal request ID to finalize.
     * Format: SRR_YYYYMMDD_XXXXX (e.g., SRR_20251022_00001)
     * <p>
     * VALIDATION: Must exist and have status = CONFIRMED (employee already agreed)
     */
    @NotBlank(message = "Renewal request ID is required")
    private String renewalRequestId;

    /**
     * The new effective_to date for the extended registration (admin-specified).
     * <p>
     * VALIDATION:
     * - Must be AFTER old registration's effective_to
     * - Typically old_effective_to + 3 months OR old_effective_to + 1 year
     * - Admin determines based on negotiation with employee
     * <p>
     * EXAMPLES:
     * - Old effective_to: 2025-12-31
     * - New effective_to: 2026-03-31 (3 months)
     * - New effective_to: 2026-12-31 (1 year)
     */
    @NotNull(message = "New effective_to date is required")
    private LocalDate newEffectiveTo;
}
