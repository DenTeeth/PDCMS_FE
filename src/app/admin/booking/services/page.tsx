'use client';

/**
 * Booking - Services Management Page
 * 
 * Similar to booking/rooms with:
 * - Full CRUD operations (Create, Update, Delete/Deactivate)
 * - Modern search/filter UI with Select components
 * - Debounced search để hạn chế API calls
 * - Dynamic specialization extraction from data
 * - OptimizedTable component for performance
 * - Pagination below table
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { OptimizedTable, OptimizedTableColumn } from '@/components/ui/optimized-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ServiceService } from '@/services/serviceService';
import { specializationService } from '@/services/specializationService';
import {
  Service,
  ServiceListResponse,
  ServiceFilters,
  CreateServiceRequest,
  UpdateServiceRequest,
} from '@/types/service';
import { Specialization } from '@/types/specialization';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Eye, Plus, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, X, Filter } from 'lucide-react';

interface ServiceFormData {
  serviceCode: string;
  serviceName: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultBufferMinutes: number;
  price: number;
  specializationId?: number;
  displayOrder?: number; // Display order
  isActive: boolean;
}

export default function BookingServicesPage() {
  const { user, hasPermission } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('active');

  // Sort states
  const [sortBy, setSortBy] = useState<string>('serviceName');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<ServiceFormData>({
    serviceCode: '',
    serviceName: '',
    description: '',
    defaultDurationMinutes: 30,
    defaultBufferMinutes: 10,
    price: 0,
    specializationId: undefined,
    displayOrder: 1, // Default to 1 (required by backend NOT NULL constraint)
    isActive: true,
  });

  const [updateForm, setUpdateForm] = useState<ServiceFormData>({
    serviceCode: '',
    serviceName: '',
    description: '',
    defaultDurationMinutes: 30,
    defaultBufferMinutes: 10,
    price: 0,
    specializationId: undefined,
    displayOrder: 1, // Default to 1 (required by backend NOT NULL constraint)
    isActive: true,
  });

  // Permissions
  const canView = user?.permissions?.includes('VIEW_SERVICE') || false;
  const canCreate = user?.permissions?.includes('CREATE_SERVICE') || false;
  const canUpdate = user?.permissions?.includes('UPDATE_SERVICE') || false;
  const canDelete = user?.permissions?.includes('DELETE_SERVICE') || false;

  // Search state - separate from debounced search
  // searchInput: what user types (immediate update)
  // searchKeyword: what triggers search (set on Enter or debounced)
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Debounced search - longer delay (1000ms) or trigger on Enter
  const debouncedSearch = useDebounce(searchKeyword, 1000);

  // Sort dropdown state
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Load all specializations from getAllSpecialization API
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        const data = await specializationService.getAll();
        setSpecializations(data);
      } catch (error) {
        console.error('Error loading specializations:', error);
      }
    };
    loadSpecializations();
  }, []);

  // Use specializations directly from API (getAllSpecialization)
  // Parse specializationId from string to number for backend compatibility
  const availableSpecializations = useMemo(() => {
    return specializations
      .map(spec => ({
        id: parseInt(spec.specializationId),
        name: spec.specializationName,
        specializationId: spec.specializationId, // Keep original for display
      }))
      .filter(spec => !isNaN(spec.id)) // Filter out invalid IDs
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [specializations]);

  // Helper function để lấy specialization name
  const getSpecializationName = useCallback((specializationId?: number): string => {
    if (!specializationId) return 'Không có';
    const spec = availableSpecializations.find(s => s.id === specializationId);
    return spec?.name || 'Không xác định';
  }, [availableSpecializations]);

  // Load services với filters, sort và pagination
  // Use ref to store handleError to avoid including it in dependencies
  const handleErrorRef = useRef(handleError);
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Request cancellation để tránh race condition
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadServices = useCallback(async () => {
    if (!canView) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Stale-while-revalidate: Keep old data visible while loading
    setLoading(true);
    try {
      const filters: ServiceFilters = {
        keyword: debouncedSearch || undefined,
        sortBy: sortBy,
        sortDirection: sortDirection,
        page: currentPage,
        size: pageSize,
      };

      // Add specializationId filter if not 'all'
      // Backend expects Integer, so parse string to number
      if (specializationFilter !== 'all') {
        const specId = parseInt(specializationFilter);
        if (!isNaN(specId)) {
          filters.specializationId = String(specId); // ServiceFilters expects string, but backend parses to Integer
        }
      }

      // Add isActive filter if not 'all'
      if (isActiveFilter !== 'all') {
        filters.isActive = isActiveFilter === 'active' ? 'true' : 'false';
      }

      const response: ServiceListResponse = await ServiceService.getServices(filters);

      // Only update if request wasn't cancelled
      if (!abortController.signal.aborted) {
        setServices(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      console.error('Error loading services:', error);
      handleErrorRef.current(error);
      // Only clear data if it's a real error (not cancellation)
      if (!abortController.signal.aborted) {
        setServices([]);
      }
    } finally {
      // Only update loading state if request wasn't cancelled
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      // Clear abort controller reference
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [canView, debouncedSearch, specializationFilter, isActiveFilter, sortBy, sortDirection, currentPage, pageSize]);

  // Load services khi filters hoặc page thay đổi
  useEffect(() => {
    loadServices();

    // Cleanup: Cancel request on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadServices]);

  // Reset về page 0 khi filters hoặc sort thay đổi (debouncedSearch thay vì searchInput)
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearch, specializationFilter, isActiveFilter, sortBy, sortDirection]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to get sort label
  const getSortLabel = () => {
    const labels: Record<string, string> = {
      serviceName: 'Tên dịch vụ',
      serviceCode: 'Mã dịch vụ',
      price: 'Giá',
    };
    return labels[sortBy] || 'Sắp xếp';
  };

  // Clear all filters function
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchKeyword('');
    setSpecializationFilter('all');
    setIsActiveFilter('active');
    setSortBy('serviceName');
    setSortDirection('ASC');
    setCurrentPage(0);
  };

  // Handle create service
  const handleCreateService = async () => {
    try {
      // Validation
      if (!createForm.serviceCode.trim()) {
        toast.error('Vui lòng nhập mã dịch vụ');
        return;
      }
      if (!createForm.serviceName.trim()) {
        toast.error('Vui lòng nhập tên dịch vụ');
        return;
      }
      if (createForm.defaultDurationMinutes < 1) {
        toast.error('Thời gian thực hiện phải lớn hơn 0');
        return;
      }
      // Validate duration must be multiple of 15
      if (createForm.defaultDurationMinutes % 15 !== 0) {
        toast.error('Thời gian thực hiện phải là bội số của 15 phút (15, 30, 45, 60...)');
        return;
      }
      if (createForm.defaultBufferMinutes < 0) {
        toast.error('Thời gian đệm phải lớn hơn hoặc bằng 0');
        return;
      }
      // Validate buffer must be multiple of 5
      if (createForm.defaultBufferMinutes % 5 !== 0) {
        toast.error('Thời gian đệm phải là bội số của 5 phút (0, 5, 10, 15, 20...)');
        return;
      }
      if (createForm.price < 0) {
        toast.error('Giá phải lớn hơn hoặc bằng 0');
        return;
      }

      // Ensure displayOrder is always a positive number (backend requires it)
      const finalDisplayOrder = createForm.displayOrder && createForm.displayOrder > 0
        ? createForm.displayOrder
        : 1;

      const requestData: CreateServiceRequest = {
        serviceCode: createForm.serviceCode.trim(),
        serviceName: createForm.serviceName.trim(),
        description: createForm.description?.trim() || undefined,
        defaultDurationMinutes: createForm.defaultDurationMinutes,
        defaultBufferMinutes: createForm.defaultBufferMinutes,
        price: createForm.price,
        specializationId: createForm.specializationId || undefined,
        displayOrder: finalDisplayOrder, // Always send a number (required by backend)
        isActive: createForm.isActive,
      };

      console.log('Creating service with data:', JSON.stringify(requestData, null, 2));

      await ServiceService.createService(requestData);

      // Reset form
      setCreateForm({
        serviceCode: '',
        serviceName: '',
        description: '',
        defaultDurationMinutes: 30,
        defaultBufferMinutes: 10,
        price: 0,
        specializationId: undefined,
        displayOrder: 1, // Reset to default 1
        isActive: true,
      });

      // Close modal
      setShowCreateModal(false);

      // Reload data (specializations are already loaded from getAllSpecialization API)
      await loadServices();

      toast.success('Tạo dịch vụ thành công!');
    } catch (error: any) {
      console.error('Error creating service:', error);
      console.error('Error response:', error.response?.data);

      // Show more detailed error message
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || 'Lỗi server. Vui lòng kiểm tra lại dữ liệu hoặc liên hệ admin.';
        toast.error(`Lỗi tạo dịch vụ: ${errorMessage}`);
      } else {
        handleCreateError(error);
      }
    }
  };

  // Handle create error
  const handleCreateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'SERVICE_CODE_EXISTS':
        toast.error('Mã dịch vụ này đã tồn tại');
        break;
      case 'SPECIALIZATION_NOT_FOUND':
        toast.error('Chuyên khoa không tồn tại');
        break;
      case 'VALIDATION_ERROR':
        toast.error(errorMessage || 'Dữ liệu không hợp lệ');
        break;
      case 'FORBIDDEN':
        toast.error('Bạn không có quyền tạo dịch vụ');
        break;
      default:
        handleError(error);
    }
  };

  // Handle update service
  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      // Validation
      if (!updateForm.serviceName.trim()) {
        toast.error('Vui lòng nhập tên dịch vụ');
        return;
      }
      if (updateForm.defaultDurationMinutes !== undefined && updateForm.defaultDurationMinutes < 1) {
        toast.error('Thời gian thực hiện phải lớn hơn 0');
        return;
      }
      // Validate duration must be multiple of 15
      if (updateForm.defaultDurationMinutes !== undefined && updateForm.defaultDurationMinutes % 15 !== 0) {
        toast.error('Thời gian thực hiện phải là bội số của 15 phút (15, 30, 45, 60...)');
        return;
      }
      if (updateForm.defaultBufferMinutes !== undefined && updateForm.defaultBufferMinutes < 0) {
        toast.error('Thời gian đệm phải lớn hơn hoặc bằng 0');
        return;
      }
      // Validate buffer must be multiple of 5
      if (updateForm.defaultBufferMinutes !== undefined && updateForm.defaultBufferMinutes % 5 !== 0) {
        toast.error('Thời gian đệm phải là bội số của 5 phút (0, 5, 10, 15, 20...)');
        return;
      }
      if (updateForm.price !== undefined && updateForm.price < 0) {
        toast.error('Giá phải lớn hơn hoặc bằng 0');
        return;
      }

      // Ensure displayOrder is always a positive number (backend requires it)
      const finalDisplayOrder = updateForm.displayOrder && updateForm.displayOrder > 0
        ? updateForm.displayOrder
        : (selectedService?.displayOrder || 1);

      const requestData: UpdateServiceRequest = {
        serviceName: updateForm.serviceName.trim(),
        description: updateForm.description?.trim() || undefined,
        defaultDurationMinutes: updateForm.defaultDurationMinutes,
        defaultBufferMinutes: updateForm.defaultBufferMinutes,
        price: updateForm.price,
        specializationId: updateForm.specializationId || undefined,
        displayOrder: finalDisplayOrder, // Always send a number (required by backend)
        isActive: updateForm.isActive,
      };

      await ServiceService.updateService(selectedService.serviceCode, requestData);

      // Close modal
      setShowUpdateModal(false);

      // Reload data (specializations are already loaded from getAllSpecialization API)
      await loadServices();

      toast.success('Cập nhật dịch vụ thành công!');
    } catch (error: any) {
      console.error('Error updating service:', error);
      handleUpdateError(error);
    }
  };

  // Handle update error
  const handleUpdateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'SERVICE_CODE_EXISTS':
        toast.error('Mã dịch vụ này đã tồn tại');
        break;
      case 'SPECIALIZATION_NOT_FOUND':
        toast.error('Chuyên khoa không tồn tại');
        break;
      case 'SERVICE_NOT_FOUND':
        toast.error('Không tìm thấy dịch vụ này');
        break;
      case 'VALIDATION_ERROR':
        toast.error(errorMessage || 'Dữ liệu không hợp lệ');
        break;
      case 'FORBIDDEN':
        toast.error('Bạn không có quyền cập nhật dịch vụ');
        break;
      default:
        handleError(error);
    }
  };

  // Handle delete service (deactivate)
  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      await ServiceService.deleteServiceById(selectedService.serviceId);

      // Close modal
      setShowDeleteModal(false);

      // Reload data (no need to reload specializations for deactivate)
      await loadServices();

      toast.success('Vô hiệu hóa dịch vụ thành công!');
    } catch (error: any) {
      console.error('Error deleting service:', error);
      handleDeleteError(error);
    }
  };

  // Handle delete error
  const handleDeleteError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'SERVICE_NOT_FOUND':
        toast.error('Không tìm thấy dịch vụ này');
        break;
      case 'FORBIDDEN':
        toast.error('Bạn không có quyền thực hiện hành động này');
        break;
      default:
        handleError(error);
    }
  };

  // Handle edit click
  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setUpdateForm({
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      description: service.description || '',
      defaultDurationMinutes: service.defaultDurationMinutes,
      defaultBufferMinutes: service.defaultBufferMinutes,
      price: service.price,
      specializationId: service.specializationId,
      displayOrder: service.displayOrder,
      isActive: service.isActive,
    });
    setShowUpdateModal(true);
  };

  // Handle delete click (only for active services)
  const handleDeleteClick = (service: Service) => {
    if (!service.isActive) return; // Only allow deactivating active services
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  // Handle row click để xem chi tiết
  const handleRowClick = useCallback((service: Service) => {
    setSelectedService(service);
    setShowDetailModal(true);
  }, []);

  // ==================== CATEGORY HANDLERS ====================

  // Columns definition
  const columns: OptimizedTableColumn<Service>[] = useMemo(() => [
    {
      key: 'serviceCode',
      header: 'Mã dịch vụ',
      accessor: (service) => (
        <span className="font-medium">{service.serviceCode}</span>
      ),
    },
    {
      key: 'serviceName',
      header: 'Tên dịch vụ',
      accessor: (service) => service.serviceName,
    },
    {
      key: 'specialization',
      header: 'Chuyên khoa',
      accessor: (service) => (
        <Badge variant="outline">
          {getSpecializationName(service.specializationId)}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Giá',
      accessor: (service) => (
        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Thời lượng',
      accessor: (service) => (
        <span>{service.defaultDurationMinutes} phút</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      accessor: (service) => (
        <Badge variant={service.isActive ? 'default' : 'secondary'}>
          {service.isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      accessor: (service) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(service);
            }}
            className="hover:bg-gray-100"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(service);
              }}
              className="hover:bg-gray-100"
              title="Chỉnh sửa"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && service.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(service);
              }}
              className="hover:bg-red-50 text-red-600"
              title="Vô hiệu hóa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-[120px]',
    },
  ], [handleRowClick, canUpdate, canDelete, getSpecializationName]);

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem danh sách dịch vụ." />;
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_SERVICE']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý dịch vụ</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý dịch vụ phòng khám và yêu cầu chuyên khoa
            </p>
          </div>
        </div>

        {/* Header with Create Button */}
        <div className="flex items-center justify-end">
          {canCreate && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo dịch vụ
            </Button>
          )}
        </div>

        {/* Filter và Sort Controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-[50%] -translate-y-[50%] h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên ca, ID, thời gian..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchKeyword(searchInput);
                      setCurrentPage(0);
                    }
                  }}
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
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden">
                    <div className="p-2">
                      {[
                        { value: 'serviceName', label: 'Tên dịch vụ' },
                        { value: 'serviceCode', label: 'Mã dịch vụ' },
                        { value: 'price', label: 'Giá' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
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

              {/* Direction buttons */}
              <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                <button
                  onClick={() => setSortDirection('ASC')}
                  className={`p-1.5 rounded transition-all ${sortDirection === 'ASC'
                    ? 'bg-[#8b5fbf] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Tăng dần"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSortDirection('DESC')}
                  className={`p-1.5 rounded transition-all ${sortDirection === 'DESC'
                    ? 'bg-[#8b5fbf] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Giảm dần"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
            <button
              onClick={() => setIsActiveFilter('active')}
              className={
                isActiveFilter === 'active'
                  ? 'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 bg-[#8b5fbf] text-white shadow-[0_2px_8px_rgba(139,95,191,0.4)]'
                  : 'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            >
              <div className={
                isActiveFilter === 'active'
                  ? 'h-4 w-4 rounded-full flex items-center justify-center bg-white bg-opacity-20'
                  : 'h-4 w-4 rounded-full flex items-center justify-center bg-gray-300'
              }>
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="hidden sm:inline">Hoạt động</span>
              <Badge className={
                isActiveFilter === 'active'
                  ? 'text-xs bg-white bg-opacity-20 text-white border border-white border-opacity-30'
                  : 'text-xs bg-green-100 text-green-800'
              }>
                {services.filter(s => s.isActive).length}
              </Badge>
            </button>

            <button
              onClick={() => setIsActiveFilter('inactive')}
              className={
                isActiveFilter === 'inactive'
                  ? 'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 bg-gray-600 text-white shadow-[0_2px_8px_rgba(107,114,128,0.4)]'
                  : 'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            >
              <div className={
                isActiveFilter === 'inactive'
                  ? 'h-4 w-4 rounded-full flex items-center justify-center bg-white bg-opacity-20'
                  : 'h-4 w-4 rounded-full flex items-center justify-center bg-gray-300'
              }>
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="hidden sm:inline">Không hoạt động</span>
              <Badge className={
                isActiveFilter === 'inactive'
                  ? 'text-xs bg-white bg-opacity-20 text-white border border-white border-opacity-30'
                  : 'text-xs bg-gray-200 text-gray-700'
              }>
                {services.filter(s => !s.isActive).length}
              </Badge>
            </button>
          </div>
        </div>

        {/* Table */}
        <OptimizedTable
          data={services}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo dịch vụ mới</DialogTitle>
              <DialogDescription>
                Điền thông tin để tạo dịch vụ mới
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-serviceCode">Mã dịch vụ <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-serviceCode"
                    value={createForm.serviceCode}
                    onChange={(e) => setCreateForm({ ...createForm, serviceCode: e.target.value })}
                    placeholder="e.g., SV-CAOVOI"
                  />
                </div>
                <div>
                  <Label htmlFor="create-serviceName">Tên dịch vụ <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-serviceName"
                    value={createForm.serviceName}
                    onChange={(e) => setCreateForm({ ...createForm, serviceName: e.target.value })}
                    placeholder="e.g., Cạo vôi răng"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="create-description">Mô tả</Label>
                <Input
                  id="create-description"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Mô tả dịch vụ"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="create-duration">Thời lượng (phút) <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={createForm.defaultDurationMinutes}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Round to nearest multiple of 15
                      const rounded = Math.round(value / 15) * 15;
                      setCreateForm({ ...createForm, defaultDurationMinutes: rounded || 15 });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Phải là bội số của 15 (15, 30, 45, 60...)</p>
                </div>
                <div>
                  <Label htmlFor="create-buffer">Thời gian đệm (phút) <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-buffer"
                    type="number"
                    min="0"
                    step="5"
                    value={createForm.defaultBufferMinutes}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Round to nearest multiple of 5
                      const rounded = Math.round(value / 5) * 5;
                      setCreateForm({ ...createForm, defaultBufferMinutes: rounded || 0 });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Phải là bội số của 5 (0, 5, 10, 15, 20...)</p>
                </div>
                <div>
                  <Label htmlFor="create-price">Giá (VND) <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-price"
                    type="number"
                    min="0"
                    value={createForm.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Remove leading zeros
                      const cleaned = value.replace(/^0+/, '') || '0';
                      const numValue = parseFloat(cleaned) || 0;
                      setCreateForm({ ...createForm, price: numValue });
                    }}
                    onBlur={(e) => {
                      // Ensure no leading zeros on blur
                      const value = parseFloat(e.target.value) || 0;
                      setCreateForm({ ...createForm, price: value });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-specialization">Chuyên khoa</Label>
                  <Select
                    value={createForm.specializationId ? String(createForm.specializationId) : 'none-selected'}
                    onValueChange={(value) => {
                      if (value === 'none-selected') {
                        setCreateForm({ ...createForm, specializationId: undefined });
                      } else {
                        const specId = parseInt(value);
                        setCreateForm({ ...createForm, specializationId: isNaN(specId) ? undefined : specId });
                      }
                    }}
                  >
                    <SelectTrigger id="create-specialization">
                      <SelectValue placeholder="Chọn chuyên khoa (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">Không có</SelectItem>
                      {availableSpecializations.map((spec) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create-displayOrder">Thứ tự hiển thị</Label>
                  <Input
                    id="create-displayOrder"
                    type="number"
                    min="1"
                    value={createForm.displayOrder || 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setCreateForm({ ...createForm, displayOrder: value });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Số càng nhỏ hiển thị càng trước. Giá trị mặc định: {createForm.displayOrder || 1}.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-isActive"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="create-isActive">Kích hoạt</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateService}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cập nhật dịch vụ</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin dịch vụ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="update-serviceCode">Mã dịch vụ</Label>
                <Input
                  id="update-serviceCode"
                  value={updateForm.serviceCode}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Mã dịch vụ không thể thay đổi</p>
              </div>
              <div>
                <Label htmlFor="update-serviceName">Tên dịch vụ <span className="text-red-500">*</span></Label>
                <Input
                  id="update-serviceName"
                  value={updateForm.serviceName}
                  onChange={(e) => setUpdateForm({ ...updateForm, serviceName: e.target.value })}
                  placeholder="e.g., Cạo vôi răng"
                />
              </div>
              <div>
                <Label htmlFor="update-description">Mô tả</Label>
                <Input
                  id="update-description"
                  value={updateForm.description || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  placeholder="Mô tả dịch vụ"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="update-duration">Thời lượng (phút) <span className="text-red-500">*</span></Label>
                  <Input
                    id="update-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={updateForm.defaultDurationMinutes !== undefined ? updateForm.defaultDurationMinutes : (selectedService?.defaultDurationMinutes || 0)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Round to nearest multiple of 15
                      const rounded = Math.round(value / 15) * 15;
                      setUpdateForm({ ...updateForm, defaultDurationMinutes: rounded || 15 });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Phải là bội số của 15 (15, 30, 45, 60...)</p>
                </div>
                <div>
                  <Label htmlFor="update-buffer">Thời gian đệm (phút) <span className="text-red-500">*</span></Label>
                  <Input
                    id="update-buffer"
                    type="number"
                    min="0"
                    step="5"
                    value={updateForm.defaultBufferMinutes !== undefined ? updateForm.defaultBufferMinutes : (selectedService?.defaultBufferMinutes || 0)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Round to nearest multiple of 5
                      const rounded = Math.round(value / 5) * 5;
                      setUpdateForm({ ...updateForm, defaultBufferMinutes: rounded || 0 });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Phải là bội số của 5 (0, 5, 10, 15, 20...)</p>
                </div>
                <div>
                  <Label htmlFor="update-price">Giá (VND) <span className="text-red-500">*</span></Label>
                  <Input
                    id="update-price"
                    type="number"
                    min="0"
                    value={updateForm.price !== undefined ? updateForm.price : (selectedService?.price || 0)}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Remove leading zeros
                      const cleaned = value.replace(/^0+/, '') || '0';
                      const numValue = parseFloat(cleaned) || 0;
                      setUpdateForm({ ...updateForm, price: numValue });
                    }}
                    onBlur={(e) => {
                      // Ensure no leading zeros on blur
                      const value = parseFloat(e.target.value) || 0;
                      setUpdateForm({ ...updateForm, price: value });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="update-specialization">Chuyên khoa</Label>
                  <Select
                    value={updateForm.specializationId ? String(updateForm.specializationId) : 'none-selected'}
                    onValueChange={(value) => {
                      if (value === 'none-selected') {
                        setUpdateForm({ ...updateForm, specializationId: undefined });
                      } else {
                        const specId = parseInt(value);
                        setUpdateForm({ ...updateForm, specializationId: isNaN(specId) ? undefined : specId });
                      }
                    }}
                  >
                    <SelectTrigger id="update-specialization">
                      <SelectValue placeholder="Chọn chuyên khoa (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">Không có</SelectItem>
                      {availableSpecializations.map((spec) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="update-displayOrder">Thứ tự hiển thị</Label>
                  <Input
                    id="update-displayOrder"
                    type="number"
                    min="1"
                    value={updateForm.displayOrder || selectedService?.displayOrder || 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setUpdateForm({ ...updateForm, displayOrder: value });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Số càng nhỏ hiển thị càng trước.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="update-isActive"
                  checked={updateForm.isActive}
                  onChange={(e) => setUpdateForm({ ...updateForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="update-isActive">Kích hoạt</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateService}>Cập nhật</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vô hiệu hóa dịch vụ</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn vô hiệu hóa dịch vụ này? Hành động này có thể được hoàn tác sau.
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="py-4">
                <p className="text-sm">
                  <strong>Mã dịch vụ:</strong> {selectedService.serviceCode}
                </p>
                <p className="text-sm">
                  <strong>Tên dịch vụ:</strong> {selectedService.serviceName}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleDeleteService}>
                Vô hiệu hóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết dịch vụ</DialogTitle>
              <DialogDescription>
                Xem chi tiết thông tin dịch vụ
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mã dịch vụ</Label>
                    <p className="text-sm font-medium">{selectedService.serviceCode}</p>
                  </div>
                  <div>
                    <Label>Tên dịch vụ</Label>
                    <p className="text-sm font-medium">{selectedService.serviceName}</p>
                  </div>
                </div>
                {selectedService.description && (
                  <div>
                    <Label>Mô tả</Label>
                    <p className="text-sm">{selectedService.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Thời lượng</Label>
                    <p className="text-sm">{selectedService.defaultDurationMinutes} phút</p>
                  </div>
                  <div>
                    <Label>Thời gian đệm</Label>
                    <p className="text-sm">{selectedService.defaultBufferMinutes} phút</p>
                  </div>
                  <div>
                    <Label>Giá</Label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedService.price)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Chuyên khoa</Label>
                    <p className="text-sm">
                      {getSpecializationName(selectedService.specializationId)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trạng thái</Label>
                    <Badge variant={selectedService.isActive ? 'default' : 'secondary'}>
                      {selectedService.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ngày tạo</Label>
                    <p className="text-sm">
                      {new Date(selectedService.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {selectedService.updatedAt && (
                    <div>
                      <Label>Ngày cập nhật</Label>
                      <p className="text-sm">
                        {new Date(selectedService.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
