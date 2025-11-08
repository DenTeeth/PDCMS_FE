import { apiClient } from '@/lib/api';

const api = apiClient.getAxiosInstance();
import {
    Appointment,
    AppointmentFilter,
    AppointmentFilterCriteria,
    CreateAppointmentRequest,
    CreateAppointmentRequestLegacy,
    CreateAppointmentResponse,
    UpdateAppointmentRequest,
    RescheduleAppointmentRequest,
    RescheduleAppointmentResponse,
    CancelAppointmentRequest,
    DentistAvailability,
    AppointmentConflict,
    Service,
    Patient,
    Dentist,
    AvailableTimesRequest,
    AvailableTimesResponse,
    PaginatedAppointmentResponse,
    AppointmentSummaryDTO,
    AppointmentDetailDTO,
    UpdateAppointmentStatusRequest,
    DelayAppointmentRequest,
} from '@/types/appointment';

const APPOINTMENT_BASE_URL = '/appointments';

export const appointmentService = {
    // P3.3 - Get paginated appointments with filters (NEW - matches BE)
    // GET /api/v1/appointments
    getAppointmentsPage: async (criteria?: AppointmentFilterCriteria): Promise<PaginatedAppointmentResponse> => {
        const params = new URLSearchParams();
        
        // Pagination
        if (criteria?.page !== undefined) {
            params.append('page', criteria.page.toString());
        }
        if (criteria?.size !== undefined) {
            params.append('size', criteria.size.toString());
        }
        
        // Sorting
        if (criteria?.sortBy) {
            params.append('sortBy', criteria.sortBy);
        }
        if (criteria?.sortDirection) {
            params.append('sortDirection', criteria.sortDirection);
        }
        
        // Date filters
        if (criteria?.datePreset) {
            params.append('datePreset', criteria.datePreset);
        }
        if (criteria?.dateFrom) {
            params.append('dateFrom', criteria.dateFrom);
        }
        if (criteria?.dateTo) {
            params.append('dateTo', criteria.dateTo);
        }
        if (criteria?.today !== undefined) {
            params.append('today', criteria.today.toString());
        }
        
        // Status filter (array) - BE expects List<String>, convert AppointmentStatus enum to string
        if (criteria?.status && criteria.status.length > 0) {
            criteria.status.forEach(status => {
                params.append('status', status); // AppointmentStatus is already a string union type
            });
        }
        
        // Entity filters (VIEW_ALL only)
        if (criteria?.patientCode) {
            params.append('patientCode', criteria.patientCode);
        }
        if (criteria?.patientName) {
            params.append('patientName', criteria.patientName);
        }
        if (criteria?.patientPhone) {
            params.append('patientPhone', criteria.patientPhone);
        }
        if (criteria?.employeeCode) {
            params.append('employeeCode', criteria.employeeCode);
        }
        
        // Entity filters (all users)
        if (criteria?.roomCode) {
            params.append('roomCode', criteria.roomCode);
        }
        if (criteria?.serviceCode) {
            params.append('serviceCode', criteria.serviceCode);
        }
        
        // NEW: Combined search (code OR name for patient/doctor/employee/room/service)
        if (criteria?.searchCode) {
            params.append('searchCode', criteria.searchCode);
        }
        
        const url = `${APPOINTMENT_BASE_URL}?${params.toString()}`;
        const response = await api.get<PaginatedAppointmentResponse>(url);
        return response.data;
    },
    
    // Legacy get appointments (deprecated - for backward compatibility)
    // @deprecated Use getAppointmentsPage() instead
    getAppointments: async (filter?: AppointmentFilter): Promise<Appointment[]> => {
        const response = await api.get(APPOINTMENT_BASE_URL, { params: filter });
        return response.data;
    },

    // Get appointment by ID
    getAppointmentById: async (id: number): Promise<Appointment> => {
        const response = await api.get(`${APPOINTMENT_BASE_URL}/${id}`);
        return response.data;
    },

    // P3.4 - Get Appointment Detail by Code
    // GET /api/v1/appointments/{appointmentCode}
    // Returns AppointmentDetailDTO with additional fields (actualStartTime, actualEndTime, createdBy, createdAt)
    getAppointmentDetail: async (appointmentCode: string): Promise<AppointmentDetailDTO> => {
        const response = await api.get<AppointmentDetailDTO>(`${APPOINTMENT_BASE_URL}/${appointmentCode}`);
        return response.data;
    },

    // Get appointment by code (using filter API - optimized to minimize API calls)
    // @deprecated Use getAppointmentDetail() instead (P3.4 endpoint)
    // Note: This is a fallback method if P3.4 endpoint is not available
    getAppointmentByCode: async (appointmentCode: string): Promise<AppointmentSummaryDTO | null> => {
        try {
            // Fetch large batch first (1000 items) to maximize chance of finding appointment in single call
            const criteria: AppointmentFilterCriteria = {
                page: 0,
                size: 1000, // Large batch to minimize API calls
                sortBy: 'appointmentStartTime',
                sortDirection: 'DESC', // Most recent first (more likely to be accessed)
            };
            
            const response = await appointmentService.getAppointmentsPage(criteria);
            const appointment = response.content.find(apt => apt.appointmentCode === appointmentCode);
            
            if (appointment) return appointment;
            
            // If not found and there are more pages, try searching in reverse chronological order
            // Only search if total pages is reasonable (avoid infinite loops)
            if (response.totalPages > 1 && response.totalPages <= 10) {
                // Search remaining pages (limit to 5 more pages to avoid too many calls)
                for (let page = 1; page < Math.min(response.totalPages, 6); page++) {
                    const nextCriteria: AppointmentFilterCriteria = {
                        ...criteria,
                        page,
                    };
                    const nextResponse = await appointmentService.getAppointmentsPage(nextCriteria);
                    const found = nextResponse.content.find(apt => apt.appointmentCode === appointmentCode);
                    if (found) return found;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching appointment by code:', error);
            throw error;
        }
    },

    // Create new appointment (P3.2 - Updated to match docs)
    // NEW API spec: Uses codes instead of IDs, roomCode, serviceCodes array, appointmentStartTime
    createAppointment: async (data: CreateAppointmentRequest): Promise<CreateAppointmentResponse> => {
        const response = await api.post<CreateAppointmentResponse>(APPOINTMENT_BASE_URL, data);
        return response.data;
    },

    // Legacy create appointment (deprecated - for backward compatibility)
    // @deprecated Use createAppointment() with new request format instead
    createAppointmentLegacy: async (data: CreateAppointmentRequestLegacy): Promise<Appointment> => {
        const response = await api.post<Appointment>(APPOINTMENT_BASE_URL, data);
        return response.data;
    },

    // Update appointment
    updateAppointment: async (id: number, data: UpdateAppointmentRequest): Promise<Appointment> => {
        const response = await api.put(`${APPOINTMENT_BASE_URL}/${id}`, data);
        return response.data;
    },

    // OLD Reschedule appointment (deprecated - uses ID and old structure)
    // @deprecated Use rescheduleAppointment() with appointmentCode instead (P3.7)
    rescheduleAppointmentLegacy: async (id: number, data: RescheduleAppointmentRequest): Promise<Appointment> => {
        const response = await api.post(`${APPOINTMENT_BASE_URL}/${id}/reschedule`, data);
        return response.data;
    },

    // P3.7 - Reschedule Appointment
    // POST /api/v1/appointments/{appointmentCode}/reschedule
    // Cancels old appointment and creates new one with new details
    // Returns both cancelled and new appointments
    rescheduleAppointment: async (
        appointmentCode: string,
        request: RescheduleAppointmentRequest
    ): Promise<RescheduleAppointmentResponse> => {
        const response = await api.post<RescheduleAppointmentResponse>(
            `${APPOINTMENT_BASE_URL}/${appointmentCode}/reschedule`,
            request
        );
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

    // P3.5 - Update Appointment Status
    // PATCH /api/v1/appointments/{appointmentCode}/status
    // State machine validation, requires reasonCode for CANCELLED
    updateAppointmentStatus: async (
        appointmentCode: string,
        request: UpdateAppointmentStatusRequest
    ): Promise<AppointmentDetailDTO> => {
        const response = await api.patch<AppointmentDetailDTO>(
            `${APPOINTMENT_BASE_URL}/${appointmentCode}/status`,
            request
        );
        return response.data;
    },

    // P3.6 - Delay Appointment
    // PATCH /api/v1/appointments/{appointmentCode}/delay
    // Only available for SCHEDULED or CHECKED_IN status
    delayAppointment: async (
        appointmentCode: string,
        request: DelayAppointmentRequest
    ): Promise<AppointmentDetailDTO> => {
        const response = await api.patch<AppointmentDetailDTO>(
            `${APPOINTMENT_BASE_URL}/${appointmentCode}/delay`,
            request
        );
        return response.data;
    },

    // Legacy update appointment status (deprecated - use updateAppointmentStatus with appointmentCode)
    // @deprecated Use updateAppointmentStatus() with appointmentCode instead
    updateAppointmentStatusLegacy: async (id: number, status: string): Promise<Appointment> => {
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

    // P3.1 - Find Available Times
    // GET /api/v1/appointments/available-times
    // Find available time slots for booking appointments
    findAvailableTimes: async (request: AvailableTimesRequest): Promise<AvailableTimesResponse> => {
        const params = new URLSearchParams();
        
        // Required params
        params.append('date', request.date);
        params.append('employeeCode', request.employeeCode);
        
        // Array params - use multiple query params for array
        request.serviceCodes.forEach(code => {
            params.append('serviceCodes', code);
        });
        
        // Optional participant codes
        if (request.participantCodes && request.participantCodes.length > 0) {
            request.participantCodes.forEach(code => {
                params.append('participantCodes', code);
            });
        }
        
        const url = `${APPOINTMENT_BASE_URL}/available-times?${params.toString()}`;
        const response = await api.get<AvailableTimesResponse>(url);
        return response.data;
    },
    
    // Helper: Build appointment filter criteria from UI state
    buildAppointmentFilter: (criteria: Partial<AppointmentFilterCriteria>): AppointmentFilterCriteria => {
        return {
            page: criteria.page ?? 0,
            size: criteria.size ?? 10,
            sortBy: criteria.sortBy ?? 'appointmentStartTime',
            sortDirection: criteria.sortDirection ?? 'ASC',
            datePreset: criteria.datePreset,
            dateFrom: criteria.dateFrom,
            dateTo: criteria.dateTo,
            today: criteria.today,
            status: criteria.status,
            patientCode: criteria.patientCode,
            patientName: criteria.patientName,
            patientPhone: criteria.patientPhone,
            employeeCode: criteria.employeeCode,
            roomCode: criteria.roomCode,
            serviceCode: criteria.serviceCode,
            searchCode: criteria.searchCode, // NEW: Combined search
        };
    },
};
