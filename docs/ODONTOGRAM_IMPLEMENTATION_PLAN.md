# Kế Hoạch Implement Component Odontogram

## 📋 Tổng Quan

Component Odontogram sẽ hiển thị sơ đồ răng (dental chart) với 32 răng theo FDI notation, cho phép:
- Hiển thị trạng thái của từng răng (màu sắc khác nhau)
- Click vào răng để xem/sửa trạng thái
- Tooltip hiển thị thông tin chi tiết
- Responsive design

## 🎯 Phương Án: Tự Tạo Component với SVG

### Lý Do Chọn Tự Tạo:

1. **Không có thư viện phù hợp**: Không có thư viện React chuyên biệt cho odontogram
2. **Độ phức tạp vừa phải**: 32 răng có thể vẽ bằng SVG đơn giản
3. **Tùy chỉnh hoàn toàn**: Dễ customize theo design system hiện tại
4. **Không thêm dependency**: Giữ codebase nhẹ
5. **Tương thích tốt**: SVG responsive và tương tác tốt

## 📐 Cấu Trúc Răng (FDI Notation)

### Upper Jaw (Hàm Trên) - 16 răng
```
18  17  16  15  14  13  12  11 | 21  22  23  24  25  26  27  28
```

### Lower Jaw (Hàm Dưới) - 16 răng
```
48  47  46  45  44  43  42  41 | 31  32  33  34  35  36  37  38
```

**Tổng: 32 răng** (hoặc 28 nếu không tính răng khôn 18, 28, 38, 48)

## 🎨 Design Approach

### Option 1: SVG Grid Layout (Recommended)
- Sử dụng SVG để vẽ từng răng như hình chữ nhật/oval
- Grid layout: 2 rows (upper/lower) x 8 columns (mỗi bên 4 răng)
- Mỗi răng là một `<rect>` hoặc `<circle>` có thể click

### Option 2: HTML/CSS Grid
- Sử dụng CSS Grid để layout
- Mỗi răng là một `<div>` với border và background color
- Dễ style nhưng ít flexible hơn SVG

**Recommendation: Option 1 (SVG)** vì:
- Dễ vẽ hình dạng răng (có thể dùng path phức tạp hơn sau này)
- Dễ thêm animation/interaction
- Scalable tốt

## 🎨 Color Coding

```typescript
const TOOTH_STATUS_COLORS = {
  HEALTHY: '#10b981',      // Green
  CARIES: '#ef4444',       // Red
  FILLING: '#3b82f6',     // Blue
  CROWN: '#f59e0b',       // Yellow/Orange
  ROOT_CANAL: '#ec4899',  // Pink
  EXTRACTED: '#6b7280',   // Gray
  MISSING: '#6b7280',     // Gray
  IMPLANT: '#8b5cf6',     // Purple
  BRIDGE: '#14b8a6',      // Teal
  ORTHODONTIC: '#6366f1', // Indigo
};
```

## 📁 Component Structure

```typescript
// src/components/clinical-records/Odontogram.tsx

interface OdontogramProps {
  patientId: number;
  toothStatuses: ToothStatusResponse[]; // From API 8.9
  onToothClick?: (toothNumber: string, status: ToothCondition) => void;
  editable?: boolean; // If true, show edit button on click
  readOnly?: boolean; // If true, disable interactions
}

// Tooth data structure
interface ToothData {
  number: string; // "11", "18", "36", etc.
  position: { x: number; y: number }; // SVG coordinates
  quadrant: 1 | 2 | 3 | 4; // Upper right, Upper left, Lower left, Lower right
  status?: ToothCondition;
  notes?: string;
}
```

## 🛠️ Implementation Plan

### Step 1: Create Tooth Data Structure
- Define 32 teeth với positions trong SVG coordinate system
- Map FDI notation (11-18, 21-28, 31-38, 41-48) to positions

### Step 2: SVG Layout
- Create SVG container với viewBox
- Draw grid layout: 2 rows x 8 columns
- Each tooth as `<rect>` or `<circle>` with proper spacing

### Step 3: Color Mapping
- Map `toothStatuses` array to tooth colors
- Default color (white/gray) for teeth without status

### Step 4: Interactions
- `onClick` handler cho mỗi răng
- Tooltip hiển thị tooth number và status
- Hover effect (scale/color change)

### Step 5: Integration
- Connect với API 8.9 (GET tooth status)
- Connect với API 8.10 (UPDATE tooth status)
- Show modal/form khi click vào răng (nếu editable)

## 📝 Code Structure Preview

```typescript
// Simplified structure
export default function Odontogram({ 
  patientId, 
  toothStatuses, 
  onToothClick,
  editable = false 
}: OdontogramProps) {
  // Map tooth statuses to tooth numbers
  const statusMap = useMemo(() => {
    const map = new Map<string, ToothStatusResponse>();
    toothStatuses.forEach(status => {
      map.set(status.toothNumber, status);
    });
    return map;
  }, [toothStatuses]);

  // Generate 32 teeth data
  const teeth = useMemo(() => generateTeethData(statusMap), [statusMap]);

  return (
    <div className="w-full">
      <svg viewBox="0 0 800 400" className="w-full h-auto">
        {/* Upper jaw */}
        <g className="upper-jaw">
          {teeth.filter(t => t.quadrant === 1 || t.quadrant === 2).map(tooth => (
            <ToothShape
              key={tooth.number}
              tooth={tooth}
              onClick={() => onToothClick?.(tooth.number, tooth.status)}
            />
          ))}
        </g>
        
        {/* Lower jaw */}
        <g className="lower-jaw">
          {teeth.filter(t => t.quadrant === 3 || t.quadrant === 4).map(tooth => (
            <ToothShape
              key={tooth.number}
              tooth={tooth}
              onClick={() => onToothClick?.(tooth.number, tooth.status)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
```

## 🎨 Visual Design

### Layout:
```
        [18] [17] [16] [15] [14] [13] [12] [11] | [21] [22] [23] [24] [25] [26] [27] [28]
        ────────────────────────────────────────────────────────────────────────────────
        [48] [47] [46] [45] [44] [43] [42] [41] | [31] [32] [33] [34] [35] [36] [37] [38]
```

### Tooth Shape:
- Simple: Rounded rectangle (`<rect rx="4">`)
- Advanced (future): Custom SVG path để giống răng thật hơn

### Responsive:
- SVG `viewBox` tự động scale
- Max width: 100%
- Min height: 400px (desktop), 300px (mobile)

## 🔄 Integration với API

### Load Data:
```typescript
const { data: toothStatuses, isLoading } = useQuery({
  queryKey: ['toothStatus', patientId],
  queryFn: () => toothStatusService.getToothStatus(patientId),
});
```

### Update Status:
```typescript
const updateMutation = useMutation({
  mutationFn: (request: UpdateToothStatusRequest) =>
    toothStatusService.updateToothStatus(patientId, request),
  onSuccess: () => {
    queryClient.invalidateQueries(['toothStatus', patientId]);
    toast.success('Cập nhật trạng thái răng thành công');
  },
});
```

## 📦 Dependencies

**Không cần thêm dependency mới!**
- Sử dụng React hooks (useState, useMemo, useCallback)
- Sử dụng SVG (built-in browser support)
- Sử dụng Tailwind CSS (đã có sẵn)
- Sử dụng React Query (đã có sẵn)

## 🚀 Timeline Estimate

- **Step 1-2**: 2-3 hours (Data structure + SVG layout)
- **Step 3**: 1 hour (Color mapping)
- **Step 4**: 2 hours (Interactions + tooltip)
- **Step 5**: 1-2 hours (API integration)
- **Total**: ~6-8 hours

## ✅ Advantages của Approach Này

1. ✅ **Lightweight**: Không thêm dependency
2. ✅ **Customizable**: Dễ thay đổi design, colors, layout
3. ✅ **Maintainable**: Code đơn giản, dễ hiểu
4. ✅ **Performant**: SVG render nhanh, không cần external library
5. ✅ **Accessible**: Có thể thêm ARIA labels, keyboard navigation
6. ✅ **Scalable**: Dễ thêm features (animation, custom shapes, etc.)

## 🔮 Future Enhancements

1. **Custom Tooth Shapes**: Vẽ răng giống thật hơn với SVG path
2. **Animation**: Smooth transitions khi update status
3. **3D View**: (Optional) 3D visualization nếu cần
4. **Print Support**: Export SVG to PDF/Image
5. **History View**: Hiển thị lịch sử thay đổi trạng thái răng

---

**Recommendation**: Tự tạo component với SVG là approach tốt nhất cho use case này.

