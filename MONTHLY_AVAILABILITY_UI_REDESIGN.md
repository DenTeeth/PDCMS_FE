# 🎨 Monthly Availability UI Redesign

## 📋 Overview
Redesigned "Tình trạng tháng" section với progress bars và interactive click để xem chi tiết slot còn trống theo tháng.

---

## ✨ Features

### 1. **Visual Progress Bars**
- ✅ Mỗi tháng hiển thị progress bar với 3 màu:
  - 🟢 **Green**: Ngày còn trống (Available)
  - 🟡 **Yellow**: Ngày gần đầy (Partial)
  - 🔴 **Red**: Ngày đã đầy (Full)

### 2. **Interactive Click**
- ✅ Click vào tháng → Hiển thị toast notification với thông tin tóm tắt
- 🔄 **Chuẩn bị sẵn** để tích hợp API daily details khi BE có

### 3. **Collapsed/Expanded View**
- **Collapsed**: Hiển thị 2 tháng đầu tiên
- **Expanded**: Hiển thị tất cả các tháng (scrollable)
- Toggle button: "Xem tất cả" / "Thu gọn"

### 4. **Detailed Stats Display**
- Tên tháng (e.g., "November 2025")
- Số slot: `{available}/{total}` (e.g., "1/11")
- Legend với số lượng cụ thể:
  - "X trống"
  - "Y gần đầy" (nếu có)
  - "Z đầy" (nếu có)

---

## 🎨 UI Design

### Before (❌ Old Design):
```
┌─────────────────────────────────────┐
│ Tình trạng tháng           [Toggle] │
├─────────────┬─────────────┐         │
│  November   │  December   │         │
│      1      │      5      │         │
│ còn 1 slot  │ còn 5 slot  │         │
└─────────────┴─────────────┘         │
```

### After (✅ New Design):
```
┌────────────────────────────────────────────┐
│ Tình trạng tháng            [Xem tất cả ▼] │
├────────────────────────────────────────────┤
│ November 2025                        1/11  │ <- Clickable
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ <- Progress bar
│ 🟢 1 trống  🟡 2 gần đầy  🔴 8 đầy         │ <- Legend
├────────────────────────────────────────────┤
│ December 2025                        5/11  │ <- Clickable
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ <- Progress bar
│ 🟢 5 trống  🟡 1 gần đầy  🔴 5 đầy         │ <- Legend
└────────────────────────────────────────────┘
```

---

## 🖱️ User Interaction

### Click on Month Card:
```typescript
onClick={() => {
  toast.info(
    `${month.monthName}: ${month.totalDatesAvailable}/${month.totalWorkingDays} ngày còn trống`,
    {
      description: 'Tính năng xem chi tiết từng ngày đang được phát triển'
    }
  );
}}
```

**Current behavior:**
- Shows toast with summary info
- Informs user that daily details feature is in development

**Future behavior (when BE API ready):**
```typescript
onClick={async () => {
  const dailyDetails = await workSlotService.getDailyAvailability(
    slot.slotId, 
    month.month // "2025-11"
  );
  
  // Show modal with daily calendar view:
  // November 2025
  // ┌───┬───┬───┬───┬───┬───┬───┐
  // │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │
  // │ ✅│ ⚠️│ ❌│ ✅│ ❌│ ❌│ ❌│
  // └───┴───┴───┴───┴───┴───┴───┘
  // ✅ = Available  ⚠️ = Partial  ❌ = Full
}}
```

---

## 📊 Data Structure

### Input from Backend:
```typescript
interface MonthlyAvailability {
  month: string;              // "2025-11"
  monthName: string;          // "November 2025"
  totalDatesAvailable: number; // 1
  totalDatesPartial: number;   // 2
  totalDatesFull: number;      // 8
  status: 'AVAILABLE' | 'PARTIAL' | 'FULL';
  totalWorkingDays: number;    // 11
}
```

### Progress Bar Calculation:
```typescript
const percentAvailable = (month.totalDatesAvailable / month.totalWorkingDays) * 100;
const percentPartial = (month.totalDatesPartial / month.totalWorkingDays) * 100;
const percentFull = (month.totalDatesFull / month.totalWorkingDays) * 100;

// Example: 1/11 available, 2/11 partial, 8/11 full
// percentAvailable = 9.09%  -> Green bar width
// percentPartial   = 18.18% -> Yellow bar width
// percentFull      = 72.73% -> Red bar width
```

---

## 🔗 Component Code

### File: `src/app/employee/registrations/page.tsx`

**Key changes:**
1. Changed from colored box layout to interactive button cards
2. Added progress bars with 3-color visualization
3. Added click handler with toast notification
4. Added hover effects for better UX
5. Improved spacing and visual hierarchy

**Collapsed View:**
```tsx
<div className="space-y-2">
  {slotDetails.availabilityByMonth.slice(0, 2).map((month, idx) => (
    <button
      onClick={() => { /* Show toast */ }}
      className="w-full text-left p-2.5 rounded-lg border hover:border-purple-300"
    >
      {/* Month name + fraction */}
      {/* Progress bar */}
      {/* Legend */}
    </button>
  ))}
</div>
```

**Expanded View:**
```tsx
<div className="space-y-1.5 max-h-64 overflow-y-auto">
  {slotDetails.availabilityByMonth.map((month, idx) => (
    <button /* Same card structure */ />
  ))}
</div>
```

---

## 🚀 Future Enhancements

### Phase 1 (✅ Current):
- ✅ Visual progress bars
- ✅ Interactive click with toast
- ✅ Collapsed/Expanded view
- ✅ Detailed stats display

### Phase 2 (🔄 Requires BE API):
Backend needs to implement:
```
GET /api/v1/registrations/part-time-flex/slots/{slotId}/daily-availability?month=2025-11
```

Response:
```json
{
  "slotId": 1,
  "month": "2025-11",
  "monthName": "November 2025",
  "dailyAvailability": [
    {
      "date": "2025-11-03",  // Monday
      "dayOfWeek": "MONDAY",
      "quota": 10,
      "registered": 0,
      "remaining": 10,
      "status": "AVAILABLE"
    },
    {
      "date": "2025-11-10",  // Monday
      "quota": 10,
      "registered": 8,
      "remaining": 2,
      "status": "PARTIAL"
    },
    {
      "date": "2025-11-17",  // Monday
      "quota": 10,
      "registered": 10,
      "remaining": 0,
      "status": "FULL"
    }
    // ... more dates
  ]
}
```

### Phase 3 (📅 Future):
Frontend implementation:
1. **Create modal component**: `DailyAvailabilityModal.tsx`
2. **Calendar grid view** showing all dates in month
3. **Color coding**: Green/Yellow/Red based on status
4. **Click on date** → Show detailed registration info
5. **Quick register** from daily view

---

## 🎯 Benefits

### User Experience:
- ✅ **Visual clarity**: Progress bars immediately show availability at a glance
- ✅ **Interactive**: Clickable cards provide feedback and future extensibility
- ✅ **Informative**: Legend shows exact numbers, not just colors
- ✅ **Responsive**: Smooth hover effects and transitions

### Developer Experience:
- ✅ **Extensible**: Easy to add daily details modal when API ready
- ✅ **Maintainable**: Clean component structure with reusable patterns
- ✅ **Type-safe**: Full TypeScript typing with MonthlyAvailability interface

### Performance:
- ✅ **No extra API calls**: Uses existing data from slot details
- ✅ **Efficient rendering**: Only renders visible months in collapsed view
- ✅ **Smooth scrolling**: Expanded view has proper max-height and scroll

---

## 📝 Testing Checklist

- [x] Visual display of progress bars
- [x] Click interaction shows toast
- [x] Collapsed view shows 2 months
- [x] Expanded view shows all months with scroll
- [x] Toggle button works correctly
- [x] Legend displays correct numbers
- [x] Hover effects work smoothly
- [x] Responsive on mobile devices
- [ ] Daily details modal (when BE API ready)
- [ ] Quick register from daily view (when BE API ready)

---

## 🐛 Known Limitations

1. **No daily details yet**: 
   - Current: Shows toast message
   - Future: Will show daily calendar modal

2. **Backend API required**:
   - Need `/daily-availability` endpoint
   - Need to return per-date breakdown

3. **Future considerations**:
   - Add loading state when fetching daily details
   - Add error handling for failed API calls
   - Consider caching daily details to reduce API calls

---

**Status:** ✅ Ready for Production  
**Date:** November 17, 2025  
**Next Step:** Wait for BE team to implement daily availability API
