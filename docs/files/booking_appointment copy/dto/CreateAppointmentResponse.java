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
     * Enhanced to include medical history, allergies, emergency contact, and
     * guardian info
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientSummary {
        private Integer patientId;
        private String patientCode;
        private String fullName;
        private String phone;
        private String email;
        private java.time.LocalDate dateOfBirth;
        private Integer age;
        private String gender;
        private String address;

        // Medical information
        private String medicalHistory;
        private String allergies;

        // Emergency contact
        private String emergencyContactName;
        private String emergencyContactPhone;

        // Guardian information (for minors <16 years old)
        private String guardianName;
        private String guardianPhone;
        private String guardianRelationship;
        private String guardianCitizenId;

        // Booking status
        private Boolean isActive;
        private Integer consecutiveNoShows;
        private Boolean isBookingBlocked;
        private String bookingBlockReason;
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
