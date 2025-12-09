package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant;
import com.dental.clinic.management.booking_appointment.domain.AppointmentAuditLog;
import com.dental.clinic.management.booking_appointment.dto.AppointmentDetailDTO;
import com.dental.clinic.management.booking_appointment.dto.request.DelayAppointmentRequest;
import com.dental.clinic.management.booking_appointment.enums.AppointmentActionType;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.AppointmentAuditLogRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentParticipantRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for delaying appointments to new time slots.
 *
 * Business Rules:
 * - Only SCHEDULED or CHECKED_IN appointments can be delayed
 * - New start time must be after original start time
 * - Preferably on the same day (cross-validation in controller)
 * - Must check conflicts for: doctor, room, patient, participants
 * - Creates audit log with DELAY action
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentDelayService {

        private final AppointmentRepository appointmentRepository;
        private final AppointmentParticipantRepository participantRepository;
        private final AppointmentAuditLogRepository auditLogRepository;
        private final EmployeeRepository employeeRepository;
        private final AppointmentDetailService detailService;

        /**
         * Delay appointment to new time slot with conflict checking.
         *
         * @param appointmentCode Appointment code (e.g., "APT-20251115-001")
         * @param request         Delay details (newStartTime, reasonCode, notes)
         * @return Updated appointment detail
         * @throws IllegalArgumentException if appointment not found
         * @throws IllegalStateException    if status invalid or conflicts exist
         */
        @Transactional
        public AppointmentDetailDTO delayAppointment(String appointmentCode, DelayAppointmentRequest request) {
                log.info("Delaying appointment {} to new time {}", appointmentCode, request.getNewStartTime());

                // STEP 1: Load appointment with pessimistic lock (prevent concurrent
                // modifications)
                Appointment appointment = appointmentRepository.findByCodeForUpdate(appointmentCode)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Appointment not found: " + appointmentCode));

                // STEP 2: Validate business rules
                validateDelayRequest(appointment, request);

                // STEP 3: Calculate new end time
                LocalDateTime oldStartTime = appointment.getAppointmentStartTime();
                LocalDateTime newStartTime = request.getNewStartTime();
                LocalDateTime newEndTime = newStartTime.plusMinutes(appointment.getExpectedDurationMinutes());

                // STEP 4: Check conflicts (doctor, room, patient, participants)
                checkConflicts(appointment, newStartTime, newEndTime);

                // STEP 5: Update appointment times
                appointment.setAppointmentStartTime(newStartTime);
                appointment.setAppointmentEndTime(newEndTime);
                appointmentRepository.save(appointment);

                // STEP 6: Create audit log
                createDelayAuditLog(appointment, oldStartTime, newStartTime, request);

                log.info("Successfully delayed appointment {} from {} to {}",
                                appointmentCode, oldStartTime, newStartTime);

                // STEP 7: Return updated appointment detail
                return detailService.getAppointmentDetail(appointmentCode);
        }

        /**
         * Validate delay request against business rules.
         */
        private void validateDelayRequest(Appointment appointment, DelayAppointmentRequest request) {
                // Rule 1: Only SCHEDULED or CHECKED_IN can be delayed
                AppointmentStatus status = appointment.getStatus();
                if (status != AppointmentStatus.SCHEDULED && status != AppointmentStatus.CHECKED_IN) {
                        throw new IllegalStateException(
                                        String.format(
                                                        "Cannot delay appointment in status %s. Only SCHEDULED or CHECKED_IN appointments can be delayed.",
                                                        status));
                }

                // Rule 2: Terminal states cannot be changed
                if (isTerminalState(status)) {
                        throw new IllegalStateException(
                                        "Cannot delay appointment in terminal state: " + status);
                }

                // Rule 3: New start time must be after original start time
                LocalDateTime originalStartTime = appointment.getAppointmentStartTime();
                LocalDateTime newStartTime = request.getNewStartTime();
                if (!newStartTime.isAfter(originalStartTime)) {
                        throw new IllegalArgumentException(
                                        String.format("New start time (%s) must be after original start time (%s)",
                                                        newStartTime, originalStartTime));
                }

                // Rule 4: New start time should not be in the past
                if (newStartTime.isBefore(LocalDateTime.now())) {
                        throw new IllegalArgumentException(
                                        "Cannot delay appointment to a time in the past: " + newStartTime);
                }

                // Optional: Warn if delay spans multiple days (log only, don't reject)
                LocalDate originalDate = originalStartTime.toLocalDate();
                LocalDate newDate = newStartTime.toLocalDate();
                if (!originalDate.equals(newDate)) {
                        log.warn("Appointment {} delayed from {} to {} (crosses date boundary)",
                                        appointment.getAppointmentCode(), originalDate, newDate);
                }
        }

        /**
         * Check if status is terminal (no further transitions allowed).
         */
        private boolean isTerminalState(AppointmentStatus status) {
                return status == AppointmentStatus.COMPLETED
                                || status == AppointmentStatus.CANCELLED
                                || status == AppointmentStatus.NO_SHOW;
        }

        /**
         * Check for scheduling conflicts in new time slot.
         * Throws exception if any conflict found.
         */
        private void checkConflicts(Appointment appointment, LocalDateTime newStartTime, LocalDateTime newEndTime) {
                Integer appointmentId = appointment.getAppointmentId();

                // Conflict 1: Doctor availability
                Integer doctorId = appointment.getEmployeeId();
                boolean doctorConflict = appointmentRepository.existsConflictForDoctor(
                                doctorId, newStartTime, newEndTime, appointmentId);
                if (doctorConflict) {
                        throw new IllegalStateException(
                                        String.format("Doctor has conflicting appointment during %s - %s",
                                                        newStartTime, newEndTime));
                }

                // Conflict 2: Room availability
                String roomId = appointment.getRoomId();
                boolean roomConflict = appointmentRepository.existsConflictForRoom(
                                roomId, newStartTime, newEndTime, appointmentId);
                if (roomConflict) {
                        throw new IllegalStateException(
                                        String.format("Room %s is occupied during %s - %s",
                                                        roomId, newStartTime, newEndTime));
                }

                // Conflict 3: Patient availability
                Integer patientId = appointment.getPatientId();
                boolean patientConflict = appointmentRepository.existsConflictForPatient(
                                patientId, newStartTime, newEndTime, appointmentId);
                if (patientConflict) {
                        throw new IllegalStateException(
                                        String.format("Patient already has another appointment during %s - %s",
                                                        newStartTime, newEndTime));
                }

                // Conflict 4: Participants availability (nurses, assistants)
                List<AppointmentParticipant> participants = participantRepository
                                .findByIdAppointmentId(appointmentId);

                for (AppointmentParticipant participant : participants) {
                        Integer participantEmployeeId = participant.getId().getEmployeeId();

                        // Check if participant has conflicting appointment
                        boolean participantConflict = appointmentRepository.existsConflictForParticipant(
                                        participantEmployeeId, newStartTime, newEndTime, appointmentId);

                        if (participantConflict) {
                                throw new IllegalStateException(
                                                String.format("Participant (employeeId=%s) has conflicting appointment during %s - %s",
                                                                participantEmployeeId, newStartTime, newEndTime));
                        }
                }

                log.info("All conflict checks passed for appointment {} at new time slot {}-{}",
                                appointment.getAppointmentCode(), newStartTime, newEndTime);
        }

        /**
         * Create audit log for delay action.
         */
        private void createDelayAuditLog(
                        Appointment appointment,
                        LocalDateTime oldStartTime,
                        LocalDateTime newStartTime,
                        DelayAppointmentRequest request) {

                Integer performedByEmployeeId = getCurrentEmployeeId();

                // Fetch employee entity if ID is not 0 (SYSTEM)
                com.dental.clinic.management.employee.domain.Employee performedByEmployee = null;
                if (performedByEmployeeId != 0) {
                        performedByEmployee = employeeRepository.findById(performedByEmployeeId).orElse(null);
                }

                AppointmentAuditLog auditLog = AppointmentAuditLog.builder()
                                .appointment(appointment)
                                .performedByEmployee(performedByEmployee)
                                .actionType(AppointmentActionType.DELAY)
                                .oldStatus(appointment.getStatus()) // Status unchanged (still SCHEDULED/CHECKED_IN)
                                .newStatus(appointment.getStatus())
                                .reasonCode(request.getReasonCode())
                                .notes(request.getNotes())
                                .oldStartTime(oldStartTime)
                                .newStartTime(newStartTime)
                                .build();

                auditLogRepository.save(auditLog);
                log.info("Created DELAY audit log for appointment {}", appointment.getAppointmentCode());
        }

        /**
         * Get current employee ID from JWT token.
         * Extracts username from token and queries employee table.
         *
         * @return Employee ID of current user
         * @throws IllegalStateException if user not found or not an employee
         */
        private Integer getCurrentEmployeeId() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
                        throw new IllegalStateException("No valid JWT authentication found");
                }

                Jwt jwt = (Jwt) authentication.getPrincipal();
                String username = jwt.getSubject();

                Employee employee = employeeRepository.findByAccount_Username(username)
                                .orElseThrow(() -> new IllegalStateException(
                                                "Current user is not an employee: " + username));

                return employee.getEmployeeId();
        }
}
