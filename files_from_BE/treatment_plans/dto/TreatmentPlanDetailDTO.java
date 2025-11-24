package com.dental.clinic.management.treatment_plans.dto;

import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.enums.PaymentType;
import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Flat DTO for JPQL Constructor Expression.
 * Used in PatientTreatmentPlanRepository query to fetch all related data in ONE
 * query.
 *
 * This DTO will be transformed into nested TreatmentPlanDetailResponse by
 * Service layer.
 *
 * Fields from 5 tables:
 * - patient_treatment_plans
 * - employees (createdBy)
 * - patients
 * - patient_plan_phases
 * - patient_plan_items
 * - appointments (via appointment_plan_items bridge)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentPlanDetailDTO {

    // ===== PLAN LEVEL (patient_treatment_plans) =====
    private Long planId;
    private String planCode;
    private String planName;
    private TreatmentPlanStatus planStatus;
    private ApprovalStatus approvalStatus; // ✅ V21: Added to support approval workflow
    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private BigDecimal totalPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalCost;
    private PaymentType paymentType;
    private LocalDateTime planCreatedAt;

    // ===== DOCTOR (createdBy - employees) =====
    private String doctorEmployeeCode;
    private String doctorFullName;

    // ===== PATIENT (patients) =====
    private String patientCode;
    private String patientFullName;

    // ===== PHASE LEVEL (patient_plan_phases) =====
    private Long phaseId;
    private Integer phaseNumber;
    private String phaseName;
    private PhaseStatus phaseStatus;
    private LocalDate phaseStartDate;
    private LocalDate phaseCompletionDate;
    private Integer estimatedDurationDays;

    // ===== ITEM LEVEL (patient_plan_items) =====
    private Long itemId;
    private Integer itemServiceId;
    private String itemServiceCode; // Phase 5: for FE appointment booking
    private Integer sequenceNumber;
    private String itemName;
    private PlanItemStatus itemStatus;
    private Integer estimatedTimeMinutes;
    private BigDecimal itemPrice;
    private LocalDateTime itemCompletedAt;

    // ===== APPOINTMENT (via appointment_plan_items) =====
    private String appointmentCode; // NULL if not linked yet
    private LocalDateTime appointmentScheduledDate;
    private AppointmentStatus appointmentStatus; // NULL if not linked (ENUM)
    private String appointmentNotes; // Notes from dentist/assistant when completing appointment
}
