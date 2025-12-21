package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.service.repository.DentalServiceRepository;
import com.dental.clinic.management.treatment_plans.domain.*;
import com.dental.clinic.management.treatment_plans.dto.request.CreateCustomPlanRequest;
import com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse;
import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
// import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.treatment_plans.util.PlanCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for creating CUSTOM treatment plans (API 5.4).
 * <p>
 * Features:
 * - Quantity expansion (1 item request → N patient_plan_items)
 * - Price override with validation
 * - Approval workflow (DRAFT status by default)
 * - Batch insert optimization
 * <p>
 * Version: V19
 * Date: 2025-11-12
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomTreatmentPlanService {

        private final PatientTreatmentPlanRepository planRepository;
        private final PatientRepository patientRepository;
        private final EmployeeRepository employeeRepository;
        private final DentalServiceRepository serviceRepository;
        private final PlanCodeGenerator planCodeGenerator;
        private final TreatmentPlanDetailService detailService;

        /**
         * Create a custom treatment plan from scratch.
         * <p>
         * Business Logic (with all P0 + P1 fixes):
         * 1. Validate input (patient, doctor, phases, items)
         * 2. Validate price overrides (must be within 50%-150% of service default)
         * 3. Create plan entity (status = PENDING, approval_status = DRAFT)
         * 4. Expand items by quantity (e.g., quantity=5 → 5 items with auto-increment
         * sequence)
         * 5. Calculate total cost and validate discount
         * 6. Save with batch insert optimization
         * 7. Return detail DTO
         *
         * @param patientCode Patient code from URL
         * @param request     Request body
         * @return Created plan detail
         * @throws BadRequestAlertException if validation fails
         * @throws AccessDeniedException    if user doesn't have permission
         */
        @PreAuthorize("hasAuthority('CREATE_TREATMENT_PLAN')")
        @Transactional
        public TreatmentPlanDetailResponse createCustomPlan(String patientCode, CreateCustomPlanRequest request) {
                log.info("Creating custom treatment plan. Patient: {}, Doctor: {}, Phases: {}",
                                patientCode, request.getDoctorEmployeeCode(), request.getPhases().size());

                // ============================================
                // STEP 1: Validate Input Data
                // ============================================
                Patient patient = validateAndGetPatient(patientCode);
                Employee doctor = validateAndGetDoctor(request.getDoctorEmployeeCode());
                validatePhases(request.getPhases());

                // ============================================
                // BUSINESS VALIDATION: Doctor Specialization for All Services
                // ============================================
                validateDoctorSpecializationsForServices(doctor, request.getPhases());

                // ============================================
                // STEP 2: Create Plan Entity (Parent)
                // ============================================
                String planCode = planCodeGenerator.generatePlanCode();
                log.debug("Generated plan code: {}", planCode);

                PatientTreatmentPlan plan = PatientTreatmentPlan.builder()
                                .planCode(planCode)
                                .planName(request.getPlanName())
                                .patient(patient)
                                .createdBy(doctor)
                                .status(null) // Keep null when approval_status = DRAFT
                                .approvalStatus(ApprovalStatus.DRAFT) // V19: Default DRAFT
                                .paymentType(request.getPaymentType())
                                .startDate(request.getStartDate())
                                .expectedEndDate(request.getExpectedEndDate())
                                .totalPrice(BigDecimal.ZERO) // Will calculate later
                                .discountAmount(request.getDiscountAmount())
                                .finalCost(BigDecimal.ZERO) // Will calculate later
                                .build();

                // Save plan first to get ID
                plan = planRepository.save(plan);
                log.info("Created plan entity. PlanCode: {}, PlanId: {}", planCode, plan.getPlanId());

                // ============================================
                // STEP 3: Create Phases & Items (with Quantity Expansion)
                // ============================================
                BigDecimal totalCost = BigDecimal.ZERO;
                List<PatientPlanPhase> phases = new ArrayList<>();

                for (CreateCustomPlanRequest.PhaseRequest phaseReq : request.getPhases()) {
                        // Create phase
                        PatientPlanPhase phase = PatientPlanPhase.builder()
                                        .treatmentPlan(plan)
                                        .phaseNumber(phaseReq.getPhaseNumber())
                                        .phaseName(phaseReq.getPhaseName())
                                        .status(PhaseStatus.PENDING)
                                        .estimatedDurationDays(phaseReq.getEstimatedDurationDays()) // V19
                                        .build();

                        List<PatientPlanItem> phaseItems = new ArrayList<>();

                        // Sort items by sequence number
                        List<CreateCustomPlanRequest.ItemRequest> sortedItems = phaseReq.getItems().stream()
                                        .sorted(Comparator.comparingInt(
                                                        CreateCustomPlanRequest.ItemRequest::getSequenceNumber))
                                        .collect(Collectors.toList());

                        int currentSequence = 1; // Auto-increment sequence across all expanded items

                        for (CreateCustomPlanRequest.ItemRequest itemReq : sortedItems) {
                                // Lookup service
                                DentalService service = validateAndGetService(itemReq.getServiceCode());

                                // V21.4: Auto-fill price from service if not provided
                                BigDecimal itemPrice = itemReq.getPrice();
                                if (itemPrice == null) {
                                        itemPrice = service.getPrice();
                                        log.debug("V21.4: Auto-filled price for {}: {} VND (from service default)",
                                                        service.getServiceCode(), itemPrice);
                                }

                                // V21.4: NO MORE PRICE VALIDATION
                                // Doctors use default prices, Finance adjusts later via API 5.13
                                // validatePriceOverride() method removed

                                // Expand by quantity (P0 Fix: Issue 1)
                                for (int i = 1; i <= itemReq.getQuantity(); i++) {
                                        String itemName = service.getServiceName();
                                        if (itemReq.getQuantity() > 1) {
                                                itemName += " (Lần " + i + ")"; // Add suffix for multiple items
                                        }

                                        PatientPlanItem item = PatientPlanItem.builder()
                                                        .phase(phase)
                                                        .serviceId(service.getServiceId().intValue())
                                                        .itemName(itemName)
                                                        .sequenceNumber(currentSequence++) // Auto-increment (P0 Fix!)
                                                        .price(itemPrice) // V21.4: Auto-filled or provided price
                                                        .estimatedTimeMinutes(service.getDefaultDurationMinutes())
                                                        .status(PlanItemStatus.PENDING) // V19: PENDING (not
                                                                                        // PENDING_APPROVAL)
                                                        .build();

                                        phaseItems.add(item);
                                        totalCost = totalCost.add(itemPrice);
                                }
                        }

                        phase.setItems(phaseItems);
                        phases.add(phase);

                        log.debug("Created phase {}. Phase: {}, Items count: {}",
                                        phaseReq.getPhaseNumber(), phaseReq.getPhaseName(), phaseItems.size());
                }

                plan.setPhases(phases);

                // ============================================
                // STEP 4: Calculate Financial & Validate Discount (P0 Fix)
                // ============================================
                if (request.getDiscountAmount().compareTo(totalCost) > 0) {
                        throw new BadRequestAlertException(
                                        "Discount amount (" + request.getDiscountAmount() +
                                                        ") cannot exceed total cost (" + totalCost + ")",
                                        "TreatmentPlan",
                                        "discountExceedsCost");
                }

                BigDecimal finalCost = totalCost.subtract(request.getDiscountAmount());
                plan.setTotalPrice(totalCost);
                plan.setFinalCost(finalCost);

                // Save with cascade (batch insert optimization handled by Hibernate)
                plan = planRepository.save(plan);

                int totalItems = phases.stream()
                                .mapToInt(p -> p.getItems().size())
                                .sum();

                log.info(
                                "Custom treatment plan created successfully. PlanCode: {}, TotalPrice: {}, FinalCost: {}, Total Items: {}",
                                planCode, totalCost, finalCost, totalItems);

                // ============================================
                // STEP 5: Return Detail DTO
                // ============================================
                return detailService.getTreatmentPlanDetail(patientCode, planCode);
        }

        // ============================================
        // VALIDATION METHODS (P0 + P1 Fixes)
        // ============================================

        /**
         * Validate patient exists.
         */
        private Patient validateAndGetPatient(String patientCode) {
                return patientRepository.findOneByPatientCode(patientCode)
                                .orElseThrow(() -> {
                                        log.error("Patient not found: {}", patientCode);
                                        return new BadRequestAlertException(
                                                        "Patient not found with code: " + patientCode,
                                                        "Patient",
                                                        "patientNotFound");
                                });
        }

        /**
         * Validate doctor exists and is active.
         */
        private Employee validateAndGetDoctor(String employeeCode) {
                Employee doctor = employeeRepository.findOneByEmployeeCode(employeeCode)
                                .orElseThrow(() -> {
                                        log.error("Doctor not found: {}", employeeCode);
                                        return new BadRequestAlertException(
                                                        "Doctor not found with code: " + employeeCode,
                                                        "Employee",
                                                        "doctorNotFound");
                                });

                if (!doctor.getIsActive()) {
                        throw new BadRequestAlertException(
                                        "Doctor is not active: " + employeeCode,
                                        "Employee",
                                        "doctorInactive");
                }

                return doctor;
        }

        /**
         * Validate service exists and is active.
         */
        private DentalService validateAndGetService(String serviceCode) {
                DentalService service = serviceRepository.findByServiceCode(serviceCode)
                                .orElseThrow(() -> {
                                        log.error("Service not found: {}", serviceCode);
                                        return new BadRequestAlertException(
                                                        "Service not found with code: " + serviceCode,
                                                        "Service",
                                                        "serviceNotFound");
                                });

                if (!service.getIsActive()) {
                        throw new BadRequestAlertException(
                                        "Service is not active: " + serviceCode,
                                        "Service",
                                        "serviceInactive");
                }

                return service;
        }

        /**
         * Validate phases (P0 Fix: Issue 6).
         * - Must have unique phase numbers
         * - Each phase must have at least 1 item
         */
        private void validatePhases(List<CreateCustomPlanRequest.PhaseRequest> phases) {
                // Check unique phase numbers
                Set<Integer> phaseNumbers = new HashSet<>();
                for (CreateCustomPlanRequest.PhaseRequest phase : phases) {
                        if (!phaseNumbers.add(phase.getPhaseNumber())) {
                                throw new BadRequestAlertException(
                                                "Duplicate phase number: " + phase.getPhaseNumber(),
                                                "TreatmentPlan",
                                                "duplicatePhaseNumber");
                        }

                        // Check phase has items
                        if (phase.getItems() == null || phase.getItems().isEmpty()) {
                                throw new BadRequestAlertException(
                                                "Phase " + phase.getPhaseNumber() + " has no items",
                                                "TreatmentPlan",
                                                "phaseWithoutItems");
                        }
                }
        }

        /**
         * CRITICAL BUSINESS VALIDATION: Validate doctor has required specializations
         * for ALL services in plan.
         *
         * This prevents doctors from creating treatment plans with services they are
         * not qualified to perform.
         *
         * Business Rules:
         * 1. For each service in the plan, check if doctor has matching specialization
         * 2. If service has NO specialization requirement (specializationId = null),
         * allow it (general service)
         * 3. If service HAS specialization requirement, doctor MUST have that
         * specialization
         * 4. Collect ALL mismatches and report them in one error message
         *
         * Example Error Scenario:
         * - Doctor has: [Chỉnh nha, Răng thẩm mỹ]
         * - Plan includes: Service A (Nội nha), Service B (Chỉnh nha), Service C (Phẫu thuật)
         * - Result: REJECT with error listing Service A and Service C as mismatches
         *
         * @param doctor The doctor creating the treatment plan
         * @param phases List of phases containing items with serviceCode references
         * @throws BadRequestAlertException if doctor lacks required specializations
         */
        private void validateDoctorSpecializationsForServices(
                        Employee doctor,
                        List<CreateCustomPlanRequest.PhaseRequest> phases) {

                log.debug("Validating doctor specializations. Doctor: {} {}, Specializations: {}",
                                doctor.getEmployeeCode(),
                                doctor.getFirstName() + " " + doctor.getLastName(),
                                doctor.getSpecializations().stream()
                                                .map(s -> s.getSpecializationName() + " (ID:" + s.getSpecializationId()
                                                                + ")")
                                                .collect(java.util.stream.Collectors.joining(", ")));

                // Collect doctor's specialization IDs
                Set<Integer> doctorSpecIds = doctor.getSpecializations().stream()
                                .map(com.dental.clinic.management.specialization.domain.Specialization::getSpecializationId)
                                .collect(java.util.stream.Collectors.toSet());

                // Collect all service codes from all phases
                List<String> allServiceCodes = phases.stream()
                                .flatMap(phase -> phase.getItems().stream())
                                .map(CreateCustomPlanRequest.ItemRequest::getServiceCode)
                                .distinct()
                                .collect(java.util.stream.Collectors.toList());

                // Validate each service
                List<String> mismatchErrors = new ArrayList<>();

                for (String serviceCode : allServiceCodes) {
                        DentalService service = validateAndGetService(serviceCode);

                        // If service has NO specialization requirement, skip (general service)
                        if (service.getSpecialization() == null) {
                                log.debug("Service {} has no specialization requirement (general service) - OK",
                                                serviceCode);
                                continue;
                        }

                        Integer requiredSpecId = service.getSpecialization().getSpecializationId();

                        // Check if doctor has this specialization
                        if (!doctorSpecIds.contains(requiredSpecId)) {
                                String error = String.format(
                                                "Service '%s' (%s) requires specialization '%s' (ID: %d)",
                                                service.getServiceCode(),
                                                service.getServiceName(),
                                                service.getSpecialization().getSpecializationName(),
                                                requiredSpecId);
                                mismatchErrors.add(error);

                                log.warn("Specialization mismatch: {}", error);
                        } else {
                                log.debug("✓ Service {} requires spec {} - doctor has it", serviceCode, requiredSpecId);
                        }
                }

                // If any mismatches found, throw error with complete list
                if (!mismatchErrors.isEmpty()) {
                        String doctorSpecsStr = doctor.getSpecializations().stream()
                                        .map(s -> s.getSpecializationName() + " (ID:" + s.getSpecializationId() + ")")
                                        .collect(java.util.stream.Collectors.joining(", "));

                        String errorMessage = String.format(
                                        "Doctor %s (%s %s) cannot create this treatment plan. " +
                                                        "Doctor's specializations: [%s]. " +
                                                        "Missing required specializations for %d service(s):\n%s",
                                        doctor.getEmployeeCode(),
                                        doctor.getFirstName(),
                                        doctor.getLastName(),
                                        doctorSpecsStr,
                                        mismatchErrors.size(),
                                        String.join("\n", mismatchErrors));

                        throw new BadRequestAlertException(
                                        errorMessage,
                                        "TreatmentPlan",
                                        "doctorSpecializationMismatch");
                }

                log.info("✓ All services validated: Doctor {} has required specializations for {} service(s)",
                                doctor.getEmployeeCode(), allServiceCodes.size());
        }

        /**
         * DEPRECATED in V21.4: Price validation removed.
         * Doctors now use service default prices only.
         * Finance team adjusts prices via API 5.13 (MANAGE_PLAN_PRICING permission).
         *
         * Previous logic: Validate price override within 50%-150% of service default
         * price.
         * Reason for removal: Separation of concerns - clinical vs financial decisions.
         */
        @SuppressWarnings("unused")
        @Deprecated
        private void validatePriceOverride(BigDecimal requestPrice, BigDecimal servicePrice, String serviceCode) {
                // V21.4: METHOD DEPRECATED AND UNUSED
                // Price validation removed to simplify doctor workflow
                // Finance team now handles all pricing via API 5.13
                log.debug("V21.4: validatePriceOverride() is deprecated and no longer called");

                /*
                 * ORIGINAL CODE (KEPT FOR REFERENCE):
                 * BigDecimal minPrice = servicePrice.multiply(new BigDecimal("0.5")); // 50%
                 * BigDecimal maxPrice = servicePrice.multiply(new BigDecimal("1.5")); // 150%
                 *
                 * if (requestPrice.compareTo(minPrice) < 0 || requestPrice.compareTo(maxPrice)
                 * > 0) {
                 * log.
                 * warn("Price override out of range. Service: {}, Default: {}, Request: {}, Range: {}-{}"
                 * ,
                 * serviceCode, servicePrice, requestPrice, minPrice, maxPrice);
                 *
                 * throw new BadRequestAlertException(
                 * String.
                 * format("Price for service %s (%s) is out of allowed range (%s - %s). Default price: %s"
                 * ,
                 * serviceCode, requestPrice, minPrice, maxPrice, servicePrice),
                 * "TreatmentPlan",
                 * "priceOutOfRange");
                 * }
                 */
        }
}
