# 📝 Cập Nhật Thông Báo Lỗi Thân Thiện Với Người Dùng

## 🎯 Mục Đích
Chuyển đổi các thông báo lỗi từ **tiếng Anh kỹ thuật** sang **tiếng Việt thân thiện** cho người dùng cuối (bệnh nhân, lễ tân).

---

## ✨ Các Thay Đổi

### 1. **Error Message - Không Tìm Thấy Khung Giờ Khả Dụng**

#### ❌ **Trước đây:**
```
❌ No available slots found for the selected date and services

Possible reasons:
• Doctor has no shifts scheduled on 2025-11-14
• All time slots are already booked
• No rooms configured to support the selected services ⚠️
• Services require facilities not available on this date

⚙️ Action Required: Admin needs to configure room-service mappings at /admin/booking/rooms

💡 Try: Select a different date or doctor

Debug: Check browser console (F12) for API request/response details
```

#### ✅ **Sau khi sửa:**
```
🔴 Không tìm thấy khung giờ khả dụng
   Không có lịch trống cho bác sĩ này vào ngày [date]

┌─────────────────────────────────────────┐
│ 💡 Gợi ý giải pháp:                     │
│                                          │
│ • Thử chọn ngày khác (bác sĩ có thể     │
│   chưa có lịch làm việc ngày này)       │
│ • Chọn bác sĩ khác cùng chuyên khoa     │
│ • Liên hệ lễ tân để được tư vấn lịch    │
│   hẹn phù hợp                            │
└─────────────────────────────────────────┘

▼ Chi tiết kỹ thuật (dành cho quản trị viên)
  [Có thể mở rộng để xem thông tin kỹ thuật]
```

**Đặc điểm:**
- ✅ Ngôn ngữ đơn giản, dễ hiểu
- ✅ Gợi ý cụ thể những gì người dùng nên làm
- ✅ Ẩn thông tin kỹ thuật vào `<details>` tag (chỉ hiện khi cần)
- ✅ Màu sắc phù hợp: xanh dương cho gợi ý, đỏ nhạt cho lỗi

---

### 2. **Toast Notification - Tải Thông Tin Lịch Trống**

#### ❌ **Trước:**
```javascript
toast.error('Failed to load available slots: ' + errorMsg);
```

#### ✅ **Sau:**
```javascript
toast.error('Không thể tải thông tin lịch trống. Vui lòng thử lại sau.');
```

---

### 3. **Validation - Thiếu Thông Tin Bắt Buộc**

#### ❌ **Trước:**
```javascript
toast.error('Please complete all required fields');
```

#### ✅ **Sau:**
```javascript
toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
```

---

### 4. **Validation - Phòng Không Tương Thích**

#### ❌ **Trước:**
```javascript
toast.error(
  `Room ${roomCode} is not compatible with the selected services. Please select a compatible room from the list.`,
  { duration: 5000 }
);
```

#### ✅ **Sau:**
```javascript
toast.error(
  `Phòng ${roomCode} không hỗ trợ dịch vụ đã chọn. Vui lòng chọn phòng khác từ danh sách.`,
  { duration: 5000 }
);
```

---

### 5. **Error 400 - Bad Request**

#### ❌ **Trước:**
```javascript
// Generic message
toast.error(`Validation Error: ${errorMessage}`, { duration: 5000 });
```

#### ✅ **Sau:**
```javascript
// Case 1: Room không hỗ trợ dịch vụ
if (errorMessage.includes('Room') && errorMessage.includes('does not support')) {
  toast.error('Phòng đã chọn không hỗ trợ dịch vụ này. Vui lòng chọn phòng khác.', { duration: 5000 });
}

// Case 2: Không có phòng nào khả dụng
else if (errorMessage.toLowerCase().includes('không có phòng') || errorMessage.toLowerCase().includes('no room')) {
  toast.error('Không có phòng phù hợp cho dịch vụ này. Vui lòng chọn ngày hoặc bác sĩ khác.', { duration: 5000 });
}

// Case 3: Lỗi khác
else {
  toast.error(`Thông tin không hợp lệ: ${errorMessage}`, { duration: 5000 });
}
```

---

### 6. **Error 409 - Conflict**

#### ❌ **Trước:**
```javascript
toast.error(
  `Conflict: ${errorMessage}. Please go back and select a different time slot or room.`,
  { duration: 7000 }
);
```

#### ✅ **Sau:**
```javascript
// Case 1: Khung giờ đã được đặt
if (errorMessage.toLowerCase().includes('taken') || errorMessage.toLowerCase().includes('đã được đặt')) {
  toast.error('Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.', { duration: 5000 });
}

// Case 2: Bác sĩ không đủ chuyên môn
else if (errorMessage.toLowerCase().includes('not qualified') || errorMessage.toLowerCase().includes('không đủ năng lực')) {
  toast.error('Bác sĩ không có chuyên môn phù hợp với dịch vụ này. Vui lòng chọn bác sĩ khác.', { duration: 5000 });
}

// Case 3: Xung đột khác
else {
  toast.error(`Xung đột lịch hẹn: ${errorMessage}`, { duration: 5000 });
}
```

---

### 7. **Error Generic (Network, Server, etc.)**

#### ❌ **Trước:**
```javascript
toast.error(`Failed to create appointment: ${errorMessage}`, { duration: 5000 });
```

#### ✅ **Sau:**
```javascript
toast.error('Không thể tạo lịch hẹn. Vui lòng thử lại sau.', { duration: 5000 });
```

---

### 8. **Success Message**

#### ❌ **Trước:**
```javascript
toast.success('Appointment created successfully!');
```

#### ✅ **Sau:**
```javascript
toast.success('✅ Đặt lịch hẹn thành công!');
```

---

## 🎨 Design Principles

### ✅ **DO:**
1. Sử dụng tiếng Việt đơn giản, dễ hiểu
2. Nêu rõ **nguyên nhân** và **cách khắc phục**
3. Giấu thông tin kỹ thuật cho admin/developer (dùng `<details>`)
4. Sử dụng icon và màu sắc phù hợp
5. Độ dài thông báo vừa phải (không quá dài)

### ❌ **DON'T:**
1. Hiển thị error stack trace cho người dùng
2. Sử dụng thuật ngữ kỹ thuật (API, endpoint, status code...)
3. Để thông báo bằng tiếng Anh trong UI production
4. Toast notification quá dài (> 2 dòng)

---

## 📊 Impact

### **Trước khi cập nhật:**
- ❌ Người dùng không hiểu lỗi
- ❌ Phải hỏi admin/IT support
- ❌ Trải nghiệm người dùng kém

### **Sau khi cập nhật:**
- ✅ Người dùng tự giải quyết được (chọn ngày/bác sĩ khác)
- ✅ Giảm support tickets
- ✅ UX chuyên nghiệp hơn
- ✅ Admin vẫn có thông tin kỹ thuật (ẩn trong details)

---

## 🔧 Technical Details

### File Changed:
- `src/components/appointments/CreateAppointmentModal.tsx`

### Lines Modified:
1. **Line ~264**: Added `loadSlotsError` state
2. **Line ~745-785**: Updated `loadAvailableSlots` error handling
3. **Line ~1010-1020**: Updated validation messages
4. **Line ~1070**: Updated success message
5. **Line ~1085-1115**: Enhanced error categorization for 400/409 errors
6. **Line ~1840-1890**: Redesigned error display UI with collapsible details

### No Breaking Changes:
- ✅ All functionality remains the same
- ✅ Only UI/UX improvements
- ✅ No API changes required
- ✅ TypeScript compilation: 0 errors

---

## ✅ Testing Checklist

- [x] Error message hiển thị tiếng Việt
- [x] Details section có thể mở/đóng
- [x] Toast notifications ngắn gọn, rõ ràng
- [x] Icon và màu sắc phù hợp
- [x] Responsive trên mobile
- [x] No TypeScript errors
- [x] Console logs vẫn hiển thị đầy đủ cho developer

---

## 📝 Notes

- **Backend message vẫn giữ nguyên** - không yêu cầu BE thay đổi API
- **Console logs giữ nguyên** - developer vẫn có đủ thông tin debug
- **Có thể extend** - dễ dàng thêm case mới cho error messages khác
