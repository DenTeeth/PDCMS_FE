package com.dental.clinic.management.booking_appointment.controller;

import com.dental.clinic.management.booking_appointment.dto.availability.AvailableDoctorDTO;
import com.dental.clinic.management.booking_appointment.dto.availability.AvailableResourcesDTO;
import com.dental.clinic.management.booking_appointment.dto.availability.TimeSlotDTO;
import com.dental.clinic.management.booking_appointment.service.AvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * REST Controller for Availability Check APIs
 * Progressive booking flow - helps receptionist discover available resources step-by-step
 */
@RestController
@RequestMapping("/api/v1/availability")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Appointment Availability", description = "APIs for step-by-step booking flow")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    /**
     * API 4.1: Get Available Doctors
     * Step 2 of booking flow: After selecting services, find qualified doctors with shifts
     */
    @GetMapping("/doctors")
    @PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
    @Operation(
            summary = "Get available doctors",
            description = "Returns doctors who have required specializations AND working shifts on the selected date"
    )
    public ResponseEntity<List<AvailableDoctorDTO>> getAvailableDoctors(
            @Parameter(description = "Selected date (YYYY-MM-DD)", required = true, example = "2025-11-10")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,

            @Parameter(description = "Service codes (comma-separated)", required = true, example = "SCALING_L1,GEN_EXAM")
            @RequestParam List<String> serviceCodes) {

        log.info("GET /api/v1/availability/doctors - date: {}, services: {}", date, serviceCodes);

        List<AvailableDoctorDTO> doctors = availabilityService.getAvailableDoctors(date, serviceCodes);

        return ResponseEntity.ok(doctors);
    }

    /**
     * API 4.2: Get Available Time Slots
     * Step 3 of booking flow: After selecting doctor, find free time slots
     */
    @GetMapping("/slots")
    @PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
    @Operation(
            summary = "Get available time slots",
            description = "Returns time gaps when the selected doctor is free (considering existing appointments)"
    )
    public ResponseEntity<List<TimeSlotDTO>> getAvailableTimeSlots(
            @Parameter(description = "Selected date (YYYY-MM-DD)", required = true, example = "2025-11-10")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,

            @Parameter(description = "Doctor's employee code", required = true, example = "DR_KHOA")
            @RequestParam String employeeCode,

            @Parameter(description = "Required duration in minutes", required = true, example = "75")
            @RequestParam int durationMinutes) {

        log.info("GET /api/v1/availability/slots - date: {}, doctor: {}, duration: {} min",
                date, employeeCode, durationMinutes);

        List<TimeSlotDTO> slots = availabilityService.getAvailableTimeSlots(date, employeeCode, durationMinutes);

        return ResponseEntity.ok(slots);
    }

    /**
     * API 4.3: Get Available Resources (Rooms + Assistants)
     * Step 4 of booking flow: After selecting time, find available rooms and assistants
     */
    @GetMapping("/resources")
    @PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
    @Operation(
            summary = "Get available resources",
            description = "Returns rooms (compatible with services) and assistants (free) during the selected time range"
    )
    public ResponseEntity<AvailableResourcesDTO> getAvailableResources(
            @Parameter(description = "Appointment start time (ISO 8601)", required = true,
                       example = "2025-11-10T09:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,

            @Parameter(description = "Appointment end time (ISO 8601)", required = true,
                       example = "2025-11-10T10:15:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,

            @Parameter(description = "Service codes (comma-separated)", required = true,
                       example = "SCALING_L1,GEN_EXAM")
            @RequestParam List<String> serviceCodes) {

        log.info("GET /api/v1/availability/resources - time: {} to {}, services: {}",
                startTime, endTime, serviceCodes);

        AvailableResourcesDTO resources = availabilityService.getAvailableResources(
                startTime, endTime, serviceCodes);

        return ResponseEntity.ok(resources);
    }
}
