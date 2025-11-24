package com.dental.clinic.management.treatment_plans.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.treatment_plans.enums.PaymentType;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Patient Treatment Plan (Hợp đồng điều trị dài hạn).
 * Represents a long-term treatment contract for a patient.
 * Examples: Orthodontics (niềng răng), Implant treatment plan
 */
@Entity
@Table(name = "patient_treatment_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientTreatmentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    /**
     * Unique plan code (e.g., PLAN-2025-001)
     */
    @Column(name = "plan_code", nullable = false, unique = true, length = 50)
    private String planCode;

    /**
     * Name of the treatment plan
     */
    @Column(name = "plan_name", nullable = false)
    private String planName;

    /**
     * Patient who owns this plan
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    /**
     * Doctor who created and manages this plan
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    /**
     * Optional: Template used to create this plan (for traceability).
     * V19: Changed from Long templateId to ManyToOne relationship for richer data
     * access.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private com.dental.clinic.management.treatment_plans.domain.template.TreatmentPlanTemplate sourceTemplate;

    /**
     * Current status of the plan
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private TreatmentPlanStatus status;

    /**
     * Start date of the plan
     */
    @Column(name = "start_date")
    private LocalDate startDate;

    /**
     * Expected end date
     */
    @Column(name = "expected_end_date")
    private LocalDate expectedEndDate;

    /**
     * Total cost before discount
     */
    @Column(name = "total_price", precision = 12, scale = 2)
    private BigDecimal totalPrice;

    /**
     * Discount amount
     */
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    /**
     * Final cost after discount
     */
    @Column(name = "final_cost", precision = 12, scale = 2)
    private BigDecimal finalCost;

    /**
     * Payment type: FULL, PHASED, INSTALLMENT
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", length = 20)
    private PaymentType paymentType;

    /**
     * Approval status (V19): DRAFT, PENDING_REVIEW, APPROVED, REJECTED.
     * Used for price override control workflow.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20, nullable = false)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.DRAFT;

    /**
     * Date when patient signed consent (V19).
     */
    @Column(name = "patient_consent_date")
    private LocalDateTime patientConsentDate;

    /**
     * Employee who approved this plan (V19).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;

    /**
     * Timestamp when plan was approved (V19).
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * Rejection reason if status = REJECTED (V19).
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Phases of this treatment plan
     */
    @OneToMany(mappedBy = "treatmentPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PatientPlanPhase> phases = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = TreatmentPlanStatus.PENDING;
        }
    }
}
