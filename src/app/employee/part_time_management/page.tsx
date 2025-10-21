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
import { useAuth } from '@/contexts/AuthContext';

// ==================== MAIN COMPONENT ====================
export default function EmployeePartTimeManagementPage() {
  const router = useRouter();
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

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (user?.employeeId) {
      setCreateFormData(prev => ({
        ...prev,
        employeeId: parseInt(user.employeeId)
      }));
      fetchMyRegistrations();
      fetchWorkShifts();
    }
  }, [user, currentPage]);

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      const response = await shiftRegistrationService.getMyRegistrations({
        page: currentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      });
      
      setRegistrations(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('Failed to fetch my registrations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch your shift registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkShifts = async () => {
    try {
      setLoadingWorkShifts(true);
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);
    } catch (error: any) {
      console.error('Failed to fetch work shifts:', error);
      toast.error('Failed to load work shifts');
    } finally {
      setLoadingWorkShifts(false);
    }
  };

  // ==================== CREATE REGISTRATION ====================
  const handleCreateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.workShiftId || !createFormData.effectiveFrom || 
        createFormData.daysOfWeek.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await shiftRegistrationService.createRegistration(createFormData);
      toast.success('Shift registration created successfully');
      setShowCreateModal(false);
      resetCreateForm();
      fetchMyRegistrations();
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
      employeeId: parseInt(user?.employeeId || '0'),
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
      fetchMyRegistrations();
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
      toast.success('Shift registration cancelled successfully');
      setShowDeleteModal(false);
      setDeletingRegistration(null);
      fetchMyRegistrations();
    } catch (error: any) {
      console.error('Failed to delete registration:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to cancel shift registration';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getWorkShiftName = (slotId: string) => {
    const shift = workShifts.find(shift => shift.workShiftId === slotId);
    return shift ? `${shift.shiftName} (${shift.startTime}-${shift.endTime})` : slotId;
  };

  const formatDaysOfWeek = (days: DayOfWeek[]) => {
    const dayMap = {
      [DayOfWeek.MONDAY]: 'Thứ 2',
      [DayOfWeek.TUESDAY]: 'Thứ 3', 
      [DayOfWeek.WEDNESDAY]: 'Thứ 4',
      [DayOfWeek.THURSDAY]: 'Thứ 5',
      [DayOfWeek.FRIDAY]: 'Thứ 6',
      [DayOfWeek.SATURDAY]: 'Thứ 7',
      [DayOfWeek.SUNDAY]: 'Chủ nhật'
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

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_OWN, Permission.CREATE_REGISTRATION]} requireAll={false}>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Shift Registrations</h1>
          <p className="text-gray-600 mt-1">Manage your part-time work shift registrations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Register New Shift
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You can only register for shifts as a part-time employee</li>
                <li>Effective date must be in the future</li>
                <li>You cannot register for conflicting shifts</li>
                <li>Cancelled registrations can be reactivated by admin if needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            My Shift Registrations ({totalElements})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shift registrations yet</h3>
              <p className="text-gray-600 mb-4">You haven't registered for any shifts. Click the button above to get started.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Your First Shift
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div key={registration.registrationId} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{getWorkShiftName(registration.slotId)}</h3>
                        <Badge variant={registration.isActive ? "default" : "secondary"}>
                          {registration.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancelled
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Registration ID:</span>
                          <div className="font-mono">{registration.registrationId}</div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Days:</span>
                          <div>{formatDaysOfWeek(registration.daysOfWeek)}</div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Effective Period:</span>
                          <div>
                            From: {formatDate(registration.effectiveFrom)}
                            {registration.effectiveTo && (
                              <div>To: {formatDate(registration.effectiveTo)}</div>
                            )}
                            {!registration.effectiveTo && (
                              <div className="text-green-600">Ongoing</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRegistration(registration)}
                        disabled={!registration.isActive}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {registration.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRegistration(registration)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Register New Shift</h2>
            <form onSubmit={handleCreateRegistration} className="space-y-4">
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
                      {shift.shiftName} ({shift.startTime}-{shift.endTime}) - {shift.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Days of Week *</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
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
                      <span className="text-sm">{formatDaysOfWeek([day])}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="createEffectiveFrom">Effective From *</Label>
                <Input
                  id="createEffectiveFrom"
                  type="date"
                  min={getTodayDate()}
                  value={createFormData.effectiveFrom}
                  onChange={(e) => setCreateFormData(prev => ({
                    ...prev,
                    effectiveFrom: e.target.value
                  }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be today or a future date</p>
              </div>

              <div>
                <Label htmlFor="createEffectiveTo">Effective To (Optional)</Label>
                <Input
                  id="createEffectiveTo"
                  type="date"
                  min={createFormData.effectiveFrom || getTodayDate()}
                  value={createFormData.effectiveTo}
                  onChange={(e) => setCreateFormData(prev => ({
                    ...prev,
                    effectiveTo: e.target.value
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing registration</p>
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
                      Registering...
                    </>
                  ) : (
                    'Register Shift'
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
                      {shift.shiftName} ({shift.startTime}-{shift.endTime}) - {shift.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Days of Week</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
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
                      <span className="text-sm">{formatDaysOfWeek([day])}</span>
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
                  min={editFormData.effectiveFrom || getTodayDate()}
                  value={editFormData.effectiveTo || ''}
                  onChange={(e) => setEditFormData(prev => ({
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
            <h2 className="text-xl font-bold mb-4 text-red-600">Cancel Shift Registration</h2>
            <div className="mb-4">
              <p className="mb-2">
                Are you sure you want to cancel this shift registration?
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Registration:</strong> {deletingRegistration.registrationId}</div>
                <div><strong>Shift:</strong> {getWorkShiftName(deletingRegistration.slotId)}</div>
                <div><strong>Days:</strong> {formatDaysOfWeek(deletingRegistration.daysOfWeek)}</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This will deactivate your registration. Contact admin if you need to reactivate it later.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRegistration(null);
                }}
              >
                Keep Registration
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRegistration}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Registration'
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
