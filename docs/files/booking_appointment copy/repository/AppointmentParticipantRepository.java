package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant;
import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant.AppointmentParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for AppointmentParticipant Entity
 * Manages assistant/secondary doctor assignments to appointments
 */
@Repository
public interface AppointmentParticipantRepository
        extends JpaRepository<AppointmentParticipant, AppointmentParticipantId> {

    /**
     * Find all participants for a specific appointment
     */
    List<AppointmentParticipant> findByIdAppointmentId(Integer appointmentId);

    /**
     * Find all appointments where an employee is a participant (not primary doctor)
     * Used for: Checking assistant's busy time slots
     */
    @Query("SELECT ap FROM AppointmentParticipant ap " +
            "JOIN Appointment a ON ap.id.appointmentId = a.appointmentId " +
            "WHERE ap.id.employeeId = :employeeId " +
            "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
            "AND ((a.appointmentStartTime >= :startTime AND a.appointmentStartTime < :endTime) " +
            "OR (a.appointmentEndTime > :startTime AND a.appointmentEndTime <= :endTime) " +
            "OR (a.appointmentStartTime <= :startTime AND a.appointmentEndTime >= :endTime))")
    List<AppointmentParticipant> findByEmployeeAndTimeRange(
            @Param("employeeId") Integer employeeId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Check if employee has conflict as participant
     */
    @Query("SELECT COUNT(ap) > 0 FROM AppointmentParticipant ap " +
            "JOIN Appointment a ON ap.id.appointmentId = a.appointmentId " +
            "WHERE ap.id.employeeId = :employeeId " +
            "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
            "AND ((a.appointmentStartTime < :endTime AND a.appointmentEndTime > :startTime))")
    boolean existsConflictForParticipant(
            @Param("employeeId") Integer employeeId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Delete all participants for an appointment
     */
    void deleteByIdAppointmentId(Integer appointmentId);
}
