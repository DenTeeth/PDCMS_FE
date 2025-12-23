# BÁO CÁO PERMISSIONS FE: SO SÁNH VÀ CHỈNH SỬA

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Phân tích chi tiết sự khác biệt về permissions giữa Frontend và Backend, và các thay đổi cần thiết cho FE

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

#### 2.3. APPOINTMENT Module
| BE Permission | Mô tả | Status |
|---------------|-------|--------|
| `UPDATE_APPOINTMENT_STATUS` | Cập nhật trạng thái (Check-in/In-progress/Completed) | ❌ **THIẾU** |

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

## ✅ CHECKLIST SỬA CHỮA CHO FE

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

- [ ] **2.3. Add Appointment Status permission:**
  - [ ] Thêm `UPDATE_APPOINTMENT_STATUS`

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

## 🎯 TỔNG KẾT

### Tổng số permissions FE cần sửa:
**~50+ permissions** cần được consolidate hoặc thay thế

### Tác động:
- **HIGH**: Các chức năng CRUD sẽ không hoạt động đúng nếu FE vẫn dùng granular permissions
- **MEDIUM**: Một số chức năng warehouse và leave management sẽ thiếu permissions
- **LOW**: UI/UX có thể bị ảnh hưởng nếu không cập nhật permission checks

### Khuyến nghị cho FE Team:
1. **Ưu tiên cao:** Sửa tất cả CRUD permissions (MANAGE_X pattern)
2. **Ưu tiên trung bình:** Thêm warehouse và leave management permissions
3. **Ưu tiên thấp:** Clean up deprecated permissions


