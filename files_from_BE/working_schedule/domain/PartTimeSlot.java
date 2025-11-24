package com.dental.clinic.management.working_schedule.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a part-time slot that admin creates.
 * Defines clinic's needs (e.g., "Need 2 people for Morning shift on Friday & Saturday").
 * 
 * NEW SPECIFICATION (Dynamic Quota):
 * - effectiveFrom/effectiveTo: Flexible date range (not fixed 3 months)
 * - dayOfWeek: Multiple days (e.g., FRIDAY, SATURDAY)
 * - quota: Number of people needed PER DAY
 * - Employees can register for flexible periods within the slot's effective range
 */
@Entity
@Table(name = "part_time_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PartTimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "slot_id")
    private Long slotId;

    @Column(name = "work_shift_id", length = 20, nullable = false)
    private String workShiftId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_shift_id", insertable = false, updatable = false)
    private WorkShift workShift;

    /**
     * Multiple days of week this slot is available.
     * Example: ["FRIDAY", "SATURDAY"]
     * Stored as comma-separated string in DB: "FRIDAY,SATURDAY"
     */
    @Column(name = "day_of_week", nullable = false)
    private String dayOfWeek; // Will be migrated to support multiple values

    /**
     * Start date of slot availability.
     * Example: 2025-11-09
     */
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    /**
     * End date of slot availability.
     * Example: 2025-11-30
     */
    @Column(name = "effective_to", nullable = false)
    private LocalDate effectiveTo;

    /**
     * Number of people needed PER DAY for this slot.
     * Example: quota=2 means 2 people needed on EACH working day.
     */
    @Column(name = "quota", nullable = false)
    private Integer quota = 1;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_time_slot_id", insertable = false, updatable = false)
    private List<PartTimeRegistration> registrations = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
