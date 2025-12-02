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
                .isBlacklisted(request.getIsBlacklisted() != null ? request.getIsBlacklisted() : false)
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

    /**
     * API 6.15: Update entity from request
     * Updates only profile fields, NOT metrics (totalOrders, lastOrderDate)
     */
    public void updateEntity(Supplier supplier, UpdateSupplierRequest request) {
        if (supplier == null || request == null) {
            return;
        }

        supplier.setSupplierName(request.getSupplierName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhoneNumber(request.getPhoneNumber());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());

        // Risk management flags
        if (request.getIsActive() != null) {
            supplier.setIsActive(request.getIsActive());
        }
        if (request.getIsBlacklisted() != null) {
            supplier.setIsBlacklisted(request.getIsBlacklisted());
        }

        supplier.setNotes(request.getNotes());
    }
}
