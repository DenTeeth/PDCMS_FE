package com.dental.clinic.management.treatment_plans.controller;

import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.dto.TreatmentPlanSummaryDTO;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.dental.clinic.management.treatment_plans.service.TreatmentPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Treatment Plan Management.
 * Handles endpoints for viewing and managing patient treatment plans.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Treatment Plans", description = "APIs for managing patient treatment plans (long-term contracts)")
@SecurityRequirement(name = "Bearer Authentication")
public class TreatmentPlanController {

        private final TreatmentPlanService treatmentPlanService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanDetailService treatmentPlanDetailService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanCreationService treatmentPlanCreationService;
        private final com.dental.clinic.management.treatment_plans.service.CustomTreatmentPlanService customTreatmentPlanService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanItemService treatmentPlanItemService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanItemAdditionService treatmentPlanItemAdditionService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanTemplateService treatmentPlanTemplateService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanApprovalService treatmentPlanApprovalService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanItemUpdateService treatmentPlanItemUpdateService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanItemDeletionService treatmentPlanItemDeletionService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanListService treatmentPlanListService;
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanPricingService treatmentPlanPricingService; // V21.4
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanReorderService treatmentPlanReorderService; // V21.5
        private final com.dental.clinic.management.treatment_plans.service.TreatmentPlanAutoScheduleService treatmentPlanAutoScheduleService; // AUTO_SCHEDULE_HOLIDAYS_AND_SPACING

        /**
         * NEW API: List all treatment plans across all patients (Manager view).
         * <p>
         * Required Permission: VIEW_ALL_TREATMENT_PLANS (typically assigned to
         * managers)
         * <p>
         * This endpoint allows managers to view all treatment plans in the system,
         * regardless of which patient they belong to. Supports filtering by:
         * - approvalStatus: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
         * - status: PENDING, ACTIVE, COMPLETED, CANCELLED
         * - doctorEmployeeCode: Filter by doctor who created the plan
         * <p>
         * Pagination: Use query params page (0-indexed) and size (default 10)
         * Example: /treatment-plans?approvalStatus=PENDING_REVIEW&page=0&size=20
         *
         * @param approvalStatus     Filter by approval status (optional)
         * @param status             Filter by plan status (optional)
         * @param doctorEmployeeCode Filter by doctor employee code (optional)
         * @param pageable           Pagination parameters (page, size, sort)
         * @return Page of treatment plan summaries with pagination metadata
         */
        @Operation(summary = "List all treatment plans (Manager view)", description = "Retrieve all treatment plans across all patients with filtering and pagination support. "
                        +
                        "This endpoint is designed for managers to get an overview of all plans in the system. " +
                        "Supports filtering by approval status, plan status, and doctor. " +
                        "Returns lightweight summaries without phase/item details for better performance. " +
                        "Requires VIEW_ALL_TREATMENT_PLANS permission.")
        @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_ALL_TREATMENT_PLANS
                        + "')")
        @GetMapping("/treatment-plans")
        public ResponseEntity<Page<com.dental.clinic.management.treatment_plans.dto.response.TreatmentPlanSummaryDTO>> listAllTreatmentPlans(
                        @Parameter(description = "Filter by approval status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)", required = false) @RequestParam(required = false) ApprovalStatus approvalStatus,

                        @Parameter(description = "Filter by plan status (PENDING, ACTIVE, COMPLETED, CANCELLED)", required = false) @RequestParam(required = false) TreatmentPlanStatus status,

                        @Parameter(description = "Filter by doctor employee code (e.g., NV-2001)", required = false) @RequestParam(required = false) String doctorEmployeeCode,

                        @Parameter(description = "Filter by template ID (e.g., 1)", required = false) @RequestParam(required = false) Long templateId,

                        @Parameter(description = "Filter by specialization ID (e.g., 1 for Orthodontics)", required = false) @RequestParam(required = false) Long specializationId,

                        @Parameter(description = "Pagination parameters (page=0, size=10, sort=createdAt,desc)", required = false) Pageable pageable) {

                log.info("REST request to list all treatment plans - filters: approvalStatus={}, status={}, doctor={}, templateId={}, specializationId={}, page={}, size={}",
                                approvalStatus, status, doctorEmployeeCode, templateId, specializationId,
                                pageable.getPageNumber(),
                                pageable.getPageSize());

                Page<com.dental.clinic.management.treatment_plans.dto.response.TreatmentPlanSummaryDTO> plans = treatmentPlanListService
                                .listAllPlans(approvalStatus, status, doctorEmployeeCode, templateId, specializationId,
                                                pageable);

                log.info("Found {} treatment plans (page {} of {})",
                                plans.getNumberOfElements(), plans.getNumber() + 1, plans.getTotalPages());

                return ResponseEntity.ok(plans);
        }

        /**
         * API 5.1: Get all treatment plans for a specific patient (with pagination).
         * <p>
         * Required Permissions:
         * - VIEW_TREATMENT_PLAN_ALL: Staff can view all patients' plans
         * - VIEW_TREATMENT_PLAN_OWN: Patient can only view their own plans
         * <p>
         * Pagination: Use query params page (0-indexed) and size (default 10)
         * Example: /patients/BN-1001/treatment-plans?page=0&size=20
         *
         * @param patientCode Unique patient code
         * @param pageable    Pagination parameters (page, size, sort)
         * @return Page of treatment plan summaries with pagination metadata
         */
        @Operation(summary = "Get treatment plans for a patient (paginated)", description = "Retrieve treatment plans (contracts) for a specific patient with pagination support. "
                        +
                        "Staff with VIEW_TREATMENT_PLAN_ALL can view any patient's plans. " +
                        "Patients with VIEW_TREATMENT_PLAN_OWN can only view their own plans. " +
                        "Supports pagination via page (0-indexed) and size query parameters. " +
                        "Response includes totalElements, totalPages, and current page info.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_TREATMENT_PLAN_ALL
                        + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_TREATMENT_PLAN_OWN
                        + "')")
        @GetMapping("/patients/{patientCode}/treatment-plans")
        public ResponseEntity<org.springframework.data.domain.Page<TreatmentPlanSummaryDTO>> getTreatmentPlans(
                        @Parameter(description = "Patient code (e.g., BN-1001)", required = true) @PathVariable String patientCode,
                        @Parameter(description = "Pagination parameters (page=0, size=10, sort=createdAt,desc)", required = false) org.springframework.data.domain.Pageable pageable) {
                log.info("REST request to get treatment plans for patient: {} (page: {}, size: {})",
                                patientCode, pageable.getPageNumber(), pageable.getPageSize());

                org.springframework.data.domain.Page<TreatmentPlanSummaryDTO> plans = treatmentPlanService
                                .getTreatmentPlansByPatient(patientCode, pageable);

                log.info("Returning {} treatment plans for patient {} (total: {}, page: {}/{})",
                                plans.getNumberOfElements(), patientCode, plans.getTotalElements(),
                                plans.getNumber() + 1, plans.getTotalPages());
                return ResponseEntity.ok(plans);
        }

        /**
         * API 5.2: Get detailed information for a specific treatment plan.
         * <p>
         * Returns complete treatment plan details with nested structure:
         * - Plan metadata (code, name, status, dates, financial info)
         * - Doctor and patient information
         * - Progress summary (counts of phases/items)
         * - Phases with items and linked appointments
         * <p>
         * Required Permissions:
         * - VIEW_TREATMENT_PLAN_ALL: Staff can view all patients' plans
         * - VIEW_TREATMENT_PLAN_OWN: Patient can only view their own plans
         *
         * @param patientCode Unique patient code (e.g., "BN-1001")
         * @param planCode    Unique treatment plan code (e.g., "PLAN-20251001-001")
         * @return Complete treatment plan details with nested phases, items, and
         *         appointments
         */
        @Operation(summary = "Get detailed treatment plan information", description = "Retrieve complete details of a specific treatment plan including phases, items, and linked appointments. "
                        +
                        "Returns nested structure: Plan → Phases → Items → Appointments. " +
                        "Includes progress summary with counts of completed phases/items. " +
                        "Staff with VIEW_TREATMENT_PLAN_ALL can view any patient's plans. " +
                        "Patients with VIEW_TREATMENT_PLAN_OWN can only view their own plans.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_TREATMENT_PLAN_ALL
                        + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_TREATMENT_PLAN_OWN
                        + "')")
        @GetMapping("/patients/{patientCode}/treatment-plans/{planCode}")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse> getTreatmentPlanDetail(
                        @Parameter(description = "Patient code (e.g., BN-1001)", required = true) @PathVariable String patientCode,
                        @Parameter(description = "Treatment plan code (e.g., PLAN-20251001-001)", required = true) @PathVariable String planCode) {
                log.info("REST request to get treatment plan detail - Patient: {}, Plan: {}", patientCode, planCode);

                com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse response = treatmentPlanDetailService
                                .getTreatmentPlanDetail(patientCode, planCode);

                log.info("Returning treatment plan detail for {} with {} phases", planCode,
                                response.getPhases().size());
                return ResponseEntity.ok(response);
        }

        /**
         * API 5.3: Create a new treatment plan from a template.
         * <p>
         * Creates a complete patient treatment plan by copying (snapshotting) all
         * phases,
         * items, and services from a pre-defined template package.
         * <p>
         * Business Logic:
         * 1. Validates patient, doctor, and template exist
         * 2. Validates discount ≤ total cost
         * 3. Generates unique plan code (PLAN-YYYYMMDD-SEQ)
         * 4. Calculates expected end date from template duration
         * 5. Snapshots all phases and items (expands by quantity, ordered by sequence)
         * 6. Calculates total cost and final cost
         * 7. Returns complete plan details (same structure as API 5.2)
         * <p>
         * Required Permission: CREATE_TREATMENT_PLAN (typically Doctor or Manager)
         *
         * @param patientCode Patient's business key (e.g., "BN-1001")
         * @param request     Request body with template code, doctor code, discount,
         *                    payment type
         * @return Newly created treatment plan with complete details (201 CREATED)
         */
        @Operation(summary = "Create treatment plan from template", description = "Create a new patient treatment plan by copying from a template package. "
                        +
                        "Automatically generates plan code, snapshots all phases/items, calculates costs, and sets expected end date. "
                        +
                        "Example: Create 'Orthodontics 2-year package' for a patient from template 'TPL_ORTHO_METAL'. "
                        +
                        "Returns the complete plan structure (same as API 5.2) with status=PENDING.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.CREATE_TREATMENT_PLAN + "')")
        @PostMapping("/patients/{patientCode}/treatment-plans")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse> createTreatmentPlan(
                        @Parameter(description = "Patient code (e.g., BN-1001)", required = true) @PathVariable String patientCode,

                        @Parameter(description = "Request body with template code, doctor code, discount, and payment type", required = true) @RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.CreateTreatmentPlanRequest request) {

                log.info("REST request to create treatment plan - Patient: {}, Template: {}, Doctor: {}",
                                patientCode, request.getSourceTemplateCode(), request.getDoctorEmployeeCode());

                com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse response = treatmentPlanCreationService
                                .createTreatmentPlanFromTemplate(patientCode, request);

                log.info("Treatment plan created successfully. PlanCode: {}, TotalItems: {}",
                                response.getPlanCode(),
                                response.getPhases().stream()
                                                .mapToInt(p -> p.getItems().size())
                                                .sum());

                return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(response);
        }

        /**
         * API 5.4: Create a CUSTOM treatment plan from scratch (without template).
         * <p>
         * Allows doctor to build a treatment plan manually by selecting services,
         * customizing prices, setting phases, and defining quantities.
         * <p>
         * Key Features:
         * - Quantity Expansion: Setting quantity=5 creates 5 separate items with
         * auto-incremented sequence
         * - Price Override: Allows custom pricing (must be within 50%-150% of service
         * default)
         * - Approval Workflow: Created plans have approval_status=DRAFT (requires
         * manager approval before activation)
         * - Phase Duration: Can set estimated_duration_days for each phase (V19)
         * <p>
         * Business Logic:
         * 1. Validates patient, doctor, and services exist and are active
         * 2. Validates phase numbers are unique (no duplicates)
         * 3. Validates each phase has at least 1 item
         * 4. Validates price overrides are within 50%-150% of service default
         * 5. Expands items by quantity (e.g., quantity=3 → creates 3 items with
         * sequence 1,2,3)
         * 6. Calculates total cost and validates discount ≤ total cost
         * 7. Saves plan with approval_status=DRAFT (requires API 5.9 for approval)
         * 8. Returns complete plan details
         * <p>
         * V19 Changes:
         * - Added approval_status=DRAFT by default
         * - Added estimated_duration_days to phases
         * - Items use status=PENDING (not PENDING_APPROVAL)
         * <p>
         * Required Permission: CREATE_TREATMENT_PLAN (typically Doctor or Manager)
         *
         * @param patientCode Patient's business key (e.g., "BN-1001")
         * @param request     Request body with phases, items, quantities, and custom
         *                    prices
         * @return Newly created custom treatment plan with complete details (201
         *         CREATED)
         */
        @Operation(summary = "Create custom treatment plan (without template)", description = "Create a fully customized treatment plan by manually selecting services, setting prices, defining phases, and specifying quantities. "
                        +
                        "KEY FEATURES: " +
                        "(1) Quantity Expansion: quantity=5 creates 5 items with names 'Service (Lần 1)', 'Service (Lần 2)', etc. "
                        +
                        "(2) Price Override: Can customize prices but must be within 50%-150% of service default. " +
                        "(3) Approval Workflow: Created with approval_status=DRAFT, requires manager approval via API 5.9 before activation. "
                        +
                        "(4) Phase Duration: Set estimated_duration_days for timeline calculation. " +
                        "Example: Create a custom orthodontics plan with 3 phases, 10 adjustment items (quantity=10), custom consultation price.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.CREATE_TREATMENT_PLAN + "')")
        @PostMapping("/patients/{patientCode}/treatment-plans/custom")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse> createCustomTreatmentPlan(
                        @Parameter(description = "Patient code (e.g., BN-1001)", required = true) @PathVariable String patientCode,

                        @Parameter(description = "Request body with plan name, phases, items, quantities, and custom prices", required = true) @RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.CreateCustomPlanRequest request) {

                log.info("REST request to create CUSTOM treatment plan - Patient: {}, Doctor: {}, Phases: {}",
                                patientCode, request.getDoctorEmployeeCode(), request.getPhases().size());

                com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse response = customTreatmentPlanService
                                .createCustomPlan(patientCode, request);

                log.info(
                                "Custom treatment plan created successfully. PlanCode: {}, TotalPrice: {}, ApprovalStatus: DRAFT, TotalItems: {}",
                                response.getPlanCode(),
                                response.getTotalPrice(),
                                response.getPhases().stream()
                                                .mapToInt(p -> p.getItems().size())
                                                .sum());

                return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(response);
        }

        /**
         * API 5.5: Get ALL treatment plans with advanced filtering and RBAC.
         * <p>
         * Smart Endpoint - Automatically filters by user role:
         * - Admin (VIEW_TREATMENT_PLAN_ALL): Can filter by
         * doctorEmployeeCode/patientCode, sees ALL plans
         * - Doctor (VIEW_TREATMENT_PLAN_OWN): Automatically filtered by createdBy =
         * currentEmployee
         * - Patient (VIEW_TREATMENT_PLAN_OWN): Automatically filtered by patient =
         * currentPatient
         * <p>
         * P0 Fixes:
         * - Uses BaseRoleConstants instead of magic numbers (2, 3)
         * - Robust RBAC logic with clear role detection
         * <p>
         * P1 Enhancements:
         * - Date range filters (startDateFrom/To, createdAtFrom/To)
         * - Search term (searches in plan name, patient name)
         * - Performance optimized (JPA Specification + JOIN FETCH)
         * <p>
         * Query Parameters:
         * - page, size, sort (standard pagination)
         * - status (PENDING, ACTIVE, COMPLETED...)
         * - approvalStatus (DRAFT, APPROVED...)
         * - planCode (exact match or prefix)
         * - doctorEmployeeCode (Admin only)
         * - patientCode (Admin only)
         * - startDateFrom/To (date range filter)
         * - createdAtFrom/To (date range filter)
         * - searchTerm (case-insensitive search)
         * <p>
         * Use Cases:
         * - Admin Dashboard: "Show all ACTIVE plans created this month"
         * - Doctor View: "My patients' treatment plans"
         * - Patient Portal: "My treatment plans"
         *
         * @param status             Filter by treatment plan status
         * @param approvalStatus     Filter by approval status (V19)
         * @param planCode           Filter by plan code (starts with)
         * @param doctorEmployeeCode Filter by doctor code (Admin only)
         * @param patientCode        Filter by patient code (Admin only)
         * @param startDateFrom      Filter start date >= this date
         * @param startDateTo        Filter start date <= this date
         * @param createdAtFrom      Filter created date >= this date
         * @param createdAtTo        Filter created date <= this date
         * @param searchTerm         Search in plan name, patient name
         * @param pageable           Pagination parameters
         * @return Page of treatment plan summaries
         */
        @Operation(summary = "Get all treatment plans with advanced filtering (API 5.5)", description = """
                        **Smart RBAC Endpoint** - Automatically filters data based on user role:

                        **Admin Mode** (VIEW_TREATMENT_PLAN_ALL):
                        - Can use `doctorEmployeeCode` and `patientCode` filters
                        - Sees ALL treatment plans in the system
                        - Example: "Show all DRAFT plans for doctor EMP001"

                        **Doctor Mode** (VIEW_TREATMENT_PLAN_OWN):
                        - Automatically filtered by `createdBy = currentEmployee`
                        - Only sees plans they created (their patients)
                        - Admin-only filters are IGNORED for security

                        **Patient Mode** (VIEW_TREATMENT_PLAN_OWN):
                        - Automatically filtered by `patient = currentPatient`
                        - Only sees their own treatment plans
                        - Admin-only filters are IGNORED for security

                        **P1 Enhancements**:
                        - Date range filters for reporting (startDate, createdAt)
                        - Search term for quick lookup (plan name, patient name)
                        - Full pagination support

                        **Performance**: Uses JPA Specification with JOIN FETCH (no N+1 problem)

                        **Example Queries**:
                        - `?status=ACTIVE&approvalStatus=APPROVED` - Active approved plans
                        - `?startDateFrom=2025-01-01&startDateTo=2025-12-31` - Plans starting in 2025
                        - `?searchTerm=orthodontics` - Search "orthodontics" in plan names
                        - `?doctorEmployeeCode=EMP001&page=0&size=20` (Admin only)
                        """)
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_TREATMENT_PLAN_ALL
                        + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_TREATMENT_PLAN_OWN
                        + "')")
        @GetMapping("/patient-treatment-plans")
        public ResponseEntity<Page<TreatmentPlanSummaryDTO>> getAllTreatmentPlans(
                        @Parameter(description = "Filter by treatment plan status", example = "ACTIVE") @RequestParam(required = false) com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus status,

                        @Parameter(description = "Filter by approval status (V19)", example = "APPROVED") @RequestParam(required = false) com.dental.clinic.management.treatment_plans.domain.ApprovalStatus approvalStatus,

                        @Parameter(description = "Filter by plan code (starts with)", example = "PLAN-20250112") @RequestParam(required = false) String planCode,

                        @Parameter(description = "Filter by doctor employee code (Admin only)", example = "EMP001") @RequestParam(required = false) String doctorEmployeeCode,

                        @Parameter(description = "Filter by patient code (Admin only)", example = "BN-1001") @RequestParam(required = false) String patientCode,

                        @Parameter(description = "Filter start date FROM (yyyy-MM-dd)", example = "2025-01-01") @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDateFrom,

                        @Parameter(description = "Filter start date TO (yyyy-MM-dd)", example = "2025-12-31") @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDateTo,

                        @Parameter(description = "Filter created date FROM (yyyy-MM-dd)", example = "2025-01-01") @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate createdAtFrom,

                        @Parameter(description = "Filter created date TO (yyyy-MM-dd)", example = "2025-12-31") @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate createdAtTo,

                        @Parameter(description = "Search term (plan name, patient name)", example = "orthodontics") @RequestParam(required = false) String searchTerm,

                        @Parameter(description = "Pagination parameters (page=0, size=20, sort=createdAt,desc)") Pageable pageable) {
                log.info("REST request to get all treatment plans - status={}, approvalStatus={}, searchTerm={}",
                                status, approvalStatus, searchTerm);

                // Build request DTO
                com.dental.clinic.management.treatment_plans.dto.request.GetAllTreatmentPlansRequest request = com.dental.clinic.management.treatment_plans.dto.request.GetAllTreatmentPlansRequest
                                .builder()
                                .status(status)
                                .approvalStatus(approvalStatus)
                                .planCode(planCode)
                                .doctorEmployeeCode(doctorEmployeeCode)
                                .patientCode(patientCode)
                                .startDateFrom(startDateFrom)
                                .startDateTo(startDateTo)
                                .createdAtFrom(createdAtFrom)
                                .createdAtTo(createdAtTo)
                                .searchTerm(searchTerm)
                                .build();

                Page<TreatmentPlanSummaryDTO> plans = treatmentPlanService.getAllTreatmentPlans(request, pageable);

                log.info("Returning {} treatment plans (page {}/{}, total: {})",
                                plans.getNumberOfElements(), plans.getNumber() + 1, plans.getTotalPages(),
                                plans.getTotalElements());

                return ResponseEntity.ok(plans);
        }

        /**
         * API 5.6: Update treatment plan item status.
         * <p>
         * Allows updating the status of a treatment plan item with full business logic:
         * - State Machine Validation (11 transition rules)
         * - Appointment Validation (cannot skip items with active appointments)
         * - Financial Recalculation (adjust plan costs when skipping/unskipping items)
         * - Auto-activate next item in phase when completing an item
         * - Auto-complete phase when all items are done/skipped
         * - Audit logging
         * <p>
         * State Machine Rules:
         * - PENDING → READY_FOR_BOOKING, SKIPPED, COMPLETED
         * - READY_FOR_BOOKING → SCHEDULED, SKIPPED, COMPLETED
         * - SCHEDULED → IN_PROGRESS, COMPLETED (CANNOT skip if appointment active)
         * - IN_PROGRESS → COMPLETED (CANNOT skip if in progress)
         * - SKIPPED → READY_FOR_BOOKING, COMPLETED (allow undo)
         * - COMPLETED → (no further transitions)
         * <p>
         * Financial Impact:
         * - Skipping item: Reduces plan.total_cost and plan.final_cost by item.price
         * - Unskipping (SKIPPED → READY_FOR_BOOKING): Adds item.price back to plan
         * costs
         * <p>
         * Required Permission: UPDATE_TREATMENT_PLAN (Admin, Manager, Dentist)
         *
         * @param itemId  ID of the treatment plan item to update
         * @param request Request body with new status, notes, and optional completedAt
         * @return Updated item details with financial impact information
         */
        @Operation(summary = "Update treatment plan item status (API 5.6)", description = """
                        **Update item status with comprehensive business logic:**

                        **State Machine** (11 transition rules):
                        - PENDING → READY_FOR_BOOKING, SKIPPED, COMPLETED
                        - READY_FOR_BOOKING → SCHEDULED, SKIPPED, COMPLETED
                        - SCHEDULED → IN_PROGRESS, COMPLETED (Cannot skip if appointment active)
                        - IN_PROGRESS → COMPLETED (Cannot skip)
                        - SKIPPED → READY_FOR_BOOKING, COMPLETED (allow undo)
                        - COMPLETED → (no transitions)

                        **Appointment Validation**:
                        - Cannot skip items with SCHEDULED/IN_PROGRESS/CHECKED_IN appointments
                        - System returns 409 CONFLICT with error message

                        **Financial Impact** (CRITICAL):
                        - SKIP: plan.total_cost -= item.price, plan.final_cost -= item.price
                        - UNSKIP (SKIPPED → READY_FOR_BOOKING): Add item.price back
                        - Response includes `financialImpact` flag and `financialImpactMessage`

                        **Auto-Activation**:
                        - Completing item auto-activates next PENDING item (PENDING → READY_FOR_BOOKING)

                        **Auto-Complete Phase**:
                        - When all items are COMPLETED/SKIPPED, phase status → COMPLETED

                        **Example Use Cases**:
                        1. Skip consultation: `{"status": "SKIPPED", "notes": "Patient declined"}`
                        2. Complete item: `{"status": "COMPLETED", "completedAt": "2024-01-15T14:30:00"}`
                        3. Undo skip: `{"status": "READY_FOR_BOOKING"}` (costs restored)
                        """)
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.UPDATE_TREATMENT_PLAN + "')")
        @PatchMapping("/patient-plan-items/{itemId}/status")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.PatientPlanItemResponse> updateItemStatus(
                        @Parameter(description = "ID of the treatment plan item to update", required = true, example = "1001") @PathVariable Long itemId,

                        @Parameter(description = "Request body with new status, optional notes, and completedAt timestamp", required = true) @RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.UpdateItemStatusRequest request) {

                log.info("REST request to update item {} status to {}", itemId, request.getStatus());

                com.dental.clinic.management.treatment_plans.dto.response.PatientPlanItemResponse response = treatmentPlanItemService
                                .updateItemStatus(itemId, request);

                log.info("Item {} status updated successfully. FinancialImpact: {}, Message: {}",
                                itemId, response.getFinancialImpact(), response.getFinancialImpactMessage());

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.7: Add new items to an existing phase (emergent/incidental items).
         * <p>
         * Use Case: Doctor discovers 2 cavities during orthodontic checkup
         * → Add FILLING_COMP service × 2 to current phase
         * <p>
         * Features:
         * - Auto-sequence generation (Backend calculates max sequence + 1)
         * - Quantity expansion (1 service × 2 quantity = 2 separate items)
         * - Financial recalculation (adds to total_cost, recalculates final_cost with
         * discount)
         * - Approval workflow (Plan → PENDING_REVIEW for manager approval)
         * - Comprehensive validation (phase/plan status checks)
         * <p>
         * Business Rules:
         * 1. Cannot add to COMPLETED phase
         * 2. Cannot add to plan with PENDING_REVIEW approval status
         * 3. Cannot add to COMPLETED or CANCELLED plan
         * 4. Price must be within ±50% of service default price
         * 5. Service must exist and be active
         * 6. All added items start with status = PENDING (waiting approval)
         * 7. Plan changes to PENDING_REVIEW (manager must re-approve)
         * <p>
         * Required Permission: UPDATE_TREATMENT_PLAN (Admin, Manager, Dentist)
         *
         * @param phaseId  ID of the phase to add items to
         * @param requests List of items to add (serviceCode, price, quantity, notes)
         * @return Response with created items, financial impact, and approval status
         */
        @Operation(summary = "Add emergent items to a treatment plan phase (API 5.7)", description = """
                        **Add incidental/emergent items to an existing phase:**

                        **Use Case Example:**
                        - Patient is in orthodontic treatment (Phase 1: Preparation)
                        - During checkup, doctor discovers 2 new cavities on teeth 46, 47
                        - Doctor adds FILLING_COMP service × 2 to current phase
                        - System creates 2 separate items with auto-sequence numbers
                        - Plan total cost increases, requires manager re-approval

                        **Auto-Sequence Generation** (P0 Fix):
                        - Backend calculates: `nextSequence = MAX(existing_sequences) + 1`
                        - Example: Phase has items [1,2,3] → New items start at sequence 4
                        - No sequence conflicts or gaps possible

                        **Quantity Expansion:**
                        - Request: `{serviceCode: "FILLING_COMP", quantity: 2, price: 400000}`
                        - Creates 2 items:
                          - "Trám răng Composite (Phát sinh - Lần 1)" (sequence 4)
                          - "Trám răng Composite (Phát sinh - Lần 2)" (sequence 5)

                        **Financial Impact** (P0 Fix - Correct Discount Logic):
                        - Adds items to `plan.total_cost`
                        - Recalculates `plan.final_cost = total_cost - discount_amount`
                        - Response includes before/after financial summary
                        - Example: +800,000 VND → total 15,000,000 → 15,800,000

                        **Approval Workflow:**
                        - Plan status changes to `PENDING_REVIEW`
                        - Manager must approve before items become active
                        - Response includes approval requirement notice

                        **Validation Rules:**
                        - Cannot add to COMPLETED phase
                        - Cannot add if plan is PENDING_REVIEW (approve first)
                        - Cannot add to COMPLETED/CANCELLED plan
                        - Price must be within ±50% of service default
                        - Service must exist and be active

                        **Example Request:**
                        ```json
                        [
                          {
                            "serviceCode": "FILLING_COMP",
                            "price": 400000,
                            "quantity": 2,
                            "notes": "Phát hiện 2 răng sâu mặt nhai 46, 47 tại tái khám"
                          }
                        ]
                        ```
                        """)
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.UPDATE_TREATMENT_PLAN + "')")
        @PostMapping("/patient-plan-phases/{phaseId}/items")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.AddItemsToPhaseResponse> addItemsToPhase(
                        @Parameter(description = "ID of the phase to add items to", required = true, example = "201") @PathVariable Long phaseId,

                        @Parameter(description = "List of items to add (serviceCode, price, quantity, notes)", required = true) @RequestBody @jakarta.validation.Valid java.util.List<com.dental.clinic.management.treatment_plans.dto.request.AddItemToPhaseRequest> requests,

                        @Parameter(description = "V21.4: Auto-submit plan to PENDING_REVIEW after adding items (default: true for backward compatibility). Use false for DRAFT plans to keep editing.", example = "true") @RequestParam(required = false, defaultValue = "true") Boolean autoSubmit) {

                log.info("REST request to add {} item(s) to phase {} (autoSubmit={})", requests.size(), phaseId,
                                autoSubmit);

                com.dental.clinic.management.treatment_plans.dto.response.AddItemsToPhaseResponse response = treatmentPlanItemAdditionService
                                .addItemsToPhase(phaseId, requests, autoSubmit);

                log.info(" Successfully added {} items. Financial impact: total cost +{} VND.",
                                response.getItems().size(),
                                response.getFinancialImpact().getTotalCostAdded());

                return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(response);
        }

        /**
         * API 5.8: Get Treatment Plan Template Detail (for Hybrid Workflow).
         * <p>
         * **Use Case:** "Hybrid" workflow - Load template structure, customize, then
         * create custom plan.
         * <p>
         * **Workflow:**
         * 1. FE calls this API to load template structure (phases + services)
         * 2. FE allows user to customize (add/remove services, change quantity, adjust
         * price)
         * 3. FE sends customized structure to API 5.4 (Create Custom Plan)
         * <p>
         * **Example Scenario:**
         * - Doctor wants to create orthodontic plan based on template "TPL_ORTHO_METAL"
         * - Load template → See 4 phases with 8 services (including 24× monthly
         * adjustments)
         * - Customize: Add "Tooth Extraction" service, reduce adjustments from 24 to 12
         * - Create custom plan with modified structure
         * <p>
         * **Permission:** Requires CREATE_TREATMENT_PLAN (P1 Fix - removed VIEW_ALL)
         * <p>
         * **P1 Fixes Applied:**
         * - Backend filters out inactive services from phases
         * - Logs warnings if services are filtered
         * <p>
         * **P2 Enhancements:**
         * - Returns 410 GONE if template is inactive (different from 404 NOT_FOUND)
         * - Returns specialization object { id, name } (reserved for future - currently
         * null)
         * - Returns summary { totalPhases, totalItemsInTemplate }
         * - Returns description field
         *
         * @param templateCode Template code (e.g., "TPL_ORTHO_METAL",
         *                     "TPL_IMPLANT_OSSTEM")
         * @return Full template structure with phases and services
         */
        @Operation(summary = "API 5.8 - Get Treatment Plan Template Detail", description = """
                        **Purpose:** Load template structure for Hybrid workflow (template-based customization).

                        **Use Case:**
                        Doctor wants to create a treatment plan based on a template but needs to customize it:
                        1. Load template detail (this API) → Get full structure
                        2. Customize in FE → Add/remove services, change quantities, adjust prices
                        3. Create custom plan (API 5.4) → Send modified structure

                        **Example:**
                        - Template: "Gói Niềng Răng Kim Loại 2 năm"
                        - Default: 4 phases, 24× monthly adjustments
                        - Customize: Add "Nhổ răng khôn", reduce adjustments to 12×
                        - Create custom plan with new structure

                        **Response Structure:**
                        - `templateId`, `templateCode`, `templateName`, `description`
                        - `specialization`: { id, name } (reserved - currently null)
                        - `estimatedTotalCost`, `estimatedDurationDays`
                        - `summary`: { totalPhases, totalItemsInTemplate }
                        - `phases[]`: Array of phases (ordered by stepOrder)
                          - `phaseTemplateId`, `phaseName`, `stepOrder`
                          - `itemsInPhase[]`: Array of services (ordered by sequenceNumber)
                            - `serviceCode`, `serviceName`, `price` (giá gốc from services table)
                            - `quantity`, `sequenceNumber`

                        **P1 Fix (Nested Validation):**
                        Backend automatically filters out inactive services from phases. FE always receives "clean" templates.

                        **P2 Enhancements:**
                        - 410 GONE if template is inactive (vs 404 if not found)
                        - Specialization object (not just ID)
                        - Summary statistics for quick overview

                        **Example Response:**
                        ```json
                        {
                          "templateId": 1,
                          "templateCode": "TPL_ORTHO_METAL",
                          "templateName": "Gói Niềng Răng Mắc Cài Kim Loại (Cơ bản)",
                          "description": "Gói điều trị chỉnh nha toàn diện...",
                          "specialization": null,
                          "estimatedTotalCost": 30000000,
                          "estimatedDurationDays": 730,
                          "summary": {
                            "totalPhases": 4,
                            "totalItemsInTemplate": 7
                          },
                          "phases": [
                            {
                              "phaseTemplateId": 1,
                              "phaseName": "Giai đoạn 1: Khám & Chuẩn bị",
                              "stepOrder": 1,
                              "itemsInPhase": [
                                {
                                  "serviceCode": "ORTHO_CONSULT",
                                  "serviceName": "Khám & Tư vấn Chỉnh nha",
                                  "price": 0,
                                  "quantity": 1,
                                  "sequenceNumber": 1
                                },
                                {
                                  "serviceCode": "ORTHO_FILMS",
                                  "serviceName": "Chụp Phim Chỉnh nha (Pano, Ceph)",
                                  "price": 500000,
                                  "quantity": 1,
                                  "sequenceNumber": 2
                                }
                              ]
                            }
                          ]
                        }
                        ```
                        """)
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.CREATE_TREATMENT_PLAN + "')")
        @GetMapping("/treatment-plan-templates/{templateCode}")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.GetTemplateDetailResponse> getTemplateDetail(
                        @Parameter(description = "Template code (e.g., TPL_ORTHO_METAL, TPL_IMPLANT_OSSTEM)", required = true, example = "TPL_ORTHO_METAL") @PathVariable String templateCode) {

                log.info("REST request to get template detail for: {}", templateCode);

                com.dental.clinic.management.treatment_plans.dto.response.GetTemplateDetailResponse response = treatmentPlanTemplateService
                                .getTemplateDetail(templateCode);

                log.info("Successfully retrieved template: {} ({} phases, {} items)",
                                response.getTemplateName(),
                                response.getSummary().getTotalPhases(),
                                response.getSummary().getTotalItemsInTemplate());

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.6: List Treatment Plan Templates with Filters.
         * <p>
         * Returns a paginated list of templates with optional filters.
         * Lightweight response (does not include phases/services detail).
         * <p>
         * Use Cases:
         * - Dropdown: List active templates for a specific specialization
         * - Admin: List all templates (active + inactive)
         * - Scalability: Show templates filtered by department
         * <p>
         * Filters:
         * - isActive (Boolean, optional): Filter by active status
         * - specializationId (Integer, optional): Filter by specialization
         * <p>
         * Pagination:
         * - page (int, default 0): Zero-based page number
         * - size (int, default 20): Page size
         * - sort (string, optional): Sort field (e.g., "templateName,asc")
         * <p>
         * Required Permission: CREATE_TREATMENT_PLAN (same as API 5.8)
         *
         * @param isActive         Filter by active status (null = no filter)
         * @param specializationId Filter by specialization (null = no filter)
         * @param pageable         Pagination parameters
         * @return Page of TemplateSummaryDTO with pagination metadata
         */
        @Operation(summary = "API 6.6: List Treatment Plan Templates", description = """
                        **Purpose:** Get paginated list of treatment plan templates with optional filters.

                        **Use Cases:**
                        - Dropdown for template selection
                        - Admin template management
                        - Filter by specialization or active status

                        **Filters (all optional):**
                        - `isActive`: true (active only), false (inactive only), null (all)
                        - `specializationId`: Filter by specialization (e.g., 1 = Chỉnh nha)

                        **Pagination:**
                        - `page`: Zero-based page number (default 0)
                        - `size`: Items per page (default 20)
                        - `sort`: Sort criteria (e.g., "templateName,asc")

                        **Response:** Lightweight summary (no phases/services). Use API 5.8 for full detail.
                        """)
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.CREATE_TREATMENT_PLAN + "')")
        @GetMapping("/treatment-plan-templates")
        public ResponseEntity<org.springframework.data.domain.Page<com.dental.clinic.management.treatment_plans.dto.response.TemplateSummaryDTO>> listTemplates(
                        @Parameter(description = "Filter by active status (true/false/null for all)", required = false, example = "true") @org.springframework.web.bind.annotation.RequestParam(required = false) Boolean isActive,
                        @Parameter(description = "Filter by specialization ID (e.g., 1 = Chỉnh nha)", required = false, example = "1") @org.springframework.web.bind.annotation.RequestParam(required = false) Integer specializationId,
                        @org.springdoc.core.annotations.ParameterObject org.springframework.data.domain.Pageable pageable) {

                log.info(" REST request to list templates - isActive={}, specializationId={}, page={}, size={}",
                                isActive, specializationId, pageable.getPageNumber(), pageable.getPageSize());

                org.springframework.data.domain.Page<com.dental.clinic.management.treatment_plans.dto.response.TemplateSummaryDTO> response = treatmentPlanTemplateService
                                .getAllTemplates(isActive, specializationId, pageable);

                log.info(" Retrieved {} templates (total={}, page={}/{})",
                                response.getNumberOfElements(),
                                response.getTotalElements(),
                                response.getNumber() + 1,
                                response.getTotalPages());

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.9: Approve or Reject a Treatment Plan (V20).
         * <p>
         * Used by managers to approve or reject a treatment plan that is in
         * PENDING_REVIEW status.
         * This is part of the price override control workflow (V19/V20).
         * <p>
         * Business Rules:
         * - Plan must be in PENDING_REVIEW status
         * - If REJECTED, notes are mandatory
         * - If APPROVED, all items must have price > 0
         * - Creates audit trail in plan_audit_logs
         * - APPROVED: Plan becomes available for activation (API 5.5)
         * - REJECTED: Plan returns to DRAFT status for doctor to revise
         * <p>
         * Required Permission: APPROVE_TREATMENT_PLAN (assigned to ROLE_MANAGER)
         *
         * @param planCode Unique treatment plan code (e.g., "PLAN-20251111-002")
         * @param request  Approval request with status (APPROVED/REJECTED) and notes
         * @return Updated treatment plan detail with approval metadata
         */
        @Operation(summary = "API 5.9: Approve/Reject Treatment Plan (Manager)", description = "Manager approves or rejects a treatment plan in PENDING_REVIEW status. "
                        +
                        "This is the final gate-keeper for price override control workflow. " +
                        "APPROVED: Plan can be activated by doctor. " +
                        "REJECTED: Plan returns to DRAFT for revision. " +
                        "Audit trail is automatically logged.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.APPROVE_TREATMENT_PLAN
                        + "')")
        @PatchMapping("/patient-treatment-plans/{planCode}/approval")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse> approveTreatmentPlan(
                        @Parameter(description = "Treatment plan code (e.g., PLAN-20251111-002)", required = true, example = "PLAN-20251111-002") @PathVariable String planCode,
                        @Parameter(description = "Approval request with status (APPROVED/REJECTED) and notes", required = true) @org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.ApproveTreatmentPlanRequest request) {

                log.info("REST request to approve/reject treatment plan: {} with status: {}",
                                planCode, request.getApprovalStatus());

                com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse response = treatmentPlanApprovalService
                                .approveTreatmentPlan(planCode, request);

                log.info("Treatment plan {} approval status updated to: {}",
                                planCode, response.getApprovalStatus());

                return ResponseEntity.ok(response);
        }

        /**
         * FE Compatibility Endpoint: POST /treatment-plans/{planCode}/approve
         * Alias for PATCH /patient-treatment-plans/{planCode}/approval
         * Added to support FE's current implementation
         */
        @Operation(summary = "Approve/Reject Treatment Plan (FE Alias)", description = "Alias endpoint for FE compatibility. Use PATCH /patient-treatment-plans/{planCode}/approval instead.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.APPROVE_TREATMENT_PLAN
                        + "')")
        @PostMapping("/treatment-plans/{planCode}/approve")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse> approveTreatmentPlanAlias(
                        @Parameter(description = "Treatment plan code", required = true) @PathVariable String planCode,
                        @Parameter(description = "Approval request", required = true) @org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.ApproveTreatmentPlanRequest request) {

                log.info("REST request (FE alias) to approve/reject treatment plan: {} with status: {}",
                                planCode, request.getApprovalStatus());

                com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse response = treatmentPlanApprovalService
                                .approveTreatmentPlan(planCode, request);

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.10: Update Treatment Plan Item (V20).
         * <p>
         * Used by doctors to update item details (name, price, estimated time) after
         * corrections.
         * Typically used when manager rejects a plan and doctor needs to fix incorrect
         * prices.
         * <p>
         * Business Rules:
         * - Item must NOT be SCHEDULED, IN_PROGRESS, or COMPLETED
         * - Plan must be in DRAFT status (not APPROVED or PENDING_REVIEW)
         * - Financial impact is automatically recalculated
         * - Audit trail is logged
         * - Approval status remains DRAFT (no auto-trigger to PENDING_REVIEW)
         * <p>
         * Required Permission: UPDATE_TREATMENT_PLAN (assigned to ROLE_DENTIST,
         * ROLE_MANAGER)
         *
         * @param itemId  The item ID to update
         * @param request Update request with optional fields (itemName, price,
         *                estimatedTimeMinutes)
         * @return Response with updated item and financial impact
         */
        @Operation(summary = "API 5.10: Update Treatment Plan Item", description = "Doctor updates item details (name, price, time) when plan is in DRAFT. "
                        +
                        "Typically used to fix incorrect prices after manager rejection. " +
                        "Financial impact is auto-calculated. " +
                        "Approval status stays DRAFT (doctor must explicitly re-submit).")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.UPDATE_TREATMENT_PLAN
                        + "')")
        @PatchMapping("/patient-plan-items/{itemId}")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.UpdatePlanItemResponse> updatePlanItem(
                        @Parameter(description = "Item ID to update", required = true, example = "536") @PathVariable Long itemId,
                        @Parameter(description = "Update request with optional fields", required = true) @org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.UpdatePlanItemRequest request) {

                log.info("REST request to update plan item: {}", itemId);

                com.dental.clinic.management.treatment_plans.dto.response.UpdatePlanItemResponse response = treatmentPlanItemUpdateService
                                .updatePlanItem(itemId, request);

                log.info("Plan item {} updated successfully. Price change: {}",
                                itemId, response.getFinancialImpact().getPriceChange());

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.11: Delete Plan Item from Treatment Plan (V20).
         * <p>
         * Business flow: Doctor deletes an incorrectly added item from DRAFT plan
         * before submitting for review. Item must be PENDING (not scheduled/completed).
         * Plan must be in DRAFT status (not APPROVED or PENDING_REVIEW).
         * <p>
         * Financial impact: Plan totals are automatically recalculated (decreased by
         * item price).
         * Audit log is created with ITEM_DELETED action.
         * <p>
         * Required Permission: UPDATE_TREATMENT_PLAN (ROLE_DENTIST, ROLE_MANAGER,
         * ROLE_ADMIN)
         *
         * @param itemId ID of the plan item to delete
         * @return DeletePlanItemResponse with deleted item details and financial impact
         */
        @Operation(summary = "API 5.11: Delete Plan Item", description = "Doctor deletes an incorrectly added item from plan (must be DRAFT, item must be PENDING). "
                        +
                        "Plan finances are automatically recalculated. Audit log created. " +
                        "Returns deleted item details and new plan totals for FE toast notification.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.UPDATE_TREATMENT_PLAN
                        + "')")
        @DeleteMapping("/patient-plan-items/{itemId}")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.DeletePlanItemResponse> deleteItem(
                        @Parameter(description = "ID of the plan item to delete", required = true, example = "538") @PathVariable Long itemId) {

                log.info(" REST request to delete plan item: {}", itemId);

                com.dental.clinic.management.treatment_plans.dto.response.DeletePlanItemResponse response = treatmentPlanItemDeletionService
                                .deleteItem(itemId);

                log.info("Plan item {} deleted successfully. Price reduction: {} VND. Item name: '{}'",
                                itemId, response.priceReduction(), response.deletedItemName());

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.12: Submit Treatment Plan for Review (V21).
         * <p>
         * Used by doctors to submit a completed DRAFT plan to managers for approval.
         * This is the missing link in the approval workflow that allows doctors to
         * manually trigger DRAFT → PENDING_REVIEW status change.
         * <p>
         * Business Rules:
         * - Plan must be in DRAFT status
         * - Plan must have at least 1 phase and 1 item
         * - Changes plan status to PENDING_REVIEW
         * - Creates audit trail in plan_audit_logs
         * <p>
         * Required Permission: CREATE_TREATMENT_PLAN or UPDATE_TREATMENT_PLAN (assigned
         * to ROLE_DENTIST)
         *
         * @param planCode Unique treatment plan code (e.g., "PLAN-20251111-002")
         * @param request  Submit request with optional notes
         * @return Updated treatment plan detail with status = PENDING_REVIEW
         */
        @Operation(summary = "API 5.12: Submit Treatment Plan for Review (Doctor)", description = "Doctor submits a completed DRAFT plan for manager approval. "
                        +
                        "This is the critical step that moves plan from DRAFT → PENDING_REVIEW. " +
                        "Plan must have at least 1 phase and 1 item. " +
                        "Audit trail is automatically logged.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.CREATE_TREATMENT_PLAN
                        + "') or hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.UPDATE_TREATMENT_PLAN
                        + "')")
        @PatchMapping("/patient-treatment-plans/{planCode}/submit-for-review")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse> submitForReview(
                        @Parameter(description = "Treatment plan code (e.g., PLAN-20251111-002)", required = true, example = "PLAN-20251111-002") @PathVariable String planCode,
                        @Parameter(description = "Submit request with optional notes", required = false) @org.springframework.web.bind.annotation.RequestBody(required = false) @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.SubmitForReviewRequest request) {

                log.info(" REST request to submit treatment plan for review: {}", planCode);

                com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse response = treatmentPlanApprovalService
                                .submitForReview(planCode, request);

                log.info(" Treatment plan {} submitted for review. Status: DRAFT → PENDING_REVIEW", planCode);

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.13: Update Treatment Plan Prices (Finance/Accounting - V21.4).
         * <p>
         * Allows Finance/Accounting team to adjust item prices and discounts before
         * approval.
         * This is part of the new pricing model where doctors don't manage prices.
         * <p>
         * Business Rules:
         * - Plan must not be COMPLETED or CANCELLED
         * - All items must exist and belong to the plan
         * - New prices must be >= 0
         * - Automatically recalculates total cost and final cost
         * - Creates audit trail with who/when/why
         * <p>
         * Workflow:
         * 1. Doctor creates plan with default service prices (API 5.4)
         * 2. Doctor submits for review (API 5.12)
         * 3. Finance adjusts prices if needed (THIS API)
         * 4. Manager approves final plan (API 5.9)
         * <p>
         * Required Permission: MANAGE_PLAN_PRICING (assigned to ROLE_MANAGER,
         * ROLE_ACCOUNTANT)
         *
         * @param planCode Treatment plan code (e.g., "PLAN-20251119-001")
         * @param request  Price update request with item prices and discount
         * @return Summary of price changes with before/after costs
         */
        @Operation(summary = "API 5.13: Update Treatment Plan Prices (Finance)", description = "Finance/Accounting team adjusts item prices and discounts. "
                        +
                        "Part of new pricing model (V21.4) where doctors don't manage prices. " +
                        "Automatically recalculates costs and creates audit trail. " +
                        "Typically used between doctor submission (API 5.12) and manager approval (API 5.9).")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.MANAGE_PLAN_PRICING + "')")
        @PatchMapping("/patient-treatment-plans/{planCode}/prices")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.UpdatePricesResponse> updatePlanPrices(
                        @Parameter(description = "Treatment plan code (e.g., PLAN-20251119-001)", required = true, example = "PLAN-20251119-001") @PathVariable String planCode,
                        @Parameter(description = "Price update request with item prices and discount", required = true) @org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.UpdatePricesRequest request) {

                log.info(" REST request to update prices for plan: {} ({} items)",
                                planCode, request.getItems().size());

                com.dental.clinic.management.treatment_plans.dto.response.UpdatePricesResponse response = treatmentPlanPricingService
                                .updatePlanPrices(planCode, request);

                log.info(" Prices updated for plan {}. Cost: {} → {} VND",
                                planCode, response.getTotalCostBefore(), response.getTotalCostAfter());

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.14: Reorder Items Within Phase (V21.5).
         * <p>
         * Allows drag-and-drop reordering of treatment items within a phase.
         * Updates sequence_number for all items based on the provided array order.
         * <p>
         * Business Rules:
         * - Phase must exist
         * - Plan must not be COMPLETED or CANCELLED
         * - Not recommended for APPROVED plans (should revert to DRAFT first)
         * - All items must exist and belong to the phase
         * - Item count must match exactly (no missing/extra items)
         * - Uses SERIALIZABLE isolation to prevent race conditions
         * <p>
         * Use Cases:
         * - Doctor reorders treatment steps during planning
         * - Adjust sequence based on clinical findings
         * - Optimize treatment flow for efficiency
         * <p>
         * Required Permission: UPDATE_TREATMENT_PLAN (assigned to ROLE_DENTIST,
         * ROLE_MANAGER)
         *
         * @param phaseId Phase ID
         * @param request Reorder request with item IDs in new desired order
         * @return Response with updated sequence numbers
         */
        @Operation(summary = "API 5.14: Reorder Items Within Phase", description = "Drag-and-drop reorder items within a treatment phase. "
                        +
                        "Updates sequence numbers based on array position. " +
                        "Item at index 0 becomes sequence 1, index 1 becomes sequence 2, etc. " +
                        "Uses SERIALIZABLE isolation to prevent concurrent modification issues.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.UPDATE_TREATMENT_PLAN + "')")
        @PatchMapping("/patient-plan-phases/{phaseId}/items/reorder")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.ReorderItemsResponse> reorderPhaseItems(
                        @Parameter(description = "Phase ID", required = true, example = "123") @PathVariable Long phaseId,
                        @Parameter(description = "Reorder request with item IDs in new order", required = true) @org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid com.dental.clinic.management.treatment_plans.dto.request.ReorderItemsRequest request) {

                log.info(" REST request to reorder {} items in phase: {}",
                                request.getItemIds().size(), phaseId);

                com.dental.clinic.management.treatment_plans.dto.response.ReorderItemsResponse response = treatmentPlanReorderService
                                .reorderPhaseItems(phaseId, request);

                log.info(" Reordered {} items in phase {}",
                                response.getItemsReordered(), phaseId);

                return ResponseEntity.ok(response);
        }

        /**
         * API 5.X: Assign Doctor to Treatment Plan Item (V32).
         * Allows assigning or reassigning a doctor to a specific treatment item.
         * Use case: When organizing phases or preparing for appointment scheduling.
         *
         * Business Rules:
         * - Doctor must exist and be active
         * - Doctor must have required specialization for item's service
         * - Item must exist and belong to a valid treatment plan
         * - User must have permission to modify the plan
         *
         * Required Permission: ASSIGN_DOCTOR_TO_ITEM (assigned to ROLE_DENTIST, ROLE_MANAGER)
         *
         * @param itemId  Plan item ID
         * @param request Assign doctor request with doctor code
         * @return Updated item details with assigned doctor info
         */
        @Operation(summary = "API 5.X: Assign Doctor to Plan Item",
                description = "Assign or reassign a doctor to a specific treatment item. " +
                              "Doctor must have required specialization for the service. " +
                              "Useful for organizing phases or preparing appointment scheduling.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ASSIGN_DOCTOR_TO_ITEM + "')")
        @PutMapping("/patient-plan-items/{itemId}/assign-doctor")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.PatientPlanItemResponse> assignDoctorToItem(
                        @Parameter(description = "Plan item ID", required = true, example = "101") @PathVariable Long itemId,
                        @Parameter(description = "Assign doctor request", required = true)
                        @org.springframework.web.bind.annotation.RequestBody
                        @jakarta.validation.Valid
                        com.dental.clinic.management.treatment_plans.dto.request.AssignDoctorToItemRequest request) {

                log.info("REST request to assign doctor {} to item {}", request.getDoctorCode(), itemId);

                com.dental.clinic.management.treatment_plans.dto.response.PatientPlanItemResponse response =
                        treatmentPlanItemService.assignDoctorToItem(itemId, request.getDoctorCode(), request.getNotes());

                log.info("Successfully assigned doctor {} to item {}", request.getDoctorCode(), itemId);

                return ResponseEntity.ok(response);
        }

        /**
         * NEW API: Generate automatic appointment suggestions for treatment plan.
         * 
         * ISSUE: AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION
         * Priority: HIGH
         * 
         * Features:
         * - Uses estimated dates from plan items
         * - Automatically skips holidays and weekends
         * - Applies service spacing rules (preparation, recovery, intervals)
         * - Enforces daily appointment limits
         * - Returns suggestions (does NOT create actual appointments)
         * 
         * @param planId  Treatment plan ID
         * @param request Auto-schedule request with preferences
         * @return List of appointment suggestions with date adjustments
         */
        @Operation(summary = "Generate automatic appointment suggestions for treatment plan",
                description = "Intelligently generates appointment suggestions based on treatment plan items. " +
                              "Uses estimated dates from plan items and automatically adjusts for: " +
                              "1) Holidays and weekends (shifts to next working day) " +
                              "2) Service spacing rules (preparation days, recovery periods, intervals) " +
                              "3) Daily appointment limits (max 2 appointments/day/patient by default) " +
                              "Returns suggestions only - does NOT create actual appointments. " +
                              "Frontend can review suggestions and proceed with booking.")
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN + "') or " +
                        "hasAuthority('"
                        + com.dental.clinic.management.utils.security.AuthoritiesConstants.CREATE_APPOINTMENT + "')")
        @PostMapping("/treatment-plans/{planId}/auto-schedule")
        public ResponseEntity<com.dental.clinic.management.treatment_plans.dto.response.AutoScheduleResponse> generateAutoSchedule(
                        @Parameter(description = "Treatment plan ID", required = true, example = "123") 
                        @PathVariable Long planId,
                        @Parameter(description = "Auto-schedule request with preferences", required = true)
                        @org.springframework.web.bind.annotation.RequestBody
                        @jakarta.validation.Valid
                        com.dental.clinic.management.treatment_plans.dto.request.AutoScheduleRequest request) {

                log.info("REST request to generate auto-schedule for treatment plan: {}", planId);

                com.dental.clinic.management.treatment_plans.dto.response.AutoScheduleResponse response =
                        treatmentPlanAutoScheduleService.generateAutomaticAppointments(planId, request);

                log.info("Generated {} appointment suggestions for plan {} ({} successful, {} failed)",
                        response.getSuggestions().size(),
                        planId,
                        response.getSuccessfulSuggestions(),
                        response.getFailedItems());

                return ResponseEntity.ok(response);
        }
}
