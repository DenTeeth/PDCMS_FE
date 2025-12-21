package com.dental.clinic.management.service.domain;

/**
 * Enum for Service Dependency Rule Types (V21 - Clinical Rules Engine)
 *
 * Defines the types of clinical rules that govern relationships between
 * services.
 * These rules ensure patient safety and clinical best practices.
 *
 * @since V21
 */
public enum DependencyRuleType {

    /**
     * REQUIRES_PREREQUISITE: Service B requires Service A to be completed first
     * (any time before)
     *
     * Example: "Trám răng" (Filling) requires "Khám tổng quát" (General Exam) to be
     * completed first.
     *
     * Validation Logic:
     * - When booking Service B, check patient history for COMPLETED Service A
     * - If Service A not found → throw 409 CONFLICT
     *
     * Receptionist Note Example:
     * "Bệnh nhân phải KHÁM tổng quát trước khi được trám răng."
     */
    REQUIRES_PREREQUISITE,

    /**
     * REQUIRES_MIN_DAYS: Service B requires Service A to be completed at least X
     * days before
     *
     * Example: "Cắt chỉ" (Suture Removal) requires "Nhổ răng khôn" (Wisdom Tooth
     * Extraction)
     * to be completed at least 7 days before.
     *
     * Validation Logic:
     * - Find latest COMPLETED appointment of Service A
     * - Calculate: (Booking Date of Service B) - (Completion Date of Service A)
     * - If days < min_days_apart → throw 409 CONFLICT
     *
     * Receptionist Note Example:
     * "Cắt chỉ SAU nhổ răng khôn ít nhất 7 ngày (lý tưởng 7-10 ngày)."
     */
    REQUIRES_MIN_DAYS,

    /**
     * EXCLUDES_SAME_DAY: Service A and Service B cannot be booked on the same day
     *
     * Example: "Nhổ răng khôn" (Wisdom Tooth Extraction) and "Tẩy trắng răng"
     * (Teeth Whitening)
     * cannot be performed on the same day (dangerous combination).
     *
     * Validation Logic:
     * - When creating appointment with multiple services
     * - Check if any service pair has EXCLUDES_SAME_DAY rule
     * - If found → throw 409 CONFLICT
     *
     * Receptionist Note Example:
     * "KHÔNG được đặt Nhổ răng khôn và Tẩy trắng cùng ngày (nguy hiểm)."
     *
     * NOTE: This rule is bidirectional. If A excludes B, then B also excludes A.
     * Seed data should insert both directions for query efficiency.
     */
    EXCLUDES_SAME_DAY,

    /**
     * BUNDLES_WITH: Service A and Service B are recommended to be booked together
     * (soft rule)
     *
     * Example: "Khám tổng quát" (General Exam) and "Cạo vôi răng" (Scaling)
     * are commonly done together to save patient time.
     *
     * Validation Logic:
     * - This is a SOFT rule (suggestion, not enforcement)
     * - Used in API responses to suggest bundled services
     * - No validation error thrown
     *
     * Receptionist Note Example:
     * "Gợi ý: Nên đặt Khám + Cạo vôi cùng lúc để tiết kiệm thời gian."
     *
     * Use Case:
     * - API 6.5 (GET /services/grouped) includes "bundlesWith" array
     * - Frontend can highlight recommended combinations
     */
    BUNDLES_WITH
}
