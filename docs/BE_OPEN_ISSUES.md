# Treatment Plan & Appointment – Open BE Issues

**Date:** 2025-11-20 (Updated: 2025-01-XX)  
**Status:** ✅ All critical issues resolved!  
**Scope:** APIs 3.4, 5.1, 5.2, 5.5 (Phase 5 & V21 workflow)

---

## ✅ RESOLVED Issues

### 1. ✅ Bác Sĩ Phụ Trách Appointment Không Thể Xem Treatment Plan Linked - ĐÃ FIX

- **Status:** ✅ **RESOLVED**
- **Priority:** 🔴 High (was)
- **File:** `booking_appointment/service/AppointmentDetailService.java`, `booking_appointment/dto/AppointmentDetailDTO.java`, `treatment_plans/service/TreatmentPlanDetailService.java`, `booking_appointment/repository/AppointmentRepository.java`
- **Issue:** Bác sĩ phụ trách appointment (primary doctor) không thể xem treatment plan linked với appointment để kiểm tra tiến độ, nếu họ không phải người tạo plan (createdBy).

**✅ ĐÃ FIX - Verified in BE code:**

1. **AppointmentDetailDTO.java** (line 138):
   - ✅ Đã có field `linkedTreatmentPlanCode` với comment đầy đủ
   - ✅ Type: `String`, nullable (null nếu appointment không linked với plan)

2. **AppointmentDetailService.java** (lines 320-340, 367):
   - ✅ Đã có logic load `linkedTreatmentPlanCode` từ `appointment_plan_items` bridge table
   - ✅ Query: `appointment_plan_items → patient_plan_items → phases → treatment_plan`
   - ✅ Đã populate vào DTO builder (line 367): `.linkedTreatmentPlanCode(linkedPlanCode)`

3. **TreatmentPlanDetailService.java** (lines 280-293, 312-329):
   - ✅ Đã có method `isPrimaryDoctorOfLinkedAppointment(Integer employeeId, Long planId)` (lines 312-329)
   - ✅ Đã được gọi trong `verifyEmployeeCreatedByPermission()` (lines 282-288)
   - ✅ Cho phép access nếu employee là primary doctor của linked appointment, dù không phải người tạo plan
   - ✅ Logic: Nếu employee không phải creator, check thêm xem có phải primary doctor của linked appointment không

4. **AppointmentRepository.java** (lines 466-477):
   - ✅ Đã có method `countByEmployeeIdAndLinkedToPlan(Integer employeeId, Long planId)`
   - ✅ Query: `appointments → appointment_plan_items → patient_plan_items → phases → treatment_plan`
   - ✅ Filter: `a.employeeId = :employeeId AND phase.treatmentPlan.planId = :planId`

**Kết quả:**
- ✅ Bác sĩ phụ trách appointment (chỉ có `VIEW_TREATMENT_PLAN_OWN`) có thể xem treatment plan linked với appointment của họ
- ✅ `AppointmentDetailDTO` có field `linkedTreatmentPlanCode` để FE biết plan code
- ✅ API 5.2 cho phép primary doctor xem plan linked với appointment, không cần `VIEW_TREATMENT_PLAN_ALL`

---

## 🔴 OPEN Issues

_No open issues at the moment. All critical issues have been resolved!_

**Problem Description:**

- **Use Case:** Bác sĩ cần xem treatment plan từ appointment detail để:
  - Kiểm tra đã đến bước nào trong lộ trình điều trị
  - Xem bước tiếp theo là gì
  - Theo dõi tiến độ điều trị của bệnh nhân
  
- **Current Problem:**
  - Appointment có thể linked với treatment plan items qua `appointment_plan_items` bridge table
  - Bác sĩ phụ trách appointment (appointment.employeeId) có thể không phải là người tạo treatment plan (plan.createdBy)
  - API 5.2 `/patients/{patientCode}/treatment-plans/{planCode}` với `VIEW_TREATMENT_PLAN_OWN` chỉ cho phép:
    - Patient xem plans của chính họ
    - Doctor xem plans mà họ tạo (createdBy)
  - Nếu doctor không có `VIEW_TREATMENT_PLAN_ALL`, họ không thể xem plan mà họ không tạo, dù họ là primary doctor của appointment linked với plan đó

- **Why NOT give `VIEW_TREATMENT_PLAN_ALL` to doctors:**
  - Nếu bác sĩ có `VIEW_TREATMENT_PLAN_ALL`, họ sẽ xem được TẤT CẢ treatment plans của TẤT CẢ bác sĩ khác khi vào `/employee/treatment-plans`
  - Điều này vi phạm privacy và không cần thiết
  - Bác sĩ chỉ cần xem plans linked với appointments của họ, không cần xem tất cả plans

**Current BE Implementation:**

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanService.java`
- ⚠️ **Line 365-367:** Doctor với `VIEW_TREATMENT_PLAN_OWN` chỉ xem được plans mà họ tạo (`filterByCreatedByEmployee`)
- ⚠️ **Line 370-373:** BE ignore `patientCode` filter khi doctor dùng API 5.5
- ⚠️ **File:** `files_from_BE/booking_appointment/dto/AppointmentDetailDTO.java` - Không có field `linkedTreatmentPlanCode` hoặc `treatmentPlan`

**Expected Behavior:**

- Bác sĩ phụ trách appointment (primary doctor) nên có thể xem treatment plan linked với appointment đó để kiểm tra tiến độ, dù không phải người tạo plan
- `AppointmentDetailDTO` nên có field `linkedTreatmentPlanCode` để FE biết plan nào linked với appointment
- API 5.2 (`getTreatmentPlanDetail`) nên cập nhật RBAC logic:
  - Cho phép xem nếu user là primary doctor của appointment linked với plan đó
  - KHÔNG cần `VIEW_TREATMENT_PLAN_ALL` (vì sẽ cho phép xem tất cả plans)
  - Chỉ cần `VIEW_TREATMENT_PLAN_OWN` + check thêm: user là primary doctor của linked appointment

**Proposed Solution (Option 1 - Recommended): Thêm linkedTreatmentPlanCode vào AppointmentDetailDTO**

```java
// In AppointmentDetailDTO.java
/**
 * Treatment plan code linked to this appointment (if any)
 * Populated from appointment_plan_items bridge table
 * Example: "PLAN-20251001-001"
 */
private String linkedTreatmentPlanCode;

// In AppointmentDetailService.java
// Add dependency
private final AppointmentPlanItemRepository appointmentPlanItemRepository;
private final PatientPlanItemRepository patientPlanItemRepository;

// In mapToDetailDTO method, after loading services:
// Load linked treatment plan code
String linkedPlanCode = null;
try {
    // Query: appointment_plan_items → patient_plan_items → phases → treatment_plan
    List<AppointmentPlanItemBridge> bridges = appointmentPlanItemRepository
        .findByIdAppointmentId(appointment.getAppointmentId());
    
    if (!bridges.isEmpty()) {
        // Get first item's plan code (all items in same appointment should be from same plan)
        Long firstItemId = bridges.get(0).getId().getItemId();
        PatientPlanItem item = patientPlanItemRepository.findById(firstItemId).orElse(null);
        if (item != null && item.getPhase() != null && item.getPhase().getTreatmentPlan() != null) {
            linkedPlanCode = item.getPhase().getTreatmentPlan().getPlanCode();
        }
    }
} catch (Exception e) {
    log.warn("Failed to load linked treatment plan code: {}", e.getMessage());
}

// Add to DTO builder
.linkedTreatmentPlanCode(linkedPlanCode)
```

**Proposed Solution (Option 2): Tạo API Endpoint Mới**

```java
// In AppointmentController.java
@GetMapping("/{appointmentCode}/treatment-plan")
@PreAuthorize("hasAuthority('VIEW_APPOINTMENT_ALL') or hasAuthority('VIEW_APPOINTMENT_OWN')")
public ResponseEntity<TreatmentPlanDetailResponse> getLinkedTreatmentPlan(
        @PathVariable String appointmentCode) {
    
    // Logic:
    // 1. Load appointment
    // 2. Check if current user is primary doctor OR has VIEW_TREATMENT_PLAN_ALL
    // 3. Query linked plan items from appointment_plan_items
    // 4. Get treatment plan code
    // 5. Return full treatment plan detail (with RBAC check: allow if user is primary doctor)
    
    TreatmentPlanDetailResponse plan = appointmentDetailService.getLinkedTreatmentPlan(appointmentCode);
    return ResponseEntity.ok(plan);
}
```

**Proposed Solution (Option 3 - RECOMMENDED): Cập Nhật RBAC Logic trong API 5.2**

```java
// In TreatmentPlanDetailService.java
// When checking permissions for getTreatmentPlanDetail:
// Allow access if:
// 1. User has VIEW_TREATMENT_PLAN_ALL → Full access
// 2. User has VIEW_TREATMENT_PLAN_OWN AND:
//    - User is patient of this plan, OR
//    - User created this plan (createdBy), OR
//    - User is primary doctor of appointment linked to this plan (NEW - for appointment detail view)

// Add method to check if user is primary doctor of any appointment linked to this plan
private boolean isPrimaryDoctorOfLinkedAppointment(Integer employeeId, Long planId) {
    // Query: appointments → appointment_plan_items → plan_items → phases → treatment_plan
    // Check if any appointment has employeeId as primary doctor
    return appointmentRepository.existsByEmployeeIdAndLinkedToPlan(employeeId, planId);
}

// In getTreatmentPlanDetail method:
// After RBAC check for VIEW_TREATMENT_PLAN_OWN:
if (hasViewOwnPermission && !isOwner) {
    // Check if user is primary doctor of linked appointment
    Integer currentEmployeeId = getCurrentEmployeeId(authentication);
    if (isPrimaryDoctorOfLinkedAppointment(currentEmployeeId, plan.getPlanId())) {
        log.info("Allowing access: User {} is primary doctor of appointment linked to plan {}", 
            currentEmployeeId, planCode);
        // Allow access
    } else {
        throw new AccessDeniedException("You can only view your own treatment plans or plans linked to your appointments");
    }
}
```

**Recommended Approach:**

**Option 1 + Option 3** (Kết hợp):
1. **Option 1:** Thêm `linkedTreatmentPlanCode` vào `AppointmentDetailDTO` để FE biết plan code
2. **Option 3:** Cập nhật RBAC logic trong API 5.2 để cho phép primary doctor xem plan linked với appointment

**Lý do:**
- Bác sĩ KHÔNG cần `VIEW_TREATMENT_PLAN_ALL` (sẽ xem được tất cả plans)
- Bác sĩ chỉ cần `VIEW_TREATMENT_PLAN_OWN` + logic đặc biệt: cho phép xem nếu là primary doctor của linked appointment
- Khi vào `/employee/treatment-plans`, bác sĩ vẫn chỉ xem được plans mà họ tạo (không xem plans của bác sĩ khác)
- Khi vào appointment detail, bác sĩ có thể xem plan linked với appointment đó (để kiểm tra tiến độ)

**Test Cases:**

1. **Doctor views appointment with linked plan (not created by doctor):**
   - Setup: Appointment với primary doctor = `EMP002`, linked to plan created by `EMP001`
   - Action: Doctor `EMP002` (chỉ có `VIEW_TREATMENT_PLAN_OWN`) gọi API 5.2 với plan code
   - Expected: ✅ Allowed (doctor is primary doctor of linked appointment)

2. **Doctor views appointment detail:**
   - Setup: Appointment linked to treatment plan
   - Action: Get appointment detail
   - Expected: Response có `linkedTreatmentPlanCode` field

3. **Doctor without permission:**
   - Setup: Doctor không phải primary doctor và không có `VIEW_TREATMENT_PLAN_ALL`
   - Action: Try to view plan linked to appointment
   - Expected: ❌ 403 Forbidden

---

## 🟡 FE Issues (Minor - Can be fixed by FE)

### 5. 🟡 TreatmentPlanSummaryDTO Thiếu ProgressSummary

- **Status:** 🟡 **FE WORKAROUND APPLIED**
- **Priority:** 🟢 Low
- **File:** `src/components/treatment-plans/TreatmentPlanProgressCard.tsx`
- **Issue:** `TreatmentPlanSummaryDTO` không có field `progressSummary`, nên progress card không thể hiển thị progress percentage.

**Current Workaround:**

- FE đã set `progressPercentage = 0` và hiển thị placeholder message
- User cần click vào card để xem detail page (có đầy đủ progress info)

**Proposed BE Enhancement (Optional):**

- Thêm `progressSummary: ProgressSummaryDTO` vào `TreatmentPlanSummaryDTO` để có thể hiển thị progress trong list view
- **Note:** Đây là enhancement, không phải bug. FE đã workaround được.

---

## Summary Table

| # | Issue | Status | Action Owner | Priority |
|---|-------|--------|--------------|----------|
| 1 | **Bác sĩ phụ trách appointment không thể xem treatment plan linked** | ✅ **RESOLVED** | **BE** | ✅ Fixed |
| 2 | **TreatmentPlanSummaryDTO thiếu ProgressSummary** | 🟡 **FE WORKAROUND** | **BE (Optional)** | 🟢 Low |

---

## ✅ Testing Status

**Test Scripts:**
- `scripts/test-features.ts` - Test treatment plan & appointment features
- `scripts/test-all-modules.ts` - Test all modules (Employee, Account, Role, Permission, Specialization)

**Run Commands:**
- `npm run test:features` - Test treatment plan & appointment
- `npm run test:all-modules` - Test all modules

**Tested Features:**
- ✅ Authentication (Admin, Doctor, Patient)
- ✅ Treatment Plan APIs (List, Detail)
- ✅ Appointment APIs (List, Detail)
- ✅ Services APIs
- ✅ Doctor Services Filtering
- ✅ Employees APIs (With search/filter)
- ✅ Account APIs (Me, Profile, Permissions, Info)
- ✅ Role APIs (List, Detail, Permissions)
- ✅ Permission APIs (List, Grouped, By Module)
- ✅ Specialization APIs (List)

**Known Issues from Testing:**
- ✅ Doctor có thể xem treatment plan linked với appointment (Issue #1 - **FIXED**)

---

**Last Updated:** 2025-01-XX  
**Next Steps:** 
- ✅ **BE Team:** 
  - ✅ Fixed RBAC để bác sĩ phụ trách appointment có thể xem treatment plan linked (Issue #1 - **RESOLVED**)
- 🟡 **FE Team:** 
  - Update UI to use `linkedTreatmentPlanCode` from appointment detail (Issue #1 - **BE FIXED, FE can now use it**)
