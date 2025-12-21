package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.booking_appointment.dto.UpdateAppointmentStatusRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled service for automatic appointment status transitions.
 *
 * Rule #6: Auto-cancel appointments if patient arrives >15 minutes late
 *
 * Business Logic:
 * - Runs every 5 minutes
 * - Finds SCHEDULED appointments where: startTime + 15 minutes < now
 * - Auto-updates status to NO_SHOW with system notes
 * - Triggers Rule #5 (no-show counter) via AppointmentStatusService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentAutoStatusService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentStatusService statusService;

    /**
     * Cron: Every 5 minutes
     * Check for appointments that are >15 minutes past start time and still
     * SCHEDULED
     *
     * Rule #6: Late arrivals (>15 min) are automatically marked as NO_SHOW
     */
    @Scheduled(cron = "0 */5 * * * *") // Every 5 minutes
    @Transactional
    public void autoMarkLateAppointmentsAsNoShow() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoffTime = now.minusMinutes(15);

        log.info("Running scheduled job: Auto-mark late appointments as NO_SHOW (cutoff: {})", cutoffTime);

        // Find SCHEDULED appointments where start time + 15 minutes has passed
        List<Appointment> lateAppointments = appointmentRepository
                .findByStatusAndAppointmentStartTimeBefore(
                        AppointmentStatus.SCHEDULED,
                        cutoffTime);

        if (lateAppointments.isEmpty()) {
            log.debug("No late appointments found");
            return;
        }

        log.info("Found {} late appointments (>15 min past start time)", lateAppointments.size());

        int successCount = 0;
        int failCount = 0;

        for (Appointment appointment : lateAppointments) {
            try {
                // Calculate how late the patient is
                long minutesLate = java.time.Duration.between(
                        appointment.getAppointmentStartTime(),
                        now).toMinutes();

                // Update status via AppointmentStatusService to trigger all side effects
                // (audit log, plan item update, Rule #5 no-show tracking, etc.)
                UpdateAppointmentStatusRequest request = new UpdateAppointmentStatusRequest();
                request.setStatus(AppointmentStatus.NO_SHOW.name());
                request.setReasonCode("OTHER");

                // Format Vietnamese date/time (dd/MM/yyyy HH:mm)
                java.time.format.DateTimeFormatter vietnameseFormatter = java.time.format.DateTimeFormatter
                        .ofPattern("dd/MM/yyyy HH:mm");
                String originalTime = appointment.getAppointmentStartTime().format(vietnameseFormatter);
                String systemTime = now.format(vietnameseFormatter);

                request.setNotes(String.format(
                        "Hệ thống tự động đánh dấu KHÔNG ĐẾN: Bệnh nhân đến trễ hơn 15 phút (trễ %d phút). " +
                                "Thời gian lịch hẹn gốc: %s. Thời gian hệ thống: %s.",
                        minutesLate,
                        originalTime,
                        systemTime));

                statusService.updateStatus(appointment.getAppointmentCode(), request);

                successCount++;
                log.info("✓ Auto-marked appointment {} as NO_SHOW ({} minutes late)",
                        appointment.getAppointmentCode(), minutesLate);

            } catch (Exception e) {
                failCount++;
                log.error("✗ Failed to auto-mark appointment {} as NO_SHOW: {}",
                        appointment.getAppointmentCode(), e.getMessage(), e);
            }
        }

        log.info("Auto-mark late appointments completed: {} success, {} failed", successCount, failCount);
    }
}
