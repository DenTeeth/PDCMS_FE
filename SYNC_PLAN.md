# Plan: Sync Employee Pages UI/UX với Admin

## Mục tiêu
Đồng bộ giao diện employee overtime-requests và time-off-requests với admin pages, loại bỏ các chức năng admin-only.

## Employee Overtime Requests (`/employee/overtime-requests`)

### Cần giữ:
- ✅ Header: Title + Create button (purple theme)
- ✅ Filters section: Search, Status filter, Date range
- ✅ Request list/table với columns: ID, Date, Shift, Status, Actions
- ✅ View details modal
- ✅ Create request modal
- ✅ Cancel request modal (chỉ cho pending requests của chính họ)

### Cần bỏ:
- ❌ Stats cards (Tổng yêu cầu, Chờ duyệt, Đã duyệt, Từ chối)
- ❌ Employee filter (vì chỉ xem của chính họ)
- ❌ Approve button
- ❌ Reject button

### UI/UX Updates:
1. Header với purple gradient nhẹ
2. Filters trong Card với border purple
3. Table/List items với hover effects
4. Status badges với màu tương ứng
5. Action buttons align đúng

## Employee Time-Off Requests (`/employee/time-off-requests`)

### Cần giữ:
- ✅ Header: Title + Create button
- ✅ Filters: Search, Status, Time-off type, Date range
- ✅ Request list với: ID, Type, Period, Days, Status, Actions
- ✅ View details modal
- ✅ Create request modal
- ✅ Cancel request modal

### Cần bỏ:
- ❌ Stats cards
- ❌ Employee filter
- ❌ Approve button
- ❌ Reject button

### UI/UX Updates:
- Giống overtime structure
- Purple theme consistent
- Better spacing và shadows

## Color Scheme (Purple Theme)
- Primary: `#8b5fbf`
- Hover: `#7a4fb0`
- Active: `#6a3f9e`
- Light: `#faf5ff`
- Border: `border-purple-100`

## Implementation Steps

### Step 1: Overtime Requests
1. Read current employee overtime page
2. Read admin overtime page structure
3. Update header (remove stats)
4. Update filters section
5. Update table/list UI
6. Update modals styling
7. Remove admin-only buttons
8. Apply purple theme
9. Test functionality

### Step 2: Time-Off Requests
1. Read current employee time-off page
2. Read admin time-off page structure
3. Apply same changes as overtime
4. Update time-off type selector
5. Update leave balance display
6. Apply purple theme
7. Test functionality

## Files to Update
- `PDCMS_FE/src/app/employee/overtime-requests/page.tsx`
- `PDCMS_FE/src/app/employee/time-off-requests/page.tsx`

## Testing Checklist
- [ ] Employee can view only their requests
- [ ] Create request works
- [ ] Cancel pending request works
- [ ] Cannot approve/reject (buttons hidden)
- [ ] Filters work correctly
- [ ] Purple theme applied consistently
- [ ] Responsive design works
- [ ] No console errors
