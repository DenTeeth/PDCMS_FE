# TÓM TẮT: GIẢI PHÁP KÊ ĐƠN THUỐC - CHỈ CHỌN MEDICINE

## ❌ VẤN ĐỀ

Khi bác sĩ kê đơn thuốc trong Clinical Record, hệ thống hiện tại cho phép chọn **TẤT CẢ items** từ kho (bao gồm vật tư, dụng cụ, hóa chất), không phân biệt **THUỐC MEN (MEDICINE)** và các loại khác.

## ✅ NGUYÊN NHÂN

- Backend API 6.1 (`/warehouse/summary`) **ĐÃ HỖ TRỢ** filter theo `categoryId`
- Nhưng **FE KHÔNG TRUYỀN** parameter `categoryId` khi gọi API
- Dẫn đến backend trả về **ALL categories** thay vì chỉ MEDICINE

## ✅ GIẢI PHÁP

**KHÔNG CẦN TẠO API MỚI**. Chỉ cần FE thực hiện 2 bước:

### Bước 1: Lấy categoryId của MEDICINE

```bash
GET /api/v1/warehouse/item-categories
```

→ Tìm category có `categoryCode = "MEDICINE"`, lấy `categoryId` (ví dụ: 3)

### Bước 2: Filter inventory theo categoryId

```bash
GET /api/v1/warehouse/summary?categoryId=3&search=thuốc&page=0&size=20
```

→ Backend tự động chỉ trả về **THUỐC MEN**, không có vật tư/dụng cụ

## 📝 THAY ĐỔI BACKEND

### 1. Thêm API 6.0 - Get Item Categories

**File**: `WarehouseInventoryController.java`

**Endpoint**: `GET /api/v1/warehouse/item-categories`

**Response**:

```json
[
  {"categoryId": 3, "categoryCode": "MEDICINE", "categoryName": "Thuốc men", ...},
  {"categoryId": 1, "categoryCode": "CONSUMABLE", "categoryName": "Vật tư tiêu hao", ...}
]
```

### 2. Cập nhật API 6.1 - Inventory Summary

**File**: `WarehouseInventoryController.java`

**Thay đổi**:

- Thêm `VIEW_MEDICINES` vào `@PreAuthorize`
- Cập nhật description: "⚠️ KHI KÊ ĐƠN THUỐC: FE PHẢI truyền categoryId của MEDICINE"
- Cập nhật log để hiển thị categoryId filter

**Endpoint**: `GET /api/v1/warehouse/summary?categoryId={id}`

**Behavior**: Khi `categoryId != null` → chỉ trả về items thuộc category đó

### 3. Xóa API 6.1.1 (Không cần thiết)

**Lý do**: API 6.1 đã hỗ trợ filter `categoryId` rồi, không cần tạo endpoint riêng cho medicine

## 📚 YÊU CẦU FE

### Code Example

```typescript
// 1. Get medicine category (call once)
const categories = await fetch('/api/v1/warehouse/item-categories');
const medicineCategory = categories.find(c => c.categoryCode === 'MEDICINE');
const MEDICINE_ID = medicineCategory.categoryId;

// 2. Search medicines only (when prescribing)
const medicines = await fetch(
  `/api/v1/warehouse/summary?categoryId=${MEDICINE_ID}&search=${searchTerm}`
);

// 3. Add to prescription
await fetch(`/api/v1/clinical-records/${recordId}/prescription`, {
  method: 'POST',
  body: JSON.stringify({
    items: [{ itemMasterId: medicine.itemMasterId, quantity: 2, ... }]
  })
});
```

### Checklist

- [ ] Gọi API 6.0 để lấy `categoryId` của MEDICINE
- [ ] Khi kê đơn thuốc, PHẢI truyền `categoryId` vào API 6.1
- [ ] Không hardcode `categoryId = 3` (phải lấy từ API)
- [ ] Validate `stockStatus` trước khi cho phép chọn
- [ ] Hiển thị warning nếu thuốc sắp hết hạn (`nearestExpiryDate`)

## 📁 FILES CHANGED

1. **WarehouseInventoryController.java**

   - Thêm: API 6.0 `getItemCategories()`
   - Sửa: API 6.1 description + permission + log
   - Xóa: API 6.1.1 `getMedicinesForPrescription()` (không cần)

2. **Documentation**
   - Tạo: `/docs/api-guides/clinical-records/PRESCRIPTION_MEDICINE_FILTERING_GUIDE.md`
   - Tạo: `/docs/api-guides/clinical-records/PRESCRIPTION_MEDICINE_FILTERING_SUMMARY.md` (file này)

## 🧪 TESTING

### Test 1: Verify API 6.0

```bash
curl GET /api/v1/warehouse/item-categories
# Expected: List of categories including MEDICINE with categoryId
```

### Test 2: Verify API 6.1 với filter

```bash
curl GET "/api/v1/warehouse/summary?categoryId=3"
# Expected: Only medicines, no consumables/equipment
```

### Test 3: Verify API 6.1 không filter

```bash
curl GET "/api/v1/warehouse/summary"
# Expected: ALL items (medicines + consumables + equipment)
```

## ⚠️ IMPORTANT NOTES

1. **Database schema** đã có `item_categories` với `categoryCode = 'MEDICINE'` ✅
2. **Service layer** (`InventoryService.getInventorySummaryV2`) đã hỗ trợ filter `categoryId` ✅
3. **Repository** (`ItemMasterRepository.findInventorySummary`) đã filter theo `categoryId` ✅
4. **Seed data** đã có 10 categories bao gồm MEDICINE ✅

→ **Backend ĐÃ SẴN SÀNG**, chỉ cần FE truyền đúng parameter!

## 📞 CONTACT

- **Backend**: @thaitrinh2701
- **Full Guide**: `/docs/api-guides/clinical-records/PRESCRIPTION_MEDICINE_FILTERING_GUIDE.md`
- **Swagger**: `http://localhost:8080/swagger-ui.html`

---

**CONCLUSION**: Vấn đề không phải ở backend mà ở cách FE sử dụng API. Backend đã có đầy đủ chức năng filter, FE chỉ cần truyền `categoryId` parameter là giải quyết được vấn đề!
