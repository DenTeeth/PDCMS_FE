package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.exception.NoConsumablesDefinedException;
import com.dental.clinic.management.exception.ServiceNotFoundException;
import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.service.repository.DentalServiceRepository;
import com.dental.clinic.management.utils.security.AuthoritiesConstants;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.domain.ItemUnit;
import com.dental.clinic.management.warehouse.domain.ServiceConsumable;
import com.dental.clinic.management.warehouse.dto.response.ConsumableItemResponse;
import com.dental.clinic.management.warehouse.dto.response.ServiceConsumablesResponse;
import com.dental.clinic.management.warehouse.repository.ItemMasterRepository;
import com.dental.clinic.management.warehouse.repository.ItemUnitRepository;
import com.dental.clinic.management.warehouse.repository.ServiceConsumableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * API 6.17: Service Consumable Service
 * Get consumable items (Bill of Materials) for dental services
 *
 * RBAC: Permission-based price visibility
 * - All users with VIEW_SERVICE or VIEW_WAREHOUSE: See quantities and stock
 * status
 * - Only users with VIEW_WAREHOUSE_COST: See unitPrice, totalCost,
 * totalConsumableCost
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceConsumableService {

        private final ServiceConsumableRepository serviceConsumableRepository;
        private final DentalServiceRepository dentalServiceRepository;
        private final ItemMasterRepository itemMasterRepository;
        private final ItemUnitRepository itemUnitRepository;

        /**
         * Get consumables for a service with stock and cost enrichment
         *
         * @param serviceId Service ID
         * @return Service consumables response with stock status and total cost
         */
        @Transactional(readOnly = true)
        public ServiceConsumablesResponse getServiceConsumables(Long serviceId) {
                log.info("API 6.17 - Getting consumables for service ID: {}", serviceId);

                // Permission check: VIEW_WAREHOUSE_COST determines price visibility
                boolean hasViewCostPermission = SecurityUtil
                                .hasCurrentUserPermission(AuthoritiesConstants.VIEW_WAREHOUSE_COST);
                log.debug("Permission check - VIEW_WAREHOUSE_COST: {}", hasViewCostPermission);

                // 1. Validate service exists
                DentalService service = dentalServiceRepository.findById(serviceId)
                                .orElseThrow(() -> {
                                        log.warn("Service not found: ID {}", serviceId);
                                        return new ServiceNotFoundException(serviceId);
                                });

                // 2. Get consumables
                List<ServiceConsumable> consumables = serviceConsumableRepository
                                .findByServiceIdWithDetails(serviceId);

                if (consumables.isEmpty()) {
                        log.warn("No consumables defined for service: {} ({})",
                                        service.getServiceCode(), service.getServiceName());
                        throw new NoConsumablesDefinedException(serviceId);
                }

                // 3. Map to response with stock check and cost calculation
                boolean hasInsufficientStock = false;
                BigDecimal totalConsumableCost = BigDecimal.ZERO;

                List<ConsumableItemResponse> consumableResponses = consumables.stream()
                                .map(sc -> {
                                        ItemMaster item = sc.getItemMaster();

                                        // Get current stock from cached field
                                        Integer currentStock = item.getCachedTotalQuantity() != null
                                                        ? item.getCachedTotalQuantity()
                                                        : 0;

                                        // Determine stock status
                                        String stockStatus = determineStockStatus(
                                                        currentStock,
                                                        sc.getQuantityPerService().intValue());

                                        // Calculate price fields (only if permission granted)
                                        BigDecimal unitPrice = null;
                                        BigDecimal totalCost = null;

                                        if (hasViewCostPermission) {
                                                unitPrice = item.getCurrentMarketPrice() != null
                                                                ? item.getCurrentMarketPrice()
                                                                : BigDecimal.ZERO;
                                                totalCost = unitPrice.multiply(sc.getQuantityPerService());
                                        }

                                        // Update response tracking
                                        if ("OUT_OF_STOCK".equals(stockStatus) || "LOW".equals(stockStatus)) {
                                                // Note: Cannot modify hasInsufficientStock directly in lambda
                                                // Will handle after stream
                                        }

                                        return ConsumableItemResponse.builder()
                                                        .itemMasterId(item.getItemMasterId().longValue())
                                                        .itemCode(item.getItemCode())
                                                        .itemName(item.getItemName())
                                                        .quantity(sc.getQuantityPerService())
                                                        .unitName(sc.getUnit().getUnitName())
                                                        .currentStock(currentStock)
                                                        .stockStatus(stockStatus)
                                                        .unitPrice(unitPrice) // null if no VIEW_WAREHOUSE_COST
                                                        .totalCost(totalCost) // null if no VIEW_WAREHOUSE_COST
                                                        .build();
                                })
                                .collect(Collectors.toList());

                // Check if any item has insufficient stock
                hasInsufficientStock = consumableResponses.stream()
                                .anyMatch(item -> "OUT_OF_STOCK".equals(item.getStockStatus())
                                                || "LOW".equals(item.getStockStatus()));

                // Calculate total consumable cost (only if permission granted)
                if (hasViewCostPermission) {
                        totalConsumableCost = consumableResponses.stream()
                                        .map(ConsumableItemResponse::getTotalCost)
                                        .filter(cost -> cost != null) // Skip null costs
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                } else {
                        totalConsumableCost = null; // Hide from users without VIEW_WAREHOUSE_COST
                }

                log.info("API 6.17 - Found {} consumables for service {} - Total cost: {}, Insufficient stock: {}, Cost visible: {}",
                                consumableResponses.size(),
                                service.getServiceCode(),
                                totalConsumableCost,
                                hasInsufficientStock,
                                hasViewCostPermission);

                return ServiceConsumablesResponse.builder()
                                .serviceId(serviceId)
                                .serviceName(service.getServiceName())
                                .totalConsumableCost(totalConsumableCost) // null if no VIEW_WAREHOUSE_COST
                                .hasInsufficientStock(hasInsufficientStock)
                                .consumables(consumableResponses)
                                .build();
        }

        /**
         * Determine stock status based on current stock vs required quantity
         *
         * @param currentStock     Current stock in warehouse
         * @param requiredQuantity Required quantity for service
         * @return Stock status: OK, LOW, OUT_OF_STOCK
         */
        private String determineStockStatus(Integer currentStock, Integer requiredQuantity) {
                if (currentStock == null || currentStock <= 0) {
                        return "OUT_OF_STOCK";
                } else if (currentStock < requiredQuantity) {
                        return "LOW";
                } else {
                        return "OK";
                }
        }

        /**
         * API 6.18: Set service consumables (Bulk upsert)
         * Create or update BOM for multiple services
         *
         * @param requests List of service consumable configurations
         * @return Number of affected records
         */
        @Transactional
        public int setServiceConsumables(
                        List<com.dental.clinic.management.warehouse.dto.request.SetServiceConsumablesRequest> requests) {
                log.info("API 6.18 - Setting consumables for {} services", requests.size());

                int totalAffected = 0;

                for (var request : requests) {
                        Long serviceId = request.getServiceId();

                        // Validate service exists
                        DentalService service = dentalServiceRepository.findById(serviceId)
                                        .orElseThrow(() -> new ServiceNotFoundException(serviceId));

                        log.debug("Processing service: {} ({})", service.getServiceName(), serviceId);

                        // Process each consumable item (upsert)
                        for (var item : request.getConsumables()) {
                                // Find existing or create new
                                ServiceConsumable consumable = serviceConsumableRepository
                                                .findByServiceIdAndItemMasterId(serviceId, item.getItemMasterId())
                                                .orElse(new ServiceConsumable());

                                // Load item_master and unit entities
                                ItemMaster itemMaster = itemMasterRepository.findById(item.getItemMasterId())
                                                .orElseThrow(() -> new IllegalArgumentException(
                                                                "Item not found with ID: " + item.getItemMasterId()));

                                ItemUnit unit = itemUnitRepository.findById(item.getUnitId())
                                                .orElseThrow(() -> new IllegalArgumentException(
                                                                "Unit not found with ID: " + item.getUnitId()));

                                // Set/update fields
                                consumable.setServiceId(serviceId);
                                consumable.setItemMaster(itemMaster);
                                consumable.setQuantityPerService(item.getQuantityPerService());
                                consumable.setUnit(unit);
                                consumable.setNotes(item.getNotes());

                                serviceConsumableRepository.save(consumable);
                                totalAffected++;
                        }
                }

                log.info("API 6.18 - Successfully set {} consumable records", totalAffected);
                return totalAffected;
        }

        /**
         * API 6.19: Update service consumables (Replace all)
         * Delete existing BOM and insert new configuration
         *
         * @param serviceId   Service ID
         * @param consumables New consumable configuration
         * @return Number of inserted records
         */
        @SuppressWarnings("unused")
        @Transactional
        public int updateServiceConsumables(Long serviceId,
                        List<com.dental.clinic.management.warehouse.dto.request.ConsumableItemRequest> consumables) {
                log.info("API 6.19 - Replacing consumables for service ID: {}", serviceId);

                // Validate service exists
                DentalService service = dentalServiceRepository.findById(serviceId)
                                .orElseThrow(() -> new ServiceNotFoundException(serviceId));

                // Delete existing consumables
                List<ServiceConsumable> existing = serviceConsumableRepository
                                .findByServiceIdWithDetails(serviceId);
                if (!existing.isEmpty()) {
                        serviceConsumableRepository.deleteAll(existing);
                        log.debug("Deleted {} existing consumables for service {}", existing.size(), serviceId);
                }

                // Insert new consumables
                int inserted = 0;
                for (var item : consumables) {
                        // Load item_master and unit entities
                        ItemMaster itemMaster = itemMasterRepository.findById(item.getItemMasterId())
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Item not found with ID: " + item.getItemMasterId()));

                        ItemUnit unit = itemUnitRepository.findById(item.getUnitId())
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Unit not found with ID: " + item.getUnitId()));

                        ServiceConsumable consumable = new ServiceConsumable();
                        consumable.setServiceId(serviceId);
                        consumable.setItemMaster(itemMaster);
                        consumable.setQuantityPerService(item.getQuantityPerService());
                        consumable.setUnit(unit);
                        consumable.setNotes(item.getNotes());

                        serviceConsumableRepository.save(consumable);
                        inserted++;
                }

                log.info("API 6.19 - Successfully replaced with {} new consumable records", inserted);
                return inserted;
        }
}
