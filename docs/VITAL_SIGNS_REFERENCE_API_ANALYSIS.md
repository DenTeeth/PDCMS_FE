# Phân Tích API Vital Signs Reference

**Ngày phân tích:** 2025-12-23  
**Status:** ✅ **CÓ THỂ TÍCH HỢP VÀO FE**

---

## 📋 Tổng Quan

BE có 2 API endpoints liên quan đến Vital Signs Reference chưa được sử dụng trong FE:

1. **GET `/api/v1/vital-signs-reference`** - Lấy tất cả reference ranges đang active
2. **GET `/api/v1/vital-signs-reference/by-age/{age}`** - Lấy reference ranges theo tuổi bệnh nhân

---

## 🔍 Cách BE Sử Dụng

### 1. **Controller & Permissions**

```java
@RestController
@RequestMapping("/api/v1/vital-signs-reference")
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('VIEW_VITAL_SIGNS_REFERENCE') or hasAuthority('WRITE_CLINICAL_RECORD')")
```

**Permissions:**
- `ROLE_ADMIN` - Admin có quyền truy cập
- `VIEW_VITAL_SIGNS_REFERENCE` - Xem reference ranges
- `WRITE_CLINICAL_RECORD` - Ghi clinical record (bác sĩ cần quyền này)

### 2. **Service Logic**

BE sử dụng `VitalSignsReferenceService.assessVitalSign()` để:
- So sánh giá trị vital signs với reference ranges dựa trên tuổi bệnh nhân
- Trả về status: `NORMAL`, `BELOW_NORMAL`, `ABOVE_NORMAL`, `UNKNOWN`
- Trả về message mô tả (tiếng Việt)

**Ví dụ:**
```java
VitalSignAssessment assessVitalSign(String vitalType, BigDecimal value, Integer patientAge)
// Returns: { status: "NORMAL", message: "Binh thuong (120-80 mmHg)", normalMin, normalMax, unit }
```

### 3. **BE Sử Dụng Trong ClinicalRecordService**

BE tự động đánh giá vital signs khi:
- Tạo clinical record mới
- Cập nhật clinical record
- Trả về `vitalSignsAssessment` trong response

**Vital Signs được đánh giá:**
- `BLOOD_PRESSURE_SYSTOLIC` / `BLOOD_PRESSURE_DIASTOLIC`
- `HEART_RATE`
- `TEMPERATURE`
- `OXYGEN_SATURATION`
- `RESPIRATORY_RATE`
- `BLOOD_GLUCOSE`
- `BLOOD_PRESSURE_MEAN`
- `BMI`
- `WEIGHT`
- `HEIGHT`

---

## 📊 DTO Structure

### VitalSignsReferenceResponse
```typescript
interface VitalSignsReferenceResponse {
  referenceId: number;
  vitalType: string; // "BLOOD_PRESSURE_SYSTOLIC", "HEART_RATE", etc.
  ageMin: number;
  ageMax: number | null;
  normalMin: number;
  normalMax: number;
  unit: string; // "mmHg", "bpm", "°C", "%"
  description: string | null;
  effectiveDate: string; // "yyyy-MM-dd"
  isActive: boolean;
}
```

### VitalSignAssessment (BE internal, có thể tạo tương tự cho FE)
```typescript
interface VitalSignAssessment {
  vitalType: string;
  value: number;
  unit: string;
  status: "NORMAL" | "BELOW_NORMAL" | "ABOVE_NORMAL" | "UNKNOWN";
  normalMin: number;
  normalMax: number;
  message: string; // Tiếng Việt
}
```

---

## ✅ Khả Năng Tích Hợp Vào FE

### **1. Tạo Service Layer**

**File:** `src/services/vitalSignsReferenceService.ts`

```typescript
// GET /api/v1/vital-signs-reference
getAllActiveReferences(): Promise<VitalSignsReferenceResponse[]>

// GET /api/v1/vital-signs-reference/by-age/{age}
getReferencesByAge(age: number): Promise<VitalSignsReferenceResponse[]>
```

### **2. Cải Thiện ClinicalRecordForm**

**Hiện tại:**
- Form chỉ có input fields cho vital signs
- Không có validation dựa trên reference ranges
- Không hiển thị status (normal/abnormal)

**Có thể cải thiện:**
- ✅ Load reference ranges khi form mở (dựa trên tuổi bệnh nhân)
- ✅ Real-time validation khi user nhập vital signs
- ✅ Hiển thị reference ranges (normal range) bên cạnh input
- ✅ Hiển thị status badge (Normal/Abnormal) với màu sắc
- ✅ Hiển thị warning/error message khi giá trị ngoài range

**Ví dụ UI:**
```
Huyết Áp (mmHg)
[120/80]                    Normal: 90-140 mmHg
                           ✅ Normal

Nhịp Tim (bpm)
[95]                        Normal: 60-100 bpm
                           ⚠️ Above Normal
```

### **3. Cải Thiện ClinicalRecordView**

**Hiện tại:**
- Chỉ hiển thị giá trị vital signs
- Không có đánh giá status

**Có thể cải thiện:**
- ✅ Hiển thị status badge cho mỗi vital sign
- ✅ Highlight vital signs bất thường
- ✅ Hiển thị reference ranges và message đánh giá

### **4. Tạo Utility Function**

**File:** `src/utils/vitalSignsAssessment.ts`

```typescript
// Tương tự logic BE assessVitalSign()
function assessVitalSign(
  vitalType: string,
  value: number,
  references: VitalSignsReferenceResponse[]
): VitalSignAssessment {
  // Tìm reference phù hợp
  // So sánh với normalMin/normalMax
  // Trả về status và message
}
```

---

## 🎯 Use Cases

### **Use Case 1: Real-time Validation trong Form**

1. User nhập vital signs
2. FE gọi API `/by-age/{age}` để lấy reference ranges
3. FE tự đánh giá và hiển thị status ngay lập tức
4. User thấy warning nếu giá trị ngoài range

### **Use Case 2: Hiển thị Reference Ranges**

1. Form load → Gọi API `/by-age/{age}`
2. Hiển thị reference ranges bên cạnh mỗi input
3. User biết được range bình thường trước khi nhập

### **Use Case 3: Đánh Giá trong View Mode**

1. ClinicalRecordView load
2. Gọi API `/by-age/{age}` để lấy reference ranges
3. Đánh giá từng vital sign
4. Hiển thị status badge và message

---

## 📝 Implementation Plan

### **Phase 1: Service & Types** ✅
- [x] Tạo `vitalSignsReferenceService.ts`
- [x] Tạo TypeScript types cho DTOs
- [x] Tạo utility function `assessVitalSign()`

### **Phase 2: ClinicalRecordForm Enhancement** 🔄
- [ ] Load reference ranges khi form mở
- [ ] Thêm real-time validation
- [ ] Hiển thị reference ranges và status
- [ ] Thêm warning/error messages

### **Phase 3: ClinicalRecordView Enhancement** 🔄
- [ ] Load reference ranges khi view load
- [ ] Đánh giá và hiển thị status cho mỗi vital sign
- [ ] Highlight vital signs bất thường

### **Phase 4: Testing** ⏳
- [ ] Test với các độ tuổi khác nhau
- [ ] Test với các vital signs khác nhau
- [ ] Test edge cases (null values, out of range, etc.)

---

## 🔐 Permissions

**Required Permissions:**
- `VIEW_VITAL_SIGNS_REFERENCE` - Để xem reference ranges
- `WRITE_CLINICAL_RECORD` - Để ghi clinical record (bác sĩ)

**Note:** Bác sĩ thường có `WRITE_CLINICAL_RECORD`, nên có thể gọi API này.

---

## ⚠️ Lưu Ý

1. **Tuổi bệnh nhân:** Cần tính tuổi từ `dateOfBirth` để gọi API `/by-age/{age}`
2. **Vital Type Mapping:** Cần map giữa FE field names và BE vital types:
   - `bloodPressure` → `BLOOD_PRESSURE_SYSTOLIC` / `BLOOD_PRESSURE_DIASTOLIC`
   - `heartRate` → `HEART_RATE`
   - `temperature` → `TEMPERATURE`
   - `oxygenSaturation` → `OXYGEN_SATURATION`
3. **Blood Pressure:** Cần parse "120/80" thành systolic và diastolic
4. **Real-time Updates:** Có thể cache reference ranges để tránh gọi API nhiều lần

---

## 📌 Kết Luận

**✅ CÓ THỂ TÍCH HỢP VÀO FE**

2 API endpoints này rất hữu ích để:
- Cải thiện UX trong form nhập vital signs
- Cung cấp validation real-time
- Hiển thị đánh giá status trong view mode
- Giúp bác sĩ nhận biết vital signs bất thường ngay lập tức

**Priority:** Medium-High (cải thiện chất lượng clinical records)

**Estimated Effort:** 2-3 days

---

**Người phân tích:** AI Assistant  
**Ngày:** 2025-12-23

