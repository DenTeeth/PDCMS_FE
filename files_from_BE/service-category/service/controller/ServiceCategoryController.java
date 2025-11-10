package com.dental.clinic.management.service.controller;

import com.dental.clinic.management.service.dto.*;
import com.dental.clinic.management.service.service.ServiceCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Service Category Management
 * Handles CRUD operations and reordering of service categories
 */
@RestController
@RequestMapping("/api/v1/service-categories")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Categories", description = "APIs for managing service categories (groups)")
public class ServiceCategoryController {

    private final ServiceCategoryService serviceCategoryService;

    /**
     * Get all service categories (admin)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_SERVICE')")
    @Operation(summary = "Get all service categories", 
               description = "Returns all categories including inactive ones, ordered by display order")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved categories"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<List<ServiceCategoryDTO>> getAllCategories() {
        log.info("GET /api/v1/service-categories - Get all categories");
        List<ServiceCategoryDTO> categories = serviceCategoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * Get category by ID
     */
    @GetMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('VIEW_SERVICE')")
    @Operation(summary = "Get category by ID", description = "Returns a single category details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category found"),
            @ApiResponse(responseCode = "404", description = "Category not found"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<ServiceCategoryDTO> getCategoryById(@PathVariable Long categoryId) {
        log.info("GET /api/v1/service-categories/{} - Get category by ID", categoryId);
        ServiceCategoryDTO category = serviceCategoryService.getCategoryById(categoryId);
        return ResponseEntity.ok(category);
    }

    /**
     * Create new service category
     */
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_SERVICE')")
    @Operation(summary = "Create new service category", 
               description = "Creates a new service category with unique code")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Category created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "409", description = "Category code already exists"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<ServiceCategoryDTO> createCategory(
            @Valid @RequestBody CreateServiceCategoryRequest request) {
        log.info("POST /api/v1/service-categories - Create category: {}", request.getCategoryCode());
        ServiceCategoryDTO created = serviceCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update existing service category
     */
    @PatchMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('UPDATE_SERVICE')")
    @Operation(summary = "Update service category", 
               description = "Updates category fields (partial update supported)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "Category not found"),
            @ApiResponse(responseCode = "409", description = "Category code already exists"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<ServiceCategoryDTO> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody UpdateServiceCategoryRequest request) {
        log.info("PATCH /api/v1/service-categories/{} - Update category", categoryId);
        ServiceCategoryDTO updated = serviceCategoryService.updateCategory(categoryId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete service category (soft delete)
     */
    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('DELETE_SERVICE')")
    @Operation(summary = "Delete service category", 
               description = "Soft deletes category by setting isActive=false. Fails if active services are linked.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Category deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Category not found"),
            @ApiResponse(responseCode = "409", description = "Cannot delete - active services linked"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        log.info("DELETE /api/v1/service-categories/{} - Soft delete category", categoryId);
        serviceCategoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reorder service categories (bulk operation)
     */
    @PostMapping("/reorder")
    @PreAuthorize("hasAuthority('UPDATE_SERVICE')")
    @Operation(summary = "Reorder service categories", 
               description = "Updates display order for multiple categories at once (for drag-drop UX)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Categories reordered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "One or more categories not found"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<Void> reorderCategories(
            @Valid @RequestBody ReorderServiceCategoriesRequest request) {
        log.info("POST /api/v1/service-categories/reorder - Reorder {} categories", 
                 request.getOrders().size());
        serviceCategoryService.reorderCategories(request);
        return ResponseEntity.noContent().build();
    }
}
