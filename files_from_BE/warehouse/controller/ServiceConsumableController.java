package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.response.ServiceConsumablesResponse;
import com.dental.clinic.management.warehouse.service.ServiceConsumableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

/**
 * API 6.17: Service Consumables Controller
 * Get consumable items (Bill of Materials) required for dental services
 */
@RestController
@RequestMapping("/api/v1/warehouse/consumables")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Consumables", description = "APIs to view material consumption standards (BOM) for dental services")
public class ServiceConsumableController {

    private final ServiceConsumableService serviceConsumableService;

    /**
     * API 6.17: Get Service Consumables
     * Returns list of consumable items required for a service with stock
     * availability and cost info
     *
     * Use Case:
     * - Receptionist booking appointment: Check if enough materials available
     * - Doctor planning treatment: Know what materials needed
     * - Warehouse manager: Calculate material cost per service (COGS)
     */
    @GetMapping("/services/{serviceId}")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_WAREHOUSE', 'VIEW_SERVICE')")
    @Operation(summary = "Get service consumables (BOM)", description = "Get list of consumable items required for a service with current stock status and estimated cost. "
            +
            "Helps clinic staff check material availability before booking appointments.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Consumables retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Service not found OR No consumables defined for service"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    @ApiMessage("Consumables retrieved successfully")
    public ResponseEntity<ServiceConsumablesResponse> getServiceConsumables(
            @Parameter(description = "Service ID", required = true, example = "1") @PathVariable Long serviceId) {

        log.info("API 6.17 - GET /api/v1/warehouse/consumables/services/{}", serviceId);
        ServiceConsumablesResponse response = serviceConsumableService.getServiceConsumables(serviceId);
        return ResponseEntity.ok(response);
    }
}
