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
import { Appointment, APPOINTMENT_STATUS_COLORS, DentistAvailability, AppointmentReasonCode, APPOINTMENT_REASON_CODE_LABELS } from '@/types/appointment';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
                    <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
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
                                <div className="text-sm text-gray-600">Giờ</div>
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
                            <h3 className="font-semibold">Thông tin bệnh nhân</h3>
                        </div>
                        <div className="space-y-2 pl-6">
                            <div>
                                <div className="text-sm text-gray-600">Tên</div>
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
                                <h3 className="font-semibold">Nha sĩ</h3>
                            </div>
                            <div className="pl-6 font-medium">{appointment.dentistName}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faNotesMedical} className="text-primary" />
                                <h3 className="font-semibold">Dịch vụ</h3>
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
                                        <div className="text-sm text-gray-600 mb-1">Lý do khám</div>
                                        <div className="text-gray-900">{appointment.reasonForVisit}</div>
                                    </div>
                                )}
                                {appointment.notes && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Ghi chú bổ sung</div>
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
                                        <div className="text-sm text-gray-600 mb-1">Lý do hủy</div>
                                        <div className="text-red-600">{appointment.cancelReason}</div>
                                    </div>
                                )}
                                {appointment.rescheduleReason && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Lý do dời lịch</div>
                                        <div className="text-orange-600">{appointment.rescheduleReason}</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                    {canModify && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onReschedule(appointment)}>
                                Dời lịch
                            </Button>
                            <Button variant="outline" onClick={() => onCancel(appointment)}>
                                Hủy
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
            toast.error('Không thể tải danh sách ca khả dụng');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment || !newDate || !selectedSlot || !reason.trim()) {
            toast.error('Vui lòng điền đầy đủ tất cả các trường');
            return;
        }

        const [startTime, endTime] = selectedSlot.split('-');

        try {
            setLoading(true);
            // RescheduleAppointmentRequest needs new structure
            const appointmentCode = (appointment as any).appointmentCode || String(appointment.id);
            const newStartTime = `${newDate}T${startTime}:00`;
            await appointmentService.rescheduleAppointment(appointmentCode, {
                newStartTime,
                newEmployeeCode: (appointment as any).doctor?.employeeCode || String(appointment.dentistId),
                newRoomCode: (appointment as any).room?.roomCode || '',
                reasonCode: 'PATIENT_REQUEST' as any,
                cancelNotes: reason.trim(),
            });

            toast.success('Đã dời lịch hẹn', {
                description: 'Lịch hẹn đã được dời thành công',
            });

            handleClose();
            onSuccess();
        } catch (error: any) {
            toast.error('Không thể dời lịch hẹn', {
                description: error.message || 'Vui lòng thử lại sau',
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
                    <DialogTitle>Dời lịch hẹn</DialogTitle>
                    <DialogDescription>
                        Hiện tại: {format(new Date(appointment.appointmentDate), 'PPP', { locale: vi })} lúc{' '}
                        {appointment.startTime}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <Label htmlFor="newDate">Ngày mới</Label>
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
                            <Label>Khung giờ khả dụng</Label>
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Đang tải khung giờ khả dụng...</div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Không có khung giờ khả dụng cho ngày này
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

                    <div className="space-y-1">
                        <Label htmlFor="reason">Lý do dời lịch <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Vui lòng cung cấp lý do để dời lịch..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading || !selectedSlot}>
                            {loading ? 'Đang dời lịch...' : 'Xác nhận dời lịch'}
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
    const [reasonCode, setReasonCode] = useState<AppointmentReasonCode | ''>('');
    const [notes, setNotes] = useState('');
    const [notifyPatient, setNotifyPatient] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appointment) {
            toast.error('Không tìm thấy thông tin lịch hẹn');
            return;
        }

        // Validate: reasonCode is required (BE requires NOT NULL)
        if (!reasonCode) {
            toast.error('Lý do hủy bắt buộc', {
                description: 'Vui lòng chọn lý do hủy lịch hẹn',
            });
            return;
        }

        // Validate: notes is required for CANCELLED status
        if (!notes.trim()) {
            toast.error('Ghi chú bắt buộc', {
                description: 'Vui lòng nhập ghi chú về lý do hủy',
            });
            return;
        }

        // Get appointmentCode - try different possible fields
        const appointmentCode = (appointment as any).appointmentCode || (appointment as any).code;
        if (!appointmentCode) {
            toast.error('Không tìm thấy mã lịch hẹn', {
                description: 'Vui lòng thử lại sau',
            });
            return;
        }

        try {
            setLoading(true);

            // Use updateAppointmentStatus with status = CANCELLED (BE API)
            await appointmentService.updateAppointmentStatus(appointmentCode, {
                status: 'CANCELLED',
                reasonCode: reasonCode as AppointmentReasonCode,
                notes: notes.trim() || null,
            });

            toast.success('Đã hủy lịch hẹn', {
                description: notifyPatient
                    ? 'Lịch hẹn đã được hủy và bệnh nhân sẽ được thông báo'
                    : 'Lịch hẹn đã được hủy',
            });

            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error('Error cancelling appointment:', error);
            toast.error('Không thể hủy lịch hẹn', {
                description: error.response?.data?.message || error.message || 'Vui lòng thử lại sau',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReasonCode('');
        setNotes('');
        setNotifyPatient(true);
        onClose();
    };

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Hủy lịch hẹn</DialogTitle>
                    <DialogDescription>
                        {(() => {
                            // Try to get date/time from appointment - support both old and new formats
                            const appointmentDate = (appointment as any).appointmentDate || (appointment as any).appointmentStartTime;
                            const startTime = (appointment as any).startTime || (appointment as any).appointmentStartTime;
                            if (appointmentDate) {
                                try {
                                    const date = new Date(appointmentDate);
                                    if (!isNaN(date.getTime())) {
                                        return format(date, 'PPP', { locale: vi });
                                    }
                                } catch { }
                            }
                            if (startTime) {
                                return `Lịch hẹn lúc ${startTime}`;
                            }
                            return 'Xác nhận hủy lịch hẹn';
                        })()}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-1" />
                            <div>
                                <div className="font-medium text-yellow-900 mb-1">Cảnh báo</div>
                                <div className="text-sm text-yellow-800">
                                    Hành động này không thể hoàn tác. Lịch hẹn sẽ bị hủy vĩnh viễn.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reason Code - Required */}
                    <div className="space-y-1">
                        <Label htmlFor="cancelReasonCode">Mã lý do hủy <span className="text-red-500">*</span></Label>
                        <select
                            id="cancelReasonCode"
                            value={reasonCode}
                            onChange={(e) => setReasonCode(e.target.value as AppointmentReasonCode || '')}
                            required
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Chọn lý do hủy (bắt buộc)</option>
                            {Object.entries(APPOINTMENT_REASON_CODE_LABELS).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes - Required */}
                    <div className="space-y-1">
                        <Label htmlFor="cancelNotes">Ghi chú <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="cancelNotes"
                            placeholder="Vui lòng nhập ghi chú về lý do hủy lịch hẹn..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            required
                            rows={4}
                            className="resize-none"
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
                            Thông báo cho bệnh nhân về việc hủy lịch
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            Không, giữ nguyên
                        </Button>
                        <Button type="submit" variant="destructive" disabled={loading}>
                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                            {loading ? 'Đang hủy...' : 'Có, hủy lịch hẹn'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
