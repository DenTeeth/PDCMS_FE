import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import contactsApi, { ContactInput } from '@/lib/contacts';

export const useContacts = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.getContacts(params),
  });
};

export const useContact = (id?: string) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.getContact(id as string),
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContactInput) => contactsApi.createContact(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; payload: Partial<ContactInput> }>({
    mutationFn: ({ id, payload }) => contactsApi.updateContact(id, payload),
    onSuccess: (_data: any, variables) => {
      qc.invalidateQueries({ queryKey: ['contact', variables.id] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useSoftDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.softDeleteContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

// History hooks
export const useContactHistory = (contactId?: string, params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['contact', contactId, 'history', params],
    queryFn: () => contactsApi.getContactHistory(contactId as string, params),
    enabled: !!contactId,
  });
};

export const useAddContactHistory = (contactId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: string; content: string }) => contactsApi.addContactHistory(contactId as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact', contactId, 'history'] }),
  });
};

// Business actions
export const useAssignContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId?: string }) => contactsApi.assignContact(id, { employeeId }),
    onSuccess: (_data: any, variables) => {
      qc.invalidateQueries({ queryKey: ['contact', variables.id] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useConvertContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.convertContact(id),
    onSuccess: (_data: any, id) => {
      qc.invalidateQueries({ queryKey: ['contact', id] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

// Stats
export const useContactStats = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['contact-stats', params],
    queryFn: () => contactsApi.getContactStats(params),
  });
};

export const useConversionRate = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['contact-conversion-rate', params],
    queryFn: () => contactsApi.getConversionRate(params),
  });
};

export default {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useSoftDeleteContact,
  useContactHistory,
  useAddContactHistory,
  useAssignContact,
  useConvertContact,
  useContactStats,
  useConversionRate,
};
