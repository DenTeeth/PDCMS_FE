"use client";

import Link from 'next/link';
import React, { memo, useCallback, useMemo } from 'react';
import { useSoftDeleteContact } from '@/hooks/contactHooks';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

// Helper function to get status badge with color
const getStatusBadge = (status: string) => {
  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case 'NEW':
    case 'PENDING':
      return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>;
    case 'CONTACTED':
    case 'IN_PROGRESS':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{status}</Badge>;
    case 'INTERESTED':
    case 'QUALIFIED':
      return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
    case 'NOT_INTERESTED':
    case 'REJECTED':
      return <Badge variant="destructive">{status}</Badge>;
    case 'CONVERTED':
    case 'SUCCESS':
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const ContactRow = memo(function ContactRow({ contact, showDelete }: { contact: any; showDelete?: boolean }) {
  const del = useSoftDeleteContact();
  const { user } = useAuth();

  // Memoize computed values
  const canDelete = useMemo(() =>
    user?.roles?.includes('Admin') || user?.permissions?.includes('customer-contacts.delete'),
    [user?.roles, user?.permissions]
  );

  const visibleDelete = canDelete || !!showDelete;

  const handleDelete = useCallback(async () => {
    if (!confirm('Xác nhận xóa contact này?')) return;
    try {
      await del.mutateAsync(contact.id);
      console.log('✅ Delete success for contact:', contact.id);
    } catch (err: any) {
      console.error('❌ Delete failed for contact:', contact.id);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        headers: err.response?.headers,
      });
      alert(`Delete failed: ${err.response?.data?.message || err.message || '403 Forbidden - Check permissions'}`);
    }
  }, [contact.id, del]);

  // Memoize display values
  const displayName = useMemo(() =>
    contact.fullName || contact.name || contact.displayName || '-',
    [contact.fullName, contact.name, contact.displayName]
  );

  const createdAt = useMemo(() =>
    contact.createdAt ? new Date(contact.createdAt).toLocaleString() : '-',
    [contact.createdAt]
  );

  const source = useMemo(() =>
    contact.source || contact._raw?.source || '-',
    [contact.source, contact._raw?.source]
  );

  const status = useMemo(() =>
    contact.status || contact._raw?.status || '-',
    [contact.status, contact._raw?.status]
  );

  return (
    <tr>
      <td className="py-2 px-3">{displayName}</td>
      <td className="py-2 px-3">{contact.phone || '-'}</td>
      <td className="py-2 px-3">{contact.email || '-'}</td>
      <td className="py-2 px-3">{source}</td>
      <td className="py-2 px-3">{getStatusBadge(status)}</td>
      <td className="py-2 px-3">{createdAt}</td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <Link href={`/employee/customers/contact/${contact.id}`} className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600">View</Link>
          <Link href={`/employee/customers/contact/${contact.id}/edit`} className="text-sm px-2 py-1 rounded bg-green-50 text-green-600">Edit</Link>
          {visibleDelete && (
            <button onClick={handleDelete} className="text-sm px-2 py-1 rounded bg-red-50 text-red-600">Delete</button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default ContactRow;
