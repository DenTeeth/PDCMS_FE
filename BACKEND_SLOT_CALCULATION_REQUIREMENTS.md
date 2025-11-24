# Backend Requirements: Slot Availability Calculation

## ❌ Vấn đề hiện tại

Frontend đang nhận được dữ liệu **SAI LOGIC** từ backend:
- `totalDatesAvailable` trong `MonthlyAvailability` đang là **số ngày còn trống**
- Nhưng tên field gợi ý nó là **tổng số ngày**
- Dẫn đến tính toán sai: `2/22 slots` thay vì `2/2 slots`

## ✅ Logic đúng cần implement

### Công thức tính slot khả dụng:
```
Slot khả dụng = Tổng slot - Slot đã được phê duyệt
```

**Lưu ý quan trọng**: 
- ❌ **KHÔNG** trừ slot đang chờ duyệt (PENDING)
- ✅ **CHỈ** trừ slot đã được phê duyệt (APPROVED)

### Ví dụ cụ thể:

**Tháng 11/2025:**
- Có 2 ngày làm việc (Thứ 4)
- Quota = 2 slot/ngày
- **Tổng slot = 2 ngày × 2 quota = 4 slots**

**Trường hợp 1: Có 1 đơn APPROVED**
- Đơn APPROVED: 1 slot
- Slot khả dụng = 4 - 1 = **3 slots**
- Hiển thị: "3/4 slots" (75%)

**Trường hợp 2: Có 1 đơn APPROVED + 2 đơn PENDING**
- Đơn APPROVED: 1 slot
- Đơn PENDING: 2 slots (KHÔNG trừ)
- Slot khả dụng = 4 - 1 = **3 slots** (vẫn 3!)
- Hiển thị: "3/4 slots" (75%)
- Note: "⚠️ Đơn chờ duyệt chưa trừ quota"

## 📋 Backend cần trả về

### 1. API: `GET /api/v1/registrations/part-time-flex/slots/{slotId}/details`

**Response structure:**
```typescript
{
  slotId: number;
  shiftName: string;
  dayOfWeek: string;
  quota: number; // Số slot/ngày
  effectiveFrom: string;
  effectiveTo: string;
  overallRemaining: number; // ✅ Tổng slot còn lại (chỉ trừ APPROVED)
  availabilityByMonth: [
    {
      month: "2025-11",
      monthName: "November 2025",
      totalWorkingDays: 2, // ✅ Tổng số ngày làm việc trong tháng
      totalDatesAvailable: 2, // ✅ Số ngày còn slot trống (chỉ trừ APPROVED)
      totalDatesPartial: 0,
      totalDatesFull: 0,
      status: "AVAILABLE"
    }
  ]
}
```

### 2. Cách tính `totalDatesAvailable` trong `MonthlyAvailability`

**Backend cần làm:**

```java
// Pseudo code
for each month in slot period:
  totalWorkingDays = count days matching slot.dayOfWeek in month
  
  for each working day:
    approvedCount = count registrations with status = APPROVED on this day
    if (approvedCount < quota):
      totalDatesAvailable++ // Ngày này còn slot trống
```

**Ví dụ:**
- Tháng 11/2025 có 2 ngày Thứ 4
- Quota = 2 slot/ngày
- Ngày 1: 0 APPROVED → Còn 2 slots → `totalDatesAvailable++`
- Ngày 2: 0 APPROVED → Còn 2 slots → `totalDatesAvailable++`
- **Kết quả: `totalDatesAvailable = 2`**

### 3. Frontend sẽ tính như sau:

```typescript
const totalSlots = month.totalWorkingDays × quota; // 2 × 2 = 4
const availableSlots = month.totalDatesAvailable × quota; // 2 × 2 = 4
const approvedSlots = totalSlots - availableSlots; // 4 - 4 = 0

// Hiển thị: "4/4 slots" (100% available)
```

## 🔍 Kiểm tra backend hiện tại

**Test case:**
1. Tạo 1 slot: Thứ 4, quota=2, tháng 11/2025 (2 ngày)
2. Không có đơn nào → Expect: `totalDatesAvailable = 2`
3. Tạo 1 đơn APPROVED → Expect: `totalDatesAvailable = 1` (1 ngày còn đủ quota)
4. Tạo thêm 1 đơn PENDING → Expect: `totalDatesAvailable = 1` (không đổi!)
5. Duyệt đơn PENDING → Expect: `totalDatesAvailable = 0` (đầy)

## 📝 Summary

**Backend cần đảm bảo:**
1. ✅ `totalWorkingDays` = Tổng số ngày làm việc trong tháng
2. ✅ `totalDatesAvailable` = Số ngày còn slot trống (chỉ đếm APPROVED)
3. ✅ `overallRemaining` = Tổng slot còn lại toàn bộ period (chỉ trừ APPROVED)
4. ❌ KHÔNG trừ slot PENDING khi tính availability

**Frontend sẽ:**
1. Hiển thị: `{totalDatesAvailable} tuần còn trống`
2. Chi tiết: `{availableSlots}/{totalSlots} slots` cho mỗi tháng
3. Note: "⚠️ Đơn chờ duyệt chưa trừ quota"
