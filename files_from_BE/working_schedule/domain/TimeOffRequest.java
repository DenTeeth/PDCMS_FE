package com.dental.clinic.management.working_schedule.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity for working_schedules table
 * Represents employee time-off requests
 */
@Entity
@Table(name = "time_off_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeOffRequest {

    private static IdGenerator idGenerator;

    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @Id
    @Column(name = "request_id", length = 50)
    private String requestId;

    @Column(name = "employee_id", nullable = false)
    private Integer employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private Employee employee;

    @Column(name = "time_off_type_id", nullable = false, length = 50)
    private String timeOffTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "work_shift_id", length = 50)
    private String workShiftId; // NULL if full day off, value if half-day off

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TimeOffStatus status = TimeOffStatus.PENDING;

    @Column(name = "requested_by", nullable = false)
    private Integer requestedBy; // User ID from token

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", insertable = false, updatable = false)
    private Employee requestedByEmployee;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "approved_by")
    private Integer approvedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", insertable = false, updatable = false)
    private Employee approvedByEmployee;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @PrePersist
    protected void onCreate() {
        if (requestId == null && idGenerator != null) {
            this.requestId = idGenerator.generateId("TOR");
        }
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }

    @Override
    public String toString() {
        return "TimeOffRequest{" +
                "requestId='" + requestId + '\'' +
                ", employeeId=" + employeeId +
                ", status=" + status +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                '}';
    }
}
