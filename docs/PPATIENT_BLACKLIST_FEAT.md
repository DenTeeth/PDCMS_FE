# Patient Blacklist Feature - Frontend Integration Guide

## Overview

The Patient Blacklist feature is a critical business rule that allows dental clinics to prevent problematic patients from making appointments. This document provides comprehensive information about the blacklist system, including business rules, API endpoints, and integration guidelines.

---

## Table of Contents

1. [Business Rules](#business-rules)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [User Interface Guidelines](#user-interface-guidelines)
5. [Error Handling](#error-handling)
6. [Related Features](#related-features)
7. [Testing Scenarios](#testing-scenarios)

---

## Business Rules

### BR-043: Automatic Blacklisting

**Trigger Condition:**
- A patient reaches **3 consecutive no-shows** (missed appointments without cancellation)

**Automatic Actions:**
1. Patient's `is_blacklisted` flag is set to `TRUE`
2. Patient's `is_booking_blocked` flag is set to `TRUE`
3. `consecutive_no_shows` counter records the total count
4. Patient **cannot create new appointments** while blacklisted
5. Existing future appointments are **automatically cancelled**

**Key Points:**
- The system automatically detects and applies blacklist status
- No manual intervention required for the initial blacklist
- Administrators are notified when a patient is blacklisted

### BR-044: Manual Unban Process

**Authorization:**
- Only users with **`UNBAN_PATIENT`** permission can remove blacklist status
- Typically granted to: Administrators, Clinic Managers

**Unban Requirements:**
1. Admin must review the patient's history
2. Admin provides a **mandatory reason** for unbanning (minimum 10 characters)
3. System logs the unban action with timestamp and admin information

**Effects of Unbanning:**
1. `is_blacklisted` flag is set to `FALSE`
2. `is_booking_blocked` flag is set to `FALSE`
3. `consecutive_no_shows` counter is **reset to 0**
4. Patient can immediately create new appointments
5. Unban record is saved to `patient_unban_history` table

---

## Database Schema

### Patients Table Fields

```sql
patients {
  patient_id: BIGINT PRIMARY KEY
  account_id: BIGINT (FK to accounts)
  patient_code: VARCHAR(20) UNIQUE
  
  -- Blacklist Related Fields
  consecutive_no_shows: INTEGER DEFAULT 0
  is_booking_blocked: BOOLEAN DEFAULT FALSE
  is_blacklisted: BOOLEAN DEFAULT FALSE
  
  -- Other fields...
  first_name: VARCHAR(100)
  last_name: VARCHAR(100)
  email: VARCHAR(255)
  phone: VARCHAR(20)
  is_active: BOOLEAN DEFAULT TRUE
}
```

### Patient Unban History Table

```sql
patient_unban_history {
  id: BIGINT PRIMARY KEY AUTO_INCREMENT
  patient_id: BIGINT (FK to patients)
  unbanned_by: BIGINT (FK to employees)
  unbanned_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  reason: TEXT NOT NULL
  previous_no_show_count: INTEGER
}
```

**Purpose:** Maintains audit trail of all unban actions for compliance and review.

---

## API Endpoints

### 1. Get Patient Details (Check Blacklist Status)

**Endpoint:**
```
GET /api/v1/patients/{patientId}
```

**Permission Required:** `VIEW_PATIENT`

**Response Example:**
```json
{
  "patientId": 1,
  "patientCode": "BN-1001",
  "firstName": "Đoàn Thanh",
  "lastName": "Phong",
  "email": "doan.phong@email.com",
  "phone": "0901234567",
  "consecutiveNoShows": 3,
  "isBookingBlocked": true,
  "isBlacklisted": true,
  "isActive": true,
  "accountStatus": "ACTIVE"
}
```

**Key Fields for Frontend:**
- `isBlacklisted`: Shows if patient is currently blacklisted
- `consecutiveNoShows`: Number of consecutive missed appointments
- `isBookingBlocked`: If true, patient cannot book appointments

---

### 2. Unban Patient (Remove Blacklist)

**Endpoint:**
```
POST /api/v1/patients/{patientId}/unban
```

**Permission Required:** `UNBAN_PATIENT`

**Request Body:**
```json
{
  "reason": "Patient contacted clinic, apologized, and committed to respecting appointment times. Previous issues were due to family emergency."
}
```

**Validation Rules:**
- `reason` is **required**
- `reason` must be at least **10 characters**
- Patient must be currently blacklisted (will return 400 if not)

**Success Response (200 OK):**
```json
{
  "message": "Patient unbanned successfully",
  "patientId": 1,
  "patientCode": "BN-1001",
  "unbanRecord": {
    "id": 1,
    "unbannedBy": {
      "employeeId": 2,
      "fullName": "Nguyễn Văn Admin",
      "employeeCode": "EMP-002"
    },
    "unbannedAt": "2025-12-10T14:30:00",
    "reason": "Patient contacted clinic, apologized...",
    "previousNoShowCount": 3
  }
}
```

**Error Responses:**

**400 Bad Request - Patient Not Blacklisted:**
```json
{
  "error": "Bad Request",
  "message": "Patient is not currently blacklisted",
  "timestamp": "2025-12-10T14:30:00",
  "path": "/api/v1/patients/1/unban"
}
```

**400 Bad Request - Invalid Reason:**
```json
{
  "error": "Validation Failed",
  "message": "Reason must be at least 10 characters long",
  "timestamp": "2025-12-10T14:30:00",
  "path": "/api/v1/patients/1/unban"
}
```

**403 Forbidden - No Permission:**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to unban patients",
  "timestamp": "2025-12-10T14:30:00",
  "path": "/api/v1/patients/1/unban"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Patient with ID 999 not found",
  "timestamp": "2025-12-10T14:30:00",
  "path": "/api/v1/patients/999/unban"
}
```

---

### 3. Get Patient Unban History

**Endpoint:**
```
GET /api/v1/patients/{patientId}/unban-history
```

**Permission Required:** `VIEW_PATIENT`

**Query Parameters:**
- `page` (optional, default: 0)
- `size` (optional, default: 10)
- `sortBy` (optional, default: "unbannedAt")
- `sortDir` (optional, default: "desc")

**Response Example:**
```json
{
  "content": [
    {
      "id": 3,
      "patientId": 1,
      "unbannedBy": {
        "employeeId": 2,
        "fullName": "Nguyễn Văn Admin",
        "employeeCode": "EMP-002"
      },
      "unbannedAt": "2025-12-10T14:30:00",
      "reason": "Patient contacted clinic, apologized...",
      "previousNoShowCount": 3
    },
    {
      "id": 1,
      "patientId": 1,
      "unbannedBy": {
        "employeeId": 5,
        "fullName": "Trần Thị Manager",
        "employeeCode": "EMP-005"
      },
      "unbannedAt": "2025-11-15T10:15:00",
      "reason": "First time offender, patient showed remorse",
      "previousNoShowCount": 3
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 2,
  "totalPages": 1,
  "last": true
}
```

---

### 4. Create Appointment (Blocked for Blacklisted Patients)

**Endpoint:**
```
POST /api/v1/appointments
```

**If Patient is Blacklisted:**

**Error Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Patient is blacklisted and cannot book appointments. Patient has 3 consecutive no-shows.",
  "timestamp": "2025-12-10T14:30:00",
  "path": "/api/v1/appointments"
}
```

---

## User Interface Guidelines

### 1. Patient List/Search Results

**Visual Indicators:**

Display a prominent badge/tag when patient is blacklisted:

```html
<!-- Example UI -->
<div class="patient-card">
  <div class="patient-info">
    <h3>Đoàn Thanh Phong (BN-1001)</h3>
    <span class="badge badge-danger">⛔ BLACKLISTED</span>
    <p>Consecutive No-Shows: 3</p>
  </div>
</div>
```

**Recommended Colors:**
- **Blacklist Badge:** Red background (#dc3545), white text
- **Warning Icon:** ⛔ or 🚫
- **Tooltip:** "Patient cannot book appointments due to 3 consecutive no-shows"

---

### 2. Patient Detail Page

**Display Sections:**

**A. Status Summary Section:**
```
┌─────────────────────────────────────────┐
│ ⚠️ PATIENT BLACKLIST STATUS             │
├─────────────────────────────────────────┤
│ Status: BLACKLISTED                     │
│ Consecutive No-Shows: 3                 │
│ Booking Blocked: Yes                    │
│                                         │
│ [View Unban History] [Unban Patient]   │
└─────────────────────────────────────────┘
```

**B. Unban Button:**
- Only visible to users with `UNBAN_PATIENT` permission
- Opens modal/dialog for reason input
- Button should be prominent but require confirmation

---

### 3. Unban Patient Modal

**Modal Design:**

```
┌────────────────────────────────────────────┐
│  Unban Patient: Đoàn Thanh Phong          │
├────────────────────────────────────────────┤
│                                            │
│  Patient Code: BN-1001                     │
│  Current Status: BLACKLISTED               │
│  Consecutive No-Shows: 3                   │
│                                            │
│  ⚠️ Warning: Unbanning will allow this     │
│  patient to book appointments again.       │
│                                            │
│  Reason for Unbanning: *                   │
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  │  (Minimum 10 characters)             │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Character Count: 0 / 10 minimum           │
│                                            │
│  [ Cancel ]         [ Confirm Unban ]     │
└────────────────────────────────────────────┘
```

**Validation:**
- Reason field is required
- Show character counter
- Disable "Confirm" button until 10+ characters entered
- Show success toast after successful unban

---

### 4. Unban History Page/Section

**Table Display:**

| Date & Time | Unbanned By | Previous No-Shows | Reason |
|-------------|-------------|-------------------|---------|
| 2025-12-10 14:30 | Nguyễn Văn Admin (EMP-002) | 3 | Patient contacted clinic... |
| 2025-11-15 10:15 | Trần Thị Manager (EMP-005) | 3 | First time offender... |

**Features:**
- Sortable by date
- Paginated (10 records per page default)
- Expandable rows to show full reason text
- Export to Excel/PDF option

---

### 5. Appointment Booking Page

**Prevention Logic:**

When user tries to book appointment for blacklisted patient:

```
┌────────────────────────────────────────────┐
│  ❌ Cannot Create Appointment              │
├────────────────────────────────────────────┤
│                                            │
│  Patient Đoàn Thanh Phong is currently     │
│  blacklisted due to 3 consecutive          │
│  no-shows.                                 │
│                                            │
│  Please contact an administrator to        │
│  review and unban this patient if needed.  │
│                                            │
│  [ OK ]                                    │
└────────────────────────────────────────────┘
```

**Implementation:**
1. Check `isBlacklisted` flag before allowing appointment creation
2. Disable appointment form fields
3. Show clear error message
4. Provide link to patient detail page for admins

---

## Error Handling

### Frontend Validation

**Before API Call:**
1. Check if patient is blacklisted from patient detail response
2. Disable booking functionality if `isBlacklisted === true`
3. Show appropriate UI warnings

### API Error Handling

```typescript
// Example TypeScript/React
async function unbanPatient(patientId: number, reason: string) {
  try {
    const response = await fetch(`/api/v1/patients/${patientId}/unban`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 400) {
        // Patient not blacklisted or validation error
        showErrorToast(error.message);
      } else if (response.status === 403) {
        // No permission
        showErrorToast('You do not have permission to unban patients');
      } else if (response.status === 404) {
        // Patient not found
        showErrorToast('Patient not found');
      }
      
      return;
    }

    const result = await response.json();
    showSuccessToast('Patient unbanned successfully');
    
    // Refresh patient data
    refreshPatientDetails(patientId);
    
  } catch (error) {
    showErrorToast('Network error. Please try again.');
  }
}
```

---

## Related Features

### 1. Duplicate Patient Detection

- When checking for duplicates, also show if any matching patients are blacklisted
- Display blacklist status in duplicate patient list
- Reference: `BR_043_044_DUPLICATE_DETECTION_AND_BLACKLIST_FE_GUIDE.md`

### 2. Appointment Management

- No-show marking triggers consecutive_no_shows counter
- Third consecutive no-show automatically blacklists patient
- Reference: `FE_APPOINTMENT_BUSINESS_RULES_SUMMARY.md`

### 3. Patient Registration

- New patients start with:
  - `consecutive_no_shows = 0`
  - `is_booking_blocked = FALSE`
  - `is_blacklisted = FALSE`

---

## Testing Scenarios

### Test Case 1: View Blacklisted Patient

**Preconditions:**
- Patient exists with `is_blacklisted = TRUE`
- User has `VIEW_PATIENT` permission

**Steps:**
1. Navigate to patient list
2. Search for blacklisted patient
3. View patient details

**Expected Results:**
- Red blacklist badge displayed
- "Consecutive No-Shows: 3" shown
- "Booking Blocked: Yes" indicator visible
- Unban button visible (if user has permission)

---

### Test Case 2: Unban Patient - Success

**Preconditions:**
- Patient exists with `is_blacklisted = TRUE`
- User has `UNBAN_PATIENT` permission

**Steps:**
1. Navigate to blacklisted patient detail page
2. Click "Unban Patient" button
3. Enter reason: "Patient apologized and committed to improvement"
4. Click "Confirm Unban"

**Expected Results:**
- Success message displayed
- Patient status changes to NOT BLACKLISTED
- `consecutive_no_shows` resets to 0
- Patient can now book appointments
- Unban record appears in history

---

### Test Case 3: Unban Patient - Insufficient Reason

**Preconditions:**
- Patient exists with `is_blacklisted = TRUE`
- User has `UNBAN_PATIENT` permission

**Steps:**
1. Navigate to blacklisted patient detail page
2. Click "Unban Patient" button
3. Enter reason: "OK" (only 2 characters)
4. Click "Confirm Unban"

**Expected Results:**
- Error message: "Reason must be at least 10 characters long"
- Patient remains blacklisted
- Modal remains open for correction

---

### Test Case 4: Unban Patient - No Permission

**Preconditions:**
- Patient exists with `is_blacklisted = TRUE`
- User does NOT have `UNBAN_PATIENT` permission

**Steps:**
1. Navigate to blacklisted patient detail page

**Expected Results:**
- "Unban Patient" button is NOT visible
- OR button is disabled with tooltip: "You don't have permission"

---

### Test Case 5: Attempt Booking for Blacklisted Patient

**Preconditions:**
- Patient exists with `is_blacklisted = TRUE`

**Steps:**
1. Navigate to appointment booking page
2. Select blacklisted patient
3. Try to create appointment

**Expected Results:**
- Error message displayed
- Appointment form disabled
- Clear explanation about blacklist status
- Cannot submit appointment

---

### Test Case 6: View Unban History

**Preconditions:**
- Patient has been unbanned at least once
- User has `VIEW_PATIENT` permission

**Steps:**
1. Navigate to patient detail page
2. Click "View Unban History"

**Expected Results:**
- Table/list of all unban records shown
- Each record displays: date, admin name, reason, previous no-shows
- Records sorted by date (newest first)
- Pagination works correctly

---

## Permission Requirements Summary

| Action | Required Permission | Notes |
|--------|-------------------|-------|
| View patient blacklist status | `VIEW_PATIENT` | Standard patient viewing |
| Unban patient | `UNBAN_PATIENT` | Admin/Manager only |
| View unban history | `VIEW_PATIENT` | Same as viewing patient |
| Create appointment | `CREATE_APPOINTMENT` | Blocked if patient blacklisted |

---

## Best Practices

### 1. Always Check Before Booking
```typescript
if (patient.isBlacklisted) {
  showError('Patient is blacklisted');
  return;
}
```

### 2. Clear Visual Indicators
- Use consistent red color (#dc3545) for blacklist status
- Show badge in all patient-related views
- Include tooltip with explanation

### 3. Audit Trail
- Always log unban actions
- Display who performed unban and when
- Show reason prominently in history

### 4. User Experience
- Provide helpful error messages
- Don't just say "forbidden" - explain why
- Offer next steps (e.g., "Contact administrator")

### 5. Real-time Updates
- Refresh patient data after unban
- Update UI immediately without page reload
- Show success feedback clearly

---

## Frequently Asked Questions

### Q1: Can a patient be blacklisted multiple times?
**A:** Yes. If a patient is unbanned but accumulates 3 consecutive no-shows again, they will be automatically blacklisted again.

### Q2: Do past appointments count toward no-shows after unban?
**A:** No. The `consecutive_no_shows` counter is reset to 0 upon unbanning. Only future no-shows count.

### Q3: Can patients see their own blacklist status?
**A:** This depends on your patient portal implementation. Typically, patients should see a message like "Your booking privileges have been temporarily suspended" rather than "blacklisted."

### Q4: What happens to existing appointments when patient is blacklisted?
**A:** Future appointments are automatically cancelled. Past appointments remain in the system.

### Q5: Can we customize the no-show threshold (currently 3)?
**A:** The threshold is hardcoded as 3. To change it, you need to modify the backend business rule constant.

### Q6: Is there a time limit on blacklist status?
**A:** No automatic expiration. Blacklist remains until an administrator manually unbans the patient.

---

## API Request Examples

### Using cURL

**Unban Patient:**
```bash
curl -X POST "http://localhost:8080/api/v1/patients/1/unban" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Patient contacted clinic, apologized sincerely, and committed to respecting appointment times going forward."
  }'
```

**Get Unban History:**
```bash
curl -X GET "http://localhost:8080/api/v1/patients/1/unban-history?page=0&size=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Integration Checklist

- [ ] Display blacklist badge on patient list
- [ ] Display blacklist status on patient detail page
- [ ] Implement unban modal with reason input
- [ ] Add character counter and validation
- [ ] Show unban history table
- [ ] Prevent appointment booking for blacklisted patients
- [ ] Handle all error responses appropriately
- [ ] Add permission checks for unban button visibility
- [ ] Implement success/error toast notifications
- [ ] Add audit logging for unban actions
- [ ] Test all edge cases (no permission, invalid reason, etc.)
- [ ] Update user documentation

---

## Support & References

**Related Documentation:**
- `PATIENT_UNBAN_FEATURE_IMPLEMENTATION.md` - Backend implementation details
- `PATIENT_UNBAN_FE_INTEGRATION_GUIDE.md` - Additional FE integration examples
- `COMPREHENSIVE_BUSINESS_RULES_AND_CONSTRAINTS_V2_COMPLETE.md` - All business rules
- `FE_APPOINTMENT_BUSINESS_RULES_SUMMARY.md` - Appointment-related rules

**API Documentation:**
- `API_DOCUMENTATION.md` - Complete API reference
- Swagger UI: `http://localhost:8080/swagger-ui.html`

**For Questions:**
- Backend Team: Review business rule implementation
- Database: Check `patients` and `patient_unban_history` tables
- Testing: Refer to test scenarios above

---

**Document Version:** 1.0  
**Last Updated:** December 10, 2025  
**Maintained By:** Backend Development Team
