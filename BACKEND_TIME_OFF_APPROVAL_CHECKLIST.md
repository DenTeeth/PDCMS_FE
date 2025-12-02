# 🔍 BACKEND TIME-OFF APPROVAL - CHECKLIST FOR DEV

## ❌ Xác nhận lỗi: Duyệt Time-Off Request có requiresBalance = true

### 🎯 Tình trạng hiện tại
- ✅ Backend đã fix lỗi `null value in column "changed_by"`
- ❌ **VẪN CÒN LỖI** khi duyệt time-off type **có yêu cầu leave balance** (ANNUAL_LEAVE)
- ✅ Frontend code hoàn toàn đúng - không có sai sót
- ⚠️ **PHÁT HIỆN THÊM:** API `GET /api/v1/admin/employees/{employeeId}/leave-balances` đang có vấn đề

---

## 🚨 VẤN ĐỀ MỚI PHÁT HIỆN

### ⚠️ CRITICAL: `employeeId` đang là `NaN`!

**URL thực tế:**
```
GET /api/v1/admin/employees/NaN/leave-balances?cycle_year=2025
                              ^^^
Status: 400 Bad Request
```

**Nguyên nhân:**
- `user.employeeId` **không tồn tại** HOẶC **không phải số hợp lệ**
- Frontend đang gọi `Number(user.employeeId)` nhưng kết quả là `NaN`

**Các khả năng:**
1. ❌ User đăng nhập là **Patient** (không có employeeId)
2. ❌ JWT không chứa `employeeId` field
3. ❌ Backend không trả về `employeeId` trong user object
4. ❌ `employeeId` có giá trị `null`, `undefined`, hoặc string không hợp lệ

**Frontend đã fix:**
- ✅ Validate `employeeId` trước khi gọi API
- ✅ Check `isNaN()` và `<= 0`
- ✅ Log chi tiết để debug

**Cần kiểm tra:**
```javascript
// Trong console, check user object:
console.log('User:', user);
console.log('EmployeeId:', user?.employeeId, typeof user?.employeeId);
```

---

### API Leave Balance đang lỗi (OLD ISSUE - ĐÃ TÌM RA NGUYÊN NHÂN)
```
GET /api/v1/admin/employees/{employeeId}/leave-balances?cycle_year=2025
Status: 400 (do employeeId = NaN)
```

~~**Triệu chứng:**~~
~~- Employee time-off requests page không load được leave balances~~
~~- Console error: `LeaveBalanceService.getEmployeeBalances error`~~

**Nguyên nhân thực sự:** `employeeId = NaN` → Backend trả về 400 Bad Request

---

## 🔎 CÁC ĐIỂM CẦN KIỂM TRA TRÊN BACKEND

### 1. ✅ Leave Balance History (ĐÃ FIX)
```java
// ✅ FIXED - TimeOffRequestService.deductLeaveBalance()
LeaveBalanceHistory history = LeaveBalanceHistory.builder()
    .balance(balance)                    // ✅ Use entity
    .changedByEmployee(approverEmployee) // ✅ Use entity
    .changeAmount(-totalDays)
    .changeType(ChangeType.DEDUCT)
    .changeReason("Time-off request approved: " + requestId)
    .build();
```

### 2. ⚠️ CÁC ĐIỂM CẦN KIỂM TRA THÊM

#### A. Employee Entity Fetch
```java
// Kiểm tra xem approverEmployee có được fetch đúng không?
Employee approverEmployee = employeeRepository.findById(approvedBy)
    .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + approvedBy));

// ⚠️ CHÚ Ý: approvedBy phải là employee_id, KHÔNG phải account_id
```

**Câu hỏi kiểm tra:**
- ❓ `approvedBy` có phải là **employee_id** hay **account_id**?
- ❓ Nếu là account_id, cần convert sang employee_id trước
- ❓ Employee với ID này có tồn tại trong database không?

#### B. Leave Balance Check
```java
// Kiểm tra xem leave balance có tồn tại không?
LeaveBalance balance = leaveBalanceRepository
    .findByEmployeeIdAndTimeOffTypeIdAndYear(employeeId, timeOffTypeId, year)
    .orElseThrow(() -> new ResourceNotFoundException("Leave balance not found"));

// ⚠️ CHÚ Ý: Phải có balance trước khi approve
```

**Câu hỏi kiểm tra:**
- ❓ Employee có balance record cho time-off type này chưa?
- ❓ Năm (year) có đúng không? (Phải là năm hiện tại hoặc năm của request)
- ❓ Balance có đủ để deduct không? (`remaining_days >= totalDays`)

#### C. TimeOffType Configuration
```java
// Kiểm tra time-off type configuration
TimeOffType timeOffType = timeOffTypeRepository
    .findById(timeOffTypeId)
    .orElseThrow(() -> new ResourceNotFoundException("Time-off type not found"));

// ⚠️ CHÚ Ý: Chỉ deduct nếu requiresBalance = true
if (timeOffType.isRequiresBalance()) {
    // Deduct logic here
}
```

**Câu hỏi kiểm tra:**
- ❓ Time-off type `requiresBalance` có đúng là `true` không?
- ❓ Logic kiểm tra `requiresBalance` có được thực hiện đúng không?

#### D. Transaction Management
```java
@Transactional
public TimeOffRequestDTO approveRequest(String requestId, Integer approvedBy) {
    // 1. Update request status
    // 2. Deduct leave balance (if requiresBalance = true)
    // 3. Create leave balance history
    // 4. Update employee shifts to ON_LEAVE
    
    // ⚠️ CHÚ Ý: Tất cả phải trong cùng 1 transaction
}
```

**Câu hỏi kiểm tra:**
- ❓ Method có `@Transactional` annotation không?
- ❓ Nếu có lỗi ở bước nào đó, có rollback đúng không?
- ❓ Save order có đúng không? (Balance trước, History sau)

---

## 🧪 CÁC CASE CẦN TEST

### Test Case 1: Approve ANNUAL_LEAVE (requiresBalance = true)

**Preconditions:**
```sql
-- Kiểm tra employee có balance record
SELECT * FROM employee_leave_balances 
WHERE employee_id = ? 
  AND time_off_type_id = 'ANNUAL_LEAVE' 
  AND year = 2025;

-- Kết quả mong đợi:
-- balance_id | employee_id | time_off_type_id | year | total_days | used_days | remaining_days
-- 1          | 2           | ANNUAL_LEAVE     | 2025 | 12.0       | 0.0       | 12.0
```

**Action:** Approve time-off request for 1 day

**Expected Result:**
```sql
-- After approval:
SELECT * FROM employee_leave_balances 
WHERE employee_id = ? 
  AND time_off_type_id = 'ANNUAL_LEAVE' 
  AND year = 2025;

-- Kết quả sau approve:
-- balance_id | employee_id | time_off_type_id | year | total_days | used_days | remaining_days
-- 1          | 2           | ANNUAL_LEAVE     | 2025 | 12.0       | 1.0       | 11.0

-- Check history:
SELECT * FROM leave_balance_history 
WHERE balance_id = 1 
ORDER BY changed_at DESC 
LIMIT 1;

-- Kết quả history:
-- history_id | balance_id | changed_by | change_amount | change_type | change_reason
-- 1          | 1          | 1          | -1.0          | DEDUCT      | Time-off request approved: TOR251202002
```

### Test Case 2: Approve SICK_LEAVE (requiresBalance = false)

**Preconditions:**
```sql
-- SICK_LEAVE không yêu cầu balance
-- Có thể không có record trong employee_leave_balances
```

**Action:** Approve time-off request for sick leave

**Expected Result:**
- ✅ Request status = APPROVED
- ✅ Employee shifts updated to ON_LEAVE
- ❌ **KHÔNG deduct balance** (vì requiresBalance = false)
- ❌ **KHÔNG tạo history record**

---

## 🔧 GỢI Ý FIX

### Fix 1: Kiểm tra approvedBy là employee_id
```java
// Nếu JWT trả về account_id, cần convert sang employee_id
Integer accountId = getCurrentUserId(); // From JWT
Account account = accountRepository.findById(accountId)
    .orElseThrow(() -> new UnauthorizedException("Account not found"));

Integer employeeId = account.getEmployee().getEmployeeId();
```

### Fix 2: Tạo balance nếu chưa có
```java
// Khi approve request có requiresBalance = true
LeaveBalance balance = leaveBalanceRepository
    .findByEmployeeIdAndTimeOffTypeIdAndYear(employeeId, timeOffTypeId, year)
    .orElseGet(() -> {
        // Tạo balance mới nếu chưa có
        LeaveBalance newBalance = LeaveBalance.builder()
            .employee(employee)
            .timeOffType(timeOffType)
            .year(year)
            .totalDays(timeOffType.getDefaultDaysPerYear())
            .usedDays(0.0)
            .remainingDays(timeOffType.getDefaultDaysPerYear())
            .build();
        return leaveBalanceRepository.save(newBalance);
    });
```

### Fix 3: Check balance trước khi deduct
```java
if (timeOffType.isRequiresBalance()) {
    LeaveBalance balance = leaveBalanceRepository
        .findByEmployeeIdAndTimeOffTypeIdAndYear(employeeId, timeOffTypeId, year)
        .orElseThrow(() -> new BadRequestException(
            "Employee does not have balance record for this time-off type"
        ));
    
    if (balance.getRemainingDays() < totalDays) {
        throw new BadRequestException(
            "Insufficient leave balance. Required: " + totalDays + 
            ", Available: " + balance.getRemainingDays()
        );
    }
    
    // Deduct balance
    balance.setUsedDays(balance.getUsedDays() + totalDays);
    balance.setRemainingDays(balance.getTotalDays() - balance.getUsedDays());
    leaveBalanceRepository.save(balance);
    
    // Create history
    LeaveBalanceHistory history = LeaveBalanceHistory.builder()
        .balance(balance)
        .changedByEmployee(approverEmployee)
        .changeAmount(-totalDays)
        .changeType(ChangeType.DEDUCT)
        .changeReason("Time-off request approved: " + requestId)
        .build();
    leaveBalanceHistoryRepository.save(history);
}
```

---

## 📝 CHECKLIST CHO BACKEND DEV

### Trước khi test:
- [ ] Kiểm tra employee có balance record cho ANNUAL_LEAVE chưa
- [ ] Kiểm tra `approvedBy` có phải là employee_id không
- [ ] Kiểm tra time-off type `ANNUAL_LEAVE` có `requiresBalance = true` không
- [ ] Kiểm tra balance có đủ để deduct không

### Khi approve:
- [ ] Log ra `approvedBy` value để xác nhận
- [ ] Log ra `balance` object để xác nhận tồn tại
- [ ] Log ra `approverEmployee` object để xác nhận tồn tại
- [ ] Check transaction có rollback nếu lỗi không

### Sau khi approve:
- [ ] Check balance có được deduct đúng không
- [ ] Check history record có được tạo với `changed_by` đúng không
- [ ] Check employee shifts có được update thành ON_LEAVE không
- [ ] Check request status có thành APPROVED không

---

## 🎯 LƯU Ý QUAN TRỌNG

### 1. RequiresBalance Logic
```java
// ĐÚNG: Chỉ deduct nếu requiresBalance = true
if (timeOffType.isRequiresBalance()) {
    deductLeaveBalance(request, approvedBy);
}

// SAI: Deduct cho tất cả time-off types
deductLeaveBalance(request, approvedBy); // ❌ Không check requiresBalance
```

### 2. Employee ID vs Account ID
```
┌─────────────┐         ┌──────────────┐
│  Account    │         │  Employee    │
│  (User)     │ 1───1   │  (Staff)     │
│             │────────>│              │
│ account_id  │         │ employee_id  │
└─────────────┘         └──────────────┘

⚠️ CHÚ Ý: approvedBy phải là employee_id, KHÔNG phải account_id
```

### 3. Balance Initialization
- Khi employee mới vào, cần tạo balance records
- Sử dụng Annual Reset Job để tạo balance cho năm mới
- Hoặc tạo on-the-fly khi approve request đầu tiên

---

## 📞 HỎI BACKEND DEV

Để FE dev có thể debug chính xác, cần backend dev trả lời:

1. **Error message chính xác là gì?**
   - Null pointer exception?
   - Constraint violation?
   - Business logic error?

2. **Stack trace đầy đủ?**
   - Line number nào báo lỗi?
   - Method nào fail?

3. **Database state?**
   ```sql
   -- Kiểm tra trước khi approve
   SELECT * FROM employee_leave_balances WHERE employee_id = ? AND time_off_type_id = 'ANNUAL_LEAVE';
   SELECT * FROM employees WHERE employee_id = ?;
   SELECT * FROM time_off_types WHERE type_id = 'ANNUAL_LEAVE';
   ```

4. **approvedBy value?**
   - Log ra giá trị của `approvedBy` parameter
   - Có phải employee_id hay account_id?

---

**Tóm lại:** Frontend code OK ✅ - Cần backend dev check kỹ các điểm trên! 🔍
