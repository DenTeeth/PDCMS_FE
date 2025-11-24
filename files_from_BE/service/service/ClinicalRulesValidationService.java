package com.dental.clinic.management.service.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.AppointmentService;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentServiceRepository;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.service.domain.DependencyRuleType;
import com.dental.clinic.management.service.domain.ServiceDependency;
import com.dental.clinic.management.service.repository.ServiceDependencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Clinical Rules Validation Service (V21)
 *
 * Core business logic for enforcing clinical workflows and safety rules.
 * Validates service dependencies before appointment creation.
 *
 * <p>
 * <b>Validation Types:</b>
 * </p>
 * <ol>
 * <li><b>REQUIRES_PREREQUISITE</b>: Check patient history for prerequisite
 * service completion</li>
 * <li><b>REQUIRES_MIN_DAYS</b>: Enforce minimum days between service completion
 * and new booking</li>
 * <li><b>EXCLUDES_SAME_DAY</b>: Prevent dangerous service combinations on same
 * day</li>
 * <li><b>BUNDLES_WITH</b>: Suggest service bundles (soft rule, no
 * validation)</li>
 * </ol>
 *
 * @since V21
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClinicalRulesValidationService {

    private final ServiceDependencyRepository serviceDependencyRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentServiceRepository appointmentServiceRepository;

    /**
     * Validate all clinical rules for a new appointment booking
     *
     * Called by AppointmentCreationService BEFORE saving appointment.
     *
     * @param patientId       The patient ID
     * @param serviceIds      List of service IDs being booked
     * @param appointmentDate The appointment date
     * @throws ConflictException if any clinical rule is violated
     */
    @Transactional(readOnly = true)
    public void validateAppointmentServices(Integer patientId, List<Long> serviceIds, LocalDate appointmentDate) {
        log.info("V21: Validating clinical rules for patient {} booking {} services on {}",
                patientId, serviceIds.size(), appointmentDate);

        // Check 1: EXCLUDES_SAME_DAY - Services cannot be booked together
        validateNoExclusionConflicts(serviceIds);

        // Check 2: REQUIRES_PREREQUISITE - Each service's prerequisites must be
        // completed
        for (Long serviceId : serviceIds) {
            validatePrerequisites(patientId, serviceId);
        }

        // Check 3: REQUIRES_MIN_DAYS - Minimum days since prerequisite completion
        for (Long serviceId : serviceIds) {
            validateMinimumDays(patientId, serviceId, appointmentDate);
        }

        log.info("V21: ✅ All clinical rules passed for patient {} booking {} services",
                patientId, serviceIds.size());
    }

    /**
     * Validate EXCLUDES_SAME_DAY rules
     *
     * Example: Cannot book "Nhổ răng khôn" + "Tẩy trắng" together (dangerous)
     *
     * @param serviceIds List of services being booked
     * @throws ConflictException if exclusion rule violated
     */
    private void validateNoExclusionConflicts(List<Long> serviceIds) {
        if (serviceIds.size() < 2) {
            return; // No conflict possible with single service
        }

        List<ServiceDependency> exclusionRules = serviceDependencyRepository.findExclusionRulesForServices(serviceIds);

        if (!exclusionRules.isEmpty()) {
            ServiceDependency firstViolation = exclusionRules.get(0);
            String serviceName = firstViolation.getService().getServiceName();
            String dependentServiceName = firstViolation.getDependentService().getServiceName();
            String note = firstViolation.getReceptionistNote();

            String errorMsg = String.format(
                    "❌ VI PHẠM QUY TẮC LÂM SÀNG: Không thể đặt '%s' và '%s' cùng ngày. %s",
                    serviceName, dependentServiceName,
                    note != null ? note : "");

            log.error("V21: EXCLUDES_SAME_DAY rule violated: {} <-> {}",
                    serviceName, dependentServiceName);
            throw new ConflictException(errorMsg, "CLINICAL_RULE_EXCLUSION_VIOLATED");
        }
    }

    /**
     * Validate REQUIRES_PREREQUISITE rules
     *
     * Example: "Trám răng" requires "Khám tổng quát" to be completed first
     *
     * @param patientId The patient ID
     * @param serviceId The service being booked
     * @throws ConflictException if prerequisite not found
     */
    private void validatePrerequisites(Integer patientId, Long serviceId) {
        List<ServiceDependency> prerequisites = serviceDependencyRepository
                .findByServiceIdAndRuleType(serviceId, DependencyRuleType.REQUIRES_PREREQUISITE);

        if (prerequisites.isEmpty()) {
            return; // No prerequisites for this service
        }

        // Get patient's completed appointments
        List<Appointment> completedAppointments = appointmentRepository
                .findCompletedAppointmentsByPatientId(patientId);

        // Build set of completed service IDs by querying appointment_services
        // separately
        Set<Long> completedServiceIds = new HashSet<>();
        for (Appointment apt : completedAppointments) {
            List<AppointmentService> appointmentServices = appointmentServiceRepository
                    .findByIdAppointmentId(apt.getAppointmentId());

            for (AppointmentService as : appointmentServices) {
                completedServiceIds.add(as.getId().getServiceId().longValue());
            }
        }

        // Check each prerequisite
        for (ServiceDependency prereq : prerequisites) {
            Long prerequisiteServiceId = prereq.getDependentServiceId();

            if (!completedServiceIds.contains(prerequisiteServiceId)) {
                String serviceName = prereq.getService().getServiceName();
                String prerequisiteServiceName = prereq.getDependentService().getServiceName();
                String note = prereq.getReceptionistNote();

                String errorMsg = String.format(
                        "❌ VI PHẠM QUY TẮC LÂM SÀNG: Bệnh nhân chưa hoàn thành '%s' (tiền đề bắt buộc cho '%s'). %s",
                        prerequisiteServiceName, serviceName,
                        note != null ? note : "");

                log.error("V21: REQUIRES_PREREQUISITE rule violated: {} requires {}",
                        serviceName, prerequisiteServiceName);
                throw new ConflictException(errorMsg, "CLINICAL_RULE_PREREQUISITE_NOT_MET");
            }
        }

        log.debug("V21: ✅ All prerequisites met for service {}", serviceId);
    }

    /**
     * Validate REQUIRES_MIN_DAYS rules
     *
     * Example: "Cắt chỉ" requires "Nhổ răng" completed at least 7 days before
     *
     * @param patientId       The patient ID
     * @param serviceId       The service being booked
     * @param appointmentDate The new appointment date
     * @throws ConflictException if minimum days not met
     */
    private void validateMinimumDays(Integer patientId, Long serviceId, LocalDate appointmentDate) {
        List<ServiceDependency> minDaysRules = serviceDependencyRepository
                .findByServiceIdAndRuleType(serviceId, DependencyRuleType.REQUIRES_MIN_DAYS);

        if (minDaysRules.isEmpty()) {
            return; // No min days rules for this service
        }

        // Get patient's completed appointments
        List<Appointment> completedAppointments = appointmentRepository
                .findCompletedAppointmentsByPatientId(patientId);

        // Build map: serviceId -> latest completion date
        Map<Long, LocalDate> serviceCompletionDates = new HashMap<>();
        for (Appointment apt : completedAppointments) {
            LocalDate aptDate = apt.getAppointmentStartTime().toLocalDate();

            List<AppointmentService> appointmentServices = appointmentServiceRepository
                    .findByIdAppointmentId(apt.getAppointmentId());

            for (AppointmentService as : appointmentServices) {
                Long svcId = as.getId().getServiceId().longValue();
                serviceCompletionDates.merge(svcId, aptDate,
                        (existing, newDate) -> newDate.isAfter(existing) ? newDate : existing);
            }
        }

        // Check each min days rule
        for (ServiceDependency rule : minDaysRules) {
            Long prerequisiteServiceId = rule.getDependentServiceId();
            Integer minDays = rule.getMinDaysApart();

            LocalDate prerequisiteCompletionDate = serviceCompletionDates.get(prerequisiteServiceId);

            if (prerequisiteCompletionDate == null) {
                // Prerequisite service not completed yet
                String serviceName = rule.getService().getServiceName();
                String prerequisiteServiceName = rule.getDependentService().getServiceName();
                String note = rule.getReceptionistNote();

                String errorMsg = String.format(
                        "❌ VI PHẠM QUY TẮC LÂM SÀNG: Bệnh nhân chưa hoàn thành '%s' (cần làm trước '%s' ít nhất %d ngày). %s",
                        prerequisiteServiceName, serviceName, minDays,
                        note != null ? note : "");

                log.error("V21: REQUIRES_MIN_DAYS rule violated: {} requires {} completed first",
                        serviceName, prerequisiteServiceName);
                throw new ConflictException(errorMsg, "CLINICAL_RULE_MIN_DAYS_PREREQUISITE_NOT_MET");
            }

            // Check days between
            long daysBetween = ChronoUnit.DAYS.between(prerequisiteCompletionDate, appointmentDate);

            if (daysBetween < minDays) {
                String serviceName = rule.getService().getServiceName();
                String prerequisiteServiceName = rule.getDependentService().getServiceName();
                String note = rule.getReceptionistNote();

                String errorMsg = String.format(
                        "❌ VI PHẠM QUY TẮC LÂM SÀNG: '%s' yêu cầu '%s' phải hoàn thành ít nhất %d ngày trước. " +
                                "Hiện tại chỉ được %d ngày (ngày hoàn thành: %s, ngày đặt mới: %s). %s",
                        serviceName, prerequisiteServiceName, minDays,
                        daysBetween, prerequisiteCompletionDate, appointmentDate,
                        note != null ? note : "");

                log.error("V21: REQUIRES_MIN_DAYS rule violated: {} requires {} done {} days before, but only {} days",
                        serviceName, prerequisiteServiceName, minDays, daysBetween);
                throw new ConflictException(errorMsg, "CLINICAL_RULE_MIN_DAYS_NOT_MET");
            }
        }

        log.debug("V21: ✅ All minimum days rules met for service {}", serviceId);
    }

    /**
     * Get bundle suggestions for a service (BUNDLES_WITH - soft rule)
     *
     * Used by API 6.5 GET /services/grouped to show "bundlesWith" recommendations
     *
     * Example: serviceId = 1 (Khám) → Returns [3] (Cạo vôi)
     *
     * @param serviceId The service ID
     * @return List of service IDs that bundle well with this service
     */
    @Transactional(readOnly = true)
    public List<Long> getBundleSuggestions(Long serviceId) {
        List<ServiceDependency> bundles = serviceDependencyRepository.findBundlesByServiceId(serviceId);

        return bundles.stream()
                .map(bundle -> {
                    // Get the OTHER service (not the input serviceId)
                    if (bundle.getServiceId().equals(serviceId)) {
                        return bundle.getDependentServiceId();
                    } else {
                        return bundle.getServiceId();
                    }
                })
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Check if a service has any prerequisite requirements
     *
     * Used by Treatment Plan activation logic (API 5.5)
     *
     * @param serviceId The service ID
     * @return true if service has REQUIRES_PREREQUISITE rules
     */
    @Transactional(readOnly = true)
    public boolean hasPrerequisites(Long serviceId) {
        List<ServiceDependency> prerequisites = serviceDependencyRepository
                .findByServiceIdAndRuleType(serviceId, DependencyRuleType.REQUIRES_PREREQUISITE);
        return !prerequisites.isEmpty();
    }

    /**
     * Get services that depend on a given service (reverse lookup)
     *
     * Used by API 5.6 (Complete Item) to auto-unlock dependent items
     *
     * Example: serviceId = 1 (Khám) → Returns [5] (Trám) because "Trám requires
     * Khám"
     *
     * @param serviceId The completed service ID
     * @return List of service IDs that have this service as prerequisite
     */
    @Transactional(readOnly = true)
    public List<Long> getServicesUnlockedBy(Long serviceId) {
        List<ServiceDependency> dependencies = serviceDependencyRepository
                .findByDependentServiceId(serviceId);

        return dependencies.stream()
                .filter(dep -> dep.getRuleType() == DependencyRuleType.REQUIRES_PREREQUISITE ||
                        dep.getRuleType() == DependencyRuleType.REQUIRES_MIN_DAYS)
                .map(ServiceDependency::getServiceId)
                .distinct()
                .collect(Collectors.toList());
    }
}
