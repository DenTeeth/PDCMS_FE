package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.CreatePartTimeSlotRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdatePartTimeSlotRequest;
import com.dental.clinic.management.working_schedule.dto.response.PartTimeSlotResponse;
import com.dental.clinic.management.working_schedule.service.PartTimeSlotService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import com.dental.clinic.management.working_schedule.service.PartTimeSlotAvailabilityService;
import com.dental.clinic.management.working_schedule.domain.PartTimeSlot;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * REST controller for Part-time Slot Management (Admin).
 */
@RestController
@RequestMapping("/api/v1/work-slots")
@RequiredArgsConstructor
@Slf4j
public class PartTimeSlotController {

    private final PartTimeSlotService partTimeSlotService;
    private final PartTimeSlotAvailabilityService availabilityService;
    private final PartTimeSlotRepository slotRepository;

    /**
     * Create a new part-time slot.
     */
    @PostMapping
    public ResponseEntity<PartTimeSlotResponse> createSlot(
            @Valid @RequestBody CreatePartTimeSlotRequest request) {
        log.info("POST /api/v1/work-slots - Creating slot");
        PartTimeSlotResponse response = partTimeSlotService.createSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all part-time slots with registration counts.
     */
    @GetMapping
    public ResponseEntity<List<PartTimeSlotResponse>> getAllSlots() {
        log.info("GET /api/v1/work-slots - Fetching all slots");
        List<PartTimeSlotResponse> responses = partTimeSlotService.getAllSlots();
        return ResponseEntity.ok(responses);
    }

    /**
     * Get slot detail with list of registered employees.
     */
    @GetMapping("/{slotId}")
    public ResponseEntity<com.dental.clinic.management.working_schedule.dto.response.PartTimeSlotDetailResponse> getSlotDetail(
            @PathVariable Long slotId) {
        log.info("GET /api/v1/work-slots/{} - Fetching slot detail", slotId);
        var response = partTimeSlotService.getSlotDetail(slotId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/work-slots/{slotId}/registered?date=yyyy-MM-dd
     * Return the count of APPROVED registrations that cover the given date for the slot.
     * Allowed for managers who manage part-time registrations or admins managing work slots.
     */
    @GetMapping("/{slotId}/registered")
    public ResponseEntity<java.util.Map<String, Object>> getRegisteredCountForDate(
            @PathVariable Long slotId,
            @RequestParam String date) {

        LocalDate targetDate = LocalDate.parse(date);
        long count = availabilityService.getRegisteredCountForDate(slotId, targetDate);

        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("slotId", slotId);
        body.put("date", targetDate.toString());
        body.put("registered", count);

        return ResponseEntity.ok(body);
    }

    /**
     * GET /api/v1/work-slots/{slotId}/availability?from=yyyy-MM-dd&to=yyyy-MM-dd
     * Returns per-day registered counts and availability flags for the slot's working days.
     */
    @GetMapping("/{slotId}/availability")
    @PreAuthorize("hasAnyAuthority('VIEW_AVAILABLE_SLOTS','MANAGE_PART_TIME_REGISTRATIONS','MANAGE_WORK_SLOTS')")
    public ResponseEntity<?> getAvailability(
            @PathVariable Long slotId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        PartTimeSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null) {
            return ResponseEntity.notFound().build();
        }

        List<LocalDate> days = availabilityService.getWorkingDays(slot, from, to);
        List<Map<String, Object>> details = new ArrayList<>();

        boolean anyAvailable = false;
        boolean allAvailable = true;

        for (LocalDate d : days) {
            long registered = availabilityService.getRegisteredCountForDate(slotId, d);
            boolean available = registered < slot.getQuota();
            if (available) anyAvailable = true; else allAvailable = false;

            Map<String, Object> m = new HashMap<>();
            m.put("date", d.toString());
            m.put("registered", registered);
            m.put("quota", slot.getQuota());
            m.put("available", available);
            details.add(m);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("slotId", slotId);
        resp.put("from", from.toString());
        resp.put("to", to.toString());
        resp.put("anyAvailable", anyAvailable);
        resp.put("allAvailable", allAvailable);
        resp.put("details", details);

        return ResponseEntity.ok(resp);
    }

    /**
     * Update a part-time slot (quota and isActive).
     */
    @PutMapping("/{slotId}")
    public ResponseEntity<PartTimeSlotResponse> updateSlot(
            @PathVariable Long slotId,
            @Valid @RequestBody UpdatePartTimeSlotRequest request) {
        log.info("PUT /api/v1/work-slots/{} - Updating slot", slotId);
        PartTimeSlotResponse response = partTimeSlotService.updateSlot(slotId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/work-slots/{slotId}
     * Delete (deactivate) a work slot.
     * Soft delete - sets isActive = false.
     * Existing registrations remain unchanged.
     * 
     * Permission: MANAGE_WORK_SLOTS
     * 
     * @param slotId Slot ID to delete
     * @return 204 No Content
     */
    @DeleteMapping("/{slotId}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long slotId) {
        log.info("DELETE /api/v1/work-slots/{} - Deactivating slot", slotId);
        partTimeSlotService.deleteSlot(slotId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/work-slots/statistics
     * Get comprehensive statistics for all work slots.
     * Provides dashboard metrics including:
     * - Total slots (active/inactive)
     * - Total registrations (approved/pending/rejected)
     * - Quota capacity and utilization
     * - Per-shift and per-day breakdowns
     * 
     * Permission: MANAGE_WORK_SLOTS
     * 
     * @return Statistics response with comprehensive metrics
     */
    @GetMapping("/statistics")
    public ResponseEntity<com.dental.clinic.management.working_schedule.dto.response.SlotStatisticsResponse> getStatistics() {
        log.info("GET /api/v1/work-slots/statistics - Fetching slot statistics");
        var statistics = partTimeSlotService.getSlotStatistics();
        return ResponseEntity.ok(statistics);
    }
}
