package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.working_schedule.dto.request.CreateFixedRegistrationRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateFixedRegistrationRequest;
import com.dental.clinic.management.working_schedule.dto.response.FixedRegistrationResponse;
import com.dental.clinic.management.working_schedule.service.FixedShiftRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for fixed shift registration management.
 * Provides endpoints for creating, viewing, updating, and deleting fixed
 * schedules.
 *
 * Schema V14 - Luồng 1: Lịch Cố định (FULL_TIME & PART_TIME_FIXED)
 */
@RestController
@RequestMapping("/api/v1/fixed-registrations")
@RequiredArgsConstructor
public class FixedShiftRegistrationController {

    private final FixedShiftRegistrationService fixedRegistrationService;
    private final EmployeeRepository employeeRepository;

    /**
     * Create a fixed shift registration.
     *
     * POST /api/v1/fixed-registrations
     *
     * Authorization: Requires MANAGE_FIXED_REGISTRATIONS
     *
     * @param request creation request
     * @return created registration details
     */
    @PostMapping
    public ResponseEntity<FixedRegistrationResponse> createFixedRegistration(
            @Valid @RequestBody CreateFixedRegistrationRequest request) {

        FixedRegistrationResponse response = fixedRegistrationService.createFixedRegistration(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get list of fixed shift registrations.
     *
     * GET /api/v1/fixed-registrations?employeeId=123&isActive=true
     *
     * Authorization: Requires VIEW_FIXED_REGISTRATIONS_ALL or
     * VIEW_FIXED_REGISTRATIONS_OWN
     *
     * @param employeeId     employee ID (optional for VIEW_ALL)
     * @param isActive       filter by active status (null = all, true = active only, false = inactive only)
     * @param authentication authenticated user
     * @return list of registrations
     */
    @GetMapping
    public ResponseEntity<List<FixedRegistrationResponse>> getFixedRegistrations(
            @RequestParam(name = "employeeId", required = false) Integer employeeId,
            @RequestParam(name = "isActive", required = false) Boolean isActive,
            Authentication authentication) {

        // Get current user info
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        Integer currentEmployeeId = employeeRepository.findByAccount_Username(username)
                .map(employee -> employee.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

        boolean hasViewAllPermission = authentication.getAuthorities()
                .contains(new SimpleGrantedAuthority("VIEW_FIXED_REGISTRATIONS_ALL"));

        List<FixedRegistrationResponse> registrations = fixedRegistrationService.getFixedRegistrations(
                employeeId, currentEmployeeId, hasViewAllPermission, isActive);

        return ResponseEntity.ok(registrations);
    }

    /**
     * Update a fixed shift registration (partial update).
     *
     * PATCH /api/v1/fixed-registrations/{registrationId}
     *
     * Authorization: Requires MANAGE_FIXED_REGISTRATIONS
     *
     * @param registrationId registration ID
     * @param request        update request (all fields optional)
     * @return updated registration details
     */
    @PatchMapping("/{registrationId}")
    public ResponseEntity<FixedRegistrationResponse> updateFixedRegistration(
            @PathVariable("registrationId") Integer registrationId,
            @Valid @RequestBody UpdateFixedRegistrationRequest request) {

        FixedRegistrationResponse response = fixedRegistrationService.updateFixedRegistration(registrationId, request);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete (soft delete) a fixed shift registration.
     *
     * DELETE /api/v1/fixed-registrations/{registrationId}
     *
     * Authorization: Requires MANAGE_FIXED_REGISTRATIONS
     *
     * @param registrationId registration ID
     * @return no content
     */
    @DeleteMapping("/{registrationId}")
    public ResponseEntity<Void> deleteFixedRegistration(
            @PathVariable("registrationId") Integer registrationId) {

        fixedRegistrationService.deleteFixedRegistration(registrationId);

        return ResponseEntity.noContent().build();
    }
}
