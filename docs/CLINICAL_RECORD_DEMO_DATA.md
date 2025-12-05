# Clinical Record Demo Data - FE Testing

> Data mẫu chi tiết để demo quy trình tạo và quản lý bệnh án (Clinical Record) trên FE
> 
> **Các trường hợp demo:**
> 1. **Khám tổng quát + Cạo vôi răng** - Case đơn giản
> 2. **Điều trị tủy răng sau** - Case có procedure và prescription
> 3. **Bọc răng sứ Cercon HT** - Case có nhiều procedures
> 4. **Tái khám niềng răng** - Case điều chỉnh niềng
> 5. **Nhổ răng khôn** - Case phẫu thuật
> 6. **Trám răng composite** - Case đơn giản với tooth status update

---

## 📋 Trường hợp 1: Khám Tổng Quát + Cạo Vôi Răng

### Demo Case 1: Khám định kỳ và vệ sinh răng miệng

**Bước 1: Chọn Appointment**
- **Appointment Code:** APT-20260106-001
- **Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
- **Bác sĩ:** BS Lê Anh Khoa (EMP001)
- **Ngày khám:** 2026-01-06 09:00:00
- **Trạng thái:** COMPLETED

**Bước 2: Tạo Clinical Record**

**Thông tin bệnh án:**
- **Chief Complaint (Lý do khám):**
  ```
  Bệnh nhân đến khám định kỳ 6 tháng, muốn kiểm tra tình trạng răng miệng và cạo vôi răng.
  Không có triệu chứng đau nhức, nhưng cảm thấy có vôi răng tích tụ nhiều ở vùng răng hàm dưới.
  ```

- **Examination Findings (Khám lâm sàng):**
  ```
  - Tình trạng răng miệng tổng quát: Tốt
  - Vôi răng tích tụ mức độ trung bình ở mặt trong răng hàm dưới (răng 36, 37, 38)
  - Vôi răng nhẹ ở mặt ngoài răng cửa hàm trên
  - Nướu có dấu hiệu viêm nhẹ ở vùng răng hàm dưới (gingivitis nhẹ)
  - Không phát hiện sâu răng mới
  - Răng khôn 38 mọc thẳng, không có dấu hiệu viêm nhiễm
  ```

- **Diagnosis (Chẩn đoán):**
  ```
  - Viêm nướu nhẹ do vôi răng (Gingivitis)
  - Vôi răng tích tụ mức độ trung bình
  - Răng miệng tổng quát tốt, không có sâu răng mới
  ```

- **Treatment Notes (Ghi chú điều trị):**
  ```
  Đã thực hiện cạo vôi răng và đánh bóng toàn hàm. Bệnh nhân được hướng dẫn vệ sinh răng miệng đúng cách:
  - Đánh răng 2 lần/ngày, sử dụng chỉ nha khoa
  - Súc miệng bằng nước muối sinh lý sau khi ăn
  - Hẹn tái khám sau 6 tháng hoặc khi có vấn đề
  ```

- **Vital Signs (Dấu hiệu sinh tồn):**
  ```json
  {
    "blood_pressure": "120/80",
    "heart_rate": 72,
    "temperature": 36.5,
    "weight": 70
  }
  ```

- **Follow-up Date (Ngày tái khám):** 2026-07-06

**Bước 3: Thêm Procedures**

**Procedure 1:**
- **Dịch vụ:** Khám tổng quát & Tư vấn (GEN_EXAM)
- **Mô tả:** Khám tổng quát răng miệng, đánh giá tình trạng vôi răng và nướu
- **Răng:** (Không áp dụng)
- **Ghi chú:** Bệnh nhân không có triệu chứng đau nhức

**Procedure 2:**
- **Dịch vụ:** Cạo vôi răng & Đánh bóng - Mức 1 (SCALING_L1)
- **Mô tả:** Cạo vôi răng toàn hàm, đánh bóng và làm sạch mảng bám
- **Răng:** (Toàn hàm)
- **Ghi chú:** Vôi răng tập trung nhiều ở mặt trong răng hàm dưới

**Bước 4: Prescription (Đơn thuốc)**

**Không có đơn thuốc** - Case này chỉ cần vệ sinh răng miệng

**Bước 5: Tooth Status (Trạng thái răng)**

**Không cần cập nhật** - Tất cả răng đều khỏe mạnh

---

## 📋 Trường hợp 2: Điều Trị Tủy Răng Sau

### Demo Case 2: Điều trị tủy răng 36

> **🔗 Liên kết với Treatment Plan:**
> - Treatment Plan: "Lộ trình Điều trị tủy răng sau - Răng 36" (Custom hoặc từ Template TPL_ENDO_TREATMENT)
> - Bệnh nhân: BN-1004 - Mít tơ Bít
> - Bác sĩ: BS Trịnh Công Thái (EMP002)
> - Xem chi tiết: **@docs/TREATMENT_PLAN_DEMO_DATA.md** - Demo Case 1 hoặc Demo Case 2 (Template)

**Bước 1: Chọn Appointment**
- **Appointment Code:** APT-20260201-001
- **Bệnh nhân:** BN-1004 - Mít tơ Bít
- **Bác sĩ:** BS Trịnh Công Thái (EMP002) - Specialization: Nội nha (spec 2)
- **Ngày khám:** 2026-02-01 14:00:00
- **Trạng thái:** COMPLETED
- **Liên kết với Treatment Plan:** ✅ Có (Appointment được tạo từ treatment plan)

**Bước 2: Tạo Clinical Record**

**Thông tin bệnh án:**
- **Chief Complaint:**
  ```
  Bệnh nhân đau nhức răng 36 (răng hàm dưới bên phải) trong 3 ngày qua.
  Đau tự phát, đau nhiều về đêm, đau lan lên đầu. Uống thuốc giảm đau nhưng không hiệu quả.
  Răng đã từng bị sâu và trám trước đó khoảng 2 năm.
  ```

- **Examination Findings:**
  ```
  - Răng 36: Miếng trám cũ bị bong, sâu răng lan vào tủy
  - Gõ đau (+), thử lạnh đau dữ dội (+)
  - Chụp X-quang quanh chóp: Hình ảnh tủy răng bị viêm, có dấu hiệu viêm quanh chóp nhẹ
  - Nướu vùng răng 36: Sưng nhẹ, ấn đau
  - Các răng khác: Bình thường
  ```

- **Diagnosis:**
  ```
  - Viêm tủy răng không hồi phục (Irreversible Pulpitis) - Răng 36
  - Viêm quanh chóp răng nhẹ (Apical Periodontitis) - Răng 36
  ```

- **Treatment Notes:**
  ```
  Đã thực hiện điều trị tủy răng 36:
  1. Gây tê tại chỗ
  2. Mở tủy, lấy tủy buồng và tủy chân
  3. Làm sạch và tạo hình ống tủy
  4. Đặt thuốc sát khuẩn và trám tạm
  5. Hẹn tái khám sau 1 tuần để trám bít ống tủy vĩnh viễn
  
  Bệnh nhân được kê đơn thuốc kháng sinh và giảm đau.
  Lưu ý: Không nhai mạnh bên răng 36, vệ sinh răng miệng nhẹ nhàng.
  ```

- **Vital Signs:**
  ```json
  {
    "blood_pressure": "125/82",
    "heart_rate": 78,
    "temperature": 36.7,
    "weight": 70
  }
  ```

- **Follow-up Date:** 2026-01-15

**Bước 3: Thêm Procedures**

**Procedure 1:**
- **Dịch vụ:** Chụp X-Quang quanh chóp (GEN_XRAY_PERI)
- **Mô tả:** Chụp phim X-quang để đánh giá tình trạng tủy và xương quanh chóp răng 36
- **Răng:** 36
- **Ghi chú:** Phim cho thấy viêm tủy và viêm quanh chóp nhẹ

**Procedure 2:**
- **Dịch vụ:** Điều trị tủy răng sau (ENDO_TREAT_POST)
- **Mô tả:** Điều trị tủy răng 36 - Lấy tủy, làm sạch và tạo hình ống tủy, đặt thuốc sát khuẩn
- **Răng:** 36
- **Ghi chú:** Đã lấy tủy buồng và tủy chân, làm sạch 3 ống tủy. Trám tạm, hẹn tái khám sau 1 tuần
- **🔗 Link với Treatment Plan:** ✅ Có - Link với **patient_plan_item_id** từ treatment plan "Lộ trình Điều trị tủy răng sau - Răng 36"

**Bước 4: Prescription**

**Đơn thuốc:**
- **Ghi chú đơn thuốc:** "Kháng sinh và giảm đau sau điều trị tủy răng 36"

**Prescription Item 1:**
- **Thuốc:** Amoxicillin 500mg
- **Số lượng:** 20 viên
- **Hướng dẫn sử dụng:** "Uống 2 viên/lần, 2 lần/ngày, sau ăn. Uống trong 5 ngày."

**Prescription Item 2:**
- **Thuốc:** Paracetamol 500mg
- **Số lượng:** 10 viên
- **Hướng dẫn sử dụng:** "Uống 1-2 viên/lần khi đau, cách nhau tối thiểu 4-6 giờ. Tối đa 4 viên/ngày."

**Prescription Item 3:**
- **Thuốc:** Ibuprofen 400mg
- **Số lượng:** 10 viên
- **Hướng dẫn sử dụng:** "Uống 1 viên/lần khi đau nhiều, sau ăn. Không uống cùng lúc với Paracetamol."

**Bước 5: Tooth Status**

**Cập nhật trạng thái răng 36:**
- **Trạng thái:** ROOT_CANAL
- **Ghi chú:** "Đang điều trị tủy, trám tạm. Hẹn tái khám sau 1 tuần để trám bít vĩnh viễn."

---

## 📋 Trường hợp 3: Bọc Răng Sứ Cercon HT

### Demo Case 3: Bọc răng sứ sau điều trị tủy

> **🔗 Liên kết với Treatment Plan:**
> - Treatment Plan: "Lộ trình Bọc răng sứ Cercon HT - Răng 16" (Custom) hoặc "Lộ trình Bọc sứ sau điều trị tủy - Răng 16" (Template TPL_CROWN_AFTER_ENDO)
> - Bệnh nhân: BN-1003 (Custom) hoặc BN-1005 (Template)
> - Bác sĩ: BS Lê Anh Khoa (EMP001)
> - Xem chi tiết: **@docs/TREATMENT_PLAN_DEMO_DATA.md** - Demo Case 2 (Custom) hoặc Demo Case 3 (Template)

**Bước 1: Chọn Appointment**
- **Appointment Code:** APT-20260205-001
- **Bệnh nhân:** BN-1003 - Nguyễn Tuấn Anh (hoặc BN-1005 - Trần Văn Nam nếu dùng Template)
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Specialization: Phục hồi răng (spec 4)
- **Ngày khám:** 2026-02-05 09:00:00
- **Trạng thái:** COMPLETED
- **Liên kết với Treatment Plan:** ✅ Có (Appointment được tạo từ treatment plan)

**Bước 2: Tạo Clinical Record**

**Thông tin bệnh án:**
- **Chief Complaint:**
  ```
  Bệnh nhân đến để bọc răng sứ cho răng 16 (răng hàm trên bên phải).
  Răng này đã được điều trị tủy trước đó 2 tháng, hiện tại cần bọc sứ để bảo vệ răng.
  Bệnh nhân muốn chọn loại sứ cao cấp, thẩm mỹ tốt.
  ```

- **Examination Findings:**
  ```
  - Răng 16: Đã điều trị tủy, trám bít ống tủy tốt
  - Răng còn lại khoảng 60% cấu trúc, đủ để làm chốt và mão sứ
  - Nướu vùng răng 16: Khỏe mạnh, không viêm
  - Khớp cắn: Bình thường, có đủ khoảng trống để đặt mão sứ
  - Răng đối diện: Răng 46 khỏe mạnh
  ```

- **Diagnosis:**
  ```
  - Răng 16 sau điều trị tủy, cần phục hồi bằng mão sứ
  - Chỉ định: Đóng chốt tái tạo cùi răng + Mão răng toàn sứ Cercon HT
  ```

- **Treatment Notes:**
  ```
  Đã thực hiện:
  1. Đóng chốt tái tạo cùi răng 16 (chốt sợi thủy tinh)
  2. Mài răng để chuẩn bị cho mão sứ
  3. Lấy dấu để gửi lab làm mão sứ Cercon HT
  4. Gắn mão tạm để bảo vệ răng trong thời gian chờ lab
  
  Hẹn tái khám sau 1 tuần để thử và gắn mão sứ vĩnh viễn.
  Màu sứ: A2 (theo bảng màu Vita)
  ```

- **Vital Signs:**
  ```json
  {
    "blood_pressure": "118/75",
    "heart_rate": 70,
    "temperature": 36.4,
    "weight": 75
  }
  ```

- **Follow-up Date:** 2026-01-17

**Bước 3: Thêm Procedures**

**Procedure 1:**
- **Dịch vụ:** Đóng chốt tái tạo cùi răng (ENDO_POST_CORE)
- **Mô tả:** Đóng chốt sợi thủy tinh vào ống tủy răng 16 để tăng cường lưu giữ cho mão sứ
- **Răng:** 16
- **Ghi chú:** Chốt sợi thủy tinh, kích thước phù hợp với ống tủy
- **🔗 Link với Treatment Plan:** ✅ Có - Link với **patient_plan_item_id** (hạng mục 1 trong plan)

**Procedure 2:**
- **Dịch vụ:** Mão răng toàn sứ Cercon HT (CROWN_ZIR_CERCON)
- **Mô tả:** Mài răng 16, lấy dấu để làm mão sứ Cercon HT
- **Răng:** 16
- **Ghi chú:** Màu A2, đã lấy dấu và gửi lab. Gắn mão tạm.
- **🔗 Link với Treatment Plan:** ✅ Có - Link với **patient_plan_item_id** (hạng mục 2 trong plan)

**Procedure 3:**
- **Dịch vụ:** Gắn sứ / Thử sứ (PROS_CEMENT)
- **Mô tả:** Thử mão sứ và gắn tạm (lần này chỉ thử, chưa gắn vĩnh viễn)
- **Răng:** 16
- **Ghi chú:** Mão sứ chưa về từ lab, sẽ gắn ở lần tái khám sau
- **🔗 Link với Treatment Plan:** ✅ Có - Link với **patient_plan_item_id** (hạng mục 3 trong plan)

**Bước 4: Prescription**

**Không có đơn thuốc** - Case này không cần thuốc

**Bước 5: Tooth Status**

**Cập nhật trạng thái răng 16:**
- **Trạng thái:** CROWN
- **Ghi chú:** "Đang làm mão sứ Cercon HT, hiện tại đang đeo mão tạm. Hẹn tái khám sau 1 tuần."

---

## 📋 Trường hợp 4: Tái Khám Niềng Răng

### Demo Case 4: Điều chỉnh niềng răng định kỳ

> **🔗 Liên kết với Treatment Plan:**
> - Treatment Plan: "Lộ trình Niềng răng Mắc cài Kim loại - BN-1001" (Template TPL_ORTHO_METAL)
> - Bệnh nhân: BN-1001 - Đoàn Thanh Phong
> - Bác sĩ: BS Lê Anh Khoa (EMP001)
> - Phase: Giai đoạn 3 - Điều chỉnh định kỳ (lần tái khám thứ 3)
> - Xem chi tiết: **@docs/TREATMENT_PLAN_DEMO_DATA.md** - Demo Case 1 (Template)

**Bước 1: Chọn Appointment**
- **Appointment Code:** APT-20260315-001 (ví dụ - lần tái khám thứ 3)
- **Bệnh nhân:** BN-1001 - Đoàn Thanh Phong
- **Bác sĩ:** BS Lê Anh Khoa (EMP001) - Specialization: Chỉnh nha (spec 1)
- **Ngày khám:** 2026-03-15 10:00:00 (sau khi gắn mắc cài 1 tháng)
- **Trạng thái:** COMPLETED
- **Liên kết với Treatment Plan:** ✅ Có (Appointment được tạo từ treatment plan, Phase 3)

**Bước 2: Tạo Clinical Record**

**Thông tin bệnh án:**
- **Chief Complaint:**
  ```
  Bệnh nhân đến tái khám niềng răng định kỳ (lần thứ 3).
  Đã niềng răng được 4 tháng, cảm thấy răng đang dịch chuyển tốt.
  Một số dây cung bị lỏng, cần siết lại.
  Không có đau nhức hay vấn đề gì đặc biệt.
  ```

- **Examination Findings:**
  ```
  - Tình trạng niềng: Mắc cài còn nguyên vẹn, không bị bong
  - Dây cung: Dây cung chính bị lỏng ở vùng răng cửa hàm trên, cần siết lại
  - Thun: Thun đã mất lực, cần thay mới
  - Răng: Răng đang dịch chuyển tốt, khoảng trống giữa răng cửa đã giảm đáng kể
  - Nướu: Khỏe mạnh, không có viêm nhiễm
  - Vệ sinh: Bệnh nhân vệ sinh răng miệng tốt, không có mảng bám nhiều
  ```

- **Diagnosis:**
  ```
  - Điều trị chỉnh nha đang tiến triển tốt
  - Cần điều chỉnh dây cung và thay thun định kỳ
  ```

- **Treatment Notes:**
  ```
  Đã thực hiện:
  1. Kiểm tra tình trạng niềng răng
  2. Siết lại dây cung chính ở hàm trên
  3. Thay thun mới (thun loại 3.5oz)
  4. Hướng dẫn bệnh nhân tiếp tục đeo thun đúng cách
  
  Tiến độ: Răng đang dịch chuyển tốt, khoảng trống giữa răng cửa đã giảm khoảng 2mm.
  Hẹn tái khám sau 4-6 tuần để tiếp tục điều chỉnh.
  ```

- **Vital Signs:**
  ```json
  {
    "blood_pressure": "115/75",
    "heart_rate": 68,
    "temperature": 36.5,
    "weight": 70
  }
  ```

- **Follow-up Date:** 2026-02-16

**Bước 3: Thêm Procedures**

**Procedure 1:**
- **Dịch vụ:** Điều chỉnh niềng răng (ORTHO_ADJUST)
- **Mô tả:** Siết lại dây cung chính và thay thun mới cho bệnh nhân đang niềng răng
- **Răng:** (Toàn hàm)
- **Ghi chú:** Đã siết dây cung hàm trên, thay thun loại 3.5oz. Tiến độ tốt.
- **🔗 Link với Treatment Plan:** ✅ Có - Link với **patient_plan_item_id** từ Phase 3 (Điều chỉnh định kỳ) trong treatment plan. Đây là lần điều chỉnh thứ 3 trong tổng số 8 lần.

**Bước 4: Prescription**

**Không có đơn thuốc** - Case này không cần thuốc

**Bước 5: Tooth Status**

**Không cần cập nhật** - Trạng thái răng đang được theo dõi trong quá trình niềng

---

## 📋 Trường hợp 5: Nhổ Răng Khôn

### Demo Case 5: Nhổ răng khôn hàm dưới bên phải

**Bước 1: Chọn Appointment**
- **Appointment Code:** APT-20260114-001
- **Bệnh nhân:** BN-1002 - Phạm Văn Phong
- **Bác sĩ:** BS Junya Ota (EMP004) - Specialization: Phẫu thuật hàm mặt (spec 5)
- **Ngày khám:** 2026-01-14 14:00:00
- **Trạng thái:** COMPLETED

**Bước 2: Tạo Clinical Record**

**Thông tin bệnh án:**
- **Chief Complaint:**
  ```
  Bệnh nhân đau nhức vùng răng khôn hàm dưới bên phải (răng 48) trong 1 tuần.
  Răng khôn mọc lệch, đâm vào răng 47, gây đau và khó chịu.
  Đã uống thuốc giảm đau nhưng không hiệu quả.
  Muốn nhổ răng khôn để giải quyết vấn đề.
  ```

- **Examination Findings:**
  ```
  - Răng 48: Mọc lệch về phía răng 47, gây đau và viêm nướu
  - Nướu vùng răng 48: Sưng, đỏ, ấn đau, có mủ nhẹ
  - Răng 47: Bị ảnh hưởng, có dấu hiệu sâu răng nhẹ do răng khôn đâm vào
  - Chụp X-quang: Răng 48 mọc ngầm, lệch về phía răng 47, chân răng gần dây thần kinh
  - Tình trạng sức khỏe: Bệnh nhân khỏe mạnh, không có chống chỉ định phẫu thuật
  ```

- **Diagnosis:**
  ```
  - Răng khôn mọc lệch, viêm quanh răng khôn (Pericoronitis) - Răng 48
  - Chỉ định: Nhổ răng khôn mức 2 (tiểu phẫu)
  ```

- **Treatment Notes:**
  ```
  Đã thực hiện nhổ răng khôn 48:
  1. Gây tê tại chỗ (lidocaine 2% với epinephrine)
  2. Rạch nướu, mở xương để tiếp cận răng
  3. Cắt răng thành nhiều phần để dễ lấy ra
  4. Lấy răng và làm sạch ổ răng
  5. Khâu vết thương (3 mũi chỉ)
  6. Cầm máu, hướng dẫn chăm sóc sau phẫu thuật
  
  Phẫu thuật diễn ra suôn sẻ, không có biến chứng.
  Bệnh nhân được kê đơn thuốc kháng sinh, giảm đau và chống viêm.
  Hẹn tái khám sau 1 tuần để cắt chỉ và kiểm tra vết thương.
  ```

- **Vital Signs:**
  ```json
  {
    "blood_pressure": "130/85",
    "heart_rate": 82,
    "temperature": 36.8,
    "weight": 80
  }
  ```

- **Follow-up Date:** 2026-01-21

**Bước 3: Thêm Procedures**

**Procedure 1:**
- **Dịch vụ:** Chụp X-Quang quanh chóp (GEN_XRAY_PERI)
- **Mô tả:** Chụp phim X-quang để đánh giá vị trí và hình dạng răng khôn 48
- **Răng:** 48
- **Ghi chú:** Phim cho thấy răng 48 mọc ngầm, lệch về phía răng 47, chân răng gần dây thần kinh

**Procedure 2:**
- **Dịch vụ:** Nhổ răng khôn mức 2 (EXTRACT_WISDOM_L2)
- **Mô tả:** Tiểu phẫu nhổ răng khôn 48 - Rạch nướu, mở xương, cắt răng và lấy ra, khâu vết thương
- **Răng:** 48
- **Ghi chú:** Phẫu thuật thành công, đã khâu 3 mũi chỉ. Không có biến chứng.

**Bước 4: Prescription**

**Đơn thuốc:**
- **Ghi chú đơn thuốc:** "Kháng sinh, giảm đau và chống viêm sau nhổ răng khôn 48"

**Prescription Item 1:**
- **Thuốc:** Amoxicillin 500mg
- **Số lượng:** 20 viên
- **Hướng dẫn sử dụng:** "Uống 2 viên/lần, 2 lần/ngày, sau ăn. Uống trong 5 ngày."

**Prescription Item 2:**
- **Thuốc:** Paracetamol 500mg
- **Số lượng:** 20 viên
- **Hướng dẫn sử dụng:** "Uống 1-2 viên/lần khi đau, cách nhau tối thiểu 4-6 giờ. Tối đa 4 viên/ngày."

**Prescription Item 3:**
- **Thuốc:** Ibuprofen 400mg
- **Số lượng:** 10 viên
- **Hướng dẫn sử dụng:** "Uống 1 viên/lần, 2 lần/ngày sau ăn để chống viêm. Uống trong 3 ngày."

**Prescription Item 4:**
- **Thuốc:** Nước súc miệng Chlorhexidine 0.12%
- **Số lượng:** 1 chai 250ml
- **Hướng dẫn sử dụng:** "Súc miệng 2 lần/ngày (sáng và tối), mỗi lần 15ml, giữ trong miệng 30 giây rồi nhổ ra. Bắt đầu từ ngày thứ 2 sau phẫu thuật."

**Bước 5: Tooth Status**

**Cập nhật trạng thái răng 48:**
- **Trạng thái:** MISSING
- **Ghi chú:** "Đã nhổ răng khôn 48 do mọc lệch và viêm quanh răng. Hẹn tái khám sau 1 tuần để cắt chỉ."

---

## 📋 Trường hợp 6: Trám Răng Composite

### Demo Case 6: Trám răng sâu

**Bước 1: Chọn Appointment**
- **Appointment Code:** APT-20260116-001
- **Bệnh nhân:** BN-1003 - Nguyễn Tuấn Anh
- **Bác sĩ:** BS Lê Anh Khoa (EMP001)
- **Ngày khám:** 2026-01-16 09:00:00
- **Trạng thái:** COMPLETED

**Bước 2: Tạo Clinical Record**

**Thông tin bệnh án:**
- **Chief Complaint:**
  ```
  Bệnh nhân phát hiện lỗ sâu ở răng 24 (răng cửa bên hàm trên bên trái).
  Lỗ sâu nhỏ, không đau nhưng cảm thấy vướng khi ăn và lo lắng sẽ lan rộng.
  Muốn trám răng để bảo vệ răng.
  ```

- **Examination Findings:**
  ```
  - Răng 24: Có lỗ sâu nhỏ ở mặt ngoài, kích thước khoảng 2x3mm
  - Sâu răng ở lớp men và ngà răng, chưa vào tủy
  - Thử lạnh: Không đau (tủy còn khỏe)
  - Gõ: Không đau
  - Nướu vùng răng 24: Khỏe mạnh
  - Các răng khác: Bình thường
  ```

- **Diagnosis:**
  ```
  - Sâu răng lớp men và ngà (Caries - Enamel and Dentin) - Răng 24
  - Chỉ định: Trám răng Composite
  ```

- **Treatment Notes:**
  ```
  Đã thực hiện trám răng 24 bằng Composite:
  1. Làm sạch vùng sâu răng
  2. Tạo xoang trám phù hợp
  3. Trám Composite màu A2 (phù hợp với màu răng tự nhiên)
  4. Đánh bóng và chỉnh khớp cắn
  
  Miếng trám đẹp, khít sát, không vướng khớp cắn.
  Bệnh nhân được hướng dẫn vệ sinh răng miệng tốt để tránh sâu răng tái phát.
  Hẹn tái khám định kỳ 6 tháng.
  ```

- **Vital Signs:**
  ```json
  {
    "blood_pressure": "120/78",
    "heart_rate": 72,
    "temperature": 36.5,
    "weight": 75
  }
  ```

- **Follow-up Date:** 2026-07-16

**Bước 3: Thêm Procedures**

**Procedure 1:**
- **Dịch vụ:** Trám răng Composite (FILLING_COMP)
- **Mô tả:** Trám răng sâu 24 bằng Composite màu A2
- **Răng:** 24
- **Ghi chú:** Miếng trám đẹp, khít sát, không vướng khớp cắn

**Bước 4: Prescription**

**Không có đơn thuốc** - Case này không cần thuốc

**Bước 5: Tooth Status**

**Cập nhật trạng thái răng 24:**
- **Trạng thái:** FILLED
- **Ghi chú:** "Đã trám Composite màu A2. Miếng trám tốt, hẹn tái khám định kỳ."

---

## 🎯 Demo Flow trên FE

### Flow 1: Tạo Clinical Record Mới

1. **Mở trang Appointment Detail:**
   - Vào trang chi tiết appointment (ví dụ: `/admin/booking/appointments/APT-20260106-001`)
   - Click tab **"Bệnh Án"** (Clinical Record)

2. **Kiểm tra Clinical Record:**
   - Nếu chưa có bệnh án: Hiển thị button **"Tạo Bệnh Án"**
   - Nếu đã có: Hiển thị thông tin bệnh án (read-only hoặc có button "Chỉnh sửa")

3. **Tạo Clinical Record:**
   - Click **"Tạo Bệnh Án"**
   - Form hiển thị các trường:
     - **Chief Complaint** (Textarea, required, 1-1000 chars)
     - **Examination Findings** (Textarea, required, 1-2000 chars)
     - **Diagnosis** (Textarea, required, 1-500 chars)
     - **Treatment Notes** (Textarea, optional, max 2000 chars)
     - **Vital Signs** (Dynamic form - blood pressure, heart rate, temperature, weight)
     - **Follow-up Date** (Date picker, optional)
   - Nhập thông tin theo case demo
   - Click **"Lưu Bệnh Án"**

4. **Thêm Procedures:**
   - Trong tab "Bệnh Án", section **"Thủ Thuật"** (Procedures)
   - Click **"Thêm Thủ Thuật"**
   - Form hiển thị:
     - **Dịch vụ** (Dropdown - filter theo specialization của bác sĩ)
     - **Mô tả** (Textarea, required, 3-1000 chars)
     - **Răng** (Text input, optional, max 10 chars - ví dụ: "36", "16", "24-26")
     - **Ghi chú** (Textarea, optional, max 1000 chars)
   - Nhập thông tin và click **"Lưu"**

5. **Thêm Prescription (nếu có):**
   - Trong section **"Đơn Thuốc"** (Prescriptions)
   - Click **"Thêm Đơn Thuốc"**
   - Nhập **Ghi chú đơn thuốc** (optional)
   - Click **"Thêm Thuốc"** để thêm từng item:
     - **Thuốc** (Text input hoặc dropdown từ inventory, required)
     - **Số lượng** (Number, required)
     - **Hướng dẫn sử dụng** (Textarea, optional)
   - Click **"Lưu Đơn Thuốc"**

6. **Cập nhật Tooth Status (nếu có):**
   - Trong section **"Sơ Đồ Răng"** (Odontogram)
   - Click vào răng cần cập nhật (ví dụ: răng 36)
   - Form hiển thị:
     - **Trạng thái** (Dropdown: HEALTHY, CARIES, FILLED, CROWN, MISSING, IMPLANT, ROOT_CANAL, FRACTURED, IMPACTED)
     - **Ghi chú** (Textarea, optional)
   - Chọn trạng thái và nhập ghi chú
   - Click **"Lưu"**

### Flow 2: Chỉnh Sửa Clinical Record

1. **Mở Clinical Record đã có:**
   - Vào trang appointment detail
   - Click tab **"Bệnh Án"**
   - Click button **"Chỉnh Sửa"** (nếu có permission `WRITE_CLINICAL_RECORD`)

2. **Cập nhật thông tin:**
   - Có thể sửa:
     - **Examination Findings** (nếu chưa hoàn tất)
     - **Treatment Notes** (bổ sung thêm)
     - **Vital Signs** (cập nhật nếu cần)
     - **Follow-up Date** (thay đổi ngày tái khám)
   - **KHÔNG thể sửa:**
     - **Chief Complaint** (đã ghi nhận ban đầu)
     - **Diagnosis** (chẩn đoán ban đầu)
   - Click **"Lưu Thay Đổi"**

3. **Quản lý Procedures:**
   - Có thể **Thêm**, **Sửa**, **Xóa** procedures
   - Click **"Sửa"** hoặc **"Xóa"** trên từng procedure

4. **Quản lý Prescriptions:**
   - Có thể **Thêm**, **Sửa**, **Xóa** prescription items
   - Click **"Sửa"** hoặc **"Xóa"** trên từng item

---

## 📝 Lưu ý quan trọng

### Về Clinical Record

**Write Once, Query Many:**
- Clinical Record được tạo **một lần** khi khám
- Có thể **cập nhật** một số trường (examination findings, treatment notes, vital signs, follow-up date)
- **KHÔNG thể sửa** chief complaint và diagnosis sau khi đã lưu (đảm bảo tính toàn vẹn dữ liệu)

**Validation:**
- Chief Complaint: 1-1000 ký tự (required)
- Examination Findings: 1-2000 ký tự (required)
- Diagnosis: 1-500 ký tự (required)
- Treatment Notes: Tối đa 2000 ký tự (optional)
- Follow-up Date: Format yyyy-MM-dd (optional)

### Về Procedures

**Link với Services:**
- Procedure có thể link với **service_id** (dịch vụ trong catalog)
- Có thể link với **patient_plan_item_id** (nếu thực hiện từ treatment plan)
- **Tooth Number**: Format FDI notation (ví dụ: "11", "18", "36", "24-26")

**Validation:**
- Procedure Description: 3-1000 ký tự (required)
- Tooth Number: Tối đa 10 ký tự (optional)
- Notes: Tối đa 1000 ký tự (optional)

### Về Prescriptions

**Prescription Items:**
- Có thể link với **item_master_id** (nếu thuốc có trong inventory)
- **item_name** là required (ngay cả khi không có trong inventory)
- **quantity** là số nguyên dương (required)
- **dosage_instructions** là optional (hướng dẫn sử dụng)

**Lưu ý:**
- Một Clinical Record có thể có **nhiều prescriptions** (nhưng thường chỉ có 1)
- Mỗi prescription có **nhiều items** (thuốc)

### Về Tooth Status (Odontogram)

**Tooth Conditions:**
- **HEALTHY**: Răng khỏe mạnh
- **CARIES**: Răng sâu
- **FILLED**: Răng đã trám
- **CROWN**: Răng đã bọc sứ
- **MISSING**: Răng đã mất
- **IMPLANT**: Răng đã cấy ghép Implant
- **ROOT_CANAL**: Răng đã điều trị tủy
- **FRACTURED**: Răng bị gãy
- **IMPACTED**: Răng mọc ngầm

**Tooth Number Format:**
- Sử dụng FDI notation (2 chữ số)
- Ví dụ: "11" (răng cửa giữa hàm trên bên phải), "36" (răng hàm dưới bên trái)

**Lưu ý:**
- Tooth Status được lưu **theo patient**, không phải theo appointment
- Mỗi răng chỉ có **1 trạng thái hiện tại** (unique constraint: patient_id + tooth_number)
- Có **history table** để track thay đổi trạng thái răng theo thời gian

### Về Vital Signs

**JSONB Structure:**
- Vital Signs là JSONB field, linh hoạt
- Các trường thường dùng:
  - `blood_pressure`: "120/80" (string)
  - `heart_rate`: 72 (number)
  - `temperature`: 36.5 (number)
  - `weight`: 70 (number)
  - Có thể thêm các trường khác nếu cần

**UI:**
- Form dynamic với các trường phổ biến
- Có thể thêm/xóa trường tùy chỉnh

### Về Permissions

**View Permissions:**
- `ROLE_ADMIN`: Xem tất cả bệnh án
- `VIEW_APPOINTMENT_ALL`: Xem tất cả bệnh án (Receptionist, Manager)
- `VIEW_APPOINTMENT_OWN`: Xem bệnh án liên quan (Doctor xem của mình, Patient xem của mình)

**Write Permissions:**
- `WRITE_CLINICAL_RECORD`: Tạo/sửa bệnh án (Doctor, Admin)
- Không cần permission riêng cho procedures, prescriptions, tooth status (dùng chung với clinical record)

---

## ✅ Checklist Demo

### Case 1: Khám Tổng Quát + Cạo Vôi
- [ ] Tạo Clinical Record với đầy đủ thông tin
- [ ] Thêm 2 procedures (Khám tổng quát + Cạo vôi)
- [ ] Không có prescription
- [ ] Không cần cập nhật tooth status
- [ ] Có follow-up date (6 tháng sau)

### Case 2: Điều Trị Tủy Răng
- [ ] Tạo Clinical Record với chief complaint chi tiết
- [ ] Thêm 2 procedures (X-quang + Điều trị tủy)
- [ ] **Link procedure "Điều trị tủy răng sau" với patient_plan_item_id từ treatment plan**
- [ ] Thêm prescription với 3 items (kháng sinh, giảm đau)
- [ ] Cập nhật tooth status răng 36 → ROOT_CANAL
- [ ] Có follow-up date (1 tuần sau)

### Case 3: Bọc Răng Sứ
- [ ] Tạo Clinical Record
- [ ] Thêm 3 procedures (Đóng chốt + Mài răng + Thử sứ)
- [ ] **Link tất cả 3 procedures với patient_plan_item_id từ treatment plan**
- [ ] Không có prescription
- [ ] Cập nhật tooth status răng 16 → CROWN
- [ ] Có follow-up date (1 tuần sau)

### Case 4: Tái Khám Niềng Răng
- [ ] Tạo Clinical Record cho tái khám
- [ ] Thêm 1 procedure (Điều chỉnh niềng)
- [ ] **Link procedure với patient_plan_item_id từ Phase 3 của treatment plan**
- [ ] Không có prescription
- [ ] Không cần cập nhật tooth status
- [ ] Có follow-up date (4-6 tuần sau)

### Case 5: Nhổ Răng Khôn
- [ ] Tạo Clinical Record với thông tin phẫu thuật
- [ ] Thêm 2 procedures (X-quang + Nhổ răng khôn)
- [ ] Thêm prescription với 4 items (kháng sinh, giảm đau, chống viêm, nước súc miệng)
- [ ] Cập nhật tooth status răng 48 → MISSING
- [ ] Có follow-up date (1 tuần sau)

### Case 6: Trám Răng
- [ ] Tạo Clinical Record
- [ ] Thêm 1 procedure (Trám Composite)
- [ ] Không có prescription
- [ ] Cập nhật tooth status răng 24 → FILLED
- [ ] Có follow-up date (6 tháng sau)

---

## 🔗 Liên Kết Với Treatment Plan

### Workflow Hoàn Chỉnh: Treatment Plan → Appointment → Clinical Record

**Bước 1: Tạo và Duyệt Treatment Plan**
- Bác sĩ tạo treatment plan (Custom hoặc từ Template)
- Admin/Manager duyệt plan → `approval_status = APPROVED`
- Xem chi tiết: **@docs/TREATMENT_PLAN_DEMO_DATA.md**

**Bước 2: Tạo Appointment từ Treatment Plan**
- Receptionist/Admin tạo appointment từ treatment plan đã duyệt
- Chọn dịch vụ từ các hạng mục trong plan
- Appointment được link với treatment plan

**Bước 3: Khám và Tạo Clinical Record**
- Sau khi khám, appointment status = COMPLETED
- Bác sĩ tạo clinical record
- Khi thêm procedures, có thể link với **patient_plan_item_id** từ treatment plan

### Ví Dụ Liên Kết

**Case 1: Điều trị tủy răng sau**
- Treatment Plan: "Lộ trình Điều trị tủy răng sau - Răng 36"
  - Hạng mục: Điều trị tủy răng sau (ENDO_TREAT_POST) → `patient_plan_item_id = X`
- Appointment: APT-20260201-001 (tạo từ plan)
- Clinical Record Procedure:
  - Procedure: "Điều trị tủy răng sau"
  - Link với: `patient_plan_item_id = X` ✅

**Case 2: Bọc răng sứ Cercon HT**
- Treatment Plan: "Lộ trình Bọc răng sứ Cercon HT - Răng 16"
  - Hạng mục 1: Đóng chốt (ENDO_POST_CORE) → `patient_plan_item_id = Y1`
  - Hạng mục 2: Mão sứ (CROWN_ZIR_CERCON) → `patient_plan_item_id = Y2`
  - Hạng mục 3: Gắn sứ (PROS_CEMENT) → `patient_plan_item_id = Y3`
- Appointment: APT-20260205-001 (tạo từ plan)
- Clinical Record Procedures:
  - Procedure 1: "Đóng chốt" → Link với `patient_plan_item_id = Y1` ✅
  - Procedure 2: "Mão sứ" → Link với `patient_plan_item_id = Y2` ✅
  - Procedure 3: "Gắn sứ" → Link với `patient_plan_item_id = Y3` ✅

**Case 3: Tái khám niềng răng**
- Treatment Plan: "Lộ trình Niềng răng Mắc cài Kim loại"
  - Phase 3: Điều chỉnh định kỳ (8 lần)
  - Hạng mục: ORTHO_ADJUST (quantity = 8) → `patient_plan_item_id = Z`
- Appointment: APT-20260315-001 (lần tái khám thứ 3)
- Clinical Record Procedure:
  - Procedure: "Điều chỉnh niềng răng" → Link với `patient_plan_item_id = Z` ✅
  - Lưu ý: Cùng một `patient_plan_item_id` nhưng thực hiện nhiều lần (8 lần)

### Lợi Ích Của Việc Liên Kết

1. **Tracking tiến độ:** Biết được hạng mục nào trong treatment plan đã được thực hiện
2. **Báo cáo:** Thống kê tỷ lệ hoàn thành treatment plan
3. **Lịch sử:** Xem lại lịch sử thực hiện từng hạng mục
4. **Thanh toán:** Link với billing/invoice từ treatment plan

### Lưu ý

- Link với treatment plan là **optional**
- Procedure vẫn có thể tạo độc lập (không cần treatment plan)
- Một `patient_plan_item_id` có thể được thực hiện nhiều lần (ví dụ: ORTHO_ADJUST với quantity = 8)
- Khi tạo procedure từ appointment có treatment plan, nên suggest link với plan items

---

## 📊 Tổng Hợp Workflow: Treatment Plan → Clinical Record

### Workflow Hoàn Chỉnh

```
1. Bác sĩ tạo Treatment Plan
   ↓
2. Admin/Manager duyệt plan (approval_status = APPROVED)
   ↓
3. Receptionist/Admin tạo Appointment từ plan
   - Chọn dịch vụ từ các hạng mục trong plan
   - Appointment được link với treatment plan
   ↓
4. Bệnh nhân đến khám → Appointment status = COMPLETED
   ↓
5. Bác sĩ tạo Clinical Record
   - Nhập chief complaint, examination findings, diagnosis
   - Thêm procedures (link với patient_plan_item_id)
   - Thêm prescriptions (nếu có)
   - Cập nhật tooth status (nếu có)
   ↓
6. Hệ thống track tiến độ treatment plan
   - Biết được hạng mục nào đã được thực hiện
   - Tính tỷ lệ hoàn thành plan
```

### Mapping Demo Cases

| Treatment Plan Demo | Clinical Record Demo | Link Status |
|-------------------|---------------------|-------------|
| Case 1: Điều trị tủy (Custom) | Case 2: Điều trị tủy | ✅ Linked |
| Case 2: Điều trị tủy (Template) | Case 2: Điều trị tủy | ✅ Linked |
| Case 2: Bọc sứ (Custom) | Case 3: Bọc sứ | ✅ Linked |
| Case 3: Bọc sứ (Template) | Case 3: Bọc sứ | ✅ Linked |
| Case 1: Niềng răng (Template) | Case 4: Tái khám niềng | ✅ Linked (Phase 3) |
| - | Case 1: Khám tổng quát | ❌ Standalone |
| - | Case 5: Nhổ răng khôn | ❌ Standalone |
| - | Case 6: Trám răng | ❌ Standalone |

**Lưu ý:**
- Cases 1, 5, 6 là standalone (không có treatment plan)
- Cases 2, 3, 4 được link với treatment plans
- Case 4 là tái khám từ treatment plan niềng răng (Phase 3)

