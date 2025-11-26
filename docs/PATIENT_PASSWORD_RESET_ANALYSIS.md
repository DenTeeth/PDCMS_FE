# 🔐 PHÂN TÍCH CHỨC NĂNG ĐỔI MẬT KHẨU BẰNG EMAIL CHO BỆNH NHÂN

**Date**: 2025-01-26  
**Status**: ✅ **ĐÃ IMPLEMENTED** (một phần)  
**Priority**: High

---

## 📋 TỔNG QUAN

Hệ thống hỗ trợ đổi mật khẩu qua email cho bệnh nhân thông qua flow **Forgot Password** và **Password Reset**.

---

## ✅ CÁC THÀNH PHẦN ĐÃ CÓ

### 1. **Email Service** ✅

**File**: `files_from_BE/utils/EmailService.java`

#### Method: `sendPasswordResetEmail()`
- **Line 79-118**: Gửi email đặt lại mật khẩu
- **URL**: `{frontendUrl}/reset-password?token={token}`
- **Subject**: "Đặt lại mật khẩu - Phòng khám nha khoa"
- **Token Expiry**: 24 giờ
- **One-time use**: Token chỉ dùng được 1 lần

```java
@Async
public void sendPasswordResetEmail(String toEmail, String username, String token) {
    String resetUrl = frontendUrl + "/reset-password?token=" + token;
    // ... HTML email template
}
```

#### Method: `sendWelcomeEmailWithPasswordSetup()`
- **Line 127-200**: Gửi email chào mừng + setup password cho bệnh nhân mới
- **URL**: `{frontendUrl}/reset-password?token={token}` (cùng flow)
- **Subject**: "Chào mừng đến với Phòng khám nha khoa - Thiết lập mật khẩu"
- **Use Case**: Bệnh nhân mới tạo tài khoản, cần setup password lần đầu

---

### 2. **Password Reset Token Entity** ✅

**File**: `files_from_BE/account/domain/PasswordResetToken.java`

#### Features:
- ✅ Token tự động generate (UUID)
- ✅ Expiry: 24 giờ
- ✅ One-time use (track `usedAt`)
- ✅ Link với Account entity

```java
public PasswordResetToken(Account account) {
    this.tokenId = "PRT" + System.currentTimeMillis();
    this.token = UUID.randomUUID().toString();
    this.account = account;
    this.createdAt = LocalDateTime.now();
    this.expiresAt = this.createdAt.plusHours(24);
}
```

#### Helper Methods:
- `isExpired()`: Kiểm tra token đã hết hạn chưa
- `isUsed()`: Kiểm tra token đã được sử dụng chưa

---

### 3. **Password Reset Token Repository** ✅

**File**: `files_from_BE/account/repository/PasswordResetTokenRepository.java`

#### Methods:
- `findByToken(String token)`: Tìm token theo string
- `findByAccountAndUsedAtIsNull(Account account)`: Tìm token chưa dùng của account
- `deleteByAccount(Account account)`: Xóa tất cả token của account

---

### 4. **Account Entity** ✅

**File**: `files_from_BE/account/domain/Account.java`

#### Fields liên quan:
- ✅ `password`: Mật khẩu đã hash
- ✅ `mustChangePassword`: Flag bắt buộc đổi mật khẩu
- ✅ `passwordChangedAt`: Thời gian đổi mật khẩu lần cuối
- ✅ `isEmailVerified`: Trạng thái xác thực email
- ✅ `status`: AccountStatus (ACTIVE, PENDING_VERIFICATION, LOCKED)

---

## 🔄 FLOW ĐỔI MẬT KHẨU

### Flow 1: Forgot Password (Quên mật khẩu)

```
1. User nhập email → POST /api/v1/auth/forgot-password
2. BE tìm account theo email
3. BE tạo PasswordResetToken
4. BE gửi email với link reset-password?token={token}
5. User click link → FE hiển thị form đổi mật khẩu
6. User nhập mật khẩu mới → POST /api/v1/auth/reset-password
7. BE validate token (chưa hết hạn, chưa dùng)
8. BE update password + đánh dấu token đã dùng
9. User có thể login với mật khẩu mới
```

### Flow 2: Password Setup (Thiết lập mật khẩu lần đầu)

```
1. Admin tạo bệnh nhân mới với email
2. BE tự động tạo account với status=PENDING_VERIFICATION
3. BE tạo PasswordResetToken
4. BE gửi welcome email với link setup password
5. Bệnh nhân click link → FE hiển thị form setup password
6. Bệnh nhân nhập mật khẩu → POST /api/v1/auth/reset-password
7. BE update password + set mustChangePassword=false
8. Bệnh nhân có thể login
```

---

## ✅ XÁC NHẬN TỪ SECURITY CONFIG

### **Endpoints đã được cấu hình trong SecurityConfig.java** ✅

**File**: `files_from_BE/config/SecurityConfig.java`

#### Public Endpoints (Line 98-104):
```java
// Public endpoints - Email verification & password reset
.requestMatchers(mvc.pattern("/api/v1/auth/verify-email")).permitAll()
.requestMatchers(mvc.pattern("/api/v1/auth/resend-verification")).permitAll()
.requestMatchers(mvc.pattern("/api/v1/auth/forgot-password")).permitAll()
.requestMatchers(mvc.pattern("/api/v1/auth/reset-password")).permitAll()
```

**Xác nhận:**
- ✅ `/api/v1/auth/forgot-password` - **PUBLIC** (không cần authentication)
- ✅ `/api/v1/auth/reset-password` - **PUBLIC** (không cần authentication)
- ✅ `/api/v1/auth/verify-email` - **PUBLIC** (email verification)
- ✅ `/api/v1/auth/resend-verification` - **PUBLIC** (resend verification email)

**Security Features:**
- ✅ CSRF disabled (phù hợp cho REST API)
- ✅ CORS enabled (cho phép FE gọi API)
- ✅ JWT Resource Server configured
- ✅ Password encoder: BCryptPasswordEncoder

---

## ❌ CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN

### 1. **Thiếu Authentication Controller Implementation**

**Vấn đề:**
- Endpoints đã được cấu hình trong `SecurityConfig.java` ✅
- Nhưng chưa tìm thấy `AuthenticationController.java` trong `files_from_BE`
- Không thể verify implementation logic của các endpoints

**Giải pháp:**
- Cần BE cung cấp `AuthenticationController.java` để verify implementation
- Hoặc test trực tiếp API endpoint để confirm behavior

---

### 2. **Thiếu Endpoint Resend Password Setup Email**

**Vấn đề:**
- Không có endpoint để resend password setup email
- Nếu bệnh nhân không nhận được email, không có cách nào resend
- Đã được ghi nhận trong `BE_OPEN_ISSUES.md` #5

**Giải pháp:**
- Cần implement `POST /api/v1/auth/resend-password-setup`
- Hoặc dùng `POST /api/v1/auth/forgot-password` (nếu BE hỗ trợ)

---

### 3. **Token Type Không Phân Biệt**

**Vấn đề:**
- `PasswordResetToken` dùng chung cho cả:
  - Password reset (quên mật khẩu)
  - Password setup (thiết lập lần đầu)
- Không có field `tokenType` để phân biệt
- Email template khác nhau nhưng token logic giống nhau

**Giải pháp:**
- Có thể thêm `tokenType` enum (SETUP, RESET)
- Hoặc giữ nguyên (đơn giản hơn)

---

### 4. **Email Service Configuration**

**Vấn đề:**
- SMTP settings có thể chưa được config trong `application.yml`
- Email failures chỉ log, không báo lỗi rõ ràng cho FE
- Nếu email service down, bệnh nhân không thể nhận email

**Giải pháp:**
- Cần verify SMTP config
- Cải thiện error handling để FE biết email có gửi thành công không

---

## 📝 API ENDPOINTS (Dựa trên FE code)

### 1. **POST /api/v1/auth/forgot-password**

**Request:**
```json
{
  "email": "patient@example.com"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Password reset email sent successfully",
  "data": {
    "message": "Email đã được gửi. Vui lòng kiểm tra hộp thư."
  }
}
```

**Logic (Expected):**
1. Tìm account theo email
2. Tạo PasswordResetToken
3. Gửi email với `sendPasswordResetEmail()`
4. Return success (không expose token)

---

### 2. **POST /api/v1/auth/reset-password**

**Request:**
```json
{
  "token": "uuid-token-string",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": {
    "message": "Mật khẩu đã được đặt lại thành công"
  }
}
```

**Logic (Expected):**
1. Validate token (tồn tại, chưa hết hạn, chưa dùng)
2. Validate password (strength, match)
3. Hash password mới
4. Update account password
5. Set `mustChangePassword = false`
6. Set `passwordChangedAt = now()`
7. Mark token as used (`usedAt = now()`)
8. Return success

---

### 3. **POST /api/v1/auth/resend-password-setup** ❌

**Status**: **NOT IMPLEMENTED**

**Request:**
```json
{
  "email": "patient@example.com"
}
```

**Logic (Expected):**
1. Tìm account theo email
2. Check `status = PENDING_VERIFICATION`
3. Xóa token cũ (nếu có)
4. Tạo token mới
5. Gửi welcome email với `sendWelcomeEmailWithPasswordSetup()`

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Forgot Password - Happy Path
- [ ] Gửi request với email hợp lệ
- [ ] Nhận email với link reset password
- [ ] Click link → Form hiển thị đúng
- [ ] Nhập mật khẩu mới → Thành công
- [ ] Login với mật khẩu mới → OK

### Test Case 2: Forgot Password - Invalid Email
- [ ] Gửi request với email không tồn tại
- [ ] Nhận error message phù hợp (không expose thông tin)

### Test Case 3: Reset Password - Expired Token
- [ ] Tạo token
- [ ] Đợi > 24 giờ
- [ ] Thử reset password → Error "Token expired"

### Test Case 4: Reset Password - Used Token
- [ ] Tạo token
- [ ] Reset password thành công
- [ ] Thử dùng lại token → Error "Token already used"

### Test Case 5: Password Setup - New Patient
- [ ] Tạo bệnh nhân mới với email
- [ ] Nhận welcome email
- [ ] Click link → Setup password
- [ ] Login thành công

### Test Case 6: Resend Password Setup Email ❌
- [ ] Gọi endpoint resend (nếu có)
- [ ] Nhận email mới
- [ ] Token cũ không còn valid

---

## 🔍 VERIFICATION REQUIRED

### 1. **Authentication Controller** ✅ (Security Config Verified)
- [x] ✅ Verify `POST /api/v1/auth/forgot-password` exists in SecurityConfig
- [x] ✅ Verify `POST /api/v1/auth/reset-password` exists in SecurityConfig
- [ ] ⏳ Verify `AuthenticationController.java` implementation
- [ ] ⏳ Verify request/response DTOs
- [ ] ⏳ Verify error handling logic

### 2. **Authentication Service**
- [ ] Verify `forgotPassword()` method
- [ ] Verify `resetPassword()` method
- [ ] Verify token validation logic
- [ ] Verify password strength validation

### 3. **Email Configuration**
- [ ] Verify SMTP settings in `application.yml`
- [ ] Test email sending locally
- [ ] Verify `frontendUrl` config

### 4. **Security**
- [ ] Verify token không bị expose trong response
- [ ] Verify rate limiting (tránh spam)
- [ ] Verify password strength requirements
- [ ] Verify token expiry enforcement

---

## 📊 SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| Email Service | ✅ Implemented | Có 2 methods: reset + setup |
| PasswordResetToken | ✅ Implemented | Entity + Repository đầy đủ |
| Account Entity | ✅ Implemented | Có đủ fields cần thiết |
| Security Config | ✅ Configured | Endpoints đã được permitAll |
| Forgot Password Endpoint | ✅ Configured | Public endpoint, cần verify implementation |
| Reset Password Endpoint | ✅ Configured | Public endpoint, cần verify implementation |
| Resend Setup Email | ❌ Missing | Đã ghi trong BE_OPEN_ISSUES #5 |
| Email Config | ⚠️ Unknown | Cần verify SMTP settings |

---

## 🎯 RECOMMENDATIONS

### Priority 1: Verify Endpoints
1. **Test API endpoints:**
   ```bash
   # Test forgot password
   curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   
   # Test reset password
   curl -X POST http://localhost:8080/api/v1/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token": "token-here", "newPassword": "NewPass123!", "confirmPassword": "NewPass123!"}'
   ```

2. **Check Swagger UI:**
   - Mở `http://localhost:8080/swagger-ui.html`
   - Tìm `/api/v1/auth` endpoints
   - Verify request/response schemas

### Priority 2: Implement Resend Endpoint
- Thêm `POST /api/v1/auth/resend-password-setup`
- Hoặc mở rộng `forgot-password` để hỗ trợ `PENDING_VERIFICATION` accounts

### Priority 3: Improve Error Handling
- Return clear error messages
- Log email failures properly
- Surface email sending status to FE (optional)

---

## 📞 NEXT STEPS

1. **Request từ BE:**
   - Cung cấp `AuthenticationController.java`
   - Cung cấp `AuthenticationService.java`
   - Verify API endpoints hoạt động

2. **Test Integration:**
   - Test forgot password flow end-to-end
   - Test reset password flow end-to-end
   - Test password setup flow end-to-end

3. **Documentation:**
   - Update API documentation
   - Create user guide for password reset
   - Document email templates

---

---

## 📝 UPDATE LOG

### 2025-01-26 - Security Config Verification
- ✅ Verified endpoints trong `SecurityConfig.java`
- ✅ Confirmed `/api/v1/auth/forgot-password` và `/api/v1/auth/reset-password` là PUBLIC
- ✅ Security configuration đầy đủ (CORS, JWT, BCrypt)
- ⏳ Pending: AuthenticationController implementation verification

---

**Last Updated**: 2025-01-26  
**Reviewed By**: AI Assistant  
**Status**: ✅ **SECURITY CONFIG VERIFIED** | ⏳ **PENDING IMPLEMENTATION VERIFICATION**

