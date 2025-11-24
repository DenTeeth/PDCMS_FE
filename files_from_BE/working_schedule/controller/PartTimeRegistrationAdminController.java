package com.dental.clinic.management.working_schedule.controller;

// import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.domain.PartTimeRegistration;
import com.dental.clinic.management.working_schedule.dto.request.UpdateRegistrationStatusRequest;
import com.dental.clinic.management.working_schedule.dto.response.RegistrationResponse;
import com.dental.clinic.management.working_schedule.enums.RegistrationStatus;
import com.dental.clinic.management.working_schedule.exception.WeeklyHoursExceededException;
import com.dental.clinic.management.working_schedule.service.PartTimeRegistrationApprovalService;
import com.dental.clinic.management.working_schedule.service.EmployeeShiftRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for Admin/Manager to approve/reject part-time registrations.
 * 
 * NEW SPECIFICATION (Approval Workflow):
 * - View pending registration requests
 * - Approve/reject with validation
 * - Require reason for rejection
 */
@RestController
@RequestMapping("/api/v1/admin/registrations/part-time-flex")
@RequiredArgsConstructor
@Slf4j
public class PartTimeRegistrationAdminController {

    private final PartTimeRegistrationApprovalService approvalService;
    private final EmployeeShiftRegistrationService registrationService;
    // private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;
    private final com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository registrationRepository;

    /**
     * GET /api/v1/admin/registrations/part-time-flex
     * Get all registration requests (with optional status filter).
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS
     * 
     * Query params:
     * - status: PENDING, APPROVED, REJECTED, ALL (default: PENDING)
     * - employeeId: Filter by employee (optional)
     * 
     * Response: List of registrations with employee info, slot info, dates
     * 
     * @param status Status filter (default: PENDING)
     * @param employeeId Employee filter (optional)
     * @return List of registrations
     */
    @GetMapping
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<List<RegistrationResponse>> getRegistrations(
            @RequestParam(required = false, defaultValue = "PENDING") String status,
            @RequestParam(required = false) Integer employeeId) {
        log.info("Admin fetching registrations - status: {}, employeeId: {}", status, employeeId);

        List<RegistrationResponse> registrations;

        if ("PENDING".equalsIgnoreCase(status)) {
            // Get only pending registrations
            List<PartTimeRegistration> pending = approvalService.getPendingRegistrations();
            registrations = pending.stream()
                    .map(reg -> registrationService.buildResponseFromEntity(reg))
                    .collect(Collectors.toList());
        } else {
            // Get all registrations (filtered by employeeId if provided)
            registrations = registrationService.getRegistrations(employeeId);
            
            // Apply status filter if not ALL
            if (!"ALL".equalsIgnoreCase(status)) {
                RegistrationStatus filterStatus = RegistrationStatus.valueOf(status.toUpperCase());
                registrations = registrations.stream()
                        .filter(r -> r.getStatus() != null && r.getStatus().equals(filterStatus.name()))
                        .collect(Collectors.toList());
            }
        }

        log.info("Returning {} registrations", registrations.size());
        return ResponseEntity.ok(registrations);
    }

    /**
     * PATCH /api/v1/admin/registrations/part-time-flex/{registrationId}/status
     * Approve or reject a registration request.
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS
     * 
     * Request Body:
     * {
     *   "status": "APPROVED",  // or "REJECTED"
     *   "reason": "Lý do từ chối"  // Required only if REJECTED
     * }
     * 
     * Validations:
     * - Registration must be PENDING
     * - If APPROVED: Quota must not be exceeded
     * - If REJECTED: Reason is required
     * 
     * @param registrationId The registration ID to process
     * @param request The approval/rejection details
     * @return Success response
     */
    @PatchMapping("/{registrationId}/status")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<RegistrationResponse> updateStatus(
            @PathVariable Integer registrationId,
            @Valid @RequestBody UpdateRegistrationStatusRequest request) {
        
        // Get current manager ID from employee table
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        Integer managerId = employeeRepository.findByAccount_Username(username)
                .map(employee -> employee.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
        
        log.info("Manager {} updating registration {} to status: {}", 
                 managerId, registrationId, request.getStatus());

        // Pre-check registration status to avoid transactional wrapping of custom exceptions
        var regOpt = registrationRepository.findById(registrationId);
        if (regOpt.isPresent()) {
            var reg = regOpt.get();
            if (reg.getStatus() != null && !"PENDING".equalsIgnoreCase(reg.getStatus().name())) {
                throw new com.dental.clinic.management.working_schedule.exception.RegistrationInvalidStateException(registrationId, reg.getStatus().name());
            }
        }

        // Validate and process
        if ("APPROVED".equalsIgnoreCase(request.getStatus())) {
            try {
                approvalService.approveRegistration(registrationId, managerId);
                log.info("Registration {} approved by manager {}", registrationId, managerId);
            } catch (WeeklyHoursExceededException e) {
                // Auto-reject registration when weekly hours limit exceeded
                log.warn("Auto-rejecting registration {} due to weekly hours limit: {}", 
                         registrationId, e.getBody().getDetail());
                
                // Extract error message as rejection reason
                String rejectionReason = e.getBody().getDetail();
                approvalService.rejectRegistration(registrationId, managerId, rejectionReason);
                
                log.info("Registration {} auto-rejected by manager {} due to weekly hours limit", 
                         registrationId, managerId);
                
                // Re-throw to return 400 error to client with details
                throw e;
            }
        } else if ("REJECTED".equalsIgnoreCase(request.getStatus())) {
            if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Rejection reason is required");
            }
            approvalService.rejectRegistration(registrationId, managerId, request.getReason());
            log.info("Registration {} rejected by manager {}: {}", 
                     registrationId, managerId, request.getReason());
        } else {
            throw new IllegalArgumentException("Invalid status: " + request.getStatus());
        }

        // Return updated registration (fetch single entity from service)
        RegistrationResponse response = registrationService.getRegistrationById(registrationId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/registrations/part-time-flex/{registrationId}
     * Return a single registration. Visible to admins or the owning employee.
     */
    @GetMapping("/{registrationId}")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<RegistrationResponse> getRegistration(@PathVariable Integer registrationId) {
        RegistrationResponse response = registrationService.getRegistrationById(registrationId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/admin/registrations/part-time-flex/{registrationId}/can-approve
     * Check if a registration can be approved (quota validation).
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS
     * 
     * Returns:
     * {
     *   "canApprove": true,
     *   "reason": "Approval would not exceed quota"
     * }
     * 
     * @param registrationId The registration ID to check
     * @return Approval eligibility
     */
    @GetMapping("/{registrationId}/can-approve")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<CanApproveResponse> canApprove(@PathVariable Integer registrationId) {
        boolean canApprove = approvalService.canApprove(registrationId);
        String reason = canApprove 
                ? "Approval would not exceed quota" 
                : "Cannot approve: quota would be exceeded or registration is not pending";
        
        return ResponseEntity.ok(new CanApproveResponse(canApprove, reason));
    }

    /**
     * GET /api/v1/admin/registrations/part-time-flex/{registrationId}/history
     * Get detailed history/audit log for a registration.
     * Shows lifecycle: creation → approval/rejection → cancellation
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS
     * 
     * @param registrationId Registration ID
     * @return Registration history with timeline and processor info
     */
    @GetMapping("/{registrationId}/history")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<com.dental.clinic.management.working_schedule.dto.response.RegistrationHistoryResponse> getRegistrationHistory(
            @PathVariable Integer registrationId) {
        log.info("Admin fetching history for registration {}", registrationId);
        var history = approvalService.getRegistrationHistory(registrationId);
        return ResponseEntity.ok(history);
    }

    /**
     * POST /api/v1/admin/registrations/part-time-flex/bulk-approve
     * Approve multiple registrations at once.
     * Each registration is validated individually.
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS
     * 
     * Request Body:
     * {
     *   "registrationIds": [1, 2, 3, 4]
     * }
     * 
     * Response:
     * {
     *   "totalRequested": 4,
     *   "successCount": 3,
     *   "failureCount": 1,
     *   "successfulIds": [1, 2, 3],
     *   "failures": [
     *     {
     *       "registrationId": 4,
     *       "reason": "Quota would be exceeded"
     *     }
     *   ]
     * }
     * 
     * @param request Bulk approve request with registration IDs
     * @return Bulk approval result with success/failure details
     */
    @PostMapping("/bulk-approve")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<com.dental.clinic.management.working_schedule.dto.response.BulkApproveResponse> bulkApprove(
            @Valid @RequestBody com.dental.clinic.management.working_schedule.dto.request.BulkApproveRequest request) {
        log.info("Admin bulk approving {} registrations", request.getRegistrationIds().size());
        
        // Get current manager ID from employee table
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        Integer managerId = employeeRepository.findByAccount_Username(username)
                .map(employee -> employee.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
        
        var result = approvalService.bulkApprove(request.getRegistrationIds(), managerId);
        
        log.info("Bulk approve completed: {} succeeded, {} failed", result.getSuccessCount(), result.getFailureCount());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/v1/admin/registrations/part-time-flex/backfill-shifts
     * Backfill shifts for all existing APPROVED PART_TIME_FLEX registrations.
     * 
     * This endpoint is used to generate shifts for registrations that were created
     * before the shift auto-generation feature was implemented.
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS (Admin only)
     * 
     * @return Summary string with success/skip/error counts
     */
    @PostMapping("/backfill-shifts")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<String> backfillShifts() {
        log.info("🔄 Admin triggered backfill for PART_TIME_FLEX registrations");
        
        try {
            String summary = approvalService.backfillShiftsForExistingRegistrations();
            log.info("✅ Backfill completed successfully");
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("❌ Backfill failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Backfill failed: " + e.getMessage());
        }
    }
    
    /**
     * POST /api/v1/admin/registrations/part-time-flex/{registrationId}/regenerate-shifts
     * Regenerate shifts for a specific PART_TIME_FLEX registration.
     * 
     * Deletes existing shifts and creates new ones from scratch.
     * Used to fix shifts for registrations with incorrect data or recover from failed generation.
     * 
     * Permission: MANAGE_PART_TIME_REGISTRATIONS (Admin only)
     * 
     * @param registrationId The registration ID
     * @return Message with number of shifts created
     */
    @PostMapping("/{registrationId}/regenerate-shifts")
    @PreAuthorize("hasAuthority('MANAGE_PART_TIME_REGISTRATIONS')")
    public ResponseEntity<String> regenerateShifts(@PathVariable Integer registrationId) {
        log.info("🔄 Admin triggered shift regeneration for registration {}", registrationId);
        
        try {
            int shiftsCreated = approvalService.regenerateShiftsForRegistration(registrationId);
            String message = String.format("✅ Regenerated %d shifts for registration #%d", 
                    shiftsCreated, registrationId);
            log.info(message);
            return ResponseEntity.ok(message);
        } catch (com.dental.clinic.management.working_schedule.exception.RegistrationNotFoundException e) {
            log.warn("Registration {} not found", registrationId);
            return ResponseEntity.status(404).body("Registration not found: " + registrationId);
        } catch (IllegalStateException e) {
            log.warn("Cannot regenerate shifts for registration {}: {}", registrationId, e.getMessage());
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Failed to regenerate shifts for registration {}: {}", registrationId, e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to regenerate shifts: " + e.getMessage());
        }
    }

    /**
     * Response DTO for can-approve check.
     */
    public record CanApproveResponse(boolean canApprove, String reason) {}
}
