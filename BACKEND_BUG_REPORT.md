# 🐛 BÁO CÁO LỖI BACKEND - PART-TIME SLOT SYSTEM

**Ngày:** 23/11/2025  
**Module:** Part-Time Slot Registration API  
**Mức độ:** 🔴 CRITICAL

---

## 📋 TÓM TẮT VẤN ĐỀ

Hệ thống đăng ký ca part-time có **2 lỗi nghiêm trọng** về tính toán và cập nhật dữ liệu:

1. ❌ **API trả về dữ liệu sai định dạng** - `totalDatesAvailable` là số NGÀY thay vì số TUẦN
2. ❌ **Đăng ký slot không cập nhật số lượng còn lại** - `overallRemaining` và `availabilityByMonth` không giảm sau khi đăng ký

---

## 🔴 LỖI #1: SAI ĐỊNH DẠNG DỮ LIỆU TRƯỜNG `totalDatesAvailable`

### 📍 Endpoint bị ảnh hưởng:
```
GET /api/v1/registrations/part-time-flex/available-slots
GET /api/v1/registrations/part-time-flex/available-slots?month=2025-12
```

### 🐛 Mô tả lỗi:
Trường `totalDatesAvailable` trong response trả về **số NGÀY** thay vì **số TUẦN** như documentation mô tả.

### 📊 Ví dụ response hiện tại (SAI):
```json
{
  "slotId": 123,
  "shiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "totalDatesAvailable": 11,  // ❌ SAI: Đây là 11 NGÀY, không phải 11 tuần
  "totalDatesEmpty": 1,
  "totalDatesFull": 10,
  "effectiveFrom": "2025-11-25",
  "effectiveTo": "2026-02-28",
  "quota": 2,
  "availabilitySummary": "11/11 available"
}
```

### ✅ Response đúng phải là:
```json
{
  "slotId": 123,
  "shiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "totalWeeksAvailable": 14,     // ✅ ĐÚNG: Tổng số tuần từ effectiveFrom → effectiveTo
  "availableWeeks": 11,          // ✅ ĐÚNG: Số tuần còn slot trống
  "fullWeeks": 3,                // ✅ ĐÚNG: Số tuần đã đầy
  "effectiveFrom": "2025-11-25",
  "effectiveTo": "2026-02-28",
  "quota": 2,
  "availabilitySummary": "11/14 weeks available"
}
```

### 🔧 Cách tính đúng:
```java
// Giả sử slot chạy từ 25/11/2025 → 28/02/2026 (14 tuần)
// Quota = 2 lượt/tuần
// Đã có 6 lượt đăng ký (APPROVED)

int totalWeeks = calculateWeeksBetween(effectiveFrom, effectiveTo); // = 14
int registeredSlots = countApprovedRegistrations(slotId); // = 6
int availableSlots = (totalWeeks * quota) - registeredSlots; // = (14 * 2) - 6 = 22
int availableWeeks = availableSlots / quota; // = 22 / 2 = 11
int fullWeeks = totalWeeks - availableWeeks; // = 14 - 11 = 3

response.setTotalWeeksAvailable(totalWeeks);
response.setAvailableWeeks(availableWeeks);
response.setFullWeeks(fullWeeks);
```

---

## 🔴 LỖI #2: ĐĂNG KÝ SLOT KHÔNG CẬP NHẬT SỐ LƯỢNG CÒN LẠI

### 📍 Endpoint bị ảnh hưởng:
```
POST /api/v1/registrations/part-time-flex
GET /api/v1/registrations/part-time-flex/slots/{slotId}/details
```

### 🐛 Mô tả lỗi:
Sau khi tạo registration mới (status = PENDING hoặc APPROVED), các trường sau **KHÔNG được cập nhật**:
- `overallRemaining` (trong SlotDetailsResponse)
- `totalDatesAvailable` / `totalDatesPartial` / `totalDatesFull` (trong MonthlyAvailability)

### 📊 Test case chi tiết:

#### **TRƯỚC KHI ĐĂNG KÝ:**
```bash
GET /api/v1/registrations/part-time-flex/slots/123/details

Response:
{
  "slotId": 123,
  "shiftName": "Ca Part-time Sáng (8h-12h)",
  "dayOfWeek": "TUESDAY",
  "quota": 2,
  "effectiveFrom": "2025-11-25",
  "effectiveTo": "2026-02-28",
  "overallRemaining": 22,  // ✅ Còn 22 lượt
  "availabilityByMonth": [
    {
      "month": "2025-11",
      "monthName": "November 2025",
      "totalDatesAvailable": 2,   // ✅ 2 ngày còn trống hoàn toàn
      "totalDatesPartial": 2,     // ✅ 2 ngày còn 1 slot
      "totalDatesFull": 0,
      "totalWorkingDays": 4,
      "status": "AVAILABLE"
    },
    {
      "month": "2025-12",
      "monthName": "December 2025",
      "totalDatesAvailable": 5,   // ✅ 5 ngày còn trống
      "totalDatesPartial": 5,
      "totalDatesFull": 0,
      "totalWorkingDays": 10,
      "status": "AVAILABLE"
    }
  ]
}
```

#### **ĐĂNG KÝ MỚI:**
```bash
POST /api/v1/registrations/part-time-flex

Request:
{
  "partTimeSlotId": 123,
  "effectiveFrom": "2025-11-26",  // Thứ 3
  "effectiveTo": "2025-12-09"     // 2 tuần (2 thứ 3)
}

Response: 201 Created ✅
```

#### **SAU KHI ĐĂNG KÝ (LỖI):**
```bash
GET /api/v1/registrations/part-time-flex/slots/123/details

Response:
{
  "slotId": 123,
  "overallRemaining": 22,  // ❌ SAI: Vẫn là 22, KHÔNG GIẢM!
  "availabilityByMonth": [
    {
      "month": "2025-11",
      "totalDatesAvailable": 2,   // ❌ SAI: Vẫn là 2, phải giảm xuống 1
      "totalDatesPartial": 2,     // ❌ SAI: Vẫn là 2, phải giảm xuống 1
      "totalDatesFull": 0,        // ❌ SAI: Phải tăng lên 1
      "totalWorkingDays": 4
    },
    {
      "month": "2025-12",
      "totalDatesAvailable": 5,   // ❌ SAI: Vẫn là 5, phải giảm xuống 4
      "totalDatesPartial": 5,
      "totalDatesFull": 0,
      "totalWorkingDays": 10
    }
  ]
}
```

#### **SAU KHI ĐĂNG KÝ (ĐÚNG):**
```bash
Response phải là:
{
  "slotId": 123,
  "overallRemaining": 18,  // ✅ ĐÚNG: 22 - 4 = 18 (đã đăng ký 2 tuần × 2 quota)
  "availabilityByMonth": [
    {
      "month": "2025-11",
      "totalDatesAvailable": 1,   // ✅ Giảm 1 (26/11 đã hết slot)
      "totalDatesPartial": 1,     // ✅ Giảm 1
      "totalDatesFull": 1,        // ✅ Tăng 1 (26/11 đã đầy)
      "totalWorkingDays": 4
    },
    {
      "month": "2025-12",
      "totalDatesAvailable": 4,   // ✅ Giảm 1 (03/12 đã hết slot)
      "totalDatesPartial": 4,
      "totalDatesFull": 1,        // ✅ Tăng 1
      "totalWorkingDays": 10
    }
  ]
}
```

### 🔧 Logic cần fix:

```java
@Transactional
public void createPartTimeFlexRegistration(CreateShiftRegistrationRequest request) {
    // 1. Tạo registration
    ShiftRegistration registration = new ShiftRegistration();
    registration.setPartTimeSlotId(request.getPartTimeSlotId());
    registration.setEffectiveFrom(request.getEffectiveFrom());
    registration.setEffectiveTo(request.getEffectiveTo());
    registration.setStatus(RegistrationStatus.PENDING);
    registrationRepository.save(registration);
    
    // 2. ❌ THIẾU: Cập nhật slot availability
    // ✅ CẦN THÊM:
    updateSlotAvailability(request.getPartTimeSlotId(), 
                          request.getEffectiveFrom(), 
                          request.getEffectiveTo());
}

private void updateSlotAvailability(Long slotId, LocalDate from, LocalDate to) {
    PartTimeSlot slot = slotRepository.findById(slotId).orElseThrow();
    
    // Tính số lượt đã đăng ký (chỉ tính APPROVED)
    int approvedRegistrations = registrationRepository
        .countBySlotIdAndStatus(slotId, RegistrationStatus.APPROVED);
    
    // Tính tổng quota
    int totalWeeks = calculateWeeksBetween(slot.getEffectiveFrom(), slot.getEffectiveTo());
    int totalQuota = totalWeeks * slot.getQuota();
    
    // Cập nhật remaining
    int remaining = totalQuota - approvedRegistrations;
    
    // ✅ LƯU Ý: Nếu registration mới là PENDING, có thể:
    // Option 1: KHÔNG trừ quota (chỉ trừ khi APPROVED)
    // Option 2: TRỪ ngay (reserve quota cho PENDING)
    // → Cần confirm với team về business logic
    
    // Cache hoặc trigger recalculation
    slotAvailabilityCache.invalidate(slotId);
}
```

---

## 📊 DANH SÁCH API CẦN FIX

### 1. GET /api/v1/registrations/part-time-flex/available-slots
- ✅ Đổi `totalDatesAvailable` → `totalWeeksAvailable`
- ✅ Đổi `totalDatesEmpty` → `availableWeeks`
- ✅ Đổi `totalDatesFull` → `fullWeeks`
- ✅ Thêm logic tính toán đúng số tuần

### 2. GET /api/v1/registrations/part-time-flex/slots/{slotId}/details
- ✅ Cập nhật `overallRemaining` sau mỗi registration
- ✅ Cập nhật `availabilityByMonth` (totalDatesAvailable, totalDatesPartial, totalDatesFull)
- ✅ Tính toán lại real-time hoặc cache invalidation

### 3. POST /api/v1/registrations/part-time-flex
- ✅ Thêm logic cập nhật slot availability sau khi tạo registration
- ✅ Handle transaction rollback nếu cập nhật thất bại

### 4. PATCH /api/v1/registrations/part-time-flex/{id}/status
- ✅ Khi approve/reject registration, cập nhật slot availability
- ✅ Approve → trừ quota
- ✅ Reject → không trừ (hoặc hoàn lại nếu đã trừ)

---

## 🧪 TEST CASES ĐỀ XUẤT

### Test Case 1: Tạo registration mới
```gherkin
Given: Slot có 20 lượt khả dụng
When: User đăng ký 2 tuần (4 lượt) với status PENDING
Then: overallRemaining vẫn là 20 (nếu không trừ PENDING)
  OR: overallRemaining = 16 (nếu trừ cả PENDING)
When: Admin approve registration
Then: overallRemaining = 16 (nếu chưa trừ)
  OR: overallRemaining vẫn là 16 (nếu đã trừ)
```

### Test Case 2: Reject registration
```gherkin
Given: Registration đã được approve, overallRemaining = 16
When: Admin reject registration
Then: overallRemaining = 20 (hoàn lại quota)
```

### Test Case 3: Xóa registration
```gherkin
Given: Registration đã được approve, overallRemaining = 16
When: User hoặc Admin xóa registration
Then: overallRemaining = 20 (hoàn lại quota)
```

---

## 🔧 SQL SCRIPT KIỂM TRA DỮ LIỆU

Chạy script này để kiểm tra dữ liệu hiện tại:

```sql
-- Kiểm tra slot và số lượng đăng ký
SELECT 
    pts.slot_id,
    pts.work_shift_id,
    pts.day_of_week,
    pts.quota,
    pts.effective_from,
    pts.effective_to,
    COUNT(sr.registration_id) as total_registrations,
    SUM(CASE WHEN sr.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN sr.status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN sr.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
    -- Tính tổng quota
    TIMESTAMPDIFF(WEEK, pts.effective_from, pts.effective_to) * pts.quota as total_quota,
    -- Tính quota còn lại (chỉ trừ APPROVED)
    (TIMESTAMPDIFF(WEEK, pts.effective_from, pts.effective_to) * pts.quota) - 
    SUM(CASE WHEN sr.status = 'APPROVED' THEN pts.quota ELSE 0 END) as remaining_quota
FROM part_time_slots pts
LEFT JOIN shift_registrations sr ON pts.slot_id = sr.part_time_slot_id
WHERE pts.is_active = true
GROUP BY pts.slot_id
ORDER BY pts.slot_id;

-- Kiểm tra registrations của một slot cụ thể
SELECT 
    sr.registration_id,
    sr.employee_id,
    e.employee_name,
    sr.effective_from,
    sr.effective_to,
    sr.status,
    sr.created_at,
    TIMESTAMPDIFF(WEEK, sr.effective_from, sr.effective_to) as weeks_registered
FROM shift_registrations sr
JOIN employees e ON sr.employee_id = e.employee_id
WHERE sr.part_time_slot_id = 123  -- Thay 123 bằng slotId cần test
ORDER BY sr.created_at DESC;

-- Kiểm tra tính toán availability by month
SELECT 
    DATE_FORMAT(dates.date, '%Y-%m') as month,
    COUNT(*) as total_working_days,
    SUM(CASE 
        WHEN available_slots = pts.quota THEN 1 
        ELSE 0 
    END) as dates_fully_available,
    SUM(CASE 
        WHEN available_slots > 0 AND available_slots < pts.quota THEN 1 
        ELSE 0 
    END) as dates_partial,
    SUM(CASE 
        WHEN available_slots = 0 THEN 1 
        ELSE 0 
    END) as dates_full
FROM (
    SELECT 
        d.date,
        pts.quota - COALESCE(COUNT(sr.registration_id), 0) as available_slots
    FROM calendar_dates d
    CROSS JOIN part_time_slots pts
    LEFT JOIN shift_registrations sr 
        ON d.date BETWEEN sr.effective_from AND sr.effective_to
        AND sr.part_time_slot_id = pts.slot_id
        AND sr.status = 'APPROVED'
        AND DAYOFWEEK(d.date) = CASE pts.day_of_week
            WHEN 'MONDAY' THEN 2
            WHEN 'TUESDAY' THEN 3
            WHEN 'WEDNESDAY' THEN 4
            WHEN 'THURSDAY' THEN 5
            WHEN 'FRIDAY' THEN 6
            WHEN 'SATURDAY' THEN 7
            WHEN 'SUNDAY' THEN 1
        END
    WHERE pts.slot_id = 123  -- Thay 123 bằng slotId cần test
        AND d.date BETWEEN pts.effective_from AND pts.effective_to
    GROUP BY d.date, pts.quota
) dates
CROSS JOIN part_time_slots pts
WHERE pts.slot_id = 123
GROUP BY month
ORDER BY month;
```

---

## 🎯 MỨC ĐỘ ƯU TIÊN

| Lỗi | Mức độ | Lý do | Timeline |
|-----|--------|-------|----------|
| Lỗi #1: Sai định dạng dữ liệu | 🔴 HIGH | Ảnh hưởng hiển thị toàn bộ UI | 1-2 ngày |
| Lỗi #2: Không cập nhật quota | 🔴 CRITICAL | Dữ liệu không chính xác, user có thể đăng ký quá quota | ASAP |

---

## 📞 LIÊN HỆ

**Frontend Developer:** [Tên của bạn]  
**Backend Developer cần fix:** [Tên BE dev]  
**File liên quan:**
- Frontend: `src/app/employee/registrations/page.tsx`
- Frontend types: `src/types/workSlot.ts`
- Backend: `[Package/Class cần fix]`

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Fix API response format (totalDatesAvailable → totalWeeksAvailable)
- [ ] Fix cập nhật overallRemaining sau registration
- [ ] Fix cập nhật availabilityByMonth sau registration
- [ ] Thêm transaction handling
- [ ] Thêm unit tests
- [ ] Thêm integration tests
- [ ] Update API documentation
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

---

**Ghi chú:** Frontend đã tạm thời workaround bằng cách tính toán từ `overallRemaining` và `quota`, nhưng đây không phải giải pháp lâu dài. Backend cần fix ASAP! 🚨
