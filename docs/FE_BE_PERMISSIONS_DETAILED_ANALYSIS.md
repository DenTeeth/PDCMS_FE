# BÁO CÁO PHÂN TÍCH CHI TIẾT PERMISSIONS THEO TỪNG MODULE

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Phân tích chi tiết permissions của từng module BE và so sánh với FE

---

## 📦 MODULE 1: WAREHOUSE

### ✅ Trả lời câu hỏi về Warehouse

**Câu hỏi:** "Warehouse đang sử dụng được (không cần chỉnh sửa thêm), có phải là chỉ nhân viên có quyền và admin được thao tác trong warehouse đúng không?"

**Trả lời:** ✅ **ĐÚNG!** Warehouse đang hoạt động tốt với phân quyền như sau:

#### Phân quyền Warehouse theo Role (từ seed data):

1. **ROLE_ADMIN**: 
   - ✅ Tất cả permissions (tự động có tất cả)

2. **ROLE_INVENTORY_MANAGER** (Quản lý kho):
   - ✅ `VIEW_WAREHOUSE` - Xem kho
   - ✅ `VIEW_ITEMS` - Xem vật tư
   - ✅ `VIEW_MEDICINES` - Xem thuốc
   - ✅ `MANAGE_WAREHOUSE` - Quản lý kho (CRUD)
   - ✅ `MANAGE_SUPPLIERS` - Quản lý nhà cung cấp
   - ✅ `IMPORT_ITEMS` - Nhập kho
   - ✅ `EXPORT_ITEMS` - Xuất kho
   - ✅ `DISPOSE_ITEMS` - Thanh lý
   - ✅ `APPROVE_TRANSACTION` - Duyệt giao dịch
   - ❌ **KHÔNG có** `VIEW_WAREHOUSE_COST` (không xem được giá)

3. **ROLE_MANAGER** (Quản lý):
   - ✅ `VIEW_WAREHOUSE` - Xem kho
   - ✅ `VIEW_WAREHOUSE_COST` - Xem giá kho (quan trọng!)
   - ✅ `VIEW_ITEMS` - Xem vật tư
   - ✅ `MANAGE_WAREHOUSE` - Quản lý kho
   - ✅ `MANAGE_SUPPLIERS` - Quản lý nhà cung cấp
   - ✅ `IMPORT_ITEMS` - Nhập kho
   - ✅ `EXPORT_ITEMS` - Xuất kho
   - ✅ `APPROVE_TRANSACTION` - Duyệt giao dịch

4. **ROLE_ACCOUNTANT** (Kế toán):
   - ✅ `VIEW_WAREHOUSE` - Xem kho (read-only)
   - ✅ `VIEW_WAREHOUSE_COST` - Xem giá kho (quan trọng cho kế toán!)
   - ❌ Chỉ xem, không được thao tác

5. **ROLE_RECEPTIONIST** (Lễ tân):
   - ✅ `VIEW_WAREHOUSE` - Xem kho (read-only)
   - ✅ `VIEW_ITEMS` - Xem vật tư
   - ❌ Chỉ xem, không được thao tác

6. **ROLE_DENTIST** (Bác sĩ):
   - ✅ `VIEW_ITEMS` - Xem vật tư (cho điều trị)
   - ✅ `VIEW_MEDICINES` - Xem thuốc (cho kê đơn)
   - ❌ Chỉ xem, không được thao tác kho

7. **ROLE_NURSE** (Y tá):
   - ❌ Không có quyền warehouse

**Kết luận:** Warehouse đang hoạt động đúng với phân quyền:
- ✅ Admin: Toàn quyền
- ✅ Inventory Manager: Quản lý kho (không xem giá)
- ✅ Manager: Quản lý kho + xem giá
- ✅ Accountant: Chỉ xem (có giá)
- ✅ Receptionist, Dentist: Chỉ xem (không có giá)
- ✅ Nurse: Không có quyền

---

### Permissions được sử dụng trong Warehouse Controllers

#### 1. InventoryController
- `VIEW_WAREHOUSE` - Xem danh sách, chi tiết, stats, batches, categories
- `MANAGE_WAREHOUSE` - Tạo/sửa/xóa item master, categories
- `IMPORT_ITEMS` - Tạo phiếu nhập
- `EXPORT_ITEMS`, `DISPOSE_ITEMS` - Tạo phiếu xuất

#### 2. ItemMasterController
- `VIEW_ITEMS`, `VIEW_WAREHOUSE`, `MANAGE_WAREHOUSE` - Xem items
- `CREATE_ITEMS`, `MANAGE_WAREHOUSE` - Tạo item
- `UPDATE_ITEMS`, `MANAGE_WAREHOUSE` - Cập nhật item

#### 3. WarehouseV3Controller
- `IMPORT_ITEMS` - Tạo phiếu nhập

#### 4. TransactionHistoryController
- `VIEW_WAREHOUSE` - Xem lịch sử giao dịch
- `APPROVE_TRANSACTION` - Duyệt/từ chối phiếu
- `UPDATE_WAREHOUSE` hoặc `CANCEL_WAREHOUSE` - Hủy phiếu

#### 5. SupplierController
- `VIEW_WAREHOUSE` - Xem nhà cung cấp
- `MANAGE_SUPPLIERS`, `MANAGE_WAREHOUSE` - Quản lý nhà cung cấp

#### 6. ServiceConsumableController
- `VIEW_WAREHOUSE`, `VIEW_SERVICE` - Xem consumables
- `MANAGE_WAREHOUSE` - Quản lý consumables

---

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_WAREHOUSE` | Xem danh sách giao dịch kho | WAREHOUSE | ✅ Có |
| `VIEW_ITEMS` | Xem danh sách vật tư (cho Bác sĩ/Lễ tân) | WAREHOUSE | ❌ **THIẾU** |
| `VIEW_MEDICINES` | Xem và tìm kiếm thuốc men (cho Bác sĩ kê đơn) | WAREHOUSE | ❌ **THIẾU** |
| `VIEW_WAREHOUSE_COST` | Xem giá tiền kho (Admin/Kế toán) | WAREHOUSE | ❌ **THIẾU** |
| `MANAGE_WAREHOUSE` | Quản lý danh mục, nhà cung cấp, vật tư | WAREHOUSE | ✅ Có |
| `MANAGE_SUPPLIERS` | Quản lý nhà cung cấp | WAREHOUSE | ❌ **THIẾU** |
| `IMPORT_ITEMS` | Tạo phiếu nhập kho | WAREHOUSE | ❌ **THIẾU** |
| `EXPORT_ITEMS` | Tạo phiếu xuất kho | WAREHOUSE | ❌ **THIẾU** |
| `DISPOSE_ITEMS` | Tạo phiếu thanh lý | WAREHOUSE | ❌ **THIẾU** |
| `APPROVE_TRANSACTION` | Duyệt/Từ chối phiếu nhập xuất kho | WAREHOUSE | ❌ **THIẾU** |

**Lưu ý:** FE có `CREATE_WAREHOUSE`, `UPDATE_WAREHOUSE`, `DELETE_WAREHOUSE` nhưng BE không có các permissions này. BE dùng `MANAGE_WAREHOUSE` để cover tất cả CRUD operations.

**Vấn đề:** 
- BE có `CANCEL_WAREHOUSE` được dùng trong TransactionHistoryController nhưng không có trong seed data
- Controller dùng `UPDATE_WAREHOUSE` hoặc `CANCEL_WAREHOUSE` nhưng seed data không có `UPDATE_WAREHOUSE`

---

### Permissions cần bổ sung vào FE (Warehouse)

```typescript
// Cần thêm vào src/types/permission.ts
VIEW_ITEMS = 'VIEW_ITEMS',
VIEW_MEDICINES = 'VIEW_MEDICINES',
VIEW_WAREHOUSE_COST = 'VIEW_WAREHOUSE_COST',
MANAGE_SUPPLIERS = 'MANAGE_SUPPLIERS',
IMPORT_ITEMS = 'IMPORT_ITEMS',
EXPORT_ITEMS = 'EXPORT_ITEMS',
DISPOSE_ITEMS = 'DISPOSE_ITEMS',
APPROVE_TRANSACTION = 'APPROVE_TRANSACTION',
CANCEL_WAREHOUSE = 'CANCEL_WAREHOUSE', // Nếu BE thêm vào seed data
```

**Độ ưu tiên:** 🔴 **CAO** - Warehouse đang hoạt động nhưng thiếu permissions chi tiết, có thể gây lỗi khi BE enforce permissions chặt chẽ hơn.

---

## 🏥 MODULE 2: CLINICAL_RECORDS

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `WRITE_CLINICAL_RECORD` | Tạo và cập nhật bệnh án, thêm thủ thuật | CLINICAL_RECORDS | ❌ **THIẾU** |
| `UPLOAD_ATTACHMENT` | Upload file đính kèm vào bệnh án (X-quang, ảnh, PDF) | CLINICAL_RECORDS | ❌ **THIẾU** |
| `VIEW_ATTACHMENT` | Xem danh sách file đính kèm của bệnh án | CLINICAL_RECORDS | ❌ **THIẾU** |
| `DELETE_ATTACHMENT` | Xóa file đính kèm (chỉ Admin hoặc người upload) | CLINICAL_RECORDS | ❌ **THIẾU** |
| `VIEW_VITAL_SIGNS_REFERENCE` | Xem bảng tham chiếu chỉ số sinh tồn theo độ tuổi | CLINICAL_RECORDS | ❌ **THIẾU** |

**Độ ưu tiên:** 🔴 **CAO** - Module quan trọng cho bác sĩ, hoàn toàn thiếu trong FE.

---

## 📸 MODULE 3: PATIENT_IMAGES

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `PATIENT_IMAGE_CREATE` | Tạo hình ảnh bệnh nhân (Upload metadata) | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_READ` | Xem hình ảnh bệnh nhân | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_UPDATE` | Cập nhật metadata hình ảnh | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_DELETE` | Xóa hình ảnh bệnh nhân | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_COMMENT_CREATE` | Thêm nhận xét vào hình ảnh | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_COMMENT_READ` | Xem nhận xét trên hình ảnh | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_COMMENT_UPDATE` | Cập nhật nhận xét của mình | PATIENT_IMAGES | ❌ **THIẾU** |
| `PATIENT_IMAGE_COMMENT_DELETE` | Xóa nhận xét của mình | PATIENT_IMAGES | ❌ **THIẾU** |

**Độ ưu tiên:** 🔴 **CAO** - Module quan trọng cho bác sĩ, hoàn toàn thiếu trong FE.

---

## 📋 MODULE 4: TREATMENT_PLANS

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_TREATMENT_PLAN_ALL` | Xem TẤT CẢ phác đồ điều trị (Bác sĩ/Lễ tân) | TREATMENT_PLAN | ✅ Có |
| `VIEW_ALL_TREATMENT_PLANS` | Xem danh sách lộ trình toàn hệ thống (Manager) | TREATMENT_PLAN | ✅ Có |
| `VIEW_TREATMENT_PLAN_OWN` | Chỉ xem phác đồ điều trị của bản thân (Bệnh nhân) | TREATMENT_PLAN | ✅ Có |
| `CREATE_TREATMENT_PLAN` | Tạo phác đồ điều trị mới | TREATMENT_PLAN | ✅ Có |
| `UPDATE_TREATMENT_PLAN` | Cập nhật phác đồ điều trị | TREATMENT_PLAN | ✅ Có |
| `DELETE_TREATMENT_PLAN` | Vô hiệu hóa phác đồ (soft delete) | TREATMENT_PLAN | ✅ Có |
| `APPROVE_TREATMENT_PLAN` | Duyệt/Từ chối lộ trình điều trị | TREATMENT_PLAN | ✅ Có |
| `MANAGE_PLAN_PRICING` | Điều chỉnh giá/chiết khấu phác đồ điều trị | TREATMENT_PLAN | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 📅 MODULE 5: BOOKING/APPOINTMENT

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_APPOINTMENT` | Xem danh sách lịch hẹn (deprecated) | APPOINTMENT | ✅ Có |
| `VIEW_APPOINTMENT_ALL` | Xem TẤT CẢ lịch hẹn (Lễ tân/Quản lý) | APPOINTMENT | ✅ Có |
| `VIEW_APPOINTMENT_OWN` | Chỉ xem lịch hẹn LIÊN QUAN (Bác sĩ/Y tá) | APPOINTMENT | ✅ Có |
| `CREATE_APPOINTMENT` | Đặt lịch hẹn mới | APPOINTMENT | ✅ Có |
| `UPDATE_APPOINTMENT` | Cập nhật lịch hẹn | APPOINTMENT | ✅ Có |
| `UPDATE_APPOINTMENT_STATUS` | Cập nhật trạng thái lịch hẹn | APPOINTMENT | ✅ Có |
| `DELAY_APPOINTMENT` | Hoãn lịch hẹn sang thời gian khác | APPOINTMENT | ✅ Có |
| `CANCEL_APPOINTMENT` | Hủy lịch hẹn | APPOINTMENT | ✅ Có |
| `DELETE_APPOINTMENT` | Xóa lịch hẹn | APPOINTMENT | ✅ Có |
| `RESCHEDULE_APPOINTMENT` | Hủy và đặt lại lịch hẹn | APPOINTMENT | ❌ **THIẾU** (nhưng có thể dùng CANCEL + CREATE) |

**Độ ưu tiên:** 🟡 **TRUNG BÌNH** - Hầu hết đều có, chỉ thiếu `RESCHEDULE_APPOINTMENT` (có thể không cần thiết nếu dùng CANCEL + CREATE).

---

## 👥 MODULE 6: EMPLOYEE

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_EMPLOYEE` | Xem danh sách nhân viên | EMPLOYEE | ✅ Có |
| `READ_ALL_EMPLOYEES` | Đọc tất cả thông tin nhân viên | EMPLOYEE | ✅ Có |
| `READ_EMPLOYEE_BY_CODE` | Đọc thông tin nhân viên theo mã | EMPLOYEE | ✅ Có |
| `CREATE_EMPLOYEE` | Tạo nhân viên mới | EMPLOYEE | ✅ Có |
| `UPDATE_EMPLOYEE` | Cập nhật thông tin nhân viên | EMPLOYEE | ✅ Có |
| `DELETE_EMPLOYEE` | Xóa nhân viên | EMPLOYEE | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 🏥 MODULE 7: PATIENT

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_PATIENT` | Xem danh sách bệnh nhân | PATIENT | ✅ Có |
| `CREATE_PATIENT` | Tạo hồ sơ bệnh nhân mới | PATIENT | ✅ Có |
| `UPDATE_PATIENT` | Cập nhật hồ sơ bệnh nhân | PATIENT | ✅ Có |
| `DELETE_PATIENT` | Xóa hồ sơ bệnh nhân | PATIENT | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 💊 MODULE 8: TREATMENT

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_TREATMENT` | Xem danh sách điều trị | TREATMENT | ✅ Có |
| `CREATE_TREATMENT` | Tạo phác đồ điều trị mới | TREATMENT | ✅ Có |
| `UPDATE_TREATMENT` | Cập nhật phác đồ điều trị | TREATMENT | ✅ Có |
| `ASSIGN_DOCTOR_TO_ITEM` | Gán bác sĩ cho hạng mục điều trị | TREATMENT | ❌ **THIẾU** |

**Độ ưu tiên:** 🟡 **TRUNG BÌNH** - Thiếu `ASSIGN_DOCTOR_TO_ITEM` nhưng có thể không cần thiết nếu dùng `UPDATE_TREATMENT`.

---

## 📞 MODULE 9: CUSTOMER_MANAGEMENT (CONTACT + CONTACT_HISTORY)

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_CONTACT` | Xem danh sách liên hệ khách hàng | CUSTOMER_MANAGEMENT | ✅ Có |
| `CREATE_CONTACT` | Tạo liên hệ khách hàng mới | CUSTOMER_MANAGEMENT | ✅ Có |
| `UPDATE_CONTACT` | Cập nhật liên hệ khách hàng | CUSTOMER_MANAGEMENT | ✅ Có |
| `DELETE_CONTACT` | Xóa liên hệ khách hàng | CUSTOMER_MANAGEMENT | ✅ Có |
| `VIEW_CONTACT_HISTORY` | Xem lịch sử liên hệ | CUSTOMER_MANAGEMENT | ✅ Có |
| `CREATE_CONTACT_HISTORY` | Tạo lịch sử liên hệ | CUSTOMER_MANAGEMENT | ✅ Có |
| `UPDATE_CONTACT_HISTORY` | Cập nhật lịch sử liên hệ | CUSTOMER_MANAGEMENT | ✅ Có |
| `DELETE_CONTACT_HISTORY` | Xóa lịch sử liên hệ | CUSTOMER_MANAGEMENT | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 📅 MODULE 10: SCHEDULE_MANAGEMENT (WORK_SHIFTS + REGISTRATION + SHIFT_RENEWAL)

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_WORK_SHIFTS` | Xem danh sách mẫu ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `CREATE_WORK_SHIFTS` | Tạo mẫu ca làm việc mới | SCHEDULE_MANAGEMENT | ✅ Có |
| `UPDATE_WORK_SHIFTS` | Cập nhật mẫu ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `DELETE_WORK_SHIFTS` | Xóa mẫu ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `MANAGE_WORK_SLOTS` | Quản lý suất part-time (tạo/sửa/xóa) | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_AVAILABLE_SLOTS` | Xem suất part-time khả dụng | SCHEDULE_MANAGEMENT | ✅ Có |
| `MANAGE_PART_TIME_REGISTRATIONS` | Duyệt/từ chối đăng ký part-time | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_REGISTRATION_ALL` | Xem tất cả đăng ký ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_REGISTRATION_OWN` | Xem đăng ký ca làm việc của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `CREATE_REGISTRATION` | Tạo đăng ký ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `UPDATE_REGISTRATION` | Cập nhật đăng ký ca | SCHEDULE_MANAGEMENT | ⚠️ **TÊN KHÁC** (FE có `UPDATE_REGISTRATION_ALL`, `UPDATE_REGISTRATION_OWN`) |
| `UPDATE_REGISTRATIONS_ALL` | Cập nhật tất cả đăng ký ca | SCHEDULE_MANAGEMENT | ⚠️ **TÊN KHÁC** (FE có `UPDATE_REGISTRATION_ALL`) |
| `UPDATE_REGISTRATION_OWN` | Cập nhật đăng ký ca của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `CANCEL_REGISTRATION_OWN` | Hủy đăng ký ca của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `DELETE_REGISTRATION` | Xóa đăng ký ca | SCHEDULE_MANAGEMENT | ⚠️ **TÊN KHÁC** (FE có `DELETE_REGISTRATION_ALL`, `DELETE_REGISTRATION_OWN`) |
| `DELETE_REGISTRATION_ALL` | Xóa tất cả đăng ký ca | SCHEDULE_MANAGEMENT | ✅ Có |
| `DELETE_REGISTRATION_OWN` | Xóa đăng ký ca của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_RENEWAL_OWN` | Xem yêu cầu gia hạn ca của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `RESPOND_RENEWAL_OWN` | Phản hồi yêu cầu gia hạn ca của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_SHIFTS_ALL` | Xem tất cả ca làm việc nhân viên | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_SHIFTS_OWN` | Xem ca làm việc của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_SHIFTS_SUMMARY` | Xem thống kê ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `CREATE_SHIFTS` | Tạo ca làm việc thủ công | SCHEDULE_MANAGEMENT | ✅ Có |
| `UPDATE_SHIFTS` | Cập nhật ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `DELETE_SHIFTS` | Hủy ca làm việc | SCHEDULE_MANAGEMENT | ✅ Có |
| `MANAGE_FIXED_REGISTRATIONS` | Quản lý đăng ký ca cố định (tạo/sửa/xóa) | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_FIXED_REGISTRATIONS_ALL` | Xem tất cả đăng ký ca cố định | SCHEDULE_MANAGEMENT | ✅ Có |
| `VIEW_FIXED_REGISTRATIONS_OWN` | Xem đăng ký ca cố định của bản thân | SCHEDULE_MANAGEMENT | ✅ Có |

**Vấn đề:**
- BE có `UPDATE_REGISTRATION` (không có suffix) nhưng FE có `UPDATE_REGISTRATION_ALL` và `UPDATE_REGISTRATION_OWN`
- BE có `UPDATE_REGISTRATIONS_ALL` (có 'S') nhưng FE có `UPDATE_REGISTRATION_ALL` (không có 'S')
- BE có `DELETE_REGISTRATION` (không có suffix) nhưng FE có `DELETE_REGISTRATION_ALL` và `DELETE_REGISTRATION_OWN`

**Độ ưu tiên:** 🟡 **TRUNG BÌNH** - Cần chuẩn hóa tên permissions.

---

## 🏖️ MODULE 11: LEAVE_MANAGEMENT (TIME_OFF + OVERTIME + LEAVE_BALANCE)

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_LEAVE_ALL` | Xem tất cả yêu cầu nghỉ phép & tăng ca | LEAVE_MANAGEMENT | ✅ Có |
| `VIEW_LEAVE_OWN` | Xem yêu cầu nghỉ phép & tăng ca của bản thân | LEAVE_MANAGEMENT | ✅ Có |
| `VIEW_TIMEOFF_ALL` | Xem tất cả yêu cầu nghỉ phép (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `VIEW_TIMEOFF_OWN` | Xem yêu cầu nghỉ phép của bản thân (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `VIEW_OT_ALL` | Xem tất cả yêu cầu tăng ca (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `VIEW_OT_OWN` | Xem yêu cầu tăng ca của bản thân (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `CREATE_OT` | Tạo yêu cầu tăng ca (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `APPROVE_OT` | Phê duyệt yêu cầu tăng ca (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `REJECT_OT` | Từ chối yêu cầu tăng ca (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `CANCEL_OT_OWN` | Hủy yêu cầu tăng ca của bản thân (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `CANCEL_OT_PENDING` | Hủy yêu cầu tăng ca đang chờ (alias) | LEAVE_MANAGEMENT | ✅ Có (deprecated) |
| `CREATE_TIME_OFF` | Tạo yêu cầu nghỉ phép | LEAVE_MANAGEMENT | ✅ Có |
| `CREATE_TIMEOFF` | Tạo yêu cầu nghỉ phép (alias) | LEAVE_MANAGEMENT | ✅ Có |
| `APPROVE_TIME_OFF` | Phê duyệt yêu cầu nghỉ phép | LEAVE_MANAGEMENT | ✅ Có |
| `APPROVE_TIMEOFF` | Phê duyệt yêu cầu nghỉ phép (alias) | LEAVE_MANAGEMENT | ✅ Có |
| `REJECT_TIME_OFF` | Từ chối yêu cầu nghỉ phép | LEAVE_MANAGEMENT | ✅ Có |
| `REJECT_TIMEOFF` | Từ chối yêu cầu nghỉ phép (alias) | LEAVE_MANAGEMENT | ✅ Có |
| `CANCEL_TIME_OFF_OWN` | Hủy yêu cầu nghỉ phép của bản thân | LEAVE_MANAGEMENT | ✅ Có |
| `CANCEL_TIMEOFF_OWN` | Hủy yêu cầu nghỉ phép của bản thân (alias) | LEAVE_MANAGEMENT | ✅ Có |
| `CANCEL_TIME_OFF_PENDING` | Hủy yêu cầu nghỉ phép đang chờ | LEAVE_MANAGEMENT | ✅ Có |
| `CANCEL_TIMEOFF_PENDING` | Hủy yêu cầu nghỉ phép đang chờ (alias) | LEAVE_MANAGEMENT | ✅ Có |
| `CREATE_OVERTIME` | Tạo yêu cầu tăng ca | LEAVE_MANAGEMENT | ✅ Có |
| `APPROVE_OVERTIME` | Phê duyệt yêu cầu tăng ca | LEAVE_MANAGEMENT | ✅ Có |
| `REJECT_OVERTIME` | Từ chối yêu cầu tăng ca | LEAVE_MANAGEMENT | ✅ Có |
| `CANCEL_OVERTIME_OWN` | Hủy yêu cầu tăng ca của bản thân | LEAVE_MANAGEMENT | ✅ Có |
| `CANCEL_OVERTIME_PENDING` | Hủy yêu cầu tăng ca đang chờ | LEAVE_MANAGEMENT | ✅ Có |
| `VIEW_TIMEOFF_TYPE` | Xem danh sách loại nghỉ phép | LEAVE_MANAGEMENT | ⚠️ **TÊN KHÁC** (FE có `VIEW_LEAVE_TYPE`) |
| `VIEW_TIMEOFF_TYPE_ALL` | Xem/Quản lý tất cả loại nghỉ phép (alias) | LEAVE_MANAGEMENT | ⚠️ **TÊN KHÁC** |
| `CREATE_TIMEOFF_TYPE` | Tạo loại nghỉ phép mới | LEAVE_MANAGEMENT | ⚠️ **CONSOLIDATED** (FE có `MANAGE_LEAVE_TYPE`) |
| `UPDATE_TIMEOFF_TYPE` | Cập nhật loại nghỉ phép | LEAVE_MANAGEMENT | ⚠️ **CONSOLIDATED** (FE có `MANAGE_LEAVE_TYPE`) |
| `DELETE_TIMEOFF_TYPE` | Xóa loại nghỉ phép | LEAVE_MANAGEMENT | ⚠️ **CONSOLIDATED** (FE có `MANAGE_LEAVE_TYPE`) |
| `VIEW_LEAVE_BALANCE_ALL` | Xem số dư nghỉ phép của nhân viên | LEAVE_MANAGEMENT | ⚠️ **TÊN KHÁC** (FE có `VIEW_LEAVE_BALANCE`) |
| `ADJUST_LEAVE_BALANCE` | Điều chỉnh số dư nghỉ phép | LEAVE_MANAGEMENT | ✅ Có |

**Vấn đề:**
- BE có `VIEW_TIMEOFF_TYPE` nhưng FE có `VIEW_LEAVE_TYPE`
- BE có các permissions riêng (`CREATE_TIMEOFF_TYPE`, `UPDATE_TIMEOFF_TYPE`, `DELETE_TIMEOFF_TYPE`) nhưng FE đã consolidate thành `MANAGE_LEAVE_TYPE`
- BE có `VIEW_LEAVE_BALANCE_ALL` nhưng FE chỉ có `VIEW_LEAVE_BALANCE`

**Độ ưu tiên:** 🟡 **TRUNG BÌNH** - Cần chuẩn hóa tên permissions.

---

## 🎉 MODULE 12: HOLIDAY

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_HOLIDAY` | Xem danh sách ngày nghỉ lễ | HOLIDAY | ✅ Có |
| `CREATE_HOLIDAY` | Tạo ngày nghỉ lễ mới | HOLIDAY | ✅ Có |
| `UPDATE_HOLIDAY` | Cập nhật ngày nghỉ lễ | HOLIDAY | ✅ Có |
| `DELETE_HOLIDAY` | Xóa ngày nghỉ lễ | HOLIDAY | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 🏢 MODULE 13: ROOM_MANAGEMENT

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_ROOM` | Xem danh sách và chi tiết phòng | ROOM_MANAGEMENT | ✅ Có |
| `CREATE_ROOM` | Tạo phòng/ghế mới | ROOM_MANAGEMENT | ✅ Có |
| `UPDATE_ROOM` | Cập nhật thông tin phòng | ROOM_MANAGEMENT | ✅ Có |
| `DELETE_ROOM` | Vô hiệu hóa phòng (soft delete) | ROOM_MANAGEMENT | ✅ Có |
| `UPDATE_ROOM_SERVICES` | Gán/cập nhật dịch vụ cho phòng | ROOM_MANAGEMENT | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 🦷 MODULE 14: SERVICE_MANAGEMENT

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_SERVICE` | Xem danh sách và chi tiết dịch vụ | SERVICE_MANAGEMENT | ✅ Có |
| `CREATE_SERVICE` | Tạo dịch vụ mới | SERVICE_MANAGEMENT | ✅ Có |
| `UPDATE_SERVICE` | Cập nhật thông tin dịch vụ | SERVICE_MANAGEMENT | ✅ Có |
| `DELETE_SERVICE` | Vô hiệu hóa dịch vụ (soft delete) | SERVICE_MANAGEMENT | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## ⚙️ MODULE 15: SYSTEM_CONFIGURATION (ROLE + PERMISSION + SPECIALIZATION)

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_ROLE` | Xem danh sách vai trò | SYSTEM_CONFIGURATION | ✅ Có |
| `CREATE_ROLE` | Tạo vai trò mới | SYSTEM_CONFIGURATION | ✅ Có |
| `UPDATE_ROLE` | Cập nhật vai trò | SYSTEM_CONFIGURATION | ✅ Có |
| `DELETE_ROLE` | Xóa vai trò | SYSTEM_CONFIGURATION | ✅ Có |
| `VIEW_PERMISSION` | Xem danh sách quyền | SYSTEM_CONFIGURATION | ✅ Có |
| `CREATE_PERMISSION` | Tạo quyền mới | SYSTEM_CONFIGURATION | ✅ Có |
| `UPDATE_PERMISSION` | Cập nhật quyền | SYSTEM_CONFIGURATION | ✅ Có |
| `DELETE_PERMISSION` | Xóa quyền | SYSTEM_CONFIGURATION | ✅ Có |
| `VIEW_SPECIALIZATION` | Xem danh sách chuyên khoa | SYSTEM_CONFIGURATION | ✅ Có |
| `CREATE_SPECIALIZATION` | Tạo chuyên khoa mới | SYSTEM_CONFIGURATION | ✅ Có |
| `UPDATE_SPECIALIZATION` | Cập nhật chuyên khoa | SYSTEM_CONFIGURATION | ✅ Có |
| `DELETE_SPECIALIZATION` | Xóa chuyên khoa | SYSTEM_CONFIGURATION | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 🔔 MODULE 16: NOTIFICATION

### Permissions trong Seed Data (BE)

| Permission ID | Description | Module | Status trong FE |
|--------------|-------------|--------|----------------|
| `VIEW_NOTIFICATION` | Xem thông báo của bản thân | NOTIFICATION | ✅ Có |
| `DELETE_NOTIFICATION` | Xóa thông báo của bản thân | NOTIFICATION | ✅ Có |
| `MANAGE_NOTIFICATION` | Toàn quyền quản lý thông báo (Admin/System) | NOTIFICATION | ✅ Có |

**Độ ưu tiên:** ✅ **OK** - Tất cả permissions đều có trong FE.

---

## 📊 TỔNG KẾT

### Permissions thiếu trong FE (Ưu tiên cao)

1. **WAREHOUSE Module** (9 permissions):
   - `VIEW_ITEMS`
   - `VIEW_MEDICINES`
   - `VIEW_WAREHOUSE_COST`
   - `MANAGE_SUPPLIERS`
   - `IMPORT_ITEMS`
   - `EXPORT_ITEMS`
   - `DISPOSE_ITEMS`
   - `APPROVE_TRANSACTION`
   - `CANCEL_WAREHOUSE` (nếu BE thêm vào seed data)

2. **CLINICAL_RECORDS Module** (5 permissions):
   - `WRITE_CLINICAL_RECORD`
   - `UPLOAD_ATTACHMENT`
   - `VIEW_ATTACHMENT`
   - `DELETE_ATTACHMENT`
   - `VIEW_VITAL_SIGNS_REFERENCE`

3. **PATIENT_IMAGES Module** (8 permissions):
   - `PATIENT_IMAGE_CREATE`
   - `PATIENT_IMAGE_READ`
   - `PATIENT_IMAGE_UPDATE`
   - `PATIENT_IMAGE_DELETE`
   - `PATIENT_IMAGE_COMMENT_CREATE`
   - `PATIENT_IMAGE_COMMENT_READ`
   - `PATIENT_IMAGE_COMMENT_UPDATE`
   - `PATIENT_IMAGE_COMMENT_DELETE`

**Tổng cộng:** 22 permissions thiếu (ưu tiên cao)

---

### Permissions cần chuẩn hóa tên (Ưu tiên trung bình)

1. **LEAVE_MANAGEMENT:**
   - BE: `VIEW_TIMEOFF_TYPE` → FE: `VIEW_LEAVE_TYPE`
   - BE: `VIEW_LEAVE_BALANCE_ALL` → FE: `VIEW_LEAVE_BALANCE`
   - BE: `CREATE_TIMEOFF_TYPE`, `UPDATE_TIMEOFF_TYPE`, `DELETE_TIMEOFF_TYPE` → FE: `MANAGE_LEAVE_TYPE` (consolidated)

2. **SCHEDULE_MANAGEMENT:**
   - BE: `UPDATE_REGISTRATION` → FE: `UPDATE_REGISTRATION_ALL`, `UPDATE_REGISTRATION_OWN`
   - BE: `UPDATE_REGISTRATIONS_ALL` → FE: `UPDATE_REGISTRATION_ALL` (khác 'S')
   - BE: `DELETE_REGISTRATION` → FE: `DELETE_REGISTRATION_ALL`, `DELETE_REGISTRATION_OWN`

3. **TREATMENT:**
   - BE: `ASSIGN_DOCTOR_TO_ITEM` → FE: Thiếu (có thể dùng `UPDATE_TREATMENT`)

---

### Permissions đặc thù (Cần xác nhận với BE)

1. `RESCHEDULE_APPOINTMENT` - Có thể không cần thiết nếu dùng `CANCEL_APPOINTMENT` + `CREATE_APPOINTMENT`
2. `ASSIGN_DOCTOR_TO_ITEM` - Có thể không cần thiết nếu dùng `UPDATE_TREATMENT`
3. `CANCEL_WAREHOUSE` - Được dùng trong controller nhưng không có trong seed data

---

## 📋 CHECKLIST SỬA CHỮA

### Phase 1: Bổ sung Permissions thiếu (Ưu tiên cao) - 22 permissions

- [ ] **WAREHOUSE (9 permissions):**
  - [ ] `VIEW_ITEMS`
  - [ ] `VIEW_MEDICINES`
  - [ ] `VIEW_WAREHOUSE_COST`
  - [ ] `MANAGE_SUPPLIERS`
  - [ ] `IMPORT_ITEMS`
  - [ ] `EXPORT_ITEMS`
  - [ ] `DISPOSE_ITEMS`
  - [ ] `APPROVE_TRANSACTION`
  - [ ] `CANCEL_WAREHOUSE` (nếu BE thêm)

- [ ] **CLINICAL_RECORDS (5 permissions):**
  - [ ] `WRITE_CLINICAL_RECORD`
  - [ ] `UPLOAD_ATTACHMENT`
  - [ ] `VIEW_ATTACHMENT`
  - [ ] `DELETE_ATTACHMENT`
  - [ ] `VIEW_VITAL_SIGNS_REFERENCE`

- [ ] **PATIENT_IMAGES (8 permissions):**
  - [ ] `PATIENT_IMAGE_CREATE`
  - [ ] `PATIENT_IMAGE_READ`
  - [ ] `PATIENT_IMAGE_UPDATE`
  - [ ] `PATIENT_IMAGE_DELETE`
  - [ ] `PATIENT_IMAGE_COMMENT_CREATE`
  - [ ] `PATIENT_IMAGE_COMMENT_READ`
  - [ ] `PATIENT_IMAGE_COMMENT_UPDATE`
  - [ ] `PATIENT_IMAGE_COMMENT_DELETE`

### Phase 2: Chuẩn hóa tên (Ưu tiên trung bình)

- [ ] Xác định cách xử lý `MANAGE_LEAVE_TYPE` vs các permissions riêng
- [ ] Thêm `UPDATE_REGISTRATION` và `DELETE_REGISTRATION` vào FE (nếu cần)
- [ ] Đảm bảo `VIEW_LEAVE_BALANCE` và `VIEW_LEAVE_BALANCE_ALL` được sử dụng đúng
- [ ] Thêm `ASSIGN_DOCTOR_TO_ITEM` (nếu cần)

### Phase 3: Cleanup Deprecated (Ưu tiên thấp)

- [ ] Xóa các deprecated aliases trong FE sau khi đã migrate code

---

## 🎯 KẾT LUẬN

### Warehouse đang hoạt động tốt ✅

- ✅ Phân quyền đúng: Admin, Inventory Manager, Manager, Accountant, Receptionist, Dentist đều có quyền phù hợp
- ✅ FE đang sử dụng `VIEW_WAREHOUSE` permission đúng cách
- ⚠️ Thiếu 9 permissions chi tiết nhưng không ảnh hưởng đến hoạt động hiện tại (có thể gây lỗi khi BE enforce chặt chẽ hơn)

### Tổng kết vấn đề:

1. **Thiếu permissions:** 22 permissions quan trọng (WAREHOUSE, CLINICAL_RECORDS, PATIENT_IMAGES)
2. **Tên khác nhau:** Một số permissions có tên khác nhau giữa BE và FE (Leave Type, Leave Balance, Registration)
3. **Consolidation:** FE đã consolidate một số permissions (`MANAGE_LEAVE_TYPE`) nhưng BE vẫn dùng permissions riêng

### Khuyến nghị:

1. **Ưu tiên cao:** Bổ sung ngay 22 permissions thiếu (WAREHOUSE, CLINICAL_RECORDS, PATIENT_IMAGES)
2. **Ưu tiên trung bình:** Chuẩn hóa tên permissions giữa BE và FE
3. **Ưu tiên thấp:** Cleanup deprecated aliases


