# Customer Contacts API Testing Checklist

## 📋 P1: CRUD Cơ bản

### ✅ POST /api/v1/customer-contacts
- [ ] Tạo contact mới với đầy đủ thông tin
- [ ] Test validation: thiếu `full_name` → 400
- [ ] Test validation: thiếu `phone` → 400  
- [ ] Test validation: thiếu `source` → 400
- [ ] Test validation: số điện thoại không hợp lệ → 400
- [ ] Test validation: giá trị enum không tồn tại (status="ABC") → 400
- [ ] Test logic: tạo contact với số điện thoại đã tồn tại → Success (cảnh báo nhưng vẫn cho tạo)
- [ ] Test với email không hợp lệ → 400

### ✅ GET /api/v1/customer-contacts
- [ ] Lấy danh sách contact không có filter
- [ ] Test filter: theo status (NEW, CONTACTED, INTERESTED, etc.)
- [ ] Test filter: theo source (WEBSITE, FACEBOOK, ZALO, etc.)
- [ ] Test search: theo fullName
- [ ] Test search: theo phone
- [ ] Test search: theo email
- [ ] Test pagination: page=0, size=10
- [ ] Test pagination: page=1, size=20
- [ ] Test sort: theo createdAt DESC
- [ ] Test sort: theo createdAt ASC
- [ ] Test combination: filter + search + pagination

### ✅ GET /api/v1/customer-contacts/{contactId}
- [ ] Lấy chi tiết contact hợp lệ
- [ ] Response phải bao gồm lịch sử tương tác (history/interactions)
- [ ] Test với contactId không tồn tại → 404
- [ ] Test với contactId format sai → 400

### ✅ PUT /api/v1/customer-contacts/{contactId}
- [ ] Cập nhật thông tin contact (fullName, phone, email)
- [ ] Cập nhật status
- [ ] Cập nhật source
- [ ] Test validation: tương tự như POST
- [ ] Test với contactId không tồn tại → 404
- [ ] Test authorization: Receptionist có quyền update

### ✅ DELETE /api/v1/customer-contacts/{contactId}
- [ ] Xóa mềm contact thành công với Admin token
- [ ] Test authorization: Receptionist gọi API → 403 Forbidden
- [ ] Test với contactId không tồn tại → 404
- [ ] Verify contact bị xóa mềm (status = DELETED hoặc deletedAt != null)

---

## 📋 P2: Lịch sử tương tác (Audit Trail)

### ✅ GET /api/v1/customer-contacts/{contactId}/history
- [ ] Lấy riêng lịch sử tương tác của contact
- [ ] Response trả về danh sách interactions (CALL, MESSAGE, NOTE)
- [ ] Test với contactId không tồn tại → 404
- [ ] Test pagination nếu có nhiều history

### ✅ POST /api/v1/customer-contacts/{contactId}/history
- [ ] Thêm tương tác mới type=CALL
- [ ] Thêm tương tác mới type=MESSAGE
- [ ] Thêm tương tác mới type=NOTE
- [ ] Test validation: thiếu type → 400
- [ ] Test validation: type không hợp lệ → 400
- [ ] Test với contactId không tồn tại → 404

---

## 📋 P3: Hành động nghiệp vụ

### ✅ POST /api/v1/customer-contacts/{contactId}/assign
- [ ] Test chế độ MANUAL: truyền employeeId của một Lễ tân → Success
- [ ] Test chế độ AUTO: không truyền employeeId → Hệ thống tự động gán cho Lễ tân có ít contact NEW nhất
- [ ] Test validation: employeeId không phải Lễ tân → 400
- [ ] Test validation: employeeId không tồn tại → 404
- [ ] Test với contactId không tồn tại → 404
- [ ] Verify contact.assignedTo được cập nhật đúng

### ✅ POST /api/v1/customer-contacts/{contactId}/convert
- [ ] Chuyển đổi contact NEW thành bệnh nhân (Patient) → Success
- [ ] Test với contact đã CONVERTED → 400 ALREADY_CONVERTED
- [ ] Test với contact status=NOT_INTERESTED → 400 ALREADY_CONVERTED hoặc CANNOT_CONVERT
- [ ] Test với contactId không tồn tại → 404
- [ ] Verify patient record được tạo mới
- [ ] Verify contact.status = CONVERTED
- [ ] Verify contact.patientId được set

---

## 📋 (Optional) Thống kê

### ✅ GET /api/v1/customer-contacts/stats
- [ ] Lấy các số liệu thống kê
- [ ] Response bao gồm: tổng contacts, phân bố theo status, phân bố theo source
- [ ] Test filter theo thời gian (startDate, endDate)

### ✅ GET /api/v1/customer-contacts/conversion-rate
- [ ] Lấy tỷ lệ chuyển đổi (converted / total)
- [ ] Response trả về percentage hoặc ratio
- [ ] Test filter theo thời gian

---

## ⚠️ Các kịch bản quan trọng cần kiểm tra

### 🔴 Lỗi Validation (400 Bad Request)
- [x] Tạo contact thiếu các trường bắt buộc (full_name, phone, source)
- [x] Tạo contact với số điện thoại không hợp lệ
- [x] Tạo contact với giá trị enum không tồn tại (ví dụ: status="ABC")

### 🔴 Phân quyền (Authorization)
- [x] Dùng token của Receptionist và thử gọi API DELETE (dự kiến lỗi 403 Forbidden)
- [ ] Kiểm tra các API khác xem có đúng vai trò được phép trong tài liệu không (Receptionist, Admin)

### 🔴 Logic nghiệp vụ đặc biệt
- [x] **Trùng số điện thoại**: Tạo một contact với số điện thoại đã tồn tại → API phải trả về thành công (cảnh báo nhưng vẫn cho tạo)
- [ ] **Gán contact (Assign)**:
  - [ ] Test chế độ manual: truyền employeeId của một Lễ tân
  - [ ] Test chế độ auto: không truyền employeeId, hệ thống phải tự động gán cho Lễ tân có ít contact NEW nhất
- [ ] **Chuyển đổi (Convert)**:
  - [ ] Thử convert một contact đã ở trạng thái CONVERTED → API phải trả về lỗi ALREADY_CONVERTED (400)
  - [ ] Thử convert một contact ở trạng thái NOT_INTERESTED → API phải trả về lỗi

---

## 📝 Ghi chú Testing

### Test Environment
- **Base URL**: `{API_BASE_URL}/api/v1`
- **Auth Token**: Lấy từ login response
- **Test Users**:
  - Admin: có full quyền
  - Receptionist: có quyền CRUD contact nhưng không có quyền DELETE

### Tools
- Postman / Thunder Client / REST Client
- Browser DevTools Network tab
- Application logs

### Expected HTTP Status Codes
- `200 OK`: Success for GET, PUT
- `201 Created`: Success for POST
- `204 No Content`: Success for DELETE
- `400 Bad Request`: Validation errors, business logic errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## ✅ Testing Progress

**P1 CRUD**: ⬜ 0/5 completed  
**P2 History**: ⬜ 0/2 completed  
**P3 Business**: ⬜ 0/2 completed  
**Optional Stats**: ⬜ 0/2 completed  

**Total**: ⬜ 0/11 API endpoints tested

---

## 🐛 Issues Found

| #  | API Endpoint | Issue | Status |
|----|--------------|-------|--------|
| 1  |              |       | ❌ Open |
| 2  |              |       | ✅ Fixed |

