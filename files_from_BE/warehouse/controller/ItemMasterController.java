package com.dental.clinic.management.warehouse.controller;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.request.CreateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.request.ItemFilterRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.response.CreateItemMasterResponse;
import com.dental.clinic.management.warehouse.dto.response.GetItemUnitsResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemMasterPageResponse;
import com.dental.clinic.management.warehouse.dto.response.UpdateItemMasterResponse;
import com.dental.clinic.management.warehouse.service.ItemMasterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * API 6.8, 6.9 & 6.10: Item Master Management Controller
 *
 * Features:
 * - API 6.8: List all items with advanced filtering
 * - API 6.9: Create new item master with unit hierarchy
 * - API 6.10: Update item master with Safety Lock mechanism
 * - Denormalized cache for performance (cached_total_quantity,
 * cached_last_import_date)
 * - RBAC with VIEW_ITEMS, CREATE_ITEMS, UPDATE_ITEMS, MANAGE_WAREHOUSE
 * permissions
 * - Pagination & sorting
 */
@RestController
@RequestMapping("/api/v1/warehouse/items")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Item Master Management", description = "API 6.8, 6.9, 6.10 & 6.11 - Item Master List, Create, Update & Get Units")
public class ItemMasterController {

        private final ItemMasterService itemMasterService;

        @GetMapping
        @ApiMessage("Item masters retrieved successfully")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_ITEMS', 'VIEW_WAREHOUSE', 'MANAGE_WAREHOUSE')")
        @Operation(summary = "Get Item Masters List", description = """
                        API 6.8 - Get list of all item masters with advanced filtering

                        **Main Features:**
                        - Search by item name or code
                        - Filter by category, stock status
                        - Sort by name, total stock, last import date
                        - Denormalized cache: cached_total_quantity, cached_last_import_date (auto-updated on import/export)
                        - Pagination with complete metadata

                        **Use Cases:**
                        1. Create export transaction: Get list of available items (?inStock=true&sortBy=itemName)
                        2. Check inventory: Filter by category and view stock quantities
                        3. Search items: Search by name (?search=syringe)
                        4. Dashboard overview: View all items summary

                        **Permissions:**
                        - VIEW_ITEMS: View item list (Doctor, Receptionist, Manager)
                        - VIEW_WAREHOUSE: Warehouse view permission (Warehouse staff)
                        - MANAGE_WAREHOUSE: Warehouse management permission (Admin)

                        **Performance:**
                        - Uses cached_total_quantity instead of SUM(batch.quantity) - Reduces query time from 500ms to 50ms
                        - Index on itemName, categoryId, cached_total_quantity
                        """)
        public ResponseEntity<ItemMasterPageResponse> getItems(@ModelAttribute ItemFilterRequest filter) {

                log.info("GET /api/v1/warehouse/items - Filter: {}", filter);

                ItemMasterPageResponse response = itemMasterService.getItems(filter);

                log.info("Item masters retrieved - Total: {}, Page: {}/{}",
                                response.getMeta().getTotalElements(),
                                response.getMeta().getPage() + 1,
                                response.getMeta().getTotalPages());

                return new ResponseEntity<>(response, HttpStatus.OK);
        }

        @PostMapping
        @ApiMessage("Item master created successfully")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('CREATE_ITEMS', 'MANAGE_WAREHOUSE')")
        @Operation(summary = "Create New Item Master", description = """
                        API 6.9 - Create new item master with unit hierarchy

                        **Main Features:**
                        - Define SKU code with format validation (A-Z, 0-9, hyphen)
                        - Set warehouse type (COLD for refrigerated, NORMAL for regular)
                        - Configure stock alerts (min/max levels)
                        - Define unit hierarchy (Box -> Strip -> Pill) with conversion rates
                        - Healthcare compliance: prescription required flag, default shelf life
                        - Batch insert for performance

                        **Validation Rules:**
                        1. Item code must be unique (3-20 chars, uppercase, numbers, hyphens)
                        2. Min stock level < Max stock level
                        3. Exactly ONE base unit with conversion rate = 1
                        4. Other units must have conversion rate > 1
                        5. Unit names must be unique within the item

                        **Use Cases:**
                        1. Add new medication: Set prescription flag, shelf life
                        2. Add consumables: Set stock alerts for reorder
                        3. Add equipment: Set warehouse type for proper storage

                        **Permissions:**
                        - ADMIN: Full access
                        - CREATE_ITEMS: Create item masters
                        - MANAGE_WAREHOUSE: Warehouse management

                        **Audit Trail:**
                        - Logs CREATE_ITEM action with user info
                        """)
        public ResponseEntity<CreateItemMasterResponse> createItemMaster(
                        @Valid @RequestBody CreateItemMasterRequest request) {

                log.info("POST /api/v1/warehouse/items - Creating item: {}", request.getItemCode());

                CreateItemMasterResponse response = itemMasterService.createItemMaster(request);

                log.info("Item master created successfully - ID: {}, Code: {}",
                                response.getItemMasterId(), response.getItemCode());

                return new ResponseEntity<>(response, HttpStatus.CREATED);
        }

        @PutMapping("/{id}")
        @ApiMessage("Item master updated successfully")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('UPDATE_ITEMS', 'MANAGE_WAREHOUSE')")
        @Operation(summary = "Update Item Master", description = """
                        API 6.10 - Update item master with Safety Lock mechanism

                        **Main Features:**
                        - Update item name, description, category, warehouse type
                        - Update stock levels (min/max)
                        - Update unit hierarchy with Safety Lock protection
                        - Soft delete units (isActive flag)
                        - Safety Lock: Block dangerous changes when inventory exists

                        **Safety Lock Rules (when cachedTotalQuantity > 0):**
                        - BLOCKED: Change conversion rate (would corrupt stock calculations)
                        - BLOCKED: Change isBaseUnit flag (would corrupt unit hierarchy)
                        - BLOCKED: Hard delete units (would break transaction history)
                        - ALLOWED: Rename units (cosmetic change)
                        - ALLOWED: Add new units (expands options)
                        - ALLOWED: Change displayOrder (cosmetic change)
                        - ALLOWED: Soft delete units (set isActive=false, preserves history)

                        **Validation Rules:**
                        1. Item code is IMMUTABLE (cannot be changed)
                        2. Min stock level < Max stock level
                        3. Exactly ONE base unit with conversion rate = 1
                        4. Unit names must be unique within the item
                        5. Safety Lock enforced when stock > 0

                        **Use Cases:**
                        1. Update item details: Change name, description, category (Safe - no impact on stock)
                        2. Adjust stock alerts: Update min/max levels (Safe)
                        3. Rename unit: Change "Box" to "Carton" (Safe - cosmetic change)
                        4. Add new unit: Add "Pallet" unit for bulk orders (Safe - expands options)
                        5. Soft delete unit: Set isActive=false to hide from dropdown (Safe - preserves history)
                        6. BLOCKED: Change conversion rate when stock exists (409 CONFLICT)

                        **Error Responses:**
                        - 400 BAD_REQUEST: Validation errors (min > max, duplicate unit names)
                        - 404 NOT_FOUND: Item master not found
                        - 409 CONFLICT: Safety Lock violation (blocked changes with detailed message)
                        - 403 FORBIDDEN: Missing UPDATE_ITEMS permission

                        **Permissions:**
                        - ADMIN: Full access
                        - UPDATE_ITEMS: Update item masters (Inventory Manager)
                        - MANAGE_WAREHOUSE: Warehouse management (Manager)

                        **Response:**
                        - safetyLockApplied: Boolean flag indicating if Safety Lock was active
                        - units: List of all units after update with isActive status
                        """)
        public ResponseEntity<UpdateItemMasterResponse> updateItemMaster(
                        @PathVariable("id") Long itemMasterId,
                        @Valid @RequestBody UpdateItemMasterRequest request) {

                log.info("PUT /api/v1/warehouse/items/{} - Updating item", itemMasterId);

                UpdateItemMasterResponse response = itemMasterService.updateItemMaster(itemMasterId, request);

                log.info("Item master updated successfully - ID: {}, Code: {}, Safety Lock: {}",
                                response.getItemMasterId(), response.getItemCode(), response.getSafetyLockApplied());

                return new ResponseEntity<>(response, HttpStatus.OK);
        }

        @GetMapping("/{itemMasterId}/units")
        @ApiMessage("Item units retrieved successfully")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_ITEMS', 'VIEW_WAREHOUSE', 'MANAGE_WAREHOUSE')")
        @Operation(summary = "Get Item Units", description = """
                        API 6.11 - Get list of units for an item master (for dropdown selection)

                        This API provides unit hierarchy for:
                        - Import/Export transaction forms (unit selection dropdown)
                        - Prescription forms (dosage unit selection)
                        - Transaction history display (show historical units including inactive ones)

                        **Query Parameters:**
                        - status: Filter units by status
                          - active (default): Only active units
                          - inactive: Only inactive (soft-deleted) units
                          - all: All units (for transaction history)

                        **Business Logic:**
                        - Returns item master metadata for context
                        - Returns base unit for calculation reference
                        - Auto-generates description (e.g., "1 Hop = 100 Vien")
                        - Sorted by displayOrder (large units first for import, small units visible for usage)
                        - Returns 410 GONE if item master is inactive
                        - Returns 404 NOT FOUND if item master does not exist

                        **Authorization:**
                        - Requires one of: ADMIN, VIEW_ITEMS, VIEW_WAREHOUSE, MANAGE_WAREHOUSE
                        - Doctor, Nurse, Warehouse staff all need this for their respective workflows

                        **Response:**
                        - itemMaster: Basic item information
                        - baseUnit: Base unit for conversion reference
                        - units: List of units with auto-generated descriptions
                        """)
        public ResponseEntity<GetItemUnitsResponse> getItemUnits(
                        @Parameter(description = "Item Master ID", required = true, example = "24") @PathVariable @Min(1) Long itemMasterId,

                        @Parameter(description = "Unit status filter: active (default), inactive, or all", example = "active") @RequestParam(defaultValue = "active") String status) {

                log.info("GET /api/v1/warehouse/items/{}/units?status={}", itemMasterId, status);

                GetItemUnitsResponse response = itemMasterService.getItemUnits(itemMasterId, status);

                log.info("Retrieved {} units for item master ID: {}",
                                response.getUnits().size(), itemMasterId);

                return ResponseEntity.ok(response);
        }

        @PostMapping("/units/convert")
        @ApiMessage("Conversion processed successfully")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_ITEMS', 'VIEW_WAREHOUSE', 'MANAGE_WAREHOUSE')")
        @Operation(summary = "Convert Item Quantity Between Units (Batch)", description = """
                        API 6.12 - Convert item quantities between units with batch support

                        This utility API helps calculate unit conversions for:
                        - Prescription forms: Show "0.5 Hop (= 50 Vien)" for doctor verification
                        - Import forms: Convert "10 Thung" to "10,000 Vien" for inventory calculation
                        - Stock reports: Display quantities in user-preferred units

                        **Business Logic:**
                        1. Validates all units belong to their respective items (security)
                        2. Validates base units exist and conversion rates > 0
                        3. Converts using intermediate base unit pattern:
                           baseQty = quantity * fromUnit.conversionRate
                           result = baseQty / toUnit.conversionRate
                        4. Applies rounding strategy (FLOOR/CEILING/HALF_UP)
                        5. Returns formula for transparency and debugging

                        **Request Body:**
                        - conversions: Array of conversion requests
                          - itemMasterId: Item to convert
                          - fromUnitId: Source unit ID
                          - toUnitId: Target unit ID
                          - quantity: Amount to convert (supports decimals)
                        - roundingMode: FLOOR | CEILING | HALF_UP (default)
                          - FLOOR: Round down (medications - cannot split pills)
                          - CEILING: Round up (materials - buy extra instead of shortage)
                          - HALF_UP: Standard rounding (default)

                        **Response:**
                        - totalProcessed: Number of successful conversions
                        - results: Array of conversion results
                          - inputQuantity: Original amount
                          - resultQuantity: Converted amount (exact)
                          - resultQuantityDisplay: Formatted string for UI (e.g., "1,000")
                          - formula: Calculation formula (e.g., "(2.5 * 100) / 1")
                          - conversionFactor: Multiplier for frontend calculations

                        **Error Cases:**
                        - 400 BAD_REQUEST: Unit does not belong to item (security)
                        - 400 BAD_REQUEST: Conversion rate <= 0 (data integrity)
                        - 404 NOT_FOUND: Item or unit does not exist
                        - 500 INTERNAL_ERROR: Base unit missing (data integrity issue)

                        **Authorization:**
                        - Requires one of: ADMIN, VIEW_ITEMS, VIEW_WAREHOUSE, MANAGE_WAREHOUSE
                        - Public for internal staff (doctors, nurses, warehouse staff)

                        **Performance:**
                        - Supports batch processing (multiple conversions in one request)
                        - Reduces HTTP overhead (1 request instead of N)
                        - Faster UX for prescription forms with multiple items
                        """)
        public ResponseEntity<com.dental.clinic.management.warehouse.dto.response.ConversionResponse> convertUnits(
                        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Batch conversion request with rounding mode", required = true) @Valid @org.springframework.web.bind.annotation.RequestBody com.dental.clinic.management.warehouse.dto.request.ConversionRequest request) {

                log.info("POST /api/v1/warehouse/items/units/convert - Processing {} conversions",
                                request.getConversions().size());

                com.dental.clinic.management.warehouse.dto.response.ConversionResponse response = itemMasterService
                                .convertUnits(request);

                log.info("Conversion completed - Processed: {}", response.getTotalProcessed());

                return ResponseEntity.ok(response);
        }
}
