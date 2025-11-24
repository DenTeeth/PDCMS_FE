package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanPhase;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.domain.template.TemplatePhase;
import com.dental.clinic.management.treatment_plans.domain.template.TemplatePhaseService;
import com.dental.clinic.management.treatment_plans.domain.template.TreatmentPlanTemplate;
import com.dental.clinic.management.treatment_plans.dto.request.CreateTreatmentPlanRequest;
import com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.treatment_plans.repository.TreatmentPlanTemplateRepository;
import com.dental.clinic.management.treatment_plans.util.PlanCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for creating patient treatment plans from templates.
 *
 * API 5.3: POST /api/v1/patients/{patientCode}/treatment-plans
 *
 * Business Logic (5 Steps - with V19 fixes):
 * 1. Validate Guards (patient/doctor/template exist, discount ≤ total)
 * 2. Create Plan (generate code, calculate expectedEndDate from
 * template.estimatedDurationDays)
 * 3. Snapshot Phases & Items (copy from template, ORDER BY sequenceNumber,
 * expand by quantity)
 * 4. Update Financials (calculate total_cost, final_cost)
 * 5. Return Response (reuse API 5.2 structure)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanCreationService {

        private final PatientRepository patientRepository;
        private final EmployeeRepository employeeRepository;
        private final TreatmentPlanTemplateRepository templateRepository;
        private final PatientTreatmentPlanRepository planRepository;
        private final TreatmentPlanDetailService detailService;
        private final PlanCodeGenerator codeGenerator;

        /**
         * Create a new patient treatment plan from a template.
         *
         * @param patientCode Patient's business key
         * @param request     Request containing template code, doctor code, etc.
         * @return Newly created plan (full detail structure)
         * @throws ResourceNotFoundException If patient/doctor/template not found
         * @throws BadRequestAlertException  If discount > total cost
         */
        @Transactional
        public TreatmentPlanDetailResponse createTreatmentPlanFromTemplate(
                        String patientCode,
                        CreateTreatmentPlanRequest request) {

                log.info("Creating treatment plan from template. Patient: {}, Template: {}, Doctor: {}",
                                patientCode, request.getSourceTemplateCode(), request.getDoctorEmployeeCode());

                // ============================================
                // STEP 1: Validate Guards
                // ============================================

                // Find patient
                Patient patient = patientRepository.findOneByPatientCode(patientCode)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Patient", patientCode));

                // Find doctor
                Employee doctor = employeeRepository.findOneByEmployeeCode(request.getDoctorEmployeeCode())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Employee", request.getDoctorEmployeeCode()));

                // Find template with phases (services loaded lazily to avoid
                // MultipleBagFetchException)
                TreatmentPlanTemplate template = templateRepository
                                .findByTemplateCodeWithPhasesAndServices(request.getSourceTemplateCode())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "TreatmentPlanTemplate", request.getSourceTemplateCode()));

                // Validate template is active
                if (!template.getIsActive()) {
                        throw new BadRequestAlertException("Template is not active",
                                        "TreatmentPlanTemplate", "templateInactive");
                }

                // ============================================
                // BUSINESS VALIDATION: Doctor Specialization Match
                // ============================================
                // Validate that doctor has the required specialization for this template
                if (template.getSpecialization() != null) {
                        Integer requiredSpecializationId = template.getSpecialization().getSpecializationId();

                        boolean doctorHasRequiredSpec = doctor.getSpecializations().stream()
                                        .anyMatch(spec -> spec.getSpecializationId().equals(requiredSpecializationId));

                        if (!doctorHasRequiredSpec) {
                                throw new BadRequestAlertException(
                                                String.format("Doctor %s (%s %s) does not have required specialization '%s' (ID: %d) for template '%s'. "
                                                                +
                                                                "Doctor's specializations: %s",
                                                                doctor.getEmployeeCode(),
                                                                doctor.getFirstName(),
                                                                doctor.getLastName(),
                                                                template.getSpecialization().getSpecializationName(),
                                                                requiredSpecializationId,
                                                                template.getTemplateCode(),
                                                                doctor.getSpecializations().stream()
                                                                                .map(s -> s.getSpecializationName()
                                                                                                + " (ID:"
                                                                                                + s.getSpecializationId()
                                                                                                + ")")
                                                                                .collect(java.util.stream.Collectors
                                                                                                .joining(", "))),
                                                "TreatmentPlanTemplate",
                                                "doctorSpecializationMismatch");
                        }

                        log.info("✓ Validation passed: Doctor {} has required specialization '{}' for template '{}'",
                                        doctor.getEmployeeCode(),
                                        template.getSpecialization().getSpecializationName(),
                                        template.getTemplateCode());
                }

                // Force load services within transaction (avoid lazy loading exception later)
                template.getTemplatePhases().forEach(phase -> phase.getPhaseServices().size());

                // Calculate estimated total cost (from template)
                BigDecimal estimatedTotalCost = calculateTotalCostFromTemplate(template);

                // Validate discount ≤ total cost (V19 FIX #3)
                if (request.getDiscountAmount().compareTo(estimatedTotalCost) > 0) {
                        throw new BadRequestAlertException(
                                        String.format("Discount amount (%.2f) cannot exceed total cost (%.2f)",
                                                        request.getDiscountAmount(), estimatedTotalCost),
                                        "PatientTreatmentPlan", "discountExceedsTotal");
                }

                // ============================================
                // STEP 2: Create Plan (Parent Entity)
                // ============================================

                String planCode = codeGenerator.generatePlanCode();

                // Calculate expected end date (V19 FIX #1)
                LocalDate expectedEndDate = null;
                if (template.getEstimatedDurationDays() != null && template.getEstimatedDurationDays() > 0) {
                        expectedEndDate = LocalDate.now().plusDays(template.getEstimatedDurationDays());
                }

                // Determine plan name
                String planName = (request.getPlanNameOverride() != null && !request.getPlanNameOverride().isBlank())
                                ? request.getPlanNameOverride()
                                : template.getTemplateName();

                PatientTreatmentPlan plan = PatientTreatmentPlan.builder()
                                .planCode(planCode)
                                .planName(planName)
                                .patient(patient)
                                .createdBy(doctor)
                                .sourceTemplate(template) // Trace back to template
                                .status(TreatmentPlanStatus.PENDING) // Initial status
                                .startDate(null) // Will be set when first phase starts
                                .expectedEndDate(expectedEndDate) // V19: From template duration
                                .totalPrice(BigDecimal.ZERO) // Will update in Step 4
                                .discountAmount(request.getDiscountAmount())
                                .finalCost(BigDecimal.ZERO) // Will update in Step 4
                                .paymentType(request.getPaymentType())
                                .build();

                // Save plan first to get ID (for foreign keys)
                plan = planRepository.save(plan);
                log.info("Created plan entity. PlanCode: {}, PlanId: {}", planCode, plan.getPlanId());

                // ============================================
                // STEP 3: Snapshot Phases & Items (with Quantity Expansion)
                // ============================================

                BigDecimal totalCostAccumulator = BigDecimal.ZERO;

                // Loop through template phases (ordered by stepOrder)
                for (TemplatePhase templatePhase : template.getTemplatePhases()) {

                        // Create patient phase (snapshot)
                        PatientPlanPhase patientPhase = PatientPlanPhase.builder()
                                        .treatmentPlan(plan)
                                        .phaseNumber(templatePhase.getPhaseNumber())
                                        .phaseName(templatePhase.getPhaseName())
                                        .status(PhaseStatus.PENDING) // Initial status
                                        .startDate(null) // Will be set when phase activated
                                        .completionDate(null)
                                        .items(new ArrayList<>()) // Initialize items list
                                        .build();

                        // Loop through template phase services (V19 FIX #2: ORDER BY sequenceNumber)
                        List<TemplatePhaseService> services = templatePhase.getPhaseServices();
                        // Note: Already ordered by @OrderBy("sequenceNumber ASC") in TemplatePhase
                        // entity

                        int itemSequenceCounter = 1; // Track item sequence within phase

                        for (TemplatePhaseService templateService : services) {
                                DentalService masterService = templateService.getService();
                                Integer quantity = templateService.getQuantity();

                                // Loop for quantity (expand repeated services)
                                // Example: If quantity=8, create 8 separate items
                                for (int i = 1; i <= quantity; i++) {

                                        // Generate item name
                                        String itemName;
                                        if (quantity > 1) {
                                                // Append sequence for repeated services
                                                itemName = masterService.getServiceName() + " (Lần " + i + ")";
                                        } else {
                                                itemName = masterService.getServiceName();
                                        }

                                        // Create patient plan item (snapshot)
                                        PatientPlanItem item = PatientPlanItem.builder()
                                                        .phase(patientPhase)
                                                        .serviceId(masterService.getServiceId().intValue()) // Convert
                                                                                                            // Long to
                                                                                                            // Integer
                                                        .sequenceNumber(itemSequenceCounter++)
                                                        .itemName(itemName)
                                                        .status(PlanItemStatus.PENDING) // Initial status (awaiting plan
                                                                                        // activation)
                                                        .estimatedTimeMinutes(templateService.getEstimatedTimeMinutes())
                                                        .price(masterService.getPrice()) // Snapshot price (V19: Freeze
                                                                                         // at creation time)
                                                        .completedAt(null)
                                                        .build();

                                        // Add item to phase
                                        patientPhase.getItems().add(item);

                                        // Accumulate total cost
                                        totalCostAccumulator = totalCostAccumulator.add(masterService.getPrice());
                                }
                        }

                        // Add phase to plan
                        plan.getPhases().add(patientPhase);

                        log.debug("Created phase {}. Phase: {}, Items count: {}",
                                        patientPhase.getPhaseNumber(), patientPhase.getPhaseName(),
                                        patientPhase.getItems().size());
                }

                // ============================================
                // STEP 4: Update Financials
                // ============================================

                BigDecimal finalCost = totalCostAccumulator.subtract(request.getDiscountAmount());

                plan.setTotalPrice(totalCostAccumulator);
                plan.setFinalCost(finalCost);

                // Save plan with all nested phases and items (cascade)
                plan = planRepository.save(plan);

                log.info("Treatment plan created successfully. PlanCode: {}, TotalPrice: {}, FinalCost: {}, Total Items: {}",
                                planCode, totalCostAccumulator, finalCost,
                                plan.getPhases().stream().mapToInt(p -> p.getItems().size()).sum());

                // ============================================
                // STEP 5: Return Response (Reuse API 5.2 Detail Structure)
                // ============================================

                // Use existing detail service to format response
                return detailService.getTreatmentPlanDetail(patientCode, planCode);
        }

        /**
         * Calculate total cost from template (sum all service prices * quantities).
         * Used for discount validation.
         *
         * @param template Template with phases and services
         * @return Total estimated cost
         */
        private BigDecimal calculateTotalCostFromTemplate(TreatmentPlanTemplate template) {
                BigDecimal total = BigDecimal.ZERO;

                for (TemplatePhase phase : template.getTemplatePhases()) {
                        for (TemplatePhaseService service : phase.getPhaseServices()) {
                                BigDecimal servicePrice = service.getService().getPrice();
                                int quantity = service.getQuantity();

                                total = total.add(servicePrice.multiply(BigDecimal.valueOf(quantity)));
                        }
                }

                return total;
        }
}
