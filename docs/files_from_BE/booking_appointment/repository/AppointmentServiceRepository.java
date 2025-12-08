package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.AppointmentService;
import com.dental.clinic.management.booking_appointment.domain.AppointmentService.AppointmentServiceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AppointmentService Entity
 * Manages service assignments to appointments
 */
@Repository
public interface AppointmentServiceRepository extends JpaRepository<AppointmentService, AppointmentServiceId> {

    /**
     * Find all services for a specific appointment with eagerly loaded service details
     * Using JOIN FETCH to avoid LazyInitializationException
     */
    @Query("SELECT aps FROM AppointmentService aps JOIN FETCH aps.service WHERE aps.id.appointmentId = :appointmentId")
    List<AppointmentService> findByIdAppointmentId(@Param("appointmentId") Integer appointmentId);

    /**
     * Delete all services for an appointment
     */
    void deleteByIdAppointmentId(Integer appointmentId);
}
