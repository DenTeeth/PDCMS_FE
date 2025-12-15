# BE-FE API GAP ANALYSIS
## Booking Appointment & Treatment Plans Modules

**Date:** 2025-12-15  
**Status:** 🔄 In Progress

---

## 📋 EXECUTIVE SUMMARY

This document compares Backend API implementations with Frontend service integrations for two critical modules:
1. **Booking Appointment** (`booking_appointment`)
2. **Treatment Plans** (`treatment_plans`)

---

## 🎯 BOOKING APPOINTMENT MODULE

### ✅ **IMPLEMENTED APIs** (BE → FE Mapped)

| API | Backend Endpoint | FE Service Method | Status |
|-----|------------------|-------------------|--------|
| **P3.1** | `GET /appointments/available-times` | `findAvailableTimes()` | ✅ Implemented |
| **P3.2** | `POST /appointments` | `createAppointment()` | ✅ Implemented |
| **P3.3** | `GET /appointments` | `getAppointmentsPage()` | ✅ Implemented |
| **P3.4** | `GET /appointments/{code}` | `getAppointmentDetail()` | ✅ Implemented |
| **P3.5** | `PATCH /appointments/{code}/status` | `updateAppointmentStatus()` | ✅ Implemented |
| **P3.6** | `PATCH /appointments/{code}/delay` | `delayAppointment()` | ✅ Implemented |
| **P3.7** | `POST /appointments/{code}/reschedule` | `rescheduleAppointment()` | ✅ Implemented |

### ❌ **MISSING APIs** (BE Has, FE Doesn't)

**None identified** - All BE appointment APIs are implemented in FE.

### ⚠️ **NEW BE_4 APIs** (Holiday Validation - Already Integrated)

| API | Backend Endpoint | FE Service Method | Status |
|-----|------------------|-------------------|--------|
| **BE_4.1** | `GET /holidays/check` | `holidayService.checkHoliday()` | ✅ Implemented |
| **BE_4.2** | `GET /holidays/range` | `holidayService.getHolidaysInRange()` | ✅ Implemented |
| **BE_4.3** | `GET /holidays/next-working-day` | `holidayService.getNextWorkingDay()` | ✅ Implemented |
| **BE_4.4** | `GET /holidays/year/{year}` | `holidayService.getHolidaysForYear()` | ✅ Implemented |
| **BE_4.5** | `POST /appointments/validate-constraints` | `validateConstraints()` | ✅ Implemented |

---

## 🎯 TREATMENT PLANS MODULE

### ✅ **IMPLEMENTED APIs** (BE → FE Mapped)

| API | Backend Endpoint | FE Service Method | Status |
|-----|------------------|-------------------|--------|
| **5.1** | `GET /patients/{code}/treatment-plans` | `getTreatmentPlans()` | ✅ Implemented |
| **5.2** | `GET /patients/{code}/treatment-plans/{planCode}` | `getTreatmentPlanDetail()` | ✅ Implemented |
| **5.3** | `POST /patients/{code}/treatment-plans` | `createTreatmentPlan()` | ✅ Implemented |
| **5.4** | `POST /patients/{code}/treatment-plans/custom` | `createCustomTreatmentPlan()` | ✅ Implemented |
| **5.5** | `GET /patient-treatment-plans` | `getAllTreatmentPlansWithRBAC()` | ✅ Implemented |
| **5.6** | `PATCH /patient-plan-items/{id}/status` | `updateItemStatus()` | ✅ Implemented |
| **5.7** | `POST /patient-plan-phases/{id}/items` | `addItemsToPhase()` | ✅ Implemented |
| **5.8** | `GET /treatment-plan-templates/{code}` | `getTemplateDetail()` | ✅ Implemented |
| **5.9** | `PATCH /patient-treatment-plans/{code}/approval` | `approveTreatmentPlan()` | ✅ Implemented |
| **5.10** | `PATCH /patient-plan-items/{id}` | `updatePlanItem()` | ✅ Implemented |
| **5.11** | `DELETE /patient-plan-items/{id}` | `deletePlanItem()` | ✅ Implemented |
| **5.12** | `PATCH /patient-treatment-plans/{code}/submit-for-review` | `submitForReview()` | ✅ Implemented |
| **5.13** | `PATCH /patient-treatment-plans/{code}/prices` | `updatePlanPrices()` | ✅ Implemented |
| **5.14** | `PATCH /patient-plan-phases/{id}/items/reorder` | `reorderItems()` | ✅ Implemented |
| **6.6** | `GET /treatment-plan-templates` | `listTemplates()` | ✅ Implemented |

### ❌ **MISSING APIs** (BE Has, FE Doesn't)

| API | Backend Endpoint | Description | Impact | Priority |
|-----|------------------|-------------|--------|----------|
| **5.0** | `GET /treatment-plans` | List all plans (Manager view) | Manager can't see all plans across patients | 🔴 HIGH |
| **5.X** | `PUT /patient-plan-items/{id}/assign-doctor` | Assign doctor to plan item | Can't pre-assign doctors to items | 🟡 MEDIUM |
| **9.9-FE** | `POST /treatment-plans/{code}/approve` | FE compatibility alias | Duplicate endpoint | 🟢 LOW |

### ⚠️ **BE_4 APIs** (Treatment Plan Auto-Scheduling)

| API | Backend Endpoint | FE Service Method | Status |
|-----|------------------|-------------------|--------|
| **BE_4.6** | `POST /treatment-plans/calculate-schedule` | `calculateSchedule()` | ⚠️ Implemented but **HIDDEN** (BE returns 500) |

---

## 🔍 DETAILED GAP ANALYSIS

### 🚨 **CRITICAL ISSUE #1: Manager Treatment Plans View**

**BE API:** `GET /api/v1/treatment-plans`  
**Status:** ❌ **NOT IMPLEMENTED IN FE**

**Description:**  
Backend provides an endpoint for managers to list ALL treatment plans across ALL patients with filters:
- `approvalStatus`: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
- `status`: PENDING, ACTIVE, COMPLETED, CANCELLED
- `doctorEmployeeCode`: Filter by doctor
- `templateId`: Filter by template
- `specializationId`: Filter by specialization

**Current FE Workaround:**  
FE uses `GET /patient-treatment-plans` (API 5.5) which has RBAC auto-filtering:
- Managers see all plans (OK)
- But lacks `templateId` and `specializationId` filters

**Impact:**  
- 🔴 Managers cannot filter by template or specialization
- 🔴 Missing advanced reporting capabilities

**Recommendation:**  
```typescript
// Add to treatmentPlanService.ts
static async listAllTreatmentPlansManager(
  filters: {
    approvalStatus?: ApprovalStatus;
    status?: TreatmentPlanStatus;
    doctorEmployeeCode?: string;
    templateId?: number;
    specializationId?: number;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<TreatmentPlanSummaryDTO>> {
  const axios = apiClient.getAxiosInstance();
  const params = new URLSearchParams();
  // ... build params
  const response = await axios.get('/treatment-plans', { params });
  return response.data;
}
```

---

### 🟡 **MEDIUM ISSUE #2: Assign Doctor to Plan Item**

**BE API:** `PUT /api/v1/patient-plan-items/{itemId}/assign-doctor`  
**Status:** 🟡 **API IMPLEMENTED, UI PENDING**

**Description:**  
Backend API (V32) allows assigning/reassigning a doctor to a specific treatment item:
- Doctor must have required specialization
- Validates doctor exists and is active
- Useful for organizing phases before appointment scheduling

**Current FE Status:**  
- ✅ API method implemented in `treatmentPlanService.ts` (lines 701-715)
- ✅ Participant doctors filtered by specialization in `BookAppointmentFromPlanModal`
- ❌ UI not yet available to pre-assign doctors to items
- ❌ `assignedDoctor` field not displayed in plan item cards

**Implementation:**  
```typescript
// src/services/treatmentPlanService.ts (ALREADY IMPLEMENTED)
static async assignDoctorToItem(
  itemId: number,
  doctorCode: string,
  notes?: string
): Promise<any> {
  const axios = apiClient.getAxiosInstance();
  const response = await axios.put(
    `/patient-plan-items/${itemId}/assign-doctor`,
    { doctorCode, notes }
  );
  return response.data;
}
```

**Specialization Filtering:**
```typescript
// src/components/treatment-plans/BookAppointmentFromPlanModal.tsx (IMPLEMENTED)
// Participant doctors are filtered by:
// 1. Role (ASSISTANT, NURSE, DOCTOR, DENTIST)
// 2. Has shift on selected date
// 3. For DOCTOR/DENTIST: Must have required specialization
const requiredSpecializationIds = new Set<number>();
serviceCodes.forEach((code) => {
  const service = servicesMap.get(code);
  if (service?.specializationId) {
    requiredSpecializationIds.add(service.specializationId);
  }
});
```

**Impact:**  
- 🟡 Cannot pre-plan which doctor will handle which items via UI
- 🟡 Less flexible treatment planning workflow
- ✅ Correct validation already in place for participants

**UI Changes Still Needed:**
- Add "Phân công bác sĩ" button to treatment plan item cards
- Display `assignedDoctor` field in item details
- Add assign doctor modal with specialization-filtered dropdown

---

### ⚠️ **BE_4 ISSUE: Calculate Schedule API**

**BE API:** `POST /api/v1/treatment-plans/calculate-schedule`  
**Status:** ⚠️ **IMPLEMENTED BUT HIDDEN** (BE returns 500 error)

**Current FE Status:**  
- Service method `calculateSchedule()` exists
- UI component `TreatmentPlanScheduleTimeline` exists
- Feature is hidden due to BE API not working

**Backend Expected Behavior:**  
```json
{
  "startDate": "2025-01-15",
  "estimatedDurationDays": 730,
  "services": [
    {
      "serviceCode": "ORTHO_CONSULT",
      "minimumPreparationDays": 0,
      "recoveryDays": 0,
      "spacingDays": 0,
      "maxAppointmentsPerDay": 1
    }
  ]
}
```

**Current Issue:**  
- BE returns 500 error (implementation not complete)
- FE has disabled the feature UI

**Recommendation:**  
- 🔴 **BACKEND FIX REQUIRED** - See `docs/BE_OPEN_ISSUES.md` Issue #53
- Once BE is fixed, enable FE feature by updating:
  - `src/components/treatment-plans/CreateCustomPlanModal.tsx` (remove hide logic)
  - `src/components/treatment-plans/TreatmentPlanScheduleTimeline.tsx` (show component)

---

## 📊 STATISTICS

### Booking Appointment Module
- **Total BE APIs:** 7
- **Implemented in FE:** 7 (100%)
- **Missing in FE:** 0
- **BE_4 New APIs:** 5 (All implemented)

### Treatment Plans Module
- **Total BE APIs:** 18 (including V32)
- **Implemented in FE:** 15 (83%)
- **Missing in FE:** 3
  - Manager List All Plans (API 5.0)
  - Assign Doctor to Item (API 5.X)
  - FE Compatibility Alias (API 9.9-FE) - Not needed
- **BE_4 APIs:** 1 (Hidden due to BE error)

---

## 🎯 RECOMMENDATIONS

### **IMMEDIATE ACTIONS (This Sprint)**

1. ✅ **Keep Current Status** - No breaking gaps found
   - All critical workflows are functional
   - Missing APIs are "nice-to-have" features

### **NEXT SPRINT**

2. 🔴 **HIGH PRIORITY - Implement Manager View**
   - Add `listAllTreatmentPlansManager()` service method
   - Create manager dashboard page
   - Enable template/specialization filters

3. 🟡 **MEDIUM PRIORITY - Assign Doctor to Item**
   - Implement `assignDoctorToItem()` service method
   - Add UI in treatment plan detail page
   - Update item cards to show assigned doctor

### **FUTURE / BLOCKED**

4. ⚠️ **BLOCKED - BE_4 Calculate Schedule**
   - Wait for Backend fix (Issue #53)
   - Test with correct BE implementation
   - Enable UI once BE is ready

---

## 🔄 SYNC STATUS

| Module | BE Version | FE Version | Sync Status |
|--------|-----------|------------|-------------|
| **Booking Appointment** | P3.1-P3.7 | Latest | ✅ **100% Synced** |
| **Treatment Plans** | API 5.1-5.14, 6.6, V32 | Latest | ⚠️ **83% Synced** (2 features missing) |
| **BE_4 Features** | Holiday + Scheduling | Holiday Only | ⚠️ **50% Synced** (Scheduling blocked by BE) |

---

## 📝 NOTES

1. **FE has more features than documented BE APIs:**
   - `calculateSchedule()` - BE_4 feature (not in treatment_plans controller)
   - Holiday integration - BE_4 feature (separate module)

2. **Deprecated/Legacy Methods:**
   - `getAppointmentByCode()` - Use `getAppointmentDetail()` instead (P3.4)
   - `getAllTreatmentPlansForPatient()` - Use `getTreatmentPlans()` with pagination

3. **RBAC Differences:**
   - BE auto-filters based on JWT token (VIEW_ALL vs VIEW_OWN)
   - FE must not send admin-only filters for patients/doctors

---

**Last Updated:** 2025-12-15  
**Next Review:** After BE_4 fixes are deployed

