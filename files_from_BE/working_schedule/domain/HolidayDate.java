package com.dental.clinic.management.working_schedule.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing a specific holiday date.
 * A holiday date belongs to a holiday definition (e.g., "Lunar New Year 2025").
 * Uses composite primary key: (holiday_date + definition_id).
 */
@Entity
@Table(name = "holiday_dates")
@IdClass(HolidayDateId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDate {

    /**
     * The actual date of the holiday (part of composite PK).
     */
    @Id
    @Column(name = "holiday_date", nullable = false)
    @NotNull(message = "Holiday date is required")
    private LocalDate holidayDate;

    /**
     * Reference to the holiday definition ID (part of composite PK).
     */
    @Id
    @Column(name = "definition_id", length = 20, nullable = false)
    private String definitionId;

    /**
     * Many-to-One relationship with HolidayDefinition.
     * Uses definitionId as foreign key.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "definition_id", referencedColumnName = "definition_id",
                insertable = false, updatable = false)
    private HolidayDefinition holidayDefinition;

    /**
     * Optional description for this specific date.
     * E.g., "First day of Tet", "Victory Day celebration"
     */
    @Column(name = "description", length = 500)
    private String description;

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
