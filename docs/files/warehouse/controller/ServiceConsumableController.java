package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.request.ConsumableItemRequest;
import com.dental.clinic.management.warehouse.dto.request.SetServiceConsumablesRequest;
import com.dental.clinic.management.warehouse.dto.response.ServiceConsumablesResponse;
import com.dental.clinic.management.warehouse.service.ServiceConsumableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
// import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

/**
 * API 6.17, 6.18, 6.19: Service Consumables Controller
 * Manage consumable items (Bill of Materials) for dental services
 */
@RestController
@RequestMapping("/api/v1/warehouse/consumables")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Consumables", description = "APIs to manage material consumption standards (BOM) for dental services")
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

        /**
         * API 6.18: Set Service Consumables (Bulk)
         * Sets material consumption standards for multiple services at once
         * Upsert strategy: Updates existing or creates new consumable records
         *
         * Use Case:
         * - Warehouse manager: Define BOM for newly added services
         * - Warehouse manager: Update material quantities for existing services
         */
        @PostMapping
        @PreAuthorize("hasAuthority('" + MANAGE_WAREHOUSE + "')")
        @Operation(summary = "Set service consumables (BOM) - Bulk", description = "Define or update material consumption standards for one or more services. "
                        +
                        "Supports bulk operations for efficient BOM configuration. Uses upsert strategy.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Consumables set successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request data OR Item/unit not found"),
                        @ApiResponse(responseCode = "404", description = "Service not found"),
                        @ApiResponse(responseCode = "403", description = "Insufficient permissions - requires MANAGE_WAREHOUSE")
        })
        @ApiMessage("Service consumables set successfully")
        public ResponseEntity<String> setServiceConsumables(
                        @Valid @RequestBody List<SetServiceConsumablesRequest> requests) {

                log.info("API 6.18 - POST /api/v1/warehouse/consumables - Setting consumables for {} services",
                                requests.size());
                int affectedRecords = serviceConsumableService.setServiceConsumables(requests);
                return ResponseEntity.ok(affectedRecords + " consumable records were set successfully");
        }

        /**
         * API 6.19: Update Service Consumables (Replace)
         * Replaces all material consumption standards for a specific service
         * Replace strategy: Deletes all existing consumables then inserts new ones
         *
         * Use Case:
         * - Warehouse manager: Complete BOM reconfiguration for a service
         * - Warehouse manager: Remove old materials and add new materials
         */
        @PutMapping("/services/{serviceId}")
        @PreAuthorize("hasAuthority('" + MANAGE_WAREHOUSE + "')")
        @Operation(summary = "Update service consumables (BOM) - Replace", description = "Replace all material consumption standards for a specific service. "
                        +
                        "Deletes existing BOM and creates new configuration. Use for complete BOM updates.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Consumables updated successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request data OR Item/unit not found"),
                        @ApiResponse(responseCode = "404", description = "Service not found"),
                        @ApiResponse(responseCode = "403", description = "Insufficient permissions - requires MANAGE_WAREHOUSE")
        })
        @ApiMessage("Service consumables updated successfully")
        public ResponseEntity<String> updateServiceConsumables(
                        @Parameter(description = "Service ID", required = true, example = "1") @PathVariable Long serviceId,
                        @Valid @RequestBody List<ConsumableItemRequest> consumables) {

                if (consumables == null || consumables.isEmpty()) {
                        throw new IllegalArgumentException("Consumables list cannot be empty");
                }

                log.info("API 6.19 - PUT /api/v1/warehouse/consumables/services/{} - Updating consumables", serviceId);
                int insertedRecords = serviceConsumableService.updateServiceConsumables(serviceId, consumables);
                return ResponseEntity.ok(insertedRecords + " consumable records were updated successfully");
        }
}
