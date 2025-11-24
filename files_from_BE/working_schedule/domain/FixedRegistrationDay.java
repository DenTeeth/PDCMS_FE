package com.dental.clinic.management.working_schedule.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Entity representing a day of the week for a fixed shift registration.
 * This is part of the composite pattern for fixed schedules.
 *
 * Schema V14 - Luồng 1: Lịch Cố định
 */
@Entity
@Table(name = "fixed_registration_days")
@IdClass(FixedRegistrationDay.FixedRegistrationDayId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FixedRegistrationDay {

    /**
     * Reference to the parent registration.
     */
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
    private FixedShiftRegistration fixedShiftRegistration;

    /**
     * Day of the week (MONDAY, TUESDAY, ..., SUNDAY).
     */
    @Id
    @Column(name = "day_of_week", length = 10, nullable = false)
    @NotBlank(message = "Day of week is required")
    private String dayOfWeek;

    /**
     * Composite primary key class.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FixedRegistrationDayId implements Serializable {
        private Integer fixedShiftRegistration;
        private String dayOfWeek;

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (o == null || getClass() != o.getClass())
                return false;
            FixedRegistrationDayId that = (FixedRegistrationDayId) o;
            return fixedShiftRegistration.equals(that.fixedShiftRegistration) &&
                    dayOfWeek.equals(that.dayOfWeek);
        }

        @Override
        public int hashCode() {
            return fixedShiftRegistration.hashCode() + dayOfWeek.hashCode();
        }
    }
}
