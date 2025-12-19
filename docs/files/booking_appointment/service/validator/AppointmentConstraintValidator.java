package com.dental.clinic.management.booking_appointment.service.validator;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.working_schedule.service.HolidayDateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * BE_4: Validator for appointment constraints based on service rules
 * Validates:
 * 1. Appointment is not on a holiday
 * 2. Service minimum preparation days respected
 * 3. Service recovery days respected
 * 4. Service spacing days respected
 * 5. Max appointments per day not exceeded
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentConstraintValidator {

    private final HolidayDateService holidayDateService;
    private final AppointmentRepository appointmentRepository;

    /**
     * Validate if an appointment can be created on the proposed date
     * considering all service constraints and holidays.
     *
     * @param appointmentDate The proposed appointment date/time
     * @param service The service to be performed
     * @param patientId The patient ID
     * @return Validation result with details
     */
    public ValidationResult validateAppointmentConstraints(
            LocalDateTime appointmentDate,
            DentalService service,
            Long patientId) {

        if (appointmentDate == null) {
            return ValidationResult.invalid("Appointment date is required");
        }

        if (service == null) {
            return ValidationResult.invalid("Service is required for validation");
        }

        LocalDate date = appointmentDate.toLocalDate();

        // 1. Check if date is a holiday
        if (holidayDateService.isHoliday(date)) {
            return ValidationResult.invalid(
                    String.format("Cannot create appointment on %s - it is a holiday", date));
        }

        // 2. Check maximum appointments per day for this service
        if (service.getMaxAppointmentsPerDay() != null && service.getMaxAppointmentsPerDay() > 0) {
            long appointmentsOnDate = appointmentRepository.countByServiceAndDate(
                    service.getServiceId(), date);

            if (appointmentsOnDate >= service.getMaxAppointmentsPerDay()) {
                return ValidationResult.invalid(
                        String.format("Maximum appointments per day reached for service '%s' on %s (%d/%d)",
                                service.getServiceName(), date, appointmentsOnDate,
                                service.getMaxAppointmentsPerDay()));
            }
        }

        // 3. Check patient-specific constraints (spacing, recovery, preparation)
        if (patientId != null) {
            ValidationResult patientValidation = validatePatientServiceConstraints(
                    date, service, patientId);
            if (!patientValidation.isValid()) {
                return patientValidation;
            }
        }

        return ValidationResult.valid();
    }

    /**
     * Validate patient-specific service constraints:
     * - Minimum preparation days from last appointment
     * - Recovery days from last completed appointment
     * - Spacing days between same service appointments
     */
    private ValidationResult validatePatientServiceConstraints(
            LocalDate proposedDate,
            DentalService service,
            Long patientId) {

        // Find the last completed appointment for this patient
        List<Appointment> recentAppointments = appointmentRepository
                .findRecentCompletedByPatient(patientId, 10);

        if (recentAppointments.isEmpty()) {
            // First appointment for patient - no constraints
            return ValidationResult.valid();
        }

        Appointment lastAppointment = recentAppointments.get(0);
        LocalDate lastDate = lastAppointment.getAppointmentStartTime().toLocalDate();
        long daysSinceLastAppointment = java.time.temporal.ChronoUnit.DAYS.between(
                lastDate, proposedDate);

        // Check minimum preparation days
        if (service.getMinimumPreparationDays() != null &&
                service.getMinimumPreparationDays() > 0) {

            if (daysSinceLastAppointment < service.getMinimumPreparationDays()) {
                return ValidationResult.invalid(
                        String.format("Service '%s' requires minimum %d days preparation. " +
                                        "Last appointment was on %s (%d days ago)",
                                service.getServiceName(),
                                service.getMinimumPreparationDays(),
                                lastDate,
                                daysSinceLastAppointment));
            }
        }

        // Check recovery days
        if (service.getRecoveryDays() != null && service.getRecoveryDays() > 0) {
            if (daysSinceLastAppointment < service.getRecoveryDays()) {
                return ValidationResult.invalid(
                        String.format("Service '%s' requires %d days recovery period. " +
                                        "Last appointment was on %s (%d days ago)",
                                service.getServiceName(),
                                service.getRecoveryDays(),
                                lastDate,
                                daysSinceLastAppointment));
            }
        }

        // Check spacing days for same service
        // Note: Service checking requires join with appointment_services table
        // For simplicity, we check spacing against the current service using repository
        if (service.getSpacingDays() != null && service.getSpacingDays() > 0) {
            // Query last appointment with this specific service for this patient
            List<Appointment> serviceAppointments = appointmentRepository
                    .findRecentCompletedByPatientAndService(patientId.intValue(), service.getServiceId(), 1);
            
            if (!serviceAppointments.isEmpty()) {
                Appointment lastSameServiceAppointment = serviceAppointments.get(0);
                LocalDate lastSameServiceDate = lastSameServiceAppointment.getAppointmentStartTime().toLocalDate();
                long daysSinceSameService = java.time.temporal.ChronoUnit.DAYS.between(
                        lastSameServiceDate, proposedDate);

                if (daysSinceSameService < service.getSpacingDays()) {
                    return ValidationResult.invalid(
                            String.format("Service '%s' requires %d days spacing between appointments. " +
                                            "Last appointment with this service was on %s (%d days ago)",
                                    service.getServiceName(),
                                    service.getSpacingDays(),
                                    lastSameServiceDate,
                                    daysSinceSameService));
                }
            }
        }

        return ValidationResult.valid();
    }

    /**
     * Simple validation result container
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        private ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}
