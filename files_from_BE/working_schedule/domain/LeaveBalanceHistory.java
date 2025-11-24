package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.working_schedule.enums.BalanceChangeReason;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balance_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "balance_id", nullable = false, insertable = false, updatable = false)
    private Long balanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "balance_id", nullable = false)
    private EmployeeLeaveBalance balance;

    @Column(name = "changed_by", nullable = false, insertable = false, updatable = false)
    private Integer changedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private com.dental.clinic.management.employee.domain.Employee changedByEmployee;

    @Column(name = "change_amount", nullable = false)
    private Double changeAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 50)
    private BalanceChangeReason reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
