"use client";

import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
import { useContacts } from '@/hooks/contactHooks';
import ContactRow from '@/app/employee/customers/components/ContactRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faSort } from '@fortawesome/free-solid-svg-icons';

export default function ContactsPage() {
  // backend expects 0-based page index, default to 0
  const [page, setPage] = useState(0);
  // pageSize: default to large value to show all contacts
  const [pageSize, setPageSize] = useState(1000);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading } = useContacts({ page, size: pageSize, search: debouncedSearch });

  // Memoize filtered and sorted contacts
  const processedContacts = useMemo(() => {
    let contacts = data?.items?.filter((c: any) => {
      const status = (c.status || c._raw?.status || '').toUpperCase();
      return status !== 'NOT_INTERESTED';
    }) || [];

    // Sort contacts
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

  // Memoize toggle page size
  const togglePageSize = useCallback(() => {
    setPageSize(prev => prev === 20 ? 1000 : 20);
  }, []);

  // Toggle sort order
  const toggleSort = (field: 'name' | 'date' | 'status') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Liên hệ khách hàng</h2>
          <p className="text-muted-foreground mt-2">
            Quản lý hồ sơ liên hệ và xử lý yêu cầu của khách hàng
          </p>
        </div>
        <Link href="/employee/customer-contacts/new">
          <Button className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            <span>Liên hệ mới</span>
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
            placeholder="Tìm kiếm liên hệ..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'status')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="date">Sắp xếp theo ngày</option>
            <option value="name">Sắp xếp theo tên</option>
            <option value="status">Sắp xếp theo trạng thái</option>
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
            {pageSize === 20 ? 'Hiển thị hết' : 'Hiển thị 20'}
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
                    <span>Tên</span>
                    {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Số điện thoại</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Nguồn</th>
                <th
                  className="py-3 px-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Trạng thái</span>
                    {sortBy === 'status' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Ngày tạo</span>
                    {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>  
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Hành động</th>
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
              Không tìm thấy liên hệ nào
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
