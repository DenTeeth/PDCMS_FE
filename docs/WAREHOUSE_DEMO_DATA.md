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

## 🎬 Scenarios & Use Cases - FE Workflow

### Scenario 1: Happy Case - Quy trình nhập xuất kho hoàn chỉnh

**Mục đích:** Demo quy trình đầy đủ từ khai báo vật tư đến xuất kho cho ca bệnh

**Các bước thao tác trên FE:**

1. **Khai báo vật tư mới**
   - Vào menu: Kho → Vật tư → Tạo mới
   - Nhập thông tin: Mã vật tư, Tên, Mô tả, Category, Loại kho
   - Thiết lập mức tồn kho: Min = 50, Max = 1000
   - Thêm đơn vị: Thùng (10 Hộp), Hộp (base unit)
   - Chọn đơn vị nhập mặc định: Thùng
   - Chọn đơn vị xuất mặc định: Hộp
   - Lưu và xác nhận tạo thành công

2. **Tạo nhà cung cấp**
   - Vào menu: Kho → Nhà cung cấp → Tạo mới
   - Nhập: Tên, SĐT, Email, Địa chỉ
   - Thêm ghi chú về nhà cung cấp
   - Lưu và xác nhận

3. **Tạo phiếu nhập kho**
   - Vào menu: Kho → Phiếu nhập → Tạo mới
   - Chọn nhà cung cấp từ dropdown
   - Nhập: Số hóa đơn, Ngày giao dịch, Ngày giao hàng dự kiến
   - Thêm items:
     - Chọn vật tư từ danh sách
     - Nhập: Số lô, Hạn sử dụng, Số lượng, Đơn vị, Giá nhập, Vị trí kho
     - Thêm ghi chú cho từng item
   - Xem tổng giá trị tự động tính
   - Lưu phiếu nhập (status: DRAFT)
   - Gửi duyệt (status: PENDING_APPROVAL)
   - Admin duyệt phiếu (status: APPROVED)

4. **Kiểm tra tồn kho sau nhập**
   - Vào menu: Kho → Tổng hợp tồn kho
   - Tìm kiếm vật tư vừa nhập
   - Xác nhận số lượng tồn kho đã cập nhật
   - Kiểm tra trạng thái tồn kho (NORMAL/LOW_STOCK/OUT_OF_STOCK)

5. **Xem chi tiết lô hàng**
   - Vào menu: Kho → Tổng hợp tồn kho
   - Click vào vật tư → Xem chi tiết lô
   - Xác nhận các lô được sắp xếp theo FEFO (lô sắp hết hạn trước)
   - Kiểm tra thông tin: Lot number, Expiry date, Số lượng, Vị trí kho

6. **Tạo phiếu xuất kho cho ca bệnh**
   - Vào menu: Kho → Phiếu xuất → Tạo mới
   - Chọn ca bệnh từ dropdown (hoặc để trống nếu không liên kết)
   - Nhập: Ngày xuất, Ghi chú
   - Thêm items:
     - Chọn vật tư từ danh sách
     - Nhập: Số lượng, Đơn vị
     - Hệ thống tự động áp dụng FEFO (không cần chọn lô)
   - Xem tổng giá trị (nếu có quyền VIEW_COST)
   - Lưu và gửi duyệt
   - Admin duyệt phiếu xuất

7. **Kiểm tra tồn kho sau xuất**
   - Vào menu: Kho → Tổng hợp tồn kho
   - Xác nhận số lượng tồn kho đã giảm
   - Kiểm tra lô hàng đã được xuất (số lượng giảm)

8. **Xem lịch sử giao dịch**
   - Vào menu: Kho → Lịch sử giao dịch
   - Xem danh sách phiếu nhập/xuất
   - Lọc theo: Loại (Nhập/Xuất), Trạng thái, Khoảng thời gian
   - Click vào phiếu để xem chi tiết
   - Xác nhận thông tin: Items, Nhà cung cấp, Ca bệnh, Tổng giá trị

---

### Scenario 2: Cảnh báo hết hạn và ưu tiên sử dụng

**Mục đích:** Demo tính năng cảnh báo hết hạn và FEFO

**Các bước thao tác trên FE:**

1. **Nhập vật tư với lô sắp hết hạn**
   - Tạo phiếu nhập mới
   - Thêm item với hạn sử dụng gần (ví dụ: 2 tháng nữa)
   - Hệ thống hiển thị cảnh báo: "⚠️ Lô này hết hạn trong 2.5 tháng"
   - Xác nhận vẫn có thể lưu (warning không block)
   - Lưu phiếu nhập

2. **Nhập thêm lô cùng vật tư với hạn xa hơn**
   - Tạo phiếu nhập mới cho cùng vật tư
   - Thêm item với hạn sử dụng xa hơn (ví dụ: 1 năm nữa)
   - Lưu phiếu nhập

3. **Xem cảnh báo hết hạn**
   - Vào menu: Kho → Cảnh báo → Hết hạn
   - Chọn số ngày trước hết hạn (ví dụ: 90 ngày)
   - Xem danh sách lô sắp hết hạn
   - Xác nhận lô hết hạn sớm hơn được hiển thị trước
   - Xem số ngày còn lại đến hạn

4. **Xuất vật tư - Kiểm tra FEFO**
   - Tạo phiếu xuất mới
   - Chọn vật tư có nhiều lô (lô sắp hết hạn và lô hạn xa)
   - Nhập số lượng xuất
   - Hệ thống tự động chọn lô sắp hết hạn trước
   - Xác nhận trong chi tiết phiếu xuất: Lô nào được xuất
   - Lưu phiếu xuất

5. **Kiểm tra tồn kho sau xuất**
   - Vào menu: Kho → Tổng hợp tồn kho → Chi tiết lô
   - Xác nhận lô sắp hết hạn đã giảm số lượng
   - Lô hạn xa vẫn còn nguyên

---

### Scenario 3: Quản lý đơn vị và chuyển đổi

**Mục đích:** Demo tính năng quản lý đơn vị và chuyển đổi

**Các bước thao tác trên FE:**

1. **Tạo vật tư với nhiều đơn vị (3 cấp)**
   - Tạo vật tư mới
   - Thêm đơn vị cấp 1: Hộp (conversionRate: 100, base unit: false)
   - Thêm đơn vị cấp 2: Vỉ (conversionRate: 10, base unit: false)
   - Thêm đơn vị cấp 3: Viên (conversionRate: 1, base unit: true)
   - Thiết lập: Đơn vị nhập mặc định = Hộp, Đơn vị xuất mặc định = Vỉ
   - Lưu vật tư

2. **Xem danh sách đơn vị của vật tư**
   - Vào menu: Kho → Vật tư → Chi tiết vật tư
   - Tab "Đơn vị"
   - Xem danh sách đơn vị với conversion rates
   - Xác nhận đơn vị nào là base unit
   - Xác nhận đơn vị nào là default import/export

3. **Nhập kho với đơn vị khác base unit**
   - Tạo phiếu nhập mới
   - Chọn vật tư có nhiều đơn vị
   - Chọn đơn vị nhập: Hộp
   - Nhập số lượng: 5 Hộp
   - Hệ thống tự động hiển thị: "5 Hộp (= 500 Viên)"
   - Lưu phiếu nhập
   - Xác nhận tồn kho được tính theo base unit (Viên)

4. **Xuất kho với đơn vị khác base unit**
   - Tạo phiếu xuất mới
   - Chọn vật tư có nhiều đơn vị
   - Chọn đơn vị xuất: Vỉ
   - Nhập số lượng: 10 Vỉ
   - Hệ thống tự động hiển thị: "10 Vỉ (= 100 Viên)"
   - Lưu phiếu xuất
   - Xác nhận tồn kho giảm đúng số lượng base unit

5. **Sử dụng công cụ chuyển đổi đơn vị**
   - Vào menu: Kho → Công cụ → Chuyển đổi đơn vị
   - Chọn vật tư
   - Chọn đơn vị nguồn: Thùng
   - Chọn đơn vị đích: Hộp
   - Nhập số lượng: 3 Thùng
   - Xem kết quả: "3 Thùng = 30 Hộp"
   - Xem công thức: "3 × 10 = 30"

---

### Scenario 4: Cảnh báo tồn kho thấp và nhập bổ sung

**Mục đích:** Demo tính năng cảnh báo tồn kho và nhập bổ sung

**Các bước thao tác trên FE:**

1. **Tạo vật tư với mức tồn kho**
   - Tạo vật tư mới
   - Thiết lập: Min = 50, Max = 1000
   - Lưu vật tư

2. **Nhập kho lần đầu (số lượng < min)**
   - Tạo phiếu nhập mới
   - Nhập số lượng: 30 (dưới mức tối thiểu)
   - Lưu và duyệt phiếu nhập
   - Vào menu: Kho → Tổng hợp tồn kho
   - Xác nhận trạng thái: "LOW_STOCK" (màu vàng/cảnh báo)
   - Xem cảnh báo: "Tồn kho dưới mức tối thiểu"

3. **Nhập bổ sung để đạt mức tối thiểu**
   - Tạo phiếu nhập mới
   - Chọn vật tư đang LOW_STOCK
   - Nhập số lượng bổ sung: 30
   - Lưu và duyệt phiếu nhập
   - Kiểm tra tồn kho: 30 + 30 = 60 (>= 50)
   - Xác nhận trạng thái chuyển sang: "NORMAL" (màu xanh)

4. **Nhập quá mức tối đa**
   - Tạo phiếu nhập mới
   - Chọn vật tư
   - Nhập số lượng: 2000 (vượt max = 1000)
   - Lưu và duyệt phiếu nhập
   - Vào menu: Kho → Tổng hợp tồn kho
   - Xác nhận trạng thái: "OVERSTOCK" (màu đỏ/cảnh báo)
   - Xem cảnh báo: "Tồn kho vượt mức tối đa"

5. **Lọc vật tư theo trạng thái tồn kho**
   - Vào menu: Kho → Tổng hợp tồn kho
   - Chọn filter: "LOW_STOCK"
   - Xem danh sách vật tư cần nhập bổ sung
   - Chọn filter: "OUT_OF_STOCK"
   - Xem danh sách vật tư hết hàng

---

### Scenario 5: Xuất kho cho nhiều ca bệnh và báo cáo

**Mục đích:** Demo xuất kho cho nhiều ca bệnh và xem báo cáo

**Các bước thao tác trên FE:**

1. **Xuất kho cho ca bệnh 1**
   - Vào menu: Kho → Phiếu xuất → Tạo mới
   - Chọn ca bệnh: APT-2025-1215-001
   - Thêm items: Gạc (2 Hộp), Găng tay (1 Hộp), Thuốc tê (1 Lọ)
   - Lưu và duyệt phiếu xuất

2. **Xuất kho cho ca bệnh 2**
   - Tạo phiếu xuất mới
   - Chọn ca bệnh: APT-2025-1215-002
   - Thêm items: Gạc (1 Hộp), Bông gòn (1 Hộp)
   - Lưu và duyệt phiếu xuất

3. **Xem lịch sử xuất kho theo ca bệnh**
   - Vào menu: Kho → Lịch sử giao dịch
   - Chọn filter: Loại = "Xuất kho"
   - Chọn ca bệnh: APT-2025-1215-001
   - Xem danh sách phiếu xuất cho ca bệnh này
   - Click vào phiếu để xem chi tiết items đã xuất

4. **Xem báo cáo tổng hợp xuất kho**
   - Vào menu: Kho → Báo cáo → Xuất kho theo ca bệnh
   - Chọn khoảng thời gian: Tháng 12/2025
   - Xem danh sách ca bệnh và vật tư đã xuất
   - Xem tổng giá trị vật tư xuất (nếu có quyền VIEW_COST)

5. **Xuất kho không liên kết ca bệnh**
   - Tạo phiếu xuất mới
   - Để trống "Ca bệnh" (không chọn)
   - Thêm items: Gạc (10 Hộp), Găng tay (5 Hộp)
   - Ghi chú: "Xuất cho phòng khám - Bổ sung vật tư"
   - Lưu và duyệt phiếu xuất
   - Xác nhận trong lịch sử: "Không liên kết ca bệnh"

---

### Scenario 6: Quản lý nhà cung cấp và đơn hàng

**Mục đích:** Demo quản lý nhà cung cấp và theo dõi đơn hàng

**Các bước thao tác trên FE:**

1. **Tạo nhà cung cấp mới**
   - Vào menu: Kho → Nhà cung cấp → Tạo mới
   - Nhập: Tên, SĐT, Email, Địa chỉ
   - Thêm ghi chú: "Nhà cung cấp chính, chất lượng tốt"
   - Lưu và xác nhận mã nhà cung cấp tự động tạo (SUP-001)

2. **Xem danh sách nhà cung cấp**
   - Vào menu: Kho → Nhà cung cấp
   - Xem danh sách với thông tin: Tên, SĐT, Email, Số đơn hàng
   - Tìm kiếm nhà cung cấp theo tên
   - Lọc theo trạng thái: ACTIVE, INACTIVE, BLACKLISTED

3. **Tạo nhiều phiếu nhập từ cùng nhà cung cấp**
   - Tạo phiếu nhập 1: Chọn nhà cung cấp SUP-001
   - Tạo phiếu nhập 2: Chọn nhà cung cấp SUP-001
   - Tạo phiếu nhập 3: Chọn nhà cung cấp SUP-001
   - Duyệt tất cả phiếu nhập

4. **Xem thống kê nhà cung cấp**
   - Vào menu: Kho → Nhà cung cấp → Chi tiết SUP-001
   - Xem thông tin: Tổng số đơn hàng, Ngày đơn hàng cuối
   - Xem danh sách phiếu nhập từ nhà cung cấp này
   - Xem tổng giá trị đơn hàng (nếu có quyền VIEW_COST)

5. **Cập nhật thông tin nhà cung cấp**
   - Vào menu: Kho → Nhà cung cấp → Chi tiết SUP-001
   - Click "Chỉnh sửa"
   - Cập nhật: SĐT, Email mới
   - Thêm ghi chú: "Đã cập nhật thông tin liên hệ"
   - Lưu và xác nhận

6. **Vô hiệu hóa nhà cung cấp**
   - Vào menu: Kho → Nhà cung cấp → Chi tiết SUP-001
   - Click "Vô hiệu hóa"
   - Xác nhận hành động
   - Xác nhận trạng thái chuyển sang: "INACTIVE"
   - Xác nhận không thể chọn nhà cung cấp này khi tạo phiếu nhập mới

---

### Scenario 7: Vật tư tiêu hao cho dịch vụ

**Mục đích:** Demo tính năng xem vật tư cần thiết cho dịch vụ

**Các bước thao tác trên FE:**

1. **Xem vật tư tiêu hao cho dịch vụ**
   - Vào menu: Dịch vụ → Chi tiết dịch vụ (ví dụ: "Nhổ răng sữa")
   - Tab "Vật tư tiêu hao"
   - Xem danh sách vật tư cần thiết cho dịch vụ
   - Xem số lượng cần thiết cho mỗi vật tư
   - Xem tình trạng tồn kho: OK (xanh), LOW (vàng), OUT_OF_STOCK (đỏ)

2. **Kiểm tra trước khi đặt lịch**
   - Vào menu: Đặt lịch → Tạo lịch hẹn mới
   - Chọn dịch vụ: "Nhổ răng sữa"
   - Hệ thống tự động hiển thị cảnh báo nếu thiếu vật tư
   - Xem danh sách vật tư cần thiết và tình trạng tồn kho
   - Quyết định: Đặt lịch hoặc nhập bổ sung vật tư trước

3. **Chuẩn bị vật tư trước ca bệnh**
   - Vào menu: Lịch hẹn → Chi tiết ca bệnh
   - Tab "Vật tư cần thiết"
   - Xem danh sách vật tư và số lượng cần
   - Kiểm tra tồn kho có đủ không
   - Nếu thiếu: Tạo phiếu nhập bổ sung hoặc cảnh báo

4. **Xuất vật tư sau ca bệnh**
   - Sau khi hoàn thành ca bệnh
   - Vào menu: Kho → Phiếu xuất → Tạo mới
   - Chọn ca bệnh vừa hoàn thành
   - Hệ thống tự động gợi ý items từ "Vật tư tiêu hao" của dịch vụ
   - Xác nhận số lượng và lưu phiếu xuất

5. **Xem chi phí vật tư (COGS)**
   - Vào menu: Dịch vụ → Chi tiết dịch vụ
   - Tab "Vật tư tiêu hao"
   - Xem giá thành vật tư (nếu có quyền VIEW_WAREHOUSE_COST)
   - Xem tổng chi phí vật tư cho dịch vụ
   - Sử dụng cho tính giá dịch vụ

---

### Scenario 8: Quy trình duyệt phiếu nhập/xuất

**Mục đích:** Demo quy trình duyệt phiếu nhập/xuất

**Các bước thao tác trên FE:**

1. **Nhân viên tạo phiếu nhập (DRAFT)**
   - Tạo phiếu nhập mới
   - Thêm items và thông tin
   - Lưu phiếu (status: DRAFT)
   - Xác nhận có thể chỉnh sửa/xóa

2. **Nhân viên gửi duyệt (PENDING_APPROVAL)**
   - Vào menu: Kho → Phiếu nhập → Chi tiết phiếu
   - Click "Gửi duyệt"
   - Xác nhận status chuyển sang: PENDING_APPROVAL
   - Xác nhận không thể chỉnh sửa/xóa nữa

3. **Admin xem danh sách chờ duyệt**
   - Vào menu: Kho → Lịch sử giao dịch
   - Chọn filter: Trạng thái = "PENDING_APPROVAL"
   - Xem danh sách phiếu chờ duyệt
   - Xem thông tin: Người tạo, Ngày tạo, Tổng giá trị

4. **Admin duyệt phiếu (APPROVED)**
   - Click vào phiếu chờ duyệt
   - Xem chi tiết: Items, Nhà cung cấp, Tổng giá trị
   - Click "Duyệt"
   - Xác nhận status chuyển sang: APPROVED
   - Xác nhận tồn kho được cập nhật

5. **Admin từ chối phiếu (REJECTED)**
   - Click vào phiếu chờ duyệt khác
   - Click "Từ chối"
   - Nhập lý do từ chối
   - Xác nhận status chuyển sang: REJECTED
   - Xác nhận tồn kho KHÔNG được cập nhật

6. **Nhân viên xem phiếu bị từ chối**
   - Vào menu: Kho → Lịch sử giao dịch
   - Chọn filter: Trạng thái = "REJECTED"
   - Xem phiếu bị từ chối và lý do
   - Có thể chỉnh sửa và gửi duyệt lại

---

### Scenario 9: Tìm kiếm và lọc nâng cao

**Mục đích:** Demo tính năng tìm kiếm và lọc

**Các bước thao tác trên FE:**

1. **Tìm kiếm vật tư**
   - Vào menu: Kho → Vật tư
   - Nhập từ khóa: "gạc"
   - Xem kết quả: Tất cả vật tư có tên/mã chứa "gạc"
   - Thử tìm kiếm theo mã: "MAT-GAC"
   - Xem kết quả chính xác

2. **Lọc vật tư theo nhiều tiêu chí**
   - Vào menu: Kho → Tổng hợp tồn kho
   - Chọn filter: Loại kho = "COLD"
   - Chọn filter: Trạng thái tồn kho = "NORMAL"
   - Chọn filter: Category = "Thuốc"
   - Xem kết quả lọc
   - Xóa từng filter để xem thay đổi

3. **Tìm kiếm phiếu nhập/xuất**
   - Vào menu: Kho → Lịch sử giao dịch
   - Nhập từ khóa: Số hóa đơn hoặc Mã phiếu
   - Xem kết quả tìm kiếm
   - Lọc theo: Loại, Trạng thái, Nhà cung cấp, Khoảng thời gian

4. **Lọc theo khoảng thời gian**
   - Vào menu: Kho → Lịch sử giao dịch
   - Chọn: Từ ngày = 01/12/2025
   - Chọn: Đến ngày = 31/12/2025
   - Xem kết quả: Chỉ giao dịch trong tháng 12
   - Sử dụng cho báo cáo tháng

5. **Sắp xếp kết quả**
   - Vào menu: Kho → Tổng hợp tồn kho
   - Chọn sắp xếp: "Số lượng tồn kho" (Tăng dần/Giảm dần)
   - Chọn sắp xếp: "Tên vật tư" (A-Z/Z-A)
   - Xem kết quả thay đổi

---

### Scenario 10: Xử lý lỗi và edge cases

**Mục đích:** Demo xử lý các trường hợp lỗi và edge cases

**Các bước thao tác trên FE:**

1. **Nhập vật tư với số hóa đơn trùng**
   - Tạo phiếu nhập mới
   - Nhập số hóa đơn đã tồn tại
   - Lưu phiếu
   - Xem lỗi: "Số hóa đơn đã tồn tại" (409 CONFLICT)
   - Sửa số hóa đơn và lưu lại

2. **Xuất kho khi không đủ tồn kho**
   - Tạo phiếu xuất mới
   - Chọn vật tư có tồn kho: 10 Hộp
   - Nhập số lượng xuất: 15 Hộp
   - Lưu phiếu
   - Xem lỗi: "Không đủ tồn kho. Tồn kho hiện tại: 10 Hộp" (400 BAD REQUEST)
   - Sửa số lượng <= 10 và lưu lại

3. **Nhập vật tư với hạn sử dụng quá khứ**
   - Tạo phiếu nhập mới
   - Nhập hạn sử dụng: Ngày trong quá khứ
   - Lưu phiếu
   - Xem lỗi: "Hạn sử dụng phải trong tương lai" (400 BAD REQUEST)
   - Sửa hạn sử dụng và lưu lại

4. **Tạo vật tư với mã trùng**
   - Tạo vật tư mới
   - Nhập mã vật tư đã tồn tại: "MAT-GAC-10X10"
   - Lưu vật tư
   - Xem lỗi: "Mã vật tư đã tồn tại" (409 CONFLICT)
   - Sửa mã vật tư và lưu lại

5. **Tạo nhà cung cấp với tên/email trùng**
   - Tạo nhà cung cấp mới
   - Nhập tên hoặc email đã tồn tại
   - Lưu nhà cung cấp
   - Xem lỗi: "Tên nhà cung cấp đã tồn tại" hoặc "Email đã tồn tại" (409 CONFLICT)
   - Sửa thông tin và lưu lại

6. **Xóa/vô hiệu hóa vật tư đã có giao dịch**
   - Vào menu: Kho → Vật tư → Chi tiết vật tư
   - Click "Vô hiệu hóa"
   - Xem cảnh báo: "Vật tư đã có giao dịch, không thể xóa"
   - Xác nhận chỉ có thể vô hiệu hóa (soft delete)

---

**Last Updated:** 2025-12-04  
**Author:** FE Development Team  
**Purpose:** Complete demo data for Warehouse module testing (API 6.1 - 6.17)
