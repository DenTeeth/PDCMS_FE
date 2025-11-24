package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.AppointmentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AppointmentAuditLog Entity
 * Used for tracking appointment change history
 */
@Repository
public interface AppointmentAuditLogRepository extends JpaRepository<AppointmentAuditLog, Integer> {

    /**
     * Find all audit logs for a specific appointment
     * Ordered by creation time (newest first)
     * Uses relationship path: appointment.appointmentId
     */
    List<AppointmentAuditLog> findByAppointment_AppointmentIdOrderByCreatedAtDesc(Integer appointmentId);
}
