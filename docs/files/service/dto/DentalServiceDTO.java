package com.dental.clinic.management.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Full DTO for Service Admin API
 * Includes all fields including timestamps
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DentalServiceDTO {

    private Long serviceId;
    private String serviceCode;
    private String serviceName;
    private String description;
    private BigDecimal price;
    private Integer durationMinutes;
    private Integer displayOrder;
    
    // BE_4: Service appointment constraints
    private Integer minimumPreparationDays;
    private Integer recoveryDays;
    private Integer spacingDays;
    private Integer maxAppointmentsPerDay;
    
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Category info
    private ServiceCategoryDTO.Brief category;
}
