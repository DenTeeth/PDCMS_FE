export interface Appointment {
    id: number;
    patientId: number;
    patientName: string;
    patientPhone?: string;
    dentistId: number;
    dentistName: string;
    serviceId: number;
    serviceName: string;
    appointmentDate: string; // ISO date string
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    status: AppointmentStatus;
    notes?: string;
    reasonForVisit?: string;
    createdAt: string;
    updatedAt: string;
    cancelReason?: string;
    rescheduleReason?: string;
}

export type AppointmentStatus =
    | 'SCHEDULED'   // Đã đặt lịch
    | 'CONFIRMED'   // Đã xác nhận
    | 'CHECKED_IN'  // Đã check-in
    | 'IN_PROGRESS' // Đang điều trị
    | 'COMPLETED'   // Hoàn thành
    | 'CANCELLED'   // Đã hủy
    | 'NO_SHOW';    // Không đến

export interface AppointmentFilter {
    status?: AppointmentStatus[];
    dentistId?: number;
    patientId?: number;
    serviceId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
}

export interface CreateAppointmentRequest {
    patientId: number;
    dentistId: number;
    serviceId: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
    reasonForVisit?: string;
}

export interface UpdateAppointmentRequest {
    dentistId?: number;
    serviceId?: number;
    appointmentDate?: string;
    startTime?: string;
    endTime?: string;
    status?: AppointmentStatus;
    notes?: string;
    reasonForVisit?: string;
}

export interface RescheduleAppointmentRequest {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    reason: string;
}

export interface CancelAppointmentRequest {
    reason: string;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
    dentistId?: number;
}

export interface DentistAvailability {
    dentistId: number;
    dentistName: string;
    availableSlots: TimeSlot[];
}

export interface AppointmentConflict {
    hasConflict: boolean;
    conflictingAppointments?: Appointment[];
    message?: string;
}

// For calendar display
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    backgroundColor: string;
    borderColor: string;
    extendedProps: {
        appointment: Appointment;
    };
}

// Status colors for calendar
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
    SCHEDULED: { bg: '#3b82f6', border: '#2563eb', text: 'Đã đặt lịch' },
    CONFIRMED: { bg: '#10b981', border: '#059669', text: 'Đã xác nhận' },
    CHECKED_IN: { bg: '#f59e0b', border: '#d97706', text: 'Đã check-in' },
    IN_PROGRESS: { bg: '#8b5cf6', border: '#7c3aed', text: 'Đang điều trị' },
    COMPLETED: { bg: '#22c55e', border: '#16a34a', text: 'Hoàn thành' },
    CANCELLED: { bg: '#ef4444', border: '#dc2626', text: 'Đã hủy' },
    NO_SHOW: { bg: '#6b7280', border: '#4b5563', text: 'Không đến' },
};

export interface Service {
    id: number;
    name: string;
    description?: string;
    duration: number; // in minutes
    price: number;
}

export interface Patient {
    id: number;
    fullName: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
}

export interface Dentist {
    id: number;
    fullName: string;
    specialization?: string;
    avatar?: string;
}
