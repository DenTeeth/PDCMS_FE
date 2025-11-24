package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.dto.AppointmentFilterCriteria;
import com.dental.clinic.management.booking_appointment.dto.AppointmentSummaryDTO;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentResponse;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
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
    // TODO: Add RoomRepository, ServiceRepository, AppointmentParticipantRepository

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
                    pageableJpql); // ✅ Use JPQL pageable (camelCase)
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
                    pageableJpql); // ✅ Use JPQL pageable (camelCase)
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
                        pageableNative); // ✅ Use NATIVE pageable (snake_case)
            } else {
                log.info("Executing search with individual filters");
                appointments = appointmentRepository.findByFilters(
                        startDate,
                        endDate,
                        statusArray, // ✅ Pass String[] instead of List
                        null, // patientId - TODO: resolve from patientCode if needed
                        null, // employeeId - TODO: resolve from employeeCode if needed
                        criteria.getRoomCode(),
                        criteria.getPatientName(), // ✅ NEW: Search by name
                        criteria.getPatientPhone(), // ✅ NEW: Search by phone
                        pageableNative); // ✅ Use NATIVE pageable (snake_case)
            }
        }

        // Step 7: Map to DTOs
        return appointments.map(this::mapToSummaryDTO);
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
        // TODO: Need Patient.account relationship or query by account_id
        // For now, this is placeholder
        log.warn("Patient RBAC filter not yet implemented - need Patient.account mapping");

        // Placeholder: If not employee, assume patient
        // TODO: Query patients table: findByAccount_Username(username)
        // criteria.setCurrentUserPatientId(patientId);
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
     * Map Appointment entity to SummaryDTO
     *
     * OPTIMIZATION: Batch load related entities to prevent N+1 queries
     * - Collect all IDs first
     * - Query in batches
     * - Map to DTOs
     *
     * TODO: Implement batch loading for production
     * Current: Simple version (will cause N+1)
     */
    private AppointmentSummaryDTO mapToSummaryDTO(Appointment appointment) {
        // Fetch related entities
        // NOTE: This is N+1 query problem - need to optimize with batch loading

        CreateAppointmentResponse.PatientSummary patientSummary = null;
        try {
            var patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
            if (patient != null) {
                patientSummary = CreateAppointmentResponse.PatientSummary.builder()
                        .patientCode(patient.getPatientCode())
                        .fullName(patient.getFirstName() + " " + patient.getLastName())
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

        // TODO: Load room, services, participants
        CreateAppointmentResponse.RoomSummary roomSummary = CreateAppointmentResponse.RoomSummary.builder()
                .roomCode(appointment.getRoomId())
                .roomName("Room " + appointment.getRoomId()) // TODO: Load from RoomRepository
                .build();

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
                .services(new ArrayList<>()) // TODO: Load from AppointmentServiceRepository
                .participants(new ArrayList<>()) // TODO: Load from AppointmentParticipantRepository
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
