# Service Category Management API (V17)

## Overview

Service Category module quản lý nhóm dịch vụ nha khoa. Mỗi category là 1 nhóm dịch vụ (VD: "A. General Dentistry", "B. Cosmetic & Restoration") giúp tổ chức menu giá dễ xem hơn.

**New in V17:**

- Thêm table `service_categories` để group services
- Soft delete (isActive flag) thay vì hard delete
- Display ordering cho drag-drop UX
- Bulk reorder endpoint
- Validation: không xóa category có services đang active

## Database Schema

```sql
CREATE TABLE service_categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

## Business Rules

1. **Unique Category Code**: Mã category không được trùng (VD: "GEN", "COS", "ORTH")
2. **No Delete with Active Services**: Không thể xóa category nếu còn services active
3. **Soft Delete Only**: Dùng `isActive=false` thay vì DELETE
4. **Display Order**: Số càng nhỏ hiện trước, cho phép reorder nhiều categories 1 lúc

---

## API 6.x.1: List All Categories

**Endpoint:** `GET /api/v1/service-categories`

**Permission:** `VIEW_SERVICE`

**Description:** Lấy tất cả categories (bao gồm cả inactive) để admin quản lý

### Request

```http
GET /api/v1/service-categories
Authorization: Bearer <token>
```

### Response 200 OK

```json
[
  {
    "categoryId": 1,
    "categoryCode": "GEN",
    "categoryName": "A. General Dentistry",
    "displayOrder": 0,
    "description": "Basic dental care services",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00",
    "updatedAt": "2024-01-15T10:00:00"
  },
  {
    "categoryId": 2,
    "categoryCode": "COS",
    "categoryName": "B. Cosmetic & Restoration",
    "displayOrder": 1,
    "description": null,
    "isActive": true,
    "createdAt": "2024-01-15T10:05:00",
    "updatedAt": "2024-01-15T10:05:00"
  }
]
```

### Error Responses

- **403 Forbidden**: User không có quyền VIEW_SERVICE

---

## API 6.x.2: Get Category by ID

**Endpoint:** `GET /api/v1/service-categories/{categoryId}`

**Permission:** `VIEW_SERVICE`

### Request

```http
GET /api/v1/service-categories/1
Authorization: Bearer <token>
```

### Response 200 OK

```json
{
  "categoryId": 1,
  "categoryCode": "GEN",
  "categoryName": "A. General Dentistry",
  "displayOrder": 0,
  "description": "Basic dental care services",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00",
  "updatedAt": "2024-01-15T10:00:00"
}
```

### Error Responses

- **404 Not Found**: Category không tồn tại
- **403 Forbidden**: Không có quyền

---

## API 6.x.3: Create Category

**Endpoint:** `POST /api/v1/service-categories`

**Permission:** `CREATE_SERVICE`

### Request

```http
POST /api/v1/service-categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryCode": "ORTH",
  "categoryName": "C. Orthodontics",
  "displayOrder": 2,
  "description": "Braces and alignment services"
}
```

### Validation Rules

- `categoryCode`: Required, max 50 chars, unique
- `categoryName`: Required, max 255 chars
- `displayOrder`: Required, min 0
- `description`: Optional, max 1000 chars

### Response 201 Created

```json
{
  "categoryId": 3,
  "categoryCode": "ORTH",
  "categoryName": "C. Orthodontics",
  "displayOrder": 2,
  "description": "Braces and alignment services",
  "isActive": true,
  "createdAt": "2024-01-15T11:00:00",
  "updatedAt": "2024-01-15T11:00:00"
}
```

### Error Responses

- **400 Bad Request**: Validation failed (missing fields, invalid format)
- **409 Conflict**: Category code đã tồn tại
- **403 Forbidden**: Không có quyền CREATE_SERVICE

---

## API 6.x.4: Update Category

**Endpoint:** `PATCH /api/v1/service-categories/{categoryId}`

**Permission:** `UPDATE_SERVICE`

**Description:** Partial update (chỉ gửi fields cần thay đổi)

### Request

```http
PATCH /api/v1/service-categories/3
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryName": "C. Orthodontics & Braces",
  "description": "Updated description"
}
```

### Response 200 OK

```json
{
  "categoryId": 3,
  "categoryCode": "ORTH",
  "categoryName": "C. Orthodontics & Braces",
  "displayOrder": 2,
  "description": "Updated description",
  "isActive": true,
  "createdAt": "2024-01-15T11:00:00",
  "updatedAt": "2024-01-15T12:00:00"
}
```

### Error Responses

- **400 Bad Request**: Validation failed
- **404 Not Found**: Category không tồn tại
- **409 Conflict**: Category code mới đã bị trùng
- **403 Forbidden**: Không có quyền

---

## API 6.x.5: Delete Category (Soft Delete)

**Endpoint:** `DELETE /api/v1/service-categories/{categoryId}`

**Permission:** `DELETE_SERVICE`

**Description:** Soft delete (set `isActive=false`). Chỉ xóa được nếu không có active services

### Request

```http
DELETE /api/v1/service-categories/3
Authorization: Bearer <token>
```

### Response 204 No Content

(Empty body)

### Error Responses

- **404 Not Found**: Category không tồn tại
- **409 Conflict**: Category có services đang active, không thể xóa
  ```json
  {
    "type": "/business-error",
    "title": "Business Rule Violation",
    "status": 409,
    "detail": "Cannot delete category with 5 active service(s). Please deactivate or reassign services first.",
    "errorCode": "BUSINESS_RULE_VIOLATION"
  }
  ```
- **403 Forbidden**: Không có quyền

---

## API 6.x.6: Reorder Categories

**Endpoint:** `POST /api/v1/service-categories/reorder`

**Permission:** `UPDATE_SERVICE`

**Description:** Bulk update displayOrder cho nhiều categories (drag-drop UX)

### Request

```http
POST /api/v1/service-categories/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "orders": [
    {"categoryId": 2, "displayOrder": 0},
    {"categoryId": 1, "displayOrder": 1},
    {"categoryId": 3, "displayOrder": 2}
  ]
}
```

### Response 204 No Content

(Empty body)

### Error Responses

- **400 Bad Request**: Invalid request (missing fields, invalid order)
- **404 Not Found**: Một trong các categoryId không tồn tại
- **403 Forbidden**: Không có quyền

---

## Test Cases

### TC1: Create Category Success

```bash
POST /api/v1/service-categories
{
  "categoryCode": "SURG",
  "categoryName": "D. Oral Surgery",
  "displayOrder": 3,
  "description": "Surgical procedures"
}

Expected: 201 Created + category object
```

### TC2: Create Duplicate Code

```bash
POST /api/v1/service-categories
{
  "categoryCode": "GEN",  # Already exists
  "categoryName": "Another General",
  "displayOrder": 5
}

Expected: 409 Conflict
```

### TC3: Delete Category with Active Services

```bash
# Assume category 1 has 3 active services
DELETE /api/v1/service-categories/1

Expected: 409 Conflict with error message about active services
```

### TC4: Reorder Categories

```bash
POST /api/v1/service-categories/reorder
{
  "orders": [
    {"categoryId": 3, "displayOrder": 0},
    {"categoryId": 1, "displayOrder": 1},
    {"categoryId": 2, "displayOrder": 2}
  ]
}

Expected: 204 No Content
Verify: GET /api/v1/service-categories shows new order
```

### TC5: Update Category Name

```bash
PATCH /api/v1/service-categories/2
{
  "categoryName": "B. Cosmetic Dentistry"
}

Expected: 200 OK with updated name
```

---

## Integration Notes

### Used By

- **Service Management Module**: Services have FK `category_id` linking to categories
- **Public Price List**: Grouped display by category
- **Booking UI**: Category selection for service filtering

### Database Relationships

```
service_categories (1) ----< (N) services
                           (FK: category_id)
```

### Soft Delete Cascade Rules

- Khi `category.isActive = false`:
  - Category vẫn tồn tại trong DB
  - Services có thể vẫn active (không bị ảnh hưởng)
  - Public API sẽ không hiển thị category này

---

## Migration Guide (V16 → V17)

1. **Run schema.sql V17** to create `service_categories` table
2. **Add seed data** (optional):
   ```sql
   INSERT INTO service_categories (category_code, category_name, display_order, is_active, created_at, updated_at)
   VALUES
     ('GEN', 'A. General Dentistry', 0, TRUE, NOW(), NOW()),
     ('COS', 'B. Cosmetic & Restoration', 1, TRUE, NOW(), NOW()),
     ('ORTH', 'C. Orthodontics', 2, TRUE, NOW(), NOW());
   ```
3. **Update services** to link to categories:
   ```sql
   UPDATE services SET category_id = 1 WHERE service_code IN ('CHK', 'CLN', 'FLU');
   UPDATE services SET category_id = 2 WHERE service_code IN ('WHT', 'VNR', 'FIL');
   ```

---

## OpenAPI/Swagger

All endpoints are documented with `@Operation` annotations. Access Swagger UI at:

```
http://localhost:8080/swagger-ui.html
```

Filter by tag: **Service Categories**
