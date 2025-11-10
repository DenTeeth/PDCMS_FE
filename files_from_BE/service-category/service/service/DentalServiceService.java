package com.dental.clinic.management.service.service;

import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.service.dto.*;
import com.dental.clinic.management.service.repository.DentalServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service layer for DentalService management
 * Implements grouped APIs (public + internal) and admin flat list
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DentalServiceService {

    private final DentalServiceRepository dentalServiceRepository;

    /**
     * API 6.1: Get grouped services (PUBLIC - no auth required)
     * Returns minimal data: service name and price only
     */
    @Transactional(readOnly = true)
    public List<GroupedServicesResponse.Public> getPublicGroupedServices() {
        log.info("Fetching public grouped services");

        List<DentalService> services = dentalServiceRepository.findAllActiveServicesWithCategory();

        // Group services by category
        Map<String, List<PublicServiceDTO>> grouped = new LinkedHashMap<>();

        for (DentalService service : services) {
            String categoryName = service.getCategory() != null ?
                    service.getCategory().getCategoryName() : "Uncategorized";

            grouped.computeIfAbsent(categoryName, k -> new ArrayList<>())
                    .add(PublicServiceDTO.builder()
                            .serviceName(service.getServiceName())
                            .price(service.getPrice())
                            .build());
        }

        // Convert to response format
        return grouped.entrySet().stream()
                .map(entry -> {
                    ServiceCategoryDTO.Brief categoryBrief = ServiceCategoryDTO.Brief.builder()
                            .categoryName(entry.getKey())
                            .build();

                    return GroupedServicesResponse.Public.builder()
                            .category(categoryBrief)
                            .services(entry.getValue())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * API 6.2: Get grouped services (INTERNAL - auth required)
     * Returns more details: id, code, name, price, duration
     */
    @Transactional(readOnly = true)
    public List<GroupedServicesResponse.Internal> getInternalGroupedServices() {
        log.info("Fetching internal grouped services");

        List<DentalService> services = dentalServiceRepository.findAllActiveServicesWithCategory();

        // Group services by category
        Map<Long, List<InternalServiceDTO>> grouped = new LinkedHashMap<>();
        Map<Long, ServiceCategoryDTO.Brief> categoryMap = new LinkedHashMap<>();

        for (DentalService service : services) {
            Long categoryId = service.getCategory() != null ?
                    service.getCategory().getCategoryId() : null;

            if (categoryId != null && !categoryMap.containsKey(categoryId)) {
                categoryMap.put(categoryId, ServiceCategoryDTO.Brief.builder()
                        .categoryId(categoryId)
                        .categoryCode(service.getCategory().getCategoryCode())
                        .categoryName(service.getCategory().getCategoryName())
                        .displayOrder(service.getCategory().getDisplayOrder())
                        .build());
            }

            grouped.computeIfAbsent(categoryId, k -> new ArrayList<>())
                    .add(InternalServiceDTO.builder()
                            .serviceId(service.getServiceId())
                            .serviceCode(service.getServiceCode())
                            .serviceName(service.getServiceName())
                            .price(service.getPrice())
                            .durationMinutes(service.getDurationMinutes())
                            .build());
        }

        // Convert to response format
        return grouped.entrySet().stream()
                .map(entry -> GroupedServicesResponse.Internal.builder()
                        .category(categoryMap.getOrDefault(entry.getKey(),
                                ServiceCategoryDTO.Brief.builder()
                                        .categoryName("Uncategorized")
                                        .build()))
                        .services(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * API 6.3: Get all services (ADMIN - with filters)
     * Supports search by name/code, filter by category/status, pagination
     */
    @Transactional(readOnly = true)
    public Page<DentalServiceDTO> getAllServicesWithFilters(
            Long categoryId,
            Boolean isActive,
            String searchTerm,
            Pageable pageable) {

        log.info("Fetching admin services - categoryId: {}, isActive: {}, search: {}, page: {}",
                categoryId, isActive, searchTerm, pageable.getPageNumber());

        Page<DentalService> servicesPage = dentalServiceRepository.findAllServicesWithFilters(
                categoryId, isActive, searchTerm, pageable);

        return servicesPage.map(this::mapToDTO);
    }

    /**
     * Helper: Map entity to full DTO
     */
    private DentalServiceDTO mapToDTO(DentalService service) {
        ServiceCategoryDTO.Brief categoryBrief = null;
        if (service.getCategory() != null) {
            categoryBrief = ServiceCategoryDTO.Brief.builder()
                    .categoryId(service.getCategory().getCategoryId())
                    .categoryCode(service.getCategory().getCategoryCode())
                    .categoryName(service.getCategory().getCategoryName())
                    .displayOrder(service.getCategory().getDisplayOrder())
                    .build();
        }

        return DentalServiceDTO.builder()
                .serviceId(service.getServiceId())
                .serviceCode(service.getServiceCode())
                .serviceName(service.getServiceName())
                .description(service.getDescription())
                .price(service.getPrice())
                .durationMinutes(service.getDurationMinutes())
                .displayOrder(service.getDisplayOrder())
                .isActive(service.getIsActive())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .category(categoryBrief)
                .build();
    }
}
