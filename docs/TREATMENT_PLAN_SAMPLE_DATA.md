# Treatment Plan Sample Data - Happy Cases

> Data mẫu để test quy trình tạo treatment plan và đặt lịch từ treatment plan trên FE

---

## 📋 Treatment Plans Mẫu

### 1. Treatment Plan: Niềng răng mắc cài kim loại

**Thông tin cơ bản:**
- **Tên lộ trình:** Lộ trình Niềng răng Mắc cài Kim loại
- **Mã lộ trình:** PLAN-20260115-001
- **Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
- **Bác sĩ tạo:** BS Lê Anh Khoa (EMP001) - Có specialization Chỉnh nha (spec 1)
- **Trạng thái:** IN_PROGRESS
- **Trạng thái duyệt:** APPROVED
- **Ngày bắt đầu:** 2026-01-15
- **Ngày kết thúc dự kiến:** 2028-01-15
- **Tổng giá:** 30,000,000 ₫
- **Giảm giá:** 0 ₫
- **Thành tiền:** 30,000,000 ₫
- **Hình thức thanh toán:** INSTALLMENT (Trả góp)

**Các giai đoạn:**

**Giai đoạn 1: Khám & Chuẩn bị** (COMPLETED)
- Khám & Tư vấn Chỉnh nha (ORTHO_CONSULT) - COMPLETED
- Chụp Phim Chỉnh nha (ORTHO_FILMS) - COMPLETED

**Giai đoạn 2: Gắn mắc cài** (IN_PROGRESS)
- Gắn mắc cài kim loại/sứ (ORTHO_BRACES_ON) - COMPLETED

**Giai đoạn 3: Điều chỉnh định kỳ** (PENDING)
- Điều chỉnh lần 1 - READY_FOR_BOOKING
- Điều chỉnh lần 2 - READY_FOR_BOOKING
- Điều chỉnh lần 3 - READY_FOR_BOOKING
- Điều chỉnh lần 4 - READY_FOR_BOOKING
- Điều chỉnh lần 5 - READY_FOR_BOOKING
- Điều chỉnh lần 6 - READY_FOR_BOOKING
- Điều chỉnh lần 7 - READY_FOR_BOOKING
- Điều chỉnh lần 8 - READY_FOR_BOOKING

**Giai đoạn 4: Tháo niềng & Duy trì** (PENDING)
- Tháo mắc cài (ORTHO_BRACES_OFF) - READY_FOR_BOOKING
- Làm hàm duy trì (ORTHO_RETAINER_REMOV) - READY_FOR_BOOKING

---

### 2. Treatment Plan: Cấy ghép Implant Hàn Quốc

**Thông tin cơ bản:**
- **Tên lộ trình:** Lộ trình Cấy ghép Implant Hàn Quốc (Osstem)
- **Mã lộ trình:** PLAN-20260120-001
- **Bệnh nhân:** BN-1002 - Phạm Văn Phong
- **Bác sĩ tạo:** BS Junya Ota (EMP004) - Có specialization Phục hồi răng (spec 4)
- **Trạng thái:** IN_PROGRESS
- **Trạng thái duyệt:** APPROVED
- **Ngày bắt đầu:** 2026-01-20
- **Ngày kết thúc dự kiến:** 2026-07-20
- **Tổng giá:** 19,000,000 ₫
- **Giảm giá:** 0 ₫
- **Thành tiền:** 19,000,000 ₫
- **Hình thức thanh toán:** FULL (Trả một lần)

**Các giai đoạn:**

**Giai đoạn 1: Khám & Chẩn đoán hình ảnh** (COMPLETED)
- Khám & Tư vấn Implant (IMPL_CONSULT) - COMPLETED
- Chụp CT Cone Beam (IMPL_CT_SCAN) - COMPLETED

**Giai đoạn 2: Phẫu thuật cắm Implant** (IN_PROGRESS)
- Phẫu thuật đặt trụ Implant Hàn Quốc (IMPL_SURGERY_KR) - COMPLETED
- Gắn trụ lành thương (IMPL_HEALING) - COMPLETED

**Giai đoạn 3: Làm & Gắn răng sứ** (PENDING)
- Lấy dấu Implant (IMPL_IMPRESSION) - READY_FOR_BOOKING
- Mão sứ Zirconia trên Implant (IMPL_CROWN_ZIR) - READY_FOR_BOOKING

---

### 3. Treatment Plan: Bọc răng sứ Cercon HT (đơn giản)

**Thông tin cơ bản:**
- **Tên lộ trình:** Lộ trình Bọc răng sứ Cercon HT - 1 răng
- **Mã lộ trình:** PLAN-20260125-001
- **Bệnh nhân:** BN-1003 - Nguyễn Tuấn Anh
- **Bác sĩ tạo:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Trạng thái:** PENDING
- **Trạng thái duyệt:** APPROVED
- **Ngày bắt đầu:** 2026-01-25
- **Ngày kết thúc dự kiến:** 2026-01-29
- **Tổng giá:** 3,500,000 ₫
- **Giảm giá:** 0 ₫
- **Thành tiền:** 3,500,000 ₫
- **Hình thức thanh toán:** FULL (Trả một lần)

**Các giai đoạn:**

**Giai đoạn 1: Mài răng, Lấy dấu & Gắn sứ** (PENDING)
- Bọc răng sứ Cercon HT (CROWN_ZIR_CERCON) - READY_FOR_BOOKING
- Gắn mão sứ (PROS_CEMENT) - READY_FOR_BOOKING

---

### 4. Treatment Plan: Điều trị tủy răng sau

**Thông tin cơ bản:**
- **Tên lộ trình:** Lộ trình Điều trị tủy răng sau
- **Mã lộ trình:** PLAN-20260130-001
- **Bệnh nhân:** BN-1004 - Mít tơ Bít
- **Bác sĩ tạo:** BS Trịnh Công Thái (EMP002) - Có specialization Nội nha (spec 2)
- **Trạng thái:** PENDING
- **Trạng thái duyệt:** APPROVED
- **Ngày bắt đầu:** 2026-01-30
- **Ngày kết thúc dự kiến:** 2026-02-02
- **Tổng giá:** 2,000,000 ₫
- **Giảm giá:** 0 ₫
- **Thành tiền:** 2,000,000 ₫
- **Hình thức thanh toán:** FULL (Trả một lần)

**Các giai đoạn:**

**Giai đoạn 1: Điều trị tủy răng sau** (PENDING)
- Điều trị tủy răng sau (ENDO_TREAT_POST) - READY_FOR_BOOKING

---

### 5. Treatment Plan: Bọc sứ sau điều trị tủy

**Thông tin cơ bản:**
- **Tên lộ trình:** Lộ trình Bọc sứ sau điều trị tủy
- **Mã lộ trình:** PLAN-20260201-001
- **Bệnh nhân:** BN-1005 - Trần Văn Nam
- **Bác sĩ tạo:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Trạng thái:** PENDING
- **Trạng thái duyệt:** APPROVED
- **Ngày bắt đầu:** 2026-02-01
- **Ngày kết thúc dự kiến:** 2026-02-05
- **Tổng giá:** 4,500,000 ₫
- **Giảm giá:** 0 ₫
- **Thành tiền:** 4,500,000 ₫
- **Hình thức thanh toán:** FULL (Trả một lần)

**Các giai đoạn:**

**Giai đoạn 1: Đóng chốt + Bọc răng sứ Cercon HT** (PENDING)
- Đóng chốt tái tạo cùi răng (ENDO_POST_CORE) - READY_FOR_BOOKING
- Bọc răng sứ Cercon HT (CROWN_ZIR_CERCON) - READY_FOR_BOOKING
- Gắn mão sứ (PROS_CEMENT) - READY_FOR_BOOKING

---

## 📅 Appointments từ Treatment Plans

### Appointment từ Treatment Plan #1 (Niềng răng)

**Appointment 1: Điều chỉnh lần 1**
- **Mã lịch hẹn:** APT-20260215-001
- **Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
- **Bác sĩ:** BS Lê Anh Khoa (EMP001)
- **Phòng:** P-01 (GHE251103001)
- **Thời gian:** 2026-02-15 09:00 - 09:45
- **Dịch vụ:** Điều chỉnh niềng răng (ORTHO_ADJUST)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID 6 (Điều chỉnh lần 1)

**Appointment 2: Điều chỉnh lần 2**
- **Mã lịch hẹn:** APT-20260315-001
- **Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
- **Bác sĩ:** BS Lê Anh Khoa (EMP001)
- **Phòng:** P-01 (GHE251103001)
- **Thời gian:** 2026-03-15 09:00 - 09:45
- **Dịch vụ:** Điều chỉnh niềng răng (ORTHO_ADJUST)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID 7 (Điều chỉnh lần 2)

---

### Appointment từ Treatment Plan #2 (Implant)

**Appointment 1: Lấy dấu Implant**
- **Mã lịch hẹn:** APT-20260420-001
- **Bệnh nhân:** BN-1002 - Phạm Văn Phong
- **Bác sĩ:** BS Junya Ota (EMP004) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-04 (GHE251103004) - Phòng Implant
- **Thời gian:** 2026-04-20 10:00 - 10:30
- **Dịch vụ:** Lấy dấu Implant (IMPL_IMPRESSION)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 3

**Appointment 2: Gắn mão sứ**
- **Mã lịch hẹn:** APT-20260427-001
- **Bệnh nhân:** BN-1002 - Phạm Văn Phong
- **Bác sĩ:** BS Junya Ota (EMP004) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-04 (GHE251103004) - Phòng Implant
- **Thời gian:** 2026-04-27 14:00 - 14:45
- **Dịch vụ:** Mão sứ Zirconia trên Implant (IMPL_CROWN_ZIR)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 3

---

### Appointment từ Treatment Plan #3 (Bọc sứ đơn giản)

**Appointment 1: Mài răng và Lấy dấu**
- **Mã lịch hẹn:** APT-20260125-001
- **Bệnh nhân:** BN-1003 - Nguyễn Tuấn Anh
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-02 (GHE251103002)
- **Thời gian:** 2026-01-25 10:00 - 11:00
- **Dịch vụ:** Bọc răng sứ Cercon HT (CROWN_ZIR_CERCON)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 1

**Appointment 2: Gắn sứ**
- **Mã lịch hẹn:** APT-20260129-001
- **Bệnh nhân:** BN-1003 - Nguyễn Tuấn Anh
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-02 (GHE251103002)
- **Thời gian:** 2026-01-29 14:00 - 14:30
- **Dịch vụ:** Gắn mão sứ (PROS_CEMENT)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 1

---

### Appointment từ Treatment Plan #4 (Điều trị tủy)

**Appointment 1: Điều trị tủy**
- **Mã lịch hẹn:** APT-20260130-001
- **Bệnh nhân:** BN-1004 - Mít tơ Bít
- **Bác sĩ:** BS Trịnh Công Thái (EMP002) - Có specialization Nội nha (spec 2)
- **Phòng:** P-01 (GHE251103001)
- **Thời gian:** 2026-01-30 09:00 - 10:15
- **Dịch vụ:** Điều trị tủy răng sau (ENDO_TREAT_POST)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 1

---

### Appointment từ Treatment Plan #5 (Bọc sứ sau điều trị tủy)

**Appointment 1: Đóng chốt**
- **Mã lịch hẹn:** APT-20260201-001
- **Bệnh nhân:** BN-1005 - Trần Văn Nam
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-02 (GHE251103002)
- **Thời gian:** 2026-02-01 10:00 - 10:45
- **Dịch vụ:** Đóng chốt tái tạo cùi răng (ENDO_POST_CORE)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 1

**Appointment 2: Mài răng và Lấy dấu**
- **Mã lịch hẹn:** APT-20260202-001
- **Bệnh nhân:** BN-1005 - Trần Văn Nam
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-02 (GHE251103002)
- **Thời gian:** 2026-02-02 14:00 - 15:00
- **Dịch vụ:** Bọc răng sứ Cercon HT (CROWN_ZIR_CERCON)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 1

**Appointment 3: Gắn sứ**
- **Mã lịch hẹn:** APT-20260205-001
- **Bệnh nhân:** BN-1005 - Trần Văn Nam
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Phòng:** P-02 (GHE251103002)
- **Thời gian:** 2026-02-05 10:00 - 10:30
- **Dịch vụ:** Gắn mão sứ (PROS_CEMENT)
- **Trạng thái:** SCHEDULED
- **Treatment Plan Item:** Item ID từ Phase 1

---

## 🎯 Test Scenarios trên FE

### Scenario 1: Tạo Treatment Plan từ Template

1. **Chọn Template:** TPL_ORTHO_METAL (Niềng răng mắc cài kim loại)
2. **Chọn Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
3. **Chọn Bác sĩ:** BS Lê Anh Khoa (EMP001) - Có specialization Chỉnh nha (spec 1)
   - **Lưu ý:** Sau khi chọn bác sĩ, danh sách dịch vụ sẽ được filter theo specialization của bác sĩ
   - Chỉ hiển thị các dịch vụ có specialization phù hợp với bác sĩ
4. **Xem Preview:** Template sẽ tạo 4 phases với các services tương ứng
5. **Điều chỉnh (nếu cần):** Có thể thêm/bớt services, điều chỉnh giá
6. **Tạo Treatment Plan:** 
   - **Custom Plan:** `status = null`, `approval_status = DRAFT` (cần gửi duyệt)
   - **Template Plan:** `status = PENDING`, `approval_status = APPROVED` (auto-approved)

### Scenario 2: Duyệt Treatment Plan

1. **Xem Treatment Plan:** PLAN-20251115-001
2. **Review:** Manager xem chi tiết các phases và services
3. **Duyệt:** Approval Status = APPROVED
4. **Sau khi duyệt:** Status = PENDING, các items có status = READY_FOR_BOOKING

### Scenario 3: Đặt lịch từ Treatment Plan Item

1. **Xem Treatment Plan:** PLAN-20260115-001
2. **Chọn Item:** Điều chỉnh lần 1 (status = READY_FOR_BOOKING)
3. **Chọn "Đặt lịch":** Mở dialog đặt lịch
4. **Chọn Bác sĩ:** BS Lê Anh Khoa (EMP001) - Tự động chọn vì là bác sĩ tạo plan
5. **Chọn Phòng:** P-01 (GHE251103001)
6. **Chọn Thời gian:** 2026-02-15 09:00 (thời gian tương lai)
7. **Xác nhận:** Tạo appointment, item status = SCHEDULED

### Scenario 4: Xem Appointments từ Treatment Plan

1. **Xem Treatment Plan:** PLAN-20260115-001
2. **Xem Tab "Lịch hẹn":** Hiển thị tất cả appointments liên quan
3. **Filter:** Có thể filter theo phase, status
4. **Chi tiết:** Click vào appointment để xem chi tiết

### Scenario 5: Hoàn thành Treatment Plan Item

1. **Xem Appointment:** APT-20260215-001
2. **Check-in:** Status = CHECKED_IN
3. **Bắt đầu:** Status = IN_PROGRESS
4. **Hoàn thành:** Status = COMPLETED
5. **Cập nhật Treatment Plan Item:** Item status = COMPLETED, completed_at = now()

---

## 📝 Notes

- Tất cả data mẫu này là **happy cases** - không có lỗi
- **Bác sĩ được chọn phải có specialization phù hợp** với template và dịch vụ:
  - **BS Lê Anh Khoa (EMP001):** Chỉnh nha (spec 1), Nha chu (spec 3), Phục hồi răng (spec 4)
  - **BS Trịnh Công Thái (EMP002):** Nội nha (spec 2), Răng thẩm mỹ (spec 7)
  - **BS Junya Ota (EMP004):** Phục hồi răng (spec 4), Phẫu thuật hàm mặt (spec 5)
- **Danh sách dịch vụ được filter tự động** theo specialization của bác sĩ đã chọn
- **Thời gian:** Tất cả dates đều ở tương lai (2026-01-XX trở đi) để có thể test booking
- Appointments được tạo từ treatment plan items có **status = READY_FOR_BOOKING**
- Sau khi tạo appointment, item status sẽ chuyển thành **SCHEDULED**
- Sau khi hoàn thành appointment, item status sẽ chuyển thành **COMPLETED**

