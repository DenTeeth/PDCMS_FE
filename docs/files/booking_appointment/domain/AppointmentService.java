package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

/**
 * AppointmentService Entity
 * Junction table: Một lịch hẹn có thể bao gồm nhiều dịch vụ
 * VD: "Cạo vôi" + "Trám răng" trong cùng 1 ca
 */
@Entity
@Table(name = "appointment_services")
public class AppointmentService {

    @EmbeddedId
    private AppointmentServiceId id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id", insertable = false, updatable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", insertable = false, updatable = false)
    private com.dental.clinic.management.service.domain.DentalService service;

    // Constructors
    public AppointmentService() {
    }

    public AppointmentService(Integer appointmentId, Integer serviceId) {
        this.id = new AppointmentServiceId(appointmentId, serviceId);
    }

    // Getters and Setters
    public AppointmentServiceId getId() {
        return id;
    }

    public void setId(AppointmentServiceId id) {
        this.id = id;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public com.dental.clinic.management.service.domain.DentalService getService() {
        return service;
    }

    public void setService(com.dental.clinic.management.service.domain.DentalService service) {
        this.service = service;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof AppointmentService))
            return false;
        AppointmentService that = (AppointmentService) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AppointmentService{" +
                "appointmentId=" + (id != null ? id.getAppointmentId() : null) +
                ", serviceId=" + (id != null ? id.getServiceId() : null) +
                '}';
    }

    /**
     * Composite Primary Key for AppointmentService
     */
    @Embeddable
    public static class AppointmentServiceId implements Serializable {

        @Column(name = "appointment_id", nullable = false)
        private Integer appointmentId;

        @Column(name = "service_id", nullable = false)
        private Integer serviceId;

        // Constructors
        public AppointmentServiceId() {
        }

        public AppointmentServiceId(Integer appointmentId, Integer serviceId) {
            this.appointmentId = appointmentId;
            this.serviceId = serviceId;
        }

        // Getters and Setters
        public Integer getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(Integer appointmentId) {
            this.appointmentId = appointmentId;
        }

        public Integer getServiceId() {
            return serviceId;
        }

        public void setServiceId(Integer serviceId) {
            this.serviceId = serviceId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (!(o instanceof AppointmentServiceId))
                return false;
            AppointmentServiceId that = (AppointmentServiceId) o;
            return Objects.equals(appointmentId, that.appointmentId) &&
                    Objects.equals(serviceId, that.serviceId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(appointmentId, serviceId);
        }
    }
}
