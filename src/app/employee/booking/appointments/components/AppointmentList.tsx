'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faCalendarCheck,
    faCalendarDay,
    faCalendarPlus,
    faCalendarTimes,
    faEye,
    faEdit,
    faClock,
} from '@fortawesome/free-solid-svg-icons';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, APPOINTMENT_STATUS_COLORS, AppointmentStatus } from '@/types/appointment';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AppointmentListProps {
    onViewDetails: (appointment: Appointment) => void;
    onEdit: (appointment: Appointment) => void;
    refreshTrigger?: number;
}

type TabType = 'today' | 'upcoming' | 'past' | 'cancelled';

export default function AppointmentList({
    onViewDetails,
    onEdit,
    refreshTrigger,
}: AppointmentListProps) {
    const [activeTab, setActiveTab] = useState<TabType>('today');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadAppointments();
    }, [activeTab, refreshTrigger]);

    useEffect(() => {
        filterAppointments();
    }, [appointments, searchTerm]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            let data: Appointment[] = [];

            switch (activeTab) {
                case 'today':
                    data = await appointmentService.getTodayAppointments();
                    break;
                case 'upcoming':
                    data = await appointmentService.getUpcomingAppointments();
                    break;
                case 'past':
                    data = await appointmentService.getAppointments({
                        status: ['COMPLETED', 'NO_SHOW'],
                    });
                    break;
                case 'cancelled':
                    data = await appointmentService.getAppointments({
                        status: ['CANCELLED', 'CANCELLED_LATE'],
                    });
                    break;
            }

            setAppointments(data || []); // Fallback to empty array
        } catch (error: any) {
            console.error('Failed to load appointments:', error);
            setAppointments([]); // Set empty array on error

            // Only show toast for non-500 errors
            if (error.response?.status !== 500) {
                toast.error('Failed to load appointments', {
                    description: error.message || 'Please try again later',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const filterAppointments = () => {
        if (!searchTerm.trim()) {
            setFilteredAppointments(appointments);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = appointments.filter(
            (apt) =>
                apt.patientName.toLowerCase().includes(term) ||
                apt.dentistName.toLowerCase().includes(term) ||
                apt.serviceName.toLowerCase().includes(term) ||
                apt.patientPhone?.toLowerCase().includes(term)
        );
        setFilteredAppointments(filtered);
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        const statusInfo = APPOINTMENT_STATUS_COLORS[status];
        return (
            <Badge
                style={{
                    backgroundColor: statusInfo.bg,
                    color: 'white',
                }}
            >
                {statusInfo.text}
            </Badge>
        );
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold">Lịch hẹn</h2>
                    <div className="relative w-full sm:w-80">
                        <Input
                            placeholder="Tìm theo bệnh nhân, nha sĩ, dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="today">
                            <FontAwesomeIcon icon={faCalendarDay} className="mr-2" />
                            Hôm nay
                        </TabsTrigger>
                        <TabsTrigger value="upcoming">
                            <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                            Sắp tới
                        </TabsTrigger>
                        <TabsTrigger value="past">
                            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
                            Đã qua
                        </TabsTrigger>
                        <TabsTrigger value="cancelled">
                            <FontAwesomeIcon icon={faCalendarTimes} className="mr-2" />
                            Đã hủy
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading appointments...</p>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="text-center py-12">
                                <FontAwesomeIcon icon={faCalendarDay} className="text-6xl text-gray-300 mb-4" />
                                <p className="text-gray-600">
                                    {searchTerm ? 'No appointments found matching your search' : 'No appointments found'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Ngày & Giờ</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Bệnh nhân</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Nha sĩ</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Trạng thái</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-700">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredAppointments.map((appointment) => (
                                                <tr key={appointment.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                                            <div>
                                                                <div className="font-medium">
                                                                    {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', { locale: vi })}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {appointment.startTime} - {appointment.endTime}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium">{appointment.patientName}</div>
                                                            {appointment.patientPhone && (
                                                                <div className="text-sm text-gray-600">{appointment.patientPhone}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium">{appointment.dentistName}</div>
                                                    </td>
                                                    <td className="px-6 py-4">{getStatusBadge(appointment.status)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => onViewDetails(appointment)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} className="mr-2" />
                                                                Xem
                                                            </Button>
                                                            {appointment.status === 'SCHEDULED' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => onEdit(appointment)}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                                                    Chỉnh sửa
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredAppointments.map((appointment) => (
                                        <Card key={appointment.id} className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="font-semibold text-lg">{appointment.patientName}</div>
                                                        {appointment.patientPhone && (
                                                            <div className="text-sm text-gray-600">{appointment.patientPhone}</div>
                                                        )}
                                                    </div>
                                                    {getStatusBadge(appointment.status)}
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faClock} className="text-gray-400 w-4" />
                                                        <span>
                                                            {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', { locale: vi })} lúc{' '}
                                                            {appointment.startTime}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <FontAwesomeIcon icon={faCalendarCheck} className="text-gray-400 w-4 mt-1" />
                                                        <div>
                                                            <div className="font-medium">{appointment.dentistName}</div>
                                                            <div className="text-gray-600">{appointment.serviceName}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2 border-t">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => onViewDetails(appointment)}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                                                        View
                                                    </Button>
                                                    {appointment.status === 'SCHEDULED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={() => onEdit(appointment)}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                                            Chỉnh sửa
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </Card>
    );
}
