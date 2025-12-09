package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.dto.request.AvailableTimesRequest;
import com.dental.clinic.management.booking_appointment.dto.response.AvailableTimesResponse;
import com.dental.clinic.management.booking_appointment.dto.response.TimeSlotDTO;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.DentalService;
import com.dental.clinic.management.booking_appointment.domain.Room;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentParticipantRepository;
import com.dental.clinic.management.booking_appointment.repository.BookingDentalServiceRepository;
import com.dental.clinic.management.booking_appointment.repository.RoomRepository;
import com.dental.clinic.management.booking_appointment.repository.RoomServiceRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.working_schedule.domain.EmployeeShift;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for finding available appointment time slots
 * Implements the complex intersection algorithm for resource availability
 *
 * Algorithm Steps (as per P3.1 spec):
 * 1. Validate inputs (date, employee, services, participants)
 * 2. Calculate total duration (sum of service durations + buffers)
 * 3. Check doctor specialization
 * 4. Filter compatible rooms (room_services)
 * 5. Collect availability (shifts & busy times)
 * 6. Find intersection (doctor + assistants + rooms available)
 * 7. Split into slots and return with available rooms
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentAvailabilityService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentParticipantRepository participantRepository;
    private final BookingDentalServiceRepository serviceRepository;
    private final RoomRepository roomRepository;
    private final RoomServiceRepository roomServiceRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeShiftRepository shiftRepository;

    private static final int SLOT_INTERVAL_MINUTES = 15; // Split slots every 15 minutes
    private static final List<AppointmentStatus> BUSY_STATUSES = Arrays.asList(
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS);

    @Transactional(readOnly = true)
    public AvailableTimesResponse findAvailableTimes(AvailableTimesRequest request) {
        log.info("Finding available times for date={}, employeeCode={}, services={}",
                request.getDate(), request.getEmployeeCode(), request.getServiceCodes());

        // STEP 1: Validate Inputs
        LocalDate requestedDate = validateAndParseDate(request.getDate());
        var employee = validateEmployee(request.getEmployeeCode());
        var services = validateServices(request.getServiceCodes());
        var participants = validateParticipants(request.getParticipantCodes());

        // STEP 2: Calculate Total Duration
        int totalDuration = calculateTotalDuration(services);
        log.debug("Total duration needed: {} minutes", totalDuration);

        // STEP 3: Check Doctor Specialization
        validateDoctorSpecialization(employee, services);

        // STEP 4: Filter Compatible Rooms
        List<Integer> serviceIds = services.stream()
                .map(DentalService::getServiceId)
                .collect(Collectors.toList());
        var compatibleRooms = findCompatibleRooms(serviceIds);

        if (compatibleRooms.isEmpty()) {
            return AvailableTimesResponse.builder()
                    .totalDurationNeeded(totalDuration)
                    .availableSlots(Collections.emptyList())
                    .message("Không có phòng nào hỗ trợ các dịch vụ này")
                    .build();
        }

        log.debug("Found {} compatible rooms", compatibleRooms.size());

        // STEP 5 & 6: Collect Availability & Find Intersection
        // Note: compatibleRooms uses String roomId, need to convert for internal query
        List<String> compatibleRoomIds = compatibleRooms.stream()
                .map(Room::getRoomId)
                .collect(Collectors.toList());

        List<TimeInterval> freeIntervals = findFreeIntervals(
                requestedDate,
                employee.getEmployeeId(),
                participants.stream().map(e -> e.getEmployeeId()).collect(Collectors.toList()),
                compatibleRoomIds,
                totalDuration);

        // STEP 7: Split into Slots & Map Rooms
        List<TimeSlotDTO> slots = splitIntoSlotsWithRooms(
                freeIntervals,
                compatibleRooms,
                totalDuration,
                requestedDate);

        // STEP 8: Sort by start time chronologically
        slots.sort(Comparator.comparing(TimeSlotDTO::getStartTime));

        return AvailableTimesResponse.builder()
                .totalDurationNeeded(totalDuration)
                .availableSlots(slots)
                .build();
    }

    /**
     * Validate and parse date (must not be in past)
     */
    private LocalDate validateAndParseDate(String dateStr) {
        LocalDate date;
        try {
            date = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new BadRequestAlertException(
                    "Invalid date format: " + dateStr,
                    "appointment",
                    "INVALID_DATE");
        }

        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestAlertException(
                    "Cannot search for past dates: " + dateStr,
                    "appointment",
                    "DATE_IN_PAST");
        }

        return date;
    }

    /**
     * Validate employee exists and is active
     */
    private com.dental.clinic.management.employee.domain.Employee validateEmployee(String employeeCode) {
        com.dental.clinic.management.employee.domain.Employee employee = employeeRepository
                .findByEmployeeCodeAndIsActiveTrue(employeeCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Employee not found or inactive: " + employeeCode,
                        "appointment",
                        "EMPLOYEE_NOT_FOUND"));

        // CRITICAL: Validate employee has STANDARD specialization (ID 8) - is medical
        // staff
        // Admin/Receptionist without STANDARD (ID 8) cannot be assigned to appointments
        boolean hasStandardSpecialization = employee.getSpecializations() != null &&
                employee.getSpecializations().stream()
                        .anyMatch(spec -> spec.getSpecializationId() == 8);

        if (!hasStandardSpecialization) {
            throw new BadRequestAlertException(
                    "Employee must have STANDARD specialization (ID 8) to be assigned to appointments. " +
                            "Employee " + employeeCode
                            + " does not have STANDARD specialization (Admin/Receptionist cannot be assigned)",
                    "appointment",
                    "EMPLOYEE_NOT_MEDICAL_STAFF");
        }

        return employee;
    }

    /**
     * Validate all services exist and are active
     */
    private List<DentalService> validateServices(List<String> serviceCodes) {
        List<DentalService> services = serviceRepository.findByServiceCodeIn(serviceCodes);

        if (services.size() != serviceCodes.size()) {
            Set<String> foundCodes = services.stream()
                    .map(DentalService::getServiceCode)
                    .collect(Collectors.toSet());
            List<String> missing = serviceCodes.stream()
                    .filter(code -> !foundCodes.contains(code))
                    .collect(Collectors.toList());

            throw new BadRequestAlertException(
                    "Services not found: " + String.join(", ", missing),
                    "appointment",
                    "SERVICES_NOT_FOUND");
        }

        // Check all active
        List<String> inactiveServices = services.stream()
                .filter(s -> !s.getIsActive())
                .map(DentalService::getServiceCode)
                .collect(Collectors.toList());

        if (!inactiveServices.isEmpty()) {
            throw new BadRequestAlertException(
                    "Services are inactive: " + String.join(", ", inactiveServices),
                    "appointment",
                    "SERVICES_INACTIVE");
        }

        return services;
    }

    /**
     * Validate participants (optional)
     */
    private List<com.dental.clinic.management.employee.domain.Employee> validateParticipants(
            List<String> participantCodes) {
        if (participantCodes == null || participantCodes.isEmpty()) {
            return Collections.emptyList();
        }

        List<com.dental.clinic.management.employee.domain.Employee> participants = new ArrayList<>();
        List<String> nonMedicalStaff = new ArrayList<>();

        for (String code : participantCodes) {
            var emp = employeeRepository.findByEmployeeCodeAndIsActiveTrue(code)
                    .orElseThrow(() -> new BadRequestAlertException(
                            "Participant not found or inactive: " + code,
                            "appointment",
                            "PARTICIPANT_NOT_FOUND"));

            // CRITICAL: Validate participant has STANDARD specialization (ID 8) - is
            // medical staff
            boolean hasStandardSpecialization = emp.getSpecializations() != null &&
                    emp.getSpecializations().stream()
                            .anyMatch(spec -> spec.getSpecializationId() == 8);

            if (!hasStandardSpecialization) {
                nonMedicalStaff.add(code);
            } else {
                participants.add(emp);
            }
        }

        if (!nonMedicalStaff.isEmpty()) {
            throw new BadRequestAlertException(
                    "Participants must have STANDARD specialization (ID 8). " +
                            "The following employees do not have STANDARD specialization (Admin/Receptionist cannot be participants): "
                            +
                            String.join(", ", nonMedicalStaff),
                    "appointment",
                    "PARTICIPANT_NOT_MEDICAL_STAFF");
        }

        return participants;
    }

    /**
     * Calculate total duration: SUM(duration + buffer)
     */
    private int calculateTotalDuration(List<DentalService> services) {
        return services.stream()
                .mapToInt(s -> s.getDefaultDurationMinutes() + s.getDefaultBufferMinutes())
                .sum();
    }

    /**
     * Check if doctor has specialization for all services
     * NOTE: This is a simplified version. In production, you'd check
     * employee_specializations table
     */
    private void validateDoctorSpecialization(
            com.dental.clinic.management.employee.domain.Employee employee,
            List<DentalService> services) {

        // Get service specialization IDs
        Set<Integer> requiredSpecializations = services.stream()
                .map(DentalService::getSpecialization)
                .filter(Objects::nonNull)
                .map(spec -> spec.getSpecializationId())
                .collect(Collectors.toSet());

        if (requiredSpecializations.isEmpty()) {
            return; // No specialization required
        }

        // Get employee specialization IDs
        Set<Integer> employeeSpecializations = employee.getSpecializations().stream()
                .map(s -> s.getSpecializationId())
                .collect(Collectors.toSet());

        // Check if employee has ALL required specializations
        if (!employeeSpecializations.containsAll(requiredSpecializations)) {
            throw new BadRequestAlertException(
                    "Employee does not have required specializations for these services",
                    "appointment",
                    "EMPLOYEE_NOT_QUALIFIED");
        }
    }

    /**
     * Find rooms that are compatible with ALL services
     * Uses room_services junction table (V16)
     */
    private List<Room> findCompatibleRooms(List<Integer> serviceIds) {
        // Get all rooms that support ALL services
        List<String> roomIds = roomServiceRepository.findRoomsSupportingAllServices(
                serviceIds,
                serviceIds.size());

        if (roomIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Get full Room objects
        return roomRepository.findByRoomIdInAndIsActiveTrue(roomIds);
    }

    /**
     * Find free time intervals using intersection algorithm
     *
     * Logic:
     * 1. Get doctor's work shifts (source of truth)
     * 2. Subtract doctor's busy appointments
     * 3. Subtract participants' busy times
     * 4. For each interval, check if at least 1 compatible room is free
     * 5. Return intervals >= totalDuration
     */
    private List<TimeInterval> findFreeIntervals(
            LocalDate date,
            Integer doctorId,
            List<Integer> participantIds,
            List<String> compatibleRoomIds,
            int totalDuration) {

        // 1. Get doctor's work shifts for this date
        List<EmployeeShift> doctorShifts = shiftRepository.findByEmployeeAndDate(doctorId, date);

        if (doctorShifts.isEmpty()) {
            log.debug("Doctor has no shifts on {}", date);
            return Collections.emptyList();
        }

        List<TimeInterval> freeIntervals = new ArrayList<>();

        for (EmployeeShift shift : doctorShifts) {
            LocalDateTime shiftStart = LocalDateTime.of(shift.getWorkDate(), shift.getWorkShift().getStartTime());
            LocalDateTime shiftEnd = LocalDateTime.of(shift.getWorkDate(), shift.getWorkShift().getEndTime());

            List<TimeInterval> shiftIntervals = Collections.singletonList(
                    new TimeInterval(shiftStart, shiftEnd));

            // 2. Subtract doctor's busy appointments
            List<Appointment> doctorAppointments = appointmentRepository.findByEmployeeAndTimeRange(
                    doctorId, shiftStart, shiftEnd, BUSY_STATUSES);
            shiftIntervals = subtractBusyTimes(shiftIntervals, doctorAppointments);

            // 3. Subtract participants' busy times (both as primary doctor and as
            // participant)
            for (Integer participantId : participantIds) {
                // As primary doctor
                List<Appointment> participantAsDoctor = appointmentRepository.findByEmployeeAndTimeRange(
                        participantId, shiftStart, shiftEnd, BUSY_STATUSES);
                shiftIntervals = subtractBusyTimes(shiftIntervals, participantAsDoctor);

                // As participant
                var participantAppointments = participantRepository.findByEmployeeAndTimeRange(
                        participantId, shiftStart, shiftEnd);
                shiftIntervals = subtractParticipantBusyTimes(shiftIntervals, participantAppointments);
            }

            // Filter intervals >= totalDuration
            shiftIntervals = shiftIntervals.stream()
                    .filter(interval -> interval.getDurationMinutes() >= totalDuration)
                    .collect(Collectors.toList());

            freeIntervals.addAll(shiftIntervals);
        }

        return freeIntervals;
    }

    /**
     * Subtract busy appointment times from free intervals
     */
    private List<TimeInterval> subtractBusyTimes(
            List<TimeInterval> freeIntervals,
            List<Appointment> busyAppointments) {

        List<TimeInterval> result = new ArrayList<>(freeIntervals);

        for (Appointment appointment : busyAppointments) {
            TimeInterval busy = new TimeInterval(
                    appointment.getAppointmentStartTime(),
                    appointment.getAppointmentEndTime());

            List<TimeInterval> newResult = new ArrayList<>();
            for (TimeInterval free : result) {
                newResult.addAll(free.subtract(busy));
            }
            result = newResult;
        }

        return result;
    }

    /**
     * Subtract participant busy times
     */
    private List<TimeInterval> subtractParticipantBusyTimes(
            List<TimeInterval> freeIntervals,
            List<com.dental.clinic.management.booking_appointment.domain.AppointmentParticipant> participants) {

        // This would need to join with Appointment to get times
        // Simplified for now - implementation would query appointments through
        // participant IDs
        return freeIntervals;
    }

    /**
     * Split free intervals into time slots and check room availability for each
     * slot
     */
    private List<TimeSlotDTO> splitIntoSlotsWithRooms(
            List<TimeInterval> freeIntervals,
            List<Room> compatibleRooms,
            int totalDuration,
            LocalDate date) {

        List<TimeSlotDTO> slots = new ArrayList<>();

        for (TimeInterval interval : freeIntervals) {
            LocalDateTime slotTime = interval.start;

            while (slotTime.plusMinutes(totalDuration).isBefore(interval.end) ||
                    slotTime.plusMinutes(totalDuration).isEqual(interval.end)) {

                // Check which rooms are available at this specific slot
                List<String> availableRoomCodes = findAvailableRoomsAtTime(
                        compatibleRooms,
                        slotTime,
                        slotTime.plusMinutes(totalDuration));

                if (!availableRoomCodes.isEmpty()) {
                    slots.add(TimeSlotDTO.builder()
                            .startTime(slotTime)
                            .availableCompatibleRoomCodes(availableRoomCodes)
                            .build());
                }

                slotTime = slotTime.plusMinutes(SLOT_INTERVAL_MINUTES);
            }
        }

        return slots;
    }

    /**
     * Find which compatible rooms are free at a specific time slot
     * Filters out rooms that have conflicting appointments
     */
    private List<String> findAvailableRoomsAtTime(
            List<Room> compatibleRooms,
            LocalDateTime startTime,
            LocalDateTime endTime) {

        return compatibleRooms.stream()
                .filter(room -> !appointmentRepository.existsConflictForRoom(
                        room.getRoomId(),
                        startTime,
                        endTime,
                        null)) // No appointment to exclude in availability check
                .map(Room::getRoomCode)
                .collect(Collectors.toList());
    }

    /**
     * Time Interval Helper Class
     * Represents a continuous free time period
     */
    private static class TimeInterval {
        LocalDateTime start;
        LocalDateTime end;

        TimeInterval(LocalDateTime start, LocalDateTime end) {
            this.start = start;
            this.end = end;
        }

        int getDurationMinutes() {
            return (int) java.time.Duration.between(start, end).toMinutes();
        }

        /**
         * Subtract a busy interval from this free interval
         * Returns 0, 1, or 2 new intervals depending on overlap
         */
        List<TimeInterval> subtract(TimeInterval busy) {
            // No overlap
            if (busy.end.isBefore(this.start) || busy.end.isEqual(this.start) ||
                    busy.start.isAfter(this.end) || busy.start.isEqual(this.end)) {
                return Collections.singletonList(this);
            }

            // Busy completely covers free
            if (busy.start.isBefore(this.start) && busy.end.isAfter(this.end)) {
                return Collections.emptyList();
            }

            // Busy at start
            if (busy.start.isBefore(this.start) || busy.start.isEqual(this.start)) {
                return Collections.singletonList(new TimeInterval(busy.end, this.end));
            }

            // Busy at end
            if (busy.end.isAfter(this.end) || busy.end.isEqual(this.end)) {
                return Collections.singletonList(new TimeInterval(this.start, busy.start));
            }

            // Busy in middle - splits into 2 intervals
            return Arrays.asList(
                    new TimeInterval(this.start, busy.start),
                    new TimeInterval(busy.end, this.end));
        }
    }
}
