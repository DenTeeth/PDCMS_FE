# FE Changes Required for Email Verification

## 🔍 Phân tích hiện trạng

### ✅ Đã có
- Login page (`src/app/(public)/login/page.tsx`)
- Error handling trong login (basic)
- Success messages khi tạo employee/patient

### ❌ Chưa có (Cần implement)
1. **Verify Email Page** - Không có page để handle verification link từ email
2. **Resend Verification Email Feature** - Không có UI để resend verification email
3. **AccountNotVerifiedException Handling** - Login không handle riêng error này
4. **Success Messages** - Chưa mention về verification email khi tạo account
5. **Verification API Service** - Chưa có service để call verify/resend APIs

---

## 📋 Checklist Changes

### 1. ✅ Tạo Verify Email Page
**File mới:** `src/app/(public)/verify-email/page.tsx`

**Requirements:**
- Handle `?token=xxx` query parameter từ email link
- Call API `GET /api/v1/auth/verify-email?token=xxx`
- Show success/error messages
- Redirect to login sau khi verify thành công
- Handle các error cases:
  - Token invalid
  - Token expired
  - Token already used

**API Endpoint:**
- `GET /api/v1/auth/verify-email?token={token}`

### 2. ✅ Tạo Authentication Service Methods
**File:** `src/lib/api.ts` hoặc `src/services/authService.ts`

**Methods cần thêm:**
```typescript
// Verify email with token
async verifyEmail(token: string): Promise<void>

// Resend verification email
async resendVerificationEmail(email: string): Promise<void>
```

**API Endpoints:**
- `GET /api/v1/auth/verify-email?token={token}`
- `POST /api/v1/auth/resend-verification` (body: `{ email: string }`)

### 3. ✅ Update Login Error Handling
**File:** `src/app/(public)/login/page.tsx`

**Changes:**
- Detect `AccountNotVerifiedException` error message
- Show specific UI/message cho unverified account
- Add "Resend verification email" button/link
- Handle error message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản."

**Error Detection:**
```typescript
if (errorMessage.includes('chưa được xác thực') || 
    errorMessage.includes('AccountNotVerified')) {
  // Show verification required UI
}
```

### 4. ✅ Update Success Messages
**Files:**
- `src/app/admin/accounts/employees/page.tsx` (Line 255)
- `src/app/admin/accounts/users/page.tsx` (Line 184)

**Current:**
```typescript
toast.success('Employee created successfully');
toast.success('Patient created successfully');
```

**Should be:**
```typescript
toast.success('Employee created successfully', {
  description: `Verification email has been sent to ${formData.email}. Employee must verify email before logging in.`
});

toast.success('Patient created successfully', {
  description: `Verification email has been sent to ${formData.email}. Patient must verify email before logging in.`
});
```

### 5. ✅ Create Resend Verification Component/Page
**Option A: Component trong Login Page**
- Show resend button khi detect unverified account error
- Input email field
- Call resend API

**Option B: Separate Page**
- `src/app/(public)/resend-verification/page.tsx`
- Form với email input
- Call resend API
- Show success/error messages

**Recommendation:** Option A (trong Login page) - simpler UX

---

## 🎨 UI/UX Changes

### Login Page Updates
1. **Error State cho Unverified Account:**
   ```
   ❌ Tài khoản chưa được xác thực
   
   Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.
   
   [Gửi lại email xác thực]
   ```

2. **Resend Verification Form:**
   - Email input field
   - "Gửi lại email xác thực" button
   - Success message: "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư."
   - Error handling

### Verify Email Page
1. **Loading State:**
   - "Đang xác thực email..."
   
2. **Success State:**
   - "✅ Email đã được xác thực thành công!"
   - "Bạn có thể đăng nhập ngay bây giờ."
   - [Đăng nhập] button → redirect to `/login`

3. **Error States:**
   - **Token Invalid:** "Token xác thực không hợp lệ."
   - **Token Expired:** "Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực."
   - **Already Verified:** "Token này đã được sử dụng. Tài khoản của bạn đã được xác thực."

---

## 📝 Implementation Details

### 1. Verify Email Page

```typescript
// src/app/(public)/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token không hợp lệ');
      return;
    }

    // Call verify API
    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      // TODO: Call API
      // await authService.verifyEmail(token);
      
      setStatus('success');
      setMessage('Email đã được xác thực thành công!');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Xác thực email thất bại');
    }
  };

  // Render UI based on status
}
```

### 2. Auth Service Methods

```typescript
// src/services/authService.ts (new file) hoặc add to src/lib/api.ts

export class AuthService {
  private readonly endpoint = '/auth';

  async verifyEmail(token: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.get(`${this.endpoint}/verify-email`, {
      params: { token }
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.post(`${this.endpoint}/resend-verification`, {
      email
    });
  }
}

export const authService = new AuthService();
```

### 3. Login Page Updates

```typescript
// src/app/(public)/login/page.tsx

// Add state for unverified account
const [showResendVerification, setShowResendVerification] = useState(false);
const [resendEmail, setResendEmail] = useState('');

// In onSubmit catch block:
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Login failed';
  
  // Check if account not verified
  if (errorMessage.includes('chưa được xác thực') || 
      errorMessage.includes('AccountNotVerified')) {
    setShowResendVerification(true);
    setResendEmail(username); // Pre-fill with username
  }
  
  toast.error(errorMessage);
  setType('error');
  setNotice(errorMessage);
}

// Add resend verification handler
const handleResendVerification = async () => {
  try {
    await authService.resendVerificationEmail(resendEmail);
    toast.success('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.');
    setShowResendVerification(false);
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Không thể gửi lại email xác thực');
  }
};
```

### 4. Update Success Messages

```typescript
// src/app/admin/accounts/employees/page.tsx
// Line ~255

await employeeService.createEmployee(payload);
toast.success('Employee created successfully', {
  description: `Verification email has been sent to ${formData.email}. Employee must verify email before logging in.`
});

// src/app/admin/accounts/users/page.tsx
// Line ~184

await patientService.createPatient(payload);
toast.success('Patient created successfully', {
  description: `Verification email has been sent to ${formData.email}. Patient must verify email before logging in.`
});
```

---

## 🧪 Test Cases

### Test 1: Verify Email Page
- [ ] Open `/verify-email?token=valid_token` → Should verify successfully
- [ ] Open `/verify-email?token=invalid_token` → Should show error
- [ ] Open `/verify-email?token=expired_token` → Should show expired message
- [ ] Open `/verify-email?token=already_used_token` → Should show already used message
- [ ] Open `/verify-email` (no token) → Should show invalid token error

### Test 2: Login with Unverified Account
- [ ] Try login with unverified account → Should show verification required message
- [ ] Click "Resend verification email" → Should send email
- [ ] Verify email → Should be able to login

### Test 3: Create Employee/Patient
- [ ] Create employee → Should show success message with verification email info
- [ ] Create patient → Should show success message with verification email info

### Test 4: Resend Verification
- [ ] Enter email → Click resend → Should send email
- [ ] Enter non-existent email → Should show error
- [ ] Enter already verified email → Should show "already verified" message

---

## 📦 Files to Create/Modify

### New Files
1. `src/app/(public)/verify-email/page.tsx` - Verify email page
2. `src/services/authService.ts` - Auth service (hoặc add to `src/lib/api.ts`)

### Modified Files
1. `src/app/(public)/login/page.tsx` - Add unverified account handling
2. `src/app/admin/accounts/employees/page.tsx` - Update success message
3. `src/app/admin/accounts/users/page.tsx` - Update success message
4. `src/contexts/AuthContext.tsx` - (Optional) Add verification status check

---

## ⚠️ Important Notes

1. **BE API Endpoints:**
   - `GET /api/v1/auth/verify-email?token={token}` - Verify email
   - `POST /api/v1/auth/resend-verification` - Resend verification email
     - Body: `{ email: string }`

2. **Error Messages từ BE:**
   - `"Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản."` - AccountNotVerifiedException
   - `"Token xác thực không hợp lệ"` - InvalidTokenException
   - `"Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực."` - TokenExpiredException
   - `"Token này đã được sử dụng"` - Token already verified

3. **Verification URL Format:**
   - BE sends: `${frontendUrl}/verify-email?token={token}`
   - Frontend should handle: `/verify-email?token=xxx`

4. **Token Expiry:**
   - Tokens expire after 24 hours
   - User can request new token via resend API

---

## ✅ Priority

**High Priority:**
1. Verify Email Page (required for email links to work)
2. Update Login Error Handling (required for user experience)
3. Update Success Messages (informative)

**Medium Priority:**
4. Resend Verification Feature (nice to have)
5. Auth Service Methods (clean code organization)

---

## 🚀 Next Steps

1. Create verify-email page
2. Add auth service methods
3. Update login page error handling
4. Update success messages
5. Test all flows
6. Update documentation

