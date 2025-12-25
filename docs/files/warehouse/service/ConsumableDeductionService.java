package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.warehouse.domain.ItemBatch;
import com.dental.clinic.management.warehouse.domain.ServiceConsumable;
import com.dental.clinic.management.warehouse.repository.ItemBatchRepository;
import com.dental.clinic.management.warehouse.repository.ServiceConsumableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Business Rules Service for Consumable Auto-Deduction
 * 
 * Implements:
 * - Rule #21: Completed services automatically deduct corresponding consumable material quantities
 */
@Service
public class ConsumableDeductionService {

    private static final Logger log = LoggerFactory.getLogger(ConsumableDeductionService.class);

    @Autowired
    private ServiceConsumableRepository serviceConsumableRepository;

    @Autowired
    private ItemBatchRepository itemBatchRepository;

    /**
     * Rule #21: Auto-deduct consumables when service is completed
     * 
     * Business Rule:
     * - When appointment status → COMPLETED
     * - Get Bill of Materials (BOM) from ServiceConsumable table
     * - Deduct quantities using FEFO (First Expired First Out) logic
     * 
     * @param serviceId ID of the completed service
     * @return Deduction report with details of what was deducted
     */
    @Transactional
    public DeductionReport deductConsumablesForService(Long serviceId) {
        if (serviceId == null) {
            throw new IllegalArgumentException("Service ID cannot be null");
        }

        log.info("Starting consumable deduction for serviceId={}", serviceId);

        // Step 1: Get Bill of Materials (BOM)
        List<ServiceConsumable> consumables = serviceConsumableRepository.findByServiceIdWithDetails(serviceId);

        if (consumables.isEmpty()) {
            log.info("No consumables defined for serviceId={}", serviceId);
            return DeductionReport.empty(serviceId);
        }

        DeductionReport report = new DeductionReport(serviceId);

        // Step 2: Deduct each consumable using FEFO
        for (ServiceConsumable consumable : consumables) {
            try {
                ConsumableDeductionService.DeductionDetail detail = deductItemUsingFEFO(
                    consumable.getItemMaster().getItemMasterId(),
                    consumable.getItemMaster().getItemName(),
                    consumable.getQuantityPerService()
                );
                report.addDetail(detail);
            } catch (Exception e) {
                log.error("Failed to deduct consumable: {} ({}) - {}", 
                    consumable.getItemMaster().getItemName(), 
                    consumable.getItemMaster().getItemCode(), 
                    e.getMessage());
                
                ConsumableDeductionService.DeductionDetail failedDetail = ConsumableDeductionService.DeductionDetail.failed(
                    consumable.getItemMaster().getItemMasterId(),
                    consumable.getItemMaster().getItemName(),
                    consumable.getQuantityPerService().intValue(),
                    e.getMessage()
                );
                report.addDetail(failedDetail);
            }
        }

        log.info("Consumable deduction completed for serviceId={}. Success: {}, Failed: {}", 
            serviceId, report.getSuccessCount(), report.getFailureCount());

        return report;
    }

    /**
     * Deduct item quantity using FEFO (First Expired First Out) logic
     * 
     * @param itemMasterId ID of the item to deduct
     * @param itemName Name of the item (for logging)
     * @param requestedQuantity Quantity to deduct (BigDecimal will be converted to int)
     * @return Deduction detail with batch information
     */
    @Transactional
    public ConsumableDeductionService.DeductionDetail deductItemUsingFEFO(Long itemMasterId, String itemName, java.math.BigDecimal requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Requested quantity must be > 0");
        }

        // Convert BigDecimal to int for processing
        int requestedQtyInt = requestedQuantity.intValue();

        // Get batches sorted by expiry date (FEFO)
        List<ItemBatch> batches = itemBatchRepository.findByItemMasterIdFEFO(itemMasterId);

        if (batches.isEmpty()) {
            throw new IllegalStateException("No batches available for item: " + itemName);
        }

        int remainingToDeduct = requestedQtyInt;
        List<BatchDeduction> batchDeductions = new ArrayList<>();

        // Deduct from batches using FEFO
        for (ItemBatch batch : batches) {
            if (remainingToDeduct <= 0) {
                break;
            }

            int availableInBatch = batch.getQuantityOnHand() != null ? batch.getQuantityOnHand() : 0;
            if (availableInBatch <= 0) {
                continue;
            }

            int deductFromThisBatch = Math.min(remainingToDeduct, availableInBatch);
            
            // Update batch quantity
            batch.setQuantityOnHand(availableInBatch - deductFromThisBatch);
            itemBatchRepository.save(batch);

            // Record deduction
            batchDeductions.add(new BatchDeduction(
                batch.getBatchId(),
                batch.getLotNumber(),
                deductFromThisBatch,
                availableInBatch - deductFromThisBatch
            ));

            remainingToDeduct -= deductFromThisBatch;

            log.debug("Deducted {} from batch {} (Lot: {}). Remaining in batch: {}", 
                deductFromThisBatch, batch.getBatchId(), batch.getLotNumber(), 
                batch.getQuantityOnHand());
        }

        // Check if full quantity was deducted
        if (remainingToDeduct > 0) {
            throw new IllegalStateException(
                String.format("Insufficient stock for %s. Requested: %d, Available: %d", 
                    itemName, requestedQtyInt, requestedQtyInt - remainingToDeduct)
            );
        }

        return DeductionDetail.success(itemMasterId, itemName, requestedQtyInt, batchDeductions);
    }

    /**
     * Deduction Report - tracks all deductions for a service
     */
    public static class DeductionReport {
        private Long serviceId;
        private List<DeductionDetail> details = new ArrayList<>();

        public DeductionReport(Long serviceId) {
            this.serviceId = serviceId;
        }

        public static DeductionReport empty(Long serviceId) {
            return new DeductionReport(serviceId);
        }

        public void addDetail(DeductionDetail detail) {
            this.details.add(detail);
        }

        public int getSuccessCount() {
            return (int) details.stream().filter(d -> d.isSuccess).count();
        }

        public int getFailureCount() {
            return (int) details.stream().filter(d -> !d.isSuccess).count();
        }

        public Long getServiceId() { return serviceId; }
        public List<DeductionDetail> getDetails() { return details; }
    }

    /**
     * Deduction Detail - tracks deduction for a single consumable item
     */
    public static class DeductionDetail {
        private Long itemMasterId;
        private String itemName;
        private Integer quantityDeducted;
        private boolean isSuccess;
        private String errorMessage;
        private List<BatchDeduction> batchDeductions;

        public static DeductionDetail success(Long itemMasterId, String itemName, 
                                              Integer quantity, List<BatchDeduction> batches) {
            DeductionDetail detail = new DeductionDetail();
            detail.itemMasterId = itemMasterId;
            detail.itemName = itemName;
            detail.quantityDeducted = quantity;
            detail.isSuccess = true;
            detail.batchDeductions = batches;
            return detail;
        }

        public static DeductionDetail failed(Long itemMasterId, String itemName, 
                                             Integer quantity, String error) {
            DeductionDetail detail = new DeductionDetail();
            detail.itemMasterId = itemMasterId;
            detail.itemName = itemName;
            detail.quantityDeducted = 0;
            detail.isSuccess = false;
            detail.errorMessage = error;
            detail.batchDeductions = new ArrayList<>();
            return detail;
        }

        // Getters
        public Long getItemMasterId() { return itemMasterId; }
        public String getItemName() { return itemName; }
        public Integer getQuantityDeducted() { return quantityDeducted; }
        public boolean isSuccess() { return isSuccess; }
        public String getErrorMessage() { return errorMessage; }
        public List<BatchDeduction> getBatchDeductions() { return batchDeductions; }
    }

    /**
     * Batch Deduction - tracks deduction from a single batch
     */
    public static class BatchDeduction {
        private Long batchId;
        private String lotNumber;
        private Integer quantityDeducted;
        private Integer remainingQuantity;

        public BatchDeduction(Long batchId, String lotNumber, Integer deducted, Integer remaining) {
            this.batchId = batchId;
            this.lotNumber = lotNumber;
            this.quantityDeducted = deducted;
            this.remainingQuantity = remaining;
        }

        // Getters
        public Long getBatchId() { return batchId; }
        public String getLotNumber() { return lotNumber; }
        public Integer getQuantityDeducted() { return quantityDeducted; }
        public Integer getRemainingQuantity() { return remainingQuantity; }
    }
}
