# Issue #32 - Debug Steps cho 500 Error

## Tình huống hiện tại

**Request Payload:**
```json
{
  "planName": "Sample2",
  "doctorEmployeeCode": "EMP002",
  "paymentType": "FULL",
  "discountAmount": 0,
  "startDate": "2025-12-02",
  "expectedEndDate": "2025-12-04",
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Ass",
      "items": [
        {
          "serviceCode": "FILLING_GAP",
          "sequenceNumber": 1,
          "quantity": 1,
          "price": 500000
        }
      ]
    }
  ]
}
```

**Error Response:**
```json
{
  "statusCode": 500,
  "error": "error.internal",
  "message": "Internal server error",
  "data": null
}
```

## Các nguyên nhân có thể

### 1. Doctor Specialization Mismatch (Khả năng cao)

**Service:** `FILLING_GAP` có `specialization_id: 7` (General Dentistry)

**Cần kiểm tra:**
- Doctor `EMP002` có specialization nào?
- Doctor `EMP002` có specialization phù hợp với `FILLING_GAP` không?

**Cách test:**
1. Kiểm tra seed data: `SELECT * FROM employees WHERE employee_code = 'EMP002'`
2. Kiểm tra doctor specializations: `SELECT * FROM employee_specializations WHERE employee_id = (SELECT employee_id FROM employees WHERE employee_code = 'EMP002')`
3. Thử với doctor khác có specialization phù hợp (ví dụ: EMP001 nếu có spec 7)

### 2. BE chưa deploy code mới (Khả năng cao)

**Vấn đề:** BE code đã fix `status = null` khi `approval_status = DRAFT`, nhưng có thể chưa deploy.

**Cần kiểm tra:**
- BE đã deploy code mới chưa?
- Database constraint có cho phép `status = null + approval_status = DRAFT` không?

**Cách test:**
1. Yêu cầu BE team xác nhận đã deploy
2. Kiểm tra BE logs để xem có constraint violation không
3. Test với BE code mới

### 3. Service không tồn tại hoặc inactive

**Cần kiểm tra:**
- Service `FILLING_GAP` có tồn tại trong database không?
- Service có `is_active = true` không?

**Cách test:**
```sql
SELECT * FROM dental_services WHERE service_code = 'FILLING_GAP';
```

### 4. Patient không tồn tại hoặc inactive

**Cần kiểm tra:**
- Patient `BN-1004` có tồn tại không?
- Patient có `is_active = true` không?

**Cách test:**
```sql
SELECT * FROM patients WHERE patient_code = 'BN-1004';
```

### 5. NullPointerException trong BE

**Có thể xảy ra tại:**
- `planCode` generation
- Service lookup
- Doctor/Patient lookup
- Phase/Item creation

**Cần kiểm tra:**
- BE logs để xem stack trace
- Xác nhận tất cả entities tồn tại

## Các bước debug

### Bước 1: Kiểm tra BE Logs

Yêu cầu BE team cung cấp:
1. Full stack trace từ BE logs
2. Request payload nhận được từ FE
3. Database constraint errors (nếu có)
4. Validation errors (nếu có)

### Bước 2: Test với data đơn giản

Thử tạo plan với:
- Doctor có specialization phù hợp (ví dụ: EMP001 nếu có spec 7)
- Service `FILLING_GAP` (đã xác nhận tồn tại)
- 1 phase, 1 item
- Không có dates
- `discountAmount = 0`

### Bước 3: Test với service khác

Thử với service khác có cùng specialization:
- `FILLING_COMP` (cũng spec 7, General Dentistry)
- Xem có lỗi tương tự không

### Bước 4: Kiểm tra Database

```sql
-- Kiểm tra doctor specializations
SELECT 
  e.employee_code,
  e.full_name,
  s.specialization_name,
  s.specialization_id
FROM employees e
LEFT JOIN employee_specializations es ON e.employee_id = es.employee_id
LEFT JOIN specializations s ON es.specialization_id = s.specialization_id
WHERE e.employee_code = 'EMP002';

-- Kiểm tra service
SELECT 
  service_code,
  service_name,
  specialization_id,
  is_active
FROM dental_services
WHERE service_code = 'FILLING_GAP';

-- Kiểm tra patient
SELECT 
  patient_code,
  full_name,
  is_active
FROM patients
WHERE patient_code = 'BN-1004';
```

## Kết luận

**Khả năng cao nhất:**
1. Doctor `EMP002` không có specialization phù hợp với `FILLING_GAP`
2. BE chưa deploy code mới với fix `status = null`

**Khuyến nghị:**
1. Test với doctor khác có specialization phù hợp
2. Yêu cầu BE team kiểm tra logs và xác nhận deployment
3. Nếu vẫn lỗi, cung cấp BE logs để debug tiếp

---

**Last Updated:** 2025-12-02

