package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * API 6.15: Update Supplier Request
 * Allows updating supplier profile and risk management flags (isActive,
 * isBlacklisted)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSupplierRequest {

    @NotBlank(message = "Supplier name is required")
    @Size(min = 2, max = 255, message = "Supplier name must be between 2-255 characters")
    private String supplierName;

    @Size(max = 255, message = "Contact person must not exceed 255 characters")
    private String contactPerson;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^0\\d{9,10}$", message = "Phone number must be 10-11 digits and start with 0")
    private String phoneNumber;

    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    private Boolean isActive;

    private Boolean isBlacklisted;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
