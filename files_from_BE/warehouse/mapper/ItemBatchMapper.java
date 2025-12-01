package com.dental.clinic.management.warehouse.mapper;

import com.dental.clinic.management.warehouse.domain.ItemBatch;
import com.dental.clinic.management.warehouse.dto.response.BatchResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Mapper for ItemBatch entity and DTOs
 */
@Component
public class ItemBatchMapper {

    public BatchResponse toResponse(ItemBatch batch) {
        if (batch == null) {
            return null;
        }

        LocalDate expiryDate = batch.getExpiryDate();
        Boolean isExpiringSoon = expiryDate != null && expiryDate.isBefore(LocalDate.now().plusDays(30));
        Boolean isExpired = expiryDate != null && expiryDate.isBefore(LocalDate.now());

        return BatchResponse.builder()
                .batchId(batch.getBatchId())
                .lotNumber(batch.getLotNumber())
                .quantityOnHand(batch.getQuantityOnHand())
                .expiryDate(batch.getExpiryDate())
                .importedAt(batch.getImportedAt())
                .supplierName(batch.getSupplier() != null ? batch.getSupplier().getSupplierName() : null)
                .isExpiringSoon(isExpiringSoon)
                .isExpired(isExpired)
                .build();
    }
}
