# Slot Availability Debug Guide

## Vấn đề: Báo "Không có suất nào còn trống" khi vẫn còn slot khả dụng

### Các nguyên nhân có thể:

#### 1. **Month Filter đang ẩn slots**
- **Hiện tượng**: User chọn tháng filter → API chỉ trả về slots có `effectiveFrom` trong tháng đó
- **Vấn đề**: Slots có thể span nhiều tháng, nhưng bị filter ra nếu `effectiveFrom` không match
- **Giải pháp**: 
  - Option 1: Không pass month filter vào API, filter ở frontend
  - Option 2: Backend filter theo range (slot.effectiveFrom <= monthEnd && slot.effectiveTo >= monthStart)

**Kiểm tra:**
```javascript
// Mở console và xem log:
console.log('📡 [fetchAvailableSlots] Calling API with month filter: ...');
// Nếu thấy month filter → thử set về "ALL" xem có slots không
```

#### 2. **Backend tính quota sai**
- **Hiện tượng**: `totalDatesEmpty = 0` nhưng thực tế vẫn còn chỗ
- **Nguyên nhân có thể**:
  - Backend đếm registrations nhưng không trừ những registration đã bị reject/delete
  - Backend tính quota theo tháng sai
  - Backend không refresh cache

**Kiểm tra:**
```javascript
// Xem log chi tiết từng slot:
console.log('🔍 [fetchAvailableSlots] Analyzing slot availability:');
// Check: totalDatesEmpty, totalDatesFull, totalDatesAvailable
```

#### 3. **Frontend filter quá strict**
- **Hiện tượng**: API trả về slots nhưng frontend filter ra hết
- **Nguyên nhân**: Day filter, month filter, sort filter

**Kiểm tra:**
```javascript
// Check state filters:
console.log('Current filters:', {
  slotMonthFilter,
  slotDayFilter,
  slotSortBy
});
```

### Debug Steps:

1. **Mở Console** (F12)
2. **Click "Đăng ký ca mới"** để mở modal
3. **Xem logs**:
   ```
   🚀 [fetchAvailableSlots] Starting fetch...
   📊 [fetchAvailableSlots] Current state: { slotMonthFilter, ... }
   📡 [fetchAvailableSlots] Calling API with month filter: ...
   ✅ [fetchAvailableSlots] API Response received: { ... }
   🔍 [fetchAvailableSlots] Analyzing slot availability:
     Slot 1: { slotId, totalDatesEmpty, totalDatesFull, ... }
     Slot 2: { ... }
   📋 [fetchAvailableSlots] Setting availableSlots: { count, emptySlots, ... }
   ```

4. **Kiểm tra từng slot**:
   - `totalDatesEmpty > 0` → Còn chỗ
   - `totalDatesEmpty = 0` → Đầy
   - `totalDatesFull = totalDatesAvailable` → Đầy hoàn toàn

5. **Nếu API trả về slots nhưng UI báo "không có"**:
   - Check: `availableSlots.length` trong console
   - Check: Có filter nào đang ẩn slots không?

### Quick Fixes:

#### Fix 1: Tắt month filter tạm thời
```typescript
// In fetchAvailableSlots:
const monthParam = undefined; // Force no filter
```

#### Fix 2: Kiểm tra backend API trực tiếp
```bash
# Call API trực tiếp (thay YOUR_TOKEN):
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/registrations/part-time-flex/available-slots

# Với month filter:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/registrations/part-time-flex/available-slots?month=2025-12"
```

#### Fix 3: Check slot details API
```bash
# Get chi tiết 1 slot (thay SLOT_ID):
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/registrations/part-time-flex/slots/SLOT_ID/details
```

### Expected Behavior:

**Slot Available:**
```json
{
  "slotId": 123,
  "shiftName": "Ca Sáng (8h-12h)",
  "dayOfWeek": "MONDAY",
  "totalDatesAvailable": 10,
  "totalDatesEmpty": 5,      // ← Còn 5 ngày trống
  "totalDatesFull": 5,
  "availabilitySummary": "5/10 ngày còn trống"
}
```

**Slot Full:**
```json
{
  "slotId": 456,
  "totalDatesAvailable": 10,
  "totalDatesEmpty": 0,       // ← Đầy rồi
  "totalDatesFull": 10,
  "availabilitySummary": "Đã đầy"
}
```

### Backend Logic cần kiểm tra:

1. **Quota calculation**:
   ```java
   // Backend should:
   // 1. Count total dates in slot range
   // 2. For each date, check registrations
   // 3. Only count APPROVED registrations (not PENDING/REJECTED)
   // 4. Compare with maxEmployeesPerSlot
   ```

2. **Month filter logic**:
   ```java
   // Current (có thể sai):
   WHERE slot.effectiveFrom LIKE '2025-12%'
   
   // Should be (đúng hơn):
   WHERE (slot.effectiveFrom <= '2025-12-31' 
      AND slot.effectiveTo >= '2025-12-01')
   ```

3. **Registration status**:
   ```java
   // Only count APPROVED registrations:
   WHERE registration.status = 'APPROVED' 
     AND registration.isActive = true
   ```

### Contact Backend Team:

Nếu vấn đề ở backend, cần check:
- [ ] Quota calculation logic
- [ ] Month filter implementation
- [ ] Registration status filtering
- [ ] Cache invalidation after approve/reject
- [ ] Soft delete handling

### UI Improvements Done:

✅ Form không scroll - calendar inline
✅ Thu nhỏ calendar picker (w-72, smaller fonts)
✅ Giảm spacing giữa các fields
✅ Logic chọn số tuần thông minh (không vượt quá end date)
✅ Thêm debug logs chi tiết

### Next Steps:

1. Test với console mở
2. Capture logs khi báo "không có suất"
3. So sánh với database thực tế
4. Report cho backend team nếu cần
