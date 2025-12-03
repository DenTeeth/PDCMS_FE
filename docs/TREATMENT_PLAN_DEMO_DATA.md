# Treatment Plan Demo Data - FE Testing

> Data mẫu chi tiết để demo quy trình tạo treatment plan trên FE
> 
> **2 Trường hợp:**
> 1. **Tạo lộ trình mới** (Custom Plan) - Bác sĩ tạo từ đầu
> 2. **Lấy từ template** (Template-based Plan) - Bác sĩ chọn template và tùy chỉnh

---

## 📋 Trường hợp 1: Tạo Lộ Trình Mới (Custom Plan)

### Demo Case 1: Điều trị tủy răng sau (Custom)

**Bước 1: Chọn bệnh nhân**
- **Bệnh nhân:** BN-1004 - Mít tơ Bít
- **Mã bệnh nhân:** BN-1004

**Bước 2: Thông tin lộ trình**
- **Tên lộ trình:** Lộ trình Điều trị tủy răng sau - Răng 36
- **Bác sĩ tạo:** BS Trịnh Công Thái (EMP002) - Có specialization Nội nha (spec 2)
- **Hình thức thanh toán:** FULL (Trả một lần)
- **Giảm giá:** 0 ₫
- **Ngày bắt đầu:** 2026-02-01 (tùy chọn)
- **Ngày kết thúc dự kiến:** 2026-02-04 (tùy chọn)

**Bước 3: Quản lý Giai đoạn**
- **Giai đoạn 1:** Điều trị tủy răng sau
  - Tên: "Điều trị tủy răng sau"
  - (Không có field "Thời gian dự kiến (ngày)" - đã bỏ)

**Bước 4: Quản lý Hạng mục**

**Giai đoạn 1: Điều trị tủy răng sau**
- **Hạng mục 1:**
  - **Dịch vụ:** Điều trị tủy răng sau (ENDO_TREAT_POST)
  - **Giá mặc định:** 2,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 2,000,000 ₫
  - **Lưu ý:** Dịch vụ này sẽ được filter tự động vì BS Trịnh Công Thái có specialization Nội nha (spec 2)

**Tổng giá:** 2,000,000 ₫

**Bước 5: Xem lại và Xác nhận**
- Xem lại tất cả thông tin
- Click "Tạo lộ trình"
- **Kết quả:** Treatment plan được tạo với `status = null`, `approval_status = DRAFT`
- **Lưu ý:** Sau khi tạo, bác sĩ cần click "Gửi duyệt" để chuyển sang `approval_status = PENDING_REVIEW`

**Bước 6: Duyệt Treatment Plan (Admin/Manager)**
- Admin/Manager duyệt plan → `approval_status = APPROVED`
- Plan sẵn sàng để tạo appointment

**Bước 7: Tạo Appointment từ Treatment Plan**
- Receptionist/Admin tạo appointment từ plan
- Chọn bệnh nhân: BN-1004 - Mít tơ Bít
- Chọn bác sĩ: BS Trịnh Công Thái (EMP002)
- Chọn dịch vụ từ plan: Điều trị tủy răng sau (ENDO_TREAT_POST)
- Đặt lịch: 2026-02-01 14:00:00 (theo ngày bắt đầu trong plan)

**Bước 8: Tạo Clinical Record (sau khi khám)**
- Xem chi tiết: **@docs/CLINICAL_RECORD_DEMO_DATA.md** - Case 2: Điều trị tủy răng sau
- Procedure "Điều trị tủy răng sau" sẽ link với **patient_plan_item_id** từ treatment plan này

---

### Demo Case 2: Bọc răng sứ Cercon HT (Custom)

**Bước 1: Chọn bệnh nhân**
- **Bệnh nhân:** BN-1003 - Nguyễn Tuấn Anh
- **Mã bệnh nhân:** BN-1003

**Bước 2: Thông tin lộ trình**
- **Tên lộ trình:** Lộ trình Bọc răng sứ Cercon HT - Răng 16
- **Bác sĩ tạo:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Hình thức thanh toán:** FULL (Trả một lần)
- **Giảm giá:** 0 ₫
- **Ngày bắt đầu:** 2026-02-05
- **Ngày kết thúc dự kiến:** 2026-02-09

**Bước 3: Quản lý Giai đoạn**
- **Giai đoạn 1:** Mài răng, Lấy dấu & Gắn sứ
  - Tên: "Giai đoạn 1: Mài răng, Lấy dấu & Gắn sứ"

**Bước 4: Quản lý Hạng mục**

**Giai đoạn 1: Mài răng, Lấy dấu & Gắn sứ**
- **Hạng mục 1:**
  - **Dịch vụ:** Mão răng toàn sứ Cercon HT (CROWN_ZIR_CERCON)
  - **Giá mặc định:** 5,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 5,000,000 ₫

- **Hạng mục 2:**
  - **Dịch vụ:** Gắn sứ / Thử sứ (PROS_CEMENT)
  - **Giá mặc định:** 0 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 0 ₫

**Tổng giá:** 5,000,000 ₫

**Bước 5: Xem lại và Xác nhận**
- Xem lại tất cả thông tin
- Click "Tạo lộ trình"
- **Kết quả:** Treatment plan được tạo với `status = null`, `approval_status = DRAFT`
- **Lưu ý:** Sau khi tạo, bác sĩ cần click "Gửi duyệt" để chuyển sang `approval_status = PENDING_REVIEW`

**Bước 6: Duyệt Treatment Plan (Admin/Manager)**
- Admin/Manager duyệt plan → `approval_status = APPROVED`
- Plan sẵn sàng để tạo appointment

**Bước 7: Tạo Appointment từ Treatment Plan**
- Receptionist/Admin tạo appointment từ plan
- Chọn bệnh nhân: BN-1003 - Nguyễn Tuấn Anh
- Chọn bác sĩ: BS Lê Anh Khoa (EMP001)
- Chọn dịch vụ từ plan: Mão răng toàn sứ Cercon HT (CROWN_ZIR_CERCON), Gắn sứ / Thử sứ (PROS_CEMENT)
- Đặt lịch: 2026-02-05 09:00:00 (theo ngày bắt đầu trong plan)

**Bước 8: Tạo Clinical Record (sau khi khám)**
- Xem chi tiết: **@docs/CLINICAL_RECORD_DEMO_DATA.md** - Case 3: Bọc răng sứ Cercon HT
- Procedures sẽ link với **patient_plan_item_id** từ treatment plan này

---

## 📋 Trường hợp 2: Lấy Lộ Trình Từ Template

### Demo Case 1: Niềng răng mắc cài kim loại (Từ Template)

**Bước 1: Chọn bệnh nhân**
- **Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
- **Mã bệnh nhân:** BN-1001

**Bước 2: Chọn Template**
- **Chế độ tạo:** Template
- **Template:** TPL_ORTHO_METAL - "Niềng răng mắc cài kim loại trọn gói 2 năm"
- **Mô tả:** "Gói điều trị chỉnh nha toàn diện với mắc cài kim loại, bao gồm 24 lần tái khám siết niềng định kỳ."
- **Thông tin template:**
  - 4 giai đoạn
  - 4 loại dịch vụ
  - Specialization: Chỉnh nha (spec 1)
  - Giá template: 30,000,000 ₫

**Bước 3: Thông tin lộ trình**
- **Tên lộ trình:** Lộ trình Niềng răng Mắc cài Kim loại - BN-1001
- **Bác sĩ tạo:** BS Lê Anh Khoa (EMP001) - Có specialization Chỉnh nha (spec 1)
- **Hình thức thanh toán:** INSTALLMENT (Trả góp)
- **Giảm giá:** 0 ₫
- **Ngày bắt đầu:** 2026-02-10
- **Ngày kết thúc dự kiến:** 2028-02-10

**Bước 4: Quản lý Giai đoạn** (Tự động load từ template)

**Giai đoạn 1: Khám & Chuẩn bị**
- Tên: "Giai đoạn 1: Khám & Chuẩn bị"

**Giai đoạn 2: Gắn mắc cài**
- Tên: "Giai đoạn 2: Gắn mắc cài"

**Giai đoạn 3: Điều chỉnh định kỳ (8 tháng)**
- Tên: "Giai đoạn 3: Điều chỉnh định kỳ (8 tháng)"

**Giai đoạn 4: Tháo niềng & Duy trì**
- Tên: "Giai đoạn 4: Tháo niềng & Duy trì"

**Bước 5: Quản lý Hạng mục** (Tự động load từ template)

**Giai đoạn 1: Khám & Chuẩn bị** (2 hạng mục)
- **Hạng mục 1:**
  - **Dịch vụ:** Khám & Tư vấn Chỉnh nha (ORTHO_CONSULT)
  - **Giá mặc định:** 0 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 0 ₫

- **Hạng mục 2:**
  - **Dịch vụ:** Chụp Phim Chỉnh nha (ORTHO_FILMS)
  - **Giá mặc định:** 500,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 500,000 ₫

**Giai đoạn 2: Gắn mắc cài** (1 hạng mục)
- **Hạng mục 1:**
  - **Dịch vụ:** Gắn mắc cài kim loại/sứ (ORTHO_BRACES_ON)
  - **Giá mặc định:** 5,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 5,000,000 ₫

**Giai đoạn 3: Điều chỉnh định kỳ (8 tháng)** (1 hạng mục với quantity = 8)
- **Hạng mục 1:**
  - **Dịch vụ:** Điều chỉnh niềng răng (ORTHO_ADJUST)
  - **Giá mặc định:** 500,000 ₫
  - **Số lượng:** 8
  - **Giá (VND):** 500,000 ₫ × 8 = 4,000,000 ₫

**Giai đoạn 4: Tháo niềng & Duy trì** (2 hạng mục)
- **Hạng mục 1:**
  - **Dịch vụ:** Tháo mắc cài (ORTHO_BRACES_OFF)
  - **Giá mặc định:** 2,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 2,000,000 ₫

- **Hạng mục 2:**
  - **Dịch vụ:** Làm hàm duy trì (ORTHO_RETAINER_REMOV)
  - **Giá mặc định:** 3,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 3,000,000 ₫

**Tổng giá:** 14,500,000 ₫ (có thể điều chỉnh)

**Bước 6: Xem lại và Xác nhận**
- Xem lại tất cả phases và items
- Có thể tùy chỉnh thêm/bớt items nếu cần
- Click "Tạo lộ trình"
- **Kết quả:** Treatment plan được tạo từ template với `status = PENDING`, `approval_status = APPROVED` (template plans được auto-approved)
- **Lưu ý:** Plan từ template có thể sử dụng ngay, không cần duyệt

**Bước 7: Tạo Appointments từ Treatment Plan**
- **Appointment 1:** Khám & Chuẩn bị (Phase 1)
  - Dịch vụ: ORTHO_CONSULT, ORTHO_FILMS
  - Ngày: 2026-02-10 09:00:00
- **Appointment 2:** Gắn mắc cài (Phase 2)
  - Dịch vụ: ORTHO_BRACES_ON
  - Ngày: 2026-02-17 09:00:00
- **Appointment 3-10:** Điều chỉnh định kỳ (Phase 3) - 8 lần
  - Dịch vụ: ORTHO_ADJUST (mỗi lần)
  - Ngày: Mỗi 4-6 tuần một lần (ví dụ: 2026-03-15, 2026-04-12, ...)
- **Appointment 11:** Tháo niềng & Duy trì (Phase 4)
  - Dịch vụ: ORTHO_BRACES_OFF, ORTHO_RETAINER_REMOV
  - Ngày: 2028-02-10 09:00:00

**Bước 8: Tạo Clinical Records cho các Appointments**
- **Appointment đầu tiên:** Xem **@docs/CLINICAL_RECORD_DEMO_DATA.md** - Case 4: Tái khám niềng răng (cho appointment điều chỉnh)
- Procedures sẽ link với **patient_plan_item_id** từ treatment plan này

---

### Demo Case 2: Điều trị tủy răng sau (Từ Template)

**Bước 1: Chọn bệnh nhân**
- **Bệnh nhân:** BN-1004 - Mít tơ Bít
- **Mã bệnh nhân:** BN-1004

**Bước 2: Chọn Template**
- **Chế độ tạo:** Template
- **Template:** TPL_ENDO_TREATMENT - "Điều trị tủy răng sau"
- **Mô tả:** "Gói điều trị tủy răng tiền cối/răng cối, bao gồm lấy tủy, làm sạch và trám bít ống tủy."
- **Thông tin template:**
  - 1 giai đoạn
  - 1 loại dịch vụ
  - Specialization: Nội nha (spec 2)
  - Giá template: 2,000,000 ₫

**Bước 3: Thông tin lộ trình**
- **Tên lộ trình:** Lộ trình Điều trị tủy răng sau - Răng 36
- **Bác sĩ tạo:** BS Trịnh Công Thái (EMP002) - Có specialization Nội nha (spec 2)
- **Hình thức thanh toán:** FULL (Trả một lần)
- **Giảm giá:** 0 ₫
- **Ngày bắt đầu:** 2026-02-01
- **Ngày kết thúc dự kiến:** 2026-02-04

**Bước 4: Quản lý Giai đoạn** (Tự động load từ template)

**Giai đoạn 1: Điều trị tủy răng sau**
- Tên: "Điều trị tủy răng sau"

**Bước 5: Quản lý Hạng mục** (Tự động load từ template)

**Giai đoạn 1: Điều trị tủy răng sau** (1 hạng mục)
- **Hạng mục 1:**
  - **Dịch vụ:** Điều trị tủy răng sau (ENDO_TREAT_POST)
  - **Giá mặc định:** 2,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 2,000,000 ₫

**Tổng giá:** 2,000,000 ₫

**Bước 6: Xem lại và Xác nhận**
- Xem lại tất cả thông tin
- Click "Tạo lộ trình"
- **Kết quả:** Treatment plan được tạo từ template với `status = PENDING`, `approval_status = APPROVED`

**Bước 7: Tạo Appointment từ Treatment Plan**
- Receptionist/Admin tạo appointment từ plan
- Chọn bệnh nhân: BN-1004 - Mít tơ Bít
- Chọn bác sĩ: BS Trịnh Công Thái (EMP002)
- Chọn dịch vụ từ plan: Điều trị tủy răng sau (ENDO_TREAT_POST)
- Đặt lịch: 2026-02-01 14:00:00

**Bước 8: Tạo Clinical Record (sau khi khám)**
- Xem chi tiết: **@docs/CLINICAL_RECORD_DEMO_DATA.md** - Case 2: Điều trị tủy răng sau
- Procedure "Điều trị tủy răng sau" sẽ link với **patient_plan_item_id** từ treatment plan này

---

### Demo Case 3: Bọc sứ sau điều trị tủy (Từ Template)

**Bước 1: Chọn bệnh nhân**
- **Bệnh nhân:** BN-1005 - Trần Văn Nam
- **Mã bệnh nhân:** BN-1005

**Bước 2: Chọn Template**
- **Chế độ tạo:** Template
- **Template:** TPL_CROWN_AFTER_ENDO - "Bọc sứ sau điều trị tủy"
- **Mô tả:** "Gói bọc răng sứ Cercon HT cho răng đã điều trị tủy, bao gồm đóng chốt tái tạo cùi răng, mài răng, lấy dấu và gắn sứ."
- **Thông tin template:**
  - 1 giai đoạn
  - 3 loại dịch vụ
  - Specialization: Phục hồi răng (spec 4)
  - Giá template: 4,500,000 ₫

**Bước 3: Thông tin lộ trình**
- **Tên lộ trình:** Lộ trình Bọc sứ sau điều trị tủy - Răng 16
- **Bác sĩ tạo:** BS Lê Anh Khoa (EMP001) - Có specialization Phục hồi răng (spec 4)
- **Hình thức thanh toán:** FULL (Trả một lần)
- **Giảm giá:** 0 ₫
- **Ngày bắt đầu:** 2026-02-05
- **Ngày kết thúc dự kiến:** 2026-02-09

**Bước 4: Quản lý Giai đoạn** (Tự động load từ template)

**Giai đoạn 1: Đóng chốt + Bọc răng sứ Cercon HT**
- Tên: "Đóng chốt + Bọc răng sứ Cercon HT"

**Bước 5: Quản lý Hạng mục** (Tự động load từ template)

**Giai đoạn 1: Đóng chốt + Bọc răng sứ Cercon HT** (3 hạng mục)
- **Hạng mục 1:**
  - **Dịch vụ:** Đóng chốt tái tạo cùi răng (ENDO_POST_CORE)
  - **Giá mặc định:** 500,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 500,000 ₫

- **Hạng mục 2:**
  - **Dịch vụ:** Mão răng toàn sứ Cercon HT (CROWN_ZIR_CERCON)
  - **Giá mặc định:** 5,000,000 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 5,000,000 ₫

- **Hạng mục 3:**
  - **Dịch vụ:** Gắn sứ / Thử sứ (PROS_CEMENT)
  - **Giá mặc định:** 0 ₫
  - **Số lượng:** 1
  - **Giá (VND):** 0 ₫

**Tổng giá:** 5,500,000 ₫

**Bước 6: Xem lại và Xác nhận**
- Xem lại tất cả thông tin
- Click "Tạo lộ trình"
- **Kết quả:** Treatment plan được tạo từ template với `status = PENDING`, `approval_status = APPROVED`

**Bước 7: Tạo Appointment từ Treatment Plan**
- Receptionist/Admin tạo appointment từ plan
- Chọn bệnh nhân: BN-1005 - Trần Văn Nam
- Chọn bác sĩ: BS Lê Anh Khoa (EMP001)
- Chọn dịch vụ từ plan: ENDO_POST_CORE, CROWN_ZIR_CERCON, PROS_CEMENT
- Đặt lịch: 2026-02-05 09:00:00

**Bước 8: Tạo Clinical Record (sau khi khám)**
- Xem chi tiết: **@docs/CLINICAL_RECORD_DEMO_DATA.md** - Case 3: Bọc răng sứ Cercon HT
- Procedures sẽ link với **patient_plan_item_id** từ treatment plan này

---

## 🔗 Liên Kết Với Clinical Records

**Workflow hoàn chỉnh:**
1. **Tạo Treatment Plan** → Duyệt plan
2. **Tạo Appointment** từ treatment plan (chọn dịch vụ từ plan)
3. **Khám bệnh nhân** → Appointment status = COMPLETED
4. **Tạo Clinical Record** → Link procedures với treatment plan items

**Chi tiết:** Xem **@docs/CLINICAL_RECORD_DEMO_DATA.md** để biết cách tạo clinical record và link với treatment plan.

---

## 🎯 Demo Flow trên FE

### Flow 1: Tạo Custom Plan

1. **Mở modal:** Click "Tạo Lộ Trình Điều Trị Tùy Chỉnh"
2. **Step 0 - Chọn bệnh nhân:**
   - Search hoặc chọn từ danh sách
   - Click "Tiếp theo"
3. **Step 1 - Thông tin lộ trình:**
   - Chọn chế độ: **"Tùy chỉnh"** (Custom)
   - Nhập tên lộ trình
   - Chọn bác sĩ (danh sách sẽ filter theo specialization)
   - Chọn hình thức thanh toán
   - Nhập giảm giá (nếu có)
   - Chọn ngày bắt đầu/kết thúc (tùy chọn)
   - Click "Tiếp theo"
4. **Step 2 - Quản lý Giai đoạn:**
   - Thêm giai đoạn mới
   - Nhập tên giai đoạn
   - (Không có field "Thời gian dự kiến")
   - Click "Tiếp theo"
5. **Step 3 - Quản lý Hạng mục:**
   - Chọn giai đoạn
   - Click "Thêm hạng mục"
   - **Danh sách dịch vụ sẽ được filter tự động** theo specialization của bác sĩ đã chọn
   - Chọn dịch vụ từ danh sách (chỉ hiển thị dịch vụ phù hợp)
   - Nhập số lượng
   - Giá tự động load từ dịch vụ
   - Click "Tiếp theo"
6. **Step 4 - Xem lại:**
   - Xem lại tất cả thông tin
   - Click "Tạo lộ trình"
   - **Kết quả:** Plan được tạo với status = PENDING

### Flow 2: Tạo Plan từ Template

1. **Mở modal:** Click "Tạo Lộ Trình Điều Trị Tùy Chỉnh"
2. **Step 0 - Chọn bệnh nhân:**
   - Search hoặc chọn từ danh sách
   - Click "Tiếp theo"
3. **Step 1 - Thông tin lộ trình:**
   - Chọn chế độ: **"Từ template"** (Template)
   - Chọn template từ dropdown
   - **Sau khi chọn template:**
     - Hiển thị thông tin template (tên, mô tả, số giai đoạn, số dịch vụ)
     - **KHÔNG hiển thị** text "💡 Bạn có thể tùy chỉnh..."
   - Nhập tên lộ trình (có thể giữ nguyên hoặc đổi)
   - Chọn bác sĩ (phải có specialization phù hợp với template)
   - Chọn hình thức thanh toán
   - Nhập giảm giá (nếu có)
   - Chọn ngày bắt đầu/kết thúc (tùy chọn)
   - Click "Tiếp theo"
4. **Step 2 - Quản lý Giai đoạn:**
   - **Các giai đoạn đã được load tự động từ template**
   - Có thể thêm/bớt giai đoạn nếu cần
   - Có thể sửa tên giai đoạn
   - Click "Tiếp theo"
5. **Step 3 - Quản lý Hạng mục:**
   - **Các hạng mục đã được load tự động từ template**
   - Mỗi giai đoạn hiển thị số hạng mục
   - Có thể thêm/bớt hạng mục nếu cần
   - **Danh sách dịch vụ được filter theo specialization của bác sĩ**
   - Click "Tiếp theo"
6. **Step 4 - Xem lại:**
   - Xem lại tất cả phases và items
   - Click "Tạo lộ trình"
   - **Kết quả:** Plan được tạo từ template với status = PENDING

---

## 📝 Lưu ý quan trọng

### Về Specialization

**Bác sĩ và Specialization:**
- **BS Lê Anh Khoa (EMP001):** Chỉnh nha (1), Nha chu (3), Phục hồi răng (4)
- **BS Trịnh Công Thái (EMP002):** Nội nha (2), Răng thẩm mỹ (7)
- **BS Junya Ota (EMP004):** Phục hồi răng (4), Phẫu thuật hàm mặt (5)

**Filter Services:**
- Sau khi chọn bác sĩ, danh sách dịch vụ sẽ **tự động filter** theo specialization của bác sĩ
- Chỉ hiển thị các dịch vụ có specialization phù hợp
- Nếu bác sĩ có nhiều specialization, sẽ hiển thị tất cả dịch vụ của các specialization đó

### Về Template

**Templates có sẵn:**
1. **TPL_ORTHO_METAL** (spec 1) - Niềng răng mắc cài kim loại
2. **TPL_IMPLANT_OSSTEM** (spec 4) - Cấy ghép Implant Hàn Quốc
3. **TPL_CROWN_CERCON_SIMPLE** (spec 4) - Bọc răng sứ Cercon HT đơn giản
4. **TPL_ENDO_TREATMENT** (spec 2) - Điều trị tủy răng sau
5. **TPL_CROWN_AFTER_ENDO** (spec 4) - Bọc sứ sau điều trị tủy
6. **TPL_PERIO_SCALING** (spec 3) - Cạo vôi răng toàn hàm
7. **TPL_SURGERY_WISDOM** (spec 5) - Nhổ răng khôn
8. **TPL_PEDO_FILLING** (spec 6) - Trám răng sữa
9. **TPL_COSMETIC_BLEACHING** (spec 7) - Tẩy trắng răng tại phòng khám

### Về Thời gian

- **Tất cả dates đều ở tương lai** (2026-02-XX trở đi) để có thể test booking
- Ngày bắt đầu và kết thúc là **tùy chọn** (có thể để trống cho DRAFT status)

### Về Dịch vụ

- **Dịch vụ được load tự động** khi chọn bác sĩ
- **Filter theo specialization** của bác sĩ
- Giá mặc định từ dịch vụ, có thể điều chỉnh (nhưng thường để kế toán điều chỉnh sau)

---

## ✅ Checklist Demo

### Custom Plan
- [ ] Chọn bệnh nhân
- [ ] Chọn chế độ "Tùy chỉnh"
- [ ] Nhập thông tin lộ trình
- [ ] Chọn bác sĩ (verify filter services)
- [ ] Thêm giai đoạn
- [ ] Thêm hạng mục (verify services được filter)
- [ ] Xem lại và tạo

### Template-based Plan
- [ ] Chọn bệnh nhân
- [ ] Chọn chế độ "Từ template"
- [ ] Chọn template (verify hiển thị thông tin template)
- [ ] Chọn bác sĩ (verify specialization match)
- [ ] Verify phases và items được load tự động
- [ ] Có thể tùy chỉnh phases/items
- [ ] Xem lại và tạo

