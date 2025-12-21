package com.dental.clinic.management.service.service;

import com.dental.clinic.management.exception.BusinessException;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.service.domain.ServiceCategory;
import com.dental.clinic.management.service.dto.*;
import com.dental.clinic.management.service.repository.DentalServiceRepository;
import com.dental.clinic.management.service.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Service Category management
 * Implements business logic for CRUD operations and reordering
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceCategoryService {

    private final ServiceCategoryRepository serviceCategoryRepository;
    private final DentalServiceRepository dentalServiceRepository;

    /**
     * Get all service categories (for admin)
     * Returns all categories including inactive ones, ordered by displayOrder
     */
    @Transactional(readOnly = true)
    public List<ServiceCategoryDTO> getAllCategories() {
        log.info("Fetching all service categories");
        return serviceCategoryRepository.findAllOrderByDisplayOrder()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all active categories (for internal APIs)
     */
    @Transactional(readOnly = true)
    public List<ServiceCategoryDTO> getAllActiveCategories() {
        log.info("Fetching all active service categories");
        return serviceCategoryRepository.findAllActiveOrderByDisplayOrder()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get category by ID
     */
    @Transactional(readOnly = true)
    public ServiceCategoryDTO getCategoryById(Long categoryId) {
        log.info("Fetching service category with ID: {}", categoryId);
        ServiceCategory category = findCategoryByIdOrThrow(categoryId);
        return mapToDTO(category);
    }

    /**
     * Create new service category
     */
    @Transactional
    public ServiceCategoryDTO createCategory(CreateServiceCategoryRequest request) {
        log.info("Creating new service category with code: {}", request.getCategoryCode());

        // Validate: Category code must be unique
        if (serviceCategoryRepository.existsByCategoryCode(request.getCategoryCode())) {
            throw new DataIntegrityViolationException(
                    "Category code already exists: " + request.getCategoryCode());
        }

        ServiceCategory category = ServiceCategory.builder()
                .categoryCode(request.getCategoryCode())
                .categoryName(request.getCategoryName())
                .displayOrder(request.getDisplayOrder())
                .description(request.getDescription())
                .isActive(true)
                .build();

        ServiceCategory saved = serviceCategoryRepository.save(category);
        log.info("Created service category: {} with ID: {}", saved.getCategoryCode(), saved.getCategoryId());

        return mapToDTO(saved);
    }

    /**
     * Update existing service category (partial update)
     */
    @Transactional
    public ServiceCategoryDTO updateCategory(Long categoryId, UpdateServiceCategoryRequest request) {
        log.info("Updating service category ID: {}", categoryId);

        ServiceCategory category = findCategoryByIdOrThrow(categoryId);

        // Validate: If changing code, ensure it's unique
        if (request.getCategoryCode() != null &&
                !request.getCategoryCode().equals(category.getCategoryCode())) {
            if (serviceCategoryRepository.existsByCategoryCodeAndIdNot(request.getCategoryCode(), categoryId)) {
                throw new DataIntegrityViolationException(
                        "Category code already exists: " + request.getCategoryCode());
            }
            category.setCategoryCode(request.getCategoryCode());
        }

        // Update fields if provided
        if (request.getCategoryName() != null) {
            category.setCategoryName(request.getCategoryName());
        }
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        ServiceCategory updated = serviceCategoryRepository.save(category);
        log.info("Updated service category: {}", updated.getCategoryCode());

        return mapToDTO(updated);
    }

    /**
     * Delete service category (soft delete - set isActive = false)
     * Only allow delete if no active services are linked to this category
     */
    @Transactional
    public void deleteCategory(Long categoryId) {
        log.info("Deleting service category ID: {}", categoryId);

        ServiceCategory category = findCategoryByIdOrThrow(categoryId);

        // Check if category has any active services linked
        long activeServicesCount = dentalServiceRepository.countActiveServicesByCategory(categoryId);
        if (activeServicesCount > 0) {
            throw new BusinessException(
                    "Cannot delete category with " + activeServicesCount + " active service(s). " +
                    "Please deactivate or reassign services first.");
        }

        category.setIsActive(false);
        serviceCategoryRepository.save(category);

        log.info("Soft deleted service category: {}", category.getCategoryCode());
    }

    /**
     * Reorder service categories
     * Update display order for multiple categories at once
     */
    @Transactional
    public void reorderCategories(ReorderServiceCategoriesRequest request) {
        log.info("Reordering {} service categories", request.getOrders().size());

        for (ReorderServiceCategoriesRequest.CategoryOrder order : request.getOrders()) {
            ServiceCategory category = findCategoryByIdOrThrow(order.getCategoryId());
            category.setDisplayOrder(order.getDisplayOrder());
            serviceCategoryRepository.save(category);
        }

        log.info("Successfully reordered service categories");
    }

    /**
     * Helper: Find category by ID or throw exception
     */
    private ServiceCategory findCategoryByIdOrThrow(Long categoryId) {
        return serviceCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_CATEGORY_NOT_FOUND",
                        "Service category not found with ID: " + categoryId));
    }

    /**
     * Helper: Map entity to DTO
     */
    private ServiceCategoryDTO mapToDTO(ServiceCategory category) {
        return ServiceCategoryDTO.builder()
                .categoryId(category.getCategoryId())
                .categoryCode(category.getCategoryCode())
                .categoryName(category.getCategoryName())
                .displayOrder(category.getDisplayOrder())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
