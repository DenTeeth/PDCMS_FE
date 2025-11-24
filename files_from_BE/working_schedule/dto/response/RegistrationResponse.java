package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for part-time registrations.
 * 
 * NEW SPECIFICATION: Includes approval workflow fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponse {

    private Integer registrationId;
    private Integer employeeId;
    private String employeeName; // Employee full name
    private Long partTimeSlotId;
    private String workShiftId;
    private String shiftName; // More intuitive field name
    private String dayOfWeek;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    
    /**
     * Registration status: PENDING, APPROVED, REJECTED
     */
    private String status;
    
    /**
     * The dates based on status:
     * - PENDING: Requested dates awaiting approval
     * - APPROVED: Accepted dates for work
     * - REJECTED: Dates that were rejected
     */
    private java.util.List<LocalDate> dates;
    
    /**
     * Rejection reason (only present if status = REJECTED)
     */
    private String reason;
    
    /**
     * Manager name who processed this registration
     */
    private String processedBy;
    
    /**
     * When the registration was processed
     */
    private String processedAt;
    
    /**
     * When the registration was created
     */
    private String createdAt;
}
