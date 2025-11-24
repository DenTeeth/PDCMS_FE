# 🔧 Fix Overtime Request - Chống Spam 1 Đơn/Ngày

## 📋 Tổng quan

Backend đã cập nhật logic validation để **chỉ cho phép 1 đơn overtime cho mỗi ngày** (không phân biệt ca làm việc). Frontend đã được cập nhật để xử lý thay đổi này.

## 🎯 Thay đổi Backend

### Trước đây
- Nhân viên có thể gửi nhiều đơn overtime cho cùng 1 ngày (miễn khác ca)
- Duplicate validation chỉ kiểm tra theo `(employeeId, workDate, workShiftId)`

### Bây giờ
- **CHỈ cho phép 1 đơn overtime cho mỗi ngày** (không quan tâm ca nào)
- Duplicate validation kiểm tra theo `(employeeId, workDate)` với status `PENDING` hoặc `APPROVED`
- Nếu đơn cũ bị `REJECTED` hoặc `CANCELLED`, có thể gửi đơn mới cho cùng ngày

### Error Response
```json
// Status: 400 Bad Request
{
  "code": "DUPLICATE_OT_REQUEST",
  "message": "Bạn đã có đơn overtime cho ngày 2025-11-22 rồi! Chỉ được gửi 1 đơn overtime cho mỗi ngày."
}
```

## ✅ Cập nhật Frontend

### 1. Error Handler (`overtimeErrorHandler.ts`)

#### Cập nhật message cho lỗi 409
```typescript
case 409:
  // Ưu tiên hiển thị message từ backend
  if (error.message && (error.message.includes('đã có đơn overtime') || error.message.includes('already has'))) {
    return error.message;
  }
  return error.message || 'Xung đột dữ liệu: Nhân viên đã có đơn overtime cho ngày này';
```

### 2. Client-side Validation

#### Function `checkDuplicateOvertimeByDate()`
```typescript
/**
 * Kiểm tra đã có đơn overtime cho ngày này chưa (client-side check)
 * Backend mới: CHỈ cho phép 1 đơn overtime cho mỗi ngày (không quan tâm ca)
 */
export const checkDuplicateOvertimeByDate = (
  requests: any[],
  workDate: string,
  employeeId?: number
): boolean => {
  return requests.some((request) => {
    // Chỉ kiểm tra đơn PENDING hoặc APPROVED
    const isActiveStatus = request.status === 'PENDING' || request.status === 'APPROVED';
    const isSameDate = request.workDate === workDate;
    
    // Nếu có employeeId (admin form), kiểm tra cả employeeId
    if (employeeId) {
      return isActiveStatus && isSameDate && request.employeeId === employeeId;
    }
    
    // Nếu không có employeeId (employee form), chỉ kiểm tra ngày
    return isActiveStatus && isSameDate;
  });
};
```

### 3. Employee Page (`employee/overtime-requests/page.tsx`)

#### Validation trước khi submit
```typescript
// ⚠️ Client-side duplicate check: Kiểm tra đã có đơn cho ngày này chưa
const hasDuplicateDate = checkDuplicateOvertimeByDate(overtimeRequests, formData.workDate);
if (hasDuplicateDate) {
  toast.error('Bạn đã có đơn overtime cho ngày này rồi!', {
    description: 'Chỉ được gửi 1 đơn overtime cho mỗi ngày. Vui lòng kiểm tra lại danh sách đơn hiện tại.',
    duration: 5000,
  });
  return;
}
```

#### Visual warning trong form
```tsx
{/* Warning nếu đã có đơn cho ngày này */}
{formData.workDate && checkDuplicateOvertimeByDate(overtimeRequests, formData.workDate) && (
  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
    <p className="text-sm text-yellow-800 font-medium">
      ⚠️ Bạn đã có đơn overtime cho ngày này rồi!
    </p>
    <p className="text-xs text-yellow-700 mt-1">
      Chỉ được gửi 1 đơn overtime cho mỗi ngày. Vui lòng kiểm tra danh sách đơn hiện tại.
    </p>
  </div>
)}
```

### 4. Admin Page (`admin/overtime-requests/page.tsx`)

#### Validation cho admin form
```typescript
// ⚠️ Client-side duplicate check: Kiểm tra đã có đơn cho ngày này chưa
const hasDuplicateDate = checkDuplicateOvertimeByDate(
  overtimeRequests,
  formData.workDate,
  formData.employeeId
);
if (hasDuplicateDate) {
  toast.error('Nhân viên đã có đơn overtime cho ngày này rồi!', {
    description: 'Chỉ được gửi 1 đơn overtime cho mỗi ngày (không phân biệt ca). Vui lòng kiểm tra danh sách đơn hiện tại.',
    duration: 5000,
  });
  return;
}
```

#### Visual warning (tương tự employee page)
```tsx
{formData.workDate && formData.employeeId && checkDuplicateOvertimeByDate(
  overtimeRequests,
  formData.workDate,
  formData.employeeId
) && (
  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
    <p className="text-sm text-yellow-800 font-medium">
      ⚠️ Nhân viên đã có đơn overtime cho ngày này rồi!
    </p>
    <p className="text-xs text-yellow-700 mt-1">
      Chỉ được gửi 1 đơn overtime cho mỗi ngày. Vui lòng kiểm tra danh sách đơn hiện tại.
    </p>
  </div>
)}
```

## 🎨 UX Improvements

### 1. Toast Notifications
- ✅ Sử dụng `toast.error()` thay vì `alert()` cho consistent UX
- ✅ Loading toast khi đang submit: "Đang tạo yêu cầu làm thêm giờ..."
- ✅ Success toast với description: "Mã yêu cầu: XXX - Trạng thái: PENDING"
- ✅ Error toast với description chi tiết từ backend

### 2. Visual Warnings
- ⚠️ Warning box màu vàng xuất hiện realtime khi chọn ngày đã có đơn
- ⚠️ Icon và message rõ ràng: "Bạn đã có đơn overtime cho ngày này rồi!"
- ⚠️ Suggestion: "Vui lòng kiểm tra danh sách đơn hiện tại"

### 3. Form Validation
- ✅ Client-side validation trước khi gửi request (giảm tải server)
- ✅ Kiểm tra realtime khi user chọn ngày
- ✅ Message lỗi rõ ràng, dễ hiểu

## 📊 Test Cases

### Test Case 1: Tạo đơn đầu tiên cho ngày 22/11/2025
```
✅ Expected: Tạo thành công
✅ Status: 201 Created
```

### Test Case 2: Tạo đơn thứ 2 cho cùng ngày 22/11/2025
```
❌ Expected: Lỗi validation
❌ Status: 400 Bad Request
❌ Message: "Bạn đã có đơn overtime cho ngày 2025-11-22 rồi!"
```

### Test Case 3: Tạo đơn mới sau khi đơn cũ bị REJECTED
```
✅ Expected: Tạo thành công
✅ Reason: Đơn cũ không còn status PENDING/APPROVED
```

### Test Case 4: Client-side validation
```
⚠️ Expected: Warning box xuất hiện khi chọn ngày đã có đơn
⚠️ Expected: Toast error khi click Submit
⚠️ Expected: Không gọi API (validation chặn trước)
```

## 📁 Files Changed

### Core Files
1. `src/utils/overtimeErrorHandler.ts`
   - Cập nhật error message cho case 409
   - Ưu tiên hiển thị message từ backend

2. `src/app/employee/overtime-requests/page.tsx`
   - Thêm client-side validation
   - Thêm visual warning trong form
   - Cải thiện toast notifications

3. `src/app/admin/overtime-requests/page.tsx`
   - Thêm import `checkDuplicateOvertimeByDate`
   - Thêm client-side validation cho admin form
   - Thêm visual warning trong form
   - Cải thiện toast notifications

## 🚀 Deployment Notes

### Before Deployment
- ✅ Test tất cả scenarios với backend mới
- ✅ Verify message hiển thị đúng từ backend
- ✅ Test form validation (employee + admin)
- ✅ Test visual warnings

### After Deployment
- 📢 Thông báo cho users về thay đổi: "Chỉ được tạo 1 đơn overtime/ngày"
- 📋 Monitor error logs cho case 409
- 📊 Check user feedback về UX mới

## 🔗 Related Documentation
- Backend API: `Overtime_API.md`
- Error Codes: `OvertimeErrorCode` enum
- Types: `src/types/overtime.ts`

---

**Updated:** November 23, 2025
**Status:** ✅ Completed
**Impact:** Employee Page, Admin Page, Error Handler
