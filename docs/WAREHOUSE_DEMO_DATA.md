# Warehouse Demo Data - FE Testing (Complete Workflow)

> Data mẫu chi tiết để demo quy trình quản lý kho trên FE từ đầu đến cuối
> 
> **Workflow đầy đủ:**
> 1. **Khai báo vật tư** (Item Master) - API 6.9, 6.8, 6.10
> 2. **Quản lý đơn vị** (Units) - API 6.11, 6.12
> 3. **Quản lý nhà cung cấp** (Suppliers) - API 6.13, 6.14, 6.15, 6.16
> 4. **Tạo đơn nhập kho** (Import Transaction) - API 6.4
> 5. **Tạo đơn xuất kho** (Export Transaction) - API 6.5
> 6. **Xem tổng hợp tồn kho** (Inventory Summary) - API 6.1
> 7. **Xem chi tiết lô hàng** (Item Batches) - API 6.2
> 8. **Cảnh báo hết hạn** (Expiring Alerts) - API 6.3
> 9. **Xem lịch sử giao dịch** (Transaction History) - API 6.6, 6.7
> 10. **Vật tư tiêu hao cho dịch vụ** (Service Consumables) - API 6.17

---

## 📋 Bước 1: Khai Báo Vật Tư (Item Master)

### API 6.9: Tạo Vật Tư Mới

**API Endpoint:** `POST /api/v1/warehouse/items`

**Demo Case 1: Tạo vật tư thường dùng - Gạc y tế**

**Request Body:**

```json
{
  "itemCode": "MAT-GAC-10X10",
  "itemName": "Gạc y tế 10x10cm",
  "description": "Gạc vô trùng thấm hút tốt, dùng cho phẫu thuật và điều trị",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 50,
  "maxStockLevel": 1000,
  "isPrescriptionRequired": false,
  "defaultShelfLifeDays": 1095,
  "units": [
    {
      "unitName": "Thùng",
      "conversionRate": 10,
      "isBaseUnit": false,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": false
    },
    {
      "unitName": "Hộp",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": true
    }
  ]
}
```

**Thông tin chi tiết:**

- **Mã vật tư:** MAT-GAC-10X10 (unique, uppercase)
- **Loại kho:** NORMAL (không cần bảo quản lạnh)
- **Mức tồn kho:** Tối thiểu 50 Hộp, Tối đa 1000 Hộp
- **Hạn sử dụng mặc định:** 1095 ngày (3 năm)
- **Đơn vị:**
  - Thùng (1 Thùng = 10 Hộp) - Đơn vị nhập mặc định
  - Hộp (đơn vị cơ bản) - Đơn vị xuất mặc định

---

### Demo Case 2: Tạo thuốc cần bảo quản lạnh

**Request Body:**

```json
{
  "itemCode": "MED-LIDO-2PCT",
  "itemName": "Thuốc tê Lidocaine 2%",
  "description": "Thuốc gây tê tại chỗ dùng trong nha khoa",
  "categoryId": 2,
  "warehouseType": "COLD",
  "minStockLevel": 20,
  "maxStockLevel": 500,
  "isPrescriptionRequired": true,
  "defaultShelfLifeDays": 730,
  "units": [
    {
      "unitName": "Lọ",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": true
    }
  ]
}
```

**Thông tin chi tiết:**

- **Loại kho:** COLD (cần bảo quản lạnh)
- **Cần kê đơn:** Có (isPrescriptionRequired = true)
- **Hạn sử dụng:** 730 ngày (2 năm)

---

### Demo Case 3: Tạo vật tư với nhiều đơn vị (3 cấp)

**Request Body:**

```json
{
  "itemCode": "MED-AMOX-500",
  "itemName": "Amoxicillin 500mg",
  "description": "Thuốc kháng sinh nhóm Penicillin",
  "categoryId": 2,
  "warehouseType": "COLD",
  "minStockLevel": 100,
  "maxStockLevel": 1000,
  "isPrescriptionRequired": true,
  "defaultShelfLifeDays": 730,
  "units": [
    {
      "unitName": "Hộp",
      "conversionRate": 100,
      "isBaseUnit": false,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": false
    },
    {
      "unitName": "Vỉ",
      "conversionRate": 10,
      "isBaseUnit": false,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": true
    },
    {
      "unitName": "Viên",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 3,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": false
    }
  ]
}
```

**Thông tin chi tiết:**

- **Hệ thống đơn vị 3 cấp:**
  - 1 Hộp = 10 Vỉ = 100 Viên
  - Đơn vị cơ bản: Viên
  - Đơn vị nhập mặc định: Hộp
  - Đơn vị xuất mặc định: Vỉ

---

### API 6.8: Xem Danh Sách Vật Tư

**API Endpoint:** `GET /api/v1/warehouse/items`

**Request Parameters:**

```
GET /api/v1/warehouse/items?page=0&size=20&search=gạc&warehouseType=NORMAL&stockStatus=NORMAL
```

**Kết quả:**
- Danh sách vật tư với thông tin tồn kho
- Có thể tìm kiếm, lọc theo loại kho, trạng thái tồn kho

---

### API 6.10: Cập Nhật Vật Tư

**API Endpoint:** `PUT /api/v1/warehouse/items/{itemMasterId}`

**Request Body (Partial Update):**

```json
{
  "itemName": "Gạc y tế 10x10cm (Cải tiến)",
  "minStockLevel": 100,
  "maxStockLevel": 1500,
  "isActive": true
}
```

**Lưu ý:**
- Chỉ cần gửi các field muốn cập nhật
- Không cần gửi lại `units` nếu không thay đổi

---

## 📋 Bước 2: Quản Lý Đơn Vị (Units)

### API 6.11: Xem Đơn Vị Của Vật Tư

**API Endpoint:** `GET /api/v1/warehouse/items/{itemMasterId}/units`

**Request:**

```
GET /api/v1/warehouse/items/1/units
```

**Response sẽ hiển thị:**
- Danh sách tất cả đơn vị của vật tư ID 1
- Conversion rates
- Đơn vị nào là base unit
- Đơn vị nào là default import/export

---

### API 6.12: Chuyển Đổi Đơn Vị

**API Endpoint:** `POST /api/v1/warehouse/items/units/convert`

**Demo Case: Chuyển đổi số lượng giữa các đơn vị**

**Request Body:**

```json
{
  "conversions": [
    {
      "itemMasterId": 1,
      "fromUnitId": 3,
      "toUnitId": 1,
      "quantity": 5
    }
  ],
  "roundingMode": "HALF_UP"
}
```

**Thông tin:**
- Vật tư ID 1 (Gạc y tế)
- Chuyển từ: 5 Thùng (unitId: 3)
- Chuyển sang: ? Hộp (unitId: 1, base unit)
- Kết quả: 5 × 10 = 50 Hộp

**Response:**

```json
{
  "statusCode": 200,
  "message": "Conversion completed successfully",
  "data": {
    "results": [
      {
        "itemMasterId": 1,
        "itemName": "Gạc y tế 10x10cm",
        "fromUnitId": 3,
        "fromUnitName": "Thùng",
        "fromQuantity": 5,
        "toUnitId": 1,
        "toUnitName": "Hộp",
        "toQuantity": 50,
        "formula": "5 × 10 = 50",
        "displayString": "5 Thùng = 50 Hộp"
      }
    ]
  }
}
```

**Use Cases:**
- Hiển thị trong form nhập kho: "5 Thùng (= 50 Hộp)"
- Tính toán số lượng khi nhập/xuất
- Hiển thị trong báo cáo với đơn vị người dùng chọn

---

## 📋 Bước 3: Quản Lý Nhà Cung Cấp (Suppliers)

### API 6.13: Xem Danh Sách Nhà Cung Cấp

**API Endpoint:** `GET /api/v1/warehouse/suppliers`

**Request Parameters:**

```
GET /api/v1/warehouse/suppliers?page=0&size=20&search=ABC&isActive=true
```

**Kết quả:**
- Danh sách nhà cung cấp
- Thông tin: Tên, SĐT, Email, Địa chỉ
- Số đơn hàng, Ngày đơn hàng cuối
- Trạng thái: ACTIVE, INACTIVE, BLACKLISTED

---

### API 6.14: Tạo Nhà Cung Cấp Mới

**API Endpoint:** `POST /api/v1/warehouse/suppliers`

**Demo Case: Tạo nhà cung cấp mới**

**Request Body:**

```json
{
  "supplierName": "Công ty Dược phẩm ABC",
  "phone": "0901234567",
  "email": "sales@abc-pharma.com.vn",
  "address": "123 Nguyễn Văn Linh, Q.7, TP.HCM",
  "isBlacklisted": false,
  "notes": "Nhà cung cấp chính, chất lượng tốt, giao hàng đúng hạn"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "message": "Supplier created successfully",
  "data": {
    "supplierId": 1,
    "supplierCode": "SUP-001",
    "supplierName": "Công ty Dược phẩm ABC",
    "phoneNumber": "0901234567",
    "email": "sales@abc-pharma.com.vn",
    "address": "123 Nguyễn Văn Linh, Q.7, TP.HCM",
    "isActive": true,
    "isBlacklisted": false,
    "totalOrders": 0,
    "lastOrderDate": null,
    "notes": "Nhà cung cấp chính, chất lượng tốt, giao hàng đúng hạn",
    "createdAt": "2025-12-01T09:00:00",
    "status": "ACTIVE"
  }
}
```

**Lưu ý:**
- `supplierCode` tự động tạo: SUP-001, SUP-002, ...
- `supplierName` phải unique (case-insensitive)
- `email` phải unique nếu có (case-insensitive)

---

### API 6.15: Cập Nhật Nhà Cung Cấp

**API Endpoint:** `PUT /api/v1/warehouse/suppliers/{supplierId}`

**Request Body (Partial Update):**

```json
{
  "phone": "0901234568",
  "email": "contact@abc-pharma.com.vn",
  "notes": "Đã cập nhật thông tin liên hệ"
}
```

---

### API 6.16: Xóa/Vô Hiệu Hóa Nhà Cung Cấp

**API Endpoint:** `DELETE /api/v1/warehouse/suppliers/{supplierId}`

**Lưu ý:**
- Soft delete: Chỉ set `isActive = false`
- Không thể xóa nếu đã có đơn nhập kho

---

## 📋 Bước 4: Tạo Đơn Nhập Kho (Import Transaction)

### API 6.4: Tạo Phiếu Nhập Kho

**API Endpoint:** `POST /api/v1/inventory/import`

### Demo Case 1: Nhập vật tư thường dùng - Tháng 12/2025

**Request Body:**

```json
{
  "supplierId": 1,
  "transactionDate": "2025-12-01T09:00:00",
  "invoiceNumber": "INV-2025-1201-001",
  "expectedDeliveryDate": "2025-12-01",
  "notes": "Nhập vật tư thường dùng tháng 12/2025",
  "items": [
    {
      "itemMasterId": 1,
      "lotNumber": "LOT-2025-1201-001",
      "expiryDate": "2027-12-01",
      "quantity": 50,
      "unitId": 1,
      "purchasePrice": 50000.0,
      "binLocation": "A-01-01",
      "notes": "Gạc y tế chất lượng cao"
    },
    {
      "itemMasterId": 2,
      "lotNumber": "LOT-2025-1201-002",
      "expiryDate": "2026-06-01",
      "quantity": 100,
      "unitId": 1,
      "purchasePrice": 25000.0,
      "binLocation": "A-01-02",
      "notes": "Găng tay phẫu thuật"
    },
    {
      "itemMasterId": 3,
      "lotNumber": "LOT-2025-1201-003",
      "expiryDate": "2027-12-01",
      "quantity": 20,
      "unitId": 2,
      "purchasePrice": 150000.0,
      "binLocation": "B-02-01",
      "notes": "Thuốc tê Lidocaine"
    }
  ]
}
```

**Thông tin chi tiết:**

- **Nhà cung cấp:** Supplier ID 1 (Công ty Dược phẩm ABC)
- **Mã hóa đơn:** INV-2025-1201-001 (unique)
- **Ngày giao dịch:** 2025-12-01
- **Tổng giá trị:** 50×50,000 + 100×25,000 + 20×150,000 = 8,000,000 ₫

**Items:**
1. **Gạc y tế 10x10cm** (Item ID: 1)
   - Số lượng: 50 Hộp
   - Giá nhập: 50,000 ₫/Hộp
   - Hạn sử dụng: 2027-12-01
   - Vị trí: A-01-01

2. **Găng tay phẫu thuật** (Item ID: 2)
   - Số lượng: 100 Hộp
   - Giá nhập: 25,000 ₫/Hộp
   - Hạn sử dụng: 2026-06-01
   - Vị trí: A-01-02

3. **Thuốc tê Lidocaine 2%** (Item ID: 3)
   - Số lượng: 20 Lọ
   - Giá nhập: 150,000 ₫/Lọ
   - Hạn sử dụng: 2027-12-01
   - Vị trí: B-02-01

---

### Demo Case 2: Nhập vật tư với cảnh báo sắp hết hạn

**Request Body:**

```json
{
  "supplierId": 2,
  "transactionDate": "2025-12-05T10:30:00",
  "invoiceNumber": "INV-2025-1205-001",
  "expectedDeliveryDate": "2025-12-05",
  "notes": "Nhập vật tư - Có lô sắp hết hạn",
  "items": [
    {
      "itemMasterId": 4,
      "lotNumber": "LOT-2025-1205-001",
      "expiryDate": "2026-02-15",
      "quantity": 30,
      "unitId": 1,
      "purchasePrice": 80000.0,
      "binLocation": "A-02-01",
      "notes": "⚠️ Lô này hết hạn trong 2.5 tháng - Cần ưu tiên sử dụng"
    }
  ]
}
```

**Lưu ý:**
- Hạn sử dụng: 2026-02-15 (chỉ còn ~2.5 tháng)
- API sẽ trả về warning: `NEAR_EXPIRY`
- Warning không block transaction, chỉ cảnh báo

---

### Demo Case 3: Nhập vật tư với chuyển đổi đơn vị

**Request Body:**

```json
{
  "supplierId": 1,
  "transactionDate": "2025-12-10T14:00:00",
  "invoiceNumber": "INV-2025-1210-001",
  "notes": "Nhập theo thùng, tự động chuyển về hộp",
  "items": [
    {
      "itemMasterId": 1,
      "lotNumber": "LOT-2025-1210-001",
      "expiryDate": "2027-12-10",
      "quantity": 5,
      "unitId": 3,
      "purchasePrice": 450000.0,
      "binLocation": "A-01-03",
      "notes": "Nhập 5 Thùng = 50 Hộp (1 Thùng = 10 Hộp)"
    }
  ]
}
```

**Lưu ý:**
- Nhập bằng đơn vị "Thùng" (unitId: 3)
- Hệ thống tự động chuyển về đơn vị cơ bản "Hộp"
- Conversion rate: 1 Thùng = 10 Hộp
- Số lượng thực tế lưu: 5 × 10 = 50 Hộp

---

## 📋 Bước 5: Tạo Đơn Xuất Kho (Export Transaction)

### API 6.5: Tạo Phiếu Xuất Kho

**API Endpoint:** `POST /api/v1/inventory/export`

### Demo Case 1: Xuất vật tư cho ca bệnh

**Request Body:**

```json
{
  "appointmentId": 1523,
  "transactionDate": "2025-12-15T09:00:00",
  "notes": "Xuất vật tư cho ca điều trị tủy răng",
  "items": [
    {
      "itemMasterId": 1,
      "quantity": 2,
      "unitId": 1,
      "notes": "Gạc y tế cho ca điều trị"
    },
    {
      "itemMasterId": 2,
      "quantity": 1,
      "unitId": 1,
      "notes": "Găng tay phẫu thuật"
    },
    {
      "itemMasterId": 3,
      "quantity": 1,
      "unitId": 2,
      "notes": "Thuốc tê Lidocaine"
    }
  ]
}
```

**Thông tin chi tiết:**

- **Ca bệnh:** Appointment ID 1523 (APT-2025-1215-007)
- **Bệnh nhân:** Nguyễn Văn X
- **Ngày xuất:** 2025-12-15
- **Items xuất:**
  1. Gạc y tế: 2 Hộp
  2. Găng tay: 1 Hộp
  3. Thuốc tê: 1 Lọ

**Lưu ý:**
- Hệ thống tự động áp dụng FEFO (First Expired First Out)
- Lô sắp hết hạn sẽ được ưu tiên xuất trước
- Không cần chỉ định lot number

---

### Demo Case 2: Xuất vật tư không liên kết ca bệnh

**Request Body:**

```json
{
  "transactionDate": "2025-12-20T11:00:00",
  "notes": "Xuất vật tư cho phòng khám - Không liên kết ca bệnh",
  "items": [
    {
      "itemMasterId": 1,
      "quantity": 10,
      "unitId": 1,
      "notes": "Bổ sung vật tư phòng khám"
    },
    {
      "itemMasterId": 2,
      "quantity": 5,
      "unitId": 1,
      "notes": "Găng tay dự phòng"
    }
  ]
}
```

**Lưu ý:**
- Không có `appointmentId` → Xuất cho mục đích khác
- Vẫn áp dụng FEFO để ưu tiên lô sắp hết hạn

---

## 📋 Bước 6: Xem Tổng Hợp Tồn Kho (Inventory Summary)

### API 6.1: Inventory Summary

**API Endpoint:** `GET /api/v1/warehouse/summary`

### Demo Case 1: Xem tất cả vật tư

**Request Parameters:**

```
GET /api/v1/warehouse/summary?page=0&size=20
```

**Response sẽ hiển thị:**
- Danh sách vật tư với số lượng tồn kho
- Trạng thái tồn kho: `NORMAL`, `LOW_STOCK`, `OUT_OF_STOCK`, `OVERSTOCK`
- Đơn vị cơ bản
- Giá trị tồn kho (nếu có quyền VIEW_COST)

---

### Demo Case 2: Lọc vật tư sắp hết hàng

**Request Parameters:**

```
GET /api/v1/warehouse/summary?page=0&size=20&stockStatus=LOW_STOCK
```

**Kết quả:**
- Chỉ hiển thị vật tư có `stockStatus = LOW_STOCK`
- Cảnh báo cần nhập thêm

---

### Demo Case 3: Tìm kiếm vật tư

**Request Parameters:**

```
GET /api/v1/warehouse/summary?page=0&size=20&search=găng
```

**Kết quả:**
- Tìm tất cả vật tư có tên hoặc mã chứa "găng"
- Ví dụ: "Găng tay phẫu thuật", "Găng tay y tế"

---

## 📋 Bước 7: Xem Chi Tiết Lô Hàng (Item Batches)

### API 6.2: Item Batches Detail

**API Endpoint:** `GET /api/v1/warehouse/batches/{itemMasterId}`

### Demo Case: Xem các lô của một vật tư

**Request:**

```
GET /api/v1/warehouse/batches/1
```

**Response sẽ hiển thị:**
- Danh sách các lô hàng của vật tư ID 1 (Gạc y tế)
- Sắp xếp theo FEFO (First Expired First Out)
- Thông tin từng lô:
  - Lot number
  - Expiry date
  - Số lượng tồn kho
  - Vị trí kho (bin location)
  - Ngày nhập

---

## 📋 Bước 8: Cảnh Báo Hết Hạn (Expiring Alerts)

### API 6.3: Expiring Alerts

**API Endpoint:** `GET /api/v1/warehouse/alerts/expiring`

### Demo Case 1: Xem tất cả lô sắp hết hạn

**Request Parameters:**

```
GET /api/v1/warehouse/alerts/expiring?page=0&size=20&daysBeforeExpiry=90
```

**Response sẽ hiển thị:**
- Danh sách lô hàng hết hạn trong 90 ngày tới
- Số ngày còn lại đến hạn
- Số lượng tồn kho
- Khuyến nghị: Ưu tiên sử dụng lô này trước

---

### Demo Case 2: Lọc lô hết hạn trong 30 ngày

**Request Parameters:**

```
GET /api/v1/warehouse/alerts/expiring?page=0&size=20&daysBeforeExpiry=30
```

**Kết quả:**
- Chỉ hiển thị lô hết hạn trong 30 ngày tới
- Cảnh báo khẩn cấp - Cần xử lý ngay

---

## 📋 Bước 9: Xem Lịch Sử Giao Dịch (Transaction History)

### API 6.6: Transaction History

**API Endpoint:** `GET /api/v1/warehouse/transactions`

### Demo Case 1: Xem tất cả giao dịch

**Request Parameters:**

```
GET /api/v1/warehouse/transactions?page=0&size=20&sortBy=transactionDate&sortDir=desc
```

**Response sẽ hiển thị:**
- Danh sách phiếu nhập/xuất
- Mã giao dịch (PN-YYYYMMDD-XXX, PX-YYYYMMDD-XXX)
- Ngày giao dịch
- Trạng thái: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
- Tổng giá trị (nếu có quyền VIEW_COST)

---

### Demo Case 2: Lọc phiếu nhập chưa thanh toán

**Request Parameters:**

```
GET /api/v1/warehouse/transactions?type=IMPORT&paymentStatus=UNPAID&page=0&size=20
```

**Kết quả:**
- Chỉ hiển thị phiếu nhập chưa thanh toán
- Hiển thị `remainingDebt` (số tiền còn nợ)
- Dùng cho kế toán đối soát công nợ

---

### Demo Case 3: Lọc phiếu xuất theo ca bệnh

**Request Parameters:**

```
GET /api/v1/warehouse/transactions?type=EXPORT&appointmentId=1523&page=0&size=20
```

**Kết quả:**
- Chỉ hiển thị phiếu xuất liên kết với ca bệnh 1523
- Xem vật tư đã xuất cho ca bệnh cụ thể

---

### Demo Case 4: Lọc theo khoảng thời gian

**Request Parameters:**

```
GET /api/v1/warehouse/transactions?fromDate=2025-12-01&toDate=2025-12-31&page=0&size=20
```

**Kết quả:**
- Chỉ hiển thị giao dịch trong tháng 12/2025
- Dùng cho báo cáo tháng

---

### API 6.7: Transaction Detail

**API Endpoint:** `GET /api/v1/warehouse/transactions/{transactionId}`

**Request:**

```
GET /api/v1/warehouse/transactions/501
```

**Response sẽ hiển thị:**
- Chi tiết đầy đủ của giao dịch ID 501
- Danh sách items với thông tin chi tiết
- Thông tin nhà cung cấp (nếu là phiếu nhập)
- Thông tin ca bệnh (nếu là phiếu xuất)
- Lịch sử approval (nếu có)

---

## 📋 Bước 10: Vật Tư Tiêu Hao Cho Dịch Vụ (Service Consumables)

### API 6.17: Get Service Consumables

**API Endpoint:** `GET /api/v1/warehouse/consumables/services/{serviceId}`

### Demo Case: Xem vật tư cần thiết cho dịch vụ

**Request:**

```
GET /api/v1/warehouse/consumables/services/7
```

**Response sẽ hiển thị:**
- Danh sách vật tư tiêu hao cần thiết cho dịch vụ ID 7
- Số lượng cần thiết
- Tình trạng tồn kho: `OK`, `LOW`, `OUT_OF_STOCK`
- Giá thành (nếu có quyền VIEW_WAREHOUSE_COST)
- Cảnh báo nếu thiếu hàng

**Use Cases:**
- Kiểm tra trước khi đặt lịch: Có đủ vật tư không?
- Tính toán chi phí vật tư (COGS) cho dịch vụ
- Chuẩn bị vật tư trước khi thực hiện dịch vụ

---

## 🎯 Workflow Demo Hoàn Chỉnh

### Scenario: Từ khai báo vật tư đến xuất kho cho ca bệnh

**Bước 1: Khai báo vật tư mới**
- Tạo vật tư: Gạc y tế (MAT-GAC-10X10)
- Thiết lập đơn vị: Thùng (10 Hộp), Hộp (base unit)
- Thiết lập mức tồn kho: Min 50, Max 1000

**Bước 2: Tạo nhà cung cấp**
- Tạo nhà cung cấp: Công ty Dược phẩm ABC (SUP-001)
- Nhập thông tin liên hệ

**Bước 3: Nhập vật tư mới**
- Tạo phiếu nhập: `INV-2025-1201-001`
- Nhập 3 loại vật tư (Gạc, Găng tay, Thuốc tê)
- Tổng giá trị: 8,000,000 ₫
- Status: `APPROVED`

**Bước 4: Xem tổng hợp tồn kho**
- Kiểm tra số lượng tồn kho sau khi nhập
- Xác nhận vật tư đã được cập nhật
- Kiểm tra trạng thái tồn kho (NORMAL, LOW_STOCK, etc.)

**Bước 5: Xem chi tiết lô hàng**
- Xem các lô của vật tư Gạc y tế
- Kiểm tra FEFO sorting (lô sắp hết hạn trước)

**Bước 6: Kiểm tra cảnh báo hết hạn**
- Xem lô hàng sắp hết hạn trong 90 ngày
- Ưu tiên sử dụng lô sắp hết hạn

**Bước 7: Xuất vật tư cho ca bệnh**
- Tạo phiếu xuất cho Appointment ID 1523
- Xuất: 2 Hộp Gạc, 1 Hộp Găng tay, 1 Lọ Thuốc tê
- Hệ thống tự động áp dụng FEFO

**Bước 8: Xem lịch sử giao dịch**
- Xem cả phiếu nhập và phiếu xuất
- Kiểm tra trạng thái và tổng giá trị
- Xem chi tiết từng giao dịch

**Bước 9: Kiểm tra vật tư cho dịch vụ**
- Xem vật tư cần thiết cho dịch vụ "Nhổ răng sữa"
- Kiểm tra tình trạng tồn kho
- Tính toán chi phí vật tư (COGS)

---

## 📊 Data Mẫu Tham Khảo

### Item Masters (Vật tư)

| ID | Mã vật tư | Tên vật tư | Đơn vị cơ bản | Kho | Category |
|----|-----------|------------|---------------|-----|----------|
| 1 | MAT-GAC-10X10 | Gạc y tế 10x10cm | Hộp | NORMAL | Vật tư tiêu hao |
| 2 | MAT-GANG-TAY | Găng tay phẫu thuật | Hộp | NORMAL | Vật tư tiêu hao |
| 3 | MED-LIDO-2PCT | Thuốc tê Lidocaine 2% | Lọ | COLD | Thuốc |
| 4 | MAT-BONG-GON | Bông gòn y tế | Hộp | NORMAL | Vật tư tiêu hao |
| 5 | MAT-KIM-TIEM | Kim tiêm 5ml | Cái | NORMAL | Vật tư tiêu hao |

### Suppliers (Nhà cung cấp)

| ID | Mã NCC | Tên nhà cung cấp | SĐT | Email |
|----|--------|------------------|-----|-------|
| 1 | SUP-001 | Công ty Dược phẩm ABC | 0901234567 | sales@abc-pharma.com.vn |
| 2 | SUP-002 | Công ty Thiết bị Y tế XYZ | 0912345678 | contact@xyz-med.com.vn |
| 3 | SUP-003 | Công ty Vật tư Y tế DEF | 0923456789 | info@def-supplies.com.vn |

### Units (Đơn vị)

| ID | Tên đơn vị | Mã đơn vị | Loại | Conversion Rate |
|----|------------|-----------|------|-----------------|
| 1 | Hộp | BOX | Base unit | 1 |
| 2 | Lọ | BOTTLE | Base unit | 1 |
| 3 | Thùng | CARTON | Conversion unit | 10 (1 Thùng = 10 Hộp) |
| 4 | Cái | PIECE | Base unit | 1 |
| 5 | Vỉ | STRIP | Conversion unit | 10 (1 Vỉ = 10 Viên) |
| 6 | Viên | PILL | Base unit | 1 |

### Sample Invoice Numbers

- `INV-2025-1201-001`
- `INV-2025-1205-001`
- `INV-2025-1210-001`
- `INV-2025-1215-001`
- `INV-2025-1220-001`

### Sample Lot Numbers

- `LOT-2025-1201-001`
- `LOT-2025-1201-002`
- `LOT-2025-1205-001`
- `LOT-2025-1210-001`

### Sample Bin Locations

- `A-01-01` (Kệ A, Tầng 1, Vị trí 01)
- `A-01-02`
- `A-01-03`
- `A-02-01`
- `B-02-01` (Kệ B, Tầng 2, Vị trí 01)

---

## 📝 Lưu Ý Khi Demo

1. **Item Code phải unique và đúng format:**
   - Pattern: `^[A-Z0-9-]{3,20}$`
   - Uppercase, numbers, hyphens only
   - Ví dụ: `MAT-GAC-10X10`, `MED-LIDO-2PCT`

2. **Invoice Number phải unique:**
   - Mỗi phiếu nhập phải có `invoiceNumber` khác nhau
   - Nếu trùng sẽ báo lỗi 409 CONFLICT

3. **Expiry Date phải trong tương lai:**
   - `expiryDate` phải > `transactionDate`
   - Nếu quá khứ sẽ báo lỗi 400 BAD REQUEST

4. **Quantity phải hợp lệ:**
   - Range: 1 - 1,000,000
   - Phải đủ tồn kho khi xuất

5. **Unit Conversion:**
   - Khi nhập bằng đơn vị khác base unit, hệ thống tự động chuyển đổi
   - Kiểm tra conversion rate trong database
   - Base unit phải có `conversionRate = 1`

6. **FEFO (First Expired First Out):**
   - Khi xuất, hệ thống tự động ưu tiên lô sắp hết hạn
   - Không cần chỉ định lot number khi xuất

7. **Permissions:**
   - `CREATE_ITEMS`: Tạo vật tư mới
   - `IMPORT_ITEMS`: Tạo phiếu nhập
   - `EXPORT_ITEMS`: Tạo phiếu xuất
   - `VIEW_COST`: Xem giá trị tồn kho và tổng giá trị giao dịch
   - `VIEW_WAREHOUSE_COST`: Xem giá thành vật tư trong Service Consumables
   - `APPROVE_TRANSACTION`: Duyệt phiếu nhập/xuất
   - `MANAGE_SUPPLIERS`: Quản lý nhà cung cấp

8. **Supplier Name & Email:**
   - Phải unique (case-insensitive)
   - "Duoc Pham A" và "duoc pham a" là duplicate

9. **Unit Hierarchy:**
   - Phải có đúng 1 base unit (`isBaseUnit = true`)
   - Base unit phải có `conversionRate = 1`
   - Các unit khác phải có `conversionRate > 1`

10. **Stock Status:**
    - `OUT_OF_STOCK`: Số lượng = 0
    - `LOW_STOCK`: Số lượng < minStockLevel
    - `NORMAL`: minStockLevel <= số lượng <= maxStockLevel
    - `OVERSTOCK`: Số lượng > maxStockLevel

---

**Last Updated:** 2025-12-02  
**Author:** FE Development Team  
**Purpose:** Complete demo data for Warehouse module testing (API 6.1 - 6.17)
