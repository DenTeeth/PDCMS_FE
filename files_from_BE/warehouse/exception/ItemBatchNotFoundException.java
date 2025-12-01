package com.dental.clinic.management.warehouse.exception;

import com.dental.clinic.management.exception.ResourceNotFoundException;

public class ItemBatchNotFoundException extends ResourceNotFoundException {
    public ItemBatchNotFoundException(Long batchId) {
        super("ITEM_BATCH_NOT_FOUND", "Không tìm thấy lô hàng với ID: " + batchId);
    }
}
