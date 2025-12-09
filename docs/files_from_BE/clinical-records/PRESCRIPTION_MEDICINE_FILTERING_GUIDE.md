# HƯỚNG DẪN KÊ ĐƠN THUỐC - CHỈ CHỌN MEDICINE (KHÔNG LẤY VẬT TƯ/DỤNG CỤ)

**Module**: Clinical Records - Prescription Management
**Version**: V1.0
**Status**: Production Ready
**Last Updated**: 2024-12-04

---

## 🎯 Mục tiêu

Khi **BÁC SĨ KÊ ĐƠN THUỐC** trong Clinical Record (API 8.15), hệ thống chỉ cho phép chọn **THUỐC MEN (MEDICINE category)**, không được chọn:

- ❌ Vật tư tiêu hao (CONSUMABLE)
- ❌ Dụng cụ y tế (EQUIPMENT)
- ❌ Hóa chất (CHEMICAL)
- ❌ Vật liệu nha khoa (MATERIAL)

---

## ⚠️ VẤN ĐỀ HIỆN TẠI

FE đang gọi API 6.1 **KHÔNG TRUYỀN `categoryId`** → Backend trả về **TẤT CẢ items** bao gồm cả vật tư/dụng cụ → Bác sĩ có thể chọn nhầm vật liệu thay vì thuốc.

---

## ✅ GIẢI PHÁP ĐÚNG

### Bước 1: Lấy `categoryId` của MEDICINE

**API**: `GET /api/v1/warehouse/item-categories`

**Request:**

```bash
GET /api/v1/warehouse/item-categories
Authorization: Bearer {jwt_token}
```

**Response:**

```json
[
  {
    "categoryId": 3,
    "categoryCode": "MEDICINE",
    "categoryName": "Thuốc men",
    "description": "Thuốc và dược phẩm (kháng sinh, giảm đau, sát trùng, thuốc gây tê, thuốc kháng viêm)",
    "isActive": true
  },
  {
    "categoryId": 1,
    "categoryCode": "CONSUMABLE",
    "categoryName": "Vật tư tiêu hao",
    "description": "Vật tư sử dụng một lần (gạc, băng, kim tiêm, bông, khẩu trang, găng tay, ống hút)",
    "isActive": true
  },
  ...
]
```

**FE Implementation:**

```typescript
// Call once when app loads or when opening prescription form
async function getMedicineCategory() {
  const response = await fetch("/api/v1/warehouse/item-categories", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const categories = await response.json();
  const medicineCategory = categories.find(
    (cat) => cat.categoryCode === "MEDICINE"
  );

  // Store categoryId for later use
  return medicineCategory.categoryId; // e.g., 3
}
```

---

### Bước 2: Tìm thuốc với `categoryId` filter

**API**: `GET /api/v1/warehouse/summary?categoryId={medicineId}`

**Request:**

```bash
GET /api/v1/warehouse/summary?categoryId=3&search=kháng sinh&page=0&size=20
Authorization: Bearer {jwt_token}
```

**Response:** (chỉ trả về MEDICINE category)

```json
{
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalItems": 6,
  "content": [
    {
      "itemMasterId": 201,
      "itemCode": "MED-SEPT-01",
      "itemName": "Thuốc tê (Septodont)",
      "categoryName": "Thuốc men",
      "warehouseType": "COLD",
      "unitName": "Ống",
      "minStockLevel": 5,
      "maxStockLevel": 500,
      "totalQuantity": 120,
      "stockStatus": "IN_STOCK",
      "nearestExpiryDate": "2025-06-30"
    },
    {
      "itemMasterId": 202,
      "itemCode": "MED-BETA-01",
      "itemName": "Dung dịch Betadine",
      "categoryName": "Thuốc men",
      "warehouseType": "COLD",
      "unitName": "ml",
      "minStockLevel": 5,
      "maxStockLevel": 500,
      "totalQuantity": 2500,
      "stockStatus": "IN_STOCK",
      "nearestExpiryDate": "2025-12-31"
    }
  ]
}
```

**FE Implementation:**

```typescript
async function searchMedicinesForPrescription(
  searchTerm,
  medicineId,
  page = 0,
  size = 20
) {
  const response = await fetch(
    `/api/v1/warehouse/summary?categoryId=${medicineCategoryId}&search=${searchTerm}&page=${page}&size=${size}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();
  return data.content; // Only medicines, no consumables/equipment
}
```

---

### Bước 3: Thêm thuốc vào đơn (API 8.15)

```typescript
async function savePrescription(clinicalRecordId, selectedMedicines) {
  const prescriptionItems = selectedMedicines.map((med) => ({
    itemMasterId: med.itemMasterId, // From API 6.1 response
    quantity: med.prescribedQuantity,
    dosageInstructions: med.dosage,
  }));

  const response = await fetch(
    `/api/v1/clinical-records/${clinicalRecordId}/prescription`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prescriptionNotes: "Uống thuốc theo chỉ dẫn",
        items: prescriptionItems,
      }),
    }
  );

  return response.json();
}
```

---

## 📋 COMPLETE WORKFLOW

### Tình huống: Bác sĩ kê đơn thuốc sau khám

```
1. App khởi động hoặc mở form kê đơn
   → FE gọi: GET /api/v1/warehouse/item-categories
   → Lưu categoryId của MEDICINE (e.g., 3)

2. Bác sĩ nhập tên thuốc "kháng sinh"
   → FE gọi: GET /api/v1/warehouse/summary?categoryId=3&search=kháng sinh
   → Backend CHỈ TRẢ VỀ THUỐC (không có vật tư)

3. Hiển thị danh sách thuốc:
   - Thuốc tê (Septodont) - 120 ống - Còn hàng
   - Betadine - 2500 ml - Còn hàng
   (Không hiển thị gạc, băng, kìm, kéo, ...)

4. Bác sĩ chọn thuốc + nhập liều lượng
   → FE validate stock

5. Submit đơn thuốc
   → FE gọi: POST /api/v1/clinical-records/{id}/prescription
   {
     "prescriptionNotes": "...",
     "items": [
       {"itemMasterId": 201, "quantity": 2, "dosageInstructions": "Uống 3 lần/ngày"}
     ]
   }

6. Backend lưu prescription + trừ stock
```

---

## 🔥 QUAN TRỌNG - CHECKLIST FE

### ✅ PHẢI LÀM

1. **PHẢI gọi API 6.0** (`/item-categories`) để lấy `categoryId` của MEDICINE
2. **PHẢI truyền `categoryId`** khi gọi API 6.1 (`/summary`)
3. **PHẢI validate** `stockStatus` trước khi cho phép chọn thuốc
4. **PHẢI hiển thị warning** nếu `totalQuantity < minStockLevel` (sắp hết hàng)
5. **PHẢI check** `nearestExpiryDate` để cảnh báo thuốc gần hết hạn

### ❌ KHÔNG ĐƯỢC

1. ❌ **Không được gọi API 6.1 mà KHÔNG truyền `categoryId`** khi kê đơn thuốc
2. ❌ **Không được hardcode** `categoryId = 3` (phải lấy từ API 6.0)
3. ❌ **Không được cho phép chọn thuốc** có `stockStatus = OUT_OF_STOCK`
4. ❌ **Không được bỏ qua** việc lấy categories từ API 6.0
5. ❌ **Không được assume** MEDICINE luôn có `categoryId = 3` (có thể khác tùy database)

---

## 🧪 TESTING

### Test Case 1: Verify chỉ lấy thuốc

**Request:**

```bash
GET /api/v1/warehouse/summary?categoryId=3
```

**Expected:**

- Tất cả items đều có `categoryName = "Thuốc men"`
- Không có items với category: "Vật tư tiêu hao", "Dụng cụ y tế", etc.

### Test Case 2: Verify filter bị bỏ qua

**Request:**

```bash
GET /api/v1/warehouse/summary
# (KHÔNG truyền categoryId)
```

**Expected:**

- Trả về TẤT CẢ items (thuốc + vật tư + dụng cụ)
- ⚠️ **SAI** nếu FE dùng API này khi kê đơn thuốc

### Test Case 3: Search medicine

**Request:**

```bash
GET /api/v1/warehouse/summary?categoryId=3&search=tê
```

**Expected:**

- Chỉ trả về: "Thuốc tê (Septodont)", "Gel tê bôi", ...
- Không trả về: "Gạc", "Kìm", "Dây chỉnh nha"

---

## 📚 API REFERENCE

| API  | Endpoint                              | Method | Purpose                                              |
| ---- | ------------------------------------- | ------ | ---------------------------------------------------- |
| 6.0  | `/warehouse/item-categories`          | GET    | Lấy danh sách categories (MEDICINE, CONSUMABLE, ...) |
| 6.1  | `/warehouse/summary`                  | GET    | Lấy inventory summary (CÓ filter categoryId)         |
| 8.14 | `/clinical-records/{id}/prescription` | GET    | Xem đơn thuốc                                        |
| 8.15 | `/clinical-records/{id}/prescription` | POST   | Tạo/cập nhật đơn thuốc                               |

---

## 🐛 TROUBLESHOOTING

### Vấn đề: Vẫn thấy vật tư/dụng cụ trong danh sách

**Nguyên nhân**: FE không truyền `categoryId`

**Giải pháp**:

```typescript
// ❌ SAI
fetch("/api/v1/warehouse/summary?search=thuốc");

// ✅ ĐÚNG
fetch(
  `/api/v1/warehouse/summary?categoryId=${medicineCategoryId}&search=thuốc`
);
```

### Vấn đề: `categoryId` không đúng

**Nguyên nhân**: Hardcode `categoryId = 3`

**Giải pháp**:

```typescript
// ❌ SAI
const categoryId = 3; // hardcode

// ✅ ĐÚNG
const categories = await fetch("/api/v1/warehouse/item-categories");
const medicine = categories.find((c) => c.categoryCode === "MEDICINE");
const categoryId = medicine.categoryId;
```

---

## 📞 SUPPORT

- **Backend Team**: @thaitrinh2701
- **Documentation**: `/docs/api-guides/clinical-records/`
- **API Docs**: Swagger UI - `/swagger-ui.html`

---

## 🔄 CHANGELOG

| Date       | Version | Changes                                                    |
| ---------- | ------- | ---------------------------------------------------------- |
| 2024-12-04 | V1.0    | Initial guide - Thêm API 6.0, cập nhật API 6.1 description |

---

**LƯU Ý QUAN TRỌNG**: Không tạo API mới `/medicines` vì API 6.1 đã hỗ trợ filter `categoryId` rồi. FE chỉ cần truyền đúng parameter là được!
