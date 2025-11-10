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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  ServiceCategory, 
  CreateServiceCategoryRequest, 
  UpdateServiceCategoryRequest,
  ReorderServiceCategoriesRequest,
  ServiceCategoryErrorCode 
} from '@/types/serviceCategory';
import { ServiceCategoryService } from '@/services/serviceCategoryService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Eye, Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, X, GripVertical } from 'lucide-react';

interface ServiceFormData {
  serviceCode: string;
  serviceName: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultBufferMinutes: number;
  price: number;
  specializationId?: number;
  categoryId?: number;
  isActive: boolean;
}

export default function BookingServicesPage() {
  const { user, hasPermission } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // Tab state
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter & Search states
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  
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
    categoryId: undefined,
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
    categoryId: undefined,
    isActive: true,
  });

  // Permissions
  const canView = user?.permissions?.includes('VIEW_SERVICE') || false;
  const canCreate = user?.permissions?.includes('CREATE_SERVICE') || false;
  const canUpdate = user?.permissions?.includes('UPDATE_SERVICE') || false;
  const canDelete = user?.permissions?.includes('DELETE_SERVICE') || false;

  // Categories state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Category modals
  const [showCategoryCreateModal, setShowCategoryCreateModal] = useState(false);
  const [showCategoryUpdateModal, setShowCategoryUpdateModal] = useState(false);
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  
  // Category forms
  const [categoryCreateForm, setCategoryCreateForm] = useState<CreateServiceCategoryRequest>({
    categoryCode: '',
    categoryName: '',
    displayOrder: 0,
    description: ''
  });
  const [categoryUpdateForm, setCategoryUpdateForm] = useState<UpdateServiceCategoryRequest>({});
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});

  // Search state - separate from debounced search
  // searchInput: what user types (immediate update)
  // searchKeyword: what triggers search (set on Enter or debounced)
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Debounced search - longer delay (1000ms) or trigger on Enter
  const debouncedSearch = useDebounce(searchKeyword, 1000);

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

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      console.log('Loading categories...');
      const data = await ServiceCategoryService.getAllCategories();
      console.log('Categories loaded:', data);
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast.error('Không thể tải danh sách danh mục dịch vụ');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load categories on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    }
  }, [activeTab, loadCategories]);

  // Auto-update displayOrder when categories change and form is empty
  useEffect(() => {
    if (categories.length > 0 && categoryCreateForm.categoryCode === '' && categoryCreateForm.categoryName === '') {
      const maxOrder = Math.max(...categories.map(c => c.displayOrder));
      setCategoryCreateForm(prev => ({
        ...prev,
        displayOrder: maxOrder + 1
      }));
    } else if (categories.length === 0) {
      setCategoryCreateForm(prev => ({
        ...prev,
        displayOrder: 0
      }));
    }
  }, [categories, categoryCreateForm.categoryCode, categoryCreateForm.categoryName]);

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

  // Available categories (active only for service forms)
  const availableCategories = useMemo(() => {
    return categories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories]);

  // Helper function để lấy category name
  const getCategoryName = useCallback((categoryId?: number): string => {
    if (!categoryId) return 'Không có';
    const cat = availableCategories.find(c => c.categoryId === categoryId);
    return cat?.categoryName || 'Không xác định';
  }, [availableCategories]);

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

      // Add categoryId filter if not 'all'
      if (categoryFilter !== 'all') {
        const catId = parseInt(categoryFilter);
        if (!isNaN(catId)) {
          filters.categoryId = String(catId);
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
  }, [canView, debouncedSearch, specializationFilter, categoryFilter, isActiveFilter, sortBy, sortDirection, currentPage, pageSize]);

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
  }, [debouncedSearch, specializationFilter, categoryFilter, isActiveFilter, sortBy, sortDirection]);

  // Clear all filters function
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchKeyword('');
    setSpecializationFilter('all');
    setCategoryFilter('all');
    setIsActiveFilter('all');
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
      if (createForm.defaultBufferMinutes < 0) {
        toast.error('Thời gian đệm phải lớn hơn hoặc bằng 0');
        return;
      }
      if (createForm.price < 0) {
        toast.error('Giá phải lớn hơn hoặc bằng 0');
        return;
      }

      const requestData: CreateServiceRequest = {
        serviceCode: createForm.serviceCode.trim(),
        serviceName: createForm.serviceName.trim(),
        description: createForm.description?.trim() || undefined,
        defaultDurationMinutes: createForm.defaultDurationMinutes,
        defaultBufferMinutes: createForm.defaultBufferMinutes,
        price: createForm.price,
        specializationId: createForm.specializationId || undefined,
        categoryId: createForm.categoryId || undefined,
        isActive: createForm.isActive,
      };

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
        categoryId: undefined,
        isActive: true,
      });

      // Close modal
      setShowCreateModal(false);

      // Reload data (specializations are already loaded from getAllSpecialization API)
      await loadServices();

      toast.success('Tạo dịch vụ thành công!');
    } catch (error: any) {
      console.error('Error creating service:', error);
      handleCreateError(error);
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
      if (updateForm.defaultDurationMinutes < 1) {
        toast.error('Thời gian thực hiện phải lớn hơn 0');
        return;
      }
      if (updateForm.defaultBufferMinutes < 0) {
        toast.error('Thời gian đệm phải lớn hơn hoặc bằng 0');
        return;
      }
      if (updateForm.price < 0) {
        toast.error('Giá phải lớn hơn hoặc bằng 0');
        return;
      }

      const requestData: UpdateServiceRequest = {
        serviceName: updateForm.serviceName.trim(),
        description: updateForm.description?.trim() || undefined,
        defaultDurationMinutes: updateForm.defaultDurationMinutes,
        defaultBufferMinutes: updateForm.defaultBufferMinutes,
        price: updateForm.price,
        specializationId: updateForm.specializationId || undefined,
        categoryId: updateForm.categoryId || undefined,
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
      categoryId: service.categoryId,
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
  
  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchesSearch = !categorySearch || 
        category.categoryName.toLowerCase().includes(categorySearch.toLowerCase()) ||
        category.categoryCode.toLowerCase().includes(categorySearch.toLowerCase());
      
      const matchesStatus = categoryStatusFilter === 'all' ||
        (categoryStatusFilter === 'active' && category.isActive) ||
        (categoryStatusFilter === 'inactive' && !category.isActive);
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories, categorySearch, categoryStatusFilter]);

  // Create category
  const handleCreateCategory = async () => {
    try {
      setCategoryFormErrors({});
      
      // Validation
      if (!categoryCreateForm.categoryCode.trim()) {
        setCategoryFormErrors({ categoryCode: 'Mã danh mục là bắt buộc' });
        return;
      }
      if (!categoryCreateForm.categoryName.trim()) {
        setCategoryFormErrors({ categoryName: 'Tên danh mục là bắt buộc' });
        return;
      }
      if (categoryCreateForm.displayOrder < 0) {
        setCategoryFormErrors({ displayOrder: 'Thứ tự hiển thị phải >= 0' });
        return;
      }

      await ServiceCategoryService.createCategory(categoryCreateForm);
      toast.success('Tạo danh mục dịch vụ thành công');
      setShowCategoryCreateModal(false);
      // Reset form - displayOrder will be auto-updated by useEffect
      setCategoryCreateForm({
        categoryCode: '',
        categoryName: '',
        displayOrder: 0,
        description: ''
      });
      loadCategories();
    } catch (error: any) {
      console.error('Error creating category:', error);
      
      if (error.errorCode === ServiceCategoryErrorCode.CATEGORY_CODE_EXISTS) {
        setCategoryFormErrors({ categoryCode: 'Mã danh mục này đã tồn tại' });
      } else {
        toast.error(error.message || 'Không thể tạo danh mục dịch vụ');
      }
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      setCategoryFormErrors({});
      await ServiceCategoryService.updateCategory(selectedCategory.categoryId, categoryUpdateForm);
      toast.success('Cập nhật danh mục dịch vụ thành công');
      setShowCategoryUpdateModal(false);
      setSelectedCategory(null);
      setCategoryUpdateForm({});
      loadCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      
      if (error.errorCode === ServiceCategoryErrorCode.CATEGORY_CODE_EXISTS) {
        setCategoryFormErrors({ categoryCode: 'Mã danh mục này đã tồn tại' });
      } else {
        toast.error(error.message || 'Không thể cập nhật danh mục dịch vụ');
      }
    }
  };

  // Delete category (soft delete)
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await ServiceCategoryService.deleteCategory(selectedCategory.categoryId);
      toast.success('Xóa danh mục dịch vụ thành công');
      setShowCategoryDeleteModal(false);
      setSelectedCategory(null);
      loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      
      if (error.errorCode === ServiceCategoryErrorCode.CATEGORY_HAS_ACTIVE_SERVICES) {
        toast.error('Không thể xóa danh mục này vì còn dịch vụ đang active. Vui lòng vô hiệu hóa hoặc chuyển dịch vụ trước.');
      } else {
        toast.error(error.message || 'Không thể xóa danh mục dịch vụ');
      }
    }
  };

  // Open update modal
  const openCategoryUpdateModal = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setCategoryUpdateForm({
      categoryName: category.categoryName,
      displayOrder: category.displayOrder,
      description: category.description,
      isActive: category.isActive
    });
    setCategoryFormErrors({});
    setShowCategoryUpdateModal(true);
  };

  // Drag and drop reorder
  const [draggedCategory, setDraggedCategory] = useState<ServiceCategory | null>(null);
  const [reorderedCategories, setReorderedCategories] = useState<ServiceCategory[]>([]);
  const [hasReordered, setHasReordered] = useState(false);

  // Initialize reorderedCategories when categories change
  useEffect(() => {
    setReorderedCategories([...filteredCategories]);
    setHasReordered(false);
  }, [filteredCategories]);

  const handleDragStart = (category: ServiceCategory) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCategory: ServiceCategory) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory.categoryId === targetCategory.categoryId) return;

    const draggedIndex = reorderedCategories.findIndex(c => c.categoryId === draggedCategory.categoryId);
    const targetIndex = reorderedCategories.findIndex(c => c.categoryId === targetCategory.categoryId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...reorderedCategories];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    // Update displayOrder
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index
    }));

    setReorderedCategories(updatedCategories);
    setHasReordered(true);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleSaveReorder = async () => {
    try {
      const orders: ReorderServiceCategoriesRequest = {
        orders: reorderedCategories.map((cat, index) => ({
          categoryId: cat.categoryId,
          displayOrder: index
        }))
      };

      await ServiceCategoryService.reorderCategories(orders);
      toast.success('Sắp xếp lại danh mục thành công');
      setHasReordered(false);
      loadCategories();
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      toast.error('Không thể sắp xếp lại danh mục');
      // Revert to original order
      setReorderedCategories([...filteredCategories]);
      setHasReordered(false);
    }
  };

  const handleCancelReorder = () => {
    setReorderedCategories([...filteredCategories]);
    setHasReordered(false);
  };

  // Columns definition
  const columns: OptimizedTableColumn<Service>[] = useMemo(() => [
    {
      key: 'serviceCode',
      header: 'Service Code',
      accessor: (service) => (
        <span className="font-medium">{service.serviceCode}</span>
      ),
    },
    {
      key: 'serviceName',
      header: 'Service Name',
      accessor: (service) => service.serviceName,
    },
    {
      key: 'specialization',
      header: 'Specialization',
      accessor: (service) => (
        <Badge variant="outline">
          {getSpecializationName(service.specializationId)}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (service) => (
        <Badge variant="secondary">
          {getCategoryName(service.categoryId)}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (service) => (
        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      accessor: (service) => (
        <span>{service.defaultDurationMinutes} phút</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      accessor: (service) => (
        <Badge variant={service.isActive ? 'default' : 'secondary'}>
          {service.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (service) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(service);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(service);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
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
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Deactivate
            </Button>
          )}
        </div>
      ),
      className: 'w-[200px]',
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
            <h1 className="text-3xl font-bold">Services Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage clinic services and their categories
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'services' | 'categories')} className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          {/* Tab 1: Services */}
          <TabsContent value="services" className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-end">
              {canCreate && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Service
                </Button>
              )}
            </div>

        {/* Filter và Sort Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by service code, name... (Press Enter to search)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchKeyword(searchInput);
                      setCurrentPage(0); // Reset to first page
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Specialization Filter - From getAllSpecialization API */}
            <div className="min-w-[200px]">
              <Label htmlFor="specialization">Specialization</Label>
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger id="specialization" className="mt-1">
                  <SelectValue placeholder="Tất cả chuyên khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                  {availableSpecializations.map((spec) => (
                    <SelectItem key={spec.id} value={String(spec.id)}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="min-w-[200px]">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[120px]">
              <Label htmlFor="status">Status</Label>
              <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="min-w-[150px]">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serviceName">Service Name</SelectItem>
                  <SelectItem value="serviceCode">Service Code</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Direction */}
            <div className="min-w-[120px]">
              <Label htmlFor="sortDirection">Direction</Label>
              <Select value={sortDirection} onValueChange={(value: 'ASC' | 'DESC') => setSortDirection(value)}>
                <SelectTrigger id="sortDirection" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">Ascending</SelectItem>
                  <SelectItem value="DESC">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="min-w-[120px]">
              <Label className="opacity-0">Clear</Label>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="mt-1 w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
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
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new service
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-serviceCode">Service Code *</Label>
                  <Input
                    id="create-serviceCode"
                    value={createForm.serviceCode}
                    onChange={(e) => setCreateForm({ ...createForm, serviceCode: e.target.value })}
                    placeholder="e.g., SV-CAOVOI"
                  />
                </div>
                <div>
                  <Label htmlFor="create-serviceName">Service Name *</Label>
                  <Input
                    id="create-serviceName"
                    value={createForm.serviceName}
                    onChange={(e) => setCreateForm({ ...createForm, serviceName: e.target.value })}
                    placeholder="e.g., Cạo vôi răng"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="create-description">Description</Label>
                <Input
                  id="create-description"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Service description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="create-duration">Duration (minutes) *</Label>
                  <Input
                    id="create-duration"
                    type="number"
                    min="1"
                    value={createForm.defaultDurationMinutes}
                    onChange={(e) => setCreateForm({ ...createForm, defaultDurationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-buffer">Buffer (minutes) *</Label>
                  <Input
                    id="create-buffer"
                    type="number"
                    min="0"
                    value={createForm.defaultBufferMinutes}
                    onChange={(e) => setCreateForm({ ...createForm, defaultBufferMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-price">Price (VND) *</Label>
                  <Input
                    id="create-price"
                    type="number"
                    min="0"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-specialization">Specialization</Label>
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
                      <SelectValue placeholder="Select specialization (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">None</SelectItem>
                      {availableSpecializations.map((spec) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="create-category">Category</Label>
                  <Select
                    value={createForm.categoryId ? String(createForm.categoryId) : 'none-selected'}
                    onValueChange={(value) => {
                      if (value === 'none-selected') {
                        setCreateForm({ ...createForm, categoryId: undefined });
                      } else {
                        const catId = parseInt(value);
                        setCreateForm({ ...createForm, categoryId: isNaN(catId) ? undefined : catId });
                      }
                    }}
                  >
                    <SelectTrigger id="create-category">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">None</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                          {cat.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="create-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateService}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Service</DialogTitle>
              <DialogDescription>
                Update the service details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="update-serviceCode">Service Code</Label>
                <Input
                  id="update-serviceCode"
                  value={updateForm.serviceCode}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Service code cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="update-serviceName">Service Name *</Label>
                <Input
                  id="update-serviceName"
                  value={updateForm.serviceName}
                  onChange={(e) => setUpdateForm({ ...updateForm, serviceName: e.target.value })}
                  placeholder="e.g., Cạo vôi răng"
                />
              </div>
              <div>
                <Label htmlFor="update-description">Description</Label>
                <Input
                  id="update-description"
                  value={updateForm.description || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  placeholder="Service description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="update-duration">Duration (minutes) *</Label>
                  <Input
                    id="update-duration"
                    type="number"
                    min="1"
                    value={updateForm.defaultDurationMinutes}
                    onChange={(e) => setUpdateForm({ ...updateForm, defaultDurationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="update-buffer">Buffer (minutes) *</Label>
                  <Input
                    id="update-buffer"
                    type="number"
                    min="0"
                    value={updateForm.defaultBufferMinutes}
                    onChange={(e) => setUpdateForm({ ...updateForm, defaultBufferMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="update-price">Price (VND) *</Label>
                  <Input
                    id="update-price"
                    type="number"
                    min="0"
                    value={updateForm.price}
                    onChange={(e) => setUpdateForm({ ...updateForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="update-specialization">Specialization</Label>
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
                      <SelectValue placeholder="Select specialization (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">None</SelectItem>
                      {availableSpecializations.map((spec) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="update-category">Category</Label>
                  <Select
                    value={updateForm.categoryId ? String(updateForm.categoryId) : 'none-selected'}
                    onValueChange={(value) => {
                      if (value === 'none-selected') {
                        setUpdateForm({ ...updateForm, categoryId: undefined });
                      } else {
                        const catId = parseInt(value);
                        setUpdateForm({ ...updateForm, categoryId: isNaN(catId) ? undefined : catId });
                      }
                    }}
                  >
                    <SelectTrigger id="update-category">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">None</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                          {cat.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="update-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateService}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate this service? This action can be reversed later.
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="py-4">
                <p className="text-sm">
                  <strong>Service Code:</strong> {selectedService.serviceCode}
                </p>
                <p className="text-sm">
                  <strong>Service Name:</strong> {selectedService.serviceName}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteService}>
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Details</DialogTitle>
              <DialogDescription>
                View detailed information about this service
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Service Code</Label>
                    <p className="text-sm font-medium">{selectedService.serviceCode}</p>
                  </div>
                  <div>
                    <Label>Service Name</Label>
                    <p className="text-sm font-medium">{selectedService.serviceName}</p>
                  </div>
                </div>
                {selectedService.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm">{selectedService.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <p className="text-sm">{selectedService.defaultDurationMinutes} minutes</p>
                  </div>
                  <div>
                    <Label>Buffer</Label>
                    <p className="text-sm">{selectedService.defaultBufferMinutes} minutes</p>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedService.price)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Specialization</Label>
                    <p className="text-sm">
                      {getSpecializationName(selectedService.specializationId)}
                    </p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm">
                      {getCategoryName(selectedService.categoryId)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Badge variant={selectedService.isActive ? 'default' : 'secondary'}>
                      {selectedService.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created At</Label>
                    <p className="text-sm">
                      {new Date(selectedService.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {selectedService.updatedAt && (
                    <div>
                      <Label>Updated At</Label>
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
          </TabsContent>

          {/* Tab 2: Categories */}
          <TabsContent value="categories" className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-end">
              {canCreate && (
                <Button onClick={() => setShowCategoryCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="category-search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="category-search"
                    type="text"
                    placeholder="Search by category code, name..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="min-w-[120px]">
                <Label htmlFor="category-status">Status</Label>
                <Select value={categoryStatusFilter} onValueChange={(v) => setCategoryStatusFilter(v as 'all' | 'active' | 'inactive')}>
                  <SelectTrigger id="category-status" className="mt-1">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="min-w-[120px]">
                <Label className="opacity-0">Clear</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategorySearch('');
                    setCategoryStatusFilter('all');
                  }}
                  className="mt-1 w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Reorder Actions */}
            {hasReordered && (
              <div className="flex items-center justify-end gap-2 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm text-muted-foreground">Bạn đã thay đổi thứ tự. Lưu thay đổi?</p>
                <Button variant="outline" size="sm" onClick={handleCancelReorder}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveReorder}>
                  Lưu thay đổi
                </Button>
              </div>
            )}

            {/* Categories Table */}
            <div className="border rounded-lg bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (hasReordered ? reorderedCategories : filteredCategories).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (hasReordered ? reorderedCategories : filteredCategories).map((category) => (
                      <TableRow
                        key={category.categoryId}
                        draggable={canUpdate}
                        onDragStart={() => handleDragStart(category)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, category)}
                        onDragEnd={handleDragEnd}
                        className={`${canUpdate ? 'cursor-move' : 'cursor-default'} ${
                          draggedCategory?.categoryId === category.categoryId ? 'opacity-50' : ''
                        } hover:bg-muted/50 transition-colors`}
                      >
                        <TableCell>
                          {canUpdate && (
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{category.displayOrder}</TableCell>
                        <TableCell className="font-medium">{category.categoryCode}</TableCell>
                        <TableCell>{category.categoryName}</TableCell>
                        <TableCell>
                          {category.description ? (
                            <span className="text-sm text-muted-foreground">{category.description}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCategoryUpdateModal(category)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setShowCategoryDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Category Create Modal */}
            <Dialog open={showCategoryCreateModal} onOpenChange={setShowCategoryCreateModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new service category
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoryCode">Category Code *</Label>
                      <Input
                        id="categoryCode"
                        value={categoryCreateForm.categoryCode}
                        onChange={(e) => setCategoryCreateForm(prev => ({ ...prev, categoryCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g., GEN"
                      />
                      {categoryFormErrors.categoryCode && (
                        <p className="text-red-500 text-sm mt-1">{categoryFormErrors.categoryCode}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="categoryName">Category Name *</Label>
                      <Input
                        id="categoryName"
                        value={categoryCreateForm.categoryName}
                        onChange={(e) => setCategoryCreateForm(prev => ({ ...prev, categoryName: e.target.value }))}
                        placeholder="e.g., A. General Dentistry"
                      />
                      {categoryFormErrors.categoryName && (
                        <p className="text-red-500 text-sm mt-1">{categoryFormErrors.categoryName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="displayOrder">Display Order *</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={categoryCreateForm.displayOrder}
                      onChange={(e) => setCategoryCreateForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      min="0"
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    {categoryFormErrors.displayOrder && (
                      <p className="text-red-500 text-sm mt-1">{categoryFormErrors.displayOrder}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Tự động tăng dần dựa trên danh sách hiện tại (số càng nhỏ hiển thị càng trước)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={categoryCreateForm.description || ''}
                      onChange={(e) => setCategoryCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Category description..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCategoryCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Category Update Modal */}
            <Dialog open={showCategoryUpdateModal} onOpenChange={setShowCategoryUpdateModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Update Category</DialogTitle>
                  <DialogDescription>
                    Update the category details
                  </DialogDescription>
                </DialogHeader>
                {selectedCategory && (
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Category Code</Label>
                      <Input
                        value={selectedCategory.categoryCode}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Category code cannot be changed</p>
                    </div>

                    <div>
                      <Label htmlFor="updateCategoryName">Category Name *</Label>
                      <Input
                        id="updateCategoryName"
                        value={categoryUpdateForm.categoryName !== undefined ? categoryUpdateForm.categoryName : selectedCategory.categoryName}
                        onChange={(e) => setCategoryUpdateForm(prev => ({ ...prev, categoryName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="updateDisplayOrder">Display Order *</Label>
                      <Input
                        id="updateDisplayOrder"
                        type="number"
                        value={categoryUpdateForm.displayOrder !== undefined ? categoryUpdateForm.displayOrder : selectedCategory.displayOrder}
                        onChange={(e) => setCategoryUpdateForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="updateDescription">Description</Label>
                      <Textarea
                        id="updateDescription"
                        value={categoryUpdateForm.description !== undefined ? categoryUpdateForm.description : selectedCategory.description || ''}
                        onChange={(e) => setCategoryUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="updateIsActive"
                        checked={categoryUpdateForm.isActive !== undefined ? categoryUpdateForm.isActive : selectedCategory.isActive}
                        onChange={(e) => setCategoryUpdateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="updateIsActive">Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCategoryUpdateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateCategory}>Update</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Category Delete Modal */}
            <Dialog open={showCategoryDeleteModal} onOpenChange={setShowCategoryDeleteModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Category</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this category? This action cannot be undone if the category has active services.
                  </DialogDescription>
                </DialogHeader>
                {selectedCategory && (
                  <div className="py-4">
                    <p className="text-sm">
                      <strong>Category Code:</strong> {selectedCategory.categoryCode}
                    </p>
                    <p className="text-sm">
                      <strong>Category Name:</strong> {selectedCategory.categoryName}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      Note: Cannot delete category with active services.
                    </p>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCategoryDeleteModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteCategory}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

