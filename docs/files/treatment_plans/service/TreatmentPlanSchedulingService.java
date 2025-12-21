package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.working_schedule.service.HolidayDateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * BE_4: Service for calculating treatment plan appointment schedules
 * Handles automatic scheduling with holiday detection and service constraints
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TreatmentPlanSchedulingService {

    private final HolidayDateService holidayDateService;

    /**
     * Calculate appointment dates for a treatment plan based on estimated duration
     * and service constraints, skipping holidays.
     *
     * @param startDate The start date of the treatment plan
     * @param estimatedDurationDays Estimated total duration in days
     * @param services List of services in the treatment plan (ordered)
     * @return List of calculated appointment dates (working days only)
     */
    public List<LocalDate> calculateAppointmentDates(
            LocalDate startDate,
            Integer estimatedDurationDays,
            List<DentalService> services) {

        if (services == null || services.isEmpty()) {
            log.debug("No services provided, returning empty schedule");
            return new ArrayList<>();
        }

        if (estimatedDurationDays == null || estimatedDurationDays <= 0) {
            log.warn("Invalid estimated duration: {}, defaulting to single appointment", estimatedDurationDays);
            return List.of(holidayDateService.getNextWorkingDay(startDate));
        }

        List<LocalDate> appointmentDates = new ArrayList<>();
        LocalDate currentDate = holidayDateService.getNextWorkingDay(startDate);
        
        log.debug("Calculating appointment dates from {} for {} days with {} services",
                startDate, estimatedDurationDays, services.size());

        // Calculate interval between appointments based on duration and service count
        int numberOfServices = services.size();
        int intervalDays = Math.max(1, estimatedDurationDays / numberOfServices);

        for (int i = 0; i < services.size(); i++) {
            DentalService service = services.get(i);
            
            // First appointment uses the start date
            if (i == 0) {
                appointmentDates.add(currentDate);
                log.debug("Service {}: {} scheduled on {} (start date)", 
                        i + 1, service.getServiceName(), currentDate);
            } else {
                // Calculate next appointment considering constraints
                LocalDate nextDate = calculateNextAvailableDate(
                        currentDate,
                        service,
                        intervalDays
                );
                appointmentDates.add(nextDate);
                currentDate = nextDate;
                
                log.debug("Service {}: {} scheduled on {} (interval: {} days)", 
                        i + 1, service.getServiceName(), nextDate, intervalDays);
            }
        }

        log.info("Generated {} appointment dates for treatment plan from {} to {}",
                appointmentDates.size(), appointmentDates.get(0),
                appointmentDates.get(appointmentDates.size() - 1));

        return appointmentDates;
    }

    /**
     * Calculate the next available date for an appointment considering:
     * 1. Service minimum preparation days
     * 2. Service spacing days
     * 3. Service recovery days
     * 4. Holidays (skip non-working days)
     *
     * @param previousDate The date of the previous appointment
     * @param service The service for the next appointment
     * @param defaultInterval Default interval days if no service constraints
     * @return Next available working date
     */
    public LocalDate calculateNextAvailableDate(
            LocalDate previousDate,
            DentalService service,
            int defaultInterval) {

        int daysToAdd = defaultInterval;

        // Apply service constraints if present
        if (service != null) {
            Integer minPrep = service.getMinimumPreparationDays();
            Integer recovery = service.getRecoveryDays();
            Integer spacing = service.getSpacingDays();

            // Use the maximum of all constraint values
            int maxConstraint = 0;
            if (minPrep != null && minPrep > maxConstraint) {
                maxConstraint = minPrep;
            }
            if (recovery != null && recovery > maxConstraint) {
                maxConstraint = recovery;
            }
            if (spacing != null && spacing > maxConstraint) {
                maxConstraint = spacing;
            }

            // Use constraint if it's greater than default interval
            if (maxConstraint > 0) {
                daysToAdd = Math.max(daysToAdd, maxConstraint);
                log.debug("Service {} has constraints - using {} days interval", 
                        service.getServiceName(), daysToAdd);
            }
        }

        // Add working days (skipping holidays)
        LocalDate nextDate = holidayDateService.addWorkingDays(previousDate, daysToAdd);

        log.debug("Next available date after {} is {} ({} working days)",
                previousDate, nextDate, daysToAdd);

        return nextDate;
    }

    /**
     * Validate if a proposed appointment date is valid considering:
     * 1. Not a holiday
     * 2. Respects service constraints relative to previous appointment
     *
     * @param proposedDate The date to validate
     * @param previousAppointmentDate Date of previous appointment (null if first)
     * @param service The service for the appointment
     * @return true if date is valid, false otherwise
     */
    public boolean isDateValidForAppointment(
            LocalDate proposedDate,
            LocalDate previousAppointmentDate,
            DentalService service) {

        // Check if date is a holiday
        if (holidayDateService.isHoliday(proposedDate)) {
            log.debug("Date {} is a holiday - invalid", proposedDate);
            return false;
        }

        // If no previous appointment, date is valid (if not holiday)
        if (previousAppointmentDate == null) {
            return true;
        }

        // Check service constraints
        if (service != null) {
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(
                    previousAppointmentDate, proposedDate);

            Integer minPrep = service.getMinimumPreparationDays();
            if (minPrep != null && daysBetween < minPrep) {
                log.debug("Date {} violates minimum preparation days ({} < {})",
                        proposedDate, daysBetween, minPrep);
                return false;
            }

            Integer recovery = service.getRecoveryDays();
            if (recovery != null && daysBetween < recovery) {
                log.debug("Date {} violates recovery days ({} < {})",
                        proposedDate, daysBetween, recovery);
                return false;
            }

            Integer spacing = service.getSpacingDays();
            if (spacing != null && daysBetween < spacing) {
                log.debug("Date {} violates spacing days ({} < {})",
                        proposedDate, daysBetween, spacing);
                return false;
            }
        }

        return true;
    }
}
