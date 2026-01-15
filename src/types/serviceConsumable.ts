

// ============================================
// CONSUMABLE ITEM RESPONSE
// ============================================

export interface ConsumableItemResponse {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  quantity: number; 
  unitName: string;
  currentStock: number; 
  stockStatus: 'OK' | 'LOW' | 'OUT_OF_STOCK';
  unitPrice?: number; //RBAC: Only visible with VIEW_WAREHOUSE_COST permission
  totalCost?: number; //RBAC: Only visible with VIEW_WAREHOUSE_COST permission
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

