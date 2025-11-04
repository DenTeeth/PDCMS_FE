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
  ShiftRegistration,
  UpdateShiftRegistrationRequest,
  ShiftRegistrationQueryParams,
  DayOfWeek
} from '@/types/shiftRegistration';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';

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

  // ==================== PART-TIME REGISTRATION STATE ====================
  const [partTimeRegistrations, setPartTimeRegistrations] = useState<ShiftRegistration[]>([]);
  const [partTimeLoading, setPartTimeLoading] = useState(true);
  const [partTimeCurrentPage, setPartTimeCurrentPage] = useState(0);
  const [partTimeTotalPages, setPartTimeTotalPages] = useState(0);
  const [partTimeTotalElements, setPartTimeTotalElements] = useState(0);

  // Part-Time modals
  const [showPartTimeDetailsModal, setShowPartTimeDetailsModal] = useState(false);
  const [partTimeDetailsRegistration, setPartTimeDetailsRegistration] = useState<ShiftRegistration | null>(null);

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
      fetchPartTimeRegistrations();
    } else if (activeTab === 'fixed') {
      fetchFixedRegistrations();
      fetchDropdownData();
    }
  }, [activeTab, partTimeCurrentPage, filterEmployeeId]);

  // Part-Time Registration Fetch
  const fetchPartTimeRegistrations = async () => {
    try {
      setPartTimeLoading(true);
      const params: ShiftRegistrationQueryParams = {
        page: partTimeCurrentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      };

      const response = await shiftRegistrationService.getRegistrations(params);

      if (Array.isArray(response)) {
        setPartTimeRegistrations(response);
        setPartTimeTotalPages(1);
        setPartTimeTotalElements(response.length);
      } else {
        setPartTimeRegistrations(response.content || []);
        setPartTimeTotalPages(response.totalPages || 0);
        setPartTimeTotalElements(response.totalElements || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch part-time registrations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch part-time registrations');
    } finally {
      setPartTimeLoading(false);
    }
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
  // Check permissions for both tabs
  const canViewPartTime = hasPermission(Permission.VIEW_REGISTRATION_ALL);
  const canViewFixed = hasPermission(Permission.VIEW_FIXED_REGISTRATIONS_ALL);
  const canManageFixed = hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS);

  // If user doesn't have permission for any tab, show unauthorized
  if (!canViewPartTime && !canViewFixed) {
    return (
      <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_ALL, Permission.VIEW_FIXED_REGISTRATIONS_ALL]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-8 text-gray-500">
            You do not have permission to view registrations
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_ALL, Permission.VIEW_FIXED_REGISTRATIONS_ALL]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shift Registrations</h1>
            <p className="text-gray-600 mt-1">Manage part-time and fixed shift registrations</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (activeTab === 'part-time') fetchPartTimeRegistrations();
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
                Part-Time Registrations
              </TabsTrigger>
            )}
            {canViewFixed && (
              <TabsTrigger value="fixed">
                Fixed Shift Registrations
              </TabsTrigger>
            )}
          </TabsList>

          {/* PART-TIME REGISTRATIONS TAB */}
          {canViewPartTime && (
            <TabsContent value="part-time" className="space-y-6">
              {/* Info Card - 303v2-p1 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-blue-800">Part-Time Flex Registration (303v2-p1)</h3>
                        <Badge variant="outline" className="text-xs">Flexible Schedule</Badge>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        Hệ thống quản lý đăng ký ca linh hoạt cho nhân viên <strong>PART_TIME_FLEX</strong>.
                        Nhân viên tự đăng ký (claim) các suất làm việc có sẵn.
                      </p>
                      <div className="flex items-center gap-4 text-xs text-blue-600">
                        <Link
                          href="/admin/work-slots"
                          className="flex items-center gap-1 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Quản lý Work Slots
                        </Link>
                        <span className="text-blue-300">|</span>
                        <span>Endpoint: <code className="bg-blue-100 px-1 rounded">/api/v1/work-slots</code> & <code className="bg-blue-100 px-1 rounded">/api/v1/registrations</code></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Part-Time Registrations ({partTimeTotalElements})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {partTimeLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : partTimeRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No part-time registrations found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Registration ID</th>
                            <th className="text-left p-3 font-medium">Employee</th>
                            <th className="text-left p-3 font-medium">Day</th>
                            <th className="text-left p-3 font-medium">Effective Period</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partTimeRegistrations.map((registration) => (
                            <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono text-sm">{registration.registrationId}</td>
                              <td className="p-3">
                                <div className="font-medium">{registration.employeeName}</div>
                                <div className="text-sm text-gray-500">ID: {registration.employeeId}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{getDayOfWeekLabel(registration.dayOfWeek as DayOfWeek)}</Badge>
                              </td>
                              <td className="p-3">
                                <div className="text-sm">
                                  <div>From: {formatDate(registration.effectiveFrom)}</div>
                                  {registration.effectiveTo && (
                                    <div>To: {formatDate(registration.effectiveTo)}</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant={registration.isActive ? "default" : "secondary"}>
                                  {registration.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inactive
                                    </>
                                  )}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPartTimeDetailsRegistration(registration);
                                    setShowPartTimeDetailsModal(true);
                                  }}
                                  title="View Details"
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

                  {/* Pagination */}
                  {partTimeTotalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600">
                        Page {partTimeCurrentPage + 1} of {partTimeTotalPages} ({partTimeTotalElements} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPartTimeCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={partTimeCurrentPage === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPartTimeCurrentPage(prev => Math.min(partTimeTotalPages - 1, prev + 1))}
                          disabled={partTimeCurrentPage === partTimeTotalPages - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* FIXED REGISTRATIONS TAB */}
          {canViewFixed && (
            <TabsContent value="fixed" className="space-y-6">
              {/* Info Card - 303v2-p2 */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-green-800">Fixed Shift Registration (303v2-p2)</h3>
                        <Badge variant="outline" className="text-xs bg-green-100">Fixed Schedule</Badge>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        Hệ thống quản lý lịch cố định cho nhân viên <strong>FULL_TIME</strong> và <strong>PART_TIME_FIXED</strong>.
                        Admin/Manager gán lịch làm việc cố định cho nhân viên (VD: Ca Sáng T2-T6).
                      </p>
                      <div className="text-xs text-green-600">
                        <span>Endpoint: <code className="bg-green-100 px-1 rounded">/api/v1/fixed-registrations</code></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Header with Create Button */}
              <div className="flex justify-end">
                {canManageFixed && (
                  <Button onClick={() => setShowFixedCreateModal(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Fixed Registration
                  </Button>
                )}
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="filterEmployee">Employee</Label>
                      <select
                        id="filterEmployee"
                        value={filterEmployeeId?.toString() || ''}
                        onChange={(e) => setFilterEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.fullName} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" onClick={() => setFilterEmployeeId(null)}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fixed Registrations Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Fixed Shift Registrations ({fixedRegistrations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fixedLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : fixedRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No fixed shift registrations found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">ID</th>
                            <th className="text-left p-3 font-medium">Employee</th>
                            <th className="text-left p-3 font-medium">Work Shift</th>
                            <th className="text-left p-3 font-medium">Days</th>
                            <th className="text-left p-3 font-medium">Effective Period</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fixedRegistrations.map((registration) => (
                            <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-mono text-sm">{registration.registrationId}</td>
                              <td className="p-3">
                                <div>
                                  <div className="font-medium">{registration.employeeName}</div>
                                  <div className="text-sm text-gray-500">ID: {registration.employeeId}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div>
                                  <div className="font-medium">{registration.workShiftName}</div>
                                  <div className="text-sm text-gray-500">{registration.workShiftId}</div>
                                </div>
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
                                <Badge variant={registration.isActive ? "default" : "secondary"}>
                                  {registration.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inactive
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
                                    title="View Details"
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
        {showPartTimeDetailsModal && partTimeDetailsRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col">
              <div className="flex-shrink-0 border-b px-6 py-4">
                <h2 className="text-xl font-bold">Registration Details</h2>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                <div>
                  <Label>Registration ID</Label>
                  <Input value={partTimeDetailsRegistration.registrationId} disabled />
                </div>
                <div>
                  <Label>Employee</Label>
                  <Input value={partTimeDetailsRegistration.employeeName} disabled />
                </div>
                <div>
                  <Label>Work Shift</Label>
                  <Input value={partTimeDetailsRegistration.shiftName} disabled />
                </div>
                <div>
                  <Label>Day</Label>
                  <Input value={getDayOfWeekLabel(partTimeDetailsRegistration.dayOfWeek as DayOfWeek)} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Effective From</Label>
                    <Input value={formatDate(partTimeDetailsRegistration.effectiveFrom)} disabled />
                  </div>
                  <div>
                    <Label>Effective To</Label>
                    <Input value={partTimeDetailsRegistration.effectiveTo ? formatDate(partTimeDetailsRegistration.effectiveTo) : ''} disabled />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Input value={partTimeDetailsRegistration.isActive ? 'Active' : 'Inactive'} disabled />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPartTimeDetailsModal(false);
                    setPartTimeDetailsRegistration(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FIXED CREATE MODAL */}
        {showFixedCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex-shrink-0 border-b px-6 py-4">
                <h2 className="text-xl font-bold">Create Fixed Shift Registration</h2>
              </div>
              <form onSubmit={handleFixedCreate} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div>
                  <Label htmlFor="createEmployee">Employee *</Label>
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
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="0">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeCode}) - {emp.employeeType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="createWorkShift">Work Shift *</Label>
                  <select
                    id="createWorkShift"
                    value={fixedCreateFormData.workShiftId}
                    onChange={(e) => setFixedCreateFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Work Shift</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Days of Week *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
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
                  <div>
                    <Label htmlFor="createEffectiveFrom">Effective From *</Label>
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
                  <div>
                    <Label htmlFor="createEffectiveTo">Effective To (Optional)</Label>
                    <Input
                      id="createEffectiveTo"
                      type="date"
                      value={fixedCreateFormData.effectiveTo || ''}
                      onChange={(e) => setFixedCreateFormData(prev => ({
                        ...prev,
                        effectiveTo: e.target.value || null
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave empty for unlimited</p>
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
                    Cancel
                  </Button>
                  <Button type="submit" disabled={fixedCreating}>
                    {fixedCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Registration'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FIXED EDIT MODAL */}
        {showFixedEditModal && fixedEditingRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex-shrink-0 border-b px-6 py-4">
                <h2 className="text-xl font-bold">Edit Fixed Shift Registration</h2>
              </div>
              <form onSubmit={handleFixedUpdate} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div>
                  <Label>Registration ID</Label>
                  <Input value={fixedEditingRegistration.registrationId} disabled />
                </div>

                <div>
                  <Label>Employee</Label>
                  <Input value={fixedEditingRegistration.employeeName} disabled />
                </div>

                <div>
                  <Label htmlFor="editWorkShift">Work Shift</Label>
                  <select
                    id="editWorkShift"
                    value={fixedEditFormData.workShiftId || fixedEditingRegistration.workShiftId}
                    onChange={(e) => setFixedEditFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current: {fixedEditingRegistration.workShiftName}</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Days of Week</Label>
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
                  <div>
                    <Label htmlFor="editEffectiveFrom">Effective From</Label>
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
                  <div>
                    <Label htmlFor="editEffectiveTo">Effective To</Label>
                    <Input
                      id="editEffectiveTo"
                      type="date"
                      value={fixedEditFormData.effectiveTo !== undefined ? (fixedEditFormData.effectiveTo || '') : (fixedEditingRegistration.effectiveTo || '')}
                      onChange={(e) => setFixedEditFormData(prev => ({
                        ...prev,
                        effectiveTo: e.target.value || null
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave empty for unlimited</p>
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
                        Updating...
                      </>
                    ) : (
                      'Update Registration'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FIXED DETAILS MODAL */}
        {showFixedDetailsModal && fixedDetailsRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col">
              <div className="flex-shrink-0 border-b px-6 py-4">
                <h2 className="text-xl font-bold">Registration Details</h2>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                <div>
                  <Label>Registration ID</Label>
                  <Input value={fixedDetailsRegistration.registrationId} disabled />
                </div>
                <div>
                  <Label>Employee</Label>
                  <Input value={`${fixedDetailsRegistration.employeeName} (ID: ${fixedDetailsRegistration.employeeId})`} disabled />
                </div>
                <div>
                  <Label>Work Shift</Label>
                  <Input value={`${fixedDetailsRegistration.workShiftName} (${fixedDetailsRegistration.workShiftId})`} disabled />
                </div>
                <div>
                  <Label>Days of Week</Label>
                  <Input value={formatFixedDaysOfWeek(fixedDetailsRegistration.daysOfWeek)} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Effective From</Label>
                    <Input value={formatDate(fixedDetailsRegistration.effectiveFrom)} disabled />
                  </div>
                  <div>
                    <Label>Effective To</Label>
                    <Input value={formatDate(fixedDetailsRegistration.effectiveTo)} disabled />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Input value={fixedDetailsRegistration.isActive ? 'Active' : 'Inactive'} disabled />
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
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}


