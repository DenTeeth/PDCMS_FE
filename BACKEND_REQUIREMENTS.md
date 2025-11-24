# 🔧 Backend Requirements - Registration System

Tài liệu tổng hợp tất cả yêu cầu backend cần implement/fix cho hệ thống đăng ký ca làm việc.

---

## 📊 Tổng quan

| # | Yêu cầu | Priority | Status |
|---|---------|----------|--------|
| 1 | Fix Slot Availability Bug | 🔴 HIGH | ⏳ Pending |
| 2 | Add Employee Name Field | 🟡 MEDIUM | ⏳ Pending |
| 3 | Add Cancel & View API | 🟡 MEDIUM | ⏳ Pending |

---

# 🔴 1. Fix Slot Availability Bug (HIGH PRIORITY)

## ❌ Vấn đề

**Sau khi approve registration → Slot availability KHÔNG giảm**

Ví dụ:
- Slot có 22/22 slots available
- Admin approve 1 đơn
- Vẫn hiển thị 22/22 slots ❌ (phải là 21/22 ✅)

## 🔍 Root Cause

Backend **KHÔNG trừ slot** khi tính `totalDatesAvailable`. Logic hiện tại:
- ❌ Đếm tất cả ngày (không phân biệt APPROVED hay PENDING)
- ❌ Không recalculate sau khi approve/reject

## ✅ Logic đúng

```
Slot khả dụng = Tổng slot - Slot đã APPROVED
```

**Quan trọng:**
- ✅ CHỈ trừ registrations có status = `APPROVED`
- ❌ KHÔNG trừ `PENDING` hoặc `REJECTED`

## 📊 Ví dụ

**Setup:**
- Slot: Thứ 4, quota=2, tháng 11 có 5 ngày
- Total slots: 5 × 2 = 10 slots

**Scenarios:**
```
1. Initial: 0 approved → Available: 10/10 ✅
2. Approve 1 → Available: 9/10 ✅
3. Approve 1 more (same day) → Available: 8/10, totalDatesAvailable: 4 ✅
4. Add 5 PENDING → Available: 8/10 (không đổi!) ✅
```

## 🔧 Implementation

### 1. Fix `totalDatesAvailable` calculation

```java
// Cho mỗi tháng trong slot period
for (LocalDate date : workingDaysInMonth) {
    // Đếm số registrations APPROVED trên ngày này
    long approvedCount = registrations.stream()
        .filter(r -> r.getStatus() == RegistrationStatus.APPROVED)  // ← CHỈ APPROVED!
        .filter(r -> r.getDates().contains(date))
        .count();
    
    // Nếu còn slot → tăng totalDatesAvailable
    if (approvedCount < quota) {
        totalDatesAvailable++;
    }
}
```

### 2. Recalculate sau approve/reject

```java
@Transactional
public void updateRegistrationStatus(Long id, String status) {
    // Update status
    registration.setStatus(status);
    save(registration);
    
    // ← THÊM: Recalculate slot availability
    slotAvailabilityCache.invalidate(registration.getPartTimeSlotId());
}
```

## 📋 APIs cần fix

1. `GET /api/v1/registrations/part-time-flex/slots/{slotId}/details`
2. `GET /api/v1/registrations/part-time-flex/available-slots`
3. `PUT /api/v1/registrations/part-time-flex/{id}/status`

## 🎯 Impact

**Hiện tại:**
- ❌ Employee có thể đăng ký vào slot đã đầy → Overbooking!
- ❌ Admin không biết slot nào còn trống

**Urgency:** **CẦN FIX NGAY** để tránh overbooking!

---

# 🟡 2. Add Employee Name Field (MEDIUM PRIORITY)

## ❌ Vấn đề

API registration response **chỉ có `employeeId`, không có `employeeName`**

Frontend hiển thị: **"ID: 3"** thay vì tên nhân viên.

## ✅ Yêu cầu

Thêm field `employeeName` vào response của các API:

### APIs cần update:

1. `GET /api/v1/registrations/part-time-flex`
2. `GET /api/v1/registrations/part-time-flex/my-registrations`
3. `GET /api/v1/registrations/part-time-flex/{id}`

### Response hiện tại:
```json
{
  "registrationId": 123,
  "employeeId": 3,
  "shiftName": "Ca Part-time Chiều (13h-17h)",
  ...
}
```

### Response cần có:
```json
{
  "registrationId": 123,
  "employeeId": 3,
  "employeeName": "Nguyễn Văn A",  // ← THÊM FIELD NÀY
  "shiftName": "Ca Part-time Chiều (13h-17h)",
  ...
}
```

## 🔧 Implementation Options

### Option 1: Join với Employee table
```java
@Query("SELECT r, e.fullName FROM ShiftRegistration r " +
       "LEFT JOIN Employee e ON r.employeeId = e.id")
```

### Option 2: DTO Projection
```java
public class ShiftRegistrationDTO {
    private Long registrationId;
    private Long employeeId;
    private String employeeName;  // ← Thêm field này
    // ... other fields
}
```

### Option 3: Add to Entity
```java
@Entity
public class ShiftRegistration {
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
    
    public String getEmployeeName() {
        return employee != null ? employee.getFullName() : null;
    }
}
```

## 🎯 Impact

- UX không tốt (admin không biết nhân viên nào)
- Vẫn hoạt động được nhưng không user-friendly

**Urgency:** Nên fix trong sprint này

---

# 🟡 3. Add Cancel & View API (MEDIUM PRIORITY)

## ❌ Vấn đề

Trang Employee Registrations hiện tại:
- ✅ Có nút "Xóa" (Delete) cho PENDING
- ❌ KHÔNG có nút "View" để xem chi tiết
- ❌ KHÔNG có API "Cancel" riêng (đang dùng Delete)

## ✅ Yêu cầu

### 3.1. API Cancel Registration

**Endpoint:** `PUT /api/v1/registrations/part-time-flex/{id}/cancel`

**Description:** Employee tự cancel đơn đăng ký (chỉ PENDING)

**Request:**
```http
PUT /api/v1/registrations/part-time-flex/123/cancel
Authorization: Bearer {employee_token}
```

**Response:**
```json
{
  "registrationId": 123,
  "status": "CANCELLED",
  "cancelledAt": "2025-11-24T10:30:00",
  "cancelledBy": "employee_id_3"
}
```

**Business Rules:**
- ✅ Chỉ employee sở hữu registration mới có thể cancel
- ✅ Chỉ cancel được status = `PENDING`
- ❌ Không thể cancel `APPROVED` hoặc `REJECTED`
- ✅ Sau khi cancel → Slot availability phải tăng lên

**Error Cases:**
```json
// Not owner
{
  "error": "FORBIDDEN",
  "message": "You can only cancel your own registrations"
}

// Already approved
{
  "error": "INVALID_STATUS",
  "message": "Cannot cancel approved registration"
}
```

### 3.2. API View Registration Details

**Endpoint:** `GET /api/v1/registrations/part-time-flex/{id}`

**Description:** Employee xem chi tiết đơn đăng ký

**Request:**
```http
GET /api/v1/registrations/part-time-flex/123
Authorization: Bearer {employee_token}
```

**Response:**
```json
{
  "registrationId": 123,
  "employeeId": 3,
  "employeeName": "Nguyễn Văn A",
  "partTimeSlotId": 456,
  "shiftName": "Ca Part-time Chiều (13h-17h)",
  "dayOfWeek": "WEDNESDAY,THURSDAY",
  "effectiveFrom": "2025-11-24",
  "effectiveTo": "2026-02-04",
  "status": "PENDING",
  "reason": null,
  "createdAt": "2025-11-24T10:00:00",
  "dates": ["2025-11-24", "2025-11-27", ...],
  "totalWorkingDays": 11,
  "hoursPerWeek": 4
}
```

**Business Rules:**
- ✅ Employee chỉ xem được registration của mình
- ✅ Admin có thể xem tất cả

## 🔧 Implementation

### 1. Update Status Enum

```java
public enum RegistrationStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED  // ← THÊM STATUS MỚI
}
```

### 2. Cancel API

```java
@PutMapping("/{id}/cancel")
public ResponseEntity<?> cancelRegistration(
    @PathVariable Long id,
    @AuthenticationPrincipal UserDetails userDetails
) {
    Long employeeId = getEmployeeIdFromToken(userDetails);
    
    ShiftRegistration registration = registrationRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Registration not found"));
    
    // Check ownership
    if (!registration.getEmployeeId().equals(employeeId)) {
        throw new ForbiddenException("You can only cancel your own registrations");
    }
    
    // Check status
    if (!registration.getStatus().equals(RegistrationStatus.PENDING)) {
        throw new InvalidStatusException("Cannot cancel " + registration.getStatus());
    }
    
    // Cancel
    registration.setStatus(RegistrationStatus.CANCELLED);
    registration.setCancelledAt(LocalDateTime.now());
    registrationRepository.save(registration);
    
    // Recalculate availability
    recalculateSlotAvailability(registration.getPartTimeSlotId());
    
    return ResponseEntity.ok(registration);
}
```

### 3. View API

```java
@GetMapping("/{id}")
public ResponseEntity<?> getRegistrationDetails(
    @PathVariable Long id,
    @AuthenticationPrincipal UserDetails userDetails
) {
    Long employeeId = getEmployeeIdFromToken(userDetails);
    
    ShiftRegistration registration = registrationRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Registration not found"));
    
    // Check ownership (unless admin)
    if (!isAdmin(userDetails) && !registration.getEmployeeId().equals(employeeId)) {
        throw new ForbiddenException("You can only view your own registrations");
    }
    
    return ResponseEntity.ok(registration);
}
```

## 🎯 Impact

- Cải thiện UX cho employee
- Employee có thể tự cancel thay vì xóa
- Employee có thể xem chi tiết đơn

**Urgency:** Nên implement trong sprint này

---

## 📞 Contact

Nếu cần clarification về bất kỳ yêu cầu nào, liên hệ Frontend team.

**Frontend đã sẵn sàng:**
- ✅ UI đã implement (chờ API)
- ✅ Refresh button để cập nhật data
- ✅ Fallback display khi thiếu data

**Chờ backend:**
- ❌ Fix slot availability calculation
- ❌ Add employeeName field
- ❌ Add cancel & view APIs

