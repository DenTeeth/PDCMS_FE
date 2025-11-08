'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faClock,
    faUser,
    faUserMd,
    faNotesMedical,
    faPhone,
    faEnvelope,
    faExclamationTriangle,
    faCheck,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, APPOINTMENT_STATUS_COLORS, DentistAvailability } from '@/types/appointment';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ============= View Details Modal =============
interface AppointmentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onEdit: (appointment: Appointment) => void;
    onReschedule: (appointment: Appointment) => void;
    onCancel: (appointment: Appointment) => void;
}

export function AppointmentDetailsModal({
    open,
    onClose,
    appointment,
    onEdit,
    onReschedule,
    onCancel,
}: AppointmentDetailsModalProps) {
    if (!appointment) return null;

    const statusInfo = APPOINTMENT_STATUS_COLORS[appointment.status];
    const canModify = appointment.status === 'SCHEDULED';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Appointment Details</DialogTitle>
                    <DialogDescription>
                        <Badge style={{ backgroundColor: statusInfo.bg, color: 'white' }}>
                            {statusInfo.text}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Date & Time */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-primary mt-1" />
                            <div>
                                <div className="text-sm text-gray-600">Date</div>
                                <div className="font-medium">
                                    {format(new Date(appointment.appointmentDate), 'EEEE, MMMM dd, yyyy')}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FontAwesomeIcon icon={faClock} className="text-primary mt-1" />
                            <div>
                                <div className="text-sm text-gray-600">Time</div>
                                <div className="font-medium">
                                    {appointment.startTime} - {appointment.endTime}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Patient Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FontAwesomeIcon icon={faUser} className="text-primary" />
                            <h3 className="font-semibold">Patient Information</h3>
                        </div>
                        <div className="space-y-2 pl-6">
                            <div>
                                <div className="text-sm text-gray-600">Name</div>
                                <div className="font-medium">{appointment.patientName}</div>
                            </div>
                            {appointment.patientPhone && (
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-sm" />
                                    <span>{appointment.patientPhone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Dentist & Service */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faUserMd} className="text-primary" />
                                <h3 className="font-semibold">Dentist</h3>
                            </div>
                            <div className="pl-6 font-medium">{appointment.dentistName}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faNotesMedical} className="text-primary" />
                                <h3 className="font-semibold">Service</h3>
                            </div>
                            <div className="pl-6 font-medium">{appointment.serviceName}</div>
                        </div>
                    </div>

                    {/* Notes */}
                    {(appointment.reasonForVisit || appointment.notes) && (
                        <>
                            <Separator />
                            <div>
                                {appointment.reasonForVisit && (
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600 mb-1">Reason for Visit</div>
                                        <div className="text-gray-900">{appointment.reasonForVisit}</div>
                                    </div>
                                )}
                                {appointment.notes && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Additional Notes</div>
                                        <div className="text-gray-900">{appointment.notes}</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Cancel/Reschedule Reason */}
                    {(appointment.cancelReason || appointment.rescheduleReason) && (
                        <>
                            <Separator />
                            <div>
                                {appointment.cancelReason && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Cancellation Reason</div>
                                        <div className="text-red-600">{appointment.cancelReason}</div>
                                    </div>
                                )}
                                {appointment.rescheduleReason && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Reschedule Reason</div>
                                        <div className="text-orange-600">{appointment.rescheduleReason}</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {canModify && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onReschedule(appointment)}>
                                Reschedule
                            </Button>
                            <Button variant="outline" onClick={() => onCancel(appointment)}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============= Reschedule Modal =============
interface RescheduleModalProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onSuccess: () => void;
}

export function RescheduleModal({ open, onClose, appointment, onSuccess }: RescheduleModalProps) {
    const [loading, setLoading] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [reason, setReason] = useState('');
    const [availableSlots, setAvailableSlots] = useState<DentistAvailability[]>([]);

    useEffect(() => {
        if (open && newDate && appointment) {
            loadAvailableSlots();
        }
    }, [newDate, open]);

    const loadAvailableSlots = async () => {
        if (!appointment) return;
        try {
            setLoading(true);
            const data = await appointmentService.getAllAvailableDentists(
                newDate,
                appointment.serviceId
            );
            setAvailableSlots(data);
        } catch (error: any) {
            toast.error('Failed to load available slots');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment || !newDate || !selectedSlot || !reason.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        const [startTime, endTime] = selectedSlot.split('-');

        try {
            setLoading(true);
            await appointmentService.rescheduleAppointment(appointment.id, {
                appointmentDate: newDate,
                startTime,
                endTime,
                reason: reason.trim(),
            });

            toast.success('Appointment Rescheduled', {
                description: 'The appointment has been successfully rescheduled',
            });

            handleClose();
            onSuccess();
        } catch (error: any) {
            toast.error('Failed to reschedule appointment', {
                description: error.message || 'Please try again later',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewDate('');
        setSelectedSlot('');
        setReason('');
        setAvailableSlots([]);
        onClose();
    };

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Reschedule Appointment</DialogTitle>
                    <DialogDescription>
                        Current: {format(new Date(appointment.appointmentDate), 'PPP')} at{' '}
                        {appointment.startTime}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="newDate">New Date</Label>
                        <Input
                            id="newDate"
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            value={newDate}
                            onChange={(e) => {
                                setNewDate(e.target.value);
                                setSelectedSlot('');
                            }}
                            required
                            className="mt-1"
                        />
                    </div>

                    {newDate && (
                        <div>
                            <Label>Available Time Slots</Label>
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading available slots...</div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No available slots for this date
                                </div>
                            ) : (
                                <div className="space-y-4 mt-2">
                                    {availableSlots.map((dentistAvail) => (
                                        <div key={dentistAvail.dentistId} className="border rounded-lg p-4">
                                            <div className="font-medium mb-3">{dentistAvail.dentistName}</div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {dentistAvail.availableSlots.map((slot) =>
                                                    slot.available ? (
                                                        <Button
                                                            key={`${slot.startTime}-${slot.endTime}`}
                                                            type="button"
                                                            variant={
                                                                selectedSlot === `${slot.startTime}-${slot.endTime}`
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() => setSelectedSlot(`${slot.startTime}-${slot.endTime}`)}
                                                            className="text-xs"
                                                        >
                                                            {slot.startTime}
                                                        </Button>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="reason">Reason for Rescheduling *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a reason for rescheduling..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !selectedSlot}>
                            {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ============= Cancel Modal =============
interface CancelModalProps {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onSuccess: () => void;
}

export function CancelModal({ open, onClose, appointment, onSuccess }: CancelModalProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [notifyPatient, setNotifyPatient] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment || !reason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        try {
            setLoading(true);
            await appointmentService.cancelAppointment(appointment.id, {
                reason: reason.trim(),
            });

            toast.success('Appointment Cancelled', {
                description: notifyPatient
                    ? 'The appointment has been cancelled and the patient will be notified'
                    : 'The appointment has been cancelled',
            });

            handleClose();
            onSuccess();
        } catch (error: any) {
            toast.error('Failed to cancel appointment', {
                description: error.message || 'Please try again later',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setNotifyPatient(true);
        onClose();
    };

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancel Appointment</DialogTitle>
                    <DialogDescription>
                        {format(new Date(appointment.appointmentDate), 'PPP')} at {appointment.startTime}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-1" />
                            <div>
                                <div className="font-medium text-yellow-900 mb-1">Warning</div>
                                <div className="text-sm text-yellow-800">
                                    This action cannot be undone. The appointment will be permanently cancelled.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                        <Textarea
                            id="cancelReason"
                            placeholder="Please provide a reason for cancelling this appointment..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            rows={4}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="notifyPatient"
                            checked={notifyPatient}
                            onChange={(e) => setNotifyPatient(e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <Label htmlFor="notifyPatient" className="cursor-pointer">
                            Notify patient about cancellation
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            No, Keep It
                        </Button>
                        <Button type="submit" variant="destructive" disabled={loading}>
                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                            {loading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
