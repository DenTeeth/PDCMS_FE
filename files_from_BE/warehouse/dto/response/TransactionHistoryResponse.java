package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * API 6.6: Transaction History Response DTO
 * Complete response with metadata, stats, and content
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryResponse {

    private MetaDto meta;
    private TransactionSummaryStatsDto stats;
    private List<TransactionHistoryItemDto> content;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetaDto {
        private Integer page;
        private Integer size;
        private Integer totalPages;
        private Long totalElements;
    }
}
