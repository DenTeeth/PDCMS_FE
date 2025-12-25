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
public class CreateSupplierRequest {

    @NotBlank(message = "Supplier name is required")
    @Size(min = 2, max = 255, message = "Supplier name must be between 2-255 characters")
    private String supplierName;

    @NotBlank(message = "Phone number is required")
    @Size(min = 10, max = 11, message = "Phone number must be 10-11 digits")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone number must contain only digits (10-11 characters)")
    private String phoneNumber;

    @Email(message = "Email format is invalid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    private Boolean isBlacklisted;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
