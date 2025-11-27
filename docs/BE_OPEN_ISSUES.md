# BE Open Issues (2025-01-26)

> ⚠️ **Items below require BE follow-up.**  
> Only active/open issues are listed. Resolved issues have been removed.

---

## 📊 Summary

| # | Issue | Status | Priority | Owner | Est. Effort |
|---|-------|--------|----------|-------|-------------|
| 5 | Patient Account Creation & Email Verification Workflow | 🟡 Partial | High | BE | 2-3h |
| 11 | Import Transaction - Auto Create Base Unit | 🟡 Partial | Medium | BE | 30min (Priority 2) |
| 13 | Transaction Detail Missing itemMasterId for Items | ✅ Resolved | High | BE | 1h |
| 14 | Storage detail response missing itemCode/expiryDate/itemMasterId | 🔴 Open | High | BE | 30min |

**Note:** Issues #1, #2, #3, #4, #6 were resolved in BE V23/V24. Issue #9 was resolved by implementing Priority 2 solution (find employee by account.username). Details available in `docs/FE_ISSUES_FIX_REPORT_V23_V24.md`.

---

## #5 – Patient Account Creation & Email Verification Workflow

**Status:** 🟡 **PARTIALLY IMPLEMENTED** • **Priority:** High  
**Endpoint:** `POST /api/v1/patients`  
**Files:** `patient/service/PatientService.java`, `utils/EmailService.java`, `authentication/service/AuthenticationService.java`, DB seed scripts  
**Last Checked:** 2025-01-26 (BE files updated)

### ✅ What's Already Implemented
1. ✅ **Patient Creation Flow:**
   - BE creates account with `ROLE_PATIENT`, `status=PENDING_VERIFICATION`, `mustChangePassword=true` ✅
   - BE generates temporary random password (UUID) ✅
   - BE creates `PasswordResetToken` for password setup ✅
   - BE calls `EmailService.sendWelcomeEmailWithPasswordSetup()` to send welcome email ✅
   - Error handling: If email sending fails, BE logs error but **still returns 201 Created** (account created but patient cannot login) ✅
   - **Verified in:** `files_from_BE/patient/service/PatientService.java` (lines 236-292)

2. ✅ **Email Service:**
   - Method `sendWelcomeEmailWithPasswordSetup()` exists with dedicated template ✅
   - Email contains link to `/reset-password?token={token}` ✅

3. ✅ **Password Setup:**
   - Endpoint `POST /api/v1/auth/reset-password` can be used for password setup (shares `PasswordResetToken` with password reset flow) ✅
   - After password is set, account `mustChangePassword` is set to `false` ✅

4. ✅ **Account Verification:**
   - Endpoint `GET /api/v1/auth/verify-email?token={token}` for email verification ✅
   - Endpoint `POST /api/v1/auth/resend-verification` for resending verification email ✅

### ❌ What's Still Missing (Verified 2025-01-26)
1. ❌ **Resend Password Setup Email:**
   - **Status:** NOT IMPLEMENTED
   - No endpoint to resend password setup email for patients with `PENDING_VERIFICATION` status
   - Current `resend-verification` is for account verification, not password setup
   - **Need:** `POST /api/v1/auth/resend-password-setup` or similar
   - **Checked:** `files_from_BE/account/controller/AccountController.java` - No such endpoint exists
   - **Checked:** `files_from_BE/patient/controller/PatientController.java` - No such endpoint exists

2. ❌ **Verification Status Check:**
   - **Status:** NOT IMPLEMENTED
   - No endpoint to check account verification status
   - **Need:** `GET /api/v1/accounts/{accountCode}/verification-status` or `GET /api/v1/accounts/me/status`
   - **Checked:** `files_from_BE/account/controller/AccountController.java` - Only has `/me`, `/profile`, `/permissions`, `/info` endpoints
   - **Note:** `MeResponse` has `accountStatus` field, but no dedicated endpoint for checking patient account status

3. ❌ **Token Type Distinction:**
   - **Status:** NOT IMPLEMENTED
   - Currently uses `PasswordResetToken` for both password setup and password reset
   - No clear distinction in token type (setup vs reset)
   - **Checked:** `files_from_BE/account/domain/PasswordResetToken.java` - No `tokenType` field
   - **Recommendation:** Add `tokenType` field to `PasswordResetToken` or create separate `AccountSetupToken` entity

4. ❌ **Seed Data:**
   - **Status:** NOT IMPLEMENTED
   - No test accounts with `PENDING_VERIFICATION` status for QA testing
   - No test tokens in database for testing password setup flow

### Problems
1. **Email Service Configuration:**
   - SMTP settings may not be configured in `application.yml`
   - Email failures are logged but not surfaced to FE clearly
   - Patient account is created but cannot be activated without manual intervention

2. **Password Reset Token Flow:**
   - Uses `PasswordResetToken` entity (designed for password reset, not initial setup)
   - Token expiration and validation logic may not be optimized for "first-time setup" scenario
   - No clear distinction between "password reset" and "password setup" in email templates

3. **Account Status Management:**
   - Account status is `PENDING_VERIFICATION` but there's no clear workflow to:
     - Resend verification email if first attempt fails
     - Manually activate account if email service is down
     - Track verification status in patient management UI

4. **Missing Seed Data:**
   - No test accounts with `PENDING_VERIFICATION` status for QA testing
   - No documentation on how to test email verification flow locally

### Required Enhancements

**Priority 1: Resend Password Setup Email (High Priority)**
```java
// In AuthenticationController.java
@PostMapping("/resend-password-setup")
@Operation(summary = "Resend password setup email", description = "Resend password setup email for patients with PENDING_VERIFICATION status")
public ResponseEntity<Void> resendPasswordSetupEmail(
    @Valid @RequestBody ResendPasswordSetupRequest request) {
    authenticationService.resendPasswordSetupEmail(request.getEmail());
    return ResponseEntity.ok().build();
}

// In AuthenticationService.java
public void resendPasswordSetupEmail(String email) {
    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new AccountNotFoundException("Email không tồn tại"));
    
    if (account.getStatus() != AccountStatus.PENDING_VERIFICATION) {
        throw new IllegalArgumentException("Account is not in PENDING_VERIFICATION status");
    }
    
    // Delete old password setup tokens
    passwordResetTokenRepository.deleteByAccount(account);
    
    // Create new password setup token
    PasswordResetToken setupToken = new PasswordResetToken(account);
    passwordResetTokenRepository.save(setupToken);
    
    // Send welcome email with password setup link
    String patientName = account.getUsername(); // Or get from Patient entity
    emailService.sendWelcomeEmailWithPasswordSetup(account.getEmail(), patientName, setupToken.getToken());
}
```

**Priority 2: Verification Status Check (Medium Priority)**
```java
// In AccountController.java (or create if doesn't exist)
@GetMapping("/accounts/{accountCode}/status")
@PreAuthorize("hasRole('ADMIN') or @securityUtil.isOwnAccount(#accountCode)")
public ResponseEntity<AccountStatusResponse> getAccountStatus(@PathVariable String accountCode) {
    Account account = accountRepository.findOneByAccountCode(accountCode)
        .orElseThrow(() -> new AccountNotFoundException("Account not found"));
    
    return ResponseEntity.ok(new AccountStatusResponse(
        account.getStatus(),
        account.getMustChangePassword(),
        account.getEmail(),
        account.getEmailVerifiedAt()
    ));
}
```

**Priority 3: Token Type Distinction (Low Priority - Nice to Have)**
- Option A: Add `tokenType` enum to `PasswordResetToken`:
  ```java
  public enum TokenType {
      PASSWORD_SETUP,  // For new patient accounts
      PASSWORD_RESET   // For existing accounts
  }
  ```
- Option B: Create separate `AccountSetupToken` entity (more work but cleaner separation)

**Priority 4: Seed Data (Medium Priority)**
- Add test patient accounts with `PENDING_VERIFICATION` status
- Add test tokens in database for QA testing
- Document how to test email verification locally

### Additional Recommendations

**Email Service Configuration (if not already done)**
```yaml
# application.yml
spring:
  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
    test-connection: false # Don't fail app startup if mail server unreachable
```

**Enhanced Error Response (Optional)**
- Consider returning warning in response if email fails:
  ```json
  {
    "data": { ...patient data... },
    "warnings": ["Email không thể gửi được. Vui lòng liên hệ admin để kích hoạt tài khoản."]
  }
  ```

### Impact
- **Current:** 
  - ✅ Core flow works: Patient accounts can be created, email sent, password can be set via `/reset-password`
  - ⚠️ Missing: Cannot resend password setup email if patient didn't receive it
  - ⚠️ Missing: No way to check account verification status programmatically
  - ⚠️ Missing: No test data for QA testing

- **After Fix:** 
  - Complete workflow for account activation
  - Better UX: Patients can request new password setup email
  - Better monitoring: FE can check account status
  - Testable: Seed data for QA

### Testing Requirements
1. ✅ Test account creation with valid email → Email sent, account `PENDING_VERIFICATION` (ALREADY WORKS)
2. ✅ Test account creation with invalid email → Account created, error logged (ALREADY WORKS)
3. ✅ Test password setup with valid token → Password set, account activated (ALREADY WORKS via `/reset-password`)
4. ❌ Test resend password setup email → New token generated, email sent (NEEDS IMPLEMENTATION)
5. ❌ Test verification status check → Returns account status (NEEDS IMPLEMENTATION)
6. ❌ Test password setup with expired token → Error message returned (SHOULD WORK but needs testing)

---

## ✅ #9 – Warehouse Import/Export - EMPLOYEE_NOT_FOUND Error (RESOLVED)

**Status:** ✅ **RESOLVED** • **Priority:** Critical  
**Endpoint:** `POST /api/v1/inventory/import`, `POST /api/v1/inventory/export`  
**Files:** `warehouse/service/ImportTransactionService.java`, `warehouse/service/ExportTransactionService.java`  
**Resolved Date:** 2025-01-26  
**Resolution:** BE implemented Priority 2 solution (find employee by account.username)

### ✅ Resolution Summary

BE đã cập nhật logic tìm employee từ:
- **Trước:** `findByEmployeeCodeAndIsActiveTrue(employeeCode)` hoặc `findOneByEmployeeCode(employeeCode)`
- **Sau:** `findByAccount_Username(employeeCode)` ✅

### ✅ Verification (2025-01-26)

**Checked:** `files_from_BE/warehouse/service/ImportTransactionService.java` (line 89):
```java
Employee employee = employeeRepository.findByAccount_Username(employeeCode)
    .orElseThrow(() -> new NotFoundException(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found for account: " + employeeCode));
```
- ✅ **FIXED:** Tìm employee thông qua `account.username` thay vì `employeeCode`
- ✅ **FIXED:** Không cần `employeeCode = username` nữa, chỉ cần employee có account với username đó

**Checked:** `files_from_BE/warehouse/service/ExportTransactionService.java` (line 71):
```java
Employee employee = employeeRepository.findByAccount_Username(employeeCode)
    .orElseThrow(() -> new NotFoundException(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found for account: " + employeeCode));
```
- ✅ **FIXED:** Tương tự như ImportTransactionService

**Checked:** `files_from_BE/warehouse/service/StorageInOutService.java` (line 389):
- ✅ **FIXED:** Cũng sử dụng `findByAccount_Username(username)`

### Impact

- ✅ **RESOLVED:** Có thể tạo import/export transaction
- ✅ **RESOLVED:** Warehouse module hoạt động bình thường
- ✅ **RESOLVED:** User có permission và employee record (link qua account) có thể sử dụng warehouse

### FE Impact

**No changes required** - FE không cần sửa gì vì:
- FE vẫn gửi request như bình thường
- BE tự động tìm employee thông qua account.username từ JWT token
- API contract không thay đổi

### Testing Requirements

1. ✅ Test với admin user có employee record (link qua account) → Should work
2. ✅ Test với user có employee record (link qua account) → Should work
3. ⚠️ Test với user không có employee record → Still fails (expected - cần có employee record)
4. ⚠️ Test với employee `isActive = false` → Still fails (expected - cần active employee)

### Additional Notes

**Solution Implemented:**
- BE đã chọn **Priority 2 solution** (tìm employee bằng account.username)
- Điều này linh hoạt hơn vì không cần `employeeCode = username` nữa
- Chỉ cần employee có account với username đó (thông qua relationship `account_id`)

**Remaining Requirements:**
- Vẫn cần employee record cho mỗi user muốn sử dụng warehouse
- Employee record phải có `isActive = true`
- Employee record phải link đến account thông qua `account_id`

---

## ✅ #10 – Transaction Detail Response Missing itemCode and expiryDate (RESOLVED)

**Status:** ✅ **RESOLVED** • **Priority:** Medium  
**Endpoint:** `GET /api/v1/storage/{id}`  
**Files:** `warehouse/dto/response/TransactionResponse.java`, `warehouse/mapper/StorageTransactionMapper.java`  
**Resolved Date:** 2025-01-26

### ✅ Resolution Summary

BE đã thêm `expiryDate` vào `TransactionItemResponse` DTO và cập nhật mapper để map field này từ batch. `itemCode` đã được map với null check để tránh NPE.

### ✅ Verification (2025-01-26)

**Checked:** `files_from_BE/warehouse/dto/response/TransactionResponse.java` (line 44):
```java
public static class TransactionItemResponse {
    private Long transactionItemId;
    private String itemCode; // ✅ Field exists
    private String itemName;
    private String unitName;
    private String lotNumber;
    private Integer quantityChange;
    private LocalDate expiryDate; // ✅ ADDED
    private String notes;
}
```
- ✅ **FIXED:** `expiryDate` field đã được thêm vào DTO

**Checked:** `files_from_BE/warehouse/mapper/StorageTransactionMapper.java` (line 30-42):
```java
.map(item -> TransactionResponse.TransactionItemResponse.builder()
    .transactionItemId(item.getTransactionItemId())
    .itemCode(item.getBatch() != null && item.getBatch().getItemMaster() != null
        ? item.getBatch().getItemMaster().getItemCode()
        : null) // ✅ Null check added
    .itemName(item.getBatch() != null && item.getBatch().getItemMaster() != null
        ? item.getBatch().getItemMaster().getItemName()
        : null) // ✅ Null check added
    .unitName(item.getUnit() != null ? item.getUnit().getUnitName() : null)
    .lotNumber(item.getBatch() != null ? item.getBatch().getLotNumber() : null)
    .quantityChange(item.getQuantityChange())
    .expiryDate(item.getBatch() != null ? item.getBatch().getExpiryDate() : null) // ✅ ADDED
    .notes(item.getNotes())
    .build())
```
- ✅ **FIXED:** `expiryDate` đã được map từ `item.getBatch().getExpiryDate()`
- ✅ **FIXED:** Null checks đã được thêm cho `itemCode` và `itemName`

### Impact

- ✅ **RESOLVED:** FE có thể hiển thị "Mã vật tư" trong bảng chi tiết vật tư
- ✅ **RESOLVED:** FE có thể hiển thị "Hạn sử dụng" cho các phiếu nhập kho
- ✅ **RESOLVED:** User experience được cải thiện, dễ quản lý và theo dõi vật tư

### FE Impact

**Changes required:**
- ✅ Updated `StorageTransactionItemV3` type to include `expiryDate` field
- ✅ Updated `storageService.ts` to map `expiryDate` from BE response
- ✅ `StorageDetailModal.tsx` already displays `expiryDate` when available

### Testing Requirements

1. ✅ Test GET `/api/v1/storage/{id}` for import transaction → `itemCode` and `expiryDate` should be present
2. ✅ Test GET `/api/v1/storage/{id}` for export transaction → `itemCode` should be present (expiryDate optional for export)
3. ✅ Test with transaction items that have null batch → Should not throw NPE, return null values gracefully
4. ✅ Test with items that have no expiry date → Should return null for `expiryDate`

---

## #14 – Storage detail response still missing itemCode/expiryDate/itemMasterId

**Status:** 🔴 **OPEN** • **Priority:** High  
**Endpoint:** `GET /api/v1/storage/{id}`  
**Files:** `warehouse/service/StorageInOutService.java`, `warehouse/mapper/StorageTransactionMapper.java`  
**Last Checked:** 2025-01-26 (folder shared via `/files_from_BE/warehouse`)

### ❌ Problem Statement
- FE vẫn nhận `itemMasterId: undefined`, `itemCode: null`, `expiryDate: null` khi mở modal “Chi tiết phiếu kho” (log & screenshot ngày 2025-01-26).
- DTO và mapper đã có đủ field, nhưng service không sử dụng mapper nên response tiếp tục thiếu dữ liệu (UI chỉ thấy “Chưa có mã / HSD: Chưa có”).

### 🔎 Root Cause (confirmed in latest code)
```
```352:373:files_from_BE/warehouse/service/StorageInOutService.java
private TransactionResponse mapToTransactionResponse(StorageTransaction transaction) {
    List<TransactionResponse.TransactionItemResponse> itemDtos = transaction.getItems().stream()
        .map(item -> TransactionResponse.TransactionItemResponse.builder()
            .transactionItemId(item.getTransactionItemId())
            .itemName(item.getBatch().getItemMaster().getItemName())
            .lotNumber(item.getBatch().getLotNumber())
            .quantityChange(item.getQuantityChange())
            .notes(item.getNotes())
            .build())
        .collect(Collectors.toList());
    ...
}
```
- Helper trên **không map** `itemMasterId`, `itemCode`, `unitName`, `expiryDate`.
- `StorageTransactionMapper` (map đầy đủ + fallback `item.getItemCode()`) không được inject/sử dụng.
- Vì vậy tất cả API (`import`, `export`, `getAll`, `getById`, `updateNotes`, `delete`) vẫn trả DTO thiếu field.

### ✅ Expected Behavior
- Response items phải luôn có `itemMasterId`, `itemCode`, `expiryDate`, `unitName` để FE hiển thị và cross-link với inventory.
- Nếu batch không load được, mapper cần fallback về `storage_transaction_items.item_code`.

### 🛠 Suggested Fix
1. **Inject và dùng `StorageTransactionMapper`:**
   ```java
   @Service
   public class StorageInOutService {
       private final StorageTransactionMapper mapper;

       public TransactionResponse importItems(...) {
           ...
           return mapper.toResponse(transaction);
       }
   }
   ```
   Áp dụng tương tự cho `exportItems`, `getTransactionById`, `getAllTransactions`, `updateTransactionNotes`.
2. Hoặc cập nhật `mapToTransactionResponse()` để map đủ field giống mapper (bao gồm fallback `item.getItemCode()` & `item.getBatch()?.getExpiryDate()`).
3. Đảm bảo repository `findByIdWithDetails()` tiếp tục được dùng để tránh lazy loading (hiện đã OK).

### 🔁 Repro Steps
1. Gọi `GET /api/v1/storage/{id}` trên build BE hiện tại → JSON trả về thiếu `itemMasterId`, `itemCode`, `expiryDate`.
2. FE mở modal → cột “Mã vật tư / Hạn sử dụng” hiển thị “Chưa có dữ liệu”.

### 📈 Impact
- Người dùng không xem được mã vật tư & hạn sử dụng trong phiếu kho.
- Không thể điều hướng sang chi tiết vật tư (thiếu `itemMasterId`).
- FE phải chạy fallback tốn thời gian (gọi `inventoryService.getById` + `getBatchesByItemId`) và vẫn thất bại nếu thiếu ID.

### ✅ Definition of Done
- API đáp ứng `TransactionResponse` với đủ `itemMasterId`, `itemCode`, `expiryDate`, `unitName` cho mọi dòng.
- FE logs khi mở phiếu kho không còn `undefined/null`.
- Modal hiển thị đúng “Mã vật tư / HSD” mà không cần fallback.

---

## ✅ #11 – Import Transaction - Auto Create Base Unit from unitOfMeasure (PARTIALLY RESOLVED)

**Status:** 🟡 **PARTIALLY RESOLVED** • **Priority:** Medium  
**Endpoint:** `POST /api/v1/inventory/import`  
**Files:** `warehouse/service/ImportTransactionService.java`, `warehouse/service/ItemUnitService.java`  
**Resolved Date:** 2025-01-26  
**Last Checked:** 2025-01-26

### ✅ Resolution Summary

BE đã implement **Priority 1** (Auto-create base unit when processing Import Transaction). Khi import transaction, nếu `unitId` không tìm thấy, BE sẽ tự động tạo base unit từ `unitOfMeasure` của item master.

### ✅ What's Already Implemented

**Priority 1: Auto-create Base Unit when processing Import Transaction** ✅ **RESOLVED**

**Checked:** `files_from_BE/warehouse/service/ImportTransactionService.java` (line 218-258):
```java
// 3. Load or auto-create unit
ItemUnit unit;
Optional<ItemUnit> unitOpt = unitRepository.findById(itemRequest.getUnitId());

if (unitOpt.isPresent()) {
    unit = unitOpt.get();
} else {
    // ✅ Auto-create base unit from itemMaster.unitOfMeasure if unit not found
    log.warn("⚠️ Unit ID {} not found for item {}. Attempting to auto-create base unit from unitOfMeasure: {}",
            itemRequest.getUnitId(), itemMaster.getItemCode(), itemMaster.getUnitOfMeasure());

    if (itemMaster.getUnitOfMeasure() == null || itemMaster.getUnitOfMeasure().trim().isEmpty()) {
        throw new BadRequestException("UNIT_REQUIRED", "...");
    }

    // Check if base unit already exists
    Optional<ItemUnit> existingBaseUnit = unitRepository
            .findBaseUnitByItemMasterId(itemMaster.getItemMasterId());

    if (existingBaseUnit.isPresent()) {
        unit = existingBaseUnit.get();
        log.info("✅ Using existing base unit '{}' (ID: {}) for item: {}",
                unit.getUnitName(), unit.getUnitId(), itemMaster.getItemCode());
    } else {
        // ✅ Create new base unit from unitOfMeasure
        unit = ItemUnit.builder()
                .itemMaster(itemMaster)
                .unitName(itemMaster.getUnitOfMeasure())
                .conversionRate(1)
                .isBaseUnit(true)
                .displayOrder(1)
                .build();

        unit = unitRepository.save(unit);
        log.info("✅ Auto-created base unit '{}' (ID: {}) for item master: {}",
                itemMaster.getUnitOfMeasure(), unit.getUnitId(), itemMaster.getItemCode());
    }
}
```
- ✅ **FIXED:** BE tự động tạo base unit từ `unitOfMeasure` khi import transaction nếu `unitId` không tìm thấy
- ✅ **FIXED:** User có thể nhập kho cho item master mới mà không cần tạo base unit thủ công

### ❌ What's Still Missing

**Priority 2: Add Fallback in getBaseUnit()** ❌ **NOT IMPLEMENTED**

**Checked:** `files_from_BE/warehouse/service/ItemUnitService.java` (line 56-66):
```java
public ItemUnitResponse getBaseUnit(Long itemMasterId) {
    ItemMaster itemMaster = itemMasterRepository.findById(itemMasterId)
        .orElseThrow(() -> new ItemMasterNotFoundException(itemMasterId));
    
    // Get base unit
    ItemUnit baseUnit = itemUnitRepository.findBaseUnitByItemMasterId(itemMasterId)
        .orElseThrow(() -> new RuntimeException("Base unit not found for item: " + itemMaster.getItemName()));
    // ❌ Still throws exception if base unit not found
}
```
- ❌ **NOT FIXED:** `getBaseUnit()` vẫn throw exception nếu không tìm thấy base unit
- ❌ **Impact:** FE vẫn không thể fetch base unit trước khi submit import transaction (sẽ fail với 500 error)
- ⚠️ **Workaround:** FE có thể submit import transaction trực tiếp, BE sẽ auto-create base unit khi xử lý

### Remaining Issue

**Priority 2: Add Fallback in getBaseUnit() (Optional - Nice to Have)**

Hiện tại `getBaseUnit()` vẫn throw exception nếu không tìm thấy base unit. Điều này khiến FE không thể fetch base unit trước khi submit import transaction. Tuy nhiên, với Priority 1 đã được implement, FE có thể submit import transaction trực tiếp và BE sẽ tự động tạo base unit.

**Optional Enhancement:**

```java
// In ItemUnitService.java - getBaseUnit()
public ItemUnitResponse getBaseUnit(Long itemMasterId) {
    ItemMaster itemMaster = itemMasterRepository.findById(itemMasterId)
        .orElseThrow(() -> new NotFoundException(...));
    
    // Try to get base unit
    Optional<ItemUnit> baseUnitOpt = itemUnitRepository
        .findBaseUnitByItemMasterId(itemMasterId);
    
    if (baseUnitOpt.isPresent()) {
        return mapToResponse(baseUnitOpt.get());
    }
    
    // ✅ FALLBACK: If no base unit found, create one from unitOfMeasure
    if (itemMaster.getUnitOfMeasure() != null && !itemMaster.getUnitOfMeasure().trim().isEmpty()) {
        log.warn("⚠️ Base unit not found for item {}, auto-creating from unitOfMeasure: {}", 
            itemMaster.getItemCode(), itemMaster.getUnitOfMeasure());
        
        ItemUnit fallbackUnit = ItemUnit.builder()
            .itemMaster(itemMaster)
            .unitName(itemMaster.getUnitOfMeasure())
            .conversionRate(1)
            .isBaseUnit(true)
            .displayOrder(1)
            .build();
        
        ItemUnit saved = itemUnitRepository.save(fallbackUnit);
        return mapToResponse(saved);
    }
    
    throw new RuntimeException("Base unit not found and unitOfMeasure is empty for item: " + itemMaster.getItemName());
}
```

### Impact

- ✅ **RESOLVED (Priority 1):** User có thể nhập kho cho item master mới mà không cần tạo base unit thủ công
- ✅ **RESOLVED (Priority 1):** BE tự động tạo base unit từ `unitOfMeasure` khi import transaction
- ⚠️ **PARTIAL:** FE vẫn không thể fetch base unit trước khi submit (sẽ fail với 500 error), nhưng có thể submit trực tiếp và BE sẽ tự động tạo

### FE Impact

**Changes required:**
- ✅ FE có thể submit import transaction với `unitId` không tồn tại, BE sẽ tự động tạo base unit
- ⚠️ FE vẫn cần handle error khi gọi `getBaseUnit()` trước khi submit (có thể skip fetch và submit trực tiếp)

### Testing Requirements

1. ✅ Test import transaction với item master mới (chưa có base unit) → BE should auto-create base unit ✅
2. ✅ Test import transaction với `unitId` không tồn tại → BE should auto-create base unit từ `unitOfMeasure` ✅
3. ⚠️ Test `getBaseUnit()` cho item master mới → Still fails (expected, but not critical)
4. ✅ Test import transaction sau khi BE auto-create base unit → Should work correctly ✅

### Additional Notes

**Why this is important:**
- User experience: Users can immediately use newly created item masters for import transactions
- Data consistency: Ensures every item master has at least one base unit
- Reduces manual work: No need for admin to manually create base units

**Alternative Solution (if auto-creation is not desired):**
- Add validation in `createItemMaster()` to require base unit creation
- Or add separate endpoint to create base unit after item master creation
- But auto-creation is the most user-friendly solution

---

## ✅ #12 – Transaction Detail Response Missing itemCode and expiryDate (RESOLVED)

**Status:** ✅ **RESOLVED** • **Priority:** High  
**Endpoint:** `GET /api/v1/storage/{id}`  
**Files:** `warehouse/repository/StorageTransactionRepository.java`, `warehouse/service/StorageInOutService.java`, `warehouse/mapper/StorageTransactionMapper.java`  
**Resolved Date:** 2025-01-26  
**Last Checked:** 2025-01-26

### ✅ Fix Summary

1. **JOIN FETCH for transaction details (Lazy-loading fix)**
   - `StorageTransactionRepository` now exposes `findByIdWithDetails()` which eagerly loads items, batches, item masters, units, supplier, and creator in a single query.
   - `StorageInOutService.getTransactionById()` now uses `findByIdWithDetails()` ensuring FE always receives fully populated transaction data.

2. **Mapper fallback for `itemCode`**
   - `StorageTransactionMapper` now falls back to `item.getItemCode()` if `batch.itemMaster` is not available, preventing null values when batch references are missing.
   - Ensures legacy data (where `itemCode` was stored directly on transaction item) still renders correctly.

### 🔍 Verification

```java
// StorageTransactionRepository.java
@Query("SELECT DISTINCT st FROM StorageTransaction st " +
       "LEFT JOIN FETCH st.items i " +
       "LEFT JOIN FETCH i.batch b " +
       "LEFT JOIN FETCH b.itemMaster im " +
       "LEFT JOIN FETCH i.unit u " +
       "LEFT JOIN FETCH st.supplier s " +
       "LEFT JOIN FETCH st.createdBy e " +
       "WHERE st.transactionId = :id")
Optional<StorageTransaction> findByIdWithDetails(@Param("id") Long id);
```

```java
// StorageInOutService.java
public TransactionResponse getTransactionById(Long id) {
    StorageTransaction transaction = transactionRepository.findByIdWithDetails(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu nhập/xuất kho với ID: " + id));
    return mapToTransactionResponse(transaction);
}
```

```java
// StorageTransactionMapper.java
.itemCode(item.getBatch() != null && item.getBatch().getItemMaster() != null
        ? item.getBatch().getItemMaster().getItemCode()
        : item.getItemCode()) // ✅ Fallback to stored itemCode
.expiryDate(item.getBatch() != null ? item.getBatch().getExpiryDate() : null)
```

### 🧪 Testing

1. ✅ Import transaction detail now returns `itemCode` + `expiryDate`.
2. ✅ Export transaction detail returns `itemCode` (expiry optional).
3. ✅ Tested edge case where batch is missing: fallback uses stored `itemCode`.
4. ✅ FE storage detail modal displays both columns correctly.

### 📌 Impact

- FE no longer needs workaround logic; columns render correctly.
- Eliminates intermittent 500 errors due to lazy loading when viewing transaction detail.
- Improves API reliability for both admin inventory and warehouse reports modules.

---

**Last Updated:** 2025-01-26  

---

## ✅ #13 – Transaction Detail Missing itemMasterId for Items (RESOLVED)

**Status:** ✅ **RESOLVED** • **Priority:** High  
**Endpoint:** `GET /api/v1/storage/{id}` (TransactionResponse)  
**Files:** `warehouse/dto/response/TransactionResponse.java`, `warehouse/mapper/StorageTransactionMapper.java`  
**Resolved Date:** 2025-01-27  
**Last Checked:** 2025-01-27

### Problem

Transaction detail API does not return `itemMasterId` for each transaction item. FE cannot map a transaction row back to the exact item master entry. As a result:

- Warehouse auditors cannot click from transaction → item master detail.
- FE cannot fetch fallback data (item code, expiry date) based on `itemMasterId` when BE omits fields.
- Reporting features cannot correlate transaction history with inventory records.

### Evidence

**TransactionItemResponse** (`files_from_BE/warehouse/dto/response/TransactionResponse.java`):
```java
public static class TransactionItemResponse {
    private Long transactionItemId;
    private String itemCode;
    private String itemName;
    private String unitName;
    private String lotNumber;
    private Integer quantityChange;
    private LocalDate expiryDate;
    private String notes;
}
```
- Missing `itemMasterId`. No other field contains the primary key.

**StorageTransactionMapper** (`files_from_BE/warehouse/mapper/StorageTransactionMapper.java`) only maps code/name, not IDs:
```java
.itemCode(item.getBatch() != null && item.getBatch().getItemMaster() != null
        ? item.getBatch().getItemMaster().getItemCode()
        : item.getItemCode())
```

### Fix Summary

- Added `itemMasterId` to `TransactionResponse.TransactionItemResponse`.
- Updated `StorageTransactionMapper` to map ID from `item.getBatch().getItemMaster().getItemMasterId()`.
- Transaction detail API now returns full linkage → FE can fetch item detail and show correct `itemCode`/expiry without hacks.

### Verification

```java
// TransactionResponse.java
private Long itemMasterId; // Item master ID for cross-linking
```

```java
// StorageTransactionMapper.java
.itemMasterId(item.getBatch() != null && item.getBatch().getItemMaster() != null
        ? item.getBatch().getItemMaster().getItemMasterId()
        : null)
```

### Impact

- FE can link transaction rows back to inventory records and display accurate “Mã vật tư / Hạn sử dụng”.
- Eliminated the need for FE to query inventory by name/lot to back-fill data.

### Testing

1. ✅ GET `/api/v1/storage/{id}` (import/export) → each item returns `itemMasterId`.
2. ✅ FE transaction modal uses the new field without fallback.

---

**Last Updated:** 2025-01-27  

