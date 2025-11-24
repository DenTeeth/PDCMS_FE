package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportRequest {

    @NotNull(message = "Mã nhà cung cấp không được để trống")
    private Long supplierId;

    @NotBlank(message = "Ghi chú không được để trống")
    private String notes;

    @NotEmpty(message = "Danh sách vật tư nhập kho không được để trống")
    @Valid
    private List<ImportItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportItemRequest {

        @NotNull(message = "Mã vật tư không được để trống")
        private Long itemMasterId;

        @NotBlank(message = "Số lô không được để trống")
        private String lotNumber;

        @NotNull(message = "Số lượng nhập không được để trống")
        @Positive(message = "Số lượng nhập phải lớn hơn 0")
        private Integer quantity;

        // Nullable - chỉ bắt buộc với vật tư COLD + không phải tool
        private LocalDate expiryDate;
    }
}
