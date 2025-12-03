# FE Treatment Plan Creation - Debug Guide

## Vấn đề hiện tại

BE đã xác nhận code logic đúng, nhưng FE vẫn gặp lỗi 500 khi tạo Custom Treatment Plan.

**Error Response từ BE:**
```json
{
  "statusCode": 500,
  "error": "error.internal",
  "message": "Internal server error",
  "data": null
}
```

**Request Payload từ log:**
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

**Phân tích:**
- ✅ Request payload structure đúng
- ✅ `price: 500000` được gửi (FE auto-fill từ service, đúng)
- ✅ Service `FILLING_GAP` tồn tại với `specialization_id: 7` (General Dentistry)
- ⚠️ **Vấn đề có thể:** Doctor `EMP002` không có specialization phù hợp với `FILLING_GAP`

## Các thay đổi đã thực hiện

### 1. Request Payload Structure (✅ Fixed)

**File:** `src/components/treatment-plans/CreateCustomPlanModal.tsx` (line 886-920)

**Thay đổi:**
- ✅ Chỉ include `price` trong item nếu có giá trị > 0 (để BE auto-fill nếu không có)
- ✅ Gửi `startDate` và `expectedEndDate` là `null` nếu empty string (đúng với BE DTO `LocalDate`)
- ✅ Đảm bảo không gửi `undefined` values

**Request payload structure:**
```typescript
{
  planName: string,
  doctorEmployeeCode: string,
  paymentType: PaymentType,
  discountAmount: number, // Always >= 0
  startDate: string | null, // yyyy-MM-dd format or null
  expectedEndDate: string | null, // yyyy-MM-dd format or null
  phases: [
    {
      phaseNumber: number,
      phaseName: string,
      items: [
        {
          serviceCode: string,
          price?: number, // Optional - only included if > 0
          sequenceNumber: number,
          quantity: number
        }
      ]
    }
  ]
}
```

### 2. Type Definitions (✅ Already Correct)

**File:** `src/types/treatmentPlan.ts`

- ✅ `CreateCustomPlanRequest` - đúng với BE DTO
- ✅ `CreateCustomPlanPhaseRequest` - `estimatedDurationDays` là optional
- ✅ `CreateCustomPlanItemRequest` - `price` là optional
- ✅ `status: TreatmentPlanStatus | null` - cho phép null khi DRAFT

### 3. Error Handling (✅ Already Correct)

**File:** `src/components/treatment-plans/CreateCustomPlanModal.tsx` (line 924-963)

- ✅ Handle 400 Bad Request (validation errors)
- ✅ Handle 500 Internal Server Error
- ✅ Log error response chi tiết

## Cách debug

### Bước 1: Kiểm tra Request Payload

1. Mở browser console
2. Tạo custom treatment plan
3. Xem log "Creating custom plan (API 5.4):" để kiểm tra request payload
4. Đảm bảo:
   - Không có field `undefined`
   - `discountAmount` là number (>= 0)
   - `startDate` và `expectedEndDate` là string (yyyy-MM-dd) hoặc `null`
   - `price` chỉ có trong item nếu > 0

### Bước 2: Kiểm tra Error Response

1. Expand "Error response: Object" trong console
2. Xem các field:
   - `errorCode` hoặc `code`
   - `message`
   - `detail`
   - `errors` (nếu có validation errors)

### Bước 3: Kiểm tra BE Logs

Yêu cầu BE team cung cấp:
- Stack trace đầy đủ
- Request payload nhận được từ FE
- Database constraint errors (nếu có)
- Validation errors (nếu có)

### Bước 4: Test với data đơn giản

Thử tạo plan với:
- 1 phase
- 1 item
- Service code hợp lệ
- Doctor có specialization phù hợp
- Không có dates
- discountAmount = 0

## Các vấn đề có thể xảy ra

### 1. JSON Serialization

**Vấn đề:** Axios có thể serialize `undefined` values thành `null` hoặc bỏ qua.

**Giải pháp:** ✅ Đã fix - chỉ include fields có giá trị

### 2. Date Format

**Vấn đề:** FE gửi date string, BE expect `LocalDate`.

**Giải pháp:** ✅ Đã fix - gửi `null` nếu empty, string (yyyy-MM-dd) nếu có giá trị

### 3. Price Field

**Vấn đề:** FE không gửi `price`, nhưng BE có thể expect field này.

**Giải pháp:** ✅ Đã fix - chỉ include `price` nếu có giá trị > 0, BE sẽ auto-fill nếu không có

### 4. Validation Errors

**Vấn đề:** BE có thể reject request vì validation errors.

**Giải pháp:** ✅ FE đã handle và hiển thị error message chi tiết

## Next Steps

1. **Test lại với code mới:**
   - Tạo custom treatment plan từ FE UI
   - Kiểm tra request payload trong console
   - Xem error response chi tiết

2. **Nếu vẫn lỗi:**
   - Gửi request payload và error response cho BE team
   - Yêu cầu BE team kiểm tra logs
   - Xác nhận BE đã deploy code mới

3. **Nếu thành công:**
   - Update Issue #32 trong `BE_OPEN_ISSUES.md` thành RESOLVED
   - Test các scenarios khác (template plan, etc.)

---

**Last Updated:** 2025-12-02  
**Status:** ⚠️ Pending verification after code changes

