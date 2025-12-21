package com.dental.clinic.management.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for Grouped Service APIs
 * Groups services by category for display
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupedServicesResponse {

    private ServiceCategoryDTO.Brief category;
    private List<?> services; // Can be PublicServiceDTO or InternalServiceDTO

    /**
     * Public version - for unauthenticated users
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Public {
        private ServiceCategoryDTO.Brief category;
        private List<PublicServiceDTO> services;
    }

    /**
     * Internal version - for authenticated users
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Internal {
        private ServiceCategoryDTO.Brief category;
        private List<InternalServiceDTO> services;
    }
}
