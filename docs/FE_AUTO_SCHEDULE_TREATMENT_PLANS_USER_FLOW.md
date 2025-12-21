# FE Auto-Schedule Treatment Plans - User Flow & UI Design

**Ngày tạo:** 2025-01-07  
**Status:** 📋 DESIGN PHASE  
**Related Issues:**
- [ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS.md](./ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS.md)
- [ISSUE_BE_EMPLOYEE_CONTRACT_VALIDATION_IN_TREATMENT_PLANS.md](./ISSUE_BE_EMPLOYEE_CONTRACT_END_DATE_VALIDATION.md)

---

## 📋 LUỒNG THAO TÁC TỔNG QUAN

### Flow Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User vào trang Treatment Plan Detail                     │
│    - Xem danh sách items với status READY_FOR_BOOKING      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User click nút "Tự động xếp lịch"                       │
│    - Chỉ hiện khi có items READY_FOR_BOOKING                │
│    - Plan phải APPROVED                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Modal "Cấu hình tự động xếp lịch" mở ra                  │
│    - Form nhập preferences (employeeCode, roomCode, etc.)    │
│    - User có thể skip (dùng defaults)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User click "Tạo gợi ý" → FE gọi API auto-schedule       │
│    POST /api/v1/treatment-plans/{planId}/auto-schedule      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. BE trả về suggestions với:                               │
│    - Ngày gợi ý (sau khi điều chỉnh ngày lễ/spacing)        │
│    - Lý do điều chỉnh                                        │
│    - Warning (nếu employee contract expires)                │
│    - Available time slots                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. FE hiển thị danh sách suggestions                         │
│    - Summary card (tổng quan điều chỉnh)                    │
│    - Suggestion cards (từng item)                            │
│    - Warning badges nếu có                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. User xem và chọn khung giờ cho từng suggestion          │
│    - Click vào time slot button                              │
│    - Nếu có warning/requiresReassign → disable slot          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. User click "Xác nhận đặt lịch" (cho từng suggestion)     │
│    - FE gọi API: POST /api/v1/appointments                  │
│    - Link appointment với plan item (patientPlanItemIds)    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Appointment được tạo thành công                         │
│    - Status item chuyển từ READY_FOR_BOOKING → SCHEDULED    │
│    - Refresh plan detail để cập nhật                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI COMPONENTS & PAGES

### 1. Treatment Plan Detail Page

**Location:** `/admin/treatment-plans/[planCode]` hoặc `/employee/treatment-plans/[planCode]`

**Current State:**
- Có button "Đặt lịch" cho từng item hoặc bulk book
- Chưa có button "Tự động xếp lịch"

**Proposed Changes:**

#### A. Thêm Button "Tự động xếp lịch"

**Vị trí:** Trong section "Actions" hoặc gần button "Đặt lịch"

**Conditions để hiển thị:**
- Plan status = APPROVED
- Có ít nhất 1 item với status = READY_FOR_BOOKING
- User có permission `CREATE_APPOINTMENT`

**Button Design:**
```tsx
<Button
  onClick={handleOpenAutoScheduleModal}
  disabled={!canAutoSchedule}
  className="bg-blue-600 hover:bg-blue-700"
>
  <Calendar className="h-4 w-4 mr-2" />
  Tự động xếp lịch ({readyForBookingCount} items)
</Button>
```

#### B. Thêm Modal "Cấu hình tự động xếp lịch"

**Component mới:** `AutoScheduleConfigModal.tsx`

**Fields trong form:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `employeeCode` | Select | ❌ | `plan.doctor.employeeCode` | Bác sĩ ưu tiên (pre-filled từ plan) |
| `roomCode` | Select | ❌ | null | Phòng khám ưu tiên |
| `preferredTimeSlots` | Multi-select | ❌ | [] | Khung giờ ưu tiên: Sáng, Chiều, Tối |
| `lookAheadDays` | Number | ❌ | 90 | Số ngày tối đa để tìm slot (1-180) |
| `forceSchedule` | Checkbox | ❌ | false | Bỏ qua spacing rules (chỉ dùng khẩn cấp) |

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│  Tự động xếp lịch từ Treatment Plan        │
├─────────────────────────────────────────────┤
│                                               │
│  📋 Thông tin plan:                          │
│     Plan: {planName}                         │
│     Bệnh nhân: {patientName}                 │
│     Items sẵn sàng: {readyForBookingCount}   │
│                                               │
│  ⚙️ Cấu hình (tùy chọn):                     │
│                                               │
│  [ ] Bác sĩ ưu tiên:                         │
│      [Dropdown: Select doctor]               │
│      ℹ️ Mặc định: {plan.doctor.fullName}     │
│                                               │
│  [ ] Phòng khám ưu tiên:                     │
│      [Dropdown: Select room]                 │
│                                               │
│  [ ] Khung giờ ưu tiên:                      │
│      ☑ Sáng (8h-12h)                         │
│      ☑ Chiều (13h-17h)                      │
│      ☐ Tối (17h-20h)                        │
│                                               │
│  [ ] Tìm slot trong: [90] ngày               │
│      (1-180 ngày)                            │
│                                               │
│  ☐ Bỏ qua quy tắc giãn cách                  │
│     (Chỉ dùng cho trường hợp khẩn cấp)      │
│                                               │
│  ─────────────────────────────────────────   │
│                                               │
│  [Hủy]              [Tạo gợi ý →]            │
└─────────────────────────────────────────────┘
```

### 2. Auto-Schedule Suggestions Display

**Component:** `AutoScheduleSuggestions.tsx` (đã có, cần enhance)

**Current State:**
- ✅ Đã có component hiển thị suggestions
- ✅ Đã có logic hiển thị warning
- ⚠️ Cần bổ sung thêm fields

**Proposed Enhancements:**

#### A. Summary Card - Bổ sung thêm metrics

**Current fields:**
- holidayAdjustments
- spacingAdjustments
- dailyLimitAdjustments
- totalDaysShifted

**Proposed additions:**
- `employeeContractWarnings`: Số suggestions có warning về contract
- `requiresReassignCount`: Số suggestions cần reassign doctor
- `averageDaysShifted`: Trung bình số ngày đã dời

#### B. Suggestion Card - Bổ sung fields

**Current fields:**
- ✅ itemId, serviceCode, serviceName
- ✅ suggestedDate, originalEstimatedDate
- ✅ holidayAdjusted, spacingAdjusted
- ✅ adjustmentReason
- ✅ availableSlots
- ✅ warning, requiresReassign

**Proposed additions:**

| Field | Type | Description | UI Display |
|-------|------|-------------|------------|
| `employeeCode` | string | Mã bác sĩ được suggest | Badge "Bác sĩ: {name}" |
| `employeeName` | string | Tên bác sĩ | Tooltip khi hover |
| `employeeContractEndDate` | string | Ngày hết hợp đồng | Hiển thị trong warning |
| `roomCode` | string | Mã phòng được suggest | Badge "Phòng: {name}" |
| `roomName` | string | Tên phòng | Tooltip |
| `estimatedDuration` | number | Thời gian ước tính (phút) | "⏱️ {X} phút" |
| `conflictCount` | number | Số conflicts nếu book vào ngày này | Warning nếu > 0 |

### 3. Booking Flow từ Suggestions

**Current:** User click slot → gọi API create appointment

**Proposed Enhancements:**

#### A. Pre-fill Appointment Modal

Khi user click slot từ suggestion:

```typescript
// Pre-fill data từ suggestion
const appointmentData = {
  patientCode: plan.patient.patientCode,
  employeeCode: suggestion.employeeCode || request.employeeCode,
  roomCode: suggestion.roomCode || request.roomCode,
  serviceCodes: [suggestion.serviceCode],
  appointmentStartTime: `${suggestion.suggestedDate}T${slot.startTime}`,
  patientPlanItemIds: [suggestion.itemId],
  notes: `Tự động xếp lịch từ treatment plan #${plan.planCode}`
};
```

#### B. Reassign Doctor Flow

Nếu `requiresReassign = true`:

1. **Disable time slot buttons** (đã có)
2. **Show "Chọn bác sĩ khác" button** (đã có)
3. **Open doctor selection modal:**
   - List available doctors (có contract còn hiệu lực)
   - Filter by specialization (nếu service yêu cầu)
   - Show contract end date cho mỗi doctor
   - User chọn → update suggestion với doctor mới

#### C. Bulk Booking từ Multiple Suggestions

**New Feature:** Cho phép user chọn nhiều suggestions và book cùng lúc

**UI:**
```
┌─────────────────────────────────────────────┐
│  ☑ Chọn tất cả                               │
├─────────────────────────────────────────────┤
│  ☑ Item 1: Nhổ răng khôn - 15/01/2026      │
│  ☑ Item 2: Siết niềng - 20/01/2026          │
│  ☐ Item 3: Tẩy trắng - 25/01/2026 (có warning)│
│                                               │
│  [Đặt lịch cho {selectedCount} items]         │
└─────────────────────────────────────────────┘
```

**Logic:**
- Group suggestions by date
- Nếu cùng ngày → tạo 1 appointment với multiple services
- Nếu khác ngày → tạo multiple appointments

---

## 📊 DATA FIELDS - PROPOSED CHANGES

### 1. AutoScheduleRequest (Request Body)

**Current fields:**
```typescript
{
  employeeCode?: string;
  roomCode?: string;
  preferredTimeSlots?: ('MORNING' | 'AFTERNOON' | 'EVENING')[];
  lookAheadDays?: number;
  forceSchedule?: boolean;
}
```

**Proposed additions:**
```typescript
{
  // ... existing fields ...
  
  /**
   * Chỉ xử lý các items được chỉ định
   * Nếu không có, xử lý tất cả items READY_FOR_BOOKING
   */
  itemIds?: number[];
  
  /**
   * Ưu tiên sắp xếp suggestions
   * 'DATE_ASC' | 'DATE_DESC' | 'SEQUENCE' | 'PRIORITY'
   */
  sortBy?: string;
  
  /**
   * Chỉ suggest appointments sau ngày này
   * Default: TODAY
   */
  startFromDate?: string; // YYYY-MM-DD
}
```

### 2. AppointmentSuggestion (Response)

**Current fields:**
```typescript
{
  itemId: number;
  serviceCode: string;
  serviceName: string;
  suggestedDate: string;
  originalEstimatedDate: string;
  holidayAdjusted: boolean;
  spacingAdjusted: boolean;
  adjustmentReason?: string;
  availableSlots: TimeSlot[];
  success: boolean;
  errorMessage?: string;
  warning?: string;
  requiresReassign?: boolean;
  employeeContractEndDate?: string;
}
```

**Proposed additions:**
```typescript
{
  // ... existing fields ...
  
  /**
   * Bác sĩ được suggest (nếu employeeCode được chỉ định)
   */
  suggestedEmployeeCode?: string;
  suggestedEmployeeName?: string;
  
  /**
   * Phòng được suggest (nếu roomCode được chỉ định)
   */
  suggestedRoomCode?: string;
  suggestedRoomName?: string;
  
  /**
   * Thời gian ước tính (phút)
   */
  estimatedDurationMinutes?: number;
  
  /**
   * Số conflicts nếu book vào ngày này
   * (doctor busy, room occupied, etc.)
   */
  conflictCount?: number;
  
  /**
   * Chi tiết conflicts (nếu có)
   */
  conflicts?: Array<{
    type: 'DOCTOR_BUSY' | 'ROOM_OCCUPIED' | 'PATIENT_LIMIT';
    message: string;
  }>;
  
  /**
   * Alternative suggestions (nếu có)
   * Ví dụ: Nếu ngày gợi ý không available, suggest ngày khác
   */
  alternatives?: Array<{
    date: string;
    availableSlots: TimeSlot[];
    reason: string;
  }>;
}
```

### 3. SchedulingSummary (Response)

**Current fields:**
```typescript
{
  holidayAdjustments: number;
  spacingAdjustments: number;
  dailyLimitAdjustments: number;
  totalDaysShifted: number;
  holidaysEncountered: HolidayInfo[];
}
```

**Proposed additions:**
```typescript
{
  // ... existing fields ...
  
  /**
   * Số suggestions có warning về employee contract
   */
  employeeContractWarnings?: number;
  
  /**
   * Số suggestions cần reassign doctor
   */
  requiresReassignCount?: number;
  
  /**
   * Trung bình số ngày đã dời
   */
  averageDaysShifted?: number;
  
  /**
   * Số suggestions không có available slots
   */
  noSlotsAvailableCount?: number;
  
  /**
   * Thống kê theo loại điều chỉnh
   */
  adjustmentsByType?: {
    holiday: number;
    spacing: number;
    dailyLimit: number;
    employeeContract: number;
  };
}
```

---

## 🎯 UI/UX IMPROVEMENTS

### 1. Visual Indicators

#### A. Warning Badges

```tsx
// Trong SuggestionCard
{requiresReassign && (
  <Badge variant="destructive" className="animate-pulse">
    <AlertTriangle className="h-3 w-3 mr-1" />
    Cần đổi bác sĩ
  </Badge>
)}

{hasWarning && !requiresReassign && (
  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
    <AlertCircle className="h-3 w-3 mr-1" />
    Cảnh báo
  </Badge>
)}
```

#### B. Date Comparison Display

```tsx
// Hiển thị rõ ràng ngày gốc vs ngày gợi ý
{hasAdjustment && (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground line-through">
      {originalDate}
    </span>
    <ArrowRight className="h-4 w-4 text-muted-foreground" />
    <span className="font-semibold text-primary">
      {suggestedDate}
    </span>
    <Badge variant="outline" className="ml-2">
      +{daysDiff} ngày
    </Badge>
  </div>
)}
```

### 2. Interactive Features

#### A. Filter Suggestions

```tsx
// Filter bar trên suggestions list
<div className="flex gap-2 mb-4">
  <Button
    variant={filter === 'all' ? 'default' : 'outline'}
    onClick={() => setFilter('all')}
  >
    Tất cả ({suggestions.length})
  </Button>
  <Button
    variant={filter === 'warnings' ? 'default' : 'outline'}
    onClick={() => setFilter('warnings')}
  >
    Có cảnh báo ({warningsCount})
  </Button>
  <Button
    variant={filter === 'reassign' ? 'default' : 'outline'}
    onClick={() => setFilter('reassign')}
  >
    Cần đổi bác sĩ ({reassignCount})
  </Button>
</div>
```

#### B. Sort Options

```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger>
    <SelectValue placeholder="Sắp xếp theo..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="date_asc">Ngày tăng dần</SelectItem>
    <SelectItem value="date_desc">Ngày giảm dần</SelectItem>
    <SelectItem value="sequence">Thứ tự trong plan</SelectItem>
    <SelectItem value="warnings_first">Cảnh báo trước</SelectItem>
  </SelectContent>
</Select>
```

### 3. Bulk Actions

```tsx
// Checkbox để chọn multiple suggestions
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <Checkbox
      checked={allSelected}
      onCheckedChange={handleSelectAll}
    />
    <span>Đã chọn {selectedCount} suggestions</span>
  </div>
  
  {selectedCount > 0 && (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleBulkReassignDoctor}
        disabled={!canReassign}
      >
        Đổi bác sĩ cho {selectedCount} items
      </Button>
      <Button
        onClick={handleBulkBook}
        disabled={hasReassignRequired}
      >
        Đặt lịch cho {selectedCount} items
      </Button>
    </div>
  )}
</div>
```

---

## 🔄 INTEGRATION POINTS

### 1. TreatmentPlanDetail Component

**File:** `src/components/treatment-plans/TreatmentPlanDetail.tsx`

**Changes needed:**

```tsx
// Add state
const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
const { suggestions, summary, generateSchedule, isLoading } = useAutoSchedule();

// Add button
{canAutoSchedule && (
  <Button onClick={() => setShowAutoScheduleModal(true)}>
    <Calendar className="h-4 w-4 mr-2" />
    Tự động xếp lịch ({readyForBookingCount})
  </Button>
)}

// Add modal
<AutoScheduleConfigModal
  open={showAutoScheduleModal}
  onClose={() => setShowAutoScheduleModal(false)}
  plan={plan}
  onGenerate={(request) => {
    generateSchedule(plan.planId, request);
    setShowAutoScheduleModal(false);
  }}
/>

// Add suggestions display
{suggestions.length > 0 && (
  <AutoScheduleSuggestions
    suggestions={suggestions}
    summary={summary}
    onSelectSlot={handleBookFromSuggestion}
    onReassignDoctor={handleReassignDoctor}
  />
)}
```

### 2. New Component: AutoScheduleConfigModal

**File:** `src/components/treatment-plans/AutoScheduleConfigModal.tsx`

**Features:**
- Form với các fields đã đề xuất
- Pre-fill từ plan data
- Validation
- Loading state khi generate

### 3. Enhanced: AutoScheduleSuggestions

**File:** `src/components/treatment-plans/AutoScheduleSuggestions.tsx`

**Enhancements:**
- ✅ Đã có warning display
- ✅ Đã có requiresReassign handling
- ⚠️ Cần thêm: filter, sort, bulk selection
- ⚠️ Cần thêm: alternative suggestions display
- ⚠️ Cần thêm: conflict details

---

## 📝 SUMMARY OF PROPOSED CHANGES

### New Components:
1. ✅ `AutoScheduleConfigModal.tsx` - Form cấu hình
2. ✅ `Alert.tsx` - Alert component (đã tạo)
3. ⚠️ `ReassignDoctorModal.tsx` - Modal chọn bác sĩ mới (nếu cần)

### Enhanced Components:
1. ✅ `AutoScheduleSuggestions.tsx` - Đã có, cần enhance thêm
2. ⚠️ `TreatmentPlanDetail.tsx` - Thêm button và integration
3. ⚠️ `BookAppointmentFromPlanModal.tsx` - Support pre-fill từ suggestion

### New Types:
1. ✅ Types đã có đầy đủ trong `treatmentPlan.ts`
2. ⚠️ Có thể cần thêm types cho alternative suggestions

### New Services:
1. ✅ `TreatmentPlanService.autoSchedule()` - Đã có
2. ⚠️ `EmployeeService.getAvailableDoctors()` - Lấy danh sách bác sĩ available (nếu cần cho reassign)

---

## ✅ NEXT STEPS

1. **Review document này với team**
2. **Tạo AutoScheduleConfigModal component**
3. **Enhance AutoScheduleSuggestions với filter/sort**
4. **Integrate vào TreatmentPlanDetail**
5. **Test với BE API (khi BE implement xong)**
6. **Update documentation**

---

**END OF DOCUMENT**



