package com.dental.clinic.management.warehouse.mapper;

import com.dental.clinic.management.warehouse.domain.Supplier;
import com.dental.clinic.management.warehouse.dto.request.CreateSupplierRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateSupplierRequest;
import com.dental.clinic.management.warehouse.dto.response.SupplierResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for Supplier entity and DTOs
 */
@Component
public class SupplierMapper {

    public Supplier toEntity(CreateSupplierRequest request) {
        if (request == null) {
            return null;
        }

        return Supplier.builder()
                .supplierName(request.getSupplierName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .address(request.getAddress())
                .notes(request.getNotes())
                .build();
    }

    public SupplierResponse toResponse(Supplier supplier) {
        if (supplier == null) {
            return null;
        }

        return SupplierResponse.builder()
                .supplierId(supplier.getSupplierId())
                .supplierCode(supplier.getSupplierCode())
                .supplierName(supplier.getSupplierName())
                .phoneNumber(supplier.getPhoneNumber())
                .email(supplier.getEmail())
                .address(supplier.getAddress())
                .notes(supplier.getNotes())
                .isActive(supplier.getIsActive())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }

    public void updateEntity(Supplier supplier, UpdateSupplierRequest request) {
        if (supplier == null || request == null) {
            return;
        }

        supplier.setSupplierName(request.getSupplierName());
        supplier.setPhoneNumber(request.getPhoneNumber());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setNotes(request.getNotes());
    }
}
