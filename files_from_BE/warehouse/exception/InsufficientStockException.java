package com.dental.clinic.management.warehouse.exception;

import com.dental.clinic.management.exception.BadRequestException;

public class InsufficientStockException extends BadRequestException {
    public InsufficientStockException(String lotNumber, Integer available, Integer requested) {
        super(String.format("Không đủ hàng trong lô %s. Còn: %d, Yêu cầu: %d",
                lotNumber, available, requested));
    }
}
