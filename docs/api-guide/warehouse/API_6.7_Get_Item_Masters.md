# API 6.7: Get Item Masters

## Overview

API trả về danh sách vật tư (Item Masters) trong hệ thống với hỗ trợ tìm kiếm, lọc theo nhóm, loại kho và trạng thái tồn kho.

## Endpoint

```
GET /api/v3/warehouse/items
```

## Authorization

Required permissions:
- `VIEW_ITEMS` (Bác sĩ, Lễ tân)
- `VIEW_WAREHOUSE` (Thủ kho)
- `MANAGE_WAREHOUSE` (Quản lý kho)
- `ROLE_ADMIN`

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | Integer | No | 0 | Số trang |
| size | Integer | No | 20 | Số bản ghi mỗi trang |
| search | String | No | - | Tìm kiếm theo tên hoặc mã vật tư |
| categoryId | Long | No | - | Lọc theo nhóm vật tư |
| warehouseType | Enum | No | - | COLD hoặc NORMAL |
| stockStatus | Enum | No | - | OUT_OF_STOCK, LOW_STOCK, NORMAL, OVERSTOCK |
| isActive | Boolean | No | - | true (đang kinh doanh), false (ngừng kinh doanh) |
| sortBy | String | No | itemName | Trường sắp xếp |
| sortDir | String | No | asc | asc hoặc desc |

### Stock Status Values

- `OUT_OF_STOCK`: Số lượng = 0
- `LOW_STOCK`: Số lượng < minStockLevel
- `NORMAL`: minStockLevel <= số lượng <= maxStockLevel
- `OVERSTOCK`: Số lượng > maxStockLevel

## Response Format

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Item masters retrieved successfully",
  "data": {
    "meta": {
      "page": 0,
      "size": 20,
      "totalPages": 5,
      "totalElements": 98
    },
    "content": [
      {
        "itemMasterId": 24,
        "itemCode": "DP-AMOX-500",
        "itemName": "Amoxicillin 500mg",
        "description": "Thuốc kháng sinh nhóm Penicillin",
        "categoryName": "Thuốc Kháng sinh",
        "warehouseType": "COLD",
        "isActive": true,
        "baseUnitName": "Viên",
        "minStockLevel": 100,
        "maxStockLevel": 1000,
        "totalQuantity": 450,
        "stockStatus": "NORMAL",
        "lastImportDate": "2025-11-20T08:30:00",
        "createdAt": "2025-01-15T10:00:00",
        "updatedAt": "2025-11-25T14:30:00"
      },
      {
        "itemMasterId": 30,
        "itemCode": "VT-GANG-TAY-M",
        "itemName": "Găng tay y tế Size M",
        "description": "Hộp 50 đôi không bột",
        "categoryName": "Vật tư tiêu hao",
        "warehouseType": "NORMAL",
        "isActive": true,
        "baseUnitName": "Đôi",
        "minStockLevel": 50,
        "maxStockLevel": 500,
        "totalQuantity": 10,
        "stockStatus": "LOW_STOCK",
        "lastImportDate": "2025-10-01T10:00:00",
        "createdAt": "2025-01-10T09:00:00",
        "updatedAt": "2025-11-20T11:00:00"
      }
    ]
  }
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid stockStatus value",
  "data": null
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied",
  "data": null
}
```

## Use Cases

### 1. Tìm kiếm nhanh vật tư

Lễ tân cần tra cứu thuốc giảm đau:

```
GET /api/v3/warehouse/items?search=Panadol
```

### 2. Lọc hàng sắp hết (Re-order Report)

Thủ kho lên danh sách nhập hàng:

```
GET /api/v3/warehouse/items?stockStatus=LOW_STOCK
```

### 3. Quản lý danh mục

Admin xem các mặt hàng ngừng kinh doanh:

```
GET /api/v3/warehouse/items?isActive=false
```

### 4. Lọc theo loại kho

Xem tất cả vật tư cần bảo quản lạnh:

```
GET /api/v3/warehouse/items?warehouseType=COLD
```

### 5. Lọc theo nhóm vật tư

Xem tất cả thuốc:

```
GET /api/v3/warehouse/items?categoryId=2
```

## Test Cases

### Test Case 1: Get All Items (Default)

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Returns first 20 items
- Default sort by itemName asc

### Test Case 2: Search by Name

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?search=gang%20tay" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Returns items with "gang tay" in name or code

### Test Case 3: Filter by Stock Status

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?stockStatus=LOW_STOCK" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Returns only items where totalQuantity < minStockLevel

### Test Case 4: Filter by Category

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?categoryId=1" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Returns items from category ID 1

### Test Case 5: Pagination

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?page=1&size=10" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Returns page 1 (second page) with 10 items

### Test Case 6: Sort by Quantity Desc

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?sortBy=cachedTotalQuantity&sortDir=desc" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Items sorted by quantity descending

### Test Case 7: Multiple Filters

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?warehouseType=COLD&stockStatus=NORMAL&isActive=true" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Returns active cold storage items with normal stock levels

### Test Case 8: Unauthorized Access (No Token)

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items"
```

**Expected:**
- Status: 401 Unauthorized

### Test Case 9: Forbidden Access (Patient Role)

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items" \
  -H "Authorization: Bearer {patient_token}"
```

**Expected:**
- Status: 403 Forbidden

### Test Case 10: Empty Results

**Request:**
```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/items?search=nonexistent123" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Status: 200 OK
- Empty content array
- totalElements: 0

## Performance Notes

### Optimization Strategy: Denormalization

API này sử dụng cột cache (`cached_total_quantity`) để tránh JOIN/SUM trên bảng `item_batches` mỗi lần query.

**Cache columns:**
- `cached_total_quantity`: Tổng số lượng tồn kho
- `cached_last_import_date`: Ngày nhập cuối cùng
- `cached_last_updated`: Timestamp cập nhật cache

**Cache update:**
- Cache được cập nhật tự động khi có giao dịch nhập/xuất kho
- Method: `ItemMaster.updateCachedQuantity(int delta)`

### Query Performance

- Không cần JOIN với `item_batches`
- Index trên `cached_total_quantity`, `min_stock_level`, `max_stock_level`
- Response time < 200ms với 10,000+ items

## Implementation Details

### Entity: ItemMaster.java

```java
@Column(name = "cached_total_quantity")
private Integer cachedTotalQuantity = 0;

@Column(name = "cached_last_import_date")
private LocalDateTime cachedLastImportDate;

@Column(name = "cached_last_updated")
private LocalDateTime cachedLastUpdated;

public void updateCachedQuantity(int delta) {
    this.cachedTotalQuantity = (this.cachedTotalQuantity == null ? 0 : this.cachedTotalQuantity) + delta;
    this.cachedLastUpdated = LocalDateTime.now();
}

@Transient
public StockStatus getStockStatus() {
    if (cachedTotalQuantity == null || cachedTotalQuantity == 0) {
        return StockStatus.OUT_OF_STOCK;
    }
    if (minStockLevel != null && cachedTotalQuantity < minStockLevel) {
        return StockStatus.LOW_STOCK;
    }
    if (maxStockLevel != null && cachedTotalQuantity > maxStockLevel) {
        return StockStatus.OVERSTOCK;
    }
    return StockStatus.NORMAL;
}
```

### Specification: ItemMasterSpecification.java

Sử dụng JPA Specification để build dynamic query:

```java
Specification<ItemMaster> spec = Specification
    .where(ItemMasterSpecification.hasSearch(filter.getSearch()))
    .and(ItemMasterSpecification.hasCategoryId(filter.getCategoryId()))
    .and(ItemMasterSpecification.hasWarehouseType(filter.getWarehouseType()))
    .and(ItemMasterSpecification.hasStockStatus(filter.getStockStatus()))
    .and(ItemMasterSpecification.isActive(filter.getIsActive()));
```

## Related APIs

- **API 6.1**: Inventory Summary Report (với aggregation)
- **API 6.4**: Import Transaction (cập nhật cache +quantity)
- **API 6.5**: Export Transaction (cập nhật cache -quantity)
- **API 6.6**: Transaction History

## Changelog

### V23 (2025-11-25)

- Initial release
- Denormalization optimization with cache columns
- Support for advanced filtering
- RBAC with VIEW_ITEMS permission for Doctor/Receptionist
