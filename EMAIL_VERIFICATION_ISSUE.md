# Email Verification Flow Issue

## 🔍 Vấn đề phát hiện

BE báo rằng: **"Khi tạo account mới, chủ tài khoản sẽ xác thực email để đặt mật khẩu"**

Nhưng trong code hiện tại:

### ✅ Patient Account Creation (CÓ email verification)
**File:** `files_from_BE/patient/service/PatientService.java` (Line 212-233)

```java
// Create account for patient (NEW accounts require email verification)
account.setStatus(AccountStatus.PENDING_VERIFICATION); // NEW: Require email verification
account.setMustChangePassword(true); // Force password change on first login

// Create and send verification token
AccountVerificationToken verificationToken = new AccountVerificationToken(account);
verificationTokenRepository.save(verificationToken);

// Send verification email asynchronously
emailService.sendVerificationEmail(account.getEmail(), account.getUsername(), verificationToken.getToken());
```

**Flow:**
1. Account được tạo với status `PENDING_VERIFICATION`
2. Gửi verification email với token
3. User phải click link trong email để verify
4. Sau khi verify, account chuyển sang `ACTIVE`
5. User phải đổi password lần đầu khi login

### ❌ Employee Account Creation (KHÔNG có email verification)
**File:** `files_from_BE/employee/service/EmployeeService.java` (Line 333-348)

```java
// Create new account for employee
Account account = new Account();
account.setUsername(request.getUsername());
account.setEmail(request.getEmail());
account.setPassword(passwordEncoder.encode(request.getPassword()));
account.setStatus(AccountStatus.ACTIVE); // ❌ Set ACTIVE ngay, không cần verification
account.setCreatedAt(java.time.LocalDateTime.now());

// ❌ KHÔNG có code để:
// - Tạo verification token
// - Gửi verification email
// - Set mustChangePassword
```

**Flow hiện tại:**
1. Account được tạo với status `ACTIVE` ngay lập tức
2. KHÔNG gửi verification email
3. User có thể login ngay với password được admin set

---

## 🎯 Vấn đề

**Inconsistency:** Patient cần email verification, nhưng Employee thì không.

**BE yêu cầu:** Tất cả account mới đều cần email verification để đặt mật khẩu.

---

## 💡 Giải pháp đề xuất

### Option 1: Employee cũng cần email verification (Recommended)

**Thay đổi BE:** `files_from_BE/employee/service/EmployeeService.java`

```java
// Create new account for employee (REQUIRE email verification)
Account account = new Account();
account.setUsername(request.getUsername());
account.setEmail(request.getEmail());
account.setPassword(passwordEncoder.encode(request.getPassword()));
account.setStatus(AccountStatus.PENDING_VERIFICATION); // ✅ Change to PENDING_VERIFICATION
account.setMustChangePassword(true); // ✅ Force password change on first login
account.setCreatedAt(java.time.LocalDateTime.now());

// Assign role to account (single role)
account.setRole(role);

account = accountRepository.save(account);
account.setAccountCode(codeGenerator.generateAccountCode(account.getAccountId()));
account = accountRepository.save(account);
log.info("Created account with ID: {} and code: {} for employee (PENDING_VERIFICATION)",
        account.getAccountId(), account.getAccountCode());

// ✅ Create and send verification token
AccountVerificationToken verificationToken = new AccountVerificationToken(account);
verificationTokenRepository.save(verificationToken);

// ✅ Send verification email asynchronously
emailService.sendVerificationEmail(account.getEmail(), account.getUsername(), verificationToken.getToken());
log.info("✅ Verification email sent to: {}", account.getEmail());
```

**Cần thêm dependencies:**
- `AccountVerificationTokenRepository verificationTokenRepository`
- `EmailService emailService`

### Option 2: Patient không cần email verification (Không recommended)

Nếu muốn cả 2 đều không cần verification, nhưng điều này không phù hợp với yêu cầu của BE.

---

## 📋 Checklist để fix

### BE Changes
- [ ] Update `EmployeeService.createEmployee()` để set status = `PENDING_VERIFICATION`
- [ ] Add `setMustChangePassword(true)`
- [ ] Create `AccountVerificationToken` và save
- [ ] Send verification email
- [ ] Add dependencies: `AccountVerificationTokenRepository`, `EmailService`
- [ ] Update log messages

### FE Changes (nếu cần)
- [ ] Update UI message khi tạo employee: "Verification email sẽ được gửi đến email của employee"
- [ ] Update success message: "Employee đã được tạo. Verification email đã được gửi đến {email}"
- [ ] Có thể thêm thông báo về việc employee cần verify email trước khi login

---

## 🔗 Related Files

### BE Files
- `files_from_BE/employee/service/EmployeeService.java` - Cần update
- `files_from_BE/patient/service/PatientService.java` - Đã đúng (reference)
- `files_from_BE/account/domain/AccountVerificationToken.java` - Entity
- `files_from_BE/account/repository/AccountVerificationTokenRepository.java` - Repository
- `files_from_BE/utils/EmailService.java` - Email service
- `files_from_BE/authentication/service/AuthenticationService.java` - Verification logic

### FE Files (nếu cần update)
- `src/app/admin/accounts/employees/page.tsx` - Create employee form
- `src/app/admin/accounts/users/page.tsx` - Create patient form (đã đúng)

---

## 📝 Notes

1. **Email verification flow:**
   - User nhận email với verification link
   - Click link → Verify email → Account status chuyển sang `ACTIVE`
   - User login lần đầu → Phải đổi password (vì `mustChangePassword = true`)

2. **Login với unverified account:**
   - BE sẽ throw `AccountNotVerifiedException` nếu account status = `PENDING_VERIFICATION`
   - Error message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản."

3. **Verification token:**
   - Token expires sau 24 giờ
   - Có thể resend verification email qua API `/api/v1/auth/resend-verification`

---

## ✅ Recommendation

**Nên implement Option 1** để:
- Đảm bảo tính nhất quán giữa Employee và Patient
- Tuân thủ yêu cầu của BE về email verification
- Tăng tính bảo mật (user phải verify email mới có thể login)
- User tự đặt password lần đầu (thay vì dùng password admin set)

