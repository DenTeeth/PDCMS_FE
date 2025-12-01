package com.dental.clinic.management.warehouse.exception;

import com.dental.clinic.management.exception.ResourceNotFoundException;

public class ItemMasterNotFoundException extends ResourceNotFoundException {
    public ItemMasterNotFoundException(Long id) {
        super("ITEM_MASTER_NOT_FOUND", "Không tìm thấy vật tư với ID: " + id);
    }

    public ItemMasterNotFoundException(String itemCode) {
        super("ITEM_MASTER_NOT_FOUND", "Không tìm thấy vật tư với mã: " + itemCode);
    }
}