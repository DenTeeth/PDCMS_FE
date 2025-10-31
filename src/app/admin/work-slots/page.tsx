'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Plus, Edit, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// Import types and services
import {
  PartTimeSlot,
  CreateWorkSlotRequest,
  UpdateWorkSlotRequest,
  WorkSlotQueryParams,
  DayOfWeek
} from '@/types/workSlot';
import { WorkShift } from '@/types/workShift';
import { workSlotService } from '@/services/workSlotService';
import { workShiftService } from '@/services/workShiftService';
import { useAuth } from '@/contexts/AuthContext';

// ==================== MAIN COMPONENT ====================
export default function WorkSlotsManagementPage() {
  const { user, hasPermission } = useAuth();

  // State management
  const [workSlots, setWorkSlots] = useState<PartTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters temporarily removed

  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateWorkSlotRequest>({
    workShiftId: '',
    dayOfWeek: DayOfWeek.MONDAY,
    quota: 1
  });

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<PartTimeSlot | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateWorkSlotRequest>({
    quota: 1,
    isActive: true
  });

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Dropdown data
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchWorkSlots();
    fetchDropdownData();
  }, [currentPage]);

  const fetchWorkSlots = async () => {
    try {
      setLoading(true);
      const params: WorkSlotQueryParams = {
        page: currentPage,
        size: 10,
        sortBy: 'slotId',
        sortDirection: 'ASC'
      };

      const response = await workSlotService.getWorkSlots(params);

      // Handle both array and paginated response
      if (Array.isArray(response)) {
        setWorkSlots(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setWorkSlots(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch work slots:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch work slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);

      // Fetch active work shifts
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);
    } catch (error: any) {
      console.error('❌ Failed to fetch dropdown data:', error);
      toast.error('Failed to load work shifts');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // ==================== CREATE WORK SLOT ====================
  const handleCreateWorkSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permission first
    if (!hasPermission(Permission.MANAGE_WORK_SLOTS)) {
      toast.error('You do not have permission to create work slots');
      return;
    }

    // Validate required fields
    if (!createFormData.workShiftId) {
      toast.error('Please select a work shift');
      return;
    }

    if (createFormData.quota < 1) {
      toast.error('Quota must be at least 1');
      return;
    }

    try {
      setCreating(true);

      console.log('📤 Creating work slot:', createFormData);

      await workSlotService.createWorkSlot(createFormData);
      toast.success('Work slot created successfully');
      setShowCreateModal(false);
      resetCreateForm();

      // Refresh the work slots list
      await fetchWorkSlots();
    } catch (error: any) {
      console.error('❌ Failed to create work slot:', error);

      let errorMessage = 'Failed to create work slot';
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
      workShiftId: '',
      dayOfWeek: DayOfWeek.MONDAY,
      quota: 1
    });
  };

  // ==================== UPDATE WORK SLOT ====================
  const handleEditWorkSlot = (slot: PartTimeSlot) => {
    setEditingSlot(slot);
    setEditFormData({
      quota: slot.quota,
      isActive: slot.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateWorkSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSlot) return;

    // Check permission first
    if (!hasPermission(Permission.MANAGE_WORK_SLOTS)) {
      toast.error('You do not have permission to update work slots');
      return;
    }

    // Validate quota
    if (editFormData.quota < 1) {
      toast.error('Quota must be at least 1');
      return;
    }

    // Check quota violation
    if (editFormData.quota < editingSlot.registered) {
      toast.error(`Cannot reduce quota to ${editFormData.quota}. Already have ${editingSlot.registered} registrations.`);
      return;
    }

    try {
      setUpdating(true);

      console.log('📤 Updating work slot:', editingSlot.slotId, editFormData);

      await workSlotService.updateWorkSlot(editingSlot.slotId, editFormData);
      toast.success('Work slot updated successfully');
      setShowEditModal(false);
      setEditingSlot(null);
      await fetchWorkSlots();
    } catch (error: any) {
      console.error('❌ Failed to update work slot:', error);

      let errorMessage = 'Failed to update work slot';
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

  // ==================== DELETE WORK SLOT ====================
  const handleDeleteWorkSlot = async (slot: PartTimeSlot) => {
    // Check permission first
    if (!hasPermission(Permission.MANAGE_WORK_SLOTS)) {
      toast.error('You do not have permission to delete work slots');
      return;
    }

    if (!confirm(`Are you sure you want to delete this work slot for ${slot.workShiftName} on ${slot.dayOfWeek}?`)) {
      return;
    }

    try {
      setDeleting(true);
      console.log('🗑️ Deleting work slot:', slot.slotId);

      await workSlotService.deleteWorkSlot(slot.slotId);
      toast.success('Work slot deleted successfully');
      await fetchWorkSlots();
    } catch (error: any) {
      console.error('❌ Failed to delete work slot:', error);

      let errorMessage = 'Failed to delete work slot';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getWorkShiftName = (workShiftId: string) => {
    const shift = workShifts.find(shift => shift.workShiftId === workShiftId);
    return shift ? `${shift.shiftName} (${shift.startTime}-${shift.endTime})` : workShiftId;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getDayOfWeekLabel = (day: DayOfWeek) => {
    const dayMap = {
      [DayOfWeek.MONDAY]: 'Thứ 2',
      [DayOfWeek.TUESDAY]: 'Thứ 3',
      [DayOfWeek.WEDNESDAY]: 'Thứ 4',
      [DayOfWeek.THURSDAY]: 'Thứ 5',
      [DayOfWeek.FRIDAY]: 'Thứ 6',
      [DayOfWeek.SATURDAY]: 'Thứ 7',
      [DayOfWeek.SUNDAY]: 'Chủ nhật'
    };
    return dayMap[day] || day;
  };

  // ==================== RENDER ====================

  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_WORK_SHIFTS]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Slots Management</h1>
            <p className="text-gray-600 mt-1">Manage part-time work slots and quotas</p>
          </div>
          {hasPermission(Permission.MANAGE_WORK_SLOTS) && (
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Work Slot
            </Button>
          )}
        </div>

        {/* Filters temporarily hidden */}

        {/* Work Slots Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Work Slots ({totalElements})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : workSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No work slots found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Slot ID</th>
                      <th className="text-left p-3 font-medium">Work Shift</th>
                      <th className="text-left p-3 font-medium">Day</th>
                      <th className="text-left p-3 font-medium">Quota</th>
                      <th className="text-left p-3 font-medium">Registered</th>
                      <th className="text-left p-3 font-medium">Remaining</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workSlots.map((slot) => (
                      <tr key={slot.slotId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{slot.slotId}</td>
                        <td className="p-3">{getWorkShiftName(slot.workShiftId)}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {getDayOfWeekLabel(slot.dayOfWeek)}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold">{slot.quota}</td>
                        <td className="p-3">{slot.registered}</td>
                        <td className="p-3">
                          <Badge variant={slot.quota - slot.registered > 0 ? "default" : "secondary"}>
                            {slot.quota - slot.registered}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={slot.isActive ? "bg-[#8b5fbf] text-white" : "bg-gray-200 text-gray-700"}>
                            {slot.isActive ? (
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
                        <td className="p-3 text-sm text-gray-600">
                          {formatDate(slot.effectiveFrom)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {hasPermission(Permission.UPDATE_WORK_SHIFTS) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditWorkSlot(slot)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {hasPermission(Permission.DELETE_WORK_SHIFTS) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWorkSlot(slot)}
                                disabled={slot.registered > 0}
                              >
                                <Trash2 className="h-4 w-4" />
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
              <h2 className="text-xl font-bold mb-4">Create Work Slot</h2>
              <form onSubmit={handleCreateWorkSlot} className="space-y-4">
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
                  <Label htmlFor="createDayOfWeek">Day of Week *</Label>
                  <select
                    id="createDayOfWeek"
                    value={createFormData.dayOfWeek}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      dayOfWeek: e.target.value as DayOfWeek
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.values(DayOfWeek).map(day => (
                      <option key={day} value={day}>
                        {getDayOfWeekLabel(day)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="createQuota">Quota *</Label>
                  <Input
                    id="createQuota"
                    type="number"
                    min="1"
                    value={createFormData.quota}
                    onChange={(e) => setCreateFormData(prev => ({
                      ...prev,
                      quota: parseInt(e.target.value) || 1
                    }))}
                    required
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
                      'Create Work Slot'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Work Slot</h2>
              <form onSubmit={handleUpdateWorkSlot} className="space-y-4">
                <div>
                  <Label>Slot ID</Label>
                  <Input value={editingSlot.slotId} disabled />
                </div>

                <div>
                  <Label>Work Shift</Label>
                  <Input value={getWorkShiftName(editingSlot.workShiftId)} disabled />
                </div>

                <div>
                  <Label>Day of Week</Label>
                  <Input value={getDayOfWeekLabel(editingSlot.dayOfWeek)} disabled />
                </div>

                <div>
                  <Label htmlFor="editQuota">Quota *</Label>
                  <Input
                    id="editQuota"
                    type="number"
                    min={editingSlot.registered}
                    value={editFormData.quota}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      quota: parseInt(e.target.value) || 1
                    }))}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Currently registered: {editingSlot.registered}
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
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
                      setEditingSlot(null);
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
                      'Update Work Slot'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
