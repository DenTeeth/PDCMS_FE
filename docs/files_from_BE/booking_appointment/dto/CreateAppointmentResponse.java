package com.dental.clinic.management.booking_appointment.dto;

import com.dental.clinic.management.booking_appointment.enums.AppointmentParticipantRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for successful appointment creation (P3.2)
 * Returns summary of created appointment with nested resource details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentResponse {

    /**
     * Generated appointment code
     * Example: "APT-20251030-001"
     */
    private String appointmentCode;

    /**
     * Appointment status (always SCHEDULED for new appointments)
     */
    private String status;

    /**
     * Requested start time
     */
    private LocalDateTime appointmentStartTime;

    /**
     * Calculated end time (start + total service duration)
     */
    private LocalDateTime appointmentEndTime;

    /**
     * Total duration in minutes (sum of service durations + buffers)
     */
    private Integer expectedDurationMinutes;

    /**
     * Patient summary
     */
    private PatientSummary patient;

    /**
     * Primary doctor summary
     */
    private DoctorSummary doctor;

    /**
     * Room summary
     */
    private RoomSummary room;

    /**
     * List of services to be performed
     */
    private List<ServiceSummary> services;

    /**
     * List of participants (assistants, secondary doctors)
     */
    private List<ParticipantSummary> participants;

    /**
     * Nested DTO: Patient Summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientSummary {
        private String patientCode;
        private String fullName;
        private String phone; // For detail view
        private java.time.LocalDate dateOfBirth; // For detail view
    }

    /**
     * Nested DTO: Doctor Summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorSummary {
        private String employeeCode;
        private String fullName;
    }

    /**
     * Nested DTO: Room Summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomSummary {
        private String roomCode;
        private String roomName;
    }

    /**
     * Nested DTO: Service Summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceSummary {
        private String serviceCode;
        private String serviceName;
    }

    /**
     * Nested DTO: Participant Summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantSummary {
        private String employeeCode;
        private String fullName;
        private AppointmentParticipantRole role; // Default: ASSISTANT
    }
}
