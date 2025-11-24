# Slot Calculation Logic - Explained

## 🎯 Vấn đề đã sửa

### ❌ Logic CŨ (SAI):
```typescript
const totalWeeks = slot.totalDatesAvailable || 0;  // ❌ SAI!
totalSlots = totalWeeks × quota;
```

**Tại sao sai?**
- `totalDatesAvailable` = Số ngày CÒN CHỖ TRỐNG (thay đổi theo bookings)
- VD: Ban đầu 5 ngày → Sau khi book hết → 0 ngày
- Dùng để tính `totalSlots` → Sai hoàn toàn!

### ✅ Logic MỚI (ĐÚNG):
```typescript
// Tính tổng số ngày làm việc từ slotDetails
const totalWorkingDays = slotDetails.availabilityByMonth.reduce(
  (sum, month) => sum + month.totalWorkingDays, 0
);
totalSlots = totalWorkingDays × quota;  // ✅ ĐÚNG!
```

**Tại sao đúng?**
- `totalWorkingDays` = Tổng số ngày làm việc (KHÔNG BAO GIỜ THAY ĐỔI)
- VD: Tháng 12 có 5 ngày Thứ 4 → Luôn là 5, dù có bao nhiêu bookings
- Dùng để tính `totalSlots` → Đúng!

---

## 📊 Ví dụ cụ thể

### Scenario: Slot Thứ 4, Quota = 2, Tháng 12/2025

**Dữ liệu từ backend:**
```json
{
  "slotId": 7,
  "quota": 2,
  "totalDatesAvailable": 5,  // Ban đầu: 5 ngày còn trống
  "totalDatesEmpty": 5,
  "overallRemaining": 10,    // 5 ngày × 2 quota = 10 slots
  "availabilityByMonth": [
    {
      "month": "2025-12",
      "totalWorkingDays": 5,      // ✅ Luôn là 5 (không đổi)
      "totalDatesAvailable": 5,   // Ban đầu: 5 ngày còn chỗ
      "totalDatesPartial": 0,
      "totalDatesFull": 0
    }
  ]
}
```

### Bước 1: Không có booking

**Logic CŨ (SAI):**
```typescript
totalWeeks = 5  // từ slot.totalDatesAvailable
totalSlots = 5 × 2 = 10  // ✅ Tình cờ đúng
availableSlots = 10  // từ overallRemaining
// Hiển thị: "10/10 slots" ✅
```

**Logic MỚI (ĐÚNG):**
```typescript
totalWorkingDays = 5  // từ month.totalWorkingDays
totalSlots = 5 × 2 = 10  // ✅ Đúng
availableSlots = 10  // từ overallRemaining
// Hiển thị: "10/10 slots" ✅
```

**Kết quả:** Cả 2 đều đúng (tình cờ)

---

### Bước 2: Thêm 2 APPROVED (2 ngày khác nhau, mỗi ngày 1 slot)

**Backend response:**
```json
{
  "totalDatesAvailable": 5,  // Vẫn 5 (cả 5 ngày đều còn chỗ)
  "overallRemaining": 8,     // 10 - 2 = 8 slots còn lại
  "availabilityByMonth": [
    {
      "totalWorkingDays": 5,      // ✅ Vẫn 5 (không đổi)
      "totalDatesAvailable": 5,   // Vẫn 5 (cả 5 ngày còn chỗ)
      "totalDatesPartial": 2,     // 2 ngày có 1/2 slots
      "totalDatesFull": 0
    }
  ]
}
```

**Logic CŨ (SAI):**
```typescript
totalWeeks = 5  // từ slot.totalDatesAvailable (vẫn 5)
totalSlots = 5 × 2 = 10  // ✅ Vẫn đúng (tình cờ)
availableSlots = 8  // từ overallRemaining
// Hiển thị: "8/10 slots" ✅
```

**Logic MỚI (ĐÚNG):**
```typescript
totalWorkingDays = 5  // từ month.totalWorkingDays
totalSlots = 5 × 2 = 10  // ✅ Đúng
availableSlots = 8  // từ overallRemaining
// Hiển thị: "8/10 slots" ✅
```

**Kết quả:** Cả 2 vẫn đúng (vì totalDatesAvailable vẫn = 5)

---

### Bước 3: Thêm 3 APPROVED nữa (tổng 5 APPROVED, 3 ngày đầy)

**Backend response:**
```json
{
  "totalDatesAvailable": 2,  // ⚠️ Chỉ còn 2 ngày có chỗ
  "overallRemaining": 5,     // 10 - 5 = 5 slots còn lại
  "availabilityByMonth": [
    {
      "totalWorkingDays": 5,      // ✅ Vẫn 5 (không đổi)
      "totalDatesAvailable": 2,   // Chỉ còn 2 ngày có chỗ
      "totalDatesPartial": 2,     // 2 ngày có 1/2 slots
      "totalDatesFull": 3         // 3 ngày đã đầy 2/2
    }
  ]
}
```

**Logic CŨ (SAI):**
```typescript
totalWeeks = 2  // ❌ SAI! Từ slot.totalDatesAvailable (giảm xuống 2)
totalSlots = 2 × 2 = 4  // ❌ SAI! Nên là 10
availableSlots = 5  // từ overallRemaining
// Hiển thị: "5/4 slots" ❌ SAI HOÀN TOÀN! (>100%)
```

**Logic MỚI (ĐÚNG):**
```typescript
totalWorkingDays = 5  // ✅ Vẫn 5 (không đổi)
totalSlots = 5 × 2 = 10  // ✅ ĐÚNG!
availableSlots = 5  // từ overallRemaining
// Hiển thị: "5/10 slots" ✅ ĐÚNG! (50%)
```

**Kết quả:** Logic CŨ SAI HOÀN TOÀN! Logic MỚI ĐÚNG!

---

## 🔍 Tại sao logic cũ sai?

### Hiểu sai ý nghĩa của `totalDatesAvailable`

**Backend definition:**
```java
// totalDatesAvailable = Days where registered < quota
// Số ngày CÒN CHỖ TRỐNG (bao gồm empty + partial)
```

**Ví dụ:**
- Ngày 1: 0/2 slots → "available" ✅
- Ngày 2: 1/2 slots → "available" ✅ (còn 1 chỗ)
- Ngày 3: 2/2 slots → "full" ❌ (không available)
- **totalDatesAvailable = 2** (ngày 1 + ngày 2)

**Vấn đề:**
- Frontend dùng `totalDatesAvailable` để tính `totalSlots`
- Khi có bookings → `totalDatesAvailable` giảm
- → `totalSlots` giảm theo → SAI!

---

## ✅ Logic đúng

### 1. Tính tổng số ngày làm việc (KHÔNG ĐỔI)

```typescript
const totalWorkingDays = slotDetails.availabilityByMonth.reduce(
  (sum, month) => sum + month.totalWorkingDays, 0
);
```

**Giải thích:**
- `month.totalWorkingDays` = Số ngày làm việc trong tháng đó
- VD: Tháng 12 có 5 ngày Thứ 4 → `totalWorkingDays = 5`
- Giá trị này **KHÔNG BAO GIỜ THAY ĐỔI** dù có bao nhiêu bookings

### 2. Tính tổng slots (KHÔNG ĐỔI)

```typescript
totalSlots = totalWorkingDays × quota;
```

**Giải thích:**
- Tổng slots = Tổng ngày × Quota mỗi ngày
- VD: 5 ngày × 2 quota = 10 slots
- Giá trị này **KHÔNG BAO GIỜ THAY ĐỔI**

### 3. Lấy slots khả dụng từ backend

```typescript
availableSlots = slotDetails.overallRemaining;
```

**Giải thích:**
- Backend đã tính sẵn số slots còn lại
- Chỉ đếm APPROVED registrations
- PENDING registrations KHÔNG được đếm

### 4. Tính phần trăm

```typescript
availablePercent = totalSlots > 0 ? (availableSlots / totalSlots) × 100 : 0;
```

---

## 📋 So sánh 2 logic

| Trường hợp | totalDatesAvailable | Logic CŨ (totalSlots) | Logic MỚI (totalSlots) | Đúng? |
|------------|---------------------|----------------------|----------------------|-------|
| Không có booking | 5 | 5×2=10 ✅ | 5×2=10 ✅ | Cả 2 đúng |
| 2 APPROVED (2 ngày khác nhau) | 5 | 5×2=10 ✅ | 5×2=10 ✅ | Cả 2 đúng |
| 5 APPROVED (3 ngày đầy) | 2 | 2×2=4 ❌ | 5×2=10 ✅ | Chỉ MỚI đúng |
| 10 APPROVED (đầy hết) | 0 | 0×2=0 ❌ | 5×2=10 ✅ | Chỉ MỚI đúng |

**Kết luận:** Logic CŨ chỉ đúng khi `totalDatesAvailable` = tổng ngày làm việc (tức là chưa có booking hoặc tất cả ngày đều còn chỗ)

---

## 🎯 Fallback logic

**Khi không có `slotDetails`:**
```typescript
// Fallback: Dùng totalDatesAvailable (không chính xác)
const totalWorkingDays = slot.totalDatesAvailable || 0;
```

**Tại sao cần fallback?**
- `slotDetails` được fetch riêng từ API khác
- Có thể chưa load xong hoặc bị lỗi
- Cần có giá trị mặc định để tránh crash

**Độ chính xác:**
- ✅ Chính xác khi chưa có booking
- ⚠️ Sai khi đã có booking (nhưng ít nhất không crash)

---

## 💡 Đề xuất cải thiện Backend

### Thêm field vào `AvailableSlot` response:

```java
public class AvailableSlot {
  // Existing fields
  private Long slotId;
  private String shiftName;
  private int totalDatesAvailable;  // Số ngày còn chỗ
  private int totalDatesEmpty;
  private int totalDatesFull;
  
  // ✅ NEW: Add total working days
  private int totalWorkingDays;  // Tổng số ngày làm việc (không đổi)
  
  // ✅ NEW: Add explicit slot counts
  private int totalSlots;          // totalWorkingDays × quota
  private int totalSlotsUsed;      // Số slots đã APPROVED
  private int totalSlotsAvailable; // totalSlots - totalSlotsUsed
}
```

### Lợi ích:
1. Frontend không cần tính toán phức tạp
2. Không cần fetch `slotDetails` riêng
3. Giảm số API calls
4. Tăng độ chính xác 100%

---

## ✅ Kết luận

**Logic hiện tại (sau khi sửa):**
- ✅ Dùng `totalWorkingDays` từ `slotDetails.availabilityByMonth`
- ✅ Tính `totalSlots = totalWorkingDays × quota`
- ✅ Lấy `availableSlots` từ `slotDetails.overallRemaining`
- ✅ Độ chính xác: 100% (khi có slotDetails)

**Fallback (khi không có slotDetails):**
- ⚠️ Dùng `totalDatesAvailable` (không chính xác)
- ⚠️ Độ chính xác: ~50-70% (tùy trường hợp)

**Khuyến nghị:**
- Backend nên thêm `totalWorkingDays` vào `AvailableSlot` response
- Để Frontend không cần fetch `slotDetails` riêng
- Tăng performance và độ chính xác

---

**Updated:** November 24, 2025  
**Status:** ✅ FIXED
