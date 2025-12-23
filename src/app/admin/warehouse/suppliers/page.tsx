'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Alert component - using inline alert instead
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Eye, Edit, Trash2, Search, Filter, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  faPlus,
  faSearch,
  faUsers,
  faChevronLeft,
  faChevronRight,
  faSort,
  faExclamationTriangle,
  faBan,
  faShoppingCart,
  faCalendarAlt,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import {
  useSuppliersWithMetrics,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/hooks/useSuppliers';
import {
  SupplierListDTO,
  SupplierSummaryResponse,
  SupplierDetailResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from '@/types/supplier';
import { formatDate, getStatusColor, getStatusLabel } from '@/utils/formatters';
import SupplierFormModal from '../components/SupplierFormModal';
import SupplierDetailModal from '../components/SupplierDetailModal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { supplierService } from '@/services/supplierService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function SuppliersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_SUPPLIER') || hasPermission('MANAGE_SUPPLIERS');
  const canUpdate = hasPermission('UPDATE_SUPPLIER') || hasPermission('MANAGE_SUPPLIERS');
  const canDelete = hasPermission('DELETE_SUPPLIER') || hasPermission('MANAGE_SUPPLIERS');
  const canView = hasPermission('VIEW_WAREHOUSE');

  // Pagination & Search state
  const [page, setPage] = useState(0);
  const [size] = useState(20); // Default 20 for API 6.13
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'supplierName' | 'totalOrders' | 'lastOrderDate' | 'createdAt' | null>(null);
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Tab state - filter by status
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'blacklisted'>('active');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDetailResponse | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierSummaryResponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; supplierId: number | null; supplierName: string }>({ isOpen: false, supplierId: null, supplierName: '' });

  // ==================== LOCK BODY SCROLL WHEN MODAL OPEN ====================
  useEffect(() => {
    if (isFormModalOpen || isViewModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, isViewModalOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
      setPage(0); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Fetch suppliers using API 6.13 (with business metrics)
  // Convert activeTab to filter values
  const isBlacklistedFilter = activeTab === 'blacklisted' ? true : null;
  const isActiveFilter = activeTab === 'active' ? true : activeTab === 'inactive' ? false : null;

  const { data: suppliersPage, isLoading } = useSuppliersWithMetrics({
    page,
    size,
    search: debouncedSearch || undefined,
    isBlacklisted: isBlacklistedFilter ?? undefined,
    isActive: isActiveFilter ?? undefined,
    sortBy: sortBy ?? undefined,
    sortDir,
  });

  const suppliers: SupplierListDTO[] = suppliersPage?.suppliers || [];
  const totalPages = suppliersPage?.totalPages || 0;
  const totalElements = suppliersPage?.totalElements || 0;

  // Mutations
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const handleOpenFormModal = (supplier?: SupplierListDTO | SupplierSummaryResponse) => {
    if (supplier) {
      // Convert to detail format for editing
      const detailData: SupplierDetailResponse = {
        supplierId: supplier.supplierId,
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        phoneNumber: (supplier as any).phoneNumber || '',
        email: supplier.email || '',
        address: (supplier as any).address || '',
        notes: (supplier as any).notes || '',
        contactPerson: (supplier as any).contactPerson || '',
        isActive: (supplier as any).isActive ?? (supplier as any).status === 'ACTIVE',
        createdAt: (supplier as any).createdAt || '',
        suppliedItems: [],
      };
      setEditingSupplier(detailData);
    } else {
      setEditingSupplier(null);
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(false);
  };

  const handleSaveSupplier = async (data: CreateSupplierRequest | UpdateSupplierRequest) => {
    if (editingSupplier) {
      updateMutation.mutate(
        { id: editingSupplier.supplierId, data: data as UpdateSupplierRequest },
        { onSuccess: () => handleCloseFormModal() }
      );
    } else {
      createMutation.mutate(
        data as CreateSupplierRequest,
        { onSuccess: () => handleCloseFormModal() }
      );
    }
  };

  const handleDelete = async (supplierId: number, supplierName: string) => {
    setDeleteConfirm({ isOpen: true, supplierId, supplierName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.supplierId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.supplierId);
      // Trigger re-fetch by resetting page
      setPage(0);
      setDeleteConfirm({ isOpen: false, supplierId: null, supplierName: '' });
    } catch (error: any) {
      // Error handling is done in useDeleteSupplier hook
      console.error('Error deleting supplier:', error);
    }
  };

  const handleViewDetail = async (supplier: SupplierListDTO | SupplierSummaryResponse) => {
    // Convert SupplierListDTO to SupplierSummaryResponse format for modal
    const summarySupplier: SupplierSummaryResponse = {
      supplierId: supplier.supplierId,
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      phoneNumber: (supplier as any).phoneNumber || '',
      email: supplier.email || '',
      status: (supplier as any).isActive ? 'ACTIVE' : 'INACTIVE',
    };
    setViewingSupplier(summarySupplier);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewingSupplier(null);
    setIsViewModalOpen(false);
  };

  // Helper: Check if supplier is inactive (> 6 months)
  const isSupplierInactive = (supplier: SupplierListDTO): boolean => {
    if (!supplier.lastOrderDate) return true; // Never ordered = inactive
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const lastOrder = new Date(supplier.lastOrderDate);
    return lastOrder < sixMonthsAgo;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const getStatusBadge = (isActive: boolean, isBlacklisted: boolean) => {
    // If blacklisted, show BLACKLIST badge only
    if (isBlacklisted) {
      return (
        <Badge variant="destructive" className="text-xs whitespace-nowrap">
          Danh sách đen
        </Badge>
      );
    }
    // Otherwise show active/inactive status
    const status = isActive ? 'ACTIVE' : 'INACTIVE';
    return (
      <Badge className={`${getStatusColor(status)} whitespace-nowrap`}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const handleSort = (field: 'supplierName' | 'totalOrders' | 'lastOrderDate' | 'createdAt' | null) => {
    if (field === null) {
      setSortBy(null);
      setSortDir('ASC');
    } else if (sortBy === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDir('ASC');
    }
  };

  // Get sort label for dropdown
  const getSortLabel = () => {
    if (!sortBy) return 'Sắp xếp';
    const labels: Record<string, string> = {
      supplierName: 'Tên',
      totalOrders: 'Tổng đơn',
      lastOrderDate: 'Đơn gần nhất',
      createdAt: 'Ngày tạo'
    };
    return labels[sortBy];
  };

  const activeCount = suppliers.filter((s) => s.isActive && !s.isBlacklisted).length;
  const inactiveCount = suppliers.filter((s) => !s.isActive && !s.isBlacklisted).length;
  const blacklistedCount = suppliers.filter((s) => s.isBlacklisted).length;

  return (
    <ProtectedRoute
      requiredBaseRole="admin"
      requiredPermissions={['VIEW_WAREHOUSE']}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold whitespace-nowrap">Quản lý nhà cung cấp</h1>
            <p className="text-slate-600 mt-1">Quản lý danh sách nhà cung cấp vật tư</p>
          </div>
          <Button
            onClick={() => handleOpenFormModal()}
            disabled={!canCreate}
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Thêm nhà cung cấp
          </Button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Tổng số nhà cung cấp</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faUsers} className="text-blue-700 text-xl" />
              </div>
              <p className="text-3xl font-bold text-blue-800">{totalElements}</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">Đang hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faUsers} className="text-green-700 text-xl" />
              </div>
              <p className="text-3xl font-bold text-green-800">{activeCount}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Ngưng hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faUsers} className="text-gray-700 text-xl" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{inactiveCount}</p>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Danh sách đen</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faBan} className="text-red-700 text-xl" />
              </div>
              <p className="text-3xl font-bold text-red-800">{blacklistedCount}</p>
            </div>
          </div>
        </div>

        {/* Toolbar + Table Container */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar: Search + Sort */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col gap-3">
              {/* Search + Sort Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search Box */}
                <div className="w-full sm:flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo tên, mã, SĐT, email..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#8b5fbf] focus:ring-[#8b5fbf] text-sm"
                    />
                  </div>
                </div>

                {/* Sort Dropdown + Direction */}
                <div className="flex items-center gap-2">
                  {/* Dropdown chọn field */}
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 border border-[#8b5fbf] rounded-lg text-xs sm:text-sm font-medium text-[#8b5fbf] hover:bg-[#f3f0ff] transition-colors bg-white whitespace-nowrap"
                    >
                      <Filter className="h-4 w-4 flex-shrink-0" />
                      <span>{getSortLabel()}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden">
                        <div className="p-2">
                          {[
                            { value: null, label: 'Mặc định' },
                            { value: 'supplierName', label: 'Tên' },
                            { value: 'totalOrders', label: 'Tổng đơn' },
                            { value: 'lastOrderDate', label: 'Đơn gần nhất' },
                            { value: 'createdAt', label: 'Ngày tạo' }
                          ].map((option) => (
                            <button
                              key={option.value || 'default'}
                              onClick={() => {
                                handleSort(option.value as 'supplierName' | 'totalOrders' | 'lastOrderDate' | 'createdAt' | null);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${sortBy === option.value
                                ? 'bg-[#8b5fbf] text-white'
                                : 'text-gray-700 hover:bg-[#f3f0ff]'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direction buttons - chỉ hiện khi có sort */}
                  {sortBy && (
                    <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                      <button
                        onClick={() => setSortDir('ASC')}
                        className={`p-1.5 rounded transition-all ${sortDir === 'ASC'
                          ? 'bg-[#8b5fbf] text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                        title="Tăng dần"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSortDir('DESC')}
                        className={`p-1.5 rounded transition-all ${sortDir === 'DESC'
                          ? 'bg-[#8b5fbf] text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                        title="Giảm dần"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setActiveTab('active'); setPage(0); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'active'
                    ? 'bg-green-600 text-white shadow-[0_2px_8px_rgba(22,163,74,0.4)]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === 'active' ? 'bg-white/20' : 'bg-green-200'}`}>
                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">Hoạt động</span>
                  <Badge className={`text-xs ${activeTab === 'active'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {activeCount}
                  </Badge>
                </button>

                <button
                  onClick={() => { setActiveTab('inactive'); setPage(0); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'inactive'
                    ? 'bg-gray-600 text-white shadow-[0_2px_8px_rgba(107,114,128,0.4)]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === 'inactive' ? 'bg-white/20' : 'bg-gray-300'}`}>
                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">Không hoạt động</span>
                  <Badge className={`text-xs ${activeTab === 'inactive'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-gray-200 text-gray-700'
                    }`}>
                    {inactiveCount}
                  </Badge>
                </button>

                <button
                  onClick={() => { setActiveTab('blacklisted'); setPage(0); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'blacklisted'
                    ? 'bg-red-600 text-white shadow-[0_2px_8px_rgba(220,38,38,0.4)]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === 'blacklisted' ? 'bg-white/20' : 'bg-gray-300'}`}>
                    <FontAwesomeIcon icon={faBan} className="h-2.5 w-2.5" />
                  </div>
                  <span className="hidden sm:inline">Danh sách đen</span>
                  <Badge className={`text-xs ${activeTab === 'blacklisted'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {blacklistedCount}
                  </Badge>
                </button>
              </div>
            </div>
          </div>

          {/* Suppliers Table */}
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={faUsers}
                title={debouncedSearch ? "Không tìm thấy nhà cung cấp" : "Chưa có nhà cung cấp"}
                description={debouncedSearch ? "Thử thay đổi từ khóa tìm kiếm" : "Thêm nhà cung cấp đầu tiên"}
                actionLabel={!debouncedSearch ? "Thêm nhà cung cấp" : undefined}
                onAction={!debouncedSearch ? () => handleOpenFormModal() : undefined}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên nhà cung cấp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điện thoại</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng đơn</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn gần nhất</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suppliers.map((supplier) => {
                      return (
                        <tr
                          key={supplier.supplierId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <span
                              className="text-sm font-medium text-gray-900 block truncate max-w-[200px]"
                              title={supplier.supplierName}
                            >
                              {supplier.supplierName}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{supplier.phoneNumber || <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{supplier.email || <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">{supplier.totalOrders || 0}</span>
                          </td>
                          <td className="px-4 py-4 text-center text-sm whitespace-nowrap">
                            {supplier.lastOrderDate ? (
                              <span className="text-gray-700">{formatDate(supplier.lastOrderDate)}</span>
                            ) : (
                              <span className="text-gray-400 italic">Chưa có</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(supplier.isActive, supplier.isBlacklisted ?? false)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewDetail(supplier)}
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleOpenFormModal(supplier)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDelete(supplier.supplierId, supplier.supplierName)}
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-600">
                  Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} của {totalElements} nhà cung cấp
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(0)}
                    disabled={page === 0}
                  >
                    Đầu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                  </Button>
                  <span className="text-sm px-3">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Cuối
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        <SupplierFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onSave={handleSaveSupplier}
          supplier={editingSupplier}
        />

        <SupplierDetailModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          supplier={viewingSupplier}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, supplierId: null, supplierName: '' })}
          onConfirm={confirmDelete}
          title="Xác nhận xóa nhà cung cấp"
          description={`Bạn có chắc chắc muốn xóa nhà cung cấp "${deleteConfirm.supplierName}"? 

 Lưu ý: Không thể xóa nhà cung cấp đã có lịch sử giao dịch. Nếu nhà cung cấp này đã có đơn hàng, hệ thống sẽ từ chối và đề xuất vô hiệu hóa (isActive=false) thay vì xóa.`}
          confirmLabel="Xóa"
          variant="destructive"
        />
      </div>
    </ProtectedRoute>
  );
}
