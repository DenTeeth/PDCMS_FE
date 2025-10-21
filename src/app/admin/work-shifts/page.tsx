'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { workShiftService } from '@/services/workShiftService';
import {
  WorkShift,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  WorkShiftCategory,
} from '@/types/workShift';

export default function WorkShiftsPage() {
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<WorkShift | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateWorkShiftRequest>({
    shiftName: '',
    startTime: '',
    endTime: '',
    category: 'NORMAL',
  });

  const [editFormData, setEditFormData] = useState<UpdateWorkShiftRequest>({});

  const fetchWorkShifts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workShiftService.getAll();
      setWorkShifts(data);
    } catch (err: any) {
      console.error('Error fetching work shifts:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách ca làm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkShifts();
  }, []);

  // Create handlers
  const openCreateModal = () => {
    setFormData({
      shiftName: '',
      startTime: '',
      endTime: '',
      category: 'NORMAL',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workShiftService.create(formData);
      setIsCreateModalOpen(false);
      fetchWorkShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo ca làm');
    }
  };

  // Edit handlers
  const openEditModal = (shift: WorkShift) => {
    setSelectedShift(shift);
    setEditFormData({
      shiftName: shift.shiftName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      category: shift.category,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;

    try {
      await workShiftService.update(selectedShift.workShiftId, editFormData);
      setIsEditModalOpen(false);
      fetchWorkShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật ca làm');
    }
  };

  // Delete handlers
  const openDeleteModal = (shift: WorkShift) => {
    setSelectedShift(shift);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedShift) return;

    try {
      await workShiftService.delete(selectedShift.workShiftId);
      setIsDeleteModalOpen(false);
      fetchWorkShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa ca làm');
    }
  };

  // Helper functions
  const getCategoryBadge = (category: WorkShiftCategory) => {
    return category === 'NORMAL' ? (
      <Badge className="bg-blue-100 text-blue-800">Ca thường</Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-800">Ca đêm</Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Đang hoạt động</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Không hoạt động</Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách ca làm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Lỗi</p>
              <p className="mt-2">{error}</p>
              <Button onClick={fetchWorkShifts} className="mt-4">
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats calculation
  const stats = {
    total: workShifts.length,
    active: workShifts.filter(s => s.isActive).length,
    normal: workShifts.filter(s => s.category === 'NORMAL').length,
    night: workShifts.filter(s => s.category === 'NIGHT').length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Ca làm</h1>
          <p className="text-gray-600">Xem và quản lý ca làm việc của nhân viên</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo ca làm
        </Button>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số ca</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ca thường</p>
                <p className="text-2xl font-bold">{stats.normal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ca đêm</p>
                <p className="text-2xl font-bold">{stats.night}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== WORK SHIFTS TABLE ==================== */}
      {workShifts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên ca làm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số giờ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại ca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workShifts.map((shift) => (
                    <tr key={shift.workShiftId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-blue-100 rounded-full">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {shift.shiftName}
                            </div>
                            <div className="text-sm text-gray-500">{shift.workShiftId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shift.durationHours} giờ</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(shift.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(shift.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(shift)}
                            className="hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(shift)}
                            className="hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ca làm nào</h3>
              <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo ca làm đầu tiên</p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo ca làm đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== CREATE MODAL ==================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Tạo ca làm mới</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shiftName">
                      Tên ca làm <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shiftName"
                      value={formData.shiftName}
                      onChange={(e) =>
                        setFormData({ ...formData, shiftName: e.target.value })
                      }
                      placeholder="Ví dụ: Ca sáng (4 tiếng)"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">
                        Giờ bắt đầu <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value + ':00',
                          })
                        }
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Giờ làm việc: 08:00 - 21:00
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="endTime">
                        Giờ kết thúc <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endTime: e.target.value + ':00',
                          })
                        }
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Thời lượng: 3-8 giờ
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">
                      Loại ca <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as WorkShiftCategory,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    >
                      <option value="NORMAL">Ca thường</option>
                      <option value="NIGHT">Ca đêm (sau 18:00)</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Lưu ý khi tạo ca làm:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Thời lượng ca làm: tối thiểu 3 giờ, tối đa 8 giờ</li>
                      <li>• Giờ làm việc: từ 08:00 đến 21:00</li>
                      <li>• Ca đêm: bắt đầu sau 18:00</li>
                      <li>• Ca cả ngày 08:00-17:00 được tính 8 giờ (trừ 1 giờ nghỉ trưa)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    Tạo ca làm
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {isEditModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Cập nhật ca làm</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editShiftName">Tên ca làm</Label>
                    <Input
                      id="editShiftName"
                      value={editFormData.shiftName || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, shiftName: e.target.value })
                      }
                      placeholder="Ví dụ: Ca sáng (4 tiếng)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editStartTime">Giờ bắt đầu</Label>
                      <Input
                        id="editStartTime"
                        type="time"
                        value={editFormData.startTime?.substring(0, 5) || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            startTime: e.target.value + ':00',
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="editEndTime">Giờ kết thúc</Label>
                      <Input
                        id="editEndTime"
                        type="time"
                        value={editFormData.endTime?.substring(0, 5) || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            endTime: e.target.value + ':00',
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editCategory">Loại ca</Label>
                    <select
                      id="editCategory"
                      value={editFormData.category || ''}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          category: e.target.value as WorkShiftCategory,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md p-2"
                    >
                      <option value="NORMAL">Ca thường</option>
                      <option value="NIGHT">Ca đêm (sau 18:00)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    Cập nhật
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== DELETE MODAL ==================== */}
      {isDeleteModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Xác nhận xóa</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa ca làm{' '}
                <span className="font-semibold">{selectedShift.shiftName}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Ca làm sẽ bị vô hiệu hóa và không thể sử dụng được nữa.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
