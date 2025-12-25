package com.dental.clinic.management.warehouse.service;

// import com.dental.clinic.management.warehouse.domain.ItemBatch;
import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.repository.ItemBatchRepository;
import com.dental.clinic.management.warehouse.repository.ItemMasterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Business Rules Service for Low Stock Alerts
 *
 * Implements:
 * - Rule #19: Notify warehouse keeper when supplies hit minimum stock threshold
 */
@Service
public class LowStockAlertService {

    private static final Logger log = LoggerFactory.getLogger(LowStockAlertService.class);

    @Autowired
    private ItemMasterRepository itemMasterRepository;

    @Autowired
    private ItemBatchRepository itemBatchRepository;

    /**
     * Rule #19: Check for low stock items and generate alerts
     *
     * Scheduled to run daily at 8 AM
     * Finds items where total stock <= minStockLevel
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkLowStockAlerts() {
        log.info("Starting low stock alert check...");

        List<LowStockAlert> alerts = findLowStockItems();

        if (alerts.isEmpty()) {
            log.info("No low stock items found");
            return;
        }

        log.warn("Found {} items with low stock", alerts.size());

        for (LowStockAlert alert : alerts) {
            sendLowStockAlert(alert);
        }

        log.info("Low stock alert check completed. Processed {} alerts", alerts.size());
    }

    /**
     * Find all items with stock below minimum threshold
     *
     * @return List of low stock alerts
     */
    public List<LowStockAlert> findLowStockItems() {
        List<ItemMaster> allItems = itemMasterRepository.findAll();
        List<LowStockAlert> alerts = new ArrayList<>();

        for (ItemMaster item : allItems) {
            // Skip if no minimum stock level defined
            if (item.getMinStockLevel() == null || item.getMinStockLevel() <= 0) {
                continue;
            }

            // Calculate total stock across all batches
            Integer totalStock = itemBatchRepository.findByItemMasterIdFEFO(item.getItemMasterId())
                    .stream()
                    .mapToInt(batch -> batch.getQuantityOnHand() != null ? batch.getQuantityOnHand() : 0)
                    .sum();

            // Check if below minimum threshold
            if (totalStock <= item.getMinStockLevel()) {
                LowStockAlert alert = LowStockAlert.builder()
                        .itemMasterId(item.getItemMasterId())
                        .itemCode(item.getItemCode())
                        .itemName(item.getItemName())
                        .currentStock(totalStock)
                        .minStockLevel(item.getMinStockLevel())
                        .shortfall(item.getMinStockLevel() - totalStock)
                        .categoryName(item.getCategory() != null ? item.getCategory().getCategoryName() : null)
                        .build();

                alerts.add(alert);
            }
        }

        return alerts;
    }

    /**
     * Send low stock alert notification
     *
     * TODO: Integrate with notification system (email, in-app, etc.)
     * For now, just log the alert
     *
     * @param alert Low stock alert details
     */
    private void sendLowStockAlert(LowStockAlert alert) {
        String message = String.format(
                "CANH BAO TON KHO THAP | " +
                        "Vat tu: %s (%s) | " +
                        "Ton kho hien tai: %d | " +
                        "Muc toi thieu: %d | " +
                        "Can nhap them: %d | " +
                        "Danh muc: %s",
                alert.getItemName(),
                alert.getItemCode(),
                alert.getCurrentStock(),
                alert.getMinStockLevel(),
                alert.getShortfall(),
                alert.getCategoryName() != null ? alert.getCategoryName() : "N/A");

        log.warn(message);

        // TODO: Send email to warehouse keeper
        // emailService.sendLowStockAlert(alert);

        // TODO: Create in-app notification
        // notificationService.createNotification(alert);
    }

    /**
     * Check if a specific item is at low stock
     *
     * @param itemMasterId ID of the item to check
     * @return true if stock is below minimum threshold, false otherwise
     */
    public boolean isLowStock(Long itemMasterId) {
        ItemMaster item = itemMasterRepository.findById(itemMasterId)
                .orElse(null);

        if (item == null || item.getMinStockLevel() == null || item.getMinStockLevel() <= 0) {
            return false;
        }

        Integer totalStock = itemBatchRepository.findByItemMasterIdFEFO(itemMasterId)
                .stream()
                .mapToInt(batch -> batch.getQuantityOnHand() != null ? batch.getQuantityOnHand() : 0)
                .sum();

        return totalStock <= item.getMinStockLevel();
    }

    /**
     * DTO for low stock alert information
     */
    public static class LowStockAlert {
        private Long itemMasterId;
        private String itemCode;
        private String itemName;
        private Integer currentStock;
        private Integer minStockLevel;
        private Integer shortfall;
        private String categoryName;

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private LowStockAlert alert = new LowStockAlert();

            public Builder itemMasterId(Long itemMasterId) {
                alert.itemMasterId = itemMasterId;
                return this;
            }

            public Builder itemCode(String itemCode) {
                alert.itemCode = itemCode;
                return this;
            }

            public Builder itemName(String itemName) {
                alert.itemName = itemName;
                return this;
            }

            public Builder currentStock(Integer currentStock) {
                alert.currentStock = currentStock;
                return this;
            }

            public Builder minStockLevel(Integer minStockLevel) {
                alert.minStockLevel = minStockLevel;
                return this;
            }

            public Builder shortfall(Integer shortfall) {
                alert.shortfall = shortfall;
                return this;
            }

            public Builder categoryName(String categoryName) {
                alert.categoryName = categoryName;
                return this;
            }

            public LowStockAlert build() {
                return alert;
            }
        }

        // Getters
        public Long getItemMasterId() {
            return itemMasterId;
        }

        public String getItemCode() {
            return itemCode;
        }

        public String getItemName() {
            return itemName;
        }

        public Integer getCurrentStock() {
            return currentStock;
        }

        public Integer getMinStockLevel() {
            return minStockLevel;
        }

        public Integer getShortfall() {
            return shortfall;
        }

        public String getCategoryName() {
            return categoryName;
        }
    }
}
