# 🐛 BUG REPORT: Slot Availability Hiển Thị Sai

## 📋 Thông Tin

**Endpoint:** `GET /api/v1/work-slots/available`  
**Ngày phát hiện:** 24/11/2025  
**Mức độ:** 🔴 HIGH - Ảnh hưởng UX, nhân viên không thể đăng ký do nghĩ slot đã đầy

---

## 🔍 Mô Tả Lỗi

Frontend hiển thị **"Đầy • 11/11 weeks available"** cho các slot, trong khi slot đó vẫn còn trống hoàn toàn (chưa có ai đăng ký).

### Ảnh Chụp Màn Hình
- Ca Part-time Chiều (13h-17h) - T4: **"Đầy • 11/11 weeks available"**
- Ca Part-time Sáng (8h-12h) - T6: **"Đầy • 10/11 weeks available"**
- Ca Part-time Chiều (13h-17h) - T7: **"Đầy • 10/11 weeks available"**

---

## 🔧 Phân Tích Kỹ Thuật

### Response Hiện Tại (Nghi Ngờ Sai)

```json
{
  "slotId": 123,
  "shiftName": "Ca Part-time Chiều (13h-17h)",
  "dayOfWeek": "WEDNESDAY",
  "totalDatesAvailable": 11,     // ✅ Tổng số tuần có sẵn
  "totalDatesEmpty": 0,           // ❌ NGHI NGỜ SAI - Nên là 11 nếu chưa ai đăng ký
  "availabilitySummary": "11/11 weeks available"  // ✅ Text đúng nhưng data sai
}
```

### Logic Frontend (Đã Đúng)

```typescript
const availablePercent = totalWeeks > 0 
  ? (availableWeeks / totalWeeks) * 100 
  : 0;

// availableWeeks = totalDatesEmpty = 0
// availablePercent = 0% → Hiển thị "Đầy" ❌
```

**Kết quả:**
- `totalDatesEmpty = 0` → `availablePercent = 0%` → Badge hiển thị **"Đầy"** 
- Nhưng text `availabilitySummary` lại là "11/11 weeks available" → **MÂU THUẪN**

---

## ✅ Kỳ Vọng

### Response Đúng Nên Là:

```json
{
  "slotId": 123,
  "shiftName": "Ca Part-time Chiều (13h-17h)",
  "dayOfWeek": "WEDNESDAY",
  "totalDatesAvailable": 11,     // Tổng số tuần
  "totalDatesEmpty": 11,          // ✅ Số tuần còn trống (chưa ai đăng ký)
  "availabilitySummary": "11/11 weeks available"
}
```

**Khi đó Frontend sẽ hiển thị:**
- `availablePercent = (11 / 11) * 100 = 100%` → Badge **"Còn nhiều"** ✅ (màu xanh lá)

---

## 🔍 Các Trường Hợp Cần Kiểm Tra

### Case 1: Slot Hoàn Toàn Trống
```json
{
  "totalDatesAvailable": 11,
  "totalDatesEmpty": 11,          // ✅ Tất cả đều trống
  "availabilitySummary": "11/11 weeks available"
}
// → Frontend hiển thị: "Còn nhiều • 11/11" (badge xanh lá)
```

### Case 2: Slot Đã Đăng Ký 1 Phần
```json
{
  "totalDatesAvailable": 11,
  "totalDatesEmpty": 5,           // ✅ Còn 5 tuần trống
  "availabilitySummary": "5/11 weeks available"
}
// → Frontend hiển thị: "Sắp đầy • 5/11" (badge vàng)
```

### Case 3: Slot Đã Đầy
```json
{
  "totalDatesAvailable": 11,
  "totalDatesEmpty": 0,           // ✅ Không còn tuần nào trống
  "availabilitySummary": "0/11 weeks available"
}
// → Frontend hiển thị: "Đầy • 0/11" (badge xám)
```

---

## 📊 Ngưỡng Hiển Thị Frontend

| Availability % | Badge | Màu | Điều Kiện |
|---------------|-------|-----|-----------|
| ≥ 50% | **Còn nhiều** | 🟢 Xanh lá | `totalDatesEmpty / totalDatesAvailable >= 0.5` |
| 20-50% | **Sắp đầy** | 🟡 Vàng | `0.2 <= ratio < 0.5` |
| 0-20% | **Đầy** | ⚪ Xám | `ratio < 0.2` |

---

## 🛠️ Yêu Cầu Backend

### 1. Kiểm Tra Logic Tính `totalDatesEmpty`

Đảm bảo:
```sql
-- Giả sử dùng SQL
totalDatesEmpty = totalDatesAvailable - COUNT(DISTINCT registration_dates WHERE status IN ('PENDING', 'APPROVED'))
```

### 2. Đồng Bộ `availabilitySummary` với `totalDatesEmpty`

Nếu:
- `totalDatesEmpty = 11` → `availabilitySummary = "11/11 weeks available"`
- `totalDatesEmpty = 0` → `availabilitySummary = "0/11 weeks available"`

**KHÔNG THỂ** có case:
- `totalDatesEmpty = 0` nhưng `availabilitySummary = "11/11 weeks available"` ❌

---

## 🧪 Test Cases

### Test 1: Slot Chưa Có Đăng Ký
```
GIVEN: Slot ID 123 chưa có registration nào
WHEN: GET /api/v1/work-slots/available
THEN: 
  - totalDatesAvailable = 11
  - totalDatesEmpty = 11
  - availabilitySummary = "11/11 weeks available"
```

### Test 2: Slot Đã Có 6 Registrations (> 50%)
```
GIVEN: Slot ID 123 đã có 6 registrations (6/11 tuần)
WHEN: GET /api/v1/work-slots/available
THEN: 
  - totalDatesAvailable = 11
  - totalDatesEmpty = 5
  - availabilitySummary = "5/11 weeks available"
```

### Test 3: Slot Đã Full (100%)
```
GIVEN: Slot ID 123 đã có 11 registrations
WHEN: GET /api/v1/work-slots/available
THEN: 
  - totalDatesAvailable = 11
  - totalDatesEmpty = 0
  - availabilitySummary = "0/11 weeks available"
  - hoặc không trả về slot này trong list (vì đã full)
```

---

## 🚨 Impact

**Nếu không sửa:**
1. Nhân viên nghĩ slot đã đầy → Không đăng ký
2. Mất cơ hội fill slots còn trống
3. Admin phải thủ công check → Tốn thời gian
4. UX kém, trust issue

**Priority:** 🔴 **HIGH** - Cần sửa ASAP

---

## 📎 Thông Tin Bổ Sung

- **Frontend đã xử lý đúng:** Logic tính availability % và hiển thị badge đã chính xác
- **Vấn đề nằm ở Backend:** Data trả về không consistent
- **File FE liên quan:** `src/app/employee/registrations/page.tsx` (lines 1350-1370)

---

## ✅ Checklist Backend

- [ ] Kiểm tra query tính `totalDatesEmpty`
- [ ] Đảm bảo chỉ đếm registrations có status `PENDING` hoặc `APPROVED`
- [ ] Loại trừ registrations `REJECTED` hoặc `CANCELLED`
- [ ] Đồng bộ `availabilitySummary` với `totalDatesEmpty`
- [ ] Test với 3 cases trên
- [ ] Deploy và verify trên production

---

**Reported by:** Frontend Team  
**Date:** 24/11/2025  
**Status:** 🔴 Open - Chờ Backend Fix
