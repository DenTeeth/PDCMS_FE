package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Bridge entity for N-N relationship between Appointments and PatientPlanItems
 * Table: appointment_plan_items
 *
 * Purpose: Track which treatment plan items are linked to which appointment
 */
@Entity
@Table(name = "appointment_plan_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentPlanItemBridge {

    @EmbeddedId
    private AppointmentPlanItemBridgeId id;

    /**
     * Composite Primary Key for bridge table
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", insertable = false, updatable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", insertable = false, updatable = false)
    private com.dental.clinic.management.treatment_plans.domain.PatientPlanItem item;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentPlanItemBridgeId implements Serializable {

        @Column(name = "appointment_id")
        private Long appointmentId;

        @Column(name = "item_id")
        private Long itemId;
    }
}
