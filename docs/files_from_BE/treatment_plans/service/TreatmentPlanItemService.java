package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanPhase;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.LinkedAppointmentDTO;
import com.dental.clinic.management.treatment_plans.dto.request.UpdateItemStatusRequest;
import com.dental.clinic.management.treatment_plans.dto.response.PatientPlanItemResponse;
import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for managing treatment plan item status transitions.
 * Implements API 5.6: PATCH /api/v1/patient-plan-items/{itemId}/status
 *
 * Core Responsibilities:
 * 1. State Machine Validation (11 transition rules)
 * 2. Appointment Validation (cannot skip if SCHEDULED/IN_PROGRESS)
 * 3. Financial Recalculation (adjust total_cost/final_cost when skip/unskip)
 * 4. Auto-activate next item in phase
 * 5. Auto-complete phase when all items done
 * 6. Audit logging
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanItemService {

    private final PatientPlanItemRepository itemRepository;
    private final PatientTreatmentPlanRepository planRepository;
    private final com.dental.clinic.management.treatment_plans.repository.PatientPlanPhaseRepository phaseRepository;
    private final EntityManager entityManager;
    private final TreatmentPlanRBACService rbacService;

    // V21: Clinical Rules Validation
    private final com.dental.clinic.management.service.service.ClinicalRulesValidationService clinicalRulesValidationService;

    // V32: Employee repository for doctor assignment
    private final com.dental.clinic.management.employee.repository.EmployeeRepository employeeRepository;

    // V32: Service repository for specialization validation
    private final com.dental.clinic.management.service.repository.DentalServiceRepository dentalServiceRepository;

    /**
     * State Machine Map: current_status → allowed_next_statuses
     * V21: Added WAITING_FOR_PREREQUISITE with auto-unlock to READY_FOR_BOOKING
     */
    private static final Map<PlanItemStatus, Set<PlanItemStatus>> STATE_TRANSITIONS = Map.ofEntries(
            Map.entry(PlanItemStatus.PENDING, Set.of(
                    PlanItemStatus.READY_FOR_BOOKING,
                    PlanItemStatus.WAITING_FOR_PREREQUISITE, // V21: Set when plan approved with prerequisites
                    PlanItemStatus.SKIPPED,
                    PlanItemStatus.COMPLETED)),
            Map.entry(PlanItemStatus.READY_FOR_BOOKING, Set.of(
                    PlanItemStatus.SCHEDULED,
                    PlanItemStatus.SKIPPED,
                    PlanItemStatus.COMPLETED)),
            Map.entry(PlanItemStatus.WAITING_FOR_PREREQUISITE, Set.of(
                    PlanItemStatus.READY_FOR_BOOKING, // V21: Auto-unlocked when prerequisite completed
                    PlanItemStatus.SKIPPED)),
            Map.entry(PlanItemStatus.SCHEDULED, Set.of(
                    PlanItemStatus.IN_PROGRESS,
                    PlanItemStatus.COMPLETED
            // CANNOT skip if scheduled
            )),
            Map.entry(PlanItemStatus.IN_PROGRESS, Set.of(
                    PlanItemStatus.COMPLETED
            // CANNOT skip if in progress
            )),
            Map.entry(PlanItemStatus.SKIPPED, Set.of(
                    PlanItemStatus.READY_FOR_BOOKING, // Allow undo
                    PlanItemStatus.COMPLETED)),
            Map.entry(PlanItemStatus.COMPLETED, Set.of())
    // No transitions from COMPLETED
    );

    /**
     * Main method: Update item status with full business logic
     *
     * @param itemId  ID of the item to update
     * @param request Status update request
     * @return Updated item details
     */
    @Transactional
    public PatientPlanItemResponse updateItemStatus(Long itemId, UpdateItemStatusRequest request) {
        log.info(" Updating item {} to status {}", itemId, request.getStatus());

        // STEP 1: Find item with phase and plan data
        PatientPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TREATMENT_PLAN_ITEM_NOT_FOUND",
                        "Treatment plan item not found with ID: " + itemId));

        PatientPlanPhase phase = item.getPhase();
        PatientTreatmentPlan plan = phase.getTreatmentPlan();

        // STEP 1.5: RBAC verification (EMPLOYEE can only modify plans they created)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        rbacService.verifyEmployeeCanModifyPlan(plan, authentication);

        PlanItemStatus currentStatus = item.getStatus();
        PlanItemStatus newStatus = request.getStatus();

        log.info(" Item current status: {}, requested: {}", currentStatus, newStatus);

        // STEP 2: Validate state transition
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    String.format("Invalid status transition: %s → %s. Allowed transitions from %s are: %s",
                            currentStatus, newStatus, currentStatus,
                            STATE_TRANSITIONS.getOrDefault(currentStatus, Set.of())));
        }

        // STEP 3: Check appointment constraints (cannot skip if SCHEDULED/IN_PROGRESS)
        if (newStatus == PlanItemStatus.SKIPPED &&
                (currentStatus == PlanItemStatus.SCHEDULED || currentStatus == PlanItemStatus.IN_PROGRESS)) {
            // This path should be blocked by state machine, but double-check
            validateNoActiveAppointments(itemId);
        }

        // Additional check: if trying to skip from READY_FOR_BOOKING, ensure no
        // scheduled appointments exist
        if (newStatus == PlanItemStatus.SKIPPED && currentStatus == PlanItemStatus.READY_FOR_BOOKING) {
            List<Map<String, Object>> appointments = findAppointmentsForItem(itemId);
            long activeAppointments = appointments.stream()
                    .filter(apt -> {
                        String status = (String) apt.get("status");
                        return "SCHEDULED".equals(status) || "IN_PROGRESS".equals(status)
                                || "CHECKED_IN".equals(status);
                    })
                    .count();

            if (activeAppointments > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Cannot skip item: " + activeAppointments + " active appointment(s) found. " +
                                "Please cancel appointments first.");
            }
        }

        // STEP 4: Calculate financial impact BEFORE updating status
        boolean financialImpact = false;
        String financialMessage = null;

        if (currentStatus != PlanItemStatus.SKIPPED && newStatus == PlanItemStatus.SKIPPED) {
            // Skipping: reduce costs
            financialImpact = true;
            recalculatePlanFinances(plan, item.getPrice(), true); // subtract
            financialMessage = String.format("Item skipped: Plan total cost reduced by %,d VND",
                    item.getPrice().longValue());
            log.info(" Financial impact: SKIP - Reduced {} VND", item.getPrice());

        } else if (currentStatus == PlanItemStatus.SKIPPED && newStatus == PlanItemStatus.READY_FOR_BOOKING) {
            // Unskipping: add costs back
            financialImpact = true;
            recalculatePlanFinances(plan, item.getPrice(), false); // add
            financialMessage = String.format("Item re-activated: Plan total cost increased by %,d VND",
                    item.getPrice().longValue());
            log.info(" Financial impact: UNSKIP - Added back {} VND", item.getPrice());
        }

        // STEP 5: Update item status and metadata
        item.setStatus(newStatus);
        if (request.getNotes() != null) {
            // Note: PatientPlanItem doesn't have notes field in current schema
            // If needed, add notes field to entity or log to audit table
            log.info("Notes: {}", request.getNotes());
        }

        if (newStatus == PlanItemStatus.COMPLETED) {
            item.setCompletedAt(request.getCompletedAt() != null ? request.getCompletedAt() : LocalDateTime.now());
            log.info("Item marked as COMPLETED at {}", item.getCompletedAt());
        } else {
            item.setCompletedAt(null); // Clear if not completed
        }

        PatientPlanItem savedItem = itemRepository.save(item);

        // CRITICAL: Flush changes to database before checking completion
        // This ensures phase.getItems() will reflect the updated item status
        entityManager.flush();

        // STEP 6: Auto-activate next item in phase
        if (newStatus == PlanItemStatus.COMPLETED) {
            activateNextItemInPhase(phase, item.getSequenceNumber());
        }

        // STEP 6B: V21 - Auto-unlock dependent items across all phases
        if (newStatus == PlanItemStatus.COMPLETED && savedItem.getServiceId() != null) {
            unlockDependentItems(plan, savedItem.getServiceId().longValue());
        }

        // STEP 7: Refresh phase to get latest item statuses before completion check
        // Without this, phase.getItems() may contain stale data
        entityManager.refresh(phase);

        // STEP 7A: Check and auto-complete phase
        checkAndCompletePhase(phase);

        // STEP 7B: V21 - Check and activate plan (if first item scheduled/started)
        checkAndActivatePlan(plan);

        // STEP 7C: V21 - Check and auto-complete plan (if all phases done)
        // Need to refresh plan to get updated phase statuses
        entityManager.refresh(plan);
        checkAndCompletePlan(plan);

        // STEP 8: Audit log (implement if audit table exists)
        String currentUser = getCurrentUsername();
        log.info(" Audit: User {} changed item {} from {} to {}",
                currentUser, itemId, currentStatus, newStatus);

        // STEP 9: Build response
        List<LinkedAppointmentDTO> linkedAppointments = findAppointmentsForItem(itemId).stream()
                .map(apt -> LinkedAppointmentDTO.builder()
                        .code((String) apt.get("code"))
                        .scheduledDate((LocalDateTime) apt.get("scheduled_date"))
                        .status((String) apt.get("status"))
                        .notes((String) apt.get("notes")) // Include notes from dentist/assistant
                        .build())
                .toList();

        return PatientPlanItemResponse.builder()
                .itemId(savedItem.getItemId())
                .sequenceNumber(savedItem.getSequenceNumber())
                .itemName(savedItem.getItemName())
                .serviceId(savedItem.getServiceId())
                .price(savedItem.getPrice())
                .estimatedTimeMinutes(savedItem.getEstimatedTimeMinutes())
                .status(savedItem.getStatus().name())
                .completedAt(savedItem.getCompletedAt())
                .notes(request.getNotes())
                .phaseId(phase.getPatientPhaseId())
                .phaseName(phase.getPhaseName())
                .phaseSequenceNumber(phase.getPhaseNumber())
                .linkedAppointments(linkedAppointments)
                .financialImpact(financialImpact)
                .financialImpactMessage(financialMessage)
                .updatedAt(LocalDateTime.now())
                .updatedBy(currentUser)
                .build();
    }

    /**
     * Validate state transition using state machine
     */
    private boolean isValidTransition(PlanItemStatus current, PlanItemStatus next) {
        if (current == next) {
            return true; // Idempotent
        }

        Set<PlanItemStatus> allowedNext = STATE_TRANSITIONS.getOrDefault(current, Set.of());
        return allowedNext.contains(next);
    }

    /**
     * Validate no active appointments before skipping
     * Active = SCHEDULED, IN_PROGRESS, CHECKED_IN
     */
    private void validateNoActiveAppointments(Long itemId) {
        List<Map<String, Object>> appointments = findAppointmentsForItem(itemId);

        long activeCount = appointments.stream()
                .filter(apt -> {
                    String status = (String) apt.get("status");
                    return "SCHEDULED".equals(status) ||
                            "IN_PROGRESS".equals(status) ||
                            "CHECKED_IN".equals(status);
                })
                .count();

        if (activeCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot skip item: " + activeCount + " active appointment(s) found. " +
                            "Current status does not allow skipping while appointments are scheduled or in progress.");
        }
    }

    /**
     * Find all appointments linked to this item
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> findAppointmentsForItem(Long itemId) {
        String sql = """
                SELECT a.appointment_code, a.appointment_start_time, a.status, a.notes
                FROM appointments a
                JOIN appointment_plan_items api ON a.appointment_id = api.appointment_id
                WHERE api.item_id = :itemId
                ORDER BY a.appointment_start_time DESC
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("itemId", itemId);

        List<Object[]> results = query.getResultList();

        return results.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("code", row[0]);
                    map.put("scheduled_date", row[1]); // Keep map key for DTO compatibility
                    map.put("status", row[2]);
                    map.put("notes", row[3]); // Include notes from appointment
                    return map;
                })
                .toList();
    }

    /**
     * Recalculate plan finances when item is skipped/unskipped
     *
     * @param plan     Treatment plan to update
     * @param amount   Item price
     * @param subtract true = subtract (skip), false = add (unskip)
     */
    private void recalculatePlanFinances(PatientTreatmentPlan plan, BigDecimal amount, boolean subtract) {
        BigDecimal currentTotal = plan.getTotalPrice() != null ? plan.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal currentFinal = plan.getFinalCost() != null ? plan.getFinalCost() : BigDecimal.ZERO;

        if (subtract) {
            plan.setTotalPrice(currentTotal.subtract(amount));
            plan.setFinalCost(currentFinal.subtract(amount));
        } else {
            plan.setTotalPrice(currentTotal.add(amount));
            plan.setFinalCost(currentFinal.add(amount));
        }

        planRepository.save(plan);
        log.info(" Plan finances updated: total_cost={}, final_cost={}",
                plan.getTotalPrice(), plan.getFinalCost());
    }

    /**
     * Auto-activate next item in phase (change PENDING → READY_FOR_BOOKING)
     */
    private void activateNextItemInPhase(PatientPlanPhase phase, Integer completedSequence) {
        List<PatientPlanItem> items = phase.getItems();

        items.stream()
                .filter(item -> item.getSequenceNumber() == completedSequence + 1)
                .filter(item -> item.getStatus() == PlanItemStatus.PENDING)
                .findFirst()
                .ifPresent(nextItem -> {
                    nextItem.setStatus(PlanItemStatus.READY_FOR_BOOKING);
                    itemRepository.save(nextItem);
                    log.info(" Auto-activated next item {} (sequence {}) → READY_FOR_BOOKING",
                            nextItem.getItemId(), nextItem.getSequenceNumber());
                });
    }

    /**
     * Check if all items in phase are completed/skipped, then mark phase as
     * COMPLETED
     *
     * FIX Issue #40: Query items directly from database to avoid lazy loading
     * issues
     * Lazy collections may be empty or contain stale data after
     * entityManager.refresh()
     */
    private void checkAndCompletePhase(PatientPlanPhase phase) {
        // FIX Issue #40: Query items directly from database instead of using lazy
        // collection
        // phase.getItems() may be empty or stale after refresh
        List<PatientPlanItem> items = itemRepository.findByPhase_PatientPhaseId(phase.getPatientPhaseId());

        if (items.isEmpty()) {
            log.debug("Phase {} has no items, skipping completion check", phase.getPatientPhaseId());
            return;
        }

        boolean allDone = items.stream()
                .allMatch(item -> item.getStatus() == PlanItemStatus.COMPLETED ||
                        item.getStatus() == PlanItemStatus.SKIPPED);

        if (allDone && phase.getStatus() != PhaseStatus.COMPLETED) {
            phase.setStatus(PhaseStatus.COMPLETED);
            phase.setCompletionDate(java.time.LocalDate.now());
            entityManager.merge(phase);
            entityManager.flush();
            entityManager.refresh(phase);
            log.info("Phase {} auto-completed: all {} items are done",
                    phase.getPatientPhaseId(), items.size());
        }
    }

    /**
     * V21: Auto-activate treatment plan when first item is scheduled or started.
     *
     * Business Logic:
     * - When an item status changes to SCHEDULED or IN_PROGRESS
     * - If plan status is null or PENDING
     * - Then automatically set plan.status = IN_PROGRESS
     * - Set plan.startDate = today (if not set)
     *
     * Use Case:
     * - Plan was created with status = null (DRAFT) or PENDING
     * - First appointment is scheduled → Plan should be IN_PROGRESS
     * - First item starts → Plan should be IN_PROGRESS
     *
     * @param plan The treatment plan to check
     */
    private void checkAndActivatePlan(PatientTreatmentPlan plan) {
        TreatmentPlanStatus currentStatus = plan.getStatus();

        // Only activate if plan is not already activated
        if (currentStatus != null && currentStatus != TreatmentPlanStatus.PENDING) {
            return;
        }

        // Check if any item is SCHEDULED or IN_PROGRESS
        boolean hasActiveItems = plan.getPhases().stream()
                .flatMap(phase -> phase.getItems().stream())
                .anyMatch(item -> item.getStatus() == PlanItemStatus.SCHEDULED ||
                        item.getStatus() == PlanItemStatus.IN_PROGRESS);

        if (hasActiveItems) {
            // AUTO-ACTIVATE: null/PENDING → IN_PROGRESS
            plan.setStatus(TreatmentPlanStatus.IN_PROGRESS);

            // Set startDate if not set
            if (plan.getStartDate() == null) {
                plan.setStartDate(java.time.LocalDate.now());
            }

            planRepository.save(plan);
            log.info("V21: Auto-activated treatment plan {} ({} -> IN_PROGRESS) - First item scheduled/started",
                    plan.getPlanCode(), currentStatus == null ? "null" : currentStatus);
        }
    }

    /**
     * V21: Check if all phases are completed, then mark plan as COMPLETED.
     *
     * FIX Issue #35: Auto-complete plan regardless of current status (not just
     * IN_PROGRESS)
     * to ensure UX consistency between list and detail views.
     *
     * Business Logic:
     * - When an item is marked COMPLETED/SKIPPED
     * - After phase auto-completion check
     * - If ALL phases in plan are COMPLETED
     * - Then automatically set plan.status = COMPLETED
     *
     * Use Case:
     * - Plan with status = null, PENDING, or IN_PROGRESS
     * - Last item in last phase is marked COMPLETED
     * - All phases → COMPLETED
     * - Plan automatically → COMPLETED (regardless of previous status)
     *
     * Safety:
     * - Skips if plan is already COMPLETED or CANCELLED
     * - Only completes if ALL phases are COMPLETED
     * - Logs completion for audit trail
     * - Transactional - rolls back if fails
     *
     * @param plan The treatment plan to check (should be refreshed by caller)
     */
    private void checkAndCompletePlan(PatientTreatmentPlan plan) {
        // Skip if plan is already COMPLETED or CANCELLED
        if (plan.getStatus() == TreatmentPlanStatus.COMPLETED ||
                plan.getStatus() == TreatmentPlanStatus.CANCELLED) {
            return;
        }

        // FIX Issue #40: Query phases directly from database instead of using lazy
        // collection
        // plan.getPhases() may be empty or contain stale phase statuses after refresh
        List<PatientPlanPhase> phases = phaseRepository.findByTreatmentPlan_PlanId(plan.getPlanId());

        if (phases.isEmpty()) {
            log.debug("Plan {} has no phases, skipping completion check", plan.getPlanCode());
            return;
        }

        // Check if ALL phases are COMPLETED
        long completedPhases = phases.stream()
                .filter(phase -> phase.getStatus() == PhaseStatus.COMPLETED)
                .count();

        boolean allPhasesCompleted = completedPhases == phases.size();

        if (allPhasesCompleted) {
            // AUTO-COMPLETE: Any status -> COMPLETED (if all phases done)
            TreatmentPlanStatus oldStatus = plan.getStatus();
            plan.setStatus(TreatmentPlanStatus.COMPLETED);
            planRepository.save(plan);

            // FIX Issue #38: Force persist status to DB immediately and refresh entity
            // Without flush/refresh, status may not be visible in subsequent queries
            entityManager.flush();
            entityManager.refresh(plan);

            log.info("Treatment plan {} (code: {}) auto-completed: {} -> COMPLETED - All {} phases done",
                    plan.getPlanId(), plan.getPlanCode(),
                    oldStatus == null ? "null" : oldStatus,
                    phases.size());

            // Verify status was persisted correctly
            if (plan.getStatus() == TreatmentPlanStatus.COMPLETED) {
                log.debug("VERIFIED: Plan {} status confirmed as COMPLETED in DB", plan.getPlanCode());
            } else {
                log.error("CRITICAL: Plan {} status not persisted! Current: {}", plan.getPlanCode(),
                        plan.getStatus());
            }
        } else {
            log.debug("Plan {} not completed yet: {}/{} phases done",
                    plan.getPlanCode(), completedPhases, phases.size());
        }
    }

    // ====================================================================
    // V21: Clinical Rules Integration for Item Completion
    // ====================================================================

    /**
     * V21: Unlock dependent items when a service is completed.
     *
     * When an item is marked COMPLETED, check if other items in the plan
     * are waiting for this service as a prerequisite. If found, unlock them:
     * WAITING_FOR_PREREQUISITE → READY_FOR_BOOKING
     *
     * Example:
     * - Item A (Khám tổng quát) completed
     * - Item B (Trám răng) has status WAITING_FOR_PREREQUISITE
     * - If "Trám requires Khám", Item B → READY_FOR_BOOKING
     *
     * @param plan               The treatment plan containing the items
     * @param completedServiceId The service ID that was just completed
     */
    private void unlockDependentItems(PatientTreatmentPlan plan, Long completedServiceId) {
        log.info("V21: Checking for items to unlock after completing service {}", completedServiceId);

        // Get services that depend on this completed service
        List<Long> unlockedServiceIds = clinicalRulesValidationService
                .getServicesUnlockedBy(completedServiceId);

        if (unlockedServiceIds.isEmpty()) {
            log.debug("V21: No services depend on service {}", completedServiceId);
            return;
        }

        log.info("V21: Found {} services that can be unlocked: {}",
                unlockedServiceIds.size(), unlockedServiceIds);

        int unlockedCount = 0;

        // Iterate through all phases and items in the plan
        for (var phase : plan.getPhases()) {
            for (PatientPlanItem item : phase.getItems()) {
                // Only process items in WAITING_FOR_PREREQUISITE status
                if (item.getStatus() != PlanItemStatus.WAITING_FOR_PREREQUISITE) {
                    continue;
                }

                // Check if this item's service is in the unlocked list
                if (item.getServiceId() == null) {
                    continue;
                }

                Long itemServiceId = item.getServiceId().longValue();

                if (unlockedServiceIds.contains(itemServiceId)) {
                    // Unlock this item!
                    item.setStatus(PlanItemStatus.READY_FOR_BOOKING);
                    itemRepository.save(item);
                    unlockedCount++;

                    log.info("V21:  Unlocked item {} (service {}, '{}') → READY_FOR_BOOKING",
                            item.getItemId(), itemServiceId, item.getItemName());
                }
            }
        }

        if (unlockedCount > 0) {
            log.info("V21:  Successfully unlocked {} item(s) after completing service {}",
                    unlockedCount, completedServiceId);
        } else {
            log.debug("V21: No items were waiting for service {}", completedServiceId);
        }
    }

    /**
     * V32: Assign doctor to treatment plan item
     * Use case: When organizing phases or preparing for appointment scheduling
     *
     * Business rules:
     * - Doctor must exist and be active
     * - Doctor must have required specialization for item's service
     * - Item must exist and belong to a valid treatment plan
     *
     * @param itemId     ID of the item to assign doctor to
     * @param doctorCode Employee code of doctor to assign
     * @param notes      Optional reason for assignment
     * @return Updated item details
     */
    @Transactional
    public PatientPlanItemResponse assignDoctorToItem(Long itemId, String doctorCode, String notes) {
        log.info("V32: Assigning doctor {} to item {}", doctorCode, itemId);

        // STEP 1: Find item with phase and plan data
        PatientPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ITEM_NOT_FOUND",
                    "Plan item not found with id: " + itemId));

        PatientPlanPhase phase = item.getPhase();
        if (phase == null) {
            throw new ResourceNotFoundException("PHASE_NOT_FOUND",
                "Phase not found for item: " + itemId);
        }

        PatientTreatmentPlan plan = phase.getTreatmentPlan();
        if (plan == null) {
            throw new ResourceNotFoundException("PLAN_NOT_FOUND",
                "Treatment plan not found for item: " + itemId);
        }

        // STEP 2: RBAC - Check if current user can modify this plan
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        rbacService.verifyEmployeeCanModifyPlan(plan, authentication);

        // STEP 3: Find doctor by employee code (must be active)
        com.dental.clinic.management.employee.domain.Employee doctor = employeeRepository
                .findByEmployeeCodeAndIsActiveTrue(doctorCode)
                .orElseThrow(() -> new ResourceNotFoundException("DOCTOR_NOT_FOUND",
                    "Active doctor not found with code: " + doctorCode));

        // STEP 4: Validate doctor has required specialization for service
        if (item.getServiceId() != null) {
            com.dental.clinic.management.service.domain.DentalService service = dentalServiceRepository
                    .findById(Long.valueOf(item.getServiceId()))
                    .orElseThrow(() -> new ResourceNotFoundException("SERVICE_NOT_FOUND",
                        "Service not found with id: " + item.getServiceId()));

            // Check if service requires specialization
            if (service.getSpecialization() != null) {
                Set<com.dental.clinic.management.specialization.domain.Specialization> doctorSpecs =
                    doctor.getSpecializations();

                boolean hasSpecialization = doctorSpecs.stream()
                        .anyMatch(spec -> spec.getSpecializationId()
                                .equals(service.getSpecialization().getSpecializationId()));

                if (!hasSpecialization) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            String.format("Doctor %s does not have required specialization '%s' for service '%s'",
                                    doctorCode,
                                    service.getSpecialization().getSpecializationName(),
                                    service.getServiceName()));
                }
                log.info("V32: Verified doctor has specialization: {}",
                    service.getSpecialization().getSpecializationName());
            }
        }

        // STEP 5: Assign doctor to item
        item.setAssignedDoctor(doctor);
        PatientPlanItem savedItem = itemRepository.save(item);

        log.info("V32: Successfully assigned doctor {} {} ({}) to item {}",
                doctor.getFirstName(), doctor.getLastName(), doctorCode, itemId);

        // STEP 6: Build response (simplified version)
        List<LinkedAppointmentDTO> linkedAppointments = findAppointmentsForItem(itemId).stream()
                .map(apt -> LinkedAppointmentDTO.builder()
                        .code((String) apt.get("code"))
                        .scheduledDate((LocalDateTime) apt.get("scheduled_date"))
                        .status((String) apt.get("status"))
                        .notes((String) apt.get("notes"))
                        .build())
                .toList();

        return PatientPlanItemResponse.builder()
                .itemId(savedItem.getItemId())
                .sequenceNumber(savedItem.getSequenceNumber())
                .itemName(savedItem.getItemName())
                .serviceId(savedItem.getServiceId())
                .price(savedItem.getPrice())
                .estimatedTimeMinutes(savedItem.getEstimatedTimeMinutes())
                .status(savedItem.getStatus().name())
                .completedAt(savedItem.getCompletedAt())
                .notes(notes)
                .phaseId(phase.getPatientPhaseId())
                .phaseName(phase.getPhaseName())
                .phaseSequenceNumber(phase.getPhaseNumber())
                .linkedAppointments(linkedAppointments)
                .updatedAt(LocalDateTime.now())
                .updatedBy(getCurrentUsername())
                .build();
    }

    /**
     * Get current authenticated username
     */
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "SYSTEM";
    }
}
