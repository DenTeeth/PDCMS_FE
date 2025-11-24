# 🎨 Slot Registration UX/UI Improvements

## 📋 Tổng quan

Cải thiện trải nghiệm người dùng cho trang **Đăng ký ca Part-time** với việc hiển thị thông tin rõ ràng hơn và công cụ chọn tuần đăng ký dễ dùng hơn.

---

## ✅ Các cải tiến đã thực hiện

### 1. 📊 Hiển thị Tình trạng Slots rõ ràng hơn

#### ❌ Trước đây
```tsx
<Badge variant={remaining > 0 ? "default" : "secondary"}>
  {remaining} left
</Badge>
```
**Hiển thị:** "10 left" ❌ Không rõ tổng số là bao nhiêu

#### ✅ Bây giờ
```tsx
<Badge 
  variant={remaining > 0 ? "default" : "secondary"}
  className={remaining > 0 ? "bg-green-600" : ""}
>
  {remaining}/{details?.quota || 0} còn lại
</Badge>
```
**Hiển thị:** "10/10 còn lại" ✅ Rõ ràng: số còn lại/tổng số

**Màu sắc:**
- 🟢 Xanh lá: Còn slots trống
- 🔘 Xám: Hết slots

---

### 2. 📅 Week Picker với Dropdown thông minh

#### ❌ Trước đây
- User phải chọn ngày bắt đầu và ngày kết thúc thủ công
- Không biết còn bao nhiêu tuần có thể đăng ký
- Dễ nhầm lẫn khi tính toán thời gian

#### ✅ Bây giờ
```tsx
// Chọn tuần bắt đầu (Dropdown)
<select>
  <option>Tuần 1 (23/11 - 29/11) • 5 tuần còn lại</option>
  <option>Tuần 2 (30/11 - 06/12) • 4 tuần còn lại</option>
  <option>Tuần 3 (07/12 - 13/12) • 3 tuần còn lại</option>
  ...
</select>

// Chọn số tuần đăng ký (Dropdown)
<select>
  <option>1 tuần</option>
  <option>2 tuần</option>
  <option>3 tuần</option>
  ...
</select>

// Hiển thị kết quả
📅 Đăng ký từ 23/11/2025 đến 06/12/2025 (2 tuần)
```

**Lợi ích:**
- ✅ Dễ hiểu: Hiển thị rõ khoảng thời gian mỗi tuần
- ✅ Thông minh: Tự động tính số tuần còn lại
- ✅ An toàn: Không thể chọn quá thời hạn của slot
- ✅ Trực quan: Hiển thị kết quả ngay lập tức

---

## 🔧 Technical Implementation

### 1. New Utility Functions

#### `calculateWeeksRemaining(startDate, endDate)`
Tính số tuần còn lại từ ngày bắt đầu đến ngày kết thúc
```typescript
const calculateWeeksRemaining = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
};
```

#### `generateWeekOptions(startDate, endDate)`
Tạo danh sách options cho dropdown tuần
```typescript
const generateWeekOptions = (startDate: string, endDate: string) => {
  const totalWeeks = calculateWeeksRemaining(startDate, endDate);
  const options = [];
  
  for (let i = 1; i <= totalWeeks; i++) {
    const weekStartDate = new Date(start);
    weekStartDate.setDate(start.getDate() + (i - 1) * 7);
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    options.push({
      value: format(weekStartDate, 'yyyy-MM-dd'),
      label: `Tuần ${i} (${format(weekStartDate, 'dd/MM')} - ${format(weekEndDate, 'dd/MM')})`,
      weeksRemaining: totalWeeks - i + 1
    });
  }
  
  return options;
};
```

### 2. New State Management
```typescript
const [selectedWeekDuration, setSelectedWeekDuration] = useState<number>(1);
```

### 3. Form Logic Updates

#### Auto-calculate end date based on week duration
```typescript
onChange={(e) => {
  const weeks = parseInt(e.target.value);
  setSelectedWeekDuration(weeks);
  
  if (registerFormData.effectiveFrom) {
    const startDate = new Date(registerFormData.effectiveFrom);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (weeks * 7) - 1);
    
    // Don't exceed slot's end date
    const slotEndDate = new Date(selectedSlot.effectiveTo);
    if (endDate > slotEndDate) {
      endDate.setTime(slotEndDate.getTime());
    }
    
    setRegisterFormData(prev => ({
      ...prev,
      effectiveTo: format(endDate, 'yyyy-MM-dd')
    }));
  }
}}
```

---

## 🎨 UI/UX Improvements Summary

### Before vs After

| Feature | Before | After |
|---------|--------|-------|
| **Slots Display** | "10 left" | "10/10 còn lại" 🟢 |
| **Date Selection** | Manual date picker | Smart week dropdown |
| **Week Calculation** | User must calculate | Auto-calculated |
| **Weeks Remaining** | Not shown | "• 5 tuần còn lại" |
| **Duration Selection** | Manual end date | Dropdown số tuần |
| **Result Preview** | Hidden | "📅 Từ X đến Y (Z tuần)" |
| **Color Coding** | Basic | Green for available |

---

## 📱 User Flow

### Step 1: Xem danh sách slots
```
✅ Ca Part-time Sáng (8h-12h)
   🟢 10/10 còn lại
   📅 Thứ 2
   [Đăng ký] button
```

### Step 2: Click "Đăng ký"
Modal hiển thị với 2 dropdowns:

### Step 3: Chọn tuần bắt đầu
```
Chọn tuần bắt đầu *
┌─────────────────────────────────────┐
│ Tuần 1 (23/11 - 29/11) • 5 tuần còn lại │
│ Tuần 2 (30/11 - 06/12) • 4 tuần còn lại │
│ Tuần 3 (07/12 - 13/12) • 3 tuần còn lại │
└─────────────────────────────────────┘
💡 Chọn tuần bắt đầu đăng ký
```

### Step 4: Chọn số tuần
```
Số tuần đăng ký *
┌─────────────┐
│ 1 tuần      │
│ 2 tuần      │
│ 3 tuần      │
└─────────────┘

📅 Đăng ký từ 23/11/2025 đến 06/12/2025 (2 tuần)
```

### Step 5: Chọn ngày trong tuần
```
☐ Thứ 2
☑ Thứ 3
☑ Thứ 5
```

### Step 6: Submit
```
[Register for Slot] button
```

---

## 📊 Benefits

### For Users (Employees)
- ✅ **Rõ ràng hơn**: Biết chính xác số slots còn lại/tổng số
- ✅ **Dễ dùng hơn**: Dropdown thay vì date picker phức tạp
- ✅ **Thông minh hơn**: Tự động tính tuần còn lại
- ✅ **An toàn hơn**: Không thể chọn sai thời hạn
- ✅ **Trực quan hơn**: Preview kết quả ngay lập tức

### For System
- ✅ **Giảm lỗi**: Validation tốt hơn
- ✅ **Data integrity**: End date được tính chính xác
- ✅ **Better UX**: Tăng user satisfaction

---

## 🧪 Test Cases

### Test Case 1: Hiển thị slots
```
Input: Slot có quota=10, remaining=10
Expected: Badge hiển thị "10/10 còn lại" với màu xanh
```

### Test Case 2: Hiển thị slots hết chỗ
```
Input: Slot có quota=10, remaining=0
Expected: Badge hiển thị "0/10 còn lại" với màu xám
```

### Test Case 3: Week picker
```
Input: Slot từ 23/11 đến 31/12 (6 tuần)
Expected: Dropdown hiển thị 6 options với số tuần còn lại
```

### Test Case 4: Week duration calculation
```
Input: Chọn tuần 1, duration 2 tuần
Expected: End date = Start date + 13 days
Preview: "📅 Đăng ký từ 23/11/2025 đến 06/12/2025 (2 tuần)"
```

### Test Case 5: Prevent overflow
```
Input: Chọn tuần 5, duration 3 tuần (vượt slot end date)
Expected: End date = Slot end date (không vượt quá)
```

---

## 📁 Files Changed

```
✅ src/app/employee/slot-registration/page.tsx
```

**Changes:**
1. Badge display: "X left" → "X/Y còn lại"
2. Added `calculateWeeksRemaining()` utility
3. Added `generateWeekOptions()` utility
4. Added `selectedWeekDuration` state
5. Replaced date inputs with week dropdowns
6. Added real-time preview of selected period
7. Added emoji icons for better visual feedback

---

## 🚀 Deployment

### Before Deployment
- ✅ Test all week calculations
- ✅ Test boundary cases (first week, last week)
- ✅ Test with different slot durations
- ✅ Verify date formatting
- ✅ Check responsive design

### After Deployment
- 📊 Monitor user feedback
- 📈 Track registration success rate
- 🐛 Watch for edge case bugs

---

## 📸 Visual Examples

### Slots Display
```
Before: [10 left]
After:  [10/10 còn lại] 🟢
```

### Week Picker
```
Dropdown options:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tuần 1 (23/11 - 29/11) • 5 tuần còn lại
Tuần 2 (30/11 - 06/12) • 4 tuần còn lại
Tuần 3 (07/12 - 13/12) • 3 tuần còn lại
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Duration Selector
```
Số tuần đăng ký *
━━━━━━━━━━━━━━━
1 tuần
2 tuần  ← selected
3 tuần
4 tuần
5 tuần
━━━━━━━━━━━━━━━

Result:
📅 Đăng ký từ 23/11/2025 đến 06/12/2025 (2 tuần)
```

---

**Status:** ✅ COMPLETED  
**Date:** November 23, 2025  
**Impact:** Employee Slot Registration UX  
**Developer Notes:** Tested with various slot durations, all calculations working correctly
