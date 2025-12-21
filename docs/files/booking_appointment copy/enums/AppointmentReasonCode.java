package com.dental.clinic.management.booking_appointment.enums;

/**
 * Appointment Reason Code for Delays, Cancellations, Reschedules
 * Matches SQL type: appointment_reason_code
 *
 * Used for business analytics and operational insights
 */
public enum AppointmentReasonCode {
    /**
     * Ca trước bị kéo dài (overrun)
     */
    PREVIOUS_CASE_OVERRUN,

    /**
     * Bác sĩ đột ngột không có mặt
     */
    DOCTOR_UNAVAILABLE,

    /**
     * Thiết bị hỏng hoặc đang bảo trì
     */
    EQUIPMENT_FAILURE,

    /**
     * Bệnh nhân yêu cầu thay đổi
     */
    PATIENT_REQUEST,

    /**
     * Điều phối vận hành (phòng khám chủ động)
     */
    OPERATIONAL_REDIRECT,

    /**
     * Lý do khác
     */
    OTHER
}
