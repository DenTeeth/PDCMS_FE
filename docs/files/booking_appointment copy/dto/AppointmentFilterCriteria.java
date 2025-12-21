package com.dental.clinic.management.booking_appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Filter criteria for appointment search
 * Used in GET /api/v1/appointments
 *
 * RBAC Logic:
 * - Users with VIEW_APPOINTMENT_ALL: Can use all filters freely
 * - Users with VIEW_APPOINTMENT_OWN: patientCode/employeeCode filters are
 * OVERRIDDEN
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentFilterCriteria {

    // ==================== DATE FILTERS ====================

    /**
     * Quick date preset filter (auto-calculates dateFrom/dateTo)
     * Values: TODAY, THIS_WEEK, NEXT_7_DAYS, THIS_MONTH
     * If set, overrides dateFrom and dateTo
     *
     * Example: datePreset=TODAY
     * Example: datePreset=THIS_WEEK (Monday -> Sunday)
     */
    private DatePreset datePreset;

    /**
     * Filter appointments from this date (inclusive)
     * Format: YYYY-MM-DD
     * NOTE: Ignored if datePreset is set
     */
    private LocalDate dateFrom;

    /**
     * Filter appointments to this date (inclusive)
     * Format: YYYY-MM-DD
     * NOTE: Ignored if datePreset is set
     */
    private LocalDate dateTo;

    /**
     * Quick filter: Today's appointments
     * If true, overrides dateFrom and dateTo
     * DEPRECATED: Use datePreset=TODAY instead
     */
    @Deprecated
    private Boolean today;

    // ==================== STATUS FILTER ====================

    /**
     * Filter by appointment status (can be multiple)
     * Values: SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
     * Example: status=SCHEDULED&status=CHECKED_IN
     */
    private List<String> status;

    // ==================== ENTITY FILTERS ====================

    /**
     * Filter by patient code
     * Example: BN-1001
     *
     * RBAC: If user is patient, this is OVERRIDDEN to user's own patient code
     */
    private String patientCode;

    /**
     * Search by patient name (LIKE search, case-insensitive)
     * Example: "nguyen van"
     *
     * NOTE: Only works for users with VIEW_APPOINTMENT_ALL
     */
    private String patientName;

    /**
     * Search by patient phone (LIKE search)
     * Example: "0912"
     *
     * NOTE: Only works for users with VIEW_APPOINTMENT_ALL
     */
    private String patientPhone;

    /**
     * Filter by primary doctor employee code
     * Example: EMP001
     *
     * RBAC: If user is employee, this is OVERRIDDEN to filter:
     * - Appointments where user is primary doctor OR
     * - Appointments where user is participant
     */
    private String employeeCode;

    /**
     * Filter by room code
     * Example: P-01
     */
    private String roomCode;

    /**
     * Filter by service code (appointments containing this service)
     * Example: SV-001
     *
     * Implementation: Requires JOIN with appointment_services
     */
    private String serviceCode;

    /**
     * Combined search by code OR name: patient, doctor, employee (participant),
     * room, or service
     *
     * Searches across:
     * - Patient: patient_code OR full_name (first_name + last_name)
     * - Doctor (primary): employee_code OR full_name
     * - Participant (assistant/observer): employee_code OR full_name
     * - Room: room_code OR room_name
     * - Service: service_code OR service_name
     *
     * Examples:
     * - "Nguyễn Văn A" → Finds patient by name
     * - "BN-1001" → Finds patient by code
     * - "Dr. An Khoa" → Finds appointments with this doctor
     * - "Cạo vôi" → Finds appointments with this service
     * - "P-01" → Finds appointments in this room
     *
     * This is a convenience parameter for frontend search bars.
     * Uses ILIKE for case-insensitive partial matching.
     * If provided, individual code filters (patientCode, employeeCode, etc.) are
     * ignored.
     *
     * NOTE: Only works for users with VIEW_APPOINTMENT_ALL
     */
    private String searchCode;

    // ==================== INTERNAL FLAGS (Set by Service Layer)
    // ====================

    /**
     * Internal flag: User has VIEW_APPOINTMENT_ALL permission
     * Set by service layer during RBAC check
     */
    @Builder.Default
    private Boolean canViewAll = false;

    /**
     * Internal: Current user's employee ID (if user is employee)
     * Used to override employeeCode filter for VIEW_APPOINTMENT_OWN
     */
    private Integer currentUserEmployeeId;

    /**
     * Internal: Current user's patient ID (if user is patient)
     * Used to override patientCode filter for VIEW_APPOINTMENT_OWN
     */
    private Integer currentUserPatientId;
}
