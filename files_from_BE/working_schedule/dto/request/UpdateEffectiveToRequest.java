package com.dental.clinic.management.working_schedule.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEffectiveToRequest {

    private LocalDate effectiveTo; // Can be null for permanent
}
