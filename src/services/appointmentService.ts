import { apiClient } from '@/lib/api';

const api = apiClient.getAxiosInstance();
import {
    Appointment,
    AppointmentFilter,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    RescheduleAppointmentRequest,
    CancelAppointmentRequest,
    DentistAvailability,
    AppointmentConflict,
    Service,
    Patient,
    Dentist,
} from '@/types/appointment';

const APPOINTMENT_BASE_URL = '/appointments';

export const appointmentService = {
    // Get all appointments with filters
    getAppointments: async (filter?: AppointmentFilter): Promise<Appointment[]> => {
        const response = await api.get(APPOINTMENT_BASE_URL, { params: filter });
        return response.data;
    },

    // Get appointment by ID
    getAppointmentById: async (id: number): Promise<Appointment> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/${id}`);
        return response.data;
    },

    // Create new appointment
    createAppointment: async (data: CreateAppointmentRequest): Promise<Appointment> => {
        const response = await api.post(APPOINTMENT_BASE_URL, data);
        return response.data;
    },

    // Update appointment
    updateAppointment: async (id: number, data: UpdateAppointmentRequest): Promise<Appointment> => {
        const response = await api.put(`${APPOINTMENT_BASE_URL}/${id}`, data);
        return response.data;
    },

    // Reschedule appointment
    rescheduleAppointment: async (id: number, data: RescheduleAppointmentRequest): Promise<Appointment> => {
        const response = await api.post(`${APPOINTMENT_BASE_URL}/${id}/reschedule`, data);
        return response.data;
    },

    // Cancel appointment
    cancelAppointment: async (id: number, data: CancelAppointmentRequest): Promise<Appointment> => {
        const response = await api.post(`${APPOINTMENT_BASE_URL}/${id}/cancel`, data);
        return response.data;
    },

    // Check for conflicts
    checkConflicts: async (
        dentistId: number,
        date: string,
        startTime: string,
        endTime: string,
        excludeAppointmentId?: number
    ): Promise<AppointmentConflict> => {
        const response = await api.post(`${APPOINTMENT_BASE_URL}/check-conflicts`, {
            dentistId,
            date,
            startTime,
            endTime,
            excludeAppointmentId,
        });
        return response.data;
    },

    // Get available time slots for a dentist on a specific date
    getAvailableSlots: async (dentistId: number, date: string): Promise<DentistAvailability> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/available-slots`, {
            params: { dentistId, date },
        });
        return response.data;
    },

    // Get all available dentists with their slots for a date
    getAllAvailableDentists: async (date: string, serviceId?: number): Promise<DentistAvailability[]> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/available-dentists`, {
            params: { date, serviceId },
        });
        return response.data;
    },

    // Update appointment status
    updateAppointmentStatus: async (id: number, status: string): Promise<Appointment> => {
        const response = await api.patch(`${APPOINTMENT_BASE_URL}/${id}/status`, { status });
        return response.data;
    },

    // Check-in appointment
    checkInAppointment: async (id: number): Promise<Appointment> => {
        const response = await api.post(`${APPOINTMENT_BASE_URL}/${id}/check-in`);
        return response.data;
    },

    // Get appointments for a specific date range (for calendar)
    getAppointmentsByDateRange: async (startDate: string, endDate: string): Promise<Appointment[]> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/date-range`, {
            params: { startDate, endDate },
        });
        return response.data;
    },

    // Get today's appointments
    getTodayAppointments: async (): Promise<Appointment[]> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/today`);
        return response.data;
    },

    // Get upcoming appointments
    getUpcomingAppointments: async (): Promise<Appointment[]> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/upcoming`);
        return response.data;
    },

    // Services
    getServices: async (): Promise<Service[]> => {
        const response = await api.get('/services');
        return response.data;
    },

    // Patients
    searchPatients: async (searchTerm: string): Promise<Patient[]> => {
        const response = await api.get('/patients/search', { params: { q: searchTerm } });
        return response.data;
    },

    getPatientById: async (id: number): Promise<Patient> => {
        const response = await api.get(`/patients/${id}`);
        return response.data;
    },

    // Dentists
    getDentists: async (): Promise<Dentist[]> => {
        const response = await api.get('/dentists');
        return response.data;
    },

    getDentistById: async (id: number): Promise<Dentist> => {
        const response = await api.get(`/dentists/${id}`);
        return response.data;
    },
};
