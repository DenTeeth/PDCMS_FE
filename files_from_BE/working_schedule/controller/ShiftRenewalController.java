package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.RenewalResponseRequest;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for FIXED shift renewal requests (Luồng 1 employees only).
 * <p>
 * ARCHITECTURE (Hybrid Scheduling):
 * - Luồng 1 (Fixed): Employees with full-time or fixed part-time schedules
 * (fixed_shift_registrations)
 * - Luồng 2 (Flex): Employees with flexible shift selections
 * (part_time_registrations)
 * <p>
 * P7 (Shift Renewal Management) ONLY applies to Luồng 1 employees.
 * <p>
 * Provides endpoints for:
 * - Viewing pending renewal invitations
 * - Responding to renewal requests (CONFIRMED: await admin finalization |
 * DECLINED: require reason)
 */
@RestController
@RequestMapping("/api/v1/registrations/renewals")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Shift Renewal", description = "APIs for fixed shift renewal management (Luồng 1 only)")
public class ShiftRenewalController {

    private final ShiftRenewalService renewalService;

    /**
     * Get all pending renewal requests for the authenticated employee.
     *
     * Only returns non-expired requests that are awaiting employee response.
     *
     * @return list of pending renewal requests
     */
    @Operation(summary = "Get pending renewal requests", description = "Retrieve all pending shift renewal invitations for the current employee", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved pending renewals"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Insufficient permissions")
    })
    @GetMapping("/pending")
    public ResponseEntity<List<ShiftRenewalResponse>> getPendingRenewals() {
        String username = getAuthenticatedUsername();
        log.info("GET /api/v1/registrations/renewals/pending - Username: {}", username);

        List<ShiftRenewalResponse> renewals = renewalService.getPendingRenewals(username);
        return ResponseEntity.ok(renewals);
    }

    /**
     * Respond to a shift renewal request.
     * <p>
     * BUSINESS LOGIC:
     * - CONFIRMED: Update status only (old registration unchanged), await Admin
     * finalization
     * - DECLINED: Require decline_reason TEXT
     * <p>
     * Employee can either confirm (agree to renew) or decline the renewal.
     * If confirmed, Admin will later finalize with custom effective_to date.
     *
     * @param renewalId the renewal request ID (VARCHAR(20) format:
     *                  SRR_YYYYMMDD_XXXXX)
     * @param request   the response (action: CONFIRMED|DECLINED, declineReason:
     *                  required if DECLINED)
     * @return updated renewal request
     */
    @Operation(summary = "Respond to renewal request", description = "Confirm or decline a shift renewal invitation. " +
            "CONFIRMED: Update status, await Admin finalization. " +
            "DECLINED: Requires decline_reason.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully responded to renewal"),
            @ApiResponse(responseCode = "400", description = "Invalid request - Invalid action or request body"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the owner of this renewal"),
            @ApiResponse(responseCode = "404", description = "Renewal request not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Renewal already responded or expired")
    })
    @PatchMapping("/{renewal_id}/respond")
    public ResponseEntity<ShiftRenewalResponse> respondToRenewal(
            @Parameter(description = "Renewal request ID", required = true) @PathVariable("renewal_id") String renewalId,

            @Parameter(description = "Response action (CONFIRMED or DECLINED)", required = true) @Valid @RequestBody RenewalResponseRequest request) {
        String username = getAuthenticatedUsername();
        log.info("PATCH /api/v1/registrations/renewals/{}/respond - Username: {}, Action: {}",
                renewalId, username, request.getAction());

        ShiftRenewalResponse response = renewalService.respondToRenewal(
                renewalId,
                username,
                request);

        return ResponseEntity.ok(response);
    }

    /**
     * Get the authenticated username from the security context.
     * This is the username stored in JWT token's "sub" field.
     *
     * @return username
     * @throws RuntimeException if authentication context is not found
     */
    private String getAuthenticatedUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("Authentication context not found");
        }

        // authentication.getName() returns the username from JWT's "sub" field
        String username = authentication.getName();
        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("Username not found in authentication context");
        }

        log.debug("Extracted username from token: {}", username);
        return username;
    }
}
