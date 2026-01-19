'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Plus, Edit, Trash2, Eye, RotateCcw, CalendarDays, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

// Import types and services for Part-Time Registration
import {
  DayOfWeek
} from '@/types/shiftRegistration';
import { PartTimeSlot, PartTimeSlotDetailResponse } from '@/types/workSlot';
import { workSlotService } from '@/services/workSlotService';

// Import types and services for Fixed Registration
import {
  FixedShiftRegistration,
  CreateFixedRegistrationRequest,
  UpdateFixedRegistrationRequest,
  FixedRegistrationQueryParams,
  FixedRegistrationErrorCode
} from '@/types/fixedRegistration';
import { Employee, EmploymentType } from '@/types/employee';
import { WorkShift } from '@/types/workShift';
import { fixedRegistrationService } from '@/services/fixedRegistrationService';
import { workShiftService } from '@/services/workShiftService';
import { EmployeeService } from '@/services/employeeService';
import { useAuth } from '@/contexts/AuthContext';
import { canUseFixedRegistration } from '@/lib/utils';

// Day labels mapping for Fixed Registration (numbers 1-7)
const DAY_LABELS: { [key: number]: string } = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật'
};

// Day labels mapping for Part-Time Registration (DayOfWeek enum)
const getDayOfWeekLabel = (day: DayOfWeek): string => {
  const dayMap = {
    [DayOfWeek.MONDAY]: 'T2',
    [DayOfWeek.TUESDAY]: 'T3',
    [DayOfWeek.WEDNESDAY]: 'T4',
    [DayOfWeek.THURSDAY]: 'T5',
    [DayOfWeek.FRIDAY]: 'T6',
    [DayOfWeek.SATURDAY]: 'T7',
    [DayOfWeek.SUNDAY]: 'CN'
  };
  return dayMap[day] || day;
};

// ==================== MAIN COMPONENT ====================
export default function RegistrationsPage() {
  const { user, hasPermission } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'part-time' | 'fixed'>('part-time');

  // ==================== PART-TIME SLOTS STATE ====================
  const [partTimeSlots, setPartTimeSlots] = useState<PartTimeSlot[]>([]);
  const [partTimeLoading, setPartTimeLoading] = useState(true);

  // Slot detail modal state
  const [showSlotDetailsModal, setShowSlotDetailsModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PartTimeSlot | null>(null);
  const [slotDetail, setSlotDetail] = useState<PartTimeSlotDetailResponse | null>(null);
  const [loadingSlotDetail, setLoadingSlotDetail] = useState(false);

  // ==================== FIXED REGISTRATION STATE ====================
  const [fixedRegistrations, setFixedRegistrations] = useState<FixedShiftRegistration[]>([]);
  const [fixedLoading, setFixedLoading] = useState(true);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);

  // Fixed modals
  const [showFixedCreateModal, setShowFixedCreateModal] = useState(false);
  const [fixedCreating, setFixedCreating] = useState(false);
  const [fixedCreateFormData, setFixedCreateFormData] = useState<CreateFixedRegistrationRequest>({
    employeeId: 0,
    workShiftId: '',
    daysOfWeek: [],
    effectiveFrom: '',
    effectiveTo: null
  });

  const [showFixedEditModal, setShowFixedEditModal] = useState(false);
  const [fixedEditingRegistration, setFixedEditingRegistration] = useState<FixedShiftRegistration | null>(null);
  const [fixedUpdating, setFixedUpdating] = useState(false);
  const [fixedEditFormData, setFixedEditFormData] = useState<UpdateFixedRegistrationRequest>({});

  const [showFixedDetailsModal, setShowFixedDetailsModal] = useState(false);
  const [fixedDetailsRegistration, setFixedDetailsRegistration] = useState<FixedShiftRegistration | null>(null);

  const [fixedDeleting, setFixedDeleting] = useState(false);

  // Dropdown data (shared for Fixed Registration)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (activeTab === 'part-time') {
      fetchPartTimeSlots();
    } else if (activeTab === 'fixed') {
      fetchFixedRegistrations();
      fetchDropdownData();
    }
  }, [activeTab, filterEmployeeId]);

  // Part-Time Slots Fetch (Work Slots)
  const fetchPartTimeSlots = async () => {
    try {
      setPartTimeLoading(true);
      const slots = await workSlotService.getWorkSlots();
      setPartTimeSlots(slots || []);
    } catch (error: any) {
      console.error('Failed to fetch part-time slots:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch part-time slots');
    } finally {
      setPartTimeLoading(false);
    }
  };

  // Fetch slot detail with registered employees
  const fetchSlotDetail = async (slotId: number) => {
    try {
      setLoadingSlotDetail(true);
      const detail = await workSlotService.getSlotDetail(slotId);
      setSlotDetail(detail);
    } catch (error: any) {
      console.error('Failed to fetch slot detail:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to fetch slot detail');
    } finally {
      setLoadingSlotDetail(false);
    }
  };

  // Handle slot detail click
  const handleSlotDetailClick = async (slot: PartTimeSlot) => {
    setSelectedSlot(slot);
    setShowSlotDetailsModal(true);
    await fetchSlotDetail(slot.slotId);
  };

  // Fixed Registration Fetch
  const fetchFixedRegistrations = async () => {
    try {
      setFixedLoading(true);
      const params: FixedRegistrationQueryParams = {
        ...(filterEmployeeId && { employeeId: filterEmployeeId })
      };

      const response = await fixedRegistrationService.getRegistrations(params);
      setFixedRegistrations(response);
    } catch (error: any) {
      console.error('Failed to fetch fixed registrations:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch fixed shift registrations';
      toast.error(errorMessage);
    } finally {
      setFixedLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);

      // Fetch active work shifts
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);

      // Fetch employees (only FULL_TIME and PART_TIME_FIXED)
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 1000,
        isActive: true
      });

      // Filter to only employees who can use fixed registration
      const eligibleEmployees = (employeesResponse.content || []).filter(emp =>
        canUseFixedRegistration(emp.employeeType as EmploymentType)
      );
      setEmployees(eligibleEmployees);
    } catch (error: any) {
      console.error('Failed to fetch dropdown data:', error);
      toast.error('Failed to load dropdown data');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // ==================== PART-TIME REGISTRATION HANDLERS ====================
  // Part-Time only has View Details (no create/edit/delete for admin view)

  // ==================== FIXED REGISTRATION HANDLERS ====================
  const handleFixedCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS)) {
      toast.error('You do not have permission to create fixed shift registrations');
      return;
    }

    if (!fixedCreateFormData.employeeId || fixedCreateFormData.employeeId === 0) {
      toast.error('Please select an employee');
      return;
    }

    if (!fixedCreateFormData.workShiftId) {
      toast.error('Please select a work shift');
      return;
    }

    if (fixedCreateFormData.daysOfWeek.length === 0) {
      toast.error('Please select at least one day of week');
      return;
    }

    if (!fixedCreateFormData.effectiveFrom) {
      toast.error('Please select effective from date');
      return;
    }

    if (fixedCreateFormData.effectiveTo) {
      const fromDate = new Date(fixedCreateFormData.effectiveFrom);
      const toDate = new Date(fixedCreateFormData.effectiveTo);
      if (toDate <= fromDate) {
        toast.error('Effective To date must be after Effective From date');
        return;
      }
    }

    const invalidDays = fixedCreateFormData.daysOfWeek.filter(day => day < 1 || day > 7);
    if (invalidDays.length > 0) {
      toast.error(`Invalid days of week: ${invalidDays.join(', ')}. Days must be between 1 (Monday) and 7 (Sunday).`);
      return;
    }

    try {
      setFixedCreating(true);

      const payload: CreateFixedRegistrationRequest = {
        employeeId: fixedCreateFormData.employeeId,
        workShiftId: fixedCreateFormData.workShiftId,
        daysOfWeek: fixedCreateFormData.daysOfWeek.sort((a, b) => a - b),
        effectiveFrom: fixedCreateFormData.effectiveFrom,
        ...(fixedCreateFormData.effectiveTo && { effectiveTo: fixedCreateFormData.effectiveTo })
      };

      await fixedRegistrationService.createRegistration(payload);
      toast.success('Fixed shift registration created successfully');
      setShowFixedCreateModal(false);
      resetFixedCreateForm();
      await fetchFixedRegistrations();
    } catch (error: any) {
      console.error('Failed to create fixed registration:', error);

      let errorMessage = 'Failed to create fixed shift registration';

      if (error.errorCode === FixedRegistrationErrorCode.INVALID_EMPLOYEE_TYPE) {
        errorMessage = 'Employee type PART_TIME_FLEX cannot use fixed shift registration. Use part-time registration instead.';
      } else if (error.errorCode === FixedRegistrationErrorCode.DUPLICATE_FIXED_SHIFT_REGISTRATION) {
        errorMessage = 'Employee already has an active fixed shift registration for this period';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.error(errorMessage);
    } finally {
      setFixedCreating(false);
    }
  };

  const resetFixedCreateForm = () => {
    setFixedCreateFormData({
      employeeId: 0,
      workShiftId: '',
      daysOfWeek: [],
      effectiveFrom: '',
      effectiveTo: null
    });
  };

  const handleFixedEdit = (registration: FixedShiftRegistration) => {
    setFixedEditingRegistration(registration);
    setFixedEditFormData({
      workShiftId: registration.workShiftId,
      daysOfWeek: [...registration.daysOfWeek],
      effectiveFrom: registration.effectiveFrom,
      effectiveTo: registration.effectiveTo || null
    });
    setShowFixedEditModal(true);
  };

  const handleFixedUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fixedEditingRegistration) return;

    if (!hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS)) {
      toast.error('You do not have permission to update fixed shift registrations');
      return;
    }

    if (fixedEditFormData.daysOfWeek && fixedEditFormData.daysOfWeek.length > 0) {
      const invalidDays = fixedEditFormData.daysOfWeek.filter(day => day < 1 || day > 7);
      if (invalidDays.length > 0) {
        toast.error(`Invalid days of week: ${invalidDays.join(', ')}. Days must be between 1 (Monday) and 7 (Sunday).`);
        return;
      }
    }

    if (fixedEditFormData.effectiveFrom && fixedEditFormData.effectiveTo) {
      const fromDate = new Date(fixedEditFormData.effectiveFrom);
      const toDate = new Date(fixedEditFormData.effectiveTo);
      if (toDate <= fromDate) {
        toast.error('Effective To date must be after Effective From date');
        return;
      }
    }

    try {
      setFixedUpdating(true);

      const payload: UpdateFixedRegistrationRequest = {
        ...(fixedEditFormData.workShiftId && { workShiftId: fixedEditFormData.workShiftId }),
        ...(fixedEditFormData.daysOfWeek && fixedEditFormData.daysOfWeek.length > 0 && {
          daysOfWeek: fixedEditFormData.daysOfWeek.sort((a, b) => a - b)
        }),
        ...(fixedEditFormData.effectiveFrom && { effectiveFrom: fixedEditFormData.effectiveFrom }),
        effectiveTo: fixedEditFormData.effectiveTo !== undefined ? fixedEditFormData.effectiveTo : undefined
      };

      await fixedRegistrationService.updateRegistration(fixedEditingRegistration.registrationId, payload);
      toast.success('Fixed shift registration updated successfully');
      setShowFixedEditModal(false);
      setFixedEditingRegistration(null);
      await fetchFixedRegistrations();
    } catch (error: any) {
      console.error('Failed to update fixed registration:', error);

      let errorMessage = 'Failed to update fixed shift registration';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.error(errorMessage);
    } finally {
      setFixedUpdating(false);
    }
  };

  const handleFixedDelete = async (registration: FixedShiftRegistration) => {
    if (!hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS)) {
      toast.error('You do not have permission to delete fixed shift registrations');
      return;
    }

    if (!confirm(`Are you sure you want to delete fixed shift registration for ${registration.employeeName}?`)) {
      return;
    }

    try {
      setFixedDeleting(true);
      await fixedRegistrationService.deleteRegistration(registration.registrationId);
      toast.success('Fixed shift registration deleted successfully');
      await fetchFixedRegistrations();
    } catch (error: any) {
      console.error('Failed to delete fixed registration:', error);

      let errorMessage = 'Failed to delete fixed shift registration';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.error(errorMessage);
    } finally {
      setFixedDeleting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const formatFixedDaysOfWeek = (days: number[]): string => {
    return days
      .sort((a, b) => a - b)
      .map(day => DAY_LABELS[day] || `Day ${day}`)
      .join(', ');
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Vô thời hạn';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  // ==================== RENDER ====================
  // Check permissions for both tabs - Using new BE consolidated permissions
  // BE uses MANAGE_PART_TIME_REGISTRATIONS and MANAGE_FIXED_REGISTRATIONS
  const canViewPartTime = hasPermission(Permission.MANAGE_PART_TIME_REGISTRATIONS);
  const canViewFixed = hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS);
  const canManageFixed = hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS);

  // If user doesn't have permission for any tab, show unauthorized
  if (!canViewPartTime && !canViewFixed) {
    return (
      <ProtectedRoute requiredPermissions={[Permission.MANAGE_PART_TIME_REGISTRATIONS, Permission.MANAGE_FIXED_REGISTRATIONS]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-8 text-gray-500">
            You do not have permission to view registrations
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[Permission.MANAGE_PART_TIME_REGISTRATIONS, Permission.MANAGE_FIXED_REGISTRATIONS]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đăng ký ca làm</h1>
            <p className="text-gray-600 mt-1">Quản lý đăng ký ca làm bán thời gian và ca cố định</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (activeTab === 'part-time') fetchPartTimeSlots();
                else fetchFixedRegistrations();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'part-time' | 'fixed')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            {canViewPartTime && (
              <TabsTrigger value="part-time">
                Đăng ký ca làm bán thời gian
              </TabsTrigger>
            )}
            {canViewFixed && (
              <TabsTrigger value="fixed">
                Đăng ký ca làm cố định
              </TabsTrigger>
            )}
          </TabsList>

          {/* PART-TIME REGISTRATIONS TAB */}
          {canViewPartTime && (
            <TabsContent value="part-time" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Part-Time Slots ({partTimeSlots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {partTimeLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : partTimeSlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không có ca làm bán thời gian
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Slot ID</th>
                            <th className="text-left p-3 font-medium">Ca làm việc</th>
                            <th className="text-left p-3 font-medium">Ngày</th>
                            <th className="text-left p-3 font-medium">Hạn mức</th>
                            <th className="text-left p-3 font-medium">Đã đăng ký</th>
                            <th className="text-left p-3 font-medium">Trạng thái</th>
                            <th className="text-left p-3 font-medium">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partTimeSlots.map((slot) => (
                            <tr key={slot.slotId} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono text-sm">{slot.slotId}</td>
                              <td className="p-3">
                                <div className="font-medium">{slot.workShiftName}</div>
                                <div className="text-sm text-gray-500">ID: {slot.workShiftId}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{getDayOfWeekLabel(slot.dayOfWeek as DayOfWeek)}</Badge>
                              </td>
                              <td className="p-3">
                                <span className="font-medium">{slot.quota}</span>
                              </td>
                              <td className="p-3">
                                <span className={`font-medium ${slot.registered >= slot.quota ? 'text-red-600' : 'text-green-600'}`}>
                                  {slot.registered} / {slot.quota}
                                </span>
                              </td>
                              <td className="p-3">
                                <Badge variant={slot.isActive ? "active" : "inactive"}>
                                  {slot.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Hoạt động
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSlotDetailClick(slot)}
                                  title="Xem chi tiết slot"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* FIXED REGISTRATIONS TAB */}
          {canViewFixed && (
            <TabsContent value="fixed" className="space-y-6">
              {/* Header with Create Button */}
              <div className="flex justify-end">
                {canManageFixed && (
                  <Button onClick={() => setShowFixedCreateModal(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo đăng ký cố định
                  </Button>
                )}
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="filterEmployee">Nhân viên</Label>
                      <select
                        id="filterEmployee"
                        value={filterEmployeeId?.toString() || ''}
                        onChange={(e) => setFilterEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tất cả nhân viên</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.fullName} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" onClick={() => setFilterEmployeeId(null)}>
                      Xoá
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fixed Registrations Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Đăng ký ca làm cố định ({fixedRegistrations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fixedLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : fixedRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không tìm thấy đăng ký ca cố định
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Nhân viên</th>
                            <th className="text-left p-3 font-medium">Ca làm việc</th>
                            <th className="text-left p-3 font-medium">Ngày</th>
                            <th className="text-left p-3 font-medium">Thời gian hiệu lực</th>
                            <th className="text-left p-3 font-medium">Trạng thái</th>
                            <th className="text-left p-3 font-medium">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fixedRegistrations.map((registration) => (
                            <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-medium">{registration.employeeName}</div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-medium">{registration.workShiftName}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">
                                  {formatFixedDaysOfWeek(registration.daysOfWeek)}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <div>From: {formatDate(registration.effectiveFrom)}</div>
                                <div>To: {formatDate(registration.effectiveTo)}</div>
                              </td>
                              <td className="p-3">
                                <Badge className={registration.isActive ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-800"}>
                                  {registration.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Hoạt động
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
                                    onClick={() => {
                                      setFixedDetailsRegistration(registration);
                                      setShowFixedDetailsModal(true);
                                    }}
                                    title="Xem chi tiết"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canManageFixed && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFixedEdit(registration)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFixedDelete(registration)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* PART-TIME DETAILS MODAL */}
        {/* SLOT DETAILS MODAL */}
        {showSlotDetailsModal && selectedSlot && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Slot Details</h2>

              {loadingSlotDetail ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : slotDetail ? (
                <>
                  {/* Slot Information */}
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Thông tin slot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Slot ID</Label>
                          <Input value={slotDetail.slotId} disabled />
                        </div>
                        <div>
                          <Label>Ca làm việc</Label>
                          <Input value={slotDetail.workShiftName} disabled />
                          <div className="text-sm text-gray-500 mt-1">ID: {slotDetail.workShiftId}</div>
                        </div>
                        <div>
                          <Label>Ngày trong tuần</Label>
                          <Input value={getDayOfWeekLabel(slotDetail.dayOfWeek as DayOfWeek)} disabled />
                        </div>
                        <div>
                          <Label>Trạng thái</Label>
                          <Input value={slotDetail.isActive ? 'Đang hoạt động' : 'Không hoạt động'} disabled />
                        </div>
                        <div>
                          <Label>Hạn mức</Label>
                          <Input value={slotDetail.quota} disabled />
                        </div>
                        <div>
                          <Label>Đã đăng ký</Label>
                          <Input value={`${slotDetail.registered} / ${slotDetail.quota}`} disabled />
                        </div>
                        <div>
                          <Label>Còn lại</Label>
                          <Input value={slotDetail.quota - slotDetail.registered} disabled />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Employees who claimed this slot */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Nhân viên đã đăng ký slot này ({slotDetail.registeredEmployees.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {slotDetail.registeredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Chưa có nhân viên nào đăng ký slot này.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-3 font-medium">Nhân viên</th>
                                <th className="text-left p-3 font-medium">Mã nhân viên</th>
                                <th className="text-left p-3 font-medium">Hiệu lực từ</th>
                                <th className="text-left p-3 font-medium">Hiệu lực đến</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slotDetail.registeredEmployees.map((employee, index) => (
                                <tr key={`${employee.employeeId}-${index}`} className="border-b hover:bg-gray-50">
                                  <td className="p-3">
                                    <div className="font-medium">{employee.employeeName}</div>
                                    <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono text-sm">{employee.employeeCode}</span>
                                  </td>
                                  <td className="p-3 text-sm">{formatDate(employee.effectiveFrom)}</td>
                                  <td className="p-3 text-sm">{employee.effectiveTo ? formatDate(employee.effectiveTo) : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không thể tải thông tin slot.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSlotDetailsModal(false);
                    setSelectedSlot(null);
                    setSlotDetail(null);
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FIXED CREATE MODAL */}
        {showFixedCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Tạo đăng ký ca cố định</h2>
              <form onSubmit={handleFixedCreate} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="createEmployee">Nhân viên <span className="text-red-500">*</span></Label>
                  <select
                    id="createEmployee"
                    value={fixedCreateFormData.employeeId}
                    onChange={(e) => {
                      const selectedEmp = employees.find(emp => emp.employeeId === e.target.value);
                      if (selectedEmp && !canUseFixedRegistration(selectedEmp.employeeType as EmploymentType)) {
                        toast.error('Selected employee cannot use fixed shift registration. Use part-time registration instead.');
                        return;
                      }
                      setFixedCreateFormData(prev => ({
                        ...prev,
                        employeeId: e.target.value ? parseInt(e.target.value) : 0
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="0">Chọn nhân viên</option>
                    {employees.map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeCode}) - {emp.employeeType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="createWorkShift">Ca làm việc <span className="text-red-500">*</span></Label>
                  <select
                    id="createWorkShift"
                    value={fixedCreateFormData.workShiftId}
                    onChange={(e) => setFixedCreateFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Ca làm việc</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Days of Week <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6].map(day => (
                      <label key={day} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fixedCreateFormData.daysOfWeek.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFixedCreateFormData(prev => ({
                                ...prev,
                                daysOfWeek: [...prev.daysOfWeek, day]
                              }));
                            } else {
                              setFixedCreateFormData(prev => ({
                                ...prev,
                                daysOfWeek: prev.daysOfWeek.filter(d => d !== day)
                              }));
                            }
                          }}
                        />
                        <span>{DAY_LABELS[day]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="createEffectiveFrom"> Hiệu lực từ <span className="text-red-500">*</span></Label>
                    <Input
                      id="createEffectiveFrom"
                      type="date"
                      value={fixedCreateFormData.effectiveFrom}
                      onChange={(e) => setFixedCreateFormData(prev => ({
                        ...prev,
                        effectiveFrom: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="createEffectiveTo">Hiệu lực đến (Tùy chọn)</Label>
                    <Input
                      id="createEffectiveTo"
                      type="date"
                      value={fixedCreateFormData.effectiveTo || ''}
                      onChange={(e) => setFixedCreateFormData(prev => ({
                        ...prev,
                        effectiveTo: e.target.value || null
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowFixedCreateModal(false);
                      resetFixedCreateForm();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={fixedCreating}>
                    {fixedCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo đăng ký'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FIXED EDIT MODAL */}
        {showFixedEditModal && fixedEditingRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Chỉnh sửa đăng ký ca cố định</h2>
              <form onSubmit={handleFixedUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label>ID</Label>
                  <Input value={fixedEditingRegistration.registrationId} disabled />
                </div>

                <div className="space-y-1">
                  <Label>Nhân viên</Label>
                  <Input value={fixedEditingRegistration.employeeName} disabled />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editWorkShift">Ca làm</Label>
                  <select
                    id="editWorkShift"
                    value={fixedEditFormData.workShiftId || fixedEditingRegistration.workShiftId}
                    onChange={(e) => setFixedEditFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Giữ nguyên: {fixedEditingRegistration.workShiftName}</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Ngày trong tuần</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => {
                      const currentDays = fixedEditFormData.daysOfWeek || fixedEditingRegistration.daysOfWeek;
                      return (
                        <label key={day} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentDays.includes(day)}
                            onChange={(e) => {
                              const currentDaysArray = fixedEditFormData.daysOfWeek || fixedEditingRegistration.daysOfWeek;
                              if (e.target.checked) {
                                setFixedEditFormData(prev => ({
                                  ...prev,
                                  daysOfWeek: [...currentDaysArray, day]
                                }));
                              } else {
                                setFixedEditFormData(prev => ({
                                  ...prev,
                                  daysOfWeek: currentDaysArray.filter(d => d !== day)
                                }));
                              }
                            }}
                          />
                          <span>{DAY_LABELS[day]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="editEffectiveFrom">Hiệu lực từ</Label>
                    <Input
                      id="editEffectiveFrom"
                      type="date"
                      value={fixedEditFormData.effectiveFrom || fixedEditingRegistration.effectiveFrom}
                      onChange={(e) => setFixedEditFormData(prev => ({
                        ...prev,
                        effectiveFrom: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editEffectiveTo">Hiệu lực đến</Label>
                    <Input
                      id="editEffectiveTo"
                      type="date"
                      value={fixedEditFormData.effectiveTo !== undefined ? (fixedEditFormData.effectiveTo || '') : (fixedEditingRegistration.effectiveTo || '')}
                      onChange={(e) => setFixedEditFormData(prev => ({
                        ...prev,
                        effectiveTo: e.target.value || null
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowFixedEditModal(false);
                      setFixedEditingRegistration(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={fixedUpdating}>
                    {fixedUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật đăng ký'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FIXED DETAILS MODAL */}
        {showFixedDetailsModal && fixedDetailsRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Chi tiết đăng ký</h2>
              <div className="space-y-3">
                <div>
                  <Label>ID đăng ký</Label>
                  <Input value={fixedDetailsRegistration.registrationId} disabled />
                </div>
                <div>
                  <Label>Nhân viên</Label>
                  <Input value={`${fixedDetailsRegistration.employeeName} (ID: ${fixedDetailsRegistration.employeeId})`} disabled />
                </div>
                <div>
                  <Label>Ca làm việc</Label>
                  <Input value={`${fixedDetailsRegistration.workShiftName} (${fixedDetailsRegistration.workShiftId})`} disabled />
                </div>
                <div>
                  <Label>Ngày trong tuần</Label>
                  <Input value={formatFixedDaysOfWeek(fixedDetailsRegistration.daysOfWeek)} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hiệu lực từ</Label>
                    <Input value={formatDate(fixedDetailsRegistration.effectiveFrom)} disabled />
                  </div>
                  <div>
                    <Label>Hiệu lực đến</Label>
                    <Input value={formatDate(fixedDetailsRegistration.effectiveTo)} disabled />
                  </div>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <Input value={fixedDetailsRegistration.isActive ? 'Đang hoạt động' : 'Không hoạt động'} disabled />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFixedDetailsModal(false);
                    setFixedDetailsRegistration(null);
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


