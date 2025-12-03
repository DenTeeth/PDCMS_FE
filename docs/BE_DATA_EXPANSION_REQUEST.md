# YÊU CẦU THÊM DỮ LIỆU CHO DATABASE
## Dental Clinic Management System - Seed Data Expansion

**Ngày tạo:** 2025-01-XX  
**Người yêu cầu:** Frontend Team  
**Mục đích:** Mở rộng dữ liệu seed để phục vụ testing và demo

---

## TỔNG QUAN YÊU CẦU

1. **Mỗi bảng cần thêm 4-6 dữ liệu mới**
2. **Lịch làm việc của nhân viên:** Tăng số ngày làm việc (thêm nhiều ca làm việc hơn)
3. **Hạn sử dụng kho:** Tất cả vật phẩm, thuốc men phải có hạn sử dụng > 2 năm từ hiện tại
4. **Số lượng:** Tăng số lượng vật tư, thuốc men trong kho
5. **Thời gian:** Dữ liệu mới nên có thời gian đa dạng (quá khứ, hiện tại, tương lai)

---

## CHI TIẾT YÊU CẦU THEO TỪNG BẢNG

### 1. ACCOUNTS (Tài khoản)
**Hiện tại:** ~18 accounts  
**Yêu cầu:** Thêm 5-6 accounts mới
- Thêm 2-3 bác sĩ mới
- Thêm 1-2 y tá mới
- Thêm 2-3 bệnh nhân mới

### 2. EMPLOYEES (Nhân viên)
**Hiện tại:** ~12 employees  
**Yêu cầu:** Thêm 5-6 employees mới
- Đa dạng employment_type (FULL_TIME, PART_TIME_FIXED, PART_TIME_FLEX)
- Đa dạng chuyên khoa
- Thêm nhân viên mới cho các vai trò khác nhau

### 3. PATIENTS (Bệnh nhân)
**Hiện tại:** ~10 patients  
**Yêu cầu:** Thêm 5-6 patients mới
- Đa dạng giới tính (MALE, FEMALE, OTHER)
- Đa dạng độ tuổi
- Thông tin liên hệ đầy đủ

### 4. EMPLOYEE_SHIFTS (Ca làm việc nhân viên)
**Hiện tại:** Có dữ liệu cho tháng 11/2025, 12/2025, 1/2026, 2/20262026
**YÊU CẦU ĐẶC BIỆT:** 
- **Thêm lịch làm việc cho TẤT CẢ nhân viên FULL_TIME từ tháng 2/2026 đến tháng 6/2026**
- Mỗi nhân viên FULL_TIME cần có ít nhất 20 ca/tháng (10 ca sáng + 10 ca chiều)
- Thêm lịch làm việc cho nhân viên PART_TIME (ít nhất 8-10 ca/tháng)
- Đảm bảo có đủ dữ liệu cho ít nhất 6 tháng tiếp theo

### 5. WORK_SHIFTS (Mẫu ca làm việc)
**Hiện tại:** 4 work shifts  
**Yêu cầu:** Thêm 2-3 work shifts mới
- Có thể thêm ca tối, ca cuối tuần

### 6. APPOINTMENTS (Lịch hẹn)
**Hiện tại:** ~20 appointments  
**Yêu cầu:** Thêm 5-6 appointments mới
- Đa dạng trạng thái (SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED)
- Phân bố đều từ tháng 12/2025 đến tháng 6/2026
- Liên kết với nhiều bệnh nhân và bác sĩ khác nhau

### 7. APPOINTMENT_SERVICES (Dịch vụ trong lịch hẹn)
**Yêu cầu:** Thêm 5-6 records mới
- Liên kết với appointments mới
- Đa dạng services

### 8. APPOINTMENT_PARTICIPANTS (Người tham gia lịch hẹn)
**Hiện tại:** Chỉ sử dụng ASSISTANT và OBSERVER  
**Yêu cầu:** Thêm 5-6 records mới
- **Đa dạng vai trò:** Sử dụng cả 3 vai trò có sẵn trong ENUM:
  - `ASSISTANT` (Y tá hỗ trợ) - đã có trong data
  - `OBSERVER` (Người quan sát/Thực tập sinh) - đã có trong data
  - `SECONDARY_DOCTOR` (Bác sĩ phụ) - **CHƯA có trong data, cần thêm để test đầy đủ**

### 9. TIME_OFF_REQUESTS (Yêu cầu nghỉ phép)
**Hiện tại:** ~9 requests  
**Yêu cầu:** Thêm 5-6 requests mới
- Đa dạng trạng thái (PENDING, APPROVED, REJECTED, CANCELLED)
- Phân bố từ tháng 2/2026 đến tháng 6/2026

### 10. OVERTIME_REQUESTS (Yêu cầu tăng ca)
**Hiện tại:** ~11 requests  
**Yêu cầu:** Thêm 5-6 requests mới
- Đa dạng trạng thái
- Phân bố từ tháng 2/2026 đến tháng 6/2026

### 11. PATIENT_TREATMENT_PLANS (Phác đồ điều trị)
**Hiện tại:** ~10 plans  
**Yêu cầu:** Thêm 5-6 plans mới
- Đa dạng trạng thái (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- Đa dạng approval_status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- Liên kết với nhiều bệnh nhân khác nhau

### 12. PATIENT_PLAN_PHASES (Giai đoạn điều trị)
**Yêu cầu:** Thêm 5-6 phases mới
- Liên kết với treatment plans mới
- Đa dạng trạng thái (PENDING, IN_PROGRESS, COMPLETED)

### 13. PATIENT_PLAN_ITEMS (Hạng mục điều trị)
**Yêu cầu:** Thêm 5-6 items mới
- Liên kết với phases mới
- Đa dạng trạng thái

### 14. ITEM_MASTERS (Vật tư chính)
**Hiện tại:** ~30 items  
**Yêu cầu:** Thêm 5-6 items mới
- Đa dạng categories (CONSUMABLE, MEDICINE, MATERIAL, CHEMICAL, EQUIPMENT)
- Mô tả đầy đủ

### 15. ITEM_BATCHES (Lô hàng)
**Hiện tại:** ~12 batches  
**YÊU CẦU ĐẶC BIỆT:**
- **Thêm 5-6 batches mới**
- **TẤT CẢ expiry_date phải > 2 năm từ hiện tại (tức là >= 2027-01-XX)**
- **Tăng số lượng:** 
  - initial_quantity: Tăng lên ít nhất 500-1000 cho vật tư tiêu hao
  - initial_quantity: Tăng lên ít nhất 200-500 cho thuốc men
  - quantity_on_hand: Tương ứng với initial_quantity
- Đa dạng suppliers
- Đa dạng bin_location

### 16. ITEM_UNITS (Đơn vị tính)
**Yêu cầu:** Thêm 5-6 units mới
- Liên kết với items mới
- Đa dạng conversion_rate

### 17. STORAGE_TRANSACTIONS (Giao dịch kho)
**Hiện tại:** ~6 transactions  
**Yêu cầu:** Thêm 5-6 transactions mới
- Đa dạng loại (IMPORT, EXPORT, TRANSFER, ADJUSTMENT)
- Đa dạng trạng thái (PENDING, COMPLETED, CANCELLED)
- Đa dạng payment_status (UNPAID, PARTIAL, PAID)
- Phân bố từ tháng 2/2026 đến tháng 6/2026

### 18. STORAGE_TRANSACTION_ITEMS (Chi tiết giao dịch)
**Yêu cầu:** Thêm 5-6 records mới
- Liên kết với transactions mới
- **Tăng số lượng:** quantity_change nên lớn hơn (100-500 đơn vị)

### 19. SUPPLIERS (Nhà cung cấp)
**Hiện tại:** ~5 suppliers  
**Yêu cầu:** Thêm 4-5 suppliers mới
- Đa dạng tier_level (PLATINUM, GOLD, SILVER, BRONZE)
- Thông tin liên hệ đầy đủ

### 20. CLINICAL_RECORDS (Bệnh án)
**Hiện tại:** ~3 records  
**Yêu cầu:** Thêm 5-6 records mới
- Liên kết với appointments mới
- Đầy đủ thông tin (diagnosis, vital_signs, chief_complaint, etc.)

### 21. CLINICAL_RECORD_PROCEDURES (Thủ thuật)
**Yêu cầu:** Thêm 5-6 procedures mới
- Liên kết với clinical records mới
- Đa dạng services

### 22. CLINICAL_PRESCRIPTIONS (Đơn thuốc)
**Yêu cầu:** Thêm 5-6 prescriptions mới
- Liên kết với clinical records mới

### 23. CLINICAL_PRESCRIPTION_ITEMS (Chi tiết đơn thuốc)
**Yêu cầu:** Thêm 5-6 items mới
- Liên kết với prescriptions mới
- **Tăng số lượng:** quantity nên lớn hơn (10-30 đơn vị)

### 24. PATIENT_TOOTH_STATUS (Trạng thái răng)
**Yêu cầu:** Thêm 5-6 records mới
- Đa dạng trạng thái (HEALTHY, CARIES, FILLED, CROWN, MISSING, IMPLANT, etc.)
- Liên kết với nhiều patients khác nhau

### 25. ROOMS (Phòng khám)
**Hiện tại:** 4 rooms  
**Yêu cầu:** Thêm 2-3 rooms mới
- Đa dạng room_type (STANDARD, IMPLANT)

### 26. SERVICES (Dịch vụ)
**Hiện tại:** ~50 services  
**Yêu cầu:** Thêm 4-5 services mới
- Đa dạng categories và specializations

### 27. SERVICE_CATEGORIES (Danh mục dịch vụ)
**Hiện tại:** 6 categories  
**Yêu cầu:** Có thể thêm 1-2 categories mới (nếu cần)

### 28. HOLIDAY_DEFINITIONS (Định nghĩa ngày lễ)
**Yêu cầu:** Thêm 2-3 definitions mới
- Có thể thêm các ngày lễ khác trong năm

### 29. HOLIDAY_DATES (Ngày lễ cụ thể)
**Yêu cầu:** Thêm 5-6 dates mới
- Phân bố từ tháng 2/2026 đến tháng 6/2026

### 30. FIXED_SHIFT_REGISTRATIONS (Đăng ký ca cố định)
**Yêu cầu:** Thêm 4-5 registrations mới
- Liên kết với employees mới
- Đa dạng work_shifts

### 31. PART_TIME_SLOTS (Suất part-time)
**Yêu cầu:** Thêm 3-4 slots mới
- Đa dạng day_of_week
- Tăng quota (3-5)

### 32. EMPLOYEE_LEAVE_BALANCES (Số dư nghỉ phép)
**Yêu cầu:** Thêm 5-6 balances mới
- Cho employees mới
- Năm 2026 và 2027

### 33. CUSTOMER_CONTACTS (Liên hệ khách hàng)
**Yêu cầu:** Thêm 5-6 contacts mới
- Đa dạng status (NEW, CONTACTED, APPOINTMENT_SET, NOT_INTERESTED, CONVERTED)
- Đa dạng source (WEBSITE, FACEBOOK, ZALO, WALK_IN, REFERRAL)

### 34. CONTACT_HISTORY (Lịch sử liên hệ)
**Yêu cầu:** Thêm 5-6 records mới
- Liên kết với contacts mới
- Đa dạng action (CALL, MESSAGE, NOTE)

---

## YÊU CẦU ĐẶC BIỆT

### 1. LỊCH LÀM VIỆC NHÂN VIÊN (EMPLOYEE_SHIFTS)
**ƯU TIÊN CAO NHẤT**

- **Thêm lịch làm việc cho TẤT CẢ nhân viên FULL_TIME từ tháng 2/2026 đến tháng 6/2026**
- Mỗi nhân viên FULL_TIME cần:
  - **20 ca/tháng** (10 ca sáng + 10 ca chiều) cho các ngày thứ 2-6
  - Tổng cộng: **100 ca/nhân viên** cho 5 tháng
- Nhân viên PART_TIME:
  - **8-10 ca/tháng** tùy loại
  - Tổng cộng: **40-50 ca/nhân viên** cho 5 tháng
- Đảm bảo có đủ dữ liệu để test calendar view cho ít nhất 6 tháng

### 2. HẠN SỬ DỤNG VẬT TƯ/THUỐC MEN (ITEM_BATCHES)
**ƯU TIÊN CAO**

- **TẤT CẢ expiry_date phải >= 2027-01-XX (hơn 2 năm từ hiện tại)**
- Không có batch nào hết hạn trong vòng 2 năm
- Có thể thêm một số batch sắp hết hạn (15-30 ngày) để test cảnh báo, nhưng phần lớn phải > 2 năm

### 3. SỐ LƯỢNG VẬT TƯ/THUỐC MEN
**ƯU TIÊN CAO**

- **Vật tư tiêu hao (CONSUMABLE):**
  - initial_quantity: **500-2000 đơn vị**
  - quantity_on_hand: **400-1800 đơn vị** (đã sử dụng một phần)
- **Thuốc men (MEDICINE):**
  - initial_quantity: **200-500 đơn vị**
  - quantity_on_hand: **150-450 đơn vị**
- **Vật liệu nha khoa (MATERIAL/CHEMICAL):**
  - initial_quantity: **100-300 đơn vị**
  - quantity_on_hand: **80-250 đơn vị**

### 4. THỜI GIAN DỮ LIỆU
- **Quá khứ:** Giữ nguyên dữ liệu hiện có (tháng 11/2025, 12/2025, 1/2026)
- **Hiện tại:** Thêm dữ liệu cho tháng 2/2026, 3/2026
- **Tương lai:** Thêm dữ liệu cho tháng 4/2026, 5/2026, 6/2026

---

## LƯU Ý KỸ THUẬT

1. **Sequences:** Đảm bảo reset sequences sau khi insert để tránh conflict
2. **Foreign Keys:** Đảm bảo tất cả foreign keys hợp lệ
3. **Dates:** Sử dụng CURRENT_DATE + INTERVAL để tính toán ngày tháng
4. **Status:** Đảm bảo status values hợp lệ theo ENUM types
5. **ON CONFLICT:** Sử dụng `ON CONFLICT DO NOTHING` hoặc `ON CONFLICT DO UPDATE` để tránh lỗi khi chạy lại script

---

## KIỂM TRA SAU KHI THÊM

1. Đếm số records trong mỗi bảng
2. Kiểm tra expiry_date của tất cả batches (phải >= 2027-01-XX)
3. Kiểm tra số lượng employee_shifts cho mỗi nhân viên (phải đủ ít nhất 100 ca cho 5 tháng)
4. Kiểm tra quantity_on_hand của tất cả batches (phải đủ lớn)
5. Test các API endpoints với dữ liệu mới

---

## FILE CẦN CẬP NHẬT

- `files_from_BE/db/dental-clinic-seed-data.sql`

---

**Cảm ơn team Backend đã hỗ trợ!**

