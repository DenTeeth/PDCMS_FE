# BE Open Issues (2025-01-26)

> ⚠️ **Items below require BE follow-up.**  
> Only active/open issues are listed. Resolved issues have been removed.

---

## 📊 Summary

| # | Issue | Status | Priority | Owner | Est. Effort |
|---|-------|--------|----------|-------|-------------|
| 5 | Patient Account Creation & Email Verification Workflow | 🟡 Partial | High | BE | 2-3h |
| 9 | Warehouse Import/Export - EMPLOYEE_NOT_FOUND Error | 🔴 Open | Critical | BE | 1-2h |

**Note:** Issues #1, #2, #3, #4, #6 were resolved in BE V23/V24. Details available in `docs/FE_ISSUES_FIX_REPORT_V23_V24.md`.

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

## #9 – Warehouse Import/Export - EMPLOYEE_NOT_FOUND Error

**Status:** 🔴 **OPEN** • **Priority:** Critical  
**Endpoint:** `POST /api/v1/inventory/import`, `POST /api/v1/inventory/export`  
**Files:** `warehouse/service/ImportTransactionService.java`, `warehouse/service/ExportTransactionService.java`, `warehouse/controller/InventoryController.java`, DB seed scripts  
**Last Checked:** 2025-01-26

### Problem

Khi submit import/export transaction, BE trả về lỗi **500 Internal Server Error** hoặc **404 EMPLOYEE_NOT_FOUND**:

**Error Response:**
```json
{
  "statusCode": 500,
  "error": "error.internal",
  "message": "Internal server error",
  "data": null
}
```

**Hoặc:**
```json
{
  "statusCode": 404,
  "error": "EMPLOYEE_NOT_FOUND",
  "message": "Employee with code {username} not found or inactive"
}
```

### Root Cause

1. **BE lấy `employeeCode` từ JWT token:**
   ```java
   String employeeCode = SecurityUtil.getCurrentUserLogin()
       .orElseThrow(() -> new RuntimeException("Cannot determine current user"));
   ```

2. **BE tìm employee bằng `employeeCode`:**
   ```java
   Employee employee = employeeRepository.findByEmployeeCodeAndIsActiveTrue(employeeCode)
       .orElseThrow(() -> new NotFoundException(
           "EMPLOYEE_NOT_FOUND",
           "Employee with code " + employeeCode + " not found or inactive"));
   ```

3. **Vấn đề:**
   - `SecurityUtil.getCurrentUserLogin()` trả về **username** từ JWT token (ví dụ: "admin")
   - BE tìm employee với `employeeCode = username`
   - Nếu không có employee record với `employeeCode = "admin"` → Lỗi 404
   - Hoặc employee có `isActive = false` → Lỗi 404

### Verification

**Checked:** `files_from_BE/warehouse/service/ImportTransactionService.java` (line 89-92):
- ✅ BE code đúng: `findByEmployeeCodeAndIsActiveTrue(employeeCode)`
- ❌ **Vấn đề:** Không có employee record với `employeeCode = username` trong DB

**Checked:** `files_from_BE/warehouse/service/ExportTransactionService.java` (line 71-74):
- ✅ BE code đúng: `findOneByEmployeeCode(employeeCode)`
- ❌ **Vấn đề:** Không có employee record với `employeeCode = username` trong DB

**Checked:** `files_from_BE/warehouse/controller/InventoryController.java`:
- ✅ Import (line 274-275): `SecurityUtil.getCurrentUserLogin()`
- ✅ Export (line 324-325): `SecurityUtil.getCurrentUserLogin()`
- ❌ **Vấn đề:** Username trong token không match với `employeeCode` trong DB

### Required Permissions

**API 6.4 - Import Transaction:**
- ✅ Permission: `IMPORT_ITEMS` (đã đúng trong `@PreAuthorize`)
- ✅ Endpoint: `POST /api/v1/inventory/import`
- ✅ Controller: `InventoryController.createImportTransaction()`

**API 6.5 - Export Transaction:**
- ✅ Permission: `EXPORT_ITEMS` (cần kiểm tra)
- ✅ Endpoint: `POST /api/v1/inventory/export`
- ✅ Controller: `InventoryController.createExportTransaction()`

### Required Fixes

**Priority 1: Seed Employee Data (Critical)**

BE cần đảm bảo:
1. ✅ Admin user có employee record tương ứng
2. ✅ Employee record có `employeeCode = username` (ví dụ: `employeeCode = "admin"`)
3. ✅ Employee record có `isActive = true`
4. ✅ Employee record có `account` link đến account của user

**Seed Data Example:**
```sql
-- Ensure admin user has employee record
INSERT INTO employees (
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    is_active,
    account_id,
    created_at,
    updated_at
) VALUES (
    'admin',  -- Must match username in accounts table
    'System',
    'Administrator',
    'admin@clinic.com',
    '0123456789',
    true,
    (SELECT account_id FROM accounts WHERE username = 'admin'),
    NOW(),
    NOW()
) ON CONFLICT (employee_code) DO UPDATE SET
    is_active = true,
    account_id = (SELECT account_id FROM accounts WHERE username = 'admin');
```

**Priority 2: Update Employee Service (Optional - Better Solution)**

Nếu BE muốn linh hoạt hơn, có thể:
1. Tìm employee bằng `account.username` thay vì `employeeCode`
2. Hoặc tự động tạo employee record khi tạo account (nếu chưa có)

```java
// Option 1: Find by account username
Account account = accountRepository.findOneByUsername(username)
    .orElseThrow(() -> new NotFoundException("ACCOUNT_NOT_FOUND", "Account not found"));

Employee employee = employeeRepository.findByAccount(account)
    .orElseThrow(() -> new NotFoundException(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found for account: " + username));
```

### Impact

- **BLOCKER:** Không thể tạo import/export transaction
- **BLOCKER:** Warehouse module không hoạt động được
- **BLOCKER:** User có permission nhưng vẫn bị lỗi 404

### Testing Requirements

1. ✅ Test với admin user có employee record → Should work
2. ❌ Test với admin user không có employee record → Currently fails (404)
3. ❌ Test với employee `isActive = false` → Currently fails (404)
4. ❌ Test với employee `employeeCode != username` → Currently fails (404)

### Additional Notes

**Relationship between Account and Employee:**
- `accounts.username` → JWT token subject
- `employees.employee_code` → Must match `accounts.username` (hoặc link qua `account_id`)
- `employees.is_active` → Must be `true`

**Recommendation:**
- BE nên seed employee data cho tất cả admin/manager users
- Hoặc BE nên tự động tạo employee record khi tạo account (nếu chưa có)
- Hoặc BE nên tìm employee bằng `account` thay vì `employeeCode` để linh hoạt hơn

---

**Last Updated:** 2025-01-26  

