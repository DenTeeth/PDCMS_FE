'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Plus, Edit, Trash2, CalendarDays, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

// Import types and services
import {
  PartTimeSlot,
  CreateWorkSlotRequest,
  UpdateWorkSlotRequest,
  WorkSlotQueryParams,
  DayOfWeek
} from '@/types/workSlot';
import { WorkShift } from '@/types/workShift';
import { workSlotService } from '@/services/workSlotService';
import { workShiftService } from '@/services/workShiftService';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeToHHMM } from '@/lib/utils';

// ==================== MAIN COMPONENT ====================
export default function WorkSlotsManagementPage() {
  const { user, hasPermission } = useAuth();

  // Permission checks
  const canViewSlots = hasPermission(Permission.VIEW_WORK_SLOTS) || hasPermission(Permission.MANAGE_WORK_SLOTS);
  const canManageSlots = hasPermission(Permission.MANAGE_WORK_SLOTS);

  // State management
  const [workSlots, setWorkSlots] = useState<PartTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);


  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateWorkSlotRequest>({
    workShiftId: '',
    dayOfWeek: 'MONDAY', // Changed to string for comma-separated days support
    quota: 1,
    effectiveFrom: '',
    effectiveTo: ''
  });

  // Track selected days for multi-select checkbox
  const [selectedDays, setSelectedDays] = useState<string[]>(['MONDAY']);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<PartTimeSlot | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateWorkSlotRequest>({
    quota: 1,
    isActive: true
  });

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Dropdown data
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // ==================== LOCK BODY SCROLL WHEN MODAL OPEN ====================
  useEffect(() => {
    if (showCreateModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal]);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchWorkSlots();
    fetchDropdownData();
  }, []); // No dependencies - fetch once on mount

  const fetchWorkSlots = async () => {
    try {
      setLoading(true);
      // API returns array directly (NOT paginated)
      const slots = await workSlotService.getWorkSlots();
      setWorkSlots(slots || []);
    } catch (error: any) {
      console.error('Failed to fetch work slots:', error);
      toast.error(error.response?.data?.detail || error.message || 'Không thể tải danh sách ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);

      // Fetch active work shifts
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);
    } catch (error: any) {
      console.error(' Failed to fetch dropdown data:', error);
      toast.error('Không thể tải danh sách ca làm việc');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // ==================== CREATE WORK SLOT ====================
  const handleCreateWorkSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permission first
    if (!canManageSlots) {
      toast.error('Bạn không có quyền tạo ca làm việc');
      return;
    }

    // Validate required fields
    if (!createFormData.workShiftId) {
      toast.error('Vui lòng chọn ca làm việc');
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thứ trong tuần');
      return;
    }

    if (createFormData.quota < 1) {
      toast.error('Số lượng phải ít nhất là 1');
      return;
    }

    if (!createFormData.effectiveFrom) {
      toast.error('Vui lòng chọn ngày bắt đầu');
      return;
    }

    if (!createFormData.effectiveTo) {
      toast.error('Vui lòng chọn ngày kết thúc');
      return;
    }

    // Validate effectiveTo >= effectiveFrom
    if (new Date(createFormData.effectiveTo) < new Date(createFormData.effectiveFrom)) {
      toast.error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      return;
    }

    try {
      setCreating(true);

      // Join selected days into comma-separated string
      const payload = {
        ...createFormData,
        dayOfWeek: selectedDays.join(',')
      };

      console.log('� Creating work slot:', payload);

      await workSlotService.createWorkSlot(payload);
      toast.success('Tạo ca làm việc thành công');
      setShowCreateModal(false);
      resetCreateForm();

      // Refresh the work slots list
      await fetchWorkSlots();
    } catch (error: any) {
      console.error(' Failed to create work slot:', error);

      let errorMessage = 'Không thể tạo ca làm việc';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      workShiftId: '',
      dayOfWeek: 'MONDAY',
      quota: 1,
      effectiveFrom: '',
      effectiveTo: ''
    });
    setSelectedDays(['MONDAY']);
  };

  // ==================== UPDATE WORK SLOT ====================
  const handleEditWorkSlot = (slot: PartTimeSlot) => {
    setEditingSlot(slot);
    setEditFormData({
      quota: slot.quota,
      isActive: slot.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateWorkSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSlot) return;

    // Check permission first
    if (!canManageSlots) {
      toast.error('Bạn không có quyền cập nhật ca làm việc');
      return;
    }

    // Validate quota if provided
    if (editFormData.quota !== undefined && editFormData.quota < 1) {
      toast.error('Số lượng phải ít nhất là 1');
      return;
    }

    // Check quota violation (validate before API call)
    if (editFormData.quota !== undefined && editFormData.quota < editingSlot.registered) {
      toast.error(`Không thể giảm quota xuống ${editFormData.quota}. Đã có ${editingSlot.registered} nhân viên đăng ký suất này.`);
      return;
    }

    try {
      setUpdating(true);

      console.log('� Updating work slot:', editingSlot.slotId, editFormData);

      await workSlotService.updateWorkSlot(editingSlot.slotId, editFormData);
      toast.success('Cập nhật ca làm việc thành công');
      setShowEditModal(false);
      setEditingSlot(null);
      await fetchWorkSlots();
    } catch (error: any) {
      console.error(' Failed to update work slot:', error);

      // Handle specific error codes
      if (error.errorCode === 'QUOTA_VIOLATION' || error.response?.data?.errorCode === 'QUOTA_VIOLATION') {
        const message = error.message || error.response?.data?.message || `Không thể giảm số lượng. Đã có ${editingSlot.registered} nhân viên đăng ký suất này.`;
        toast.error(message);
      } else {
        let errorMessage = 'Không thể cập nhật ca làm việc';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage);
      }
    } finally {
      setUpdating(false);
    }
  };

  // ==================== DELETE WORK SLOT ====================
  const handleDeleteWorkSlot = async (slot: PartTimeSlot) => {
    // Check permission first
    if (!canManageSlots) {
      toast.error('Bạn không có quyền xóa ca làm việc');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ca làm việc ${slot.workShiftName} vào ${slot.dayOfWeek}?`)) {
      return;
    }

    try {
      setDeleting(true);
      console.log(' Deleting work slot:', slot.slotId);

      await workSlotService.deleteWorkSlot(slot.slotId);
      toast.success('Xóa ca làm việc thành công');
      await fetchWorkSlots();
    } catch (error: any) {
      console.error(' Failed to delete work slot:', error);

      let errorMessage = 'Không thể xóa ca làm việc';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getWorkShiftName = (workShiftId: string) => {
    const shift = workShifts.find(shift => shift.workShiftId === workShiftId);
    return shift ? `${shift.shiftName} (${formatTimeToHHMM(shift.startTime)}-${formatTimeToHHMM(shift.endTime)})` : workShiftId;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getDayOfWeekLabel = (day: DayOfWeek | string): string => {
    const dayMap = {
      [DayOfWeek.MONDAY]: 'Thứ 2',
      [DayOfWeek.TUESDAY]: 'Thứ 3',
      [DayOfWeek.WEDNESDAY]: 'Thứ 4',
      [DayOfWeek.THURSDAY]: 'Thứ 5',
      [DayOfWeek.FRIDAY]: 'Thứ 6',
      [DayOfWeek.SATURDAY]: 'Thứ 7',
      [DayOfWeek.SUNDAY]: 'Chủ nhật'
    };
    return dayMap[day as DayOfWeek] || day;
  };

  /**
   * Parse and format comma-separated days to Vietnamese label
   * e.g., "MONDAY,TUESDAY,FRIDAY" -> "T2, T3, T6"
   */
  const formatDaysOfWeek = (days: string): string => {
    if (!days) return '';
    const daysArray = days.split(',').map(d => d.trim());
    return daysArray.map(day => getDayOfWeekLabel(day)).join(', ');
  };

  // ==================== RENDER ====================

  // Check if user can view slots
  if (!canViewSlots) {
    return (
      <ProtectedRoute requiredBaseRole="admin">
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600">Bạn cần quyền VIEW_WORK_SLOTS hoặc MANAGE_WORK_SLOTS để xem trang này.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredBaseRole="admin">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý suất làm việc</h1>
            <p className="text-gray-600 mt-1">Quản lý các suất và hạn mức cho nhân viên bán thời gian</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
            disabled={!canManageSlots}
            title={!canManageSlots ? 'Bạn không có quyền tạo suất' : ''}
          >
            <Plus className="h-4 w-4" />
            Tạo suất mới
          </Button>
        </div>

        {/* Filters temporarily hidden */}

        {/* Work Slots Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Danh sách suất ({workSlots.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : workSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có suất nào
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Tên ca</th>
                      <th className="text-left p-3 font-medium">Thứ</th>
                      <th className="text-left p-3 font-medium">Số lượng cần</th>
                      <th className="text-left p-3 font-medium">Đã đăng ký</th>
                      <th className="text-left p-3 font-medium">Thời gian hiệu lực</th>
                      <th className="text-left p-3 font-medium">Trạng thái</th>
                      <th className="text-left p-3 font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workSlots.map((slot) => (
                      <tr key={slot.slotId} className="border-b hover:bg-gray-50">
                        <td className="p-3">{slot.workShiftName || getWorkShiftName(slot.workShiftId)}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {formatDaysOfWeek(slot.dayOfWeek)}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold">{slot.quota}</td>
                        <td className="p-3 font-medium">{slot.registered}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {slot.effectiveFrom && slot.effectiveTo ? (
                            <div>
                              <div>{format(parseISO(slot.effectiveFrom), 'dd/MM/yyyy')}</div>
                              <div className="text-gray-400">→</div>
                              <div>{format(parseISO(slot.effectiveTo), 'dd/MM/yyyy')}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant={slot.isActive ? "active" : "inactive"}>
                            {slot.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Đang hoạt động
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Không hoạt động
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditWorkSlot(slot)}
                              title={!canManageSlots ? 'Bạn không có quyền chỉnh sửa suất' : 'Chỉnh sửa'}
                              disabled={!canManageSlots}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canManageSlots && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWorkSlot(slot)}
                                title="Xóa suất"
                                disabled={deleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Note: API returns array directly (no pagination) */}
            {workSlots.length > 0 && (
              <div className="text-sm text-gray-600 mt-4 text-center">
                Hiển thị {workSlots.length} suất
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col">
              <div className="flex-shrink-0 border-b px-6 py-4">
                <h2 className="text-xl font-bold">Tạo suất mới</h2>
              </div>
              <form onSubmit={handleCreateWorkSlot} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="createWorkShift">Mẫu ca <span className="text-red-500">*</span></Label>
                  <select
                    id="createWorkShift"
                    value={createFormData.workShiftId}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn mẫu ca</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({formatTimeToHHMM(shift.startTime)}-{formatTimeToHHMM(shift.endTime)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Thứ trong tuần <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {Object.values(DayOfWeek).filter(day => day !== DayOfWeek.SUNDAY).map((day) => (
                      <label key={day} className="inline-flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={() => {
                            setSelectedDays(prev => {
                              if (prev.includes(day)) return prev.filter(d => d !== day);
                              return [...prev, day];
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{getDayOfWeekLabel(day)}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-muted text-sm mt-2">Chọn một hoặc nhiều thứ trong tuần cho suất làm việc này.</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="createQuota">Số lượng cần <span className="text-red-500">*</span></Label>
                  <Input
                    id="createQuota"
                    type="number"
                    min="1"
                    value={createFormData.quota}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      quota: parseInt(e.target.value) || 1
                    }))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="createEffectiveFrom">Ngày bắt đầu <span className="text-red-500">*</span></Label>
                  <Input
                    id="createEffectiveFrom"
                    type="date"
                    value={createFormData.effectiveFrom || ''}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      effectiveFrom: e.target.value
                    }))}
                    min={new Date().toISOString().split('T')[0]} // Minimum today
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="createEffectiveTo">Ngày kết thúc <span className="text-red-500">*</span></Label>
                  <Input
                    id="createEffectiveTo"
                    type="date"
                    value={createFormData.effectiveTo || ''}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      effectiveTo: e.target.value
                    }))}
                    min={createFormData.effectiveFrom || new Date().toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn thời gian hiệu lực cho suất làm việc này
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Lưu'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSlot && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex-shrink-0 border-b px-6 py-4">
                <h2 className="text-xl font-bold">Chỉnh sửa suất</h2>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                <form onSubmit={handleUpdateWorkSlot} className="space-y-4">
                  <div>
                    <Label>Mẫu ca</Label>
                    <Input value={editingSlot.workShiftName || getWorkShiftName(editingSlot.workShiftId)} disabled />
                  </div>

                  <div>
                    <Label>Thứ trong tuần</Label>
                    <Input value={getDayOfWeekLabel(editingSlot.dayOfWeek)} disabled />
                  </div>

                  <div>
                    <Label htmlFor="editQuota">Số lượng cần</Label>
                    <Input
                      id="editQuota"
                      type="number"
                      min={editingSlot.registered}
                      placeholder="Để trống để giữ nguyên số lượng hiện tại"
                      value={editFormData.quota || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        quota: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Đã đăng ký: {editingSlot.registered} người
                    </p>
                  </div>

                  <div className="pb-20">
                    <Label htmlFor="editIsActive">Trạng thái</Label>
                    <select
                      id="editIsActive"
                      value={editFormData.isActive !== undefined ? (editFormData.isActive ? 'true' : 'false') : ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Giữ nguyên trạng thái hiện tại</option>
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Không hoạt động</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 pb-4 sticky bottom-0 bg-white border-t -mx-6 px-6 -mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingSlot(null);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={updating}>
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        'Lưu'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
