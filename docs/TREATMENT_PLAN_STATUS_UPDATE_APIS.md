# Treatment Plan Status Update APIs Analysis

**Date:** 2025-12-09  
**Issue:** Treatment plan status không được auto-complete khi tất cả phases completed

---

## 📋 Tổng Quan

BE có logic auto-complete plan khi tất cả phases completed, nhưng logic này **CHỈ chạy khi có item status update**. Nếu plan đã có all phases completed nhưng không có action mới → status vẫn `null`.

---

## 🔍 Các API Có Thể Cập Nhật Treatment Plan Status

### ✅ API 5.6: Update Item Status (TRIGGER AUTO-COMPLETE)

**Endpoint:** `PATCH /api/v1/patient-plan-items/{itemId}/status`

**File:** `TreatmentPlanItemService.java` (line 102-225)

**Logic:**
1. Update item status
2. Auto-complete phase nếu all items done (line 217)
3. Auto-activate plan nếu first item scheduled/started (line 220)
4. **Auto-complete plan nếu all phases done (line 225)** ✅

**Method:** `checkAndCompletePlan(plan)` (line 478-529)
- Query phases trực tiếp từ DB (fix Issue #40)
- Check nếu ALL phases = COMPLETED
- Set `plan.status = COMPLETED`
- Flush và refresh để persist

**Kết luận:** ✅ API này **CÓ** trigger auto-complete plan

---

### ⚠️ Appointment Status Update (PARTIAL TRIGGER)

**Module:** `booking_appointment/service/AppointmentStatusService.java`

**Method:** `checkAndCompletePlan(Long planId)` (line 503-543)

**Logic:**
- Được gọi khi appointment status = COMPLETED
- **NHƯNG chỉ check nếu plan status = IN_PROGRESS** (line 512)
- **KHÔNG check nếu plan status = null**

**Vấn đề:**
```java
// Line 512-515
if (plan.getStatus() != TreatmentPlanStatus.IN_PROGRESS) {
    log.debug("Plan {} not in IN_PROGRESS status (current: {}), skipping completion check", 
            planId, plan.getStatus());
    return; // ❌ Skip nếu status = null
}
```

**Kết luận:** ⚠️ API này **KHÔNG** trigger auto-complete nếu plan status = null

---

### ❌ Các API KHÔNG Trigger Auto-Complete

1. **API 5.7: Add Items to Phase**
   - `POST /api/v1/patient-plan-phases/{phaseId}/items`
   - Không gọi `checkAndCompletePlan()`

2. **API 5.9: Approve Plan**
   - `PATCH /api/v1/patient-treatment-plans/{planCode}/approval`
   - Chỉ update `approvalStatus`, không check completion

3. **API 5.10: Update Plan Item**
   - `PATCH /api/v1/patient-plan-items/{itemId}`
   - Chỉ update item details (name, price), không check completion

4. **API 5.11: Delete Plan Item**
   - `DELETE /api/v1/patient-plan-items/{itemId}`
   - Không gọi `checkAndCompletePlan()`

5. **API 5.12: Submit for Review**
   - `PATCH /api/v1/patient-treatment-plans/{planCode}/submit-for-review`
   - Chỉ update `approvalStatus`, không check completion

6. **API 5.13: Update Prices**
   - `PATCH /api/v1/patient-treatment-plans/{planCode}/prices`
   - Chỉ update prices, không check completion

7. **API 5.14: Reorder Items**
   - `PATCH /api/v1/patient-plan-phases/{phaseId}/items/reorder`
   - Chỉ update sequence, không check completion

---

## 🎯 Root Cause

**Vấn đề chính:**

1. **`checkAndCompletePlan()` chỉ được gọi trong `TreatmentPlanItemService.updateItemStatus()`**
   - Chỉ chạy khi có item status update
   - Nếu plan đã có all phases completed nhưng không có action mới → không được check

2. **`AppointmentStatusService.checkAndCompletePlan()` có limitation:**
   - Chỉ check nếu plan status = IN_PROGRESS
   - Không check nếu plan status = null

3. **Không có API nào khác trigger auto-complete:**
   - Tất cả APIs khác chỉ update metadata (prices, approval, etc.)
   - Không có endpoint để manually trigger completion check

---

## 💡 Giải Pháp Đề Xuất

### Option 1: Fix AppointmentStatusService (Recommended)

**File:** `booking_appointment/service/AppointmentStatusService.java` (line 512)

**Thay đổi:**
```java
// BEFORE (line 512-515)
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
- Khi appointment completed → auto-complete plan nếu all phases done
- Hoạt động cho cả plan status = null và IN_PROGRESS

---

### Option 2: Thêm API để Manually Trigger Completion Check

**Endpoint mới:** `POST /api/v1/patient-treatment-plans/{planCode}/check-completion`

**Logic:**
- Load plan và phases từ DB
- Check nếu all phases completed
- Update plan status = COMPLETED nếu cần
- Return updated plan

**Use case:**
- Admin có thể manually trigger completion check
- Background job có thể gọi để fix existing data

---

### Option 3: Background Job (Long-term Solution)

**Tạo scheduled job:**
- Chạy định kỳ (ví dụ: mỗi giờ)
- Query plans với status = null và all phases completed
- Update status = COMPLETED

**Lợi ích:**
- Tự động fix existing data
- Không cần manual intervention

---

## 📊 So Sánh Các Giải Pháp

| Solution | Complexity | Impact | Recommended |
|----------|-----------|--------|-------------|
| Fix AppointmentStatusService | Low | High | ✅ Yes |
| Add Manual API | Medium | Medium | ⚠️ Optional |
| Background Job | High | High | ⚠️ Long-term |

---

## 🔗 Related Issues

- **Issue #40:** Phase và Plan không auto-complete do lazy loading (✅ RESOLVED)
- **Issue #47:** Existing plans với all phases completed nhưng status vẫn null (✅ RESOLVED - SQL fix)
- **Current Issue:** Plans mới hoặc sau khi fix vẫn có thể gặp vấn đề nếu không có item status update

---

## 📝 Kết Luận

**API duy nhất trigger auto-complete plan:**
- ✅ **API 5.6:** `PATCH /patient-plan-items/{itemId}/status`

**Vấn đề:**
- Nếu plan đã có all phases completed nhưng không có item status update → status vẫn null
- `AppointmentStatusService` không check completion nếu plan status = null

**Đề xuất:**
1. **Immediate:** Fix `AppointmentStatusService.checkAndCompletePlan()` để check cả null status
2. **Optional:** Thêm manual API để trigger completion check
3. **Long-term:** Background job để auto-fix existing data

---

**Note:** FE workaround đã được implement (sessionStorage) để hiển thị đúng status trong list page khi detail page tính toán được COMPLETED từ phases.


