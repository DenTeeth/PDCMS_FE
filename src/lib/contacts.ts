import { apiClient } from '@/lib/api';

const axios = apiClient.getAxiosInstance();

export interface ContactInput {
  fullName: string;
  phone?: string;
  email?: string;
  source?: string;
  serviceInterested?: string;
  message?: string;
  dateOfBirth?: string;
  gender?: string;
  customerGroup?: string;
  address?: string;
  emergencyContact?: string;
}

export interface ContactItem extends ContactInput {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getContacts = async (params?: Record<string, any>) => {
  const res = await axios.get('/customer-contacts', { params });
  // Debug: log backend response so we can verify shape in browser console
  try {
    console.log('getContacts raw response:', res.data);
  } catch (e) {
    // ignore
  }

  // Backend returns { content: [...], pageable, totalElements, ... } directly
  // OR wrapped as { data: { content: [...] } }
  const payload = res.data;
  const isWrapped = payload?.data?.content !== undefined;
  const content = isWrapped ? payload.data.content : (payload?.content || []);
  const pageData = isWrapped ? payload.data : payload;

  // Normalize items so UI can rely on `items` array and `id` property
  const items = content.map((c: any) => ({
    id: c.contactId || c.id,
    fullName: c.fullName || c.name,
    phone: c.phone,
    email: c.email,
    source: c.source,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    // keep original payload for extra fields
    _raw: c,
  }));

  return {
    items,
    meta: {
      totalElements: pageData?.totalElements,
      totalPages: pageData?.totalPages,
      pageNumber: pageData?.number,
      pageSize: pageData?.size,
    },
    raw: payload,
  };
};

export const getContact = async (id: string) => {
  const res = await axios.get(`/customer-contacts/${id}`);
  const payload = res.data;
  const data = payload?.data || payload;
  // backend may return object with contactId
  const c = data?.contactId ? data : data?.data ? data.data : data;
  const item = c
    ? {
      id: c.contactId || c.id,
      fullName: c.fullName || c.name,
      phone: c.phone,
      email: c.email,
      source: c.source,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      _raw: c,
    }
    : null;

  return item;
};

export const createContact = async (payload: ContactInput) => {
  try {
    // Sanitize payload: uppercase the source (backend may expect enum like 'WEBSITE'),
    // and remove empty-string fields so backend doesn't receive invalid empty values.
    const sanitized: any = { ...payload };
    if (sanitized.source && typeof sanitized.source === 'string') {
      sanitized.source = sanitized.source.toUpperCase();
    }
    // Remove empty strings
    Object.keys(sanitized).forEach((k) => {
      if (sanitized[k] === '') {
        delete sanitized[k];
      }
    });

    try {
      console.log('📤 createContact request payload (sanitized):', JSON.stringify(sanitized, null, 2));
    } catch (e) {
      console.log('📤 createContact request payload (could not stringify):', sanitized);
    }

    const res = await axios.post('/customer-contacts', sanitized);
    console.log('📥 createContact response:', res.status, res.data);
    return res.data;
  } catch (err: any) {
    const status = err.response?.status;
    const respData = err.response?.data;
    // Helpful debug logging
    try {
      console.error('createContact failed:', {
        status,
        // stringify response body/headers so it's easy to copy from the console
        responseData: respData ? JSON.stringify(respData, null, 2) : null,
        responseHeaders: err.response?.headers ? JSON.stringify(err.response.headers, null, 2) : null,
        message: err.message,
        config: err.config,
      });
    } catch (logErr) {
      // Fallback if stringify fails
      console.error('createContact failed (stringify error):', err);
    }

    // Build a readable error message for UI
    let message = 'Create contact failed';
    if (respData) {
      // If backend returns structured { message: '...' }
      if (typeof respData === 'string' && respData.trim()) {
        message = respData;
      } else if (respData.message) {
        message = respData.message;
      } else if (respData.error) {
        message = respData.error;
      } else {
        // Fallback: stringify object (useful for debugging)
        try {
          message = JSON.stringify(respData);
        } catch (e) {
          message = String(respData);
        }
      }
    } else if (err.message) {
      message = err.message;
    } else if (status) {
      message = `Server responded ${status}`;
    }

    // Re-throw an Error but preserve axios response for callers to inspect
    const out: any = new Error(message);
    out.status = status;
    out.response = respData;
    out.axios = err;
    throw out;
  }
};

export const updateContact = async (id: string, payload: Partial<ContactInput>) => {
  // Sanitize payload like createContact: uppercase source, remove empty strings
  const sanitized: any = { ...payload };
  if (sanitized.source && typeof sanitized.source === 'string') {
    sanitized.source = sanitized.source.toUpperCase();
  }
  // Remove empty strings
  Object.keys(sanitized).forEach((k) => {
    if (sanitized[k] === '') {
      delete sanitized[k];
    }
  });

  try {
    console.log('📤 updateContact request payload (sanitized):', JSON.stringify(sanitized, null, 2));
    const res = await axios.put(`/customer-contacts/${id}`, sanitized);
    console.log('📥 updateContact response:', res.status, res.data);
    return res.data;
  } catch (err: any) {
    const status = err.response?.status;
    const respData = err.response?.data;
    // Helpful debug logging
    try {
      console.error('updateContact failed:', {
        status,
        responseData: respData ? JSON.stringify(respData, null, 2) : null,
        responseHeaders: err.response?.headers ? JSON.stringify(err.response.headers, null, 2) : null,
        message: err.message,
        config: err.config,
      });
    } catch (logErr) {
      console.error('updateContact failed (stringify error):', err);
    }

    // Build readable error message
    let message = 'Update contact failed';
    if (respData) {
      if (typeof respData === 'string' && respData.trim()) {
        message = respData;
      } else if (respData.message) {
        message = respData.message;
      } else if (respData.error) {
        message = respData.error;
      } else {
        try {
          message = JSON.stringify(respData);
        } catch (e) {
          message = String(respData);
        }
      }
    } else if (err.message) {
      message = err.message;
    } else if (status) {
      message = `Server responded ${status}`;
    }

    const out: any = new Error(message);
    out.status = status;
    out.response = respData;
    out.axios = err;
    throw out;
  }
};

export const softDeleteContact = async (id: string) => {
  const res = await axios.delete(`/customer-contacts/${id}`);
  return res.data;
};

// ==================== P2: History APIs ====================

export const getContactHistory = async (id: string, params?: Record<string, any>) => {
  const res = await axios.get(`/customer-contacts/${id}/history`, { params });
  return res.data;
};

export const addContactHistory = async (id: string, payload: { type: string; content: string }) => {
  const res = await axios.post(`/customer-contacts/${id}/history`, payload);
  return res.data;
};

// ==================== P3: Business Actions ====================

export const assignContact = async (id: string, payload?: { employeeId?: string }) => {
  // payload.employeeId optional -> backend handles auto-assign
  const res = await axios.post(`/customer-contacts/${id}/assign`, payload || {});
  return res.data;
};

export const convertContact = async (id: string) => {
  const res = await axios.post(`/customer-contacts/${id}/convert`);
  return res.data;
};

// ==================== Optional: Stats ====================

export const getContactStats = async (params?: Record<string, any>) => {
  const res = await axios.get('/customer-contacts/stats', { params });
  return res.data;
};

export const getConversionRate = async (params?: Record<string, any>) => {
  const res = await axios.get('/customer-contacts/conversion-rate', { params });
  return res.data;
};

export default {
  getContacts,
  getContact,
  createContact,
  updateContact,
  softDeleteContact,
  // history
  getContactHistory,
  addContactHistory,
  // business
  assignContact,
  convertContact,
  // stats
  getContactStats,
  getConversionRate,
};
