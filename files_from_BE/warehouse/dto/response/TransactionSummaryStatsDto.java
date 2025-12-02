package com.dental.clinic.management.warehouse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * API 6.6: Transaction Summary Stats DTO
 * Provides aggregated statistics for filtered transactions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionSummaryStatsDto {

    // Period info
    private LocalDate periodStart;
    private LocalDate periodEnd;

    // Financial stats (RBAC: Requires VIEW_COST permission)
    private BigDecimal totalImportValue; // Tổng tiền nhập (null if no VIEW_COST)
    private BigDecimal totalExportValue; // Tổng tiền xuất (null if no VIEW_COST)

    // Workflow stats
    private Integer pendingApprovalCount; // Số phiếu chờ duyệt
}
