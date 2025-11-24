# 🚨 CRITICAL BUG: Quota Không Trừ Sau Khi Approve

**Date:** November 23, 2025  
**Severity:** 🔴 CRITICAL  
**Status:** Backend đã fix nhưng vẫn thấy bug trong production

---

## 🐛 Mô Tả Bug

### Evidence từ Screenshots:

**User đã đăng ký 6 slots:**
```
PENDING (2):
- Ca Part-time Sáng (8h-12h): 19/01/2026 - 31/01/2026 (CHỜ DUYỆT)
- Ca Part-time Sáng (8h-12h): 15/12/2025 - 04/02/2026 (CHỜ DUYỆT)

APPROVED (3):
- Ca Part-time Sáng (8h-12h): 24/11/2025 - 04/02/2026 (ĐÃ DUYỆT)
- Ca Part-time Sáng (8h-12h): 23/11/2025 - 30/11/2025 (ĐÃ DUYỆT)
- Ca Part-time Chiều (13h-17h): 22/11/2025 - 04/02/2026 (ĐÃ DUYỆT)

+ 1 registration đã bị từ chối
```

**Nhưng tình trạng slot:**
```
Ca Part-time Sáng (8h-12h)
Thứ: T2
Giờ/tuần: 4h
Giới hạn tuần: 11 tuần
Tình trạng: 6/11 tuần khả dụng (55%) ← SAI!
```

**Chi tiết theo tháng:**
```
November 2025:  3 lượt còn lại   (✅ 1 ngày còn trống, ⚠️ 1 ngày gần đầy, ❌ 0 ngày đầy)
December 2025:  15 lượt còn lại  (✅ 5 ngày còn trống, ⚠️ 5 ngày gần đầy, ❌ 0 ngày đầy)
January 2026:   12 lượt còn lại  (✅ 4 ngày còn trống, ⚠️ 4 ngày gần đầy, ❌ 0 ngày đầy)
February 2026:  2 lượt còn lại   (✅ 1 ngày còn trống, ⚠️ 0 ngày gần đầy, ❌ 0 ngày đầy)
```

### ❌ Vấn Đề:

1. **User đã có 3 registrations APPROVED** nhưng:
   - November: Vẫn **"1 ngày còn trống"** (không có ngày đã đầy!)
   - December: Vẫn **"5 ngày còn trống"** (tất cả đều available!)
   - **Không có ngày nào hiển thị "Đã đầy"!**

2. **Header vẫn show "6/11 tuần khả dụng (55%)"**
   - Nghĩa là: Có 6 tuần vẫn còn slot để đăng ký
   - Nếu đã approve 3 registrations → phải giảm xuống!

---

## 🔍 Root Cause Analysis

### Expected Behavior:

1. **User tạo registration** → Status = PENDING
   - ✅ `availabilityByMonth` **KHÔNG THAY ĐỔI** (đúng!)
   - ✅ Quota vẫn available cho user khác

2. **Admin approve** → Status = APPROVED
   - ❌ Backend **PHẢI CẬP NHẬT** `availabilityByMonth`
   - ❌ Các ngày đã được approve **PHẢI HIỂN THỊ** `totalDatesFull` tăng lên
   - ❌ `totalDatesAvailable` giảm xuống

3. **FE refresh data**
   - Frontend gọi `fetchAvailableSlots()` → fetch lại slot details
   - Hiển thị quota mới (đã trừ)

### Actual Behavior:

❌ **Backend KHÔNG cập nhật `availabilityByMonth` sau khi approve!**

---

## 🧪 Test Cases để Verify

### Test 1: Create Registration (PENDING)

**Steps:**
1. Ghi lại số lượng hiện tại: `availableWeeks`, `totalDatesAvailable`, `totalDatesFull`
2. Employee tạo registration mới (status = PENDING)
3. Refresh trang
4. Kiểm tra slot details

**Expected:**
```
BEFORE: availableWeeks = 6, totalDatesAvailable = 11, totalDatesFull = 0
AFTER:  availableWeeks = 6, totalDatesAvailable = 11, totalDatesFull = 0
```
✅ **PENDING không ảnh hưởng quota** (CORRECT)

---

### Test 2: Approve Registration

**Steps:**
1. Admin approve 1 registration PENDING (ví dụ: 1 tuần, ngày 24/11/2025)
2. Employee refresh trang
3. Kiểm tra November 2025 details

**Expected:**
```
BEFORE APPROVE:
  November: totalDatesAvailable = 1, totalDatesPartial = 1, totalDatesFull = 0

AFTER APPROVE:
  November: totalDatesAvailable = 0, totalDatesPartial = 1, totalDatesFull = 1
  (ngày 24/11 giờ đã đầy)
```

**Actual (BUG):**
```
AFTER APPROVE:
  November: totalDatesAvailable = 1, totalDatesPartial = 1, totalDatesFull = 0
  (KHÔNG THAY ĐỔI!) ← BUG!
```

---

### Test 3: Multiple Approvals

**Steps:**
1. Admin approve 3 registrations (cover multiple days in November)
2. Employee refresh
3. Check November details

**Expected:**
```
November: totalDatesFull = 3 (3 ngày đã đầy)
availableWeeks giảm xuống
```

**Actual (BUG):**
```
November: totalDatesFull = 0 (vẫn 0!)
availableWeeks vẫn = 6 (không giảm)
```

---

### Test 4: Delete/Reject Registration

**Steps:**
1. Admin reject hoặc employee delete 1 APPROVED registration
2. Refresh trang
3. Check quota

**Expected:**
```
Quota phải TĂNG LẠI (restore)
totalDatesFull giảm xuống
totalDatesAvailable tăng lên
```

**Actual:** Cần test!

---

## 📊 API Endpoints cần Check

### 1. GET /api/v1/registrations/part-time-flex/available-slots

**Expected Response:**
```json
[
  {
    "slotId": 123,
    "shiftName": "Ca Part-time Sáng (8h-12h)",
    "dayOfWeek": "MONDAY",
    "totalWeeksAvailable": 11,
    "availableWeeks": 6,  ← Phải GIẢM sau approve
    "fullWeeks": 5,        ← Phải TĂNG sau approve
    "quota": 2,
    "effectiveFrom": "2025-11-23",
    "effectiveTo": "2026-02-04",
    "availabilitySummary": "6/11 weeks available"
  }
]
```

---

### 2. GET /api/v1/registrations/part-time-flex/slots/{slotId}/details

**Expected Response:**
```json
{
  "slotId": 123,
  "shiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "MONDAY",
  "quota": 2,
  "effectiveFrom": "2025-11-23",
  "effectiveTo": "2026-02-04",
  "overallRemaining": 10,  ← Phải GIẢM sau approve
  "availabilityByMonth": [
    {
      "month": "2025-11",
      "monthName": "November 2025",
      "totalWorkingDays": 2,
      "totalDatesAvailable": 0,  ← Phải GIẢM
      "totalDatesPartial": 1,
      "totalDatesFull": 1,       ← Phải TĂNG
      "status": "PARTIAL",
      "totalWorkingDays": 2
    }
  ]
}
```

---

### 3. PUT /api/v1/registrations/{registrationId}/status

**Request:**
```json
{
  "status": "APPROVED",
  "rejectionReason": null
}
```

**Expected Side Effect:**
- ✅ Update registration status
- ✅ Recalculate `availabilityByMonth` for the slot
- ✅ Update `totalDatesAvailable`, `totalDatesPartial`, `totalDatesFull`

**Actual (BUG):**
- ✅ Update registration status
- ❌ **KHÔNG** recalculate availability! ← BUG Ở ĐÂY!

---

## 🔧 Backend Code cần Fix

### Location: Backend Service (Java)

**File:** `RegistrationService.java` hoặc `SlotAvailabilityService.java`

**Method:** `updateRegistrationStatus()`

**Issue:**
```java
// ❌ CURRENT (BUG):
public void updateRegistrationStatus(String registrationId, String newStatus) {
    Registration reg = findById(registrationId);
    reg.setStatus(newStatus);
    registrationRepository.save(reg);
    // ← MISSING: Recalculate slot availability!
}
```

**Fix Required:**
```java
// ✅ CORRECT:
@Transactional
public void updateRegistrationStatus(String registrationId, String newStatus) {
    Registration reg = findById(registrationId);
    String oldStatus = reg.getStatus();
    reg.setStatus(newStatus);
    registrationRepository.save(reg);
    
    // ✅ Recalculate availability when status changes to/from APPROVED
    if (statusAffectsAvailability(oldStatus, newStatus)) {
        slotAvailabilityService.recalculateAvailability(reg.getPartTimeSlotId());
    }
}

private boolean statusAffectsAvailability(String oldStatus, String newStatus) {
    // Only APPROVED registrations affect availability
    return "APPROVED".equals(newStatus) || "APPROVED".equals(oldStatus);
}
```

---

## 📝 SQL Script để Verify Database

```sql
-- 1. Check registrations for specific slot
SELECT 
    registration_id,
    employee_id,
    effective_from,
    effective_to,
    status,
    created_at
FROM shift_registrations
WHERE part_time_slot_id = 123  -- Replace with actual slot ID
ORDER BY created_at DESC;

-- 2. Calculate CORRECT availability (what it SHOULD be)
SELECT 
    DATE_FORMAT(working_date, '%Y-%m') as month,
    working_date,
    COUNT(*) as total_registrations,
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
    (SELECT quota FROM part_time_slots WHERE slot_id = 123) as quota,
    (SELECT quota FROM part_time_slots WHERE slot_id = 123) - 
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as remaining_quota,
    CASE 
        WHEN SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) = 0 
        THEN 'AVAILABLE'
        WHEN SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) < 
             (SELECT quota FROM part_time_slots WHERE slot_id = 123)
        THEN 'PARTIAL'
        ELSE 'FULL'
    END as correct_status
FROM shift_registrations sr
WHERE part_time_slot_id = 123
  AND working_date BETWEEN '2025-11-01' AND '2025-11-30'
  AND status IN ('APPROVED', 'PENDING')  -- Include both to see difference
GROUP BY working_date
ORDER BY working_date;

-- 3. Compare with API response
-- Run GET /api/v1/registrations/part-time-flex/slots/123/details
-- Compare `availabilityByMonth` with results above
```

---

## ✅ Checklist để Fix Bug

### Backend Tasks:
- [ ] 1. Xác nhận backend đã deploy bản fix chưa
- [ ] 2. Test API endpoint `/slots/{slotId}/details` sau khi approve
- [ ] 3. Verify `updateRegistrationStatus()` có gọi `recalculateAvailability()` không
- [ ] 4. Check database triggers (nếu có)
- [ ] 5. Test với registration mới (từ scratch)
- [ ] 6. Test delete/reject registration (phải restore quota)

### Frontend Tasks:
- [ ] 1. Verify FE gọi `fetchAvailableSlots()` sau mọi thao tác
- [ ] 2. Check có cache nào block refresh không
- [ ] 3. Add loading indicator khi refresh
- [ ] 4. Test real-time update (polling hoặc WebSocket nếu có)

### Data Tasks:
- [ ] 1. Backup database hiện tại
- [ ] 2. Reset test data (xóa registrations cũ)
- [ ] 3. Chạy script recalculate cho tất cả slots
- [ ] 4. Verify lại từng slot một

---

## 🚀 Temporary Workaround (FE)

Nếu backend chưa fix được ngay, FE có thể:

```typescript
// Add refresh button để user tự reload
<Button 
  onClick={async () => {
    await fetchAvailableSlots();
    toast.success('Đã làm mới dữ liệu!');
  }}
  variant="outline"
>
  <RotateCcw className="w-4 h-4 mr-2" />
  Làm mới
</Button>

// Hoặc auto-refresh mỗi 30s
useEffect(() => {
  const interval = setInterval(() => {
    if (isPartTimeFlex) {
      fetchAvailableSlots();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [isPartTimeFlex]);
```

**Nhưng đây CHỈ LÀ WORKAROUND! Backend vẫn phải fix!**

---

## 📞 Action Items

### Immediate (Ngay lập tức):
1. **Backend team:** Check xem bản fix đã deploy chưa
2. **Test team:** Chạy test cases ở trên
3. **DB team:** Verify data consistency với SQL script

### Short-term (1-2 ngày):
1. Fix backend nếu chưa fix
2. Deploy và test production
3. Reset corrupted data

### Long-term:
1. Add integration tests cho approval flow
2. Add monitoring/alerting cho quota inconsistencies
3. Consider real-time sync (WebSocket) cho availability updates

---

## 🎯 Success Criteria

### Test PASS khi:
```
1. ✅ Create PENDING registration → Quota KHÔNG ĐỔI
2. ✅ Approve registration → Quota GIẢM NGAY
3. ✅ Delete/Reject APPROVED → Quota TĂNG LẠI
4. ✅ FE hiển thị đúng số "X ngày đã đầy"
5. ✅ Header "X/Y tuần khả dụng" phản ánh đúng thực tế
```

---

**🚨 Priority: CRITICAL - Ảnh hưởng trực tiếp đến business logic!**
