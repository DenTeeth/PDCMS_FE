package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.DentalService;
import com.dental.clinic.management.booking_appointment.dto.request.CreateServiceRequest;
import com.dental.clinic.management.booking_appointment.dto.request.UpdateServiceRequest;
import com.dental.clinic.management.booking_appointment.dto.response.ServiceResponse;
import com.dental.clinic.management.booking_appointment.mapper.ServiceMapper;
import com.dental.clinic.management.booking_appointment.repository.BookingDentalServiceRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.exception.DuplicateResourceException;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.specialization.repository.SpecializationRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service layer for managing dental services (Appointment Booking Module)
 * Note: Renamed from DentalServiceService to avoid bean name conflict with
 * Service Module
 */
@Service("appointmentDentalServiceService")
@RequiredArgsConstructor
@Slf4j
public class AppointmentDentalServiceService {

    private final BookingDentalServiceRepository serviceRepository;
    private final SpecializationRepository specializationRepository;
    private final EmployeeRepository employeeRepository;
    private final ServiceMapper serviceMapper;

    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 10;

    /**
     * Get all services with pagination and filters
     */
    @Transactional(readOnly = true)
    public Page<ServiceResponse> getAllServices(
            int page,
            int size,
            String sortBy,
            String sortDirection,
            Boolean isActive,
            Long categoryId,
            Integer specializationId,
            String keyword) {

        log.debug(
                "Request to get all services - page: {}, size: {}, sortBy: {}, sortDirection: {}, isActive: {}, categoryId: {}, specializationId: {}, keyword: {}",
                page, size, sortBy, sortDirection, isActive, categoryId, specializationId, keyword);

        // Validate and adjust page size
        if (size > MAX_PAGE_SIZE) {
            size = MAX_PAGE_SIZE;
        }
        if (size <= 0) {
            size = DEFAULT_PAGE_SIZE;
        }

        // Create sort
        Sort sort = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Query with filters
        Page<DentalService> servicesPage = serviceRepository.findWithFilters(
                isActive,
                categoryId,
                specializationId,
                keyword,
                pageable);

        log.debug("Found {} services", servicesPage.getTotalElements());

        return servicesPage.map(serviceMapper::toResponse);
    }

    /**
     * Get service by ID
     */
    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Integer serviceId) {
        log.debug("Request to get service by ID: {}", serviceId);

        DentalService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with ID: " + serviceId));

        return serviceMapper.toResponse(service);
    }

    /**
     * Get service by code
     */
    @Transactional(readOnly = true)
    public ServiceResponse getServiceByCode(String serviceCode) {
        log.debug("Request to get service by code: {}", serviceCode);

        DentalService service = serviceRepository.findByServiceCode(serviceCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with code: " + serviceCode));

        return serviceMapper.toResponse(service);
    }

    /**
     * Create a new service
     */
    @Transactional
    public ServiceResponse createService(CreateServiceRequest request) {
        log.debug("Request to create new service: {}", request.getServiceCode());

        // Validate unique service code
        if (serviceRepository.existsByServiceCode(request.getServiceCode())) {
            throw new DuplicateResourceException(
                    "SERVICE_CODE_EXISTS",
                    "Service code already exists: " + request.getServiceCode());
        }

        // Validate specialization if provided
        Specialization specialization = null;
        if (request.getSpecializationId() != null) {
            specialization = specializationRepository.findById(request.getSpecializationId())
                    .orElseThrow(() -> new BadRequestAlertException(
                            "Specialization not found with ID: " + request.getSpecializationId(),
                            "specialization",
                            "SPECIALIZATION_NOT_FOUND"));
        }

        // Create service
        DentalService service = serviceMapper.toEntity(request);
        service.setSpecialization(specialization);

        DentalService savedService = serviceRepository.save(service);

        log.info("Created service with ID: {} and code: {}", savedService.getServiceId(),
                savedService.getServiceCode());

        return serviceMapper.toResponse(savedService);
    }

    /**
     * Update service by service code
     */
    @Transactional
    public ServiceResponse updateService(String serviceCode, UpdateServiceRequest request) {
        log.debug("Request to update service code: {}", serviceCode);

        // Find existing service by code
        DentalService service = serviceRepository.findByServiceCode(serviceCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with code: " + serviceCode));

        // Validate unique service code (if changed)
        if (request.getServiceCode() != null &&
                !request.getServiceCode().equals(service.getServiceCode()) &&
                serviceRepository.existsByServiceCodeAndServiceIdNot(request.getServiceCode(),
                        service.getServiceId())) {
            throw new DuplicateResourceException(
                    "SERVICE_CODE_EXISTS",
                    "Service code already exists: " + request.getServiceCode());
        }

        // Update fields
        if (request.getServiceCode() != null) {
            service.setServiceCode(request.getServiceCode());
        }
        if (request.getServiceName() != null) {
            service.setServiceName(request.getServiceName());
        }
        if (request.getDescription() != null) {
            service.setDescription(request.getDescription());
        }
        if (request.getDefaultDurationMinutes() != null) {
            service.setDefaultDurationMinutes(request.getDefaultDurationMinutes());
        }
        if (request.getDefaultBufferMinutes() != null) {
            service.setDefaultBufferMinutes(request.getDefaultBufferMinutes());
        }
        if (request.getPrice() != null) {
            service.setPrice(request.getPrice());
        }
        if (request.getDisplayOrder() != null) {
            service.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            service.setIsActive(request.getIsActive());
        }

        // BE_4: Update service constraints
        if (request.getMinimumPreparationDays() != null) {
            service.setMinimumPreparationDays(request.getMinimumPreparationDays());
        }
        if (request.getRecoveryDays() != null) {
            service.setRecoveryDays(request.getRecoveryDays());
        }
        if (request.getSpacingDays() != null) {
            service.setSpacingDays(request.getSpacingDays());
        }
        if (request.getMaxAppointmentsPerDay() != null) {
            service.setMaxAppointmentsPerDay(request.getMaxAppointmentsPerDay());
        }

        // Update specialization if provided
        if (request.getSpecializationId() != null) {
            Specialization specialization = specializationRepository.findById(request.getSpecializationId())
                    .orElseThrow(() -> new BadRequestAlertException(
                            "Specialization not found with ID: " + request.getSpecializationId(),
                            "specialization",
                            "SPECIALIZATION_NOT_FOUND"));
            service.setSpecialization(specialization);
        }

        DentalService updatedService = serviceRepository.save(service);

        log.info("Updated service code: {}", serviceCode);

        return serviceMapper.toResponse(updatedService);
    }

    /**
     * Soft delete service by service ID (set isActive = false)
     * RESTful DELETE endpoint using serviceId
     */
    @Transactional
    public void deleteServiceById(Integer serviceId) {
        log.debug("Request to soft delete service ID: {}", serviceId);

        DentalService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with ID: " + serviceId));

        service.setIsActive(false);
        serviceRepository.save(service);

        log.info("Soft deleted service ID: {}", serviceId);
    }

    /**
     * Soft delete service by service code (set isActive = false)
     * Legacy endpoint for backward compatibility
     */
    @Transactional
    public void deleteServiceByCode(String serviceCode) {
        log.debug("Request to soft delete service code: {}", serviceCode);

        DentalService service = serviceRepository.findByServiceCode(serviceCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with code: " + serviceCode));

        service.setIsActive(false);
        serviceRepository.save(service);

        log.info("Soft deleted service code: {}", serviceCode);
    }

    /**
     * Toggle service active status (activate ↔ deactivate)
     * RESTful PATCH endpoint - returns updated service
     */
    @Transactional
    public ServiceResponse toggleServiceStatus(Integer serviceId) {
        log.debug("Request to toggle service status for ID: {}", serviceId);

        DentalService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with ID: " + serviceId));

        // Toggle: if active → inactive, if inactive → active
        boolean newStatus = !service.getIsActive();
        service.setIsActive(newStatus);
        DentalService savedService = serviceRepository.save(service);

        log.info("Toggled service ID {} status to: {}", serviceId, newStatus);
        return serviceMapper.toResponse(savedService);
    }

    /**
     * Activate service (set isActive = true)
     */
    @Transactional
    public void activateService(Integer serviceId) {
        log.debug("Request to activate service ID: {}", serviceId);

        DentalService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND",
                        "Service not found with ID: " + serviceId));

        service.setIsActive(true);
        serviceRepository.save(service);

        log.info("Activated service ID: {}", serviceId);
    }

    /**
     * Get services filtered by current logged-in doctor's specializations.
     * This ensures doctors can only select services they are qualified to perform
     * when creating custom treatment plans.
     *
     * Algorithm:
     * 1. Get current username from security context
     * 2. Find employee by username
     * 3. Extract employee's specialization IDs
     * 4. For each specializationId, query services
     * 5. Merge and deduplicate results (using serviceId as key)
     * 6. Apply additional filters (isActive, keyword)
     * 7. Sort and paginate results
     *
     * @return Page of services matching ANY of doctor's specializations
     */
    @Transactional(readOnly = true)
    public Page<ServiceResponse> getServicesForCurrentDoctor(
            int page,
            int size,
            String sortBy,
            String sortDirection,
            Boolean isActive,
            String keyword) {

        log.debug(
                "Request to get services for current doctor - page: {}, size: {}, sortBy: {}, sortDirection: {}, isActive: {}, keyword: {}",
                page, size, sortBy, sortDirection, isActive, keyword);

        // 1. Get current username from security context
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new BadRequestAlertException(
                        "No authenticated user found",
                        "security",
                        "UNAUTHENTICATED"));

        // 2. Find employee by username
        Employee employee = employeeRepository.findByAccount_Username(username)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Employee not found for username: " + username,
                        "employee",
                        "EMPLOYEE_NOT_FOUND"));

        // 3. Extract employee's specialization IDs
        Set<Integer> specializationIds = employee.getSpecializations()
                .stream()
                .map(Specialization::getSpecializationId)
                .collect(Collectors.toSet());

        log.debug("Employee {} has {} specializations: {}",
                employee.getEmployeeCode(),
                specializationIds.size(),
                specializationIds);

        // If employee has no specializations, return empty page
        if (specializationIds.isEmpty()) {
            log.warn("Employee {} has no specializations - returning empty service list",
                    employee.getEmployeeCode());
            return Page.empty();
        }

        // 4-6. Query services matching ANY of the specializations
        // Validate and adjust page size
        if (size > MAX_PAGE_SIZE) {
            size = MAX_PAGE_SIZE;
        }
        if (size <= 0) {
            size = DEFAULT_PAGE_SIZE;
        }

        // Create sort
        Sort sort = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Query all services for each specializationId and merge results
        List<DentalService> allMatchingServices = specializationIds.stream()
                .flatMap(specId -> {
                    // For each specializationId, get all matching services (unpaginated)
                    Pageable unpaginated = PageRequest.of(0, Integer.MAX_VALUE);
                    Page<DentalService> specServices = serviceRepository.findWithFilters(
                            isActive,
                            null, // categoryId not used in doctor filter
                            specId,
                            keyword,
                            unpaginated);
                    return specServices.getContent().stream();
                })
                .distinct() // Remove duplicates (service may match multiple specializations)
                .sorted((s1, s2) -> {
                    // Apply manual sorting based on sortBy and sortDirection
                    int comparison = 0;
                    switch (sortBy) {
                        case "serviceId":
                            comparison = s1.getServiceId().compareTo(s2.getServiceId());
                            break;
                        case "serviceCode":
                            comparison = s1.getServiceCode().compareTo(s2.getServiceCode());
                            break;
                        case "serviceName":
                            comparison = s1.getServiceName().compareTo(s2.getServiceName());
                            break;
                        case "price":
                            comparison = s1.getPrice().compareTo(s2.getPrice());
                            break;
                        default:
                            comparison = s1.getServiceId().compareTo(s2.getServiceId());
                    }
                    return sortDirection.equalsIgnoreCase("DESC") ? -comparison : comparison;
                })
                .collect(Collectors.toList());

        // 7. Manual pagination
        int start = Math.min((int) pageable.getOffset(), allMatchingServices.size());
        int end = Math.min((start + pageable.getPageSize()), allMatchingServices.size());
        List<DentalService> pageContent = allMatchingServices.subList(start, end);

        log.debug("Found {} total services matching doctor's specializations, returning page {} with {} services",
                allMatchingServices.size(), page, pageContent.size());

        // Convert to response DTOs
        List<ServiceResponse> responseContent = pageContent.stream()
                .map(serviceMapper::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responseContent, pageable, allMatchingServices.size());
    }
}
