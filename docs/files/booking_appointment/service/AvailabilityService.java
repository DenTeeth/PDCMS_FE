package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.DentalService;
import com.dental.clinic.management.booking_appointment.domain.Room;
import com.dental.clinic.management.booking_appointment.dto.availability.AvailableDoctorDTO;
import com.dental.clinic.management.booking_appointment.dto.availability.AvailableResourcesDTO;
import com.dental.clinic.management.booking_appointment.dto.availability.TimeSlotDTO;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.*;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.working_schedule.domain.EmployeeShift;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for Availability APIs (Step-by-step booking flow)
 * Helps receptionists discover available resources progressively
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilityService {

        private final EmployeeRepository employeeRepository;
        private final BookingDentalServiceRepository dentalServiceRepository;
        private final RoomRepository roomRepository;
        private final RoomServiceRepository roomServiceRepository;
        private final EmployeeShiftRepository employeeShiftRepository;
        private final AppointmentRepository appointmentRepository;
        private final AppointmentParticipantRepository appointmentParticipantRepository;

        private static final String ENTITY_NAME = "availability";

        /**
         * API 4.1: Get Available Doctors
         * Returns doctors who have required specializations AND shifts on the date
         *
         * @param date         Selected date (YYYY-MM-DD)
         * @param serviceCodes List of service codes
         * @return List of available doctors with their shifts
         */
        @Transactional(readOnly = true)
        public List<AvailableDoctorDTO> getAvailableDoctors(LocalDate date, List<String> serviceCodes) {
                log.info("Finding available doctors for date: {}, services: {}", date, serviceCodes);

                // 1. Validate services exist
                List<DentalService> services = dentalServiceRepository.findByServiceCodeIn(serviceCodes);
                if (services.size() != serviceCodes.size()) {
                        throw new BadRequestAlertException("One or more services not found", ENTITY_NAME,
                                        "SERVICES_NOT_FOUND");
                }

                // 2. Get required specialization IDs (filter out services without specialization requirement)
                Set<Integer> requiredSpecIds = services.stream()
                                .filter(s -> s.getSpecialization() != null) // Some services don't require specialization
                                .map(s -> s.getSpecialization().getSpecializationId())
                                .collect(Collectors.toSet());

                log.debug("Required specialization IDs: {}", requiredSpecIds);

                // 3. Get all active medical staff (dentists, nurses, interns) only
                List<Employee> allMedicalStaff = employeeRepository.findByIsActiveTrue().stream()
                                .filter(Employee::isMedicalStaff)
                                .collect(Collectors.toList());

                // 4. Filter doctors who have ALL required specializations
                // If no specialization required, all medical staff qualify
                List<Employee> qualifiedDoctors = allMedicalStaff.stream()
                                .filter(doctor -> {
                                        // If no specialization required, any medical staff can do it
                                        if (requiredSpecIds.isEmpty()) {
                                                return true;
                                        }
                                        
                                        // If doctor has no specializations (nurse), can't do specialized services
                                        if (doctor.getSpecializations() == null || doctor.getSpecializations().isEmpty()) {
                                                return false;
                                        }
                                        
                                        Set<Integer> doctorSpecIds = doctor.getSpecializations().stream()
                                                        .map(Specialization::getSpecializationId)
                                                        .collect(Collectors.toSet());
                                        return doctorSpecIds.containsAll(requiredSpecIds);
                                })
                                .collect(Collectors.toList());

                log.debug("Found {} qualified doctors", qualifiedDoctors.size());

                // 5. Filter doctors who have shifts on the selected date
                List<AvailableDoctorDTO> result = new ArrayList<>();

                for (Employee doctor : qualifiedDoctors) {
                        List<EmployeeShift> shifts = employeeShiftRepository.findByEmployeeAndDate(
                                        doctor.getEmployeeId(), date);

                        if (!shifts.isEmpty()) {
                                // Format shift times: "08:00-12:00"
                                List<String> shiftTimes = shifts.stream()
                                                .map(shift -> String.format("%s-%s",
                                                                shift.getWorkShift().getStartTime().format(
                                                                                DateTimeFormatter.ofPattern("HH:mm")),
                                                                shift.getWorkShift().getEndTime().format(
                                                                                DateTimeFormatter.ofPattern("HH:mm"))))
                                                .collect(Collectors.toList());

                                List<String> specNames = doctor.getSpecializations().stream()
                                                .map(Specialization::getSpecializationName)
                                                .collect(Collectors.toList());

                                result.add(AvailableDoctorDTO.builder()
                                                .employeeCode(doctor.getEmployeeCode())
                                                .fullName(doctor.getFullName())
                                                .specializations(specNames)
                                                .shiftTimes(shiftTimes)
                                                .build());
                        }
                }

                log.info("Found {} available doctors with shifts on {}", result.size(), date);
                return result;
        }

        /**
         * API 4.2: Get Available Time Slots
         * Returns time gaps when doctor is free
         *
         * @param date            Selected date
         * @param employeeCode    Doctor's employee code
         * @param durationMinutes Required duration
         * @return List of available time slots
         */
        @Transactional(readOnly = true)
        public List<TimeSlotDTO> getAvailableTimeSlots(LocalDate date, String employeeCode, int durationMinutes) {
                log.info("Finding time slots for doctor: {}, date: {}, duration: {} min",
                                employeeCode, date, durationMinutes);

                // 1. Validate doctor exists and is active
                Employee doctor = employeeRepository.findByEmployeeCodeAndIsActiveTrue(employeeCode)
                                .orElseThrow(() -> new BadRequestAlertException(
                                                "Doctor not found or inactive: " + employeeCode,
                                                ENTITY_NAME,
                                                "EMPLOYEE_NOT_FOUND"));

                // 2. Get doctor's shifts on this date
                List<EmployeeShift> shifts = employeeShiftRepository.findByEmployeeAndDate(
                                doctor.getEmployeeId(), date);

                if (shifts.isEmpty()) {
                        log.info("Doctor {} has no shift on {}", employeeCode, date);
                        return new ArrayList<>();
                }

                // 3. Get all active appointments for this doctor on this date
                LocalDateTime dayStart = date.atStartOfDay();
                LocalDateTime dayEnd = date.atTime(23, 59, 59);

                List<AppointmentStatus> activeStatuses = Arrays.asList(
                                AppointmentStatus.SCHEDULED,
                                AppointmentStatus.CHECKED_IN,
                                AppointmentStatus.IN_PROGRESS);

                List<Appointment> appointments = appointmentRepository.findByEmployeeAndTimeRange(
                                doctor.getEmployeeId(), dayStart, dayEnd, activeStatuses);

                // Sort appointments by start time
                appointments.sort(Comparator.comparing(Appointment::getAppointmentStartTime));

                // 4. Find gaps in schedule
                List<TimeSlotDTO> availableSlots = new ArrayList<>();

                for (EmployeeShift shift : shifts) {
                        LocalTime shiftStart = shift.getWorkShift().getStartTime();
                        LocalTime shiftEnd = shift.getWorkShift().getEndTime();

                        // Find gaps within this shift
                        List<TimeSlotDTO> slotInShift = findGapsInShift(
                                        date, shiftStart, shiftEnd, appointments, durationMinutes);
                        availableSlots.addAll(slotInShift);
                }

                // 5. Mark first slot as "suggested"
                if (!availableSlots.isEmpty()) {
                        availableSlots.get(0).setSuggested(true);
                }

                log.info("Found {} available time slots", availableSlots.size());
                return availableSlots;
        }

        /**
         * Helper: Find time gaps within a shift
         */
        private List<TimeSlotDTO> findGapsInShift(LocalDate date, LocalTime shiftStart, LocalTime shiftEnd,
                        List<Appointment> appointments, int durationMinutes) {
                List<TimeSlotDTO> gaps = new ArrayList<>();
                LocalTime currentTime = shiftStart;

                // Filter appointments within this shift
                List<Appointment> shiftAppointments = appointments.stream()
                                .filter(apt -> {
                                        LocalTime aptStart = apt.getAppointmentStartTime().toLocalTime();
                                        LocalTime aptEnd = apt.getAppointmentEndTime().toLocalTime();
                                        return !aptEnd.isBefore(shiftStart) && !aptStart.isAfter(shiftEnd);
                                })
                                .collect(Collectors.toList());

                for (Appointment apt : shiftAppointments) {
                        LocalTime aptStart = apt.getAppointmentStartTime().toLocalTime();
                        LocalTime aptEnd = apt.getAppointmentEndTime().toLocalTime();

                        // Check if there's a gap before this appointment
                        long gapMinutes = java.time.Duration.between(currentTime, aptStart).toMinutes();

                        if (gapMinutes >= durationMinutes) {
                                gaps.add(TimeSlotDTO.builder()
                                                .start(currentTime)
                                                .end(aptStart)
                                                .suggested(false)
                                                .build());
                        }

                        // Move currentTime to end of this appointment
                        currentTime = aptEnd.isAfter(currentTime) ? aptEnd : currentTime;
                }

                // Check if there's a gap after last appointment until shift end
                long finalGapMinutes = java.time.Duration.between(currentTime, shiftEnd).toMinutes();
                if (finalGapMinutes >= durationMinutes) {
                        gaps.add(TimeSlotDTO.builder()
                                        .start(currentTime)
                                        .end(shiftEnd)
                                        .suggested(false)
                                        .build());
                }

                return gaps;
        }

        /**
         * API 4.3: Get Available Resources (Rooms + Assistants)
         *
         * @param startTime    Appointment start time
         * @param endTime      Appointment end time
         * @param serviceCodes Service codes (to check room compatibility)
         * @return Available rooms and assistants
         */
        @Transactional(readOnly = true)
        public AvailableResourcesDTO getAvailableResources(
                        LocalDateTime startTime, LocalDateTime endTime, List<String> serviceCodes) {
                log.info("Finding available resources for time: {} to {}, services: {}",
                                startTime, endTime, serviceCodes);

                // 1. Validate services
                List<DentalService> services = dentalServiceRepository.findByServiceCodeIn(serviceCodes);
                if (services.size() != serviceCodes.size()) {
                        throw new BadRequestAlertException("One or more services not found", ENTITY_NAME,
                                        "SERVICES_NOT_FOUND");
                }

                List<Integer> serviceIds = services.stream()
                                .map(DentalService::getServiceId)
                                .collect(Collectors.toList());

                // 2. Find rooms that support ALL services
                List<String> compatibleRoomIds = roomServiceRepository.findRoomsSupportingAllServices(
                                serviceIds, serviceIds.size());

                List<Room> allRooms = roomRepository.findAllById(compatibleRoomIds);

                // 3. Filter rooms that are NOT booked during this time
                List<AppointmentStatus> activeStatuses = Arrays.asList(
                                AppointmentStatus.SCHEDULED,
                                AppointmentStatus.CHECKED_IN,
                                AppointmentStatus.IN_PROGRESS);

                List<AvailableResourcesDTO.RoomBrief> availableRooms = new ArrayList<>();

                for (Room room : allRooms) {
                        if (!room.getIsActive())
                                continue;

                        List<Appointment> conflicts = appointmentRepository.findByRoomAndTimeRange(
                                        room.getRoomId(), startTime, endTime, activeStatuses);

                        if (conflicts.isEmpty()) {
                                availableRooms.add(AvailableResourcesDTO.RoomBrief.builder()
                                                .roomCode(room.getRoomCode())
                                                .roomName(room.getRoomName())
                                                .build());
                        }
                }

                // 4. Find assistants (medical staff: dentists, nurses, interns) who have shifts and are free
                LocalDate date = startTime.toLocalDate();

                List<Employee> allMedicalStaff = employeeRepository.findByIsActiveTrue().stream()
                                .filter(Employee::isMedicalStaff)
                                .collect(Collectors.toList());

                List<AvailableResourcesDTO.AssistantBrief> availableAssistants = new ArrayList<>();

                for (Employee assistant : allMedicalStaff) {
                        // Check if has shift covering the time range
                        List<EmployeeShift> shifts = employeeShiftRepository.findByEmployeeAndDate(
                                        assistant.getEmployeeId(), date);

                        boolean hasShiftCoverage = shifts.stream().anyMatch(shift -> {
                                LocalDateTime shiftStart = LocalDateTime.of(shift.getWorkDate(),
                                                shift.getWorkShift().getStartTime());
                                LocalDateTime shiftEnd = LocalDateTime.of(shift.getWorkDate(),
                                                shift.getWorkShift().getEndTime());
                                return !startTime.isBefore(shiftStart) && !endTime.isAfter(shiftEnd);
                        });

                        if (!hasShiftCoverage)
                                continue;

                        // Check if free (not busy as primary doctor or participant)
                        boolean busyAsPrimary = appointmentRepository.existsConflictForEmployee(
                                        assistant.getEmployeeId(), startTime, endTime);

                        boolean busyAsParticipant = appointmentParticipantRepository.existsConflictForParticipant(
                                        assistant.getEmployeeId(), startTime, endTime);

                        if (!busyAsPrimary && !busyAsParticipant) {
                                availableAssistants.add(AvailableResourcesDTO.AssistantBrief.builder()
                                                .employeeCode(assistant.getEmployeeCode())
                                                .fullName(assistant.getFullName())
                                                .build());
                        }
                }

                log.info("Found {} rooms, {} assistants", availableRooms.size(), availableAssistants.size());

                return AvailableResourcesDTO.builder()
                                .availableRooms(availableRooms)
                                .availableAssistants(availableAssistants)
                                .build();
        }
}
