package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.booking_appointment.domain.DentalService;
import com.dental.clinic.management.booking_appointment.repository.BookingDentalServiceRepository;
import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanPhase;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.request.AddItemToPhaseRequest;
import com.dental.clinic.management.treatment_plans.dto.response.AddItemsToPhaseResponse;
import com.dental.clinic.management.treatment_plans.dto.response.AddItemsToPhaseResponse.ApprovalWorkflowDTO;
import com.dental.clinic.management.treatment_plans.dto.response.AddItemsToPhaseResponse.CreatedItemDTO;
import com.dental.clinic.management.treatment_plans.dto.response.AddItemsToPhaseResponse.FinancialImpactDTO;
import com.dental.clinic.management.treatment_plans.enums.PhaseStatus;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientPlanPhaseRepository;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for adding new items to existing treatment plan phases.
 * Implements API 5.7: POST /api/v1/patient-plan-phases/{phaseId}/items
 *
 * Core Features:
 * 1. Auto-sequence generation (append to end of phase)
 * 2. Quantity expansion (1 service × 2 quantity = 2 items)
 * 3. Financial recalculation (correct discount logic)
 * 4. Approval workflow (plan → PENDING_REVIEW if cost changes)
 * 5. Comprehensive validation (phase/plan status)
 * 6. Audit logging
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanItemAdditionService {

        private final PatientPlanPhaseRepository phaseRepository;
        private final PatientTreatmentPlanRepository planRepository;
        private final PatientPlanItemRepository itemRepository;
        private final BookingDentalServiceRepository serviceRepository;
        private final TreatmentPlanRBACService rbacService;

        private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter
                        .ofPattern("yyyy-MM-dd'T'HH:mm:ss");

        /**
         * Add new items to a phase with full business logic
         *
         * @param phaseId  Phase ID to add items to
         * @param requests List of items to add
         * @return Response with created items, financial impact, and approval status
         */
        @Transactional
        public AddItemsToPhaseResponse addItemsToPhase(Long phaseId, List<AddItemToPhaseRequest> requests, Boolean autoSubmit) {
                // V21.4: Default autoSubmit to true for backward compatibility
                if (autoSubmit == null) {
                        autoSubmit = true;
                }

                log.info("🔄 Adding {} item request(s) to phase {} (autoSubmit={})", requests.size(), phaseId, autoSubmit);

                // ===== STEP 1: VALIDATION =====
                // Find phase with plan and items
                PatientPlanPhase phase = phaseRepository.findByIdWithPlanAndItems(phaseId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "PHASE_NOT_FOUND",
                                                "Treatment plan phase not found with ID: " + phaseId));

                PatientTreatmentPlan plan = phase.getTreatmentPlan();

                // RBAC verification (EMPLOYEE can only modify plans they created)
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                rbacService.verifyEmployeeCanModifyPlan(plan, authentication);

                // Validate phase status
                if (phase.getStatus() == PhaseStatus.COMPLETED) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Cannot add items to completed phase");
                }

                // V21.4: Validate plan approval status - allow DRAFT and APPROVED
                // - DRAFT: Doctor can add items freely (with autoSubmit=false)
                // - APPROVED: Doctor can add "phát sinh" items (with autoSubmit=true, will trigger review)
                // - PENDING_REVIEW: Cannot add (must wait for approval/rejection)
                if (plan.getApprovalStatus() == ApprovalStatus.PENDING_REVIEW) {
                        String errorMsg = String.format(
                                        "Không thể thêm hạng mục vào lộ trình đang chờ duyệt. " +
                                        "Vui lòng chờ Quản lý duyệt hoặc từ chối trước khi chỉnh sửa.");
                        throw new ConflictException("PLAN_PENDING_REVIEW_CANNOT_ADD", errorMsg);
                }

                // V21.4: Log warning if adding to APPROVED plan
                if (plan.getApprovalStatus() == ApprovalStatus.APPROVED) {
                        log.warn("⚠️ Adding items to APPROVED plan {}. Will auto-submit for re-approval (autoSubmit={})",
                                plan.getPlanCode(), autoSubmit);
                }

                // Validate plan status
                if (plan.getStatus() == TreatmentPlanStatus.COMPLETED ||
                                plan.getStatus() == TreatmentPlanStatus.CANCELLED) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        String.format("Cannot add items to %s plan", plan.getStatus()));
                }

                // ===== STEP 2: PREPARE & EXPAND ITEMS =====
                BigDecimal totalCostAdded = BigDecimal.ZERO;
                List<PatientPlanItem> itemsToInsert = new ArrayList<>();

                // Get next sequence number (max + 1)
                int nextSequence = phase.getItems().stream()
                                .mapToInt(PatientPlanItem::getSequenceNumber)
                                .max()
                                .orElse(0) + 1;

                log.info("📊 Starting sequence number: {}", nextSequence);

                String currentUser = getCurrentUsername();

                // Loop through requests and expand by quantity
                for (AddItemToPhaseRequest request : requests) {
                        // Validate and get service
                        DentalService service = validateAndGetService(request.getServiceCode());

                        // V21.4: Auto-fill price from service if not provided
                        BigDecimal itemPrice = request.getPrice();
                        if (itemPrice == null) {
                                itemPrice = service.getPrice();
                                log.debug("V21.4: Auto-filled price for {}: {} VND (from service default)",
                                        service.getServiceCode(), itemPrice);
                        }

                        // V21.4: NO MORE PRICE VALIDATION
                        // Doctors use default prices, Finance adjusts later via API 5.13
                        // validatePriceOverride() method deprecated

                        // Expand by quantity
                        for (int i = 1; i <= request.getQuantity(); i++) {
                                String itemName = buildItemName(service.getServiceName(), request.getQuantity(), i);

                                PatientPlanItem item = PatientPlanItem.builder()
                                                .phase(phase)
                                                .serviceId(service.getServiceId())
                                                .sequenceNumber(nextSequence++)
                                                .itemName(itemName)
                                                .price(itemPrice) // V21.4: Auto-filled or provided price
                                                .estimatedTimeMinutes(service.getDefaultDurationMinutes())
                                                .status(PlanItemStatus.PENDING) // Waiting for manager approval
                                                .build();

                                itemsToInsert.add(item);
                                totalCostAdded = totalCostAdded.add(itemPrice); // V21.4: Use auto-filled price

                                log.info("✨ Created item: seq={}, name={}, price={}",
                                                item.getSequenceNumber(), itemName, itemPrice);
                        }
                }

                // ===== STEP 3: BATCH INSERT =====
                List<PatientPlanItem> savedItems = itemRepository.saveAll(itemsToInsert);
                log.info("💾 Saved {} items to database", savedItems.size());

                // ===== STEP 4: FINANCIAL RECALCULATION (P0 FIX) =====
                BigDecimal oldTotalCost = plan.getTotalPrice();
                BigDecimal oldFinalCost = plan.getFinalCost();

                BigDecimal newTotalCost = oldTotalCost.add(totalCostAdded);
                plan.setTotalPrice(newTotalCost);

                // Recalculate final cost with discount
                // Discount is FIXED AMOUNT (not percentage)
                BigDecimal newFinalCost = newTotalCost.subtract(plan.getDiscountAmount());
                plan.setFinalCost(newFinalCost);

                log.info("💰 Financial update: total {} → {}, final {} → {}",
                                oldTotalCost, newTotalCost, oldFinalCost, newFinalCost);

                // ===== STEP 5: APPROVAL WORKFLOW (V21.4: Conditional auto-submit) =====
                ApprovalStatus oldApprovalStatus = plan.getApprovalStatus();

                // V21.4: Only auto-submit if autoSubmit=true AND plan was APPROVED
                if (autoSubmit && oldApprovalStatus == ApprovalStatus.APPROVED) {
                        plan.setApprovalStatus(ApprovalStatus.PENDING_REVIEW);
                        log.info("📋 V21.4: Auto-submitted plan. Approval status: {} → PENDING_REVIEW (autoSubmit=true)",
                                oldApprovalStatus);
                } else {
                        log.info("📋 V21.4: Skipped auto-submit. Plan remains in {} (autoSubmit={})",
                                oldApprovalStatus, autoSubmit);
                }

                // ===== STEP 6: SAVE PLAN =====
                planRepository.save(plan);

                // ===== STEP 7: AUDIT LOG =====
                log.info("Audit: User {} added {} items to phase {} (plan {}). " +
                                "Total cost increased by {} VND. Plan status changed to PENDING_REVIEW",
                                currentUser, savedItems.size(), phaseId, plan.getPlanCode(),
                                totalCostAdded);

                // ===== STEP 8: BUILD RESPONSE =====
                return buildResponse(savedItems, requests, oldTotalCost, newTotalCost,
                                oldFinalCost, newFinalCost, totalCostAdded, oldApprovalStatus, currentUser);
        }

        /**
         * Validate service exists and is active
         */
        private DentalService validateAndGetService(String serviceCode) {
                DentalService service = serviceRepository.findByServiceCode(serviceCode)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Service not found with code: " + serviceCode));

                if (!service.getIsActive()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Service is not active: " + serviceCode);
                }

                return service;
        }

        /**
         * DEPRECATED in V21.4: Price validation removed.
         * Doctors now use service default prices only.
         * Finance team adjusts prices via API 5.13 (MANAGE_PLAN_PRICING permission).
         *
         * Previous logic: Validate price override within 50%-150% of service default price.
         * Reason for removal: Separation of concerns - clinical vs financial decisions.
         */
        @SuppressWarnings("unused")
        @Deprecated
        private void validatePriceOverride(BigDecimal requestPrice, BigDecimal servicePrice, String serviceCode) {
                // V21.4: METHOD DEPRECATED AND UNUSED
                // Price validation removed to simplify doctor workflow
                log.debug("V21.4: validatePriceOverride() is deprecated and no longer called");
        }

        /**
         * Build item name with quantity suffix if needed
         * Example: "Trám răng Composite (Phát sinh - Lần 1)"
         */
        private String buildItemName(String serviceName, int quantity, int currentIndex) {
                if (quantity > 1) {
                        return serviceName + String.format(" (Phát sinh - Lần %d)", currentIndex);
                } else {
                        return serviceName + " (Phát sinh)";
                }
        }

        /**
         * Build comprehensive response
         */
        private AddItemsToPhaseResponse buildResponse(
                        List<PatientPlanItem> savedItems,
                        List<AddItemToPhaseRequest> requests,
                        BigDecimal oldTotalCost,
                        BigDecimal newTotalCost,
                        BigDecimal oldFinalCost,
                        BigDecimal newFinalCost,
                        BigDecimal totalCostAdded,
                        ApprovalStatus oldApprovalStatus,
                        String currentUser) {

                // Map request notes (by serviceCode) for response
                // Since quantity expansion creates multiple items from one request,
                // we need to map notes from request
                String firstRequestNotes = requests.isEmpty() ? null : requests.get(0).getNotes();

                List<CreatedItemDTO> itemDTOs = savedItems.stream()
                                .map(item -> {
                                        DentalService service = serviceRepository.findById(item.getServiceId())
                                                        .orElse(null);
                                        String serviceCode = service != null ? service.getServiceCode() : null;

                                        return CreatedItemDTO.builder()
                                                        .itemId(item.getItemId())
                                                        .sequenceNumber(item.getSequenceNumber())
                                                        .itemName(item.getItemName())
                                                        .serviceCode(serviceCode)
                                                        .serviceId(item.getServiceId())
                                                        .price(item.getPrice())
                                                        .estimatedTimeMinutes(item.getEstimatedTimeMinutes())
                                                        .status(item.getStatus().name())
                                                        .notes(firstRequestNotes) // Attach notes from request
                                                        .createdAt(LocalDateTime.now().format(DATETIME_FORMATTER))
                                                        .createdBy(currentUser)
                                                        .build();
                                })
                                .toList();

                FinancialImpactDTO financialImpact = FinancialImpactDTO.builder()
                                .totalCostAdded(totalCostAdded)
                                .planTotalCostBefore(oldTotalCost)
                                .planTotalCostAfter(newTotalCost)
                                .planFinalCostBefore(oldFinalCost)
                                .planFinalCostAfter(newFinalCost)
                                .discountApplied(true)
                                .discountAmount(newTotalCost.subtract(newFinalCost))
                                .build();

                ApprovalWorkflowDTO approvalWorkflow = ApprovalWorkflowDTO.builder()
                                .approvalRequired(true)
                                .previousApprovalStatus(oldApprovalStatus.name())
                                .newApprovalStatus(ApprovalStatus.PENDING_REVIEW.name())
                                .reason("Cost change requires manager re-approval")
                                .build();

                String message = String.format(
                                "Successfully added %d items to phase. Plan status changed to PENDING_REVIEW and requires manager approval.",
                                savedItems.size());

                return AddItemsToPhaseResponse.builder()
                                .items(itemDTOs)
                                .financialImpact(financialImpact)
                                .approvalWorkflow(approvalWorkflow)
                                .message(message)
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
