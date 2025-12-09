package com.dental.clinic.management.booking_appointment.domain;

import com.dental.clinic.management.booking_appointment.enums.AppointmentParticipantRole;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

/**
 * AppointmentParticipant Entity
 * Lưu các nhân viên khác tham gia lịch hẹn (ngoài Bác sĩ chính)
 * VD: Phụ tá, Bác sĩ phụ, Quan sát viên
 *
 * Default role: ASSISTANT khi tạo appointment mới
 */
@Entity
@Table(name = "appointment_participants")
public class AppointmentParticipant {

    @EmbeddedId
    private AppointmentParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", insertable = false, updatable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private com.dental.clinic.management.employee.domain.Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_role", nullable = false)
    private AppointmentParticipantRole role = AppointmentParticipantRole.ASSISTANT;

    // Constructors
    public AppointmentParticipant() {
    }

    public AppointmentParticipant(Integer appointmentId, Integer employeeId, AppointmentParticipantRole role) {
        this.id = new AppointmentParticipantId(appointmentId, employeeId);
        this.role = role;
    }

    // Getters and Setters
    public AppointmentParticipantId getId() {
        return id;
    }

    public void setId(AppointmentParticipantId id) {
        this.id = id;
    }

    public AppointmentParticipantRole getRole() {
        return role;
    }

    public void setRole(AppointmentParticipantRole role) {
        this.role = role;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof AppointmentParticipant))
            return false;
        AppointmentParticipant that = (AppointmentParticipant) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AppointmentParticipant{" +
                "appointmentId=" + (id != null ? id.getAppointmentId() : null) +
                ", employeeId=" + (id != null ? id.getEmployeeId() : null) +
                ", role='" + role + '\'' +
                '}';
    }

    /**
     * Composite Primary Key for AppointmentParticipant
     */
    @Embeddable
    public static class AppointmentParticipantId implements Serializable {

        @Column(name = "appointment_id", nullable = false)
        private Integer appointmentId;

        @Column(name = "employee_id", nullable = false)
        private Integer employeeId;

        // Constructors
        public AppointmentParticipantId() {
        }

        public AppointmentParticipantId(Integer appointmentId, Integer employeeId) {
            this.appointmentId = appointmentId;
            this.employeeId = employeeId;
        }

        // Getters and Setters
        public Integer getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(Integer appointmentId) {
            this.appointmentId = appointmentId;
        }

        public Integer getEmployeeId() {
            return employeeId;
        }

        public void setEmployeeId(Integer employeeId) {
            this.employeeId = employeeId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (!(o instanceof AppointmentParticipantId))
                return false;
            AppointmentParticipantId that = (AppointmentParticipantId) o;
            return Objects.equals(appointmentId, that.appointmentId) &&
                    Objects.equals(employeeId, that.employeeId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(appointmentId, employeeId);
        }
    }
}
