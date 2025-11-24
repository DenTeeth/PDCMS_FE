package com.dental.clinic.management.working_schedule.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_leave_balances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeLeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "balance_id")
    private Long balanceId;

    @Column(name = "employee_id", nullable = false, insertable = false, updatable = false)
    private Integer employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private com.dental.clinic.management.employee.domain.Employee employee;

    @Column(name = "time_off_type_id", nullable = false, length = 50, insertable = false, updatable = false)
    private String timeOffTypeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_off_type_id", nullable = false)
    private TimeOffType timeOffType;

    @Column(name = "cycle_year", nullable = false)
    private Integer year;

    @Column(name = "total_days_allowed", nullable = false)
    private Double totalAllotted;

    @Column(name = "days_taken", nullable = false)
    @Builder.Default
    private Double used = 0.0;

    @Transient
    private Double remaining;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @PostLoad
    @PostPersist
    @PostUpdate
    protected void calculateRemaining() {
        this.remaining = totalAllotted - used;
    }
}
