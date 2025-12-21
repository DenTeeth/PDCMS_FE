package com.dental.clinic.management.service.domain;

import com.dental.clinic.management.specialization.domain.Specialization;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a dental service
 * V17: Added category_id FK and display_order for grouping
 * V21.4: Added specialization FK for doctor qualification validation
 */
@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DentalService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "service_code", unique = true, nullable = false, length = 50)
    private String serviceCode;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "default_duration_minutes", nullable = false)
    private Integer defaultDurationMinutes;

    /**
     * V17: Link to service category (e.g., "A. General Dentistry")
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ServiceCategory category;

    /**
     * V21.4: Link to required specialization for performing this service
     * If NULL, service can be performed by any doctor (general service)
     * If NOT NULL, doctor must have this specialization to perform service
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialization_id", foreignKey = @ForeignKey(name = "fk_service_specialization"))
    private Specialization specialization;

    /**
     * V17: Display order within category (for UI ordering)
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * BE_4: Minimum preparation days before this service can be performed
     * Example: Dental implant may need 7 days preparation after initial consultation
     */
    @Column(name = "minimum_preparation_days")
    @Builder.Default
    private Integer minimumPreparationDays = 0;

    /**
     * BE_4: Recovery days needed after this service before another appointment
     * Example: Tooth extraction may need 7 days recovery before next procedure
     */
    @Column(name = "recovery_days")
    @Builder.Default
    private Integer recoveryDays = 0;

    /**
     * BE_4: Spacing days required between consecutive appointments for this service
     * Example: Orthodontic adjustments may need 30 days spacing
     */
    @Column(name = "spacing_days")
    @Builder.Default
    private Integer spacingDays = 0;

    /**
     * BE_4: Maximum appointments allowed per day for this service
     * Example: Complex surgeries may be limited to 2 per day
     * NULL or 0 means no limit
     */
    @Column(name = "max_appointments_per_day")
    private Integer maxAppointmentsPerDay;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
