# ✅ Monthly Availability - Show Quota Instead of Days

## 🎯 Vấn đề

Trong phần "Tình trạng theo tháng", UI đang hiển thị **số ngày còn trống/tổng số ngày** thay vì **số lượt đăng ký còn lại**.

### ❌ Trước đây
```tsx
// Hiển thị số ngày
{month.totalDatesAvailable}/{month.totalWorkingDays}

// Ví dụ: "5/10" nghĩa là 5 ngày còn trống / 10 ngày làm việc
```

**Vấn đề:**
- User không biết còn bao nhiêu **lượt đăng ký** có thể đăng ký
- Chỉ biết số ngày còn trống, nhưng không biết mỗi ngày có bao nhiêu slot

---

## ✅ Giải pháp

### Công thức tính Quota
```typescript
availableQuota = totalDatesAvailable × quota
totalQuota = totalWorkingDays × quota
```

### Ví dụ
```
- Quota per day: 5 người/ngày
- Total working days: 10 ngày
- Available days: 5 ngày

→ Total quota: 10 × 5 = 50 lượt
→ Available quota: 5 × 5 = 25 lượt còn lại

Hiển thị: "25/50" ✅
```

---

## 🔧 Technical Changes

### Before
```tsx
// Hiển thị số ngày
<span className="text-xs font-bold text-purple-600">
  {month.totalDatesAvailable}/{month.totalWorkingDays}
</span>

// Tooltip
title={`${month.totalDatesAvailable} ngày còn trống`}
```

### After
```tsx
// Calculate quota
const availableQuota = month.totalDatesAvailable * slotDetails.quota;
const partialQuota = month.totalDatesPartial * slotDetails.quota;
const fullQuota = month.totalDatesFull * slotDetails.quota;
const totalQuota = month.totalWorkingDays * slotDetails.quota;

// Hiển thị số lượt đăng ký
<span className="text-xs font-bold text-purple-600">
  {availableQuota}/{totalQuota}
</span>

// Tooltip
title={`${availableQuota} lượt đăng ký còn trống`}
```

---

## 📊 Visual Example

### Trước
```
November 2025       5/10
━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 5  🟡 3  🔴 2
```
**Nghĩa là:** 5 ngày còn trống, 10 ngày tổng  
**Vấn đề:** Không biết 5 ngày = bao nhiêu lượt

### Sau
```
November 2025       25/50
━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 25  🟡 15  🔴 10
```
**Nghĩa là:** 25 lượt đăng ký còn trống, 50 lượt tổng  
**Rõ ràng:** Biết chính xác còn 25 lượt có thể đăng ký!

---

## 📈 Progress Bar Logic

### Before
```typescript
const percentAvailable = (totalDatesAvailable / totalWorkingDays) * 100;
```

### After
```typescript
const percentAvailable = (availableQuota / totalQuota) * 100;
```

**Result:** Progress bar vẫn chính xác, nhưng dựa trên quota thay vì số ngày.

---

## 🎨 Color Coding

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Available | Lượt đăng ký còn trống |
| 🟡 Yellow | Partial | Lượt gần đầy (ít slot) |
| 🔴 Red | Full | Lượt đã đầy |

---

## 📁 Files Changed

```
✅ src/app/employee/registrations/page.tsx
```

**Changes:**
1. Calculate `availableQuota = totalDatesAvailable × quota`
2. Calculate `totalQuota = totalWorkingDays × quota`
3. Display `{availableQuota}/{totalQuota}` instead of `{days}/{totalDays}`
4. Update tooltips: "lượt đăng ký" instead of "ngày"
5. Update badge numbers to show quota counts

---

## 💡 Benefits

### For Users
- ✅ **Rõ ràng hơn**: Biết chính xác còn bao nhiêu lượt có thể đăng ký
- ✅ **Useful info**: Thông tin hữu ích để quyết định đăng ký
- ✅ **No confusion**: Không còn nhầm lẫn giữa ngày và lượt

### For System
- ✅ **Accurate display**: Hiển thị đúng với business logic
- ✅ **Quota-based**: Dựa trên quota thực tế, không phải ngày

---

## 🧪 Test Cases

### Test Case 1: Basic calculation
```
Input:
- quota = 5
- totalWorkingDays = 10
- totalDatesAvailable = 5

Expected:
- Display: "25/50"
- Green badge: 25
```

### Test Case 2: All full
```
Input:
- quota = 5
- totalWorkingDays = 10
- totalDatesFull = 10

Expected:
- Display: "0/50"
- Red badge: 50
```

### Test Case 3: Mixed status
```
Input:
- quota = 5
- totalWorkingDays = 10
- totalDatesAvailable = 3
- totalDatesPartial = 4
- totalDatesFull = 3

Expected:
- Display: "15/50"
- Green badge: 15
- Yellow badge: 20
- Red badge: 15
```

---

**Status:** ✅ COMPLETED  
**Date:** November 23, 2025  
**Issue:** Multiple requests - finally fixed!  
**Impact:** Monthly availability display now shows registration quota
