package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.request.HolidayDefinitionRequest;
import com.dental.clinic.management.working_schedule.dto.response.HolidayDefinitionResponse;
import com.dental.clinic.management.working_schedule.enums.HolidayType;
import com.dental.clinic.management.working_schedule.service.HolidayDefinitionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing holiday definitions.
 */
@RestController
@RequestMapping("/api/v1/holiday-definitions")
@RequiredArgsConstructor
@Tag(name = "Holiday Definitions", description = "APIs for managing holiday definitions")
public class HolidayDefinitionController {

    private final HolidayDefinitionService holidayDefinitionService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_HOLIDAY')")
    @Operation(summary = "Create a new holiday definition")
    public ResponseEntity<HolidayDefinitionResponse> createHolidayDefinition(
            @Valid @RequestBody HolidayDefinitionRequest request) {
        
        HolidayDefinitionResponse response = holidayDefinitionService.createHolidayDefinition(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get all holiday definitions")
    public ResponseEntity<List<HolidayDefinitionResponse>> getAllHolidayDefinitions() {
        List<HolidayDefinitionResponse> responses = holidayDefinitionService.getAllHolidayDefinitions();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{definitionId}")
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get holiday definition by ID")
    public ResponseEntity<HolidayDefinitionResponse> getHolidayDefinitionById(
            @PathVariable String definitionId) {
        
        HolidayDefinitionResponse response = holidayDefinitionService.getHolidayDefinitionById(definitionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-type/{holidayType}")
    @PreAuthorize("hasAuthority('VIEW_HOLIDAY')")
    @Operation(summary = "Get holiday definitions by type")
    public ResponseEntity<List<HolidayDefinitionResponse>> getHolidayDefinitionsByType(
            @PathVariable HolidayType holidayType) {
        
        List<HolidayDefinitionResponse> responses = holidayDefinitionService.getHolidayDefinitionsByType(holidayType);
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{definitionId}")
    @PreAuthorize("hasAuthority('UPDATE_HOLIDAY')")
    @Operation(summary = "Update a holiday definition")
    public ResponseEntity<HolidayDefinitionResponse> updateHolidayDefinition(
            @PathVariable String definitionId,
            @Valid @RequestBody HolidayDefinitionRequest request) {
        
        HolidayDefinitionResponse response = holidayDefinitionService.updateHolidayDefinition(definitionId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{definitionId}")
    @PreAuthorize("hasAuthority('DELETE_HOLIDAY')")
    @Operation(summary = "Delete a holiday definition (and all associated dates)")
    public ResponseEntity<Void> deleteHolidayDefinition(@PathVariable String definitionId) {
        holidayDefinitionService.deleteHolidayDefinition(definitionId);
        return ResponseEntity.noContent().build();
    }
}
