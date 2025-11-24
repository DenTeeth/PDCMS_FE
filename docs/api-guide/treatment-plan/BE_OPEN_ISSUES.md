# Backend Open Issues & FE/BE Mismatches

**Date:** 2025-11-20 (Updated: 2025-01-24)  
**Status:** 🟡 Service Management needs BE clarification  
**Scope:** All modules (Service Management, Treatment Plans, Appointments, Warehouse, etc.)

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

## 🟡 MINOR Issues

### 4. 🔴 Warehouse Module - V3 API Returns 500 Error

- **Status:** 🔴 **BE BUG - BLOCKING OPTIONAL FEATURES**
- **Priority:** 🟡 Medium (V1 works, V3 is advanced features)
- **Action Required:** **BE Team needs to fix V3 API**

**Problem:**

BE V3 Warehouse API returns **HTTP 500** error:

**Tested Endpoints:**

```bash
# ❌ FAILS with HTTP 500
GET /api/v3/warehouse/summary?page=0&size=10

# ❌ FAILS with HTTP 500
GET /api/v3/warehouse/batches/1
```

**Expected Behavior:**

According to `WarehouseV3Controller.java`:
- ✅ Controller is defined with `@RequestMapping("/api/v3/warehouse")`
- ✅ Permissions: `VIEW_WAREHOUSE` + roles
- ✅ Response DTO: `InventorySummaryResponse` with `content` array
- ✅ Advanced features: `stockStatus`, `totalQuantity`, `nearestExpiryDate`, FEFO

**Current Behavior:**

- ❌ API returns HTTP 500 (Internal Server Error)
- ❌ No error details in response body

**Suspected Causes:**

1. **Service Layer Not Implemented:**
   - `InventoryService.getInventorySummaryV2()` method may not exist
   - Or method throws exception

2. **Database Query Error:**
   - Aggregation query (`SUM(quantity_on_hand)`) may fail
   - Table/column names mismatch
   - Missing indices causing timeout

3. **Data Type Mismatch:**
   - DTO field types don't match DB columns
   - Enum conversion errors (`StockStatus`, `WarehouseType`)

---

**Impact on Frontend:**

- 🔴 FE **currently uses V3 API** in warehouse components:
  - `EditImportModal.tsx` - calls `itemMasterService.getSummary()`
  - `CreateImportModal.tsx` - calls `itemMasterService.getSummary()`
  - `BatchSelectorModal.tsx` - calls `itemMasterService.getSummary()`
- ❌ These modals will fail when trying to load items
- ⚠️ V1 API still works as fallback

---

**Comparison: V1 vs V3 APIs**

#### API 1: V1 Warehouse API (`/api/v1/inventory`) ✅ **WORKING**

**Controllers:** `InventoryController`, `SupplierController`, `StorageInOutController`  
**Status:** ✅ All endpoints working  
**Test Results:**
- ✅ GET `/api/v1/inventory/summary` - 200 OK (0 items, but functional)
- ✅ GET `/api/v1/inventory/stats` - 200 OK
- ✅ GET `/api/v1/suppliers` - 200 OK
- ✅ GET `/api/v1/storage` - 200 OK

**Capabilities:**
- ✅ **Full CRUD** for Item Masters
- ✅ **Full CRUD** for Suppliers
- ✅ **POST Import/Export** transactions
- ✅ Basic inventory summary (paginated)
- ✅ Warehouse statistics

**Limitations:**
- ⚠️ No computed `stockStatus` (OUT_OF_STOCK, LOW_STOCK, etc.)
- ⚠️ No `totalQuantity` aggregation across batches
- ⚠️ No `nearestExpiryDate` (FEFO support)

---

#### API 2: V3 Warehouse API (`/api/v3/warehouse`) ❌ **BROKEN (500 Error)**

**Controller:** `WarehouseV3Controller`  
**Status:** ❌ All endpoints return HTTP 500  
**Test Results:**
- ❌ GET `/api/v3/warehouse/summary` - 500 Error
- ❌ GET `/api/v3/warehouse/batches/{id}` - Cannot test (no items)

**Expected Advanced Features:**
- ⚠️ Computed `stockStatus` calculation
- ⚠️ `totalQuantity` aggregation (SUM across batches)
- ⚠️ `nearestExpiryDate` for FEFO
- ⚠️ Batch status: EXPIRED, CRITICAL, EXPIRING_SOON, VALID
- ⚠️ Usage rate calculation
- ⚠️ Enhanced filters: search, stockStatus, warehouseType, categoryId

**Permissions:** `VIEW_WAREHOUSE` + roles

---

**Current FE Implementation & Workaround:**

**Files Affected:**
```typescript
// src/services/warehouseService.ts
export const itemMasterService = {
  getSummary: async (filter?) => {
    // ❌ Calls /api/v3/warehouse/summary - FAILS with 500
    const response = await apiV3.get('/warehouse/summary', { params: filter });
    return response.data;
  }
};

// Used by:
// - src/app/admin/warehouse/components/EditImportModal.tsx
// - src/app/admin/warehouse/components/CreateImportModal.tsx  
// - src/app/admin/warehouse/components/BatchSelectorModal.tsx
```

**Temporary Workaround (FE):**

```typescript
// Option 1: Fallback to V1 API
export const itemMasterService = {
  getSummary: async (filter?) => {
    try {
      // Try V3 first
      const response = await apiV3.get('/warehouse/summary', { params: filter });
      return response.data;
    } catch (error) {
      // Fallback to V1 API
      console.warn('V3 API failed, using V1 fallback');
      const response = await api.get('/inventory', { params: filter });
      return response.data.content || [];
    }
  }
};

// Option 2: Use V1 API directly until V3 is fixed
export const itemMasterService = {
  getSummary: async (filter?) => {
    const response = await api.get('/inventory', { params: filter });
    return response.data.content || [];
  }
};
```

---

**Questions for BE Team:**

1. **Why is V3 API returning 500?**
   - Is `InventoryService.getInventorySummaryV2()` implemented?
   - Are there any BE logs showing the error?
   - Is the DB schema correct for V3 queries?

2. **Is V3 API ready for production?**
   - Should FE wait for V3 fix, or use V1 permanently?
   - What's the timeline for V3 fix?

3. **API Strategy going forward:**
   - Should FE use V1 for CRUD + V3 for dashboard (when fixed)?
   - Or is V3 still experimental?

---

**Recommended Actions:**

**For BE Team (URGENT):**

1. **Debug V3 API 500 Error:**
   ```bash
   # Check BE logs for:
   - InventoryService.getInventorySummaryV2() errors
   - SQL query failures
   - DTO mapping exceptions
   ```

2. **Verify Service Implementation:**
```java
   // Check if this method exists and works
   @Service
   public class InventoryService {
     public InventorySummaryResponse getInventorySummaryV2(
       String search, 
       StockStatus stockStatus,
       WarehouseType warehouseType,
       Long categoryId,
       Pageable pageable
     ) {
       // Implementation should:
       // 1. Query item_masters
       // 2. Aggregate SUM(quantity_on_hand) from batches
       // 3. Calculate stockStatus
       // 4. Get MIN(expiry_date) for FEFO
       // 5. Return InventorySummaryResponse
    }
}
```

3. **Test with Postman:**
   ```bash
   GET http://localhost:8080/api/v3/warehouse/summary?page=0&size=10
   Authorization: Bearer {admin_token}
   ```

**For FE Team (IMMEDIATE):**

1. **Implement fallback to V1 API** in affected components
2. **Add error handling** for V3 API calls
3. **Document V3 as "experimental"** until BE fixes

**Priority:** 🟡 Medium - Not blocking production (V1 works), but FE components currently broken

---

**FE Status:**
- ✅ V3 API fallback implemented (automatically uses V1)
- ✅ All warehouse components working with fallback
- ✅ Permissions already added: `VIEW_WAREHOUSE`, `CREATE_WAREHOUSE`, `UPDATE_WAREHOUSE`, `DELETE_WAREHOUSE`

---

### 5. 🔴 Warehouse Module - Missing Item Category Data

- **Status:** 🔴 **MISSING DATA/API**
- **Priority:** 🟡 Medium (blocks item creation)
- **Action Required:** **BE Team needs to provide Item Category API or seed data**

**Problem:**

When creating new items in Warehouse module, the "Nhóm Vật Tư" (Item Category) dropdown is empty:

**Screenshot Evidence:**
- Modal: "Thêm Vật Tư Mới" (Add New Item)
- Field: "Nhóm Vật Tư" (Item Category) - **Empty dropdown**
- Cannot select category for new items

**Expected Behavior:**

Dropdown should show item categories like:
- Vật tư tiêu hao (Consumables)
- Dụng cụ y tế (Medical Equipment)
- Thuốc men (Medicines)
- Hóa chất (Chemicals)
- etc.

**API Investigation:**

**Option 1: V3 Category API**
```bash
# FE is calling this endpoint
GET /api/v3/warehouse/categories

# Controller: WarehouseV3Controller (not found in provided files)
# Status: Unknown - may not be implemented
```

**Option 2: V1 Item Category API**
```bash
# Check if V1 has category endpoint
GET /api/v1/inventory/categories
GET /api/v1/item-categories

# Status: Unknown - not documented
```

**FE Implementation:**

```typescript
// File: src/services/warehouseService.ts
export const categoryService = {
  getAll: async (): Promise<any[]> => {
    // ❌ This endpoint may not exist or returns empty
    const response = await apiV3.get('/warehouse/categories');
    return response.data;
  }
};

// Used in:
// - src/app/admin/warehouse/components/CreateItemMasterModal.tsx
// - src/app/admin/warehouse/components/EditImportModal.tsx
```

**Root Causes (Possible):**

1. **API Not Implemented:**
   - `/api/v3/warehouse/categories` endpoint doesn't exist
   - BE hasn't created CategoryController

2. **Database Empty:**
   - `item_categories` table exists but has no seed data
   - No default categories populated

3. **Wrong Endpoint:**
   - FE calling wrong endpoint
   - Categories under different path (e.g., `/api/v1/categories`)

**Impact on Frontend:**

- ❌ **Cannot create new items** - Category is required field
- ❌ **Cannot filter by category** - Dropdown empty
- ⚠️ Users blocked from basic warehouse operations

**Required Actions:**

**For BE Team (Choose one):**

**Option A: Implement Category API (Recommended)**
```java
@RestController
@RequestMapping("/api/v1/item-categories")
public class ItemCategoryController {
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'VIEW_WAREHOUSE')")
    public ResponseEntity<List<ItemCategoryResponse>> getAllCategories() {
        // Return list of categories
        return ResponseEntity.ok(categoryService.getAllActive());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
    public ResponseEntity<ItemCategoryResponse> createCategory(
        @RequestBody CreateCategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.create(request));
    }
}
```

**Option B: Provide Seed Data**
```sql
-- Insert default categories
INSERT INTO item_categories (category_code, category_name, description, is_active) 
VALUES 
  ('CONSUMABLE', 'Vật tư tiêu hao', 'Vật tư sử dụng một lần', true),
  ('EQUIPMENT', 'Dụng cụ y tế', 'Thiết bị và dụng cụ tái sử dụng', true),
  ('MEDICINE', 'Thuốc men', 'Thuốc và dược phẩm', true),
  ('CHEMICAL', 'Hóa chất', 'Hóa chất y tế', true),
  ('MATERIAL', 'Vật liệu', 'Vật liệu nha khoa', true);
```

**Option C: Document Existing Endpoint**
- If category API already exists, provide:
  - Endpoint URL
  - Request/Response format
  - Sample data
  - Permission requirements

**For FE Team (Temporary Workaround):**

```typescript
// Add hardcoded categories until BE provides API
export const categoryService = {
  getAll: async (): Promise<any[]> => {
    try {
      const response = await apiV3.get('/warehouse/categories');
      return response.data;
    } catch (error) {
      // Fallback to hardcoded categories
      console.warn('⚠️ Category API failed, using fallback data');
      return [
        { id: 1, code: 'CONSUMABLE', name: 'Vật tư tiêu hao' },
        { id: 2, code: 'EQUIPMENT', name: 'Dụng cụ y tế' },
        { id: 3, code: 'MEDICINE', name: 'Thuốc men' },
        { id: 4, code: 'CHEMICAL', name: 'Hóa chất' },
        { id: 5, code: 'MATERIAL', name: 'Vật liệu' },
      ];
    }
  }
};
```

**Related Files:**

- BE: `warehouse/model/ItemCategory.java`
- BE: `warehouse/repository/ItemCategoryRepository.java`
- FE: `src/services/warehouseService.ts` - `categoryService`
- FE: `src/types/warehouse.ts` - `ItemCategory` type
- FE: `src/app/admin/warehouse/components/CreateItemMasterModal.tsx`

**Priority:** 🟡 Medium - Blocks item creation workflow, but warehouse viewing/stats still work

---

### 6. 🔴 Patient Account Creation - API Returns 500 Error

- **Status:** 🔴 **CRITICAL BUG - BLOCKING USER REGISTRATION**
- **Priority:** 🔴 Critical (core functionality broken)
- **Action Required:** **BE Team must fix immediately**

**Problem:**

Patient account creation API returns **HTTP 500 Internal Server Error**:

```bash
POST /api/v1/patients
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "username": "testpatient1764004875940",
  "password": "Test123456",
  "email": "testpatient1764004875940@example.com",
  "firstName": "Test",
  "lastName": "Patient",
  "phone": "0901234567",
  "dateOfBirth": "1990-01-01",
  "address": "123 Test Street, Test City",
  "gender": "MALE",
  "medicalHistory": "No significant medical history",
  "allergies": "None",
  "emergencyContactName": "Emergency Contact",
  "emergencyContactPhone": "0909999999"
}

# Response:
{
  "statusCode": 500,
  "error": "error.internal",
  "message": "Internal server error",
  "data": null
}
```

**Expected Behavior:**

According to `PatientController.java`:
- ✅ Endpoint: `POST /api/v1/patients`
- ✅ Permission: `CREATE_PATIENT` or `ROLE_ADMIN`
- ✅ Response: `PatientInfoResponse` with `patientCode`
- ✅ Creates both Patient record + Account (with email verification)

**Tested With:**
- ✅ Valid authentication (admin token)
- ✅ Admin has `CREATE_PATIENT` permission
- ✅ All required fields provided
- ✅ Valid data formats (email, phone, date)
- ❌ **Still returns 500 error**

**Root Causes (Suspected):**

1. **Database Constraint Violation:**
   - Unique constraint on username/email fails
   - Foreign key constraint error
   - NOT NULL constraint on unexpected field

2. **Service Layer Exception:**
   ```java
   // PatientService.createPatient()
   // Line 178 in provided code
   - Account creation might fail
   - Password hashing error
   - Email verification setup error
   ```

3. **Data Type Mismatch:**
   - Gender enum value not matching DB
   - Date format incompatible
   - Phone number validation fails

4. **Missing Role/Permission Setup:**
   - Default ROLE_PATIENT not found in DB
   - Permission assignment fails

**Impact on System:**

- 🔴 **Cannot register new patients** - Core feature completely broken
- 🔴 **Admins cannot create patient accounts**
- 🔴 **Blocks all patient-related workflows:**
  - Cannot create appointments
  - Cannot create treatment plans
  - Cannot access patient portal
- 🔴 **System unusable for new patients**

**FE Implementation (Working Correctly):**

```typescript
// src/services/patientService.ts
createPatientWithAccount: async (data: CreatePatientWithAccountRequest) => {
  const response = await api.post('/patients', data);
  return response.data;
}

// src/app/admin/accounts/users/page.tsx
// Form validates all fields
// Sends correct payload format
// ✅ FE code is correct
```

**Required Actions:**

**For BE Team (URGENT):**

1. **Check BE Logs:**
   ```bash
   # Look for stack trace when POST /patients is called
   # Check for:
   - SQLException
   - ConstraintViolationException
   - NullPointerException
   - ValidationException
   ```

2. **Verify Database:**
   ```sql
   -- Check if tables exist
   SELECT * FROM patients LIMIT 1;
   SELECT * FROM accounts LIMIT 1;
   
   -- Check constraints
   SHOW CREATE TABLE patients;
   SHOW CREATE TABLE accounts;
   
   -- Check if ROLE_PATIENT exists
   SELECT * FROM roles WHERE role_id = 'ROLE_PATIENT';
   ```

3. **Test Service Layer:**
   ```java
   @Test
   public void testCreatePatient() {
     CreatePatientRequest request = new CreatePatientRequest();
     request.setUsername("test123");
     request.setPassword("Test123456");
     request.setEmail("test@example.com");
     // ... set all fields
     
     PatientInfoResponse response = patientService.createPatient(request);
     assertNotNull(response.getPatientCode());
   }
   ```

4. **Check Account Creation:**
   ```java
   // In PatientService.createPatient() around line 212
   // Verify account creation doesn't throw exception
   Account account = accountService.createAccountForPatient(patient, request.getPassword());
   ```

**Workaround (None Available):**

- ❌ No FE workaround possible
- ❌ Cannot create patients manually in DB (account sync issue)
- 🚨 **System blocked for patient registration**

**Test Results:**

```bash
# Test 1: Minimal fields (username, password, email, firstName, lastName)
POST /patients - Response: 500 Internal Server Error

# Test 2: All fields included
POST /patients - Response: 500 Internal Server Error

# Conclusion: Even minimal required fields fail
# Issue is NOT validation-related
# Issue is in BE service layer execution
```

**Most Likely Root Cause:**

Based on code analysis, the issue is probably:

```java
// Line 232 in PatientService.createPatient()
emailService.sendVerificationEmail(
  account.getEmail(), 
  account.getUsername(), 
  verificationToken.getToken()
);
```

**Suspected Issues:**
1. **Email Service Not Configured:**
   - SMTP server not set up
   - Email credentials missing in application.properties
   - EmailService bean not initialized

2. **AccountVerificationToken Entity:**
   - Table `account_verification_tokens` doesn't exist
   - Foreign key constraint fails
   - Token generation throws exception

3. **Transaction Rollback:**
   - Email sending fails
   - @Transactional rolls back entire operation
   - Returns 500 instead of specific error

**Recommended Fix (BE Team):**

**Option 1: Make Email Async & Non-Blocking**
```java
// Wrap email sending in try-catch to prevent transaction rollback
try {
    emailService.sendVerificationEmail(...);
    log.info("✅ Verification email sent");
} catch (Exception e) {
    log.warn("⚠️ Failed to send verification email, but patient created", e);
    // Don't fail the entire operation
}
```

**Option 2: Disable Email Verification Temporarily**
```java
// Comment out email verification for now
// account.setStatus(AccountStatus.PENDING_VERIFICATION);
account.setStatus(AccountStatus.ACTIVE); // Temporarily set to ACTIVE

// Skip email sending
// emailService.sendVerificationEmail(...);
log.info("⚠️ Email verification disabled - account is ACTIVE");
```

**Option 3: Check Email Service Configuration**
```properties
# application.properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Temporary Workaround (FE):**

❌ **No FE workaround available** - This is a BE service issue

**Action Items:**

1. **BE Team - Check Email Service:**
   ```bash
   # Check if email service bean exists
   # Check SMTP configuration
   # Test email sending independently
   ```

2. **BE Team - Add Better Error Handling:**
   ```java
   try {
       // Create patient logic
   } catch (MailException e) {
       log.error("Email service failed", e);
       throw new BadRequestAlertException(
           "Patient created but email failed: " + e.getMessage(),
           "patient",
           "emailfailed"
       );
   } catch (Exception e) {
       log.error("Unexpected error", e);
       throw new InternalServerException(
           "Failed to create patient: " + e.getMessage()
       );
   }
   ```

3. **BE Team - Check Database:**
   ```sql
   -- Verify tables exist
   SHOW TABLES LIKE '%verification%';
   SHOW TABLES LIKE '%account%';
   SHOW TABLES LIKE '%patient%';
   ```

**Test Script:**

```bash
# Run test script to reproduce issue
npx tsx scripts/test-patient-creation.ts

# Expected: Patient created with patientCode
# Actual: 500 Internal Server Error (even with minimal fields)
```

**Priority:** 🔴 **CRITICAL** - Core functionality completely broken. System cannot register new patients. Must fix before ANY deployment.

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
| 4 | **Warehouse V3 API - 500 Error** | ✅ **FE FIXED** | **BE Team** | 🟡 Medium |
| 5 | **Warehouse - Missing Item Category Data** | 🔴 **BLOCKING** | **BE Team** | 🟡 Medium |
| 6 | **Patient Account Creation - 500 Error** | 🔴 **BROKEN** | **BE Team** | 🔴 Critical |
| 5 | **Treatment Plan Primary Doctor Access** | ✅ **RESOLVED** | - | ✅ Done |

---

**Last Updated:** 2025-01-24  
**Next Steps:** 
- 🔴 **BE Team:** Fix Patient Creation 500 error (Issue #6) - **CRITICAL - BLOCKS SYSTEM**
- 🔴 **BE Team:** Clarify Service API architecture (Issue #1) - **CRITICAL**
- 🔴 **BE Team:** Provide Item Category API or seed data (Issue #5) - **BLOCKS WAREHOUSE**
- 🟡 **BE Team:** Fix V3 Warehouse API 500 error (Issue #4) - Optional (FE has fallback)
- 🟡 **FE Team:** Create Service Category admin UI after Issue #1 is resolved (Issue #2)
- ✅ **FE Team:** V3 Warehouse fallback implemented - **DONE**
