package com.dental.clinic.management.warehouse.exception;

import com.dental.clinic.management.exception.BadRequestException;

public class ExpiryDateRequiredException extends BadRequestException {
    public ExpiryDateRequiredException(String itemName) {
        super("Hàng kho lạnh bắt buộc có HSD: " + itemName);
    }
}
