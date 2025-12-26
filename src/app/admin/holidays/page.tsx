'use client';

/**
 * ADMIN HOLIDAY MANAGEMENT PAGE
 * 
 * Features:
 * - View all holiday definitions (NATIONAL/COMPANY)
 * - Create/Edit/Delete holiday definitions
 * - Manage holiday dates for each definition
 * - Filter by type
 * - RBAC permissions
 * 
 * RBAC Permissions:
 * - VIEW_HOLIDAY: Required to access page
 * - MANAGE_HOLIDAY: Required for Create/Update/Delete operations (BE consolidated permission)
 * 
 * API Endpoints:
 * - GET /api/v1/holiday-definitions
 * - POST /api/v1/holiday-definitions
 * - PATCH /api/v1/holiday-definitions/{id}
 * - DELETE /api/v1/holiday-definitions/{id}
 * - GET /api/v1/holiday-dates/by-definition/{id}
 * - POST /api/v1/holiday-dates
 * - PATCH /api/v1/holiday-dates/{date}/definition/{id}
 * - DELETE /api/v1/holiday-dates/{date}/definition/{id}
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Calendar,
  Filter,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
  Flag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { holidayService } from '@/services/holidayService';
import { parseHolidayError } from '@/utils/holidayErrorHandler';
import {
  HolidayDefinition,
  HolidayDate,
  CreateHolidayDefinitionRequest,
  UpdateHolidayDefinitionRequest,
  CreateHolidayDateRequest,
  UpdateHolidayDateRequest,
} from '@/types/holiday';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';

type FilterType = 'ALL' | 'NATIONAL' | 'COMPANY';
type SortField = 'holidayName' | 'holidayType' | 'totalDates' | null;
type SortOrder = 'asc' | 'desc';

interface DefinitionFormData {
  definitionId: string;
  holidayName: string;
  holidayType: 'NATIONAL' | 'COMPANY';
  description: string;
}

interface DateFormData {
  holidayDate: string;
  description: string;
}

export default function AdminHolidaysPage() {
  const { user } = useAuth();

  // RBAC Permissions - BE uses MANAGE_HOLIDAY for all CRUD operations
  const canView = user?.permissions?.includes('VIEW_HOLIDAY') || false;
  const canManage = user?.permissions?.includes('MANAGE_HOLIDAY') || false;
  const canCreate = canManage;
  const canUpdate = canManage;
  const canDelete = canManage;

  // State
  const [definitions, setDefinitions] = useState<HolidayDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');

  // Sort states
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<HolidayDefinition | null>(null);
  const [selectedDate, setSelectedDate] = useState<HolidayDate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Date management
  const [datesForDefinition, setDatesForDefinition] = useState<HolidayDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [expandedDefinition, setExpandedDefinition] = useState<string | null>(null);

  // Form state
  const [definitionFormData, setDefinitionFormData] = useState<DefinitionFormData>({
    definitionId: '',
    holidayName: '',
    holidayType: 'NATIONAL',
    description: '',
  });
  const [dateFormData, setDateFormData] = useState<DateFormData>({
    holidayDate: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal open
  useEffect(() => {
    if (showDefinitionModal || showDateModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDefinitionModal, showDateModal, showDeleteModal]);

  useEffect(() => {
    if (canView) {
      loadDefinitions();
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

  const loadDefinitions = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getDefinitions();
      setDefinitions(response || []);
    } catch (error: any) {
      const parsedError = parseHolidayError(error);
      toast.error('Lỗi khi tải danh sách ngày lễ', {
        description: parsedError.userMessage,
      });
      console.error('Failed to load definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatesForDefinition = async (definitionId: string) => {
    try {
      setLoadingDates(true);
      const response = await holidayService.getDatesForDefinition(definitionId);
      setDatesForDefinition(response || []);
    } catch (error: any) {
      const parsedError = parseHolidayError(error);
      toast.error('Lỗi khi tải danh sách ngày', {
        description: parsedError.userMessage,
      });
      console.error('Failed to load dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const handleToggleExpand = async (definitionId: string) => {
    if (expandedDefinition === definitionId) {
      setExpandedDefinition(null);
      setDatesForDefinition([]);
    } else {
      setExpandedDefinition(definitionId);
      await loadDatesForDefinition(definitionId);
    }
  };

  const handleOpenDefinitionModal = (definition?: HolidayDefinition) => {
    if (definition) {
      setSelectedDefinition(definition);
      setIsEditing(true);
      setDefinitionFormData({
        definitionId: definition.definitionId,
        holidayName: definition.holidayName,
        holidayType: definition.holidayType,
        description: definition.description || '',
      });
    } else {
      setSelectedDefinition(null);
      setIsEditing(false);
      setDefinitionFormData({
        definitionId: '',
        holidayName: '',
        holidayType: 'NATIONAL',
        description: '',
      });
    }
    setFormErrors({});
    setShowDefinitionModal(true);
  };

  const handleOpenDateModal = (definition: HolidayDefinition, date?: HolidayDate) => {
    setSelectedDefinition(definition);
    if (date) {
      setSelectedDate(date);
      setIsEditing(true);
      setDateFormData({
        holidayDate: date.holidayDate,
        description: date.description || '',
      });
    } else {
      setSelectedDate(null);
      setIsEditing(false);
      setDateFormData({
        holidayDate: '',
        description: '',
      });
    }
    setFormErrors({});
    setShowDateModal(true);
  };

  const handleSubmitDefinition = async () => {
    // Validation
    const errors: Record<string, string> = {};
    if (!definitionFormData.definitionId.trim()) {
      errors.definitionId = 'ID định nghĩa là bắt buộc';
    }
    if (!definitionFormData.holidayName.trim()) {
      errors.holidayName = 'Tên ngày lễ là bắt buộc';
    }
    if (!definitionFormData.holidayType) {
      errors.holidayType = 'Loại ngày lễ là bắt buộc';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});

      if (isEditing && selectedDefinition) {
        const updateData: UpdateHolidayDefinitionRequest = {
          holidayName: definitionFormData.holidayName,
          holidayType: definitionFormData.holidayType,
          description: definitionFormData.description || undefined,
        };
        await holidayService.updateDefinition(selectedDefinition.definitionId, updateData);
        toast.success('Cập nhật định nghĩa ngày lễ thành công');
      } else {
        const createData: CreateHolidayDefinitionRequest = {
          definitionId: definitionFormData.definitionId.trim(),
          holidayName: definitionFormData.holidayName.trim(),
          holidayType: definitionFormData.holidayType,
          description: definitionFormData.description || undefined,
        };
        await holidayService.createDefinition(createData);
        toast.success('Tạo định nghĩa ngày lễ thành công');
      }

      setShowDefinitionModal(false);
      await loadDefinitions();
      if (expandedDefinition === selectedDefinition?.definitionId) {
        await loadDatesForDefinition(selectedDefinition.definitionId);
      }
    } catch (error: any) {
      const parsedError = parseHolidayError(error);
      toast.error('Lỗi khi lưu định nghĩa', {
        description: parsedError.userMessage,
      });

      // Set field-specific errors if available
      if (parsedError.details?.definitionId) {
        setFormErrors({ definitionId: 'ID này đã tồn tại' });
      }
      console.error('Failed to save definition:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDate = async () => {
    // Validation
    const errors: Record<string, string> = {};
    if (!dateFormData.holidayDate.trim()) {
      errors.holidayDate = 'Ngày là bắt buộc';
    } else {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateFormData.holidayDate)) {
        errors.holidayDate = 'Định dạng ngày không hợp lệ (YYYY-MM-DD)';
      }
    }

    if (!selectedDefinition) {
      toast.error('Lỗi', { description: 'Không tìm thấy định nghĩa ngày lễ' });
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});

      if (isEditing && selectedDate) {
        const updateData: UpdateHolidayDateRequest = {
          holidayDate: dateFormData.holidayDate,
          definitionId: selectedDefinition.definitionId,
          description: dateFormData.description || undefined,
        };
        await holidayService.updateDate(
          selectedDate.holidayDate,
          selectedDefinition.definitionId,
          updateData
        );
        toast.success('Cập nhật ngày lễ thành công');
      } else {
        const createData: CreateHolidayDateRequest = {
          holidayDate: dateFormData.holidayDate.trim(),
          definitionId: selectedDefinition.definitionId,
          description: dateFormData.description || undefined,
        };
        await holidayService.createDate(createData);
        toast.success('Thêm ngày lễ thành công');
      }

      setShowDateModal(false);
      await loadDatesForDefinition(selectedDefinition.definitionId);
      await loadDefinitions(); // Refresh to update totalDates
    } catch (error: any) {
      const parsedError = parseHolidayError(error);
      toast.error('Lỗi khi lưu ngày lễ', {
        description: parsedError.userMessage,
      });

      // Set field-specific errors if available
      if (parsedError.details?.holidayDate) {
        setFormErrors({ holidayDate: 'Ngày này đã tồn tại cho định nghĩa này' });
      }
      console.error('Failed to save date:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDefinition = async () => {
    if (!selectedDefinition) return;

    try {
      setSubmitting(true);
      await holidayService.deleteDefinition(selectedDefinition.definitionId);
      toast.success('Xóa định nghĩa ngày lễ thành công');
      setShowDeleteModal(false);
      setSelectedDefinition(null);
      await loadDefinitions();
      if (expandedDefinition === selectedDefinition.definitionId) {
        setExpandedDefinition(null);
        setDatesForDefinition([]);
      }
    } catch (error: any) {
      const parsedError = parseHolidayError(error);
      toast.error('Lỗi khi xóa định nghĩa', {
        description: parsedError.userMessage,
      });
      console.error('Failed to delete definition:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDate = async (date: HolidayDate) => {
    if (!selectedDefinition) return;

    try {
      await holidayService.deleteDate(date.holidayDate, date.definitionId);
      toast.success('Xóa ngày lễ thành công');
      await loadDatesForDefinition(selectedDefinition.definitionId);
      await loadDefinitions(); // Refresh to update totalDates
    } catch (error: any) {
      const parsedError = parseHolidayError(error);
      toast.error('Lỗi khi xóa ngày lễ', {
        description: parsedError.userMessage,
      });
      console.error('Failed to delete date:', error);
    }
  };

  // Filter and sort
  const filteredDefinitions = definitions.filter((def) => {
    const matchesSearch =
      def.definitionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.holidayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || def.holidayType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedDefinitions = [...filteredDefinitions].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    switch (sortField) {
      case 'holidayName':
        comparison = a.holidayName.localeCompare(b.holidayName);
        break;
      case 'holidayType':
        comparison = a.holidayType.localeCompare(b.holidayType);
        break;
      case 'totalDates':
        comparison = (a.totalDates || 0) - (b.totalDates || 0);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (!canView) {
    return (
      <ProtectedRoute requiredBaseRole="admin">
        <UnauthorizedMessage requiredPermission="VIEW_HOLIDAY" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredBaseRole="admin">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý ngày lễ</h1>
            <p className="text-gray-600 mt-1">Quản lý định nghĩa và ngày nghỉ lễ của hệ thống</p>
          </div>
          {canCreate && (
            <Button
              onClick={() => handleOpenDefinitionModal()}
              className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo ID hoặc tên ngày lễ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as FilterType)}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Loại ngày lễ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="NATIONAL">Quốc gia</SelectItem>
                    <SelectItem value="COMPANY">Phòng khám</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Definitions List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách định nghĩa ngày lễ ({sortedDefinitions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#8b5fbf]" />
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : sortedDefinitions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Chưa có định nghĩa ngày lễ nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDefinitions.map((definition) => (
                  <div
                    key={definition.definitionId}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#8b5fbf] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {definition.holidayName}
                          </h3>
                          <Badge
                            variant={definition.holidayType === 'NATIONAL' ? 'default' : 'secondary'}
                            className={
                              definition.holidayType === 'NATIONAL'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }
                          >
                            {definition.holidayType === 'NATIONAL' ? (
                              <Flag className="h-3 w-3 mr-1" />
                            ) : (
                              <Building2 className="h-3 w-3 mr-1" />
                            )}
                            {definition.holidayType === 'NATIONAL' ? 'Quốc gia' : 'Phòng khám'}
                          </Badge>
                          <Badge variant="outline">
                            {definition.totalDates || 0} ngày
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">ID:</span> {definition.definitionId}
                        </p>
                        {definition.description && (
                          <p className="text-sm text-gray-600 mb-3">{definition.description}</p>
                        )}
                        {definition.createdAt && (
                          <p className="text-xs text-gray-400">
                            Tạo: {new Date(definition.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleExpand(definition.definitionId)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {expandedDefinition === definition.definitionId ? 'Ẩn' : 'Xem'} ngày
                        </Button>
                        {canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDefinitionModal(definition)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDefinition(definition);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Dates List (Expanded) */}
                    {expandedDefinition === definition.definitionId && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Danh sách ngày lễ</h4>
                          {canCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDateModal(definition)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm ngày
                            </Button>
                          )}
                        </div>
                        {loadingDates ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-[#8b5fbf]" />
                            <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
                          </div>
                        ) : datesForDefinition.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Chưa có ngày lễ nào cho định nghĩa này
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {datesForDefinition.map((date) => (
                              <div
                                key={`${date.holidayDate}-${date.definitionId}`}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {new Date(date.holidayDate).toLocaleDateString('vi-VN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  {date.description && (
                                    <p className="text-sm text-gray-600 mt-1">{date.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {canUpdate && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenDateModal(definition, date)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteDate(date)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Definition Form Modal */}
        <Dialog open={showDefinitionModal} onOpenChange={setShowDefinitionModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Chỉnh sửa định nghĩa ngày lễ' : 'Tạo định nghĩa ngày lễ mới'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Cập nhật thông tin định nghĩa ngày lễ'
                  : 'Tạo một định nghĩa ngày lễ mới (ví dụ: Tết Nguyên Đán, Ngày Quốc khánh)'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="definitionId">
                  ID định nghĩa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="definitionId"
                  value={definitionFormData.definitionId}
                  onChange={(e) =>
                    setDefinitionFormData({ ...definitionFormData, definitionId: e.target.value })
                  }
                  disabled={isEditing}
                  placeholder="VD: TET_2025, NEW_YEAR"
                  className={formErrors.definitionId ? 'border-red-500' : ''}
                />
                {formErrors.definitionId && (
                  <p className="text-sm text-red-500">{formErrors.definitionId}</p>
                )}
                {!isEditing && (
                  <p className="text-xs text-gray-500">
                    ID duy nhất để định danh (không thể thay đổi sau khi tạo)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidayName">
                  Tên ngày lễ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="holidayName"
                  value={definitionFormData.holidayName}
                  onChange={(e) =>
                    setDefinitionFormData({ ...definitionFormData, holidayName: e.target.value })
                  }
                  placeholder="VD: Tết Nguyên Đán 2025"
                  className={formErrors.holidayName ? 'border-red-500' : ''}
                />
                {formErrors.holidayName && (
                  <p className="text-sm text-red-500">{formErrors.holidayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidayType">
                  Loại ngày lễ <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={definitionFormData.holidayType}
                  onValueChange={(value) =>
                    setDefinitionFormData({
                      ...definitionFormData,
                      holidayType: value as 'NATIONAL' | 'COMPANY',
                    })
                  }
                >
                  <SelectTrigger className={formErrors.holidayType ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Quốc gia
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPANY">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Phòng khám
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.holidayType && (
                  <p className="text-sm text-red-500">{formErrors.holidayType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={definitionFormData.description}
                  onChange={(e) =>
                    setDefinitionFormData({ ...definitionFormData, description: e.target.value })
                  }
                  placeholder="Mô tả về ngày lễ này..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDefinitionModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmitDefinition}
                disabled={submitting}
                className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : isEditing ? (
                  'Cập nhật'
                ) : (
                  'Tạo mới'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Date Form Modal */}
        <Dialog open={showDateModal} onOpenChange={setShowDateModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Chỉnh sửa ngày lễ' : 'Thêm ngày lễ mới'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Cập nhật thông tin ngày lễ'
                  : `Thêm ngày lễ cho định nghĩa: ${selectedDefinition?.holidayName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="holidayDate">
                  Ngày <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="holidayDate"
                  type="date"
                  value={dateFormData.holidayDate}
                  onChange={(e) =>
                    setDateFormData({ ...dateFormData, holidayDate: e.target.value })
                  }
                  disabled={isEditing}
                  className={formErrors.holidayDate ? 'border-red-500' : ''}
                />
                {formErrors.holidayDate && (
                  <p className="text-sm text-red-500">{formErrors.holidayDate}</p>
                )}
                {!isEditing && (
                  <p className="text-xs text-gray-500">Định dạng: YYYY-MM-DD</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateDescription">Mô tả</Label>
                <Textarea
                  id="dateDescription"
                  value={dateFormData.description}
                  onChange={(e) =>
                    setDateFormData({ ...dateFormData, description: e.target.value })
                  }
                  placeholder="VD: Mùng 1 Tết, Ngày 30 Tết..."
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDateModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmitDate}
                disabled={submitting}
                className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : isEditing ? (
                  'Cập nhật'
                ) : (
                  'Thêm'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Xác nhận xóa
              </DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa định nghĩa ngày lễ "{selectedDefinition?.holidayName}"?
                <br />
                <span className="font-medium text-red-600 mt-2 block">
                  Tất cả các ngày lễ liên quan cũng sẽ bị xóa!
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleDeleteDefinition}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

