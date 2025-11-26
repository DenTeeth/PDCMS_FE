# Backend Open Issues

**Last Updated:** 2025-01-25 (Verified with BE files)  
**Active Issues:** 🔴 1 Critical + 🟡 4 High/Medium = **5 Issues** (3 Fixed/Partial)  
**FE Workarounds:** 1 (Issue #3 - Treatment Plan Duration)

> **📌 Note:** File này ghi nhận TẤT CẢ các issues cần BE fix. Từ bây giờ, mọi vấn đề phát sinh liên quan đến BE sẽ được thêm vào đây.

---

## 🔍 Verification Results (2025-01-25)

**BE Files Verified:** ✅ Complete verification against latest BE code

**Summary:**
- ✅ **2 Issues FIXED** (25%)
  - Issue #2: Patient Creation 500 Error → Fixed with try-catch
  - Issue #5: Item Category Missing → API endpoints added
- 🟡 **1 Issue PARTIAL** (12.5%)
  - Issue #1: Service Category API added, but V17 Service API still missing CRUD
- 🔴 **5 Issues NOT FIXED** (62.5%)
  - Issues #3, #4, #6, #7, #8 remain

**Top Priority for BE:**
1. 🔴 Add CRUD endpoints to V17 Service API (2-3h)
2. 🟡 Fix Treatment Plan Duration mapping (30min - FE workaround active)
3. 🟡 Add Warehouse CRUD permissions (2-3h)

---

## 📊 Quick Summary

| # | Issue | Status | Priority | Owner | Est. Effort |
|---|-------|--------|----------|-------|-------------|
| 1 | Service API Duplication | 🟡 PARTIAL | ~~Critical~~ → High | BE | 2-3h |
| 2 | ~~Patient Creation 500 Error~~ | ✅ **FIXED** | ~~Critical~~ | BE | ~~Done~~ |
| 3 | Treatment Plan Duration NULL | 🟡 WORKAROUND | High | BE | 30min |
| 4 | Warehouse Permissions Missing | 🔴 INCOMPLETE | High | BE | 2-3h |
| 5 | ~~Item Category Missing~~ | ✅ **FIXED** | ~~High~~ | BE | ~~Done~~ |
| 6 | Service Category UI | 🟡 TODO | Medium | FE | 4-6h |
| 7 | Warehouse V3 API 500 | 🟡 NOT VERIFIED | Medium | BE | 2-4h |
| 8 | Warehouse Controllers Refactor | 🟡 NOT VERIFIED | Medium | BE | 2-3h |

**Total Remaining BE Effort:** 7-13 hours (1-2 days)  
**Progress:** ✅ 2 Fixed | 🟡 1 Partial | 🔴 5 Remaining  
**Note:** Issue #3 có FE workaround - không còn blocking nhưng nên fix cho data integrity

---

## 🔴 CRITICAL Issues (Must Fix Before Deployment)

### #1 - Service Management - Duplicate APIs

**Priority:** 🟡 High (was 🔴 Critical)  
**Status:** 🟡 **PARTIALLY FIXED** - Service Category OK, Service API chưa CRUD  
**Owner:** BE Team  
**Verified:** 2025-01-25

**✅ PROGRESS UPDATE (2025-01-25):**

**FIXED:**
- ✅ Service Category API đã có Full CRUD + reorder
  - File: `service/controller/ServiceCategoryController.java`
  - Endpoints: GET, POST, PATCH, DELETE, POST /reorder
  - FE có thể manage categories hoàn toàn

**STILL MISSING:**
- ❌ V17 Service API vẫn chỉ có GET endpoints
  - File: `service/controller/DentalServiceController.java`  
  - Missing: POST, PUT, DELETE methods
  - Current: Chỉ có 3 GET endpoints (public grouped, internal grouped, admin list)

**Problem:** BE has TWO Service APIs with different capabilities:
- **V17 API** (`/api/v1/services`): ✅ Has `categoryId` ❌ No CRUD
- **Booking API** (`/api/v1/booking/services`): ✅ Full CRUD ❌ No `categoryId`

**Impact:** FE vẫn phải dùng Booking API cho service CRUD

**Files:**
- `service/controller/DentalServiceController.java` - **NEEDS CRUD methods**
- `service/controller/ServiceCategoryController.java` - ✅ **DONE**
- `booking_appointment/controller/ServiceController.java` - Fallback

**Recommended Solutions:**

**Option A: Add categoryId to Booking API (Quickest - 2h)**
```java
// In ServiceResponse.java
private Long categoryId;
private String categoryCode;
private String categoryName;

// In ServiceController.java
@GetMapping
public ResponseEntity<Page<ServiceResponse>> getAllServices(
    @RequestParam(required = false) Long categoryId,  // ADD THIS
    @RequestParam(required = false) Integer specializationId,
    ...
)
```

**Option B: Add CRUD to V17 API (Best long-term - 4h)**
```java
// In DentalServiceController.java
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

**Question for BE:** Which option should we go with?

---

### #3 - 🔥 Treatment Plan - Duration Always NULL (Column Mapping Error)

**Priority:** 🟡 **HIGH** (was 🔴 CRITICAL - FE đã workaround)  
**Status:** 🟡 **RECOMMENDED FIX** - FE hoạt động tốt nhưng BE nên fix cho đúng  
**Owner:** BE Team  
**Estimated Fix Time:** 30 minutes

> **📢 UPDATE (2025-01-25):** FE đã implement **workaround hoàn chỉnh** - System hoạt động bình thường.  
> BE **nên fix** để data consistency và tránh overhead ở FE.

---

#### 📍 Problem

**User Report:**
- User báo: "Thời gian dự kiến: phút" (hiển thị blank, không có số)
- Screenshot: Modal đặt lịch từ treatment plan thiếu duration

**Technical Issue:**
- Plan items không có `estimatedTimeMinutes` trong DB (always NULL)
- Appointments tạo từ treatment plans không có duration data
- Calendar không thể tính slot time chính xác

**Root Cause:** **BE Entity Mapping SAI COLUMN NAME**

---

#### 🔍 Root Cause Analysis

BE có **2 modules quản lý Service**, dùng **2 entities khác nhau**:

**1️⃣ Module `booking_appointment` - ✅ Mapping ĐÚNG:**
```java
// booking_appointment/domain/DentalService.java (line 47-48)
@Column(name = "default_duration_minutes", nullable = false)
private Integer defaultDurationMinutes; // ✅ ĐÚNG
```

**2️⃣ Module `service` - ❌ Mapping SAI (VERIFIED 2025-01-25 - NOT FIXED):**
```java
// service/domain/DentalService.java (line 41-42)
@Column(name = "duration_minutes") // ❌ STILL WRONG in latest BE code
private Integer durationMinutes; // ❌ Column không tồn tại!
```

**DB Schema:**
```sql
-- schema.sql line 179
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    default_duration_minutes INTEGER NOT NULL, -- ✅ Column thực tế
    -- ... other columns
);
```

**❌ Column `duration_minutes` KHÔNG TỒN TẠI trong DB!**

---

#### 💥 Impact Analysis

**Treatment Plan Service sử dụng module `service` (mapping sai):**

```java
// TreatmentPlanCreationService.java (line 246)
estimatedTimeMinutes(templateService.getEstimatedTimeMinutes()) // ❌ NULL

// TreatmentPlanItemAdditionService.java (line 165)
estimatedTimeMinutes(service.getDefaultDurationMinutes()) // ❌ NULL

// CustomTreatmentPlanService.java (line 170)
estimatedTimeMinutes(service.getDurationMinutes()) // ❌ NULL
```

**Result:**
- ❌ All plan items have `estimated_time_minutes = NULL` in DB
- ❌ FE shows "Thời gian dự kiến: phút" (blank)
- ❌ Appointment booking từ plan không biết duration → lịch bị overlap
- ❌ Calendar hiển thị appointment chiếm ~15 phút (default fallback)

---

#### 🛠️ Recommended Fix (30 minutes)

**Fix Column Mapping in `service/domain/DentalService.java`:**

**BEFORE (SAI):**
```java
@Column(name = "duration_minutes") // ❌ Column không tồn tại
private Integer durationMinutes;
```

**AFTER (ĐÚNG):**
```java
@Column(name = "default_duration_minutes", nullable = false) // ✅ Match DB schema
private Integer defaultDurationMinutes; // ✅ Match booking_appointment module
```

**⚠️ Also update getter/setter:**
```java
public Integer getDefaultDurationMinutes() {
    return defaultDurationMinutes;
}

public void setDefaultDurationMinutes(Integer defaultDurationMinutes) {
    this.defaultDurationMinutes = defaultDurationMinutes;
}
```

**⚠️ Update all Treatment Plan services:**
```java
// CustomTreatmentPlanService.java line 170
estimatedTimeMinutes(service.getDefaultDurationMinutes()) // ✅ Fixed

// TreatmentPlanItemAdditionService.java line 165  
estimatedTimeMinutes(service.getDefaultDurationMinutes()) // ✅ Fixed
```

---

#### ✅ Verification Steps (After BE Fix)

**Step 1: Update Entity Mapping**
```java
// service/domain/DentalService.java
@Column(name = "default_duration_minutes", nullable = false)
private Integer defaultDurationMinutes;
```

**Step 2: Update Service Method Calls**
```java
// CustomTreatmentPlanService.java (line 170)
estimatedTimeMinutes(service.getDefaultDurationMinutes())

// TreatmentPlanItemAdditionService.java (line 165)
estimatedTimeMinutes(service.getDefaultDurationMinutes())
```

**Step 3: Restart BE Application**
```bash
# JPA will now use correct column mapping
./gradlew bootRun
# hoặc
mvn spring-boot:run
```

**Step 4: Test Create Treatment Plan**
```bash
# Test with template
POST /api/v1/treatment-plans/from-template
{
  "patientCode": "PAT-001",
  "doctorEmployeeCode": "EMP-001",
  "templateId": 1
}

# Verify response: items[].estimatedTimeMinutes should have values
# Example: estimatedTimeMinutes: 45 (not null)
```

**Step 5: Verify DB**
```sql
-- Check existing plans (should start having duration for NEW plans)
SELECT 
    item_id, 
    item_name, 
    service_id,
    estimated_time_minutes,
    created_at
FROM patient_plan_items 
ORDER BY created_at DESC 
LIMIT 10;

-- Count NULL vs non-NULL durations
SELECT 
    COUNT(*) FILTER (WHERE estimated_time_minutes IS NOT NULL) as with_duration,
    COUNT(*) FILTER (WHERE estimated_time_minutes IS NULL) as without_duration
FROM patient_plan_items;
```

**Step 6: Test FE (Optional - should already work)**
```bash
# FE workaround sẽ vẫn hoạt động
# Nhưng giờ không cần enrich từ service API nữa
# Check console logs: Should see "Use existing duration" instead of "Enriched from service"
```

---

#### 🎯 Expected Outcome

**After BE Fix:**
✅ **NEW plans** sẽ có `patient_plan_items.estimated_time_minutes` với giá trị đúng (e.g., 30, 45, 60)  
✅ FE không cần enrich nữa - duration có sẵn trong response  
✅ Appointment booking từ plan tính đúng duration  
✅ Calendar không bị overlap slots  
✅ Data integrity: DB có complete data, không phụ thuộc FE  

**Note về Existing Data:**
⚠️ **OLD plans** (đã tạo trước khi fix) vẫn có `estimated_time_minutes = NULL`  
✅ FE workaround vẫn handle được old plans (enrich từ service API)  
💡 Nếu muốn backfill old data, có thể chạy migration script (optional):

```sql
-- Migration script để backfill existing NULL durations (OPTIONAL)
UPDATE patient_plan_items ppi
SET estimated_time_minutes = s.default_duration_minutes
FROM services s
WHERE ppi.service_id = s.service_id
  AND ppi.estimated_time_minutes IS NULL
  AND s.default_duration_minutes IS NOT NULL;

-- Verify backfill
SELECT 
    COUNT(*) as backfilled_count
FROM patient_plan_items 
WHERE estimated_time_minutes IS NOT NULL;
```  

---

#### 🛡️ FE Workaround (IMPLEMENTED - 2025-01-25)

**FE đã implement giải pháp hoàn chỉnh để system hoạt động bình thường:**

**Strategy: Service Data Enrichment**
```typescript
// 1. Fetch services từ Booking API (có defaultDurationMinutes ĐÚNG)
const services = await ServiceService.getAllServices();

// 2. Build Map<serviceCode, Service> để lookup nhanh
const servicesMap = new Map<string, Service>();

// 3. Enrich plan items:
const enrichedItems = planItems.map(item => {
  if (item.estimatedTimeMinutes > 0) {
    return item; // ✅ Use existing
  }
  
  // ✅ Fallback to service master data
  const service = servicesMap.get(item.serviceCode);
  return {
    ...item,
    estimatedTimeMinutes: service?.defaultDurationMinutes || 0
  };
});
```

**Implementation Details:**
- ✅ Auto-fetch services khi modal mở
- ✅ Cache services trong component lifetime
- ✅ useMemo optimization cho enrichment logic
- ✅ Loading state: "Đang tính..." với spinner
- ✅ Smart display: "45 phút" hoặc "0 phút (chưa có dữ liệu)"
- ✅ Console logs để debug enrichment process

**Performance:**
- 1 API call extra khi mở booking modal (acceptable)
- ~50ms overhead cho enrichment logic
- User experience: Seamless, không nhận biết có issue

**Result:**
- 🟢 **User thấy duration đầy đủ** cho từng item + tổng thời gian
- 🟢 **Appointments có đúng duration** cho calendar scheduling
- 🟢 **System hoạt động HOÀN TOÀN BÌNH THƯỜNG**

---

#### ⚠️ Why BE Should Still Fix This

Mặc dù FE đã workaround, BE **nên fix** vì:

1. **Data Integrity:** DB nên có complete data, không phụ thuộc FE enrichment
2. **API Consistency:** Other clients (mobile app, reports) cũng cần duration data
3. **Performance:** Tránh overhead ở FE (extra API call + enrichment logic)
4. **Future Plans:** Có thể có feature khác cần query `estimated_time_minutes` từ DB
5. **Code Maintainability:** Workaround tăng complexity, khó maintain

**Recommendation:** 🟡 **Fix khi có thời gian** (không còn blocking vì FE đã workaround)

---

#### 📝 Related Files

**BE (CẦN FIX):**
- `service/domain/DentalService.java` (line 41-42) - **FIX HERE** ⚠️
- `treatment_plans/service/CustomTreatmentPlanService.java` (line 170) - Update getter call
- `treatment_plans/service/TreatmentPlanItemAdditionService.java` (line 165) - Update getter call
- `db/schema.sql` (line 179) - Reference để verify column name

**FE (ĐÃ WORKAROUND - 2025-01-25):**
- `src/components/treatment-plans/BookAppointmentFromPlanModal.tsx` - Service enrichment logic ✅
- `src/components/treatment-plans/TreatmentPlanTimeline.tsx` - Duration display with Clock icon ✅

---

### #2 - ⚠️ Patient Account Creation - 500 Error (FIXED IN CODE, NOT DEPLOYED)

**Priority:** 🔴 **CRITICAL**  
**Status:** ⚠️ **CODE FIXED BUT STILL FAILING IN PRODUCTION**  
**Owner:** BE Team  
**Verified:** 2025-01-25 (code review) | **FAILED:** 2025-01-25 (live testing)  
**Fixed In:** `patient/service/PatientService.java` (lines 227-244) - **NOT DEPLOYED YET**

> **🚨 URGENT UPDATE (2025-01-25):** FE testing shows **500 error still occurring**!  
> BE fix exists in code but **NOT deployed to server**.  
> **Action Required:** Deploy latest BE code to server ASAP.

**✅ FIX VERIFIED (2025-01-25):**

BE đã wrap email service trong try-catch block:

```java
// patient/service/PatientService.java (lines 227-244)
try {
    AccountVerificationToken verificationToken = new AccountVerificationToken(account);
    verificationTokenRepository.save(verificationToken);

    // Send verification email asynchronously
    emailService.sendVerificationEmail(account.getEmail(), account.getUsername(),
            verificationToken.getToken());
    log.info("✅ Verification email sent successfully to: {}", account.getEmail());

} catch (Exception e) {
    // ✅ Log error but don't fail the entire patient creation
    log.error("⚠️ Failed to send verification email to {}: {}", account.getEmail(), e.getMessage(), e);
    log.warn("⚠️ Patient account created successfully, but email not sent. Manual verification may be required.");
    log.warn("⚠️ Possible causes: SMTP server not configured, network error, invalid email address");
    // ✅ Don't throw exception - allow patient creation to succeed
}
```

**Result:**
- ✅ Patient creation KHÔNG BỊ BLOCK khi email service fail
- ✅ System ghi log lỗi nhưng vẫn tiếp tục
- ✅ Manual verification có thể được trigger sau

---

**Previous Problem:** `POST /api/v1/patients` returns 500 Internal Server Error

**Previous Root Cause:**
```java
// Line 232 in PatientService.createPatient()
emailService.sendVerificationEmail(
  account.getEmail(), 
  account.getUsername(), 
  verificationToken.getToken()
); // 🔴 Throws exception → transaction rollback
```

**Suspected Issues:**
1. Email service not configured (SMTP settings missing)
2. `AccountVerificationToken` table doesn't exist
3. Email sending fails → entire transaction rolls back

**Impact:**
- 🔴 Cannot register new patients
- 🔴 System unusable for new users
- 🔴 Blocks all patient workflows (appointments, treatment plans)

**Quick Fix (1-2h):**

**Option 1: Make Email Non-Blocking**
```java
try {
    emailService.sendVerificationEmail(...);
    log.info("✅ Verification email sent");
} catch (Exception e) {
    log.warn("⚠️ Email failed, but patient created", e);
    // Don't fail entire operation
}
```

**Option 2: Disable Email Verification Temporarily**
```java
account.setStatus(AccountStatus.ACTIVE); // Instead of PENDING_VERIFICATION
// emailService.sendVerificationEmail(...); // Comment out
```

**Option 3: Fix Email Configuration**
```properties
# application.properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Test Script:** `npm run test:patient-creation`

**Files:**
- `files_from_BE/patient/service/PatientService.java` (line 232)
- `files_from_BE/patient/controller/PatientController.java`

---

## 🟡 HIGH PRIORITY Issues

### #3 - Warehouse Permissions Missing in Seed Data

**Priority:** 🟡 High  
**Status:** 🟡 INCOMPLETE - RBAC not working properly  
**Owner:** BE Team

**Problem:** Seed data has NO Warehouse permissions

**Current State:**
- ❌ Seed data: 0 Warehouse permissions
- ❌ `AuthoritiesConstants.java`: Only 1/11 constants defined
- ⚠️ Controllers: Using hardcoded roles instead of permissions

**Impact:**
- RBAC incomplete for Warehouse module
- Cannot customize permissions per role
- Hard to maintain and scale

**Required Actions (2-3h):**

**1. Add 11 Permissions to Seed Data:**
```sql
-- Add to dental-clinic-seed-data.sql
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, is_active, created_at)
VALUES
('VIEW_WAREHOUSE', 'VIEW_WAREHOUSE', 'WAREHOUSE_MANAGEMENT', 'Xem danh sách vật tư kho', 300, TRUE, NOW()),
('CREATE_WAREHOUSE', 'CREATE_WAREHOUSE', 'WAREHOUSE_MANAGEMENT', 'Tạo vật tư và nhập kho', 301, TRUE, NOW()),
('UPDATE_WAREHOUSE', 'UPDATE_WAREHOUSE', 'WAREHOUSE_MANAGEMENT', 'Cập nhật vật tư và xuất kho', 302, TRUE, NOW()),
('DELETE_WAREHOUSE', 'DELETE_WAREHOUSE', 'WAREHOUSE_MANAGEMENT', 'Xóa vật tư', 303, TRUE, NOW()),
('VIEW_SUPPLIER', 'VIEW_SUPPLIER', 'WAREHOUSE_MANAGEMENT', 'Xem nhà cung cấp', 310, TRUE, NOW()),
('CREATE_SUPPLIER', 'CREATE_SUPPLIER', 'WAREHOUSE_MANAGEMENT', 'Tạo nhà cung cấp', 311, TRUE, NOW()),
('UPDATE_SUPPLIER', 'UPDATE_SUPPLIER', 'WAREHOUSE_MANAGEMENT', 'Cập nhật nhà cung cấp', 312, TRUE, NOW()),
('DELETE_SUPPLIER', 'DELETE_SUPPLIER', 'WAREHOUSE_MANAGEMENT', 'Xóa nhà cung cấp', 313, TRUE, NOW()),
('IMPORT_ITEMS', 'IMPORT_ITEMS', 'WAREHOUSE_MANAGEMENT', 'Nhập vật tư vào kho', 320, TRUE, NOW()),
('EXPORT_ITEMS', 'EXPORT_ITEMS', 'WAREHOUSE_MANAGEMENT', 'Xuất vật tư từ kho', 321, TRUE, NOW()),
('VIEW_STORAGE_STATS', 'VIEW_STORAGE_STATS', 'WAREHOUSE_MANAGEMENT', 'Xem thống kê xuất nhập kho', 330, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;
```

**2. Assign to Roles:**
```sql
-- ROLE_INVENTORY_MANAGER: Full access
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ROLE_INVENTORY_MANAGER', 'VIEW_WAREHOUSE'),
('ROLE_INVENTORY_MANAGER', 'CREATE_WAREHOUSE'),
-- ... (all 11 permissions)

-- ROLE_MANAGER: View + Stats
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ROLE_MANAGER', 'VIEW_WAREHOUSE'),
('ROLE_MANAGER', 'VIEW_SUPPLIER'),
('ROLE_MANAGER', 'VIEW_STORAGE_STATS');

-- ROLE_RECEPTIONIST: View only
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ROLE_RECEPTIONIST', 'VIEW_WAREHOUSE'),
('ROLE_RECEPTIONIST', 'VIEW_SUPPLIER');

-- ROLE_DENTIST, ROLE_NURSE: Export items
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ROLE_DENTIST', 'VIEW_WAREHOUSE'),
('ROLE_DENTIST', 'EXPORT_ITEMS'),
('ROLE_NURSE', 'VIEW_WAREHOUSE'),
('ROLE_NURSE', 'EXPORT_ITEMS');
```

**3. Update AuthoritiesConstants.java:**
```java
// Warehouse Module Permissions
public static final String VIEW_WAREHOUSE = "VIEW_WAREHOUSE";
public static final String CREATE_WAREHOUSE = "CREATE_WAREHOUSE";
public static final String UPDATE_WAREHOUSE = "UPDATE_WAREHOUSE";
public static final String DELETE_WAREHOUSE = "DELETE_WAREHOUSE";
public static final String VIEW_SUPPLIER = "VIEW_SUPPLIER";
public static final String CREATE_SUPPLIER = "CREATE_SUPPLIER";
public static final String UPDATE_SUPPLIER = "UPDATE_SUPPLIER";
public static final String DELETE_SUPPLIER = "DELETE_SUPPLIER";
public static final String IMPORT_ITEMS = "IMPORT_ITEMS";
public static final String EXPORT_ITEMS = "EXPORT_ITEMS";
public static final String VIEW_STORAGE_STATS = "VIEW_STORAGE_STATS";
```

**Files:**
- `files_from_BE/db/db/dental-clinic-seed-data.sql`
- `files_from_BE/utils/security/AuthoritiesConstants.java`

**Detailed Guide:** `docs/WAREHOUSE_PERMISSIONS_SEED_DATA_REQUIRED.md`

---

### #5 - ✅ Warehouse Item Category Missing (FIXED)

**Priority:** ~~🟡 High~~ → ✅ **RESOLVED**  
**Status:** ✅ **FIXED** - API endpoints added, entity & repository complete  
**Owner:** BE Team  
**Verified:** 2025-01-25  
**Fixed In:** `warehouse/controller/InventoryController.java` (lines 180-221)

**✅ FIX VERIFIED (2025-01-25):**

BE đã implement đầy đủ **CRUD endpoints cho Item Category**:

**API Endpoints (warehouse/controller/InventoryController.java):**
```java
// ✅ GET All Categories (line 163-179)
@GetMapping("/inventory/categories")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
public ResponseEntity<List<ItemCategoryResponse>> getAllCategories(
    @RequestParam(required = false) WarehouseType warehouseType
)

// ✅ POST Create Category (line 183-193)
@PostMapping("/inventory/categories")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
public ResponseEntity<ItemCategoryResponse> createCategory(
    @Valid @RequestBody CreateCategoryRequest request
)

// ✅ PUT Update Category (line 199-208)
@PutMapping("/inventory/categories/{id}")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
public ResponseEntity<ItemCategoryResponse> updateCategory(
    @PathVariable Long id,
    @Valid @RequestBody UpdateCategoryRequest request
)

// ✅ DELETE Category (line 213-221)
@DeleteMapping("/inventory/categories/{id}")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
public ResponseEntity<Void> deleteCategory(@PathVariable Long id)
```

**Entity & Repository:**
- ✅ `warehouse/domain/ItemCategory.java` - Complete với parentCategory (hierarchical)
- ✅ `warehouse/repository/ItemCategoryRepository.java` - findByIsActiveTrue(), findByCategoryCode()
- ✅ `warehouse/dto/response/ItemCategoryResponse.java` - DTO complete

**Result:**
- ✅ FE có thể fetch categories cho dropdown
- ✅ FE có thể CRUD categories nếu cần (admin UI)
- ✅ Support hierarchical categories (parent-child)

**Note:** Seed data vẫn cần được thêm vào DB bởi BE team

---

**Previous Problem:** Item Category dropdown is empty when creating new items

---

## 🟡 MEDIUM PRIORITY Issues

### #6 - Service Category Admin UI Missing

**Priority:** 🟡 Medium  
**Status:** 🟡 TODO - FE work  
**Owner:** FE Team (after Issue #1 is resolved)

**Problem:** BE has Service Category APIs, but FE has no admin UI

**BE APIs (Complete):**
- ✅ GET `/api/v1/service-categories`
- ✅ POST `/api/v1/service-categories`
- ✅ PATCH `/api/v1/service-categories/{id}`
- ✅ DELETE `/api/v1/service-categories/{id}`
- ✅ POST `/api/v1/service-categories/reorder`

**FE Status:**
- ✅ Service implemented (`src/services/serviceCategoryService.ts`)
- ✅ Types defined (`src/types/serviceCategory.ts`)
- ❌ Missing admin page `/admin/service-categories`

**Action:** Wait for Issue #1 resolution, then FE creates admin UI

---

### #6 - Warehouse V3 API Returns 500 Error

**Priority:** 🟡 Medium  
**Status:** 🟡 OPTIONAL - FE has fallback to V1  
**Owner:** BE Team

**Problem:** `/api/v3/warehouse/summary` returns HTTP 500

**Impact:** Limited - FE automatically falls back to V1 API

**Root Cause:** Likely `InventoryService.getInventorySummaryV2()` not implemented or throws exception

**Action:** Debug V3 API when time permits (not blocking)

**Files:**
- `files_from_BE/warehouse/controller/WarehouseV3Controller.java`
- `files_from_BE/warehouse/service/InventoryService.java`

---

### #7 - Warehouse Controllers Using Hardcoded Roles

**Priority:** 🟡 Medium  
**Status:** 🟡 OPTIONAL - Refactor after Issue #3  
**Owner:** BE Team

**Problem:** Controllers use hardcoded roles instead of permissions

**Current:**
```java
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_RECEPTIONIST')")
```

**Should Be:**
```java
@PreAuthorize("hasAuthority('VIEW_WAREHOUSE')")
```

**Action:** Refactor after adding permissions to seed data (Issue #3)

**Files:**
- `files_from_BE/warehouse/controller/InventoryController.java`
- `files_from_BE/warehouse/controller/StorageInOutController.java`
- `files_from_BE/warehouse/controller/SupplierController.java`

---

## 📝 Documentation & Test Scripts

**Test Scripts:**
- `npm run test:comprehensive` - Test all modules
- `npm run test:patient-creation` - Test patient creation specifically

**Documentation:**
- `docs/WAREHOUSE_PERMISSIONS_SEED_DATA_REQUIRED.md` - Warehouse permissions guide
- `docs/BE_ISSUES_SUMMARY.md` - Quick reference summary
- `TEST_AND_INTEGRATION_REPORT.md` - Full test report

**BE Files to Update:**
- `files_from_BE/db/db/dental-clinic-seed-data.sql` - Add Warehouse permissions & Item categories
- `files_from_BE/utils/security/AuthoritiesConstants.java` - Add Warehouse constants
- `files_from_BE/patient/service/PatientService.java` - Fix email verification
- `files_from_BE/warehouse/controller/*` - Refactor @PreAuthorize

---

## 🎯 Recommended Fix Order

**Week 1 - Critical Issues:**
1. **#2 - Fix Patient Creation** (1-2h) - BLOCKING
2. **#1 - Clarify Service API** (2-4h) - BLOCKING

**Week 2 - High Priority:**
3. **#3 - Add Warehouse Permissions** (2-3h) - RBAC
4. **#4 - Add Item Category Data** (1-2h) - Blocks item creation
5. **#7 - Refactor Warehouse Controllers** (2-3h) - After #3

**Week 3 - Optional:**
6. **#6 - Fix V3 Warehouse API** (2-4h) - Nice to have
7. **#5 - Service Category UI** (4-6h) - FE work after #1

---

### #8 - Treatment Plan Items Missing Duration Display (FE Only)

**Priority:** 🟢 Low  
**Status:** ✅ FIXED - FE issue  
**Owner:** FE Team

**Problem:** Treatment plan items không hiển thị duration (`estimatedTimeMinutes`) trong UI

**Root Cause:**
- ✅ BE already stores `estimatedTimeMinutes` when creating plan items
- ✅ BE DTO includes `estimatedTimeMinutes` field
- ✅ FE types include `estimatedTimeMinutes` field  
- ❌ **FE UI component không hiển thị** field này

**Impact:**
- User không thấy duration của treatment plan items
- Calendar appointment từ treatment plan hiển thị default 15 phút thay vì actual duration

**Fix Applied:**
```typescript
// src/components/treatment-plans/TreatmentPlanTimeline.tsx
// Added duration display:
{item.estimatedTimeMinutes && (
  <span className="flex items-center gap-1">
    <Clock className="h-3 w-3" />
    {item.estimatedTimeMinutes} phút
  </span>
)}
```

**Files Updated:**
- `src/components/treatment-plans/TreatmentPlanTimeline.tsx` - Added duration display

**Status:** ✅ FIXED (FE-only issue, no BE action required)

---

**Last Updated:** 2025-01-24  
**Next Review:** After fixing Issues #1 and #2

