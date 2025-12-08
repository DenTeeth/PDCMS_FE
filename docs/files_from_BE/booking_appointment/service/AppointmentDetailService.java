package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.AppointmentAuditLog;
import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant;
import com.dental.clinic.management.booking_appointment.dto.AppointmentDetailDTO;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentResponse;
import com.dental.clinic.management.booking_appointment.enums.AppointmentActionType;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.domain.AppointmentPlanItemBridge;
import com.dental.clinic.management.booking_appointment.repository.AppointmentAuditLogRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentParticipantRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentPlanItemRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.booking_appointment.repository.RoomRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for fetching single appointment detail
 * P3.4: GET /api/v1/appointments/{appointmentCode}
 *
 * Key Features:
 * - RBAC enforcement (VIEW_APPOINTMENT_ALL vs VIEW_APPOINTMENT_OWN)
 * - Load all related entities (patient, doctor, room, services, participants)
 * - Load cancellation reason from audit log if status = CANCELLED
 * - Compute dynamic fields (computedStatus, minutesLate)
 * - Return detailed DTO
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentDetailService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final EmployeeRepository employeeRepository;
    private final RoomRepository roomRepository;
    private final AppointmentParticipantRepository appointmentParticipantRepository;
    private final AppointmentAuditLogRepository appointmentAuditLogRepository;
    private final AppointmentPlanItemRepository appointmentPlanItemRepository;
    private final PatientPlanItemRepository patientPlanItemRepository;

    /**
     * Get appointment detail by code with RBAC check
     *
     * Business Logic:
     * 1. Find appointment by code (throw 404 if not found)
     * 2. Check RBAC permissions:
     * - VIEW_APPOINTMENT_ALL: Can view any appointment
     * - VIEW_APPOINTMENT_OWN:
     * * Patient: Can only view their own appointments
     * * Employee: Can view if they are doctor OR participant
     * 3. Load all related entities (patient, doctor, room, services, participants)
     * 4. Compute dynamic fields (computedStatus, minutesLate)
     * 5. Map to AppointmentDetailDTO
     *
     * @param appointmentCode Unique appointment code
     * @return AppointmentDetailDTO with full details
     * @throws com.dental.clinic.management.exception.ResourceNotFoundException if
     *                                                                          appointment
     *                                                                          not
     *                                                                          found
     * @throws AccessDeniedException                                            if
     *                                                                          user
     *                                                                          doesn't
     *                                                                          have
     *                                                                          permission
     *                                                                          to
     *                                                                          view
     */
    @Transactional(readOnly = true)
    public AppointmentDetailDTO getAppointmentDetail(String appointmentCode) {
        log.info("Fetching appointment detail for code: {}", appointmentCode);

        // Step 1: Find appointment
        // Using repository query with @Transactional(readOnly = true) ensures fresh data from DB
        // No need for entityManager.clear() which would detach entities and break lazy loading
        Appointment appointment = appointmentRepository.findDetailByCode(appointmentCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "APPOINTMENT_NOT_FOUND",
                        "Appointment not found with code: " + appointmentCode));

        // Step 2: RBAC Check
        checkPermission(appointment);

        // Step 3: Load related entities and map to DTO
        return mapToDetailDTO(appointment);
    }

    /**
     * Check if current user has permission to view this appointment
     *
     * RBAC Logic:
     * - VIEW_APPOINTMENT_ALL: Can view any appointment
     * - VIEW_APPOINTMENT_OWN:
     * * Employee roles (DENTIST, NURSE, etc.): Check if user is doctor OR
     * participant
     * * Patient role: Check if appointment.patientId == user's patientId
     *
     * @throws AccessDeniedException if user doesn't have permission
     */
    private void checkPermission(Appointment appointment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Check for VIEW_APPOINTMENT_ALL permission
        boolean canViewAll = auth.getAuthorities().stream()
                .anyMatch(grantedAuth -> grantedAuth.getAuthority().equals("VIEW_APPOINTMENT_ALL"));

        if (canViewAll) {
            log.debug("User has VIEW_APPOINTMENT_ALL permission - access granted");
            return;
        }

        // Check for VIEW_APPOINTMENT_OWN permission
        boolean canViewOwn = auth.getAuthorities().stream()
                .anyMatch(grantedAuth -> grantedAuth.getAuthority().equals("VIEW_APPOINTMENT_OWN"));

        if (!canViewOwn) {
            log.warn("User doesn't have VIEW_APPOINTMENT_OWN permission - access denied");
            throw new AccessDeniedException("You don't have permission to view appointments");
        }

        // Extract username from JWT token
        String username = null;
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            username = jwt.getSubject();
        } else if (auth.getPrincipal() instanceof String) {
            username = (String) auth.getPrincipal();
        }

        if (username == null) {
            log.warn("Could not extract username from authentication");
            throw new AccessDeniedException("Invalid authentication token");
        }

        log.debug("RBAC check for user: {}", username);

        // Check if user is an employee (has employee-related roles)
        boolean isEmployeeRole = auth.getAuthorities().stream()
                .anyMatch(grantedAuth -> {
                    String authority = grantedAuth.getAuthority();
                    return authority.equals("ROLE_DENTIST") ||
                            authority.equals("ROLE_NURSE") ||
                            authority.equals("ROLE_DENTIST_INTERN") ||
                            authority.equals("ROLE_RECEPTIONIST") ||
                            authority.equals("ROLE_MANAGER");
                });

        if (isEmployeeRole) {
            // Employee can view if they are doctor OR participant
            Optional<Integer> myEmployeeId = employeeRepository.findByAccount_Username(username)
                    .map(e -> e.getEmployeeId());

            if (myEmployeeId.isEmpty()) {
                log.warn("Employee account {} not found in employee table", username);
                throw new AccessDeniedException("Employee profile not found");
            }

            boolean isDoctor = appointment.getEmployeeId().equals(myEmployeeId.get());
            boolean isParticipant = appointmentParticipantRepository
                    .findByIdAppointmentId(appointment.getAppointmentId())
                    .stream()
                    .anyMatch(ap -> ap.getId().getEmployeeId().equals(myEmployeeId.get()));

            if (!isDoctor && !isParticipant) {
                log.warn("Employee {} tried to access unrelated appointment {}",
                        myEmployeeId.get(), appointment.getAppointmentCode());
                throw new AccessDeniedException("You can only view appointments where you are involved");
            }
        } else {
            // Patient role - check if they own this appointment
            var patientOpt = patientRepository.findByAccount_Username(username);
            if (patientOpt.isPresent()) {
                Integer patientId = patientOpt.get().getPatientId();

                if (appointment.getPatientId().equals(patientId)) {
                    log.debug("Patient {} is viewing their own appointment {}", patientId,
                            appointment.getAppointmentCode());
                    return;
                }

                log.warn("Patient {} attempted to access different patient's appointment {}",
                        patientId, appointment.getAppointmentCode());
                throw new AccessDeniedException("You can only view your own appointments");
            }

            // User not found as employee or patient
            log.warn("User {} not found as employee or patient", username);
            throw new AccessDeniedException("Access Denied");
        }

        log.debug("RBAC check passed - access granted");
    }

    /**
     * Map Appointment entity to DetailDTO with all related entities
     */
    private AppointmentDetailDTO mapToDetailDTO(Appointment appointment) {
        // Load patient (with phone and DOB for detail view)
        CreateAppointmentResponse.PatientSummary patientSummary = null;
        try {
            var patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
            if (patient != null) {
                patientSummary = CreateAppointmentResponse.PatientSummary.builder()
                        .patientCode(patient.getPatientCode())
                        .fullName(patient.getFirstName() + " " + patient.getLastName())
                        .phone(patient.getPhone())
                        .dateOfBirth(patient.getDateOfBirth())
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to load patient: {}", e.getMessage());
        }

        // Load doctor (primary employee)
        CreateAppointmentResponse.DoctorSummary doctorSummary = null;
        try {
            var employee = employeeRepository.findById(appointment.getEmployeeId()).orElse(null);
            if (employee != null) {
                doctorSummary = CreateAppointmentResponse.DoctorSummary.builder()
                        .employeeCode(employee.getEmployeeCode())
                        .fullName(employee.getFirstName() + " " + employee.getLastName())
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to load doctor: {}", e.getMessage());
        }

        // Load room from RoomRepository
        CreateAppointmentResponse.RoomSummary roomSummary = null;
        try {
            var room = roomRepository.findById(appointment.getRoomId()).orElse(null);
            if (room != null) {
                roomSummary = CreateAppointmentResponse.RoomSummary.builder()
                        .roomCode(room.getRoomCode())
                        .roomName(room.getRoomName())
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to load room: {}", e.getMessage());
        }

        // Load services using direct JPQL query
        List<CreateAppointmentResponse.ServiceSummary> services = new ArrayList<>();
        try {
            List<Object[]> serviceData = appointmentRepository.findServicesByAppointmentId(appointment.getAppointmentId());
            
            for (Object[] row : serviceData) {
                String serviceCode = (String) row[0];
                String serviceName = (String) row[1];
                services.add(CreateAppointmentResponse.ServiceSummary.builder()
                        .serviceCode(serviceCode)
                        .serviceName(serviceName)
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to load services for appointment {}: {}", appointment.getAppointmentCode(), e.getMessage());
        }

        // Load participants
        List<CreateAppointmentResponse.ParticipantSummary> participants = new ArrayList<>();
        try {
            List<AppointmentParticipant> appointmentParticipants = appointmentParticipantRepository
                    .findByIdAppointmentId(appointment.getAppointmentId());

            for (AppointmentParticipant ap : appointmentParticipants) {
                var participantEmployee = employeeRepository.findById(ap.getId().getEmployeeId()).orElse(null);
                if (participantEmployee != null) {
                    participants.add(CreateAppointmentResponse.ParticipantSummary.builder()
                            .employeeCode(participantEmployee.getEmployeeCode())
                            .fullName(participantEmployee.getFirstName() + " " + participantEmployee.getLastName())
                            .role(ap.getRole())
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load participants: {}", e.getMessage());
        }

        // Load createdBy user info
        String createdByName = null;
        try {
            if (appointment.getCreatedBy() != null) {
                var createdByEmployee = employeeRepository.findById(appointment.getCreatedBy()).orElse(null);
                if (createdByEmployee != null) {
                    createdByName = createdByEmployee.getFirstName() + " " + createdByEmployee.getLastName();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load createdBy info: {}", e.getMessage());
        }

        // Load cancellation reason from audit log (if status = CANCELLED)
        String cancellationReason = null;
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            try {
                List<AppointmentAuditLog> auditLogs = appointmentAuditLogRepository
                        .findByAppointment_AppointmentIdOrderByCreatedAtDesc(appointment.getAppointmentId());

                // Find the CANCEL action log
                AppointmentAuditLog cancelLog = auditLogs.stream()
                        .filter(log -> log.getActionType() == AppointmentActionType.CANCEL)
                        .findFirst()
                        .orElse(null);

                if (cancelLog != null) {
                    // Build cancellation reason from reasonCode and notes
                    StringBuilder reason = new StringBuilder();
                    if (cancelLog.getReasonCode() != null) {
                        reason.append(cancelLog.getReasonCode().name());
                    }
                    if (cancelLog.getNotes() != null && !cancelLog.getNotes().isEmpty()) {
                        if (reason.length() > 0) {
                            reason.append(": ");
                        }
                        reason.append(cancelLog.getNotes());
                    }
                    cancellationReason = reason.toString();
                }
            } catch (Exception e) {
                log.warn("Failed to load cancellation reason: {}", e.getMessage());
            }
        }

        // Load linked treatment plan code (if appointment is linked to plan items)
        String linkedPlanCode = null;
        try {
            // Query: appointment_plan_items → patient_plan_items → phases → treatment_plan
            List<AppointmentPlanItemBridge> bridges = appointmentPlanItemRepository
                    .findById_AppointmentId(appointment.getAppointmentId());
            
            if (!bridges.isEmpty()) {
                // Get first item's plan code (all items in same appointment should be from same plan)
                Long firstItemId = bridges.get(0).getId().getItemId();
                PatientPlanItem item = patientPlanItemRepository.findById(firstItemId).orElse(null);
                if (item != null && item.getPhase() != null && item.getPhase().getTreatmentPlan() != null) {
                    linkedPlanCode = item.getPhase().getTreatmentPlan().getPlanCode();
                    log.debug("Found linked treatment plan: {} for appointment: {}", 
                            linkedPlanCode, appointment.getAppointmentCode());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load linked treatment plan code for appointment {}: {}", 
                    appointment.getAppointmentCode(), e.getMessage());
        }

        // Compute dynamic fields
        LocalDateTime now = LocalDateTime.now();
        String computedStatus = calculateComputedStatus(appointment, now);
        Long minutesLate = calculateMinutesLate(appointment, now);

        return AppointmentDetailDTO.builder()
                .appointmentId(appointment.getAppointmentId())
                .appointmentCode(appointment.getAppointmentCode())
                .status(appointment.getStatus().name())
                .computedStatus(computedStatus)
                .minutesLate(minutesLate)
                .appointmentStartTime(appointment.getAppointmentStartTime())
                .appointmentEndTime(appointment.getAppointmentEndTime())
                .expectedDurationMinutes(appointment.getExpectedDurationMinutes())
                .actualStartTime(appointment.getActualStartTime())
                .actualEndTime(appointment.getActualEndTime())
                .cancellationReason(cancellationReason)
                .notes(appointment.getNotes())
                .patient(patientSummary)
                .doctor(doctorSummary)
                .room(roomSummary)
                .services(services)
                .participants(participants)
                .createdBy(createdByName)
                .createdAt(appointment.getCreatedAt())
                .linkedTreatmentPlanCode(linkedPlanCode)
                .build();
    }

    /**
     * Calculate computed status (same logic as AppointmentListService)
     */
    private String calculateComputedStatus(Appointment appointment, LocalDateTime now) {
        AppointmentStatus status = appointment.getStatus();

        return switch (status) {
            case CANCELLED -> "CANCELLED";
            case COMPLETED -> "COMPLETED";
            case NO_SHOW -> "NO_SHOW";
            case CHECKED_IN -> "CHECKED_IN";
            case IN_PROGRESS -> "IN_PROGRESS";
            case SCHEDULED -> {
                if (now.isAfter(appointment.getAppointmentStartTime())) {
                    yield "LATE";
                } else {
                    yield "UPCOMING";
                }
            }
        };
    }

    /**
     * Calculate minutes late (same logic as AppointmentListService)
     */
    private Long calculateMinutesLate(Appointment appointment, LocalDateTime now) {
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            return 0L;
        }

        if (now.isAfter(appointment.getAppointmentStartTime())) {
            return Duration.between(appointment.getAppointmentStartTime(), now).toMinutes();
        }

        return 0L;
    }
}
