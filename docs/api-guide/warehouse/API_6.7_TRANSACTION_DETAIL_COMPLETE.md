# API 6.7 - Transaction Detail (Xem Chi tiết Giao dịch Kho)

**Date:** November 27, 2025
**Status:** [YES] Production Ready
**Version:** v1
**Endpoint:** `GET /api/v1/warehouse/transactions/{id}`

---

## 📋 Overview

API 6.7 cho phép xem chi tiết đầy đủ của một phiếu Nhập/Xuất/Điều chỉnh kho, bao gồm:

- Thông tin header (supplier, invoice, appointment)
- Danh sách chi tiết tất cả items với batch và số lượng
- Thông tin tự động unpacking (nếu có)
- Lịch sử duyệt phiếu
- Phân quyền VIEW_COST để ẩn/hiện thông tin tài chính

---

## 🎯 Use Cases

### 1. **Xem chi tiết phiếu từ danh sách**

User click vào một dòng trong API 6.6 (Transaction History List) → Hiển thị đầy đủ chi tiết phiếu

### 2. **Kiểm tra items đã xuất trong ca điều trị**

Doctor/Receptionist xem phiếu xuất của một ca bệnh để biết vật tư nào đã được sử dụng

### 3. **Đối soát hóa đơn nhà cung cấp**

Accountant kiểm tra chi tiết phiếu nhập để đối chiếu với invoice từ supplier

### 4. **Audit trail - Truy vết lô hàng**

Khi có sự cố (vật tư lỗi, hết hạn), truy vết batch nào đã được xuất/nhập trong phiếu nào

---

## 🔐 Authorization

### Required Permissions:

- **VIEW_WAREHOUSE** (Bắt buộc) - Xem thông tin phiếu và items
- **VIEW_COST** (Tùy chọn) - Xem giá trị tài chính

### Roles:

- [YES] **Admin** - Full access (bao gồm financial data)
- [YES] **Warehouse Manager** - Full access với VIEW_COST
- [YES] **Warehouse Staff** - View-only, không có financial data
- [YES] **Accountant** - Full access với VIEW_COST
- [YES] **Receptionist** - View-only cho export transactions
- [YES] **Doctor** - View-only cho export transactions liên quan đến ca bệnh của mình
- [NO] **Patient** - Không có quyền truy cập

---

## 📡 HTTP Request

### Endpoint

```
GET /api/v1/warehouse/transactions/{id}
```

### Path Parameters

| Parameter | Type | Required | Description                             |
| --------- | ---- | -------- | --------------------------------------- |
| `id`      | Long | [YES] Yes   | ID của phiếu giao dịch (transaction_id) |

### Headers

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/transactions/1523" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 📤 HTTP Response

### Response Structure (Import Transaction)

**Status Code:** `200 OK`

```json
{
  "code": 200,
  "message": "Lấy chi tiết giao dịch thành công",
  "data": {
    "transactionId": 1523,
    "transactionCode": "PN-20251127-001",
    "transactionDate": "2025-11-27T10:30:00",
    "supplierName": "Công ty TNHH Vật tư Y tế ABC",
    "invoiceNumber": "INV-2025-11-001",
    "status": "APPROVED",
    "createdBy": "Nguyễn Văn A",
    "createdAt": "2025-11-27T09:00:00",
    "totalItems": 3,
    "totalValue": 15750000.0,
    "items": [
      {
        "itemCode": "MAT-001",
        "itemName": "Kim tiêm 23G",
        "batchId": 245,
        "batchStatus": "EXISTING",
        "lotNumber": "LOT-2025-A1",
        "expiryDate": "2026-12-31",
        "quantityChange": 100,
        "unitName": "Hộp",
        "purchasePrice": 50000.0,
        "totalLineValue": 5000000.0,
        "binLocation": "Kệ A - Tầng 2",
        "currentStock": 250
      },
      {
        "itemCode": "MAT-002",
        "itemName": "Gạc y tế vô trùng",
        "batchId": 246,
        "batchStatus": "EXISTING",
        "lotNumber": "LOT-2025-B3",
        "expiryDate": "2027-06-30",
        "quantityChange": 200,
        "unitName": "Gói",
        "purchasePrice": 25000.0,
        "totalLineValue": 5000000.0,
        "binLocation": "Kệ B - Tầng 1",
        "currentStock": 450
      },
      {
        "itemCode": "MED-015",
        "itemName": "Thuốc tê Lidocaine 2%",
        "batchId": 247,
        "batchStatus": "EXISTING",
        "lotNumber": "LOT-2025-C5",
        "expiryDate": "2026-08-31",
        "quantityChange": 50,
        "unitName": "Ống",
        "purchasePrice": 115000.0,
        "totalLineValue": 5750000.0,
        "binLocation": "Tủ lạnh C - Ngăn 3",
        "currentStock": 85
      }
    ],
    "warnings": []
  }
}
```

### Response Structure (Export Transaction)

**Status Code:** `200 OK`

```json
{
  "code": 200,
  "message": "Lấy chi tiết giao dịch thành công",
  "data": {
    "transactionId": 1524,
    "transactionCode": "PX-20251127-003",
    "transactionDate": "2025-11-27T14:00:00",
    "exportType": "USAGE",
    "referenceCode": "APT-20251127-0042",
    "notes": "Xuất vật tư cho ca cấy ghép Implant",
    "createdBy": "Trần Thị B",
    "createdAt": "2025-11-27T13:45:00",
    "totalItems": 4,
    "totalValue": 3250000.0,
    "items": [
      {
        "itemCode": "MAT-001",
        "itemName": "Kim tiêm 23G",
        "batchId": 245,
        "lotNumber": "LOT-2025-A1",
        "expiryDate": "2026-12-31",
        "binLocation": "Kệ A - Tầng 2",
        "quantityChange": -5,
        "unitName": "Chiếc",
        "unitPrice": 5000.0,
        "totalLineValue": 25000.0,
        "unpackingInfo": {
          "wasUnpacked": true,
          "parentBatchId": 244,
          "parentUnitName": "Hộp",
          "remainingInBatch": 45
        },
        "notes": "Unpacked từ batch 244"
      },
      {
        "itemCode": "MED-015",
        "itemName": "Thuốc tê Lidocaine 2%",
        "batchId": 247,
        "lotNumber": "LOT-2025-C5",
        "expiryDate": "2026-08-31",
        "binLocation": "Tủ lạnh C - Ngăn 3",
        "quantityChange": -2,
        "unitName": "Ống",
        "unitPrice": 115000.0,
        "totalLineValue": 230000.0,
        "unpackingInfo": null,
        "notes": null
      },
      {
        "itemCode": "IMP-009",
        "itemName": "Implant Straumann BLX 4.0x10mm",
        "batchId": 312,
        "lotNumber": "LOT-IMP-2025-X1",
        "expiryDate": "2030-12-31",
        "binLocation": "Két sắt - Tủ Implant",
        "quantityChange": -1,
        "unitName": "Chiếc",
        "unitPrice": 2500000.0,
        "totalLineValue": 2500000.0,
        "unpackingInfo": null,
        "notes": "High-value item"
      },
      {
        "itemCode": "MAT-002",
        "itemName": "Gạc y tế vô trùng",
        "batchId": 246,
        "lotNumber": "LOT-2025-B3",
        "expiryDate": "2027-06-30",
        "binLocation": "Kệ B - Tầng 1",
        "quantityChange": -20,
        "unitName": "Gói",
        "unitPrice": 25000.0,
        "totalLineValue": 500000.0,
        "unpackingInfo": null,
        "notes": null
      }
    ],
    "warnings": []
  }
}
```

---

## 🔍 Response Fields Explanation

### Import Transaction Response

| Field             | Type       | Description                                                        |
| ----------------- | ---------- | ------------------------------------------------------------------ |
| `transactionId`   | Long       | ID duy nhất của phiếu                                              |
| `transactionCode` | String     | Mã phiếu (PN-YYYYMMDD-XXX)                                         |
| `transactionDate` | DateTime   | Ngày/giờ giao dịch                                                 |
| `supplierName`    | String     | Tên nhà cung cấp                                                   |
| `invoiceNumber`   | String     | Số hóa đơn từ NCC                                                  |
| `status`          | String     | Trạng thái: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED |
| `createdBy`       | String     | Người tạo phiếu                                                    |
| `createdAt`       | DateTime   | Thời gian tạo                                                      |
| `totalItems`      | Integer    | Tổng số dòng items                                                 |
| `totalValue`      | BigDecimal | **[VIEW_COST]** Tổng giá trị phiếu nhập                            |

#### Import Item Fields

| Field            | Type       | Description                                           |
| ---------------- | ---------- | ----------------------------------------------------- |
| `itemCode`       | String     | Mã vật tư                                             |
| `itemName`       | String     | Tên vật tư                                            |
| `batchId`        | Long       | ID của lô hàng                                        |
| `batchStatus`    | String     | CREATED (batch mới) hoặc EXISTING (cập nhật batch cũ) |
| `lotNumber`      | String     | Số lô từ nhà sản xuất                                 |
| `expiryDate`     | Date       | Hạn sử dụng                                           |
| `quantityChange` | Integer    | Số lượng nhập (dương)                                 |
| `unitName`       | String     | Đơn vị (Hộp, Ống, Vỉ, Viên...)                        |
| `purchasePrice`  | BigDecimal | **[VIEW_COST]** Giá mua đơn vị                        |
| `totalLineValue` | BigDecimal | **[VIEW_COST]** Thành tiền dòng (quantity × price)    |
| `binLocation`    | String     | Vị trí kho (Kệ A-01, Tủ lạnh B-03...)                 |
| `currentStock`   | Integer    | Số lượng hiện tại trong batch (sau khi nhập)          |

### Export Transaction Response

| Field             | Type       | Description                                           |
| ----------------- | ---------- | ----------------------------------------------------- |
| `transactionId`   | Long       | ID duy nhất của phiếu                                 |
| `transactionCode` | String     | Mã phiếu (PX-YYYYMMDD-XXX)                            |
| `transactionDate` | DateTime   | Ngày/giờ giao dịch                                    |
| `exportType`      | Enum       | USAGE (sử dụng), DISPOSAL (hủy), RETURN (trả lại NCC) |
| `referenceCode`   | String     | Mã tham chiếu (appointment code nếu liên kết ca bệnh) |
| `notes`           | String     | Ghi chú                                               |
| `createdBy`       | String     | Người tạo phiếu                                       |
| `createdAt`       | DateTime   | Thời gian tạo                                         |
| `totalItems`      | Integer    | Tổng số dòng items                                    |
| `totalValue`      | BigDecimal | **[VIEW_COST]** Tổng giá vốn (COGS)                   |

#### Export Item Fields

| Field            | Type       | Description                     |
| ---------------- | ---------- | ------------------------------- |
| `itemCode`       | String     | Mã vật tư                       |
| `itemName`       | String     | Tên vật tư                      |
| `batchId`        | Long       | ID của lô hàng được xuất        |
| `lotNumber`      | String     | Số lô                           |
| `expiryDate`     | Date       | Hạn sử dụng                     |
| `binLocation`    | String     | Vị trí kho                      |
| `quantityChange` | Integer    | Số lượng xuất (âm: -5, -10)     |
| `unitName`       | String     | Đơn vị                          |
| `unitPrice`      | BigDecimal | **[VIEW_COST]** Giá vốn đơn vị  |
| `totalLineValue` | BigDecimal | **[VIEW_COST]** Thành tiền dòng |
| `unpackingInfo`  | Object     | Thông tin unpacking (nếu có)    |
| `notes`          | String     | Ghi chú dòng                    |

#### Unpacking Info Object

| Field              | Type    | Description                                    |
| ------------------ | ------- | ---------------------------------------------- |
| `wasUnpacked`      | Boolean | Batch này có phải được tạo từ unpacking không? |
| `parentBatchId`    | Long    | ID của batch cha (hộp gốc bị xé)               |
| `parentUnitName`   | String  | Đơn vị của batch cha (VD: "Hộp")               |
| `remainingInBatch` | Integer | Số lượng còn lại trong batch sau unpacking     |

---

## 🚨 Error Responses

### 404 Not Found - Transaction không tồn tại

```json
{
  "code": 404,
  "message": "Transaction with ID 9999 not found",
  "data": null
}
```

### 403 Forbidden - Không có quyền VIEW_WAREHOUSE

```json
{
  "code": 403,
  "message": "Access Denied: You don't have VIEW_WAREHOUSE permission",
  "data": null
}
```

### 401 Unauthorized - Token không hợp lệ

```json
{
  "code": 401,
  "message": "Invalid or expired JWT token",
  "data": null
}
```

---

## 🔐 RBAC Data Masking

### User **WITHOUT** VIEW_COST permission:

**Financial fields are masked (null):**

- `totalValue` → `null`
- `purchasePrice` → `null`
- `totalLineValue` → `null`
- `unitPrice` → `null`

**Example response (without VIEW_COST):**

```json
{
  "code": 200,
  "message": "Lấy chi tiết giao dịch thành công",
  "data": {
    "transactionId": 1523,
    "transactionCode": "PN-20251127-001",
    "totalValue": null, // ← Ẩn
    "items": [
      {
        "itemCode": "MAT-001",
        "itemName": "Kim tiêm 23G",
        "quantityChange": 100,
        "purchasePrice": null, // ← Ẩn
        "totalLineValue": null, // ← Ẩn
        "currentStock": 250
      }
    ]
  }
}
```

---

## 🧪 Testing Guide

### Test Case 1: Xem chi tiết phiếu nhập (IMPORT)

**Request:**

```bash
GET /api/v1/warehouse/transactions/1523
Authorization: Bearer {WAREHOUSE_MANAGER_TOKEN}
```

**Expected Response:**

- [YES] Status: 200 OK
- [YES] Transaction type: IMPORT
- [YES] Contains: supplierName, invoiceNumber
- [YES] Items array with batch info, purchasePrice, currentStock
- [YES] totalValue hiển thị (có VIEW_COST)

---

### Test Case 2: Xem chi tiết phiếu xuất (EXPORT)

**Request:**

```bash
GET /api/v1/warehouse/transactions/1524
Authorization: Bearer {WAREHOUSE_STAFF_TOKEN}
```

**Expected Response:**

- [YES] Status: 200 OK
- [YES] Transaction type: EXPORT
- [YES] Contains: exportType, referenceCode
- [YES] Items array with quantityChange (âm)
- [YES] unpackingInfo hiển thị nếu có unpacking
- [YES] totalValue = null (không có VIEW_COST)

---

### Test Case 3: Xem phiếu không tồn tại

**Request:**

```bash
GET /api/v1/warehouse/transactions/99999
Authorization: Bearer {ADMIN_TOKEN}
```

**Expected Response:**

- [YES] Status: 404 Not Found
- [YES] Message: "Transaction with ID 99999 not found"

---

### Test Case 4: Không có quyền VIEW_WAREHOUSE

**Request:**

```bash
GET /api/v1/warehouse/transactions/1523
Authorization: Bearer {PATIENT_TOKEN}
```

**Expected Response:**

- [YES] Status: 403 Forbidden
- [YES] Message: "Access Denied"

---

## 🔄 Integration with Other APIs

### Flow: List → Detail

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API66 as API 6.6 (List)
    participant API67 as API 6.7 (Detail)
    participant DB as Database

    FE->>API66: GET /transactions?page=0&size=20
    API66->>DB: Query with filters
    DB-->>API66: Paginated list
    API66-->>FE: TransactionHistoryResponse (summary)

    Note over FE: User clicks on a transaction

    FE->>API67: GET /transactions/{id}
    API67->>DB: Query transaction + items + batches
    DB-->>API67: Full transaction data
    API67-->>FE: ImportTransactionResponse (detail)

    Note over FE: Display full details with items
```

---

## 📊 Performance Considerations

### Query Optimization:

1. **Lazy Loading:** Sử dụng `@ManyToOne(fetch = FetchType.LAZY)` cho relations
2. **Join Fetch:** Load transaction + items + batches trong 1 query
3. **Index:** transaction_id, batch_id, item_code

### Caching:

- [NO] Không cache (data thay đổi thường xuyên)
- [YES] Sử dụng database index để tăng tốc query

### Expected Response Time:

- **Best case:** 50-100ms (transaction có ít items)
- **Average:** 150-300ms (transaction có 10-20 items)
- **Worst case:** 500ms+ (transaction có > 50 items hoặc nhiều unpacking)

---

## 🎨 Frontend Implementation Example

### React/TypeScript Example

```typescript
// API Service
export const getTransactionDetail = async (
  id: number
): Promise<TransactionDetail> => {
  const response = await api.get(`/api/v1/warehouse/transactions/${id}`);
  return response.data.data;
};

// Component
const TransactionDetailPage = () => {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getTransactionDetail(Number(id));
        setTransaction(data);
      } catch (error) {
        notification.error({ message: "Không thể tải chi tiết phiếu" });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <Spin />;
  if (!transaction) return <Empty />;

  return (
    <Card title={`Phiếu ${transaction.transactionCode}`}>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Ngày giao dịch">
          {moment(transaction.transactionDate).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={getStatusColor(transaction.status)}>
            {transaction.status}
          </Tag>
        </Descriptions.Item>
        {transaction.supplierName && (
          <Descriptions.Item label="Nhà cung cấp">
            {transaction.supplierName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Người tạo">
          {transaction.createdBy}
        </Descriptions.Item>
        {transaction.totalValue && (
          <Descriptions.Item label="Tổng giá trị" span={2}>
            {formatCurrency(transaction.totalValue)}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Table
        dataSource={transaction.items}
        columns={[
          { title: "Mã vật tư", dataIndex: "itemCode" },
          { title: "Tên vật tư", dataIndex: "itemName" },
          { title: "Số lô", dataIndex: "lotNumber" },
          { title: "HSD", dataIndex: "expiryDate", render: formatDate },
          { title: "Số lượng", dataIndex: "quantityChange" },
          { title: "Đơn vị", dataIndex: "unitName" },
          {
            title: "Giá đơn vị",
            dataIndex: "purchasePrice",
            render: (price) => (price ? formatCurrency(price) : "-"),
          },
          {
            title: "Thành tiền",
            dataIndex: "totalLineValue",
            render: (value) => (value ? formatCurrency(value) : "-"),
          },
        ]}
        pagination={false}
      />
    </Card>
  );
};
```

---

## 📝 Notes

### Design Decisions:

1. **Reuse Response DTOs:** Sử dụng lại `ImportTransactionResponse` và `ExportTransactionResponse` từ API 6.4 và 6.5 để đảm bảo consistency

2. **Dynamic Response Type:** Return type là `Object` vì phụ thuộc vào transaction type (IMPORT/EXPORT/ADJUSTMENT)

3. **RBAC at Service Layer:** Data masking được thực hiện trong service, không phải controller

4. **No Warnings/Unpacking Details:** Khác với API 6.4/6.5 (create), API 6.7 (view) không tính toán warnings mới hoặc unpacking details - chỉ hiển thị data đã lưu

### Future Enhancements:

- [ ] Add approval history timeline
- [ ] Add related documents (PDF invoice, images)
- [ ] Add audit log (who viewed, when)
- [ ] Add print/export to PDF functionality
- [ ] Add comparison with original quotation

---

## 🔗 Related APIs

- **API 6.4** - Import Transaction (Create) - Tạo phiếu nhập mới
- **API 6.5** - Export Transaction (Create) - Tạo phiếu xuất mới
- **API 6.6** - Transaction History (List) - Danh sách phiếu với pagination
- **API 6.2** - Item Batches Detail - Xem chi tiết lô hàng của 1 vật tư

---

## [YES] Implementation Checklist

- [x] Controller endpoint created
- [x] Service method implemented
- [x] RBAC permission check
- [x] Data masking for VIEW_COST
- [x] Error handling (404, 403, 401)
- [x] Swagger documentation
- [x] Logging with emojis
- [x] Maven compilation successful
- [x] Integration with existing DTOs
- [x] Documentation created

---

**Last Updated:** November 27, 2025
**Author:** Backend Team
**Reviewed By:** Technical Lead
