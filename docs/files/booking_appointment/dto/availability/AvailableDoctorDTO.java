package com.dental.clinic.management.booking_appointment.dto.availability;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for API 4.1: Available Doctors
 * Returns doctors who:
 * 1. Have required specializations for selected services
 * 2. Have working shifts on the selected date
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableDoctorDTO {

    private String employeeCode;
    private String fullName;

    /**
     * List of specialization names this doctor has
     * Example: ["General Dentistry", "Cosmetic Dentistry"]
     */
    private List<String> specializations;

    /**
     * Working shifts on the selected date
     * Example: ["08:00-12:00", "14:00-18:00"]
     */
    private List<String> shiftTimes;
}
