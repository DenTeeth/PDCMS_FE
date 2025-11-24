# Treatment Plan & Appointment Integration - Test Checklist

**Date:** 2025-01-XX  
**Status:** ✅ Ready for Testing  
**Scope:** Appointment Detail Pages - Treatment Plan Tab Integration

---

## 🎯 Test Scenarios

### 1. Admin Role - Appointment Detail → Treatment Plan Tab

#### Test Case 1.1: Appointment with Linked Treatment Plan
- **Setup:**
  - Login as Admin (has `VIEW_TREATMENT_PLAN_ALL`)
  - Navigate to appointment detail page
  - Appointment has `linkedTreatmentPlanCode` in response
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify loading spinner appears
  3. Verify treatment plan loads successfully
  4. Verify plan header shows plan name, code, and progress
  5. Verify "Xem chi tiết" button appears
  6. Click "Xem chi tiết" button
  7. Verify navigation to `/admin/treatment-plans/{planCode}`
- **Expected:**
  - ✅ Treatment plan loads in < 2 seconds (optimized path: 1 API call)
  - ✅ Plan timeline displays correctly
  - ✅ Navigation works correctly

#### Test Case 1.2: Appointment without Linked Treatment Plan
- **Setup:**
  - Login as Admin
  - Navigate to appointment detail page
  - Appointment does NOT have `linkedTreatmentPlanCode` (null)
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify loading spinner appears
  3. Verify fallback logic executes (loops through plans)
  4. Verify error message if no plan found: "Không tìm thấy lộ trình điều trị liên quan đến lịch hẹn này."
- **Expected:**
  - ✅ Fallback logic works correctly
  - ✅ Error message is user-friendly

---

### 2. Employee Role (Doctor) - Appointment Detail → Treatment Plan Tab

#### Test Case 2.1: Doctor is Primary Doctor of Linked Appointment (Not Creator)
- **Setup:**
  - Login as Doctor (has `VIEW_TREATMENT_PLAN_OWN`, NOT `VIEW_TREATMENT_PLAN_ALL`)
  - Navigate to appointment detail page
  - Doctor is primary doctor of appointment
  - Appointment has `linkedTreatmentPlanCode`
  - Treatment plan was created by another doctor
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify loading spinner appears
  3. Verify treatment plan loads successfully (BE RBAC allows this)
  4. Verify plan header shows plan name, code, and progress
  5. Verify "Xem chi tiết" button appears
  6. Click "Xem chi tiết" button
  7. Verify navigation to `/employee/treatment-plans/{planCode}`
- **Expected:**
  - ✅ Treatment plan loads successfully (BE fixed RBAC)
  - ✅ No 403 error
  - ✅ Navigation works correctly

#### Test Case 2.2: Doctor is Creator of Linked Treatment Plan
- **Setup:**
  - Login as Doctor (has `VIEW_TREATMENT_PLAN_OWN`)
  - Navigate to appointment detail page
  - Doctor created the treatment plan
  - Appointment has `linkedTreatmentPlanCode`
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify treatment plan loads successfully
- **Expected:**
  - ✅ Treatment plan loads successfully
  - ✅ No errors

#### Test Case 2.3: Doctor without Permission
- **Setup:**
  - Login as Doctor (NO `VIEW_TREATMENT_PLAN_OWN`, NO `VIEW_TREATMENT_PLAN_ALL`)
  - Navigate to appointment detail page
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify error message: "Bạn không có quyền xem lộ trình điều trị. Vui lòng liên hệ quản trị viên."
- **Expected:**
  - ✅ Error message is clear and helpful

---

### 3. Patient Role - Appointment Detail → Treatment Plan Tab

#### Test Case 3.1: Patient Views Own Appointment with Linked Plan
- **Setup:**
  - Login as Patient (has `VIEW_TREATMENT_PLAN_OWN`)
  - Navigate to own appointment detail page
  - Appointment has `linkedTreatmentPlanCode`
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify loading spinner appears
  3. Verify treatment plan loads successfully
  4. Verify plan header shows plan name, code, and progress
  5. Verify "Xem chi tiết" button appears
  6. Click "Xem chi tiết" button
  7. Verify navigation to `/patient/treatment-plans/{planCode}`
- **Expected:**
  - ✅ Treatment plan loads successfully
  - ✅ Navigation works correctly

#### Test Case 3.2: Patient Views Appointment without Linked Plan
- **Setup:**
  - Login as Patient
  - Navigate to own appointment detail page
  - Appointment does NOT have `linkedTreatmentPlanCode`
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify error message: "Không tìm thấy lộ trình điều trị liên quan đến lịch hẹn này."
- **Expected:**
  - ✅ Error message is clear

---

## 🔍 Performance Tests

### Test Case P1: Optimized Path (linkedTreatmentPlanCode available)
- **Setup:**
  - Appointment has `linkedTreatmentPlanCode` in response
- **Measure:**
  - Number of API calls: Should be **1 API call** (API 5.2)
  - Load time: Should be < 2 seconds
- **Expected:**
  - ✅ Only 1 API call to `getTreatmentPlanDetail`
  - ✅ Fast load time

### Test Case P2: Fallback Path (linkedTreatmentPlanCode not available)
- **Setup:**
  - Appointment does NOT have `linkedTreatmentPlanCode`
- **Measure:**
  - Number of API calls: Should be **N+1 API calls** (1 to get all plans + N to check each plan)
  - Load time: May be slower (depends on number of plans)
- **Expected:**
  - ✅ Fallback logic works correctly
  - ✅ Still functional, though slower

---

## 🐛 Error Handling Tests

### Test Case E1: API 403 Error
- **Setup:**
  - User doesn't have permission to view treatment plan
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify error message appears
- **Expected:**
  - ✅ Error message is clear: "Bạn không có quyền xem lộ trình điều trị này."
  - ✅ "Thử lại" button appears (if applicable)

### Test Case E2: API 404 Error
- **Setup:**
  - `linkedTreatmentPlanCode` points to non-existent plan
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify fallback logic executes
- **Expected:**
  - ✅ Falls back to loop method
  - ✅ No crash

### Test Case E3: Network Error
- **Setup:**
  - Simulate network failure
- **Steps:**
  1. Click on "Treatment Plan" tab
  2. Verify error handling
- **Expected:**
  - ✅ Error message: "Không thể tải lộ trình điều trị. Vui lòng thử lại sau."
  - ✅ No crash

---

## ✅ Completion Checklist

### Code Implementation
- [x] Type definition updated (`AppointmentDetailDTO` has `linkedTreatmentPlanCode`)
- [x] Admin page: Optimized loadTreatmentPlan logic
- [x] Employee page: Optimized loadTreatmentPlan logic with RBAC
- [x] Patient page: Optimized loadTreatmentPlan logic
- [x] All pages: Fallback logic for backward compatibility
- [x] All pages: Error handling
- [x] All pages: Loading states
- [x] All pages: Navigation to treatment plan detail page

### BE Integration
- [x] BE provides `linkedTreatmentPlanCode` in `AppointmentDetailDTO`
- [x] BE RBAC allows primary doctor to view linked plan (even if not creator)
- [x] BE API 5.2 respects RBAC correctly

### Documentation
- [x] `BE_OPEN_ISSUES.md` updated (Issue #1 marked as RESOLVED)
- [x] Test checklist created

---

## 🚀 Next Steps

1. **Manual Testing:**
   - Test all scenarios above with real data
   - Verify performance improvements
   - Check error handling

2. **User Acceptance Testing:**
   - Have admin test admin flow
   - Have doctor test employee flow
   - Have patient test patient flow

3. **Performance Monitoring:**
   - Monitor API call counts in production
   - Track load times
   - Verify optimization is working

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for Testing

