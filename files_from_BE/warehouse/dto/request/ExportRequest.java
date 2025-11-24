package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequest {

    @NotBlank(message = "Ghi chú không được để trống")
    private String notes;

    @NotEmpty(message = "Danh sách vật tư xuất kho không được để trống")
    @Valid
    private List<ExportItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExportItemRequest {

        @NotNull(message = "Mã vật tư không được để trống")
        private Long itemMasterId;

        @NotNull(message = "Số lượng xuất không được để trống")
        @Positive(message = "Số lượng xuất phải lớn hơn 0")
        private Integer quantity;
    }
}
