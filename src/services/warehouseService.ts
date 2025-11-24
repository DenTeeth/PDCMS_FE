/**
 * Warehouse Management Service
 * Handles API calls for warehouse operations (Cold & Normal Storage)
 */

import axios from 'axios';
import { apiClient } from '@/lib/api';
import {
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryFilter,
  Category,
  CreateCategoryDto,
  InventoryItem,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  StorageTransaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  WarehouseType,
  TransactionType,
  UnitType,
  WarehouseStats,
  PaginatedResponse,
  TransactionFilter,
  PaginationParams,
  PageResponse,
} from '@/types/warehouse';

// ============================================
// HARDCODED DATA FOR TESTING (Categories, Items, Transactions ONLY)
// Suppliers now use REAL API
// ============================================

// Note: Suppliers are fetched from API, keeping empty array for transactions reference
let suppliers: Supplier[] = [];

// Categories
let categories: Category[] = [
  {
    id: 'CAT001',
    name: 'Thuốc',
    description: 'Các loại thuốc cần bảo quản lạnh',
    warehouseType: WarehouseType.COLD,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT002',
    name: 'Sinh phẩm',
    description: 'Vật liệu sinh học',
    warehouseType: WarehouseType.COLD,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT003',
    name: 'Găng tay',
    description: 'Găng tay y tế các loại',
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT004',
    name: 'Dụng cụ',
    description: 'Dụng cụ nha khoa',
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT005',
    name: 'Vắc-xin',
    description: 'Các loại vắc-xin cần bảo quản lạnh',
    warehouseType: WarehouseType.COLD,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT006',
    name: 'Vật liệu trám',
    description: 'Vật liệu trám răng các loại',
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT007',
    name: 'Khẩu trang',
    description: 'Khẩu trang y tế, N95, v.v.',
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'CAT008',
    name: 'Dung dịch sát khuẩn',
    description: 'Dung dịch sát khuẩn các loại',
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Inventory Items
let inventoryItems: InventoryItem[] = [
  // Cold Storage Items
  {
    id: 'ITEM001',
    code: 'COLD-001',
    name: 'Thuốc X',
    categoryId: 'CAT001',
    categoryName: 'Thuốc',
    unitPrice: 150000,
    unit: UnitType.LO,
    currentStock: 50,
    minStock: 10,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2025-12-31',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM002',
    code: 'COLD-002',
    name: 'Vắc-xin Y',
    categoryId: 'CAT002',
    categoryName: 'Sinh phẩm',
    unitPrice: 300000,
    unit: UnitType.LO,
    currentStock: 20,
    minStock: 5,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2025-06-30',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM006',
    code: 'COLD-003',
    name: 'Thuốc giảm đau A',
    categoryId: 'CAT001',
    categoryName: 'Thuốc',
    unitPrice: 80000,
    unit: UnitType.LO,
    currentStock: 8,
    minStock: 15,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2025-03-15',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'ITEM007',
    code: 'COLD-004',
    name: 'Vắc-xin COVID-19',
    categoryId: 'CAT005',
    categoryName: 'Vắc-xin',
    unitPrice: 500000,
    unit: UnitType.LO,
    currentStock: 100,
    minStock: 20,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2025-08-30',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: 'ITEM008',
    code: 'COLD-005',
    name: 'Insulin Lantus',
    categoryId: 'CAT001',
    categoryName: 'Thuốc',
    unitPrice: 450000,
    unit: UnitType.LO,
    currentStock: 30,
    minStock: 10,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2026-02-28',
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
  {
    id: 'ITEM009',
    code: 'COLD-006',
    name: 'Huyết thanh kháng độc',
    categoryId: 'CAT002',
    categoryName: 'Sinh phẩm',
    unitPrice: 800000,
    unit: UnitType.LO,
    currentStock: 5,
    minStock: 3,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2025-04-20',
    createdAt: '2025-01-12T00:00:00Z',
    updatedAt: '2025-01-12T00:00:00Z',
  },
  {
    id: 'ITEM010',
    code: 'COLD-007',
    name: 'Vắc-xin Viêm gan B',
    categoryId: 'CAT005',
    categoryName: 'Vắc-xin',
    unitPrice: 250000,
    unit: UnitType.LO,
    currentStock: 60,
    minStock: 15,
    warehouseType: WarehouseType.COLD,
    expiryDate: '2025-11-15',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },

  // Normal Storage Items
  {
    id: 'ITEM003',
    code: 'NORM-001',
    name: 'Găng tay y tế',
    categoryId: 'CAT003',
    categoryName: 'Găng tay',
    unitPrice: 50000,
    unit: UnitType.HOP,
    currentStock: 100,
    minStock: 20,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM004',
    code: 'NORM-002',
    name: 'Bơm kim tiêm',
    categoryId: 'CAT004',
    categoryName: 'Dụng cụ',
    unitPrice: 5000,
    unit: UnitType.CAI,
    currentStock: 500,
    minStock: 100,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM005',
    code: 'NORM-003',
    name: 'Vật liệu trám',
    categoryId: 'CAT004',
    categoryName: 'Dụng cụ',
    unitPrice: 80000,
    unit: UnitType.GOI,
    currentStock: 30,
    minStock: 10,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM011',
    code: 'NORM-004',
    name: 'Khẩu trang N95',
    categoryId: 'CAT007',
    categoryName: 'Khẩu trang',
    unitPrice: 120000,
    unit: UnitType.HOP,
    currentStock: 15,
    minStock: 30,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-07T00:00:00Z',
    updatedAt: '2025-01-07T00:00:00Z',
  },
  {
    id: 'ITEM012',
    code: 'NORM-005',
    name: 'Bông gòn y tế',
    categoryId: 'CAT004',
    categoryName: 'Dụng cụ',
    unitPrice: 25000,
    unit: UnitType.GOI,
    currentStock: 200,
    minStock: 50,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-09T00:00:00Z',
    updatedAt: '2025-01-09T00:00:00Z',
  },
  {
    id: 'ITEM013',
    code: 'NORM-006',
    name: 'Dung dịch sát khuẩn tay',
    categoryId: 'CAT008',
    categoryName: 'Dung dịch sát khuẩn',
    unitPrice: 45000,
    unit: UnitType.LO,
    currentStock: 80,
    minStock: 20,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-11T00:00:00Z',
    updatedAt: '2025-01-11T00:00:00Z',
  },
  {
    id: 'ITEM014',
    code: 'NORM-007',
    name: 'Băng cá nhân',
    categoryId: 'CAT004',
    categoryName: 'Dụng cụ',
    unitPrice: 15000,
    unit: UnitType.GOI,
    currentStock: 150,
    minStock: 40,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-13T00:00:00Z',
    updatedAt: '2025-01-13T00:00:00Z',
  },
  {
    id: 'ITEM015',
    code: 'NORM-008',
    name: 'Composite trám răng',
    categoryId: 'CAT006',
    categoryName: 'Vật liệu trám',
    unitPrice: 350000,
    unit: UnitType.GOI,
    currentStock: 25,
    minStock: 10,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-14T00:00:00Z',
    updatedAt: '2025-01-14T00:00:00Z',
  },
  {
    id: 'ITEM016',
    code: 'NORM-009',
    name: 'Khẩu trang y tế 3 lớp',
    categoryId: 'CAT007',
    categoryName: 'Khẩu trang',
    unitPrice: 60000,
    unit: UnitType.HOP,
    currentStock: 5,
    minStock: 50,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-16T00:00:00Z',
    updatedAt: '2025-01-16T00:00:00Z',
  },
  {
    id: 'ITEM017',
    code: 'NORM-010',
    name: 'Gạc y tế vô trùng',
    categoryId: 'CAT004',
    categoryName: 'Dụng cụ',
    unitPrice: 30000,
    unit: UnitType.GOI,
    currentStock: 120,
    minStock: 30,
    warehouseType: WarehouseType.NORMAL,
    createdAt: '2025-01-17T00:00:00Z',
    updatedAt: '2025-01-17T00:00:00Z',
  },
];

// Storage Transactions
let transactions: StorageTransaction[] = [
  // IN Transactions - Cold Storage
  {
    id: 'TXN001',
    code: 'PN-20250101-001',
    type: TransactionType.IN,
    warehouseType: WarehouseType.COLD,
    supplierId: 'SUP001',
    supplierName: 'Công ty A - Vật tư Y tế',
    transactionDate: '2025-01-01',
    items: [
      {
        itemId: 'ITEM001',
        itemName: 'Thuốc X',
        quantity: 50,
        unitPrice: 150000,
        expiryDate: '2025-12-31',
        totalPrice: 7500000,
      },
    ],
    totalCost: 7500000,
    notes: 'Nhập kho lần đầu',
    createdBy: 'admin',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'TXN003',
    code: 'PN-20250105-001',
    type: TransactionType.IN,
    warehouseType: WarehouseType.COLD,
    supplierId: 'SUP005',
    supplierName: 'Công ty E - Sinh phẩm Quốc tế',
    transactionDate: '2025-01-05',
    items: [
      {
        itemId: 'ITEM007',
        itemName: 'Vắc-xin COVID-19',
        quantity: 100,
        unitPrice: 500000,
        expiryDate: '2025-08-30',
        totalPrice: 50000000,
      },
      {
        itemId: 'ITEM002',
        itemName: 'Vắc-xin Y',
        quantity: 20,
        unitPrice: 300000,
        expiryDate: '2025-06-30',
        totalPrice: 6000000,
      },
    ],
    totalCost: 56000000,
    notes: 'Nhập lô vắc-xin mới',
    createdBy: 'admin',
    createdAt: '2025-01-05T09:30:00Z',
    updatedAt: '2025-01-05T09:30:00Z',
  },
  {
    id: 'TXN005',
    code: 'PN-20250110-001',
    type: TransactionType.IN,
    warehouseType: WarehouseType.COLD,
    supplierId: 'SUP004',
    supplierName: 'Công ty D - Dược phẩm Việt',
    transactionDate: '2025-01-10',
    items: [
      {
        itemId: 'ITEM006',
        itemName: 'Thuốc giảm đau A',
        quantity: 30,
        unitPrice: 80000,
        expiryDate: '2025-03-15',
        totalPrice: 2400000,
      },
      {
        itemId: 'ITEM008',
        itemName: 'Insulin Lantus',
        quantity: 30,
        unitPrice: 450000,
        expiryDate: '2026-02-28',
        totalPrice: 13500000,
      },
    ],
    totalCost: 15900000,
    notes: 'Bổ sung thuốc định kỳ',
    createdBy: 'admin',
    createdAt: '2025-01-10T10:15:00Z',
    updatedAt: '2025-01-10T10:15:00Z',
  },

  // OUT Transactions - Cold Storage
  {
    id: 'TXN006',
    code: 'PX-20250112-001',
    type: TransactionType.OUT,
    warehouseType: WarehouseType.COLD,
    transactionDate: '2025-01-12',
    items: [
      {
        itemId: 'ITEM006',
        itemName: 'Thuốc giảm đau A',
        quantity: 22,
        unitPrice: 80000,
        totalPrice: 1760000,
      },
    ],
    totalCost: 1760000,
    notes: 'Xuất cho phòng khám A',
    createdBy: 'admin',
    createdAt: '2025-01-12T14:20:00Z',
    updatedAt: '2025-01-12T14:20:00Z',
  },

  // IN Transactions - Normal Storage
  {
    id: 'TXN004',
    code: 'PN-20250107-001',
    type: TransactionType.IN,
    warehouseType: WarehouseType.NORMAL,
    supplierId: 'SUP002',
    supplierName: 'Công ty B - Dụng cụ Nha Khoa',
    transactionDate: '2025-01-07',
    items: [
      {
        itemId: 'ITEM003',
        itemName: 'Găng tay y tế',
        quantity: 100,
        unitPrice: 50000,
        totalPrice: 5000000,
      },
      {
        itemId: 'ITEM004',
        itemName: 'Bơm kim tiêm',
        quantity: 500,
        unitPrice: 5000,
        totalPrice: 2500000,
      },
      {
        itemId: 'ITEM011',
        itemName: 'Khẩu trang N95',
        quantity: 50,
        unitPrice: 120000,
        totalPrice: 6000000,
      },
    ],
    totalCost: 13500000,
    notes: 'Nhập vật tư thường kỳ',
    createdBy: 'admin',
    createdAt: '2025-01-07T11:00:00Z',
    updatedAt: '2025-01-07T11:00:00Z',
  },
  {
    id: 'TXN007',
    code: 'PN-20250114-001',
    type: TransactionType.IN,
    warehouseType: WarehouseType.NORMAL,
    supplierId: 'SUP006',
    supplierName: 'Công ty F - Vật tư Nha khoa Pro',
    transactionDate: '2025-01-14',
    items: [
      {
        itemId: 'ITEM015',
        itemName: 'Composite trám răng',
        quantity: 25,
        unitPrice: 350000,
        totalPrice: 8750000,
      },
      {
        itemId: 'ITEM005',
        itemName: 'Vật liệu trám',
        quantity: 30,
        unitPrice: 80000,
        totalPrice: 2400000,
      },
    ],
    totalCost: 11150000,
    notes: 'Nhập vật liệu nha khoa',
    createdBy: 'admin',
    createdAt: '2025-01-14T08:45:00Z',
    updatedAt: '2025-01-14T08:45:00Z',
  },
  {
    id: 'TXN009',
    code: 'PN-20250118-001',
    type: TransactionType.IN,
    warehouseType: WarehouseType.NORMAL,
    supplierId: 'SUP003',
    supplierName: 'Công ty C - Thiết bị Y tế',
    transactionDate: '2025-01-18',
    items: [
      {
        itemId: 'ITEM012',
        itemName: 'Bông gòn y tế',
        quantity: 200,
        unitPrice: 25000,
        totalPrice: 5000000,
      },
      {
        itemId: 'ITEM013',
        itemName: 'Dung dịch sát khuẩn tay',
        quantity: 80,
        unitPrice: 45000,
        totalPrice: 3600000,
      },
      {
        itemId: 'ITEM014',
        itemName: 'Băng cá nhân',
        quantity: 150,
        unitPrice: 15000,
        totalPrice: 2250000,
      },
    ],
    totalCost: 10850000,
    notes: 'Nhập vật tư tiêu hao',
    createdBy: 'admin',
    createdAt: '2025-01-18T09:00:00Z',
    updatedAt: '2025-01-18T09:00:00Z',
  },

  // OUT Transactions - Normal Storage
  {
    id: 'TXN002',
    code: 'PX-20250102-001',
    type: TransactionType.OUT,
    warehouseType: WarehouseType.NORMAL,
    transactionDate: '2025-01-02',
    items: [
      {
        itemId: 'ITEM003',
        itemName: 'Găng tay y tế',
        quantity: 10,
        unitPrice: 50000,
        totalPrice: 500000,
      },
    ],
    totalCost: 500000,
    notes: 'Xuất cho phòng khám 1',
    createdBy: 'admin',
    createdAt: '2025-01-02T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  },
  {
    id: 'TXN008',
    code: 'PX-20250116-001',
    type: TransactionType.OUT,
    warehouseType: WarehouseType.NORMAL,
    transactionDate: '2025-01-16',
    items: [
      {
        itemId: 'ITEM011',
        itemName: 'Khẩu trang N95',
        quantity: 35,
        unitPrice: 120000,
        totalPrice: 4200000,
      },
      {
        itemId: 'ITEM016',
        itemName: 'Khẩu trang y tế 3 lớp',
        quantity: 10,
        unitPrice: 60000,
        totalPrice: 600000,
      },
    ],
    totalCost: 4800000,
    notes: 'Xuất cho phòng khám B và C',
    createdBy: 'admin',
    createdAt: '2025-01-16T15:30:00Z',
    updatedAt: '2025-01-16T15:30:00Z',
  },
  {
    id: 'TXN010',
    code: 'PX-20250120-001',
    type: TransactionType.OUT,
    warehouseType: WarehouseType.NORMAL,
    transactionDate: '2025-01-20',
    items: [
      {
        itemId: 'ITEM004',
        itemName: 'Bơm kim tiêm',
        quantity: 100,
        unitPrice: 5000,
        totalPrice: 500000,
      },
      {
        itemId: 'ITEM012',
        itemName: 'Bông gòn y tế',
        quantity: 50,
        unitPrice: 25000,
        totalPrice: 1250000,
      },
    ],
    totalCost: 1750000,
    notes: 'Xuất cho phòng điều trị',
    createdBy: 'admin',
    createdAt: '2025-01-20T11:15:00Z',
    updatedAt: '2025-01-20T11:15:00Z',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
};

const generateCode = (type: TransactionType): string => {
  const prefix = type === TransactionType.IN ? 'PN' : 'PX';
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const seq = transactions.filter((t) => t.type === type).length + 1;
  return `${prefix}-${date}-${String(seq).padStart(3, '0')}`;
};

// ============================================
// SUPPLIER SERVICE (REAL API CALLS)
// ============================================

const axiosV1 = apiClient.getAxiosInstance();

export const warehouseService = {
  // Get all suppliers with pagination (sorted newest first by BE)
  getSuppliers: async (params?: { page?: number; size?: number }): Promise<PageResponse<Supplier>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', (params?.page ?? 0).toString());
    queryParams.append('size', (params?.size ?? 10).toString());

    const response = await axiosV1.get<PageResponse<Supplier>>(
      `/suppliers?${queryParams.toString()}`
    );
    // BE trả trực tiếp PageResponse, không có wrapper { status, data }
    return response.data;
  },

  // Search suppliers by keyword (name, phone, email, address)
  searchSuppliers: async (keyword: string, params?: { page?: number; size?: number }): Promise<PageResponse<Supplier>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('keyword', keyword);
    queryParams.append('page', (params?.page ?? 0).toString());
    queryParams.append('size', (params?.size ?? 10).toString());

    try {
      const response = await axiosV1.get<PageResponse<Supplier>>(
        `/suppliers/search?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Search suppliers API error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Get supplier by ID
  getSupplierById: async (id: number): Promise<Supplier | null> => {
    try {
      const response = await axiosV1.get<Supplier>(`/suppliers/${id}`);
      // @ts-ignore - handle both formats
      return response.data.data || response.data;
    } catch (error) {
      return null;
    }
  },

  // Create supplier
  createSupplier: async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await axiosV1.post<Supplier>(
      '/suppliers',
      data
    );
    console.log('Create supplier response:', response.data);
    // BE có thể trả { status, message, data } hoặc trực tiếp Supplier
    // @ts-ignore - handle both formats
    return response.data.data || response.data;
  },

  // Update supplier
  updateSupplier: async (id: number, data: UpdateSupplierDto): Promise<Supplier> => {
    const response = await axiosV1.put<Supplier>(
      `/suppliers/${id}`,
      data
    );
    console.log('Update supplier response:', response.data);
    // @ts-ignore - handle both formats
    return response.data.data || response.data;
  },

  // Delete supplier
  deleteSupplier: async (id: number): Promise<void> => {
    await axiosV1.delete(`/suppliers/${id}`);
  },

  // ============================================
  // INVENTORY SERVICE (Real API)
  // ============================================

  // Get all inventory with filters and pagination
  getInventory: async (filters?: InventoryFilter): Promise<PageResponse<Inventory>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', (filters?.page ?? 0).toString());
    queryParams.append('size', (filters?.size ?? 20).toString());
    queryParams.append('sortBy', filters?.sortBy ?? 'itemName');
    queryParams.append('sortDirection', filters?.sortDirection ?? 'ASC');
    
    if (filters?.warehouseType) {
      queryParams.append('warehouseType', filters.warehouseType);
    }
    if (filters?.itemName && filters.itemName.trim()) {
      queryParams.append('itemName', filters.itemName.trim());
    }

    const response = await axiosV1.get<PageResponse<Inventory>>(
      `/inventory?${queryParams.toString()}`
    );
    // BE trả trực tiếp PageResponse
    return response.data;
  },

  // Get inventory by ID
  getInventoryById: async (id: number): Promise<Inventory | null> => {
    try {
      const response = await axiosV1.get<Inventory>(`/inventory/${id}`);
      // @ts-ignore - handle both formats
      return response.data.data || response.data;
    } catch (error) {
      return null;
    }
  },

  // Create inventory
  createInventory: async (data: CreateInventoryDto): Promise<Inventory> => {
    const response = await axiosV1.post<Inventory>('/inventory', data);
    console.log('Create inventory response:', response.data);
    // @ts-ignore - handle both formats
    return response.data.data || response.data;
  },

  // Update inventory
  updateInventory: async (id: number, data: UpdateInventoryDto): Promise<Inventory> => {
    const response = await axiosV1.put<Inventory>(`/inventory/${id}`, data);
    console.log('Update inventory response:', response.data);
    // @ts-ignore - handle both formats
    return response.data.data || response.data;
  },

  // Delete inventory
  deleteInventory: async (id: number): Promise<void> => {
    await axiosV1.delete(`/inventory/${id}`);
  },

  // ============================================
  // CATEGORY SERVICE
  // ============================================

  // Get categories by warehouse type
  getCategories: async (warehouseType?: WarehouseType): Promise<Category[]> => {
    await delay(300);
    if (warehouseType) {
      return categories.filter((c) => c.warehouseType === warehouseType);
    }
    return [...categories];
  },

  // Create category
  createCategory: async (data: CreateCategoryDto): Promise<Category> => {
    await delay(400);
    const newCategory: Category = {
      id: generateId('CAT'),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    categories.push(newCategory);
    return newCategory;
  },

  // ============================================
  // INVENTORY ITEM SERVICE
  // ============================================

  // Get inventory items with filters
  getInventoryItems: async (filter?: InventoryFilter): Promise<PaginatedResponse<InventoryItem>> => {
    await delay(400);
    let filtered = [...inventoryItems];

    // Filter by warehouse type
    if (filter?.warehouseType) {
      filtered = filtered.filter((item) => item.warehouseType === filter.warehouseType);
    }

    // Filter by category
    if (filter?.categoryId) {
      filtered = filtered.filter((item) => item.categoryId === filter.categoryId);
    }

    // Search by name or code
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower)
      );
    }

    // Filter low stock items
    if (filter?.lowStock) {
      filtered = filtered.filter((item) => item.currentStock <= (item.minStock || 0));
    }

    // Filter expiring soon (within 30 days)
    if (filter?.expiringSoon && filter.warehouseType === WarehouseType.COLD) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filtered = filtered.filter((item) => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) <= thirtyDaysFromNow;
      });
    }

    const page = filter?.page || 0;
    const size = filter?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);

    return {
      content: paginated,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      currentPage: page,
      pageSize: size,
    };
  },

  // Get item by ID
  getInventoryItemById: async (id: string): Promise<InventoryItem | null> => {
    await delay(200);
    return inventoryItems.find((item) => item.id === id) || null;
  },

  // Create inventory item
  createInventoryItem: async (data: CreateInventoryItemDto): Promise<InventoryItem> => {
    await delay(400);
    const category = categories.find((c) => c.id === data.categoryId);
    const codePrefix = data.warehouseType === WarehouseType.COLD ? 'COLD' : 'NORM';
    const codeSeq = inventoryItems.filter((i) => i.warehouseType === data.warehouseType).length + 1;

    const newItem: InventoryItem = {
      id: generateId('ITEM'),
      code: `${codePrefix}-${String(codeSeq).padStart(3, '0')}`,
      ...data,
      categoryName: category?.name,
      currentStock: 0, // Initial stock is 0
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inventoryItems.push(newItem);
    return newItem;
  },

  // Update inventory item
  updateInventoryItem: async (id: string, data: UpdateInventoryItemDto): Promise<InventoryItem> => {
    await delay(400);
    const index = inventoryItems.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Item not found');

    const category = data.categoryId ? categories.find((c) => c.id === data.categoryId) : undefined;

    inventoryItems[index] = {
      ...inventoryItems[index],
      ...data,
      categoryName: category?.name || inventoryItems[index].categoryName,
      updatedAt: new Date().toISOString(),
    };
    return inventoryItems[index];
  },

  // Delete inventory item
  deleteInventoryItem: async (id: string): Promise<void> => {
    await delay(300);
    inventoryItems = inventoryItems.filter((item) => item.id !== id);
  },

  // ============================================
  // TRANSACTION SERVICE
  // ============================================

  // Get transactions with filters
  getTransactions: async (filter?: TransactionFilter): Promise<PaginatedResponse<StorageTransaction>> => {
    await delay(400);
    let filtered = [...transactions];

    // Filter by type
    if (filter?.type) {
      filtered = filtered.filter((txn) => txn.type === filter.type);
    }

    // Filter by warehouse type
    if (filter?.warehouseType) {
      filtered = filtered.filter((txn) => txn.warehouseType === filter.warehouseType);
    }

    // Filter by supplier
    if (filter?.supplierId) {
      filtered = filtered.filter((txn) => txn.supplierId === filter.supplierId);
    }

    // Filter by date range
    if (filter?.startDate) {
      filtered = filtered.filter((txn) => txn.transactionDate >= filter.startDate!);
    }
    if (filter?.endDate) {
      filtered = filtered.filter((txn) => txn.transactionDate <= filter.endDate!);
    }

    // Search by code or notes
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (txn) =>
          txn.code.toLowerCase().includes(searchLower) ||
          txn.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    const page = filter?.page || 0;
    const size = filter?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);

    return {
      content: paginated,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      currentPage: page,
      pageSize: size,
    };
  },

  // Get transaction by ID
  getTransactionById: async (id: string): Promise<StorageTransaction | null> => {
    await delay(200);
    return transactions.find((txn) => txn.id === id) || null;
  },

  // Create transaction (IN or OUT)
  createTransaction: async (data: CreateTransactionDto): Promise<StorageTransaction> => {
    await delay(500);

    // Validate supplier for IN transactions
    if (data.type === TransactionType.IN && !data.supplierId) {
      throw new Error('Supplier is required for IN transactions');
    }

    const supplier = data.supplierId 
      ? suppliers.find((s) => s.supplierId === Number(data.supplierId)) 
      : undefined;

    // Calculate total cost
    const totalCost = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Add totalPrice to each item
    const itemsWithTotal = data.items.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const newTransaction: StorageTransaction = {
      id: generateId('TXN'),
      code: generateCode(data.type),
      ...data,
      items: itemsWithTotal,
      supplierName: supplier?.supplierName,
      totalCost,
      createdBy: 'admin', // TODO: Get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);

    // Update inventory stock
    data.items.forEach((item) => {
      const inventoryItem = inventoryItems.find((i) => i.id === item.itemId);
      if (inventoryItem) {
        if (data.type === TransactionType.IN) {
          inventoryItem.currentStock += item.quantity;
        } else {
          inventoryItem.currentStock -= item.quantity;
          if (inventoryItem.currentStock < 0) {
            throw new Error(`Insufficient stock for item: ${inventoryItem.name}`);
          }
        }
      }
    });

    return newTransaction;
  },

  // Update transaction
  updateTransaction: async (id: string, data: UpdateTransactionDto): Promise<StorageTransaction> => {
    await delay(500);
    const index = transactions.findIndex((txn) => txn.id === id);
    if (index === -1) throw new Error('Transaction not found');

    const oldTransaction = transactions[index];

    // Revert old stock changes
    oldTransaction.items.forEach((item) => {
      const inventoryItem = inventoryItems.find((i) => i.id === item.itemId);
      if (inventoryItem) {
        if (oldTransaction.type === TransactionType.IN) {
          inventoryItem.currentStock -= item.quantity;
        } else {
          inventoryItem.currentStock += item.quantity;
        }
      }
    });

    // Apply new stock changes
    const newItems = data.items || oldTransaction.items;
    const newType = data.type || oldTransaction.type;

    newItems.forEach((item) => {
      const inventoryItem = inventoryItems.find((i) => i.id === item.itemId);
      if (inventoryItem) {
        if (newType === TransactionType.IN) {
          inventoryItem.currentStock += item.quantity;
        } else {
          inventoryItem.currentStock -= item.quantity;
          if (inventoryItem.currentStock < 0) {
            throw new Error(`Insufficient stock for item: ${inventoryItem.name}`);
          }
        }
      }
    });

    const supplier = data.supplierId 
      ? suppliers.find((s) => s.supplierId === Number(data.supplierId)) 
      : undefined;
    const totalCost = newItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const itemsWithTotal = newItems.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));

    transactions[index] = {
      ...oldTransaction,
      ...data,
      items: itemsWithTotal,
      supplierName: supplier?.supplierName || oldTransaction.supplierName,
      totalCost,
      updatedAt: new Date().toISOString(),
    };

    return transactions[index];
  },

  // Delete transaction
  deleteTransaction: async (id: string): Promise<void> => {
    await delay(300);
    const transaction = transactions.find((txn) => txn.id === id);
    if (!transaction) throw new Error('Transaction not found');

    // Revert stock changes
    transaction.items.forEach((item) => {
      const inventoryItem = inventoryItems.find((i) => i.id === item.itemId);
      if (inventoryItem) {
        if (transaction.type === TransactionType.IN) {
          inventoryItem.currentStock -= item.quantity;
        } else {
          inventoryItem.currentStock += item.quantity;
        }
      }
    });

    transactions = transactions.filter((txn) => txn.id !== id);
  },

  // ============================================
  // STATISTICS
  // ============================================

  // Get warehouse statistics
  getWarehouseStats: async (warehouseType: WarehouseType): Promise<WarehouseStats> => {
    await delay(300);

    const items = inventoryItems.filter((item) => item.warehouseType === warehouseType);
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0);
    const lowStockItems = items.filter((item) => item.currentStock <= (item.minStock || 0)).length;

    let expiringSoonItems = 0;
    if (warehouseType === WarehouseType.COLD) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      expiringSoonItems = items.filter((item) => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) <= thirtyDaysFromNow;
      }).length;
    }

    return {
      totalItems,
      totalValue,
      lowStockItems,
      expiringSoonItems: warehouseType === WarehouseType.COLD ? expiringSoonItems : undefined,
    };
  },
};

// ============================================
// V3 ENHANCED SERVICES (MERGED FROM V3)
// ============================================

import {
  ItemMaster,
  ItemMasterFilter,
  CreateItemMasterDto,
  UpdateItemMasterDto,
  ItemBatch,
  BatchFilter,
  StorageTransactionV3,
  StorageTransactionFilter,
  CreateImportTransactionDto,
  CreateExportTransactionDto,
  CreateAdjustmentDto,
  SupplierItem,
  InventoryStats,
  StorageStats,
  ExpiringBatch,
  LossRecord,
} from '@/types/warehouse';

// Get axios instance for V1 (suppliers, inventory)
const api = apiClient.getAxiosInstance();

// Create separate axios instance for V3 warehouse APIs
const apiV3 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '/api/v3') || 'http://localhost:8080/api/v3',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth interceptor for V3 instance
apiV3.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * ITEM MASTER SERVICE (V3 - Vật Tư Master Data)
 * ✅ Verified against Swagger API
 */
export const itemMasterService = {
  getSummary: async (filter?: ItemMasterFilter): Promise<ItemMaster[]> => {
    const response = await apiV3.get<ItemMaster[]>('/warehouse/summary', {
      params: filter,
    });
    return response.data;
  },

  getAll: async (filter?: ItemMasterFilter): Promise<PageResponse<ItemMaster>> => {
    const response = await apiV3.get<PageResponse<ItemMaster>>('/warehouse/item-masters', {
      params: filter,
    });
    return response.data;
  },

  getById: async (id: number): Promise<ItemMaster> => {
    const response = await apiV3.get<ItemMaster>(`/warehouse/item-masters/${id}`);
    return response.data;
  },

  create: async (data: CreateItemMasterDto): Promise<ItemMaster> => {
    const response = await apiV3.post<ItemMaster>('/warehouse/item-masters', data);
    return response.data;
  },

  update: async (id: number, data: UpdateItemMasterDto): Promise<ItemMaster> => {
    const response = await apiV3.put<ItemMaster>(`/warehouse/item-masters/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiV3.delete(`/warehouse/item-masters/${id}`);
  },
};

/**
 * ITEM BATCH SERVICE (V3 - Quản lý Lô hàng)
 * ✅ Verified against Swagger API
 */
export const itemBatchService = {
  getBatchesByItemId: async (itemId: number, filter?: BatchFilter): Promise<ItemBatch[]> => {
    const response = await apiV3.get<ItemBatch[]>(`/warehouse/item-masters/${itemId}/batches`, {
      params: { ...filter, sortBy: 'expiryDate', sortDirection: 'ASC' },
    });
    return response.data;
  },

  getById: async (batchId: number): Promise<ItemBatch> => {
    const response = await apiV3.get<ItemBatch>(`/warehouse/batches/${batchId}`);
    return response.data;
  },

  getExpiringSoon: async (days: number = 30): Promise<ExpiringBatch[]> => {
    const response = await apiV3.get<ExpiringBatch[]>('/warehouse/batches/expiring-soon', {
      params: { days },
    });
    return response.data;
  },
};

/**
 * STORAGE TRANSACTION SERVICE (V3 - Xuất/Nhập Kho)
 * ✅ Verified against Swagger API
 */
export const storageTransactionService = {
  getAll: async (filter?: StorageTransactionFilter): Promise<PageResponse<StorageTransactionV3>> => {
    const response = await apiV3.get<PageResponse<StorageTransactionV3>>('/warehouse/transactions', {
      params: filter,
    });
    return response.data;
  },

  getById: async (id: number): Promise<StorageTransactionV3> => {
    const response = await apiV3.get<StorageTransactionV3>(`/warehouse/transactions/${id}`);
    return response.data;
  },

  createImport: async (data: CreateImportTransactionDto): Promise<StorageTransactionV3> => {
    const response = await apiV3.post<StorageTransactionV3>('/warehouse/transactions/import', data);
    return response.data;
  },

  createExport: async (data: CreateExportTransactionDto): Promise<StorageTransactionV3> => {
    const response = await apiV3.post<StorageTransactionV3>('/warehouse/transactions/export', data);
    return response.data;
  },

  createAdjustment: async (data: CreateAdjustmentDto): Promise<StorageTransactionV3> => {
    const response = await apiV3.post<StorageTransactionV3>('/warehouse/transactions/adjustment', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiV3.delete(`/warehouse/transactions/${id}`);
  },
};

/**
 * SUPPLIER SERVICE (V3 Enhanced)
 * ✅ Verified against Swagger API
 */
export const supplierServiceV3 = {
  getAll: async (params?: { search?: string; status?: string }): Promise<any[]> => {
    const response = await apiV3.get<any>('/warehouse/suppliers', { params });
    // BE returns Page<SupplierSummaryResponse> (Spring Data Pagination)
    // Extract content array from Page object
    const data = response.data;
    return Array.isArray(data) ? data : (data.content || []);
  },

  getById: async (id: number): Promise<any> => {
    const response = await apiV3.get<any>(`/warehouse/suppliers/${id}`);
    return response.data;
  },

  getSuppliedItems: async (supplierId: number): Promise<SupplierItem[]> => {
    const response = await apiV3.get<SupplierItem[]>(`/warehouse/suppliers/${supplierId}/items`);
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await apiV3.post<any>('/warehouse/suppliers', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await apiV3.put<any>(`/warehouse/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiV3.delete(`/warehouse/suppliers/${id}`);
  },
};

/**
 * CATEGORY SERVICE (V3)
 * ✅ Verified against Swagger API
 */
export const categoryService = {
  getAll: async (): Promise<any[]> => {
    const response = await apiV3.get<any[]>('/warehouse/categories');
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await apiV3.get<any>(`/warehouse/categories/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await apiV3.post<any>('/warehouse/categories', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await apiV3.put<any>(`/warehouse/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiV3.delete(`/warehouse/categories/${id}`);
  },
};

/**
 * ANALYTICS & REPORTS SERVICE (V3)
 * ✅ Verified against Swagger API
 */
export const warehouseAnalyticsService = {
  getInventoryStats: async (): Promise<InventoryStats> => {
    const response = await apiV3.get<InventoryStats>('/warehouse/analytics/inventory-stats');
    return response.data;
  },

  getStorageStats: async (month?: string): Promise<StorageStats> => {
    const response = await apiV3.get<StorageStats>('/warehouse/analytics/storage-stats', {
      params: { month },
    });
    return response.data;
  },

  getLossRecords: async (month?: string): Promise<LossRecord[]> => {
    const response = await apiV3.get<LossRecord[]>('/warehouse/analytics/loss-records', {
      params: { month },
    });
    return response.data;
  },

  getExpiringBatches: async (days: number = 30): Promise<ExpiringBatch[]> => {
    const response = await apiV3.get<ExpiringBatch[]>('/warehouse/analytics/expiring-batches', {
      params: { days },
    });
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS (V3)
// ============================================

export const calculateStockStatus = (
  currentQty: number,
  minLevel: number,
  maxLevel: number
): 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' => {
  if (currentQty === 0) return 'OUT_OF_STOCK';
  if (currentQty < minLevel) return 'LOW_STOCK';
  if (currentQty > maxLevel) return 'OVERSTOCK';
  return 'NORMAL';
};

export const isExpiringSoon = (expiryDate: string, daysThreshold: number = 30): boolean => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays >= 0;
};

export const sortByFEFO = (batches: ItemBatch[]): ItemBatch[] => {
  return [...batches].sort((a, b) => {
    if (!a.expiry_date) return 1;
    if (!b.expiry_date) return -1;
    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default warehouseService;
