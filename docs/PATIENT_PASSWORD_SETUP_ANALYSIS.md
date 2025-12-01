# 🔐 PHÂN TÍCH CHỨC NĂNG SETUP MẬT KHẨU CHO BỆNH NHÂN

**Date**: 2025-01-26  
**Status**: ✅ **IMPLEMENTED** (Email sending failed - SMTP config issue)  
**Priority**: High

---

## 📋 TỔNG QUAN

Hệ thống hỗ trợ setup mật khẩu cho bệnh nhân mới thông qua email. Flow hoạt động đúng nhưng **email không được gửi** do lỗi SMTP configuration.

---

## ✅ FLOW HOẠT ĐỘNG (ĐÃ IMPLEMENTED)

### **Step 1: Tạo Bệnh Nhân Mới**

**File**: `files_from_BE/patient/service/PatientService.java` (Line 191-294)

```java
@PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + CREATE_PATIENT + "')")
@Transactional
public PatientInfoResponse createPatient(CreatePatientRequest request) {
    // 1. Check email provided
    if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
        
        // 2. Auto-generate username from email (if not provided)
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = request.getEmail().split("@")[0];
            // Make unique by adding counter if needed
        }
        
        // 3. Create account with TEMPORARY PASSWORD
        String temporaryPassword = UUID.randomUUID().toString();
        Account account = new Account();
        account.setUsername(username);
        account.setEmail(request.getEmail());
        account.setPassword(passwordEncoder.encode(temporaryPassword));
        account.setStatus(AccountStatus.PENDING_VERIFICATION);
        account.setMustChangePassword(true);
        account.setRole(patientRole);
        
        // 4. Save account
        account = accountRepository.save(account);
        
        // 5. Create PasswordResetToken
        PasswordResetToken setupToken = new PasswordResetToken(account);
        passwordResetTokenRepository.save(setupToken);
        
        // 6. Send welcome email with password setup link
        try {
            emailService.sendWelcomeEmailWithPasswordSetup(
                account.getEmail(),
                patientName,
                setupToken.getToken()
            );
            log.info("✅ Welcome email with password setup link sent to: {}", account.getEmail());
            
        } catch (Exception e) {
            // ⚠️ Email failed but patient creation continues
            log.error("⚠️ Failed to send welcome email to {}: {}", account.getEmail(), e.getMessage(), e);
            log.warn("⚠️ Patient account created successfully, but email not sent. Manual password setup may be required.");
            log.warn("⚠️ Possible causes: SMTP server not configured, network error, invalid email address");
            // Don't throw exception - allow patient creation to succeed
        }
    }
    
    // 7. Create patient entity and link account
    Patient patient = patientMapper.toPatient(request);
    patient.setAccount(account);
    return patientRepository.save(patient);
}
```

**✅ Điểm mạnh:**
- Email failure không block patient creation
- Account vẫn được tạo với `PENDING_VERIFICATION` status
- Token vẫn được tạo (có thể dùng sau để resend email)

---

### **Step 2: Bệnh Nhân Nhận Email**

**File**: `files_from_BE/utils/EmailService.java` (Line 127-200)

```java
@Async
public void sendWelcomeEmailWithPasswordSetup(String toEmail, String patientName, String token) {
    String setupPasswordUrl = frontendUrl + "/reset-password?token=" + token;
    
    // HTML email template với link setup password
    // Subject: "Chào mừng đến với Phòng khám nha khoa - Thiết lập mật khẩu"
}
```

**URL trong email**: `{frontendUrl}/reset-password?token={token}`

---

### **Step 3: Bệnh Nhân Setup Password**

**Endpoint**: `POST /api/v1/auth/reset-password`

**File**: `files_from_BE/authentication/service/AuthenticationService.java` (Line 675-707)

```java
public void resetPassword(String token, String newPassword, String confirmPassword) {
    // 1. Validate passwords match
    if (!newPassword.equals(confirmPassword)) {
        throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
    }
    
    // 2. Find token
    PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
        .orElseThrow(() -> new InvalidTokenException("Token đặt lại mật khẩu không hợp lệ"));
    
    // 3. Check token not expired
    if (resetToken.isExpired()) {
        throw new TokenExpiredException("Token đặt lại mật khẩu đã hết hạn");
    }
    
    // 4. Check token not used
    if (resetToken.isUsed()) {
        throw new InvalidTokenException("Token này đã được sử dụng");
    }
    
    // 5. Update password
    Account account = resetToken.getAccount();
    account.setPassword(passwordEncoder.encode(newPassword));
    account.setPasswordChangedAt(LocalDateTime.now());
    account.setMustChangePassword(false); // ✅ Password has been changed
    accountRepository.save(account);
    
    // 6. Mark token as used
    resetToken.setUsedAt(LocalDateTime.now());
    passwordResetTokenRepository.save(resetToken);
    
    log.info("✅ Password reset successfully for account: {}", account.getUsername());
}
```

**✅ Validation:**
- Token phải tồn tại
- Token chưa hết hạn (24 giờ)
- Token chưa được sử dụng
- Passwords phải match

---

## ❌ PHÂN TÍCH LỖI SMTP

### **Error từ Log:**

```
at org.eclipse.angus.mail.smtp.SMTPTransport.protocolConnect(SMTPTransport.java:769)
at jakarta.mail.Service.connect(Service.java:345)
at org.springframework.mail.javamail.JavaMailSenderImpl.connectTransport(JavaMailSenderImpl.java:480)
at org.springframework.mail.javamail.JavaMailSenderImpl.doSend(JavaMailSenderImpl.java:399)

2025-11-27T00:47:36.535+07:00  WARN: ⚠️ Patient account created successfully, but email not sent. Manual password setup may be required.
2025-11-27T00:47:36.535+07:00  WARN: ⚠️ Possible causes: SMTP server not configured, network error, invalid email address
```

### **Root Cause:**

**SMTP Connection Failed** - Không thể kết nối đến SMTP server

**Các nguyên nhân có thể:**

1. **SMTP Configuration Missing** ⚠️ (Most Likely)
   - `spring.mail.host` chưa được config
   - `spring.mail.port` chưa được config
   - `spring.mail.username` chưa được config
   - `spring.mail.password` chưa được config

2. **SMTP Authentication Failed**
   - Username/password sai
   - Gmail App Password chưa được tạo (nếu dùng Gmail)
   - 2FA chưa được enable

3. **Network/Firewall Issue**
   - Port 587 (TLS) hoặc 465 (SSL) bị block
   - Firewall chặn SMTP connection
   - Proxy settings chưa config

4. **SMTP Server Unreachable**
   - SMTP server down
   - DNS resolution failed
   - Timeout

---

## 🔧 GIẢI PHÁP

### **Solution 1: Configure SMTP Settings (Recommended)**

**File**: `application.yml` hoặc `application.properties`

#### **Option A: Gmail SMTP**

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:your-email@gmail.com}
    password: ${MAIL_PASSWORD:your-app-password}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000
    test-connection: false # Don't fail app startup if mail server unreachable
```

**Gmail Setup Steps:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (16 characters) instead of regular password

#### **Option B: Outlook/Hotmail SMTP**

```yaml
spring:
  mail:
    host: smtp-mail.outlook.com
    port: 587
    username: ${MAIL_USERNAME:your-email@outlook.com}
    password: ${MAIL_PASSWORD:your-password}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

#### **Option C: Custom SMTP Server**

```yaml
spring:
  mail:
    host: ${MAIL_HOST:smtp.example.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
          ssl:
            trust: ${MAIL_SSL_TRUST:*}
```

---

### **Solution 2: Environment Variables (Production)**

**Set environment variables:**

```bash
# Windows
set MAIL_USERNAME=your-email@gmail.com
set MAIL_PASSWORD=your-app-password

# Linux/Mac
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

**Or in `application.yml`:**

```yaml
spring:
  mail:
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
```

---

### **Solution 3: Test Email Configuration**

**Create test endpoint:**

```java
@RestController
@RequestMapping("/api/v1/test")
public class EmailTestController {
    
    @Autowired
    private EmailService emailService;
    
    @PostMapping("/send-test-email")
    public ResponseEntity<String> sendTestEmail(@RequestParam String toEmail) {
        try {
            emailService.sendSimpleEmail(
                toEmail,
                "Test Email",
                "This is a test email from Dental Clinic Management System"
            );
            return ResponseEntity.ok("Test email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body("Failed to send email: " + e.getMessage());
        }
    }
}
```

---

### **Solution 4: Improve Error Handling (Optional)**

**Current behavior**: Email failure is logged but patient creation succeeds ✅

**Enhancement**: Return warning in response

```java
// In PatientService.createPatient()
try {
    emailService.sendWelcomeEmailWithPasswordSetup(...);
    log.info("✅ Welcome email sent");
} catch (Exception e) {
    log.error("⚠️ Email failed", e);
    // Option: Add warning to response
    response.addWarning("Email không thể gửi được. Vui lòng liên hệ admin để kích hoạt tài khoản.");
}
```

---

## 📊 VERIFICATION CHECKLIST

### **1. SMTP Configuration**

- [ ] `spring.mail.host` configured
- [ ] `spring.mail.port` configured (587 for TLS, 465 for SSL)
- [ ] `spring.mail.username` configured
- [ ] `spring.mail.password` configured
- [ ] `spring.mail.properties.mail.smtp.auth=true`
- [ ] `spring.mail.properties.mail.smtp.starttls.enable=true`

### **2. Gmail Specific (if using Gmail)**

- [ ] 2-Factor Authentication enabled
- [ ] App Password generated
- [ ] Using App Password (not regular password)

### **3. Network/Firewall**

- [ ] Port 587 (TLS) or 465 (SSL) not blocked
- [ ] Firewall allows SMTP connection
- [ ] DNS resolution works (can resolve smtp.gmail.com)

### **4. Test Email Sending**

- [ ] Test endpoint works
- [ ] Can send simple email
- [ ] Can send welcome email with password setup link
- [ ] Email received in inbox (check spam folder)

---

## 🧪 TESTING

### **Test 1: Create Patient with Email**

```bash
POST /api/v1/patients
Content-Type: application/json

{
  "username": "testpatient",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "Patient",
  "phone": "0123456789",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE"
}
```

**Expected:**
- ✅ 201 Created
- ✅ Account created with `PENDING_VERIFICATION` status
- ✅ PasswordResetToken created
- ✅ Email sent (if SMTP configured)
- ⚠️ Warning log if email fails (but patient still created)

---

### **Test 2: Check Email Received**

**Check inbox:**
- Subject: "Chào mừng đến với Phòng khám nha khoa - Thiết lập mật khẩu"
- Contains: Link `/reset-password?token={token}`
- Token valid for 24 hours

---

### **Test 3: Setup Password**

```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "token-from-email",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Expected:**
- ✅ 200 OK
- ✅ Password updated
- ✅ `mustChangePassword = false`
- ✅ Token marked as used
- ✅ Can login with new password

---

## 📝 SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| Patient Creation Flow | ✅ **WORKING** | Account created successfully |
| PasswordResetToken Creation | ✅ **WORKING** | Token created and saved |
| Email Service | ⚠️ **FAILING** | SMTP connection error |
| Error Handling | ✅ **GOOD** | Patient creation doesn't fail |
| Reset Password Endpoint | ✅ **WORKING** | Ready to use once email sent |
| SMTP Configuration | ❌ **MISSING** | Need to configure |

---

## 🎯 ACTION ITEMS

### **Priority 1: Configure SMTP (Critical)**

1. **Add SMTP config to `application.yml`:**
   ```yaml
   spring:
     mail:
       host: smtp.gmail.com
       port: 587
       username: ${MAIL_USERNAME}
       password: ${MAIL_PASSWORD}
       properties:
         mail:
           smtp:
             auth: true
             starttls:
               enable: true
   ```

2. **Set environment variables:**
   ```bash
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   ```

3. **Test email sending:**
   - Create test patient
   - Check email received
   - Verify link works

### **Priority 2: Verify Flow End-to-End**

1. Create patient with email
2. Check email received
3. Click link → Setup password
4. Login with new password

### **Priority 3: Add Resend Email Endpoint (Optional)**

**Current**: No way to resend password setup email if patient didn't receive it

**Solution**: Add `POST /api/v1/auth/resend-password-setup` (already documented in BE_OPEN_ISSUES.md #5)

---

## 📞 SUPPORT

**For BE Team:**
- Configure SMTP settings in `application.yml`
- Test email sending with test endpoint
- Verify Gmail App Password if using Gmail

**For FE Team:**
- Patient creation works (account created)
- Need to handle case where email not sent (show warning to admin)
- Reset password endpoint ready to use

**For QA Team:**
- Test patient creation with email
- Verify email received
- Test password setup flow
- Test login after password setup

---

**Last Updated**: 2025-01-26  
**Status**: ✅ **FLOW IMPLEMENTED** | ❌ **SMTP CONFIGURATION REQUIRED**

