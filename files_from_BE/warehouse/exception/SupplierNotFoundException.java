package com.dental.clinic.management.warehouse.exception;

import com.dental.clinic.management.exception.ResourceNotFoundException;

public class SupplierNotFoundException extends ResourceNotFoundException {
    public SupplierNotFoundException(Long supplierId) {
        super("SUPPLIER_NOT_FOUND", "Không tìm thấy nhà cung cấp với ID: " + supplierId);
    }
}
