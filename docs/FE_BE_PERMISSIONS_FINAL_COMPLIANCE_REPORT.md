# BÁO CÁO CUỐI CÙNG: SO SÁNH PERMISSIONS FE VÀ BE (SAU KHI TINH GỌN)

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Phân tích chi tiết sự khác biệt về permissions giữa Frontend và Backend sau khi BE đã tinh gọn từ 169 → 70 permissions

---

## 📊 TỔNG QUAN

### Backend (Seed Data SQL - Đã tinh gọn)
- **Tổng số permissions:** 70 permissions (giảm từ 169, giảm 59%)
- **Chiến lược:** Consolidate CRUD operations → `MANAGE_X` pattern
- **Modules:** 17 modules

### Frontend (permission.ts)
- **Tổng số permissions:** ~198 permissions (bao gồm deprecated aliases)
- **Vấn đề:** Vẫn sử dụng granular permissions (CREATE/UPDATE/DELETE riêng biệt)

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG: FE CHƯA ĐỒNG BỘ VỚI BE

### 1. PERMISSIONS FE ĐANG DÙNG NHƯNG BE ĐÃ CONSOLIDATE

#### 1.1. ACCOUNT Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_ACCOUNT` | ❌ **Đã gộp vào** `MANAGE_ACCOUNT` | ⚠️ **CẦN SỬA** |
| `UPDATE_ACCOUNT` | ❌ **Đã gộp vào** `MANAGE_ACCOUNT` | ⚠️ **CẦN SỬA** |
| `DELETE_ACCOUNT` | ❌ **Đã gộp vào** `MANAGE_ACCOUNT` | ⚠️ **CẦN SỬA** |
| `VIEW_ACCOUNT` | ✅ `VIEW_ACCOUNT` | ✅ OK |

**BE Seed Data:**
```sql
('VIEW_ACCOUNT', 'VIEW_ACCOUNT', 'ACCOUNT', 'Xem danh sách tài khoản', 10, NULL, TRUE, NOW()),
('MANAGE_ACCOUNT', 'MANAGE_ACCOUNT', 'ACCOUNT', 'Quản lý tài khoản (Tạo/Cập nhật/Xóa/Reset password)', 11, NULL, TRUE, NOW())
```

#### 1.2. EMPLOYEE Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_EMPLOYEE` | ❌ **Đã gộp vào** `MANAGE_EMPLOYEE` | ⚠️ **CẦN SỬA** |
| `UPDATE_EMPLOYEE` | ❌ **Đã gộp vào** `MANAGE_EMPLOYEE` | ⚠️ **CẦN SỬA** |
| `VIEW_EMPLOYEE` | ✅ `VIEW_EMPLOYEE` | ✅ OK |
| `DELETE_EMPLOYEE` | ✅ `DELETE_EMPLOYEE` | ✅ OK (giữ riêng) |

**BE Seed Data:**
```sql
('VIEW_EMPLOYEE', 'VIEW_EMPLOYEE', 'EMPLOYEE', 'Xem danh sách và chi tiết nhân viên', 20, NULL, TRUE, NOW()),
('MANAGE_EMPLOYEE', 'MANAGE_EMPLOYEE', 'EMPLOYEE', 'Quản lý nhân viên (Tạo/Cập nhật)', 21, NULL, TRUE, NOW()),
('DELETE_EMPLOYEE', 'DELETE_EMPLOYEE', 'EMPLOYEE', 'Xóa/Vô hiệu hóa nhân viên (Admin only)', 22, NULL, TRUE, NOW())
```

#### 1.3. PATIENT Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_PATIENT` | ❌ **Đã gộp vào** `MANAGE_PATIENT` | ⚠️ **CẦN SỬA** |
| `UPDATE_PATIENT` | ❌ **Đã gộp vào** `MANAGE_PATIENT` | ⚠️ **CẦN SỬA** |
| `VIEW_PATIENT` | ✅ `VIEW_PATIENT` | ✅ OK |
| `DELETE_PATIENT` | ✅ `DELETE_PATIENT` | ✅ OK (giữ riêng) |

**BE Seed Data:**
```sql
('VIEW_PATIENT', 'VIEW_PATIENT', 'PATIENT', 'Xem danh sách và hồ sơ bệnh nhân', 30, NULL, TRUE, NOW()),
('MANAGE_PATIENT', 'MANAGE_PATIENT', 'PATIENT', 'Quản lý bệnh nhân (Tạo/Cập nhật hồ sơ)', 31, NULL, TRUE, NOW()),
('DELETE_PATIENT', 'DELETE_PATIENT', 'PATIENT', 'Xóa hồ sơ bệnh nhân (Admin only)', 32, NULL, TRUE, NOW())
```

#### 1.4. APPOINTMENT Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_APPOINTMENT` | ✅ `CREATE_APPOINTMENT` | ✅ OK |
| `VIEW_APPOINTMENT` | ❌ **Thiếu RBAC!** BE có `VIEW_APPOINTMENT_ALL` và `VIEW_APPOINTMENT_OWN` | ⚠️ **CẦN SỬA** |
| `UPDATE_APPOINTMENT` | ❌ **Đã gộp vào** `MANAGE_APPOINTMENT` | ⚠️ **CẦN SỬA** |
| `DELETE_APPOINTMENT` | ❌ **Đã gộp vào** `MANAGE_APPOINTMENT` | ⚠️ **CẦN SỬA** |
| `DELAY_APPOINTMENT` | ❌ **Đã gộp vào** `MANAGE_APPOINTMENT` | ⚠️ **CẦN SỬA** |
| `CANCEL_APPOINTMENT` | ❌ **Đã gộp vào** `MANAGE_APPOINTMENT` | ⚠️ **CẦN SỬA** |

**BE Seed Data:**
```sql
('VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_ALL', 'APPOINTMENT', 'Xem tất cả lịch hẹn (Receptionist/Manager)', 50, NULL, TRUE, NOW()),
('VIEW_APPOINTMENT_OWN', 'VIEW_APPOINTMENT_OWN', 'APPOINTMENT', 'Xem lịch hẹn liên quan (Dentist/Patient)', 51, 'VIEW_APPOINTMENT_ALL', TRUE, NOW()),
('CREATE_APPOINTMENT', 'CREATE_APPOINTMENT', 'APPOINTMENT', 'Đặt lịch hẹn mới', 52, NULL, TRUE, NOW()),
('MANAGE_APPOINTMENT', 'MANAGE_APPOINTMENT', 'APPOINTMENT', 'Quản lý lịch hẹn (Cập nhật/Hủy/Hoãn)', 53, NULL, TRUE, NOW()),
('UPDATE_APPOINTMENT_STATUS', 'UPDATE_APPOINTMENT_STATUS', 'APPOINTMENT', 'Cập nhật trạng thái (Check-in/In-progress/Completed)', 54, NULL, TRUE, NOW())
```

**Controller Usage:**
- `AppointmentController.delayAppointment()` → `@PreAuthorize("hasAuthority('MANAGE_APPOINTMENT')")`
- `AppointmentController.updateAppointmentStatus()` → `@PreAuthorize("hasAuthority('UPDATE_APPOINTMENT_STATUS')")`

#### 1.5. SERVICE Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_SERVICE` | ❌ **Đã gộp vào** `MANAGE_SERVICE` | ⚠️ **CẦN SỬA** |
| `UPDATE_SERVICE` | ❌ **Đã gộp vào** `MANAGE_SERVICE` | ⚠️ **CẦN SỬA** |
| `DELETE_SERVICE` | ❌ **Đã gộp vào** `MANAGE_SERVICE` | ⚠️ **CẦN SỬA** |
| `VIEW_SERVICE` | ✅ `VIEW_SERVICE` | ✅ OK |

**BE Seed Data:**
```sql
('VIEW_SERVICE', 'VIEW_SERVICE', 'SERVICE_MANAGEMENT', 'Xem danh sách và chi tiết dịch vụ', 100, NULL, TRUE, NOW()),
('MANAGE_SERVICE', 'MANAGE_SERVICE', 'SERVICE_MANAGEMENT', 'Quản lý dịch vụ (Tạo/Cập nhật/Xóa)', 101, NULL, TRUE, NOW())
```

**Controller Usage:**
- `ServiceController.createService()` → `@PreAuthorize("hasAuthority('MANAGE_SERVICE')")`
- `ServiceController.updateService()` → `@PreAuthorize("hasAuthority('MANAGE_SERVICE')")`
- `ServiceController.deleteService()` → `@PreAuthorize("hasAuthority('MANAGE_SERVICE')")`

#### 1.6. ROOM Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_ROOM` | ❌ **Đã gộp vào** `MANAGE_ROOM` | ⚠️ **CẦN SỬA** |
| `UPDATE_ROOM` | ❌ **Đã gộp vào** `MANAGE_ROOM` | ⚠️ **CẦN SỬA** |
| `DELETE_ROOM` | ❌ **Đã gộp vào** `MANAGE_ROOM` | ⚠️ **CẦN SỬA** |
| `VIEW_ROOM` | ✅ `VIEW_ROOM` | ✅ OK |

**BE Seed Data:**
```sql
('VIEW_ROOM', 'VIEW_ROOM', 'ROOM_MANAGEMENT', 'Xem danh sách phòng/ghế và dịch vụ', 110, NULL, TRUE, NOW()),
('MANAGE_ROOM', 'MANAGE_ROOM', 'ROOM_MANAGEMENT', 'Quản lý phòng (Tạo/Cập nhật/Xóa/Gán dịch vụ)', 111, NULL, TRUE, NOW())
```

**Controller Usage:**
- `RoomController.createRoom()` → `@PreAuthorize("hasAuthority('MANAGE_ROOM')")`
- `RoomController.updateRoom()` → `@PreAuthorize("hasAuthority('MANAGE_ROOM')")`
- `RoomController.deleteRoom()` → `@PreAuthorize("hasAuthority('MANAGE_ROOM')")`
- `RoomController.updateRoomServices()` → `@PreAuthorize("hasAuthority('MANAGE_ROOM')")`

#### 1.7. HOLIDAY Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_HOLIDAY` | ❌ **Đã gộp vào** `MANAGE_HOLIDAY` | ⚠️ **CẦN SỬA** |
| `UPDATE_HOLIDAY` | ❌ **Đã gộp vào** `MANAGE_HOLIDAY` | ⚠️ **CẦN SỬA** |
| `DELETE_HOLIDAY` | ❌ **Đã gộp vào** `MANAGE_HOLIDAY` | ⚠️ **CẦN SỬA** |
| `VIEW_HOLIDAY` | ✅ `VIEW_HOLIDAY` | ✅ OK |

**BE Seed Data:**
```sql
('VIEW_HOLIDAY', 'VIEW_HOLIDAY', 'HOLIDAY', 'Xem danh sách ngày nghỉ lễ', 90, NULL, TRUE, NOW()),
('MANAGE_HOLIDAY', 'MANAGE_HOLIDAY', 'HOLIDAY', 'Quản lý ngày nghỉ lễ (Tạo/Cập nhật/Xóa)', 91, NULL, TRUE, NOW())
```

#### 1.8. TREATMENT_PLAN Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `CREATE_TREATMENT_PLAN` | ❌ **Đã gộp vào** `MANAGE_TREATMENT_PLAN` | ⚠️ **CẦN SỬA** |
| `UPDATE_TREATMENT_PLAN` | ❌ **Đã gộp vào** `MANAGE_TREATMENT_PLAN` | ⚠️ **CẦN SỬA** |
| `DELETE_TREATMENT_PLAN` | ❌ **Đã gộp vào** `MANAGE_TREATMENT_PLAN` | ⚠️ **CẦN SỬA** |
| `VIEW_TREATMENT_PLAN` | ❌ **Thiếu RBAC!** BE có `VIEW_TREATMENT_PLAN_ALL` và `VIEW_TREATMENT_PLAN_OWN` | ⚠️ **CẦN SỬA** |
| `ASSIGN_DOCTOR_TO_ITEM` | ❌ **Đã gộp vào** `MANAGE_TREATMENT` | ⚠️ **CẦN SỬA** |

**BE Seed Data:**
```sql
('VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_ALL', 'TREATMENT_PLAN', 'Xem tất cả phác đồ điều trị', 150, NULL, TRUE, NOW()),
('VIEW_TREATMENT_PLAN_OWN', 'VIEW_TREATMENT_PLAN_OWN', 'TREATMENT_PLAN', 'Xem phác đồ của bản thân', 151, 'VIEW_TREATMENT_PLAN_ALL', TRUE, NOW()),
('MANAGE_TREATMENT_PLAN', 'MANAGE_TREATMENT_PLAN', 'TREATMENT_PLAN', 'Quản lý phác đồ (Tạo/Cập nhật/Xóa)', 152, NULL, TRUE, NOW()),
('VIEW_TREATMENT', 'VIEW_TREATMENT', 'TREATMENT_PLAN', 'Xem chi tiết hạng mục điều trị', 153, NULL, TRUE, NOW()),
('MANAGE_TREATMENT', 'MANAGE_TREATMENT', 'TREATMENT_PLAN', 'Quản lý hạng mục điều trị (Tạo/Cập nhật/Phân bổ BS)', 154, NULL, TRUE, NOW())
```

**Controller Usage:**
- `TreatmentPlanController.createTreatmentPlan()` → `@PreAuthorize("hasAuthority('MANAGE_TREATMENT_PLAN')")`
- `TreatmentPlanController.createCustomTreatmentPlan()` → `@PreAuthorize("hasAuthority('MANAGE_TREATMENT_PLAN')")`
- `TreatmentPlanController.assignDoctorToItem()` → `@PreAuthorize("hasAuthority('MANAGE_TREATMENT')")`

#### 1.9. CLINICAL_RECORDS Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `UPLOAD_ATTACHMENT` | ❌ **Đã gộp vào** `MANAGE_ATTACHMENTS` | ⚠️ **CẦN SỬA** |
| `DELETE_ATTACHMENT` | ❌ **Đã gộp vào** `MANAGE_ATTACHMENTS` | ⚠️ **CẦN SỬA** |
| `VIEW_ATTACHMENT` | ✅ `VIEW_ATTACHMENT` | ✅ OK |
| `WRITE_CLINICAL_RECORD` | ✅ `WRITE_CLINICAL_RECORD` | ✅ OK |
| `VIEW_VITAL_SIGNS_REFERENCE` | ✅ `VIEW_VITAL_SIGNS_REFERENCE` | ✅ OK |

**BE Seed Data:**
```sql
('WRITE_CLINICAL_RECORD', 'WRITE_CLINICAL_RECORD', 'CLINICAL_RECORDS', 'Tạo và cập nhật bệnh án, thêm thủ thuật', 60, NULL, TRUE, NOW()),
('VIEW_VITAL_SIGNS_REFERENCE', 'VIEW_VITAL_SIGNS_REFERENCE', 'CLINICAL_RECORDS', 'Xem bảng tham chiếu chỉ số sinh tồn', 61, NULL, TRUE, NOW()),
('VIEW_ATTACHMENT', 'VIEW_ATTACHMENT', 'CLINICAL_RECORDS', 'Xem file đính kèm bệnh án (X-quang, ảnh)', 62, NULL, TRUE, NOW()),
('MANAGE_ATTACHMENTS', 'MANAGE_ATTACHMENTS', 'CLINICAL_RECORDS', 'Quản lý file đính kèm (Upload/Xóa)', 63, NULL, TRUE, NOW())
```

**Controller Usage:**
- `ClinicalRecordAttachmentController.uploadAttachment()` → `@PreAuthorize("hasAuthority('MANAGE_ATTACHMENTS')")`
- `ClinicalRecordAttachmentController.deleteAttachment()` → `@PreAuthorize("hasAuthority('MANAGE_ATTACHMENTS')")`

#### 1.10. PATIENT_IMAGES Module
| FE Permission | BE Permission (Mới) | Status |
|---------------|---------------------|--------|
| `PATIENT_IMAGE_CREATE` | ❌ **Đã gộp vào** `MANAGE_PATIENT_IMAGES` | ⚠️ **CẦN SỬA** |
| `PATIENT_IMAGE_UPDATE` | ❌ **Đã gộp vào** `MANAGE_PATIENT_IMAGES` | ⚠️ **CẦN SỬA** |
| `PATIENT_IMAGE_DELETE` | ❌ **Đã gộp vào** `MANAGE_PATIENT_IMAGES` | ⚠️ **CẦN SỬA** |
| `PATIENT_IMAGE_COMMENT_CREATE` | ❌ **Đã gộp vào** `MANAGE_PATIENT_IMAGES` | ⚠️ **CẦN SỬA** |
| `PATIENT_IMAGE_COMMENT_UPDATE` | ❌ **Đã gộp vào** `MANAGE_PATIENT_IMAGES` | ⚠️ **CẦN SỬA** |
| `PATIENT_IMAGE_COMMENT_DELETE` | ❌ **Đã gộp vào** `MANAGE_PATIENT_IMAGES` | ⚠️ **CẦN SỬA** |
| `PATIENT_IMAGE_READ` | ✅ `PATIENT_IMAGE_READ` | ✅ OK |
| `VIEW_PATIENT_IMAGES` | ❌ **BE dùng** `PATIENT_IMAGE_READ` | ⚠️ **CẦN SỬA** |

**BE Seed Data:**
```sql
('PATIENT_IMAGE_READ', 'PATIENT_IMAGE_READ', 'PATIENT_IMAGES', 'Xem hình ảnh và nhận xét bệnh nhân', 70, NULL, TRUE, NOW()),
('MANAGE_PATIENT_IMAGES', 'MANAGE_PATIENT_IMAGES', 'PATIENT_IMAGES', 'Quản lý hình ảnh (Upload/Cập nhật/Xóa/Thêm nhận xét)', 71, NULL, TRUE, NOW()),
('DELETE_PATIENT_IMAGES', 'DELETE_PATIENT_IMAGES', 'PATIENT_IMAGES', 'Xóa vĩnh viễn hình ảnh (Admin/Uploader)', 72, NULL, TRUE, NOW())
```

**Controller Usage:**
- `PatientImageController.createPatientImage()` → `@PreAuthorize("hasAuthority('MANAGE_PATIENT_IMAGES')")`
- `PatientImageController.updatePatientImage()` → `@PreAuthorize("hasAuthority('MANAGE_PATIENT_IMAGES')")`
- `PatientImageController.deletePatientImage()` → `@PreAuthorize("hasAuthority('MANAGE_PATIENT_IMAGES')")`
- `PatientImageController.getPatientImages()` → `@PreAuthorize("hasAuthority('VIEW_PATIENT_IMAGES')")` ⚠️ **Controller dùng sai!** Nên dùng `PATIENT_IMAGE_READ`

---

### 2. PERMISSIONS THIẾU TRONG FE

#### 2.1. WAREHOUSE Module (9 permissions thiếu)
| BE Permission | Mô tả | Mức độ ưu tiên |
|---------------|-------|----------------|
| `VIEW_ITEMS` | Xem danh sách vật tư (cho Bác sĩ/Lễ tân) | 🔴 **CAO** |
| `VIEW_MEDICINES` | Xem và tìm kiếm thuốc men (cho Bác sĩ kê đơn) | 🔴 **CAO** |
| `VIEW_WAREHOUSE_COST` | Xem giá tiền kho (Admin/Kế toán) | 🟡 **TRUNG BÌNH** |
| `MANAGE_SUPPLIERS` | Quản lý nhà cung cấp | 🟡 **TRUNG BÌNH** |
| `IMPORT_ITEMS` | Tạo phiếu nhập kho | 🔴 **CAO** |
| `EXPORT_ITEMS` | Tạo phiếu xuất kho | 🔴 **CAO** |
| `DISPOSE_ITEMS` | Tạo phiếu thanh lý | 🟡 **TRUNG BÌNH** |
| `APPROVE_TRANSACTION` | Duyệt/Từ chối phiếu nhập xuất kho | 🔴 **CAO** |
| `CANCEL_WAREHOUSE` | Hủy giao dịch kho | 🟡 **TRUNG BÌNH** |

**FE hiện có:**
- ✅ `VIEW_WAREHOUSE`
- ✅ `MANAGE_WAREHOUSE`
- ❌ Thiếu 9 permissions trên

#### 2.2. LEAVE_MANAGEMENT Module
| BE Permission | Mô tả | Status |
|---------------|-------|--------|
| `VIEW_LEAVE_BALANCE_ALL` | Xem số dư phép của tất cả nhân viên | ❌ **THIẾU** |
| `ADJUST_LEAVE_BALANCE` | Điều chỉnh số dư phép | ❌ **THIẾU** |

**Controller Usage:**
- `AdminLeaveBalanceController` → Cần `VIEW_LEAVE_BALANCE_ALL` và `ADJUST_LEAVE_BALANCE`

---

### 3. PERMISSIONS FE CÓ NHƯNG BE KHÔNG CÒN

#### 3.1. Deprecated Permissions (Cần xóa hoặc alias)
- `CREATE_ACCOUNT`, `UPDATE_ACCOUNT`, `DELETE_ACCOUNT` → Dùng `MANAGE_ACCOUNT`
- `CREATE_EMPLOYEE`, `UPDATE_EMPLOYEE` → Dùng `MANAGE_EMPLOYEE`
- `CREATE_PATIENT`, `UPDATE_PATIENT` → Dùng `MANAGE_PATIENT`
- `UPDATE_APPOINTMENT`, `DELETE_APPOINTMENT`, `DELAY_APPOINTMENT`, `CANCEL_APPOINTMENT` → Dùng `MANAGE_APPOINTMENT`
- `CREATE_SERVICE`, `UPDATE_SERVICE`, `DELETE_SERVICE` → Dùng `MANAGE_SERVICE`
- `CREATE_ROOM`, `UPDATE_ROOM`, `DELETE_ROOM` → Dùng `MANAGE_ROOM`
- `CREATE_HOLIDAY`, `UPDATE_HOLIDAY`, `DELETE_HOLIDAY` → Dùng `MANAGE_HOLIDAY`
- `CREATE_TREATMENT_PLAN`, `UPDATE_TREATMENT_PLAN`, `DELETE_TREATMENT_PLAN` → Dùng `MANAGE_TREATMENT_PLAN`
- `UPLOAD_ATTACHMENT`, `DELETE_ATTACHMENT` → Dùng `MANAGE_ATTACHMENTS`
- `PATIENT_IMAGE_CREATE`, `PATIENT_IMAGE_UPDATE`, `PATIENT_IMAGE_DELETE` → Dùng `MANAGE_PATIENT_IMAGES`
- `PATIENT_IMAGE_COMMENT_CREATE`, `PATIENT_IMAGE_COMMENT_UPDATE`, `PATIENT_IMAGE_COMMENT_DELETE` → Dùng `MANAGE_PATIENT_IMAGES`

---

## ✅ CHECKLIST SỬA CHỮA

### Priority 1: CRITICAL (Cần sửa ngay)
- [ ] **1.1. Consolidate Account permissions:**
  - [ ] Thay `CREATE_ACCOUNT`, `UPDATE_ACCOUNT`, `DELETE_ACCOUNT` → `MANAGE_ACCOUNT`
  - [ ] Cập nhật tất cả files sử dụng permissions này

- [ ] **1.2. Consolidate Employee permissions:**
  - [ ] Thay `CREATE_EMPLOYEE`, `UPDATE_EMPLOYEE` → `MANAGE_EMPLOYEE`
  - [ ] Giữ `DELETE_EMPLOYEE` (BE giữ riêng)

- [ ] **1.3. Consolidate Patient permissions:**
  - [ ] Thay `CREATE_PATIENT`, `UPDATE_PATIENT` → `MANAGE_PATIENT`
  - [ ] Giữ `DELETE_PATIENT` (BE giữ riêng)

- [ ] **1.4. Fix Appointment permissions:**
  - [ ] Thay `VIEW_APPOINTMENT` → `VIEW_APPOINTMENT_ALL` hoặc `VIEW_APPOINTMENT_OWN` (tùy context)
  - [ ] Thay `UPDATE_APPOINTMENT`, `DELETE_APPOINTMENT`, `DELAY_APPOINTMENT`, `CANCEL_APPOINTMENT` → `MANAGE_APPOINTMENT`
  - [ ] Thêm `UPDATE_APPOINTMENT_STATUS` (cho check-in/complete)

- [ ] **1.5. Consolidate Service permissions:**
  - [ ] Thay `CREATE_SERVICE`, `UPDATE_SERVICE`, `DELETE_SERVICE` → `MANAGE_SERVICE`

- [ ] **1.6. Consolidate Room permissions:**
  - [ ] Thay `CREATE_ROOM`, `UPDATE_ROOM`, `DELETE_ROOM` → `MANAGE_ROOM`

- [ ] **1.7. Consolidate Holiday permissions:**
  - [ ] Thay `CREATE_HOLIDAY`, `UPDATE_HOLIDAY`, `DELETE_HOLIDAY` → `MANAGE_HOLIDAY`

- [ ] **1.8. Fix Treatment Plan permissions:**
  - [ ] Thay `VIEW_TREATMENT_PLAN` → `VIEW_TREATMENT_PLAN_ALL` hoặc `VIEW_TREATMENT_PLAN_OWN`
  - [ ] Thay `CREATE_TREATMENT_PLAN`, `UPDATE_TREATMENT_PLAN`, `DELETE_TREATMENT_PLAN` → `MANAGE_TREATMENT_PLAN`
  - [ ] Thay `ASSIGN_DOCTOR_TO_ITEM` → `MANAGE_TREATMENT`
  - [ ] Thêm `VIEW_TREATMENT` (nếu cần)

- [ ] **1.9. Consolidate Clinical Records permissions:**
  - [ ] Thay `UPLOAD_ATTACHMENT`, `DELETE_ATTACHMENT` → `MANAGE_ATTACHMENTS`

- [ ] **1.10. Fix Patient Images permissions:**
  - [ ] Thay `VIEW_PATIENT_IMAGES` → `PATIENT_IMAGE_READ`
  - [ ] Thay `PATIENT_IMAGE_CREATE`, `PATIENT_IMAGE_UPDATE`, `PATIENT_IMAGE_DELETE` → `MANAGE_PATIENT_IMAGES`
  - [ ] Thay `PATIENT_IMAGE_COMMENT_*` → `MANAGE_PATIENT_IMAGES`
  - [ ] Thêm `DELETE_PATIENT_IMAGES` (nếu cần hard delete)

### Priority 2: HIGH (Cần sửa sớm)
- [ ] **2.1. Add Warehouse permissions:**
  - [ ] Thêm `VIEW_ITEMS`
  - [ ] Thêm `VIEW_MEDICINES`
  - [ ] Thêm `VIEW_WAREHOUSE_COST`
  - [ ] Thêm `MANAGE_SUPPLIERS`
  - [ ] Thêm `IMPORT_ITEMS`
  - [ ] Thêm `EXPORT_ITEMS`
  - [ ] Thêm `DISPOSE_ITEMS`
  - [ ] Thêm `APPROVE_TRANSACTION`
  - [ ] Thêm `CANCEL_WAREHOUSE` (nếu cần)

- [ ] **2.2. Add Leave Management permissions:**
  - [ ] Thêm `VIEW_LEAVE_BALANCE_ALL`
  - [ ] Thêm `ADJUST_LEAVE_BALANCE`

### Priority 3: MEDIUM (Có thể sửa sau)
- [ ] **3.1. Clean up deprecated permissions:**
  - [ ] Xóa hoặc mark as deprecated các permissions không còn dùng
  - [ ] Tạo migration guide cho developers

---

## 📝 NOTES

### Về Warehouse
**Câu hỏi:** "Warehouse đang sử dụng được (không cần chỉnh sửa thêm), có phải là chỉ nhân viên có quyền và admin được thao tác trong warehouse đúng không?"

**Trả lời:** ✅ **ĐÚNG!** Warehouse đang hoạt động tốt với phân quyền như sau:
- **ROLE_ADMIN**: Tất cả permissions
- **ROLE_INVENTORY_MANAGER**: Quản lý kho (không xem giá)
- **ROLE_MANAGER**: Quản lý kho + xem giá
- **ROLE_ACCOUNTANT**: Chỉ xem (có giá) - cho đối soát tài chính
- **ROLE_RECEPTIONIST, ROLE_DENTIST**: Chỉ xem (không có giá)
- **ROLE_NURSE**: Không có quyền

FE đang sử dụng `VIEW_WAREHOUSE` đúng cách. Navigation config có function `canAccessWarehouse` kiểm tra permission hoặc `ROLE_ADMIN`.

### Về Permissions đặc thù (Ưu tiên cao)
Các permissions sau có độ ưu tiên cao vì được sử dụng nhiều trong controllers:
1. **WAREHOUSE**: `VIEW_ITEMS`, `VIEW_MEDICINES`, `IMPORT_ITEMS`, `EXPORT_ITEMS`, `APPROVE_TRANSACTION`
2. **LEAVE_MANAGEMENT**: `VIEW_LEAVE_BALANCE_ALL`, `ADJUST_LEAVE_BALANCE`
3. **APPOINTMENT**: `UPDATE_APPOINTMENT_STATUS` (cho check-in/complete workflow)

---

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG: BE ĐANG SỬ DỤNG PERMISSIONS SAI HOẶC THIẾU

### 1. CONTROLLERS THIẾU @PreAuthorize (Security Risk)

#### 1.1. AccountController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/account/controller/AccountController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `/api/v1/account/me` | GET | ❌ **KHÔNG CÓ** | ✅ OK (chỉ cần authenticated) |
| `/api/v1/account/profile` | GET | ❌ **KHÔNG CÓ** | ✅ OK (chỉ cần authenticated) |
| `/api/v1/account/permissions` | GET | ❌ **KHÔNG CÓ** | ✅ OK (chỉ cần authenticated) |
| `/api/v1/account/info` | GET | ❌ **KHÔNG CÓ** | ✅ OK (chỉ cần authenticated) |

**Đánh giá:** ✅ **OK** - Đây là profile endpoints, chỉ cần authenticated user.

#### 1.2. EmployeeController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/employee/controller/EmployeeController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `GET /api/v1/employees` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_EMPLOYEE` |
| `GET /api/v1/employees/admin/all` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_EMPLOYEE` + `ROLE_ADMIN` |
| `GET /api/v1/employees/{code}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_EMPLOYEE` |
| `GET /api/v1/employees/admin/{code}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_EMPLOYEE` + `ROLE_ADMIN` |
| `POST /api/v1/employees` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_EMPLOYEE` |
| `PATCH /api/v1/employees/{code}` | PATCH | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_EMPLOYEE` |
| `PUT /api/v1/employees/{code}` | PUT | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_EMPLOYEE` |
| `DELETE /api/v1/employees/{code}` | DELETE | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `DELETE_EMPLOYEE` |
| `GET /api/v1/employees/specializations` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_SPECIALIZATION` |
| `GET /api/v1/employees/medical-staff` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_EMPLOYEE` |

**Lưu ý:** Service layer có @PreAuthorize, nhưng nên có ở controller level để rõ ràng hơn.

#### 1.3. PatientController - ⚠️ **THIẾU MỘT SỐ**
**File:** `docs/files/patient/controller/PatientController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `GET /api/v1/patients` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_PATIENT` |
| `GET /api/v1/patients/admin/all` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_PATIENT` + `ROLE_ADMIN` |
| `GET /api/v1/patients/{code}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_PATIENT` |
| `GET /api/v1/patients/admin/{code}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_PATIENT` + `ROLE_ADMIN` |
| `POST /api/v1/patients` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_PATIENT` |
| `PATCH /api/v1/patients/{code}` | PATCH | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_PATIENT` |
| `PUT /api/v1/patients/{code}` | PUT | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_PATIENT` |
| `DELETE /api/v1/patients/{code}` | DELETE | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `DELETE_PATIENT` |
| `GET /api/v1/patients/{id}/tooth-status` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_PATIENT` |
| `PUT /api/v1/patients/{id}/tooth-status` | PUT | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_PATIENT` hoặc `WRITE_CLINICAL_RECORD` |
| `POST /api/v1/patients/{id}/unban` | POST | ✅ **CÓ** | ✅ OK |
| `GET /api/v1/patients/{id}/unban-history` | GET | ✅ **CÓ** | ✅ OK |
| `GET /api/v1/patients/check-duplicate` | GET | ✅ **CÓ** | ✅ OK |
| `POST /api/v1/patients/{id}/blacklist` | POST | ✅ **CÓ** | ✅ OK |
| `DELETE /api/v1/patients/{id}/blacklist` | DELETE | ✅ **CÓ** | ✅ OK |
| `GET /api/v1/patients/me/profile` | GET | ✅ **CÓ** | ✅ OK |

**Lưu ý:** Service layer có @PreAuthorize, nhưng nên có ở controller level để rõ ràng hơn.

#### 1.4. CustomerContactController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/customer_contact/controller/CustomerContactController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `GET /api/v1/customer-contacts` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_CUSTOMER_CONTACT` |
| `GET /api/v1/customer-contacts/{id}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_CUSTOMER_CONTACT` |
| `POST /api/v1/customer-contacts` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_CUSTOMER_CONTACT` (hoặc public nếu cho website) |
| `PUT /api/v1/customer-contacts/{id}` | PUT | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_CUSTOMER_CONTACT` |
| `DELETE /api/v1/customer-contacts/{id}` | DELETE | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_CUSTOMER_CONTACT` |
| `POST /api/v1/customer-contacts/{id}/assign` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_CUSTOMER_CONTACT` |
| `POST /api/v1/customer-contacts/{id}/convert` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_CUSTOMER_CONTACT` |
| `GET /api/v1/customer-contacts/stats` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_CUSTOMER_CONTACT` |
| `GET /api/v1/customer-contacts/conversion-rate` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_CUSTOMER_CONTACT` |

**Lưu ý:** Service layer có @PreAuthorize, nhưng nên có ở controller level.

#### 1.5. ContactHistoryController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/contact_history/controller/ContactHistoryController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `GET /api/v1/customer-contacts/{id}/history` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_CUSTOMER_CONTACT` |
| `POST /api/v1/customer-contacts/{id}/history` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_CUSTOMER_CONTACT` |

**Lưu ý:** Service layer có @PreAuthorize, nhưng nên có ở controller level.

#### 1.6. SpecializationController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/specialization/controller/SpecializationController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `GET /api/v1/specializations` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_SPECIALIZATION` (hoặc public nếu cho dropdown) |

**Đánh giá:** ⚠️ **CẦN KIỂM TRA** - Có thể là public endpoint cho dropdown, nhưng nên rõ ràng.

#### 1.7. WorkShiftController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/working_schedule/controller/WorkShiftController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `POST /api/v1/work-shifts` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SHIFTS` |
| `PATCH /api/v1/work-shifts/{id}` | PATCH | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SHIFTS` |
| `DELETE /api/v1/work-shifts/{id}` | DELETE | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SHIFTS` |
| `PUT /api/v1/work-shifts/{id}/reactivate` | PUT | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SHIFTS` |
| `GET /api/v1/work-shifts` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_SCHEDULE_ALL` hoặc `VIEW_SCHEDULE_OWN` |
| `GET /api/v1/work-shifts/{id}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_SCHEDULE_ALL` hoặc `VIEW_SCHEDULE_OWN` |

**Lưu ý:** Service layer có @PreAuthorize, nhưng nên có ở controller level.

#### 1.8. TimeOffTypeController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/working_schedule/controller/TimeOffTypeController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `GET /api/v1/time-off-types` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_LEAVE_TYPE` (hoặc public nếu cho dropdown) |

**Đánh giá:** ⚠️ **CẦN KIỂM TRA** - Có thể là public endpoint cho dropdown.

#### 1.9. PartTimeSlotController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/working_schedule/controller/PartTimeSlotController.java`

| Endpoint | Method | Status | Khuyến nghị |
|----------|--------|--------|-------------|
| `POST /api/v1/work-slots` | POST | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SLOTS` |
| `GET /api/v1/work-slots` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_SCHEDULE_ALL` hoặc `VIEW_AVAILABLE_SLOTS` |
| `GET /api/v1/work-slots/{id}` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `VIEW_SCHEDULE_ALL` hoặc `VIEW_AVAILABLE_SLOTS` |
| `GET /api/v1/work-slots/{id}/registered` | GET | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_PART_TIME_REGISTRATIONS` hoặc `MANAGE_WORK_SLOTS` |
| `PATCH /api/v1/work-slots/{id}` | PATCH | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SLOTS` |
| `DELETE /api/v1/work-slots/{id}` | DELETE | ❌ **KHÔNG CÓ** | ⚠️ **CẦN** `MANAGE_WORK_SLOTS` |

**Lưu ý:** ⚠️ **QUAN TRỌNG** - Controller này quản lý part-time slots, cần permissions rõ ràng.

#### 1.10. EmployeeShiftController - ❌ **THIẾU HOÀN TOÀN**
**File:** `docs/files/working_schedule/controller/EmployeeShiftController.java`

**Vấn đề:** Controller không có @PreAuthorize, nhưng có logic kiểm tra permission trong code:
```java
boolean hasViewAllPermission = authentication.getAuthorities()
    .contains(new SimpleGrantedAuthority("VIEW_SHIFTS_ALL"));
```

**Khuyến nghị:** Nên dùng @PreAuthorize thay vì kiểm tra manual trong code.

---

### 2. CONTROLLERS DÙNG SAI PERMISSIONS

#### 2.1. AdminTimeOffTypeController - ⚠️ **DÙNG SAI PERMISSIONS**
**File:** `docs/files/working_schedule/controller/AdminTimeOffTypeController.java`

| Endpoint | Method | Permission hiện tại | Permission đúng (Seed Data) | Status |
|----------|--------|---------------------|----------------------------|--------|
| `GET /api/v1/admin/time-off-types` | GET | `VIEW_LEAVE_ALL` | ⚠️ **NÊN DÙNG** `VIEW_LEAVE_TYPE` | ❌ **SAI** |
| `GET /api/v1/admin/time-off-types/{id}` | GET | `VIEW_LEAVE_ALL` | ⚠️ **NÊN DÙNG** `VIEW_LEAVE_TYPE` | ❌ **SAI** |
| `POST /api/v1/admin/time-off-types` | POST | `APPROVE_TIME_OFF` | ⚠️ **NÊN DÙNG** `MANAGE_LEAVE_TYPE` | ❌ **SAI** |
| `PATCH /api/v1/admin/time-off-types/{id}` | PATCH | `APPROVE_TIME_OFF` | ⚠️ **NÊN DÙNG** `MANAGE_LEAVE_TYPE` | ❌ **SAI** |
| `DELETE /api/v1/admin/time-off-types/{id}` | DELETE | `APPROVE_TIME_OFF` | ⚠️ **NÊN DÙNG** `MANAGE_LEAVE_TYPE` | ❌ **SAI** |

**Vấn đề:**
- GET endpoints dùng `VIEW_LEAVE_ALL` (xem tất cả yêu cầu nghỉ phép) thay vì `VIEW_LEAVE_TYPE` (xem loại nghỉ phép)
- POST/PATCH/DELETE dùng `APPROVE_TIME_OFF` (phê duyệt nghỉ phép) thay vì `MANAGE_LEAVE_TYPE` (quản lý loại nghỉ phép)

**BE Seed Data:** ❌ **THIẾU PERMISSIONS!**
- Seed data KHÔNG CÓ `VIEW_LEAVE_TYPE`
- Seed data KHÔNG CÓ `MANAGE_LEAVE_TYPE`

**Khuyến nghị:** 
1. **THÊM vào seed data:**
   ```sql
   ('VIEW_LEAVE_TYPE', 'VIEW_LEAVE_TYPE', 'LEAVE_MANAGEMENT', 'Xem danh sách loại nghỉ phép', 148, NULL, TRUE, NOW()),
   ('MANAGE_LEAVE_TYPE', 'MANAGE_LEAVE_TYPE', 'LEAVE_MANAGEMENT', 'Quản lý loại nghỉ phép (Tạo/Cập nhật/Xóa)', 149, NULL, TRUE, NOW())
   ```
2. **Sửa controller** để dùng đúng permissions thay vì `VIEW_LEAVE_ALL` và `APPROVE_TIME_OFF`.

#### 2.2. AdminLeaveBalanceController - ⚠️ **DÙNG SAI PERMISSIONS**
**File:** `docs/files/working_schedule/controller/AdminLeaveBalanceController.java`

| Endpoint | Method | Permission hiện tại | Permission đúng (Seed Data) | Status |
|----------|--------|---------------------|----------------------------|--------|
| `GET /api/v1/admin/leave-balances` | GET | `VIEW_LEAVE_ALL` | ⚠️ **THIẾU** `VIEW_LEAVE_BALANCE_ALL` | ❌ **SAI** |
| `GET /api/v1/admin/employees/{id}/leave-balances` | GET | `VIEW_LEAVE_ALL` | ⚠️ **THIẾU** `VIEW_LEAVE_BALANCE_ALL` | ❌ **SAI** |
| `POST /api/v1/admin/leave-balances/adjust` | POST | `APPROVE_TIME_OFF` | ⚠️ **THIẾU** `ADJUST_LEAVE_BALANCE` | ❌ **SAI** |
| `POST /api/v1/admin/leave-balances/annual-reset` | POST | `ROLE_ADMIN` | ✅ OK | ✅ OK |

**Vấn đề:**
- GET endpoints dùng `VIEW_LEAVE_ALL` (xem yêu cầu nghỉ phép) thay vì `VIEW_LEAVE_BALANCE_ALL` (xem số dư phép)
- POST adjust dùng `APPROVE_TIME_OFF` (phê duyệt nghỉ phép) thay vì `ADJUST_LEAVE_BALANCE` (điều chỉnh số dư)

**BE Seed Data:** ❌ **THIẾU PERMISSIONS!**
- Seed data KHÔNG CÓ `VIEW_LEAVE_BALANCE_ALL`
- Seed data KHÔNG CÓ `ADJUST_LEAVE_BALANCE`

**Khuyến nghị:** 
1. **THÊM vào seed data:**
   - `VIEW_LEAVE_BALANCE_ALL` - Xem số dư phép của tất cả nhân viên
   - `ADJUST_LEAVE_BALANCE` - Điều chỉnh số dư phép
2. **Sửa controller** để dùng đúng permissions.

#### 2.3. PatientImageController - ⚠️ **DÙNG SAI PERMISSION**
**File:** `docs/files/patient/controller/PatientImageController.java`

| Endpoint | Method | Permission hiện tại | Permission đúng (Seed Data) | Status |
|----------|--------|---------------------|----------------------------|--------|
| `GET /api/v1/patient-images/patient/{id}` | GET | `VIEW_PATIENT_IMAGES` | ⚠️ **NÊN DÙNG** `PATIENT_IMAGE_READ` | ❌ **SAI** |
| `GET /api/v1/patient-images/{id}` | GET | `VIEW_PATIENT_IMAGES` | ⚠️ **NÊN DÙNG** `PATIENT_IMAGE_READ` | ❌ **SAI** |
| `GET /api/v1/patient-images/clinical-record/{id}` | GET | `VIEW_PATIENT_IMAGES` | ⚠️ **NÊN DÙNG** `PATIENT_IMAGE_READ` | ❌ **SAI** |
| `GET /api/v1/patient-images/appointment/{id}` | GET | `VIEW_PATIENT_IMAGES` | ⚠️ **NÊN DÙNG** `PATIENT_IMAGE_READ` | ❌ **SAI** |

**Vấn đề:**
- Controller dùng `VIEW_PATIENT_IMAGES` nhưng seed data có `PATIENT_IMAGE_READ`

**BE Seed Data:**
```sql
('PATIENT_IMAGE_READ', 'PATIENT_IMAGE_READ', 'PATIENT_IMAGES', 'Xem hình ảnh và nhận xét bệnh nhân', 70, NULL, TRUE, NOW()),
('MANAGE_PATIENT_IMAGES', 'MANAGE_PATIENT_IMAGES', 'PATIENT_IMAGES', 'Quản lý hình ảnh (Upload/Cập nhật/Xóa/Thêm nhận xét)', 71, NULL, TRUE, NOW()),
```

**Khuyến nghị:** Sửa controller để dùng `PATIENT_IMAGE_READ` thay vì `VIEW_PATIENT_IMAGES`.

---

### 3. PERMISSIONS THIẾU TRONG SEED DATA

#### 3.1. Leave Management Module
| Permission | Mô tả | Controller sử dụng | Status |
|------------|-------|-------------------|--------|
| `VIEW_LEAVE_BALANCE_ALL` | Xem số dư phép của tất cả nhân viên | `AdminLeaveBalanceController.getAllEmployeesLeaveBalances()` | ❌ **THIẾU** |
| `ADJUST_LEAVE_BALANCE` | Điều chỉnh số dư phép | `AdminLeaveBalanceController.adjustLeaveBalance()` | ❌ **THIẾU** |

**Khuyến nghị:** Thêm vào seed data:
```sql
('VIEW_LEAVE_BALANCE_ALL', 'VIEW_LEAVE_BALANCE_ALL', 'LEAVE_MANAGEMENT', 'Xem số dư phép của tất cả nhân viên', 148, NULL, TRUE, NOW()),
('ADJUST_LEAVE_BALANCE', 'ADJUST_LEAVE_BALANCE', 'LEAVE_MANAGEMENT', 'Điều chỉnh số dư phép (Cộng/Trừ thủ công)', 149, NULL, TRUE, NOW())
```

#### 3.2. Schedule Management Module
**File:** `docs/files/working_schedule/service/EmployeeShiftRegistrationService.java`

| Permission | Mô tả | Service Method sử dụng | Status |
|------------|-------|----------------------|--------|
| `VIEW_AVAILABLE_SLOTS` | Xem suất part-time có sẵn | `getAvailableSlots()`, `getAvailableSlotsForDateRange()` | ❌ **THIẾU** |
| `CREATE_REGISTRATION` | Tạo đăng ký ca | `createRegistration()` | ❌ **THIẾU** |
| `VIEW_REGISTRATION_OWN` | Xem đăng ký ca của bản thân | `updateRegistration()`, `cancelRegistration()` | ❌ **THIẾU** |
| `UPDATE_REGISTRATIONS_ALL` | Cập nhật đăng ký ca của tất cả nhân viên | `updateRegistration()`, `cancelRegistration()`, `approveRegistration()` | ❌ **THIẾU** |
| `CANCEL_REGISTRATION_OWN` | Hủy đăng ký ca của bản thân | `cancelRegistration()` | ❌ **THIẾU** |

**Vấn đề:** 
- Services dùng các permissions không có trong seed data
- Seed data chỉ có `MANAGE_PART_TIME_REGISTRATIONS` và `MANAGE_FIXED_REGISTRATIONS`

**BE Seed Data (SCHEDULE_MANAGEMENT):**
```sql
('VIEW_SCHEDULE_ALL', 'VIEW_SCHEDULE_ALL', 'SCHEDULE_MANAGEMENT', 'Xem tất cả lịch làm việc nhân viên', 130, NULL, TRUE, NOW()),
('VIEW_SCHEDULE_OWN', 'VIEW_SCHEDULE_OWN', 'SCHEDULE_MANAGEMENT', 'Xem lịch làm việc của bản thân', 131, 'VIEW_SCHEDULE_ALL', TRUE, NOW()),
('MANAGE_WORK_SHIFTS', 'MANAGE_WORK_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Quản lý mẫu ca làm việc (Tạo/Cập nhật/Xóa)', 132, NULL, TRUE, NOW()),
('MANAGE_WORK_SLOTS', 'MANAGE_WORK_SLOTS', 'SCHEDULE_MANAGEMENT', 'Quản lý suất part-time (tạo/sửa/xóa)', 133, NULL, TRUE, NOW()),
('MANAGE_PART_TIME_REGISTRATIONS', 'MANAGE_PART_TIME_REGISTRATIONS', 'SCHEDULE_MANAGEMENT', 'Duyệt/từ chối đăng ký part-time', 134, NULL, TRUE, NOW()),
('MANAGE_FIXED_REGISTRATIONS', 'MANAGE_FIXED_REGISTRATIONS', 'SCHEDULE_MANAGEMENT', 'Quản lý đăng ký ca cố định (tạo/sửa/xóa)', 135, NULL, TRUE, NOW())
```

**Khuyến nghị:** 
- **Option 1:** Thêm các permissions vào seed data (granular approach):
  ```sql
  ('VIEW_AVAILABLE_SLOTS', 'VIEW_AVAILABLE_SLOTS', 'SCHEDULE_MANAGEMENT', 'Xem suất part-time có sẵn', 136, NULL, TRUE, NOW()),
  ('CREATE_REGISTRATION', 'CREATE_REGISTRATION', 'SCHEDULE_MANAGEMENT', 'Tạo đăng ký ca', 137, NULL, TRUE, NOW()),
  ('VIEW_REGISTRATION_OWN', 'VIEW_REGISTRATION_OWN', 'SCHEDULE_MANAGEMENT', 'Xem đăng ký ca của bản thân', 138, NULL, TRUE, NOW()),
  ('UPDATE_REGISTRATIONS_ALL', 'UPDATE_REGISTRATIONS_ALL', 'SCHEDULE_MANAGEMENT', 'Cập nhật đăng ký ca của tất cả nhân viên', 139, NULL, TRUE, NOW()),
  ('CANCEL_REGISTRATION_OWN', 'CANCEL_REGISTRATION_OWN', 'SCHEDULE_MANAGEMENT', 'Hủy đăng ký ca của bản thân', 140, NULL, TRUE, NOW())
  ```
- **Option 2:** Consolidate trong services để dùng `MANAGE_PART_TIME_REGISTRATIONS` và `MANAGE_FIXED_REGISTRATIONS` (như seed data hiện tại)

---

### 4. PERMISSIONS KHÔNG ĐƯỢC SỬ DỤNG (Dead Code)

#### 4.1. Permissions Dead Code - Service dùng permission đã bị xóa
**File:** `docs/files/working_schedule/service/WorkShiftService.java`

| Service Method | Permission hiện tại | Permission đúng (Seed Data) | Status |
|----------------|---------------------|----------------------------|--------|
| `getAllWorkShifts()` | `VIEW_WORK_SHIFTS` | ⚠️ **NÊN DÙNG** `VIEW_SCHEDULE_ALL` hoặc `VIEW_SCHEDULE_OWN` | ❌ **SAI** |
| `getWorkShiftById()` | `VIEW_WORK_SHIFTS` | ⚠️ **NÊN DÙNG** `VIEW_SCHEDULE_ALL` hoặc `VIEW_SCHEDULE_OWN` | ❌ **SAI** |

**Vấn đề:** 
- Seed data đã xóa `VIEW_WORK_SHIFTS` (dòng 659: "NOTE: VIEW_WORK_SHIFTS was removed during optimization")
- Nhưng `WorkShiftService` vẫn dùng `VIEW_WORK_SHIFTS` trong @PreAuthorize!

**BE Seed Data (SCHEDULE_MANAGEMENT):**
```sql
('VIEW_SCHEDULE_ALL', 'VIEW_SCHEDULE_ALL', 'SCHEDULE_MANAGEMENT', 'Xem tất cả lịch làm việc nhân viên', 130, NULL, TRUE, NOW()),
('VIEW_SCHEDULE_OWN', 'VIEW_SCHEDULE_OWN', 'SCHEDULE_MANAGEMENT', 'Xem lịch làm việc của bản thân', 131, 'VIEW_SCHEDULE_ALL', TRUE, NOW()),
('MANAGE_WORK_SHIFTS', 'MANAGE_WORK_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Quản lý mẫu ca làm việc (Tạo/Cập nhật/Xóa)', 132, NULL, TRUE, NOW()),
```

**Khuyến nghị:** 
- Sửa `WorkShiftService.getAllWorkShifts()` → dùng `VIEW_SCHEDULE_ALL` hoặc `VIEW_SCHEDULE_OWN`
- Sửa `WorkShiftService.getWorkShiftById()` → dùng `VIEW_SCHEDULE_ALL` hoặc `VIEW_SCHEDULE_OWN`

#### 4.2. Permissions được dùng trong Services nhưng không có trong Seed Data
**File:** `docs/files/working_schedule/service/EmployeeShiftRegistrationService.java`

| Service Method | Permission hiện tại | Permission trong Seed Data | Status |
|----------------|---------------------|----------------------------|--------|
| `getAvailableSlots()` | `VIEW_AVAILABLE_SLOTS` | ❌ **KHÔNG CÓ** | ❌ **THIẾU** |
| `getAvailableSlotsForDateRange()` | `VIEW_AVAILABLE_SLOTS` | ❌ **KHÔNG CÓ** | ❌ **THIẾU** |
| `createRegistration()` | `CREATE_REGISTRATION` | ❌ **KHÔNG CÓ** | ❌ **THIẾU** |
| `updateRegistration()` | `UPDATE_REGISTRATIONS_ALL` hoặc `VIEW_REGISTRATION_OWN` | ❌ **KHÔNG CÓ** | ❌ **THIẾU** |
| `cancelRegistration()` | `UPDATE_REGISTRATIONS_ALL` hoặc `CANCEL_REGISTRATION_OWN` | ❌ **KHÔNG CÓ** | ❌ **THIẾU** |

**Vấn đề:** 
- Services dùng các permissions không có trong seed data
- Seed data chỉ có `MANAGE_PART_TIME_REGISTRATIONS` và `MANAGE_FIXED_REGISTRATIONS`

**Khuyến nghị:** 
- **Option 1:** Thêm các permissions vào seed data:
  - `VIEW_AVAILABLE_SLOTS` - Xem suất part-time có sẵn
  - `CREATE_REGISTRATION` - Tạo đăng ký ca
  - `VIEW_REGISTRATION_OWN` - Xem đăng ký ca của bản thân
  - `UPDATE_REGISTRATIONS_ALL` - Cập nhật đăng ký ca của tất cả nhân viên
  - `CANCEL_REGISTRATION_OWN` - Hủy đăng ký ca của bản thân
- **Option 2:** Consolidate thành `MANAGE_PART_TIME_REGISTRATIONS` và `MANAGE_FIXED_REGISTRATIONS` (như seed data hiện tại)

---

## 🎯 KẾT LUẬN

### Tổng số vấn đề BE cần sửa:

1. **Controllers thiếu @PreAuthorize:** 10 controllers
2. **Controllers dùng sai permissions:** 3 controllers
3. **Services dùng permissions không có trong seed data:** 1 service (`EmployeeShiftRegistrationService`)
4. **Permissions thiếu trong seed data:** 8 permissions
   - `VIEW_LEAVE_TYPE` (dùng trong `AdminTimeOffTypeController`)
   - `MANAGE_LEAVE_TYPE` (dùng trong `AdminTimeOffTypeController`)
   - `VIEW_LEAVE_BALANCE_ALL` (dùng trong `AdminLeaveBalanceController`)
   - `ADJUST_LEAVE_BALANCE` (dùng trong `AdminLeaveBalanceController`)
   - `VIEW_AVAILABLE_SLOTS` (dùng trong `EmployeeShiftRegistrationService`)
   - `CREATE_REGISTRATION` (dùng trong `EmployeeShiftRegistrationService`)
   - `VIEW_REGISTRATION_OWN` (dùng trong `EmployeeShiftRegistrationService`)
   - `UPDATE_REGISTRATIONS_ALL` (dùng trong `EmployeeShiftRegistrationService`)
   - `CANCEL_REGISTRATION_OWN` (dùng trong `EmployeeShiftRegistrationService`)
5. **Permissions dead code:** 1 permission (`VIEW_WORK_SHIFTS` - dùng trong `WorkShiftService` nhưng đã bị xóa khỏi seed data)

### Tổng số permissions FE cần sửa:

**~50+ permissions** (đã liệt kê ở phần trên)

### Tác động:
- **HIGH**: Các chức năng CRUD sẽ không hoạt động đúng nếu FE vẫn dùng granular permissions
- **HIGH**: BE controllers thiếu @PreAuthorize = security risk
- **MEDIUM**: Một số chức năng warehouse và leave management sẽ thiếu permissions
- **LOW**: UI/UX có thể bị ảnh hưởng nếu không cập nhật permission checks

### Khuyến nghị cho BE Team:
1. **Ưu tiên cao:** Thêm @PreAuthorize cho tất cả controllers thiếu (10 controllers)
2. **Ưu tiên cao:** Thêm permissions thiếu vào seed data (8 permissions):
   - `VIEW_LEAVE_TYPE`, `MANAGE_LEAVE_TYPE`
   - `VIEW_LEAVE_BALANCE_ALL`, `ADJUST_LEAVE_BALANCE`
   - `VIEW_AVAILABLE_SLOTS`, `CREATE_REGISTRATION`, `VIEW_REGISTRATION_OWN`, `UPDATE_REGISTRATIONS_ALL`, `CANCEL_REGISTRATION_OWN`
3. **Ưu tiên cao:** Sửa permissions sai trong `AdminTimeOffTypeController` và `AdminLeaveBalanceController`
4. **Ưu tiên cao:** Sửa `WorkShiftService` để dùng `VIEW_SCHEDULE_ALL`/`VIEW_SCHEDULE_OWN` thay vì `VIEW_WORK_SHIFTS` (dead code)
5. **Ưu tiên trung bình:** Sửa `PatientImageController` để dùng `PATIENT_IMAGE_READ` thay vì `VIEW_PATIENT_IMAGES`
6. **Ưu tiên trung bình:** Quyết định approach cho `EmployeeShiftRegistrationService`:
   - Option 1: Thêm granular permissions vào seed data
   - Option 2: Consolidate services để dùng `MANAGE_PART_TIME_REGISTRATIONS` và `MANAGE_FIXED_REGISTRATIONS`

### Khuyến nghị cho FE Team:
1. **Ưu tiên cao:** Sửa tất cả CRUD permissions (MANAGE_X pattern)
2. **Ưu tiên trung bình:** Thêm warehouse và leave management permissions
3. **Ưu tiên thấp:** Clean up deprecated permissions

