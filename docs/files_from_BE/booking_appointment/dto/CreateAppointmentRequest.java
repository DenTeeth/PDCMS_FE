package com.dental.clinic.management.booking_appointment.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating a new appointment (P3.2 - V2 with Treatment Plan Integration)
 *
 * V2 Changes:
 * - Added patientPlanItemIds field for Treatment Plan booking mode
 * - XOR validation: must provide EITHER serviceCodes OR patientPlanItemIds (not both, not neither)
 *
 * Two Booking Modes:
 * 1. Standalone Booking (Luồng 1 - Đặt lẻ): Provide serviceCodes
 * 2. Treatment Plan Booking (Luồng 2 - Đặt theo lộ trình): Provide patientPlanItemIds
 *
 * Business Rules:
 * - All codes must exist and be active
 * - Doctor must have required specializations for services
 * - Room must support all services (room_services)
 * - appointmentStartTime must be in future and during doctor's shift
 * - No conflicts for doctor, room, patient, or participants
 * - (NEW) If using patientPlanItemIds: items must be READY_FOR_BOOKING and belong to patient
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    /**
     * Patient code (must exist and be active)
     * Example: "BN-1001"
     */
    @NotBlank(message = "Patient code is required")
    private String patientCode;

    /**
     * Employee code of primary doctor (must exist and be active)
     * Example: "DR_AN_KHOA", "BS-001"
     */
    @NotBlank(message = "Employee code is required")
    private String employeeCode;

    /**
     * Room code selected from P3.1 available times API
     * Must exist, be active, and support all services
     * Example: "P-IMPLANT-01"
     */
    @NotBlank(message = "Room code is required")
    private String roomCode;

    /**
     * List of service codes to be performed (Luồng 1: Standalone Booking)
     * All must exist and be active
     * Example: ["SV-IMPLANT", "SV-NANGXOANG"]
     * NOTE: Must provide EITHER this OR patientPlanItemIds (XOR validation)
     */
    private List<String> serviceCodes;

    /**
     * List of patient plan item IDs (Luồng 2: Treatment Plan Booking) - NEW V2
     * Items must be in READY_FOR_BOOKING status and belong to the patient in request
     * Example: [101, 102, 103]
     * NOTE: Must provide EITHER this OR serviceCodes (XOR validation)
     */
    private List<Long> patientPlanItemIds;

    /**
     * XOR Validation: Must provide EITHER serviceCodes OR patientPlanItemIds, not both and not neither
     * This ensures clear separation between standalone booking and treatment plan booking
     */
    @AssertTrue(message = "Please provide either serviceCodes for standalone booking or patientPlanItemIds for treatment plan booking, but not both and not neither")
    private boolean isValidBookingType() {
        boolean hasServiceCodes = serviceCodes != null && !serviceCodes.isEmpty();
        boolean hasPlanItems = patientPlanItemIds != null && !patientPlanItemIds.isEmpty();
        return hasServiceCodes ^ hasPlanItems; // XOR: exactly one must be true
    }

    /**
     * Start time of appointment in ISO 8601 format
     * Must be in future and within doctor's shift
     * Server will calculate end time based on service durations
     * Example: "2025-10-30T09:30:00"
     */
    @NotBlank(message = "Appointment start time is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$", message = "Start time must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)")
    private String appointmentStartTime;

    /**
     * Optional list of participant codes (assistants, secondary doctors)
     * All will be assigned default role: ASSISTANT
     * Example: ["PT-BINH", "PT-AN"]
     */
    private List<String> participantCodes;

    /**
     * Optional notes from receptionist
     * Example: "Bệnh nhân có tiền sử cao huyết áp"
     */
    private String notes;
}
