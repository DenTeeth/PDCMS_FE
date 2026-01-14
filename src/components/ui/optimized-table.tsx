'use client';

/**
 * OptimizedTable Component
 * 
 * Tối ưu độ trễ cho tables lớn:
 * - Virtual scrolling support (có thể thêm sau)
 * - Memoized rows
 * - Minimal re-renders
 * - Efficient pagination
 * 
 * Có thể dùng làm template cho các table khác trong dự án
 */

import React, { memo, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';

export interface OptimizedTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface OptimizedTableProps<T> {
  data: T[];
  columns: OptimizedTableColumn<T>[];
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

// Memoized row component để tránh re-render không cần thiết
const TableRowMemo = memo(<T,>({
  row,
  columns,
  onClick,
}: {
  row: T;
  columns: OptimizedTableColumn<T>[];
  onClick?: (row: T) => void;
}) => {
  return (
    <TableRow
      className={onClick ? 'cursor-pointer hover:bg-muted/50' : ''}
      onClick={onClick ? () => onClick(row) : undefined}
    >
      {columns.map((column) => (
        <TableCell key={column.key} className={column.className}>
          {column.accessor(row)}
        </TableCell>
      ))}
    </TableRow>
  );
});

TableRowMemo.displayName = 'TableRowMemo';

export function OptimizedTable<T extends { [key: string]: any }>({
  data,
  columns,
  loading = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  pagination,
  onRowClick,
  emptyMessage = 'Không có dữ liệu',
  className = '',
}: OptimizedTableProps<T>) {
  // Memoize filtered/searched data
  const filteredData = useMemo(() => {
    // Ensure data is always an array
    const safeData = Array.isArray(data) ? data : [];
    
    if (!searchValue || !onSearchChange) return safeData;
    
    const searchLower = searchValue.toLowerCase();
    return safeData.filter((row) => {
      // Search across all string values in the row
      return Object.values(row).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchLower);
        }
        return false;
      });
    });
  }, [data, searchValue, onSearchChange]);

  // Memoize pagination info
  const paginationInfo = useMemo(() => {
    if (!pagination) return null;
    
    const startIndex = pagination.currentPage * pagination.pageSize + 1;
    const endIndex = Math.min(
      (pagination.currentPage + 1) * pagination.pageSize,
      pagination.totalElements
    );
    
    return {
      startIndex,
      endIndex,
      hasPrevious: pagination.currentPage > 0,
      hasNext: pagination.currentPage < pagination.totalPages - 1,
    };
  }, [pagination]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search và Pagination Controls - Không tách rời */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Pagination Info & Controls */}
        {pagination && paginationInfo && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {pagination.totalElements}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={!paginationInfo.hasPrevious || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium min-w-[80px] text-center">
                Page {pagination.currentPage + 1} of {pagination.totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={!paginationInfo.hasNext || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRowMemo
                  key={row.id || row.roomId || row.serviceId || index}
                  row={row}
                  columns={columns}
                  onClick={onRowClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

