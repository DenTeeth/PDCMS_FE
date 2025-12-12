# Backend Open Issues

**Last Updated:** 2025-12-11  
**Total Open Issues:** 9  
**High Priority Issues:** 6 (Issue #41 - Needs Verification, Issue #43 - Remove Prerequisites, Issue #44 - Remove Work Shifts System, Issue #49 - Price Update Triggers Status Change, Issue #52 - PatientInfoResponse thiếu blocking fields, Issue #53 - Holiday Validation Missing)  
**Medium Priority Issues:** 3 (Issue #48 - AppointmentStatusService completion check, Issue #50 - Warehouse Reports Excel Export, Issue #51 - Auto-complete plan status when loading detail)  
**Resolved Issues:** 12 (Issue #27, #31, #32, #33, #36, #37, #38, #39, #40, #42, #47) - Removed from this document

---

## Summary Table

| # | Issue | Status | Priority | Reported Date | Resolved Date |
|---|-------|--------|----------|---------------|---------------|
| #41 | API 5.9 - Database constraint thiếu WAITING_FOR_PREREQUISITE và SKIPPED status | ⚠️ **NEEDS VERIFICATION** | **HIGH** | 2025-12-04 | - |
| #52 | API Patient List - PatientInfoResponse thiếu blocking fields | 🔴 **OPEN** | **HIGH** | 2025-12-10 | - |
| #53 | API 3.1 - Create Appointment không validate ngày lễ (Holiday) | 🔴 **OPEN** | **HIGH** | 2025-12-11 | - |
| #48 | Treatment Plan Status - AppointmentStatusService không check completion nếu plan status = null | 🔴 **OPEN** | **MEDIUM** | 2025-12-09 | - |
| #49 | API 5.13 - Update Prices trigger status change không đúng | 🔴 **OPEN** | **HIGH** | 2025-12-09 | - |
| #43 | API 5.9 - Xóa prerequisite services khỏi seed data | 🔴 **OPEN** | **HIGH** | 2025-12-05 | - |
| #44 | API 7.x - Xóa toàn bộ hệ thống work shifts, employee shifts, registrations và slots | 🔴 **OPEN** | **HIGH** | 2025-12-05 | - |
| #50 | Warehouse Reports - Thêm chức năng export Excel cho báo cáo tồn kho | 🔴 **OPEN** | **MEDIUM** | 2025-12-09 | - |
| #51 | API 5.2 - Auto-complete plan status khi load detail nếu tất cả phases đã completed | 🔴 **OPEN** | **MEDIUM** | 2025-12-09 | - |
| # | Issue | Status | Priority | Reported Date |
|---|-------|--------|----------|---------------|
| #28 | API - Transaction Stats endpoint trả về 400 INVALID_PARAMETER_TYPE | 🔴 **OPEN** | **MEDIUM** | 2025-01-30 |
| #29 | Seed Data - Thêm Employee Shifts cho tháng này và tháng sau | 🔴 **OPEN** | **MEDIUM** | 2025-01-30 |
| #30 | Seed Data - Điều chỉnh Treatment Plan Templates để các dịch vụ có cùng specialization | 🔴 **OPEN** | **MEDIUM** | 2025-01-30 |
| #34 | API 5.5 - searchTerm parameter gây lỗi 500 Internal Server Error | 🔴 **OPEN** | **HIGH** | 2025-12-02 |
| #35 | API 5.5 - TreatmentPlanSummaryDTO thiếu progressSummary để FE tính toán status | 🔴 **OPEN** | **MEDIUM** | 2025-12-02 |
| #36 | API 8.1 - ClinicalRecordResponse thiếu field followUpDate | 🔴 **OPEN** | **MEDIUM** | 2025-12-03 |
| #37 | API 8.1 - Tab bệnh án bị disable khi appointment status là COMPLETED và chưa có clinical record | 🔴 **OPEN** | **MEDIUM** | 2025-12-03 |

---

### Issue #41: API 5.9 - Database constraint thiếu WAITING_FOR_PREREQUISITE và SKIPPED status

**Status:** ⚠️ **NEEDS VERIFICATION**  
**Priority:** **HIGH**  
**Reported Date:** 2025-12-04  
**Endpoint:** `POST /api/v1/treatment-plans/{planCode}/approve` (API 5.9)

**Note:** Code hiện tại vẫn đang sử dụng `WAITING_FOR_PREREQUISITE` và `SKIPPED` status. Cần verify với BE team hoặc test thực tế xem database constraint đã được update chưa.

#### Problem Description

Khi approve treatment plan, BE code cố gắng set status `WAITING_FOR_PREREQUISITE` cho các items có prerequisites, nhưng database constraint `patient_plan_items_status_check` không cho phép giá trị này, dẫn đến lỗi:

```
ERROR: new row for relation "patient_plan_items" violates check constraint "patient_plan_items_status_check"
Detail: Failing row contains (95, null, 2025-12-03 14:01:21.067967, 30, Khám tổng quát & Tư vấn, 100000.00, 1, WAITING_FOR_PREREQUISITE, null, null, 14, 38, null).
```

**Expected Behavior:**
- Khi approve plan, items có prerequisites → status = `WAITING_FOR_PREREQUISITE` ✅
- Database constraint cho phép tất cả status values từ enum `PlanItemStatus` ✅
- Approval process hoàn thành thành công ✅

**Actual Behavior:**
- Khi approve plan, BE code set status = `WAITING_FOR_PREREQUISITE` ❌
- Database constraint chỉ cho phép: `PENDING`, `READY_FOR_BOOKING`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED` ❌
- Constraint thiếu: `WAITING_FOR_PREREQUISITE` và `SKIPPED` ❌
- Approval process fail với database constraint violation ❌

#### Root Cause Analysis

**1. Database Constraint (Current - INCORRECT):**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql` (line 4126-4128)

```sql
ALTER TABLE patient_plan_items DROP CONSTRAINT IF EXISTS patient_plan_items_status_check;
ALTER TABLE patient_plan_items ADD CONSTRAINT patient_plan_items_status_check
    CHECK (status IN ('PENDING', 'READY_FOR_BOOKING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'));
```

**Vấn đề:**
- Constraint chỉ cho phép 5 status values
- Thiếu `WAITING_FOR_PREREQUISITE` (V21 feature)
- Thiếu `SKIPPED` (existing feature)

**2. BE Code (Correct - Uses All Status Values):**

**File:** `files_from_BE/treatment_plans/enums/PlanItemStatus.java`

```java
public enum PlanItemStatus {
    PENDING,
    READY_FOR_BOOKING,
    WAITING_FOR_PREREQUISITE,  // V21: Missing in DB constraint!
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    SKIPPED  // Missing in DB constraint!
}
```

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanApprovalService.java` (line 308-310)

```java
if (hasPrereqs) {
    // Service requires prerequisites → WAITING
    item.setStatus(PlanItemStatus.WAITING_FOR_PREREQUISITE);  // ❌ Violates DB constraint!
    itemsWaiting++;
}
```

**3. State Machine (Uses All Status Values):**

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java` (line 59-86)

State machine cho phép transitions từ/tới `WAITING_FOR_PREREQUISITE` và `SKIPPED`, nhưng database constraint không cho phép lưu các giá trị này.

#### Suggested Fix

**Update Database Constraint:**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql`

```sql
-- Drop old constraint
ALTER TABLE patient_plan_items DROP CONSTRAINT IF EXISTS patient_plan_items_status_check;

-- Add new constraint with ALL status values from PlanItemStatus enum
ALTER TABLE patient_plan_items ADD CONSTRAINT patient_plan_items_status_check
    CHECK (status IN (
        'PENDING',
        'READY_FOR_BOOKING',
        'WAITING_FOR_PREREQUISITE',  -- ✅ Added: V21 feature
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'SKIPPED'  -- ✅ Added: Existing feature
    ));
```

**Migration Script (if needed):**

```sql
-- Migration script to update constraint
-- Run this on existing databases

ALTER TABLE patient_plan_items DROP CONSTRAINT IF EXISTS patient_plan_items_status_check;

ALTER TABLE patient_plan_items ADD CONSTRAINT patient_plan_items_status_check
    CHECK (status IN (
        'PENDING',
        'READY_FOR_BOOKING',
        'WAITING_FOR_PREREQUISITE',
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'SKIPPED'
    ));

-- Verify constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'patient_plan_items_status_check';
```

#### Impact

- **HIGH Priority:** Approval process hoàn toàn bị block (nếu constraint chưa được fix)
- Không thể approve treatment plans có items với prerequisites
- Clinical rules integration (V21) không hoạt động
- Users không thể sử dụng tính năng approval

**Current Status (2025-12-05):**
- ⚠️ Code vẫn đang sử dụng `WAITING_FOR_PREREQUISITE` và `SKIPPED` (line 310 trong TreatmentPlanApprovalService.java)
- ⚠️ Không có file database trong `files_from_BE` để verify constraint
- ⚠️ Cần verify với BE team hoặc test thực tế:
  - Nếu approval process hoạt động → Constraint đã được fix ✅
  - Nếu approval process fail với constraint violation → Constraint chưa được fix ❌

#### Related Files

- `files_from_BE/db/dental-clinic-seed-data.sql` (line 4126-4128)
- `files_from_BE/treatment_plans/enums/PlanItemStatus.java`
- `files_from_BE/treatment_plans/service/TreatmentPlanApprovalService.java` (line 284-328)
- `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java` (line 59-86)

#### Test Cases

**Test 1: Approve Plan with Prerequisites**

```
1. Create treatment plan with items that have prerequisites
2. Submit plan for review
3. Approve plan
4. Expected:
   - Items with prerequisites → WAITING_FOR_PREREQUISITE ✅
   - Items without prerequisites → READY_FOR_BOOKING ✅
   - Approval succeeds ✅
5. Actual (if bug exists):
   - Database constraint violation ❌
   - Approval fails ❌
```

**Test 2: Verify All Status Values Allowed**

```
1. Verify database constraint includes all enum values:
   - PENDING ✅
   - READY_FOR_BOOKING ✅
   - WAITING_FOR_PREREQUISITE ✅ (currently missing)
   - SCHEDULED ✅
   - IN_PROGRESS ✅
   - COMPLETED ✅
   - SKIPPED ✅ (currently missing)
```

#### Additional Notes

**Why This Happened:**

- V21 feature (`WAITING_FOR_PREREQUISITE`) được thêm vào enum và BE code
- Database constraint không được update để match với enum mới
- `SKIPPED` status cũng bị thiếu trong constraint (có thể là oversight từ trước)

**Verification Steps:**

1. Check current constraint:
   ```sql
   SELECT pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conname = 'patient_plan_items_status_check';
   ```

2. Verify enum values match constraint:
   - Compare `PlanItemStatus` enum với constraint values
   - Ensure all enum values are in constraint

3. Test approval flow:
   - Create plan with prerequisites
   - Approve plan
   - Verify items get correct status

---

#### Problem Description

**REGRESSION:** Trong các phiên bản cũ, khi complete items trong treatment plan, phase và plan status được auto-update đúng cách và hiển thị ngay trong list view. Tuy nhiên, hiện tại sau khi complete tất cả items, phase và plan status không được auto-update, dẫn đến list view hiển thị sai status.

**Expected Behavior:**
- Khi tất cả items trong phase completed → `phase.status = COMPLETED` trong database
- Khi tất cả phases completed → `plan.status = COMPLETED` trong database
- List API (API 5.1, 5.5) trả về đúng status từ database
- List view hiển thị status đúng và update liên tục

**Actual Behavior:**
- ✅ Items đã đổi trạng thái (COMPLETED)
- ❌ Phase **KHÔNG** đổi trạng thái (vẫn PENDING trong database)
- ❌ Plan **KHÔNG** đổi trạng thái (vẫn null trong database)
- ❌ List view hiển thị sai status (null hoặc PENDING)
- ⚠️ FE phải tính toán status từ items (workaround)

**Regression Evidence:**
- User báo cáo: "Tại sao ở các phiên bản cũ thì danh sách lại update được status liên tục. Nhưng đến hiện tại thì bị lỗi"
- Điều này cho thấy tính năng từng hoạt động đúng nhưng hiện tại bị broken

#### Root Cause Analysis

**1. Lazy Loading Issue in checkAndCompletePhase()**

**File:** `TreatmentPlanItemService.java` (line 371-391)

```java
private void checkAndCompletePhase(PatientPlanPhase phase) {
    List<PatientPlanItem> items = phase.getItems();  // ❌ LAZY LOADING ISSUE
    
    if (items.isEmpty()) {
        log.debug("Phase {} has no items, skipping completion check", phase.getPatientPhaseId());
        return;  // ❌ Return early - phase không complete
    }
    
    // ... check completion logic ...
}
```

**Vấn đề:**
- `itemRepository.findById(itemId)` chỉ load item, không load `phase.items`
- `phase.getItems()` là lazy collection → có thể không được initialize
- `entityManager.refresh(phase)` được gọi ở line 207 nhưng **KHÔNG** refresh lazy collection `items`
- Khi gọi `phase.getItems()` trong `checkAndCompletePhase()`, collection có thể:
  - Trống (chưa được load) → return early → phase không complete
  - Chứa stale data (chưa reflect item status mới) → check sai

**2. Lazy Loading Issue in checkAndCompletePlan()**

**File:** `TreatmentPlanItemService.java` (line 464-511)

```java
private void checkAndCompletePlan(PatientTreatmentPlan plan) {
    List<PatientPlanPhase> phases = plan.getPhases();  // ❌ LAZY LOADING ISSUE
    
    if (phases.isEmpty()) {
        log.debug("Plan {} has no phases, skipping completion check", plan.getPlanCode());
        return;  // ❌ Return early - plan không complete
    }
    
    // ... check completion logic ...
}
```

**Vấn đề:**
- `plan.getPhases()` là lazy collection
- `entityManager.refresh(plan)` được gọi ở line 217 nhưng **KHÔNG** refresh lazy collection `phases`
- Khi gọi `plan.getPhases()`, collection có thể:
  - Trống hoặc thiếu phases
  - Chứa stale phase status (chưa reflect phase status mới sau khi complete)

**3. Why It Worked Before? (Regression Analysis)**

**User Report:** "Tại sao ở các phiên bản cũ thì danh sách lại update được status liên tục. Nhưng đến hiện tại thì bị lỗi"

**Possible Reasons for Regression:**

1. **Entity Loading Strategy Changed:**
   - **Before:** Có thể `itemRepository.findById()` được thay đổi để load với `JOIN FETCH` relationships
   - **After:** Chỉ load entity chính, không load `phase.items` và `plan.phases`
   - **Evidence:** Code hiện tại dùng `itemRepository.findById(itemId)` - standard JPA method không load relationships

2. **Transaction Isolation or Entity Manager Behavior Changed:**
   - **Before:** Có thể transaction isolation level cho phép lazy loading hoạt động đúng
   - **After:** Có thể isolation level strict hơn hoặc entity manager behavior thay đổi
   - **Evidence:** `entityManager.refresh()` được thêm vào (line 207, 217) nhưng không refresh lazy collections

3. **Code Refactoring Introduced Bug:**
   - **Before:** Có thể có logic explicit load relationships trước khi check completion
   - **After:** Logic đó bị remove hoặc không hoạt động đúng
   - **Evidence:** Comment ở line 368: "IMPORTANT: Assumes phase has been refreshed by caller to get latest item statuses" - nhưng refresh không load lazy collections

4. **Hibernate/JPA Version Upgrade:**
   - **Before:** Có thể version cũ của Hibernate/JPA handle lazy loading khác
   - **After:** Version mới có behavior strict hơn về lazy loading
   - **Evidence:** Cần check changelog của Hibernate/JPA version

5. **Entity Manager Cache Behavior:**
   - **Before:** Cache có thể được clear/refresh đúng cách khi load entities
   - **After:** Cache không được refresh đúng → lazy collections không được load
   - **Evidence:** `entityManager.refresh(phase)` chỉ refresh phase entity, không refresh `items` collection

**Most Likely Cause:**
- Code refactoring hoặc entity loading strategy thay đổi
- `entityManager.refresh()` được thêm để fix Issue #38 nhưng không đủ
- Lazy collections không được load trước khi check completion

**4. Current Code Flow (updateItemStatus)**

```java
@Transactional
public PatientPlanItemResponse updateItemStatus(...) {
    // STEP 1: Find item
    PatientPlanItem item = itemRepository.findById(itemId);  // ❌ Chỉ load item
    
    PatientPlanPhase phase = item.getPhase();  // ❌ Lazy loading
    PatientTreatmentPlan plan = phase.getTreatmentPlan();  // ❌ Lazy loading
    
    // ... update item status ...
    entityManager.flush();  // ✅ Flush item changes
    
    // STEP 7: Refresh phase
    entityManager.refresh(phase);  // ❌ Refresh phase nhưng KHÔNG refresh items collection
    
    // STEP 7A: Check and auto-complete phase
    checkAndCompletePhase(phase);  // ❌ phase.getItems() có thể trống
    
    // STEP 7C: Refresh plan
    entityManager.refresh(plan);  // ❌ Refresh plan nhưng KHÔNG refresh phases collection
    
    // STEP 7C: Check and auto-complete plan
    checkAndCompletePlan(plan);  // ❌ plan.getPhases() có thể trống hoặc stale
}
```

#### Resolution

**✅ FIXED by Backend Team (2025-12-05)**

Backend đã fix issue này bằng cách query items và phases trực tiếp từ database thay vì sử dụng lazy collections.

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java`

**Fix Applied:**

1. **checkAndCompletePhase()** (line 374-398):
   - ✅ Query items trực tiếp: `itemRepository.findByPhase_PatientPhaseId(phase.getPatientPhaseId())`
   - ✅ Comment: "FIX Issue #40: Query items directly from database to avoid lazy loading issues"
   - ✅ Không còn sử dụng `phase.getItems()` (lazy collection)

2. **checkAndCompletePlan()** (line 472-511):
   - ✅ Query phases trực tiếp: `phaseRepository.findByTreatmentPlan_PlanId(plan.getPlanId())`
   - ✅ Comment: "FIX Issue #40: Query phases directly from database instead of using lazy collection"
   - ✅ Không còn sử dụng `plan.getPhases()` (lazy collection)

3. **Repository Methods Added:**
   - ✅ `PatientPlanItemRepository.findByPhase_PatientPhaseId()` (line 57)
   - ✅ `PatientPlanPhaseRepository.findByTreatmentPlan_PlanId()` (line 49)

**Verification:**
- Code đã được update với fix
- Repository methods đã được thêm
- Comments trong code xác nhận fix Issue #40

#### Suggested Fix (Historical - Already Applied)

**Fix 1: Query Items Directly in checkAndCompletePhase()**

```java
// TreatmentPlanItemService.java
private void checkAndCompletePhase(PatientPlanPhase phase) {
    // ✅ FIX: Query items directly from database
    List<PatientPlanItem> items = itemRepository.findByPhase_PatientPhaseId(phase.getPatientPhaseId());
    
    if (items.isEmpty()) {
        log.debug("Phase {} has no items, skipping completion check", phase.getPatientPhaseId());
        return;
    }
    
    boolean allDone = items.stream()
            .allMatch(item -> item.getStatus() == PlanItemStatus.COMPLETED ||
                    item.getStatus() == PlanItemStatus.SKIPPED);
    
    if (allDone && phase.getStatus() != PhaseStatus.COMPLETED) {
        phase.setStatus(PhaseStatus.COMPLETED);
        phase.setCompletionDate(java.time.LocalDate.now());
        entityManager.merge(phase);
        entityManager.flush();
        entityManager.refresh(phase);  // ✅ Ensure consistency
        
        log.info("✅ Phase {} auto-completed: all {} items are done",
                phase.getPatientPhaseId(), items.size());
    }
}
```

**Fix 2: Query Phases Directly in checkAndCompletePlan()**

```java
// TreatmentPlanItemService.java
private void checkAndCompletePlan(PatientTreatmentPlan plan) {
    // ... validation ...
    
    // ✅ FIX: Query phases directly from database
    List<PatientPlanPhase> phases = phaseRepository.findByTreatmentPlan_PlanId(plan.getPlanId());
    
    if (phases.isEmpty()) {
        log.debug("Plan {} has no phases, skipping completion check", plan.getPlanCode());
        return;
    }
    
    // Check if ALL phases are COMPLETED
    long completedPhases = phases.stream()
            .filter(phase -> phase.getStatus() == PhaseStatus.COMPLETED)
            .count();
    
    boolean allPhasesCompleted = completedPhases == phases.size();
    
    if (allPhasesCompleted) {
        TreatmentPlanStatus oldStatus = plan.getStatus();
        plan.setStatus(TreatmentPlanStatus.COMPLETED);
        planRepository.save(plan);
        
        // ✅ Already has flush/refresh (from Issue #38 fix)
        entityManager.flush();
        entityManager.refresh(plan);
        
        log.info("✅ Treatment plan {} auto-completed: {} → COMPLETED", ...);
    }
}
```

**Fix 3: Add Repository Methods (if not exists)**

**File:** `PatientPlanItemRepository.java`

```java
/**
 * Find all items in a phase
 * Used in checkAndCompletePhase() to avoid lazy loading issues
 */
List<PatientPlanItem> findByPhase_PatientPhaseId(Long phaseId);
```

**File:** `PatientPlanPhaseRepository.java`

```java
/**
 * Find all phases in a treatment plan
 * Used in checkAndCompletePlan() to avoid lazy loading issues
 */
List<PatientPlanPhase> findByTreatmentPlan_PlanId(Long planId);
```

**Alternative Fix: Use JOIN FETCH in findById**

Nếu không muốn thêm repository methods, có thể modify `findById` để load relationships:

```java
// TreatmentPlanItemService.java
@Transactional
public PatientPlanItemResponse updateItemStatus(...) {
    // ✅ FIX: Load item with phase and items eagerly
    PatientPlanItem item = itemRepository.findByIdWithPhaseAndItems(itemId)
            .orElseThrow(...);
    
    // Now phase.getItems() will be loaded
    // ...
}
```

**File:** `PatientPlanItemRepository.java`

```java
@Query("SELECT i FROM PatientPlanItem i " +
       "JOIN FETCH i.phase p " +
       "LEFT JOIN FETCH p.items " +  // ✅ Load all items in phase
       "JOIN FETCH p.treatmentPlan pl " +
       "LEFT JOIN FETCH pl.phases " +  // ✅ Load all phases in plan
       "WHERE i.itemId = :itemId")
Optional<PatientPlanItem> findByIdWithPhaseAndItems(@Param("itemId") Long itemId);
```

#### Impact

- **HIGH Priority:** Regression bug - tính năng từng hoạt động nhưng hiện tại broken
- Ảnh hưởng nghiêm trọng đến trải nghiệm người dùng
- Status không đồng bộ giữa BE và FE
- Không thể filter/search plans by status đúng cách
- Reporting không chính xác
- Users confused vì status khác nhau giữa detail và list view

#### Related Files

- `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java`
  - Method: `updateItemStatus()` (line 95-220)
  - Method: `checkAndCompletePhase()` (line 371-391)
  - Method: `checkAndCompletePlan()` (line 464-511)
- `files_from_BE/treatment_plans/repository/PatientPlanItemRepository.java`
- `files_from_BE/treatment_plans/repository/PatientPlanPhaseRepository.java`
- `files_from_BE/treatment_plans/domain/PatientPlanPhase.java`
- `files_from_BE/treatment_plans/domain/PatientTreatmentPlan.java`

#### Test Cases

**Test 1: Phase Auto-Complete**

```
1. Create plan with Phase 1 có 2 items (both PENDING)
2. Complete Item 1 → Expected: Phase 1 still PENDING
3. Complete Item 2 → Expected: Phase 1 = COMPLETED
4. Verify database: phase.status = 'COMPLETED'
5. Verify backend log: "✅ Phase {id} auto-completed: all 2 items are done"
6. Verify list API: plan status should reflect phase completion
```

**Test 2: Plan Auto-Complete**

```
1. Create plan with 2 phases, all items PENDING
2. Complete all items in Phase 1 → Expected: Phase 1 = COMPLETED, Plan still null
3. Complete all items in Phase 2 → Expected: Phase 2 = COMPLETED, Plan = COMPLETED
4. Verify database: plan.status = 'COMPLETED'
5. Verify backend log: "✅ Treatment plan {code} auto-completed: null → COMPLETED"
6. Verify list API: status = "COMPLETED"
```

**Test 3: List API Response (Regression Test)**

```
1. Complete all phases of a plan
2. Call API 5.5 to get list immediately
3. Expected: status = "COMPLETED" (như các phiên bản cũ)
4. Actual: status = null (regression bug)
```

#### Additional Notes

**Why Issue #38 Fix Didn't Solve This:**

- Issue #38 fix: Thêm `flush()` và `refresh()` trong `checkAndCompletePlan()`
- Nhưng vấn đề là: `checkAndCompletePlan()` không được gọi vì `checkAndCompletePhase()` fail trước đó
- Root cause: `checkAndCompletePhase()` không thấy items → phase không complete → plan không complete

**Regression Analysis:**

- **Before:** List view update status liên tục và đúng
- **After:** List view không update status
- **Possible Causes:**
  1. Entity loading strategy changed
  2. Transaction isolation changed
  3. Entity manager cache behavior changed
  4. Code refactoring introduced lazy loading issues

**Frontend Workaround:**

- FE đã implement workaround: Tính phase/plan status từ items/phases
- Detail view: Hiển thị đúng status (tính từ items)
- List view: Vẫn hiển thị status từ BE (có thể không đúng)
- Workaround này acceptable tạm thời, nhưng cần BE fix để data consistency

**See Also:**

- `docs/troubleshooting/ISSUE_PHASE_AUTO_COMPLETE_FIX.md` - Detailed fix guide (if exists)
- `docs/troubleshooting/BE_STATUS_NOT_UPDATING_IN_LIST.md` - Related issue analysis (if exists)

#### Database Verification

**Status:** ⏳ **PENDING VERIFICATION**

Để verify xem database có status đúng không, chạy các SQL queries:

**Query quan trọng nhất - Check Plans với Bug:**

```sql
-- Tìm plans có tất cả phases completed nhưng status vẫn NULL
SELECT 
    p.plan_code,
    p.plan_name,
    p.status as plan_status,
    COUNT(DISTINCT ph.patient_phase_id) as total_phases,
    SUM(CASE WHEN ph.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_phases
FROM patient_treatment_plans p
LEFT JOIN patient_plan_phases ph ON p.plan_id = ph.plan_id
WHERE p.status IS NULL
  AND p.approval_status = 'APPROVED'
GROUP BY p.plan_code, p.plan_name, p.status
HAVING 
    COUNT(DISTINCT ph.patient_phase_id) > 0
    AND COUNT(DISTINCT ph.patient_phase_id) = SUM(CASE WHEN ph.status = 'COMPLETED' THEN 1 ELSE 0 END);
```

**Expected Result:**
- Nếu query trả về plans → **BUG CONFIRMED**: Plans có tất cả phases completed nhưng status vẫn NULL
- Nếu query không trả về gì → Database đúng, vấn đề ở chỗ khác

**Status After Fix:**
- ✅ Issue đã được fix bởi Backend team (2025-12-05)
- ✅ Phase và Plan status được auto-update đúng cách khi items completed
- ✅ List API trả về đúng status từ database
- ✅ Repository methods đã được thêm: `findByPhase_PatientPhaseId()` và `findByTreatmentPlan_PlanId()`

---

### Issue #42: API 3.7 - Reschedule appointment không chuyển plan items từ SCHEDULED về READY_FOR_BOOKING

**Status:** ✅ **RESOLVED**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-04  
**Resolved Date:** 2025-12-05  
**Endpoint:** `POST /api/v1/appointments/{appointmentCode}/reschedule` (API 3.7)

#### Problem Description

Khi reschedule appointment từ treatment plan, BE lấy plan items từ old appointment (status = `SCHEDULED`) và cố gắng tạo appointment mới với các items đó. Tuy nhiên, validation trong `AppointmentCreationService.validatePlanItems()` yêu cầu tất cả plan items phải có status = `READY_FOR_BOOKING` trước khi tạo appointment mới.

**Expected Behavior:**
- Khi reschedule appointment từ treatment plan, BE tự động chuyển status của plan items từ `SCHEDULED` về `READY_FOR_BOOKING` (vì old appointment sẽ bị cancel)
- Sau đó mới validate và tạo appointment mới với các items đó
- Reschedule process hoàn thành thành công

**Actual Behavior:**
- BE lấy plan items từ old appointment (status = `SCHEDULED`)
- BE cố gắng tạo appointment mới với các items đó
- Validation fail với lỗi: `"Some patient plan items are not ready for booking: [97 (status: SCHEDULED)]"`
- Reschedule process bị chặn hoàn toàn

#### Root Cause Analysis

**1. Reschedule Flow (Current - INCORRECT):**
File: `files_from_BE/booking_appointment/service/AppointmentRescheduleService.java` (method `rescheduleAppointment`, lines 64-108)

```java
// STEP 3.5: FIX Issue #39 - Get plan item IDs from old appointment
List<Long> planItemIds = getPlanItemIdsFromOldAppointment(oldAppointment);

// STEP 4: Get patient code from old appointment
String patientCode = getPatientCode(oldAppointment);

// STEP 5: Create new appointment with plan items linked
CreateAppointmentRequest createRequest = buildCreateRequest(request, patientCode, serviceCodes, planItemIds);
Appointment newAppointment = creationService.createAppointmentInternal(createRequest); // ❌ Validation fails here

// STEP 6: Cancel old appointment and link to new one
cancelOldAppointment(oldAppointment, newAppointment, request);
```

- Plan items được lấy từ old appointment với status = `SCHEDULED`
- Appointment mới được tạo với các items đó → Validation fail
- Old appointment chỉ bị cancel SAU KHI appointment mới được tạo

**2. Validation Logic (Correct but Blocked):**
File: `files_from_BE/booking_appointment/service/AppointmentCreationService.java` (method `validatePlanItems`, lines 550-562)

```java
// Check 3: All items must be ready for booking
List<String> notReadyItems = items.stream()
    .filter(item -> item.getStatus() != PlanItemStatus.READY_FOR_BOOKING)
    .map(item -> item.getItemId() + " (status: " + item.getStatus() + ")")
    .collect(Collectors.toList());

if (!notReadyItems.isEmpty()) {
    throw new BadRequestAlertException(
        "Some patient plan items are not ready for booking: " + notReadyItems,
        ENTITY_NAME,
        "PLAN_ITEMS_NOT_READY");
}
```

- Validation này đúng cho việc tạo appointment mới
- Nhưng không phù hợp với reschedule flow, vì items đang ở status `SCHEDULED` từ old appointment

**3. Auto-Update Logic (Exists but Too Late):**
File: `files_from_BE/booking_appointment/service/AppointmentStatusService.java` (method `updateLinkedPlanItemsStatus`, lines 303-342)

```java
// Appointment CANCELLED → Plan items READY_FOR_BOOKING (allow re-booking)
case CANCELLED:
    targetStatus = PlanItemStatus.READY_FOR_BOOKING;
    break;
```

- Logic này tồn tại và đúng, nhưng chỉ được gọi SAU KHI appointment bị cancel
- Trong reschedule flow, old appointment chỉ bị cancel SAU KHI appointment mới được tạo
- Do đó, plan items vẫn có status = `SCHEDULED` khi validation chạy

#### Resolution

**✅ FIXED by Backend Team (2025-12-05)**

Backend đã fix issue này bằng cách thêm method `resetPlanItemsStatusForReschedule()` để reset plan items status TRƯỚC KHI tạo appointment mới.

**File:** `files_from_BE/booking_appointment/service/AppointmentRescheduleService.java`

**Fix Applied:**

1. **rescheduleAppointment()** (line 92-98):
   - ✅ Thêm STEP 3.6: Reset plan items status TRƯỚC KHI tạo appointment mới
   - ✅ Comment: "FIX Issue #42 - Reset plan items status from SCHEDULED to READY_FOR_BOOKING"
   - ✅ Gọi `resetPlanItemsStatusForReschedule(planItemIds)` trước khi validate và tạo appointment

2. **resetPlanItemsStatusForReschedule()** (line 346-361):
   - ✅ Method mới được thêm để reset plan items từ SCHEDULED về READY_FOR_BOOKING
   - ✅ Chỉ reset items có status = SCHEDULED
   - ✅ Flush changes trước khi validation chạy
   - ✅ Comment giải thích rõ lý do cần reset

**Code Flow (After Fix):**
```java
// STEP 3.5: Get plan item IDs from old appointment
List<Long> planItemIds = getPlanItemIdsFromOldAppointment(oldAppointment);

// STEP 3.6: ✅ FIX Issue #42 - Reset plan items status
if (planItemIds != null && !planItemIds.isEmpty()) {
    resetPlanItemsStatusForReschedule(planItemIds);  // Reset SCHEDULED → READY_FOR_BOOKING
    entityManager.flush();  // Ensure changes persisted
}

// STEP 5: Create new appointment (validation will pass now)
Appointment newAppointment = creationService.createAppointmentInternal(createRequest);

// STEP 6: Cancel old appointment (will trigger auto-update, but items already reset)
cancelOldAppointment(oldAppointment, newAppointment, request);
```

**Verification:**
- ✅ Method `resetPlanItemsStatusForReschedule()` đã được implement
- ✅ Được gọi đúng thời điểm (trước khi tạo appointment mới)
- ✅ Comments trong code xác nhận fix Issue #42
- ✅ Logic flush đảm bảo changes được persist trước validation

#### Suggested Fix (Historical - Already Applied)

Cập nhật `AppointmentRescheduleService.rescheduleAppointment()` để chuyển status của plan items TRƯỚC KHI tạo appointment mới:

```java
@Transactional
public RescheduleAppointmentResponse rescheduleAppointment(
    String oldAppointmentCode,
    RescheduleAppointmentRequest request) {

    // ... existing code ...

    // STEP 3.5: FIX Issue #39 - Get plan item IDs from old appointment
    List<Long> planItemIds = getPlanItemIdsFromOldAppointment(oldAppointment);

    // ✅ NEW STEP: Reset plan items status from SCHEDULED to READY_FOR_BOOKING
    // This is necessary because old appointment will be cancelled, allowing re-booking
    if (planItemIds != null && !planItemIds.isEmpty()) {
        resetPlanItemsStatusForReschedule(planItemIds);
        log.info("Reset {} plan items from SCHEDULED to READY_FOR_BOOKING for reschedule",
            planItemIds.size());
    }

    // STEP 4: Get patient code from old appointment
    String patientCode = getPatientCode(oldAppointment);

    // STEP 5: Create new appointment with plan items linked
    CreateAppointmentRequest createRequest = buildCreateRequest(request, patientCode, serviceCodes, planItemIds);
    Appointment newAppointment = creationService.createAppointmentInternal(createRequest);

    // ... rest of the code ...
}

/**
 * Reset plan items status from SCHEDULED to READY_FOR_BOOKING for reschedule.
 * Only resets items that are currently SCHEDULED (from old appointment).
 */
private void resetPlanItemsStatusForReschedule(List<Long> planItemIds) {
    List<PatientPlanItem> items = itemRepository.findAllById(planItemIds);
    
    for (PatientPlanItem item : items) {
        if (item.getStatus() == PlanItemStatus.SCHEDULED) {
            item.setStatus(PlanItemStatus.READY_FOR_BOOKING);
            itemRepository.save(item);
            log.debug("Reset plan item {} from SCHEDULED to READY_FOR_BOOKING for reschedule",
                item.getItemId());
        }
    }
    
    entityManager.flush(); // Ensure changes are persisted before validation
}
```

#### Impact

- **MEDIUM Priority:** Lỗi này chặn quá trình reschedule appointment từ treatment plan, một chức năng quan trọng.
- Ảnh hưởng đến trải nghiệm người dùng khi không thể đổi lịch hẹn từ treatment plan.
- Gây ra confusion vì error message không rõ ràng về nguyên nhân.

**Status After Fix:**
- ✅ Issue đã được fix bởi Backend team (2025-12-05)
- ✅ Plan items được reset từ SCHEDULED về READY_FOR_BOOKING TRƯỚC KHI tạo appointment mới
- ✅ Reschedule process hoạt động đúng với treatment plan items
- ✅ Validation không còn fail vì items đã có status đúng

#### Related Files

- `files_from_BE/booking_appointment/service/AppointmentRescheduleService.java`
  - Method: `rescheduleAppointment()` (line 71-122)
  - Method: `resetPlanItemsStatusForReschedule()` (line 346-361) - ✅ NEW
- `files_from_BE/booking_appointment/service/AppointmentCreationService.java`
- `files_from_BE/booking_appointment/service/AppointmentStatusService.java`
- `files_from_BE/treatment_plans/repository/PatientPlanItemRepository.java`

---

### Issue #43: API 5.9 - Xóa prerequisite services khỏi seed data

**Status:** 🔴 **OPEN**  
**Priority:** **HIGH**  
**Reported Date:** 2025-12-05  
**Endpoint:** `POST /api/v1/treatment-plans/{planCode}/approve` (API 5.9)  
**Type:** **DATA CLEANUP** (Chỉ sửa seed data, không thay đổi logic code)

#### Problem Description

Hiện tại trong seed data có rule `REQUIRES_PREREQUISITE` khiến các treatment plan items bị set status `WAITING_FOR_PREREQUISITE` khi approve plan. Điều này gây ra trải nghiệm không tốt cho người dùng vì items không thể đặt lịch ngay.

**Expected Behavior:**
- Khi approve treatment plan, tất cả items có service → status = `READY_FOR_BOOKING` ✅
- Không có items nào bị set status `WAITING_FOR_PREREQUISITE` ✅
- Users có thể đặt lịch ngay sau khi approve plan ✅

**Actual Behavior:**
- Khi approve plan, items có service với prerequisites → status = `WAITING_FOR_PREREQUISITE` ❌
- Items không thể đặt lịch cho đến khi prerequisite services được hoàn thành ❌
- UI hiển thị "Chờ dịch vụ tiên quyết" gây confusion cho users ❌

#### Root Cause Analysis

**1. Seed Data Contains Prerequisite Rule:**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql` (line 2877-2888)

```sql
-- Rule 1: GEN_EXAM (Khám) là tiền đề cho FILLING_COMP (Trám răng)
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'REQUIRES_PREREQUISITE',  -- ❌ Rule này khiến FILLING_COMP cần GEN_EXAM
    'Bệnh nhân phải KHÁM tổng quát trước khi được trám răng.',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'GEN_EXAM'
  AND s2.service_code = 'FILLING_COMP'
ON CONFLICT DO NOTHING;
```

**Vấn đề:**
- Rule này tạo dependency: `FILLING_COMP` requires `GEN_EXAM`
- Khi approve plan có item với service `FILLING_COMP`, BE code check prerequisites → thấy có → set status `WAITING_FOR_PREREQUISITE`
- Logic code đúng, nhưng rule trong seed data không phù hợp với business requirements

**2. BE Code Logic (Correct - Should Not Be Changed):**

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanApprovalService.java` (line 284-328)

```java
private void activateItemsWithClinicalRulesCheck(PatientTreatmentPlan plan) {
    // ...
    // Check if service has prerequisites
    boolean hasPrereqs = clinicalRulesValidationService.hasPrerequisites(serviceId);
    
    if (hasPrereqs) {
        // Service requires prerequisites → WAITING
        item.setStatus(PlanItemStatus.WAITING_FOR_PREREQUISITE);  // ✅ Logic đúng
        itemsWaiting++;
    } else {
        // No prerequisites → READY
        item.setStatus(PlanItemStatus.READY_FOR_BOOKING);
        itemsActivated++;
    }
}
```

**Logic code đúng:** Code check prerequisites từ database và set status phù hợp. Vấn đề là seed data có rule không mong muốn.

#### Suggested Fix

**Chỉ cần xóa/comment out prerequisite rules trong seed data:**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql`

**Option 1: Xóa hoàn toàn rule (Recommended)**

```sql
-- =============================================
-- BƯỚC 2.5: INSERT SERVICE DEPENDENCIES (V21 - Clinical Rules Engine)
-- =============================================
-- Quy tắc lâm sàng để đảm bảo an toàn và hiệu quả điều trị
-- =============================================

-- ❌ REMOVED: Rule 1 - GEN_EXAM prerequisite for FILLING_COMP
-- (Removed per Issue #43 - Business requirement: No prerequisite services)

-- Rule 2: EXTRACT_WISDOM_L2 (Nhổ răng khôn) -> SURG_CHECKUP (Cắt chỉ) phải cách nhau ÍT NHẤT 7 ngày
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, min_days_apart, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'REQUIRES_MIN_DAYS',
    7,
    'Cắt chỉ SAU nhổ răng khôn ít nhất 7 ngày (lý tưởng 7-10 ngày).',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'EXTRACT_WISDOM_L2'
  AND s2.service_code = 'SURG_CHECKUP'
ON CONFLICT DO NOTHING;

-- ... rest of rules (EXCLUDES_SAME_DAY, BUNDLES_WITH) remain unchanged ...
```

**Option 2: Comment out rule (Alternative)**

```sql
-- Rule 1: GEN_EXAM (Khám) là tiền đề cho FILLING_COMP (Trám răng)
-- ❌ COMMENTED OUT per Issue #43 - Business requirement: No prerequisite services
/*
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'REQUIRES_PREREQUISITE',
    'Bệnh nhân phải KHÁM tổng quát trước khi được trám răng.',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'GEN_EXAM'
  AND s2.service_code = 'FILLING_COMP'
ON CONFLICT DO NOTHING;
*/
```

**Important Notes:**
- ✅ **KHÔNG** sửa logic code trong `TreatmentPlanApprovalService.java`
- ✅ **KHÔNG** sửa logic code trong `TreatmentPlanItemService.java` (unlockDependentItems)
- ✅ **KHÔNG** xóa enum value `WAITING_FOR_PREREQUISITE` (vẫn cần cho tương lai)
- ✅ **KHÔNG** xóa database table `service_dependencies` (vẫn cần cho các rule types khác)
- ✅ **CHỈ** xóa/comment các INSERT statements có `rule_type = 'REQUIRES_PREREQUISITE'`
- ✅ Giữ lại các rule types khác: `REQUIRES_MIN_DAYS`, `EXCLUDES_SAME_DAY`, `BUNDLES_WITH`

#### Impact

- **HIGH Priority:** Ảnh hưởng trực tiếp đến trải nghiệm người dùng khi approve treatment plans
- Sau khi fix, tất cả items sẽ có status `READY_FOR_BOOKING` ngay sau khi approve
- Users có thể đặt lịch ngay lập tức, không cần chờ prerequisite services
- UI sẽ không còn hiển thị "Chờ dịch vụ tiên quyết"

**Database Cleanup (if needed):**

Nếu database đã có data từ seed data cũ, có thể cần cleanup:

```sql
-- Remove existing REQUIRES_PREREQUISITE rules from database
DELETE FROM service_dependencies 
WHERE rule_type = 'REQUIRES_PREREQUISITE';

-- Verify cleanup
SELECT COUNT(*) FROM service_dependencies WHERE rule_type = 'REQUIRES_PREREQUISITE';
-- Expected: 0
```

#### Related Files

- `files_from_BE/db/dental-clinic-seed-data.sql`
  - Line 2877-2888: Rule 1 - GEN_EXAM prerequisite for FILLING_COMP (❌ REMOVE)
- `files_from_BE/treatment_plans/service/TreatmentPlanApprovalService.java`
  - Method: `activateItemsWithClinicalRulesCheck()` (✅ KEEP - Logic đúng)
- `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java`
  - Method: `unlockDependentItems()` (✅ KEEP - Logic đúng, nhưng sẽ không được trigger nếu không có prerequisites)

#### Test Cases

**Test 1: Approve Plan Without Prerequisites**

```
1. Create treatment plan with item có service FILLING_COMP
2. Approve plan
3. Expected:
   - Item status = READY_FOR_BOOKING ✅
   - Item KHÔNG có status WAITING_FOR_PREREQUISITE ✅
   - UI hiển thị "Sẵn sàng đặt lịch" ✅
4. Actual (before fix):
   - Item status = WAITING_FOR_PREREQUISITE ❌
   - UI hiển thị "Chờ dịch vụ tiên quyết" ❌
```

**Test 2: Verify No Prerequisites in Database**

```
1. Check service_dependencies table
2. Expected:
   - COUNT(*) WHERE rule_type = 'REQUIRES_PREREQUISITE' = 0 ✅
3. Actual (before fix):
   - COUNT(*) WHERE rule_type = 'REQUIRES_PREREQUISITE' > 0 ❌
```

**Test 3: Other Rule Types Still Work**

```
1. Verify REQUIRES_MIN_DAYS rules still exist
2. Verify EXCLUDES_SAME_DAY rules still exist
3. Verify BUNDLES_WITH rules still exist
4. Expected: All other rule types remain functional ✅
```

#### Additional Notes

**Why This Approach:**
- Logic code đúng và có thể hữu ích trong tương lai
- Chỉ cần remove prerequisite rules từ seed data để phù hợp với business requirements hiện tại
- Nếu cần prerequisite services trong tương lai, chỉ cần thêm lại vào seed data

**Migration Path:**
- Update seed data file
- Nếu database đã có data, chạy cleanup SQL để xóa existing prerequisite rules
- Test approve plan flow để verify items có status `READY_FOR_BOOKING`

---

### Issue #44:  - Xóa toàn bộ hệ thống work shifts, employee shifts, registrations và slots

**Status:** 🔴 **OPEN**  
**Priority:** **HIGH**  
**Reported Date:** 2025-12-05  
**Type:** **FEATURE REMOVAL** (Xóa toàn bộ module work schedule management)

#### Problem Description

Hiện tại hệ thống có quá nhiều tính năng phức tạp liên quan đến quản lý ca làm việc của nhân viên:
- Work shifts (mẫu ca làm việc)
- Employee shifts (ca làm việc cụ thể của nhân viên)
- Employee shift registrations (đăng ký ca làm việc)
- Part-time slots (slots cho nhân viên part-time)

Điều này gây phức tạp không cần thiết. Business requirement mới: **Chỉ cần khả năng tạo giờ làm cho nhân viên một cách đơn giản**, không cần các tính năng phức tạp trên.

**Expected Behavior:**
- ✅ Users có thể tạo giờ làm cho nhân viên một cách đơn giản (có thể là một API đơn giản)
- ✅ Không cần work shifts templates
- ✅ Không cần employee shifts scheduling
- ✅ Không cần registration system
- ✅ Không cần part-time slots system

**Actual Behavior:**
- ❌ Hệ thống có quá nhiều tính năng phức tạp không cần thiết
- ❌ Work shifts templates (Ca Sáng, Ca Chiều, etc.)
- ❌ Employee shifts với nhiều sources (BATCH_JOB, REGISTRATION_JOB, OT_APPROVAL, MANUAL_ENTRY)
- ❌ Employee shift registrations system
- ❌ Part-time slots với quota system

#### Root Cause Analysis

**1. Database Tables to Remove:**

**File:** `files_from_BE/db/schema.sql`

```sql
-- ❌ REMOVE: Work Shifts (Mẫu ca làm việc)
CREATE TABLE work_shifts (
    work_shift_id VARCHAR(50) PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    category VARCHAR(50) DEFAULT 'NORMAL',
    is_active BOOLEAN DEFAULT TRUE
);

-- ❌ REMOVE: Employee Shifts (Ca làm việc cụ thể của nhân viên)
CREATE TABLE employee_shifts (
    employee_shift_id VARCHAR(50) PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    work_shift_id VARCHAR(50) NOT NULL REFERENCES work_shifts(work_shift_id),
    source VARCHAR(50) DEFAULT 'MANUAL_ENTRY',
    is_overtime BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, work_date, work_shift_id)
);
```

**2. Additional Tables (if exist):**

- `employee_shift_registrations` - Đăng ký ca làm việc
- `part_time_slots` - Slots cho part-time employees
- `fixed_shift_registrations` - Fixed shift registrations
- `fixed_registration_days` - Days for fixed registrations
- Các bảng liên quan khác

**3. Seed Data to Remove:**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql`

- ❌ Tất cả INSERT INTO `work_shifts` (line ~956-968)
- ❌ Tất cả INSERT INTO `employee_shifts` (line ~1313-3489)
- ❌ Tất cả INSERT INTO `employee_shift_registrations` (nếu có)
- ❌ Tất cả INSERT INTO `part_time_slots` (line ~2421-2502)
- ❌ Tất cả INSERT INTO `fixed_shift_registrations` (line ~2181-2390)
- ❌ Tất cả INSERT INTO `fixed_registration_days` (line ~2189-2390)

**4. BE Code to Remove:**

- ❌ Toàn bộ module `working_schedule` hoặc `work_shifts`
- ❌ Tất cả APIs liên quan đến work shifts
- ❌ Tất cả APIs liên quan đến employee shifts
- ❌ Tất cả APIs liên quan đến registrations
- ❌ Tất cả APIs liên quan đến part-time slots
- ❌ Batch jobs tạo employee shifts tự động
- ❌ Registration jobs

**5. Permissions to Remove:**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql`

- ❌ `VIEW_WORK_SHIFTS`
- ❌ `CREATE_WORK_SHIFTS`
- ❌ `UPDATE_WORK_SHIFTS`
- ❌ `DELETE_WORK_SHIFTS`
- ❌ Các permissions liên quan khác

#### Suggested Fix

**Step 1: Remove Database Tables**

```sql
-- Drop foreign key constraints first
ALTER TABLE employee_shifts DROP CONSTRAINT IF EXISTS employee_shifts_work_shift_id_fkey;
ALTER TABLE employee_shift_registrations DROP CONSTRAINT IF EXISTS employee_shift_registrations_work_shift_id_fkey;
ALTER TABLE part_time_slots DROP CONSTRAINT IF EXISTS part_time_slots_work_shift_id_fkey;
ALTER TABLE fixed_shift_registrations DROP CONSTRAINT IF EXISTS fixed_shift_registrations_work_shift_id_fkey;
ALTER TABLE fixed_registration_days DROP CONSTRAINT IF EXISTS fixed_registration_days_registration_id_fkey;
-- ... other foreign keys ...

-- Drop tables
DROP TABLE IF EXISTS fixed_registration_days CASCADE;
DROP TABLE IF EXISTS fixed_shift_registrations CASCADE;
DROP TABLE IF EXISTS employee_shift_registrations CASCADE;
DROP TABLE IF EXISTS part_time_slots CASCADE;
DROP TABLE IF EXISTS employee_shifts CASCADE;
DROP TABLE IF EXISTS work_shifts CASCADE;

-- Drop ENUMs if not used elsewhere
DROP TYPE IF EXISTS work_shift_category CASCADE;
DROP TYPE IF EXISTS shift_source CASCADE;
DROP TYPE IF EXISTS shift_status CASCADE;
```

**Step 2: Remove Seed Data**

**File:** `files_from_BE/db/dental-clinic-seed-data.sql`

- Xóa tất cả INSERT statements cho các bảng trên
- Xóa permissions liên quan
- Xóa role-permission mappings

**Step 3: Remove BE Code**

- Xóa toàn bộ package `com.dental.clinic.management.working_schedule`
- Xóa toàn bộ package `com.dental.clinic.management.work_shifts` (nếu có)
- Xóa tất cả controllers, services, repositories liên quan
- Xóa batch jobs tạo employee shifts
- Xóa registration jobs

**Step 4: Remove API Endpoints**

Xóa tất cả endpoints liên quan:
- `GET /api/v1/work-shifts`
- `POST /api/v1/work-shifts`
- `PUT /api/v1/work-shifts/{id}`
- `DELETE /api/v1/work-shifts/{id}`
- `GET /api/v1/employee-shifts`
- `POST /api/v1/employee-shifts`
- `GET /api/v1/registrations/available-slots`
- `POST /api/v1/registrations`
- ... và tất cả endpoints khác liên quan

**Step 5: Update Appointment System (if needed)**

Nếu appointment system có dependency vào employee shifts để check availability:
- Cần refactor để không phụ thuộc vào employee_shifts
- Có thể cần một cách đơn giản hơn để check employee availability

**Step 6: Create Simple Alternative (if needed)**

Nếu cần một cách đơn giản để quản lý giờ làm của nhân viên:
- Có thể tạo một API đơn giản: `POST /api/v1/employees/{id}/working-hours`
- Request body đơn giản: `{ "date": "2025-12-15", "startTime": "08:00", "endTime": "17:00" }`
- Không cần templates, registrations, slots, etc.

#### Impact

- **HIGH Priority:** Đây là một thay đổi lớn về architecture
- Ảnh hưởng đến toàn bộ module work schedule management
- Cần migration plan cẩn thận để không break existing appointments
- Có thể cần refactor appointment booking system nếu nó phụ thuộc vào employee shifts

**Benefits:**
- ✅ Đơn giản hóa hệ thống đáng kể
- ✅ Giảm complexity trong codebase
- ✅ Dễ maintain hơn
- ✅ Phù hợp với business requirements mới

**Risks:**
- ⚠️ Cần đảm bảo appointment booking vẫn hoạt động
- ⚠️ Cần migration plan cho existing data (nếu có)
- ⚠️ Cần test kỹ các tính năng liên quan

#### Related Files

**Database:**
- `files_from_BE/db/schema.sql`
  - `work_shifts` table (line 327-334)
  - `employee_shifts` table (line 337-347)
- `files_from_BE/db/dental-clinic-seed-data.sql`
  - Work shifts seed data (line ~956-968)
  - Employee shifts seed data (line ~1313-3489)
  - Part-time slots seed data (line ~2421-2502)
  - Fixed shift registrations seed data (line ~2181-2390)
  - Fixed registration days seed data (line ~2189-2390)
  - Permissions (line ~215-218)

**BE Code:**
- `files_from_BE/working_schedule/` - Toàn bộ package
- `files_from_BE/work_shifts/` - Toàn bộ package (nếu có)
- Controllers, Services, Repositories liên quan
- Batch jobs và scheduled tasks

**Frontend:**
- Các components/queries liên quan đến work shifts
- Các components/queries liên quan đến employee shifts
- Các components/queries liên quan đến registrations

#### Test Cases

**Test 1: Verify Tables Removed**

```
1. Check database schema
2. Expected:
   - work_shifts table does not exist ✅
   - employee_shifts table does not exist ✅
   - employee_shift_registrations table does not exist ✅
   - part_time_slots table does not exist ✅
   - fixed_shift_registrations table does not exist ✅
   - fixed_registration_days table does not exist ✅
```

**Test 2: Verify APIs Removed**

```
1. Try to call GET /api/v1/work-shifts
2. Expected: 404 Not Found ✅
3. Try to call GET /api/v1/employee-shifts
4. Expected: 404 Not Found ✅
```

**Test 3: Verify Appointments Still Work**

```
1. Create appointment
2. Expected: Appointment created successfully ✅
3. Check employee availability (if applicable)
4. Expected: System works without employee_shifts ✅
```

**Test 4: Verify Simple Working Hours (if implemented)**

```
1. Create working hours for employee
2. Expected: Working hours created successfully ✅
3. Verify data stored correctly ✅
```

#### Additional Notes

**Why This Change:**
- Business requirements thay đổi: Không cần hệ thống phức tạp
- Chỉ cần khả năng tạo giờ làm đơn giản cho nhân viên
- Giảm complexity và maintenance overhead

**Migration Strategy:**
1. **Phase 1:** Remove APIs và BE code (backend team)
2. **Phase 2:** Remove database tables (database migration)
3. **Phase 3:** Remove seed data (seed data update)
4. **Phase 4:** Update frontend để remove UI components (frontend team)
5. **Phase 5:** Test toàn bộ hệ thống

**Alternative Simple Solution (if needed):**

Nếu cần một cách đơn giản để quản lý giờ làm:

```java
// Simple API: POST /api/v1/employees/{employeeId}/working-hours
@PostMapping("/employees/{employeeId}/working-hours")
public ResponseEntity<WorkingHoursResponse> createWorkingHours(
    @PathVariable Integer employeeId,
    @RequestBody CreateWorkingHoursRequest request) {
    
    // Simple request:
    // {
    //   "date": "2025-12-15",
    //   "startTime": "08:00",
    //   "endTime": "17:00",
    //   "notes": "Optional notes"
    // }
    
    // Simple storage: Maybe a simple table or even JSONB in employees table
}
```

**Database Schema (Simple Alternative):**

```sql
-- Simple working hours table (if needed)
CREATE TABLE employee_working_hours (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, work_date)
);
```

---

### Issue #37: API 8.1 - Tab bệnh án bị disable khi appointment status là COMPLETED và chưa có clinical record

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-03  
**Endpoint:** `GET /api/v1/appointments/{appointmentId}/clinical-record`  
**Related:** Clinical Record Tab UI behavior

#### Problem Description

Khi trạng thái chi tiết cuộc hẹn appointment là **"Hoàn Thành" (COMPLETED)** và chưa có clinical record, Tab bệnh án trên FE bị disable (không thể click vào). Cần xác định đây là lỗi của FE hay là business rule của BE.

**Current Behavior:**
- Khi appointment status = `COMPLETED` và chưa có clinical record → Tab "Clinical Record" bị disable
- User không thể click vào tab để xem hoặc tạo clinical record
- Nếu đã có clinical record, tab vẫn có thể truy cập được (chỉ disable khi không có record)

**Expected Behavior (cần xác nhận với BE):**
- **Option 1:** User vẫn có thể VIEW tab (read-only) để xem thông tin rằng chưa có clinical record, nhưng không thể tạo mới
- **Option 2:** Tab bị disable hoàn toàn (như hiện tại) nếu BE không cho phép tạo/view clinical record khi appointment đã COMPLETED

#### Frontend Implementation

**Files:**
- `src/app/admin/booking/appointments/[appointmentCode]/page.tsx` (line 894)
- `src/app/employee/booking/appointments/[appointmentCode]/page.tsx` (line 960)

**Current Logic:**
```typescript
// Check if appointment status allows clinical record creation/editing
// BE requires: IN_PROGRESS or CHECKED_IN
const canCreateOrEditClinicalRecord = appointment && (
  appointment.status === 'IN_PROGRESS' || 
  appointment.status === 'CHECKED_IN'
);

// Tab is disabled when:
disabled={!appointment || (appointment.status !== 'IN_PROGRESS' && appointment.status !== 'CHECKED_IN' && !clinicalRecord)}
```

**Logic Breakdown:**
- Tab được ENABLE khi:
  - Status = `IN_PROGRESS` hoặc `CHECKED_IN` (bất kể có clinical record hay không)
  - Hoặc đã có clinical record (bất kể status là gì)
- Tab bị DISABLE khi:
  - Status ≠ `IN_PROGRESS` và ≠ `CHECKED_IN` VÀ chưa có clinical record
  - → **Vấn đề:** Khi status = `COMPLETED` và chưa có clinical record → tab bị disable

#### Root Cause Analysis

**Question:** Đây là lỗi của FE hay BE?

**FE Comment Analysis:**
- Comment trong code: `"BE requires: IN_PROGRESS or CHECKED_IN"`
- Comment này có thể ám chỉ:
  1. **BE chỉ cho phép CREATE/EDIT** khi status là IN_PROGRESS hoặc CHECKED_IN
  2. **BE cũng block VIEW** khi status là COMPLETED và chưa có record

**Possible Scenarios:**

**Scenario 1: FE Bug (Tab should be viewable)**
- BE cho phép VIEW clinical record (API 8.1) bất kể appointment status
- BE chỉ block CREATE/EDIT khi status không phải IN_PROGRESS/CHECKED_IN
- **Fix:** FE nên cho phép VIEW tab (read-only) ngay cả khi status = COMPLETED, nhưng disable form creation

**Scenario 2: BE Business Rule (Current behavior is correct)**
- BE block cả VIEW và CREATE khi appointment đã COMPLETED và chưa có clinical record
- **Fix:** Cần xác nhận với BE team về business rule này, có thể cần thay đổi BE để cho phép VIEW

**Scenario 3: Mixed (View allowed, Create blocked)**
- BE cho phép VIEW nhưng block CREATE khi status = COMPLETED
- **Fix:** FE nên enable tab nhưng hiển thị message "Không thể tạo bệnh án mới khi appointment đã hoàn thành" thay vì disable tab

#### Test Cases Needed

**Test 1: Verify BE API 8.1 behavior with COMPLETED appointment (no record)**
```
Given: Appointment with status = COMPLETED, no clinical record exists
When: GET /api/v1/appointments/{appointmentId}/clinical-record
Expected: 
  - Option A: 404 NOT_FOUND (BE blocks viewing)
  - Option B: 200 OK with null/empty (BE allows viewing but no record)
Actual: ❓ Need to test
```

**Test 2: Verify BE API 8.2 behavior with COMPLETED appointment**
```
Given: Appointment with status = COMPLETED, no clinical record exists
When: POST /api/v1/clinical-records { appointmentId: ..., ... }
Expected:
  - Option A: 400 BAD_REQUEST with error "Cannot create clinical record for completed appointment"
  - Option B: 201 CREATED (BE allows creating even after completion)
Actual: ❓ Need to test
```

**Test 3: Verify BE API 8.1 behavior with COMPLETED appointment (has record)**
```
Given: Appointment with status = COMPLETED, clinical record exists
When: GET /api/v1/appointments/{appointmentId}/clinical-record
Expected: 200 OK with clinical record data
Actual: ✅ Should work (FE allows access in this case)
```

#### Suggested Investigation Steps

1. **Test BE API directly:**
   - Gọi API 8.1 với appointment status = COMPLETED (chưa có record)
   - Gọi API 8.2 để tạo clinical record với appointment status = COMPLETED
   - Xác định BE có block hay không

2. **Check BE documentation/spec:**
   - Xem API spec có quy định gì về appointment status requirements
   - Xem business rules về clinical record creation/viewing

3. **Determine correct behavior:**
   - Nếu BE cho phép VIEW → Fix FE: Enable tab, show read-only view
   - Nếu BE block VIEW → Document BE behavior, keep FE as is
   - Nếu BE cho phép CREATE → Fix FE: Enable tab, allow creation

#### Impact

- **Medium Priority:** UX issue - Users không thể truy cập tab bệnh án khi appointment đã hoàn thành
- Confusion: "Tại sao không thể xem bệnh án khi appointment đã hoàn thành?"
- Potential data loss: Nếu user quên tạo clinical record trước khi complete appointment, không thể tạo sau đó
- Inconsistency: Tab có thể truy cập nếu đã có record, nhưng không thể nếu chưa có

#### Related Files

**Frontend:**
- `src/app/admin/booking/appointments/[appointmentCode]/page.tsx` (line 257-260, 894)
- `src/app/employee/booking/appointments/[appointmentCode]/page.tsx` (line 258-263, 960)
- `src/services/clinicalRecordService.ts` (API 8.1, 8.2)

**Backend (cần kiểm tra):**
- `files_from_BE/clinical_records/service/ClinicalRecordService.java`
- `files_from_BE/clinical_records/controller/ClinicalRecordController.java`
- Business rules về appointment status validation

#### Next Steps

1. ✅ **Log issue** (this document)
2. ⏳ **Test BE APIs** với appointment status = COMPLETED
3. ⏳ **Xác nhận với BE team** về business rules
4. ⏳ **Fix FE hoặc document BE behavior** dựa trên kết quả test

---

### Issue #48: Treatment Plan Status - AppointmentStatusService không check completion nếu plan status = null

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-09  
**Related Files:**
- `docs/TREATMENT_PLAN_STATUS_UPDATE_APIS.md` - Full analysis
- `files_from_BE/booking_appointment/service/AppointmentStatusService.java` (line 503-543)

#### Problem Description

Khi appointment status được update thành `COMPLETED`, BE có logic để auto-complete treatment plan nếu all phases completed. Tuy nhiên, logic này **chỉ check nếu plan status = IN_PROGRESS**, không check nếu plan status = `null`.

**Expected Behavior:**
- Khi appointment completed → Check nếu all phases completed
- Nếu all phases completed → Auto-complete plan (bất kể plan status là null hay IN_PROGRESS)
- Plan status được update từ `null` hoặc `IN_PROGRESS` → `COMPLETED`

**Actual Behavior:**
- Khi appointment completed → Check completion
- **NHƯNG chỉ check nếu plan status = IN_PROGRESS** (line 512)
- **Skip check nếu plan status = null** → Plan vẫn có status = null mặc dù all phases completed

#### Root Cause Analysis

**File:** `files_from_BE/booking_appointment/service/AppointmentStatusService.java`

**Method:** `checkAndCompletePlan(Long planId)` (line 503-543)

**Current Logic (INCORRECT):**
```java
// Line 512-515
if (plan.getStatus() != TreatmentPlanStatus.IN_PROGRESS) {
    log.debug("Plan {} not in IN_PROGRESS status (current: {}), skipping completion check", 
            planId, plan.getStatus());
    return; // ❌ Skip nếu status = null
}
```

**Vấn đề:**
- Logic này chỉ cho phép auto-complete nếu plan đã ở trạng thái `IN_PROGRESS`
- Nếu plan status = `null` (chưa được activate) → Skip check
- Kết quả: Plan với all phases completed nhưng status = null không được auto-complete

**So sánh với TreatmentPlanItemService:**
- `TreatmentPlanItemService.checkAndCompletePlan()` (line 478-529) check completion **bất kể plan status** (chỉ skip nếu COMPLETED/CANCELLED)
- Logic này đúng và hoạt động tốt

#### Suggested Fix

**File:** `files_from_BE/booking_appointment/service/AppointmentStatusService.java` (line 512)

**Change:**
```java
// BEFORE
if (plan.getStatus() != TreatmentPlanStatus.IN_PROGRESS) {
    return; // ❌ Skip nếu null
}

// AFTER
if (plan.getStatus() == TreatmentPlanStatus.COMPLETED || 
    plan.getStatus() == TreatmentPlanStatus.CANCELLED) {
    return; // ✅ Chỉ skip nếu đã completed/cancelled
}
// ✅ Check completion cho cả null và IN_PROGRESS
```

**Lợi ích:**
- Khi appointment completed → Auto-complete plan nếu all phases done
- Hoạt động cho cả plan status = null và IN_PROGRESS
- Đồng nhất với logic trong `TreatmentPlanItemService`

#### Impact

- **Medium Priority:** Plans với status = null và all phases completed sẽ được auto-complete khi appointment completed
- **Consistency:** Logic đồng nhất giữa `TreatmentPlanItemService` và `AppointmentStatusService`
- **User Experience:** Plan status được update đúng cách, không cần manual intervention

#### Related Files

**Backend:**
- `files_from_BE/booking_appointment/service/AppointmentStatusService.java` - Method: `checkAndCompletePlan()` (line 503-543)
- `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java` - Method: `checkAndCompletePlan()` (line 478-529) - Reference implementation

**Documentation:**
- `docs/TREATMENT_PLAN_STATUS_UPDATE_APIS.md` - Full API analysis

#### Next Steps

1. ✅ **Log issue** (this document)
2. ⏳ **Fix AppointmentStatusService** - Update logic để check cả null status
3. ⏳ **Test** - Verify plan được auto-complete khi appointment completed
4. ⏳ **Update documentation** - Document behavior change

---

### Issue #50: Warehouse Reports - Thêm chức năng export Excel cho báo cáo tồn kho

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-09  
**Type:** **NEW FEATURE** (Export Excel functionality for warehouse reports)  
**Related Pages:**
- src/app/admin/warehouse/reports/page.tsx
- src/app/employee/warehouse/reports/page.tsx

#### Problem Description

Hiện tại trang báo cáo tồn kho (/admin/warehouse/reports và /employee/warehouse/reports) chỉ cho phép xem dữ liệu trên màn hình. Users không thể export dữ liệu ra file Excel để phân tích hoặc lưu trữ offline.

**Expected Behavior:**
- ✅ Users có thể export báo cáo tồn kho ra file Excel
- ✅ Users có thể export báo cáo giao dịch ra file Excel
- ✅ Users có thể export báo cáo sắp hết hạn ra file Excel
- ✅ File Excel có format đẹp, dễ đọc với headers và data được format đúng
- ✅ Export giữ nguyên filters đang áp dụng (warehouse type, date range, etc.)

**Current Behavior:**
- ❌ Không có chức năng export Excel
- ❌ Users phải copy-paste data từ table (không tiện lợi)
- ❌ Không thể export toàn bộ dữ liệu (chỉ thấy data trên màn hình)

#### Root Cause Analysis

**1. Frontend Pages Using These APIs:**

**Page:** src/app/admin/warehouse/reports/page.tsx và src/app/employee/warehouse/reports/page.tsx

**Tab 1: "Tồn Kho" (Inventory Report)**
- **API Used:** inventoryService.getSummary(filter)
- **Endpoint:** GET /api/v1/warehouse/summary
- **Query Params:**
  - warehouseType: 'ALL' | 'COLD' | 'NORMAL'
  - page: number (default: 0)
  - size: number (default: 100)
  - search: string (optional)
  - stockStatus: string (optional)
  - categoryId: number (optional)
- **Response:** InventorySummaryPage với content: InventorySummary[]
- **Data Fields:**
  - itemCode, itemName, categoryName, unitOfMeasure
  - warehouseType, 	otalQuantity, minStockLevel, maxStockLevel
  - stockStatus (NORMAL, LOW_STOCK, OUT_OF_STOCK, OVERSTOCK)

**Tab 2: "Giao Dịch" (Transactions Report)**
- **API Used:** storageService.getAll(filter)
- **Endpoint:** GET /api/v1/warehouse/transactions
- **Query Params:**
  - romDate: string (ISO date format)
  - 	oDate: string (ISO date format)
  - page: number (default: 0)
  - size: number (default: 100, max: 100)
  - sortBy: string (default: 'transactionDate')
  - sortDirection: 'asc' | 'desc'
- **Response:** PaginatedResponse<StorageTransaction>
- **Data Fields:**
  - 	ransactionCode, 	ransactionType (IMPORT/EXPORT)
  - 	ransactionDate, itemCode, itemName
  - quantity, unitPrice, 	otalValue
  - warehouseType, 
otes

**Tab 3: "Sắp Hết Hạn" (Expiring Alerts Report)**
- **API Used:** inventoryService.getExpiringAlerts(filter)
- **Endpoint:** GET /api/v1/warehouse/expiring-alerts
- **Query Params:**
  - days: number (default: 30)
  - warehouseType: 'ALL' | 'COLD' | 'NORMAL' (optional)
  - page: number (default: 0)
  - size: number (default: 50)
- **Response:** ExpiringAlertsResponse với lerts: ExpiringAlert[]
- **Data Fields:**
  - itemCode, itemName, warehouseType
  - quantity, expiryDate, daysUntilExpiry
  - atchNumber (optional)

**2. Why Backend Approach is Recommended:**

- **Data Volume:** Reports có thể có hàng trăm/thousands rows, BE xử lý hiệu quả hơn
- **Security:** Không expose business logic và data processing ở client
- **Performance:** BE có thể optimize queries, caching, streaming
- **Consistency:** Format và template thống nhất, dễ maintain
- **Scalability:** Có thể mở rộng thêm filters, aggregations phức tạp

#### Suggested Implementation

**Option 1: Separate Export Endpoints (Recommended)**

Tạo 3 endpoints riêng cho từng loại báo cáo:

**1. Export Inventory Report:**
\\\
GET /api/v1/warehouse/reports/inventory/export
Query Parameters:
  - warehouseType: 'ALL' | 'COLD' | 'NORMAL' (optional, default: 'ALL')
  - search: string (optional)
  - stockStatus: string (optional)
  - categoryId: number (optional)
  - format: 'xlsx' (required)
Response:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Body: Excel file binary
  - Headers: Content-Disposition: attachment; filename="bao-cao-ton-kho-YYYY-MM-DD.xlsx"
\\\

**2. Export Transactions Report:**
\\\
GET /api/v1/warehouse/reports/transactions/export
Query Parameters:
  - fromDate: string (ISO date, required)
  - toDate: string (ISO date, required)
  - format: 'xlsx' (required)
Response:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Body: Excel file binary
  - Headers: Content-Disposition: attachment; filename="bao-cao-giao-dich-YYYY-MM-DD.xlsx"
\\\

**3. Export Expiring Alerts Report:**
\\\
GET /api/v1/warehouse/reports/expiring/export
Query Parameters:
  - days: number (optional, default: 30)
  - warehouseType: 'ALL' | 'COLD' | 'NORMAL' (optional, default: 'ALL')
  - format: 'xlsx' (required)
Response:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Body: Excel file binary
  - Headers: Content-Disposition: attachment; filename="bao-cao-sap-het-han-YYYY-MM-DD.xlsx"
\\\

**Option 2: Unified Export Endpoint (Alternative)**

\\\
GET /api/v1/warehouse/reports/export
Query Parameters:
  - type: 'inventory' | 'transactions' | 'expiring' (required)
  - [all filter parameters from respective APIs]
  - format: 'xlsx' (required)
Response:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Body: Excel file binary
  - Headers: Content-Disposition: attachment; filename="bao-cao-{type}-YYYY-MM-DD.xlsx"
\\\

**Recommended: Option 1** vì:
- Rõ ràng hơn, dễ maintain
- Mỗi endpoint có responsibility riêng
- Dễ mở rộng thêm report types khác

#### Excel File Format Requirements

**1. Inventory Report Excel Format:**

**Sheet Name:** "Báo Cáo Tồn Kho"

**Columns:**
| Mã Vật Tư | Tên Vật Tư | Danh Mục | Đơn Vị | Loại Kho | Tồn Kho | Min | Max | Trạng Thái |
|-----------|------------|----------|--------|----------|---------|-----|-----|------------|
| CON-GLOVE-01 | Găng tay y tế | Vật tư tiêu hao | Cái | Thường | 2530 | 10 | 1000 | Dư thừa |
| CON-MASK-01 | Khẩu trang y tế | Vật tư tiêu hao | Cái | Thường | 3000 | 10 | 1000 | Dư thừa |

**Formatting:**
- Header row: Bold, background color (light gray), freeze panes
- Number columns: Right-aligned
- Status column: Text format (Dư thừa, Bình thường, Sắp hết, Hết hàng)
- Auto-width columns

**2. Transactions Report Excel Format:**

**Sheet Name:** "Báo Cáo Giao Dịch"

**Columns:**
| Mã Giao Dịch | Loại | Ngày | Mã Vật Tư | Tên Vật Tư | Số Lượng | Đơn Giá | Thành Tiền | Loại Kho | Ghi Chú |
|--------------|------|------|-----------|------------|----------|---------|------------|----------|---------|
| TXN-20251209-001 | Nhập | 09/12/2025 | CON-GLOVE-01 | Găng tay y tế | 100 | 5000 | 500000 | Thường | Nhập từ nhà cung cấp A |

**Formatting:**
- Header row: Bold, background color
- Date column: Date format (dd/MM/yyyy)
- Currency columns: Number format with thousand separators
- Transaction type: Text (Nhập/Xuất)
- Auto-width columns

**3. Expiring Alerts Report Excel Format:**

**Sheet Name:** "Báo Cáo Sắp Hết Hạn"

**Columns:**
| Mã Vật Tư | Tên Vật Tư | Loại Kho | Số Lượng | Ngày Hết Hạn | Số Ngày Còn Lại | Số Lô |
|-----------|------------|----------|----------|--------------|-----------------|-------|
| MED-001 | Thuốc A | Lạnh | 50 | 15/12/2025 | 6 | LOT-2025-001 |

**Formatting:**
- Header row: Bold, background color
- Date column: Date format
- Days until expiry: Conditional formatting (red if < 7 days, orange if < 30 days)
- Auto-width columns

#### Backend Implementation Details

**1. Java Library Recommendation:**

**Apache POI** (Most Popular):
\\\xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>
\\\

**EasyExcel** (Lightweight, Fast - Alternative):
\\\xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>easyexcel</artifactId>
    <version>3.3.2</version>
</dependency>
\\\

**Recommended: Apache POI** vì:
- Phổ biến, nhiều tài liệu
- Hỗ trợ đầy đủ formatting features
- Dễ customize

**2. Controller Implementation Example:**

\\\java
@RestController
@RequestMapping("/api/v1/warehouse/reports")
public class WarehouseReportController {

    @GetMapping("/inventory/export")
    public ResponseEntity<Resource> exportInventoryReport(
            @RequestParam(required = false) String warehouseType,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "xlsx") String format) {
        
        // 1. Fetch data using existing service
        InventoryFilter filter = new InventoryFilter();
        filter.setWarehouseType(warehouseType);
        filter.setSearch(search);
        filter.setStockStatus(stockStatus);
        filter.setCategoryId(categoryId);
        filter.setPage(0);
        filter.setSize(10000); // Export all data
        
        InventorySummaryPage data = inventoryService.getSummary(filter);
        
        // 2. Generate Excel file
        byte[] excelBytes = excelGenerator.generateInventoryReport(data.getContent());
        
        // 3. Create response
        ByteArrayResource resource = new ByteArrayResource(excelBytes);
        String filename = "bao-cao-ton-kho-" + LocalDate.now().toString() + ".xlsx";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }
    
    // Similar methods for transactions and expiring reports
}
\\\

**3. Excel Generator Service:**

\\\java
@Service
public class WarehouseReportExcelGenerator {
    
    public byte[] generateInventoryReport(List<InventorySummary> items) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Báo Cáo Tồn Kho");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "Mã Vật Tư", "Tên Vật Tư", "Danh Mục", "Đơn Vị",
                "Loại Kho", "Tồn Kho", "Min", "Max", "Trạng Thái"
            };
            
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Create data rows
            int rowNum = 1;
            for (InventorySummary item : items) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(item.getItemCode());
                row.createCell(1).setCellValue(item.getItemName());
                row.createCell(2).setCellValue(item.getCategoryName());
                row.createCell(3).setCellValue(item.getUnitOfMeasure());
                row.createCell(4).setCellValue(
                    item.getWarehouseType() == 'COLD' ? "Lạnh" : "Thường");
                row.createCell(5).setCellValue(item.getTotalQuantity());
                row.createCell(6).setCellValue(item.getMinStockLevel());
                row.createCell(7).setCellValue(item.getMaxStockLevel());
                row.createCell(8).setCellValue(
                    translateStockStatus(item.getStockStatus()));
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // Freeze header row
            sheet.createFreezePane(0, 1);
            
            // Convert to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel file", e);
        }
    }
    
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }
    
    private String translateStockStatus(String status) {
        Map<String, String> statusMap = Map.of(
            "NORMAL", "Bình thường",
            "LOW_STOCK", "Sắp hết",
            "OUT_OF_STOCK", "Hết hàng",
            "OVERSTOCK", "Dư thừa"
        );
        return statusMap.getOrDefault(status, status);
    }
}
\\\

#### Frontend Integration

**1. Service Method (inventoryService.ts or new warehouseReportService.ts):**

\\\	ypescript
export const warehouseReportService = {
  exportInventory: async (filters: {
    warehouseType?: string;
    search?: string;
    stockStatus?: string;
    categoryId?: number;
  }) => {
    const response = await api.get('/warehouse/reports/inventory/export', {
      params: { ...filters, format: 'xlsx' },
      responseType: 'blob', // Important!
    });
    return response.data;
  },
  
  exportTransactions: async (filters: {
    fromDate: string;
    toDate: string;
  }) => {
    const response = await api.get('/warehouse/reports/transactions/export', {
      params: { ...filters, format: 'xlsx' },
      responseType: 'blob',
    });
    return response.data;
  },
  
  exportExpiring: async (filters: {
    days?: number;
    warehouseType?: string;
  }) => {
    const response = await api.get('/warehouse/reports/expiring/export', {
      params: { ...filters, format: 'xlsx' },
      responseType: 'blob',
    });
    return response.data;
  },
};
\\\

**2. Component Usage (in reports/page.tsx):**

\\\	ypescript
const handleExportExcel = async () => {
  try {
    let blob;
    let filename;
    
    switch (activeReport) {
      case 'inventory':
        blob = await warehouseReportService.exportInventory({
          warehouseType: warehouseFilter,
        });
        filename = \ao-cao-ton-kho-\.xlsx\;
        break;
        
      case 'transactions':
        // Calculate date range from timeRange...
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        blob = await warehouseReportService.exportTransactions({
          fromDate: startDate.toISOString().split('T')[0],
          toDate: now.toISOString().split('T')[0],
        });
        filename = \ao-cao-giao-dich-\.xlsx\;
        break;
        
      case 'expiring':
        blob = await warehouseReportService.exportExpiring({
          days: 30,
        });
        filename = \ao-cao-sap-het-han-\.xlsx\;
        break;
    }
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Xuất file Excel thành công');
  } catch (error: any) {
    console.error('Export error:', error);
    toast.error('Xuất file thất bại: ' + (error.message || 'Vui lòng thử lại'));
  }
};
\\\

**3. UI Button (Add to each tab header):**

\\\	sx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">Báo Cáo Tồn Kho Chi Tiết</h3>
  <Button onClick={handleExportExcel} variant="outline" size="sm">
    <FontAwesomeIcon icon={faDownload} className="mr-2" />
    Xuất Excel
  </Button>
</div>
\\\

#### Impact

- **MEDIUM Priority:** Feature enhancement - cải thiện UX cho warehouse management
- **User Benefits:**
  - ✅ Có thể export data để phân tích offline
  - ✅ Có thể lưu trữ báo cáo lịch sử
  - ✅ Có thể chia sẻ báo cáo với stakeholders
  - ✅ Dễ dàng import vào Excel để tính toán thêm
- **Technical Benefits:**
  - ✅ Tận dụng existing APIs và services
  - ✅ Consistent với architecture hiện tại
  - ✅ Dễ maintain và mở rộng

#### Related Files

**Backend (to be created):**
- com.dental.clinic.management.warehouse.controller.WarehouseReportController.java
- com.dental.clinic.management.warehouse.service.WarehouseReportExcelGenerator.java
- pom.xml - Add Apache POI dependency

**Frontend (existing):**
- src/app/admin/warehouse/reports/page.tsx
- src/app/employee/warehouse/reports/page.tsx
- src/services/inventoryService.ts (or new warehouseReportService.ts)
- src/services/storageService.ts

**Frontend (to be updated):**
- Add export button to each report tab
- Add export handler function
- Add loading state during export

#### Test Cases

**Test 1: Export Inventory Report**
\\\
1. Navigate to /admin/warehouse/reports
2. Select "Tồn Kho" tab
3. Set warehouse filter to "Thường"
4. Click "Xuất Excel" button
5. Expected:
   - File downloads with name "bao-cao-ton-kho-YYYY-MM-DD.xlsx"
   - File contains all inventory items matching filter
   - Headers are in Vietnamese
   - Data is correctly formatted
\\\

**Test 2: Export Transactions Report**
\\\
1. Navigate to /admin/warehouse/reports
2. Select "Giao Dịch" tab
3. Set time range to "30 ngày qua"
4. Click "Xuất Excel" button
5. Expected:
   - File downloads with name "bao-cao-giao-dich-YYYY-MM-DD.xlsx"
   - File contains all transactions in date range
   - Dates are formatted correctly
   - Currency values are formatted with thousand separators
\\\

**Test 3: Export Expiring Alerts Report**
\\\
1. Navigate to /admin/warehouse/reports
2. Select "Sắp Hết Hạn" tab
3. Click "Xuất Excel" button
4. Expected:
   - File downloads with name "bao-cao-sap-het-han-YYYY-MM-DD.xlsx"
   - File contains all expiring items
   - Days until expiry is calculated correctly
   - Conditional formatting applied (if implemented)
\\\

**Test 4: Export with Filters**
\\\
1. Apply various filters (warehouse type, search, etc.)
2. Export report
3. Expected:
   - Exported data matches filtered data on screen
   - All filters are respected in export
\\\

**Test 5: Large Data Export**
\\\
1. Export report with large dataset (> 1000 rows)
2. Expected:
   - Export completes successfully
   - File size is reasonable
   - All data is included
   - Performance is acceptable (< 10 seconds)
\\\

#### Additional Notes

**Why Backend Approach:**
- Data volume có thể lớn (hàng nghìn rows)
- Cần format phức tạp (headers, styling, conditional formatting)
- Security: Không expose business logic
- Performance: BE có thể optimize queries và streaming
- Consistency: Format thống nhất cho tất cả users

**Future Enhancements:**
- Add PDF export option
- Add email export (send report via email)
- Add scheduled exports (daily/weekly reports)
- Add custom date range picker for transactions
- Add more filters (category, supplier, etc.)

**Dependencies:**
- Apache POI library (backend)
- No additional frontend dependencies needed

---

### Issue #51: API 5.2 - Auto-complete plan status khi load detail nếu tất cả phases đã completed

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-09  
**Endpoint:** `GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}` (API 5.2)

#### Problem Description

Hiện tại, BE chỉ auto-complete plan status khi có **item status update** (trong `TreatmentPlanItemService.updateItemStatus()`). Nếu plan đã có tất cả phases completed nhưng không có action mới (không có item status update) → plan status vẫn là `null`.

**Vấn đề:**
- Plan có tất cả phases completed nhưng status = `null`
- FE phải tính toán fallback và lưu vào `sessionStorage`
- Khi tắt browser/mở lại hoặc chạy trên thiết bị khác → calculated status bị mất
- User experience không nhất quán giữa các sessions

**Root Cause:**

File: `treatment_plans/service/TreatmentPlanItemService.java` (line 478-529)

Method `checkAndCompletePlan()` chỉ được gọi trong:
- `updateItemStatus()` (line 225) - khi có item status update

Method này **KHÔNG** được gọi trong:
- `TreatmentPlanDetailService.getTreatmentPlanDetail()` - khi load plan detail
- `TreatmentPlanListService.listAllPlans()` - khi load plan list

**Suggested Implementation:**

**Option 1: Auto-complete trong Detail Service (Recommended)**

File: `treatment_plans/service/TreatmentPlanDetailService.java`

Thêm logic check và auto-complete sau khi build nested response:

```java
@Transactional // Change to @Transactional (not readOnly) to allow status update
public TreatmentPlanDetailResponse getTreatmentPlanDetail(String patientCode, String planCode) {
    // ... existing code ...
    
    // STEP 3: Transform flat DTOs to nested response structure
    TreatmentPlanDetailResponse response = buildNestedResponse(flatDTOs);
    
    // STEP 4: NEW - Check and auto-complete plan if all phases completed
    PatientTreatmentPlan plan = treatmentPlanRepository.findByPlanCode(planCode)
        .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planCode));
    
    if (plan.getStatus() == null || plan.getStatus() != TreatmentPlanStatus.COMPLETED) {
        // Check if all phases are completed
        List<PatientPlanPhase> phases = phaseRepository.findByTreatmentPlan_PlanId(plan.getPlanId());
        
        if (!phases.isEmpty()) {
            boolean allPhasesCompleted = phases.stream()
                .allMatch(phase -> phase.getStatus() == PhaseStatus.COMPLETED);
            
            if (allPhasesCompleted && plan.getStatus() != TreatmentPlanStatus.COMPLETED) {
                plan.setStatus(TreatmentPlanStatus.COMPLETED);
                treatmentPlanRepository.save(plan);
                entityManager.flush();
                
                // Update response status
                response.setStatus(TreatmentPlanStatus.COMPLETED.name());
                
                log.info("Auto-completed plan {} when loading detail - All {} phases completed",
                    planCode, phases.size());
            }
        }
    }
    
    return response;
}
```

**Option 2: Background Job (Alternative)**

Tạo scheduled job để check và auto-complete plans định kỳ:

```java
@Scheduled(cron = "0 0 * * * ?") // Run daily at midnight
@Transactional
public void autoCompletePlans() {
    List<PatientTreatmentPlan> plans = planRepository.findByStatusIsNullAndApprovalStatus(ApprovalStatus.APPROVED);
    
    for (PatientTreatmentPlan plan : plans) {
        List<PatientPlanPhase> phases = phaseRepository.findByTreatmentPlan_PlanId(plan.getPlanId());
        
        if (!phases.isEmpty()) {
            boolean allPhasesCompleted = phases.stream()
                .allMatch(phase -> phase.getStatus() == PhaseStatus.COMPLETED);
            
            if (allPhasesCompleted) {
                plan.setStatus(TreatmentPlanStatus.COMPLETED);
                planRepository.save(plan);
                log.info("Auto-completed plan {} via scheduled job", plan.getPlanCode());
            }
        }
    }
}
```

**Impact:**

**Positive:**
- ✅ Plan status sẽ được auto-complete khi load detail
- ✅ FE không cần tính toán fallback và lưu sessionStorage
- ✅ User experience nhất quán giữa các sessions
- ✅ Data consistency giữa list và detail views

**Negative:**
- ⚠️ Option 1: Cần thay đổi `@Transactional(readOnly = true)` → `@Transactional` (có thể ảnh hưởng performance)
- ⚠️ Option 2: Cần thêm scheduled job (phức tạp hơn)

**Related Files:**

- `treatment_plans/service/TreatmentPlanDetailService.java` - Main implementation
- `treatment_plans/service/TreatmentPlanItemService.java` - Reference implementation (checkAndCompletePlan method)
- `treatment_plans/repository/PatientTreatmentPlanRepository.java` - Repository methods
- `treatment_plans/repository/PatientPlanPhaseRepository.java` - Phase repository

**Test Cases:**

**Test 1: Auto-complete khi load detail**
1. Tạo plan với tất cả phases completed nhưng status = null
2. Gọi API 5.2 GET detail
3. Expected:
   - Response có `status: "COMPLETED"`
   - Database được update `status = COMPLETED`
   - Log có message "Auto-completed plan..."

**Test 2: Không auto-complete nếu chưa completed**
1. Tạo plan với một số phases chưa completed
2. Gọi API 5.2 GET detail
3. Expected:
   - Response giữ nguyên status (null hoặc IN_PROGRESS)
   - Database không thay đổi

**Test 3: Idempotent - không update nếu đã COMPLETED**
1. Plan đã có status = COMPLETED
2. Gọi API 5.2 GET detail
3. Expected:
   - Response giữ nguyên status = COMPLETED
   - Không có log "Auto-completed"

**Test 4: Performance - không ảnh hưởng load time**
1. Load detail cho plan lớn (nhiều phases/items)
2. Measure response time
3. Expected:
   - Response time tương đương trước khi thêm logic
   - Không có N+1 query issues

---

### Issue #52: API Patient List - PatientInfoResponse thiếu blocking fields

**Status:** 🔴 **OPEN**  
**Priority:** **HIGH**  
**Reported Date:** 2025-12-10  
**Endpoint:** `GET /api/v1/patients` (Patient List API)  
**Related Files:**
- `docs/files_from_BE/patient/dto/response/PatientInfoResponse.java`
- `docs/files_from_BE/patient/dto/response/PatientDetailResponse.java`
- `docs/files_from_BE/patient/mapper/PatientMapper.java`

#### Problem Description

Backend đã refactor patient blacklist fields từ `isBlacklisted` sang unified system với `isBookingBlocked`, `bookingBlockReason`, `bookingBlockNotes`, `blockedBy`, `blockedAt`, `consecutiveNoShows` (theo docs/files_from_BE/BE_message.md).

Tuy nhiên, **`PatientInfoResponse` DTO** **KHÔNG** có các fields này. Vấn đề nghiêm trọng là:
1. **Patient Detail API** (`GET /api/v1/patients/{patientCode}`) trả về `PatientInfoResponse` - không có blocking fields
2. **Patient List API** (`GET /api/v1/patients`) trả về `PatientInfoResponse[]` - không có blocking fields

**Expected Behavior:**
- ✅ Patient Detail API trả về `isBookingBlocked`, `bookingBlockReason`, và các blocking fields khác
- ✅ Patient List API trả về `isBookingBlocked`, `bookingBlockReason`, và các blocking fields khác
- ✅ FE có thể hiển thị block status trong detail page và list page
- ✅ Checkbox và badge hiển thị đúng trạng thái chặn đặt lịch

**Actual Behavior:**
- ❌ `PatientInfoResponse` DTO **KHÔNG có** các blocking fields
- ❌ `PatientMapper.toPatientInfoResponse()` **KHÔNG map** các blocking fields
- ❌ Patient Detail API **KHÔNG trả về** `isBookingBlocked`, `bookingBlockReason`, etc.
- ❌ Patient List API **KHÔNG trả về** `isBookingBlocked`, `bookingBlockReason`, etc.
- ❌ FE nhận được `undefined` cho `isBookingBlocked` ở cả detail page và list page
- ❌ UI không thể hiển thị block status

**Note:**
- `PatientDetailResponse` DTO có đầy đủ blocking fields ✅
- `mapToPatientDetailResponse()` mapper có đầy đủ logic ✅
- **NHƯNG:** Chỉ API `/patients/me/profile` (mobile app) dùng `PatientDetailResponse`
- Tất cả APIs khác (detail, list, create, update) đều dùng `PatientInfoResponse` ❌

#### Root Cause Analysis

**1. PatientInfoResponse DTO (THIẾU FIELDS):**

**File:** `patient/dto/response/PatientInfoResponse.java` (line 10-38)

```java
public class PatientInfoResponse {
    private Integer patientId;
    private String patientCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String address;
    private String gender;
    private String medicalHistory;
    private String allergies;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String guardianName;
    private String guardianPhone;
    private String guardianRelationship;
    private String guardianCitizenId;
    private Boolean isActive;  // ✅ Có field này
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Account-related fields
    private Boolean hasAccount;
    private Integer accountId;
    private String accountStatus;
    private Boolean isEmailVerified;
    
    // ❌ THIẾU: isBookingBlocked
    // ❌ THIẾU: bookingBlockReason
    // ❌ THIẾU: bookingBlockNotes
    // ❌ THIẾU: blockedBy
    // ❌ THIẾU: blockedAt
    // ❌ THIẾU: consecutiveNoShows
}
```

**2. PatientDetailResponse DTO (CÓ ĐẦY ĐỦ FIELDS - CORRECT):**

**File:** `docs/files_from_BE/patient/dto/response/PatientDetailResponse.java`

```java
public class PatientDetailResponse {
    // ... basic fields ...
    
    // ✅ HAS: Blocking fields
    private Boolean isBookingBlocked;
    private String bookingBlockReason;  // ENUM: BookingBlockReason
    private String bookingBlockNotes;
    private String blockedBy;           // Employee name
    private LocalDateTime blockedAt;
    private Integer consecutiveNoShows;
}
```

**3. PatientMapper (KHÔNG MAP BLOCKING FIELDS CHO INFO RESPONSE):**

**File:** `patient/mapper/PatientMapper.java`

```java
// ❌ Method: toPatientInfoResponse() - KHÔNG map blocking fields (line 21-62)
public PatientInfoResponse toPatientInfoResponse(Patient patient) {
    if (patient == null) {
        return null;
    }
    
    PatientInfoResponse response = new PatientInfoResponse();
    
    response.setPatientId(patient.getPatientId());
    response.setPatientCode(patient.getPatientCode());
    response.setFirstName(patient.getFirstName());
    response.setLastName(patient.getLastName());
    response.setFullName(patient.getFirstName() + " " + patient.getLastName());
    response.setEmail(patient.getEmail());
    response.setPhone(patient.getPhone());
    response.setDateOfBirth(patient.getDateOfBirth());
    response.setAddress(patient.getAddress());
    response.setGender(patient.getGender() != null ? patient.getGender().name() : null);
    response.setMedicalHistory(patient.getMedicalHistory());
    response.setAllergies(patient.getAllergies());
    response.setEmergencyContactName(patient.getEmergencyContactName());
    response.setEmergencyContactPhone(patient.getEmergencyContactPhone());
    response.setGuardianName(patient.getGuardianName());
    response.setGuardianPhone(patient.getGuardianPhone());
    response.setGuardianRelationship(patient.getGuardianRelationship());
    response.setGuardianCitizenId(patient.getGuardianCitizenId());
    response.setIsActive(patient.getIsActive());  // ✅ Line 46: Có map isActive
    response.setCreatedAt(patient.getCreatedAt());
    response.setUpdatedAt(patient.getUpdatedAt());
    
    // ❌ KHÔNG map: isBookingBlocked
    // ❌ KHÔNG map: bookingBlockReason
    // ❌ KHÔNG map: bookingBlockNotes
    // ❌ KHÔNG map: blockedBy
    // ❌ KHÔNG map: blockedAt
    // ❌ KHÔNG map: consecutiveNoShows
    
    // Map account-related fields
    if (patient.getAccount() != null) {
        response.setHasAccount(true);
        response.setAccountId(patient.getAccount().getAccountId());
        response.setAccountStatus(
            patient.getAccount().getStatus() != null 
                ? patient.getAccount().getStatus().name() 
                : null);
        response.setIsEmailVerified(patient.getAccount().getIsEmailVerified());
    } else {
        response.setHasAccount(false);
    }
    
    return response;
}
```

**Note:** Không có method `toPatientDetailResponse()` trong `PatientMapper` class. Method `mapToPatientDetailResponse()` nằm trong `PatientService` (line 602-646) và **CHỈ** được dùng cho API `/patients/me/profile` (mobile app).

#### Suggested Fix

**Step 1: Update PatientInfoResponse DTO**

**File:** `patient/dto/response/PatientInfoResponse.java`

```java
public class PatientInfoResponse {
    private String patientCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phoneNumber;
    private String email;
    private String address;
    private String profileImageUrl;
    
    // ✅ ADD: Blocking fields
    private Boolean isBookingBlocked;
    private String bookingBlockReason;  // ENUM value as String
    private String bookingBlockNotes;
    private String blockedBy;           // Employee name
    private LocalDateTime blockedAt;
    private Integer consecutiveNoShows;
}
```

**Step 2: Update PatientMapper.toPatientInfoResponse()**

**File:** `patient/mapper/PatientMapper.java` (line 21-62)

```java
public PatientInfoResponse toPatientInfoResponse(Patient patient) {
    if (patient == null) {
        return null;
    }
    
    PatientInfoResponse response = new PatientInfoResponse();
    
    // ... existing mappings (line 28-48) ...
    response.setPatientId(patient.getPatientId());
    response.setPatientCode(patient.getPatientCode());
    response.setFirstName(patient.getFirstName());
    response.setLastName(patient.getLastName());
    response.setFullName(patient.getFirstName() + " " + patient.getLastName());
    response.setEmail(patient.getEmail());
    response.setPhone(patient.getPhone());
    response.setDateOfBirth(patient.getDateOfBirth());
    response.setAddress(patient.getAddress());
    response.setGender(patient.getGender() != null ? patient.getGender().name() : null);
    response.setMedicalHistory(patient.getMedicalHistory());
    response.setAllergies(patient.getAllergies());
    response.setEmergencyContactName(patient.getEmergencyContactName());
    response.setEmergencyContactPhone(patient.getEmergencyContactPhone());
    response.setGuardianName(patient.getGuardianName());
    response.setGuardianPhone(patient.getGuardianPhone());
    response.setGuardianRelationship(patient.getGuardianRelationship());
    response.setGuardianCitizenId(patient.getGuardianCitizenId());
    response.setIsActive(patient.getIsActive());
    response.setCreatedAt(patient.getCreatedAt());
    response.setUpdatedAt(patient.getUpdatedAt());
    
    // ✅ ADD: Map blocking fields (INSERT AFTER line 48)
    response.setIsBookingBlocked(patient.getIsBookingBlocked());
    response.setBookingBlockReason(patient.getBookingBlockReason() != null 
        ? patient.getBookingBlockReason().name() 
        : null);
    response.setBookingBlockNotes(patient.getBookingBlockNotes());
    response.setBlockedBy(patient.getBlockedBy());  // Already a String in Patient entity
    response.setBlockedAt(patient.getBlockedAt());
    response.setConsecutiveNoShows(patient.getConsecutiveNoShows());
    
    // Map account-related fields (existing code - line 51-59)
    if (patient.getAccount() != null) {
        response.setHasAccount(true);
        response.setAccountId(patient.getAccount().getAccountId());
        response.setAccountStatus(
            patient.getAccount().getStatus() != null 
                ? patient.getAccount().getStatus().name() 
                : null);
        response.setIsEmailVerified(patient.getAccount().getIsEmailVerified());
    } else {
        response.setHasAccount(false);
    }
    
    return response;
}
```

**Important Notes:**
- ✅ **CHỈ CẦN** thêm fields vào DTO và mapper
- ✅ **KHÔNG CẦN** thay đổi database schema (fields đã tồn tại trong `Patient` entity)
- ✅ **KHÔNG CẦN** thay đổi Patient List API controller (chỉ cần DTO và mapper)
- ✅ Giữ nguyên tất cả logic khác

#### Impact

- **HIGH Priority:** Block status không hiển thị trong Patient List, ảnh hưởng UX nghiêm trọng
- Receptionist/Admin không thể nhận biết bệnh nhân bị chặn trong danh sách
- Phải vào detail page mới thấy được block status (không tiện lợi)
- FE đã implement UI nhưng không hoạt động vì BE không trả về data

**User Impact:**
- ❌ Không thể xem block status trong table danh sách bệnh nhân
- ❌ Checkbox "Chặn đặt lịch" không hiển thị đúng
- ❌ Badge "Tạm chặn" / "Chặn" không hiển thị
- ❌ Tooltip không hiển thị lý do chặn

**Business Impact:**
- ⚠️ Risk: Receptionist có thể vô tình tạo appointment cho bệnh nhân bị chặn vì không thấy warning trong list view
- ⚠️ Inefficiency: Phải click vào từng patient detail để check block status

#### Frontend Evidence

**Frontend đã implement đầy đủ UI:**

**File:** `src/app/admin/accounts/users/page.tsx` (line ~600-620)

```typescript
// ✅ FE đã có logic hiển thị block status
<div className="flex items-center gap-2">
  <Checkbox
    checked={patient.isBookingBlocked || false}  // ❌ Nhận được undefined từ BE
    disabled
    className={cn(
      "h-5 w-5 border-2 cursor-default",
      patient.isBookingBlocked && isTemporaryBlock(patient.bookingBlockReason)
        ? "border-orange-500 data-[state=checked]:bg-orange-500"
        : patient.isBookingBlocked
        ? "border-red-500 data-[state=checked]:bg-red-500"
        : ""
    )}
  />
  {patient.isBookingBlocked && (  // ❌ Luôn false vì BE không trả về
    <Badge variant={isTemporaryBlock(patient.bookingBlockReason) ? "warning" : "destructive"}>
      {isTemporaryBlock(patient.bookingBlockReason) ? 'Tạm chặn' : 'Chặn'}
    </Badge>
  )}
</div>
```

**Console Log Evidence:**

```javascript
// File: src/app/admin/accounts/users/page.tsx (line 130-133)
console.log('🔍 [Patient List] First patient blocking status:', {
  isBookingBlocked: patients[0]?.isBookingBlocked,
  bookingBlockReason: patients[0]?.bookingBlockReason,
  consecutiveNoShows: patients[0]?.consecutiveNoShows
});

// ❌ Output: All undefined
// 🔍 [Patient List] First patient blocking status: {
//   isBookingBlocked: undefined,
//   bookingBlockReason: undefined,
//   consecutiveNoShows: undefined
// }
```

#### Related Files

**Backend (cần sửa):**
- `patient/dto/response/PatientInfoResponse.java` - ❌ Thiếu blocking fields
- `patient/mapper/PatientMapper.java` - ❌ Method `toPatientInfoResponse()` không map blocking fields

**Backend (reference - đã đúng):**
- `patient/dto/response/PatientDetailResponse.java` - ✅ Có đầy đủ blocking fields
- `patient/entity/Patient.java` - ✅ Entity có đầy đủ blocking fields
- `patient/enums/BookingBlockReason.java` - ✅ Enum đã được định nghĩa

**Frontend (đã implement, chờ BE fix):**
- `src/app/admin/accounts/users/page.tsx` - ✅ UI đã sẵn sàng
- `src/types/patient.ts` - ✅ Type đã có blocking fields
- `src/types/patientBlockReason.ts` - ✅ Enum và utility functions đã có

**Documentation:**
- `docs/files_from_BE/BE_message.md` - Backend refactoring specification
- `docs/TESTING_BLOCK_STATUS.md` - Testing guide (FE perspective)

#### Test Cases

**Test 1: Verify PatientInfoResponse có blocking fields**

```java
@Test
public void testPatientInfoResponse_shouldIncludeBlockingFields() {
    // Given: Patient bị chặn
    Patient patient = createPatient();
    patient.setIsBookingBlocked(true);
    patient.setBookingBlockReason(BookingBlockReason.EXCESSIVE_NO_SHOWS);
    patient.setBookingBlockNotes("Bỏ hẹn 3 lần liên tiếp");
    patient.setConsecutiveNoShows(3);
    
    // When: Map to PatientInfoResponse
    PatientInfoResponse response = patientMapper.toPatientInfoResponse(patient);
    
    // Then: Response phải có blocking fields
    assertNotNull(response.getIsBookingBlocked());
    assertTrue(response.getIsBookingBlocked());
    assertEquals("EXCESSIVE_NO_SHOWS", response.getBookingBlockReason());
    assertEquals("Bỏ hẹn 3 lần liên tiếp", response.getBookingBlockNotes());
    assertEquals(3, response.getConsecutiveNoShows());
}
```

**Test 2: Verify Patient List API trả về blocking fields**

```bash
# Call Patient List API
GET /api/v1/patients?page=0&size=10

# Expected Response:
{
  "content": [
    {
      "patientCode": "BN-000004",
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "phoneNumber": "0901234567",
      "email": "nguyenvana@example.com",
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "profileImageUrl": null,
      
      // ✅ Expected: Blocking fields
      "isBookingBlocked": true,
      "bookingBlockReason": "EXCESSIVE_NO_SHOWS",
      "bookingBlockNotes": "Bỏ hẹn 3 lần liên tiếp",
      "blockedBy": "Nguyễn Thị B",
      "blockedAt": "2025-12-09T10:30:00",
      "consecutiveNoShows": 3
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

**Test 3: Frontend Display Test**

```
1. Backend fix và deploy
2. Open /admin/accounts/users page
3. Expected:
   - Checkbox "Chặn đặt lịch" hiển thị checked cho bệnh nhân bị chặn
   - Badge "Tạm chặn" (orange) hoặc "Chặn" (red) hiển thị đúng
   - Tooltip hiển thị lý do chặn khi hover
   - Console log không còn undefined
4. Verify console output:
   🔍 [Patient List] First patient blocking status: {
     isBookingBlocked: true,
     bookingBlockReason: "EXCESSIVE_NO_SHOWS",
     consecutiveNoShows: 3
   }
```

**Test 4: Performance Test**

```
1. Load patient list với 100+ bệnh nhân
2. Expected:
   - Response time không tăng đáng kể (< 10% increase)
   - Không có N+1 query issues
   - Blocking fields được load cùng query chính
```

#### Migration Notes

**Database:**
- ✅ **KHÔNG CẦN migration** - Fields đã tồn tại trong `patients` table

**Code Changes:**
- ✅ Chỉ cần update DTO và mapper
- ✅ Không ảnh hưởng existing APIs khác
- ✅ Backward compatible (fields mới có thể null)

**Deployment:**
- ✅ Safe to deploy - thêm fields mới, không break existing clients
- ✅ Frontend đã sẵn sàng handle các fields mới
- ✅ Mobile app (nếu có) sẽ ignore fields mới (backward compatible)

#### Additional Notes

**Why This Happened:**
- Backend refactor blacklist fields nhưng chỉ update `PatientDetailResponse`
- Quên update `PatientInfoResponse` cho Patient List API
- Mapper method `toPatientInfoResponse()` không được update

**Comparison:**

| Field | PatientDetailResponse | PatientInfoResponse | Status |
|-------|----------------------|---------------------|---------|
| `isBookingBlocked` | ✅ Có | ❌ Thiếu | **NEED FIX** |
| `bookingBlockReason` | ✅ Có | ❌ Thiếu | **NEED FIX** |
| `bookingBlockNotes` | ✅ Có | ❌ Thiếu | **NEED FIX** |
| `blockedBy` | ✅ Có | ❌ Thiếu | **NEED FIX** |
| `blockedAt` | ✅ Có | ❌ Thiếu | **NEED FIX** |
| `consecutiveNoShows` | ✅ Có | ❌ Thiếu | **NEED FIX** |

**Related Backend Refactor:**
- ✅ `isBlacklisted` đã được remove (deprecated)
- ✅ `isBookingBlocked` là unified flag mới
- ✅ `BookingBlockReason` enum đã được define với 5 values
- ✅ `PatientDetailResponse` đã được update đầy đủ
- ❌ `PatientInfoResponse` chưa được update (THIS ISSUE)

**See Also:**
- `docs/files_from_BE/BE_message.md` - Complete backend refactoring specification
- Issue #49 - Related to backend status updates

---

### Issue #53: Holiday Validation Missing Across All Modules - Appointments, Employee Shifts, Time-Off, OT Requests

**Status:** 🔴 **OPEN**  
**Priority:** **CRITICAL**  
**Reported Date:** 2025-12-11  
**Updated:** 2025-12-11 (Expanded scope to all date-based modules)  
**Affected APIs:** Multiple (Appointments, Employee Shifts, Registrations, Time-Off, OT, Leave Requests)  
**Type:** **SYSTEM-WIDE VALIDATION BUG** (Holiday validation missing in all modules)

#### Problem Description

**CRITICAL ISSUE:** Hiện tại Holiday system đã được implement (API, database, frontend integration) **NHƯNG KHÔNG ĐƯỢC SỬ DỤNG** trong bất kỳ module nào của hệ thống. Holiday chỉ tồn tại như một module độc lập mà không có validation nào liên kết với nó.

**Các module bị ảnh hưởng:**

1. **Appointments (API 3.1, 3.7)** ❌
   - Có thể tạo appointment vào ngày lễ
   - Có thể reschedule appointment sang ngày lễ
   
2. **Employee Shifts & Registrations** ❌
   - Part-time employees (FIXED, FLEX) có thể đăng ký ca làm việc vào ngày lễ
   - Full-time employees có thể được assign shift vào ngày lễ
   - Batch job tạo shifts có thể tạo shifts vào ngày lễ
   
3. **Time-Off Requests** ❌
   - Có thể request time-off vào ngày lễ (không cần thiết vì đã nghỉ)
   - Waste request approval workflow
   
4. **Overtime (OT) Requests** ❌
   - Có thể request OT vào ngày lễ (phòng khám đóng cửa)
   - Logic conflict: Không thể làm OT khi không có ca làm việc regular
   
5. **Leave Requests** ❌
   - Có thể request leave vào ngày lễ
   - Waste leave quota

**Expected Behavior:**
- ✅ Holiday system được integrate vào TẤT CẢ modules liên quan đến date
- ✅ Backend validate tất cả date-based operations
- ✅ Reject requests vào ngày lễ với error message rõ ràng
- ✅ UI hiển thị holidays và block selection (FE đã có cho appointments)
- ✅ Business logic consistency: "Phòng khám đóng cửa vào ngày lễ"

**Actual Behavior:**
- ✅ Holiday system exists (API, DB, FE integration) ✅
- ✅ Frontend đã block holiday selection trong appointment calendar ✅
- ❌ Backend **KHÔNG validate** holiday trong BẤT KỲ module nào ❌
- ❌ Employee shifts có thể được tạo vào ngày lễ ❌
- ❌ Time-off/OT/Leave requests có thể được tạo vào ngày lễ ❌
- ❌ Holiday system isolated, không được sử dụng ❌

#### Root Cause Analysis

**1. Frontend Implementation (CORRECT - Already blocking):**

**File:** `src/components/appointments/CreateAppointmentModal.tsx`

**Frontend Logic (Lines 309-312, 1665-1705):**
```typescript
// ✅ Hook fetches holidays
const { holidays, isHoliday, getHolidayName } = useHolidays({
  year: new Date(appointmentDate || new Date()).getFullYear(),
  enabled: open && currentStep === 2,
});

// ✅ Check if date is holiday
const isHolidayDate = isHoliday(dateStr);
const holidayName = getHolidayName(dateStr);

// ✅ Prevent selection
<button
  onClick={() => {
    if (!isPast && isCurrentMonth && !isHolidayDate) {
      setAppointmentDate(dateStr);
    }
  }}
  disabled={isPast || !isCurrentMonth || isHolidayDate}
  title={isHolidayDate ? `Ngày lễ: ${holidayName}` : undefined}
  className={isHolidayDate 
    ? 'bg-red-50 text-red-600 border border-red-300 cursor-not-allowed opacity-70'
    : '...'}
>
  {/* Holiday icon */}
  {isHolidayDate && isCurrentMonth && (
    <div className="text-[8px] mt-0.5 text-red-600">🎊</div>
  )}
</button>
```

**Frontend works correctly:**
- ✅ Holiday dates shown with red background
- ✅ Holiday dates have 🎊 icon
- ✅ Holiday dates are disabled (cannot click)
- ✅ Tooltip shows holiday name on hover

**2. Backend Implementation (MISSING - No validation):**

**File:** `files_from_BE/booking_appointment/service/AppointmentCreationService.java` (estimated)

**Current Validation (NO holiday check):**
```java
@Transactional
public Appointment createAppointment(CreateAppointmentRequest request) {
    // STEP 1: Validate basic fields
    validateBasicFields(request); // ✅ Exists
    
    // STEP 2: Validate patient exists
    Patient patient = validatePatient(request.getPatientCode()); // ✅ Exists
    
    // STEP 3: Validate employee availability
    validateEmployeeAvailability(request.getEmployeeCode(), request.getAppointmentDate()); // ✅ Exists
    
    // STEP 4: Validate services
    List<Service> services = validateServices(request.getServiceCodes()); // ✅ Exists
    
    // STEP 5: Validate room availability
    validateRoomAvailability(request.getRoomId(), request.getAppointmentDate()); // ✅ Exists
    
    // ❌ MISSING: Validate appointment date is NOT a holiday
    // validateNotHoliday(request.getAppointmentDate());
    
    // STEP 6: Create appointment
    Appointment appointment = buildAppointment(request);
    return appointmentRepository.save(appointment);
}
```

**Vấn đề:**
- Backend có các validation khác (employee availability, room availability)
- **NHƯNG không có validation cho holiday**
- API sẽ accept appointment vào ngày lễ nếu các validation khác pass

**3. Holiday Service (EXISTS - Can be used for validation):**

**File:** `files_from_BE/holiday/service/HolidayService.java` (từ BE_4)

```java
// ✅ Service đã tồn tại
public class HolidayService {
    /**
     * Check if a date is a holiday
     * GET /api/holidays/check?date=YYYY-MM-DD
     */
    public HolidayCheckResponse checkHoliday(LocalDate date) {
        // ... implementation exists
        return new HolidayCheckResponse(date, isHoliday, holidayName);
    }
}
```

**Holiday service đã có:**
- ✅ Method `checkHoliday(LocalDate date)` exists
- ✅ Returns `HolidayCheckResponse` with `isHoliday` boolean
- ✅ Can be injected into ALL services that handle dates

**4. Employee Shifts System (MISSING - No holiday validation):**

**Affected Components:**
- Employee shift creation (manual, batch job)
- Employee shift registration (part-time employees)
- Fixed shift registration (recurring shifts)
- Flex shift slot booking

**Current Behavior:**
```java
// ❌ NO holiday check in any of these:
- POST /api/v1/employee-shifts (Create shift manually)
- POST /api/v1/registrations (Register for shift - part-time)
- POST /api/v1/fixed-registrations (Register fixed recurring shifts)
- POST /api/v1/part-time-slots/register (Book flex slot)
- Batch jobs tạo shifts tự động
```

**Vấn đề:**
- Part-time employees (FIXED, FLEX) có thể đăng ký làm việc vào ngày lễ
- Full-time employees có thể được assign shift vào ngày lễ
- Batch job tạo shifts cho tháng mới có thể tạo shifts vào ngày lễ
- Không consistent với business rule "phòng khám đóng cửa vào ngày lễ"

**5. Time-Off/OT/Leave Requests (MISSING - No holiday validation):**

**Affected APIs:**
- Time-off requests: `POST /api/v1/time-off-requests`
- OT requests: `POST /api/v1/overtime-requests`
- Leave requests: `POST /api/v1/leave-requests`
- Annual leave: `POST /api/v1/annual-leave-requests`

**Current Behavior:**
```java
// ❌ NO holiday check in any request types
@Transactional
public TimeOffRequest createTimeOffRequest(CreateTimeOffRequest request) {
    // Validate employee exists ✅
    // Validate date range valid ✅
    // Validate no conflict with existing requests ✅
    
    // ❌ MISSING: Validate dates are NOT holidays
    // → Employee có thể request time-off vào ngày lễ (waste request)
}
```

**Vấn đề:**
- Employees waste requests vào ngày đã nghỉ lễ
- Approval workflow unnecessary cho ngày lễ
- OT không thể exist vào ngày lễ (logic conflict)
- Leave quota bị waste cho ngày lễ

#### Suggested Fix

**APPROACH: Create Reusable Holiday Validation Component**

**Step 1: Create Shared Holiday Validator**

**File:** `common/validation/HolidayValidator.java` (NEW)

```java
package com.dental.clinic.management.common.validation;

import com.dental.clinic.management.holiday.service.HolidayService;
import com.dental.clinic.management.holiday.dto.HolidayCheckResponse;
import com.dental.clinic.management.common.exception.BadRequestAlertException;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Reusable validator for holiday validation across all modules
 * Prevents operations on holidays (appointments, shifts, requests, etc.)
 */
@Component
public class HolidayValidator {
    
    @Autowired
    private HolidayService holidayService;
    
    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("dd/MM/yyyy");
    
    /**
     * Validate single date is NOT a holiday
     * @param date Date to validate
     * @param entityName Entity name for error message (e.g., "Appointment", "Employee Shift")
     * @throws BadRequestAlertException if date is a holiday
     */
    public void validateNotHoliday(LocalDate date, String entityName) {
        HolidayCheckResponse check = holidayService.checkHoliday(date);
        
        if (check.isHoliday()) {
            String formattedDate = date.format(DATE_FORMATTER);
            String errorMessage = String.format(
                "Không thể tạo %s vào ngày lễ: %s (%s)",
                entityName,
                check.getHolidayName(),
                formattedDate
            );
            
            throw new BadRequestAlertException(
                errorMessage,
                entityName,
                "DATE_IS_HOLIDAY"
            );
        }
    }
    
    /**
     * Validate date range does NOT contain any holidays
     * @param startDate Start date of range
     * @param endDate End date of range
     * @param entityName Entity name for error message
     * @throws BadRequestAlertException if any date in range is a holiday
     */
    public void validateRangeNotIncludeHolidays(
        LocalDate startDate, 
        LocalDate endDate, 
        String entityName) {
        
        List<HolidayCheckResponse> holidays = 
            holidayService.getHolidaysInRange(startDate, endDate);
        
        if (!holidays.isEmpty()) {
            String holidayList = holidays.stream()
                .map(h -> h.getHolidayName() + " (" + 
                    h.getDate().format(DATE_FORMATTER) + ")")
                .collect(Collectors.joining(", "));
            
            String errorMessage = String.format(
                "Không thể tạo %s trong khoảng thời gian có ngày lễ: %s",
                entityName,
                holidayList
            );
            
            throw new BadRequestAlertException(
                errorMessage,
                entityName,
                "RANGE_INCLUDES_HOLIDAYS"
            );
        }
    }
    
    /**
     * Check if date is holiday (non-throwing version)
     * @param date Date to check
     * @return true if date is a holiday
     */
    public boolean isHoliday(LocalDate date) {
        return holidayService.checkHoliday(date).isHoliday();
    }
    
    /**
     * Filter out holidays from a list of dates
     * @param dates List of dates to filter
     * @return List of dates excluding holidays
     */
    public List<LocalDate> filterOutHolidays(List<LocalDate> dates) {
        return dates.stream()
            .filter(date -> !isHoliday(date))
            .collect(Collectors.toList());
    }
}
```

**Step 2: Integrate into Appointment Service**

**File:** `booking_appointment/service/AppointmentCreationService.java`

```java
@Service
public class AppointmentCreationService {
    
    @Autowired
    private HolidayValidator holidayValidator; // ✅ Inject shared validator
    
    @Transactional
    public Appointment createAppointment(CreateAppointmentRequest request) {
        // ... existing validations ...
        
        // ✅ NEW: Validate appointment date is NOT a holiday
        holidayValidator.validateNotHoliday(request.getAppointmentDate(), "lịch hẹn");
        
        // ... rest of creation logic ...
    }
}
```

**Step 3: Integrate into Appointment Reschedule Service**

**File:** `booking_appointment/service/AppointmentRescheduleService.java`

```java
@Service
public class AppointmentRescheduleService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    @Transactional
    public RescheduleAppointmentResponse rescheduleAppointment(
        String oldAppointmentCode,
        RescheduleAppointmentRequest request) {
        
        // ... existing validations ...
        
        // ✅ NEW: Validate new appointment date is NOT a holiday
        holidayValidator.validateNotHoliday(request.getNewAppointmentDate(), "lịch hẹn");
        
        // ... rest of reschedule logic ...
    }
}
```

**Step 4: Integrate into Employee Shift Services**

**File:** `working_schedule/service/EmployeeShiftService.java`

```java
@Service
public class EmployeeShiftService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    /**
     * Create employee shift (manual)
     */
    @Transactional
    public EmployeeShift createEmployeeShift(CreateEmployeeShiftRequest request) {
        // ... existing validations ...
        
        // ✅ NEW: Validate work date is NOT a holiday
        holidayValidator.validateNotHoliday(request.getWorkDate(), "ca làm việc");
        
        // ... rest of creation logic ...
    }
    
    /**
     * Batch create shifts for month
     * Called by scheduled job
     */
    @Transactional
    public List<EmployeeShift> createShiftsForMonth(int year, int month) {
        // Generate all dates for month
        List<LocalDate> allDates = generateDatesForMonth(year, month);
        
        // ✅ NEW: Filter out holidays
        List<LocalDate> workingDates = holidayValidator.filterOutHolidays(allDates);
        
        log.info("Creating shifts for {}/{}: {} working days (excluded {} holidays)",
            month, year, workingDates.size(), allDates.size() - workingDates.size());
        
        // Create shifts only for working days
        return createShiftsForDates(workingDates);
    }
}
```

**File:** `working_schedule/service/EmployeeShiftRegistrationService.java`

```java
@Service
public class EmployeeShiftRegistrationService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    /**
     * Register for shift (part-time employees)
     */
    @Transactional
    public EmployeeShiftRegistration registerForShift(
        RegisterForShiftRequest request) {
        
        // ... existing validations ...
        
        // ✅ NEW: Validate work date is NOT a holiday
        holidayValidator.validateNotHoliday(request.getWorkDate(), "đăng ký ca làm việc");
        
        // ... rest of registration logic ...
    }
}
```

**File:** `working_schedule/service/FixedShiftRegistrationService.java`

```java
@Service
public class FixedShiftRegistrationService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    /**
     * Create fixed recurring shift registration
     */
    @Transactional
    public FixedShiftRegistration createFixedRegistration(
        CreateFixedRegistrationRequest request) {
        
        // ... existing validations ...
        
        // ✅ NEW: Validate start/end dates don't include holidays
        // Note: This is for information only, actual shift instances
        // will be filtered when generated
        List<LocalDate> registrationDates = generateDatesFromFixedRegistration(request);
        List<LocalDate> holidays = registrationDates.stream()
            .filter(holidayValidator::isHoliday)
            .collect(Collectors.toList());
        
        if (!holidays.isEmpty()) {
            log.warn("Fixed registration includes {} holidays, these dates will be skipped: {}",
                holidays.size(), holidays);
        }
        
        // ... rest of creation logic ...
    }
    
    /**
     * Generate actual shift instances from fixed registration
     */
    public List<EmployeeShift> generateShiftInstances(
        FixedShiftRegistration registration) {
        
        List<LocalDate> allDates = generateDatesFromFixedRegistration(registration);
        
        // ✅ Filter out holidays
        List<LocalDate> workingDates = holidayValidator.filterOutHolidays(allDates);
        
        return createShiftsForDates(workingDates, registration);
    }
}
```

**Step 5: Integrate into Time-Off/OT/Leave Request Services**

**File:** `requests/service/TimeOffRequestService.java`

```java
@Service
public class TimeOffRequestService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    @Transactional
    public TimeOffRequest createTimeOffRequest(CreateTimeOffRequest request) {
        // ... existing validations ...
        
        // ✅ NEW: Validate dates are NOT holidays (waste of request)
        holidayValidator.validateRangeNotIncludeHolidays(
            request.getStartDate(), 
            request.getEndDate(), 
            "nghỉ phép"
        );
        
        // ... rest of creation logic ...
    }
}
```

**File:** `requests/service/OvertimeRequestService.java`

```java
@Service
public class OvertimeRequestService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    @Transactional
    public OvertimeRequest createOvertimeRequest(CreateOvertimeRequest request) {
        // ... existing validations ...
        
        // ✅ NEW: Validate OT date is NOT a holiday
        // Logic: Cannot work OT when clinic is closed
        holidayValidator.validateNotHoliday(request.getOvertimeDate(), "làm thêm giờ");
        
        // ... rest of creation logic ...
    }
}
```

**File:** `requests/service/LeaveRequestService.java`

```java
@Service
public class LeaveRequestService {
    
    @Autowired
    private HolidayValidator holidayValidator;
    
    @Transactional
    public LeaveRequest createLeaveRequest(CreateLeaveRequest request) {
        // ... existing validations ...
        
        // ✅ NEW: Validate leave dates don't include holidays
        holidayValidator.validateRangeNotIncludeHolidays(
            request.getStartDate(), 
            request.getEndDate(), 
            "đơn nghỉ phép"
        );
        
        // ... rest of creation logic ...
    }
}
```

**Step 6: Update HolidayService to support range queries**

**File:** `holiday/service/HolidayService.java`

**Expected Error Response:**
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Không thể tạo lịch hẹn vào ngày lễ: Tết Nguyên Đán (01/01/2025)",
  "instance": "/api/v1/appointments",
  "errorKey": "APPOINTMENT_DATE_IS_HOLIDAY",
  "params": {
    "appointmentDate": "2025-01-01",
    "holidayName": "Tết Nguyên Đán"
  }
}
```

#### Impact

**Security Risk:**
- **CRITICAL Priority:** Backend không validate → có thể bypass frontend ở NHIỀU modules
- Attacker có thể dùng API trực tiếp để:
  - Tạo appointment vào ngày lễ
  - Đăng ký ca làm việc vào ngày lễ
  - Tạo OT request vào ngày lễ (logic conflict)
  - Tạo time-off/leave requests vào ngày lễ (waste quota)
- Frontend validation chỉ là UI convenience, không phải security control

**Data Integrity:**
- ❌ Appointments vào ngày lễ có thể tồn tại trong database
- ❌ Employee shifts vào ngày lễ có thể được tạo (manual, batch job, registration)
- ❌ OT requests vào ngày lễ có thể được approve (logic conflict: không có ca regular)
- ❌ Time-off/Leave requests waste quota cho ngày đã nghỉ lễ
- ❌ Fixed shift registrations tạo recurring shifts bao gồm cả ngày lễ
- ⚠️ Phòng khám đóng cửa vào ngày lễ → tất cả operations không thể hoàn thành
- ⚠️ Gây confusion cho staff và patients

**User Experience:**
- ❌ Frontend block (chỉ có appointments) nhưng backend accept tất cả → inconsistency
- ❌ Employees có thể đăng ký làm việc vào ngày lễ (không có UI blocking)
- ❌ Batch jobs tạo shifts vào ngày lễ → phải manually delete
- ❌ Time-off/OT requests vào ngày lễ → waste approval workflow
- ❌ Không có server-side protection ở bất kỳ module nào

**Business Impact:**
- ⚠️ **Appointments:** Staff phải manually cancel appointments vào ngày lễ
- ⚠️ **Employee Shifts:** HR phải manually delete shifts vào ngày lễ
- ⚠️ **OT Requests:** Managers waste time approving OT không thể thực hiện
- ⚠️ **Leave Requests:** Employees waste leave quota cho ngày đã nghỉ lễ
- ⚠️ **Payroll:** Complexity tính lương khi có shifts vào ngày lễ
- ⚠️ Patients confusion khi appointment bị cancel
- ⚠️ Waste resources (time, communication, approval workflow)

**System-Wide Issue:**
- 🔴 Holiday system exists nhưng **KHÔNG ĐƯỢC SỬ DỤNG** ở bất kỳ đâu
- 🔴 Tất cả date-based operations lack holiday validation
- 🔴 Inconsistent business logic: "Phòng khám đóng cửa vào ngày lễ" không được enforce

#### Frontend Evidence

**Frontend đã implement correctly:**

**File:** `docs/HOLIDAY_FEATURE_SUMMARY.md` (Full documentation)

**Features:**
- ✅ `useHolidays` hook fetches holidays from BE
- ✅ Calendar shows holidays with red background + 🎊 icon
- ✅ Holiday dates are disabled (cannot select)
- ✅ Tooltip shows holiday name on hover
- ✅ Legend explains holiday indicator

**But:**
- ❌ Frontend validation có thể bypass (API call trực tiếp)
- ❌ Cần backend validation để đảm bảo data integrity

#### Test Cases

**Test 1: Appointment Creation on Holiday**

```bash
POST /api/v1/appointments
{
  "appointmentDate": "2025-01-01",  # Tết Dương lịch
  "patientCode": "P-000001",
  "employeeCode": "EMP-DOC-001",
  ...
}

Expected (After Fix): 400 Bad Request
{
  "status": 400,
  "detail": "Không thể tạo lịch hẹn vào ngày lễ: Tết Dương lịch (01/01/2025)",
  "errorKey": "DATE_IS_HOLIDAY"
}

Actual (Before Fix): 201 Created ❌
```

**Test 2: Employee Shift Creation on Holiday**

```bash
POST /api/v1/employee-shifts
{
  "employeeId": 1,
  "workDate": "2025-01-01",  # Tết Dương lịch
  "workShiftId": "MORNING",
  ...
}

Expected (After Fix): 400 Bad Request
{
  "status": 400,
  "detail": "Không thể tạo ca làm việc vào ngày lễ: Tết Dương lịch (01/01/2025)",
  "errorKey": "DATE_IS_HOLIDAY"
}

Actual (Before Fix): 201 Created ❌
```

**Test 3: Employee Shift Registration on Holiday (Part-time)**

```bash
POST /api/v1/registrations
{
  "employeeId": 5,  # Part-time employee
  "workDate": "2025-01-01",
  "workShiftId": "MORNING",
  ...
}

Expected (After Fix): 400 Bad Request
Actual (Before Fix): 201 Created ❌
```

**Test 4: OT Request on Holiday**

```bash
POST /api/v1/overtime-requests
{
  "employeeId": 1,
  "overtimeDate": "2025-01-01",  # Tết Dương lịch
  "hours": 4,
  ...
}

Expected (After Fix): 400 Bad Request
{
  "status": 400,
  "detail": "Không thể tạo làm thêm giờ vào ngày lễ: Tết Dương lịch (01/01/2025)",
  "errorKey": "DATE_IS_HOLIDAY"
}

Actual (Before Fix): 201 Created ❌
```

**Test 5: Time-Off Request Including Holidays**

```bash
POST /api/v1/time-off-requests
{
  "employeeId": 1,
  "startDate": "2024-12-30",
  "endDate": "2025-01-03",  # Includes 01/01 (Tết Dương lịch)
  ...
}

Expected (After Fix): 400 Bad Request
{
  "status": 400,
  "detail": "Không thể tạo nghỉ phép trong khoảng thời gian có ngày lễ: Tết Dương lịch (01/01/2025)",
  "errorKey": "RANGE_INCLUDES_HOLIDAYS"
}

Actual (Before Fix): 201 Created ❌
```

**Test 6: Batch Job Creating Shifts for Month**

```bash
# Scheduled job runs: Create shifts for January 2025
Expected (After Fix):
- Shifts created for all non-holiday dates
- Holidays (01/01) skipped
- Log: "Creating shifts for 1/2025: 30 working days (excluded 1 holidays)"

Actual (Before Fix):
- Shifts created for ALL dates including 01/01 ❌
- Staff phải manually delete shifts vào ngày lễ ❌
```

**Test 7: Fixed Shift Registration (Recurring)**

```bash
POST /api/v1/fixed-registrations
{
  "employeeId": 5,  # Part-time
  "workShiftId": "MORNING",
  "daysOfWeek": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "startDate": "2024-12-01",
  "endDate": "2025-03-31"
}

Expected (After Fix):
- Registration created
- When generating actual shift instances:
  - Filter out holidays
  - Log warning about holidays
  - Only create shifts for non-holiday dates

Actual (Before Fix):
- Shift instances created for ALL dates including holidays ❌
```

**Test 8: Frontend Still Works (Appointments)**

```
1. Open CreateAppointmentModal
2. Try to click on holiday date (01/01/2025)
3. Expected:
   - Date is disabled (cannot click) ✅
   - Shows red background ✅
   - Shows 🎊 icon ✅
   - Tooltip shows "Ngày lễ: Tết Dương lịch" ✅
4. If user bypasses UI:
   - Backend rejects with 400 ✅ (after fix)
   - Frontend shows error toast ✅
```

**Test 9: Performance Test**

```
1. Create 100 appointments/shifts (various dates, some holidays)
2. Expected:
   - Holiday validation adds < 10ms per request
   - No N+1 query issues
   - Holiday cache works correctly (1 query per year)
   - Batch operations use filterOutHolidays (efficient)
```

**Test 10: Multiple Modules Integration**

```
1. Create appointment on 2025-01-02 ✅ (working day)
2. Try appointment on 2025-01-01 → 400 ❌ (holiday)
3. Create shift on 2025-01-02 ✅
4. Try shift on 2025-01-01 → 400 ❌
5. Create OT on 2025-01-02 ✅
6. Try OT on 2025-01-01 → 400 ❌
7. Verify all validations consistent ✅
```

#### Related Files

**Backend (cần tạo mới):**
- `common/validation/HolidayValidator.java` - ✅ **NEW** - Shared validator component

**Backend (cần sửa - Appointments):**
- `booking_appointment/service/AppointmentCreationService.java` - Inject HolidayValidator
- `booking_appointment/service/AppointmentRescheduleService.java` - Inject HolidayValidator

**Backend (cần sửa - Employee Shifts):**
- `working_schedule/service/EmployeeShiftService.java` - Add validation + filter holidays in batch
- `working_schedule/service/EmployeeShiftRegistrationService.java` - Add validation
- `working_schedule/service/FixedShiftRegistrationService.java` - Filter holidays when generating instances
- `working_schedule/service/PartTimeSlotService.java` - Add validation (if applicable)

**Backend (cần sửa - Requests):**
- `requests/service/TimeOffRequestService.java` - Validate range
- `requests/service/OvertimeRequestService.java` - Validate single date
- `requests/service/LeaveRequestService.java` - Validate range
- `requests/service/AnnualLeaveRequestService.java` - Validate range (if separate)

**Backend (cần sửa - Batch Jobs):**
- `scheduled/ShiftGenerationJob.java` - Filter holidays when generating monthly shifts
- Any other batch jobs creating date-based entities

**Backend (reference - đã có):**
- `holiday/service/HolidayService.java` - ✅ Service exists
- `holiday/controller/HolidayController.java` - ✅ API exists
- `holiday/repository/HolidayRepository.java` - ✅ Repository exists
- `holiday/domain/Holiday.java` - ✅ Entity exists

**Frontend (đã implement cho appointments):**
- `src/components/appointments/CreateAppointmentModal.tsx` - ✅ UI blocking works
- `src/hooks/useHolidays.ts` - ✅ Hook works correctly
- `src/services/holidayService.ts` - ✅ Service exists
- `src/types/holiday.ts` - ✅ Types defined
- `docs/HOLIDAY_FEATURE_SUMMARY.md` - ✅ Full documentation

**Frontend (cần implement cho các module khác):**
- Employee shift registration UI - ❌ Cần thêm holiday blocking
- OT request UI - ❌ Cần thêm holiday blocking
- Time-off request UI - ❌ Cần thêm holiday blocking
- Leave request UI - ❌ Cần thêm holiday blocking

**Documentation:**
- `docs/files_from_BE/1.BE_4_FE_INTEGRATION_GUIDE.md` - Holiday API specification
- `docs/BE_4_HOLIDAY_HIGHLIGHTING_SUMMARY.md` - Frontend implementation for appointments
- `docs/BE_4_IMPLEMENTATION_SUMMARY.md` - Overall BE_4 summary

#### Performance Considerations

**Holiday Check Overhead:**
- Holiday service should cache holidays in memory
- Check is just a Map lookup → O(1) complexity
- Minimal overhead (< 5ms per request)

**Optimization (if needed):**
```java
@Service
public class HolidayService {
    
    // ✅ Cache holidays in memory
    @Cacheable("holidays-year")
    public List<Holiday> getHolidaysForYear(int year) {
        // ... fetch from database
    }
    
    // ✅ Fast check using cached data
    public boolean isHoliday(LocalDate date) {
        int year = date.getYear();
        List<Holiday> yearHolidays = getHolidaysForYear(year);
        return yearHolidays.stream()
            .anyMatch(h -> h.getDate().equals(date));
    }
}
```

#### Additional Notes

**Why This is CRITICAL:**

1. **Security:** Frontend validation là UI convenience, không phải security control
   - Attackers có thể bypass frontend và gọi API trực tiếp
   - Tất cả date-based operations phải validate ở backend

2. **Defense in Depth:** Backend MUST validate tất cả business rules
   - Holiday validation missing ở TẤT CẢ modules
   - Tạo ra system-wide vulnerability

3. **Data Integrity:** Prevent invalid data vào database
   - Appointments, shifts, requests vào ngày lễ = invalid data
   - Ảnh hưởng đến payroll, scheduling, reporting

4. **Business Logic Consistency:** "Phòng khám đóng cửa vào ngày lễ"
   - Rule này phải enforce ở backend
   - Hiện tại: Holiday system exists nhưng KHÔNG được sử dụng

5. **Resource Waste:**
   - Staff/HR waste time deleting invalid shifts
   - Managers waste time approving invalid OT requests
   - Employees waste leave quota cho ngày đã nghỉ lễ

**Affected Modules Summary:**

| Module | APIs Affected | Current Status | Impact |
|--------|---------------|----------------|--------|
| **Appointments** | Create, Reschedule | ❌ No validation | HIGH - Can book on holidays |
| **Employee Shifts** | Create, Batch job | ❌ No validation | HIGH - Shifts on holidays |
| **Shift Registration** | Register, Fixed | ❌ No validation | HIGH - Part-time can register |
| **OT Requests** | Create | ❌ No validation | MEDIUM - Logic conflict |
| **Time-Off Requests** | Create | ❌ No validation | LOW - Waste request |
| **Leave Requests** | Create | ❌ No validation | LOW - Waste quota |

**Implementation Priority:**

1. **Phase 1 (CRITICAL):**
   - ✅ Create `HolidayValidator` component
   - ✅ Integrate into `AppointmentCreationService`
   - ✅ Integrate into `AppointmentRescheduleService`
   - ✅ Integrate into `EmployeeShiftService`

2. **Phase 2 (HIGH):**
   - ✅ Integrate into `EmployeeShiftRegistrationService`
   - ✅ Integrate into `FixedShiftRegistrationService`
   - ✅ Update batch jobs to filter holidays

3. **Phase 3 (MEDIUM):**
   - ✅ Integrate into `OvertimeRequestService`
   - ✅ Integrate into `TimeOffRequestService`
   - ✅ Integrate into `LeaveRequestService`

4. **Phase 4 (Frontend):**
   - Add holiday blocking UI to shift registration
   - Add holiday blocking UI to OT/time-off/leave requests
   - Extend `useHolidays` hook usage to other modules

**Best Practice:**

```
Layer 1: UI Validation (Frontend)
  → User convenience, immediate feedback
  → Holiday blocking in calendars/date pickers
  → Status: ✅ Implemented for appointments only

Layer 2: API Validation (Backend) ✅ MUST HAVE
  → Security, data integrity, business rules
  → Status: ❌ NOT IMPLEMENTED (THIS ISSUE)

Layer 3: Database Constraints
  → Last line of defense
  → Status: ❓ Not applicable for holiday validation
```

**Migration Notes:**

- ✅ **Safe to add:** Không break existing data
- ✅ **Backward compatible:** Only affects NEW creations
- ✅ Existing entities vào ngày lễ (nếu có) không bị ảnh hưởng
- ⚠️ **Batch jobs:** Cần update để filter holidays
- ⚠️ **Frontend:** Cần extend holiday UI to other modules

**Rollout Strategy:**

1. **Week 1:** Implement `HolidayValidator` + Appointments
2. **Week 2:** Employee Shifts + Batch jobs
3. **Week 3:** Requests (OT, Time-off, Leave)
4. **Week 4:** Frontend UI for other modules
5. **Week 5:** Testing + Documentation

**Future Enhancements:**

1. **Admin Override:**
   - Add permission `OVERRIDE_HOLIDAY_VALIDATION`
   - Allow special cases (emergency appointments, on-call shifts)
   - Log all overrides for audit

2. **Smart Suggestions:**
   - API suggests next available working day when holiday selected
   - Batch jobs log holidays skipped with counts

3. **Bulk Validation:**
   - Add endpoint `/api/holidays/validate-range`
   - Frontend can check multiple dates efficiently

4. **Security Monitoring:**
   - Log all holiday validation failures
   - Alert if too many bypass attempts (security concern)

5. **Holiday Calendar View:**
   - Admin UI to view all holidays for year
   - Show impact (how many operations would be blocked)

---
