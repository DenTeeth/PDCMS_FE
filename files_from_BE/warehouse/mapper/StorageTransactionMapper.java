package com.dental.clinic.management.warehouse.mapper;

import com.dental.clinic.management.warehouse.domain.StorageTransaction;
import com.dental.clinic.management.warehouse.dto.response.TransactionResponse;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Mapper for StorageTransaction entity and DTOs
 */
@Component
public class StorageTransactionMapper {

    public TransactionResponse toResponse(StorageTransaction transaction) {
        if (transaction == null) {
            return null;
        }

        return TransactionResponse.builder()
                .transactionId(transaction.getTransactionId())
                .transactionCode(transaction.getTransactionCode())
                .transactionType(transaction.getTransactionType())
                .transactionDate(transaction.getTransactionDate())
                .supplierName(transaction.getSupplier() != null ? transaction.getSupplier().getSupplierName() : null)
                .notes(transaction.getNotes())
                .createdByName(transaction.getCreatedBy() != null ? transaction.getCreatedBy().getFullName() : null)
                .createdAt(transaction.getCreatedAt())
                .items(transaction.getItems() != null ? transaction.getItems().stream()
                        .map(item -> TransactionResponse.TransactionItemResponse.builder()
                                .transactionItemId(item.getTransactionItemId())
                                .itemCode(item.getBatch().getItemMaster().getItemCode()) // 🔥 From ItemMaster
                                .itemName(item.getBatch().getItemMaster().getItemName())
                                .unitName(item.getUnit() != null ? item.getUnit().getUnitName() : null) // 🔥 From
                                                                                                        // ItemUnit
                                .lotNumber(item.getBatch().getLotNumber())
                                .quantityChange(item.getQuantityChange())
                                .notes(item.getNotes())
                                .build())
                        .collect(Collectors.toList())
                        : null)
                .build();
    }
}
