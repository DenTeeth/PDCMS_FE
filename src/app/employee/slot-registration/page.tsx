'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Filter,
  RotateCcw,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// Import types and services
import { 
  AvailableSlot,
  DayOfWeek 
} from '@/types/workSlot';
import { 
  ShiftRegistration,
  CreateShiftRegistrationRequest,
  ShiftRegistrationQueryParams
} from '@/types/shiftRegistration';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { useAuth } from '@/contexts/AuthContext';

// ==================== MAIN COMPONENT ====================
export default function SlotRegistrationPage() {
  const { user, hasPermission } = useAuth();
  
  // State management
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  
  // Filter states
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<string>('');
  
  // Registration modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [registerFormData, setRegisterFormData] = useState({
    effectiveFrom: ''
  });

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchAvailableSlots();
    fetchMyRegistrations();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const slots = await shiftRegistrationService.getAvailableSlots();
      console.log('📋 Available slots:', slots);
      setAvailableSlots(slots || []);
    } catch (error: any) {
      console.error('Failed to fetch available slots:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      setLoadingRegistrations(true);
      const params: ShiftRegistrationQueryParams = {
        page: 0,
        size: 100,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      };
      
      const response = await shiftRegistrationService.getMyRegistrations(params);
      console.log('📋 My registrations:', response);
      // Handle both array and paginated responses
      if (Array.isArray(response)) {
        setMyRegistrations(response);
      } else {
        setMyRegistrations(response.content || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch my registrations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch my registrations');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // ==================== REGISTER SLOT ====================
  const handleRegisterSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setRegisterFormData({
      effectiveFrom: new Date().toISOString().split('T')[0] // Today's date
    });
    setShowRegisterModal(true);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) return;

    // Validate required fields
    if (!registerFormData.effectiveFrom) {
      toast.error('Please select effective from date');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(registerFormData.effectiveFrom);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Effective date cannot be in the past');
      return;
    }

    try {
      setRegistering(true);
      
      const payload: CreateShiftRegistrationRequest = {
        partTimeSlotId: selectedSlot.slotId,
        effectiveFrom: registerFormData.effectiveFrom
      };
      
      console.log('📤 Registering for slot:', payload);
      
      await shiftRegistrationService.createRegistration(payload);
      toast.success('Successfully registered for the slot!');
      setShowRegisterModal(false);
      setSelectedSlot(null);
      
      // Refresh both lists
      await Promise.all([
        fetchAvailableSlots(),
        fetchMyRegistrations()
      ]);
    } catch (error: any) {
      console.error('❌ Failed to register for slot:', error);
      
      let errorMessage = 'Failed to register for slot';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  // ==================== CANCEL REGISTRATION ====================
  const handleCancelRegistration = async (registration: ShiftRegistration) => {
    if (!confirm(`Are you sure you want to cancel your registration for ${registration.shiftName} on ${registration.dayOfWeek}?`)) {
      return;
    }

    try {
      setDeleting(true);
      console.log('🗑️ Cancelling registration:', registration.registrationId);
      
      await shiftRegistrationService.deleteRegistration(registration.registrationId);
      toast.success('Registration cancelled successfully');
      
      // Refresh both lists
      await Promise.all([
        fetchAvailableSlots(),
        fetchMyRegistrations()
      ]);
    } catch (error: any) {
      console.error('❌ Failed to cancel registration:', error);
      
      let errorMessage = 'Failed to cancel registration';
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

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const isAlreadyRegistered = (slotId: number) => {
    return myRegistrations.some(reg => reg.partTimeSlotId === slotId && reg.isActive);
  };

  const filteredAvailableSlots = availableSlots.filter(slot => {
    if (filterDayOfWeek && slot.dayOfWeek !== filterDayOfWeek) {
      return false;
    }
    return true;
  });

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_OWN]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Slot Registration</h1>
            <p className="text-gray-600 mt-1">Register for available part-time work slots</p>
          </div>
          <Button onClick={() => {
            fetchAvailableSlots();
            fetchMyRegistrations();
          }} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Available Slots */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Available Slots
              </CardTitle>
              {/* Filter temporarily hidden */}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredAvailableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No available slots found</p>
                <p className="text-sm">Check back later for new opportunities</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailableSlots.map((slot) => {
                  const isRegistered = isAlreadyRegistered(slot.slotId);
                  return (
                    <Card key={slot.slotId} className={`${isRegistered ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{slot.shiftName}</h3>
                          <Badge variant={slot.remaining > 0 ? "default" : "secondary"}>
                            {slot.remaining} left
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{getDayOfWeekLabel(slot.dayOfWeek)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {slot.remaining} of {slot.remaining + (slot.remaining === 0 ? 1 : 0)} spots available
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isRegistered ? (
                            <Badge variant="outline" className="w-full justify-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Already Registered
                            </Badge>
                          ) : slot.remaining > 0 ? (
                            <Button
                              onClick={() => handleRegisterSlot(slot)}
                              className="w-full"
                              size="sm"
                            >
                              Register
                            </Button>
                          ) : (
                            <Button
                              disabled
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              Full
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Registrations ({myRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRegistrations ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : myRegistrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No registrations yet</p>
                <p className="text-sm">Register for available slots above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Registration ID</th>
                      <th className="text-left p-3 font-medium">Work Shift</th>
                      <th className="text-left p-3 font-medium">Day</th>
                      <th className="text-left p-3 font-medium">Effective Period</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRegistrations.map((registration) => (
                      <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{registration.registrationId}</td>
                        <td className="p-3">{registration.shiftName}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {getDayOfWeekLabel(registration.dayOfWeek)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div>From: {formatDate(registration.effectiveFrom)}</div>
                            <div>To: {formatDate(registration.effectiveTo)}</div>
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
                                Cancelled
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {registration.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelRegistration(registration)}
                              disabled={deleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Modal */}
        {showRegisterModal && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Register for Slot</h2>
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div>
                  <Label>Work Shift</Label>
                  <Input value={selectedSlot.shiftName} disabled />
                </div>

                <div>
                  <Label>Day of Week</Label>
                  <Input value={getDayOfWeekLabel(selectedSlot.dayOfWeek)} disabled />
                </div>

                <div>
                  <Label>Remaining Spots</Label>
                  <Input value={selectedSlot.remaining} disabled />
                </div>

                <div>
                  <Label htmlFor="effectiveFrom">Effective From *</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={registerFormData.effectiveFrom}
                    onChange={(e) => setRegisterFormData(prev => ({
                      ...prev,
                      effectiveFrom: e.target.value
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Registration will be valid for 3 months from this date
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setSelectedSlot(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={registering}>
                    {registering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register for Slot'
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
