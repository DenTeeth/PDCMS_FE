package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Registration history/audit log response.
 * Shows the lifecycle of a registration from creation to approval/rejection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationHistoryResponse {
    
    /**
     * Registration ID
     */
    private Integer registrationId;
    
    /**
     * Employee information
     */
    private Integer employeeId;
    private String employeeName;
    private String employeeCode;
    
    /**
     * Slot information
     */
    private Long slotId;
    private String workShiftName;
    private String dayOfWeek;
    
    /**
     * Registration dates
     */
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    
    /**
     * Current status
     */
    private RegistrationStatus status;
    
    /**
     * Timeline information
     */
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    
    /**
     * Who approved/rejected
     */
    private Integer processedById;
    private String processedByName;
    private String processedByCode;
    
    /**
     * Reason (for rejection)
     */
    private String reason;
    
    /**
     * Active status (cancellation)
     */
    private Boolean isActive;
    private LocalDateTime cancelledAt; // updatedAt when isActive = false
}
