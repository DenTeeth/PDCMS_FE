package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.booking_appointment.domain.AppointmentAuditLog;
import com.dental.clinic.management.booking_appointment.dto.UpdateAppointmentStatusRequest;
import com.dental.clinic.management.booking_appointment.enums.AppointmentActionType;
import com.dental.clinic.management.booking_appointment.enums.AppointmentReasonCode;
import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.booking_appointment.repository.AppointmentAuditLogRepository;
import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanPhase;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientPlanPhaseRepository;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for updating appointment status with state machine validation.
 * This is the MOST CRITICAL API for daily clinic operations.
 *
 * Features:
 * - Pessimistic locking (SELECT FOR UPDATE) to prevent race conditions
 * - State machine validation (SCHEDULED -> CHECKED_IN -> IN_PROGRESS ->
 * COMPLETED)
 * - Auto-update actualStartTime/actualEndTime based on status transitions
 * - Comprehensive audit logging for compliance
 * - Business rule validation (e.g., CANCELLED requires reasonCode)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentStatusService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentAuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PatientPlanPhaseRepository phaseRepository;
    private final PatientPlanItemRepository itemRepository;
    private final EntityManager entityManager;
    private final PatientTreatmentPlanRepository planRepository;

    /**
     * Valid state transitions map.
     * Key: Current status
     * Value: Allowed next statuses
     *
     * State Machine:
     * - SCHEDULED -> CHECKED_IN, CANCELLED, NO_SHOW
     * - CHECKED_IN -> IN_PROGRESS, CANCELLED
     * - IN_PROGRESS -> COMPLETED, CANCELLED
     * - COMPLETED, CANCELLED, NO_SHOW -> No transitions (terminal states)
     */
    private static final Map<AppointmentStatus, Set<AppointmentStatus>> VALID_TRANSITIONS = Map.of(
            AppointmentStatus.SCHEDULED, Set.of(
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.CANCELLED,
                    AppointmentStatus.NO_SHOW),
            AppointmentStatus.CHECKED_IN, Set.of(
                    AppointmentStatus.IN_PROGRESS,
                    AppointmentStatus.CANCELLED),
            AppointmentStatus.IN_PROGRESS, Set.of(
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CANCELLED),
            AppointmentStatus.COMPLETED, Collections.emptySet(),
            AppointmentStatus.CANCELLED, Collections.emptySet(),
            AppointmentStatus.NO_SHOW, Collections.emptySet());

    /**
     * Update appointment status with full validation and audit logging.
     *
     * Transaction Flow:
     * 1. Lock appointment row (SELECT FOR UPDATE)
     * 2. Validate state transition
     * 3. Validate business rules (e.g., CANCELLED requires reasonCode)
     * 4. Update actualStartTime/actualEndTime if needed
     * 5. Update status and notes
     * 6. Create audit log
     * 7. Commit transaction
     *
     * @param appointmentCode Unique appointment code
     * @param request         Status update request
     * @return Updated appointment detail DTO (same as API 3.4)
     * @throws ResourceNotFoundException If appointment not found
     * @throws BusinessException         If state transition invalid or business
     *                                   rule violated
     */
    @Transactional
    public void updateStatus(String appointmentCode, UpdateAppointmentStatusRequest request) {
        log.info("Updating appointment status: code={}, newStatus={}", appointmentCode, request.getStatus());

        // Step 1: Lock appointment (SELECT FOR UPDATE)
        Appointment appointment = appointmentRepository.findByCodeForUpdate(appointmentCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "APPOINTMENT_NOT_FOUND",
                        "Appointment not found with code: " + appointmentCode));

        AppointmentStatus currentStatus = appointment.getStatus();
        AppointmentStatus newStatus;
        try {
            newStatus = AppointmentStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status value: " + request.getStatus());
        }

        // Step 2: Validate state transition
        validateStateTransition(currentStatus, newStatus);

        // Step 3: Validate business rules
        validateBusinessRules(newStatus, request);

        // Step 4: Update side-effects (actualStartTime/actualEndTime)
        LocalDateTime now = LocalDateTime.now();
        updateTimestamps(appointment, currentStatus, newStatus, now);

        // Step 5: Update status and notes
        appointment.setStatus(newStatus);
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }
        appointmentRepository.save(appointment);
        
        // Force flush appointment changes before updating related entities
        entityManager.flush();

        // Step 6: Create audit log
        createAuditLog(appointment, currentStatus, newStatus, request, now);

        // Step 7: Auto-update linked plan item statuses (V21.5)
        updateLinkedPlanItemsStatus(appointment.getAppointmentId(), newStatus, now);

        log.info("✅ Successfully updated appointment status: code={}, {} -> {}",
                appointmentCode, currentStatus, newStatus);
    }

    /**
     * Validate state machine transition.
     *
     * @throws IllegalStateException If transition is invalid
     */
    private void validateStateTransition(AppointmentStatus currentStatus, AppointmentStatus newStatus) {
        if (currentStatus == newStatus) {
            throw new IllegalStateException(
                    String.format("Appointment is already in %s status", currentStatus));
        }

        Set<AppointmentStatus> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null || !allowedTransitions.contains(newStatus)) {
            throw new IllegalStateException(
                    String.format("Cannot transition from %s to %s. Allowed transitions: %s",
                            currentStatus, newStatus, allowedTransitions));
        }
    }

    /**
     * Validate business rules for status updates.
     *
     * Rules:
     * - CANCELLED: Must provide reasonCode
     */
    private void validateBusinessRules(AppointmentStatus newStatus, UpdateAppointmentStatusRequest request) {
        if (newStatus == AppointmentStatus.CANCELLED) {
            if (request.getReasonCode() == null || request.getReasonCode().trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Reason code is required when cancelling an appointment");
            }
        }
    }

    /**
     * Update actualStartTime/actualEndTime based on status transitions.
     *
     * Rules:
     * - SCHEDULED -> CHECKED_IN: No timestamp update (just check-in)
     * - CHECKED_IN -> IN_PROGRESS: Set actualStartTime = NOW()
     * - IN_PROGRESS -> COMPLETED: Set actualEndTime = NOW()
     *
     * Note: We do NOT set actualStartTime on CHECKED_IN because check-in means
     * "patient arrived" but treatment hasn't started yet. Actual treatment starts
     * when status changes to IN_PROGRESS.
     */
    private void updateTimestamps(Appointment appointment, AppointmentStatus currentStatus,
            AppointmentStatus newStatus, LocalDateTime now) {

        // Set actualStartTime when treatment actually begins (IN_PROGRESS)
        if (currentStatus == AppointmentStatus.CHECKED_IN && newStatus == AppointmentStatus.IN_PROGRESS) {
            appointment.setActualStartTime(now);
            log.info("Set actualStartTime={} for appointment {}", now, appointment.getAppointmentCode());
        }

        // Set actualEndTime when treatment completes
        if (currentStatus == AppointmentStatus.IN_PROGRESS && newStatus == AppointmentStatus.COMPLETED) {
            appointment.setActualEndTime(now);
            log.info("Set actualEndTime={} for appointment {}", now, appointment.getAppointmentCode());
        }
    }

    /**
     * Create audit log for status change.
     */
    private void createAuditLog(Appointment appointment, AppointmentStatus oldStatus,
            AppointmentStatus newStatus, UpdateAppointmentStatusRequest request, LocalDateTime now) {

        Integer changedByEmployeeId = getCurrentEmployeeId();

        // Convert reasonCode String to enum (nullable)
        AppointmentReasonCode reasonCodeEnum = null;
        if (request.getReasonCode() != null && !request.getReasonCode().trim().isEmpty()) {
            try {
                reasonCodeEnum = AppointmentReasonCode.valueOf(request.getReasonCode().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid reason code: {}", request.getReasonCode());
            }
        }

        // Fetch employee entity if ID is not 0 (SYSTEM)
        com.dental.clinic.management.employee.domain.Employee performedByEmployee = null;
        if (changedByEmployeeId != 0) {
            performedByEmployee = employeeRepository.findById(changedByEmployeeId).orElse(null);
        }

        AppointmentAuditLog auditLog = AppointmentAuditLog.builder()
                .appointment(appointment)  // Set the relationship, not the ID
                .performedByEmployee(performedByEmployee)  // Set the relationship
                .actionType(AppointmentActionType.STATUS_CHANGE)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .reasonCode(reasonCodeEnum)
                .notes(request.getNotes())
                .createdAt(now)
                .build();

        auditLogRepository.save(auditLog);
        log.info("Created audit log: appointmentId={}, {} -> {}, changedBy={}",
                appointment.getAppointmentId(), oldStatus, newStatus, changedByEmployeeId);
    }

    /**
     * Get current employee ID from security context.
     * Returns 0 (SYSTEM) if not authenticated or employee mapping not found.
     */
    private Integer getCurrentEmployeeId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return 0; // SYSTEM
            }

            // Extract username from JWT token
            String username = null;
            if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
                username = jwt.getSubject();
            } else if (auth.getPrincipal() instanceof String) {
                username = (String) auth.getPrincipal();
            }

            if (username == null) {
                log.warn("Could not extract username from authentication principal");
                return 0;
            }

            return employeeRepository.findByAccount_Username(username)
                    .map(employee -> employee.getEmployeeId())
                    .orElse(0); // SYSTEM if employee not found
        } catch (Exception e) {
            log.warn("Failed to get employee ID from security context: {}", e.getMessage());
            return 0; // SYSTEM
        }
    }

    /**
     * V21.5: Auto-update linked treatment plan item statuses when appointment status changes.
     * 
     * Status Mapping:
     * - Appointment IN_PROGRESS → Plan items IN_PROGRESS
     * - Appointment COMPLETED → Plan items COMPLETED (with completedAt timestamp)
     * - Appointment CANCELLED → Plan items READY_FOR_BOOKING (allow re-booking)
     * 
     * This ensures treatment plan items stay synchronized with appointment progress,
     * eliminating manual status updates and preventing data inconsistency.
     * 
     * @param appointmentId The appointment ID (Integer type from Appointment entity)
     * @param appointmentStatus The new appointment status
     * @param timestamp The timestamp to use for completedAt (when status = COMPLETED)
     */
    private void updateLinkedPlanItemsStatus(Integer appointmentId, AppointmentStatus appointmentStatus, LocalDateTime timestamp) {
        // Only update plan items for specific status transitions
        if (appointmentStatus != AppointmentStatus.IN_PROGRESS 
                && appointmentStatus != AppointmentStatus.COMPLETED 
                && appointmentStatus != AppointmentStatus.CANCELLED) {
            log.debug("No plan item update needed for appointment status: {}", appointmentStatus);
            return;
        }

        // Find all plan items linked to this appointment
        String findItemsQuery = "SELECT item_id FROM appointment_plan_items WHERE appointment_id = ?";
        List<Long> itemIds = jdbcTemplate.queryForList(findItemsQuery, Long.class, appointmentId.longValue());
        
        log.info("🔍 Found {} plan items linked to appointment {} for status {}", itemIds.size(), appointmentId, appointmentStatus);
        
        if (itemIds.isEmpty()) {
            log.debug("No plan items linked to appointment {}", appointmentId);
            return;
        }

        // Determine target status for plan items
        PlanItemStatus targetStatus;
        switch (appointmentStatus) {
            case IN_PROGRESS:
                targetStatus = PlanItemStatus.IN_PROGRESS;
                break;
            case COMPLETED:
                targetStatus = PlanItemStatus.COMPLETED;
                break;
            case CANCELLED:
                targetStatus = PlanItemStatus.READY_FOR_BOOKING; // Allow re-booking
                break;
            default:
                log.warn("Unexpected appointment status for plan item update: {}", appointmentStatus);
                return;
        }

        // Update plan items based on appointment status using JPA (ensures same transaction)
        try {
            int updatedCount = 0;
            for (Long itemId : itemIds) {
                PatientPlanItem planItem = entityManager.find(PatientPlanItem.class, itemId);
                if (planItem != null) {
                    planItem.setStatus(targetStatus);
                    if (appointmentStatus == AppointmentStatus.COMPLETED) {
                        planItem.setCompletedAt(timestamp);
                    }
                    updatedCount++;
                }
            }
            
            if (updatedCount == 0) {
                log.warn("⚠️ No plan items updated for appointment {} - itemIds: {}", appointmentId, itemIds);
            } else {
                if (appointmentStatus == AppointmentStatus.COMPLETED) {
                    log.info("✅ Updated {} plan items to COMPLETED with timestamp for appointment {}", 
                        updatedCount, appointmentId);
                } else {
                    log.info("✅ Updated {} plan items to {} for appointment {}", 
                        updatedCount, targetStatus, appointmentId);
                }
            }
            
            // Force flush plan item updates to database before checking phases
            entityManager.flush();
        } catch (Exception e) {
            log.error("❌ Failed to update plan items for appointment {}: {}", appointmentId, e.getMessage(), e);
            throw new RuntimeException("Failed to update linked plan items", e);
        }

        // Step 8: Check and complete phases if all items in phase are done
        checkAndCompleteAffectedPhases(itemIds, appointmentStatus);
    }

    /**
     * Check and auto-complete phases when all items in a phase are COMPLETED or SKIPPED.
     * 
     * This method is called after updating plan items from appointment status changes.
     * It ensures that when all items in a phase are completed, the phase status is
     * automatically updated to COMPLETED.
     * 
     * Algorithm:
     * 1. Get unique phase IDs from the updated items
     * 2. For each phase, load all items
     * 3. Check if all items are COMPLETED or SKIPPED
     * 4. If yes, update phase status to COMPLETED with completion date
     * 
     * @param itemIds List of item IDs that were just updated
     * @param appointmentStatus The appointment status (only check for COMPLETED)
     */
    private void checkAndCompleteAffectedPhases(List<Long> itemIds, AppointmentStatus appointmentStatus) {
        // Only check phase completion when appointment is COMPLETED
        // (IN_PROGRESS and CANCELLED don't trigger phase completion)
        if (appointmentStatus != AppointmentStatus.COMPLETED) {
            return;
        }

        try {
            // Step 1: Get unique phase IDs from updated items
            Set<Long> phaseIds = new HashSet<>();
            for (Long itemId : itemIds) {
                // Load item - will get updated managed entities from persistence context
                PatientPlanItem item = itemRepository.findById(itemId).orElse(null);
                if (item != null && item.getPhase() != null) {
                    phaseIds.add(item.getPhase().getPatientPhaseId());
                }
            }

            if (phaseIds.isEmpty()) {
                log.debug("No phases found for updated items");
                return;
            }

        log.debug("Checking {} phases for auto-completion", phaseIds.size());

        // Step 2-4: Check and complete each phase
        Set<Long> planIds = new HashSet<>();
        for (Long phaseId : phaseIds) {
            checkAndCompleteSinglePhase(phaseId);
            
            // Collect plan IDs for later treatment plan completion check
            PatientPlanPhase phase = phaseRepository.findByIdWithPlanAndItems(phaseId).orElse(null);
            if (phase != null && phase.getTreatmentPlan() != null) {
                planIds.add(phase.getTreatmentPlan().getPlanId());
            }
        }

        // Step 5: Check and complete treatment plans if all phases are done
        log.debug("Checking {} treatment plans for auto-completion", planIds.size());
        for (Long planId : planIds) {
            checkAndCompletePlan(planId);
        }

    } catch (Exception e) {
        log.error("❌ Failed to check phase completion: {}", e.getMessage(), e);
        // Don't throw - phase completion is a nice-to-have feature
        // Main plan item update should not fail because of this
    }
}    /**
     * Check and complete a single phase if all its items are done.
     * 
     * IMPORTANT: Clears entity manager cache before loading to avoid stale data
     * after direct SQL updates.
     * 
     * @param phaseId The phase ID to check
     */
    private void checkAndCompleteSinglePhase(Long phaseId) {
        // Load phase with all items - will include recently updated managed entities
        PatientPlanPhase phase = phaseRepository.findByIdWithPlanAndItems(phaseId).orElse(null);
        if (phase == null) {
            log.warn("Phase {} not found for completion check", phaseId);
            return;
        }

        // Skip if phase is already completed
        if (phase.getStatus() == PhaseStatus.COMPLETED) {
            log.debug("Phase {} already completed", phaseId);
            return;
        }

        // Check if all items are COMPLETED or SKIPPED
        List<PatientPlanItem> items = phase.getItems();
        if (items.isEmpty()) {
            log.debug("Phase {} has no items", phaseId);
            return;
        }

        boolean allDone = items.stream()
                .allMatch(item -> item.getStatus() == PlanItemStatus.COMPLETED ||
                        item.getStatus() == PlanItemStatus.SKIPPED);

        if (allDone) {
            // Update phase to COMPLETED
            phase.setStatus(PhaseStatus.COMPLETED);
            phase.setCompletionDate(java.time.LocalDate.now());
            phaseRepository.save(phase);
            log.info("🎯 Phase {} auto-completed: all {} items are done", phaseId, items.size());
        } else {
            long completedCount = items.stream()
                    .filter(item -> item.getStatus() == PlanItemStatus.COMPLETED ||
                            item.getStatus() == PlanItemStatus.SKIPPED)
                    .count();
            log.debug("Phase {} not completed yet: {}/{} items done", 
                    phaseId, completedCount, items.size());
        }
    }

    /**
     * Check and complete treatment plan if all phases are completed.
     *
     * IMPORTANT: Clears entity manager cache before loading to avoid stale data
     * after direct SQL updates.
     *
     * Business Logic:
     * - When all phases in a plan are COMPLETED
     * - And plan status is IN_PROGRESS
     * - Then automatically set plan.status = COMPLETED
     *
     * @param planId The treatment plan ID to check
     */
    private void checkAndCompletePlan(Long planId) {
        // Load plan - will reflect current state from persistence context
        PatientTreatmentPlan plan = planRepository.findById(planId).orElse(null);
        if (plan == null) {
            log.warn("Treatment plan {} not found for completion check", planId);
            return;
        }

        // Only check if plan is currently IN_PROGRESS
        if (plan.getStatus() != TreatmentPlanStatus.IN_PROGRESS) {
            log.debug("Plan {} not in IN_PROGRESS status (current: {}), skipping completion check", 
                    planId, plan.getStatus());
            return;
        }

        // Load phases - need fresh data
        List<PatientPlanPhase> phases = plan.getPhases();
        
        if (phases == null || phases.isEmpty()) {
            log.debug("Plan {} has no phases", planId);
            return;
        }

        // Check if ALL phases are COMPLETED
        boolean allPhasesCompleted = phases.stream()
                .allMatch(phase -> phase.getStatus() == PhaseStatus.COMPLETED);

        if (allPhasesCompleted) {
            // AUTO-COMPLETE: IN_PROGRESS → COMPLETED
            plan.setStatus(TreatmentPlanStatus.COMPLETED);
            planRepository.save(plan);
            log.info("✅ Treatment plan {} (code: {}) auto-completed: all {} phases are done",
                    planId, plan.getPlanCode(), phases.size());
        } else {
            long completedPhasesCount = phases.stream()
                    .filter(phase -> phase.getStatus() == PhaseStatus.COMPLETED)
                    .count();
            log.debug("Plan {} not completed yet: {}/{} phases done",
                    planId, completedPhasesCount, phases.size());
        }
    }
}
