package com.dental.clinic.management.warehouse.service;

// import com.dental.clinic.management.booking_appointment.repository.AppointmentRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.warehouse.domain.StorageTransaction;
import com.dental.clinic.management.warehouse.dto.request.TransactionHistoryRequest;
import com.dental.clinic.management.warehouse.dto.response.TransactionHistoryItemDto;
import com.dental.clinic.management.warehouse.dto.response.TransactionHistoryResponse;
import com.dental.clinic.management.warehouse.dto.response.TransactionSummaryStatsDto;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import com.dental.clinic.management.warehouse.repository.StorageTransactionRepository;
import com.dental.clinic.management.warehouse.specification.TransactionHistorySpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * API 6.6: Transaction History Service
 *
 * Features:
 * - Comprehensive filtering (type, status, payment, date range, supplier,
 * appointment)
 * - RBAC-aware data masking (VIEW_COST permission)
 * - Aggregated statistics
 * - Pagination & sorting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionHistoryService {

    private final StorageTransactionRepository transactionRepository;
    private final PatientRepository patientRepository;

    /**
     * Get transaction history with advanced filtering
     *
     * @param request Filter criteria
     * @return Paginated transaction history with stats
     */
    @Transactional(readOnly = true)
    public TransactionHistoryResponse getTransactionHistory(TransactionHistoryRequest request) {
        log.info("Fetching transaction history - Type: {}, Status: {}, Page: {}/{}",
                request.getType(), request.getStatus(), request.getPage(), request.getSize());

        // 1. Validate request
        validateRequest(request);

        // 2. Check permissions
        boolean hasViewCostPermission = hasPermission(AuthoritiesConstants.VIEW_WAREHOUSE_COST);
        log.debug("Permission check - VIEW_COST: {}", hasViewCostPermission);

        // 3. Build dynamic query specification
        Specification<StorageTransaction> spec = TransactionHistorySpecification.buildSpecification(request);

        // 4. Setup pagination & sorting
        Pageable pageable = createPageable(request);

        // 5. Execute query
        Page<StorageTransaction> page = transactionRepository.findAll(spec, pageable);

        // 6. Map to DTOs with RBAC
        List<TransactionHistoryItemDto> content = page.getContent().stream()
                .map(tx -> mapToDto(tx, hasViewCostPermission))
                .collect(Collectors.toList());

        // 7. Calculate summary stats
        TransactionSummaryStatsDto stats = calculateStats(spec, request, hasViewCostPermission);

        // 8. Build response
        return TransactionHistoryResponse.builder()
                .meta(TransactionHistoryResponse.MetaDto.builder()
                        .page(page.getNumber())
                        .size(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalElements(page.getTotalElements())
                        .build())
                .stats(stats)
                .content(content)
                .build();
    }

    /**
     * Validate request parameters
     */
    private void validateRequest(TransactionHistoryRequest request) {
        // Validate date range
        if (request.getFromDate() != null && request.getToDate() != null) {
            if (request.getFromDate().isAfter(request.getToDate())) {
                throw new BadRequestException(
                        "INVALID_DATE_RANGE",
                        "fromDate cannot be after toDate");
            }
        }

        // Validate page & size
        if (request.getPage() < 0) {
            throw new BadRequestException("INVALID_PAGE", "Page number cannot be negative");
        }
        if (request.getSize() <= 0 || request.getSize() > 100) {
            throw new BadRequestException("INVALID_SIZE", "Size must be between 1 and 100");
        }

        // Validate sort direction
        if (!"asc".equalsIgnoreCase(request.getSortDir()) && !"desc".equalsIgnoreCase(request.getSortDir())) {
            throw new BadRequestException("INVALID_SORT_DIR", "Sort direction must be 'asc' or 'desc'");
        }
    }

    /**
     * Create Pageable object with sorting
     */
    private Pageable createPageable(TransactionHistoryRequest request) {
        Sort.Direction direction = "asc".equalsIgnoreCase(request.getSortDir())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Sort sort = Sort.by(direction, request.getSortBy());
        return PageRequest.of(request.getPage(), request.getSize(), sort);
    }

    /**
     * Map entity to DTO with RBAC data masking
     */
    private TransactionHistoryItemDto mapToDto(StorageTransaction tx, boolean hasViewCostPermission) {
        TransactionHistoryItemDto dto = TransactionHistoryItemDto.builder()
                .transactionId(tx.getTransactionId())
                .transactionCode(tx.getTransactionCode())
                .type(tx.getTransactionType())
                .transactionDate(tx.getTransactionDate())
                .status(tx.getApprovalStatus())
                .notes(tx.getNotes())
                .createdByName(tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .totalItems(tx.getItems() != null ? tx.getItems().size() : 0)
                .build();

        // Import-specific fields
        if (tx.getTransactionType() == TransactionType.IMPORT && tx.getSupplier() != null) {
            dto.setSupplierName(tx.getSupplier().getSupplierName());
            dto.setInvoiceNumber(tx.getInvoiceNumber());
            dto.setPaymentStatus(tx.getPaymentStatus());
            dto.setDueDate(tx.getDueDate());

            // Payment info (requires VIEW_COST)
            if (hasViewCostPermission) {
                dto.setPaidAmount(tx.getPaidAmount());
                dto.setRemainingDebt(tx.getRemainingDebt());
            }
        }

        // Export-specific fields
        if (tx.getTransactionType() == TransactionType.EXPORT && tx.getRelatedAppointment() != null) {
            dto.setRelatedAppointmentId(tx.getRelatedAppointment().getAppointmentId().longValue());
            dto.setRelatedAppointmentCode(tx.getRelatedAppointment().getAppointmentCode());

            // Get patient name via patientId
            Integer patientId = tx.getRelatedAppointment().getPatientId();
            if (patientId != null) {
                Optional<Patient> patient = patientRepository.findById(patientId);
                patient.ifPresent(p -> dto.setPatientName(p.getFullName()));
            }
        }

        // Approval info
        if (tx.getApprovedBy() != null) {
            dto.setApprovedByName(tx.getApprovedBy().getFullName());
            dto.setApprovedAt(tx.getApprovedAt());
        }

        // Financial data (RBAC: requires VIEW_COST)
        if (hasViewCostPermission) {
            dto.setTotalValue(tx.getTotalValue());
        } else {
            dto.setTotalValue(null); // Hide sensitive data
        }

        return dto;
    }

    /**
     * Calculate summary statistics for filtered transactions
     */
    private TransactionSummaryStatsDto calculateStats(
            Specification<StorageTransaction> spec,
            TransactionHistoryRequest request,
            boolean hasViewCostPermission) {

        TransactionSummaryStatsDto stats = TransactionSummaryStatsDto.builder()
                .periodStart(request.getFromDate())
                .periodEnd(request.getToDate())
                .build();

        // Count pending approval
        Specification<StorageTransaction> pendingSpec = spec.and(
                (root, query, cb) -> cb.equal(root.get("approvalStatus"), TransactionStatus.PENDING_APPROVAL));
        long pendingCount = transactionRepository.count(pendingSpec);
        stats.setPendingApprovalCount((int) pendingCount);

        // Calculate financial stats (requires VIEW_COST)
        if (hasViewCostPermission) {
            List<StorageTransaction> allTx = transactionRepository.findAll(spec);

            BigDecimal totalImport = allTx.stream()
                    .filter(tx -> tx.getTransactionType() == TransactionType.IMPORT)
                    .map(tx -> tx.getTotalValue() != null ? tx.getTotalValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExport = allTx.stream()
                    .filter(tx -> tx.getTransactionType() == TransactionType.EXPORT)
                    .map(tx -> tx.getTotalValue() != null ? tx.getTotalValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            stats.setTotalImportValue(totalImport);
            stats.setTotalExportValue(totalExport);
        } else {
            stats.setTotalImportValue(null);
            stats.setTotalExportValue(null);
        }

        return stats;
    }

    /**
     * Get transaction detail by ID (API 6.7)
     *
     * @param id Transaction ID
     * @return ImportTransactionResponse or ExportTransactionResponse based on type
     */
    @Transactional(readOnly = true)
    public Object getTransactionDetail(Long id) {
        log.info("Fetching transaction detail - ID: {}", id);

        // 1. Find transaction
        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException(
                        "TRANSACTION_NOT_FOUND",
                        "Transaction with ID " + id + " not found"));

        // 2. Check permissions
        boolean hasViewCostPermission = hasPermission(AuthoritiesConstants.VIEW_WAREHOUSE_COST);
        log.debug("Permission check - VIEW_COST: {}", hasViewCostPermission);

        // 3. Map to appropriate response based on transaction type
        Object response = mapToDetailResponse(transaction, hasViewCostPermission);

        log.info("Transaction detail fetched - Type: {}, Code: {}",
                transaction.getTransactionType(), transaction.getTransactionCode());

        return response;
    }

    /**
     * Map transaction entity to detail response DTO with RBAC
     */
    private Object mapToDetailResponse(StorageTransaction tx, boolean hasViewCostPermission) {
        // Import transaction
        if (tx.getTransactionType() == TransactionType.IMPORT) {
            return mapToImportResponse(tx, hasViewCostPermission);
        }

        // Export transaction
        if (tx.getTransactionType() == TransactionType.EXPORT) {
            return mapToExportResponse(tx, hasViewCostPermission);
        }

        // Adjustment or other types - return basic transaction info
        return TransactionHistoryItemDto.builder()
                .transactionId(tx.getTransactionId())
                .transactionCode(tx.getTransactionCode())
                .type(tx.getTransactionType())
                .transactionDate(tx.getTransactionDate())
                .status(tx.getApprovalStatus())
                .notes(tx.getNotes())
                .createdByName(tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .approvedByName(tx.getApprovedBy() != null ? tx.getApprovedBy().getFullName() : null)
                .approvedAt(tx.getApprovedAt())
                .totalItems(tx.getItems() != null ? tx.getItems().size() : 0)
                .totalValue(hasViewCostPermission ? tx.getTotalValue() : null)
                .build();
    }

    /**
     * Map to ImportTransactionResponse
     */
    private com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse mapToImportResponse(
            StorageTransaction tx, boolean hasViewCostPermission) {

        // Map items
        List<com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse.ImportItemResponse> items = tx
                .getItems().stream()
                .map(item -> {
                    com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse.ImportItemResponse.ImportItemResponseBuilder builder = com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse.ImportItemResponse
                            .builder()
                            .itemCode(item.getItemCode())
                            .itemName(item.getBatch() != null && item.getBatch().getItemMaster() != null
                                    ? item.getBatch().getItemMaster().getItemName()
                                    : "N/A")
                            .batchId(item.getBatch() != null ? item.getBatch().getBatchId() : null)
                            .batchStatus("EXISTING")
                            .lotNumber(item.getBatch() != null ? item.getBatch().getLotNumber() : null)
                            .expiryDate(item.getBatch() != null ? item.getBatch().getExpiryDate() : null)
                            .quantityChange(item.getQuantityChange())
                            .unitName(item.getUnit() != null ? item.getUnit().getUnitName() : "N/A")
                            .binLocation(item.getBatch() != null ? item.getBatch().getBinLocation() : null)
                            .currentStock(item.getBatch() != null ? item.getBatch().getQuantityOnHand() : 0);

                    // Add cost info if user has permission
                    if (hasViewCostPermission) {
                        builder.purchasePrice(item.getPrice())
                                .totalLineValue(item.getTotalLineValue());
                    }

                    return builder.build();
                })
                .collect(Collectors.toList());

        // Build response
        com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse.ImportTransactionResponseBuilder builder = com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse
                .builder()
                .transactionId(tx.getTransactionId())
                .transactionCode(tx.getTransactionCode())
                .transactionDate(tx.getTransactionDate())
                .supplierName(tx.getSupplier() != null ? tx.getSupplier().getSupplierName() : null)
                .invoiceNumber(tx.getInvoiceNumber())
                .status(tx.getApprovalStatus())
                .createdBy(tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .approvedByName(tx.getApprovedBy() != null ? tx.getApprovedBy().getFullName() : null)
                .approvedAt(tx.getApprovedAt())
                .paymentStatus(tx.getPaymentStatus())
                .dueDate(tx.getDueDate())
                .totalItems(items.size())
                .items(items)
                .warnings(List.of());

        // Add financial info if user has permission
        if (hasViewCostPermission) {
            builder.totalValue(tx.getTotalValue())
                    .paidAmount(tx.getPaidAmount())
                    .remainingDebt(tx.getRemainingDebt());
        }

        return builder.build();
    }

    /**
     * Map to ExportTransactionResponse
     */
    private com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse mapToExportResponse(
            StorageTransaction tx, boolean hasViewCostPermission) {

        // Map items
        List<com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.ExportItemResponse> items = tx
                .getItems().stream()
                .map(item -> {
                    com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.ExportItemResponse.ExportItemResponseBuilder builder = com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.ExportItemResponse
                            .builder()
                            .itemCode(item.getItemCode())
                            .itemName(item.getBatch() != null && item.getBatch().getItemMaster() != null
                                    ? item.getBatch().getItemMaster().getItemName()
                                    : "N/A")
                            .batchId(item.getBatch() != null ? item.getBatch().getBatchId() : null)
                            .lotNumber(item.getBatch() != null ? item.getBatch().getLotNumber() : null)
                            .expiryDate(item.getBatch() != null ? item.getBatch().getExpiryDate() : null)
                            .binLocation(item.getBatch() != null ? item.getBatch().getBinLocation() : null)
                            .quantityChange(item.getQuantityChange())
                            .unitName(item.getUnit() != null ? item.getUnit().getUnitName() : "N/A")
                            .notes(item.getNotes());

                    // Add unpacking info if batch was unpacked
                    if (item.getBatch() != null && Boolean.TRUE.equals(item.getBatch().getIsUnpacked())) {
                        builder.unpackingInfo(
                                com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.UnpackingInfo
                                        .builder()
                                        .wasUnpacked(true)
                                        .parentBatchId(item.getBatch().getParentBatch() != null
                                                ? item.getBatch().getParentBatch().getBatchId()
                                                : null)
                                        .parentUnitName("Parent Unit")
                                        .remainingInBatch(item.getBatch().getQuantityOnHand())
                                        .build());
                    }

                    // Add cost info if user has permission
                    if (hasViewCostPermission) {
                        builder.unitPrice(item.getPrice())
                                .totalLineValue(item.getTotalLineValue());
                    }

                    return builder.build();
                })
                .collect(Collectors.toList());

        // Build response
        com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.ExportTransactionResponseBuilder builder = com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse
                .builder()
                .transactionId(tx.getTransactionId())
                .transactionCode(tx.getTransactionCode())
                .transactionDate(tx.getTransactionDate())
                .exportType(tx.getExportType() != null
                        ? com.dental.clinic.management.warehouse.enums.ExportType.valueOf(tx.getExportType())
                        : null)
                .referenceCode(
                        tx.getRelatedAppointment() != null ? tx.getRelatedAppointment().getAppointmentCode() : null)
                .notes(tx.getNotes())
                .createdBy(tx.getCreatedBy() != null ? tx.getCreatedBy().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .status(tx.getApprovalStatus())
                .approvedByName(tx.getApprovedBy() != null ? tx.getApprovedBy().getFullName() : null)
                .approvedAt(tx.getApprovedAt())
                .relatedAppointmentId(tx.getRelatedAppointment() != null
                        ? tx.getRelatedAppointment().getAppointmentId().longValue()
                        : null)
                .totalItems(items.size())
                .items(items)
                .warnings(List.of());

        // Get patient name if export is linked to appointment
        if (tx.getRelatedAppointment() != null && tx.getRelatedAppointment().getPatientId() != null) {
            Optional<Patient> patient = patientRepository.findById(tx.getRelatedAppointment().getPatientId());
            patient.ifPresent(p -> builder.patientName(p.getFullName()));
        }

        // Add financial info if user has permission
        if (hasViewCostPermission) {
            builder.totalValue(tx.getTotalValue());
        }

        return builder.build();
    }

    /**
     * Approve transaction (API 6.6.1)
     */
    @Transactional
    public Object approveTransaction(Long id, String notes) {
        log.info("Approving transaction - ID: {}", id);

        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException(
                        "TRANSACTION_NOT_FOUND",
                        "Transaction with ID " + id + " not found"));

        if (transaction.getApprovalStatus() != TransactionStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Can only approve transactions with status PENDING_APPROVAL. Current status: "
                            + transaction.getApprovalStatus());
        }

        // NOTE: approvedBy field left NULL - requires employee_id in JWT claims for
        // proper implementation
        log.warn("Approving transaction {} without approvedBy - employee tracking not implemented", id);

        transaction.setApprovalStatus(TransactionStatus.APPROVED);
        transaction.setApprovedAt(LocalDateTime.now());

        if (notes != null && !notes.trim().isEmpty()) {
            String existingNotes = transaction.getNotes() != null ? transaction.getNotes() : "";
            transaction.setNotes(existingNotes + "\nApproval notes: " + notes);
        }

        transactionRepository.save(transaction);

        log.info("Transaction approved - ID: {}, Code: {}", id, transaction.getTransactionCode());

        boolean hasViewCostPermission = hasPermission(AuthoritiesConstants.VIEW_WAREHOUSE_COST);
        return mapToDetailResponse(transaction, hasViewCostPermission);
    }

    /**
     * Reject transaction (API 6.6.2)
     */
    @Transactional
    public Object rejectTransaction(Long id, String rejectionReason) {
        log.info("Rejecting transaction - ID: {}", id);

        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new BadRequestException(
                    "REJECTION_REASON_REQUIRED",
                    "Rejection reason is required");
        }

        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException(
                        "TRANSACTION_NOT_FOUND",
                        "Transaction with ID " + id + " not found"));

        if (transaction.getApprovalStatus() != TransactionStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Can only reject transactions with status PENDING_APPROVAL. Current status: "
                            + transaction.getApprovalStatus());
        }

        // NOTE: rejectedBy field left NULL - requires employee_id in JWT claims for
        // proper implementation
        log.warn("Rejecting transaction {} without rejectedBy - employee tracking not implemented", id);

        transaction.setApprovalStatus(TransactionStatus.REJECTED);
        transaction.setRejectedAt(LocalDateTime.now());
        transaction.setRejectionReason(rejectionReason);

        transactionRepository.save(transaction);

        log.info("Transaction rejected - ID: {}, Code: {}, Reason: {}",
                id, transaction.getTransactionCode(), rejectionReason);

        boolean hasViewCostPermission = hasPermission(AuthoritiesConstants.VIEW_WAREHOUSE_COST);
        return mapToDetailResponse(transaction, hasViewCostPermission);
    }

    /**
     * Cancel transaction (API 6.6.3)
     */
    @Transactional
    public Object cancelTransaction(Long id, String cancellationReason) {
        log.info("Cancelling transaction - ID: {}", id);

        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException(
                        "TRANSACTION_NOT_FOUND",
                        "Transaction with ID " + id + " not found"));

        if (transaction.getApprovalStatus() != TransactionStatus.DRAFT
                && transaction.getApprovalStatus() != TransactionStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Can only cancel transactions with status DRAFT or PENDING_APPROVAL. Current status: "
                            + transaction.getApprovalStatus());
        }

        // NOTE: cancelledBy field left NULL - requires employee_id in JWT claims for
        // proper implementation
        log.warn("Cancelling transaction {} without cancelledBy - employee tracking not implemented", id);

        transaction.setApprovalStatus(TransactionStatus.CANCELLED);
        transaction.setCancelledAt(LocalDateTime.now());
        if (cancellationReason != null && !cancellationReason.trim().isEmpty()) {
            transaction.setCancellationReason(cancellationReason);
        }

        transactionRepository.save(transaction);

        log.info("Transaction cancelled - ID: {}, Code: {}",
                id, transaction.getTransactionCode());

        boolean hasViewCostPermission = hasPermission(AuthoritiesConstants.VIEW_WAREHOUSE_COST);
        return mapToDetailResponse(transaction, hasViewCostPermission);
    }

    /**
     * Check if current user has specific permission
     */
    private boolean hasPermission(String permission) {
        return SecurityUtil.hasCurrentUserPermission(permission);
    }
}
