# Reset Password Functionality - Issue Report

**Date:** 2026-01-16  
**Component:** Authentication - Password Reset  
**Priority:** High  
**Status:** Open

---

## Summary

The reset password functionality is not working properly. Users are unable to reset their passwords using the token sent via email.

---

## Flow Overview

### Current Implementation Flow:

1. **Request Password Reset** (`/forgot-password`)
   - User enters email
   - Frontend calls: `POST /api/v1/auth/forgot-password`
   - Backend should send email with reset link containing token

2. **Reset Password** (`/reset-password?token=...`)
   - User clicks link from email
   - Frontend extracts token from URL query parameter
   - User enters new password and confirm password
   - Frontend calls: `POST /api/v1/auth/reset-password`
   - Backend should validate token and update password

---

## Frontend Implementation Details

### Files Involved:
- `src/app/(public)/forgot-password/page.tsx` - Request reset email
- `src/app/(public)/reset-password/page.tsx` - Reset password form
- `src/services/authenticationService.ts` - API service methods

### Frontend Request Format:

#### 1. Forgot Password Request
```typescript
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Expected Response:**
- Status: `200 OK`
- Body: `{ message: string }` or `{ statusCode: 200, message: string, data: { message: string } }`

#### 2. Reset Password Request
```typescript
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "uuid-token-from-email",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Expected Response:**
- Status: `200 OK`
- Body: `{ message: string }` or `{ statusCode: 200, message: string, data: { message: string } }`

---

## Identified Issues

### 1. **Response Format Handling**
**Location:** `src/services/authenticationService.ts:126`

The frontend uses `extractApiResponse()` to unwrap the response. This function expects:
- Pattern 1: Direct response `{ data: T }`
- Pattern 2: Wrapped response `{ statusCode: 200, message: "...", data: T }`

**Potential Issue:**
- If BE returns a different format, the response extraction may fail
- If BE returns `{ message: "..." }` directly (without `data` wrapper), `extractApiResponse` may return `undefined`

**Recommendation:**
- Verify BE response format matches one of the expected patterns
- If BE returns `{ message: "..." }` directly, update `extractApiResponse` or handle it in the service method

---

### 2. **Token Validation**
**Location:** `src/app/(public)/reset-password/page.tsx:25-30`

Frontend extracts token from URL query parameter:
```typescript
const tokenParam = searchParams.get("token");
```

**Potential Issues:**
- Token may be URL-encoded and need decoding
- Token format may not match BE expectations (UUID format expected)
- Token may be missing from email link

**Recommendation:**
- Verify email link format: Should be `https://domain.com/reset-password?token=<uuid>`
- Check if token needs URL decoding
- Verify token format matches BE expectations

---

### 3. **Password Validation Mismatch**
**Location:** `src/app/(public)/reset-password/page.tsx:33-47`

Frontend validation rules:
- Minimum 6 characters
- Maximum 50 characters
- Must contain at least 1 letter
- Must contain at least 1 number

**UI Hint shows:** "Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" (At least 8 characters, including uppercase, lowercase, numbers, and special characters)

**Potential Issues:**
- Frontend validation (6 chars) doesn't match UI hint (8 chars)
- Frontend doesn't check for uppercase/lowercase/special characters
- BE may have different validation rules

**Recommendation:**
- Align frontend validation with UI hint (8 chars minimum, uppercase, lowercase, number, special char)
- Verify BE password validation rules match frontend
- Ensure error messages from BE are clear about password requirements

---

### 4. **Error Handling**
**Location:** `src/app/(public)/reset-password/page.tsx:86-125`

Frontend handles various error cases:
- Token expired
- Token invalid
- Token already used
- Passwords don't match
- Password validation errors

**Potential Issues:**
- BE error messages may not match expected patterns
- BE may return different error codes/status codes
- Error response format may not be consistent

**Recommendation:**
- Verify BE returns clear, consistent error messages
- Ensure error messages are in Vietnamese (as expected by frontend)
- Check error response format: `{ message: string }` or `{ error: string }`

---

### 5. **Token Expiration**
**Location:** `src/services/authenticationService.ts:89`

Documentation states: "Token expires after 24 hours"

**Potential Issues:**
- Token expiration not properly checked on BE
- Token expiration time may be different
- Token may expire before user receives email

**Recommendation:**
- Verify token expiration logic on BE
- Check if token expiration time is configurable
- Ensure clear error message when token expires

---

### 6. **Token Usage Tracking**
**Location:** `src/services/authenticationService.ts:90`

Documentation states: "After password reset, token is marked as used (usedAt is set)"

**Potential Issues:**
- Token may not be properly marked as used
- Token may be reusable (security issue)
- Multiple reset attempts with same token may cause issues

**Recommendation:**
- Verify token is marked as used after successful reset
- Ensure token cannot be reused
- Handle case where token is already used

---

## Testing Checklist for BE Team

### 1. Forgot Password Endpoint
- [ ] `POST /api/v1/auth/forgot-password` accepts email
- [ ] Returns 200 OK for valid email
- [ ] Returns 404 for non-existent email
- [ ] Sends email with reset link containing token
- [ ] Token in email link is valid UUID format
- [ ] Email link format: `https://domain.com/reset-password?token=<uuid>`

### 2. Reset Password Endpoint
- [ ] `POST /api/v1/auth/reset-password` accepts `{ token, newPassword, confirmPassword }`
- [ ] Validates token exists and is not expired
- [ ] Validates token is not already used
- [ ] Validates passwords match
- [ ] Validates password meets requirements (8+ chars, uppercase, lowercase, number, special char)
- [ ] Updates password in database
- [ ] Marks token as used (sets `usedAt`)
- [ ] Sets `mustChangePassword` to false
- [ ] Returns 200 OK with success message

### 3. Error Cases
- [ ] Returns 400 for invalid token format
- [ ] Returns 400 for expired token (with clear message)
- [ ] Returns 400 for already used token (with clear message)
- [ ] Returns 400 for passwords not matching
- [ ] Returns 400 for password not meeting requirements (with clear requirements)
- [ ] Returns 404 for token not found
- [ ] All error messages are in Vietnamese and user-friendly

### 4. Response Format
- [ ] Response format is consistent: `{ message: string }` or `{ statusCode: 200, message: string, data: { message: string } }`
- [ ] Success response includes clear success message
- [ ] Error response includes clear error message

### 5. Security
- [ ] Token is single-use (cannot be reused)
- [ ] Token expires after 24 hours
- [ ] Token is properly invalidated after use
- [ ] Rate limiting on forgot-password endpoint (prevent abuse)
- [ ] Rate limiting on reset-password endpoint (prevent brute force)

---

## Debugging Steps

### For BE Team:

1. **Check Logs:**
   - Check server logs for `/api/v1/auth/reset-password` requests
   - Verify request payload is received correctly
   - Check for any validation errors
   - Check for any database errors

2. **Test Token:**
   - Generate a test token
   - Verify token format and structure
   - Check token expiration logic
   - Test token validation

3. **Test Password Validation:**
   - Test with various password formats
   - Verify password requirements are enforced
   - Check error messages are clear

4. **Test Response Format:**
   - Verify response format matches frontend expectations
   - Check if response needs unwrapping
   - Ensure success/error messages are included

### For FE Team:

1. **Check Browser Console:**
   - Look for network errors
   - Check request/response payloads
   - Verify token is extracted correctly from URL

2. **Test with Different Tokens:**
   - Test with valid token
   - Test with expired token
   - Test with invalid token
   - Test with already used token

3. **Test Password Validation:**
   - Test with various password formats
   - Verify frontend validation matches BE requirements

---

## Expected Behavior

### Success Flow:
1. User requests password reset → Email sent
2. User clicks link in email → Redirected to `/reset-password?token=<uuid>`
3. User enters new password → Password validated
4. User submits form → Password reset successfully
5. User redirected to login page

### Error Flow:
1. User requests password reset → Email sent
2. User clicks link in email → Redirected to `/reset-password?token=<uuid>`
3. User enters new password → Password validated
4. User submits form → Error occurs
5. Clear error message displayed to user

---

## Recommendations

1. **Standardize Response Format:**
   - Use consistent response format across all endpoints
   - Document response format in API documentation

2. **Improve Error Messages:**
   - Provide clear, user-friendly error messages in Vietnamese
   - Include specific validation requirements in error messages

3. **Add Logging:**
   - Add detailed logging for password reset flow
   - Log token validation, password validation, and errors

4. **Add Monitoring:**
   - Monitor password reset success/failure rates
   - Alert on unusual patterns (potential abuse)

5. **Update Documentation:**
   - Document password requirements clearly
   - Document token format and expiration
   - Document error codes and messages

---

## Contact

For questions or clarifications, please contact the Frontend team.

---

## Additional Notes

- Frontend uses `extractApiResponse()` utility to unwrap BE responses
- Frontend expects error messages in Vietnamese
- Frontend validates password on client-side before sending to BE
- Token is extracted from URL query parameter `?token=...`




