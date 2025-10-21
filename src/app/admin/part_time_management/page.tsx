'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Search,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Plus,
  Edit,
  Trash2,
  Filter,
  RotateCcw,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// Import types and services
import { 
  ShiftRegistration, 
  CreateShiftRegistrationRequest,
  UpdateShiftRegistrationRequest,
  ShiftRegistrationQueryParams,
  DayOfWeek 
} from '@/types/shiftRegistration';
import { Employee, EmploymentType } from '@/types/employee';
import { WorkShift } from '@/types/workShift';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { employeeService } from '@/services/employeeService';
import { workShiftService } from '@/services/workShiftService';

// ==================== MAIN COMPONENT ====================
export default function PartTimeManagementPage() {
  const router = useRouter();
  
  // State management
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('');
  const [filterWorkShiftId, setFilterWorkShiftId] = useState<string>('');
  const [filterIsActive, setFilterIsActive] = useState<string>('');
  
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
  const [partTimeEmployees, setPartTimeEmployees] = useState<Employee[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchRegistrations();
    fetchDropdownData();
  }, [currentPage, filterEmployeeId, filterWorkShiftId, filterIsActive]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params: ShiftRegistrationQueryParams = {
        page: currentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      };

      if (filterEmployeeId) params.employeeId = parseInt(filterEmployeeId);
      if (filterWorkShiftId) params.workShiftId = filterWorkShiftId;
      if (filterIsActive) params.isActive = filterIsActive === 'true';

      const response = await shiftRegistrationService.getRegistrations(params);
      setRegistrations(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('Failed to fetch registrations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch shift registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      
      // Fetch part-time employees only
      const employeesResponse = await employeeService.getEmployees({
        size: 1000, // Get all part-time employees
        isActive: true
      });
      
      // Filter for part-time employees
      const partTimeEmps = employeesResponse.content.filter(
        emp => emp.employmentType === EmploymentType.PART_TIME
      );
      setPartTimeEmployees(partTimeEmps);

      // Fetch active work shifts
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);
    } catch (error: any) {
      console.error('Failed to fetch dropdown data:', error);
      toast.error('Failed to load employees and work shifts');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // ==================== CREATE REGISTRATION ====================
  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.employeeId || !createFormData.workShiftId || 
        !createFormData.effectiveFrom || createFormData.daysOfWeek.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await shiftRegistrationService.createRegistration(createFormData);
      toast.success('Shift registration created successfully');
      setShowCreateModal(false);
      resetCreateForm();
      fetchRegistrations();
    } catch (error: any) {
      console.error('Failed to create registration:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create shift registration';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      employeeId: 0,
      workShiftId: '',
      daysOfWeek: [],
      effectiveFrom: '',
      effectiveTo: ''
    });
  };

  // ==================== UPDATE REGISTRATION ====================
  const handleEditRegistration = (registration: ShiftRegistration) => {
    setEditingRegistration(registration);
    setEditFormData({
      workShiftId: registration.slotId,
      daysOfWeek: registration.daysOfWeek,
      effectiveFrom: registration.effectiveFrom,
      effectiveTo: registration.effectiveTo,
      isActive: registration.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRegistration) return;

    try {
      setUpdating(true);
      await shiftRegistrationService.updateRegistration(
        editingRegistration.registrationId, 
        editFormData
      );
      toast.success('Shift registration updated successfully');
      setShowEditModal(false);
      setEditingRegistration(null);
      fetchRegistrations();
    } catch (error: any) {
      console.error('Failed to update registration:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update shift registration';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // ==================== DELETE REGISTRATION ====================
  const handleDeleteRegistration = (registration: ShiftRegistration) => {
    setDeletingRegistration(registration);
    setShowDeleteModal(true);
  };

  const confirmDeleteRegistration = async () => {
    if (!deletingRegistration) return;

    try {
      setDeleting(true);
      await shiftRegistrationService.deleteRegistration(deletingRegistration.registrationId);
      toast.success('Shift registration deleted successfully');
      setShowDeleteModal(false);
      setDeletingRegistration(null);
      fetchRegistrations();
    } catch (error: any) {
      console.error('Failed to delete registration:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete shift registration';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // ==================== REACTIVATE REGISTRATION ====================
  const handleReactivateRegistration = async (registration: ShiftRegistration) => {
    try {
      await shiftRegistrationService.reactivateRegistration(registration.registrationId);
      toast.success('Shift registration reactivated successfully');
      fetchRegistrations();
    } catch (error: any) {
      console.error('Failed to reactivate registration:', error);
      toast.error('Failed to reactivate shift registration');
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getEmployeeName = (employeeId: number) => {
    const employee = partTimeEmployees.find(emp => emp.employeeId === employeeId.toString());
    return employee ? `${employee.fullName} (${employee.employeeCode})` : `Employee ID: ${employeeId}`;
  };

  const getWorkShiftName = (slotId: string) => {
    const shift = workShifts.find(shift => shift.workShiftId === slotId);
    return shift ? `${shift.shiftName} (${shift.startTime}-${shift.endTime})` : slotId;
  };

  const formatDaysOfWeek = (days: DayOfWeek[]) => {
    const dayMap = {
      [DayOfWeek.MONDAY]: 'T2',
      [DayOfWeek.TUESDAY]: 'T3', 
      [DayOfWeek.WEDNESDAY]: 'T4',
      [DayOfWeek.THURSDAY]: 'T5',
      [DayOfWeek.FRIDAY]: 'T6',
      [DayOfWeek.SATURDAY]: 'T7',
      [DayOfWeek.SUNDAY]: 'CN'
    };
    return days.map(day => dayMap[day]).join(', ');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_ALL]}>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Part-Time Management</h1>
          <p className="text-gray-600 mt-1">Manage shift registrations for part-time employees</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Registration
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filterEmployee">Employee</Label>
              <select
                id="filterEmployee"
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {partTimeEmployees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="filterWorkShift">Work Shift</Label>
              <select
                id="filterWorkShift"
                value={filterWorkShiftId}
                onChange={(e) => setFilterWorkShiftId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Shifts</option>
                {workShifts.map(shift => (
                  <option key={shift.workShiftId} value={shift.workShiftId}>
                    {shift.shiftName} ({shift.startTime}-{shift.endTime})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <select
                id="filterStatus"
                value={filterIsActive}
                onChange={(e) => setFilterIsActive(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterEmployeeId('');
                  setFilterWorkShiftId('');
                  setFilterIsActive('');
                  setCurrentPage(0);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Shift Registrations ({totalElements})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No shift registrations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Registration ID</th>
                    <th className="text-left p-3 font-medium">Employee</th>
                    <th className="text-left p-3 font-medium">Work Shift</th>
                    <th className="text-left p-3 font-medium">Days</th>
                    <th className="text-left p-3 font-medium">Effective Period</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{registration.registrationId}</td>
                      <td className="p-3">{getEmployeeName(registration.employeeId)}</td>
                      <td className="p-3">{getWorkShiftName(registration.slotId)}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {formatDaysOfWeek(registration.daysOfWeek)}
                        </Badge>
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRegistration(registration)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {registration.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRegistration(registration)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateRegistration(registration)}
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages} ({totalElements} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
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
            <h2 className="text-xl font-bold mb-4">Create Shift Registration</h2>
            <form onSubmit={handleCreateRegistration} className="space-y-4">
              <div>
                <Label htmlFor="createEmployee">Employee *</Label>
                <select
                  id="createEmployee"
                  value={createFormData.employeeId}
                  onChange={(e) => setCreateFormData(prev => ({
                    ...prev,
                    employeeId: parseInt(e.target.value) || 0
                  }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {partTimeEmployees.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="createWorkShift">Work Shift *</Label>
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
                  <option value="">Select Work Shift</option>
                  {workShifts.map(shift => (
                    <option key={shift.workShiftId} value={shift.workShiftId}>
                      {shift.shiftName} ({shift.startTime}-{shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Days of Week *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.values(DayOfWeek).map(day => (
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
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="createEffectiveFrom">Effective From *</Label>
                <Input
                  id="createEffectiveFrom"
                  type="date"
                  value={createFormData.effectiveFrom}
                  onChange={(e) => setCreateFormData(prev => ({
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
                  value={createFormData.effectiveTo}
                  onChange={(e) => setCreateFormData(prev => ({
                    ...prev,
                    effectiveTo: e.target.value
                  }))}
                />
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
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
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

      {/* Edit Modal */}
      {showEditModal && editingRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Shift Registration</h2>
            <form onSubmit={handleUpdateRegistration} className="space-y-4">
              <div>
                <Label>Registration ID</Label>
                <Input value={editingRegistration.registrationId} disabled />
              </div>

              <div>
                <Label htmlFor="editWorkShift">Work Shift</Label>
                <select
                  id="editWorkShift"
                  value={editFormData.workShiftId || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    workShiftId: e.target.value
                  }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Work Shift</option>
                  {workShifts.map(shift => (
                    <option key={shift.workShiftId} value={shift.workShiftId}>
                      {shift.shiftName} ({shift.startTime}-{shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Days of Week</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.values(DayOfWeek).map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editFormData.daysOfWeek?.includes(day) || false}
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
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="editEffectiveFrom">Effective From</Label>
                <Input
                  id="editEffectiveFrom"
                  type="date"
                  value={editFormData.effectiveFrom || ''}
                  onChange={(e) => setEditFormData(prev => ({
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
                  value={editFormData.effectiveTo || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    effectiveTo: e.target.value
                  }))}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive !== false}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      isActive: e.target.checked
                    }))}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRegistration(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? (
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

      {/* Delete Modal */}
      {showDeleteModal && deletingRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Shift Registration</h2>
            <p className="mb-4">
              Are you sure you want to delete registration <strong>{deletingRegistration.registrationId}</strong>?
              This action will deactivate the registration but preserve the data for audit purposes.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRegistration(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRegistration}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Registration'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
