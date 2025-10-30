'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSyncAlt, 
  faEdit, 
  faTrash, 
  faEye, 
  faEyeSlash,
  faHospitalUser,
  faFilter,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { RoomService } from '@/services/roomService';
import { Room, RoomType, RoomFilters, RoomFormData, ROOM_TYPE_LABELS, ROOM_STATUS_LABELS, RoomListResponse } from '@/types/room';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';

export default function RoomManagementPage() {
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RoomFilters>({
    roomType: '',
    isActive: '',
    keyword: '',
    sortBy: 'roomId',
    sortDirection: 'ASC',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<RoomFormData>({
    roomCode: '',
    roomName: '',
    roomType: '',
    isActive: true,
  });

  const [updateForm, setUpdateForm] = useState<RoomFormData>({
    roomCode: '',
    roomName: '',
    roomType: '',
    isActive: true,
  });

  // Permissions
  const canView = user?.permissions?.includes('VIEW_ROOM') || false;
  const canCreate = user?.permissions?.includes('CREATE_ROOM') || false;
  const canUpdate = user?.permissions?.includes('UPDATE_ROOM') || false;
  const canDelete = user?.permissions?.includes('DELETE_ROOM') || false;

  // Load data
  useEffect(() => {
    if (canView) {
      loadRooms();
    }
  }, [canView, filters]);

  const loadRooms = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const response = await RoomService.getRooms(filters, page, pagination.pageSize);
      
      setRooms(response.content);
      setPagination(prev => ({
        ...prev,
        currentPage: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      }));
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle create room
  const handleCreateRoom = async () => {
    try {
      // Validation
      if (!createForm.roomCode.trim()) {
        toast.error('Vui lòng nhập mã phòng');
        return;
      }
      if (!createForm.roomName.trim()) {
        toast.error('Vui lòng nhập tên phòng');
        return;
      }
      if (!createForm.roomType) {
        toast.error('Vui lòng chọn loại phòng');
        return;
      }

      await RoomService.createRoom({
        roomCode: createForm.roomCode.trim(),
        roomName: createForm.roomName.trim(),
        roomType: createForm.roomType as RoomType,
        isActive: createForm.isActive,
      });

      // Reset form
      setCreateForm({
        roomCode: '',
        roomName: '',
        roomType: '',
        isActive: true,
      });

      // Close modal
      setShowCreateModal(false);

      // Reload data
      await loadRooms();

      toast.success('Tạo phòng thành công!');
    } catch (error: any) {
      console.error('Error creating room:', error);
      handleCreateError(error);
    }
  };

  // Handle create error
  const handleCreateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'ROOM_CODE_CONFLICT':
        toast.error('Mã phòng này đã tồn tại');
        break;
      case 'VALIDATION_ERROR':
        toast.error(errorMessage || 'Dữ liệu không hợp lệ');
        break;
      case 'FORBIDDEN':
        toast.error('Bạn không có quyền tạo phòng');
        break;
      default:
        handleError(error);
    }
  };

  // Handle update room
  const handleUpdateRoom = async () => {
    if (!selectedRoom) return;

    try {
      // Validation
      if (!updateForm.roomCode.trim()) {
        toast.error('Vui lòng nhập mã phòng');
        return;
      }
      if (!updateForm.roomName.trim()) {
        toast.error('Vui lòng nhập tên phòng');
        return;
      }
      if (!updateForm.roomType) {
        toast.error('Vui lòng chọn loại phòng');
        return;
      }

      await RoomService.updateRoom(selectedRoom.roomId, {
        roomCode: updateForm.roomCode.trim(),
        roomName: updateForm.roomName.trim(),
        roomType: updateForm.roomType as RoomType,
        isActive: updateForm.isActive,
      });

      // Close modal
      setShowUpdateModal(false);
      setSelectedRoom(null);

      // Reload data
      await loadRooms();

      toast.success('Cập nhật phòng thành công!');
    } catch (error: any) {
      console.error('Error updating room:', error);
      handleUpdateError(error);
    }
  };

  // Handle update error
  const handleUpdateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'ROOM_CODE_CONFLICT':
        toast.error('Mã phòng này đã tồn tại');
        break;
      case 'ROOM_NOT_FOUND':
        toast.error('Không tìm thấy phòng này');
        break;
      case 'VALIDATION_ERROR':
        toast.error(errorMessage || 'Dữ liệu không hợp lệ');
        break;
      case 'FORBIDDEN':
        toast.error('Bạn không có quyền cập nhật phòng');
        break;
      default:
        handleError(error);
    }
  };

  // Handle delete room (deactivate only)
  const handleDeleteRoom = async () => {
    if (!selectedRoom || !selectedRoom.isActive) return;

    try {
      await RoomService.toggleRoomStatus(selectedRoom.roomId);

      // Close modal
      setShowDeleteModal(false);
      setSelectedRoom(null);

      // Reload data
      await loadRooms();

      toast.success('Vô hiệu hóa phòng thành công!');
    } catch (error: any) {
      console.error('Error toggling room status:', error);
      handleDeleteError(error);
    }
  };

  // Handle delete error
  const handleDeleteError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'ROOM_IN_USE':
        toast.error('Phòng đang được sử dụng, không thể vô hiệu hóa');
        break;
      case 'ROOM_NOT_FOUND':
        toast.error('Không tìm thấy phòng này');
        break;
      case 'FORBIDDEN':
        toast.error('Bạn không có quyền thực hiện hành động này');
        break;
      default:
        handleError(error);
    }
  };

  // Handle edit click
  const handleEditClick = (room: Room) => {
    setSelectedRoom(room);
    setUpdateForm({
      roomCode: room.roomCode,
      roomName: room.roomName,
      roomType: room.roomType,
      isActive: room.isActive,
    });
    setShowUpdateModal(true);
  };

  // Handle delete click (only for active rooms)
  const handleDeleteClick = (room: Room) => {
    if (!room.isActive) return; // Only allow deactivating active rooms
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem danh sách phòng." />;
  }

  return (
    <ProtectedRoute
      requiredBaseRole="admin"
      requiredPermissions={['VIEW_ROOM']}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Phòng/Ghế</h1>
            <p className="text-gray-600 mt-1">Quản lý các phòng và ghế trong hệ thống</p>
          </div>
        </div>

        {/* Main Table with Filters */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faHospitalUser} />
                Quản lý phòng ({pagination.totalElements})
              </h2>
              <div className="flex items-center gap-2">
                {canCreate && (
                  <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlus} />
                    Tạo phòng mới
                  </Button>
                )}
                <Button onClick={() => loadRooms()} variant="outline" disabled={loading}>
                  <FontAwesomeIcon icon={faSyncAlt} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Đang tải...' : 'Tải lại'}
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                  Tìm kiếm
                </Label>
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" 
                  />
                  <Input
                    id="search"
                    placeholder="Tìm kiếm phòng..."
                    value={filters.keyword || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Room Type Filter */}
              <div>
                <Label htmlFor="room-type-filter" className="text-sm font-medium text-gray-700">
                  Loại phòng
                </Label>
                <select
                  id="room-type-filter"
                  value={filters.roomType || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, roomType: e.target.value as RoomType | '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Tất cả loại phòng</option>
                  <option value={RoomType.STANDARD}>{ROOM_TYPE_LABELS[RoomType.STANDARD]}</option>
                  <option value={RoomType.IMPLANT}>{ROOM_TYPE_LABELS[RoomType.IMPLANT]}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                  Trạng thái
                </Label>
                <select
                  id="status-filter"
                  value={filters.isActive === '' ? '' : filters.isActive?.toString() || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    isActive: e.target.value === '' ? '' : e.target.value === 'true' 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="true">{ROOM_STATUS_LABELS.true}</option>
                  <option value="false">{ROOM_STATUS_LABELS.false}</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <Label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
                  Sắp xếp theo
                </Label>
                <select
                  id="sort-by"
                  value={filters.sortBy || 'roomId'}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="roomId">Mã phòng</option>
                  <option value="roomName">Tên phòng</option>
                  <option value="roomType">Loại phòng</option>
                  <option value="isActive">Trạng thái</option>
                  <option value="createdAt">Ngày tạo</option>
                </select>
              </div>

              {/* Sort Direction */}
              <div>
                <Label htmlFor="sort-direction" className="text-sm font-medium text-gray-700">
                  Thứ tự
                </Label>
                <select
                  id="sort-direction"
                  value={filters.sortDirection || 'ASC'}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortDirection: e.target.value as 'ASC' | 'DESC' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ASC">Tăng dần</option>
                  <option value="DESC">Giảm dần</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ roomType: '', isActive: '', keyword: '', sortBy: 'roomId', sortDirection: 'ASC' })}
                  className="w-full"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faHospitalUser} className="text-4xl text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có phòng nào</h3>
                <p className="text-gray-500 mb-4">Chưa có phòng nào được tạo trong hệ thống</p>
                {canCreate && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                    Tạo phòng đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Mã phòng</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tên phòng</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Loại phòng</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.roomId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{room.roomCode}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">{room.roomName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={room.roomType === RoomType.IMPLANT ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {ROOM_TYPE_LABELS[room.roomType]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={room.isActive ? 'default' : 'secondary'}
                            className={`text-xs ${room.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {ROOM_STATUS_LABELS[room.isActive.toString() as keyof typeof ROOM_STATUS_LABELS]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {canUpdate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(room)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <FontAwesomeIcon icon={faEdit} className="mr-1" />
                                Sửa
                              </Button>
                            )}
                            {canDelete && room.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(room)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FontAwesomeIcon icon={faEyeSlash} className="mr-1" />
                                Vô hiệu hóa
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

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRooms(0)}
                    disabled={pagination.currentPage === 0}
                    className="px-2"
                  >
                    &laquo;&laquo;
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRooms(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 0}
                    className="px-2"
                  >
                    &laquo;
                  </Button>
                  
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {pagination.currentPage + 1} / {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRooms(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages - 1}
                    className="px-2"
                  >
                    &raquo;
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRooms(pagination.totalPages - 1)}
                    disabled={pagination.currentPage >= pagination.totalPages - 1}
                    className="px-2"
                  >
                    &raquo;&raquo;
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPlus} />
                Tạo phòng mới
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Room Code */}
              <div>
                <Label htmlFor="create-room-code" className="text-sm font-medium text-gray-700">
                  Mã phòng *
                </Label>
                <Input
                  id="create-room-code"
                  value={createForm.roomCode}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, roomCode: e.target.value }))}
                  placeholder="Nhập mã phòng"
                  className="mt-1"
                />
              </div>

              {/* Room Name */}
              <div>
                <Label htmlFor="create-room-name" className="text-sm font-medium text-gray-700">
                  Tên phòng *
                </Label>
                <Input
                  id="create-room-name"
                  value={createForm.roomName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, roomName: e.target.value }))}
                  placeholder="Nhập tên phòng"
                  className="mt-1"
                />
              </div>

              {/* Room Type */}
              <div>
                <Label htmlFor="create-room-type" className="text-sm font-medium text-gray-700">
                  Loại phòng *
                </Label>
                <select
                  id="create-room-type"
                  value={createForm.roomType}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, roomType: e.target.value as RoomType | '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mt-1"
                >
                  <option value="">Chọn loại phòng</option>
                  <option value={RoomType.STANDARD}>{ROOM_TYPE_LABELS[RoomType.STANDARD]}</option>
                  <option value={RoomType.IMPLANT}>{ROOM_TYPE_LABELS[RoomType.IMPLANT]}</option>
                </select>
              </div>

              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create-is-active"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="create-is-active" className="text-sm font-medium text-gray-700">
                  Kích hoạt phòng
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleCreateRoom}
                disabled={!createForm.roomCode.trim() || !createForm.roomName.trim() || !createForm.roomType}
              >
                Tạo phòng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEdit} />
                Cập nhật phòng
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Room Code */}
              <div>
                <Label htmlFor="update-room-code" className="text-sm font-medium text-gray-700">
                  Mã phòng *
                </Label>
                <Input
                  id="update-room-code"
                  value={updateForm.roomCode}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, roomCode: e.target.value }))}
                  placeholder="Nhập mã phòng"
                  className="mt-1"
                />
              </div>

              {/* Room Name */}
              <div>
                <Label htmlFor="update-room-name" className="text-sm font-medium text-gray-700">
                  Tên phòng *
                </Label>
                <Input
                  id="update-room-name"
                  value={updateForm.roomName}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, roomName: e.target.value }))}
                  placeholder="Nhập tên phòng"
                  className="mt-1"
                />
              </div>

              {/* Room Type */}
              <div>
                <Label htmlFor="update-room-type" className="text-sm font-medium text-gray-700">
                  Loại phòng *
                </Label>
                <select
                  id="update-room-type"
                  value={updateForm.roomType}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, roomType: e.target.value as RoomType | '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mt-1"
                >
                  <option value="">Chọn loại phòng</option>
                  <option value={RoomType.STANDARD}>{ROOM_TYPE_LABELS[RoomType.STANDARD]}</option>
                  <option value={RoomType.IMPLANT}>{ROOM_TYPE_LABELS[RoomType.IMPLANT]}</option>
                </select>
              </div>

              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="update-is-active"
                  checked={updateForm.isActive}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="update-is-active" className="text-sm font-medium text-gray-700">
                  Kích hoạt phòng
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleUpdateRoom}
                disabled={!updateForm.roomCode.trim() || !updateForm.roomName.trim() || !updateForm.roomType}
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEyeSlash} />
                Vô hiệu hóa phòng
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon 
                    icon={faEyeSlash} 
                    className="text-red-600 text-2xl" 
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Xác nhận vô hiệu hóa phòng
                </h3>
                <p className="text-gray-600">
                  Bạn có chắc chắn muốn vô hiệu hóa phòng này không?
                </p>
                {selectedRoom && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                    <div className="text-sm text-gray-600">
                      <strong>Mã phòng:</strong> {selectedRoom.roomCode}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Tên phòng:</strong> {selectedRoom.roomName}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Loại phòng:</strong> {ROOM_TYPE_LABELS[selectedRoom.roomType]}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteRoom}
              >
                Vô hiệu hóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
