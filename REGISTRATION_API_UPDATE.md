# Registration Page API Update Summary

## Đã hoàn thành ✅

### 1. Sửa dấu hoa thị kép trong admin/time-off-requests
- Đã xóa dấu hoa thị trong label của CustomSelect
- Component tự động thêm dấu hoa thị đỏ khi có prop `required={true}`

## Cần cập nhật trong employee/registrations/page.tsx

### 1. Cập nhật hiển thị Slot Availability (Issue #1)

**API mới trả về:**
```typescript
interface MonthlyAvailability {
  month: string;
  totalWorkingDays: number;
  totalDatesAvailable: number;  // Ngày hoàn toàn trống (registered == 0)
  totalDatesPartial: number;    // Ngày còn slot (0 < registered < quota)
  totalDatesFull: number;       // Ngày đầy (registered >= quota)
  status: 'AVAILABLE' | 'FULL';
}
```

**Thay đổi cần thiết:**

1. **Cập nhật logic tính toán availability:**
```typescript
// CŨ (SAI):
const availableSlots = month.totalDatesAvailable * quota;

// MỚI (ĐÚNG):
const availableSlots = (month.totalDatesAvailable + month.totalDatesPartial) * quota;
// hoặc tính chính xác hơn:
const totalSlots = month.totalWorkingDays * quota;
const filledSlots = month.totalDatesFull * quota;
const partialSlots = month.totalDatesPartial * quota; // Cần tính từ backend
const availableSlots = totalSlots - filledSlots - partialSlots;
```

2. **Hiển thị 3 trạng thái:**
```typescript
// Option 1: Simple
if (month.totalDatesAvailable > 0) {
  return `${month.totalDatesAvailable} ngày trống`;
} else if (month.totalDatesPartial > 0) {
  return `${month.totalDatesPartial} ngày còn slot`;
} else {
  return "Đã đầy";
}

// Option 2: Detailed (Recommended)
return (
  <div className="flex gap-2">
    <Badge variant="success">{month.totalDatesAvailable} trống</Badge>
    <Badge variant="warning">{month.totalDatesPartial} một phần</Badge>
    <Badge variant="destructive">{month.totalDatesFull} đầy</Badge>
  </div>
);
```

3. **Cập nhật progress bar:**
```typescript
const total = month.totalWorkingDays;
const available = month.totalDatesAvailable;
const partial = month.totalDatesPartial;
const full = month.totalDatesFull;

const availablePercent = (available / total) * 100;
const partialPercent = (partial / total) * 100;
const fullPercent = (full / total) * 100;

// Hiển thị 3 màu: Xanh (available) | Vàng (partial) | Đỏ (full)
```

### 2. Thêm employeeName vào response (Issue #2)

**Type cần cập nhật:**
```typescript
interface ShiftRegistration {
  registrationId: number;
  employeeId: number;
  employeeName: string;  // ← THÊM MỚI
  partTimeSlotId: number;
  dayOfWeek: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  isActive: boolean;
  note?: string;
}
```

**Hiển thị trong table:**
```typescript
<td>{registration.employeeName || 'N/A'}</td>
```

### 3. Thêm CANCELLED status (Issue #3)

**Cập nhật status badge:**
```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning">Chờ duyệt</Badge>;
    case "APPROVED":
      return <Badge variant="success">Đã duyệt</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Từ chối</Badge>;
    case "CANCELLED":  // ← THÊM MỚI
      return <Badge variant="secondary">Đã hủy</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
```

**Cập nhật logic cancel:**
```typescript
// API endpoint không đổi, nhưng response có thêm status = "CANCELLED"
const cancelRegistration = async (registrationId: number) => {
  try {
    const response = await shiftRegistrationService.deleteRegistration(registrationId);
    // response.status sẽ là "CANCELLED"
    toast.success('Đã hủy đơn đăng ký thành công');
    loadRegistrations(); // Refresh list
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('Chỉ có thể hủy đơn đăng ký ở trạng thái PENDING');
    } else {
      toast.error('Không thể hủy đơn đăng ký');
    }
  }
};
```

### 4. Thêm View Details button

**Thêm button vào table:**
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => viewRegistrationDetails(registration.registrationId)}
>
  <Eye className="h-4 w-4 mr-1" />
  Chi tiết
</Button>
```

**API call:**
```typescript
const viewRegistrationDetails = async (registrationId: number) => {
  try {
    const details = await shiftRegistrationService.getRegistrationById(registrationId);
    // Show modal with details
    setSelectedRegistration(details);
    setShowDetailsModal(true);
  } catch (error: any) {
    if (error.response?.status === 403) {
      toast.error('Bạn không có quyền xem đơn đăng ký này');
    } else {
      toast.error('Không thể tải thông tin đơn đăng ký');
    }
  }
};
```

## Các file cần cập nhật

1. **PDCMS_FE/src/app/employee/registrations/page.tsx**
   - Cập nhật logic hiển thị availability (dòng ~1560-1710)
   - Thêm CANCELLED status badge
   - Thêm View Details button
   - Hiển thị employeeName

2. **PDCMS_FE/src/types/shiftRegistration.ts**
   - Thêm `employeeName: string` vào interface
   - Thêm `CANCELLED` vào status enum

3. **PDCMS_FE/src/services/shiftRegistrationService.ts**
   - Thêm method `getRegistrationById(id: number)`

## Testing Checklist

- [ ] Slot availability hiển thị đúng 3 metrics (available, partial, full)
- [ ] Progress bar hiển thị đúng tỷ lệ
- [ ] employeeName hiển thị trong danh sách
- [ ] CANCELLED status hiển thị badge màu xám
- [ ] View Details button hoạt động
- [ ] Cancel button chỉ hiển thị cho PENDING status
- [ ] Cancel thành công → status = CANCELLED
- [ ] Refresh availability sau khi approve/reject/cancel
