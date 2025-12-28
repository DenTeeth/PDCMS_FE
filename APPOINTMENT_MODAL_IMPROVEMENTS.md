# Appointment Modal UI Improvements

## Tổng quan
Cải thiện UI của CreateAppointmentModal với các thay đổi sau:

## 1. ✅ Xóa emoji ngày lễ (HOÀN THÀNH)
- **File**: `src/components/appointments/CreateAppointmentModal.tsx`
- **Thay đổi**: 
  - Dòng 1703: Đổi `🎊` thành `●` (dấu chấm đỏ)
  - Dòng 1725: Xóa emoji trong legend "Ngày lễ 🎊" → "Ngày lễ"

## 2. ⏳ Chỉnh sửa phần chọn dịch vụ (Step 3)
- **Vị trí**: Dòng ~1990-2100
- **Yêu cầu**:
  - Thêm search bar để tìm kiếm dịch vụ
  - Thêm filter dropdown để lọc theo group/specialization
  - Xóa scroll bar bên trong, hiển thị tất cả dịch vụ (tham khảo trang roles)
  - Layout: Search bar + Filter dropdown trên cùng, sau đó là danh sách dịch vụ

### Cấu trúc hiện tại:
```tsx
<Card className="p-4 mt-1">
  <div className="space-y-4 max-h-96 overflow-y-auto"> // ← Xóa max-h và overflow
    {groupedServices.map(...)}
  </div>
</Card>
```

### Cấu trúc mới cần implement:
```tsx
<Card className="p-4 mt-1">
  {/* Search + Filter Bar */}
  <div className="flex gap-3 mb-4">
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input 
        placeholder="Tìm kiếm dịch vụ..." 
        value={serviceSearchTerm}
        onChange={(e) => setServiceSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
    <Select value={serviceGroupFilter} onValueChange={setServiceGroupFilter}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Tất cả chuyên khoa" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Tất cả chuyên khoa</SelectItem>
        {specializations.map(spec => (
          <SelectItem key={spec.specializationId} value={String(spec.specializationId)}>
            {spec.specializationName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Services List - NO SCROLL */}
  <div className="space-y-4"> // ← Không có max-height
    {filteredGroupedServices.map(...)}
  </div>
</Card>
```

### State cần thêm:
```tsx
const [serviceSearchTerm, setServiceSearchTerm] = useState('');
const [serviceGroupFilter, setServiceGroupFilter] = useState<string>('ALL');
```

## 3. ⏳ Chỉnh sửa phần chọn bác sĩ (Step 4)
- **Vị trí**: Dòng ~2200-2400
- **Vấn đề**: Hiển thị thông tin bác sĩ bị trùng lặp
- **Yêu cầu**: Thiết kế UI gọn gàng, không trùng lặp thông tin

### Cần kiểm tra:
- Xem phần hiển thị bác sĩ có bị duplicate không
- Nếu có, merge thành một display duy nhất
- Đảm bảo thông tin: Tên, Mã nhân viên, Chuyên khoa chỉ hiển thị 1 lần

## Các bước thực hiện tiếp theo:
1. ✅ Xóa emoji ngày lễ - DONE
2. [ ] Thêm state cho search và filter dịch vụ
3. [ ] Implement search logic cho dịch vụ
4. [ ] Implement filter logic theo specialization
5. [ ] Xóa scroll bar, hiển thị tất cả dịch vụ
6. [ ] Kiểm tra và fix phần hiển thị bác sĩ

## Notes:
- File rất lớn (>2000 dòng), cần cẩn thận khi edit
- Tham khảo UI của roles page cho search + filter pattern
- Đảm bảo không làm break existing functionality
