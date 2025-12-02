'use client';

/**
 * Booking - Rooms Management Page
 * 
 * Merged from admin/rooms with improved UI:
 * - Full CRUD operations (Create, Update, Delete/Deactivate)
 * - Modern search/filter UI with Select components
 * - Debounced search để hạn chế API calls
 * - Dynamic roomType extraction from data
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
import { RoomService } from '@/services/roomService';
import {
  Room,
  RoomListResponse,
  RoomType,
  RoomFormData,
  ROOM_TYPE_LABELS,
  ROOM_STATUS_LABELS
} from '@/types/room';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Eye, Plus, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, X, Filter } from 'lucide-react';

export default function BookingRoomsPage() {
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('active');

  // Sort states
  const [sortBy, setSortBy] = useState<string>('roomId');
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

  // Load all rooms to extract unique room types (only once on mount, with ref to prevent re-calls)
  const [allRoomsForTypes, setAllRoomsForTypes] = useState<Room[]>([]);
  const hasLoadedTypes = useRef(false);
  useEffect(() => {
    if (!canView || hasLoadedTypes.current) return;

    const loadAllRoomsForTypes = async () => {
      try {
        hasLoadedTypes.current = true;
        // Load all rooms without pagination to get all room types (only once)
        const response = await RoomService.getRooms({}, 0, 1000);
        setAllRoomsForTypes(response.content);
      } catch (error) {
        console.error('Error loading rooms for types:', error);
        hasLoadedTypes.current = false; // Reset on error to allow retry
      }
    };

    loadAllRoomsForTypes();
  }, [canView]);

  // Extract unique room types from all rooms data (static, only from allRoomsForTypes)
  // Lấy từ cột Type trong rooms data
  const availableRoomTypes = useMemo(() => {
    const types = new Set<string>();
    // Chỉ lấy từ data trong rooms (allRoomsForTypes)
    allRoomsForTypes.forEach(room => {
      if (room.roomType) {
        types.add(room.roomType);
      }
    });
    // Add common room types from docs as fallback (chỉ khi không có data)
    if (types.size === 0) {
      const commonTypes = ['STANDARD', 'SURGERY', 'XRAY', 'ORTHODONTICS'];
      commonTypes.forEach(type => types.add(type));
    }
    return Array.from(types).sort();
  }, [allRoomsForTypes]); // Removed 'rooms' dependency to prevent recalculation

  // Helper function để lấy label từ ROOM_TYPE_LABELS
  const getRoomTypeLabel = useCallback((type: string): string => {
    // Ưu tiên dùng ROOM_TYPE_LABELS
    if (ROOM_TYPE_LABELS[type as RoomType]) {
      return ROOM_TYPE_LABELS[type as RoomType];
    }
    // Fallback: format tên type nếu không có trong ROOM_TYPE_LABELS
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  // Load rooms với filters, sort và pagination
  // Use ref to store handleError to avoid including it in dependencies
  const handleErrorRef = useRef(handleError);
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Request cancellation để tránh race condition
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadRooms = useCallback(async () => {
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
      const filters: any = {
        keyword: debouncedSearch || undefined,
        sortBy: sortBy,
        sortDirection: sortDirection,
      };

      // Add roomType filter if not 'all'
      if (roomTypeFilter !== 'all') {
        filters.roomType = roomTypeFilter;
      }

      // Add isActive filter if not 'all'
      if (isActiveFilter !== 'all') {
        filters.isActive = isActiveFilter === 'active';
      }

      const response: RoomListResponse = await RoomService.getRooms(
        filters,
        currentPage,
        pageSize
      );

      // Only update if request wasn't cancelled
      if (!abortController.signal.aborted) {
        setRooms(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      console.error('Error loading rooms:', error);
      handleErrorRef.current(error);
      // Only clear data if it's a real error (not cancellation)
      if (!abortController.signal.aborted) {
        setRooms([]);
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
  }, [canView, debouncedSearch, roomTypeFilter, isActiveFilter, sortBy, sortDirection, currentPage, pageSize]);

  // Load rooms khi filters hoặc page thay đổi
  useEffect(() => {
    loadRooms();

    // Cleanup: Cancel request on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadRooms]);

  // Reset về page 0 khi filters hoặc sort thay đổi (debouncedSearch thay vì searchInput)
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearch, roomTypeFilter, isActiveFilter, sortBy, sortDirection]);

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
      roomId: 'Mặc định',
      roomCode: 'Mã phòng',
      roomName: 'Tên phòng',
      createdAt: 'Ngày tạo',
    };
    return labels[sortBy] || 'Sắp xếp';
  };

  // Clear all filters function
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchKeyword('');
    setRoomTypeFilter('all');
    setIsActiveFilter('active');
    setSortBy('roomId');
    setSortDirection('ASC');
    setCurrentPage(0);
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

      // Reload data và room types
      hasLoadedTypes.current = false; // Reset to reload types
      await loadRooms();
      // Reload types after creating
      const typesResponse = await RoomService.getRooms({}, 0, 1000);
      setAllRoomsForTypes(typesResponse.content);
      hasLoadedTypes.current = true;

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

      // Reload data và room types
      await loadRooms();
      // Reload types after updating (in case room type changed)
      const typesResponse = await RoomService.getRooms({}, 0, 1000);
      setAllRoomsForTypes(typesResponse.content);
      hasLoadedTypes.current = true;

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

      // Reload data (no need to reload types for deactivate)
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

  // Handle row click để xem chi tiết
  const handleRowClick = useCallback((room: Room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
  }, []);

  // Columns definition
  const columns: OptimizedTableColumn<Room>[] = useMemo(() => [
    {
      key: 'roomCode',
      header: 'Room Code',
      accessor: (room) => (
        <span className="font-medium">{room.roomCode}</span>
      ),
    },
    {
      key: 'roomName',
      header: 'Room Name',
      accessor: (room) => room.roomName,
    },
    {
      key: 'roomType',
      header: 'Type',
      accessor: (room) => (
        <Badge variant="outline">
          {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      accessor: (room) => (
        <Badge variant={room.isActive ? 'default' : 'secondary'}>
          {room.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (room) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(room);
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
                handleEditClick(room);
              }}
              className="hover:bg-gray-100"
              title="Chỉnh sửa"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && room.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(room);
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
  ], [handleRowClick, canUpdate, canDelete]);

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem danh sách phòng." />;
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_ROOM']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rooms Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage clinic rooms and their configurations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
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
                        { value: 'roomId', label: 'Mặc định' },
                        { value: 'roomCode', label: 'Mã phòng' },
                        { value: 'roomName', label: 'Tên phòng' },
                        { value: 'createdAt', label: 'Ngày tạo' }
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
                {rooms.filter(r => r.isActive).length}
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
                {rooms.filter(r => !r.isActive).length}
              </Badge>
            </button>
          </div>
        </div>

        {/* Table */}
        <OptimizedTable
          data={rooms}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          emptyMessage="No rooms found"
        />

        {/* Pagination - Below table, centered */}
        {totalPages > 0 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium min-w-[100px] text-center">
              Page {currentPage + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Create a new room in the system
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Room Code */}
              <div>
                <Label htmlFor="create-room-code">Room Code <span className="text-red-500">*</span></Label>
                <Input
                  id="create-room-code"
                  value={createForm.roomCode}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, roomCode: e.target.value }))}
                  placeholder="Enter room code"
                  className="mt-1"
                />
              </div>

              {/* Room Name */}
              <div>
                <Label htmlFor="create-room-name">Room Name <span className="text-red-500">*</span></Label>
                <Input
                  id="create-room-name"
                  value={createForm.roomName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, roomName: e.target.value }))}
                  placeholder="Enter room name"
                  className="mt-1"
                />
              </div>

              {/* Room Type */}
              <div>
                <Label htmlFor="create-room-type">Room Type <span className="text-red-500">*</span></Label>
                <Select
                  value={createForm.roomType}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, roomType: value as RoomType | '' }))}
                >
                  <SelectTrigger id="create-room-type" className="mt-1">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoomTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getRoomTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create-is-active"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="create-is-active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={!createForm.roomCode.trim() || !createForm.roomName.trim() || !createForm.roomType}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Room</DialogTitle>
              <DialogDescription>
                Update room information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Room Code */}
              <div>
                <Label htmlFor="update-room-code">Room Code <span className="text-red-500">*</span></Label>
                <Input
                  id="update-room-code"
                  value={updateForm.roomCode}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, roomCode: e.target.value }))}
                  placeholder="Enter room code"
                  className="mt-1"
                />
              </div>

              {/* Room Name */}
              <div>
                <Label htmlFor="update-room-name">Room Name <span className="text-red-500">*</span></Label>
                <Input
                  id="update-room-name"
                  value={updateForm.roomName}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, roomName: e.target.value }))}
                  placeholder="Enter room name"
                  className="mt-1"
                />
              </div>

              {/* Room Type */}
              <div>
                <Label htmlFor="update-room-type">Room Type <span className="text-red-500">*</span></Label>
                <Select
                  value={updateForm.roomType}
                  onValueChange={(value) => setUpdateForm(prev => ({ ...prev, roomType: value as RoomType | '' }))}
                >
                  <SelectTrigger id="update-room-type" className="mt-1">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoomTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getRoomTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="update-is-active"
                  checked={updateForm.isActive}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="update-is-active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRoom}
                disabled={!updateForm.roomCode.trim() || !updateForm.roomName.trim() || !updateForm.roomType}
              >
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Deactivate Room</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate this room?
              </DialogDescription>
            </DialogHeader>

            {selectedRoom && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <strong>Room Code:</strong> {selectedRoom.roomCode}
                  </div>
                  <div className="text-sm">
                    <strong>Room Name:</strong> {selectedRoom.roomName}
                  </div>
                  <div className="text-sm">
                    <strong>Room Type:</strong> {ROOM_TYPE_LABELS[selectedRoom.roomType] || selectedRoom.roomType}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRoom}
              >
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Room Details</DialogTitle>
              <DialogDescription>
                Detailed information about the room
              </DialogDescription>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Room Code</label>
                    <p className="text-base font-semibold">{selectedRoom.roomCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Room Name</label>
                    <p className="text-base">{selectedRoom.roomName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Room Type</label>
                    <div className="text-base">
                      <Badge variant="outline">
                        {ROOM_TYPE_LABELS[selectedRoom.roomType] || selectedRoom.roomType}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="text-base">
                      <Badge variant={selectedRoom.isActive ? 'default' : 'secondary'}>
                        {selectedRoom.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {selectedRoom.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created At</label>
                      <p className="text-base">
                        {new Date(selectedRoom.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                  {selectedRoom.updatedAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                      <p className="text-base">
                        {new Date(selectedRoom.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
                {/* TODO: Add room services compatibility section here */}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
