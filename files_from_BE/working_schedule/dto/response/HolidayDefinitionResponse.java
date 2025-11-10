package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.HolidayType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for holiday definition.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDefinitionResponse {

    private String definitionId;
    private String holidayName;
    private HolidayType holidayType;
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    private Integer totalDates; // Number of dates associated with this definition
}
