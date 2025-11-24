package com.dental.clinic.management.treatment_plans.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO cho API 5.11: Xóa Hạng mục khỏi Lộ trình
 *
 * Option B (Full Response) - Cung cấp đầy đủ thông tin cho FE hiển thị toast
 * notification
 * với chi tiết item bị xóa và tác động tài chính lên plan.
 *
 * Example Toast: "Đã xóa 'Trám răng Composite' (-1.500.000đ)"
 */
public record DeletePlanItemResponse(
        String message,
        Long deletedItemId,
        String deletedItemName, // 👈 Option B: FE có thể show tên item
        BigDecimal priceReduction, // 👈 Option B: FE có thể show mức giảm giá
        FinancialImpactDTO financialImpact) {
    /**
     * Factory method tạo response sau khi xóa thành công
     *
     * @param deletedItemId   ID của item đã xóa
     * @param deletedItemName Tên của item đã xóa
     * @param priceReduction  Mức giảm giá (giá của item bị xóa)
     * @param planTotalCost   Tổng chi phí mới của plan sau khi xóa
     * @param planFinalCost   Chi phí cuối cùng mới của plan sau khi xóa
     * @return DeletePlanItemResponse instance
     */
    public static DeletePlanItemResponse of(
            Long deletedItemId,
            String deletedItemName,
            BigDecimal priceReduction,
            BigDecimal planTotalCost,
            BigDecimal planFinalCost) {
        return new DeletePlanItemResponse(
                "Hạng mục đã được xóa thành công.",
                deletedItemId,
                deletedItemName,
                priceReduction,
                new FinancialImpactDTO(planTotalCost, planFinalCost, null));
    }

    /**
     * Nested DTO cho tác động tài chính lên toàn bộ plan
     */
    public record FinancialImpactDTO(
            BigDecimal planTotalCost, // Tổng chi phí mới (trước discount)
            BigDecimal planFinalCost, // Chi phí cuối cùng mới (sau discount)
            BigDecimal priceChange // Null for delete (priceReduction is used instead)
    ) {
    }
}
