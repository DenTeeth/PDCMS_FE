package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.working_schedule.enums.HolidayType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a holiday definition.
 * A holiday can span multiple dates (e.g., Tet holiday lasts 2 weeks).
 */
@Entity
@Table(name = "holiday_definitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDefinition {

    @Id
    @Column(name = "definition_id", length = 20, nullable = false)
    private String definitionId;

    @Column(name = "holiday_name", length = 100, nullable = false, unique = true)
    private String holidayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "holiday_type", nullable = false, length = 20)
    private HolidayType holidayType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * One holiday definition can have multiple dates.
     * CascadeType.ALL: When deleting definition, all dates are deleted.
     * orphanRemoval: When removing a date from the list, it's deleted from DB.
     */
    @OneToMany(
        mappedBy = "holidayDefinition",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<HolidayDate> holidayDates = new ArrayList<>();

    /**
     * Helper method to add a holiday date.
     * Maintains bidirectional relationship.
     */
    public void addHolidayDate(HolidayDate holidayDate) {
        holidayDates.add(holidayDate);
        holidayDate.setHolidayDefinition(this);
    }

    /**
     * Helper method to remove a holiday date.
     * Maintains bidirectional relationship.
     */
    public void removeHolidayDate(HolidayDate holidayDate) {
        holidayDates.remove(holidayDate);
        holidayDate.setHolidayDefinition(null);
    }

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
