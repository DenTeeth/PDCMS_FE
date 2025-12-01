/**
 * Warehouse Validation Utilities
 * Các hàm validation cho warehouse module
 */

import { toast } from 'sonner';

/**
 * Kiểm tra transaction có cũ hơn X ngày không
 */
export const isTransactionTooOld = (transactionDate: string, maxDays: number = 30): boolean => {
  const txnDate = new Date(transactionDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > maxDays;
};

/**
 * Kiểm tra expiry date đã hết hạn chưa
 */
export const isExpired = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

/**
 * Kiểm tra số lô trùng lặp trong danh sách
 */
export const hasDuplicateLotNumbers = (items: { lot_number: string }[]): boolean => {
  const lotNumbers = items.map(item => item.lot_number?.trim()).filter(Boolean);
  const uniqueLots = new Set(lotNumbers);
  return lotNumbers.length !== uniqueLots.size;
};

/**
 * Lấy danh sách số lô trùng
 */
export const getDuplicateLotNumbers = (items: { lot_number: string }[]): string[] => {
  const lotCounts = new Map<string, number>();
  items.forEach(item => {
    const lot = item.lot_number?.trim();
    if (lot) {
      lotCounts.set(lot, (lotCounts.get(lot) || 0) + 1);
    }
  });
  return Array.from(lotCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([lot]) => lot);
};

/**
 * Validate export quantity không vượt tồn kho
 */
export const validateExportQuantity = (
  requestedQty: number,
  availableQty: number,
  itemName: string
): boolean => {
  if (requestedQty > availableQty) {
    toast.error(`Số lượng xuất vượt quá tồn kho! ${itemName}: Còn ${availableQty}, yêu cầu ${requestedQty}`);
    return false;
  }
  return true;
};

/**
 * Cảnh báo khi nhập hàng đã hết hạn
 */
export const warnExpiredImport = (expiryDate: string, itemName: string): void => {
  if (isExpired(expiryDate)) {
    toast.warning(`Cảnh báo: ${itemName} đã hết hạn sử dụng (${new Date(expiryDate).toLocaleDateString('vi-VN')})`);
  }
};

/**
 * Validate transaction không quá cũ (cho edit/delete)
 */
export const validateTransactionAge = (transactionDate: string, maxDays: number = 30): boolean => {
  if (isTransactionTooOld(transactionDate, maxDays)) {
    toast.error(`Không thể sửa/xóa phiếu quá ${maxDays} ngày!`);
    return false;
  }
  return true;
};

/**
 * Validate item code không trùng
 * (Cần gọi API để check)
 */
export const validateUniqueItemCode = async (
  itemCode: string,
  checkFn: (code: string) => Promise<boolean>
): Promise<boolean> => {
  const exists = await checkFn(itemCode);
  if (exists) {
    toast.error(`Mã vật tư "${itemCode}" đã tồn tại!`);
    return false;
  }
  return true;
};

/**
 * Validate form data không rỗng
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): boolean => {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      toast.error(`Vui lòng điền ${field}!`);
      return false;
    }
  }
  return true;
};

/**
 * Validate số lượng > 0
 */
export const validatePositiveQuantity = (quantity: number, fieldName: string = 'Số lượng'): boolean => {
  if (quantity <= 0) {
    toast.error(`${fieldName} phải lớn hơn 0!`);
    return false;
  }
  return true;
};

/**
 * Validate giá >= 0
 */
export const validateNonNegativePrice = (price: number, fieldName: string = 'Giá'): boolean => {
  if (price < 0) {
    toast.error(`${fieldName} không được âm!`);
    return false;
  }
  return true;
};
