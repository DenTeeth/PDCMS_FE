package com.dental.clinic.management.treatment_plans.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for API 5.13 (Update Treatment Plan Prices - Finance).
 * Allows Finance/Accounting team to adjust item prices and discounts.
 *
 * V21.4: Part of new pricing model where doctors don't manage prices.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update treatment plan prices (Finance only)")
public class UpdatePricesRequest {

    @SuppressWarnings("deprecation")
    @NotEmpty(message = "Danh sách hạng mục cần cập nhật giá không được trống")
    @Valid
    @Schema(description = "List of items to update prices", required = true)
    private List<ItemPriceUpdate> items;

    @DecimalMin(value = "0", message = "Số tiền giảm giá phải >= 0")
    @Schema(description = "New discount amount (optional)", example = "200000")
    private BigDecimal discountAmount;

    @Schema(description = "Reason for discount adjustment", example = "Voucher sinh nhật")
    private String discountNote;

    /**
     * Inner DTO for individual item price update.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Price update for a single item")
    public static class ItemPriceUpdate {

        @SuppressWarnings("deprecation")
        @NotNull(message = "Item ID không được trống")
        @Schema(description = "Patient plan item ID", required = true, example = "536")
        private Long itemId;

        @SuppressWarnings("deprecation")
        @NotNull(message = "Giá mới không được trống")
        @DecimalMin(value = "0", message = "Giá mới phải >= 0")
        @Schema(description = "New price for item", required = true, example = "450000")
        private BigDecimal newPrice;

        @Schema(description = "Reason for price adjustment", example = "Khuyến mãi 10% cho khách hàng thân thiết")
        private String note;
    }
}
