package com.dental.clinic.management.exception.validation;

public class DuplicateTypeCodeException extends RuntimeException {
    public DuplicateTypeCodeException(String typeCode) {
        super("typeCode '" + typeCode + "' already exists");
    }
}
