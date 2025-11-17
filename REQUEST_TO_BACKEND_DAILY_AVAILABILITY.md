# 📋 Request to Backend - Daily Availability API

## 🎯 Mục đích
Cần thêm API để hiển thị **chi tiết slot còn trống theo từng ngày** của một tháng cụ thể trong slot part-time.

---

## 🔗 API Endpoint Cần Thêm

### **GET** `/api/v1/registrations/part-time-flex/slots/{slotId}/daily-availability`

**Query Parameters:**
- `month` (required): Tháng cần xem chi tiết, format `YYYY-MM` (ví dụ: `2025-11`, `2025-12`)

**Path Parameters:**
- `slotId` (required): ID của slot cần xem chi tiết

---

## 📤 Request Example

```http
GET /api/v1/registrations/part-time-flex/slots/1/daily-availability?month=2025-11
Authorization: Bearer {token}
```

---

## 📥 Response Schema

### Success Response (200 OK):

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "slotId": 1,
    "shiftName": "Ca Part-time Sáng (8h-12h)",
    "dayOfWeek": "MONDAY",
    "quota": 10,
    "month": "2025-11",
    "monthName": "November 2025",
    "totalWorkingDays": 11,
    "totalDaysAvailable": 1,
    "totalDaysPartial": 2,
    "totalDaysFull": 8,
    "dailyAvailability": [
      {
        "date": "2025-11-03",
        "dayOfWeek": "MONDAY",
        "quota": 10,
        "registered": 0,
        "remaining": 10,
        "status": "AVAILABLE"
      },
      {
        "date": "2025-11-10",
        "dayOfWeek": "MONDAY",
        "quota": 10,
        "registered": 8,
        "remaining": 2,
        "status": "PARTIAL"
      },
      {
        "date": "2025-11-17",
        "dayOfWeek": "MONDAY",
        "quota": 10,
        "registered": 10,
        "remaining": 0,
        "status": "FULL"
      },
      {
        "date": "2025-11-24",
        "dayOfWeek": "MONDAY",
        "quota": 10,
        "registered": 10,
        "remaining": 0,
        "status": "FULL"
      }
    ]
  }
}
```

### Response Fields Explanation:

#### Top Level:
| Field | Type | Description |
|-------|------|-------------|
| `slotId` | `number` | ID của slot |
| `shiftName` | `string` | Tên ca làm việc |
| `dayOfWeek` | `string` | Thứ của slot (MONDAY, TUESDAY, ...) |
| `quota` | `number` | Quota mỗi ngày |
| `month` | `string` | Tháng đang xem (format: YYYY-MM) |
| `monthName` | `string` | Tên tháng đầy đủ (format: "Month YYYY") |
| `totalWorkingDays` | `number` | Tổng số ngày làm việc trong tháng (số ngày match với dayOfWeek) |
| `totalDaysAvailable` | `number` | Số ngày còn trống hoàn toàn |
| `totalDaysPartial` | `number` | Số ngày gần đầy |
| `totalDaysFull` | `number` | Số ngày đã đầy |

#### dailyAvailability Array:
| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | Ngày cụ thể (ISO format: YYYY-MM-DD) |
| `dayOfWeek` | `string` | Thứ của ngày đó |
| `quota` | `number` | Quota của ngày đó |
| `registered` | `number` | Số người đã đăng ký |
| `remaining` | `number` | Số slot còn lại (quota - registered) |
| `status` | `string` | Trạng thái: `AVAILABLE`, `PARTIAL`, hoặc `FULL` |

#### Status Logic:
- `AVAILABLE`: `remaining === quota` (100% còn trống)
- `PARTIAL`: `remaining > 0 && remaining < quota` (Còn 1 số slot)
- `FULL`: `remaining === 0` (Đã đầy)

---

## 🧮 Business Logic

### 1. **Filter Working Days**
Chỉ lấy các ngày trong tháng có `dayOfWeek` khớp với slot.

Ví dụ:
- Slot có `dayOfWeek = "MONDAY"`
- Tháng 11/2025 → Chỉ lấy: 03, 10, 17, 24 (4 ngày Monday)
- Tháng 12/2025 → Chỉ lấy: 01, 08, 15, 22, 29 (5 ngày Monday)

### 2. **Multi-Day Slots (BONUS)**
Nếu slot có nhiều ngày (e.g., `dayOfWeek = "MONDAY,WEDNESDAY"`):
- Lấy cả Monday và Wednesday của tháng đó
- Mỗi ngày một entry riêng trong `dailyAvailability`

### 3. **Calculate Registrations Per Date**
Cho mỗi ngày làm việc:
```sql
-- Đếm số registration active trong ngày đó
SELECT COUNT(*) 
FROM shift_registrations sr
WHERE sr.part_time_slot_id = {slotId}
  AND sr.status = 'APPROVED'
  AND sr.effective_from <= {date}
  AND (sr.effective_to IS NULL OR sr.effective_to >= {date})
```

### 4. **Determine Status**
```java
if (remaining == quota) {
    status = "AVAILABLE";
} else if (remaining > 0 && remaining < quota) {
    status = "PARTIAL";
} else {
    status = "FULL";
}
```

---

## ❌ Error Responses

### 404 Not Found - Slot không tồn tại:
```json
{
  "statusCode": 404,
  "message": "Slot not found",
  "error": "SLOT_NOT_FOUND"
}
```

### 400 Bad Request - Invalid month format:
```json
{
  "statusCode": 400,
  "message": "Invalid month format. Expected YYYY-MM",
  "error": "INVALID_MONTH_FORMAT"
}
```

### 403 Forbidden - Employee không có quyền:
```json
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "FORBIDDEN"
}
```

---

## 🔐 Security & Permissions

### Authorization:
- ✅ **Employee (Part-time)**: Có thể xem daily availability của bất kỳ slot nào
- ✅ **Admin/Manager**: Có thể xem tất cả
- ❌ **Guest/Unauthenticated**: Không được truy cập

### Rate Limiting (Optional):
- Recommend: 100 requests/minute per user
- Prevent abuse/spam

---

## 🧪 Test Cases

### Test 1: Valid Request - November 2025
```bash
curl -X GET "http://localhost:8080/api/v1/registrations/part-time-flex/slots/1/daily-availability?month=2025-11" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200
- Response có 4-5 entries trong `dailyAvailability` (tùy số Monday trong tháng)
- Mỗi entry có đầy đủ fields: date, quota, registered, remaining, status

### Test 2: Invalid Month Format
```bash
curl -X GET "http://localhost:8080/api/v1/registrations/part-time-flex/slots/1/daily-availability?month=2025/11" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 400
- Error: "INVALID_MONTH_FORMAT"

### Test 3: Slot Not Found
```bash
curl -X GET "http://localhost:8080/api/v1/registrations/part-time-flex/slots/99999/daily-availability?month=2025-11" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 404
- Error: "SLOT_NOT_FOUND"

### Test 4: Multi-Day Slot (e.g., MONDAY,WEDNESDAY)
```bash
curl -X GET "http://localhost:8080/api/v1/registrations/part-time-flex/slots/5/daily-availability?month=2025-11" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200
- `dailyAvailability` có entries cho cả Monday và Wednesday
- Entries được sort theo date ascending

---

## 🎨 Frontend Integration Plan

### Step 1: Add TypeScript Types
```typescript
// src/types/workSlot.ts

export interface DailyAvailability {
  date: string;              // "2025-11-03"
  dayOfWeek: string;         // "MONDAY"
  quota: number;             // 10
  registered: number;        // 8
  remaining: number;         // 2
  status: 'AVAILABLE' | 'PARTIAL' | 'FULL';
}

export interface DailyAvailabilityResponse {
  slotId: number;
  shiftName: string;
  dayOfWeek: string;
  quota: number;
  month: string;             // "2025-11"
  monthName: string;         // "November 2025"
  totalWorkingDays: number;
  totalDaysAvailable: number;
  totalDaysPartial: number;
  totalDaysFull: number;
  dailyAvailability: DailyAvailability[];
}
```

### Step 2: Add Service Method
```typescript
// src/services/workSlotService.ts

async getDailyAvailability(
  slotId: number, 
  month: string
): Promise<DailyAvailabilityResponse> {
  const response = await axiosInstance.get(
    `/registrations/part-time-flex/slots/${slotId}/daily-availability`,
    { params: { month } }
  );
  return response.data.data;
}
```

### Step 3: Create Modal Component
```typescript
// src/components/employee/DailyAvailabilityModal.tsx

export const DailyAvailabilityModal = ({ 
  slotId, 
  month, 
  isOpen, 
  onClose 
}: Props) => {
  const [data, setData] = useState<DailyAvailabilityResponse | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      workSlotService.getDailyAvailability(slotId, month)
        .then(setData)
        .catch(error => toast.error('Không thể tải dữ liệu'));
    }
  }, [isOpen, slotId, month]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data?.monthName}</DialogTitle>
        </DialogHeader>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {data?.dailyAvailability.map(day => (
            <div 
              key={day.date}
              className={`p-3 rounded text-center ${
                day.status === 'AVAILABLE' ? 'bg-green-100' :
                day.status === 'PARTIAL' ? 'bg-yellow-100' :
                'bg-red-100'
              }`}
            >
              <div className="text-xs">{format(parseISO(day.date), 'dd')}</div>
              <div className="text-lg font-bold">{day.remaining}</div>
              <div className="text-[10px]">còn</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### Step 4: Update Click Handler
```typescript
// src/app/employee/registrations/page.tsx

// OLD (tạm thời):
onClick={() => {
  toast.info(`${month.monthName}: ${month.totalDatesAvailable}/${month.totalWorkingDays} ngày còn trống`);
}}

// NEW (sau khi BE có API):
const [selectedMonth, setSelectedMonth] = useState<{slotId: number, month: string} | null>(null);

onClick={() => {
  setSelectedMonth({ slotId: slot.slotId, month: month.month });
}}

// Add modal component:
{selectedMonth && (
  <DailyAvailabilityModal
    slotId={selectedMonth.slotId}
    month={selectedMonth.month}
    isOpen={!!selectedMonth}
    onClose={() => setSelectedMonth(null)}
  />
)}
```

---

## 📊 Database Query Example

### Query Structure (Reference):
```sql
WITH working_dates AS (
  -- Generate all dates in month matching dayOfWeek
  SELECT 
    generate_series(
      DATE_TRUNC('month', :month::DATE),
      DATE_TRUNC('month', :month::DATE) + INTERVAL '1 month' - INTERVAL '1 day',
      INTERVAL '1 day'
    )::DATE AS date
),
filtered_dates AS (
  -- Filter by dayOfWeek of slot
  SELECT wd.date
  FROM working_dates wd
  WHERE EXTRACT(DOW FROM wd.date) = :dayOfWeekNumber  -- 1=Monday, 2=Tuesday, ...
),
registrations_per_date AS (
  -- Count registrations for each date
  SELECT 
    fd.date,
    COUNT(sr.registration_id) AS registered
  FROM filtered_dates fd
  LEFT JOIN shift_registrations sr
    ON sr.part_time_slot_id = :slotId
    AND sr.status = 'APPROVED'
    AND sr.effective_from <= fd.date
    AND (sr.effective_to IS NULL OR sr.effective_to >= fd.date)
  GROUP BY fd.date
)
SELECT 
  rpd.date,
  :quota AS quota,
  COALESCE(rpd.registered, 0) AS registered,
  :quota - COALESCE(rpd.registered, 0) AS remaining,
  CASE
    WHEN COALESCE(rpd.registered, 0) = 0 THEN 'AVAILABLE'
    WHEN COALESCE(rpd.registered, 0) >= :quota THEN 'FULL'
    ELSE 'PARTIAL'
  END AS status
FROM registrations_per_date rpd
ORDER BY rpd.date;
```

---

## ✅ Acceptance Criteria

### Backend:
- [ ] API endpoint implemented: `GET /slots/{slotId}/daily-availability`
- [ ] Query parameter `month` validated (format: YYYY-MM)
- [ ] Response matches schema exactly
- [ ] Only returns dates matching slot's `dayOfWeek`
- [ ] Counts active registrations per date correctly
- [ ] Status calculated correctly (AVAILABLE/PARTIAL/FULL)
- [ ] Error handling for invalid inputs (404, 400)
- [ ] Authorization checks (requires valid token)
- [ ] Unit tests written (>80% coverage)
- [ ] API documented in Swagger/OpenAPI

### Frontend (after BE ready):
- [ ] Service method added to `workSlotService.ts`
- [ ] TypeScript types added to `workSlot.ts`
- [ ] Modal component created: `DailyAvailabilityModal.tsx`
- [ ] Click handler updated to open modal
- [ ] Calendar grid displays correctly
- [ ] Color coding works (green/yellow/red)
- [ ] Loading state shown while fetching
- [ ] Error handling with toast notification

---

## 🚀 Priority & Timeline

**Priority:** Medium-High  
**Estimated Effort:** 2-3 days (Backend)  
**Dependencies:** None (extends existing slot system)

**Suggested Timeline:**
- Day 1: Backend API implementation + Unit tests
- Day 2: Integration testing + Bug fixes
- Day 3: Frontend integration + E2E testing

---

## 📞 Contact

Nếu có câu hỏi hoặc cần clarification:
- Frontend Lead: [Your Name]
- Backend Team: [Backend Team Contact]

---

**Status:** 📋 Pending Backend Implementation  
**Created:** November 17, 2025  
**Last Updated:** November 17, 2025
