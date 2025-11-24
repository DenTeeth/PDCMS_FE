# Registration List Page UI/UX Improvements

## Current Issues:

1. ❌ **Slot information not clear** - User không biết:
   - Quota còn bao nhiêu
   - Tổng số slots của ca
   - Ngày nào còn available

2. ❌ **Status colors** - Cần cải thiện màu sắc
3. ❌ **Layout** - Cần tổ chức lại thông tin rõ ràng hơn
4. ❌ **Calendar month view** - Không hiển thị slots

## What to Improve:

### 1. Available Slots Section (Main List)
**Show for each slot:**
- ✅ Slot name & shift time
- ✅ Day of week
- ✅ **Quota info**: "8/10 slots available" with progress bar
- ✅ **Color coding**: Green/Yellow/Orange/Red based on availability
- ✅ Date range
- ✅ Visual indicators (icons, badges)

**Example card:**
```
┌─────────────────────────────────────────────┐
│ 🟢 Ca Part-time Chiều (13h-17h)             │
│ 📅 Thứ 4 (WEDNESDAY)                        │
│                                             │
│ 📊 Tình trạng:                              │
│ ████████░░ 8/10 slots (80%)                 │
│                                             │
│ 📅 04/11/2025 - 04/02/2026                  │
│ ⏰ 13h-17h (4 giờ/ca)                       │
│ 📍 11 tuần khả dụng                         │
│                                             │
│ [Đăng ký →]                                 │
└─────────────────────────────────────────────┘
```

### 2. My Registrations Section
**Improve cards:**
- ✅ Better status colors (Orange/Green/Red)
- ✅ Status icons (Clock/Check/X)
- ✅ Left border color indicator
- ✅ Show hours summary
- ✅ Show week count

**Example:**
```
┌─────────────────────────────────────────────┐
│ 🟡 CHỜ DUYỆT                                │
│ Ca Part-time Chiều (13h-17h) - Thứ 4       │
│ 📅 26/11/2025 - 07/12/2025                  │
│ ⏰ 4h/tuần × 2 tuần = 8h                    │
│                                             │
│ Đăng ký: 24/11/2025 10:30                   │
│                                             │
│ [Hủy đăng ký]                               │
└─────────────────────────────────────────────┘
```

### 3. Filters & Sorting
- Month filter
- Day filter
- Status filter
- Availability filter (>50%, >70%, etc.)
- Sort by date/availability

### 4. Summary Stats
Show at top:
```
┌──────────────────────────────────────────┐
│ 📊 Tổng quan                              │
│ • Đã duyệt: 12h/21h (57%)                │
│ • Chờ duyệt: 4h                          │
│ • Tổng nếu duyệt: 16h/21h (76%)          │
└──────────────────────────────────────────┘
```

## Implementation:

### Keep Form Modal AS-IS (revert changes)
- Form modal đã OK, không cần thay đổi
- Chỉ cần fix syntax errors

### Focus on Registration List Page:
1. **Available Slots Cards** - Add quota info, progress bars, colors
2. **My Registrations Cards** - Better status display, hours summary
3. **Filters** - Add more filter options
4. **Summary** - Add stats at top

## Color Scheme:

```css
/* Availability */
--available-high: #22C55E;    /* >70% - Green */
--available-medium: #FFA500;  /* 30-70% - Orange */
--available-low: #FF6B35;     /* <30% - Orange-Red */
--available-full: #EF4444;    /* 0% - Red */

/* Status */
--status-pending: #FFA500;    /* Orange */
--status-approved: #22C55E;   /* Green */
--status-rejected: #EF4444;   /* Red */
```

## Next Steps:

1. Revert form modal changes (keep original)
2. Improve available slots display
3. Improve my registrations display
4. Add filters
5. Add summary stats
6. Fix calendar month view

Bạn muốn tôi bắt đầu từ đâu?
