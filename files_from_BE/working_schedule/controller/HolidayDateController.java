package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.HolidayDateRequest;
import com.dental.clinic.management.working_schedule.dto.response.HolidayDateResponse;
import com.dental.clinic.management.working_schedule.service.HolidayDateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST controller for managing holiday dates.
 */
@RestController
@RequestMapping("/api/v1/holiday-dates")
@RequiredArgsConstructor
@Tag(name = "Holiday Dates", description = "APIs for managing specific holiday dates")
public class HolidayDateController {

    private final HolidayDateService holidayDateService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_HOLIDAY')")
    @Operation(summary = "Create a new holiday date")
    public ResponseEntity<HolidayDateResponse> createHolidayDate(
            @Valid @RequestBody HolidayDateRequest request) {
        
        HolidayDateResponse response = holidayDateService.createHolidayDate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get all holiday dates")
    public ResponseEntity<List<HolidayDateResponse>> getAllHolidayDates() {
        List<HolidayDateResponse> responses = holidayDateService.getAllHolidayDates();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-definition/{definitionId}")
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get all holiday dates for a specific definition")
    public ResponseEntity<List<HolidayDateResponse>> getHolidayDatesByDefinition(
            @PathVariable String definitionId) {
        
        List<HolidayDateResponse> responses = holidayDateService.getHolidayDatesByDefinition(definitionId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-range")
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get holiday dates within a date range")
    public ResponseEntity<List<HolidayDateResponse>> getHolidayDatesByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<HolidayDateResponse> responses = holidayDateService.getHolidayDatesByRange(startDate, endDate);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{holidayDate}/definition/{definitionId}")
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get a specific holiday date")
    public ResponseEntity<HolidayDateResponse> getHolidayDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate holidayDate,
            @PathVariable String definitionId) {
        
        HolidayDateResponse response = holidayDateService.getHolidayDate(holidayDate, definitionId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{holidayDate}/definition/{definitionId}")
    @PreAuthorize("hasAuthority('UPDATE_HOLIDAY')")
    @Operation(summary = "Update a holiday date (only description)")
    public ResponseEntity<HolidayDateResponse> updateHolidayDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate holidayDate,
            @PathVariable String definitionId,
            @Valid @RequestBody HolidayDateRequest request) {
        
        HolidayDateResponse response = holidayDateService.updateHolidayDate(holidayDate, definitionId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{holidayDate}/definition/{definitionId}")
    @PreAuthorize("hasAuthority('DELETE_HOLIDAY')")
    @Operation(summary = "Delete a holiday date")
    public ResponseEntity<Void> deleteHolidayDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate holidayDate,
            @PathVariable String definitionId) {
        
        holidayDateService.deleteHolidayDate(holidayDate, definitionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{date}")
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Check if a specific date is a holiday")
    public ResponseEntity<Map<String, Boolean>> checkIfHoliday(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        boolean isHoliday = holidayDateService.isHoliday(date);
        return ResponseEntity.ok(Map.of("isHoliday", isHoliday));
    }
}
