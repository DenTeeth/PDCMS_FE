package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemMasterPageResponse {

    private MetaDto meta;
    private List<ItemMasterListDto> content;

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
