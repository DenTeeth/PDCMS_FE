package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant;
import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant.AppointmentParticipantId;
import com.dental.clinic.management.booking_appointment.domain.AppointmentService;
import com.dental.clinic.management.booking_appointment.domain.AppointmentService.AppointmentServiceId;
import com.dental.clinic.management.booking_appointment.domain.AppointmentAuditLog;
import com.dental.clinic.management.booking_appointment.domain.Room;
import com.dental.clinic.management.booking_appointment.domain.DentalService;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.booking_appointment.domain.AppointmentPlanItemBridge;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentRequest;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentResponse;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentResponse.*;
import com.dental.clinic.management.booking_appointment.enums.AppointmentActionType;
import com.dental.clinic.management.booking_appointment.enums.AppointmentParticipantRole;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.*;
import com.dental.clinic.management.booking_appointment.repository.BookingDentalServiceRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.working_schedule.domain.EmployeeShift;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for creating appointments (P3.2)
 *
 * 9-Step Transactional Process:
 * 1. Get Creator from SecurityContext
 * 2. Validate all resources (patient, doctor, room, services, participants)
 * 3. Validate doctor specializations
 * 4. Validate room compatibility (room_services)
 * 5. Calculate duration and end time
 * 6. Validate shifts (doctor and participants)
 * 7. Check conflicts (doctor, room, patient, participants)
 * 8. Insert appointment + services + participants + audit log
 * 9. Return response with nested summaries
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentCreationService {

        private final PatientRepository patientRepository;
        private final EmployeeRepository employeeRepository;
        private final RoomRepository roomRepository;
        private final BookingDentalServiceRepository dentalServiceRepository;
        private final RoomServiceRepository roomServiceRepository;
        private final EmployeeShiftRepository employeeShiftRepository;
        private final AppointmentRepository appointmentRepository;
        private final AppointmentServiceRepository appointmentServiceRepository;
        private final AppointmentParticipantRepository appointmentParticipantRepository;
        private final AppointmentAuditLogRepository appointmentAuditLogRepository;

        // Treatment Plan Integration (V2)
        private final PatientPlanItemRepository patientPlanItemRepository;
        private final AppointmentPlanItemRepository appointmentPlanItemRepository;
        private final com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository treatmentPlanRepository;

        // V21: Clinical Rules Validation
        private final com.dental.clinic.management.service.service.ClinicalRulesValidationService clinicalRulesValidationService;

        // Notification Service
        private final com.dental.clinic.management.notification.service.NotificationService notificationService;

        private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        private static final String ENTITY_NAME = "appointment";

        /**
         * Create new appointment with full validation and conflict checking
         *
         * @param request Create appointment request
         * @return Response with created appointment details
         * @throws BadRequestAlertException if validation fails
         */
        @Transactional
        public CreateAppointmentResponse createAppointment(CreateAppointmentRequest request) {
                log.info("Creating appointment for patient: {}, doctor: {}, start time: {}",
                                request.getPatientCode(), request.getEmployeeCode(), request.getAppointmentStartTime());

                // STEP 1: Get Creator from SecurityContext
                Integer createdById = getCurrentUserId();
                log.debug("Appointment creator: employeeId={}", createdById);

                // TODO: Implement patient booking block warnings and notifications:
                // 1. Send email to BLOCKED PATIENT when they try to book (or receptionist tries
                // for them)
                // - Email content: "Tài khoản của bạn đã bị chặn đặt lịch. Lý do: [reason]. Vui
                // lòng liên hệ phòng khám."
                // - Use patient.getEmail() if available
                // 2. Return warning flag in patient response for UI to show BEFORE booking form
                // - Frontend should show: blocked reason, who blocked, when blocked, notes
                // - Warning banner at patient selection step, not after submission
                // 3. Add allowBlockedPatient flag in request for admin override
                // - Only admin/receptionist with permission can book for blocked patient
                // - Log override in audit trail

                // STEP 2: Validate all resources exist and are active
                Patient patient = validatePatient(request.getPatientCode());
                Employee doctor = validateDoctor(request.getEmployeeCode());
                Room room = validateRoom(request.getRoomCode());

                // STEP 2B: Validate services (TWO MODES: Standalone vs Treatment Plan)
                List<DentalService> services;
                boolean isBookingFromPlan = request.getPatientPlanItemIds() != null
                                && !request.getPatientPlanItemIds().isEmpty();

                if (isBookingFromPlan) {
                        // Luồng 2: Treatment Plan Booking (NEW V2)
                        log.debug("Treatment Plan Booking mode: validating {} plan items",
                                        request.getPatientPlanItemIds().size());
                        List<PatientPlanItem> planItems = validatePlanItems(request.getPatientPlanItemIds(),
                                        patient.getPatientId());

                        // Validate plan start date proximity for FIRST appointment
                        validatePlanStartDateProximity(request.getPatientPlanItemIds(),
                                        parseStartTime(request.getAppointmentStartTime()));

                        // Extract services from plan items
                        services = planItems.stream()
                                        .map(item -> dentalServiceRepository.findById(item.getServiceId())
                                                        .orElseThrow(() -> new BadRequestAlertException(
                                                                        "Service not found for plan item: "
                                                                                        + item.getItemId(),
                                                                        ENTITY_NAME,
                                                                        "SERVICE_NOT_FOUND")))
                                        .distinct()
                                        .collect(Collectors.toList());

                        log.debug("Extracted {} unique services from plan items", services.size());
                } else {
                        // Luồng 1: Standalone Booking (EXISTING)
                        log.debug("Standalone Booking mode: validating {} service codes",
                                        request.getServiceCodes().size());
                        services = validateServices(request.getServiceCodes());
                }

                List<Employee> participants = validateParticipants(request.getParticipantCodes());

                // STEP 3: Validate doctor specializations
                validateDoctorSpecializations(doctor, services);

                // STEP 4: Validate room compatibility (V16)
                validateRoomCompatibility(room, services);

                // STEP 5: Calculate duration and end time
                LocalDateTime startTime = parseStartTime(request.getAppointmentStartTime());
                int totalDuration = calculateTotalDuration(services);
                LocalDateTime endTime = startTime.plusMinutes(totalDuration);
                log.debug("Appointment duration: {} minutes, end time: {}", totalDuration, endTime);

                // STEP 5B: Rule #2 - Validate 2-hour minimum lead time
                validateMinimumLeadTime(startTime);

                // STEP 5C: Rule #1 - Validate maximum 3-month advance booking
                validateMaximumAdvanceBooking(startTime);

                // STEP 5D: Rule #5 - Check if patient is blocked from booking
                validatePatientNotBlocked(patient);

                // STEP 6: Validate shifts (doctor and participants have working shifts)
                validateDoctorShift(doctor, startTime, endTime);
                validateParticipantShifts(participants, startTime, endTime);

                // STEP 7: Check conflicts (CRITICAL - prevents double booking)
                checkDoctorConflict(doctor, startTime, endTime);
                checkRoomConflict(room, startTime, endTime);
                checkPatientConflict(patient, startTime, endTime);
                checkParticipantConflicts(participants, startTime, endTime);

                // STEP 7B: V21 Clinical Rules Validation (NEW V21)
                log.debug("V21: Validating clinical rules for {} services", services.size());
                List<Long> serviceIds = services.stream()
                                .map(s -> s.getServiceId().longValue())
                                .collect(Collectors.toList());
                clinicalRulesValidationService.validateAppointmentServices(
                                patient.getPatientId(),
                                serviceIds,
                                startTime.toLocalDate());
                log.debug("V21:  All clinical rules passed");

                // STEP 8: Insert data (appointment + services + participants + audit log)
                Appointment appointment = insertAppointment(patient, doctor, room, startTime, endTime, totalDuration,
                                request.getNotes(), createdById);
                insertAppointmentServices(appointment, services);
                insertAppointmentParticipants(appointment, participants);

                // STEP 8B: Treatment Plan Integration (V2) - Insert bridge + Update status
                if (isBookingFromPlan) {
                        log.debug("Treatment Plan Booking: linking {} items to appointment {}",
                                        request.getPatientPlanItemIds().size(), appointment.getAppointmentCode());

                        insertAppointmentPlanItems(appointment, request.getPatientPlanItemIds());
                        updatePlanItemsStatus(request.getPatientPlanItemIds(),
                                        com.dental.clinic.management.treatment_plans.enums.PlanItemStatus.SCHEDULED);

                        // V21: Auto-activate plan (PENDING → IN_PROGRESS) if this is first appointment
                        activatePlanIfFirstAppointment(appointment, request.getPatientPlanItemIds());

                        log.info("Successfully linked and updated status for {} plan items",
                                        request.getPatientPlanItemIds().size());
                }

                insertAuditLog(appointment, createdById);

                log.info("Successfully created appointment: {}", appointment.getAppointmentCode());

                // STEP 9: Build and return response
                return buildResponse(appointment, patient, doctor, room, services, participants);
        }

        /**
         * Internal method for creating appointment (returns entity instead of DTO).
         * Used by reschedule service to reuse creation logic.
         *
         * NOTE: V2 supports Treatment Plan booking mode
         *
         * @param request Appointment creation request
         * @return Created Appointment entity
         */
        @Transactional
        public Appointment createAppointmentInternal(CreateAppointmentRequest request) {
                log.info("Creating appointment internally for patient: {}, doctor: {}",
                                request.getPatientCode(), request.getEmployeeCode());

                // Reuse all validation logic from main createAppointment method
                Integer createdById = getCurrentUserId();

                Patient patient = validatePatient(request.getPatientCode());
                Employee doctor = validateDoctor(request.getEmployeeCode());
                Room room = validateRoom(request.getRoomCode());

                // V2: Support both modes
                List<DentalService> services;
                boolean isBookingFromPlan = request.getPatientPlanItemIds() != null
                                && !request.getPatientPlanItemIds().isEmpty();

                if (isBookingFromPlan) {
                        List<PatientPlanItem> planItems = validatePlanItems(request.getPatientPlanItemIds(),
                                        patient.getPatientId());

                        // Validate plan start date proximity for FIRST appointment
                        validatePlanStartDateProximity(request.getPatientPlanItemIds(),
                                        LocalDateTime.parse(request.getAppointmentStartTime()));

                        services = planItems.stream()
                                        .map(item -> dentalServiceRepository.findById(item.getServiceId())
                                                        .orElseThrow(() -> new BadRequestAlertException(
                                                                        "Service not found for plan item: "
                                                                                        + item.getItemId(),
                                                                        ENTITY_NAME,
                                                                        "SERVICE_NOT_FOUND")))
                                        .distinct()
                                        .collect(Collectors.toList());
                } else {
                        services = validateServices(request.getServiceCodes());
                }

                List<Employee> participants = validateParticipants(request.getParticipantCodes());

                validateDoctorSpecializations(doctor, services);
                validateRoomCompatibility(room, services);

                LocalDateTime startTime = LocalDateTime.parse(request.getAppointmentStartTime());
                int totalDuration = calculateTotalDuration(services);
                LocalDateTime endTime = startTime.plusMinutes(totalDuration);

                validateDoctorShift(doctor, startTime, endTime);
                validateParticipantShifts(participants, startTime, endTime);

                checkDoctorConflict(doctor, startTime, endTime);
                checkRoomConflict(room, startTime, endTime);
                checkPatientConflict(patient, startTime, endTime);
                checkParticipantConflicts(participants, startTime, endTime);

                // V21: Clinical Rules Validation
                log.debug("V21: Validating clinical rules for {} services", services.size());
                List<Long> serviceIds = services.stream()
                                .map(s -> s.getServiceId().longValue())
                                .collect(Collectors.toList());
                clinicalRulesValidationService.validateAppointmentServices(
                                patient.getPatientId(),
                                serviceIds,
                                startTime.toLocalDate());
                log.debug("V21:  All clinical rules passed");

                Appointment appointment = insertAppointment(patient, doctor, room, startTime, endTime,
                                totalDuration, request.getNotes(), createdById);
                insertAppointmentServices(appointment, services);
                insertAppointmentParticipants(appointment, participants);

                // V2: Treatment Plan integration
                if (isBookingFromPlan) {
                        insertAppointmentPlanItems(appointment, request.getPatientPlanItemIds());
                        updatePlanItemsStatus(request.getPatientPlanItemIds(),
                                        com.dental.clinic.management.treatment_plans.enums.PlanItemStatus.SCHEDULED);

                        // V21: Auto-activate plan (PENDING → IN_PROGRESS) if this is first appointment
                        activatePlanIfFirstAppointment(appointment, request.getPatientPlanItemIds());
                }

                insertAuditLog(appointment, createdById);

                // Send notification to patient
                sendAppointmentCreatedNotification(appointment, patient);

                log.info("Successfully created appointment internally: {}", appointment.getAppointmentCode());
                return appointment;
        }

        // ====================================================================
        // STEP 1: Get Current User
        // ====================================================================

        /**
         * Extract employee ID from SecurityContext (current logged-in user via JWT)
         *
         * @return Employee ID of current user, or 0 (SYSTEM) if admin account
         */
        private Integer getCurrentUserId() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null || !authentication.isAuthenticated()) {
                        throw new BadRequestAlertException("User not authenticated", ENTITY_NAME, "NOT_AUTHENTICATED");
                }

                Object principal = authentication.getPrincipal();

                // JWT-based authentication: principal is Jwt object
                if (!(principal instanceof Jwt)) {
                        throw new BadRequestAlertException(
                                        "Invalid authentication principal type: " + principal.getClass().getName(),
                                        ENTITY_NAME,
                                        "INVALID_PRINCIPAL");
                }

                Jwt jwt = (Jwt) principal;
                String username = jwt.getClaimAsString("sub");

                if (username == null || username.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "JWT does not contain username (sub claim)",
                                        ENTITY_NAME,
                                        "JWT_MISSING_USERNAME");
                }

                // Check if user has ADMIN role
                List<String> roles = jwt.getClaimAsStringList("roles");
                if (roles != null && roles.contains("ROLE_ADMIN")) {
                        // Admin account - use SYSTEM employee (employee_id = 0)
                        log.info("Admin account '{}' creating appointment. Using SYSTEM employee (employee_id=0)",
                                        username);
                        return 0;
                }

                // Lookup employee by account username
                Employee employee = employeeRepository.findByAccount_Username(username).orElse(null);

                if (employee == null) {
                        // Account without employee - should not happen for non-admin
                        throw new BadRequestAlertException(
                                        "Account '" + username + "' does not have employee link",
                                        ENTITY_NAME,
                                        "ACCOUNT_NO_EMPLOYEE");
                }

                return employee.getEmployeeId();
        }

        // ====================================================================
        // STEP 2: Validate Resources
        // ====================================================================

        private Patient validatePatient(String patientCode) {
                Patient patient = patientRepository.findOneByPatientCode(patientCode)
                                .orElseThrow(() -> new BadRequestAlertException(
                                                "Patient not found: " + patientCode,
                                                ENTITY_NAME,
                                                "PATIENT_NOT_FOUND"));

                if (!patient.getIsActive()) {
                        throw new BadRequestAlertException(
                                        "Patient is inactive: " + patientCode,
                                        ENTITY_NAME,
                                        "PATIENT_INACTIVE");
                }

                return patient;
        }

        private Employee validateDoctor(String employeeCode) {
                Employee doctor = employeeRepository.findByEmployeeCodeAndIsActiveTrue(employeeCode)
                                .orElseThrow(() -> new BadRequestAlertException(
                                                "Employee not found or inactive: " + employeeCode,
                                                ENTITY_NAME,
                                                "EMPLOYEE_NOT_FOUND"));

                // CRITICAL: Validate employee is medical staff (dentist, nurse, or intern)
                // Admin/Receptionist/Accountant cannot be doctors
                if (!doctor.isMedicalStaff()) {
                        throw new BadRequestAlertException(
                                        "Employee must be medical staff (DENTIST/NURSE/INTERN role) to be assigned as doctor. "
                                                        +
                                                        "Employee " + employeeCode
                                                        + " is not medical staff (Admin/Receptionist/Accountant cannot be doctors)",
                                        ENTITY_NAME,
                                        "EMPLOYEE_NOT_MEDICAL_STAFF");
                }

                return doctor;
        }

        private Room validateRoom(String roomCode) {
                Room room = roomRepository.findByRoomCode(roomCode)
                                .orElseThrow(() -> new BadRequestAlertException(
                                                "Room not found: " + roomCode,
                                                ENTITY_NAME,
                                                "ROOM_NOT_FOUND"));

                if (!room.getIsActive()) {
                        throw new BadRequestAlertException(
                                        "Room is inactive: " + roomCode,
                                        ENTITY_NAME,
                                        "ROOM_INACTIVE");
                }

                return room;
        }

        private List<DentalService> validateServices(List<String> serviceCodes) {
                if (serviceCodes == null || serviceCodes.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "At least one service is required",
                                        ENTITY_NAME,
                                        "SERVICES_REQUIRED");
                }

                List<DentalService> services = dentalServiceRepository.findByServiceCodeIn(serviceCodes);

                if (services.size() != serviceCodes.size()) {
                        List<String> foundCodes = services.stream()
                                        .map(DentalService::getServiceCode)
                                        .collect(Collectors.toList());
                        List<String> missingCodes = serviceCodes.stream()
                                        .filter(code -> !foundCodes.contains(code))
                                        .collect(Collectors.toList());

                        throw new BadRequestAlertException(
                                        "Services not found: " + String.join(", ", missingCodes),
                                        ENTITY_NAME,
                                        "SERVICES_NOT_FOUND");
                }

                // Check all services are active
                List<String> inactiveServices = services.stream()
                                .filter(s -> !s.getIsActive())
                                .map(DentalService::getServiceCode)
                                .collect(Collectors.toList());

                if (!inactiveServices.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Services are inactive: " + String.join(", ", inactiveServices),
                                        ENTITY_NAME,
                                        "SERVICES_INACTIVE");
                }

                return services;
        }

        private List<Employee> validateParticipants(List<String> participantCodes) {
                if (participantCodes == null || participantCodes.isEmpty()) {
                        return new ArrayList<>(); // No participants is OK
                }

                // Fetch all active employees and filter by codes
                List<Employee> allActiveEmployees = employeeRepository.findByIsActiveTrue();
                List<Employee> participants = allActiveEmployees.stream()
                                .filter(e -> participantCodes.contains(e.getEmployeeCode()))
                                .collect(Collectors.toList());

                if (participants.size() != participantCodes.size()) {
                        List<String> foundCodes = participants.stream()
                                        .map(Employee::getEmployeeCode)
                                        .collect(Collectors.toList());
                        List<String> missingCodes = participantCodes.stream()
                                        .filter(code -> !foundCodes.contains(code))
                                        .collect(Collectors.toList());

                        throw new BadRequestAlertException(
                                        "Participants not found or inactive: " + String.join(", ", missingCodes),
                                        ENTITY_NAME,
                                        "PARTICIPANT_NOT_FOUND");
                }

                // CRITICAL: Validate all participants are medical staff (dentist, nurse, or
                // intern)
                // Admin/Receptionist/Accountant cannot be participants
                List<String> nonMedicalStaff = participants.stream()
                                .filter(p -> !p.isMedicalStaff())
                                .map(Employee::getEmployeeCode)
                                .collect(Collectors.toList());

                if (!nonMedicalStaff.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Participants must be medical staff (DENTIST/NURSE/INTERN role). " +
                                                        "The following employees are not medical staff (Admin/Receptionist/Accountant cannot be participants): "
                                                        +
                                                        String.join(", ", nonMedicalStaff),
                                        ENTITY_NAME,
                                        "PARTICIPANT_NOT_MEDICAL_STAFF");
                }

                return participants;
        }

        /**
         * Validate Patient Plan Items (Treatment Plan Booking - V2)
         *
         * 3-Step Validation:
         * 1. Check all items exist
         * 2. Check all items belong to this patient (via phase.plan.patientId)
         * 3. Check all items have status = READY_FOR_BOOKING
         *
         * @param itemIds   List of item IDs from request
         * @param patientId Patient ID from request
         * @return List of validated PatientPlanItems
         * @throws BadRequestAlertException if any validation fails
         */
        private List<PatientPlanItem> validatePlanItems(List<Long> itemIds, Integer patientId) {
                // Check 1: Fetch items with phase and plan data (JOIN FETCH optimization)
                List<PatientPlanItem> items = patientPlanItemRepository.findByIdInWithPlanAndPhase(itemIds);

                if (items.size() != itemIds.size()) {
                        List<Long> foundIds = items.stream()
                                        .map(PatientPlanItem::getItemId)
                                        .collect(Collectors.toList());
                        List<Long> missingIds = itemIds.stream()
                                        .filter(id -> !foundIds.contains(id))
                                        .collect(Collectors.toList());

                        throw new BadRequestAlertException(
                                        "Patient plan items not found: " + missingIds,
                                        ENTITY_NAME,
                                        "PLAN_ITEMS_NOT_FOUND");
                }

                // Check 2: All items must belong to this patient
                List<Long> wrongOwnershipItems = items.stream()
                                .filter(item -> !item.getPhase().getTreatmentPlan().getPatient().getPatientId()
                                                .equals(patientId))
                                .map(PatientPlanItem::getItemId)
                                .collect(Collectors.toList());

                if (!wrongOwnershipItems.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Patient plan items do not belong to patient " + patientId + ". Item IDs: "
                                                        + wrongOwnershipItems,
                                        ENTITY_NAME,
                                        "PLAN_ITEMS_WRONG_PATIENT");
                }

                // Check 3: All items must be ready for booking
                List<String> notReadyItems = items.stream()
                                .filter(item -> item
                                                .getStatus() != com.dental.clinic.management.treatment_plans.enums.PlanItemStatus.READY_FOR_BOOKING)
                                .map(item -> item.getItemId() + " (status: " + item.getStatus() + ")")
                                .collect(Collectors.toList());

                if (!notReadyItems.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Some patient plan items are not ready for booking: " + notReadyItems,
                                        ENTITY_NAME,
                                        "PLAN_ITEMS_NOT_READY");
                }

                log.debug("Validated {} plan items for patient {}", items.size(), patientId);
                return items;
        }

        // ====================================================================
        // STEP 3: Validate Doctor Specializations
        // ====================================================================

        private void validateDoctorSpecializations(Employee doctor, List<DentalService> services) {
                // Get all specialization IDs required by services (filter out null
                // specializations)
                List<Integer> requiredSpecializationIds = services.stream()
                                .filter(s -> s.getSpecialization() != null) // Some services don't require
                                                                            // specialization
                                .map(s -> s.getSpecialization().getSpecializationId())
                                .distinct()
                                .collect(Collectors.toList());

                // If no services require specialization, any medical staff can perform them
                if (requiredSpecializationIds.isEmpty()) {
                        return;
                }

                // Get doctor's specializations (from @ManyToMany relationship)
                Set<Specialization> doctorSpecializations = doctor.getSpecializations();

                // If doctor has no specializations (e.g., nurse), they cannot perform
                // specialized services
                if (doctorSpecializations == null || doctorSpecializations.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Doctor " + doctor.getEmployeeCode()
                                                        + " has no specializations but services require: "
                                                        + requiredSpecializationIds
                                                        + ". Nurses cannot perform specialized services like X-Ray.",
                                        ENTITY_NAME,
                                        "EMPLOYEE_NOT_QUALIFIED");
                }

                List<Integer> doctorSpecIds = doctorSpecializations.stream()
                                .map(Specialization::getSpecializationId)
                                .collect(Collectors.toList());

                // Check if doctor has ALL required specializations
                boolean hasAllSpecializations = doctorSpecIds.containsAll(requiredSpecializationIds);

                if (!hasAllSpecializations) {
                        List<Integer> missingSpecIds = requiredSpecializationIds.stream()
                                        .filter(specId -> !doctorSpecIds.contains(specId))
                                        .collect(Collectors.toList());

                        throw new BadRequestAlertException(
                                        "Doctor " + doctor.getEmployeeCode()
                                                        + " does not have required specializations. Missing IDs: "
                                                        + missingSpecIds
                                                        + ". For example, X-Ray services require Diagnostic Imaging specialization.",
                                        ENTITY_NAME,
                                        "EMPLOYEE_NOT_QUALIFIED");
                }
        }

        // ====================================================================
        // STEP 4: Validate Room Compatibility (V16)
        // ====================================================================

        private void validateRoomCompatibility(Room room, List<DentalService> services) {
                List<Integer> serviceIds = services.stream()
                                .map(DentalService::getServiceId)
                                .collect(Collectors.toList());

                // Check if room supports ALL services
                List<String> compatibleRooms = roomServiceRepository.findRoomsSupportingAllServices(
                                serviceIds,
                                serviceIds.size());

                if (!compatibleRooms.contains(room.getRoomId())) {
                        throw new BadRequestAlertException(
                                        "Room " + room.getRoomCode() + " does not support all requested services",
                                        ENTITY_NAME,
                                        "ROOM_NOT_COMPATIBLE");
                }
        }

        // ====================================================================
        // STEP 5: Calculate Duration and End Time
        // ====================================================================

        private LocalDateTime parseStartTime(String startTimeStr) {
                try {
                        LocalDateTime startTime = LocalDateTime.parse(startTimeStr, ISO_FORMATTER);

                        // Check if start time is in the future
                        if (startTime.isBefore(LocalDateTime.now())) {
                                throw new BadRequestAlertException(
                                                "Appointment start time must be in the future",
                                                ENTITY_NAME,
                                                "START_TIME_IN_PAST");
                        }

                        return startTime;
                } catch (Exception e) {
                        throw new BadRequestAlertException(
                                        "Invalid start time format: " + startTimeStr,
                                        ENTITY_NAME,
                                        "INVALID_START_TIME");
                }
        }

        private int calculateTotalDuration(List<DentalService> services) {
                return services.stream()
                                .mapToInt(s -> s.getDefaultDurationMinutes() + s.getDefaultBufferMinutes())
                                .sum();
        }

        // ====================================================================
        // STEP 6: Validate Shifts
        // ====================================================================

        private void validateDoctorShift(Employee doctor, LocalDateTime startTime, LocalDateTime endTime) {
                LocalDate date = startTime.toLocalDate();
                List<EmployeeShift> shifts = employeeShiftRepository.findByEmployeeAndDate(
                                doctor.getEmployeeId(),
                                date);

                if (shifts.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Doctor " + doctor.getEmployeeCode() + " has no shift on " + date,
                                        ENTITY_NAME,
                                        "EMPLOYEE_NOT_SCHEDULED");
                }

                // Check if ANY shift covers the appointment time range
                boolean hasShiftCoverage = shifts.stream().anyMatch(shift -> {
                        LocalDateTime shiftStart = LocalDateTime.of(shift.getWorkDate(),
                                        shift.getWorkShift().getStartTime());
                        LocalDateTime shiftEnd = LocalDateTime.of(shift.getWorkDate(),
                                        shift.getWorkShift().getEndTime());
                        return !startTime.isBefore(shiftStart) && !endTime.isAfter(shiftEnd);
                });

                if (!hasShiftCoverage) {
                        throw new BadRequestAlertException(
                                        "Doctor " + doctor.getEmployeeCode()
                                                        + " shift does not cover appointment time range",
                                        ENTITY_NAME,
                                        "EMPLOYEE_SHIFT_NOT_COVERING");
                }
        }

        private void validateParticipantShifts(List<Employee> participants, LocalDateTime startTime,
                        LocalDateTime endTime) {
                LocalDate date = startTime.toLocalDate();

                for (Employee participant : participants) {
                        List<EmployeeShift> shifts = employeeShiftRepository.findByEmployeeAndDate(
                                        participant.getEmployeeId(),
                                        date);

                        if (shifts.isEmpty()) {
                                throw new BadRequestAlertException(
                                                "Participant " + participant.getEmployeeCode() + " has no shift on "
                                                                + date,
                                                ENTITY_NAME,
                                                "PARTICIPANT_NOT_SCHEDULED");
                        }

                        boolean hasShiftCoverage = shifts.stream().anyMatch(shift -> {
                                LocalDateTime shiftStart = LocalDateTime.of(shift.getWorkDate(),
                                                shift.getWorkShift().getStartTime());
                                LocalDateTime shiftEnd = LocalDateTime.of(shift.getWorkDate(),
                                                shift.getWorkShift().getEndTime());
                                return !startTime.isBefore(shiftStart) && !endTime.isAfter(shiftEnd);
                        });

                        if (!hasShiftCoverage) {
                                throw new BadRequestAlertException(
                                                "Participant " + participant.getEmployeeCode()
                                                                + " shift does not cover appointment time range",
                                                ENTITY_NAME,
                                                "PARTICIPANT_SHIFT_NOT_COVERING");
                        }
                }
        }

        // ====================================================================
        // STEP 7: Check Conflicts (CRITICAL)
        // ====================================================================

        private void checkDoctorConflict(Employee doctor, LocalDateTime startTime, LocalDateTime endTime) {
                // Get actual conflicting appointments for detailed error message
                List<AppointmentStatus> activeStatuses = List.of(
                                AppointmentStatus.SCHEDULED,
                                AppointmentStatus.CHECKED_IN,
                                AppointmentStatus.IN_PROGRESS);

                List<Appointment> conflicts = appointmentRepository.findByEmployeeAndTimeRange(
                                doctor.getEmployeeId(),
                                startTime,
                                endTime,
                                activeStatuses);

                if (!conflicts.isEmpty()) {
                        Appointment conflict = conflicts.get(0);
                        throw new BadRequestAlertException(
                                        String.format("Doctor %s already has an appointment during this time. " +
                                                        "Conflicting appointment: %s (%s to %s)",
                                                        doctor.getEmployeeCode(),
                                                        conflict.getAppointmentCode(),
                                                        conflict.getAppointmentStartTime(),
                                                        conflict.getAppointmentEndTime()),
                                        ENTITY_NAME,
                                        "EMPLOYEE_SLOT_TAKEN");
                }
        }

        private void checkRoomConflict(Room room, LocalDateTime startTime, LocalDateTime endTime) {
                // Get actual conflicting appointments for detailed error message
                List<AppointmentStatus> activeStatuses = List.of(
                                AppointmentStatus.SCHEDULED,
                                AppointmentStatus.CHECKED_IN,
                                AppointmentStatus.IN_PROGRESS);

                List<Appointment> conflicts = appointmentRepository.findByRoomAndTimeRange(
                                room.getRoomId(),
                                startTime,
                                endTime,
                                activeStatuses);

                if (!conflicts.isEmpty()) {
                        Appointment conflict = conflicts.get(0);
                        throw new BadRequestAlertException(
                                        String.format("Room %s is already booked during this time. " +
                                                        "Conflicting appointment: %s (%s to %s)",
                                                        room.getRoomCode(),
                                                        conflict.getAppointmentCode(),
                                                        conflict.getAppointmentStartTime(),
                                                        conflict.getAppointmentEndTime()),
                                        ENTITY_NAME,
                                        "ROOM_SLOT_TAKEN");
                }
        }

        private void checkPatientConflict(Patient patient, LocalDateTime startTime, LocalDateTime endTime) {
                // Check if patient has another appointment at the same time
                List<AppointmentStatus> activeStatuses = List.of(
                                AppointmentStatus.SCHEDULED,
                                AppointmentStatus.CHECKED_IN,
                                AppointmentStatus.IN_PROGRESS);

                List<Appointment> conflicts = appointmentRepository.findByPatientAndTimeRange(
                                patient.getPatientId(),
                                startTime,
                                endTime,
                                activeStatuses);

                if (!conflicts.isEmpty()) {
                        throw new BadRequestAlertException(
                                        "Patient " + patient.getPatientCode()
                                                        + " already has an appointment during this time",
                                        ENTITY_NAME,
                                        "PATIENT_HAS_CONFLICT");
                }
        }

        private void checkParticipantConflicts(List<Employee> participants, LocalDateTime startTime,
                        LocalDateTime endTime) {
                for (Employee participant : participants) {
                        // Check as primary doctor
                        boolean hasConflictAsPrimary = appointmentRepository.existsConflictForEmployee(
                                        participant.getEmployeeId(),
                                        startTime,
                                        endTime);

                        if (hasConflictAsPrimary) {
                                throw new BadRequestAlertException(
                                                "Participant " + participant.getEmployeeCode()
                                                                + " is busy (primary doctor) during this time",
                                                ENTITY_NAME,
                                                "PARTICIPANT_SLOT_TAKEN");
                        }

                        // Check as participant in other appointments
                        boolean hasConflictAsParticipant = appointmentParticipantRepository
                                        .existsConflictForParticipant(
                                                        participant.getEmployeeId(),
                                                        startTime,
                                                        endTime);

                        if (hasConflictAsParticipant) {
                                throw new BadRequestAlertException(
                                                "Participant " + participant.getEmployeeCode()
                                                                + " is busy (assistant) during this time",
                                                ENTITY_NAME,
                                                "PARTICIPANT_SLOT_TAKEN");
                        }
                }
        }

        // ====================================================================
        // STEP 8: Insert Data
        // ====================================================================

        private Appointment insertAppointment(Patient patient, Employee doctor, Room room,
                        LocalDateTime startTime, LocalDateTime endTime,
                        int totalDuration, String notes, Integer createdById) {
                Appointment appointment = new Appointment();

                // Generate appointment code: APT-YYYYMMDD-SEQ
                String appointmentCode = generateAppointmentCode(startTime.toLocalDate());
                appointment.setAppointmentCode(appointmentCode);

                appointment.setPatientId(patient.getPatientId());
                appointment.setEmployeeId(doctor.getEmployeeId());
                appointment.setRoomId(room.getRoomId());
                appointment.setAppointmentStartTime(startTime);
                appointment.setAppointmentEndTime(endTime);
                appointment.setExpectedDurationMinutes(totalDuration);
                appointment.setStatus(AppointmentStatus.SCHEDULED);
                appointment.setNotes(notes);
                appointment.setCreatedBy(createdById);

                return appointmentRepository.save(appointment);
        }

        /**
         * Generate unique appointment code: APT-YYYYMMDD-SEQ
         * Example: APT-20251115-001
         */
        private String generateAppointmentCode(LocalDate appointmentDate) {
                String datePrefix = appointmentDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                String codePrefix = "APT-" + datePrefix + "-";

                // Find the highest sequence number for this date
                String lastCode = appointmentRepository
                                .findTopByAppointmentCodeStartingWithOrderByAppointmentCodeDesc(codePrefix)
                                .map(Appointment::getAppointmentCode)
                                .orElse(null);

                int nextSequence = 1;
                if (lastCode != null) {
                        // Extract sequence number from APT-20251115-001 -> 001
                        String sequencePart = lastCode.substring(lastCode.lastIndexOf("-") + 1);
                        nextSequence = Integer.parseInt(sequencePart) + 1;
                }

                // Format with leading zeros: 001, 002, ..., 999
                return codePrefix + String.format("%03d", nextSequence);
        }

        private void insertAppointmentServices(Appointment appointment, List<DentalService> services) {
                for (DentalService service : services) {
                        AppointmentService as = new AppointmentService();
                        AppointmentServiceId id = new AppointmentServiceId();
                        id.setAppointmentId(appointment.getAppointmentId());
                        id.setServiceId(service.getServiceId());
                        as.setId(id);
                        appointmentServiceRepository.save(as);
                }
        }

        private void insertAppointmentParticipants(Appointment appointment, List<Employee> participants) {
                for (Employee participant : participants) {
                        AppointmentParticipant ap = new AppointmentParticipant();
                        AppointmentParticipantId id = new AppointmentParticipantId();
                        id.setAppointmentId(appointment.getAppointmentId());
                        id.setEmployeeId(participant.getEmployeeId());
                        ap.setId(id);
                        ap.setRole(AppointmentParticipantRole.ASSISTANT); // Default role
                        appointmentParticipantRepository.save(ap);
                }
        }

        private void insertAuditLog(Appointment appointment, Integer createdById) {
                // Fetch employee entity if ID is not 0 (SYSTEM)
                Employee performedByEmployee = null;
                if (createdById != 0) {
                        performedByEmployee = employeeRepository.findById(createdById).orElse(null);
                }

                AppointmentAuditLog log = AppointmentAuditLog.builder()
                                .appointment(appointment)
                                .performedByEmployee(performedByEmployee)
                                .actionType(AppointmentActionType.CREATE)
                                .actionTimestamp(LocalDateTime.now())
                                .build();
                appointmentAuditLogRepository.save(log);
        }

        /**
         * Send notifications to patient, dentist, and participants when appointment is created
         */
        private void sendAppointmentCreatedNotification(Appointment appointment, Patient patient) {
                try {
                        log.info("=== Starting notification creation for appointment {} ===",
                                        appointment.getAppointmentCode());

                        String formattedTime = appointment.getAppointmentStartTime()
                                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

                        // 1. Send notification to PATIENT
                        if (patient.getAccount() != null) {
                                Integer patientUserId = patient.getAccount().getAccountId();
                                log.info("Sending notification to PATIENT userId={} for appointment {}",
                                                patientUserId, appointment.getAppointmentCode());

                                com.dental.clinic.management.notification.dto.CreateNotificationRequest patientNotification = 
                                        com.dental.clinic.management.notification.dto.CreateNotificationRequest.builder()
                                                .userId(patientUserId)
                                                .type(com.dental.clinic.management.notification.enums.NotificationType.APPOINTMENT_CREATED)
                                                .title("Đặt lịch thành công")
                                                .message(String.format("Cuộc hẹn %s đã được đặt thành công vào %s",
                                                                appointment.getAppointmentCode(), formattedTime))
                                                .relatedEntityType(
                                                        com.dental.clinic.management.notification.enums.NotificationEntityType.APPOINTMENT)
                                                .relatedEntityId(appointment.getAppointmentCode())
                                                .build();

                                notificationService.createNotification(patientNotification);
                                log.info("✓ Patient notification created successfully");
                        } else {
                                log.warn("Patient {} has no account, skipping patient notification",
                                                patient.getPatientId());
                        }

                        // 2. Query participants from database (Appointment entity doesn't have @OneToMany relationship)
                        List<AppointmentParticipant> participants = appointmentParticipantRepository
                                        .findByIdAppointmentId(appointment.getAppointmentId());

                        if (participants != null && !participants.isEmpty()) {
                                log.info("Processing {} participants for appointment {}",
                                                participants.size(), appointment.getAppointmentCode());

                                for (AppointmentParticipant participant : participants) {
                                        try {
                                                // Get employee from participant
                                                Employee staff = participant.getEmployee();
                                                if (staff == null || staff.getAccount() == null) {
                                                        log.warn("Participant employeeId={} has no account, skipping notification",
                                                                        participant.getId().getEmployeeId());
                                                        continue;
                                                }

                                                Integer staffUserId = staff.getAccount().getAccountId();
                                                AppointmentParticipantRole role = participant.getRole();

                                                log.info("Sending notification to {} userId={} for appointment {}",
                                                                role.name(), staffUserId, appointment.getAppointmentCode());

                                                String title = String.format("Bạn đã được phân công làm %s",
                                                                getRoleDisplayName(role));
                                                String message = String.format("Cuộc hẹn %s vào %s - Bệnh nhân: %s",
                                                                appointment.getAppointmentCode(),
                                                                formattedTime,
                                                                patient.getFullName());

                                                com.dental.clinic.management.notification.dto.CreateNotificationRequest staffNotification = 
                                                        com.dental.clinic.management.notification.dto.CreateNotificationRequest.builder()
                                                                .userId(staffUserId)
                                                                .type(com.dental.clinic.management.notification.enums.NotificationType.APPOINTMENT_CREATED)
                                                                .title(title)
                                                                .message(message)
                                                                .relatedEntityType(
                                                                        com.dental.clinic.management.notification.enums.NotificationEntityType.APPOINTMENT)
                                                                .relatedEntityId(appointment.getAppointmentCode())
                                                                .build();

                                                notificationService.createNotification(staffNotification);
                                                log.info("✓ {} notification created for userId={}", role.name(), staffUserId);
                                        } catch (Exception e) {
                                                log.error("Failed to send notification to participant employeeId={}: {}",
                                                                participant.getId().getEmployeeId(), e.getMessage(), e);
                                        }
                                }
                        } else {
                                log.warn("No participants found for appointment {}", appointment.getAppointmentCode());
                        }

                        log.info("=== Notification creation completed for appointment {} ===",
                                        appointment.getAppointmentCode());
                } catch (Exception e) {
                        log.error("Failed to send notifications for appointment {}: {}",
                                        appointment.getAppointmentCode(), e.getMessage(), e);
                        // Don't throw exception - notification failure should not block appointment creation
                }
        }

        /**
         * Get display name for participant role (Vietnamese)
         */
        private String getRoleDisplayName(AppointmentParticipantRole role) {
                switch (role) {
                        case ASSISTANT:
                                return "Trợ lý";
                        case SECONDARY_DOCTOR:
                                return "Bác sĩ phụ";
                        case OBSERVER:
                                return "Quan sát viên";
                        default:
                                return role.name();
                }
        }

        // ====================================================================
        // STEP 9: Build Response
        // ====================================================================

        private CreateAppointmentResponse buildResponse(Appointment appointment, Patient patient,
                        Employee doctor, Room room,
                        List<DentalService> services,
                        List<Employee> participants) {
                // Calculate patient age
                Integer age = null;
                if (patient.getDateOfBirth() != null) {
                        age = java.time.Period.between(patient.getDateOfBirth(), java.time.LocalDate.now()).getYears();
                }

                return CreateAppointmentResponse.builder()
                                .appointmentCode(appointment.getAppointmentCode())
                                .status(appointment.getStatus().name())
                                .appointmentStartTime(appointment.getAppointmentStartTime())
                                .appointmentEndTime(appointment.getAppointmentEndTime())
                                .expectedDurationMinutes(appointment.getExpectedDurationMinutes())
                                .patient(PatientSummary.builder()
                                                .patientId(patient.getPatientId())
                                                .patientCode(patient.getPatientCode())
                                                .fullName(patient.getFullName())
                                                .phone(patient.getPhone())
                                                .email(patient.getEmail())
                                                .dateOfBirth(patient.getDateOfBirth())
                                                .age(age)
                                                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                                                .address(patient.getAddress())
                                                .medicalHistory(patient.getMedicalHistory())
                                                .allergies(patient.getAllergies())
                                                .emergencyContactName(patient.getEmergencyContactName())
                                                .emergencyContactPhone(patient.getEmergencyContactPhone())
                                                .guardianName(patient.getGuardianName())
                                                .guardianPhone(patient.getGuardianPhone())
                                                .guardianRelationship(patient.getGuardianRelationship())
                                                .guardianCitizenId(patient.getGuardianCitizenId())
                                                .isActive(patient.getIsActive())
                                                .consecutiveNoShows(patient.getConsecutiveNoShows())
                                                .isBookingBlocked(patient.getIsBookingBlocked())
                                                .bookingBlockReason(patient.getBookingBlockReason() != null
                                                                ? patient.getBookingBlockReason().name()
                                                                : null)
                                                .build())
                                .doctor(DoctorSummary.builder()
                                                .employeeCode(doctor.getEmployeeCode())
                                                .fullName(doctor.getFullName())
                                                .build())
                                .room(RoomSummary.builder()
                                                .roomCode(room.getRoomCode())
                                                .roomName(room.getRoomName())
                                                .build())
                                .services(services.stream()
                                                .map(s -> ServiceSummary.builder()
                                                                .serviceCode(s.getServiceCode())
                                                                .serviceName(s.getServiceName())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .participants(participants.stream()
                                                .map(p -> ParticipantSummary.builder()
                                                                .employeeCode(p.getEmployeeCode())
                                                                .fullName(p.getFullName())
                                                                .role(AppointmentParticipantRole.ASSISTANT)
                                                                .build())
                                                .collect(Collectors.toList()))
                                .build();
        }

        // ====================================================================
        // TREATMENT PLAN INTEGRATION (V2) - STEP 8B Methods
        // ====================================================================

        /**
         * Insert bridge table records (appointment_plan_items)
         *
         * Purpose: Link appointment to patient plan items (N-N relationship)
         * Example: appointmentId=123 → items [307, 308]
         *
         * @param appointment Created appointment entity
         * @param itemIds     List of item IDs from request
         */
        private void insertAppointmentPlanItems(Appointment appointment, List<Long> itemIds) {
                for (Long itemId : itemIds) {
                        AppointmentPlanItemBridge bridge = new AppointmentPlanItemBridge();
                        AppointmentPlanItemBridge.AppointmentPlanItemBridgeId id = new AppointmentPlanItemBridge.AppointmentPlanItemBridgeId();
                        id.setAppointmentId(appointment.getAppointmentId().longValue()); // Convert Integer to Long
                        id.setItemId(itemId);
                        bridge.setId(id);
                        appointmentPlanItemRepository.save(bridge);
                }
                log.debug("Inserted {} bridge records into appointment_plan_items", itemIds.size());
        }

        /**
         * Update plan item status: READY_FOR_BOOKING → SCHEDULED
         *
         * Purpose: Mark items as scheduled after appointment created
         * Rollback Safety: If this fails, entire transaction rolls back (appointment
         * not created)
         *
         * @param itemIds   List of item IDs to update
         * @param newStatus Target status (typically SCHEDULED)
         * @throws RuntimeException if update fails (triggers rollback)
         */
        private void updatePlanItemsStatus(List<Long> itemIds,
                        com.dental.clinic.management.treatment_plans.enums.PlanItemStatus newStatus) {
                try {
                        // Fetch items again (without JOIN FETCH - simpler for update)
                        List<PatientPlanItem> items = patientPlanItemRepository.findAllById(itemIds);

                        if (items.size() != itemIds.size()) {
                                throw new IllegalStateException(
                                                "Mismatch in item count during status update. Expected: "
                                                                + itemIds.size() + ", Found: " + items.size());
                        }

                        // Update status
                        items.forEach(item -> item.setStatus(newStatus));
                        patientPlanItemRepository.saveAll(items);

                        log.debug("Updated {} items to status: {}", items.size(), newStatus);
                } catch (Exception e) {
                        log.error("Failed to update plan items status. Transaction will rollback. ItemIds: {}, TargetStatus: {}",
                                        itemIds, newStatus, e);
                        throw new RuntimeException("Failed to update plan items status", e);
                }
        }

        /**
         * V21: Auto-activate treatment plan (PENDING → IN_PROGRESS) when first
         * appointment is created.
         *
         * Business Logic:
         * - When receptionist books the FIRST appointment for a plan
         * - And plan.status == PENDING (not yet started)
         * - And plan.approvalStatus == APPROVED (already approved by manager)
         * - Then automatically set plan.status = IN_PROGRESS
         *
         * Use Case:
         * - Plan was created and approved by manager
         * - Plan stays PENDING until patient actually starts treatment
         * - First appointment booking = treatment begins → auto-activate plan
         *
         * Safety:
         * - Only activates if plan is PENDING (no double activation)
         * - Only activates if plan is APPROVED (not DRAFT/PENDING_REVIEW)
         * - Logs activation for audit trail
         * - Transactional - rolls back if fails
         *
         * @param appointment The newly created appointment
         * @param itemIds     The plan items being booked in this appointment
         */
        private void activatePlanIfFirstAppointment(Appointment appointment, List<Long> itemIds) {
                try {
                        // Get the plan from first item (all items belong to same plan)
                        PatientPlanItem firstItem = patientPlanItemRepository.findById(itemIds.get(0))
                                        .orElseThrow(() -> new IllegalStateException(
                                                        "Plan item not found: " + itemIds.get(0)));

                        com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan plan = firstItem
                                        .getPhase()
                                        .getTreatmentPlan();

                        // Check if plan is eligible for auto-activation
                        boolean isPending = plan
                                        .getStatus() == com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus.PENDING;
                        boolean isApproved = plan
                                        .getApprovalStatus() == com.dental.clinic.management.treatment_plans.domain.ApprovalStatus.APPROVED;

                        if (isPending && isApproved) {
                                // Check if this is the FIRST appointment for this plan
                                // (No other SCHEDULED appointments exist for this plan)
                                long existingAppointmentCount = appointmentPlanItemRepository
                                                .countAppointmentsForPlan(plan.getPlanId().longValue());

                                if (existingAppointmentCount == 1) { // Only the current appointment exists
                                        // AUTO-ACTIVATE: PENDING → IN_PROGRESS
                                        plan.setStatus(com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus.IN_PROGRESS);
                                        treatmentPlanRepository.save(plan);

                                        log.info(" V21: Auto-activated treatment plan {} (PENDING → IN_PROGRESS) - First appointment: {}",
                                                        plan.getPlanCode(), appointment.getAppointmentCode());
                                } else {
                                        log.debug("V21: Plan {} already has {} appointments - no auto-activation needed",
                                                        plan.getPlanCode(), existingAppointmentCount);
                                }
                        } else {
                                log.debug("V21: Plan {} not eligible for auto-activation - status: {}, approvalStatus: {}",
                                                plan.getPlanCode(), plan.getStatus(), plan.getApprovalStatus());
                        }
                } catch (Exception e) {
                        // Log error but don't fail transaction - auto-activation is enhancement, not
                        // critical
                        log.warn("V21: Failed to auto-activate plan for appointment {}. Plan activation can be done manually.",
                                        appointment.getAppointmentCode(), e);
                }
        }

        /**
         * Rule #2: Validate minimum 2-hour lead time for appointment booking
         * Patient must book at least 2 hours before appointment time
         *
         * @param startTime Appointment start time
         * @throws BadRequestAlertException if lead time is less than 2 hours
         */
        private void validateMinimumLeadTime(LocalDateTime startTime) {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime minimumStartTime = now.plusHours(2);

                if (startTime.isBefore(minimumStartTime)) {
                        long minutesUntil = java.time.Duration.between(now, startTime).toMinutes();
                        throw new BadRequestAlertException(
                                        String.format("Phải đặt lịch trước ít nhất 2 giờ. Thời gian yêu cầu: %s (chỉ còn %d phút). Thời gian tối thiểu cho phép: %s",
                                                        startTime, minutesUntil, minimumStartTime),
                                        ENTITY_NAME,
                                        "MINIMUM_LEAD_TIME_VIOLATION");
                }
        }

        /**
         * Rule #1: Validate maximum 3-month advance booking
         * Patient cannot book more than 3 months in advance
         *
         * @param startTime Appointment start time
         * @throws BadRequestAlertException if booking is more than 3 months ahead
         */
        private void validateMaximumAdvanceBooking(LocalDateTime startTime) {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime maxAllowedTime = now.plusMonths(3);

                if (startTime.isAfter(maxAllowedTime)) {
                        throw new BadRequestAlertException(
                                        String.format("Không thể đặt lịch quá xa. Thời gian yêu cầu: %s. Thời gian tối đa cho phép: %s (3 tháng kể từ hôm nay)",
                                                        startTime, maxAllowedTime),
                                        ENTITY_NAME,
                                        "MAXIMUM_ADVANCE_BOOKING_VIOLATION");
                }
        }

        /**
         * Rule #5: Validate patient is not blocked from booking
         * Patients with 3+ consecutive no-shows are blocked from online booking
         *
         * @param patient Patient entity
         * @throws BadRequestAlertException if patient is blocked
         */
        private void validatePatientNotBlocked(Patient patient) {
                if (Boolean.TRUE.equals(patient.getIsBookingBlocked())) {
                        throw new BadRequestAlertException(
                                        String.format("Bệnh nhân %s đã bị chặn đặt lịch online. Lý do: %s. Vui lòng liên hệ lễ tân để được hỗ trợ.",
                                                        patient.getPatientCode(),
                                                        patient.getBookingBlockReason() != null
                                                                        ? patient.getBookingBlockReason()
                                                                        : "Bỏ hẹn nhiều lần"),
                                        ENTITY_NAME,
                                        "PATIENT_BOOKING_BLOCKED");
                }
        }

        /**
         * Rule: Validate first appointment date proximity to treatment plan start date
         * First appointment must be booked within 7 days of the plan's start date
         * to ensure timely treatment initiation.
         *
         * @param itemIds              List of plan item IDs being booked
         * @param appointmentStartTime Requested appointment start time
         * @throws BadRequestAlertException if first appointment is scheduled too far
         *                                  from plan start
         */
        private void validatePlanStartDateProximity(List<Long> itemIds, LocalDateTime appointmentStartTime) {
                try {
                        // Get the treatment plan from first item (all items belong to same plan)
                        PatientPlanItem firstItem = patientPlanItemRepository.findById(itemIds.get(0))
                                        .orElseThrow(() -> new IllegalStateException(
                                                        "Plan item not found: " + itemIds.get(0)));

                        com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan plan = firstItem
                                        .getPhase()
                                        .getTreatmentPlan();

                        // Check if this is the FIRST appointment for this plan
                        long existingAppointmentCount = appointmentPlanItemRepository
                                        .countAppointmentsForPlan(plan.getPlanId().longValue());

                        if (existingAppointmentCount == 0) { // This will be the FIRST appointment
                                LocalDate planStartDate = plan.getStartDate();
                                LocalDate appointmentDate = appointmentStartTime.toLocalDate();

                                // Calculate days between plan start and appointment
                                long daysDifference = java.time.temporal.ChronoUnit.DAYS.between(planStartDate,
                                                appointmentDate);

                                if (daysDifference > 7) {
                                        throw new BadRequestAlertException(
                                                        String.format(
                                                                        "Lịch hẹn đầu tiên phải được đặt trong vòng 7 ngày kể từ ngày bắt đầu kế hoạch điều trị. "
                                                                                        + "Ngày bắt đầu kế hoạch: %s, Ngày hẹn yêu cầu: %s (cách nhau %d ngày). "
                                                                                        + "Vui lòng chọn ngày hẹn từ %s đến %s.",
                                                                        planStartDate,
                                                                        appointmentDate,
                                                                        daysDifference,
                                                                        planStartDate,
                                                                        planStartDate.plusDays(7)),
                                                        ENTITY_NAME,
                                                        "FIRST_APPOINTMENT_TOO_FAR_FROM_PLAN_START");
                                } else if (daysDifference < 0) {
                                        throw new BadRequestAlertException(
                                                        String.format(
                                                                        "Lịch hẹn không thể đặt trước ngày bắt đầu kế hoạch điều trị. "
                                                                                        + "Ngày bắt đầu kế hoạch: %s, Ngày hẹn yêu cầu: %s.",
                                                                        planStartDate,
                                                                        appointmentDate),
                                                        ENTITY_NAME,
                                                        "APPOINTMENT_BEFORE_PLAN_START");
                                }

                                log.debug("First appointment date validation passed: plan starts {}, appointment on {} ({} days difference)",
                                                planStartDate, appointmentDate, daysDifference);
                        } else {
                                log.debug("Plan already has {} appointments - skipping start date proximity check",
                                                existingAppointmentCount);
                        }
                } catch (BadRequestAlertException e) {
                        throw e; // Re-throw validation errors
                } catch (Exception e) {
                        log.error("Error validating plan start date proximity", e);
                        throw new BadRequestAlertException(
                                        "Không thể xác thực thời gian đặt lịch với kế hoạch điều trị: "
                                                        + e.getMessage(),
                                        ENTITY_NAME,
                                        "PLAN_DATE_VALIDATION_ERROR");
                }
        }
}
