package com.dental.clinic.management.booking_appointment.enums;

/**
 * Appointment Action Type for Audit Logging
 * Matches SQL type: appointment_action_type
 *
 * Tracks all important actions performed on appointments
 */
public enum AppointmentActionType {
    /**
     * Appointment được tạo mới
     */
    CREATE,

    /**
     * Appointment bị delay (dời giờ trong cùng ngày)
     */
    DELAY,

    /**
     * Appointment nguồn bị reschedule (đổi sang ngày khác)
     */
    RESCHEDULE_SOURCE,

    /**
     * Appointment mới được tạo từ reschedule
     */
    RESCHEDULE_TARGET,

    /**
     * Appointment bị hủy
     */
    CANCEL,

    /**
     * Thay đổi status (CHECKED_IN, IN_PROGRESS, COMPLETED, NO_SHOW)
     */
    STATUS_CHANGE
}
