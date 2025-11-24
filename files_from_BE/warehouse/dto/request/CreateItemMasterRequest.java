package com.dental.clinic.management.warehouse.dto.request;

import com.dental.clinic.management.warehouse.enums.WarehouseType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateItemMasterRequest {

    @NotBlank(message = "Mã vật tư không được để trống")
    private String itemCode;

    @NotBlank(message = "Tên vật tư không được để trống")
    private String itemName;

    private String description;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unitOfMeasure; // "Hộp", "Lọ", "Cái", "Túi"

    @NotNull(message = "Loại kho không được để trống")
    private WarehouseType warehouseType;

    @NotNull(message = "Tồn kho tối thiểu không được để trống")
    @Min(value = 0, message = "Tồn kho tối thiểu phải >= 0")
    private Integer minStockLevel;

    @NotNull(message = "Tồn kho tối đa không được để trống")
    @Min(value = 0, message = "Tồn kho tối đa phải >= 0")
    private Integer maxStockLevel;

    private Boolean isTool;
}
