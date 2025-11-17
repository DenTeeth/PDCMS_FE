# 🔧 Delay Appointment Implementation - API Integration

## 📋 Overview
Tích hợp API delay appointment vào FE với error handling chi tiết cho lỗi 409 (Conflict) và hiển thị thông báo tiếng Việt thân thiện cho user.

---

## 🎯 API Specification

### Endpoint
```
POST /api/v1/appointments/{appointmentCode}/delay
```

### Request Body
```json
{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Bệnh nhân yêu cầu hoãn vì bận việc đột xuất"
}
```

### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newStartTime` | ISO 8601 DateTime | ✅ Required | Thời gian bắt đầu mới (format: `YYYY-MM-DDTHH:MM:SS`) |
| `reasonCode` | String (Enum) | ✅ Required | Mã lý do hoãn lịch |
| `notes` | String | ❌ Optional | Ghi chú thêm về lý do hoãn lịch |

### Reason Codes
```typescript
enum DelayReasonCode {
  PATIENT_REQUEST = 'Bệnh nhân yêu cầu hoãn',
  DOCTOR_EMERGENCY = 'Bác sĩ có việc đột xuất',
  EQUIPMENT_ISSUE = 'Vấn đề thiết bị',
  CLINIC_EMERGENCY = 'Phòng khám có tình huống khẩn cấp',
  OTHER = 'Lý do khác'
}
```

---

## ✅ Success Response (200 OK)
```json
{
  "appointmentCode": "APT-20251115-001",
  "status": "SCHEDULED",
  "appointmentDate": "2025-11-15",
  "startTime": "15:00",
  "endTime": "15:45",
  "appointmentStartTime": "2025-11-15T15:00:00",
  "appointmentEndTime": "2025-11-15T15:45:00",
  "patient": { ... },
  "employee": { ... },
  "room": { ... },
  "services": [ ... ]
}
```

---

## ❌ Error Responses

### 409 Conflict - Invalid State Transition
**Scenario:** Attempt to delay appointment in status CANCELLED/COMPLETED/IN_PROGRESS/NO_SHOW

**Backend Response:**
```json
{
  "statusCode": 409,
  "error": "error.conflict",
  "message": "Cannot delay appointment in status CANCELLED. Only SCHEDULED or CHECKED_IN appointments can be delayed.",
  "data": null
}
```

**FE Error Handling:**
```typescript
// Detect status from error message
if (errorMessage.includes('Cannot delay appointment in status')) {
  const statusMatch = errorMessage.match(/in status (\w+)/);
  const currentStatus = statusMatch ? statusMatch[1] : 'unknown';
  
  const statusMessages: Record<string, string> = {
    'CANCELLED': 'Không thể hoãn lịch hẹn đã bị huỷ',
    'COMPLETED': 'Không thể hoãn lịch hẹn đã hoàn thành',
    'IN_PROGRESS': 'Không thể hoãn lịch hẹn đang thực hiện',
    'NO_SHOW': 'Không thể hoãn lịch hẹn bệnh nhân không đến',
  };

  toast.error(statusMessages[currentStatus] || 'Không thể hoãn lịch hẹn ở trạng thái hiện tại', {
    description: 'Chỉ có thể hoãn lịch hẹn đang chờ hoặc đã check-in',
  });
}
```

**User-Friendly Messages:**
- `CANCELLED` → "Không thể hoãn lịch hẹn đã bị huỷ"
- `COMPLETED` → "Không thể hoãn lịch hẹn đã hoàn thành"
- `IN_PROGRESS` → "Không thể hoãn lịch hẹn đang thực hiện"
- `NO_SHOW` → "Không thể hoãn lịch hẹn bệnh nhân không đến"

---

### 409 Conflict - Employee Slot Taken
**Scenario:** Doctor already has another appointment at the new time

**Backend Response:**
```json
{
  "statusCode": 409,
  "error": "error.conflict",
  "message": "Employee slot is already taken at the new time",
  "data": { "conflictType": "EMPLOYEE_SLOT_TAKEN" }
}
```

**FE Error Handling:**
```typescript
if (errorMessage.includes('EMPLOYEE_SLOT_TAKEN') || 
    errorMessage.includes('employee') || 
    errorMessage.includes('doctor')) {
  toast.error('Bác sĩ đã có lịch hẹn khác vào thời gian này', {
    description: 'Vui lòng chọn thời gian khác hoặc liên hệ quản lý để điều chỉnh lịch',
  });
}
```

**User-Friendly Message:**
- "Bác sĩ đã có lịch hẹn khác vào thời gian này. Vui lòng chọn thời gian khác hoặc liên hệ quản lý để điều chỉnh lịch."

---

### 409 Conflict - Room Slot Taken
**Scenario:** Room is already booked at the new time

**Backend Response:**
```json
{
  "statusCode": 409,
  "error": "error.conflict",
  "message": "Room slot is already taken at the new time",
  "data": { "conflictType": "ROOM_SLOT_TAKEN" }
}
```

**FE Error Handling:**
```typescript
if (errorMessage.includes('ROOM_SLOT_TAKEN') || 
    errorMessage.includes('room') || 
    errorMessage.includes('phòng')) {
  toast.error('Phòng khám đã được đặt vào thời gian này', {
    description: 'Vui lòng chọn thời gian khác hoặc chọn phòng khác',
  });
}
```

**User-Friendly Message:**
- "Phòng khám đã được đặt vào thời gian này. Vui lòng chọn thời gian khác hoặc chọn phòng khác."

---

### 404 Not Found
**Scenario:** Appointment code not found

**Backend Response:**
```json
{
  "statusCode": 404,
  "error": "error.not_found",
  "message": "Appointment not found with code: APT-20251115-XXX",
  "data": null
}
```

**FE Error Handling:**
```typescript
if (error.response?.status === 404) {
  toast.error('Không tìm thấy lịch hẹn', {
    description: 'Lịch hẹn không tồn tại hoặc đã bị xóa',
  });
}
```

---

### 400 Bad Request
**Scenario:** Invalid request data (e.g., missing required fields, invalid date format)

**Backend Response:**
```json
{
  "statusCode": 400,
  "error": "error.bad_request",
  "message": "Invalid request: newStartTime is required",
  "data": null
}
```

**FE Error Handling:**
```typescript
if (error.response?.status === 400) {
  toast.error('Dữ liệu không hợp lệ', {
    description: error.response?.data?.message || 'Vui lòng kiểm tra lại thông tin',
  });
}
```

---

## 🎨 UI/UX Implementation

### Component: `DelayAppointmentModal.tsx`
Location: `src/components/appointments/DelayAppointmentModal.tsx`

**Features:**
- ✅ Calendar picker for new date
- ✅ Time slot selector (15-minute intervals)
- ✅ Reason code dropdown
- ✅ Notes textarea
- ✅ Current appointment info display
- ✅ Warning notices for business rules
- ✅ Vietnamese error messages for 409 conflicts
- ✅ Auto-reload appointment after success

**Usage:**
```tsx
import DelayAppointmentModal from '@/components/appointments/DelayAppointmentModal';

<DelayAppointmentModal
  open={showDelayModal}
  appointment={appointment}
  onClose={() => setShowDelayModal(false)}
  onSuccess={() => {
    // Reload appointment to get updated data
    loadAppointmentDetails();
  }}
/>
```

---

## 🔄 Integration Points

### Admin Appointment Detail Page
File: `src/app/admin/booking/appointments/[appointmentCode]/page.tsx`

**Changes:**
1. Import `DelayAppointmentModal` component
2. Replace old Dialog-based delay modal with new component
3. Remove unused states: `delayNewStartTime`, `delayReason`, `delayNotes`, `delaying`
4. Remove old `handleDelay` function (now handled inside component)

**Button Trigger:**
```tsx
{canDelay && (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
  <Button variant="outline" onClick={() => setShowDelayModal(true)}>
    <Clock className="h-4 w-4 mr-2" />
    Delay Appointment
  </Button>
)}
```

---

## 🧪 Test Cases

### ✅ Happy Path
1. **Scenario:** Admin delays SCHEDULED appointment to a future time
   - **Given:** Appointment status is SCHEDULED
   - **When:** Admin selects new date (15/11/2025 15:00) and reason code (PATIENT_REQUEST)
   - **Then:** API returns 200 OK with updated appointment data
   - **Expected:** Toast success message, appointment detail reloaded

### ❌ Error Path 1: Invalid State Transition
2. **Scenario:** Admin tries to delay CANCELLED appointment
   - **Given:** Appointment status is CANCELLED
   - **When:** Admin clicks "Delay Appointment" button
   - **Then:** Button should be hidden (prevented by UI)
   - **Alternative:** If API called, return 409 with state error
   - **Expected:** Toast error: "Không thể hoãn lịch hẹn đã bị huỷ"

### ❌ Error Path 2: Employee Slot Taken
3. **Scenario:** Admin delays appointment to a time when doctor is busy
   - **Given:** Appointment status is SCHEDULED
   - **When:** Admin selects time slot when doctor has another appointment
   - **Then:** API returns 409 with EMPLOYEE_SLOT_TAKEN
   - **Expected:** Toast error: "Bác sĩ đã có lịch hẹn khác vào thời gian này"

### ❌ Error Path 3: Room Slot Taken
4. **Scenario:** Admin delays appointment to a time when room is occupied
   - **Given:** Appointment status is SCHEDULED
   - **When:** Admin selects time slot when room is booked
   - **Then:** API returns 409 with ROOM_SLOT_TAKEN
   - **Expected:** Toast error: "Phòng khám đã được đặt vào thời gian này"

### ❌ Error Path 4: Missing Required Fields
5. **Scenario:** Admin submits form without selecting date/time
   - **Given:** Form is opened
   - **When:** Admin clicks "Xác nhận hoãn lịch" without filling required fields
   - **Then:** Frontend validation shows error toast
   - **Expected:** Toast error: "Vui lòng chọn ngày mới" or "Vui lòng chọn giờ mới"

### ❌ Error Path 5: Invalid Time Interval
6. **Scenario:** Admin enters time not divisible by 15 minutes
   - **Given:** Form is opened
   - **When:** Admin manually types time like "8:07" or "14:23"
   - **Then:** Frontend validation shows error toast
   - **Expected:** Toast error: "Giờ phải chia hết cho 15 phút (ví dụ: 8:00, 8:15, 8:30, 8:45)"

---

## 📝 Business Rules

### Permissions Required
- `DELAY_APPOINTMENT` permission to access delay functionality

### Appointment Status Constraints
**Can Delay:**
- ✅ `SCHEDULED` - Appointment is scheduled and waiting
- ✅ `CHECKED_IN` - Patient has checked in but treatment not started

**Cannot Delay:**
- ❌ `CANCELLED` - Already cancelled
- ❌ `COMPLETED` - Already completed
- ❌ `IN_PROGRESS` - Treatment in progress
- ❌ `NO_SHOW` - Patient did not show up

### Time Constraints
- New start time must be in the future (> current time)
- Time must be in 15-minute intervals (e.g., 8:00, 8:15, 8:30, 8:45)
- Doctor must be available at the new time slot
- Room must be available at the new time slot

---

## 🚀 Deployment Checklist

- [x] Create `DelayAppointmentModal.tsx` component
- [x] Integrate modal into admin appointment detail page
- [x] Remove old Dialog-based delay modal
- [x] Remove unused state variables
- [x] Implement 409 error handling with Vietnamese messages
- [x] Add validation for required fields and time intervals
- [x] Test happy path (successful delay)
- [x] Test error paths (all 409 conflict types)
- [ ] Test with real backend API
- [ ] Update user documentation
- [ ] Train support team on new error messages

---

## 📊 Error Handling Summary

| Error Type | Status Code | FE Detection | Vietnamese Message |
|------------|-------------|--------------|---------------------|
| Invalid State | 409 | `Cannot delay appointment in status` | "Không thể hoãn lịch hẹn đã bị huỷ" (status-specific) |
| Employee Busy | 409 | `EMPLOYEE_SLOT_TAKEN` \| `employee` \| `doctor` | "Bác sĩ đã có lịch hẹn khác vào thời gian này" |
| Room Occupied | 409 | `ROOM_SLOT_TAKEN` \| `room` \| `phòng` | "Phòng khám đã được đặt vào thời gian này" |
| Not Found | 404 | Status 404 | "Không tìm thấy lịch hẹn" |
| Bad Request | 400 | Status 400 | "Dữ liệu không hợp lệ" + backend message |
| Generic Error | 5xx | Other status codes | "Hoãn lịch hẹn thất bại" + backend message |

---

## 🔗 Related Files

**Component:**
- `src/components/appointments/DelayAppointmentModal.tsx`

**Pages:**
- `src/app/admin/booking/appointments/[appointmentCode]/page.tsx`

**Services:**
- `src/services/appointmentService.ts` (already has `delayAppointment` method)

**Types:**
- `src/types/appointment.ts` (already has `DelayAppointmentRequest` type)

**Documentation:**
- `APPOINTMENT_IMPLEMENTATION_SUMMARY.md`
- `UI_ERROR_MESSAGES_UPDATE.md`
- `REQUEST_TO_BACKEND.md`

---

## 💡 Next Steps

1. **Test với Backend:**
   - Test API delay với các trường hợp SCHEDULED, CHECKED_IN
   - Test lỗi 409 với các conflict types
   - Verify Vietnamese error messages hiển thị đúng

2. **Enhance UX:**
   - Add loading skeleton khi fetch appointment detail
   - Add confirmation dialog trước khi delay (nếu cần)
   - Show available time slots based on doctor/room availability

3. **Analytics:**
   - Track delay reasons (which reason codes are used most)
   - Monitor delay success rate
   - Alert if high delay rate for specific doctor/service

---

## 📞 Support

Nếu có vấn đề khi tích hợp API delay appointment:
1. Check console logs (có log chi tiết request/response)
2. Verify permission `DELAY_APPOINTMENT` trong user context
3. Check appointment status (phải là SCHEDULED hoặc CHECKED_IN)
4. Test với Postman/curl trước để verify backend API
5. Contact backend team nếu error message không match documentation

---

**Last Updated:** November 16, 2025  
**Author:** GitHub Copilot  
**Status:** ✅ Implementation Complete - Ready for Testing
