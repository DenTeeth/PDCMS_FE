package com.dental.clinic.management.booking_appointment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for creating a new dental service
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request body for creating a new service")
public class CreateServiceRequest {

    @SuppressWarnings("deprecation")
    @NotBlank(message = "Service code is required")
    @Schema(description = "Unique service code", example = "SV-CAOVOI", required = true)
    private String serviceCode;

    @SuppressWarnings("deprecation")
    @NotBlank(message = "Service name is required")
    @Schema(description = "Service name", example = "Cạo vôi răng và Đánh bóng", required = true)
    private String serviceName;

    @Schema(description = "Service description", example = "Lấy sạch vôi răng và mảng bám")
    private String description;

    @SuppressWarnings("deprecation")
    @NotNull(message = "Default duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Schema(description = "Default duration in minutes", example = "30", required = true)
    private Integer defaultDurationMinutes;

    @SuppressWarnings("deprecation")
    @NotNull(message = "Default buffer time is required")
    @Min(value = 0, message = "Buffer time cannot be negative")
    @Schema(description = "Default buffer time in minutes", example = "10", required = true)
    private Integer defaultBufferMinutes;

    @SuppressWarnings("deprecation")
    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    @Schema(description = "Service price (VND)", example = "300000", required = true)
    private BigDecimal price;

    @Schema(description = "Specialization ID (nullable)", example = "1")
    private Integer specializationId;

    @Min(value = 0, message = "Display order cannot be negative")
    @Schema(description = "Display order for sorting services", example = "1")
    private Integer displayOrder;

    @Builder.Default
    @Schema(description = "Active status", example = "true")
    private Boolean isActive = true;
}
