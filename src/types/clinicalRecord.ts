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
  vitalSignsAssessment?: VitalSignAssessment[]; // ✅ Added: BE returns assessment for each vital sign
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
// Vital Signs Reference Types
// ============================================================================

export interface VitalSignsReferenceResponse {
  referenceId: number;
  vitalType: string; // "BLOOD_PRESSURE_SYSTOLIC", "HEART_RATE", "TEMPERATURE", etc.
  ageMin: number;
  ageMax: number | null;
  normalMin: number;
  normalMax: number;
  unit: string; // "mmHg", "bpm", "°C", "%"
  description: string | null;
  effectiveDate: string; // "yyyy-MM-dd"
  isActive: boolean;
}

export interface VitalSignAssessment {
  vitalType: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'BELOW_NORMAL' | 'ABOVE_NORMAL' | 'UNKNOWN';
  normalMin: number;
  normalMax: number;
  message: string; // Tiếng Việt
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
  | 'CARIES_MILD'
  | 'CARIES_MODERATE'
  | 'CARIES_SEVERE'
  | 'FILLED'
  | 'CROWN'
  | 'ROOT_CANAL'
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

// ============================================================================
// Procedure Materials Types (API 8.7, 8.8)
// ============================================================================

/**
 * API 8.7: GET Procedure Materials Response
 * Response from GET /api/v1/clinical-records/procedures/{procedureId}/materials
 */
export interface ProcedureMaterialsResponse {
  procedureId: number;
  serviceName?: string;
  serviceCode?: string;
  toothNumber?: string;
  
  // Empty state detection
  hasConsumables?: boolean; // NEW: Explicitly indicates if procedure uses materials
  
  // Material deduction status
  materialsDeducted?: boolean;
  deductedAt?: string;
  deductedBy?: string;
  storageTransactionId?: number;
  
  // Material items
  materials: ProcedureMaterialItem[];
  
  // Cost summary (only if user has VIEW_WAREHOUSE_COST permission)
  totalPlannedCost?: number | null;
  totalActualCost?: number | null;
  costVariance?: number | null; // BE returns as costVariance
}

/**
 * Material item in procedure materials response
 */
export interface ProcedureMaterialItem {
  usageId: number;
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  categoryName?: string;
  unitName: string;
  
  // Quantities
  plannedQuantity: number; // BOM reference (read-only)
  quantity: number; // NEW: Editable before deduction, defaults to plannedQuantity
  actualQuantity: number; // Editable after deduction
  varianceQuantity: number; // Computed: actualQuantity - quantity (CHANGED from actual - planned)
  varianceReason?: string | null;
  
  // Cost (only if user has VIEW_WAREHOUSE_COST permission, null otherwise)
  unitPrice?: number | null; // BE returns as unitPrice
  totalPlannedCost?: number | null;
  totalActualCost?: number | null;
  
  // Stock status
  stockStatus: 'OK' | 'LOW' | 'OUT_OF_STOCK';
  currentStock: number;
  
  // Audit
  recordedAt?: string;
  recordedBy?: string;
  notes?: string | null;
}

/**
 * API 8.8: Update Procedure Materials Request
 * Request body for PUT /api/v1/clinical-records/procedures/{procedureId}/materials
 */
export interface UpdateProcedureMaterialsRequest {
  materials: MaterialUpdateItem[];
}

export interface MaterialUpdateItem {
  usageId: number;
  actualQuantity: number;
  varianceReason?: string | null;
  notes?: string | null;
}

/**
 * API 8.9: Update Material Quantity Request
 * Request body for PATCH /api/v1/clinical-records/procedures/{procedureId}/materials/{usageId}/quantity
 */
export interface UpdateMaterialQuantityRequest {
  usageId: number;
  quantity: number; // Must be > 0
}

/**
 * API 8.9: Update Material Quantity Response
 * Response from PATCH /api/v1/clinical-records/procedures/{procedureId}/materials/{usageId}/quantity
 */
export interface UpdateMaterialQuantityResponse extends ProcedureMaterialItem {}

/**
 * API 8.8: Update Procedure Materials Response
 * Response from PUT /api/v1/clinical-records/procedures/{procedureId}/materials
 */
export interface UpdateProcedureMaterialsResponse {
  message: string;
  procedureId: number;
  materialsUpdated: number;
  stockAdjustments: StockAdjustment[];
}

export interface StockAdjustment {
  itemName: string;
  adjustment: number; // Positive = additional deduction, Negative = return to warehouse
  reason: string;
}

