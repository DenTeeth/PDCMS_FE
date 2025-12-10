package com.dental.clinic.management.booking_appointment.enums;

/**
 * Enum for Appointment Participant Roles
 * Matches PostgreSQL custom type: appointment_participant_role_enum
 *
 * Purpose: Define the role of an employee participating in an appointment
 * besides the primary doctor
 */
public enum AppointmentParticipantRole {

    /**
     * Phụ tá - Assistant helping during the procedure
     * Default role when creating appointment with participantCodes
     */
    ASSISTANT,

    /**
     * Bác sĩ phụ - Secondary doctor assisting the primary doctor
     * Example: Complex surgeries requiring multiple doctors
     */
    SECONDARY_DOCTOR,

    /**
     * Quan sát viên - Observer (e.g., trainee, student)
     * Does not actively participate in the procedure
     */
    OBSERVER
}
