'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useCommonPermissions } from '@/hooks/usePermissions';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { workShiftService } from '@/services/workShiftService';
import {
  WorkShift,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  WorkShiftCategory,
} from '@/types/workShift';

// Custom Time Picker Component
interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  required?: boolean;
}

function TimePicker({ value, onChange, placeholder, required }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.substring(0, 5).split(':');
      setHour(h || '08');
      setMinute(m || '00');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Chỉ từ 8h đến 21h
  const hours = Array.from({ length: 14 }, (_, i) => (i + 8).toString().padStart(2, '0'));
  // Nếu chọn 21h thì chỉ cho phép 00 phút, các giờ khác cho phép 00, 15, 30, 45
  const getAvailableMinutes = (selectedHour: string) => {
    return selectedHour === '21' ? ['00'] : ['00', '15', '30', '45'];
  };

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    // Nếu chọn 21h thì tự động set 00 phút và đóng picker luôn
    if (newHour === '21') {
      setMinute('00');
      onChange(`${newHour}:00`);
      setIsOpen(false);
    } else if (minute !== '00') {
      // Các giờ khác, giữ nguyên phút đã chọn nếu có
      setMinute(minute);
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    onChange(`${hour}:${newMinute}`);
    setIsOpen(false); // Chỉ đóng khi chọn phút
  };

  const displayValue = value ? value.substring(0, 5) : placeholder || '--:--';

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-[#8b5fbf] transition-colors bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="h-4 w-4 text-[#8b5fbf]" />
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8b5fbf] ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_0_0_3px_rgba(139,95,191,0.3),0_10px_40px_rgba(0,0,0,0.15)] z-50 p-3 border-0">
          <div className="flex gap-3">
            {/* Hour Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-[#8b5fbf] mb-2 text-center uppercase tracking-wide">Giờ</label>
              <div className="h-40 w-16 overflow-y-auto rounded-lg shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8b5fbf] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#7a4fb0]">
                {hours.map((h) => (
                  <div
                    key={h}
                    className={`px-2 py-1.5 text-sm text-center cursor-pointer transition-all duration-200 font-medium ${h === hour ? 'bg-[#8b5fbf] text-white shadow-[0_2px_8px_rgba(139,95,191,0.4)] rounded-md mx-1 my-0.5 scale-105' : 'text-gray-700 hover:bg-[#f3f0ff] hover:shadow-sm'
                      }`}
                    onClick={() => handleHourChange(h)}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center text-xl font-bold text-[#8b5fbf]/30">:</div>

            {/* Minute Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-[#8b5fbf] mb-2 text-center uppercase tracking-wide">Phút</label>
              <div className="h-40 w-16 overflow-y-auto rounded-lg shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8b5fbf] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#7a4fb0]">
                {getAvailableMinutes(hour).map((m) => (
                  <div
                    key={m}
                    className={`px-2 py-1.5 text-sm text-center cursor-pointer transition-all duration-200 font-medium ${m === minute ? 'bg-[#8b5fbf] text-white shadow-[0_2px_8px_rgba(139,95,191,0.4)] rounded-md mx-1 my-0.5 scale-105' : 'text-gray-700 hover:bg-[#f3f0ff] hover:shadow-sm'
                      }`}
                    onClick={() => handleMinuteChange(m)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkShiftsPage() {

  // Fix: Explicitly get user from useAuth to avoid 'user is not defined' error

  const { user } = useAuth();
  // Debug quyền admin
  console.log('[DEBUG] user:', user);
  if (user) {
    console.log('[DEBUG] roles:', user.roles, 'baseRole:', user.baseRole, 'permissions:', user.permissions);
  }

  // Permission check mới: dùng VIEW_SCHEDULE_ALL để xem, MANAGE_WORK_SHIFTS để quản lý
  const canView = user?.permissions?.includes('VIEW_SCHEDULE_ALL') || false;
  const canManage = user?.permissions?.includes('MANAGE_WORK_SHIFTS') || false;
  const canCreate = canManage;
  const canUpdate = canManage;
  const canDelete = canManage;

  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state - phân trang theo trạng thái
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  // Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'time' | 'duration' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<WorkShift | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateWorkShiftRequest>({
    shiftName: '',
    startTime: '',
    endTime: '',
    category: 'NORMAL',
  });

  const [editFormData, setEditFormData] = useState<UpdateWorkShiftRequest>({});

  // ==================== LOCK BODY SCROLL WHEN MODAL OPEN ====================
  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen || isDeleteModalOpen || isReactivateModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCreateModalOpen, isEditModalOpen, isDeleteModalOpen, isReactivateModalOpen]);

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

  const fetchWorkShifts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Starting to fetch work shifts...');
      console.log('👤 Current user:', {
        baseRole: user?.baseRole,
        roles: user?.roles,
        permissions: user?.permissions,
        baseRole: user?.baseRole
      });

      const data = await workShiftService.getAll(); // Lấy tất cả ca làm việc (cả active và inactive) để phân loại theo tab
      console.log('✅ Work shifts fetched successfully:', data.length, 'items');
      setWorkShifts(data);
      if (data.length === 0) {
        console.warn('⚠️ No work shifts found. This might be expected if no shifts have been created yet.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching work shifts:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      // Enhanced error message for 403
      if (err.response?.status === 403) {
        console.error('🚫 403 Forbidden - Permission denied');
        console.error('Required permissions might be: VIEW_WORK_SHIFT, MANAGE_WORK_SHIFTS, or VIEW_SCHEDULE_ALL');
        console.error('User permissions:', user?.permissions);
        setError('Bạn không có quyền xem danh sách ca làm. Vui lòng liên hệ admin để được cấp quyền.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách ca làm';
        setError(errorMessage);
      }
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

  // Reactivate handlers
  const openReactivateModal = (shift: WorkShift) => {
    setSelectedShift(shift);
    setIsReactivateModalOpen(true);
  };

  const handleReactivate = async () => {
    if (!selectedShift) return;

    try {
      await workShiftService.reactivate(selectedShift.workShiftId);
      setIsReactivateModalOpen(false);
      fetchWorkShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể kích hoạt lại ca làm');
    }
  };

  // Helper functions
  const getCategoryBadge = (category: WorkShiftCategory) => {
    return category === 'NORMAL' ? (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ca thường</Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Ca đêm</Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-600 text-white">Đang hoạt động</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white">Không hoạt động</Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  // Filter & Sort functions
  const filteredAndSortedShifts = () => {
    let filtered = workShifts;

    // Filter by active tab (trạng thái)
    filtered = filtered.filter(shift =>
      activeTab === 'active' ? shift.isActive : !shift.isActive
    );

    // Filter by search query (tên ca > ID > thời gian)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shift =>
        shift.shiftName.toLowerCase().includes(query) ||
        shift.workShiftId.toLowerCase().includes(query) ||
        formatTime(shift.startTime).includes(query) ||
        formatTime(shift.endTime).includes(query)
      );
    }

    // Sort - chỉ sort nếu đã chọn sortBy
    if (sortBy) {
      filtered.sort((a, b) => {
        let compareResult = 0;

        switch (sortBy) {
          case 'name':
            compareResult = a.shiftName.localeCompare(b.shiftName);
            break;
          case 'time':
            compareResult = a.startTime.localeCompare(b.startTime);
            break;
          case 'duration':
            compareResult = a.durationHours - b.durationHours;
            break;
        }

        return sortOrder === 'asc' ? compareResult : -compareResult;
      });
    }

    return filtered;
  };

  const displayedShifts = filteredAndSortedShifts();

  const getSortLabel = () => {
    if (!sortBy) return 'Sắp xếp';
    const labels = {
      name: 'Tên',
      time: 'Thời gian',
      duration: 'Số giờ'
    };
    return labels[sortBy];
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
    inactive: workShifts.filter(s => !s.isActive).length,
    normal: workShifts.filter(s => s.category === 'NORMAL').length,
    night: workShifts.filter(s => s.category === 'NIGHT').length,
  };

  return (
    <ProtectedRoute
      requiredBaseRole="admin"
      requiredPermissions={['MANAGE_WORK_SHIFTS']}
      requireAll={false}
    >
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý ca làm</h1>
            <p className="text-sm text-gray-600 mt-1">Xem và quản lý ca làm việc của nhân viên</p>
          </div>

          {/* Create Button */}
          <Button
            onClick={openCreateModal}
            className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
            disabled={!canCreate}
            title={!canCreate ? "Bạn không có quyền tạo ca làm" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo ca làm
          </Button>
        </div>

        {/* Stats Cards Grid - Color-coded borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Tổng số ca */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số ca</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          {/* Hoạt động */}
          <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">Hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-green-700" />
              </div>
              <p className="text-3xl font-bold text-green-800">{stats.active}</p>
            </div>
          </div>

          {/* Ca thường */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Ca thường</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-700" />
              </div>
              <p className="text-3xl font-bold text-blue-800">{stats.normal}</p>
            </div>
          </div>

          {/* Ca đêm */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-purple-800 mb-2">Ca đêm</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-purple-700" />
              </div>
              <p className="text-3xl font-bold text-purple-800">{stats.night}</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search + Sort */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col gap-3">
            {/* Search + Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search Box */}
              <div className="w-full sm:flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên ca, ID, thời gian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''
                      }`} />
                  </button>

                  {isSortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden">
                      <div className="p-2">
                        {[
                          { value: null, label: 'Mặc định' },
                          { value: 'name', label: 'Tên' },
                          { value: 'time', label: 'Thời gian' },
                          { value: 'duration', label: 'Số giờ' }
                        ].map((option) => (
                          <button
                            key={option.value || 'default'}
                            onClick={() => {
                              setSortBy(option.value as 'name' | 'time' | 'duration' | null);
                              setSortOrder('asc');
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

            {/* Status Filter Tabs */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'active'
                  ? 'bg-green-600 text-white shadow-[0_2px_8px_rgba(22,163,74,0.4)]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === 'active' ? 'bg-white/20' : 'bg-green-200'
                  }`}>
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="hidden sm:inline">Hoạt động</span>
                <Badge className={`text-xs ${activeTab === 'active'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-green-100 text-green-800'
                  }`}>
                  {stats.active}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab('inactive')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'inactive'
                  ? 'bg-gray-600 text-white shadow-[0_2px_8px_rgba(107,114,128,0.4)]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === 'inactive' ? 'bg-white/20' : 'bg-gray-300'
                  }`}>
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="hidden sm:inline">Không hoạt động</span>
                <Badge className={`text-xs ${activeTab === 'inactive'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-gray-200 text-gray-700'
                  }`}>
                  {stats.inactive}
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Table - No Card wrapper */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {displayedShifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên ca làm
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Số giờ
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Loại ca
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Trạng thái
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedShifts.map((shift) => (
                    <tr key={shift.workShiftId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 flex items-center justify-center bg-blue-100 rounded-full">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {shift.shiftName}
                            </div>
                            <div className="text-xs text-gray-500">{shift.workShiftId}</div>
                            {/* Show badges on mobile below name */}
                            <div className="flex gap-1 mt-1 md:hidden">
                              {getCategoryBadge(shift.category)}
                              {getStatusBadge(shift.isActive)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                        {/* Show duration on mobile below time */}
                        <div className="text-xs text-gray-500 sm:hidden">
                          {shift.durationHours} giờ
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900">{shift.durationHours} giờ</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {getCategoryBadge(shift.category)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {getStatusBadge(shift.isActive)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {shift.isActive ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(shift)}
                                disabled={!canUpdate}
                                title={!canUpdate ? "Bạn không có quyền cập nhật ca làm" : "Cập nhật ca làm"}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(shift)}
                                disabled={!canDelete}
                                title={!canDelete ? "Bạn không có quyền xóa ca làm" : "Xóa ca làm"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReactivateModal(shift)}
                              className="hover:bg-green-50 text-green-600"
                              disabled={!canUpdate}
                              title={!canUpdate ? "Bạn không có quyền kích hoạt lại ca làm" : "Kích hoạt lại"}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12">
              <div className="text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="h-8 w-8 text-gray-400" /> : <Clock className="h-8 w-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có ca làm nào'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? `Không có ca làm nào phù hợp với "${searchQuery}"`
                    : 'Bắt đầu bằng cách tạo ca làm đầu tiên'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateModal} className="bg-[#8b5fbf] hover:bg-[#7a4fa8]">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo ca làm đầu tiên
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CREATE MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e2e8f0]">
              <CardHeader className="border-b flex-shrink-0 pb-4">
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
              <CardContent className="overflow-y-auto flex-1 pt-6">
                <form onSubmit={handleCreateSubmit}>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="shiftName" className="mb-2 block">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime" className="mb-2 block">
                          Giờ bắt đầu <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                          value={formData.startTime}
                          onChange={(time) => setFormData({ ...formData, startTime: time })}
                          placeholder="--:--"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="endTime" className="mb-2 block">
                          Giờ kết thúc <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                          value={formData.endTime}
                          onChange={(time) => setFormData({ ...formData, endTime: time })}
                          placeholder="--:--"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900/70 mb-2">
                        Lưu ý khi tạo ca làm:
                      </h4>
                      <ul className="text-sm text-blue-800/60 space-y-1">
                        <li>• Thời lượng ca làm: tối thiểu 3 giờ, tối đa 8 giờ</li>
                        <li>• Giờ làm việc: từ 08:00 đến 21:00</li>
                        <li>• Ca đêm: bắt đầu sau 18:00</li>
                        <li>• Ca cả ngày 08:00-17:00 được tính 8 giờ (trừ 1 giờ nghỉ trưa)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Hủy
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto bg-[#8b5fbf] hover:bg-[#7a4fb0]">
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e2e8f0]">
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
                      <Label htmlFor="editShiftName">
                        Tên ca làm <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="editShiftName"
                        value={editFormData.shiftName || ''}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, shiftName: e.target.value })
                        }
                        placeholder="Ví dụ: Ca sáng (4 tiếng)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="editStartTime">
                          Giờ bắt đầu <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                          value={editFormData.startTime || ''}
                          onChange={(time) => setEditFormData({ ...editFormData, startTime: time })}
                          placeholder="--:--"
                        />
                      </div>

                      <div>
                        <Label htmlFor="editEndTime">
                          Giờ kết thúc <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                          value={editFormData.endTime || ''}
                          onChange={(time) => setEditFormData({ ...editFormData, endTime: time })}
                          placeholder="--:--"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900/70 mb-2">
                        Lưu ý khi cập nhật ca làm:
                      </h4>
                      <ul className="text-sm text-blue-800/60 space-y-1">
                        <li>• Thời lượng ca làm: tối thiểu 3 giờ, tối đa 8 giờ</li>
                        <li>• Giờ làm việc: từ 08:00 đến 21:00</li>
                        <li>• Ca đêm: bắt đầu sau 18:00</li>
                        <li>• Ca cả ngày 08:00-17:00 được tính 8 giờ (trừ 1 giờ nghỉ trưa)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Hủy
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto bg-[#8b5fbf] hover:bg-[#7a4fb0]">
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e2e8f0]">
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

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                  >
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== REACTIVATE MODAL ==================== */}
        {isReactivateModalOpen && selectedShift && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e2e8f0]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <RotateCcw className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Xác nhận kích hoạt lại</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Bạn có chắc chắn muốn kích hoạt lại ca làm{' '}
                  <span className="font-semibold">{selectedShift.shiftName}</span>?
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Ca làm sẽ được kích hoạt và có thể sử dụng lại.
                </p>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsReactivateModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleReactivate}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                  >
                    Kích hoạt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
