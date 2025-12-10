package com.dental.clinic.management.booking_appointment.enums;

/**
 * Appointment Status Enum
 * Matches SQL type: appointment_status_enum
 *
 * Workflow: SCHEDULED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED
 * Cancel paths: Any status -> CANCELLED
 * No-show: SCHEDULED -> NO_SHOW (if patient doesn't arrive)
 */
public enum AppointmentStatus {
    /**
     * Initial status - Appointment đã được đặt lịch
     */
    SCHEDULED,

    /**
     * Bệnh nhân đã check-in tại lễ tân
     */
    CHECKED_IN,

    /**
     * Bác sĩ đã bắt đầu điều trị
     */
    IN_PROGRESS,

    /**
     * Hoàn thành điều trị
     */
    COMPLETED,

    /**
     * Appointment bị hủy (bởi bệnh nhân hoặc phòng khám)
     */
    CANCELLED,

    /**
     * Bệnh nhân không đến (no-show)
     */
    NO_SHOW
}
