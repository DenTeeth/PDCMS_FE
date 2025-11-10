package com.dental.clinic.management.service.controller;

import com.dental.clinic.management.service.dto.*;
import com.dental.clinic.management.service.service.DentalServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for DentalService Management
 * Implements 3 APIs: Public grouped, Internal grouped, Admin flat list
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dental Services", description = "APIs for managing dental services")
public class DentalServiceController {

    private final DentalServiceService dentalServiceService;

    /**
     * API 6.1: Public grouped services (NO AUTH)
     * Returns minimal data for price list display
     */
    @GetMapping("/api/v1/public/services/grouped")
    @Operation(summary = "Get public grouped services (no auth)",
               description = "Returns services grouped by category with minimal fields (name, price only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved services")
    })
    public ResponseEntity<List<GroupedServicesResponse.Public>> getPublicGroupedServices() {
        log.info("GET /api/v1/public/services/grouped - Public grouped services");
        List<GroupedServicesResponse.Public> response = dentalServiceService.getPublicGroupedServices();
        return ResponseEntity.ok(response);
    }

    /**
     * API 6.2: Internal grouped services (AUTH REQUIRED)
     * Returns more details for booking operations
     */
    @GetMapping("/api/v1/services/grouped")
    @PreAuthorize("hasAuthority('VIEW_SERVICE')")
    @Operation(summary = "Get internal grouped services (auth required)",
               description = "Returns services grouped by category with technical fields (id, code, duration)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved services"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<List<GroupedServicesResponse.Internal>> getInternalGroupedServices() {
        log.info("GET /api/v1/services/grouped - Internal grouped services");
        List<GroupedServicesResponse.Internal> response = dentalServiceService.getInternalGroupedServices();
        return ResponseEntity.ok(response);
    }

    /**
     * API 6.3: Admin services list (FLAT with filters)
     * Supports search, filter by category/status, pagination
     */
    @GetMapping("/api/v1/services")
    @PreAuthorize("hasAuthority('VIEW_SERVICE')")
    @Operation(summary = "Get all services (admin with filters)",
               description = "Returns flat list with pagination, search, and filters")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved services"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<Page<DentalServiceDTO>> getAllServices(
            @Parameter(description = "Filter by category ID")
            @RequestParam(required = false) Long categoryId,

            @Parameter(description = "Filter by active status (true/false)")
            @RequestParam(required = false) Boolean isActive,

            @Parameter(description = "Search by service name or code")
            @RequestParam(required = false) String search,

            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Sort by field (e.g., serviceName, displayOrder)")
            @RequestParam(defaultValue = "displayOrder") String sortBy,

            @Parameter(description = "Sort direction (ASC/DESC)")
            @RequestParam(defaultValue = "ASC") Sort.Direction direction) {

        log.info("GET /api/v1/services - Admin list (page: {}, size: {}, categoryId: {}, isActive: {}, search: {})",
                page, size, categoryId, isActive, search);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<DentalServiceDTO> response = dentalServiceService.getAllServicesWithFilters(
                categoryId, isActive, search, pageable);

        return ResponseEntity.ok(response);
    }
}
