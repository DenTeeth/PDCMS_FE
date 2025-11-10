package com.dental.clinic.management.working_schedule.dto.response;

import lombok.*;

/**
 * Response DTO for TimeOffType
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeOffTypeResponse {

    private String typeId;
    private String typeCode; // ANNUAL_LEAVE, SICK_LEAVE, etc.
    private String typeName;
    private String description;
    private Boolean requiresBalance; // true = cần check số dư phép, false = không cần
    private Double defaultDaysPerYear; // Số ngày phép mặc định mỗi năm (dùng cho annual reset)
    private Boolean isPaid; // true = có lương, false = không lương
    private Boolean requiresApproval; // true = cần duyệt, false = không cần
    private Boolean isActive; // true = đang hoạt động, false = đã vô hiệu hóa
}
