import { apiClient } from '@/lib/api';
import {
  TreatmentPlanSummaryDTO,
  TreatmentPlanDetailResponse,
  TreatmentPlanDetailResponseWithApproval,
  CreateTreatmentPlanRequest,
  CreateCustomPlanRequest,
  GetAllTreatmentPlansFilters,
  PageResponse,
  // Phase 3.5: Item Management APIs
  UpdateItemStatusRequest,
  UpdateItemStatusResponse,
  AddItemsToPhaseRequest,
  AddItemsToPhaseResponse,
  TemplateDetailResponse,
  ApprovePlanRequest,
  UpdatePlanItemRequest,
  UpdatePlanItemResponse,
  DeletePlanItemResponse,
  TemplateSummaryDTO,
  // V21.4: New APIs
  UpdatePricesRequest,
  UpdatePricesResponse,
  ReorderItemsRequest,
  ReorderItemsResponse,
  // BE_4: Auto-Scheduling
  CalculateScheduleRequest,
  CalculateScheduleResponse,
} from '@/types/treatmentPlan';

const BASE_URL = '/patients';
const ALL_PLANS_BASE_URL = '/patient-treatment-plans';

export class TreatmentPlanService {
  /**
   * API 5.1: Get all treatment plans for a patient (with pagination support)
   * GET /api/v1/patients/{patientCode}/treatment-plans?page=0&size=10&sort=createdAt,desc
   * 
   * Required Permissions:
   * - VIEW_TREATMENT_PLAN_ALL (Staff: Doctor, Receptionist, Manager)
   * - VIEW_TREATMENT_PLAN_OWN (Patient - only their own plans)
   * 
   * @param patientCode Patient code
   * @param page Page number (0-indexed), default: 0
   * @param size Page size, default: 20
   * @param sort Sort field and direction, e.g. "createdAt,desc"
   * @returns Paginated response with treatment plans
   */
  static async getTreatmentPlans(
    patientCode: string,
    page: number = 0,
    size: number = 20,
    sort?: string
  ): Promise<PageResponse<TreatmentPlanSummaryDTO>> {
    const axios = apiClient.getAxiosInstance();
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort) {
      params.append('sort', sort);
    }
    
    const response = await axios.get<PageResponse<TreatmentPlanSummaryDTO>>(
      `${BASE_URL}/${patientCode}/treatment-plans?${params.toString()}`
    );
    return response.data;
  }

  /**
   * API 5.1 (Legacy): Get all treatment plans without pagination
   * Returns only the content array for backward compatibility
   * 
   * @deprecated Use getTreatmentPlans() with pagination instead
   */
  static async getAllTreatmentPlansForPatient(
    patientCode: string
  ): Promise<TreatmentPlanSummaryDTO[]> {
    const pageResponse = await this.getTreatmentPlans(patientCode, 0, 1000);
    return pageResponse.content;
  }

  /**
   * API 5.2: Get detailed treatment plan
   * GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}
   * 
   * Returns complete nested structure:
   * - Plan metadata (code, name, status, dates, financial info)
   * - Doctor and patient information
   * - Progress summary (counts of phases/items)
   * - Phases with items and linked appointments
   * 
   * Required Permissions:
   * - VIEW_TREATMENT_PLAN_ALL (Staff)
   * - VIEW_TREATMENT_PLAN_OWN (Patient - only their own plans)
   */
  static async getTreatmentPlanDetail(
    patientCode: string,
    planCode: string
  ): Promise<TreatmentPlanDetailResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TreatmentPlanDetailResponse>(
      `${BASE_URL}/${patientCode}/treatment-plans/${planCode}`
    );
    return response.data;
  }

  /**
   * API 5.5: Get all treatment plans with RBAC and advanced filters
   * GET /api/v1/patient-treatment-plans
   * 
   * Smart RBAC Endpoint - Automatically filters data based on user role:
   * - Admin (VIEW_TREATMENT_PLAN_ALL): Sees ALL plans, can filter by doctor/patient
   * - Doctor (VIEW_TREATMENT_PLAN_ALL): Sees only plans they created
   * - Patient (VIEW_TREATMENT_PLAN_OWN): Sees only their own plans
   * 
   * Advanced Features:
   * - Date range filtering (startDate, createdAt)
   * - Search term (plan name, patient name)
   * - Status and approval filters
   * - Full pagination support
   * 
   * Required Permissions:
   * - VIEW_TREATMENT_PLAN_ALL (Staff: Admin, Manager, Doctor, Receptionist)
   * - VIEW_TREATMENT_PLAN_OWN (Patient)
   * 
   * @param filters Filter parameters (page, size, sort, status, approvalStatus, etc.)
   * @returns Paginated response with treatment plans
   */
  static async getAllTreatmentPlansWithRBAC(
    filters: GetAllTreatmentPlansFilters = {}
  ): Promise<PageResponse<TreatmentPlanSummaryDTO>> {
    const axios = apiClient.getAxiosInstance();
    const params = new URLSearchParams();
    
    // Pagination
    if (filters.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters.size !== undefined) {
      params.append('size', filters.size.toString());
    }
    if (filters.sort) {
      params.append('sort', filters.sort);
    }
    
    // Filters
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.approvalStatus) {
      params.append('approvalStatus', filters.approvalStatus);
    }
    if (filters.planCode) {
      params.append('planCode', filters.planCode);
    }
    if (filters.doctorEmployeeCode) {
      params.append('doctorEmployeeCode', filters.doctorEmployeeCode);
    }
    if (filters.patientCode) {
      params.append('patientCode', filters.patientCode);
    }
    if (filters.startDateFrom) {
      params.append('startDateFrom', filters.startDateFrom);
    }
    if (filters.startDateTo) {
      params.append('startDateTo', filters.startDateTo);
    }
    if (filters.createdAtFrom) {
      params.append('createdAtFrom', filters.createdAtFrom);
    }
    if (filters.createdAtTo) {
      params.append('createdAtTo', filters.createdAtTo);
    }
    if (filters.searchTerm) {
      params.append('searchTerm', filters.searchTerm);
    }
    
    const response = await axios.get<PageResponse<TreatmentPlanSummaryDTO>>(
      `${ALL_PLANS_BASE_URL}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get all treatment plans from all patients (aggregate)
   * 
   * @deprecated Use getAllTreatmentPlansWithRBAC() instead - This is a workaround that aggregates from multiple patients
   * This method is kept for backward compatibility but should be replaced with API 5.5
   * 
   * @param page Page number (0-indexed)
   * @param size Page size
   * @param sort Sort field and direction
   * @returns Paginated response with all treatment plans
   */
  static async getAllTreatmentPlans(
    page: number = 0,
    size: number = 20,
    sort?: string
  ): Promise<PageResponse<TreatmentPlanSummaryDTO>> {
    // Use API 5.5 instead of workaround
    return this.getAllTreatmentPlansWithRBAC({
      page,
      size,
      sort,
    });
  }

  /**
   * API 5.3: Create treatment plan from template
   * POST /api/v1/patients/{patientCode}/treatment-plans
   * 
   * Creates a complete patient treatment plan by copying from a template package.
   * Template plans are auto-approved (approval_status = APPROVED).
   * 
   * Required Permission: CREATE_TREATMENT_PLAN (Doctor/Manager only)
   */
  static async createTreatmentPlan(
    patientCode: string,
    request: CreateTreatmentPlanRequest
  ): Promise<TreatmentPlanDetailResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<TreatmentPlanDetailResponse>(
      `${BASE_URL}/${patientCode}/treatment-plans`,
      request
    );
    return response.data;
  }

  /**
   * API 5.4: Create custom treatment plan
   * POST /api/v1/patients/{patientCode}/treatment-plans/custom
   * 
   * Creates a custom treatment plan from scratch without using templates.
   * Doctor manually selects services, sets prices, defines phases, and specifies quantities.
   * 
   * Key Features:
   * - Quantity Expansion: quantity: 5 → creates 5 separate items
   * - Price Override: Custom pricing (must be within 50%-150% of service default)
   * - Approval Workflow: Created with approval_status = DRAFT (requires manager approval)
   * 
   * Required Permission: CREATE_TREATMENT_PLAN (Doctor/Manager only)
   * 
   * @param patientCode Patient code
   * @param request Custom plan request with phases and items
   * @returns Created treatment plan detail
   */
  static async createCustomTreatmentPlan(
    patientCode: string,
    request: CreateCustomPlanRequest
  ): Promise<TreatmentPlanDetailResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<TreatmentPlanDetailResponse>(
      `${BASE_URL}/${patientCode}/treatment-plans/custom`,
      request
    );
    return response.data;
  }

  // ============================================================================
  // Phase 3.5: Item Management APIs (5.6-5.11)
  // ============================================================================

  /**
   * API 5.6: Update Treatment Plan Item Status
   * PATCH /api/v1/patient-plan-items/{itemId}/status
   * 
   * Updates the status of a treatment plan item with full business logic:
   * - State Machine Validation: 11 transition rules
   * - Financial Impact: Skip/unskip items automatically adjusts plan costs
   * - Auto-activation: Completing item activates next item in phase
   * - Auto-complete Phase: All items done/skipped → phase completed
   * 
   * Required Permission: UPDATE_TREATMENT_PLAN
   * 
   * @param itemId Item ID
   * @param request Status update request
   * @returns Updated item with financial impact info
   */
  static async updateItemStatus(
    itemId: number,
    request: UpdateItemStatusRequest
  ): Promise<UpdateItemStatusResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<UpdateItemStatusResponse>(
      `/patient-plan-items/${itemId}/status`,
      request
    );
    return response.data;
  }

  /**
   * API 5.7: Add Emergent Items to Treatment Plan Phase
   * POST /api/v1/patient-plan-phases/{phaseId}/items?autoSubmit={true|false}
   * 
   * Adds emergent/incidental items to an existing phase.
   * 
   * Key Features (V21.4):
   * - Quantity Expansion: quantity: 2 → creates 2 separate items
   * - Auto-sequence: Backend calculates MAX(sequence) + 1
   * - Price Auto-fill: Optional price field, defaults to service.price (V21.4)
   * - Approval Workflow: Configurable via autoSubmit parameter (V21.4)
   *   - autoSubmit=true (default): Plan → PENDING_REVIEW if was APPROVED
   *   - autoSubmit=false: Plan stays in current status (for DRAFT editing)
   * 
   * Required Permission: UPDATE_TREATMENT_PLAN
   * 
   * @param phaseId Phase ID
   * @param requests Array of items to add
   * @param autoSubmit Whether to auto-submit plan to PENDING_REVIEW (default: true)
   * @returns Created items with financial impact and approval workflow info
   */
  static async addItemsToPhase(
    phaseId: number,
    requests: AddItemsToPhaseRequest,
    autoSubmit: boolean = true
  ): Promise<AddItemsToPhaseResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<AddItemsToPhaseResponse>(
      `/patient-plan-phases/${phaseId}/items`,
      requests,
      {
        params: { autoSubmit },
      }
    );
    return response.data;
  }

  /**
   * API 5.8: Get Treatment Plan Template Detail
   * GET /api/v1/treatment-plan-templates/{templateCode}
   * 
   * Gets the full structure of a treatment plan template for hybrid creation flow.
   * 
   * Key Features:
   * - Nested Structure: Template → Phases → Services
   * - Inactive Service Filtering: Backend automatically filters inactive services
   * - Enhanced Metadata: description, specialization, summary
   * - Quantity Field: FE receives raw quantity (e.g., 24), can customize before creating plan
   * 
   * Required Permission: CREATE_TREATMENT_PLAN
   * 
   * @param templateCode Template code (e.g., "TPL_ORTHO_METAL")
   * @returns Full template structure with phases and items
   */
  static async getTemplateDetail(
    templateCode: string
  ): Promise<TemplateDetailResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TemplateDetailResponse>(
      `/treatment-plan-templates/${templateCode}`
    );
    return response.data;
  }

  /**
   * API 5.9: Approve/Reject Treatment Plan
   * PATCH /api/v1/patient-treatment-plans/{planCode}/approval
   * 
   * Manager approves or rejects a treatment plan that is pending review.
   * 
   * Key Features:
   * - Manager Only: Requires APPROVE_TREATMENT_PLAN permission
   * - Status Guard: Only plans with approvalStatus = PENDING_REVIEW can be approved/rejected
   * - Zero-Price Validation: Cannot approve if any item has price ≤ 0
   * - Rejection Notes: Required when approvalStatus = REJECTED
   * 
   * Required Permission: APPROVE_TREATMENT_PLAN (Manager/Admin only)
   * 
   * @param planCode Plan code
   * @param request Approval/rejection request
   * @returns Updated plan with approval metadata
   */
  static async approveTreatmentPlan(
    planCode: string,
    request: ApprovePlanRequest
  ): Promise<TreatmentPlanDetailResponseWithApproval> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TreatmentPlanDetailResponseWithApproval>(
      `/patient-treatment-plans/${planCode}/approval`,
      request
    );
    return response.data;
  }

  /**
   * API 5.10: Update Treatment Plan Item
   * PATCH /api/v1/patient-plan-items/{itemId}
   * 
   * Updates item details (price, name, time) when plan is in DRAFT status.
   * 
   * Key Features:
   * - Partial Update: All fields optional (itemName, price, estimatedTimeMinutes)
   * - Status Guard: Only items with status PENDING/READY_FOR_BOOKING can be updated
   * - Approval Guard: Only plans with approvalStatus = DRAFT can be updated
   * - Financial Recalculation: Plan costs recalculated after update
   * 
   * Required Permission: UPDATE_TREATMENT_PLAN
   * 
   * @param itemId Item ID
   * @param request Partial update request (at least 1 field required)
   * @returns Updated item with financial impact
   */
  static async updatePlanItem(
    itemId: number,
    request: UpdatePlanItemRequest
  ): Promise<UpdatePlanItemResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<UpdatePlanItemResponse>(
      `/patient-plan-items/${itemId}`,
      request
    );
    return response.data;
  }

  /**
   * API 5.11: Delete Treatment Plan Item
   * DELETE /api/v1/patient-plan-items/{itemId}
   * 
   * Deletes an item from a treatment plan when plan is in DRAFT status.
   * 
   * Key Features:
   * - Status Guard: Only items with status PENDING/READY_FOR_BOOKING/SKIPPED can be deleted
   * - Approval Guard: Only plans with approvalStatus = DRAFT can have items deleted
   * - Appointment Check: Cannot delete items with active appointments
   * - Financial Recalculation: Plan costs recalculated after deletion
   * 
   * Required Permission: UPDATE_TREATMENT_PLAN
   * 
   * @param itemId Item ID
   * @returns Deletion confirmation with financial impact
   */
  static async deletePlanItem(
    itemId: number
  ): Promise<DeletePlanItemResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.delete<DeletePlanItemResponse>(
      `/patient-plan-items/${itemId}`
    );
    return response.data;
  }

  // ============================================================================
  // API 5.12: Submit for Review
  // ============================================================================

  /**
   * API 5.12: Submit Treatment Plan for Review
   * PATCH /api/v1/patient-treatment-plans/{planCode}/submit-for-review
   * 
   * Submits a DRAFT treatment plan to managers for approval.
   * Changes plan status from DRAFT → PENDING_REVIEW.
   * 
   * Key Features:
   * - Status Guard: Only plans with approvalStatus = DRAFT can be submitted
   * - Content Validation: Plan must have at least 1 phase and 1 item
   * - Audit Trail: Creates audit log with submission info
   * - Permission: CREATE_TREATMENT_PLAN or UPDATE_TREATMENT_PLAN
   * 
   * Required Permission: CREATE_TREATMENT_PLAN or UPDATE_TREATMENT_PLAN
   * 
   * @param planCode Plan code
   * @param request Submit request with optional notes
   * @returns Updated plan with approvalStatus = PENDING_REVIEW
   */
  static async submitForReview(
    planCode: string,
    request?: { notes?: string }
  ): Promise<TreatmentPlanDetailResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TreatmentPlanDetailResponse>(
      `/patient-treatment-plans/${planCode}/submit-for-review`,
      request || {}
    );
    return response.data;
  }

  // ============================================================================
  // API 6.6: List Treatment Plan Templates
  // ============================================================================

  /**
   * API 6.6: List Treatment Plan Templates
   * GET /api/v1/treatment-plan-templates
   * 
   * Gets a paginated list of treatment plan templates with filtering options.
   * 
   * Key Features:
   * - Pagination: Full pagination support (page, size, sort)
   * - Filtering: Filter by isActive and specializationId
   * - Lightweight: Returns summary only (no phases/services detail)
   * - Use Case: Template selection dropdown, template management
   * 
   * Required Permission: CREATE_TREATMENT_PLAN
   * 
   * @param params Filter and pagination parameters
   * @returns Paginated list of template summaries
   */
  static async listTemplates(
    params?: {
      isActive?: boolean;
      specializationId?: number;
      page?: number;
      size?: number;
      sort?: string;
    }
  ): Promise<PageResponse<TemplateSummaryDTO>> {
    const axios = apiClient.getAxiosInstance();
    const queryParams = new URLSearchParams();
    
    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params?.specializationId !== undefined) {
      queryParams.append('specializationId', params.specializationId.toString());
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }
    
    const response = await axios.get<PageResponse<TemplateSummaryDTO>>(
      `/treatment-plan-templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  }

  // ============================================================================
  // API 5.13: Update Treatment Plan Prices (Finance)
  // ============================================================================

  /**
   * API 5.13: Update Treatment Plan Prices
   * PATCH /api/v1/patient-treatment-plans/{planCode}/prices
   * 
   * Allows Finance/Accountant team to adjust treatment plan item prices after plan creation.
   * 
   * Key Features:
   * - Batch update item prices
   * - Automatically recalculates plan totals
   * - Creates audit trail (who/when/why)
   * - Permission: MANAGE_PLAN_PRICING (Manager/Accountant only)
   * 
   * Required Permission: MANAGE_PLAN_PRICING (Manager/Accountant only)
   * 
   * @param planCode Plan code
   * @param request Price update request with items and optional notes
   * @returns Updated plan with financial impact
   */
  static async updatePlanPrices(
    planCode: string,
    request: UpdatePricesRequest
  ): Promise<UpdatePricesResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<UpdatePricesResponse>(
      `/patient-treatment-plans/${planCode}/prices`,
      request
    );
    return response.data;
  }

  // ============================================================================
  // API 5.14: Reorder Treatment Plan Items
  // ============================================================================

  /**
   * API 5.14: Reorder Treatment Plan Items
   * PATCH /api/v1/patient-plan-phases/{phaseId}/items/reorder
   * 
   * Allows Doctors and Managers to reorder treatment plan items within a phase via drag-and-drop.
   * 
   * Key Features:
   * - Drag-drop reordering within same phase
   * - Set comparison validation (prevents data loss from concurrent edits)
   * - SERIALIZABLE transaction isolation (race condition protection)
   * - Must include ALL items (no omissions or duplicates)
   * 
   * Required Permission: UPDATE_TREATMENT_PLAN
   * 
   * @param phaseId Phase ID
   * @param request Reorder request with complete list of item IDs in desired order
   * @returns Reordered items with before/after sequence numbers
   */
  static async reorderItems(
    phaseId: number,
    request: ReorderItemsRequest
  ): Promise<ReorderItemsResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<ReorderItemsResponse>(
      `/patient-plan-phases/${phaseId}/items/reorder`,
      request
    );
    return response.data;
  }

  // ============================================================================
  // BE_4: Treatment Plan Auto-Scheduling
  // ============================================================================

  /**
   * BE_4: Calculate Treatment Plan Schedule (STANDALONE CALCULATOR)
   * POST /api/treatment-plans/calculate-schedule
   * Source: BE Guide 3, lines 386-470
   * 
   * IMPORTANT: This is a STANDALONE calculator, NOT tied to any existing plan.
   * Use this to PREVIEW schedule before creating a treatment plan.
   * 
   * Calculates suggested schedule considering:
   * - Service constraints (minimum prep days, recovery days, spacing days)
   * - Holidays (automatically skipped)
   * - Max appointments per day
   * 
   * NOTE: When creating treatment plan from template, BE auto-calculates schedule.
   * You typically DON'T need to call this API manually.
   * 
   * Use case: Show preview to user before they commit to creating the plan.
   * 
   * @param request Calculate schedule request (start date, duration, services list)
   * @returns Calculated schedule with dates adjusted for constraints and holidays
   * 
   * @example
   * const schedule = await TreatmentPlanService.calculateSchedule({
   *   startDate: '2025-12-15',
   *   estimatedDurationDays: 180,
   *   services: [
   *     { serviceId: 101, serviceCode: 'EXAM', serviceName: 'Examination' },
   *     { serviceId: 123, serviceCode: 'IMPLANT', serviceName: 'Implant Surgery' }
   *   ]
   * });
   * 
   * console.log(`Schedule: ${schedule.startDate} → ${schedule.endDate}`);
   * console.log(`Working days: ${schedule.actualWorkingDays}`);
   * console.log(`Holidays skipped: ${schedule.holidaysSkipped}`);
   */
  static async calculateSchedule(
    request: CalculateScheduleRequest
  ): Promise<CalculateScheduleResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<CalculateScheduleResponse>(
      '/treatment-plans/calculate-schedule', // No /v1/, no {planCode}
      request
    );
    return response.data;
  }
}

