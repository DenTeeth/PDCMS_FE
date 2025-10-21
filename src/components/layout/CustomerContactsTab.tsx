"use client";

import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
import { useContacts } from '@/hooks/contactHooks';
import ContactRow from '@/components/receptionist/ContactRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faSort } from '@fortawesome/free-solid-svg-icons';

export default function CustomerContactsTab() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(1000);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const { data, isLoading } = useContacts({ page, size: pageSize, search: debouncedSearch });

    const processedContacts = useMemo(() => {
        let contacts = data?.items?.filter((c: any) => {
            const status = (c.status || c._raw?.status || '').toUpperCase();
            return status !== 'NOT_INTERESTED';
        }) || [];

        contacts = [...contacts].sort((a: any, b: any) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    const nameA = (a.fullName || a.name || '').toLowerCase();
                    const nameB = (b.fullName || b.name || '').toLowerCase();
                    comparison = nameA.localeCompare(nameB);
                    break;
                case 'date':
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    comparison = dateA - dateB;
                    break;
                case 'status':
                    const statusA = (a.status || a._raw?.status || '').toLowerCase();
                    const statusB = (b.status || b._raw?.status || '').toLowerCase();
                    comparison = statusA.localeCompare(statusB);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return contacts;
    }, [data?.items, sortBy, sortOrder]);

    const togglePageSize = useCallback(() => {
        setPageSize(prev => prev === 20 ? 1000 : 20);
    }, []);

    const toggleSort = (field: 'name' | 'date' | 'status') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with New Contact button */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-foreground">Customer Contacts</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage customer contact records and inquiries
                    </p>
                </div>
                <Link href="/receptionist/customers/new-contact">
                    <Button className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        <span>New Contact</span>
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search contacts..."
                        className="pl-10"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'status')}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="status">Sort by Status</option>
                    </select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faSort} className="h-4 w-4" />
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePageSize}
                    >
                        {pageSize === 20 ? 'Show All' : 'Show 20'}
                    </Button>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="animate-pulse">
                        <div className="bg-gray-50 border-b px-4 py-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="border-b px-4 py-3">
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="w-full table-auto">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th
                                    className="py-3 px-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleSort('name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Name</span>
                                        {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Phone</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Email</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Source</th>
                                <th
                                    className="py-3 px-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleSort('status')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Status</span>
                                        {sortBy === 'status' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th
                                    className="py-3 px-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleSort('date')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Created At</span>
                                        {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {processedContacts.map((c: any) => (
                                <ContactRow key={c.id} contact={c} showDelete />
                            ))}
                        </tbody>
                    </table>
                    {processedContacts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No contacts found
                        </div>
                    )}
                </div>
            )}

            {/* Pagination info */}
            {!isLoading && processedContacts.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                    Showing {processedContacts.length} contact{processedContacts.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
