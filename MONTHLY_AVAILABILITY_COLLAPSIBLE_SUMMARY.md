# ✅ Monthly Availability UI - Collapsible Design

## 🎯 Thay đổi

### 1. **Thanh "Còn trống" tổng - KHÔNG ĐỘNG** ✅
```
Còn trống:                           1/1
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (static)
                100% còn trống
```
- ✅ Hiển thị tổng số slot còn trống **tất cả các tháng**
- ✅ Không bị ảnh hưởng khi expand/collapse
- ✅ Luôn hiển thị, không bị ẩn

### 2. **Phần "Tình trạng tháng" - Collapsible** ✅
```
┌─────────────────────────────────────┐
│ Tình trạng tháng              [▼]  │ <- Click để expand
└─────────────────────────────────────┘

// TRƯỚC KHI CLICK: Ẩn tất cả

// SAU KHI CLICK: Hiển thị tất cả tháng
┌─────────────────────────────────────┐
│ Tình trạng tháng              [▲]  │ <- Click để collapse
├─────────────────────────────────────┤
│ November 2025                  1/2  │ <- Click để xem detail
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 🟢 1 trống  🔴 1 đầy               │
├─────────────────────────────────────┤
│ December 2025                  0/5  │ <- Click để xem detail
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 🟢 0 trống  🔴 5 đầy               │
└─────────────────────────────────────┘
```

### 3. **Click vào từng tháng** ✅
- Hiện tại: Toast notification "Tính năng đang phát triển"
- Tương lai: Modal calendar view với chi tiết từng ngày

---

## 📋 Gửi cho Backend

### File: `REQUEST_TO_BACKEND_DAILY_AVAILABILITY.md`

**Backend cần làm:**

#### API Endpoint:
```
GET /api/v1/registrations/part-time-flex/slots/{slotId}/daily-availability?month=2025-11
```

#### Response Example:
```json
{
  "slotId": 1,
  "month": "2025-11",
  "monthName": "November 2025",
  "totalWorkingDays": 11,
  "dailyAvailability": [
    {
      "date": "2025-11-03",
      "dayOfWeek": "MONDAY",
      "quota": 10,
      "registered": 0,
      "remaining": 10,
      "status": "AVAILABLE"
    },
    {
      "date": "2025-11-10",
      "dayOfWeek": "MONDAY",
      "quota": 10,
      "registered": 8,
      "remaining": 2,
      "status": "PARTIAL"
    },
    {
      "date": "2025-11-17",
      "dayOfWeek": "MONDAY",
      "quota": 10,
      "registered": 10,
      "remaining": 0,
      "status": "FULL"
    }
  ]
}
```

#### Business Logic:
1. Lấy tất cả ngày trong tháng match với `dayOfWeek` của slot
2. Đếm số registration APPROVED cho mỗi ngày
3. Tính `remaining = quota - registered`
4. Xác định status: AVAILABLE (100% trống), PARTIAL (còn 1 số), FULL (đầy)

---

## 🎨 UI Flow

### Scenario 1: User muốn xem tổng
```
1. User nhìn thấy: "Còn trống: 1/1" với thanh xanh 100%
2. User biết ngay: Slot này có 1 slot còn trống trong tất cả các tháng
3. KHÔNG cần click gì cả
```

### Scenario 2: User muốn xem chi tiết từng tháng
```
1. User click "Tình trạng tháng [▼]"
2. Expand ra → Hiển thị tất cả tháng với progress bars
3. User thấy:
   - November 2025: 1/2 trống (50% xanh, 50% đỏ)
   - December 2025: 0/5 trống (100% đỏ)
```

### Scenario 3: User muốn xem ngày nào còn trống (Future)
```
1. User click vào "November 2025"
2. Modal mở ra hiển thị calendar grid:
   ┌───┬───┬───┬───┐
   │ 3 │10 │17 │24 │ (dates)
   │✅ │⚠️ │❌ │❌ │ (status)
   └───┴───┴───┴───┘
3. User thấy ngày 3/11 còn trống → Click "Đăng ký"
```

---

## 🔗 Files Changed

### Frontend:
1. ✅ `src/app/employee/registrations/page.tsx`
   - Thu gọn phần "Tình trạng tháng" mặc định
   - Toggle button để expand/collapse
   - Click handler cho từng tháng (tạm thời show toast)

### Documentation:
1. ✅ `REQUEST_TO_BACKEND_DAILY_AVAILABILITY.md`
   - Full API specification
   - Request/Response examples
   - Business logic explanation
   - TypeScript types
   - Frontend integration plan
   - Test cases

---

## 🚀 Next Steps

### Phase 1 (✅ DONE):
- ✅ Thanh tổng static, không động
- ✅ Phần tháng collapsible
- ✅ Toggle button expand/collapse
- ✅ Click handler với toast notification

### Phase 2 (📋 Waiting for BE):
- 📋 Backend implement API: `/daily-availability?month=YYYY-MM`
- 📋 Frontend add service method
- 📋 Create `DailyAvailabilityModal` component
- 📋 Update click handler to open modal
- 📋 Calendar grid view với color coding

### Phase 3 (🔮 Future):
- 🔮 Quick register từ modal
- 🔮 Tooltip hover để xem thông tin
- 🔮 Cache API calls để improve performance

---

## 📝 Testing

### Manual Test:
1. **Test thanh tổng:**
   - [ ] Hiển thị đúng `X/Y`
   - [ ] Progress bar đúng % và màu
   - [ ] Không thay đổi khi expand/collapse

2. **Test collapsible:**
   - [ ] Mặc định collapsed (không hiển thị tháng)
   - [ ] Click "Tình trạng tháng" → Expand
   - [ ] Click lại → Collapse
   - [ ] Icon đổi từ ▼ thành ▲

3. **Test click tháng:**
   - [ ] Click vào tháng → Toast hiển thị
   - [ ] Message: "{Tháng}: X/Y ngày còn trống"
   - [ ] Description: "Tính năng đang được phát triển"

---

## 💡 Notes cho Backend Team

### Important:
1. **Month parameter format**: Phải là `YYYY-MM` (e.g., `2025-11`, `2026-01`)
2. **DayOfWeek filtering**: Chỉ lấy ngày match với `dayOfWeek` của slot
3. **Multi-day slots**: Nếu slot có nhiều ngày (e.g., "MONDAY,WEDNESDAY"), cần handle cả 2 ngày
4. **Status logic**: 
   - `AVAILABLE`: remaining === quota (100% trống)
   - `PARTIAL`: 0 < remaining < quota (còn 1 số)
   - `FULL`: remaining === 0 (đầy)

### Optional Enhancements:
- Add `registeredEmployees` array để show "ai đã đăng ký"
- Add caching layer (Redis) để improve performance
- Add pagination nếu số ngày quá nhiều

---

**Status:** ✅ Frontend Ready  
**Waiting:** 📋 Backend API Implementation  
**Date:** November 17, 2025
