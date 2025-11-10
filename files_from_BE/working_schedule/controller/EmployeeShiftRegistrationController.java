package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.CreateRegistrationRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateEffectiveToRequest;
import com.dental.clinic.management.working_schedule.dto.response.AvailableSlotResponse;
import com.dental.clinic.management.working_schedule.dto.response.RegistrationResponse;
import com.dental.clinic.management.working_schedule.dto.response.SlotDetailResponse;
import com.dental.clinic.management.working_schedule.service.EmployeeShiftRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Part-Time Registration (PART_TIME_FLEX employees).
 * 
 * NEW SPECIFICATION (Approval Workflow):
 * - Employees submit registration requests with flexible dates
 * - Requests go to PENDING status
 * - Manager must approve before employee can work
 * - Only APPROVED registrations count toward quota
 */
@RestController
@RequestMapping("/api/v1/registrations/part-time-flex")
@RequiredArgsConstructor
@Slf4j
public class EmployeeShiftRegistrationController {

    private final EmployeeShiftRegistrationService registrationService;

    /**
     * GET /api/v1/registrations/part-time-flex/available-slots
     * Get available slots for employee to register (NEW: dynamic quota).
     *
     * Permission: VIEW_AVAILABLE_SLOTS
     * 
     * NEW SPECIFICATION:
     * - Only count APPROVED registrations
     * - Show slots with any day having availability
     *
     * @return List of available slots with quota info
     */
    @GetMapping("/available-slots")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots() {
        log.info("REST request to get available slots");
        List<AvailableSlotResponse> slots = registrationService.getAvailableSlots();
        return ResponseEntity.ok(slots);
    }

    /**
     * GET /api/v1/registrations/part-time/slots/{slotId}/details
     * Get detailed availability information for a specific slot.
     * Shows month-by-month breakdown to help employees make informed decisions.
     *
     * Permission: VIEW_AVAILABLE_SLOTS
     * 
     * @param slotId The slot ID to get details for
     * @return Detailed slot information with monthly availability breakdown
     */
    @GetMapping("/slots/{slotId}/details")
    public ResponseEntity<SlotDetailResponse> getSlotDetail(@PathVariable Long slotId) {
        log.info("REST request to get slot detail for slot {}", slotId);
        SlotDetailResponse detail = registrationService.getSlotDetail(slotId);
        return ResponseEntity.ok(detail);
    }

    /**
     * POST /api/v1/registrations/part-time
     * Submit registration request (NEW: goes to PENDING status).
     *
     * Permission: CREATE_REGISTRATION
     * 
     * NEW SPECIFICATION:
     * - Employee provides flexible effectiveFrom and effectiveTo
     * - Request goes to PENDING status (not immediately active)
     * - Manager must approve before employee can work
     * - Dates must be within slot's effective range
     *
     * Request Body:
     * {
     *   "partTimeSlotId": 1,
     *   "effectiveFrom": "2025-11-01",
     *   "effectiveTo": "2025-11-17"
     * }
     *
     * @param request Registration details with flexible dates
     * @return Created registration (status: PENDING)
     */
    @PostMapping
    public ResponseEntity<RegistrationResponse> claimSlot(
            @Valid @RequestBody CreateRegistrationRequest request) {
        log.info("REST request to submit registration for slot {}", request.getPartTimeSlotId());
        RegistrationResponse response = registrationService.claimSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/registrations/part-time
     * Get registrations (employee sees own, admin sees all or filtered).
     *
     * Permission:
     * - MANAGE_REGISTRATIONS_ALL: View all or filter by employeeId
     * - VIEW_REGISTRATIONS_OWN: View only own registrations
     * 
     * NEW: Shows status (PENDING, APPROVED, REJECTED)
     *
     * @param employeeId Optional filter (admin only)
     * @return List of registrations
     */
    @GetMapping
    public ResponseEntity<List<RegistrationResponse>> getRegistrations(
            @RequestParam(required = false) Integer employeeId) {
        log.info("REST request to get registrations, filter employeeId: {}", employeeId);
        List<RegistrationResponse> registrations = registrationService.getRegistrations(employeeId);
        return ResponseEntity.ok(registrations);
    }

    /**
     * DELETE /api/v1/registrations/part-time/{registrationId}
     * Cancel registration (soft delete - set isActive = false).
     *
     * Permission:
     * - MANAGE_REGISTRATIONS_ALL: Can cancel any registration
     * - CANCEL_REGISTRATION_OWN: Can cancel only own registrations
     * 
     * NEW: Can cancel PENDING or APPROVED registrations
     *
     * @param registrationId Registration ID to cancel
     * @return 204 No Content
     */
    @DeleteMapping("/{registrationId}")
    public ResponseEntity<Void> cancelRegistration(@PathVariable Integer registrationId) {
        log.info("REST request to cancel registration {}", registrationId);
        registrationService.cancelRegistration(registrationId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/v1/registrations/part-time/{registrationId}/effective-to
     * Update effectiveTo date (admin extends deadline).
     *
     * Permission: MANAGE_REGISTRATIONS_ALL
     *
     * @param registrationId Registration ID
     * @param request        New effectiveTo date
     * @return Updated registration
     */
    @PatchMapping("/{registrationId}/effective-to")
    public ResponseEntity<RegistrationResponse> updateEffectiveTo(
            @PathVariable Integer registrationId,
            @Valid @RequestBody UpdateEffectiveToRequest request) {
        log.info("REST request to update effectiveTo for registration {}: {}", registrationId, request);
        RegistrationResponse response = registrationService.updateEffectiveTo(registrationId, request);
        return ResponseEntity.ok(response);
    }
}
