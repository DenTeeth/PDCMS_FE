package com.dental.clinic.management.booking_appointment.domain;

import com.dental.clinic.management.specialization.domain.Specialization;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DentalService entity - Represents dental services (treatments)
 * Used for appointment scheduling and treatment planning
 * Entity name explicitly set to avoid conflict with
 * service.domain.DentalService
 */
@Entity(name = "BookingDentalService")
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DentalService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    private Integer serviceId;

    @NotBlank(message = "Service code cannot be blank")
    @Column(name = "service_code", unique = true, nullable = false, length = 50)
    private String serviceCode;

    @NotBlank(message = "Service name cannot be blank")
    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Default duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Column(name = "default_duration_minutes", nullable = false)
    private Integer defaultDurationMinutes;

    @Min(value = 0, message = "Buffer time cannot be negative")
    @Column(name = "default_buffer_minutes", nullable = false)
    private Integer defaultBufferMinutes = 0;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialization_id", foreignKey = @ForeignKey(name = "fk_service_specialization"))
    private Specialization specialization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "fk_service_category"))
    private com.dental.clinic.management.service.domain.ServiceCategory category;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.defaultBufferMinutes == null) {
            this.defaultBufferMinutes = 0;
        }
        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof DentalService))
            return false;
        DentalService that = (DentalService) o;
        return serviceId != null && serviceId.equals(that.getServiceId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "DentalService{" +
                "serviceId=" + serviceId +
                ", serviceCode='" + serviceCode + '\'' +
                ", serviceName='" + serviceName + '\'' +
                ", price=" + price +
                ", duration=" + defaultDurationMinutes +
                ", isActive=" + isActive +
                '}';
    }
}
