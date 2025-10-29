'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Service, ServiceFilters, ServiceListResponse, CreateServiceRequest, UpdateServiceRequest, ServiceErrorCode } from '@/types/service';
import { ServiceService } from '@/services/serviceService';
import { specializationService } from '@/services/specializationService';
import { Specialization } from '@/types/specialization';

export default function ServiceManagementPage() {
  // State
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  
  // Debug specializations state
  useEffect(() => {
    console.log('Specializations state updated:', specializations);
  }, [specializations]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ServiceFilters>({
    keyword: '',
    isActive: '',
    specializationId: '',
    sortBy: 'serviceName',
    sortDirection: 'ASC',
    page: 0,
    size: 10
  });
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10,
    first: true,
    last: false
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateServiceRequest>({
    serviceCode: '',
    serviceName: '',
    description: '',
    defaultDurationMinutes: 30,
    defaultBufferMinutes: 15,
    price: 0,
    specializationId: undefined,
    isActive: true
  });
  const [updateForm, setUpdateForm] = useState<UpdateServiceRequest>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load services
  const loadServices = async () => {
    try {
      setLoading(true);
      console.log('Loading services with filters:', filters);
      
      const response: ServiceListResponse = await ServiceService.getServices(filters);
      console.log('Services loaded:', response);
      
      setServices(response.content);
      setPagination({
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        currentPage: response.number,
        size: response.size,
        first: response.first,
        last: response.last
      });
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Load specializations
  const loadSpecializations = async () => {
    try {
      console.log('Loading specializations...');
      const data = await specializationService.getAll();
      console.log('Specializations loaded:', data);
      setSpecializations(data);
    } catch (error: any) {
      console.error('Error loading specializations:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url
      });
      // Set empty array to prevent UI errors
      setSpecializations([]);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('Component mounted, loading data...');
    loadServices();
    loadSpecializations();
  }, []);

  // Load services when filters change
  useEffect(() => {
    loadServices();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ServiceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value, // Convert 'all' to empty string for API
      page: 0 // Reset to first page when filtering
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle sorting
  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  // Create service
  const handleCreateService = async () => {
    try {
      setFormErrors({});
      
      // Validation
      if (!createForm.serviceCode.trim()) {
        setFormErrors({ serviceCode: 'Mã dịch vụ là bắt buộc' });
        return;
      }
      if (!createForm.serviceName.trim()) {
        setFormErrors({ serviceName: 'Tên dịch vụ là bắt buộc' });
        return;
      }
      if (createForm.defaultDurationMinutes <= 0) {
        setFormErrors({ defaultDurationMinutes: 'Thời lượng phải lớn hơn 0' });
        return;
      }
      if (createForm.price < 0) {
        setFormErrors({ price: 'Giá không được âm' });
        return;
      }

      await ServiceService.createService(createForm);
      toast.success('Tạo dịch vụ thành công');
      setShowCreateModal(false);
      setCreateForm({
        serviceCode: '',
        serviceName: '',
        description: '',
        defaultDurationMinutes: 30,
        defaultBufferMinutes: 15,
        price: 0,
        specializationId: undefined,
        isActive: true
      });
      loadServices();
    } catch (error: any) {
      console.error('Error creating service:', error);
      
      if (error.response?.data?.errorCode === ServiceErrorCode.SERVICE_CODE_EXISTS) {
        setFormErrors({ serviceCode: 'Mã dịch vụ này đã tồn tại' });
      } else if (error.response?.data?.errorCode === ServiceErrorCode.SPECIALIZATION_NOT_FOUND) {
        setFormErrors({ specializationId: 'Chuyên khoa không hợp lệ' });
      } else {
        toast.error('Không thể tạo dịch vụ');
      }
    }
  };

  // Update service
  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      setFormErrors({});
      await ServiceService.updateService(selectedService.serviceId, updateForm);
      toast.success('Cập nhật dịch vụ thành công');
      setShowUpdateModal(false);
      setSelectedService(null);
      setUpdateForm({});
      loadServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      
      if (error.response?.data?.errorCode === ServiceErrorCode.SPECIALIZATION_NOT_FOUND) {
        setFormErrors({ specializationId: 'Chuyên khoa không hợp lệ' });
      } else {
        toast.error('Không thể cập nhật dịch vụ');
      }
    }
  };

  // Delete service (soft delete)
  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      await ServiceService.deleteService(selectedService.serviceId);
      toast.success('Vô hiệu hóa dịch vụ thành công');
      setShowDeleteModal(false);
      setSelectedService(null);
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error('Không thể vô hiệu hóa dịch vụ');
    }
  };

  // Activate service
  const handleActivateService = async (service: Service) => {
    try {
      await ServiceService.activateService(service.serviceId);
      toast.success('Kích hoạt dịch vụ thành công');
      loadServices();
    } catch (error: any) {
      console.error('Error activating service:', error);
      toast.error('Không thể kích hoạt dịch vụ');
    }
  };

  // Open update modal
  const openUpdateModal = async (service: Service) => {
    try {
      const serviceDetail = await ServiceService.getServiceById(service.serviceId);
      setSelectedService(serviceDetail);
      setUpdateForm({
        serviceName: serviceDetail.serviceName,
        description: serviceDetail.description,
        defaultDurationMinutes: serviceDetail.defaultDurationMinutes,
        defaultBufferMinutes: serviceDetail.defaultBufferMinutes,
        price: serviceDetail.price,
        specializationId: serviceDetail.specializationId,
        isActive: serviceDetail.isActive
      });
      setFormErrors({});
      setShowUpdateModal(true);
    } catch (error) {
      console.error('Error loading service details:', error);
      toast.error('Không thể tải thông tin dịch vụ');
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_SERVICE]}>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
          <p className="text-gray-600 mt-2">Quản lý các dịch vụ của phòng khám</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Header with Actions */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Danh sách Dịch vụ</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateModal(true)}>
                  Tạo dịch vụ mới
                </Button>
                <Button variant="outline" onClick={loadServices}>
                  Tải lại
                </Button>
                {/* <Button variant="outline" onClick={loadSpecializations}>
                  Reload Specializations
                </Button> */}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm
                </label>
                <Input
                  placeholder="Tìm theo tên hoặc mã dịch vụ..."
                  value={filters.keyword || ''}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <Select
                  value={filters.isActive || ''}
                  onValueChange={(value) => handleFilterChange('isActive', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Đã vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specialization Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chuyên khoa ({specializations.length})
                </label>
                <Select
                  value={filters.specializationId || ''}
                  onValueChange={(value) => handleFilterChange('specializationId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {specializations.length > 0 ? (
                      specializations.map((spec) => (
                        <SelectItem key={spec.specializationId} value={String(spec.specializationId)}>
                          {spec.specializationName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        Không có dữ liệu chuyên khoa
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sắp xếp
                </label>
                <Select
                  value={`${filters.sortBy}-${filters.sortDirection}`}
                  onValueChange={(value) => {
                    const [sortBy, sortDirection] = value.split('-');
                    setFilters(prev => ({ ...prev, sortBy, sortDirection: sortDirection as 'ASC' | 'DESC' }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serviceName-ASC">Tên A-Z</SelectItem>
                    <SelectItem value="serviceName-DESC">Tên Z-A</SelectItem>
                    <SelectItem value="price-ASC">Giá thấp-cao</SelectItem>
                    <SelectItem value="price-DESC">Giá cao-thấp</SelectItem>
                    <SelectItem value="createdAt-DESC">Mới nhất</SelectItem>
                    <SelectItem value="createdAt-ASC">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('serviceCode')}
                  >
                    Mã DV
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('serviceName')}
                  >
                    Tên dịch vụ
                  </TableHead>
                  <TableHead>Chuyên khoa</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('price')}
                  >
                    Giá
                  </TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Không có dịch vụ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.serviceId}>
                      <TableCell className="font-medium">{service.serviceCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.serviceName}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500 mt-1">{service.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.specializationName || (
                          <span className="text-gray-400">Không có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{formatDuration(service.defaultDurationMinutes)}</div>
                          {service.defaultBufferMinutes > 0 && (
                            <div className="text-sm text-gray-500">
                              +{service.defaultBufferMinutes}m đệm
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(service.price)}</TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? 'default' : 'secondary'}>
                          {service.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateModal(service)}
                          >
                            Chỉnh sửa
                          </Button>
                          {service.isActive ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedService(service);
                                setShowDeleteModal(true);
                              }}
                            >
                              Vô hiệu hóa
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleActivateService(service)}
                            >
                              Kích hoạt
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

          {/* Pagination */}
          <div className="p-6 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Hiển thị {services.length} trong tổng số {pagination.totalElements} dịch vụ
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={pagination.first}
                >
                  &lt;&lt;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.first}
                >
                  &lt;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.last}
                >
                  &gt;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages - 1)}
                  disabled={pagination.last}
                >
                  &gt;&gt;
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Tạo dịch vụ mới</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã dịch vụ *
                    </label>
                    <Input
                      value={createForm.serviceCode}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, serviceCode: e.target.value }))}
                      placeholder="VD: SCALING_L1"
                    />
                    {formErrors.serviceCode && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.serviceCode}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên dịch vụ *
                    </label>
                    <Input
                      value={createForm.serviceName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, serviceName: e.target.value }))}
                      placeholder="VD: Cạo vôi răng"
                    />
                    {formErrors.serviceName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.serviceName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    value={createForm.description || ''}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả dịch vụ..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời lượng (phút) *
                    </label>
                    <Input
                      type="number"
                      value={createForm.defaultDurationMinutes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, defaultDurationMinutes: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                    {formErrors.defaultDurationMinutes && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.defaultDurationMinutes}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian đệm (phút) *
                    </label>
                    <Input
                      type="number"
                      value={createForm.defaultBufferMinutes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, defaultBufferMinutes: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VND) *
                    </label>
                    <Input
                      type="number"
                      value={createForm.price}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chuyên khoa
                  </label>
                  <Select
                    value={createForm.specializationId ? String(createForm.specializationId) : ''}
                    onValueChange={(value) => setCreateForm(prev => ({ 
                      ...prev, 
                      specializationId: value && value !== 'none' ? parseInt(value) : undefined 
                    }))}
                  >
                    <SelectTrigger className={formErrors.specializationId ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Chọn chuyên khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec.specializationId} value={String(spec.specializationId)}>
                          {spec.specializationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.specializationId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.specializationId}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Kích hoạt dịch vụ
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateService}>
                  Tạo dịch vụ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa dịch vụ</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã dịch vụ
                    </label>
                    <Input
                      value={selectedService.serviceCode}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mã dịch vụ không thể thay đổi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên dịch vụ *
                    </label>
                    <Input
                      value={updateForm.serviceName || selectedService.serviceName}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, serviceName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    value={updateForm.description !== undefined ? updateForm.description : selectedService.description || ''}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời lượng (phút) *
                    </label>
                    <Input
                      type="number"
                      value={updateForm.defaultDurationMinutes !== undefined ? updateForm.defaultDurationMinutes : selectedService.defaultDurationMinutes}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, defaultDurationMinutes: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian đệm (phút) *
                    </label>
                    <Input
                      type="number"
                      value={updateForm.defaultBufferMinutes !== undefined ? updateForm.defaultBufferMinutes : selectedService.defaultBufferMinutes}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, defaultBufferMinutes: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VND) *
                    </label>
                    <Input
                      type="number"
                      value={updateForm.price !== undefined ? updateForm.price : selectedService.price}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chuyên khoa
                  </label>
                  <Select
                    value={updateForm.specializationId !== undefined ? String(updateForm.specializationId) : String(selectedService.specializationId || '')}
                    onValueChange={(value) => setUpdateForm(prev => ({ 
                      ...prev, 
                      specializationId: value && value !== 'none' ? parseInt(value) : undefined 
                    }))}
                  >
                    <SelectTrigger className={formErrors.specializationId ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Chọn chuyên khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec.specializationId} value={String(spec.specializationId)}>
                          {spec.specializationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.specializationId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.specializationId}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateIsActive"
                    checked={updateForm.isActive !== undefined ? updateForm.isActive : selectedService.isActive}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="updateIsActive" className="text-sm font-medium text-gray-700">
                    Kích hoạt dịch vụ
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                  Hủy
                </Button>
                <Button onClick={handleUpdateService}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Xác nhận vô hiệu hóa</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn vô hiệu hóa dịch vụ <strong>{selectedService.serviceName}</strong> không?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Hủy
                </Button>
                <Button variant="destructive" onClick={handleDeleteService}>
                  Vô hiệu hóa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
