package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanPhase;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.request.ReorderItemsRequest;
import com.dental.clinic.management.treatment_plans.dto.response.ReorderItemsResponse;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientPlanPhaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for Treatment Plan Item Reordering (API 5.14 - V21.5).
 * Handles drag-and-drop reordering of items within a phase.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanReorderService {

    private final PatientPlanPhaseRepository phaseRepository;
    private final PatientPlanItemRepository itemRepository;

    /**
     * API 5.14: Reorder items within a phase.
     *
     * Business Rules:
     * 1. Phase must exist
     * 2. Plan must not be COMPLETED or CANCELLED
     * 3. Plan should be DRAFT or PENDING_REVIEW (not APPROVED)
     * 4. All items must exist and belong to the phase
     * 5. Item count must match (no missing/extra items)
     * 6. Update sequence_number based on array position
     *
     * Uses SERIALIZABLE isolation to prevent race conditions.
     *
     * @param phaseId Phase ID
     * @param request Reorder request with item IDs in new order
     * @return Response with updated sequence numbers
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ReorderItemsResponse reorderPhaseItems(Long phaseId, ReorderItemsRequest request) {

        log.info(" Starting reorder for phase: {} with {} items", phaseId, request.getItemIds().size());

        // 1. Find phase with plan relationship
        PatientPlanPhase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giai đoạn điều trị"));

        // 2. Get parent plan
        PatientTreatmentPlan plan = phase.getTreatmentPlan();

        // 3. GUARD: Cannot reorder in closed plans
        if (plan.getStatus() == TreatmentPlanStatus.COMPLETED
                || plan.getStatus() == TreatmentPlanStatus.CANCELLED) {
            throw new ConflictException(
                    String.format("Không thể sắp xếp lại hạng mục trong lộ trình đã đóng (trạng thái: %s)",
                            plan.getStatus()));
        }

        // 4. GUARD: Should not reorder in APPROVED plans (recommendation)
        // Allow with warning log, but strict mode would block here
        if (plan.getApprovalStatus() == ApprovalStatus.APPROVED) {
            log.warn(" Reordering items in APPROVED plan {}. Consider reverting to DRAFT first.",
                    plan.getPlanCode());
            // Optionally throw exception for strict mode:
            // throw new ConflictException("Lộ trình đã duyệt. Vui lòng chuyển về DRAFT để chỉnh sửa.");
        }

        // 5. Fetch current items in phase
        List<PatientPlanItem> currentItems = phase.getItems();

        if (currentItems.isEmpty()) {
            throw new BadRequestException("Giai đoạn không có hạng mục để sắp xếp");
        }

        // 6. GUARD: Item count must match
        if (currentItems.size() != request.getItemIds().size()) {
            throw new BadRequestException(
                    String.format("Số lượng hạng mục không khớp. Hiện tại: %d, Yêu cầu: %d",
                            currentItems.size(), request.getItemIds().size()));
        }

        // 7. Create item map for quick lookup
        Map<Long, PatientPlanItem> itemMap = currentItems.stream()
                .collect(Collectors.toMap(PatientPlanItem::getItemId, item -> item));

        // 8. GUARD: All requested items must exist in phase
        List<Long> requestedIds = request.getItemIds();
        for (Long itemId : requestedIds) {
            if (!itemMap.containsKey(itemId)) {
                throw new BadRequestException(
                        String.format("Hạng mục %d không thuộc giai đoạn này", itemId));
            }
        }

        // 9. Update sequence numbers based on array position
        List<PatientPlanItem> reorderedItems = new ArrayList<>();
        for (int i = 0; i < requestedIds.size(); i++) {
            Long itemId = requestedIds.get(i);
            PatientPlanItem item = itemMap.get(itemId);

            int newSequence = i + 1; // 1-based sequence
            int oldSequence = item.getSequenceNumber();

            if (oldSequence != newSequence) {
                item.setSequenceNumber(newSequence);
                reorderedItems.add(item);
                log.debug("Item {} sequence: {} → {}", itemId, oldSequence, newSequence);
            } else {
                reorderedItems.add(item);
            }
        }

        // 10. Batch save all items (even if some unchanged, for consistency)
        itemRepository.saveAll(reorderedItems);

        log.info(" Reordered {} items in phase {}", reorderedItems.size(), phaseId);

        // 11. Build response
        List<ReorderItemsResponse.ReorderedItem> responseItems = reorderedItems.stream()
                .map(item -> ReorderItemsResponse.ReorderedItem.builder()
                        .itemId(item.getItemId())
                        .itemName(item.getItemName())
                        .sequenceNumber(item.getSequenceNumber())
                        .build())
                .collect(Collectors.toList());

        return ReorderItemsResponse.builder()
                .phaseId(phaseId)
                .phaseName(phase.getPhaseName())
                .itemsReordered(reorderedItems.size())
                .items(responseItems)
                .build();
    }
}
