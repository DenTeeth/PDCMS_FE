package com.dental.clinic.management.booking_appointment.controller;

import com.dental.clinic.management.booking_appointment.dto.AppointmentDetailDTO;
import com.dental.clinic.management.booking_appointment.dto.AppointmentFilterCriteria;
import com.dental.clinic.management.booking_appointment.dto.AppointmentSummaryDTO;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentRequest;
import com.dental.clinic.management.booking_appointment.dto.CreateAppointmentResponse;
import com.dental.clinic.management.booking_appointment.dto.DatePreset;
import com.dental.clinic.management.booking_appointment.dto.UpdateAppointmentStatusRequest;
import com.dental.clinic.management.booking_appointment.dto.request.AvailableTimesRequest;
import com.dental.clinic.management.booking_appointment.dto.request.DelayAppointmentRequest;
import com.dental.clinic.management.booking_appointment.dto.request.RescheduleAppointmentRequest;
import com.dental.clinic.management.booking_appointment.dto.response.AvailableTimesResponse;
import com.dental.clinic.management.booking_appointment.dto.response.RescheduleAppointmentResponse;
import com.dental.clinic.management.booking_appointment.service.AppointmentAvailabilityService;
import com.dental.clinic.management.booking_appointment.service.AppointmentCreationService;
import com.dental.clinic.management.booking_appointment.service.AppointmentDelayService;
import com.dental.clinic.management.booking_appointment.service.AppointmentDetailService;
import com.dental.clinic.management.booking_appointment.service.AppointmentListService;
import com.dental.clinic.management.booking_appointment.service.AppointmentRescheduleService;
import com.dental.clinic.management.booking_appointment.service.AppointmentStatusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for Appointment Management APIs
 * Handles appointment scheduling, availability checking, and lifecycle
 * management
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment Management", description = "APIs for managing dental appointments")
public class AppointmentController {

        private final AppointmentAvailabilityService availabilityService;
        private final AppointmentCreationService creationService;
        private final AppointmentListService listService;
        private final AppointmentDetailService detailService;
        private final AppointmentStatusService statusService;
        private final AppointmentDelayService delayService;
        private final AppointmentRescheduleService rescheduleService;

        /**
         * P3.1: Find Available Time Slots
         *
         * GET /api/v1/appointments/available-times
         *
         * Business Logic:
         * 1. Validate date (not in past)
         * 2. Validate employee, services, participants exist and active
         * 3. Calculate total duration (sum of service durations + buffers)
         * 4. Check doctor specialization
         * 5. Filter compatible rooms (room_services V16)
         * 6. Find intersection of available time (doctor + assistants + rooms)
         * 7. Split into slots and return with available rooms
         *
         * @param request Query parameters with date, employeeCode, serviceCodes,
         *                participantCodes
         * @return Available time slots with compatible room codes
         */
        @Operation(
            summary = "Find available time slots",
            description = "Find available appointment time slots based on date, doctor, services, and assistants considering shifts and conflicts"
        )
        @GetMapping("/available-times")
        @PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
        public ResponseEntity<AvailableTimesResponse> findAvailableTimes(
                        @Valid @ModelAttribute AvailableTimesRequest request) {

                log.info("Finding available times for date={}, employeeCode={}, services={}",
                                request.getDate(), request.getEmployeeCode(), request.getServiceCodes());

                AvailableTimesResponse response = availabilityService.findAvailableTimes(request);

                return ResponseEntity.ok(response);
        }

        /**
         * P3.2: Create New Appointment
         *
         * POST /api/v1/appointments
         *
         * 9-Step Transactional Process:
         * 1. Get creator from SecurityContext
         * 2. Validate all resources (patient, doctor, room, services, participants)
         * 3. Validate doctor specializations
         * 4. Validate room compatibility (room_services V16)
         * 5. Calculate duration and end time
         * 6. Validate doctor and participant shifts
         * 7. Check conflicts (doctor, room, patient, participants)
         * 8. Insert appointment + services + participants + audit log
         * 9. Return response with nested summaries
         *
         * @param request Create appointment request body
         * @return 201 Created with appointment details
         */
        @Operation(
            summary = "Create appointment",
            description = "Create a new dental appointment with full validation of resources, conflicts, and room compatibility"
        )
        @PostMapping
        @PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
        public ResponseEntity<CreateAppointmentResponse> createAppointment(
                        @Valid @RequestBody CreateAppointmentRequest request) {

                log.info("Creating appointment for patient={}, doctor={}, start={}",
                                request.getPatientCode(), request.getEmployeeCode(), request.getAppointmentStartTime());

                CreateAppointmentResponse response = creationService.createAppointment(request);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        /**
         * P3.3: Get Appointment List (Dashboard View)
         *
         * GET /api/v1/appointments
         *
         * Authorization & RBAC Logic:
         * - Users with VIEW_APPOINTMENT_ALL (Receptionist/Admin):
         * Can see all appointments, use all filters freely
         *
         * - Users with VIEW_APPOINTMENT_OWN (Doctor/Patient):
         * Filters are OVERRIDDEN:
         * - Patients: See only their own appointments
         * - Doctors: See appointments where they are primary doctor OR participant
         *
         * Query Parameters:
         * - page (default: 0): Page number
         * - size (default: 10): Items per page
         * - sortBy (default: appointmentStartTime): Sort field
         * - sortDirection (default: ASC): Sort direction
         * - datePreset (TODAY, THIS_WEEK, NEXT_7_DAYS, THIS_MONTH): Quick date filter
         * - dateFrom (YYYY-MM-DD): Filter from date (inclusive)
         * - dateTo (YYYY-MM-DD): Filter to date (inclusive)
         * - today (boolean): Quick filter for today's appointments (DEPRECATED, use
         * datePreset=TODAY)
         * - status (array): Filter by status (SCHEDULED, CHECKED_IN, etc.)
         * - patientCode (string): Filter by patient code (VIEW_ALL only)
         * - patientName (string): Search by patient name (VIEW_ALL only)
         * - patientPhone (string): Search by patient phone (VIEW_ALL only)
         * - employeeCode (string): Filter by doctor code (VIEW_ALL only)
         * - roomCode (string): Filter by room code
         * - serviceCode (string): Filter by service code
         * - searchCode (string): Combined search by code OR name
         * (patient/doctor/employee/room/service)
         * Examples: "Nguyễn Văn A", "Dr. An", "BN-1001", "Cạo vôi"
         *
         * @return Paginated list of appointments with nested
         *         patient/doctor/room/services/participants
         */
        @Operation(
            summary = "Get appointment list",
            description = "Retrieve paginated list of appointments with comprehensive filters and RBAC-based visibility control"
        )
        @SuppressWarnings("deprecation")
        @GetMapping
        @PreAuthorize("hasAnyAuthority('VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_OWN')")
        public ResponseEntity<Page<AppointmentSummaryDTO>> getAppointments(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "appointmentStartTime") String sortBy,
                        @RequestParam(defaultValue = "ASC") String sortDirection,

                        // Date filters
                        @RequestParam(required = false) DatePreset datePreset,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                        @RequestParam(required = false) Boolean today,

                        // Status filter (can be multiple)
                        @RequestParam(required = false) List<String> status,

                        // Entity filters
                        @RequestParam(required = false) String patientCode,
                        @RequestParam(required = false) String patientName,
                        @RequestParam(required = false) String patientPhone,
                        @RequestParam(required = false) String employeeCode,
                        @RequestParam(required = false) String roomCode,
                        @RequestParam(required = false) String serviceCode,
                        @RequestParam(required = false) String searchCode) {

                log.info("Fetching appointments: page={}, size={}, datePreset={}, dateFrom={}, dateTo={}, today={}, status={}, searchCode={}",
                                page, size, datePreset, dateFrom, dateTo, today, status, searchCode);

                // Build filter criteria
                AppointmentFilterCriteria criteria = AppointmentFilterCriteria.builder()
                                .datePreset(datePreset)
                                .dateFrom(dateFrom)
                                .dateTo(dateTo)
                                .today(today)
                                .status(status)
                                .patientCode(patientCode)
                                .patientName(patientName)
                                .patientPhone(patientPhone)
                                .employeeCode(employeeCode)
                                .roomCode(roomCode)
                                .serviceCode(serviceCode)
                                .searchCode(searchCode)
                                .build();

                Page<AppointmentSummaryDTO> appointments = listService.getAppointments(
                                criteria, page, size, sortBy, sortDirection);

                return ResponseEntity.ok(appointments);
        }

        /**
         * P3.4: Get Appointment Detail by Code
         *
         * GET /api/v1/appointments/{appointmentCode}
         *
         * Authorization & RBAC Logic:
         * - Users with VIEW_APPOINTMENT_ALL (Receptionist/Admin):
         * Can see any appointment details
         *
         * - Users with VIEW_APPOINTMENT_OWN (Doctor/Patient):
         * - Patients: Can only view their own appointments
         * - Doctors: Can view if they are primary doctor OR participant
         *
         * Response includes:
         * - All fields from list view (AppointmentSummaryDTO)
         * - Additional fields: actualStartTime, actualEndTime, createdBy, createdAt
         * - Full patient info (with phone, DOB)
         * - Services list
         * - Participants list
         *
         * @param appointmentCode Unique appointment code (e.g., "APT-20251104-001")
         * @return 200 OK with appointment details
         * @throws com.dental.clinic.management.exception.ResourceNotFoundException 404
         *                                                                          if
         *                                                                          not
         *                                                                          found
         * @throws org.springframework.security.access.AccessDeniedException        403
         *                                                                          if
         *                                                                          no
         *                                                                          permission
         */
        @Operation(
            summary = "Get appointment detail",
            description = "Retrieve complete details of a specific appointment including patient, doctor, services, and participants"
        )
        @GetMapping("/{appointmentCode}")
        @PreAuthorize("hasAnyAuthority('VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_OWN')")
        public ResponseEntity<AppointmentDetailDTO> getAppointmentDetail(
                        @PathVariable String appointmentCode) {

                log.info("Fetching appointment detail for code: {}", appointmentCode);

                AppointmentDetailDTO appointment = detailService.getAppointmentDetail(appointmentCode);

                return ResponseEntity.ok(appointment);
        }

        /**
         * P3.5: Update Appointment Status (Check-in, Complete, Cancel, No-Show)
         *
         * PATCH /api/v1/appointments/{appointmentCode}/status
         *
         * This is the MOST CRITICAL API for daily clinic operations.
         *
         * Features:
         * - Pessimistic locking (SELECT FOR UPDATE) to prevent race conditions
         * - State machine validation with clear transition rules
         * - Auto-update actualStartTime/actualEndTime based on transitions
         * - Comprehensive audit logging for compliance
         *
         * State Machine:
         * - SCHEDULED → CHECKED_IN, CANCELLED, NO_SHOW
         * - CHECKED_IN → IN_PROGRESS, CANCELLED
         * - IN_PROGRESS → COMPLETED, CANCELLED
         * - COMPLETED, CANCELLED, NO_SHOW → No transitions (terminal states)
         *
         * Timestamp Rules:
         * - CHECKED_IN: No timestamp update (patient arrived, waiting)
         * - IN_PROGRESS: Set actualStartTime = NOW() (treatment started)
         * - COMPLETED: Set actualEndTime = NOW() (treatment finished)
         *
         * Request Body Examples:
         * - Check-in: {"status": "CHECKED_IN", "notes": "Đến trễ 10 phút"}
         * - Cancel: {"status": "CANCELLED", "reasonCode": "PATIENT_REQUEST", "notes":
         * "Bận đột xuất"}
         * - No-show: {"status": "NO_SHOW", "notes": "Gọi 3 cuộc không nghe máy"}
         *
         * @param appointmentCode Unique appointment code
         * @param request         Status update request with status, reasonCode (for
         *                        CANCELLED), notes
         * @return 200 OK with updated appointment details (same structure as GET
         *         detail)
         * @throws com.dental.clinic.management.exception.ResourceNotFoundException 404
         *                                                                          if
         *                                                                          not
         *                                                                          found
         * @throws com.dental.clinic.management.exception.BusinessException         409
         *                                                                          if
         *                                                                          invalid
         *                                                                          state
         *                                                                          transition
         * @throws com.dental.clinic.management.exception.BusinessException         400
         *                                                                          if
         *                                                                          reasonCode
         *                                                                          missing
         *                                                                          for
         *                                                                          CANCELLED
         */
        @Operation(
            summary = "Update appointment status",
            description = "Update appointment status with state machine validation (e.g., SCHEDULED to CHECKED_IN, COMPLETED, CANCELLED)"
        )
        @PatchMapping("/{appointmentCode}/status")
        @PreAuthorize("hasAuthority('UPDATE_APPOINTMENT_STATUS')")
        public ResponseEntity<AppointmentDetailDTO> updateAppointmentStatus(
                        @PathVariable String appointmentCode,
                        @Valid @RequestBody UpdateAppointmentStatusRequest request) {

                log.info("Updating appointment status: code={}, newStatus={}", appointmentCode, request.getStatus());

                // Update status (write transaction) - this commits when method returns
                statusService.updateStatus(appointmentCode, request);
                
                // Small delay to ensure transaction commit is fully processed
                // This prevents reading stale data from uncommitted transaction
                try {
                        Thread.sleep(50); // 50ms delay
                } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                }
                
                // Fetch updated details (read transaction - must be AFTER write commits)
                AppointmentDetailDTO updatedAppointment = detailService.getAppointmentDetail(appointmentCode);

                return ResponseEntity.ok(updatedAppointment);
        }

        /**
         * P3.6: Delay Appointment
         *
         * PATCH /api/v1/appointments/{appointmentCode}/delay
         *
         * Permission: DELAY_APPOINTMENT
         *
         * Business Rules:
         * - Only SCHEDULED or CHECKED_IN can be delayed
         * - New start time must be after original
         * - Checks conflicts for doctor, room, patient, participants
         * - Creates audit log with DELAY action
         *
         * @param appointmentCode Appointment code (e.g., APT-20251115-001)
         * @param request         newStartTime, reasonCode, notes
         * @return Updated appointment detail
         */
        @Operation(
            summary = "Delay appointment",
            description = "Delay appointment start time within same day with conflict validation and audit logging"
        )
        @PatchMapping("/{appointmentCode}/delay")
        @PreAuthorize("hasAuthority('DELAY_APPOINTMENT')")
        public ResponseEntity<AppointmentDetailDTO> delayAppointment(
                        @PathVariable String appointmentCode,
                        @Valid @RequestBody DelayAppointmentRequest request) {

                log.info("Delaying appointment: code={}, newStartTime={}", appointmentCode, request.getNewStartTime());

                AppointmentDetailDTO delayedAppointment = delayService.delayAppointment(appointmentCode, request);

                return ResponseEntity.ok(delayedAppointment);
        }

        /**
         * P3.7: Reschedule Appointment
         *
         * POST /api/v1/appointments/{appointmentCode}/reschedule
         *
         * Permission: CREATE_APPOINTMENT (since it creates new appointment)
         *
         * Business: Cancel old appointment and create new one with new
         * time/doctor/room.
         * - Patient remains same
         * - Services can be changed (optional) or reused from old appointment
         * - Both appointments linked via rescheduled_to_appointment_id
         * - Creates audit logs for both (RESCHEDULE_SOURCE and RESCHEDULE_TARGET)
         *
         * @param appointmentCode Old appointment code to reschedule
         * @param request         New appointment details + cancellation reason
         * @return Both old (cancelled) and new (scheduled) appointments
         */
        @Operation(
            summary = "Reschedule appointment",
            description = "Reschedule appointment to new date/time/doctor/room by cancelling old and creating new appointment with linking"
        )
        @PostMapping("/{appointmentCode}/reschedule")
        @PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
        public ResponseEntity<RescheduleAppointmentResponse> rescheduleAppointment(
                        @PathVariable String appointmentCode,
                        @Valid @RequestBody RescheduleAppointmentRequest request) {

                log.info("Rescheduling appointment: code={}, newStartTime={}",
                                appointmentCode, request.getNewStartTime());

                RescheduleAppointmentResponse response = rescheduleService.rescheduleAppointment(
                                appointmentCode, request);

                return ResponseEntity.ok(response);
        }

}
