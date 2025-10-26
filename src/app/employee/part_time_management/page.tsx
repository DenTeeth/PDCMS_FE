'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  CalendarDays,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Import types and services
import { 
  ShiftRegistration, 
  CreateShiftRegistrationRequest,
  UpdateShiftRegistrationRequest,
  DayOfWeek 
} from '@/types/shiftRegistration';
import { WorkShift } from '@/types/workShift';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { workShiftService } from '@/services/workShiftService';

export default function EmployeePartTimeManagementPage() {
  const { user } = useAuth();
  
  // State management
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateShiftRegistrationRequest>({
    employeeId: 0,
    workShiftId: '',
    daysOfWeek: [],
    effectiveFrom: '',
    effectiveTo: ''
  });

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<ShiftRegistration | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateShiftRegistrationRequest>({});

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRegistration, setDeletingRegistration] = useState<ShiftRegistration | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dropdown data
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);

  // Load data
  useEffect(() => {
    // Tạm bỏ check user để test API
    setCreateFormData(prev => ({
      ...prev,
      employeeId: parseInt(user?.employeeId || '6') // Hardcode employeeId = 6 để test
    }));
    fetchMyRegistrations();
    fetchWorkShifts();
  }, [user, currentPage]);

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching registrations...', { currentPage });
      
      const response = await shiftRegistrationService.getMyRegistrations({
        page: currentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      });
      
      console.log('✅ Registrations response:', response);
      setRegistrations(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('❌ Failed to fetch my registrations:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.detail || 'Failed to fetch your shift registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkShifts = async () => {
    try {
      setLoadingWorkShifts(true);
      console.log('🔍 Fetching work shifts...');
      
      const shiftsResponse = await workShiftService.getAll(true);
      console.log('✅ Work shifts response:', shiftsResponse);
      
      setWorkShifts(shiftsResponse || []);
      
      if (!shiftsResponse || shiftsResponse.length === 0) {
        console.log('⚠️ No work shifts found');
        toast.warning('No work shifts available. Please contact admin to create work shifts.');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch work shifts:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to load work shifts: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingWorkShifts(false);
    }
  };

  // Create registration
  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.workShiftId || createFormData.daysOfWeek.length === 0 || !createFormData.effectiveFrom) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      console.log('🔍 Creating registration with data:', createFormData);
      
      await shiftRegistrationService.createRegistration(createFormData);
      console.log('✅ Registration created successfully');
      
      toast.success('Shift registration created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        employeeId: parseInt(user?.employeeId || '6'),
        workShiftId: '',
        daysOfWeek: [],
        effectiveFrom: '',
        effectiveTo: ''
      });
      fetchMyRegistrations();
    } catch (error: any) {
      console.error('❌ Failed to create registration:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.detail || 'Failed to create shift registration');
    } finally {
      setCreating(false);
    }
  };

  // Update registration
  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRegistration) return;

    try {
      setUpdating(true);
      await shiftRegistrationService.updateRegistration(editingRegistration.registrationId, editFormData);
      toast.success('Shift registration updated successfully');
      setShowEditModal(false);
      setEditingRegistration(null);
      setEditFormData({});
      fetchMyRegistrations();
    } catch (error: any) {
      console.error('Failed to update registration:', error);
      toast.error(error.response?.data?.detail || 'Failed to update shift registration');
    } finally {
      setUpdating(false);
    }
  };

  // Delete registration
  const handleDeleteRegistration = async () => {
    if (!deletingRegistration) return;

    try {
      setDeleting(true);
      await shiftRegistrationService.deleteRegistration(deletingRegistration.registrationId);
      toast.success('Shift registration deleted successfully');
      setShowDeleteModal(false);
      setDeletingRegistration(null);
      fetchMyRegistrations();
    } catch (error: any) {
      console.error('Failed to delete registration:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete shift registration');
    } finally {
      setDeleting(false);
    }
  };

  // Open edit modal
  const openEditModal = (registration: ShiftRegistration) => {
    setEditingRegistration(registration);
    setEditFormData({
      workShiftId: registration.slotId,
      daysOfWeek: registration.daysOfWeek,
      effectiveFrom: registration.effectiveFrom,
      effectiveTo: registration.effectiveTo || '',
      isActive: registration.active
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (registration: ShiftRegistration) => {
    setDeletingRegistration(registration);
    setShowDeleteModal(true);
  };

  // Get work shift name
  const getWorkShiftName = (slotId: string) => {
    const workShift = workShifts.find(ws => ws.workShiftId === slotId);
    return workShift ? workShift.shiftName : slotId;
  };

  // Get work shift time
  const getWorkShiftTime = (slotId: string) => {
    const workShift = workShifts.find(ws => ws.workShiftId === slotId);
    return workShift ? `${workShift.startTime} - ${workShift.endTime}` : '';
  };

  // Get day name in Vietnamese
  const getDayName = (day: DayOfWeek) => {
    const dayMap: Record<DayOfWeek, string> = {
      'MONDAY': 'Thứ 2',
      'TUESDAY': 'Thứ 3',
      'WEDNESDAY': 'Thứ 4',
      'THURSDAY': 'Thứ 5',
      'FRIDAY': 'Thứ 6',
      'SATURDAY': 'Thứ 7',
      'SUNDAY': 'Chủ nhật'
    };
    return dayMap[day] || day;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đăng Ký Ca Làm Việc</h1>
            <p className="text-gray-600 mt-1">
              Quản lý đăng ký ca làm việc của bạn
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={loadingWorkShifts}
          >
            <Plus className="h-4 w-4 mr-2" />
            Đăng Ký Ca Mới
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Thông tin đăng ký ca làm việc</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Bạn có thể đăng ký ca làm việc cho các ngày trong tuần. 
                  Hệ thống sẽ tự động tạo lịch làm việc dựa trên đăng ký của bạn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <span>Danh sách đăng ký ca làm việc ({totalElements})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đăng ký ca làm việc</h3>
                <p className="text-gray-600 mb-4">
                  Bạn chưa có đăng ký ca làm việc nào. Hãy tạo đăng ký mới để bắt đầu.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  disabled={loadingWorkShifts}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Đăng ký ca làm việc
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((registration) => (
                  <div
                    key={registration.registrationId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getWorkShiftName(registration.slotId)}
                          </h3>
                          <Badge className={registration.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            <div className="flex items-center space-x-1">
                              {registration.active ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{registration.active ? 'Hoạt động' : 'Tạm dừng'}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Từ: {format(parseISO(registration.effectiveFrom), 'dd/MM/yyyy', { locale: vi })}
                              {registration.effectiveTo && (
                                <> đến: {format(parseISO(registration.effectiveTo), 'dd/MM/yyyy', { locale: vi })}</>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{getWorkShiftTime(registration.slotId)}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Ngày:</span>
                            <span>{registration.daysOfWeek.map(day => getDayName(day)).join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(registration)}
                        >
                          <Edit className="h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(registration)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Hiển thị {currentPage * 10 + 1} - {Math.min((currentPage + 1) * 10, totalElements)} trong {totalElements} đăng ký
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Đăng Ký Ca Làm Việc Mới</h2>
              <form onSubmit={handleCreateRegistration} className="space-y-4">
                <div>
                  <Label htmlFor="createWorkShift">Ca Làm Việc *</Label>
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
                    <option value="">Chọn ca làm việc</option>
                    {workShifts.length === 0 ? (
                      <option value="" disabled>Không có ca làm việc</option>
                    ) : (
                      workShifts.map(shift => (
                        <option key={shift.workShiftId} value={shift.workShiftId}>
                          {shift.shiftName} ({shift.startTime}-{shift.endTime}) - {shift.category}
                        </option>
                      ))
                    )}
                  </select>
                  {workShifts.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Không có ca làm việc. Vui lòng liên hệ admin để tạo ca làm việc.
                    </p>
                  )}
                </div>

                <div>
                  <Label>Ngày Trong Tuần *</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as DayOfWeek[]).map(day => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createFormData.daysOfWeek.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateFormData(prev => ({
                                ...prev,
                                daysOfWeek: [...prev.daysOfWeek, day]
                              }));
                            } else {
                              setCreateFormData(prev => ({
                                ...prev,
                                daysOfWeek: prev.daysOfWeek.filter(d => d !== day)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{getDayName(day)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="createEffectiveFrom">Ngày Bắt Đầu *</Label>
                  <Input
                    id="createEffectiveFrom"
                    type="date"
                    value={createFormData.effectiveFrom}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      effectiveFrom: e.target.value
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Phải là ngày hôm nay hoặc tương lai</p>
                </div>

                <div>
                  <Label htmlFor="createEffectiveTo">Ngày Kết Thúc (Tùy chọn)</Label>
                  <Input
                    id="createEffectiveTo"
                    type="date"
                    value={createFormData.effectiveTo}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      effectiveTo: e.target.value
                    }))}
                    min={createFormData.effectiveFrom || new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-gray-500 mt-1">Để trống nếu đăng ký không giới hạn thời gian</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || loadingWorkShifts}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang tạo...
                      </>
                    ) : (
                      'Đăng ký'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Chỉnh Sửa Đăng Ký Ca Làm Việc</h2>
              <form onSubmit={handleUpdateRegistration} className="space-y-4">
                <div>
                  <Label htmlFor="editWorkShift">Ca Làm Việc *</Label>
                  <select
                    id="editWorkShift"
                    value={editFormData.workShiftId || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn ca làm việc</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime}-{shift.endTime}) - {shift.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Ngày Trong Tuần *</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as DayOfWeek[]).map(day => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={(editFormData.daysOfWeek || []).includes(day)}
                          onChange={(e) => {
                            const currentDays = editFormData.daysOfWeek || [];
                            if (e.target.checked) {
                              setEditFormData(prev => ({
                                ...prev,
                                daysOfWeek: [...currentDays, day]
                              }));
                            } else {
                              setEditFormData(prev => ({
                                ...prev,
                                daysOfWeek: currentDays.filter(d => d !== day)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{getDayName(day)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="editEffectiveFrom">Ngày Bắt Đầu *</Label>
                  <Input
                    id="editEffectiveFrom"
                    type="date"
                    value={editFormData.effectiveFrom || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      effectiveFrom: e.target.value
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editEffectiveTo">Ngày Kết Thúc</Label>
                  <Input
                    id="editEffectiveTo"
                    type="date"
                    value={editFormData.effectiveTo || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      effectiveTo: e.target.value
                    }))}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && deletingRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Xác Nhận Xóa</h2>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa đăng ký ca làm việc này không? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleDeleteRegistration}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}