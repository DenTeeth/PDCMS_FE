package com.dental.clinic.management.treatment_plans.dto.request;

import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Request DTO for API 5.5 - Get All Treatment Plans with Advanced Filtering.
 * <p>
 * Supports pagination, RBAC-based filtering, date ranges, and search term.
 * <p>
 * RBAC Logic:
 * - Admin (VIEW_TREATMENT_PLAN_ALL): Can use doctorEmployeeCode, patientCode
 * - Doctor (VIEW_TREATMENT_PLAN_OWN): Automatically filtered by createdBy =
 * currentEmployee
 * - Patient (VIEW_TREATMENT_PLAN_OWN): Automatically filtered by patient =
 * currentPatient
 * <p>
 * P1 Enhancements:
 * - Date range filters (startDate, createdAt)
 * - Search term (plan code, plan name, patient name)
 * <p>
 * Version: V19
 * Date: 2025-01-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Query parameters for filtering treatment plans")
public class GetAllTreatmentPlansRequest {

    // ============================================
    // PAGINATION (Standard Spring Data)
    // ============================================
    // Note: page, size, sort are handled by Pageable parameter in controller
    // No need to define here

    // ============================================
    // BASIC FILTERS (Common for All Users)
    // ============================================

    /**
     * Filter by treatment plan status.
     * Example: PENDING, ACTIVE, COMPLETED, CANCELLED, ON_HOLD
     */
    @Schema(description = "Filter by treatment plan status", example = "ACTIVE")
    private TreatmentPlanStatus status;

    /**
     * Filter by approval status (V19).
     * Example: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
     */
    @Schema(description = "Filter by approval status (V19)", example = "APPROVED")
    private ApprovalStatus approvalStatus;

    /**
     * Filter by plan code (exact match or prefix).
     * Example: "PLAN-20250112"
     */
    @Schema(description = "Filter by plan code (exact match or starts with)", example = "PLAN-20250112")
    private String planCode;

    // ============================================
    // ADMIN-ONLY FILTERS (Requires VIEW_TREATMENT_PLAN_ALL)
    // ============================================

    /**
     * Filter by doctor employee code (Admin only).
     * If user has VIEW_TREATMENT_PLAN_OWN, this param is IGNORED.
     */
    @Schema(description = "Filter by doctor employee code (Admin only)", example = "EMP001")
    private String doctorEmployeeCode;

    /**
     * Filter by patient code (Admin only).
     * If user has VIEW_TREATMENT_PLAN_OWN, this param is IGNORED.
     */
    @Schema(description = "Filter by patient code (Admin only)", example = "BN-1001")
    private String patientCode;

    /**
     * Filter by template ID (Admin only).
     * Shows all treatment plans created from a specific template.
     * Example: templateId=5 shows all plans created from template 5
     */
    @Schema(description = "Filter by template ID", example = "5")
    private Long templateId;

    /**
     * Filter by specialization ID (Admin only).
     * Shows all treatment plans whose template belongs to a specific specialization.
     * Example: specializationId=1 shows all orthodontics plans
     * Note: Filters via sourceTemplate.specialization relationship
     */
    @Schema(description = "Filter by specialization ID", example = "1")
    private Long specializationId;

    // ============================================
    // DATE RANGE FILTERS (P1 Enhancement)
    // ============================================

    /**
     * Filter by start date FROM (inclusive).
     * Example: Show plans starting from 2025-01-01 onwards
     */
    @Schema(description = "Filter plans with start_date >= this date", example = "2025-01-01")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateFrom;

    /**
     * Filter by start date TO (inclusive).
     * Example: Show plans starting up to 2025-12-31
     */
    @Schema(description = "Filter plans with start_date <= this date", example = "2025-12-31")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateTo;

    /**
     * Filter by created date FROM (inclusive).
     * Example: Show plans created from 2025-01-01 onwards
     */
    @Schema(description = "Filter plans with created_at >= this date", example = "2025-01-01")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate createdAtFrom;

    /**
     * Filter by created date TO (inclusive).
     * Example: Show plans created up to 2025-12-31
     */
    @Schema(description = "Filter plans with created_at <= this date", example = "2025-12-31")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate createdAtTo;

    // ============================================
    // SEARCH TERM (P1 Enhancement)
    // ============================================

    /**
     * Search term for plan code, plan name, or patient name (case-insensitive).
     * Uses LIKE '%searchTerm%' across multiple fields.
     * <p>
     * Example: "orthodontics" matches:
     * - Plan name: "Custom Orthodontics Treatment"
     * - Patient name: "Nguyễn Văn Orthodontics" (edge case)
     * - Plan code: Not matched (exact prefix only)
     */
    @Schema(description = "Search in plan name and patient name (case-insensitive)", example = "orthodontics")
    private String searchTerm;
}
