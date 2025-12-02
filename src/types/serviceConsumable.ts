/**
 * API 6.17: Service Consumables Types
 * Backend: http://localhost:8080/api/v1/warehouse/consumables
 * Authentication: Bearer Token required
 */

// ============================================
// CONSUMABLE ITEM RESPONSE
// ============================================

export interface ConsumableItemResponse {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  quantity: number; // Required quantity per service
  unitName: string;
  currentStock: number; // Current stock in warehouse
  stockStatus: 'OK' | 'LOW' | 'OUT_OF_STOCK';
  unitPrice?: number; // RBAC: Only visible with VIEW_WAREHOUSE_COST permission
  totalCost?: number; // RBAC: Only visible with VIEW_WAREHOUSE_COST permission (quantity × unitPrice)
}

// ============================================
// SERVICE CONSUMABLES RESPONSE
// ============================================

export interface ServiceConsumablesResponse {
  serviceId: number;
  serviceName: string;
  totalConsumableCost?: number; // RBAC: Only visible with VIEW_WAREHOUSE_COST permission
  hasInsufficientStock: boolean; // True if ANY item has status LOW or OUT_OF_STOCK
  consumables: ConsumableItemResponse[];
}

