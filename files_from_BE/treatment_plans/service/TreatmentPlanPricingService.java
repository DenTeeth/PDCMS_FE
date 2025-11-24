package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.domain.PlanAuditLog;
import com.dental.clinic.management.treatment_plans.dto.request.UpdatePricesRequest;
import com.dental.clinic.management.treatment_plans.dto.response.UpdatePricesResponse;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.treatment_plans.repository.PlanAuditLogRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for Treatment Plan Price Management (API 5.13 - V21.4).
 * Handles price adjustments by Finance/Accounting team.
 *
 * Part of new pricing model: Doctors don't manage prices, Finance does.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanPricingService {

    private final PatientTreatmentPlanRepository planRepository;
    private final PatientPlanItemRepository itemRepository;
    private final PlanAuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * API 5.13: Update treatment plan prices (Finance only).
     *
     * Business Rules:
     * 1. Plan must exist
     * 2. Plan must not be COMPLETED or CANCELLED
     * 3. All items must exist and belong to the plan
     * 4. New prices must be >= 0
     * 5. Recalculate total cost after price updates
     * 6. Log audit trail with who/when/why
     *
     * @param planCode Treatment plan code
     * @param request  Price update request with item prices and discount
     * @return Update summary with before/after costs
     */
    @Transactional
    public UpdatePricesResponse updatePlanPrices(String planCode, UpdatePricesRequest request) {

        log.info("💰 Starting price update for plan: {} (Finance adjustment)", planCode);

        // 1. Get current employee (Finance/Manager)
        Integer employeeId = getCurrentEmployeeId();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Nhân viên không tồn tại"));

        // 2. Find treatment plan
        PatientTreatmentPlan plan = planRepository.findByPlanCode(planCode)
                .orElseThrow(() -> new NotFoundException("Lộ trình điều trị không tồn tại"));

        // 3. GUARD: Cannot update prices for closed plans
        if (plan.getStatus() == TreatmentPlanStatus.COMPLETED
                || plan.getStatus() == TreatmentPlanStatus.CANCELLED) {
            throw new ConflictException(
                    String.format("Không thể cập nhật giá cho lộ trình đã đóng (trạng thái: %s)",
                            plan.getStatus()));
        }

        // 4. Store old total cost for comparison
        BigDecimal totalCostBefore = plan.getTotalPrice();

        // 5. Validate and update item prices
        int itemsUpdated = updateItemPrices(plan, request.getItems(), employee);

        // 6. Update discount if provided
        boolean discountUpdated = false;
        if (request.getDiscountAmount() != null) {
            plan.setDiscountAmount(request.getDiscountAmount());
            discountUpdated = true;
            log.info("Updated discount amount: {} VND", request.getDiscountAmount());
        }

        // 7. Recalculate total cost
        BigDecimal totalCostAfter = recalculateTotalCost(plan);
        plan.setTotalPrice(totalCostAfter);

        // 8. Calculate final cost (total - discount)
        BigDecimal discount = plan.getDiscountAmount() != null
                ? plan.getDiscountAmount()
                : BigDecimal.ZERO;
        BigDecimal finalCost = totalCostAfter.subtract(discount);
        plan.setFinalCost(finalCost);

        // 9. Save plan with updated costs
        planRepository.save(plan);

        // 10. Create audit log
        createPriceAuditLog(plan, employee, totalCostBefore, totalCostAfter,
                request.getDiscountNote(), itemsUpdated);

        log.info("✅ Price update completed for plan {}. Cost: {} → {} VND (discount: {} VND)",
                planCode, totalCostBefore, totalCostAfter, discount);

        // 11. Build response
        return UpdatePricesResponse.builder()
                .planCode(planCode)
                .totalCostBefore(totalCostBefore)
                .totalCostAfter(totalCostAfter)
                .finalCost(finalCost)
                .itemsUpdated(itemsUpdated)
                .discountUpdated(discountUpdated)
                .updatedBy(employee.getFullName())
                .updatedByEmployeeCode(employee.getEmployeeCode())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Update individual item prices and create audit trail.
     *
     * @param plan     Treatment plan
     * @param updates  List of item price updates
     * @param employee Employee performing the update
     * @return Number of items updated
     */
    private int updateItemPrices(PatientTreatmentPlan plan,
                                  List<UpdatePricesRequest.ItemPriceUpdate> updates,
                                  Employee employee) {

        if (updates == null || updates.isEmpty()) {
            log.debug("No item price updates requested");
            return 0;
        }

        // 1. Extract item IDs
        List<Long> itemIds = updates.stream()
                .map(UpdatePricesRequest.ItemPriceUpdate::getItemId)
                .collect(Collectors.toList());

        // 2. Fetch items with plan relationship
        List<PatientPlanItem> items = itemRepository.findByIdInWithPlanAndPhase(itemIds);

        // 3. GUARD: All items must exist
        if (items.size() != itemIds.size()) {
            List<Long> foundIds = items.stream()
                    .map(PatientPlanItem::getItemId)
                    .collect(Collectors.toList());
            List<Long> missingIds = new ArrayList<>(itemIds);
            missingIds.removeAll(foundIds);
            throw new NotFoundException(
                    String.format("Không tìm thấy hạng mục: %s", missingIds));
        }

        // 4. GUARD: All items must belong to the plan
        for (PatientPlanItem item : items) {
            if (!item.getPhase().getTreatmentPlan().getPlanId().equals(plan.getPlanId())) {
                throw new BadRequestException(
                        String.format("Hạng mục %d không thuộc lộ trình %s",
                                item.getItemId(), plan.getPlanCode()));
            }
        }

        // 5. Create map for quick lookup
        Map<Long, UpdatePricesRequest.ItemPriceUpdate> updateMap = updates.stream()
                .collect(Collectors.toMap(
                        UpdatePricesRequest.ItemPriceUpdate::getItemId,
                        update -> update));

        // 6. Update prices
        int updatedCount = 0;
        for (PatientPlanItem item : items) {
            UpdatePricesRequest.ItemPriceUpdate update = updateMap.get(item.getItemId());
            if (update != null) {
                BigDecimal oldPrice = item.getPrice();
                BigDecimal newPrice = update.getNewPrice();

                if (!oldPrice.equals(newPrice)) {
                    item.setPrice(newPrice);
                    item.setPriceUpdatedBy(employee);
                    item.setPriceUpdatedAt(LocalDateTime.now());
                    item.setPriceUpdateReason(update.getNote());
                    updatedCount++;

                    log.info("Updated item {} price: {} → {} VND (reason: {})",
                            item.getItemId(), oldPrice, newPrice, update.getNote());
                }
            }
        }

        // 7. Batch save
        if (updatedCount > 0) {
            itemRepository.saveAll(items);
        }

        return updatedCount;
    }

    /**
     * Recalculate total cost by summing all item prices.
     *
     * @param plan Treatment plan
     * @return New total cost
     */
    private BigDecimal recalculateTotalCost(PatientTreatmentPlan plan) {
        BigDecimal total = BigDecimal.ZERO;

        for (var phase : plan.getPhases()) {
            for (var item : phase.getItems()) {
                if (item.getPrice() != null) {
                    // Note: PatientPlanItem doesn't have quantity field, each item counts as 1
                    total = total.add(item.getPrice());
                }
            }
        }

        log.debug("Recalculated total cost: {} VND", total);
        return total;
    }

    /**
     * Create audit log for price adjustment.
     *
     * @param plan             Treatment plan
     * @param employee         Employee who made the change
     * @param totalCostBefore  Cost before update
     * @param totalCostAfter   Cost after update
     * @param discountNote     Notes about discount
     * @param itemsUpdated     Number of items updated
     */
    private void createPriceAuditLog(PatientTreatmentPlan plan,
                                      Employee employee,
                                      BigDecimal totalCostBefore,
                                      BigDecimal totalCostAfter,
                                      String discountNote,
                                      int itemsUpdated) {

        String notes = String.format(
                "Kế toán cập nhật giá: %d hạng mục. " +
                "Tổng chi phí: %s → %s VND. " +
                "%s",
                itemsUpdated,
                totalCostBefore,
                totalCostAfter,
                discountNote != null ? "Lý do: " + discountNote : ""
        );

        PlanAuditLog auditLog = PlanAuditLog.builder()
                .treatmentPlan(plan)
                .actionType("PRICE_ADJUSTED")
                .performedBy(employee)
                .notes(notes)
                .build();
        // createdAt auto-populated by @PrePersist

        auditLogRepository.save(auditLog);
        log.debug("Created audit log for price adjustment");
    }

    /**
     * Get current employee ID from security context.
     *
     * @return Employee ID
     */
    private Integer getCurrentEmployeeId() {
        return SecurityUtil.getCurrentUserLogin()
                .flatMap(employeeRepository::findByAccount_Username)
                .map(Employee::getEmployeeId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin nhân viên"));
    }
}
