package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.RenewalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for shift renewal request.
 * Used for both GET pending renewals and PATCH respond actions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRenewalResponse {
    private String renewalId;
    private Integer expiringRegistrationId;
    private Integer employeeId;
    private String employeeName;
    private RenewalStatus status;
    private LocalDateTime expiresAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime createdAt;

    /**
     * Reason for declining (only set when status = DECLINED).
     */
    private String declineReason;

    // Additional information about the expiring FIXED registration
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String workShiftName; // e.g., "Ca sáng" (from work_shift table)
    private String shiftDetails; // e.g., "Monday, Wednesday (Ca sáng)"

    /**
     * Dynamic message for FE to display.
     * Format: "Hợp đồng/Lịch làm việc cố định [shiftName] của bạn sẽ hết hạn vào
     * ngày [date].
     * Bạn có muốn gia hạn thêm [1 tháng] không?"
     */
    private String message;
}
