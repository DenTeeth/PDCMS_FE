package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.FinalizeRenewalRequest;
import com.dental.clinic.management.working_schedule.dto.response.ShiftRenewalResponse;
import com.dental.clinic.management.working_schedule.service.ShiftRenewalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Admin shift renewal management.
 * <p>
 * ADMIN TWO-STEP WORKFLOW:
 * 1. Employee responds CONFIRMED (via P7 Employee API)
 * 2. Admin reviews and negotiates extension duration with employee
 * 3. Admin calls Finalize API with custom effective_to date (3 months, 1 year,
 * etc.)
 * 4. System creates new registration and updates status to FINALIZED
 */
@RestController
@RequestMapping("/api/v1/admin/registrations/renewals")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Shift Renewal", description = "Admin APIs for finalizing shift renewal requests")
public class AdminRenewalController {

        private final ShiftRenewalService renewalService;

        /**
         * Finalize a renewal request with custom effective_to date.
         * <p>
         * PREREQUISITES:
         * - Renewal status must be CONFIRMED (employee agreed)
         * - Admin has negotiated extension duration with employee
         * <p>
         * WORKFLOW:
         * 1. Validate newEffectiveTo > old effective_to
         * 2. Lock old fixed_shift_registration (FOR UPDATE)
         * 3. Deactivate old: SET is_active = FALSE
         * 4. Create new registration:
         * - effective_from = old_effective_to + 1 day
         * - effective_to = admin-specified date (from request body)
         * - Copy work_shift, employee, registration_days
         * 5. Update renewal status to FINALIZED
         * <p>
         * USE CASES:
         * - 3-month trial extension: old_to + 3 months
         * - Standard 1-year renewal: old_to + 1 year
         * - Custom period: based on project/contract terms
         *
         * @param request FinalizeRenewalRequest with renewalRequestId and
         *                newEffectiveTo
         * @return ShiftRenewalResponse with FINALIZED status
         */
        @Operation(summary = "Finalize shift renewal (Admin)", description = "Admin finalizes employee's confirmed renewal with custom effective_to date. "
                        +
                        "Creates new extended registration and deactivates old one.", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Successfully finalized renewal"),
                        @ApiResponse(responseCode = "400", description = "Invalid request - newEffectiveTo must be after old effective_to"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - Missing MANAGE_FIXED_REGISTRATIONS permission"),
                        @ApiResponse(responseCode = "404", description = "Renewal request not found"),
                        @ApiResponse(responseCode = "409", description = "Conflict - Renewal not CONFIRMED by employee, or registration already inactive")
        })
        @PreAuthorize("hasAuthority('MANAGE_FIXED_REGISTRATIONS')")
        @PostMapping("/finalize")
        public ResponseEntity<ShiftRenewalResponse> finalizeRenewal(
                        @Parameter(description = "Finalize renewal request with custom effective_to date", required = true) @Valid @RequestBody FinalizeRenewalRequest request) {

                log.info("POST /api/v1/admin/registrations/renewals/finalize - Renewal ID: {}, New Effective To: {}",
                                request.getRenewalRequestId(), request.getNewEffectiveTo());

                ShiftRenewalResponse response = renewalService.finalizeRenewal(request);

                log.info("Finalized renewal {} successfully. New registration created.", request.getRenewalRequestId());
                return ResponseEntity.ok(response);
        }
}
