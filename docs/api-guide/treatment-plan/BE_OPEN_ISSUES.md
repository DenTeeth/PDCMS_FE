# Backend Open Issues & FE/BE Mismatches

**Date:** 2025-11-20 (Updated: 2025-01-24)  
**Status:** 🟡 Service Management needs BE clarification  
**Scope:** Service Management, Treatment Plans, Appointments, and other modules

---

## 🔴 CRITICAL Issues

### 1. 🔴 Service Management - Duplicate APIs with Different Purposes

- **Status:** 🔴 **BE ARCHITECTURE UNCLEAR**
- **Priority:** 🔴 High
- **Action Required:** **BE Team needs to clarify which API should be used**

**Problem:**

BE has **TWO Service Management APIs** with different DTOs and capabilities:

#### API 1: V17 Service API (`/api/v1/services`)
**Controller:** `service/controller/DentalServiceController.java`  
**DTO:** `DentalServiceDTO`  
**Capabilities:**
- ✅ GET `/api/v1/services` - List with filters (categoryId, isActive, search)
- ✅ GET `/api/v1/public/services/grouped` - Public grouped by category
- ✅ GET `/api/v1/services/grouped` - Internal grouped with bundle suggestions
- ❌ **NO CREATE/UPDATE/DELETE endpoints**

**DTO Structure:**
```java
DentalServiceDTO {
  Long serviceId;
  String serviceCode;
  String serviceName;
  String description;
  BigDecimal price;
  Integer durationMinutes;  // Single duration field
  Integer displayOrder;
  Boolean isActive;
  LocalDateTime createdAt;
  LocalDateTime updatedAt;
  ServiceCategoryDTO.Brief category;  // Nested category object with categoryId
}
```

**Permissions:** `VIEW_SERVICE` only

---

#### API 2: Booking Service API (`/api/v1/booking/services`)
**Controller:** `booking_appointment/controller/ServiceController.java`  
**DTO:** `ServiceResponse`  
**Capabilities:**
- ✅ GET `/api/v1/booking/services` - List with filters (specializationId, isActive, keyword)
- ✅ GET `/api/v1/booking/services/my-specializations` - Doctor's services
- ✅ GET `/api/v1/booking/services/{serviceId}` - Get by ID
- ✅ GET `/api/v1/booking/services/code/{serviceCode}` - Get by code
- ✅ **POST `/api/v1/booking/services`** - Create service
- ✅ **PUT `/api/v1/booking/services/{serviceCode}`** - Update service
- ✅ **DELETE `/api/v1/booking/services/{serviceId}`** - Delete service
- ✅ **PATCH `/api/v1/booking/services/{serviceId}/toggle`** - Toggle status

**DTO Structure:**
```java
ServiceResponse {
  Integer serviceId;
  String serviceCode;
  String serviceName;
  String description;
  Integer defaultDurationMinutes;  // Duration with separate buffer
  Integer defaultBufferMinutes;
  BigDecimal price;
  Integer specializationId;  // Flat specializationId field
  String specializationName;
  Boolean isActive;
  LocalDateTime createdAt;
  LocalDateTime updatedAt;
}
```

**Permissions:** `VIEW_SERVICE`, `CREATE_SERVICE`, `UPDATE_SERVICE`, `DELETE_SERVICE`

---

**Impact on Frontend:**

- 🔴 FE cannot use V17 API for admin CRUD operations (no POST/PUT/DELETE)
- 🔴 Booking API lacks `categoryId` field (cannot group by service category)
- 🔴 DTOs are incompatible (`durationMinutes` vs `defaultDurationMinutes + defaultBufferMinutes`)
- 🟡 FE must choose one API and stick with it

**Current FE Implementation:**

- ✅ Using **Booking API** (`/api/v1/booking/services`) for all operations
- ✅ Reason: Only Booking API has full CRUD support
- ⚠️ Missing: Cannot filter/group by `categoryId` (V17 feature)

**Questions for BE Team:**

1. **Which API should FE use?**
   - Option A: Use Booking API (current) - needs `categoryId` added to `ServiceResponse`
   - Option B: Use V17 API - needs CREATE/UPDATE/DELETE endpoints added
   - Option C: Keep both - FE uses V17 for READ, Booking for CRUD (complex)

2. **Should Booking API be deprecated?**
   - If V17 is the new standard, should Booking API be phased out?

3. **Can Booking API DTO be updated to include `categoryId`?**
   - Add `categoryId` field to `ServiceResponse`
   - Add `categoryId` filter param to GET endpoint

**Recommended Solution (BE Team):**

**Option 1: Enhance Booking API with categoryId (Quickest)**
```java
// In ServiceResponse.java
private Long categoryId;
private String categoryCode;
private String categoryName;

// In ServiceController.java - add categoryId filter
@GetMapping
public ResponseEntity<Page<ServiceResponse>> getAllServices(
    @RequestParam(required = false) Long categoryId,  // ADD THIS
    @RequestParam(required = false) Integer specializationId,
    ...
)
```

**Option 2: Complete V17 API with CRUD (Best long-term)**
```java
// In DentalServiceController.java - add CRUD endpoints
@PostMapping("/api/v1/services")
@PreAuthorize("hasAuthority('CREATE_SERVICE')")
public ResponseEntity<DentalServiceDTO> createService(...)

@PutMapping("/api/v1/services/{serviceCode}")
@PreAuthorize("hasAuthority('UPDATE_SERVICE')")
public ResponseEntity<DentalServiceDTO> updateService(...)

@DeleteMapping("/api/v1/services/{serviceId}")
@PreAuthorize("hasAuthority('DELETE_SERVICE')")
public ResponseEntity<Void> deleteService(...)
```

Then deprecate Booking Service API.

---

### 2. 🔴 Service Category Management - Missing Admin UI

- **Status:** 🔴 **MISSING FE FEATURE**
- **Priority:** 🟡 Medium
- **Issue:** BE has Service Category CRUD APIs (V17), but FE has no admin UI to manage categories

**Backend APIs (Complete):**

✅ `GET /api/v1/service-categories` - List all categories  
✅ `GET /api/v1/service-categories/{categoryId}` - Get by ID  
✅ `POST /api/v1/service-categories` - Create category  
✅ `PATCH /api/v1/service-categories/{categoryId}` - Update category  
✅ `DELETE /api/v1/service-categories/{categoryId}` - Soft delete  
✅ `POST /api/v1/service-categories/reorder` - Reorder categories  

**Permissions:** `VIEW_SERVICE`, `CREATE_SERVICE`, `UPDATE_SERVICE`, `DELETE_SERVICE`

**Frontend Status:**

✅ `ServiceCategoryService` class implemented (`src/services/serviceCategoryService.ts`)  
✅ Types defined (`src/types/serviceCategory.ts`)  
❌ **MISSING:** Admin page `/admin/service-categories` for CRUD operations  
❌ **MISSING:** Category filter in `/admin/booking/services` page  

**Required FE Work:**

1. Create `/admin/service-categories/page.tsx`:
   - List categories table with service count
   - Create/Edit/Delete modals
   - Drag-drop reordering
   - Permissions check: `VIEW_SERVICE`, `CREATE_SERVICE`, etc.

2. Update `/admin/booking/services/page.tsx`:
   - Add category filter dropdown (if Booking API adds categoryId support)
   - Display category name in services table

**Priority:** Medium (can wait until Issue #1 is resolved)

---

### 3. 🟡 Permission Constants Naming - Missing Permissions in FE

- **Status:** ✅ **FIXED**
- **Priority:** 🟡 Medium  
- **Issue:** FE `permission.ts` thiếu nhiều permissions từ BE `AuthoritiesConstants.java`

**Missing Permissions (Now Added):**

✅ **Treatment Plan:**
- `VIEW_ALL_TREATMENT_PLANS` - Manager view all plans across patients
- `DELETE_TREATMENT_PLAN` - Soft delete
- `MANAGE_PLAN_PRICING` - V21.4: Finance/Accountant adjusts prices

✅ **Appointment:**
- `VIEW_APPOINTMENT_ALL` - View all clinic appointments
- `VIEW_APPOINTMENT_OWN` - View own appointments
- `UPDATE_APPOINTMENT_STATUS` - Change status (CHECKED_IN, COMPLETED, etc.)
- `DELAY_APPOINTMENT` - Delay within same day
- `RESCHEDULE_APPOINTMENT` - Cancel and rebook to different day
- `CANCEL_APPOINTMENT` - Cancel appointment

✅ **Specialization:**
- `VIEW_SPECIALIZATION`
- `CREATE_SPECIALIZATION`

✅ **Room:**
- `UPDATE_ROOM_SERVICES` - V16: Assign services to rooms

✅ **Time-Off (BE uses TIMEOFF, not TIME_OFF):**
- `VIEW_TIMEOFF_ALL`
- `VIEW_TIMEOFF_OWN`
- `CREATE_TIMEOFF`
- `APPROVE_TIMEOFF`
- `REJECT_TIMEOFF`
- `CANCEL_TIMEOFF_OWN`
- `CANCEL_TIMEOFF_PENDING`
- `VIEW_TIMEOFF_TYPE_ALL`

✅ **Leave Balance:**
- `VIEW_LEAVE_BALANCE_ALL`
- `ADJUST_LEAVE_BALANCE`

✅ **Employee (BE uses READ, not VIEW):**
- `READ_ALL_EMPLOYEES`
- `READ_EMPLOYEE_BY_CODE`

**Note:** FE đã có một số permissions với naming khác nhau (e.g., `VIEW_TIME_OFF_ALL` vs BE's `VIEW_TIMEOFF_ALL`). Cả 2 versions đều được giữ lại để backward compatible.

**Resolution:** ✅ All missing permissions added to `src/types/permission.ts`

---

## ✅ RESOLVED Issues

### ✅ Treatment Plan - Primary Doctor Access (RESOLVED)

- **Status:** ✅ **RESOLVED**
- **Issue:** Bác sĩ phụ trách appointment không thể xem treatment plan linked

**Solution Applied (BE):**

✅ Added `linkedTreatmentPlanCode` field to `AppointmentDetailDTO`  
✅ Updated RBAC logic in `TreatmentPlanDetailService` to allow primary doctor access  
✅ Added `isPrimaryDoctorOfLinkedAppointment()` method  
✅ Permission: Primary doctor with `VIEW_TREATMENT_PLAN_OWN` can view linked plans  

**Verified in BE code:**
- `AppointmentDetailDTO.java` line 138
- `TreatmentPlanDetailService.java` lines 280-329
- `AppointmentRepository.java` lines 466-477

---

## Summary Table

| # | Issue | Status | Action Owner | Priority |
|---|-------|--------|--------------|----------|
| 1 | **Service Management - Duplicate APIs** | 🔴 **BLOCKING** | **BE Team** | 🔴 Critical |
| 2 | **Service Category Admin UI - Missing** | 🔴 **TODO** | **FE Team** | 🟡 Medium |
| 3 | **Permission Constants - Missing in FE** | ✅ **FIXED** | - | ✅ Done |
| 4 | **Treatment Plan Primary Doctor Access** | ✅ **RESOLVED** | - | ✅ Done |

---

**Last Updated:** 2025-01-24  
**Next Steps:** 
- 🔴 **BE Team:** Clarify Service API architecture (Issue #1)
- 🟡 **FE Team:** Create Service Category admin UI after Issue #1 is resolved (Issue #2)
