package com.dental.clinic.management.service.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ServiceDependency Entity (V21 - Clinical Rules Engine)
 *
 * Represents clinical rules governing relationships between dental services.
 * These rules ensure patient safety and enforce proper treatment sequences.
 *
 * <p>
 * <b>Business Context:</b>
 * </p>
 * <ul>
 * <li><b>Prerequisite</b>: "Trám răng" requires "Khám tổng quát" to be done
 * first</li>
 * <li><b>Min Days</b>: "Cắt chỉ" requires "Nhổ răng" to be done at least 7 days
 * before</li>
 * <li><b>Exclusion</b>: "Nhổ răng" and "Tẩy trắng" cannot be done on the same
 * day</li>
 * <li><b>Bundle</b>: "Khám" and "Cạo vôi" are recommended together (soft
 * rule)</li>
 * </ul>
 *
 * <p>
 * <b>Table Structure:</b>
 * </p>
 * 
 * <pre>
 * dependency_id | service_id | dependent_service_id | rule_type           | min_days_apart | receptionist_note
 * --------------|------------|----------------------|---------------------|----------------|------------------
 * 1             | 1 (Khám)   | 5 (Trám)             | REQUIRES_PREREQ     | NULL           | "Phải khám trước"
 * 2             | 10 (Nhổ)   | 25 (Cắt chỉ)         | REQUIRES_MIN_DAYS   | 7              | "Cắt chỉ sau 7 ngày"
 * 3             | 10 (Nhổ)   | 15 (Tẩy trắng)       | EXCLUDES_SAME_DAY   | NULL           | "Không đặt cùng ngày"
 * 4             | 1 (Khám)   | 3 (Cạo vôi)          | BUNDLES_WITH        | NULL           | "Gợi ý đặt chung"
 * </pre>
 *
 * @since V21
 * @see DependencyRuleType
 * @see DentalService
 */
@Entity
@Table(name = "service_dependencies", indexes = {
        @Index(name = "idx_service_deps_service", columnList = "service_id, rule_type"),
        @Index(name = "idx_service_deps_dependent", columnList = "dependent_service_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dependency_id")
    private Long dependencyId;

    /**
     * The primary service (Service A)
     *
     * Example: "Nhổ răng khôn" (Wisdom Tooth Extraction)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    /**
     * The dependent/related service (Service B)
     *
     * Example: "Cắt chỉ" (Suture Removal)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dependent_service_id", nullable = false)
    private DentalService dependentService;

    /**
     * Type of clinical rule
     *
     * @see DependencyRuleType
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 30)
    private DependencyRuleType ruleType;

    /**
     * Minimum days required between Service A completion and Service B booking
     *
     * Required ONLY for REQUIRES_MIN_DAYS rule type.
     * NULL for other rule types.
     *
     * Example: 7 (means Service B can only be booked 7+ days after Service A
     * completion)
     *
     * Database Constraint:
     * CHECK ((rule_type = 'REQUIRES_MIN_DAYS' AND min_days_apart IS NOT NULL AND
     * min_days_apart > 0)
     * OR (rule_type != 'REQUIRES_MIN_DAYS'))
     */
    @Column(name = "min_days_apart")
    private Integer minDaysApart;

    /**
     * Human-readable note for receptionists
     *
     * Displayed when validation fails or in booking assistant UI.
     *
     * Examples:
     * - "Bệnh nhân phải KHÁM tổng quát trước khi được trám răng."
     * - "Cắt chỉ SAU nhổ răng khôn ít nhất 7 ngày (lý tưởng 7-10 ngày)."
     * - "KHÔNG được đặt Nhổ răng khôn và Tẩy trắng cùng ngày (nguy hiểm)."
     * - "Gợi ý: Nên đặt Khám + Cạo vôi cùng lúc để tiết kiệm thời gian."
     */
    @Column(name = "receptionist_note", columnDefinition = "TEXT")
    private String receptionistNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Check if this rule requires validation (not a soft suggestion)
     *
     * @return true if rule should block booking, false if it's just a suggestion
     */
    public boolean isHardRule() {
        return ruleType != DependencyRuleType.BUNDLES_WITH;
    }

    /**
     * Get service ID (for queries)
     */
    public Long getServiceId() {
        return service != null ? service.getServiceId() : null;
    }

    /**
     * Get dependent service ID (for queries)
     */
    public Long getDependentServiceId() {
        return dependentService != null ? dependentService.getServiceId() : null;
    }
}
