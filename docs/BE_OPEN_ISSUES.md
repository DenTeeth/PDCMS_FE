# Backend Open Issues

**Last Updated:** 2025-12-03  
**Total Open Issues:** 7  
**High Priority Issues:** 1 (Issue #34)  
**Medium Priority Issues:** 6 (Issue #28, #29, #30, #35, #36, #37)  
**Resolved Issues:** 4 (Issue #27, #31, #32, #33) - Removed from this document

---

## Summary Table

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

### Issue #34: API 5.5 - searchTerm parameter gây lỗi 500 Internal Server Error

**Status:** 🔴 **OPEN**  
**Priority:** **HIGH**  
**Reported Date:** 2025-12-02  
**Endpoint:** `GET /api/v1/patient-treatment-plans?searchTerm=...`

#### Problem Description

Khi gọi API 5.5 với parameter `searchTerm`, BE trả về lỗi **500 Internal Server Error** thay vì thực hiện search.

**Expected Behavior:**
- API 5.5 với `searchTerm` parameter nên search trong `planName` và `patient.fullName` (case-insensitive LIKE)
- Trả về danh sách plans matching search term

**Actual Behavior:**
- API trả về `500 Internal Server Error` với message: `"error": "error.internal"`
- Response body: `{"statusCode": 500, "error": "error.internal", "message": "Internal server error", "data": null}`

#### Test Results

**Test Script:** `scripts/test-treatment-plan-search.ts`

**Failed Tests:**
1. Search by Plan Name: `?searchTerm=Bọc răng` → **500 Error**
2. Search by Patient Name: `?searchTerm=Phong` → **500 Error**
3. Combined filters: `?searchTerm=Bọc&status=IN_PROGRESS` → **500 Error**

**Working Tests:**
- ✅ `patientCode` filter: `?patientCode=BN-1005` → **200 OK**
- ✅ Empty `searchTerm`: `?searchTerm=` → **200 OK** (returns all)
- ✅ No `searchTerm`: `?page=0&size=20` → **200 OK**

#### Root Cause Analysis

**File:** `files_from_BE/treatment_plans/specification/TreatmentPlanSpecification.java`

**Method:** `buildFromRequest()` (line 129-144)

**Code:**
```java
// Filter: searchTerm (P1 Enhancement)
// Search in: plan_name, patient full_name
if (request.getSearchTerm() != null && !request.getSearchTerm().isBlank()) {
    String searchPattern = "%" + request.getSearchTerm().toLowerCase() + "%";

    Join<Object, Object> patientJoin = root.join("patient", JoinType.INNER);

    Predicate planNameMatch = criteriaBuilder.like(
            criteriaBuilder.lower(root.get("planName")),
            searchPattern);
    Predicate patientNameMatch = criteriaBuilder.like(
            criteriaBuilder.lower(patientJoin.get("fullName")),
            searchPattern);

    predicates.add(criteriaBuilder.or(planNameMatch, patientNameMatch));
}
```

**Possible Issues:**
1. **Null pointer exception:** `root.get("planName")` hoặc `patientJoin.get("fullName")` có thể null
2. **Join issue:** `root.join("patient", JoinType.INNER)` có thể fail nếu patient relationship không tồn tại
3. **Case sensitivity:** `toLowerCase()` có thể gây issue với database collation
4. **Encoding issue:** Search term có thể chứa special characters (Vietnamese) gây SQL injection hoặc encoding error

#### Suggested Fix

1. **Add null checks:**
```java
if (request.getSearchTerm() != null && !request.getSearchTerm().isBlank()) {
    String searchTerm = request.getSearchTerm().trim();
    if (searchTerm.isEmpty()) {
        return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    }
    
    String searchPattern = "%" + searchTerm.toLowerCase() + "%";
    
    try {
        Join<Object, Object> patientJoin = root.join("patient", JoinType.LEFT);
        
        Predicate planNameMatch = criteriaBuilder.like(
                criteriaBuilder.lower(root.get("planName")),
                searchPattern);
        
        // Check if patient join is valid and fullName exists
        Predicate patientNameMatch = null;
        if (patientJoin != null) {
            try {
                patientNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(patientJoin.get("fullName")),
                        searchPattern);
            } catch (Exception e) {
                log.warn("Failed to create patient name match predicate: {}", e.getMessage());
            }
        }
        
        if (patientNameMatch != null) {
            predicates.add(criteriaBuilder.or(planNameMatch, patientNameMatch));
        } else {
            predicates.add(planNameMatch);
        }
    } catch (Exception e) {
        log.error("Error building searchTerm predicate: {}", e.getMessage(), e);
        // Fallback: only search in planName
        predicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("planName")),
                searchPattern));
    }
}
```

2. **Check database schema:** Verify `patient_treatment_plans.patient_id` foreign key relationship exists

3. **Check logs:** Review BE server logs for detailed stack trace when searchTerm is used

#### Impact

- **High Priority:** Search functionality không hoạt động, ảnh hưởng đến UX
- Users không thể tìm kiếm plans theo tên plan hoặc tên bệnh nhân
- Workaround: Users phải dùng `patientCode` filter (exact match only)

#### Related Files

- `files_from_BE/treatment_plans/specification/TreatmentPlanSpecification.java` (line 129-144)
- `files_from_BE/treatment_plans/service/TreatmentPlanService.java` (line 297-446)
- `files_from_BE/treatment_plans/controller/TreatmentPlanController.java` (line 404-460)

#### Test Cases

**Test 1: Search by plan name**
```
GET /api/v1/patient-treatment-plans?searchTerm=Bọc%20răng
Expected: 200 OK with plans matching "Bọc răng" in planName
Actual: 500 Internal Server Error
```

**Test 2: Search by patient name**
```
GET /api/v1/patient-treatment-plans?searchTerm=Phong
Expected: 200 OK with plans where patient.fullName contains "Phong"
Actual: 500 Internal Server Error
```

**Test 3: Combined filters**
```
GET /api/v1/patient-treatment-plans?searchTerm=Bọc&status=IN_PROGRESS
Expected: 200 OK with filtered results
Actual: 500 Internal Server Error
```

---

### Issue #35: API 5.6 - Plan status không tự động cập nhật thành COMPLETED khi tất cả phases hoàn thành (nếu plan chưa được activate)

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-02  
**Endpoint:** `PATCH /api/v1/patient-plan-items/{itemId}/status`

#### Problem Description

Khi tất cả phases trong treatment plan đã hoàn thành (COMPLETED), nhưng plan status vẫn là `null` hoặc `PENDING` (chưa được activate), BE không tự động cập nhật status thành `COMPLETED`.

**Current Behavior:**
- Detail page: FE có thể tính toán và hiển thị "Hoàn thành" dựa trên phases data (tất cả phases COMPLETED)
- List page: FE chỉ hiển thị status từ BE → hiển thị "Chưa hoàn thành" (vì status = null/PENDING)
- **Vấn đề:** UX inconsistency - Detail nói "Hoàn thành" nhưng List nói "Chưa hoàn thành"

**Expected Behavior:**
- Khi tất cả phases đã COMPLETED → Plan status tự động cập nhật thành `COMPLETED`
- Không phụ thuộc vào việc plan đã được activate hay chưa
- List và Detail view đều hiển thị status đúng

#### Root Cause

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java`

**Method:** `checkAndCompletePlan()` (line 461-494)

**Current Logic:**
```java
private void checkAndCompletePlan(PatientTreatmentPlan plan) {
    // Only check if plan is currently IN_PROGRESS
    if (plan.getStatus() != TreatmentPlanStatus.IN_PROGRESS) {
        log.debug("Plan {} not IN_PROGRESS (current: {}), skipping completion check",
                plan.getPlanCode(), plan.getStatus());
        return;  // ❌ Returns early if status is null or PENDING
    }
    
    // ... check if all phases completed
    if (allPhasesCompleted) {
        plan.setStatus(TreatmentPlanStatus.COMPLETED);
        planRepository.save(plan);
    }
}
```

**Vấn đề:**
- Method chỉ check completion nếu `plan.status == IN_PROGRESS`
- Nếu plan chưa được activate (status = null hoặc PENDING), method return sớm → không auto-complete
- Logic này hợp lý về mặt business (plan chỉ "in progress" khi đã bắt đầu điều trị), nhưng gây UX inconsistency

#### Suggested Implementation

**Option 1: Auto-complete regardless of current status (Recommended)**

Modify `checkAndCompletePlan()` to check completion for all plans, not just IN_PROGRESS:

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java`

```java
private void checkAndCompletePlan(PatientTreatmentPlan plan) {
    // Remove restriction: Check completion for all plans
    // If plan is already COMPLETED or CANCELLED, skip
    if (plan.getStatus() == TreatmentPlanStatus.COMPLETED || 
        plan.getStatus() == TreatmentPlanStatus.CANCELLED) {
        return;
    }
    
    List<PatientPlanPhase> phases = plan.getPhases();
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
        // AUTO-COMPLETE: Any status → COMPLETED (if all phases done)
        TreatmentPlanStatus oldStatus = plan.getStatus();
        plan.setStatus(TreatmentPlanStatus.COMPLETED);
        planRepository.save(plan);
        
        log.info("Treatment plan {} (code: {}) auto-completed: {} → COMPLETED - All {} phases done",
                plan.getPlanId(), plan.getPlanCode(), 
                oldStatus == null ? "null" : oldStatus, 
                phases.size());
    } else {
        log.debug("Plan {} not completed yet: {}/{} phases done",
                plan.getPlanCode(), completedPhases, phases.size());
    }
}
```

**Benefits:**
- Plan status phản ánh đúng completion state
- Consistent UX giữa list và detail view
- Không cần thay đổi FE logic

**Option 2: Keep current logic but add progressSummary to SummaryDTO (Alternative)**

Nếu muốn giữ business logic hiện tại (chỉ auto-complete khi IN_PROGRESS), có thể thêm `progressSummary` vào `TreatmentPlanSummaryDTO` để FE tính toán:

```java
public class TreatmentPlanSummaryDTO {
    // ... existing fields
    private ProgressSummaryDTO progressSummary;  // Add this
}
```

**Recommendation:** Option 1 (auto-complete regardless of status) vì:
- Đơn giản hơn, không cần thay đổi DTO structure
- Status phản ánh đúng completion state
- Consistent với user expectation: "Tất cả phases hoàn thành = Plan hoàn thành"

#### Impact

- **Medium Priority:** UX inconsistency giữa list và detail view
- Users thấy status khác nhau ở list vs detail
- Confusion: "Tại sao detail nói hoàn thành nhưng list nói chưa hoàn thành?"
- Ảnh hưởng đến reporting/statistics (số lượng plans completed không chính xác)

#### Related Files

- `files_from_BE/treatment_plans/service/TreatmentPlanItemService.java` (line 461-494)
- `files_from_BE/treatment_plans/domain/PatientTreatmentPlan.java`

#### Test Cases

**Test 1: Auto-complete plan with null status**
```
Given: Plan with status = null, all phases COMPLETED
When: Last item is marked COMPLETED
Expected: Plan status → COMPLETED
Actual: Plan status remains null
```

**Test 2: Auto-complete plan with PENDING status**
```
Given: Plan with status = PENDING, all phases COMPLETED
When: Last item is marked COMPLETED
Expected: Plan status → COMPLETED
Actual: Plan status remains PENDING
```

**Test 3: Verify list and detail consistency**
```
Given: Plan with all phases COMPLETED but status = null
Expected: 
  - List view: Shows "Hoàn thành"
  - Detail view: Shows "Hoàn thành"
Actual:
  - List view: Shows "Chưa hoàn thành" (status = null)
  - Detail view: Shows "Hoàn thành" (calculated from phases)
```

---

### Issue #36: API 8.1 - ClinicalRecordResponse thiếu field followUpDate

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-12-03  
**Endpoint:** `GET /api/v1/appointments/{appointmentId}/clinical-record`

#### Problem Description

API 8.1 trả về `ClinicalRecordResponse` nhưng thiếu field `followUpDate`, mặc dù:
- `CreateClinicalRecordRequest` có field `followUpDate` (optional)
- `UpdateClinicalRecordRequest` có field `followUpDate` (optional)
- FE có thể tạo/cập nhật `followUpDate` nhưng không thể xem lại giá trị đã lưu

**Expected Behavior:**
- `ClinicalRecordResponse` nên bao gồm field `followUpDate` (type: `String`, format: `yyyy-MM-dd`)
- Field này có thể là `null` nếu chưa được set
- Field này nên được trả về trong response của API 8.1

**Actual Behavior:**
- `ClinicalRecordResponse` không có field `followUpDate`
- Console log cho thấy: `hasFollowUpDate: false, followUpDate: undefined`
- FE không thể hiển thị ngày tái khám đã lưu

#### Test Results

**Test Scenario:**
1. Tạo clinical record với `followUpDate: "2025-12-15"`
2. Gọi API 8.1 để lấy clinical record
3. Kiểm tra response có chứa `followUpDate` không

**Console Log:**
```
📋 [CLINICAL RECORD] Get by appointment ID: {
  appointmentId: 107,
  clinicalRecordId: 5,
  hasFollowUpDate: false,  // ❌ Expected: true
  followUpDate: undefined   // ❌ Expected: "2025-12-15"
}
```

**Result:**
- ❌ `followUpDate` không có trong response
- ❌ FE không thể hiển thị ngày tái khám

#### Root Cause

**File:** `files_from_BE/clinical_records/dto/ClinicalRecordResponse.java` (hoặc tương đương)

**Possible Issues:**
1. DTO class thiếu field `followUpDate`
2. Entity mapping không map field `followUpDate` từ database
3. Database column `follow_up_date` không được select trong query

#### Suggested Fix

**1. Add field to DTO:**

```java
public class ClinicalRecordResponse {
    // ... existing fields
    private String followUpDate; // yyyy-MM-dd format, nullable
    
    // Getter and setter
    public String getFollowUpDate() {
        return followUpDate;
    }
    
    public void setFollowUpDate(String followUpDate) {
        this.followUpDate = followUpDate;
    }
}
```

**2. Verify Entity mapping:**

```java
@Entity
@Table(name = "clinical_records")
public class ClinicalRecord {
    // ... existing fields
    
    @Column(name = "follow_up_date")
    private LocalDate followUpDate;
    
    // Getter and setter
}
```

**3. Verify Service mapping:**

```java
public ClinicalRecordResponse mapToResponse(ClinicalRecord record) {
    ClinicalRecordResponse response = new ClinicalRecordResponse();
    // ... map other fields
    
    // Map followUpDate
    if (record.getFollowUpDate() != null) {
        response.setFollowUpDate(record.getFollowUpDate().format(DateTimeFormatter.ISO_LOCAL_DATE));
    }
    
    return response;
}
```

#### Impact

- **Medium Priority:** Feature không hoàn chỉnh
- Users không thể xem lại ngày tái khám đã đặt
- UX: Users phải nhớ hoặc ghi chú ngày tái khám ở nơi khác
- Data loss risk: Nếu user đặt ngày tái khám nhưng không thấy lại, có thể nghĩ là chưa lưu

#### Related Files

- `files_from_BE/clinical_records/dto/ClinicalRecordResponse.java`
- `files_from_BE/clinical_records/domain/ClinicalRecord.java`
- `files_from_BE/clinical_records/service/ClinicalRecordService.java`
- `files_from_BE/clinical_records/mapper/ClinicalRecordMapper.java` (nếu có)

#### Test Cases

**Test 1: Create record with followUpDate**
```
POST /api/v1/clinical-records
{
  "appointmentId": 107,
  "chiefComplaint": "Đau răng",
  "examinationFindings": "Phát hiện đau răng",
  "diagnosis": "Sâu răng",
  "followUpDate": "2025-12-15"
}

Expected: 201 CREATED
Actual: ✅ 201 CREATED (followUpDate được lưu)
```

**Test 2: Get record and verify followUpDate**
```
GET /api/v1/appointments/107/clinical-record

Expected Response:
{
  "clinicalRecordId": 5,
  "followUpDate": "2025-12-15",  // ✅ Should be present
  ...
}

Actual Response:
{
  "clinicalRecordId": 5,
  // ❌ followUpDate missing
  ...
}
```

**Test 3: Update followUpDate**
```
PUT /api/v1/clinical-records/5
{
  "followUpDate": "2025-12-20"
}

Expected: 200 OK, followUpDate updated
Then GET /api/v1/appointments/107/clinical-record
Expected: followUpDate = "2025-12-20"
Actual: ❌ followUpDate still missing in response
```

#### Workaround (Frontend)

FE đã handle gracefully:
- Code chỉ hiển thị "Ngày Tái Khám" khi `record.followUpDate` có giá trị
- Nếu không có, section này sẽ không hiển thị (không gây lỗi)
- Users vẫn có thể tạo/cập nhật `followUpDate` qua form, nhưng không thể xem lại

**Note:** Workaround này acceptable tạm thời, nhưng cần BE fix để feature hoàn chỉnh.

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
