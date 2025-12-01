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
    | 'CHECKED_IN'  // Đã check-in
    | 'IN_PROGRESS' // Đang điều trị
    | 'COMPLETED'   // Hoàn thành
    | 'CANCELLED'   // Đã hủy
    | 'NO_SHOW';    // Không đến

// Legacy AppointmentFilter (deprecated - use AppointmentFilterCriteria)
export interface AppointmentFilter {
    status?: AppointmentStatus[];
    dentistId?: number;
    patientId?: number;
    serviceId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
}

// P3.3 - Date Preset Enum (matches BE)
export enum DatePreset {
    TODAY = 'TODAY',
    THIS_WEEK = 'THIS_WEEK',
    NEXT_7_DAYS = 'NEXT_7_DAYS',
    THIS_MONTH = 'THIS_MONTH',
}

// P3.3 - Appointment Filter Criteria (matches BE query params)
export interface AppointmentFilterCriteria {
    // Pagination
    page?: number;
    size?: number;
    
    // Sorting
    sortBy?: string; // default: appointmentStartTime
    sortDirection?: 'ASC' | 'DESC'; // default: ASC
    
    // Date filters
    datePreset?: DatePreset;
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
    today?: boolean; // DEPRECATED
    
    // Status filter (array)
    status?: AppointmentStatus[];
    
    // Entity filters (VIEW_ALL only)
    patientCode?: string;
    patientName?: string; // Search by name
    patientPhone?: string; // Search by phone
    employeeCode?: string;
    
    // Entity filters (all users)
    roomCode?: string;
    serviceCode?: string;
    
    // NEW: Combined search (code OR name for patient/doctor/employee/room/service)
    searchCode?: string;
}

// OLD CreateAppointmentRequest (deprecated - uses IDs)
export interface CreateAppointmentRequestLegacy {
    patientId: number;
    dentistId: number;
    serviceId: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
    reasonForVisit?: string;
}

// NEW CreateAppointmentRequest (P3.2 - matches docs)
// Phase 5: XOR validation - Must provide EITHER serviceCodes OR patientPlanItemIds, not both
export interface CreateAppointmentRequest {
    patientCode: string;        // Required: Patient code (not ID)
    employeeCode: string;        // Required: Doctor/employee code (not ID)
    roomCode: string;            // Required: Room code from available slots
    // XOR: Either serviceCodes OR patientPlanItemIds (not both, not neither)
    serviceCodes?: string[];      // Optional: Array of service codes (required if patientPlanItemIds not provided)
    appointmentStartTime: string; // Required: ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    participantCodes?: string[];  // Optional: Assistant/participant codes
    notes?: string;             // Optional: Notes from receptionist
    // Phase 5: Optional - Link to treatment plan items (required if serviceCodes not provided)
    patientPlanItemIds?: number[];  // Array of plan item IDs - BE extracts serviceCodes from items
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

// OLD RescheduleAppointmentRequest (deprecated - uses old structure)
export interface RescheduleAppointmentRequestLegacy {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    reason: string;
}

// NEW RescheduleAppointmentRequest (P3.7 - matches BE structure)
export interface RescheduleAppointmentRequest {
    newStartTime: string; // Required: ISO 8601 format (LocalDateTime)
    newEmployeeCode: string; // Required: New doctor code
    newRoomCode: string; // Required: New room code
    newParticipantCodes?: string[]; // Optional: Array of participant codes
    newServiceIds?: number[]; // Optional: Array of service IDs - if not provided, reuses old appointment's services
    reasonCode: AppointmentReasonCode; // Required: Reason code for rescheduling
    cancelNotes?: string; // Optional: Notes for cancellation
}

// P3.7 - Reschedule Appointment Response
export interface RescheduleAppointmentResponse {
    cancelledAppointment: AppointmentDetailDTO; // Old appointment (now CANCELLED)
    newAppointment: AppointmentDetailDTO; // New appointment (SCHEDULED)
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

/**
 * Appointment Status Colors for Calendar View
 * 
 * Colors are optimized for calendar display with good contrast and visual distinction:
 * - SCHEDULED: Blue (upcoming, scheduled appointments)
 * - CHECKED_IN: Orange/Amber (patient has arrived, waiting)
 * - IN_PROGRESS: Purple (actively being treated)
 * - COMPLETED: Green (successfully completed)
 * - CANCELLED: Red (cancelled appointments)
 * - NO_SHOW: Gray (patient didn't show up)
 * 
 * Matches BE AppointmentStatus enum:
 * - SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
 */
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
    SCHEDULED: { bg: '#3b82f6', border: '#2563eb', text: 'Đã đặt lịch' },      // Blue - upcoming
    CHECKED_IN: { bg: '#f59e0b', border: '#d97706', text: 'Đã check-in' },      // Orange - arrived
    IN_PROGRESS: { bg: '#8b5cf6', border: '#7c3aed', text: 'Đang điều trị' },   // Purple - active
    COMPLETED: { bg: '#22c55e', border: '#16a34a', text: 'Hoàn thành' },       // Green - success
    CANCELLED: { bg: '#ef4444', border: '#dc2626', text: 'Đã hủy' },            // Red - cancelled
    NO_SHOW: { bg: '#6b7280', border: '#4b5563', text: 'Không đến' },           // Gray - no-show
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

// P3.1 - Find Available Times Types
export interface AvailableTimesRequest {
    date: string;                    // Required: YYYY-MM-DD format
    employeeCode: string;            // Required: Doctor/employee code
    serviceCodes: string[];          // Required: Array of service codes (at least 1)
    participantCodes?: string[];    // Optional: Assistant/participant codes
}

export interface TimeSlot {
    startTime: string;                        // ISO 8601 format
    availableCompatibleRoomCodes: string[];   // List of compatible room codes
    note?: string | null;                    // Optional note
}

export interface AvailableTimesResponse {
    totalDurationNeeded: number;  // Total minutes (SUM of service duration + buffer)
    availableSlots: TimeSlot[];   // Array of available time slots
    message?: string | null;      // Optional message (e.g., "No compatible rooms")
}

// P3.2 - Create Appointment Response Types
export interface CreateAppointmentResponse {
    appointmentCode: string;
    status: 'SCHEDULED';
    appointmentStartTime: string;
    appointmentEndTime: string;
    expectedDurationMinutes: number;
    patient: {
        patientCode: string;
        fullName: string;
    };
    doctor: {
        employeeCode: string;
        fullName: string;
    };
    room: {
        roomCode: string;
        roomName: string;
    };
    services: Array<{
        serviceCode: string;
        serviceName: string;
    }>;
    participants?: Array<{
        employeeCode: string;
        fullName: string;
        role: 'ASSISTANT' | 'SECONDARY_DOCTOR' | 'OBSERVER';
    }>;
}

// P3.3 - Appointment Summary DTO (matches BE AppointmentSummaryDTO)
export interface AppointmentSummaryDTO {
    appointmentCode: string;
    status: AppointmentStatus;
    computedStatus?: string; // LATE, UPCOMING, etc. (calculated by BE)
    minutesLate?: number | null; // Minutes late for SCHEDULED appointments
    appointmentStartTime: string; // ISO 8601
    appointmentEndTime: string; // ISO 8601
    expectedDurationMinutes: number;
    patient: {
        patientCode: string;
        fullName: string;
    } | null;
    doctor: {
        employeeCode: string;
        fullName: string;
    } | null;
    room: {
        roomCode: string;
        roomName: string;
    } | null;
    services: Array<{
        serviceCode: string;
        serviceName: string;
    }>;
    participants?: Array<{
        employeeCode: string;
        fullName: string;
        role: 'ASSISTANT' | 'SECONDARY_DOCTOR' | 'OBSERVER';
    }>;
    notes?: string | null;
}

// Pagination types (same as other entities)
export interface Pageable {
    pageNumber: number;
    pageSize: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
}

export interface Sort {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}

// P3.3 - Paginated Appointment Response
export interface PaginatedAppointmentResponse {
    content: AppointmentSummaryDTO[];
    pageable: Pageable;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
    sort: Sort;
}

// P3.4 - Appointment Detail DTO (matches BE AppointmentDetailDTO)
// Similar to AppointmentSummaryDTO but with additional fields and more detailed patient info
export interface AppointmentDetailDTO {
    appointmentId?: number; // Appointment ID (from BE response)
    appointmentCode: string;
    status: AppointmentStatus;
    computedStatus?: string; // LATE, UPCOMING, etc. (calculated by BE)
    minutesLate?: number | null; // Minutes late for SCHEDULED appointments
    appointmentStartTime: string; // ISO 8601
    appointmentEndTime: string; // ISO 8601
    expectedDurationMinutes: number;
    actualStartTime?: string | null; // ISO 8601 - when treatment actually started
    actualEndTime?: string | null; // ISO 8601 - when treatment actually finished
    cancellationReason?: string | null; // Reason for cancellation (if CANCELLED)
    createdBy?: string | null; // Name of employee who created this appointment (not ID)
    createdAt?: string | null; // ISO 8601 - when appointment was created
    // Patient info is more detailed in detail DTO (may include phone, DOB)
    patient: {
        patientCode: string;
        fullName: string;
        phone?: string;
        dateOfBirth?: string;
    } | null;
    doctor: {
        employeeCode: string;
        fullName: string;
    } | null;
    room: {
        roomCode: string;
        roomName: string;
    } | null;
    services: Array<{
        serviceCode: string;
        serviceName: string;
    }>;
    participants?: Array<{
        employeeCode: string;
        fullName: string;
        role: 'ASSISTANT' | 'SECONDARY_DOCTOR' | 'OBSERVER';
    }>;
    notes?: string | null;
    /**
     * Treatment plan code linked to this appointment (if any)
     * Populated from appointment_plan_items bridge table
     * Example: "PLAN-20251001-001"
     * Null if appointment is not linked to any treatment plan
     */
    linkedTreatmentPlanCode?: string | null;
}

// P3.5 - Update Appointment Status Request
export interface UpdateAppointmentStatusRequest {
    status: AppointmentStatus; // Required: New status
    reasonCode?: AppointmentReasonCode; // Required for CANCELLED status
    notes?: string | null; // Optional: Additional notes
}

// P3.6 - Delay Appointment Request
export interface DelayAppointmentRequest {
    newStartTime: string; // Required: ISO 8601 format (new start time)
    reasonCode?: AppointmentReasonCode; // Optional: Reason for delay
    notes?: string | null; // Optional: Additional notes
}

// Appointment Reason Code Enum (matches BE AppointmentReasonCode)
export enum AppointmentReasonCode {
    PREVIOUS_CASE_OVERRUN = 'PREVIOUS_CASE_OVERRUN', // Ca trước bị kéo dài
    DOCTOR_UNAVAILABLE = 'DOCTOR_UNAVAILABLE', // Bác sĩ đột ngột không có mặt
    EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE', // Thiết bị hỏng hoặc đang bảo trì
    PATIENT_REQUEST = 'PATIENT_REQUEST', // Bệnh nhân yêu cầu thay đổi
    OPERATIONAL_REDIRECT = 'OPERATIONAL_REDIRECT', // Điều phối vận hành
    OTHER = 'OTHER', // Lý do khác
}

// Appointment Reason Code Labels (Vietnamese)
export const APPOINTMENT_REASON_CODE_LABELS: Record<AppointmentReasonCode, string> = {
    [AppointmentReasonCode.PREVIOUS_CASE_OVERRUN]: 'Ca trước bị kéo dài',
    [AppointmentReasonCode.DOCTOR_UNAVAILABLE]: 'Bác sĩ đột ngột không có mặt',
    [AppointmentReasonCode.EQUIPMENT_FAILURE]: 'Thiết bị hỏng hoặc đang bảo trì',
    [AppointmentReasonCode.PATIENT_REQUEST]: 'Bệnh nhân yêu cầu thay đổi',
    [AppointmentReasonCode.OPERATIONAL_REDIRECT]: 'Điều phối vận hành',
    [AppointmentReasonCode.OTHER]: 'Lý do khác',
};

// State Machine: Valid next statuses for each current status
export const APPOINTMENT_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    SCHEDULED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
    CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // Terminal state
    CANCELLED: [], // Terminal state
    NO_SHOW: [], // Terminal state
};

// For calendar display (defined after AppointmentSummaryDTO)
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    backgroundColor: string;
    borderColor: string;
    extendedProps: {
        appointment: Appointment | AppointmentSummaryDTO; // Support both old and new types
    };
}
