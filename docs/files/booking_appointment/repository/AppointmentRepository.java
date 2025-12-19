package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Appointment Entity
 * Critical queries for availability checking and resource locking
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

        /**
         * Find appointment by unique code
         */
        Optional<Appointment> findByAppointmentCode(String appointmentCode);

        /**
         * Find appointment by code with PESSIMISTIC WRITE LOCK (SELECT ... FOR UPDATE)
         * CRITICAL: Use this method for status updates to prevent race conditions.
         *
         * Use case: Two receptionists trying to check-in the same appointment
         * simultaneously.
         * Solution: First transaction locks the row, second waits until first commits.
         *
         * @param appointmentCode Unique appointment code
         * @return Locked appointment entity
         */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT a FROM Appointment a WHERE a.appointmentCode = :appointmentCode")
        Optional<Appointment> findByCodeForUpdate(@Param("appointmentCode") String appointmentCode);

        /**
         * Find appointment detail by code with JOIN FETCH
         * Prevents N+1 queries by loading all related entities in one query
         *
         * NOTE: We DON'T use JOIN FETCH for AppointmentService and
         * AppointmentParticipant
         * because they are junction tables with composite keys.
         * We load them separately using repository methods.
         *
         * @param appointmentCode Unique appointment code
         * @return Appointment with basic info only
         */
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.appointmentCode = :appointmentCode")
        Optional<Appointment> findDetailByCode(@Param("appointmentCode") String appointmentCode);

        /**
         * Find all services for an appointment with a direct SQL-like join
         * Returns: [service_code, service_name]
         *
         * @param appointmentId The appointment ID
         * @return List of Object arrays containing service details
         */
        @Query("SELECT s.serviceCode, s.serviceName " +
                        "FROM AppointmentService aps " +
                        "JOIN aps.service s " +
                        "WHERE aps.id.appointmentId = :appointmentId")
        List<Object[]> findServicesByAppointmentId(@Param("appointmentId") Integer appointmentId);

        /**
         * Find last appointment code with prefix for sequence generation
         * Example: findTopByAppointmentCodeStartingWith("APT-20251115-") ->
         * "APT-20251115-003"
         */
        Optional<Appointment> findTopByAppointmentCodeStartingWithOrderByAppointmentCodeDesc(String codePrefix);

        /**
         * Find all appointments for a specific employee within date range
         * Used for: Checking doctor's busy time slots
         *
         * @param employeeId Bác sĩ chính hoặc participant
         * @param startTime  Range start (inclusive)
         * @param endTime    Range end (inclusive)
         * @param statuses   Filter by statuses (exclude CANCELLED, NO_SHOW)
         * @return List of appointments
         */
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.employeeId = :employeeId " +
                        "AND a.status IN :statuses " +
                        "AND ((a.appointmentStartTime >= :startTime AND a.appointmentStartTime < :endTime) " +
                        "OR (a.appointmentEndTime > :startTime AND a.appointmentEndTime <= :endTime) " +
                        "OR (a.appointmentStartTime <= :startTime AND a.appointmentEndTime >= :endTime))")
        List<Appointment> findByEmployeeAndTimeRange(
                        @Param("employeeId") Integer employeeId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("statuses") List<AppointmentStatus> statuses);

        /**
         * Find all appointments for a specific room within date range
         * Used for: Checking room availability
         *
         * @param roomId Room ID (VARCHAR matching rooms.room_id)
         */
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.roomId = :roomId " +
                        "AND a.status IN :statuses " +
                        "AND ((a.appointmentStartTime >= :startTime AND a.appointmentStartTime < :endTime) " +
                        "OR (a.appointmentEndTime > :startTime AND a.appointmentEndTime <= :endTime) " +
                        "OR (a.appointmentStartTime <= :startTime AND a.appointmentEndTime >= :endTime))")
        List<Appointment> findByRoomAndTimeRange(
                        @Param("roomId") String roomId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("statuses") List<AppointmentStatus> statuses);

        /**
         * Find all appointments for a specific patient within date range
         * Used for: Checking patient availability (prevent double booking)
         *
         * @param patientId Patient ID
         * @param startTime Range start (inclusive)
         * @param endTime   Range end (inclusive)
         * @param statuses  Filter by statuses (exclude CANCELLED, NO_SHOW)
         * @return List of appointments
         */
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.patientId = :patientId " +
                        "AND a.status IN :statuses " +
                        "AND ((a.appointmentStartTime >= :startTime AND a.appointmentStartTime < :endTime) " +
                        "OR (a.appointmentEndTime > :startTime AND a.appointmentEndTime <= :endTime) " +
                        "OR (a.appointmentStartTime <= :startTime AND a.appointmentEndTime >= :endTime))")
        List<Appointment> findByPatientAndTimeRange(
                        @Param("patientId") Integer patientId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("statuses") List<AppointmentStatus> statuses);

        /**
         * Find appointments for a patient
         */
        List<Appointment> findByPatientIdOrderByAppointmentStartTimeDesc(Integer patientId);

        /**
         * Find appointments by status
         */
        List<Appointment> findByStatus(AppointmentStatus status);

        /**
         * Check if time slot conflicts with existing appointments for an employee
         * Used for: Preventing double-booking
         */
        @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
                        "WHERE a.employeeId = :employeeId " +
                        "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
                        "AND ((a.appointmentStartTime < :endTime AND a.appointmentEndTime > :startTime))")
        boolean existsConflictForEmployee(
                        @Param("employeeId") Integer employeeId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime);

        /**
         * Check if time slot conflicts with existing appointments for a room
         *
         * @param roomId        Room ID (VARCHAR matching rooms.room_id)
         * @param appointmentId Optional appointment ID to exclude (for delay operation)
         */
        @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
                        "WHERE a.roomId = :roomId " +
                        "AND (:appointmentId IS NULL OR a.appointmentId != :appointmentId) " +
                        "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
                        "AND ((a.appointmentStartTime < :endTime AND a.appointmentEndTime > :startTime))")
        boolean existsConflictForRoom(
                        @Param("roomId") String roomId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("appointmentId") Integer appointmentId);

        /**
         * Check if time slot conflicts with existing appointments for a patient
         * Used in delay appointment to prevent double-booking
         *
         * @param patientId     Patient ID
         * @param appointmentId Current appointment ID (to exclude from check)
         */
        @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
                        "WHERE a.patientId = :patientId " +
                        "AND (:appointmentId IS NULL OR a.appointmentId != :appointmentId) " +
                        "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
                        "AND ((a.appointmentStartTime < :endTime AND a.appointmentEndTime > :startTime))")
        boolean existsConflictForPatient(
                        @Param("patientId") Integer patientId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("appointmentId") Integer appointmentId);

        /**
         * Check if time slot conflicts with existing appointments for a doctor
         * Used in delay appointment
         *
         * @param doctorId      Doctor employee ID
         * @param appointmentId Current appointment ID (to exclude from check)
         */
        @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
                        "WHERE a.employeeId = :doctorId " +
                        "AND (:appointmentId IS NULL OR a.appointmentId != :appointmentId) " +
                        "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
                        "AND ((a.appointmentStartTime < :endTime AND a.appointmentEndTime > :startTime))")
        boolean existsConflictForDoctor(
                        @Param("doctorId") Integer doctorId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("appointmentId") Integer appointmentId);

        /**
         * Check if time slot conflicts for a participant (nurse/assistant)
         * Checks both as main doctor and as participant
         *
         * @param employeeId    Participant employee ID
         * @param appointmentId Current appointment ID (to exclude from check)
         */
        @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
                        "WHERE (:appointmentId IS NULL OR a.appointmentId != :appointmentId) " +
                        "AND a.status IN ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS') " +
                        "AND ((a.appointmentStartTime < :endTime AND a.appointmentEndTime > :startTime)) " +
                        "AND (a.employeeId = :employeeId " +
                        "     OR EXISTS (SELECT 1 FROM AppointmentParticipant ap " +
                        "                WHERE ap.id.appointmentId = a.appointmentId " +
                        "                AND ap.id.employeeId = :employeeId))")
        boolean existsConflictForParticipant(
                        @Param("employeeId") Integer employeeId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("appointmentId") Integer appointmentId);

        // ==================== DASHBOARD QUERIES (P3.3) ====================

        /**
         * Find appointments with filters (for users with VIEW_APPOINTMENT_ALL)
         * Supports: date range, status, patientId, employeeId, roomId
         *
         * CRITICAL IMPROVEMENT: Search by patient name/phone
         *
         * CRITICAL FIX: Use COALESCE to force type inference for PostgreSQL
         */
        @Query(value = "SELECT DISTINCT a.* FROM appointments a " +
                        "LEFT JOIN patients p ON a.patient_id = p.patient_id " +
                        "LEFT JOIN employees e ON a.employee_id = e.employee_id " +
                        "WHERE (COALESCE(:startDate, NULL::timestamp) IS NULL OR a.appointment_start_time >= :startDate) "
                        +
                        "AND (COALESCE(:endDate, NULL::timestamp) IS NULL OR a.appointment_start_time <= :endDate) " +
                        "AND (COALESCE(:statuses, NULL::text[]) IS NULL OR a.status = ANY(:statuses)) " +
                        "AND (COALESCE(:patientId, NULL::integer) IS NULL OR a.patient_id = :patientId) " +
                        "AND (COALESCE(:employeeId, NULL::integer) IS NULL OR a.employee_id = :employeeId) " +
                        "AND (COALESCE(:roomId, NULL::varchar) IS NULL OR a.room_id = :roomId) " +
                        "AND (COALESCE(:patientName, NULL::varchar) IS NULL OR " +
                        "     LOWER((COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::text) LIKE LOWER('%' || :patientName || '%')) "
                        +
                        "AND (COALESCE(:patientPhone, NULL::varchar) IS NULL OR p.phone LIKE '%' || :patientPhone || '%') "
                        +
                        "ORDER BY a.appointment_start_time", countQuery = "SELECT COUNT(DISTINCT a.appointment_id) FROM appointments a "
                                        +
                                        "LEFT JOIN patients p ON a.patient_id = p.patient_id " +
                                        "LEFT JOIN employees e ON a.employee_id = e.employee_id " +
                                        "WHERE (COALESCE(:startDate, NULL::timestamp) IS NULL OR a.appointment_start_time >= :startDate) "
                                        +
                                        "AND (COALESCE(:endDate, NULL::timestamp) IS NULL OR a.appointment_start_time <= :endDate) "
                                        +
                                        "AND (COALESCE(:statuses, NULL::text[]) IS NULL OR a.status = ANY(:statuses)) "
                                        +
                                        "AND (COALESCE(:patientId, NULL::integer) IS NULL OR a.patient_id = :patientId) "
                                        +
                                        "AND (COALESCE(:employeeId, NULL::integer) IS NULL OR a.employee_id = :employeeId) "
                                        +
                                        "AND (COALESCE(:roomId, NULL::varchar) IS NULL OR a.room_id = :roomId) " +
                                        "AND (COALESCE(:patientName, NULL::varchar) IS NULL OR " +
                                        "     LOWER((COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::text) LIKE LOWER('%' || :patientName || '%')) "
                                        +
                                        "AND (COALESCE(:patientPhone, NULL::varchar) IS NULL OR p.phone LIKE '%' || :patientPhone || '%')", nativeQuery = true)
        Page<Appointment> findByFilters(
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("statuses") String[] statuses,
                        @Param("patientId") Integer patientId,
                        @Param("employeeId") Integer employeeId,
                        @Param("roomId") String roomId,
                        @Param("patientName") String patientName,
                        @Param("patientPhone") String patientPhone,
                        Pageable pageable);

        /**
         * Find appointments for a specific patient (RBAC: VIEW_APPOINTMENT_OWN)
         * Patient can only see their own appointments
         *
         * IMPROVEMENT: Also supports date/status filters
         *
         * CRITICAL FIX: Use COALESCE to avoid PostgreSQL "could not determine data
         * type" error
         * When startDate/endDate are NULL, PostgreSQL can't infer the type in JPQL
         * queries
         */
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.patientId = :patientId " +
                        "AND (COALESCE(:startDate, NULL) IS NULL OR a.appointmentStartTime >= :startDate) " +
                        "AND (COALESCE(:endDate, NULL) IS NULL OR a.appointmentStartTime <= :endDate) " +
                        "AND (COALESCE(:statuses, NULL) IS NULL OR a.status IN :statuses)")
        Page<Appointment> findByPatientIdWithFilters(
                        @Param("patientId") Integer patientId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("statuses") List<AppointmentStatus> statuses,
                        Pageable pageable);

        /**
         * Find appointments where employee is primary doctor OR participant
         * (RBAC: VIEW_APPOINTMENT_OWN for employees)
         *
         * Logic: WHERE (a.employee_id = :employeeId OR EXISTS participant)
         *
         * CRITICAL: OBSERVER role handling
         * - If participantRole = 'OBSERVER': Can see appointment in list BUT:
         * - Should NOT see full medical history (handled by separate permission)
         * - Can only see basic info: time, doctor, patient name (no sensitive data)
         * - This is controlled by APPOINTMENT:VIEW_OWN permission
         *
         * FIXED: Use EXISTS subquery since AppointmentParticipant has composite key
         * CRITICAL FIX: Use COALESCE to avoid PostgreSQL "could not determine data
         * type" error
         * When startDate/endDate are NULL, PostgreSQL can't infer the type in JPQL
         * queries
         */
        @Query("SELECT DISTINCT a FROM Appointment a " +
                        "WHERE (a.employeeId = :employeeId " +
                        "   OR EXISTS (SELECT 1 FROM AppointmentParticipant ap " +
                        "              WHERE ap.id.appointmentId = a.appointmentId " +
                        "              AND ap.id.employeeId = :employeeId)) " +
                        "AND (COALESCE(:startDate, NULL) IS NULL OR a.appointmentStartTime >= :startDate) " +
                        "AND (COALESCE(:endDate, NULL) IS NULL OR a.appointmentStartTime <= :endDate) " +
                        "AND (COALESCE(:statuses, NULL) IS NULL OR a.status IN :statuses) " +
                        "ORDER BY a.appointmentStartTime ASC")
        Page<Appointment> findByEmployeeIdWithFilters(
                        @Param("employeeId") Integer employeeId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("statuses") List<AppointmentStatus> statuses,
                        Pageable pageable);

        /**
         * NEW: Find appointments by service code
         * Use case: "Cho tôi xem tất cả lịch Implant tuần này"
         *
         * Requires JOIN to appointment_services + services tables
         * FIXED: Use EXISTS subquery since AppointmentService has composite key
         * FIXED: Entity name is DentalService, not Service
         */
        @Query("SELECT DISTINCT a FROM Appointment a " +
                        "WHERE EXISTS (SELECT 1 FROM AppointmentService asvc " +
                        "              JOIN DentalService s ON asvc.id.serviceId = s.serviceId " +
                        "              WHERE asvc.id.appointmentId = a.appointmentId " +
                        "              AND s.serviceCode = :serviceCode) " +
                        "AND (:startDate IS NULL OR a.appointmentStartTime >= :startDate) " +
                        "AND (:endDate IS NULL OR a.appointmentStartTime <= :endDate) " +
                        "AND (:statuses IS NULL OR a.status IN :statuses)")
        Page<Appointment> findByServiceCodeWithFilters(
                        @Param("serviceCode") String serviceCode,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("statuses") List<AppointmentStatus> statuses,
                        Pageable pageable);

        /**
         * Combined search by code OR name: patient, doctor, employee (participant),
         * room, or service
         *
         * This is a convenience method for frontend search bars.
         * Searches across:
         * - Patient: patient_code OR full_name (ILIKE for partial match)
         * - Primary doctor: employee_code OR full_name
         * - Room: room_code OR room_name
         * - Participant: employee_code OR full_name
         * - Service: service_code OR service_name
         *
         * Uses ILIKE for case-insensitive partial matching on names.
         *
         * Examples:
         * - searchCode="Nguyễn" → Finds all patients/doctors with "Nguyễn" in name
         * - searchCode="BN-1001" → Finds patient by exact code
         * - searchCode="Cạo vôi" → Finds appointments with "Cạo vôi" service
         *
         * @param searchCode The code or name to search for (supports partial match on
         *                   names)
         */
        @Query(value = "SELECT DISTINCT a.* FROM appointments a " +
                        "LEFT JOIN patients p ON a.patient_id = p.patient_id " +
                        "LEFT JOIN employees e ON a.employee_id = e.employee_id " +
                        "LEFT JOIN rooms r ON a.room_id = r.room_id " +
                        "LEFT JOIN appointment_participants ap ON a.appointment_id = ap.appointment_id " +
                        "LEFT JOIN employees part_emp ON ap.employee_id = part_emp.employee_id " +
                        "LEFT JOIN appointment_services asvc ON a.appointment_id = asvc.appointment_id " +
                        "LEFT JOIN services s ON asvc.service_id = s.service_id " +
                        "WHERE (CAST(:startDate AS timestamp) IS NULL OR a.appointment_start_time >= CAST(:startDate AS timestamp)) "
                        +
                        "AND (CAST(:endDate AS timestamp) IS NULL OR a.appointment_start_time <= CAST(:endDate AS timestamp)) "
                        +
                        "AND (COALESCE(CAST(:statuses AS text[]), NULL::text[]) IS NULL OR a.status::text = ANY(:statuses)) "
                        +
                        "AND (" +
                        "    p.patient_code ILIKE '%' || :searchCode || '%' " +
                        "    OR LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER('%' || :searchCode || '%') " +
                        "    OR e.employee_code ILIKE '%' || :searchCode || '%' " +
                        "    OR LOWER(CONCAT(e.first_name, ' ', e.last_name)) LIKE LOWER('%' || :searchCode || '%') " +
                        "    OR r.room_code ILIKE '%' || :searchCode || '%' " +
                        "    OR LOWER(r.room_name) LIKE LOWER('%' || :searchCode || '%') " +
                        "    OR part_emp.employee_code ILIKE '%' || :searchCode || '%' " +
                        "    OR LOWER(CONCAT(part_emp.first_name, ' ', part_emp.last_name)) LIKE LOWER('%' || :searchCode || '%') "
                        +
                        "    OR s.service_code ILIKE '%' || :searchCode || '%' " +
                        "    OR LOWER(s.service_name) LIKE LOWER('%' || :searchCode || '%') " +
                        ")", nativeQuery = true)
        Page<Appointment> findBySearchCode(
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("statuses") String[] statuses,
                        @Param("searchCode") String searchCode,
                        Pageable pageable);

        // ==================== V21 CLINICAL RULES VALIDATION ====================

        /**
         * Find all COMPLETED appointments for a patient (for clinical rules validation)
         * Used by ClinicalRulesValidationService to check:
         * - REQUIRES_PREREQUISITE: Has patient completed Service A before?
         * - REQUIRES_MIN_DAYS: Has X days passed since Service A completion?
         *
         * CRITICAL: We don't need appointment_services as separate list.
         * AppointmentServiceRepository.findByIdAppointmentId() will be called
         * separately.
         *
         * @param patientId Patient ID
         * @return List of completed appointments ordered by date (most recent first)
         */
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.patientId = :patientId " +
                        "AND a.status = 'COMPLETED' " +
                        "ORDER BY a.appointmentStartTime DESC")
        List<Appointment> findCompletedAppointmentsByPatientId(@Param("patientId") Integer patientId);

        /**
         * Count appointments where employee is primary doctor AND appointment is linked to treatment plan.
         * Used for RBAC: Allow primary doctor to view treatment plan linked to their appointment.
         * 
         * Query logic:
         * 1. Find appointments where employeeId = given employeeId (primary doctor)
         * 2. Check if appointment has items linked to treatment plan via appointment_plan_items
         * 3. Join: appointments → appointment_plan_items → patient_plan_items → phases → treatment_plan
         * 4. Filter by planId
         * 
         * @param employeeId Employee ID (primary doctor)
         * @param planId Treatment plan ID
         * @return Count of appointments matching criteria
         */
        @Query("""
                SELECT COUNT(DISTINCT a.appointmentId)
                FROM Appointment a
                JOIN AppointmentPlanItemBridge apib ON a.appointmentId = apib.id.appointmentId
                JOIN PatientPlanItem item ON item.itemId = apib.id.itemId
                JOIN PatientPlanPhase phase ON phase.patientPhaseId = item.phase.patientPhaseId
                WHERE a.employeeId = :employeeId
                AND phase.treatmentPlan.planId = :planId
                """)
        long countByEmployeeIdAndLinkedToPlan(
                @Param("employeeId") Integer employeeId,
                @Param("planId") Long planId);

        /**
         * Rule #6: Find appointments that are late (>15 minutes past start time)
         * Used by scheduled job to auto-mark as NO_SHOW
         * 
         * @param status Status to filter (typically SCHEDULED)
         * @param cutoffTime Start time threshold (now - 15 minutes)
         * @return List of late appointments
         */
        List<Appointment> findByStatusAndAppointmentStartTimeBefore(
                AppointmentStatus status,
                LocalDateTime cutoffTime);

        /**
         * BE_4: Count appointments for a specific service on a specific date
         * Used to validate max_appointments_per_day constraint
         * Note: Requires join with appointment_services junction table
         * 
         * @param serviceId The service ID
         * @param date The date to check
         * @return Count of appointments
         */
        @Query("SELECT COUNT(DISTINCT a) FROM Appointment a " +
                "JOIN AppointmentService aps ON aps.id.appointmentId = a.appointmentId " +
                "WHERE aps.id.serviceId = :serviceId " +
                "AND FUNCTION('DATE', a.appointmentStartTime) = :date " +
                "AND a.status NOT IN ('CANCELLED', 'NO_SHOW')")
        long countByServiceAndDate(
                @Param("serviceId") Long serviceId,
                @Param("date") java.time.LocalDate date);

        /**
         * BE_4: Find recent completed appointments for a patient (for constraint validation)
         * Ordered by appointment date DESC
         * 
         * @param patientId The patient ID
         * @param limit Maximum number of results
         * @return List of recent completed appointments
         */
        @Query(value = "SELECT a.* FROM appointments a " +
                "WHERE a.patient_id = :patientId " +
                "AND a.status = 'COMPLETED' " +
                "ORDER BY a.appointment_start_time DESC " +
                "LIMIT :limit", nativeQuery = true)
        List<Appointment> findRecentCompletedByPatient(
                @Param("patientId") Long patientId,
                @Param("limit") int limit);

        /**
         * BE_4: Find recent completed appointments for a patient with specific service
         * Used for spacing validation between same service appointments
         * 
         * @param patientId The patient ID
         * @param serviceId The service ID
         * @param limit Maximum number of results
         * @return List of recent completed appointments with this service
         */
        @Query(value = "SELECT a.* FROM appointments a " +
                "JOIN appointment_services aps ON aps.appointment_id = a.appointment_id " +
                "WHERE a.patient_id = :patientId " +
                "AND aps.service_id = :serviceId " +
                "AND a.status = 'COMPLETED' " +
                "ORDER BY a.appointment_start_time DESC " +
                "LIMIT :limit", nativeQuery = true)
        List<Appointment> findRecentCompletedByPatientAndService(
                @Param("patientId") Integer patientId,
                @Param("serviceId") Long serviceId,
                @Param("limit") int limit);
}
