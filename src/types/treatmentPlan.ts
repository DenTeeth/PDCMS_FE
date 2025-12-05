/**
 * Treatment Plan Types
 * Based on API 5.1, 5.2, 5.3 specifications
 */

// Enums
export enum TreatmentPlanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// V21: Updated PlanItemStatus enum
// - PENDING_APPROVAL → PENDING (V21 change)
// - Added WAITING_FOR_PREREQUISITE (V21 clinical rules)
// Note: CANCELLED is only for TreatmentPlanStatus, not PlanItemStatus
export enum PlanItemStatus {
  PENDING = 'PENDING', // V21: Replaces PENDING_APPROVAL
  READY_FOR_BOOKING = 'READY_FOR_BOOKING',
  WAITING_FOR_PREREQUISITE = 'WAITING_FOR_PREREQUISITE', // V21: Waiting for prerequisite service
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum PaymentType {
  FULL = 'FULL',
  PHASED = 'PHASED',
  INSTALLMENT = 'INSTALLMENT',
}

// V19: Approval Status for Custom Plans
// Note: Backend uses PENDING_REVIEW, but API may return PENDING_APPROVAL for backward compatibility
export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Frontend enum (may map to PENDING_REVIEW from backend)
  PENDING_REVIEW = 'PENDING_REVIEW', // Backend enum (used in validation)
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// DTOs
export interface DoctorInfoDTO {
  employeeCode: string;
  fullName: string;
}

export interface PatientInfoDTO {
  patientCode: string;
  fullName: string;
}

export interface LinkedAppointmentDTO {
  code: string;
  scheduledDate: string;
  status: string;
}

export interface ItemDetailDTO {
  itemId: number;
  sequenceNumber: number;
  itemName: string;
  serviceId: number;
  serviceCode: string;
  price: number;
  estimatedTimeMinutes: number;
  status: PlanItemStatus;
  completedAt: string | null;
  linkedAppointments: LinkedAppointmentDTO[];
  // V21: Optional field for prerequisite service name (if BE returns it)
  waitingForServiceName?: string;
}

export interface PhaseDetailDTO {
  phaseId: number;
  phaseNumber: number;
  phaseName: string;
  status: string;
  startDate: string | null;
  completionDate: string | null;
  estimatedDurationDays?: number; // V19: Added to API response
  items: ItemDetailDTO[];
}

export interface ProgressSummaryDTO {
  totalPhases: number;
  completedPhases: number;
  totalItems: number;
  completedItems: number;
  readyForBookingItems: number;
}

// API 5.1: Treatment Plan Summary (List)
export interface TreatmentPlanSummaryDTO {
  patientPlanId: number;
  planCode: string; //  Backend now includes this field
  patientCode: string; //  Backend fix 2025-11-15: Required for Admin navigation from list to detail
  planName: string;
  status: TreatmentPlanStatus | null; // V32: Can be null when approval_status = DRAFT (not activated yet)
  approvalStatus?: ApprovalStatus; // V19: Optional for backward compatibility
  doctor: DoctorInfoDTO;
  startDate: string;
  expectedEndDate: string;
  totalCost: number;
  discountAmount: number;
  finalCost: number;
  paymentType: PaymentType;
}

// Pagination response wrapper (Spring Boot Page<T>)
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// API 5.2: Treatment Plan Detail (Full nested structure)
export interface TreatmentPlanDetailResponse {
  planId: number;
  planCode: string;
  planName: string;
  status: TreatmentPlanStatus | null; // V32: Can be null when approval_status = DRAFT (not activated yet)
  approvalStatus?: ApprovalStatus; // V19: Optional for backward compatibility
  approvalMetadata?: ApprovalMetadataDTO; // V20: Approval metadata (who, when, notes)
  submitNotes?: string; //  NEW: Notes from doctor when submitting for review (API 5.12)
  doctor: DoctorInfoDTO;
  patient: PatientInfoDTO;
  startDate: string | null;
  expectedEndDate: string | null;
  totalPrice: number;
  discountAmount: number;
  finalCost: number;
  paymentType: PaymentType;
  createdAt: string;
  progressSummary: ProgressSummaryDTO;
  phases: PhaseDetailDTO[];
}

// API 5.3: Create Treatment Plan Request (from Template)
export interface CreateTreatmentPlanRequest {
  sourceTemplateCode: string;
  doctorEmployeeCode: string;
  planNameOverride?: string;
  discountAmount?: number;
  paymentType: PaymentType;
}

// API 5.4: Create Custom Treatment Plan Request
export interface CreateCustomPlanPhaseRequest {
  phaseNumber: number;
  phaseName: string;
  estimatedDurationDays?: number;
  items: CreateCustomPlanItemRequest[];
}

export interface CreateCustomPlanItemRequest {
  serviceCode: string;
  price?: number; // V21.4: Optional - auto-fills from service default if omitted
  sequenceNumber: number;
  quantity: number; // Key feature: 1-100, creates N trackable items
}

export interface CreateCustomPlanRequest {
  planName: string;
  doctorEmployeeCode: string;
  discountAmount: number; //  Required by BE (@NotNull) - must be >= 0
  paymentType: PaymentType;
  startDate?: string | null;
  expectedEndDate?: string | null;
  phases: CreateCustomPlanPhaseRequest[];
}

// API 5.5: Get All Treatment Plans with RBAC - Filter Request
export interface GetAllTreatmentPlansFilters {
  page?: number;
  size?: number;
  sort?: string;
  status?: TreatmentPlanStatus;
  approvalStatus?: ApprovalStatus;
  planCode?: string;
  doctorEmployeeCode?: string; // Admin only
  patientCode?: string; // Admin only
  startDateFrom?: string; // yyyy-MM-dd
  startDateTo?: string; // yyyy-MM-dd
  createdAtFrom?: string; // yyyy-MM-dd
  createdAtTo?: string; // yyyy-MM-dd
  searchTerm?: string; // Search in plan name, patient name
}

// Status Colors (for UI)
// V32: Handle null status (when approval_status = DRAFT, plan not activated yet)
export const TREATMENT_PLAN_STATUS_COLORS: Record<TreatmentPlanStatus | 'NULL', { bg: string; border: string; text: string }> = {
  NULL: {
    bg: '#F3F4F6',
    border: '#D1D5DB',
    text: 'Chưa hoàn thành',
  },
  [TreatmentPlanStatus.PENDING]: {
    bg: '#9CA3AF',
    border: '#6B7280',
    text: 'Chờ xử lý',
  },
  [TreatmentPlanStatus.IN_PROGRESS]: {
    bg: '#3B82F6',
    border: '#2563EB',
    text: 'Đang thực hiện',
  },
  [TreatmentPlanStatus.COMPLETED]: {
    bg: '#10B981',
    border: '#059669',
    text: 'Hoàn thành',
  },
  [TreatmentPlanStatus.CANCELLED]: {
    bg: '#EF4444',
    border: '#DC2626',
    text: 'Đã hủy',
  },
};

// V21: Updated status colors with new statuses
export const PLAN_ITEM_STATUS_COLORS: Record<PlanItemStatus, { bg: string; border: string; text: string }> = {
  [PlanItemStatus.PENDING]: {
    bg: '#9CA3AF',
    border: '#6B7280',
    text: 'Chờ xử lý',
  },
  [PlanItemStatus.READY_FOR_BOOKING]: {
    bg: '#10B981',
    border: '#059669',
    text: 'Sẵn sàng đặt lịch',
  },
  [PlanItemStatus.WAITING_FOR_PREREQUISITE]: {
    bg: '#F59E0B', // Orange/Yellow to indicate waiting
    border: '#D97706',
    text: 'Chờ dịch vụ tiên quyết',
  },
  [PlanItemStatus.SCHEDULED]: {
    bg: '#3B82F6',
    border: '#2563EB',
    text: 'Đã đặt lịch',
  },
  [PlanItemStatus.IN_PROGRESS]: {
    bg: '#F59E0B',
    border: '#D97706',
    text: 'Đang thực hiện',
  },
  [PlanItemStatus.COMPLETED]: {
    bg: '#10B981',
    border: '#059669',
    text: 'Hoàn thành',
  },
  [PlanItemStatus.SKIPPED]: {
    bg: '#6B7280',
    border: '#4B5563',
    text: 'Đã bỏ qua',
  },
};

// ============================================================================
// Phase 3.5: Item Management APIs (5.6-5.11) Types
// ============================================================================

// API 5.6: Update Item Status
export interface UpdateItemStatusRequest {
  status: PlanItemStatus;
  notes?: string; // Max 500 chars
  completedAt?: string; // ISO 8601 datetime, only when status=COMPLETED
}

export interface UpdateItemStatusResponse {
  itemId: number;
  sequenceNumber: number;
  itemName: string;
  serviceId: number;
  price: number;
  estimatedTimeMinutes: number;
  status: PlanItemStatus;
  completedAt: string | null;
  notes: string | null;
  phaseId: number;
  phaseName: string;
  phaseSequenceNumber: number;
  linkedAppointments: LinkedAppointmentDTO[];
  financialImpact: boolean; // true if skip/unskip affects plan cost
  financialImpactMessage: string | null; // Detailed message about financial impact
  updatedAt: string;
  updatedBy: string;
}

// API 5.7: Add Items to Phase
export interface AddItemToPhaseRequest {
  serviceCode: string; // Max 50 chars, must exist in services table
  price?: number; // V21.4: Optional - auto-fills from service default if omitted
  quantity: number; // 1-10, backend will expand to N items
  notes?: string; // Max 500 chars
}

export type AddItemsToPhaseRequest = AddItemToPhaseRequest[]; // Array of items

export interface FinancialImpactDTO {
  totalCostAdded: number;
  planTotalCostBefore: number;
  planTotalCostAfter: number;
  planFinalCostBefore: number;
  planFinalCostAfter: number;
  discountApplied: boolean;
  discountAmount: number;
}

export interface ApprovalWorkflowDTO {
  approvalRequired: boolean;
  previousApprovalStatus: ApprovalStatus;
  newApprovalStatus: ApprovalStatus;
  reason: string;
}

export interface AddItemsToPhaseResponse {
  items: Array<{
    itemId: number;
    sequenceNumber: number;
    itemName: string;
    serviceCode: string;
    serviceId: number;
    price: number;
    estimatedTimeMinutes: number;
    status: PlanItemStatus; // Always "PENDING" for new items
    notes: string | null;
    createdAt: string;
    createdBy: string;
  }>;
  financialImpact: FinancialImpactDTO;
  approvalWorkflow: ApprovalWorkflowDTO;
  message: string;
}

// API 5.8: Get Template Detail
export interface TemplateServiceDTO {
  serviceCode: string;
  serviceName: string;
  price: number; // Original price from services table (NOT snapshot)
  quantity: number; // Raw quantity value (e.g., 24), FE can customize
  sequenceNumber: number;
}

export interface TemplatePhaseDTO {
  phaseTemplateId: number;
  phaseName: string;
  stepOrder: number; // Phase order (1, 2, 3, ...)
  itemsInPhase: TemplateServiceDTO[]; // Ordered by sequenceNumber
}

// Note: TemplateSummaryDTO for API 5.8 is defined below (line 460)
// This is just a summary object within TemplateDetailResponse
export interface TemplateSummaryInfo {
  totalPhases: number;
  totalItemsInTemplate: number; // Total service types (not counting quantity)
}

export interface SpecializationDTO {
  id: number;
  name: string;
}

export interface TemplateDetailResponse {
  templateId: number;
  templateCode: string;
  templateName: string;
  description?: string; // P2 Enhancement
  specialization?: SpecializationDTO; // P2 Enhancement
  estimatedTotalCost: number;
  estimatedDurationDays: number;
  createdAt: string;
  isActive: boolean;
  summary: TemplateSummaryInfo; // P2 Enhancement
  phases: TemplatePhaseDTO[]; // Ordered by stepOrder
}

// API 5.9: Approve/Reject Treatment Plan
export interface ApprovePlanRequest {
  approvalStatus: 'APPROVED' | 'REJECTED';
  notes: string; // Max 5000 chars, REQUIRED if REJECTED
}

export interface ApprovalMetadataDTO {
  approvedBy: DoctorInfoDTO;
  approvedAt: string;
  notes: string;
}

// Note: API 5.9 response is TreatmentPlanDetailResponse with approvalMetadata field
// We'll extend TreatmentPlanDetailResponse below

// API 5.10: Update Plan Item
export interface UpdatePlanItemRequest {
  itemName?: string; // Max 500 chars
  price?: number; // > 0
  estimatedTimeMinutes?: number; // > 0
  // At least 1 field required
}

export interface UpdatePlanItemFinancialImpactDTO {
  planTotalCost: number;
  planFinalCost: number;
  priceChange: number; // newPrice - oldPrice
}

export interface UpdatePlanItemResponse {
  updatedItem: {
    itemId: number;
    sequenceNumber: number;
    itemName: string;
    serviceId: number;
    price: number;
    estimatedTimeMinutes: number;
    status: PlanItemStatus;
  };
  financialImpact: UpdatePlanItemFinancialImpactDTO;
}

// API 5.11: Delete Plan Item
export interface DeletePlanItemFinancialImpactDTO {
  planTotalCost: number;
  planFinalCost: number;
  priceChange: number | null; // Always null for delete (reduction is in priceReduction)
}

export interface DeletePlanItemResponse {
  message: string;
  deletedItemId: number;
  deletedItemName: string;
  priceReduction: number; // Amount reduced from plan
  financialImpact: DeletePlanItemFinancialImpactDTO;
}

// Extend TreatmentPlanDetailResponse to include approvalMetadata (API 5.9 response)
export interface TreatmentPlanDetailResponseWithApproval extends TreatmentPlanDetailResponse {
  approvalMetadata?: ApprovalMetadataDTO; // Present in API 5.9 response
}

// ============================================================================
// API 5.12: Submit for Review
// ============================================================================

export interface SubmitForReviewRequest {
  notes?: string; // Optional, max 1000 chars
}

// Response is TreatmentPlanDetailResponse with approvalStatus = PENDING_REVIEW

// ============================================================================
// API 6.6: List Treatment Plan Templates
// ============================================================================

export interface TemplateSummaryDTO {
  templateId: number;
  templateCode: string;
  templateName: string;
  description?: string;
  estimatedTotalCost: number;
  estimatedDurationDays: number;
  isActive: boolean;
  specialization?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface ListTemplatesParams {
  isActive?: boolean;
  specializationId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

// Response is PageResponse<TemplateSummaryDTO>

// ============================================================================
// API 5.13: Update Treatment Plan Prices (Finance)
// ============================================================================

export interface ItemPriceUpdate {
  itemId: number; // Patient plan item ID
  newPrice: number; // New price (must be >= 0)
  note?: string; // Optional reason (max 500 chars)
}

export interface UpdatePricesRequest {
  items: ItemPriceUpdate[];
}

export interface UpdatePricesResponse {
  planCode: string;
  totalCostBefore: number; //  BE field name
  totalCostAfter: number; //  BE field name
  finalCost: number; //  BE field name (after discount)
  itemsUpdated: number;
  discountUpdated: boolean; //  BE field
  updatedBy: string; //  BE field (fullName only)
  updatedByEmployeeCode: string; //  BE field
  updatedAt: string;
}

// ============================================================================
// API 5.14: Reorder Treatment Plan Items
// ============================================================================

export interface ReorderItemsRequest {
  itemIds: number[]; // Complete list of item IDs in desired order
}

export interface ReorderedItem {
  itemId: number;
  itemName: string;
  oldSequence: number;
  newSequence: number;
}

export interface ReorderItemsResponse {
  phaseId: number;
  phaseName: string;
  itemsReordered: number;
  items: ReorderedItem[];
}

