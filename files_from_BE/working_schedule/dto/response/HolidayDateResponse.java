package com.dental.clinic.management.working_schedule.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for holiday date.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDateResponse {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate holidayDate;

    private String definitionId;
    private String holidayName; // From HolidayDefinition
    private String description; // Specific to this date
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
