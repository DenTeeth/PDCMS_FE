package com.dental.clinic.management.booking_appointment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for updating a dental service
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request body for updating a service")
public class UpdateServiceRequest {

    @Schema(description = "Unique service code", example = "SV-CAOVOI-UPDATED")
    private String serviceCode;

    @Schema(description = "Service name", example = "Cạo vôi răng và Đánh bóng (VIP)")
    private String serviceName;

    @Schema(description = "Service description", example = "Lấy sạch vôi răng với công nghệ mới")
    private String description;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Schema(description = "Default duration in minutes", example = "35")
    private Integer defaultDurationMinutes;

    @Min(value = 0, message = "Buffer time cannot be negative")
    @Schema(description = "Default buffer time in minutes", example = "10")
    private Integer defaultBufferMinutes;

    @Min(value = 0, message = "Price cannot be negative")
    @Schema(description = "Service price (VND)", example = "350000")
    private BigDecimal price;

    @Schema(description = "Specialization ID (nullable)", example = "1")
    private Integer specializationId;

    @Min(value = 0, message = "Display order cannot be negative")
    @Schema(description = "Display order for sorting services", example = "1")
    private Integer displayOrder;

    @Min(value = 0, message = "Minimum preparation days cannot be negative")
    @Schema(description = "BE_4: Minimum preparation days before this service (days)", example = "0")
    private Integer minimumPreparationDays;

    @Min(value = 0, message = "Recovery days cannot be negative")
    @Schema(description = "BE_4: Recovery days needed after this service (days)", example = "0")
    private Integer recoveryDays;

    @Min(value = 0, message = "Spacing days cannot be negative")
    @Schema(description = "BE_4: Spacing days between consecutive appointments (days)", example = "0")
    private Integer spacingDays;

    @Min(value = 1, message = "Max appointments per day must be at least 1")
    @Schema(description = "BE_4: Maximum appointments allowed per day (null = no limit)", example = "5")
    private Integer maxAppointmentsPerDay;

    @Schema(description = "Active status", example = "true")
    private Boolean isActive;
}
