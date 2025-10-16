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

export default {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useSoftDeleteContact,
};
