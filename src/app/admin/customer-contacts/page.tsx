"use client";

import { useState } from 'react';
import { useContacts, useSoftDeleteContact } from '@/hooks/contactHooks';
import Link from 'next/link';
import ContactRow from '@/components/receptionist/ContactRow';
import { toast } from 'sonner';

export default function AdminContactsList() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const { data, isLoading } = useContacts({ page, size: pageSize, search });
    const del = useSoftDeleteContact();

    const handleDelete = async (id: string) => {
        if (!confirm('Confirm delete?')) return;
        try {
            await del.mutateAsync(id);
            toast.success('Deleted');
        } catch (err: any) {
            toast.error(err.message || 'Delete failed');
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Customer Contacts (Admin)</h2>
                <Link href="/admin/customer-contacts/new" className="btn btn-primary">New Contact</Link>
            </div>

            <div className="mb-4 flex items-center gap-3">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input" />
                <button className="btn" onClick={() => setPageSize(pageSize === 10 ? 10000 : 10)}>{pageSize === 10 ? 'Show all' : 'Paged'}</button>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <table className="w-full table-auto">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.items?.map((c: any) => (
                            <ContactRow key={c.id} contact={c} />
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination placeholder */}
        </div>
    );
}
