package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSupplierRequest {

    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    @Size(min = 2, max = 255, message = "Tên nhà cung cấp từ 2-255 ký tự")
    private String supplierName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$|^02[0-9]{9}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phoneNumber;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email tối đa 100 ký tự")
    private String email;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(min = 10, max = 500, message = "Địa chỉ phải chi tiết (10-500 ký tự)")
    private String address;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String notes;
}
