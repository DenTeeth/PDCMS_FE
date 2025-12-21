# Issue #BE-AUTO-SCHEDULE: Tự động xếp lịch hẹn từ lộ trình điều trị với xử lý ngày lễ và giãn cách dịch vụ

**Ngày tạo:** 2025-12-18  
**Độ ưu tiên:** 🔴 HIGH PRIORITY  
**Người phụ trách:** NGUYÊN  
**Trạng thái:** ✅ HOÀN THÀNH  
**Loại:** Feature - Backend API

---

## 📋 YÊU CẦU GỐC

### Yêu cầu từ FE/Business:

> **Nếu có lộ trình phải tạo sẵn thì phải dựa vào thời gian dự kiến** (vì thời gian này đã có trước) và **nếu trong lộ trình có lịch nghỉ lễ thì phải tính vào** (nghỉ lễ phải thay đổi theo năm vì nó không cố định), check kĩ nhé!
> 
> **HIGH PRIORITY - GIAO NGUYÊN**
> 
> ➡️ **Ngày lễ**: Phải tự động bỏ qua ngày lễ khi xếp lịch
> 
> ➡️ **BE_4 NÊN CÓ:**
> - Ngày tối thiểu (minimum days)
> - Ngày hồi phục (recovery days)
> - Giãn cách (spacing days) để bắt đầu 1 ca appointment mới
> - Nếu = 0 thì nên có thêm rule để gài - **không nên có bao nhiêu cuộc hẹn đó trong 1 ngày**

---

## 🎯 PHÂN TÍCH YÊU CẦU

### Yêu cầu 1: Xếp lịch dựa trên thời gian dự kiến
- Mỗi item trong treatment plan có `estimated_date` (hoặc tính từ `sequence_number`)
- Khi auto-schedule, phải sử dụng ngày này làm gốc
- **KHÔNG** tự động tạo appointment, chỉ trả về **suggestions** để FE review

### Yêu cầu 2: Xử lý ngày lễ động
- Ngày lễ **thay đổi theo năm** (ví dụ: Tết Nguyên Đán, Giỗ Tổ Hùng Vương)
- Nếu `estimated_date` trùng ngày lễ → **tự động dời sang ngày làm việc tiếp theo**
- Phải xử lý **nhiều ngày lễ liên tiếp** (ví dụ: 30/4 + 1/5)

### Yêu cầu 3: Quy tắc giãn cách dịch vụ (Service Spacing Rules)
BE cần bổ sung 3 loại giãn cách cho mỗi dịch vụ:

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `minimum_preparation_days` | Số ngày tối thiểu phải đặt trước | Phẫu thuật Implant cần đặt trước 7 ngày |
| `recovery_days` | Số ngày bệnh nhân cần hồi phục sau dịch vụ | Nhổ răng khôn cần 7-14 ngày hồi phục |
| `spacing_days` | Khoảng cách giữa các lần làm dịch vụ tương tự | Siết niềng răng cách nhau 30 ngày |

### Yêu cầu 4: Giới hạn số lịch hẹn mỗi ngày (Daily Limit)
- Nếu dịch vụ **KHÔNG có** spacing rules (tất cả = 0) → Áp dụng **quy tắc dự phòng**
- **Rule mặc định:** Tối đa **2 lịch hẹn/ngày/bệnh nhân**
- Ngăn chặn tình trạng bệnh nhân có quá nhiều lịch hẹn trong 1 ngày

---

## 🔧 TRIỂN KHAI

### 1. Database Schema

**Bảng `services`** - Đã có sẵn 4 cột sau (từ BE_4):

```sql
ALTER TABLE services
ADD COLUMN minimum_preparation_days INTEGER DEFAULT 0,
ADD COLUMN recovery_days INTEGER DEFAULT 0,
ADD COLUMN spacing_days INTEGER DEFAULT 0,
ADD COLUMN max_appointments_per_day INTEGER DEFAULT NULL;
```

**Dữ liệu mẫu đã có sẵn:**
```sql
-- Nhổ răng khôn mức 2
('EXTRACT_WISDOM_L2', ..., 0, 14, 0, 2)  -- 0 prep, 14 recovery, 0 spacing, max 2/day

-- Phẫu thuật Implant Hàn Quốc
('IMPL_SURGERY_KR', ..., 7, 90, 0, 1)    -- 7 prep, 90 recovery, 0 spacing, max 1/day

-- Siết niềng răng
('ORTHO_ADJUST', ..., 0, 0, 30, NULL)    -- 0 prep, 0 recovery, 30 spacing

-- Cắm Mini-vis Chỉnh nha
('ORTHO_MINIVIS', ..., 0, 3, 0, NULL)    -- 0 prep, 3 recovery, 0 spacing
```

### 2. API Endpoints

#### 🆕 **POST** `/api/v1/treatment-plans/{planId}/auto-schedule`

**Mô tả:** Tạo gợi ý lịch hẹn tự động từ treatment plan với xử lý ngày lễ và spacing rules

**Authentication:** Required (Bearer Token)

**Permissions:** 
- `ROLE_ADMIN` 
- `CREATE_APPOINTMENT`

**Path Parameters:**

| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `planId` | Long | ✅ | ID của treatment plan (ví dụ: 123) |

**Request Body:**

```json
{
  "employeeCode": "NV-2001",
  "roomCode": "ROOM-01",
  "preferredTimeSlots": ["MORNING", "AFTERNOON"],
  "lookAheadDays": 90,
  "forceSchedule": false
}
```

**Request Fields:**

| Tên | Kiểu | Bắt buộc | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| `employeeCode` | String | ❌ | null | Mã nhân viên (bác sĩ) ưu tiên |
| `roomCode` | String | ❌ | null | Mã phòng khám ưu tiên |
| `preferredTimeSlots` | String[] | ❌ | [] | Khung giờ ưu tiên: `MORNING` (8h-12h), `AFTERNOON` (13h-17h), `EVENING` (17h-20h) |
| `lookAheadDays` | Integer | ❌ | 90 | Số ngày tối đa để tìm slot (giới hạn 3 tháng) |
| `forceSchedule` | Boolean | ❌ | false | Bỏ qua spacing rules (chỉ dùng cho trường hợp khẩn cấp) |

**Response Body (200 OK):**

```json
{
  "planId": 123,
  "suggestions": [
    {
      "itemId": 456,
      "serviceCode": "EXTRACT_WISDOM_L2",
      "serviceName": "Nhổ răng khôn mức 2 (Khó)",
      "suggestedDate": "2025-01-02",
      "originalEstimatedDate": "2025-01-01",
      "holidayAdjusted": true,
      "spacingAdjusted": false,
      "adjustmentReason": "Ngày lễ: Tết Dương lịch",
      "availableSlots": [
        {
          "startTime": "09:00",
          "endTime": "10:30",
          "available": true,
          "unavailableReason": null
        },
        {
          "startTime": "14:00",
          "endTime": "15:30",
          "available": true,
          "unavailableReason": null
        }
      ],
      "success": true,
      "errorMessage": null
    },
    {
      "itemId": 457,
      "serviceCode": "IMPL_SURGERY_KR",
      "serviceName": "Phẫu thuật đặt trụ Implant Hàn Quốc",
      "suggestedDate": "2025-01-15",
      "originalEstimatedDate": "2025-01-08",
      "holidayAdjusted": false,
      "spacingAdjusted": true,
      "adjustmentReason": "Yêu cầu 7 ngày chuẩn bị trước",
      "availableSlots": [
        {
          "startTime": "09:00",
          "endTime": "10:30",
          "available": true,
          "unavailableReason": null
        }
      ],
      "success": true,
      "errorMessage": null
    }
  ],
  "totalItemsProcessed": 5,
  "successfulSuggestions": 5,
  "failedItems": 0,
  "summary": {
    "holidayAdjustments": 2,
    "spacingAdjustments": 1,
    "dailyLimitAdjustments": 0,
    "totalDaysShifted": 8,
    "holidaysEncountered": [
      {
        "date": "2025-01-01",
        "name": "Tết Dương lịch",
        "recurring": true
      },
      {
        "date": "2025-04-30",
        "name": "Giải phóng miền Nam",
        "recurring": true
      }
    ]
  }
}
```

**Response Fields:**

| Tên | Kiểu | Mô tả |
|-----|------|-------|
| `planId` | Long | ID treatment plan |
| `suggestions` | Array | Danh sách gợi ý lịch hẹn |
| `suggestions[].itemId` | Long | ID item trong treatment plan |
| `suggestions[].serviceCode` | String | Mã dịch vụ |
| `suggestions[].serviceName` | String | Tên dịch vụ (Tiếng Việt) |
| `suggestions[].suggestedDate` | Date | Ngày gợi ý **sau khi điều chỉnh** |
| `suggestions[].originalEstimatedDate` | Date | Ngày dự kiến ban đầu từ treatment plan |
| `suggestions[].holidayAdjusted` | Boolean | `true` nếu ngày bị dời do trùng ngày lễ |
| `suggestions[].spacingAdjusted` | Boolean | `true` nếu ngày bị dời do spacing rules |
| `suggestions[].adjustmentReason` | String | Lý do điều chỉnh (hiển thị cho user) |
| `suggestions[].availableSlots` | Array | Các khung giờ trống trong ngày gợi ý |
| `suggestions[].success` | Boolean | `true` nếu tạo gợi ý thành công |
| `suggestions[].errorMessage` | String | Thông báo lỗi nếu `success = false` |
| `totalItemsProcessed` | Integer | Tổng số item đã xử lý |
| `successfulSuggestions` | Integer | Số gợi ý thành công |
| `failedItems` | Integer | Số item thất bại |
| `summary.holidayAdjustments` | Integer | Số lần điều chỉnh do ngày lễ |
| `summary.spacingAdjustments` | Integer | Số lần điều chỉnh do spacing rules |
| `summary.dailyLimitAdjustments` | Integer | Số lần điều chỉnh do giới hạn ngày |
| `summary.totalDaysShifted` | Integer | Tổng số ngày đã dời |
| `summary.holidaysEncountered` | Array | Danh sách ngày lễ gặp phải |

**Error Responses:**

```json
// 404 - Plan không tồn tại
{
  "title": "Lộ trình điều trị không tồn tại: 123",
  "status": 404,
  "detail": "PLAN_NOT_FOUND",
  "entityName": "treatment_plan_auto_schedule"
}

// 400 - Plan chưa được phê duyệt
{
  "title": "Lộ trình điều trị chưa được phê duyệt. Chỉ có thể đặt lịch cho lộ trình đã phê duyệt.",
  "status": 400,
  "detail": "PLAN_NOT_APPROVED",
  "entityName": "treatment_plan_auto_schedule"
}

// 200 - Không có item nào sẵn sàng
{
  "planId": 123,
  "suggestions": [],
  "totalItemsProcessed": 0,
  "successfulSuggestions": 0,
  "failedItems": 0,
  "summary": {...}
}
```

---

## 📊 LOGIC FLOW

### Thuật toán Auto-Schedule:

```
FOR mỗi item với status = READY_FOR_BOOKING:
  
  BƯỚC 1: Lấy ngày dự kiến ban đầu
    - Sử dụng estimated_date từ item
    - Nếu NULL → fallback = TODAY + (7 * sequence_number)
  
  BƯỚC 2: Điều chỉnh cho ngày lễ
    - Kiểm tra ngày dự kiến có phải ngày lễ/cuối tuần không
    - Nếu CÓ → dời sang ngày làm việc tiếp theo
    - Xử lý đệ quy cho ngày lễ liên tiếp
    - Set holidayAdjusted = true
  
  BƯỚC 3: Áp dụng spacing rules (nếu không force)
    a) Kiểm tra minimum_preparation_days
       - Nếu ngày gợi ý < (TODAY + minimum_preparation_days)
       - → Dời sang ngày tối thiểu
    
    b) Kiểm tra recovery_days
       - Tìm lịch hẹn gần nhất với dịch vụ này (status = COMPLETED)
       - Nếu ngày gợi ý < (lastAppointmentDate + recovery_days)
       - → Dời sang ngày tối thiểu
    
    c) Kiểm tra spacing_days
       - Tìm lịch hẹn gần nhất với dịch vụ này
       - Nếu khoảng cách < spacing_days
       - → Dời sang ngày thỏa mãn spacing
    
    d) Điều chỉnh về working day (nếu bị dời)
       - Đảm bảo ngày cuối cũng là working day
       - Set spacingAdjusted = true
  
  BƯỚC 4: Kiểm tra giới hạn ngày (Daily Limit)
    - Chỉ áp dụng nếu ALL spacing rules = 0
    - Đếm số lịch hẹn của bệnh nhân trong ngày gợi ý
    - Nếu >= max_per_day (default: 2)
    - → Dời sang ngày tiếp theo
  
  BƯỚC 5: Tìm khung giờ trống
    - Kiểm tra doctor/room availability (tạm thời trả static slots)
    - Trả về danh sách time slots
  
  BƯỚC 6: Tạo suggestion
    - Ghi lại ngày ban đầu vs ngày gợi ý
    - Ghi lại lý do điều chỉnh
    - success = true
  
  IF có lỗi:
    - Ghi lại error message
    - success = false
    - Tiếp tục với item tiếp theo

RETURN tổng hợp tất cả suggestions
```

---

## 🧪 TEST CASES

### Test Case 1: Ngày lễ đơn giản
**Input:**
- Item với `estimated_date = 2025-01-01` (Tết Dương lịch)

**Expected Output:**
```json
{
  "suggestedDate": "2025-01-02",
  "originalEstimatedDate": "2025-01-01",
  "holidayAdjusted": true,
  "adjustmentReason": "Ngày lễ"
}
```

### Test Case 2: Ngày lễ liên tiếp
**Input:**
- Item với `estimated_date = 2025-04-30` (Giải phóng miền Nam)
- 2025-05-01 cũng là ngày lễ (Quốc tế Lao động)

**Expected Output:**
```json
{
  "suggestedDate": "2025-05-02",
  "originalEstimatedDate": "2025-04-30",
  "holidayAdjusted": true,
  "adjustmentReason": "Ngày lễ"
}
```

### Test Case 3: Recovery period
**Input:**
- Bệnh nhân đã nhổ răng khôn ngày 2025-01-01
- Dịch vụ `EXTRACT_WISDOM_L2` có `recovery_days = 14`
- Item mới với `estimated_date = 2025-01-05`

**Expected Output:**
```json
{
  "suggestedDate": "2025-01-15",
  "originalEstimatedDate": "2025-01-05",
  "spacingAdjusted": true,
  "adjustmentReason": "Yêu cầu 14 ngày hồi phục sau lần điều trị trước"
}
```

### Test Case 4: Preparation days
**Input:**
- Hôm nay: 2025-01-10
- Item với dịch vụ `IMPL_SURGERY_KR` (có `minimum_preparation_days = 7`)
- `estimated_date = 2025-01-12` (chỉ 2 ngày nữa)

**Expected Output:**
```json
{
  "suggestedDate": "2025-01-17",
  "originalEstimatedDate": "2025-01-12",
  "spacingAdjusted": true,
  "adjustmentReason": "Dịch vụ 'Phẫu thuật đặt trụ Implant Hàn Quốc' yêu cầu đặt trước tối thiểu 7 ngày"
}
```

### Test Case 5: Spacing interval
**Input:**
- Bệnh nhân đã siết niềng răng ngày 2024-12-20
- Dịch vụ `ORTHO_ADJUST` có `spacing_days = 30`
- Item mới với `estimated_date = 2025-01-05` (chỉ 16 ngày sau)

**Expected Output:**
```json
{
  "suggestedDate": "2025-01-19",
  "originalEstimatedDate": "2025-01-05",
  "spacingAdjusted": true,
  "adjustmentReason": "Dịch vụ 'Siết niềng' yêu cầu giãn cách 30 ngày giữa các lần điều trị"
}
```

### Test Case 6: Daily limit fallback
**Input:**
- Dịch vụ có `spacing_days = 0, recovery_days = 0, minimum_preparation_days = 0`
- Bệnh nhân đã có 2 lịch hẹn ngày 2025-01-15
- Item mới với `estimated_date = 2025-01-15`

**Expected Output:**
```json
{
  "suggestedDate": "2025-01-16",
  "originalEstimatedDate": "2025-01-15",
  "spacingAdjusted": false,
  "adjustmentReason": "Bệnh nhân đã có 2 lịch hẹn vào ngày 2025-01-15 (giới hạn: 2 lịch/ngày)"
}
```

### Test Case 7: Kết hợp nhiều rules
**Input:**
- Item với `estimated_date = 2025-01-01` (Tết Dương lịch)
- Bệnh nhân có lịch hẹn cùng dịch vụ ngày 2024-12-25
- Dịch vụ có `recovery_days = 10`

**Expected Output:**
```json
{
  "suggestedDate": "2025-01-06",
  "originalEstimatedDate": "2025-01-01",
  "holidayAdjusted": true,
  "spacingAdjusted": true,
  "adjustmentReason": "Ngày lễ; Yêu cầu 10 ngày hồi phục"
}
```

---

## 📝 SAMPLE POSTMAN/CURL

### Curl Command:

```bash
curl -X POST 'http://localhost:8080/api/v1/treatment-plans/123/auto-schedule' \
  -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
  "employeeCode": "NV-2001",
  "roomCode": "ROOM-01",
  "preferredTimeSlots": ["MORNING", "AFTERNOON"],
  "lookAheadDays": 90,
  "forceSchedule": false
}'
```

### Postman Collection:

```json
{
  "info": {
    "name": "Auto-Schedule Treatment Plans",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Generate Auto-Schedule",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"employeeCode\": \"NV-2001\",\n  \"roomCode\": \"ROOM-01\",\n  \"preferredTimeSlots\": [\"MORNING\"],\n  \"lookAheadDays\": 90,\n  \"forceSchedule\": false\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/treatment-plans/{{plan_id}}/auto-schedule",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "treatment-plans", "{{plan_id}}", "auto-schedule"]
        }
      }
    }
  ]
}
```

---

## 🎨 FE INTEGRATION GUIDE

### Bước 1: Gọi API Auto-Schedule

```typescript
interface AutoScheduleRequest {
  employeeCode?: string;
  roomCode?: string;
  preferredTimeSlots?: ('MORNING' | 'AFTERNOON' | 'EVENING')[];
  lookAheadDays?: number;
  forceSchedule?: boolean;
}

interface AutoScheduleResponse {
  planId: number;
  suggestions: AppointmentSuggestion[];
  totalItemsProcessed: number;
  successfulSuggestions: number;
  failedItems: number;
  summary: SchedulingSummary;
}

const generateAutoSchedule = async (planId: number, request: AutoScheduleRequest) => {
  const response = await fetch(`/api/v1/treatment-plans/${planId}/auto-schedule`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate auto-schedule');
  }
  
  return await response.json() as AutoScheduleResponse;
};
```

### Bước 2: Hiển thị Suggestions

```tsx
function AutoScheduleSuggestions({ planId }: { planId: number }) {
  const [suggestions, setSuggestions] = useState<AppointmentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      const result = await generateAutoSchedule(planId, {
        preferredTimeSlots: ['MORNING', 'AFTERNOON'],
        lookAheadDays: 90
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={handleGenerateSchedule} disabled={loading}>
        {loading ? 'Đang tạo gợi ý...' : 'Tự động xếp lịch'}
      </button>
      
      <div className="suggestions-list">
        {suggestions.map(suggestion => (
          <SuggestionCard key={suggestion.itemId} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
}
```

### Bước 3: Hiển thị điều chỉnh

```tsx
function SuggestionCard({ suggestion }: { suggestion: AppointmentSuggestion }) {
  const hasAdjustment = suggestion.holidayAdjusted || suggestion.spacingAdjusted;
  
  return (
    <div className="suggestion-card">
      <h3>{suggestion.serviceName}</h3>
      
      <div className="date-info">
        {hasAdjustment && (
          <div className="adjustment-badge">
            <span className="original-date">
              Dự kiến: {suggestion.originalEstimatedDate}
            </span>
            <span className="arrow">→</span>
          </div>
        )}
        
        <div className="suggested-date">
          <strong>Ngày gợi ý: {suggestion.suggestedDate}</strong>
          {suggestion.holidayAdjusted && <Badge color="orange">Đã điều chỉnh ngày lễ</Badge>}
          {suggestion.spacingAdjusted && <Badge color="blue">Đã điều chỉnh giãn cách</Badge>}
        </div>
      </div>
      
      {suggestion.adjustmentReason && (
        <Alert type="info">
          <InfoIcon /> {suggestion.adjustmentReason}
        </Alert>
      )}
      
      <div className="time-slots">
        <h4>Khung giờ trống:</h4>
        {suggestion.availableSlots.map((slot, index) => (
          <TimeSlotButton
            key={index}
            slot={slot}
            onClick={() => handleBookSlot(suggestion, slot)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Bước 4: Đặt lịch từ suggestion

```typescript
const handleBookSlot = async (suggestion: AppointmentSuggestion, slot: TimeSlot) => {
  // Ghép date + time
  const appointmentDateTime = `${suggestion.suggestedDate}T${slot.startTime}`;
  
  // Gọi API create appointment
  const request = {
    patientCode: patient.patientCode,
    employeeCode: selectedDoctor.employeeCode,
    roomCode: selectedRoom.roomCode,
    appointmentStartTime: appointmentDateTime,
    serviceCodes: [suggestion.serviceCode],
    patientPlanItemIds: [suggestion.itemId], // Link với treatment plan
    notes: `Tự động xếp lịch từ treatment plan #${planId}`
  };
  
  await fetch('/api/v1/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  alert('Đã đặt lịch thành công!');
};
```

---

## 🚨 LƯU Ý QUAN TRỌNG

### Cho FE:
1. **Không tự động book**: API chỉ trả về suggestions, FE phải cho user **xác nhận** trước khi đặt lịch
2. **Hiển thị điều chỉnh rõ ràng**: Phải show ngày gốc vs ngày gợi ý + lý do
3. **Xử lý failed items**: Một số item có thể fail (dịch vụ không tồn tại, conflict, etc.)
4. **Summary statistics**: Hiển thị tổng quan về các điều chỉnh để user biết

### Cho BE:
1. **Chỉ xử lý items READY_FOR_BOOKING**: Không xử lý items đã SCHEDULED hoặc COMPLETED
2. **Plan phải APPROVED**: Chỉ auto-schedule cho plan đã được phê duyệt
3. **Không tạo thật appointment**: Chỉ trả suggestions, FE sẽ gọi API create appointment
4. **Graceful error handling**: Nếu 1 item fail, vẫn tiếp tục với các items khác

### Business Rules:
1. **Weekend = Không làm việc**: Tự động skip Thứ 7 & Chủ Nhật
2. **Holiday data**: Admin phải update bảng `holidays` hàng năm
3. **Spacing rules có thể = 0**: Nếu = 0 thì không có hạn chế về loại đó
4. **Force schedule**: Chỉ dùng cho trường hợp khẩn cấp, bypass tất cả rules

---

## ✅ CHECKLIST TRIỂN KHAI

- [x] ✅ Database schema đã có sẵn (từ BE_4)
- [x] ✅ ServiceSpacingValidator.java - Validate spacing rules
- [x] ✅ HolidayValidator enhancement - Working day methods
- [x] ✅ TreatmentPlanAutoScheduleService.java - Main logic
- [x] ✅ AutoScheduleRequest/Response DTOs
- [x] ✅ TreatmentPlanController endpoint
- [x] ✅ AppointmentRepository queries
- [x] ✅ PatientPlanItemRepository queries
- [ ] ⏳ Manual testing với sample data
- [ ] ⏳ FE integration
- [ ] ⏳ UAT with business team
- [ ] ⏳ Production deployment

---

## 📞 SUPPORT & CONTACT

**Backend Developer:** NGUYÊN  
**Issue Tracking:** ISSUE_BE_AUTO_SCHEDULE  
**Documentation:** 
- [Implementation Summary](./AUTO_SCHEDULE_IMPLEMENTATION_SUMMARY.md)
- [Quick Start Guide](./AUTO_SCHEDULE_QUICK_START.md)
- [Original Issue](./ISSUE_AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION.md)

**Questions?** Contact team qua Slack channel #backend-support

---

**END OF DOCUMENT**
