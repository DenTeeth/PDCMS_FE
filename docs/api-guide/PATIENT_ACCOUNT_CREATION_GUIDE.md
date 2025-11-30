# 👤 Patient Account Creation Guide (V23/V24)

## 📋 Overview

Guide for Frontend team on how to create patient accounts following hospital standard workflow where:

- ✅ Staff provides **username** (not password)
- ✅ Patient sets their own **password** via email verification
- ✅ Staff **NEVER** sees or knows patient's password

---

## 🔄 Workflow Diagram

```
┌─────────────┐
│   STAFF     │
│ (Lễ Tân)    │
└──────┬──────┘
       │
       │ 1. Creates patient record
       │    - Enters: username (e.g., "nguyenvana", "BN001")
       │    - Enters: patient info (name, email, phone, etc.)
       │    - Does NOT enter password ❌
       │
       ▼
┌──────────────────┐
│    BACKEND       │
│                  │
│ 2. Auto-creates  │
│    account       │
│    - Generates   │
│      temp pwd    │
│    - Status:     │
│      PENDING     │
└─────────┬────────┘
          │
          │ 3. Sends welcome email
          │    with setup link
          │
          ▼
    ┌─────────┐
    │ PATIENT │
    │         │
    │ 4. Clicks link      │
    │ 5. Verifies email   │
    │ 6. Sets password    │
    │ 7. Can login ✅     │
    └─────────────────────┘
```

---

## 🔧 API Request Format

### ✅ CORRECT (V23/V24)

**Endpoint**: `POST /api/v1/patients`

**Request Body**:

```json
{
  "username": "nguyenvana", // ✅ REQUIRED (staff provides)
  "firstName": "Văn A",
  "lastName": "Nguyễn",
  "email": "nguyenvana@gmail.com", // ✅ REQUIRED for account creation
  "phone": "0901234567",
  "dateOfBirth": "1990-01-15",
  "gender": "MALE",
  "address": "123 Trần Hưng Đạo, Q1, HCM"
}
```

**⚠️ BREAKING CHANGE**:

- ❌ **DO NOT send `password` field** (will be ignored or cause validation error)
- ✅ **MUST send `username`** if you want to create account
- ✅ **MUST send `email`** for account creation and verification

---

### ❌ WRONG (Old behavior - V22 and before)

```json
{
  "username": "nguyenvana",
  "password": "SecurePass123!", // ❌ DON'T SEND THIS ANYMORE
  "email": "nguyenvana@gmail.com",
  "firstName": "Văn A",
  "lastName": "Nguyễn"
}
```

**Why wrong?**

- Staff should NEVER know patient's password (security violation)
- Password will be set by patient via email verification

---

## 📤 Response Format

### Success Response (201 Created)

```json
{
  "data": {
    "patientId": 123,
    "patientCode": "BN000123",
    "firstName": "Văn A",
    "lastName": "Nguyễn",
    "fullName": "Văn A Nguyễn",
    "email": "nguyenvana@gmail.com",
    "phone": "0901234567",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "address": "123 Trần Hưng Đạo, Q1, HCM",
    "isActive": true,
    "createdAt": "2025-11-25T23:30:00",

    // ✅ V23/V24: New account fields
    "accountId": 456,
    "accountStatus": "PENDING_VERIFICATION", // ← Account waiting for email verification
    "isEmailVerified": false // ← Patient hasn't verified email yet
  },
  "message": "Created patient successfully",
  "status": 201
}
```

### Account Status Values

| Status                 | Meaning                                         | Patient Can Login? |
| ---------------------- | ----------------------------------------------- | ------------------ |
| `PENDING_VERIFICATION` | Account created, waiting for email verification | ❌ No              |
| `ACTIVE`               | Email verified, password set                    | ✅ Yes             |
| `INACTIVE`             | Account disabled by admin                       | ❌ No              |
| `SUSPENDED`            | Temporarily suspended                           | ❌ No              |
| `LOCKED`               | Too many failed login attempts                  | ❌ No              |

---

## 📧 Email Verification Flow

### 1. Welcome Email Sent Automatically

When staff creates patient with email, backend automatically sends:

**Email Subject**: "Chào mừng đến với Phòng Khám Nha Khoa DenTeeth"

**Email Content**:

```
Xin chào Văn A Nguyễn,

Tài khoản của bạn đã được tạo tại phòng khám.

Username: nguyenvana
Email: nguyenvana@gmail.com

Vui lòng click vào link bên dưới để xác thực email và đặt mật khẩu:

[Xác thực & Đặt mật khẩu]
→ http://localhost:3000/setup-password?token=abc123xyz...

Link có hiệu lực trong 24 giờ.

Trân trọng,
DenTeeth Clinic
```

### 2. Patient Clicks Link

- Opens: `http://localhost:3000/setup-password?token=abc123xyz...`
- FE shows form to enter new password

### 3. Patient Sets Password

**FE calls**: `POST /api/v1/auth/setup-password`

**Request**:

```json
{
  "token": "abc123xyz...",
  "newPassword": "MySecurePass123!"
}
```

**Response (200 OK)**:

```json
{
  "message": "Password set successfully. You can now login.",
  "status": 200
}
```

### 4. Account Activated

- `accountStatus` changes: `PENDING_VERIFICATION` → `ACTIVE`
- `isEmailVerified` changes: `false` → `true`
- Patient can now login with username + password

---

## 🔐 Security Benefits

### Why This Approach?

1. **Staff Privacy**:

   - Staff cannot see patient passwords
   - Prevents staff from logging into patient accounts
   - Complies with medical data privacy regulations

2. **Patient Control**:

   - Patient chooses their own password
   - Patient can change password anytime
   - Stronger password security (patient picks memorable password)

3. **Email Verification**:

   - Confirms email is valid
   - Prevents typos in email address
   - Enables password reset via email

4. **Audit Trail**:
   - System logs who created account (staff)
   - System logs when patient verified email
   - Clear accountability

---

## 🧪 Testing Scenarios

### Test Case 1: Create Patient WITH Account

**Request**:

```json
POST /api/v1/patients
{
  "username": "testpatient001",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "Patient",
  "phone": "0901234567"
}
```

**Expected**:

1. ✅ Patient created with `patientCode`
2. ✅ Account created with `accountId`
3. ✅ `accountStatus` = `PENDING_VERIFICATION`
4. ✅ `isEmailVerified` = `false`
5. ✅ Email sent to `test@example.com`
6. ✅ Response includes all account fields

**Verify Email**:

- Check email inbox (if SMTP configured)
- Extract token from email link
- Call setup-password API with token

---

### Test Case 2: Create Patient WITHOUT Account (No Email)

**Request**:

```json
POST /api/v1/patients
{
  "firstName": "Walk-in",
  "lastName": "Patient",
  "phone": "0901234567"
  // ❌ No email, no username
}
```

**Expected**:

1. ✅ Patient created (record-only)
2. ✅ `accountId` = `null`
3. ✅ `accountStatus` = `null`
4. ✅ `isEmailVerified` = `null`
5. ✅ No email sent
6. ✅ Patient cannot login (no account)

**Use Case**: Walk-in patients without email, or patients who don't need online access

---

### Test Case 3: Duplicate Username

**Request**:

```json
POST /api/v1/patients
{
  "username": "nguyenvana",  // ← Already exists
  "email": "different@example.com",
  "firstName": "Different",
  "lastName": "Person"
}
```

**Expected**:

```json
{
  "error": "Username already exists",
  "status": 400,
  "type": "usernameexists"
}
```

**FE Action**: Show error to staff, ask to choose different username

---

### Test Case 4: Duplicate Email

**Request**:

```json
POST /api/v1/patients
{
  "username": "newusername",
  "email": "nguyenvana@gmail.com",  // ← Already exists
  "firstName": "New",
  "lastName": "Patient"
}
```

**Expected**:

```json
{
  "error": "Email already exists",
  "status": 400,
  "type": "emailexists"
}
```

**FE Action**: Show error to staff, patient may already exist in system

---

## 🎨 UI Mockup Suggestions

### Staff Create Patient Form

```
┌────────────────────────────────────────┐
│  Tạo Bệnh Nhân Mới                     │
├────────────────────────────────────────┤
│                                        │
│  Thông Tin Tài Khoản                  │
│  ┌────────────────────────────────┐   │
│  │ Username: [nguyenvana_______]  │   │  ← Staff enters
│  └────────────────────────────────┘   │
│  ⚠️ Lưu ý: Không cần nhập mật khẩu    │
│     Bệnh nhân sẽ tự đặt qua email      │
│                                        │
│  Thông Tin Cá Nhân                    │
│  ┌────────────────────────────────┐   │
│  │ Họ: [Nguyễn_______________]    │   │
│  │ Tên: [Văn A________________]    │   │
│  │ Email: [nguyenvana@gmail.com]  │   │  ← Required for account
│  │ SĐT: [0901234567___________]   │   │
│  │ Ngày sinh: [15/01/1990_____]   │   │
│  │ Giới tính: [Nam ▼]             │   │
│  │ Địa chỉ: [123 Trần Hưng Đạo..] │   │
│  └────────────────────────────────┘   │
│                                        │
│  [Hủy]  [Tạo Bệnh Nhân]               │
└────────────────────────────────────────┘
```

### After Creating Patient - Success Message

```
┌────────────────────────────────────────┐
│  ✅ Tạo bệnh nhân thành công!          │
├────────────────────────────────────────┤
│                                        │
│  Mã bệnh nhân: BN000123               │
│  Họ tên: Nguyễn Văn A                 │
│  Username: nguyenvana                  │
│                                        │
│  📧 Email xác thực đã được gửi đến:   │
│     nguyenvana@gmail.com               │
│                                        │
│  ⏳ Trạng thái tài khoản:              │
│     Chờ xác thực email                 │
│                                        │
│  💡 Bệnh nhân cần:                     │
│     1. Mở email                         │
│     2. Click link xác thực             │
│     3. Đặt mật khẩu                    │
│     4. Đăng nhập vào hệ thống          │
│                                        │
│  [Đóng]  [Tạo Bệnh Nhân Khác]          │
└────────────────────────────────────────┘
```

---

## 🚨 Error Handling

### Common Errors & Solutions

| Error                                    | Cause               | Solution                                            |
| ---------------------------------------- | ------------------- | --------------------------------------------------- |
| "Username already exists"                | Duplicate username  | Ask staff to choose different username              |
| "Email already exists"                   | Duplicate email     | Patient may already exist, search first             |
| "Email is required for account creation" | Missing email       | If staff wants account, must provide email          |
| "Failed to send email"                   | SMTP not configured | Patient created but no email sent, use manual setup |
| "Invalid email format"                   | Bad email           | Validate email format on FE                         |

---

## 📝 API Documentation

### Create Patient

**Endpoint**: `POST /api/v1/patients`

**Request Headers**:

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body Schema**:

```typescript
interface CreatePatientRequest {
  // Account fields
  username?: string; // Optional, but recommended for account creation

  // Patient info (required)
  firstName: string; // Required
  lastName: string; // Required
  email?: string; // Optional, but REQUIRED if creating account
  phone?: string; // Optional
  dateOfBirth?: string; // Format: YYYY-MM-DD
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;

  // Medical info (optional)
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
```

**Response Schema**:

```typescript
interface PatientInfoResponse {
  patientId: number;
  patientCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;

  // V23/V24: New account fields
  accountId?: number; // null if no account
  accountStatus?: AccountStatus; // null if no account
  isEmailVerified?: boolean; // null if no account
}

type AccountStatus =
  | "PENDING_VERIFICATION" // Account created, waiting for email verification
  | "ACTIVE" // Email verified, can login
  | "INACTIVE" // Disabled by admin
  | "SUSPENDED" // Temporarily suspended
  | "LOCKED"; // Too many failed logins
```

---

## 🔄 Migration from V22 to V23/V24

### What Changed?

| Aspect                    | V22 (Old)               | V23/V24 (New)                |
| ------------------------- | ----------------------- | ---------------------------- |
| **Password in Request**   | ✅ Required             | ❌ Removed (security)        |
| **Username in Request**   | ✅ Required             | ✅ Still Required            |
| **Account Creation**      | Immediate with password | Immediate with temp password |
| **Email Verification**    | ❌ Not required         | ✅ Required                  |
| **Patient Sets Password** | ❌ No                   | ✅ Yes (via email)           |
| **Staff Knows Password**  | ✅ Yes                  | ❌ No (security)             |

### Migration Checklist for FE

- [ ] Remove `password` field from create patient form
- [ ] Keep `username` field (required)
- [ ] Add success message about email verification
- [ ] Handle `accountStatus` = `PENDING_VERIFICATION`
- [ ] Show email verification status in patient list
- [ ] Update patient detail view to show account status
- [ ] Test email sending (check SMTP configuration)
- [ ] Test password setup flow
- [ ] Update UI/UX mockups
- [ ] Update validation rules (no password validation)

---

## ❓ FAQ

### Q1: What if patient doesn't have email?

**A**: Create patient WITHOUT username/email. Account will NOT be created. Patient exists as record-only (cannot login).

**Example**:

```json
{
  "firstName": "Nguyễn",
  "lastName": "Văn B",
  "phone": "0901234567"
}
```

---

### Q2: Can staff change username after creation?

**A**: Use `PATCH /api/v1/patients/{patientCode}` - username change may be restricted to avoid confusion.

---

### Q3: What if email verification link expires?

**A**: Patient can request new verification email:

- Call: `POST /api/v1/auth/resend-verification`
- Or staff can manually verify via admin panel

---

### Q4: Can staff manually set password for patient?

**A**: NO. This violates security policy. Staff should never know patient passwords. Use email verification flow.

---

### Q5: What if SMTP is not configured (email won't send)?

**A**:

- Patient is still created
- Account is still created with `PENDING_VERIFICATION` status
- Error is logged but NOT returned to FE
- Staff should manually give patient the verification link
- Or admin can manually activate account

**Check logs**:

```
⚠️ Failed to send welcome email to nguyenvana@gmail.com: Connection refused
⚠️ Patient account created successfully, but email not sent
```

---

## 🎯 Summary for FE Team

### DO ✅

1. ✅ Send `username` when creating patient (staff provides)
2. ✅ Send `email` if you want account created
3. ✅ Show success message mentioning email verification
4. ✅ Handle `accountStatus` = `PENDING_VERIFICATION`
5. ✅ Implement password setup page (`/setup-password?token=...`)

### DON'T ❌

1. ❌ Send `password` in create patient request (will be ignored/error)
2. ❌ Show password field in create patient form
3. ❌ Allow staff to see/set patient passwords
4. ❌ Skip email verification step

---

## 📞 Support

For questions or issues:

- Backend Team: Check logs for email sending errors
- Frontend Team: Check response format and handle new account fields
- QA Team: Test full email verification flow end-to-end

---

**Document Version**: V23/V24
**Last Updated**: November 25, 2025
**Author**: Backend Team
**Status**: ✅ Active
