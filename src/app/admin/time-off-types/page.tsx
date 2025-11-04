'use client';

/**
 * ADMIN TIME-OFF TYPES MANAGEMENT PAGE (P6.1)
 * 
 * Features:
 * ✅ View all time-off types (including inactive)
 * ✅ Create new time-off types
 * ✅ Update existing types
 * ✅ Toggle active status (soft delete)
 * ✅ RBAC permissions
 * ✅ Error handling (DUPLICATE_TYPE_CODE, TIMEOFF_TYPE_IN_USE)
 * 
 * RBAC Permissions:
 * - VIEW_TIMEOFF_TYPE_ALL: Required to access page
 * - CREATE_TIMEOFF_TYPE: Show Create button
 * - UPDATE_TIMEOFF_TYPE: Show Edit button
 * - DELETE_TIMEOFF_TYPE: Show Toggle Status button
 * 
 * API Endpoints:
 * - GET /api/v1/admin/time-off-types (get all including inactive)
 * - POST /api/v1/admin/time-off-types (create)
 * - PATCH /api/v1/admin/time-off-types/{id} (update)
 * - DELETE /api/v1/admin/time-off-types/{id} (toggle status)
 */

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Filter
} from 'lucide-react'; import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { TimeOffTypeService } from '@/services/timeOffTypeService';
import { TimeOffType } from '@/types/timeOff';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';
type SortField = 'typeName' | 'typeCode' | 'isPaid' | null;
type SortOrder = 'asc' | 'desc';

interface FormData {
  typeCode: string;
  typeName: string;
  description: string;
  requiresBalance: boolean;
  defaultDaysPerYear: number | null;
  isPaid: boolean;
}

interface FormErrors {
  typeCode?: string;
  typeName?: string;
  description?: string;
  defaultDaysPerYear?: string;
}

export default function AdminTimeOffTypesPage() {
  const { user } = useAuth();
  const { handleError: handleApiError } = useApiErrorHandler();

  // RBAC Permissions
  const canView = user?.permissions?.includes('VIEW_TIMEOFF_TYPE_ALL');
  const canCreate = user?.permissions?.includes('CREATE_TIMEOFF_TYPE');
  const canUpdate = user?.permissions?.includes('UPDATE_TIMEOFF_TYPE');
  const canDelete = user?.permissions?.includes('DELETE_TIMEOFF_TYPE');

  // State
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Sort states
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedType, setSelectedType] = useState<TimeOffType | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    typeCode: '',
    typeName: '',
    description: '',
    requiresBalance: true,
    defaultDaysPerYear: null,
    isPaid: true
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (canView) {
      loadTimeOffTypes();
    }
  }, [canView]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTimeOffTypes = async () => {
    try {
      setLoading(true);
      // Sử dụng Admin API để lấy tất cả (bao gồm cả inactive)
      const response = await TimeOffTypeService.getAllTimeOffTypes();
      setTimeOffTypes(response || []);
    } catch (error: any) {
      handleApiError(error, 'Không thể tải danh sách loại nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculations
  const stats = {
    total: timeOffTypes.length,
    active: timeOffTypes.filter(t => t.isActive).length,
    inactive: timeOffTypes.filter(t => !t.isActive).length,
    paid: timeOffTypes.filter(t => t.isPaid && t.isActive).length
  };

  // Filtering
  const filteredTypes = timeOffTypes.filter((type) => {
    const matchesSearch =
      type.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.typeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && type.isActive) ||
      (statusFilter === 'INACTIVE' && !type.isActive);

    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sortedTypes = [...filteredTypes].sort((a, b) => {
    if (!sortField) return 0;

    let compareResult = 0;

    switch (sortField) {
      case 'typeName':
        compareResult = a.typeName.localeCompare(b.typeName, 'vi');
        break;
      case 'typeCode':
        compareResult = a.typeCode.localeCompare(b.typeCode);
        break;
      case 'isPaid':
        compareResult = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
        break;
      default:
        compareResult = 0;
    }

    return sortOrder === 'asc' ? compareResult : -compareResult;
  });

  // Helper function for dropdown label
  const getSortLabel = () => {
    if (!sortField) return 'Sắp xếp';
    const labels = {
      typeName: 'Tên',
      typeCode: 'Mã',
      isPaid: 'Lương'
    };
    return labels[sortField];
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.typeCode.trim()) {
      errors.typeCode = 'Mã loại nghỉ phép không được để trống';
    } else if (!/^[A-Z0-9_]+$/.test(formData.typeCode)) {
      errors.typeCode = 'Mã chỉ được chứa chữ in hoa, số và dấu gạch dưới';
    }

    if (!formData.typeName.trim()) {
      errors.typeName = 'Tên loại nghỉ phép không được để trống';
    }

    if (!formData.description.trim()) {
      errors.description = 'Mô tả không được để trống';
    }

    if (formData.defaultDaysPerYear !== null && formData.defaultDaysPerYear < 0) {
      errors.defaultDaysPerYear = 'Số ngày mặc định phải >= 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create handler
  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Business rule: Nếu requiresBalance = false, defaultDaysPerYear phải là null
      const createDto = {
        typeCode: formData.typeCode,
        typeName: formData.typeName,
        description: formData.description,
        requiresBalance: formData.requiresBalance,
        defaultDaysPerYear: formData.requiresBalance ? formData.defaultDaysPerYear : null,
        isPaid: formData.isPaid,
      };

      console.log('🟢 Creating Time-Off Type:', createDto);
      console.log('🔍 Payload detail:', JSON.stringify(createDto, null, 2));
      console.log('🔍 Type check:', {
        typeCode: typeof createDto.typeCode,
        typeName: typeof createDto.typeName,
        description: typeof createDto.description,
        requiresBalance: typeof createDto.requiresBalance,
        defaultDaysPerYear: typeof createDto.defaultDaysPerYear,
        isPaid: typeof createDto.isPaid,
      });
      await TimeOffTypeService.createTimeOffType(createDto);
      alert('Tạo loại nghỉ phép thành công!');
      setShowCreateModal(false);
      resetForm();
      loadTimeOffTypes();
    } catch (error: any) {
      console.error('❌ Create Time-Off Type Error:', error);
      console.error('📋 Error Response:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        fullError: JSON.stringify(error?.response?.data, null, 2)
      });

      const errorCode = error?.response?.data?.code || error?.response?.data?.error;
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorCode === 'DUPLICATE_TYPE_CODE' || error?.response?.status === 409) {
        setFormErrors({ typeCode: 'Mã loại nghỉ phép này đã tồn tại' });
      } else if (error?.response?.status === 400) {
        // Show validation errors from backend
        const validationErrors = error?.response?.data?.errors || [];
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
          alert(`Lỗi validation từ backend:\n\n${errorMessages}`);
        } else {
          alert(`Lỗi 400: ${errorMsg || JSON.stringify(error?.response?.data)}`);
        }
      } else {
        handleApiError(error, 'Không thể tạo loại nghỉ phép');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Update handler
  const handleUpdate = async () => {
    if (!selectedType || !validateForm()) return;

    try {
      setSubmitting(true);

      // Business rule: Nếu requiresBalance = false, defaultDaysPerYear phải là null
      const updateDto = {
        typeCode: formData.typeCode,
        typeName: formData.typeName,
        description: formData.description,
        requiresBalance: formData.requiresBalance,
        defaultDaysPerYear: formData.requiresBalance ? formData.defaultDaysPerYear : null,
        isPaid: formData.isPaid,
      };

      await TimeOffTypeService.updateTimeOffType(selectedType.typeId, updateDto);
      alert('Cập nhật loại nghỉ phép thành công!');
      setShowEditModal(false);
      setSelectedType(null);
      resetForm();
      loadTimeOffTypes();
    } catch (error: any) {
      const errorCode = error?.response?.data?.code || error?.response?.data?.error;
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorCode === 'DUPLICATE_TYPE_CODE' || error?.response?.status === 409) {
        setFormErrors({ typeCode: 'Mã loại nghỉ phép này đã tồn tại' });
      } else if (errorCode === 'TIMEOFF_TYPE_NOT_FOUND' || error?.response?.status === 404) {
        alert('Loại nghỉ phép không tồn tại');
        setShowEditModal(false);
        loadTimeOffTypes();
      } else {
        handleApiError(error, 'Không thể cập nhật loại nghỉ phép');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status handler
  const handleToggleStatus = async () => {
    if (!selectedType) return;

    try {
      setSubmitting(true);

      await TimeOffTypeService.deleteTimeOffType(selectedType.typeId);
      const newStatus = !selectedType.isActive;
      alert(`${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} loại nghỉ phép thành công!`);
      setShowToggleModal(false);
      setSelectedType(null);
      loadTimeOffTypes();
    } catch (error: any) {
      const errorCode = error?.response?.data?.code || error?.response?.data?.error;
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorCode === 'TIMEOFF_TYPE_IN_USE' || error?.response?.status === 409) {
        alert('Không thể vô hiệu hóa. Loại nghỉ phép này đang được sử dụng trong các yêu cầu nghỉ phép đang chờ duyệt.');
      } else if (errorCode === 'TIMEOFF_TYPE_NOT_FOUND' || error?.response?.status === 404) {
        alert('Loại nghỉ phép không tồn tại');
        setShowToggleModal(false);
        loadTimeOffTypes();
      } else {
        handleApiError(error, 'Không thể thay đổi trạng thái');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      typeCode: '',
      typeName: '',
      description: '',
      requiresBalance: true,
      defaultDaysPerYear: null,
      isPaid: true
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (type: TimeOffType) => {
    setSelectedType(type);
    setFormData({
      typeCode: type.typeCode,
      typeName: type.typeName,
      description: type.description || '',
      requiresBalance: type.requiresBalance ?? true,
      defaultDaysPerYear: type.defaultDaysPerYear,
      isPaid: type.isPaid
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openToggleModal = (type: TimeOffType) => {
    setSelectedType(type);
    setShowToggleModal(true);
  };

  // Permission check
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có quyền truy cập</h3>
            <p className="text-gray-600">Bạn không có quyền xem danh sách loại nghỉ phép.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản Lý Loại Nghỉ Phép</h1>
            <p className="text-sm text-gray-600 mt-1">Quản lý các loại nghỉ phép trong hệ thống</p>
          </div>

          {/* Create Button */}
          {canCreate && (
            <Button
              onClick={openCreateModal}
              className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo Loại
            </Button>
          )}
        </div>

        {/* Stats Cards Grid - 3 cards balanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Tổng số */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          {/* Hoạt động */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>

          {/* Vô hiệu */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Vô hiệu</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Filters + Search + Actions */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col gap-3">
            {/* Row 1: Search + Sort + Create */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search - flex-1 để chiếm nhiều không gian */}
              <div className="w-full sm:flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo mã, tên hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#8b5fbf] focus:ring-[#8b5fbf] text-sm"
                  />
                </div>
              </div>

              {/* Sort Dropdown + Direction buttons */}
              <div className="flex items-center gap-2">
                {/* Dropdown chọn field */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 border border-[#8b5fbf] rounded-lg text-xs sm:text-sm font-medium text-[#8b5fbf] hover:bg-[#f3f0ff] transition-colors bg-white whitespace-nowrap"
                  >
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <span>{getSortLabel()}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''
                      }`} />
                  </button>

                  {isSortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden">
                      <div className="p-2">
                        {[
                          { value: null as SortField, label: 'Mặc định' },
                          { value: 'typeName' as SortField, label: 'Tên' },
                          { value: 'typeCode' as SortField, label: 'Mã' },
                          { value: 'isPaid' as SortField, label: 'Lương' }
                        ].map((option) => (
                          <button
                            key={option.value || 'default'}
                            onClick={() => {
                              setSortField(option.value);
                              setSortOrder('asc');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${sortField === option.value
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
                {sortField && (
                  <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                    <button
                      onClick={() => setSortOrder('asc')}
                      className={`p-1.5 rounded transition-all ${sortOrder === 'asc'
                        ? 'bg-[#8b5fbf] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }`}
                      title="Tăng dần"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSortOrder('desc')}
                      className={`p-1.5 rounded transition-all ${sortOrder === 'desc'
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

            {/* Row 2: Status Filter Buttons */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ALL')}
                size="sm"
                className={statusFilter === 'ALL' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
              >
                Tất Cả ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ACTIVE')}
                size="sm"
                className={statusFilter === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Hoạt Động ({stats.active})
              </Button>
              <Button
                variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('INACTIVE')}
                size="sm"
                className={statusFilter === 'INACTIVE' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Vô Hiệu ({stats.inactive})
              </Button>
            </div>
          </div>
        </div>

        {/* Table - No Card wrapper */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô Tả
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày/Năm
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Có Lương
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTypes.map((type) => (
                  <tr key={type.typeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-mono">
                        {type.typeCode}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{type.typeName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md truncate">
                        {type.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">
                        {type.defaultDaysPerYear !== null ? type.defaultDaysPerYear : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center" title={type.isPaid ? 'Có lương' : 'Không lương'}>
                        {type.isPaid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge className={type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {type.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openToggleModal(type)}
                            className={type.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {type.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedTypes.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Không tìm thấy loại nghỉ phép nào</p>
              <p className="text-sm text-gray-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl h-auto max-h-[85vh] flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                Tạo Loại Nghỉ Phép Mới
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 pt-6 space-y-4">{/* Scrollable content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="typeCode">Mã Loại <span className="text-red-500">*</span></Label>
                  <Input
                    id="typeCode"
                    placeholder="VD: ANNUAL_LEAVE"
                    value={formData.typeCode}
                    onChange={(e) => {
                      setFormData({ ...formData, typeCode: e.target.value.toUpperCase() });
                      setFormErrors({ ...formErrors, typeCode: undefined });
                    }}
                    className={formErrors.typeCode ? 'border-red-500' : ''}
                  />
                  {formErrors.typeCode && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.typeCode}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Chỉ chữ in hoa, số và gạch dưới</p>
                </div>

                <div>
                  <Label htmlFor="typeName">Tên Loại <span className="text-red-500">*</span></Label>
                  <Input
                    id="typeName"
                    placeholder="VD: Nghỉ phép năm"
                    value={formData.typeName}
                    onChange={(e) => {
                      setFormData({ ...formData, typeName: e.target.value });
                      setFormErrors({ ...formErrors, typeName: undefined });
                    }}
                    className={formErrors.typeName ? 'border-red-500' : ''}
                  />
                  {formErrors.typeName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.typeName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô Tả <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về loại nghỉ phép..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setFormErrors({ ...formErrors, description: undefined });
                  }}
                  rows={3}
                  className={formErrors.description ? 'border-red-500' : ''}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultDays">
                    Ngày Mặc Định/Năm
                    {!formData.requiresBalance && (
                      <span className="text-xs text-gray-500 ml-2">(Chỉ khi yêu cầu số dư)</span>
                    )}
                  </Label>
                  <Input
                    id="defaultDays"
                    type="number"
                    min="0"
                    placeholder="VD: 12"
                    value={formData.defaultDaysPerYear ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      setFormData({ ...formData, defaultDaysPerYear: value });
                      setFormErrors({ ...formErrors, defaultDaysPerYear: undefined });
                    }}
                    disabled={!formData.requiresBalance}
                    className={formErrors.defaultDaysPerYear ? 'border-red-500' : ''}
                  />
                  {!formData.requiresBalance && (
                    <p className="text-xs text-gray-500 mt-1">
                      ⓘ Không cần khi không yêu cầu số dư
                    </p>
                  )}
                  {formErrors.defaultDaysPerYear && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.defaultDaysPerYear}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <Label className="mb-2">Yêu Cầu Số Dư Ngày Nghỉ</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.requiresBalance}
                        onChange={() => setFormData({ ...formData, requiresBalance: true })}
                        className="mr-2"
                      />
                      <span className="text-sm">Có</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.requiresBalance}
                        onChange={() => setFormData({ ...formData, requiresBalance: false })}
                        className="mr-2"
                      />
                      <span className="text-sm">Không</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col">
                  <Label className="mb-2">Được Trả Lương</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.isPaid}
                        onChange={() => setFormData({ ...formData, isPaid: true })}
                        className="mr-2"
                      />
                      <span className="text-sm">Có</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.isPaid}
                        onChange={() => setFormData({ ...formData, isPaid: false })}
                        className="mr-2"
                      />
                      <span className="text-sm">Không</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Loại Nghỉ Phép'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl h-auto max-h-[85vh] flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-purple-600" />
                Chỉnh Sửa Loại Nghỉ Phép
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 pt-6 space-y-4">{/* Scrollable content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-typeCode">Mã Loại <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-typeCode"
                    placeholder="VD: ANNUAL_LEAVE"
                    value={formData.typeCode}
                    onChange={(e) => {
                      setFormData({ ...formData, typeCode: e.target.value.toUpperCase() });
                      setFormErrors({ ...formErrors, typeCode: undefined });
                    }}
                    className={formErrors.typeCode ? 'border-red-500' : ''}
                  />
                  {formErrors.typeCode && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.typeCode}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-typeName">Tên Loại <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-typeName"
                    placeholder="VD: Nghỉ phép năm"
                    value={formData.typeName}
                    onChange={(e) => {
                      setFormData({ ...formData, typeName: e.target.value });
                      setFormErrors({ ...formErrors, typeName: undefined });
                    }}
                    className={formErrors.typeName ? 'border-red-500' : ''}
                  />
                  {formErrors.typeName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.typeName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Mô Tả <span className="text-red-500">*</span></Label>
                <Textarea
                  id="edit-description"
                  placeholder="Mô tả chi tiết về loại nghỉ phép..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setFormErrors({ ...formErrors, description: undefined });
                  }}
                  rows={3}
                  className={formErrors.description ? 'border-red-500' : ''}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-defaultDays">
                    Ngày Mặc Định/Năm
                    {!formData.requiresBalance && (
                      <span className="text-xs text-gray-500 ml-2">(Chỉ khi có yêu cầu số dư ngày nghỉ)</span>
                    )}
                  </Label>
                  <Input
                    id="edit-defaultDays"
                    type="number"
                    min="0"
                    placeholder="VD: 12"
                    value={formData.defaultDaysPerYear ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      setFormData({ ...formData, defaultDaysPerYear: value });
                      setFormErrors({ ...formErrors, defaultDaysPerYear: undefined });
                    }}
                    disabled={!formData.requiresBalance}
                    className={formErrors.defaultDaysPerYear ? 'border-red-500' : ''}
                  />
                  {!formData.requiresBalance && (
                    <p className="text-xs text-gray-500 mt-1">
                      ⓘ Không cần khi không yêu cầu số dư
                    </p>
                  )}
                  {formErrors.defaultDaysPerYear && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.defaultDaysPerYear}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <Label className="mb-2">Yêu Cầu Số Dư Ngày Nghỉ</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.requiresBalance}
                        onChange={() => setFormData({ ...formData, requiresBalance: true })}
                        className="mr-2"
                      />
                      <span className="text-sm">Có</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.requiresBalance}
                        onChange={() => setFormData({ ...formData, requiresBalance: false })}
                        className="mr-2"
                      />
                      <span className="text-sm">Không</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col">
                  <Label className="mb-2">Được Trả Lương</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.isPaid}
                        onChange={() => setFormData({ ...formData, isPaid: true })}
                        className="mr-2"
                      />
                      <span className="text-sm">Có</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.isPaid}
                        onChange={() => setFormData({ ...formData, isPaid: false })}
                        className="mr-2"
                      />
                      <span className="text-sm">Không</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
                >
                  {submitting ? 'Đang cập nhật...' : 'Cập Nhật'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedType(null);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toggle Status Modal */}
      {showToggleModal && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                {selectedType.isActive ? (
                  <PowerOff className="h-5 w-5 text-red-600" />
                ) : (
                  <Power className="h-5 w-5 text-green-600" />
                )}
                {selectedType.isActive ? 'Vô Hiệu Hóa' : 'Kích Hoạt'} Loại Nghỉ Phép
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">{/* Fixed height, no scroll needed for simple confirmation */}
              <p className="text-gray-600">
                Bạn có chắc chắn muốn {selectedType.isActive ? 'vô hiệu hóa' : 'kích hoạt'} loại nghỉ phép{' '}
                <strong>{selectedType.typeName}</strong>?
              </p>

              {selectedType.isActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Loại nghỉ phép đang được sử dụng trong các yêu cầu đang chờ duyệt sẽ không thể vô hiệu hóa.
                  </p>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-4">
                <Button
                  onClick={handleToggleStatus}
                  disabled={submitting}
                  className={selectedType.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {submitting ? 'Đang xử lý...' : (selectedType.isActive ? 'Vô Hiệu Hóa' : 'Kích Hoạt')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowToggleModal(false);
                    setSelectedType(null);
                  }}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}