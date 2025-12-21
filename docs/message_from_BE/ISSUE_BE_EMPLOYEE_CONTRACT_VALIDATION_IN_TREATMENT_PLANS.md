# Issue #BE-EMPLOYEE-CONTRACT: Validation Employee Contract End Date trong Treatment Plan Auto-Schedule

**Ngày tạo:** 2025-01-07  
**Độ ưu tiên:** 🔴 HIGH PRIORITY  
**Người phụ trách:** TBD (Backend Team)  
**Trạng thái:** 📋 PENDING  
**Loại:** Bug/Enhancement - Backend API

---

## 📋 MÔ TẢ VẤN ĐỀ

### Vấn đề hiện tại:

Khi auto-schedule appointments từ Treatment Plan, hệ thống **KHÔNG kiểm tra** xem bác sĩ được chỉ định có còn hợp đồng (contract) hay không khi appointment được suggest trong tương lai.

### Tình huống cụ thể:

1. **Bệnh nhân A** có Treatment Plan kéo dài từ **tháng 11/2025 → tháng 2/2026**
2. **Bác sĩ B** được chỉ định làm bác sĩ phụ trách (qua `employeeCode` trong `AutoScheduleRequest`)
3. **Bác sĩ B** có hợp đồng chỉ đến **31/12/2025**
4. Khi gọi API `POST /api/v1/treatment-plans/{planId}/auto-schedule`:
   - Hệ thống suggest appointments cho cả tháng 1-2/2026
   - **KHÔNG có validation** về contract end date của bác sĩ
   - Kết quả: Appointments sau 31/12/2025 **không có bác sĩ phụ trách**

### Hệ quả:

- ❌ Appointments được suggest nhưng không thể book (bác sĩ đã hết hợp đồng)
- ❌ User phải tự phát hiện và xử lý thủ công
- ❌ Thiếu tính nhất quán trong business logic
- ❌ Có thể gây nhầm lẫn cho bệnh nhân

---

## 🎯 YÊU CẦU

### Yêu cầu 1: Validation Employee Contract trong Auto-Schedule

Khi generate suggestions trong `TreatmentPlanAutoScheduleService`:

1. **Nếu `request.employeeCode` được chỉ định:**
   - Validate employee tồn tại và active
   - **Check `employee.contractEndDate`** (nếu có)
   - Nếu `suggestedDate > contractEndDate`:
     - **Option A (Recommended):** Thêm warning vào suggestion, vẫn suggest nhưng đánh dấu cần reassign
     - **Option B:** Skip employee này, suggest employee khác available
     - **Option C:** Fail suggestion với error message rõ ràng

2. **Nếu `request.employeeCode` = null:**
   - Khi suggest appointments trong tương lai xa, cần check employee availability
   - Đảm bảo suggested employee có contract còn hiệu lực vào ngày suggest

### Yêu cầu 2: Thêm Warning Field vào Response

Thêm field `warning` vào `AppointmentSuggestion`:

```java
public static class AppointmentSuggestion {
    // ... existing fields ...
    
    /**
     * Warning message if there are potential issues.
     * Example: "Bác sĩ sẽ hết hợp đồng vào 31/12/2025"
     */
    private String warning;
    
    /**
     * Whether this suggestion requires doctor reassignment.
     */
    private Boolean requiresReassign;
}
```

### Yêu cầu 3: Improve findAvailableSlots() Implementation

Hiện tại `findAvailableSlots()` là simplified (có TODO comment). Cần:

1. Check employee availability (shifts, existing appointments)
2. Check employee contract status
3. Check employee specialization compatibility với service
4. Return actual available slots thay vì static slots

---

## 🔧 TRIỂN KHAI ĐỀ XUẤT

### 1. Database Schema

**Bảng `employees`** - Cần có field:
```sql
-- Kiểm tra xem đã có chưa
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('contract_start_date', 'contract_end_date', 'employment_status');
```

Nếu chưa có, cần thêm:
```sql
ALTER TABLE employees
ADD COLUMN contract_start_date DATE,
ADD COLUMN contract_end_date DATE,
ADD COLUMN employment_status VARCHAR(20) DEFAULT 'ACTIVE'; -- ACTIVE, TERMINATED, ON_LEAVE
```

### 2. Service Layer Changes

#### File: `TreatmentPlanAutoScheduleService.java`

**Thêm method validateEmployeeAvailability():**

```java
/**
 * Validate employee is available and contract is valid for suggested date.
 * 
 * @param employeeCode Employee code to validate
 * @param suggestedDate Date to check availability
 * @return Validation result with warning if needed
 */
private EmployeeAvailabilityResult validateEmployeeAvailability(
        String employeeCode, 
        LocalDate suggestedDate) {
    
    if (employeeCode == null) {
        return EmployeeAvailabilityResult.valid();
    }
    
    Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
        .orElseThrow(() -> new BadRequestAlertException(
            "Bác sĩ không tồn tại: " + employeeCode,
            ENTITY_NAME,
            "EMPLOYEE_NOT_FOUND"));
    
    // Check if employee is active
    if (employee.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
        return EmployeeAvailabilityResult.invalid(
            "Bác sĩ không còn hoạt động: " + employee.getFullName());
    }
    
    // Check contract end date
    if (employee.getContractEndDate() != null) {
        if (suggestedDate.isAfter(employee.getContractEndDate())) {
            return EmployeeAvailabilityResult.warning(
                String.format(
                    "Bác sĩ %s sẽ hết hợp đồng vào %s. Appointment này cần chỉ định bác sĩ khác.",
                    employee.getFullName(),
                    employee.getContractEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                ),
                true // requiresReassign
            );
        }
        
        // Check if contract is expiring soon (within 30 days)
        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), employee.getContractEndDate());
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
            return EmployeeAvailabilityResult.warning(
                String.format(
                    "Bác sĩ %s sẽ hết hợp đồng sau %d ngày (%s).",
                    employee.getFullName(),
                    daysUntilExpiry,
                    employee.getContractEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                ),
                false // doesn't require immediate reassign
            );
        }
    }
    
    return EmployeeAvailabilityResult.valid();
}

/**
 * Helper class for employee availability validation result.
 */
@lombok.Value
private static class EmployeeAvailabilityResult {
    boolean valid;
    String warning;
    boolean requiresReassign;
    
    static EmployeeAvailabilityResult valid() {
        return new EmployeeAvailabilityResult(true, null, false);
    }
    
    static EmployeeAvailabilityResult warning(String warning, boolean requiresReassign) {
        return new EmployeeAvailabilityResult(true, warning, requiresReassign);
    }
    
    static EmployeeAvailabilityResult invalid(String error) {
        return new EmployeeAvailabilityResult(false, error, false);
    }
}
```

**Update generateSuggestionForItem() method:**

```java
private AutoScheduleResponse.AppointmentSuggestion generateSuggestionForItem(
        PatientPlanItem item,
        PatientTreatmentPlan plan,
        AutoScheduleRequest request,
        AutoScheduleResponse.SchedulingSummary summary) {
    
    // ... existing code ...
    
    // STEP 0: Validate employee availability (NEW)
    EmployeeAvailabilityResult employeeValidation = validateEmployeeAvailability(
        request.getEmployeeCode(),
        proposedDate
    );
    
    if (!employeeValidation.isValid()) {
        // Employee not available → fail suggestion
        return AutoScheduleResponse.AppointmentSuggestion.builder()
            .itemId(item.getItemId())
            .serviceCode(service.getServiceCode())
            .serviceName(service.getServiceName())
            .success(false)
            .errorMessage(employeeValidation.getWarning())
            .build();
    }
    
    // ... continue with existing steps ...
    
    // Build suggestion with warning if needed
    return AutoScheduleResponse.AppointmentSuggestion.builder()
        .itemId(item.getItemId())
        .serviceCode(service.getServiceCode())
        .serviceName(service.getServiceName())
        .suggestedDate(proposedDate)
        .originalEstimatedDate(originalDate)
        .holidayAdjusted(holidayAdjusted)
        .spacingAdjusted(spacingAdjusted)
        .adjustmentReason(adjustmentReason)
        .availableSlots(availableSlots)
        .warning(employeeValidation.getWarning()) // NEW
        .requiresReassign(employeeValidation.isRequiresReassign()) // NEW
        .success(true)
        .build();
}
```

### 3. DTO Changes

#### File: `AutoScheduleResponse.java`

**Update AppointmentSuggestion class:**

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public static class AppointmentSuggestion {
    // ... existing fields ...
    
    /**
     * Warning message if there are potential issues.
     * Examples:
     * - "Bác sĩ sẽ hết hợp đồng vào 31/12/2025"
     * - "Bác sĩ sẽ hết hợp đồng sau 15 ngày"
     */
    private String warning;
    
    /**
     * Whether this suggestion requires doctor reassignment before booking.
     * true = Must reassign doctor before creating appointment
     * false = Warning only, can still proceed
     */
    private Boolean requiresReassign;
}
```

### 4. Improve findAvailableSlots() Implementation

**Current (simplified):**
```java
// TODO: Implement actual availability checking with doctor/room conflicts
```

**Proposed implementation:**

```java
private List<AutoScheduleResponse.TimeSlot> findAvailableSlots(
        LocalDate date,
        DentalService service,
        AutoScheduleRequest request) {
    
    List<AutoScheduleResponse.TimeSlot> slots = new ArrayList<>();
    
    // If employeeCode specified, check their availability
    if (request.getEmployeeCode() != null) {
        Employee employee = employeeRepository.findOneByEmployeeCode(request.getEmployeeCode())
            .orElse(null);
        
        if (employee != null) {
            // Check employee contract
            if (employee.getContractEndDate() != null && 
                date.isAfter(employee.getContractEndDate())) {
                // Employee contract expired → no slots available
                return slots; // Empty list
            }
            
            // Check employee shifts for this date
            List<EmployeeShift> shifts = employeeShiftRepository
                .findByEmployeeIdAndWorkDate(employee.getEmployeeId(), date);
            
            if (shifts.isEmpty()) {
                // No shifts on this date → employee not available
                slots.add(AutoScheduleResponse.TimeSlot.builder()
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(17, 0))
                    .available(false)
                    .unavailableReason("Bác sĩ không có ca làm việc vào ngày này")
                    .build());
                return slots;
            }
            
            // Check existing appointments
            List<Appointment> existingAppointments = appointmentRepository
                .findByEmployeeCodeAndDate(request.getEmployeeCode(), date);
            
            // Calculate available slots based on shifts and existing appointments
            // ... implementation details ...
        }
    }
    
    // Fallback: Return standard slots (current behavior)
    // ... existing code ...
    
    return slots;
}
```

---

## 🧪 TEST CASES

### Test Case 1: Employee Contract Expired Before Suggested Date

**Input:**
- Treatment Plan: 11/2025 → 02/2026
- Employee Code: "EMP-001"
- Employee Contract End Date: 31/12/2025
- Suggested Date: 15/01/2026

**Expected Output:**
```json
{
  "suggestedDate": "2026-01-15",
  "warning": "Bác sĩ Nguyễn Văn A sẽ hết hợp đồng vào 31/12/2025. Appointment này cần chỉ định bác sĩ khác.",
  "requiresReassign": true,
  "success": true
}
```

### Test Case 2: Employee Contract Expiring Soon (Within 30 Days)

**Input:**
- Suggested Date: 20/12/2025
- Employee Contract End Date: 31/12/2025 (11 days away)

**Expected Output:**
```json
{
  "suggestedDate": "2025-12-20",
  "warning": "Bác sĩ Nguyễn Văn A sẽ hết hợp đồng sau 11 ngày (31/12/2025).",
  "requiresReassign": false,
  "success": true
}
```

### Test Case 3: Employee Contract Valid

**Input:**
- Suggested Date: 15/01/2026
- Employee Contract End Date: 31/03/2026

**Expected Output:**
```json
{
  "suggestedDate": "2026-01-15",
  "warning": null,
  "requiresReassign": false,
  "success": true
}
```

### Test Case 4: Employee Not Active

**Input:**
- Employee Status: TERMINATED
- Suggested Date: 15/01/2026

**Expected Output:**
```json
{
  "success": false,
  "errorMessage": "Bác sĩ không còn hoạt động: Nguyễn Văn A"
}
```

---

## 📊 IMPACT ANALYSIS

### Affected Modules:

1. **TreatmentPlanAutoScheduleService** - Core logic changes
2. **AutoScheduleResponse DTO** - Add warning fields
3. **Employee Domain** - Need contract fields (if not exists)
4. **EmployeeShiftRepository** - Query shifts for availability
5. **AppointmentRepository** - Query existing appointments

### Breaking Changes:

- ✅ **None** - Only adding new optional fields to response
- ✅ Backward compatible - Existing API calls still work
- ✅ New fields are optional (nullable)

### Performance Impact:

- Minimal - Only 1 additional query per suggestion (employee lookup)
- Can be optimized with caching if needed

---

## 🚨 LƯU Ý QUAN TRỌNG

### Cho BE Team:

1. **Check Employee Schema First:**
   - Verify `employees` table có `contract_end_date` field chưa
   - Nếu chưa có → cần migration script

2. **Business Logic Decision:**
   - **Option A (Recommended):** Warning + `requiresReassign = true` → FE hiển thị warning, user có thể reassign
   - **Option B:** Fail suggestion → User phải chọn employee khác ngay từ đầu
   - **Option C:** Auto-suggest alternative employee → Phức tạp hơn, cần logic matching

3. **Future Enhancement:**
   - Consider adding `assignedDoctor` field to `PatientTreatmentPlan` for long-term assignment
   - Consider reassign doctor API endpoint

### Cho FE Team:

1. **Handle Warning Field:**
   - Display warning message prominently
   - If `requiresReassign = true` → Disable "Book" button, show "Reassign Doctor" option
   - If `requiresReassign = false` → Show warning but allow booking

2. **UI/UX:**
   - Warning badge/icon on suggestions with warnings
   - Tooltip explaining the issue
   - Easy reassign flow

---

## ✅ CHECKLIST TRIỂN KHAI

- [ ] Verify `employees` table schema (contract fields)
- [ ] Add migration script if needed
- [ ] Implement `validateEmployeeAvailability()` method
- [ ] Update `generateSuggestionForItem()` to use validation
- [ ] Add `warning` and `requiresReassign` fields to DTO
- [ ] Improve `findAvailableSlots()` implementation
- [ ] Add unit tests for validation logic
- [ ] Add integration tests for auto-schedule with expired contracts
- [ ] Update API documentation
- [ ] Deploy to staging for testing

---

## 📞 SUPPORT & CONTACT

**Issue Created By:** Frontend Team  
**Date:** 2025-01-07  
**Related Issues:**
- [ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS.md](./ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS.md)

**Questions?** Contact team qua Slack channel #backend-support

---

**END OF DOCUMENT**



