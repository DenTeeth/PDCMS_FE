package com.dental.clinic.management.utils.validation;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.service.domain.DentalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Validator for service spacing rules in appointment scheduling.
 * Implements BE_4 requirements for intelligent appointment spacing.
 * 
 * Three types of spacing rules:
 * 1. minimumPreparationDays: Minimum advance booking days
 * 2. recoveryDays: Days needed after service before next appointment
 * 3. spacingDays: Interval between similar services
 * 
 * ISSUE: AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION
 * Priority: HIGH
 * Assigned: NGUYEN
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ServiceSpacingValidator {
    
    private final AppointmentRepository appointmentRepository;
    
    private static final String ENTITY_NAME = "appointment";
    private static final int DEFAULT_MAX_APPOINTMENTS_PER_DAY = 2;
    
    /**
     * Validate if a service can be scheduled on given date for patient.
     * Checks: minimum preparation days, recovery period, and interval spacing.
     * 
     * @param patientId Patient ID
     * @param service Service to be scheduled
     * @param proposedDate Proposed appointment date
     * @throws BadRequestAlertException if any spacing rule is violated
     */
    public void validateServiceSpacing(
            Integer patientId,
            DentalService service,
            LocalDate proposedDate) {
        
        log.debug("Validating spacing for service {} on date {} for patient {}",
                service.getServiceCode(), proposedDate, patientId);
        
        // Rule 1: Check minimum preparation days (from today)
        validateMinimumPreparationDays(service, proposedDate);
        
        // Rule 2 & 3: Check recovery and spacing based on previous appointments
        validateRecoveryAndSpacing(patientId, service, proposedDate);
        
        log.debug("✓ Service spacing validation passed for service {}", service.getServiceCode());
    }
    
    /**
     * Validate minimum preparation days (advance booking requirement).
     * Example: Implant surgery needs 7 days advance notice.
     */
    private void validateMinimumPreparationDays(DentalService service, LocalDate proposedDate) {
        Integer minDays = service.getMinimumPreparationDays();
        if (minDays == null || minDays <= 0) {
            return; // No minimum preparation requirement
        }
        
        LocalDate earliestDate = LocalDate.now().plusDays(minDays);
        if (proposedDate.isBefore(earliestDate)) {
            throw new BadRequestAlertException(
                    String.format("Dịch vụ '%s' yêu cầu đặt trước tối thiểu %d ngày. " +
                                    "Ngày sớm nhất có thể đặt: %s",
                            service.getServiceName(),
                            minDays,
                            earliestDate),
                    ENTITY_NAME,
                    "MINIMUM_PREPARATION_DAYS_NOT_MET");
        }
    }
    
    /**
     * Validate recovery and spacing rules based on patient's appointment history.
     * Checks the most recent appointment with this service.
     */
    private void validateRecoveryAndSpacing(
            Integer patientId,
            DentalService service,
            LocalDate proposedDate) {
        
        // Get patient's previous completed/in-progress appointments with this service
        List<AppointmentStatus> relevantStatuses = List.of(
                AppointmentStatus.COMPLETED,
                AppointmentStatus.IN_PROGRESS
        );
        
        List<Appointment> previousAppointments = appointmentRepository
                .findRecentAppointmentsByPatientAndService(
                        patientId,
                        service.getServiceId().intValue(),
                        relevantStatuses
                );
        
        if (previousAppointments.isEmpty()) {
            return; // First appointment with this service - no restrictions
        }
        
        // Get most recent appointment
        Appointment lastAppointment = previousAppointments.get(0);
        LocalDate lastAppointmentDate = lastAppointment.getAppointmentStartTime().toLocalDate();
        
        log.debug("Found previous appointment {} on {} for service {}",
                lastAppointment.getAppointmentCode(),
                lastAppointmentDate,
                service.getServiceCode());
        
        // Check recovery days
        validateRecoveryDays(service, proposedDate, lastAppointmentDate);
        
        // Check spacing days
        validateSpacingDays(service, proposedDate, lastAppointmentDate);
    }
    
    /**
     * Validate recovery period after last service.
     * Example: After tooth extraction, patient needs 7 days to heal.
     */
    private void validateRecoveryDays(
            DentalService service,
            LocalDate proposedDate,
            LocalDate lastAppointmentDate) {
        
        Integer recoveryDays = service.getRecoveryDays();
        if (recoveryDays == null || recoveryDays <= 0) {
            return; // No recovery requirement
        }
        
        LocalDate earliestNextDate = lastAppointmentDate.plusDays(recoveryDays);
        if (proposedDate.isBefore(earliestNextDate)) {
            long daysSinceLastAppointment = ChronoUnit.DAYS.between(lastAppointmentDate, proposedDate);
            throw new BadRequestAlertException(
                    String.format("Dịch vụ '%s' yêu cầu %d ngày hồi phục sau lần điều trị trước (%s). " +
                                    "Ngày sớm nhất có thể đặt: %s (hiện tại chỉ qua %d ngày)",
                            service.getServiceName(),
                            recoveryDays,
                            lastAppointmentDate,
                            earliestNextDate,
                            daysSinceLastAppointment),
                    ENTITY_NAME,
                    "RECOVERY_PERIOD_NOT_MET");
        }
    }
    
    /**
     * Validate spacing interval between similar services.
     * Example: Orthodontic adjustments need 30 days spacing.
     */
    private void validateSpacingDays(
            DentalService service,
            LocalDate proposedDate,
            LocalDate lastAppointmentDate) {
        
        Integer spacingDays = service.getSpacingDays();
        if (spacingDays == null || spacingDays <= 0) {
            return; // No spacing requirement
        }
        
        long daysSinceLastAppointment = ChronoUnit.DAYS.between(lastAppointmentDate, proposedDate);
        if (daysSinceLastAppointment < spacingDays) {
            LocalDate earliestNextDate = lastAppointmentDate.plusDays(spacingDays);
            throw new BadRequestAlertException(
                    String.format("Dịch vụ '%s' yêu cầu giãn cách %d ngày giữa các lần điều trị. " +
                                    "Lần điều trị trước: %s. Ngày sớm nhất có thể đặt: %s",
                            service.getServiceName(),
                            spacingDays,
                            lastAppointmentDate,
                            earliestNextDate),
                    ENTITY_NAME,
                    "SPACING_INTERVAL_NOT_MET");
        }
    }
    
    /**
     * Validate daily appointment limit when spacing rules are not defined.
     * Fallback rule: Max 2 appointments per day per patient.
     * 
     * This prevents overwhelming patients when services don't have explicit spacing rules.
     */
    public void validateDailyLimit(Integer patientId, LocalDate date, DentalService service) {
        // Only apply if all spacing rules are zero/null
        boolean hasSpacingRules =
                (service.getMinimumPreparationDays() != null && service.getMinimumPreparationDays() > 0) ||
                (service.getRecoveryDays() != null && service.getRecoveryDays() > 0) ||
                (service.getSpacingDays() != null && service.getSpacingDays() > 0);
        
        if (hasSpacingRules) {
            log.debug("Service {} has spacing rules defined, skipping daily limit check", 
                    service.getServiceCode());
            return; // Spacing rules defined, skip daily limit
        }
        
        // Check service-specific limit or use default
        int maxPerDay = (service.getMaxAppointmentsPerDay() != null && service.getMaxAppointmentsPerDay() > 0)
                ? service.getMaxAppointmentsPerDay()
                : DEFAULT_MAX_APPOINTMENTS_PER_DAY;
        
        // Count appointments for patient on this date
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        List<AppointmentStatus> countableStatuses = List.of(
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CHECKED_IN,
                AppointmentStatus.IN_PROGRESS
        );
        
        long appointmentCount = appointmentRepository.countAppointmentsByPatientAndDateRange(
                patientId,
                startOfDay,
                endOfDay,
                countableStatuses
        );
        
        if (appointmentCount >= maxPerDay) {
            throw new BadRequestAlertException(
                    String.format("Bệnh nhân đã có %d lịch hẹn vào ngày %s (giới hạn: %d lịch/ngày). " +
                                    "Vui lòng chọn ngày khác.",
                            appointmentCount, date, maxPerDay),
                    ENTITY_NAME,
                    "DAILY_APPOINTMENT_LIMIT_EXCEEDED");
        }
        
        log.debug("Daily limit check passed: {} appointments out of {} max for patient {} on {}",
                appointmentCount, maxPerDay, patientId, date);
    }
    
    /**
     * Calculate minimum allowed date for service based on all spacing rules.
     * Used by auto-scheduling to find the earliest possible date.
     * 
     * @param patientId Patient ID
     * @param service Service to schedule
     * @return Minimum allowed date (considering all spacing rules)
     */
    public LocalDate calculateMinimumAllowedDate(Integer patientId, DentalService service) {
        LocalDate minDate = LocalDate.now();
        
        // Apply minimum preparation days
        if (service.getMinimumPreparationDays() != null && service.getMinimumPreparationDays() > 0) {
            LocalDate minByPreparation = LocalDate.now().plusDays(service.getMinimumPreparationDays());
            if (minByPreparation.isAfter(minDate)) {
                minDate = minByPreparation;
                log.debug("Applied minimum preparation days: {}", minDate);
            }
        }
        
        // Get last appointment with this service
        List<Appointment> previousAppointments = appointmentRepository
                .findRecentAppointmentsByPatientAndService(
                        patientId,
                        service.getServiceId().intValue(),
                        List.of(AppointmentStatus.COMPLETED, AppointmentStatus.IN_PROGRESS)
                );
        
        if (!previousAppointments.isEmpty()) {
            Appointment lastAppointment = previousAppointments.get(0);
            LocalDate lastDate = lastAppointment.getAppointmentStartTime().toLocalDate();
            
            // Apply recovery days
            if (service.getRecoveryDays() != null && service.getRecoveryDays() > 0) {
                LocalDate minByRecovery = lastDate.plusDays(service.getRecoveryDays());
                if (minByRecovery.isAfter(minDate)) {
                    minDate = minByRecovery;
                    log.debug("Applied recovery days: {}", minDate);
                }
            }
            
            // Apply spacing days
            if (service.getSpacingDays() != null && service.getSpacingDays() > 0) {
                LocalDate minBySpacing = lastDate.plusDays(service.getSpacingDays());
                if (minBySpacing.isAfter(minDate)) {
                    minDate = minBySpacing;
                    log.debug("Applied spacing days: {}", minDate);
                }
            }
        }
        
        log.debug("Calculated minimum allowed date for service {}: {}",
                service.getServiceCode(), minDate);
        
        return minDate;
    }
}
