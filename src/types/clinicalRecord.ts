/**
 * Clinical Records TypeScript Types
 * Based on BE DTOs from files_from_BE/clinical_records/
 */

// ============================================================================
// Clinical Record Types
// ============================================================================

export interface ClinicalRecordResponse {
  clinicalRecordId: number;
  diagnosis: string;
  vitalSigns?: Record<string, any>; // JSONB - flexible structure
  chiefComplaint: string;
  examinationFindings: string;
  treatmentNotes?: string;
  followUpDate?: string; // yyyy-MM-dd
  createdAt: string;
  updatedAt: string;
  appointment: AppointmentDTO;
  doctor: DoctorDTO;
  patient: PatientDTO;
  procedures: ProcedureDTO[];
  prescriptions: PrescriptionDTO[];
}

export interface AppointmentDTO {
  appointmentId: number;
  appointmentCode: string;
  roomId: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  expectedDurationMinutes: number;
  status: string;
  notes?: string;
}

export interface DoctorDTO {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  phone?: string;
  email?: string;
}

export interface PatientDTO {
  patientId: number;
  patientCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface CreateClinicalRecordRequest {
  appointmentId: number;
  chiefComplaint: string; // 1-1000 chars
  examinationFindings: string; // 1-2000 chars
  diagnosis: string; // 1-500 chars
  treatmentNotes?: string; // max 2000 chars
  followUpDate?: string; // yyyy-MM-dd
  vitalSigns?: Record<string, any>;
}

export interface UpdateClinicalRecordRequest {
  examinationFindings?: string; // max 2000 chars
  treatmentNotes?: string; // max 2000 chars
  followUpDate?: string; // yyyy-MM-dd
  vitalSigns?: Record<string, any>;
}

// ============================================================================
// Procedure Types
// ============================================================================

export interface ProcedureDTO {
  procedureId: number;
  serviceCode?: string;
  serviceName?: string;
  patientPlanItemId?: number;
  toothNumber?: string;
  procedureDescription: string;
  notes?: string;
  createdAt: string;
}

export interface AddProcedureRequest {
  serviceId: number; // Required
  patientPlanItemId?: number;
  toothNumber?: string; // max 10 chars
  procedureDescription: string; // 3-1000 chars
  notes?: string; // max 1000 chars
}

export interface UpdateProcedureRequest {
  serviceId?: number;
  toothNumber?: string;
  procedureDescription?: string;
  notes?: string;
}

// ============================================================================
// Prescription Types
// ============================================================================

export interface PrescriptionDTO {
  prescriptionId: number;
  clinicalRecordId?: number;
  prescriptionNotes?: string;
  createdAt: string;
  items: PrescriptionItemDTO[];
}

export interface PrescriptionItemDTO {
  prescriptionItemId: number;
  itemMasterId?: number; // Link to warehouse inventory (optional)
  itemCode?: string;
  itemName: string;
  unitName?: string; // Unit name from warehouse
  quantity: number;
  dosageInstructions?: string;
}

export interface PrescriptionItemRequest {
  itemMasterId?: number; // Optional - link to warehouse inventory
  itemName: string; // Required - medication name
  quantity: number; // Required - must be > 0
  dosageInstructions?: string; // Optional - max 1000 chars
}

export interface SavePrescriptionRequest {
  prescriptionNotes?: string; // Optional - max 2000 chars
  items: PrescriptionItemRequest[]; // Required - must not be empty
}

// ============================================================================
// Tooth Status Types (Odontogram)
// ============================================================================

export interface ToothStatusResponse {
  toothStatusId: number;
  patientId: number;
  toothNumber: string; // FDI notation: "11", "18", "36", etc.
  status: ToothCondition;
  notes?: string;
  recordedAt: string;
  updatedAt?: string;
}

export type ToothCondition =
  | 'HEALTHY'
  | 'CARIES'
  | 'FILLED'
  | 'CROWN'
  | 'ROOT_CANAL'
  | 'EXTRACTED'
  | 'MISSING'
  | 'IMPLANT'
  | 'FRACTURED'
  | 'IMPACTED';

export interface UpdateToothStatusRequest {
  toothNumber: string; // Path parameter in API
  status: ToothCondition;
  notes?: string;
  reason?: string; // Optional reason for status change (for history)
}

// ============================================================================
// Attachment Types
// ============================================================================

export interface AttachmentResponse {
  attachmentId: number;
  clinicalRecordId?: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  attachmentType: AttachmentType;
  description?: string;
  uploadedBy?: number;
  uploadedByName?: string;
  uploadedAt: string;
}

export type AttachmentType = 
  | 'XRAY' 
  | 'PHOTO_BEFORE' 
  | 'PHOTO_AFTER' 
  | 'LAB_RESULT' 
  | 'CONSENT_FORM' 
  | 'OTHER';

export interface UploadAttachmentResponse {
  attachmentId: number;
  clinicalRecordId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  attachmentType: AttachmentType;
  description?: string;
  uploadedAt: string;
  message?: string;
}

