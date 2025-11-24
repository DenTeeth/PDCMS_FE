package com.dental.clinic.management.working_schedule.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified time-off type info for nested responses (P5.2)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeOffTypeInfoResponse {

    @JsonProperty("type_id")
    private String typeId;

    @JsonProperty("type_name")
    private String typeName;

    @JsonProperty("is_paid")
    private Boolean isPaid;
}
