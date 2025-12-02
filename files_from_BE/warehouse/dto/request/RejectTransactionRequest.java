package com.dental.clinic.management.warehouse.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectTransactionRequest {

    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
