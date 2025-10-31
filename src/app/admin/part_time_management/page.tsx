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
import { Clock, CheckCircle, XCircle, Loader2, Eye, Edit, Trash2, RotateCcw, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// Import types and services
import {
  ShiftRegistration,
  UpdateShiftRegistrationRequest,
  ShiftRegistrationQueryParams,
  DayOfWeek
} from '@/types/shiftRegistration';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { useAuth } from '@/contexts/AuthContext';

// ==================== MAIN COMPONENT ====================
export default function PartTimeManagementPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();

  // State management
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('');
  const [filterIsActive, setFilterIsActive] = useState<string>('');

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<ShiftRegistration | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateShiftRegistrationRequest>({});

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Dropdown data (not used with new response, kept for compatibility)
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRegistration, setDetailsRegistration] = useState<ShiftRegistration | null>(null);


  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchRegistrations();

    // Debug: Log user permissions
    console.log('🔍 Current user:', user);
    console.log('🔍 User permissions:', user?.permissions);
    console.log('🔍 Has CREATE_REGISTRATION:', hasPermission(Permission.CREATE_REGISTRATION));
    console.log('🔍 Has UPDATE_REGISTRATION_ALL:', hasPermission(Permission.UPDATE_REGISTRATION_ALL));
    console.log('🔍 Has DELETE_REGISTRATION_ALL:', hasPermission(Permission.DELETE_REGISTRATION_ALL));
  }, [currentPage]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params: ShiftRegistrationQueryParams = {
        page: currentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      };

      const response = await shiftRegistrationService.getRegistrations(params);

      console.log('📋 Fetched registrations response:', response);

      // Support both array and paginated response formats
      if (Array.isArray(response)) {
        setRegistrations(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        console.log('📋 Registration IDs available:', response.content?.map(r => r.registrationId));
        setRegistrations(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch registrations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch shift registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    // No-op in simplified version (data already provided in list response)
  };

  // ==================== CREATE REGISTRATION ====================
  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permission first
    if (!hasPermission(Permission.CREATE_REGISTRATION)) {
      toast.error('You do not have permission to create shift registrations');
      return;
    }

    // Validate required fields
    if (!createFormData.employeeId || createFormData.employeeId === 0) {
      toast.error('Please select an employee');
      return;
    }

    if (!createFormData.workShiftId) {
      toast.error('Please select a work shift');
      return;
    }

    if (!createFormData.effectiveFrom) {
      toast.error('Please select effective from date');
      return;
    }

    if (createFormData.daysOfWeek.length === 0) {
      toast.error('Please select at least one day of week');
      return;
    }

    // Validate dates
    if (createFormData.effectiveTo) {
      const fromDate = new Date(createFormData.effectiveFrom);
      const toDate = new Date(createFormData.effectiveTo);
      if (toDate <= fromDate) {
        toast.error('Effective To date must be after Effective From date');
        return;
      }
    }

    try {
      setCreating(true);

      // Prepare payload exactly as API expects (based on provided body)
      const payload: any = {
        employeeId: Number(createFormData.employeeId),
        workShiftId: createFormData.workShiftId,
        daysOfWeek: createFormData.daysOfWeek,
        effectiveFrom: createFormData.effectiveFrom
      };

      // Only include effectiveTo if it has a value
      if (createFormData.effectiveTo && createFormData.effectiveTo.trim() !== '') {
        payload.effectiveTo = createFormData.effectiveTo;
      }

      console.log('📤 Submitting shift registration payload:', payload);
      console.log('🔍 Expected result: Registration should be created with isActive: true');

      await shiftRegistrationService.createRegistration(payload);
      toast.success('Shift registration created successfully');
      setShowCreateModal(false);
      resetCreateForm();

      // Refresh the registrations list to show new data
      await fetchRegistrations();
    } catch (error: any) {
      console.error('❌ Failed to create registration:', error);

      let errorMessage = 'Failed to create shift registration';
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
      employeeId: 0,
      workShiftId: '',
      daysOfWeek: [],
      effectiveFrom: '',
      effectiveTo: '' // Use empty string for form input
    });
  };

  // ==================== UPDATE REGISTRATION ====================
  const handleEditRegistration = (registration: ShiftRegistration) => {
    setEditingRegistration(registration);
    setEditFormData({
      workShiftId: registration.slotId,
      daysOfWeek: registration.daysOfWeek,
      effectiveFrom: registration.effectiveFrom,
      effectiveTo: registration.effectiveTo || '',
      isActive: registration.active // Map from 'active' to 'isActive' for form
    });
    setShowEditModal(true);
  };

  // ==================== DELETE REGISTRATION ====================
  const handleDeleteRegistration = async (registration: ShiftRegistration) => {
    // Check permission first
    if (!hasPermission(Permission.DELETE_REGISTRATION_ALL)) {
      toast.error('You do not have permission to delete shift registrations');
      return;
    }

    if (!confirm(`Are you sure you want to delete this shift registration for Employee ID ${registration.employeeId}?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting registration:', registration.registrationId);

      await shiftRegistrationService.deleteRegistration(registration.registrationId);
      toast.success('Shift registration deleted successfully');
      await fetchRegistrations();
    } catch (error: any) {
      console.error('❌ Failed to delete registration:', error);

      let errorMessage = 'Failed to delete shift registration';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRegistration) return;

    // Check permission first
    if (!hasPermission(Permission.UPDATE_REGISTRATION_ALL)) {
      toast.error('You do not have permission to update shift registrations');
      return;
    }

    // Validate required fields
    if (!editFormData.workShiftId) {
      toast.error('Please select a work shift');
      return;
    }

    if (!editFormData.effectiveFrom) {
      toast.error('Please select effective from date');
      return;
    }

    if (!editFormData.daysOfWeek || editFormData.daysOfWeek.length === 0) {
      toast.error('Please select at least one day of week');
      return;
    }

    // Validate dates
    if (editFormData.effectiveTo && editFormData.effectiveTo.trim() !== '') {
      const fromDate = new Date(editFormData.effectiveFrom);
      const toDate = new Date(editFormData.effectiveTo);
      if (toDate <= fromDate) {
        toast.error('Effective To date must be after Effective From date');
        return;
      }
    }

    try {
      setUpdating(true);

      // Prepare payload exactly as API expects (similar to create payload)
      const payload: any = {
        workShiftId: editFormData.workShiftId,
        daysOfWeek: editFormData.daysOfWeek,
        effectiveFrom: editFormData.effectiveFrom,
        isActive: editFormData.isActive
      };

      // Only include effectiveTo if it has a value
      if (editFormData.effectiveTo && editFormData.effectiveTo.trim() !== '') {
        payload.effectiveTo = editFormData.effectiveTo;
      }

      console.log('📤 Updating shift registration payload:', payload);
      console.log('📤 Registration ID:', editingRegistration.registrationId);

      await shiftRegistrationService.updateRegistration(
        editingRegistration.registrationId,
        payload
      );
      toast.success('Shift registration updated successfully');
      setShowEditModal(false);
      setEditingRegistration(null);
      await fetchRegistrations();
    } catch (error: any) {
      console.error('❌ Failed to update registration:', error);

      let errorMessage = 'Failed to update shift registration';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setUpdating(false);
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

  // No need to map shift by id; registration already includes shiftName

  const getDayOfWeekLabel = (day: DayOfWeek) => {
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
            <h1 className="text-3xl font-bold text-gray-900">Part-Time Registration Management</h1>
            <p className="text-gray-600 mt-1">View and manage part-time employee registrations</p>
          </div>
          <Button onClick={() => { fetchRegistrations(); fetchDropdownData(); }} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters temporarily hidden */}

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
                      <th className="text-left p-3 font-medium">Day</th>
                      <th className="text-left p-3 font-medium">Effective Period</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{registration.registrationId}</td>
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
                          <Badge className={registration.isActive ? "bg-[#8b5fbf] text-white" : "bg-gray-200 text-gray-700"}>
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
                                setDetailsRegistration(registration);
                                setShowDetailsModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        {/* Create Modal temporarily removed */}

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

        {/* Details Modal */}
        {showDetailsModal && detailsRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Registration Details</h2>
              <div className="space-y-3">
                <div>
                  <Label>Registration ID</Label>
                  <Input value={detailsRegistration.registrationId} disabled />
                </div>
                <div>
                  <Label>Employee</Label>
                  <Input value={detailsRegistration.employeeName} disabled />
                </div>
                <div>
                  <Label>Work Shift</Label>
                  <Input value={detailsRegistration.shiftName} disabled />
                </div>
                <div>
                  <Label>Day</Label>
                  <Input value={getDayOfWeekLabel(detailsRegistration.dayOfWeek as DayOfWeek)} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Effective From</Label>
                    <Input value={formatDate(detailsRegistration.effectiveFrom)} disabled />
                  </div>
                  <div>
                    <Label>Effective To</Label>
                    <Input value={detailsRegistration.effectiveTo ? formatDate(detailsRegistration.effectiveTo) : ''} disabled />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Input value={detailsRegistration.isActive ? 'Active' : 'Inactive'} disabled />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDetailsRegistration(null);
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
