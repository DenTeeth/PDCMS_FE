# FE Treatment Plan - Fixes Summary

## ✅ Đã kiểm tra và cải thiện

### 1. Error Handling cho `doctorSpecializationMismatch` ✅

**File:** `src/components/treatment-plans/CreateCustomPlanModal.tsx` (line 976-987)

**Status:** ✅ **Đã có** - FE đã handle error code `doctorSpecializationMismatch`

**Cải thiện:** Đã update để handle cả `error.doctorSpecializationMismatch` (BE có thể trả về format này)

```typescript
// Check for specialization mismatch error (BE may return 'error.doctorSpecializationMismatch' or 'doctorSpecializationMismatch')
if (errorCode === 'doctorSpecializationMismatch' || 
    errorCode === 'error.doctorSpecializationMismatch' ||
    (typeof errorCode === 'string' && errorCode.includes('doctorSpecializationMismatch'))) {
  // Show detailed message from BE
  toast.error('Không thể tạo lộ trình điều trị', {
    description: errorDetail || 'Bác sĩ không có chuyên môn phù hợp...',
    duration: 8000,
  });
}
```

### 2. Service Filtering theo Doctor Specialization ✅

**File:** `src/components/treatment-plans/CreateCustomPlanModal.tsx` (line 346-404)

**Status:** ✅ **Đã có** - FE đã filter services theo doctor specialization

**Cải thiện:** Đã update để include general services (không có specializationId)

```typescript
// Filter services that match ANY of the selected doctor's specializations
const filteredServices = allServices.filter(service => {
  // Service matches if:
  // 1. Service has no specializationId (general service, available to all doctors)
  // 2. OR service has a specializationId that matches one of the doctor's specializations
  return !service.specializationId || selectedDoctorSpecializationIds.includes(service.specializationId);
});
```

**Logic:**
- Khi doctor được chọn → reload services với filter
- Chỉ hiển thị services phù hợp với doctor's specializations
- General services (không có specializationId) được hiển thị cho tất cả doctors

### 3. Pre-validation trước khi submit ✅

**File:** `src/components/treatment-plans/CreateCustomPlanModal.tsx` (line 665-709)

**Status:** ✅ **Đã thêm** - Pre-validate specialization compatibility trước khi submit

**Logic:**
- Kiểm tra từng item trong phases
- Nếu service có specializationId và doctor không có specialization đó → show error
- Prevent submit nếu có specialization mismatch

```typescript
// Pre-validate doctor specialization compatibility (prevent BE error)
if (doctorEmployeeCode) {
  const selectedDoctor = doctors.find(d => d.employeeCode === doctorEmployeeCode);
  if (selectedDoctor && selectedDoctor.specializations) {
    const doctorSpecializationIds = selectedDoctor.specializations.map(s => s.specializationId);
    
    phases.forEach((phase) => {
      phase.items.forEach((item, itemIndex) => {
        if (item.serviceCode) {
          const service = services.find(s => s.serviceCode === item.serviceCode);
          if (service && service.specializationId) {
            // Service requires a specific specialization
            if (!doctorSpecializationIds.includes(service.specializationId)) {
              // Show error
            }
          }
        }
      });
    });
  }
}
```

## 📋 Tóm tắt

| Feature | Status | Notes |
|---------|--------|-------|
| Error Handling | ✅ | Handle `doctorSpecializationMismatch` và `error.doctorSpecializationMismatch` |
| Service Filtering | ✅ | Filter services theo doctor specialization, include general services |
| Pre-validation | ✅ | Validate specialization compatibility trước khi submit |
| Auto-reload Services | ✅ | Reload services khi doctor được chọn |

## 🎯 Kết quả

**FE đã sẵn sàng:**
1. ✅ Filter services theo doctor specialization (prevent lỗi)
2. ✅ Pre-validate trước khi submit (prevent lỗi)
3. ✅ Handle error từ BE nếu vẫn xảy ra (graceful error handling)

**User Experience:**
- User chỉ thấy services phù hợp với doctor đã chọn
- Nếu user cố gắng chọn service không phù hợp → show error ngay
- Nếu vẫn submit được → BE trả về 400 với message rõ ràng (không còn 500)

---

**Last Updated:** 2025-12-02

