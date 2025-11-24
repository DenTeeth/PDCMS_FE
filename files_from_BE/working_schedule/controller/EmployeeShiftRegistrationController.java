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
     * - Optional month filter (YYYY-MM) to show only slots with availability in that month
     *
     * @param month Optional month filter in YYYY-MM format (e.g., "2025-12")
     * @return List of available slots with quota info
     */
    @GetMapping("/available-slots")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots(
            @RequestParam(required = false) String month) {
        log.info("REST request to get available slots (month filter: {})", month);
        List<AvailableSlotResponse> slots = registrationService.getAvailableSlots(month);
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
     * GET /api/v1/registrations/part-time-flex/slots/{slotId}/daily-availability
     * Get daily availability breakdown for a specific slot in a given month.
     * Shows quota, registered count, and remaining slots for each working day.
     *
     * Permission: VIEW_AVAILABLE_SLOTS (employees), MANAGE_PART_TIME_REGISTRATIONS (managers), MANAGE_WORK_SLOTS (admins)
     * 
     * Business Logic:
     * - Only includes days matching slot's dayOfWeek
     * - Counts APPROVED registrations covering each date
     * - Status: AVAILABLE (100% free), PARTIAL (some taken), FULL (no slots available)
     * 
     * Query Parameters:
     * - month (required): Month in YYYY-MM format (e.g., "2025-11", "2025-12")
     * 
     * Example Request:
     * GET /api/v1/registrations/part-time-flex/slots/1/daily-availability?month=2025-11
     * 
     * Example Response:
     * {
     *   "slotId": 1,
     *   "shiftName": "Ca Part-time Sáng (8h-12h)",
     *   "dayOfWeek": "MONDAY",
     *   "quota": 10,
     *   "month": "2025-11",
     *   "monthName": "November 2025",
     *   "totalWorkingDays": 4,
     *   "totalDaysAvailable": 1,
     *   "totalDaysPartial": 2,
     *   "totalDaysFull": 1,
     *   "dailyAvailability": [
     *     {
     *       "date": "2025-11-03",
     *       "dayOfWeek": "MONDAY",
     *       "quota": 10,
     *       "registered": 0,
     *       "remaining": 10,
     *       "status": "AVAILABLE"
     *     },
     *     {
     *       "date": "2025-11-10",
     *       "dayOfWeek": "MONDAY",
     *       "quota": 10,
     *       "registered": 8,
     *       "remaining": 2,
     *       "status": "PARTIAL"
     *     },
     *     ...
     *   ]
     * }
     * 
     * @param slotId The slot ID to get daily availability for
     * @param month Month in YYYY-MM format (required)
     * @return Daily availability response with per-day breakdown
     */
    @GetMapping("/slots/{slotId}/daily-availability")
    public ResponseEntity<com.dental.clinic.management.working_schedule.dto.response.DailyAvailabilityResponse> getDailyAvailability(
            @PathVariable Long slotId,
            @RequestParam String month) {
        log.info("REST request to get daily availability for slot {} in month {}", slotId, month);
        com.dental.clinic.management.working_schedule.dto.response.DailyAvailabilityResponse response = 
            registrationService.getDailyAvailability(slotId, month);
        return ResponseEntity.ok(response);
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
     * GET /api/v1/registrations/part-time-flex
     * Get registrations (employee sees own, admin sees all or filtered).
     *
     * Permission:
     * - MANAGE_REGISTRATIONS_ALL: View all or filter by employeeId
     * - VIEW_REGISTRATIONS_OWN: View only own registrations
     * 
     * NEW: Shows status (PENDING, APPROVED, REJECTED)
     * NEW: Supports pagination and sorting
     *
     * @param employeeId Optional filter (admin only)
     * @param pageable Pagination and sorting parameters
     * @return Page of registrations
     */
    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<RegistrationResponse>> getRegistrations(
            @RequestParam(required = false) Integer employeeId,
            org.springframework.data.domain.Pageable pageable) {
        log.info("REST request to get registrations, filter employeeId: {}, page: {}, size: {}, sort: {}", 
                 employeeId, pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        org.springframework.data.domain.Page<RegistrationResponse> registrations = 
            registrationService.getRegistrations(employeeId, pageable);
        return ResponseEntity.ok(registrations);
    }

    /**
     * GET /api/v1/registrations/part-time/{registrationId}
     * Get registration details by ID.
     * 
     * Permissions:
     * - Employee can only view own registrations
     * - Admin can view any registration
     *
     * @param registrationId Registration ID
     * @return Registration details
     */
    @GetMapping("/{registrationId}")
    public ResponseEntity<RegistrationResponse> getRegistrationById(@PathVariable Integer registrationId) {
        log.info("REST request to get registration details: {}", registrationId);
        RegistrationResponse registration = registrationService.getRegistrationById(registrationId);
        return ResponseEntity.ok(registration);
    }

    /**
     * DELETE /api/v1/registrations/part-time/{registrationId}
     * Cancel registration (soft delete - set isActive = false).
     *
     * Permission:
     * - MANAGE_REGISTRATIONS_ALL: Can cancel any registration
     * - CANCEL_REGISTRATION_OWN: Can cancel only own registrations
     * 
     * NEW: Employees can only cancel PENDING registrations
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
