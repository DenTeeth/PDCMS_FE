# Issue #BE-EMPLOYEE-CONTRACT: Validation Employee Contract End Date trong Auto-Schedule Treatment Plans

**Ngày tạo:** 2025-01-07  
**Độ ưu tiên:** 🔴 HIGH PRIORITY  
**Người phụ trách:** Backend Team  
**Trạng thái:** ⏳ PENDING  
**Loại:** Bug Fix + Feature Enhancement

---

## 📋 VẤN ĐỀ

### Mô tả

Khi auto-schedule appointments từ treatment plan, hệ thống hiện tại **KHÔNG validate** xem bác sĩ được chỉ định có còn hợp đồng (contract) hay không khi appointment được suggest trong tương lai.

### Tình huống cụ thể

**Scenario:**
- Bệnh nhân có treatment plan kéo dài từ tháng 10/2025 → tháng 2/2026
- Bác sĩ phụ trách (assigned doctor) có hợp đồng chỉ đến **31/12/2025**
- Khi auto-schedule, hệ thống vẫn suggest appointments vào tháng 1-2/2026 với bác sĩ đã hết hợp đồng

**Hệ quả:**
- ❌ Appointments được suggest nhưng không có bác sĩ phụ trách
- ❌ User không biết bác sĩ sẽ hết hợp đồng
- ❌ Phải manually reassign doctor sau này
- ❌ Gây confusion cho bệnh nhân

---

## 🔍 PHÂN TÍCH KỸ THUẬT

### Code hiện tại

**File:** `TreatmentPlanAutoScheduleService.java`

**Vấn đề:**
1. Không check `employee.contractEndDate` khi suggest appointments
2. `findAvailableSlots()` là simplified implementation (có TODO comment)
3. `AutoScheduleRequest.employeeCode` là optional nhưng không validate availability trong tương lai

**Code hiện tại:**
```java
// TreatmentPlanAutoScheduleService.generateSuggestionForItem()
// STEP 3: Find available slots (simplified - you can expand this later)
List<AutoScheduleResponse.TimeSlot> availableSlots = findAvailableSlots(
    proposedDate,
    service,
    request
);
```

**Missing validation:**
```java
// ❌ KHÔNG CÓ: Check employee contract end date
if (request.getEmployeeCode() != null) {
    Employee employee = employeeRepository.findOneByEmployeeCode(...);
    // ❌ KHÔNG CHECK: employee.getContractEndDate()
    // ❌ KHÔNG CHECK: proposedDate.isAfter(contractEndDate)
}
```

### Database Schema

**Bảng `employees`:**
- Cần xác nhận có field `contract_end_date` hoặc tương đương
- Nếu chưa có → cần thêm migration

**Bảng `patient_treatment_plans`:**
- Hiện tại chỉ có `created_by` (người tạo plan)
- **THIẾU:** `assigned_doctor_id` (bác sĩ phụ trách chính)

---

## ✅ YÊU CẦU

### Requirement 1: Validation trong Auto-Schedule

Khi generate suggestions, nếu `employeeCode` được chỉ định:

1. **Check contract end date:**
   - Nếu `suggestedDate > employee.contractEndDate` → **WARNING** trong suggestion
   - Không block suggestion, nhưng phải thông báo rõ ràng

2. **Response structure:**
```json
{
  "itemId": 456,
  "suggestedDate": "2026-01-15",
  "originalEstimatedDate": "2026-01-10",
  "warning": "Bác sĩ NV-2001 (Trịnh Công Thái) sẽ hết hợp đồng vào 31/12/2025. Cần chỉ định bác sĩ mới cho appointment này.",
  "requiresReassign": true,
  "employeeContractEndDate": "2025-12-31",
  "availableSlots": [...]
}
```

### Requirement 2: Enhanced Employee Availability Check

Cải thiện `findAvailableSlots()` để check:

1. **Employee contract status:**
   - Active: `contractEndDate == null` hoặc `contractEndDate >= suggestedDate`
   - Expired: `contractEndDate < suggestedDate`

2. **Employee shifts:**
   - Check xem employee có shift vào ngày suggested không
   - Nếu không có shift → mark slot as unavailable với reason

3. **Employee existing appointments:**
   - Check conflicts với appointments đã có

### Requirement 3: Treatment Plan Assigned Doctor (Optional - Phase 2)

**Database Migration:**
```sql
ALTER TABLE patient_treatment_plans
ADD COLUMN assigned_doctor_id BIGINT,
ADD CONSTRAINT fk_treatment_plan_assigned_doctor
    FOREIGN KEY (assigned_doctor_id) REFERENCES employees(employee_id);
```

**Business Logic:**
- Khi auto-schedule, nếu plan có `assignedDoctor` → ưu tiên dùng bác sĩ này
- Nếu `assignedDoctor` hết hợp đồng trước `expectedEndDate` → warning
- API để reassign doctor cho plan

---

## 🔧 TRIỂN KHAI

### Phase 1: Validation (IMMEDIATE)

**File:** `TreatmentPlanAutoScheduleService.java`

**Changes:**

1. **Add employee validation method:**
```java
/**
 * Validate employee is available on suggested date.
 * Checks contract end date and returns warning if needed.
 */
private EmployeeAvailabilityCheck validateEmployeeAvailability(
        String employeeCode,
        LocalDate suggestedDate) {
    
    if (employeeCode == null) {
        return EmployeeAvailabilityCheck.available(); // No preference
    }
    
    Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
        .orElseThrow(() -> new BadRequestAlertException(
            "Bác sĩ không tồn tại: " + employeeCode,
            ENTITY_NAME,
            "EMPLOYEE_NOT_FOUND"));
    
    // Check if employee is active
    if (!employee.isActive()) {
        return EmployeeAvailabilityCheck.unavailable(
            "Bác sĩ " + employee.getFullName() + " không còn hoạt động.");
    }
    
    // Check contract end date
    if (employee.getContractEndDate() != null) {
        if (suggestedDate.isAfter(employee.getContractEndDate())) {
            return EmployeeAvailabilityCheck.warning(
                "Bác sĩ " + employee.getFullName() + 
                " sẽ hết hợp đồng vào " + 
                employee.getContractEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                ". Cần chỉ định bác sĩ mới cho appointment này.",
                employee.getContractEndDate());
        }
    }
    
    return EmployeeAvailabilityCheck.available();
}
```

2. **Update generateSuggestionForItem():**
```java
// After STEP 1 (holiday adjustment), before STEP 2 (spacing rules)

// STEP 1.5: Validate employee availability
EmployeeAvailabilityCheck employeeCheck = validateEmployeeAvailability(
    request.getEmployeeCode(),
    proposedDate
);

if (employeeCheck.hasWarning()) {
    adjustmentReason = (adjustmentReason != null ? adjustmentReason + "; " : "") + 
                      employeeCheck.getWarning();
}
```

3. **Update AppointmentSuggestion DTO:**
```java
@Data
@Builder
public static class AppointmentSuggestion {
    // ... existing fields ...
    
    /**
     * Warning message if employee contract expires before suggested date
     */
    private String warning;
    
    /**
     * Whether this suggestion requires doctor reassignment
     */
    private Boolean requiresReassign;
    
    /**
     * Employee contract end date (if applicable)
     */
    private LocalDate employeeContractEndDate;
}
```

### Phase 2: Enhanced Availability Check

**File:** `TreatmentPlanAutoScheduleService.java`

**Improve findAvailableSlots():**

```java
private List<AutoScheduleResponse.TimeSlot> findAvailableSlots(
        LocalDate date,
        DentalService service,
        AutoScheduleRequest request) {
    
    List<AutoScheduleResponse.TimeSlot> slots = new ArrayList<>();
    
    // If employee code specified, check actual availability
    if (request.getEmployeeCode() != null) {
        Employee employee = employeeRepository.findOneByEmployeeCode(
            request.getEmployeeCode()).orElse(null);
        
        if (employee != null) {
            // Check employee contract
            if (employee.getContractEndDate() != null && 
                date.isAfter(employee.getContractEndDate())) {
                // Employee contract expired - no slots available
                return slots; // Empty list
            }
            
            // Check employee shifts for this date
            List<EmployeeShift> shifts = employeeShiftRepository
                .findByEmployeeAndWorkDate(employee.getEmployeeId(), date);
            
            if (shifts.isEmpty()) {
                // No shift on this date - no slots available
                return slots;
            }
            
            // Check existing appointments
            List<Appointment> existingAppointments = appointmentRepository
                .findByEmployeeAndDate(employee.getEmployeeId(), date);
            
            // Calculate available slots based on shifts and existing appointments
            slots = calculateAvailableSlotsFromShifts(
                shifts, 
                existingAppointments, 
                service.getDefaultDurationMinutes()
            );
        }
    } else {
        // No employee preference - return standard slots
        slots = getStandardTimeSlots(service);
    }
    
    return slots;
}
```

### Phase 3: Reassign Doctor API (Future)

**New Endpoint:**
```
PATCH /api/v1/treatment-plans/{planId}/reassign-doctor
```

**Request:**
```json
{
  "newDoctorCode": "EMP-2026-001",
  "effectiveFrom": "2026-01-01",
  "reason": "Bác sĩ cũ hết hợp đồng"
}
```

**Response:**
```json
{
  "planId": 123,
  "oldDoctor": {
    "employeeCode": "EMP-2025-001",
    "fullName": "Trịnh Công Thái",
    "contractEndDate": "2025-12-31"
  },
  "newDoctor": {
    "employeeCode": "EMP-2026-001",
    "fullName": "Nguyễn Văn A"
  },
  "effectiveFrom": "2026-01-01",
  "affectedAppointments": 5
}
```

---

## 🧪 TEST CASES

### Test Case 1: Employee Contract Expires Before Suggested Date

**Input:**
- Treatment plan: 10/2025 → 02/2026
- Employee: `EMP-001`, contract end: `2025-12-31`
- Auto-schedule request: `employeeCode = "EMP-001"`
- Suggested date: `2026-01-15`

**Expected Output:**
```json
{
  "suggestedDate": "2026-01-15",
  "warning": "Bác sĩ Trịnh Công Thái sẽ hết hợp đồng vào 31/12/2025. Cần chỉ định bác sĩ mới cho appointment này.",
  "requiresReassign": true,
  "employeeContractEndDate": "2025-12-31",
  "availableSlots": []  // No slots because employee unavailable
}
```

### Test Case 2: Employee Contract Valid

**Input:**
- Employee: `EMP-001`, contract end: `2026-12-31`
- Suggested date: `2026-01-15`

**Expected Output:**
```json
{
  "suggestedDate": "2026-01-15",
  "warning": null,
  "requiresReassign": false,
  "availableSlots": [
    { "startTime": "09:00", "endTime": "10:30", "available": true }
  ]
}
```

### Test Case 3: No Employee Specified

**Input:**
- Auto-schedule request: `employeeCode = null`

**Expected Output:**
- No warning
- System suggests available doctors
- Standard time slots returned

---

## 📊 DATABASE QUERIES FOR TESTING

### Check employee contract end dates:
```sql
SELECT 
    e.employee_code,
    e.full_name,
    e.contract_start_date,
    e.contract_end_date,
    CASE 
        WHEN e.contract_end_date IS NULL THEN 'Permanent'
        WHEN e.contract_end_date < CURRENT_DATE THEN 'Expired'
        WHEN e.contract_end_date < CURRENT_DATE + INTERVAL '3 months' THEN 'Expiring Soon'
        ELSE 'Active'
    END AS contract_status
FROM employees e
WHERE e.is_active = true
ORDER BY e.contract_end_date NULLS LAST;
```

### Find treatment plans with appointments after employee contract ends:
```sql
SELECT 
    ptp.plan_id,
    ptp.plan_code,
    ptp.expected_end_date,
    e.employee_code AS assigned_doctor_code,
    e.full_name AS assigned_doctor_name,
    e.contract_end_date,
    COUNT(a.appointment_id) AS appointments_after_contract_end
FROM patient_treatment_plans ptp
LEFT JOIN employees e ON ptp.assigned_doctor_id = e.employee_id
LEFT JOIN appointments a ON a.patient_id = ptp.patient_id
    AND a.appointment_start_time::date > e.contract_end_date
WHERE e.contract_end_date IS NOT NULL
    AND ptp.expected_end_date > e.contract_end_date
GROUP BY ptp.plan_id, e.employee_id;
```

---

## 🚨 LƯU Ý QUAN TRỌNG

### Cho BE:
1. **Backward Compatibility:** 
   - Nếu `employee.contractEndDate` chưa có trong DB → treat as permanent (no warning)
   - Không break existing auto-schedule functionality

2. **Performance:**
   - Cache employee contract data nếu có thể
   - Batch check multiple employees trong một request

3. **Error Handling:**
   - Nếu employee không tồn tại → return error, không crash
   - Nếu contract data missing → log warning, continue with standard slots

### Cho FE:
1. **UI Display:**
   - Hiển thị warning badge màu vàng/cam cho suggestions có `requiresReassign = true`
   - Show tooltip với chi tiết contract end date
   - Disable "Confirm" button nếu `requiresReassign = true` và chưa chọn bác sĩ mới

2. **User Flow:**
   - Khi user thấy warning → có option "Chọn bác sĩ khác"
   - FE gọi lại auto-schedule với `employeeCode` mới
   - Hoặc gọi reassign API (nếu implement)

---

## ✅ CHECKLIST TRIỂN KHAI

- [ ] **Phase 1: Validation**
  - [ ] Add `validateEmployeeAvailability()` method
  - [ ] Update `generateSuggestionForItem()` to call validation
  - [ ] Add `warning`, `requiresReassign`, `employeeContractEndDate` fields to `AppointmentSuggestion`
  - [ ] Update `AutoScheduleResponse` DTO
  - [ ] Unit tests for validation logic
  - [ ] Integration tests with sample data

- [ ] **Phase 2: Enhanced Availability**
  - [ ] Improve `findAvailableSlots()` to check employee shifts
  - [ ] Check employee existing appointments
  - [ ] Return unavailable slots with reasons
  - [ ] Performance optimization (caching, batch queries)

- [ ] **Phase 3: Reassign API (Optional)**
  - [ ] Database migration: Add `assigned_doctor_id` to `patient_treatment_plans`
  - [ ] Create `TreatmentPlanReassignService`
  - [ ] Add `PATCH /treatment-plans/{id}/reassign-doctor` endpoint
  - [ ] Update affected appointments
  - [ ] Send notifications to patient

---

## 📞 SUPPORT & CONTACT

**Issue Tracking:** ISSUE_BE_EMPLOYEE_CONTRACT_END_DATE_VALIDATION  
**Related Issues:**
- [ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS.md](./ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS.md)

**Questions?** Contact team qua Slack channel #backend-support

---

**END OF DOCUMENT**

