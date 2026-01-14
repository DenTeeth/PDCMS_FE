import { apiClient } from '@/lib/api';

const axios = apiClient.getAxiosInstance();

// ==================== Types ====================

export interface ContactInput {
  fullName: string;
  phone: string;
  email?: string;
  source: 'WEBSITE' | 'FACEBOOK' | 'ZALO' | 'WALK_IN' | 'REFERRAL' | 'OTHER';
  serviceInterested?: string;
  message?: string;
}

export interface Contact {
  contactId: string;
  fullName: string;
  phone: string;
  email?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CONVERTED';
  serviceInterested?: string;
  message?: string;
  assignedTo?: string;
  patientId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ContactHistory {
  id: string;
  contactId: string;
  type: 'CALL' | 'MESSAGE' | 'NOTE';
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface ContactStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}

export interface ConversionRate {
  total: number;
  converted: number;
  rate: number;
}

// ==================== P1: CRUD APIs ====================

/**
 * POST /api/v1/customer-contacts
 * Tạo contact mới
 */
export const createContact = async (payload: ContactInput): Promise<Contact> => {
  const response = await axios.post('/customer-contacts', payload);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * GET /api/v1/customer-contacts
 * Lấy danh sách contact với filter, search, pagination
 */
export const getContacts = async (params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  source?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}) => {
  const response = await axios.get('/customer-contacts', { params });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * GET /api/v1/customer-contacts/{contactId}
 * Lấy chi tiết một contact (bao gồm cả lịch sử tương tác)
 */
export const getContactById = async (contactId: string): Promise<Contact> => {
  const response = await axios.get(`/customer-contacts/${contactId}`);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * PUT /api/v1/customer-contacts/{contactId}
 * Cập nhật thông tin contact
 */
export const updateContact = async (
  contactId: string,
  payload: Partial<ContactInput>
): Promise<Contact> => {
  const response = await axios.put(`/customer-contacts/${contactId}`, payload);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * DELETE /api/v1/customer-contacts/{contactId}
 * Xóa mềm contact (chỉ Admin)
 */
export const deleteContact = async (contactId: string): Promise<void> => {
  await axios.delete(`/customer-contacts/${contactId}`);
};

// ==================== P2: Lịch sử tương tác APIs ====================

/**
 * GET /api/v1/customer-contacts/{contactId}/history
 * Lấy riêng lịch sử tương tác của contact
 */
export const getContactHistory = async (contactId: string): Promise<ContactHistory[]> => {
  const response = await axios.get(`/customer-contacts/${contactId}/history`);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * POST /api/v1/customer-contacts/{contactId}/history
 * Thêm một tương tác mới (CALL, MESSAGE, NOTE)
 */
export const addContactHistory = async (
  contactId: string,
  payload: {
    type: 'CALL' | 'MESSAGE' | 'NOTE';
    content: string;
  }
): Promise<ContactHistory> => {
  const response = await axios.post(`/customer-contacts/${contactId}/history`, payload);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

// ==================== P3: Hành động nghiệp vụ APIs ====================

/**
 * POST /api/v1/customer-contacts/{contactId}/assign
 * Gán contact cho Lễ tân
 * - Manual: truyền employeeId
 * - Auto: không truyền employeeId (hệ thống tự động gán)
 */
export const assignContact = async (
  contactId: string,
  employeeId?: string
): Promise<Contact> => {
  const response = await axios.post(`/customer-contacts/${contactId}/assign`, {
    employeeId,
  });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * POST /api/v1/customer-contacts/{contactId}/convert
 * Chuyển đổi contact thành bệnh nhân (Patient)
 */
export const convertToPatient = async (contactId: string): Promise<Contact> => {
  const response = await axios.post(`/customer-contacts/${contactId}/convert`);
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

// ==================== (Optional) Thống kê APIs ====================

/**
 * GET /api/v1/customer-contacts/stats
 * Lấy các số liệu thống kê
 */
export const getContactStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ContactStats> => {
  const response = await axios.get('/customer-contacts/stats', { params });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

/**
 * GET /api/v1/customer-contacts/conversion-rate
 * Lấy tỷ lệ chuyển đổi
 */
export const getConversionRate = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ConversionRate> => {
  const response = await axios.get('/customer-contacts/conversion-rate', { params });
  const { extractApiResponse } = await import('@/utils/apiResponse');
  return extractApiResponse<Contact | any>(response);
};

// ==================== Export default ====================

export default {
  // P1: CRUD
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,

  // P2: History
  getContactHistory,
  addContactHistory,

  // P3: Business Actions
  assignContact,
  convertToPatient,

  // Optional: Stats
  getContactStats,
  getConversionRate,
};
