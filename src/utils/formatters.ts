/**
 * Format Utilities for Vietnamese Locale
 */

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format ISO 8601 date to Vietnamese datetime
 * "2025-11-19T15:30:00" → "19/11/2025 15:30"
 */
export const formatDateTime = (isoString: string | undefined): string => {
  if (!isoString) return '-';
  
  try {
    const date = new Date(isoString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return isoString;
  }
};

/**
 * Format ISO 8601 date to Vietnamese date
 * "2025-11-19T15:30:00" → "19/11/2025"
 */
export const formatDate = (isoString: string | undefined): string => {
  if (!isoString) return '-';
  
  try {
    const date = new Date(isoString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  } catch {
    return isoString;
  }
};

/**
 * Format number to VND currency
 * 250000 → "250.000 ₫"
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '-';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format phone number (Vietnam format)
 * "0901234567" → "090 123 4567"
 */
export const formatPhone = (phone: string | undefined): string => {
  if (!phone) return '-';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: XXX XXX XXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Get status badge color class
 */
export const getStatusColor = (status: 'ACTIVE' | 'INACTIVE'): string => {
  return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

/**
 * Get status label in Vietnamese
 */
export const getStatusLabel = (status: 'ACTIVE' | 'INACTIVE'): string => {
  return status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động';
};
