package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.dto.AppointmentFilterCriteria;
import com.dental.clinic.management.booking_appointment.dto.AppointmentSummaryDTO;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentResponse;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant;
import com.dental.clinic.management.booking_appointment.repository.AppointmentParticipantRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.booking_appointment.repository.RoomRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for fetching appointment list (Dashboard View)
 * P3.3: GET /api/v1/appointments
 *
 * Key Features:
 * - RBAC enforcement (VIEW_APPOINTMENT_ALL vs VIEW_APPOINTMENT_OWN)
 * - Dynamic filtering (date, status, patient, doctor, room)
 * - Pagination and sorting
 * - DTO mapping with nested summaries
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentListService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final EmployeeRepository employeeRepository;
    private final RoomRepository roomRepository;
    private final AppointmentParticipantRepository appointmentParticipantRepository;

    /**
     * Get paginated appointment list with RBAC filtering
     *
     * Business Logic:
     * 1. Check user permissions (VIEW_APPOINTMENT_ALL vs VIEW_APPOINTMENT_OWN)
     * 2. Override filter criteria based on user role
     * 3. Apply date/status/entity filters
     * 4. Return paginated results with nested DTOs
     *
     * CRITICAL CHANGE: Permission-based auth (NOT role-based)
     * - Check PERMISSION_ID in authorities (e.g., "VIEW_APPOINTMENT_ALL")
     * - NOT check role_id (e.g., "ROLE_DOCTOR")
     *
     * OBSERVER Handling:
     * - OBSERVER has "VIEW_APPOINTMENT_OWN" permission
     * - Can see appointments where they are participants
     * - Should NOT see full medical history (separate permission)
     */
    @Transactional(readOnly = true)
    public Page<AppointmentSummaryDTO> getAppointments(
            AppointmentFilterCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection) {

        log.info("Fetching appointments with criteria: {}", criteria);

        // Step 1: Check RBAC permissions (PERMISSION-BASED, not role-based)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Check for VIEW_APPOINTMENT_ALL permission
        // This permission allows: Receptionist, Manager to see ALL appointments
        boolean canViewAll = auth.getAuthorities().stream()
                .anyMatch(grantedAuth -> grantedAuth.getAuthority().equals("VIEW_APPOINTMENT_ALL"));

        criteria.setCanViewAll(canViewAll);

        // Step 2: Override filters based on user role
        if (!canViewAll) {
            applyRBACFilters(auth, criteria);
        }

        // Step 2.5: Apply DatePreset if provided (auto-calculate dateFrom/dateTo)
        applyDatePreset(criteria);

        // Step 2.6: Handle combined searchCode parameter
        if (criteria.getSearchCode() != null && !criteria.getSearchCode().isBlank()) {
            if (!canViewAll) {
                log.warn("User without VIEW_APPOINTMENT_ALL tried to use searchCode - ignoring");
                criteria.setSearchCode(null);
            } else {
                log.info("Using combined searchCode: {}", criteria.getSearchCode());
                // searchCode will be handled in repository query
                // Clear individual code filters to avoid conflicts
                criteria.setPatientCode(null);
                criteria.setEmployeeCode(null);
                criteria.setRoomCode(null);
                criteria.setServiceCode(null);
            }
        }

        // Step 3: Build date range
        LocalDateTime startDate = buildStartDate(criteria);
        LocalDateTime endDate = buildEndDate(criteria);

        // Step 4: Build status list
        List<AppointmentStatus> statuses = buildStatusList(criteria);

        // Step 5: Build pageable
        // CRITICAL FIX: Native queries need snake_case, JPQL queries need camelCase
        // Create TWO Pageable objects:
        // - pageableNative: For native SQL queries (uses snake_case field names)
        // - pageableJpql: For JPQL queries (uses camelCase entity field names)

        String snakeCaseSortBy = convertToSnakeCase(sortBy);
        Sort sortNative;
        Sort sortJpql;

        if (sortDirection.equalsIgnoreCase("DESC")) {
            sortNative = org.springframework.data.jpa.domain.JpaSort.unsafe(snakeCaseSortBy).descending();
            sortJpql = Sort.by(Sort.Direction.DESC, sortBy);
        } else {
            sortNative = org.springframework.data.jpa.domain.JpaSort.unsafe(snakeCaseSortBy).ascending();
            sortJpql = Sort.by(Sort.Direction.ASC, sortBy);
        }

        Pageable pageableNative = PageRequest.of(page, size, sortNative);
        Pageable pageableJpql = PageRequest.of(page, size, sortJpql);

        // Step 6: Execute query based on RBAC
        Page<Appointment> appointments;

        if (criteria.getCurrentUserPatientId() != null) {
            // Patient view: Only their appointments (JPQL query)
            log.info("Patient view: Filtering by patientId={}", criteria.getCurrentUserPatientId());
            appointments = appointmentRepository.findByPatientIdWithFilters(
                    criteria.getCurrentUserPatientId(),
                    startDate,
                    endDate,
                    statuses,
                    pageableJpql); // Use JPQL pageable (camelCase)
        } else if (criteria.getCurrentUserEmployeeId() != null) {
            // Employee view: Where they are primary doctor OR participant (JPQL query)
            // This includes: Doctor, Nurse/Assistant, OBSERVER (thực tập sinh)
            log.info("Employee view: Filtering by employeeId={} (includes OBSERVER role)",
                    criteria.getCurrentUserEmployeeId());
            appointments = appointmentRepository.findByEmployeeIdWithFilters(
                    criteria.getCurrentUserEmployeeId(),
                    startDate,
                    endDate,
                    statuses,
                    pageableJpql); // Use JPQL pageable (camelCase)
        } else {
            // Admin/Receptionist view: All appointments with optional filters (NATIVE
            // queries)
            log.info("Admin view: Using all filters (including patient name/phone search)");

            // Convert List<AppointmentStatus> to String[] for native query
            String[] statusArray = null;
            if (statuses != null && !statuses.isEmpty()) {
                statusArray = statuses.stream()
                        .map(Enum::name)
                        .toArray(String[]::new);
            }

            // Check if using combined searchCode
            if (criteria.getSearchCode() != null && !criteria.getSearchCode().isBlank()) {
                log.info("Executing search with combined searchCode: {}", criteria.getSearchCode());
                appointments = appointmentRepository.findBySearchCode(
                        startDate,
                        endDate,
                        statusArray,
                        criteria.getSearchCode(),
                        pageableNative); // Use NATIVE pageable (snake_case)
            } else {
                log.info("Executing search with individual filters");

                // Resolve patientCode to patientId if provided
                Integer patientId = null;
                if (criteria.getPatientCode() != null && !criteria.getPatientCode().isBlank()) {
                    var patient = patientRepository.findOneByPatientCode(criteria.getPatientCode()).orElse(null);
                    if (patient != null) {
                        patientId = patient.getPatientId();
                        log.debug("Resolved patientCode {} to patientId {}", criteria.getPatientCode(), patientId);
                    } else {
                        log.warn("Patient not found for patientCode: {}", criteria.getPatientCode());
                    }
                }

                // Resolve employeeCode to employeeId if provided
                Integer employeeId = null;
                if (criteria.getEmployeeCode() != null && !criteria.getEmployeeCode().isBlank()) {
                    var employee = employeeRepository.findByEmployeeCodeAndIsActiveTrue(criteria.getEmployeeCode())
                            .orElse(null);
                    if (employee != null) {
                        employeeId = employee.getEmployeeId();
                        log.debug("Resolved employeeCode {} to employeeId {}", criteria.getEmployeeCode(), employeeId);
                    } else {
                        log.warn("Employee not found for employeeCode: {}", criteria.getEmployeeCode());
                    }
                }

                appointments = appointmentRepository.findByFilters(
                        startDate,
                        endDate,
                        statusArray,
                        patientId,
                        employeeId,
                        criteria.getRoomCode(),
                        criteria.getPatientName(),
                        criteria.getPatientPhone(),
                        pageableNative);
            }
        }

        // Step 7: Map to DTOs with batch loading to prevent N+1 queries
        return mapToSummaryDTOsWithBatchLoading(appointments);
    }

    /**
     * Apply RBAC filters by overriding criteria based on user's account
     *
     * CRITICAL LOGIC:
     * - Get username from Authentication
     * - Query database to find if user is employee or patient
     * - Set currentUserEmployeeId or currentUserPatientId
     * - This will OVERRIDE any patientCode/employeeCode from query params
     *
     * Security: Prevent privilege escalation
     * - Patient CANNOT see other patients' appointments (even if they send
     * ?patientCode=BN-XXXX)
     * - Employee CANNOT see other employees' appointments (even if they send
     * ?employeeCode=EMP-SEQ)
     */
    private void applyRBACFilters(Authentication auth, AppointmentFilterCriteria criteria) {
        String username = auth.getName();
        log.info("Applying RBAC filters for user: {}", username);

        // Try to find employee first (Doctor, Nurse, OBSERVER, etc.)
        var employeeOpt = employeeRepository.findByAccount_Username(username);
        if (employeeOpt.isPresent()) {
            Integer employeeId = employeeOpt.get().getEmployeeId();
            log.info("User {} is employee with ID: {} (includes OBSERVER role)", username, employeeId);
            criteria.setCurrentUserEmployeeId(employeeId);
            return;
        }

        // Try to find patient
        var patientOpt = patientRepository.findByAccount_Username(username);
        if (patientOpt.isPresent()) {
            Integer patientId = patientOpt.get().getPatientId();
            log.info("User {} is patient with ID: {}", username, patientId);
            criteria.setCurrentUserPatientId(patientId);
            return;
        }

        // User not found as employee or patient
        log.warn("User {} not found as employee or patient - no appointments will be visible", username);
    }

    /**
     * Apply DatePreset to auto-calculate dateFrom/dateTo
     * If datePreset is set, it OVERRIDES manual dateFrom/dateTo
     *
     * Example:
     * - datePreset=TODAY → dateFrom=2025-11-04, dateTo=2025-11-04
     * - datePreset=THIS_WEEK → dateFrom=Monday, dateTo=Sunday
     */
    @SuppressWarnings("deprecation")
    private void applyDatePreset(AppointmentFilterCriteria criteria) {
        if (criteria.getDatePreset() != null) {
            LocalDate from = criteria.getDatePreset().getDateFrom();
            LocalDate to = criteria.getDatePreset().getDateTo();

            log.info("DatePreset {} applied: {} to {}", criteria.getDatePreset(), from, to);

            criteria.setDateFrom(from);
            criteria.setDateTo(to);
            // Clear deprecated 'today' flag
            criteria.setToday(null);
        }
    }

    /**
     * Build start date from criteria
     */
    @SuppressWarnings("deprecation")
    private LocalDateTime buildStartDate(AppointmentFilterCriteria criteria) {
        if (Boolean.TRUE.equals(criteria.getToday())) {
            return LocalDate.now().atStartOfDay();
        }

        if (criteria.getDateFrom() != null) {
            return criteria.getDateFrom().atStartOfDay();
        }

        return null; // No filter
    }

    /**
     * Build end date from criteria
     */
    @SuppressWarnings("deprecation")
    private LocalDateTime buildEndDate(AppointmentFilterCriteria criteria) {
        if (Boolean.TRUE.equals(criteria.getToday())) {
            return LocalDate.now().atTime(LocalTime.MAX);
        }

        if (criteria.getDateTo() != null) {
            return criteria.getDateTo().atTime(LocalTime.MAX);
        }

        return null; // No filter
    }

    /**
     * Build status list from criteria
     */
    private List<AppointmentStatus> buildStatusList(AppointmentFilterCriteria criteria) {
        if (criteria.getStatus() == null || criteria.getStatus().isEmpty()) {
            return null; // No filter
        }

        return criteria.getStatus().stream()
                .map(AppointmentStatus::valueOf)
                .collect(Collectors.toList());
    }

    /**
     * Batch load related entities and map appointments to DTOs
     * Prevents N+1 query problem by loading all related entities in bulk
     */
    private Page<AppointmentSummaryDTO> mapToSummaryDTOsWithBatchLoading(Page<Appointment> appointments) {
        List<Appointment> appointmentList = appointments.getContent();

        if (appointmentList.isEmpty()) {
            return appointments.map(this::mapToSummaryDTO);
        }

        // Step 1: Collect all unique IDs
        var patientIds = appointmentList.stream()
                .map(Appointment::getPatientId)
                .distinct()
                .collect(Collectors.toList());

        var employeeIds = appointmentList.stream()
                .map(Appointment::getEmployeeId)
                .distinct()
                .collect(Collectors.toList());

        var roomIds = appointmentList.stream()
                .map(Appointment::getRoomId)
                .distinct()
                .collect(Collectors.toList());

        var appointmentIds = appointmentList.stream()
                .map(Appointment::getAppointmentId)
                .collect(Collectors.toList());

        // Step 2: Batch load entities
        var patientMap = patientRepository.findAllById(patientIds).stream()
                .collect(Collectors.toMap(
                        p -> p.getPatientId(),
                        p -> p));

        var employeeMap = employeeRepository.findAllById(employeeIds).stream()
                .collect(Collectors.toMap(
                        e -> e.getEmployeeId(),
                        e -> e));

        var roomMap = roomRepository.findAllById(roomIds).stream()
                .collect(Collectors.toMap(
                        r -> r.getRoomId(),
                        r -> r));

        // Step 3: Batch load services for all appointments
        var servicesMap = new java.util.HashMap<Integer, List<CreateAppointmentResponse.ServiceSummary>>();
        for (Integer appointmentId : appointmentIds) {
            try {
                List<Object[]> serviceData = appointmentRepository.findServicesByAppointmentId(appointmentId);
                List<CreateAppointmentResponse.ServiceSummary> services = serviceData.stream()
                        .map(row -> CreateAppointmentResponse.ServiceSummary.builder()
                                .serviceCode((String) row[0])
                                .serviceName((String) row[1])
                                .build())
                        .collect(Collectors.toList());
                servicesMap.put(appointmentId, services);
            } catch (Exception e) {
                log.warn("Failed to load services for appointmentId={}: {}", appointmentId, e.getMessage());
                servicesMap.put(appointmentId, new ArrayList<>());
            }
        }

        // Step 4: Batch load participants for all appointments
        var participantsMap = new java.util.HashMap<Integer, List<CreateAppointmentResponse.ParticipantSummary>>();
        for (Integer appointmentId : appointmentIds) {
            try {
                List<AppointmentParticipant> appointmentParticipants = appointmentParticipantRepository
                        .findByIdAppointmentId(appointmentId);

                List<CreateAppointmentResponse.ParticipantSummary> participants = appointmentParticipants.stream()
                        .map(ap -> {
                            var participantEmployee = employeeMap.get(ap.getId().getEmployeeId());
                            if (participantEmployee != null) {
                                return CreateAppointmentResponse.ParticipantSummary.builder()
                                        .employeeCode(participantEmployee.getEmployeeCode())
                                        .fullName(participantEmployee.getFirstName() + " "
                                                + participantEmployee.getLastName())
                                        .role(ap.getRole())
                                        .build();
                            }
                            return null;
                        })
                        .filter(p -> p != null)
                        .collect(Collectors.toList());

                participantsMap.put(appointmentId, participants);
            } catch (Exception e) {
                log.warn("Failed to load participants for appointmentId={}: {}", appointmentId, e.getMessage());
                participantsMap.put(appointmentId, new ArrayList<>());
            }
        }

        // Step 5: Map appointments using cached entities
        return appointments.map(appointment -> mapToSummaryDTOWithCache(
                appointment, patientMap, employeeMap, roomMap, servicesMap, participantsMap));
    }

    /**
     * Map single appointment to DTO using pre-loaded entity caches
     */
    private AppointmentSummaryDTO mapToSummaryDTOWithCache(
            Appointment appointment,
            java.util.Map<Integer, com.dental.clinic.management.patient.domain.Patient> patientMap,
            java.util.Map<Integer, com.dental.clinic.management.employee.domain.Employee> employeeMap,
            java.util.Map<String, com.dental.clinic.management.booking_appointment.domain.Room> roomMap,
            java.util.Map<Integer, List<CreateAppointmentResponse.ServiceSummary>> servicesMap,
            java.util.Map<Integer, List<CreateAppointmentResponse.ParticipantSummary>> participantsMap) {

        // Build patient summary with full details
        CreateAppointmentResponse.PatientSummary patientSummary = null;
        var patient = patientMap.get(appointment.getPatientId());
        if (patient != null) {
            // Calculate age
            Integer age = null;
            if (patient.getDateOfBirth() != null) {
                age = java.time.Period.between(patient.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            }

            patientSummary = CreateAppointmentResponse.PatientSummary.builder()
                    .patientId(patient.getPatientId())
                    .patientCode(patient.getPatientCode())
                    .fullName(patient.getFirstName() + " " + patient.getLastName())
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
                    .build();
        }

        // Build doctor summary
        CreateAppointmentResponse.DoctorSummary doctorSummary = null;
        var employee = employeeMap.get(appointment.getEmployeeId());
        if (employee != null) {
            doctorSummary = CreateAppointmentResponse.DoctorSummary.builder()
                    .employeeCode(employee.getEmployeeCode())
                    .fullName(employee.getFirstName() + " " + employee.getLastName())
                    .build();
        }

        // Build room summary
        CreateAppointmentResponse.RoomSummary roomSummary = null;
        var room = roomMap.get(appointment.getRoomId());
        if (room != null) {
            roomSummary = CreateAppointmentResponse.RoomSummary.builder()
                    .roomCode(room.getRoomCode())
                    .roomName(room.getRoomName())
                    .build();
        }

        // Get services and participants from cache
        List<CreateAppointmentResponse.ServiceSummary> services = servicesMap
                .getOrDefault(appointment.getAppointmentId(), new ArrayList<>());
        List<CreateAppointmentResponse.ParticipantSummary> participants = participantsMap
                .getOrDefault(appointment.getAppointmentId(), new ArrayList<>());

        // Compute dynamic fields
        LocalDateTime now = LocalDateTime.now();
        String computedStatus = calculateComputedStatus(appointment, now);
        Long minutesLate = calculateMinutesLate(appointment, now);

        return AppointmentSummaryDTO.builder()
                .appointmentCode(appointment.getAppointmentCode())
                .status(appointment.getStatus().name())
                .computedStatus(computedStatus)
                .minutesLate(minutesLate)
                .appointmentStartTime(appointment.getAppointmentStartTime())
                .appointmentEndTime(appointment.getAppointmentEndTime())
                .expectedDurationMinutes(appointment.getExpectedDurationMinutes())
                .patient(patientSummary)
                .doctor(doctorSummary)
                .room(roomSummary)
                .services(services)
                .participants(participants)
                .notes(appointment.getNotes())
                .build();
    }

    /**
     * Fallback method for mapping single appointment (used for empty pages)
     */
    private AppointmentSummaryDTO mapToSummaryDTO(Appointment appointment) {
        // Fetch related entities
        // NOTE: This is N+1 query problem - need to optimize with batch loading

        CreateAppointmentResponse.PatientSummary patientSummary = null;
        try {
            var patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
            if (patient != null) {
                // Calculate age
                Integer age = null;
                if (patient.getDateOfBirth() != null) {
                    age = java.time.Period.between(patient.getDateOfBirth(), java.time.LocalDate.now()).getYears();
                }

                patientSummary = CreateAppointmentResponse.PatientSummary.builder()
                        .patientId(patient.getPatientId())
                        .patientCode(patient.getPatientCode())
                        .fullName(patient.getFirstName() + " " + patient.getLastName())
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
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to load patient for appointmentId={}: {}",
                    appointment.getAppointmentId(), e.getMessage());
        }

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
            log.warn("Failed to load employee for appointmentId={}: {}",
                    appointment.getAppointmentId(), e.getMessage());
        }

        // Load room
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
            log.warn("Failed to load room for appointmentId={}: {}",
                    appointment.getAppointmentId(), e.getMessage());
        }

        // Load services
        List<CreateAppointmentResponse.ServiceSummary> services = new ArrayList<>();
        try {
            List<Object[]> serviceData = appointmentRepository
                    .findServicesByAppointmentId(appointment.getAppointmentId());
            for (Object[] row : serviceData) {
                String serviceCode = (String) row[0];
                String serviceName = (String) row[1];
                services.add(CreateAppointmentResponse.ServiceSummary.builder()
                        .serviceCode(serviceCode)
                        .serviceName(serviceName)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Failed to load services for appointmentId={}: {}",
                    appointment.getAppointmentId(), e.getMessage());
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
            log.warn("Failed to load participants for appointmentId={}: {}",
                    appointment.getAppointmentId(), e.getMessage());
        }

        // Compute dynamic fields based on current time
        LocalDateTime now = LocalDateTime.now();
        String computedStatus = calculateComputedStatus(appointment, now);
        Long minutesLate = calculateMinutesLate(appointment, now);

        return AppointmentSummaryDTO.builder()
                .appointmentCode(appointment.getAppointmentCode())
                .status(appointment.getStatus().name())
                .computedStatus(computedStatus)
                .minutesLate(minutesLate)
                .appointmentStartTime(appointment.getAppointmentStartTime())
                .appointmentEndTime(appointment.getAppointmentEndTime())
                .expectedDurationMinutes(appointment.getExpectedDurationMinutes())
                .patient(patientSummary)
                .doctor(doctorSummary)
                .room(roomSummary)
                .services(services)
                .participants(participants)
                .notes(appointment.getNotes())
                .build();
    }

    /**
     * Calculate computed status based on appointment status and current time
     *
     * Logic:
     * - CANCELLED: If status == CANCELLED
     * - COMPLETED: If status == COMPLETED
     * - NO_SHOW: If status == NO_SHOW
     * - CHECKED_IN: If status == CHECKED_IN
     * - IN_PROGRESS: If status == IN_PROGRESS
     * - LATE: If status == SCHEDULED && now > appointmentStartTime
     * - UPCOMING: If status == SCHEDULED && now <= appointmentStartTime
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
     * Calculate minutes late for SCHEDULED appointments
     * Returns 0 if not late, or positive number of minutes if late
     */
    private Long calculateMinutesLate(Appointment appointment, LocalDateTime now) {
        // Only calculate for SCHEDULED appointments
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            return 0L;
        }

        // Check if late
        if (now.isAfter(appointment.getAppointmentStartTime())) {
            return java.time.Duration.between(appointment.getAppointmentStartTime(), now).toMinutes();
        }

        return 0L;
    }

    /**
     * Convert camelCase to snake_case for native SQL queries
     * Example: appointmentStartTime -> appointment_start_time
     */
    private String convertToSnakeCase(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }
}
