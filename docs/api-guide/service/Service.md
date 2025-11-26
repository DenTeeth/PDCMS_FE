# Dental Service Management API (V17)

## Overview

Service module quản lý các dịch vụ nha khoa (khám, chữa răng, tẩy trắng, niềng răng, v.v.).

**V17 Updates:**

- Added `category_id` FK to group services
- Added `display_order` for UI ordering
- 3 API variants: Public (no auth), Internal (with auth), Admin (full CRUD)
- JOIN FETCH optimization to avoid N+1 query problem

## Database Schema

```sql
-- V17: Added category_id and display_order
CREATE TABLE services (
    service_id BIGSERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    duration_minutes INTEGER,
    category_id BIGINT REFERENCES service_categories(category_id),  -- V17
    display_order INTEGER NOT NULL DEFAULT 0,                        -- V17
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE INDEX idx_services_category ON services(category_id);
```

## Business Rules

1. **Unique Service Code**: Mã dịch vụ không trùng (VD: "CHK", "CLN", "WHT")
2. **Price Required**: Giá phải > 0
3. **Duration Optional**: Thời gian (phút) dùng cho booking (có thể null)
4. **Soft Delete Only**: Dùng `isActive=false` (lịch hẹn cũ vẫn tham chiếu được)
5. **Category Optional**: Service có thể không thuộc category nào (NULL)

---

## API 6.1: Public Grouped Services (NO AUTH)

**Endpoint:** `GET /api/v1/public/services/grouped`

**Permission:** None (public access)

**Description:** Hiển thị bảng giá dịch vụ cho khách (chỉ tên + giá). Services được group theo category.

### Use Cases

- Trang web clinic hiển thị bảng giá công khai
- Khách hàng xem giá trước khi đặt lịch
- SEO-friendly price list

### Request

```http
GET /api/v1/public/services/grouped
```

### Response 200 OK

```json
[
  {
    "category": {
      "categoryName": "A. General Dentistry"
    },
    "services": [
      {
        "serviceName": "General Checkup",
        "price": 100000.0
      },
      {
        "serviceName": "Dental Cleaning",
        "price": 150000.0
      }
    ]
  },
  {
    "category": {
      "categoryName": "B. Cosmetic & Restoration"
    },
    "services": [
      {
        "serviceName": "Teeth Whitening",
        "price": 2000000.0
      },
      {
        "serviceName": "Dental Veneer",
        "price": 5000000.0
      }
    ]
  }
]
```

### Notes

- **No authentication required**
- Only active services from active categories
- Minimal data (tên + giá) - không lộ service_id, duration
- Optimized with JOIN FETCH (1 query cho cả services + categories)

---

## API 6.2: Internal Grouped Services (AUTH REQUIRED)

**Endpoint:** `GET /api/v1/services/grouped`

**Permission:** `VIEW_SERVICE`

**Description:** Hiển thị services có thêm technical fields (id, code, duration) cho staff booking

### Use Cases

- Booking form: Staff chọn services cho appointment
- Tính toán thời gian hẹn (dựa trên duration)
- Internal operations

### Request

```http
GET /api/v1/services/grouped
Authorization: Bearer <token>
```

### Response 200 OK

```json
[
  {
    "category": {
      "categoryId": 1,
      "categoryCode": "GEN",
      "categoryName": "A. General Dentistry",
      "displayOrder": 0
    },
    "services": [
      {
        "serviceId": 101,
        "serviceCode": "CHK",
        "serviceName": "General Checkup",
        "price": 100000.0,
        "durationMinutes": 30
      },
      {
        "serviceId": 102,
        "serviceCode": "CLN",
        "serviceName": "Dental Cleaning",
        "price": 150000.0,
        "durationMinutes": 45
      }
    ]
  },
  {
    "category": {
      "categoryId": 2,
      "categoryCode": "COS",
      "categoryName": "B. Cosmetic & Restoration",
      "displayOrder": 1
    },
    "services": [
      {
        "serviceId": 201,
        "serviceCode": "WHT",
        "serviceName": "Teeth Whitening",
        "price": 2000000.0,
        "durationMinutes": 90
      }
    ]
  }
]
```

### Error Responses

- **403 Forbidden**: User không có quyền VIEW_SERVICE

### Booking Integration Example

```javascript
// Frontend: Tính tổng thời gian appointment
const selectedServices = [101, 102]; // serviceId
const totalDuration = services
  .flatMap((cat) => cat.services)
  .filter((s) => selectedServices.includes(s.serviceId))
  .reduce((sum, s) => sum + s.durationMinutes, 0);
// Result: 30 + 45 = 75 minutes
```

---

## API 6.3: Admin Services List (FLAT with Filters)

**Endpoint:** `GET /api/v1/services`

**Permission:** `VIEW_SERVICE`

**Description:** Admin quản lý services với search, filter, pagination

### Request Parameters

| Param        | Type     | Required | Description                        |
| ------------ | -------- | -------- | ---------------------------------- |
| `categoryId` | Long     | No       | Filter by category                 |
| `isActive`   | Boolean  | No       | Filter by active status            |
| `search`     | String   | No       | Search by name or code (LIKE)      |
| `page`       | int      | No       | Page number (default: 0)           |
| `size`       | int      | No       | Page size (default: 20)            |
| `sortBy`     | String   | No       | Sort field (default: displayOrder) |
| `direction`  | ASC/DESC | No       | Sort direction (default: ASC)      |

### Request Examples

**Example 1: Get all services (paginated)**

```http
GET /api/v1/services?page=0&size=10
Authorization: Bearer <token>
```

**Example 2: Search by keyword**

```http
GET /api/v1/services?search=whitening
```

**Example 3: Filter by category + active status**

```http
GET /api/v1/services?categoryId=2&isActive=true
```

**Example 4: Sort by price descending**

```http
GET /api/v1/services?sortBy=price&direction=DESC
```

### Response 200 OK

```json
{
  "content": [
    {
      "serviceId": 101,
      "serviceCode": "CHK",
      "serviceName": "General Checkup",
      "description": "Basic dental examination",
      "price": 100000.0,
      "durationMinutes": 30,
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00",
      "updatedAt": "2024-01-15T10:00:00",
      "category": {
        "categoryId": 1,
        "categoryCode": "GEN",
        "categoryName": "A. General Dentistry",
        "displayOrder": 0
      }
    },
    {
      "serviceId": 102,
      "serviceCode": "CLN",
      "serviceName": "Dental Cleaning",
      "description": "Professional teeth cleaning",
      "price": 150000.0,
      "durationMinutes": 45,
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:05:00",
      "updatedAt": "2024-01-15T10:05:00",
      "category": {
        "categoryId": 1,
        "categoryCode": "GEN",
        "categoryName": "A. General Dentistry",
        "displayOrder": 0
      }
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 25,
  "totalPages": 2,
  "last": false,
  "size": 20,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "numberOfElements": 20,
  "first": true,
  "empty": false
}
```

### Error Responses

- **403 Forbidden**: User không có quyền VIEW_SERVICE

---

## Performance Optimization

### N+1 Query Problem (FIXED in V17)

**Before V17:**

```sql
-- Bad: 1 query for services + N queries for categories
SELECT * FROM services WHERE is_active = true;  -- 1 query
-- Then for each service:
SELECT * FROM service_categories WHERE category_id = ?;  -- N queries
```

**V17 Solution:**

```java
@Query("SELECT s FROM DentalService s " +
       "LEFT JOIN FETCH s.category c " +  // JOIN FETCH!
       "WHERE s.isActive = true")
List<DentalService> findAllActiveServicesWithCategory();
```

Result: **1 query only** (services + categories joined)

---

## Test Cases

### TC1: Public API - No Auth Required

```bash
curl http://localhost:8080/api/v1/public/services/grouped

Expected: 200 OK with grouped services (name + price only)
No need Authorization header
```

### TC2: Internal API - Requires Auth

```bash
curl http://localhost:8080/api/v1/services/grouped

Expected: 403 Forbidden (no token)

curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/v1/services/grouped

Expected: 200 OK with full service data (id, code, duration)
```

### TC3: Admin Search by Keyword

```bash
GET /api/v1/services?search=cleaning

Expected: Returns all services with "cleaning" in name or code
```

### TC4: Admin Filter by Category

```bash
GET /api/v1/services?categoryId=1&isActive=true

Expected: Only active services from category 1
```

### TC5: Admin Pagination

```bash
GET /api/v1/services?page=0&size=5
GET /api/v1/services?page=1&size=5

Expected: First 5 services, then next 5 services
```

---

## Service CRUD APIs (TODO - Not in V17 Scope)

**Note:** V17 chỉ implement READ operations (3 GET endpoints). CREATE/UPDATE/DELETE services sẽ được thêm sau.

**Planned APIs:**

- `POST /api/v1/services` - Create service
- `PATCH /api/v1/services/{code}` - Update service
- `PATCH /api/v1/services/{code}/status` - Soft delete (set isActive)
- `POST /api/v1/services/reorder` - Bulk reorder within category

---

## Integration with Appointments

### Appointment → Service Relationship

```sql
-- appointment_services table (many-to-many)
CREATE TABLE appointment_services (
    appointment_service_id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT REFERENCES appointments(appointment_id),
    service_id BIGINT REFERENCES services(service_id),  -- FK to services
    service_price NUMERIC(10,2) NOT NULL,  -- Snapshot price at booking time
    created_at TIMESTAMP NOT NULL
);
```

### Why Soft Delete?

```sql
-- Old appointment still references service
SELECT a.appointment_id, s.service_name
FROM appointments a
JOIN appointment_services aps ON a.appointment_id = aps.appointment_id
JOIN services s ON aps.service_id = s.service_id
WHERE a.appointment_date = '2023-01-15';

-- Result: Works even if service.is_active = false
-- Hard delete would break referential integrity!
```

---

## Migration Guide (V16 → V17)

### Step 1: Backup Data

```sql
-- Backup existing services
CREATE TABLE services_backup AS SELECT * FROM services;
```

### Step 2: Run Schema V17

```bash
psql -d dentalclinic -f src/main/resources/db/schema.sql
```

### Step 3: Link Services to Categories (Optional)

```sql
-- Update existing services with category_id
UPDATE services SET category_id = 1, display_order = 0 WHERE service_code = 'CHK';
UPDATE services SET category_id = 1, display_order = 1 WHERE service_code = 'CLN';
UPDATE services SET category_id = 2, display_order = 0 WHERE service_code = 'WHT';
-- ... etc
```

### Step 4: Verify

```sql
-- Check all services have valid category links
SELECT s.service_id, s.service_code, c.category_name
FROM services s
LEFT JOIN service_categories c ON s.category_id = c.category_id;
```

---

## OpenAPI/Swagger

Access Swagger UI at:

```
http://localhost:8080/swagger-ui.html
```

Filter by tag: **Dental Services**

---

## Treatment Plan Integration ⭐ NEW

### Overview

Starting from V2, services are integrated with **Treatment Plan Module** for long-term treatment workflows (niềng răng, cấy ghép implant, bọc răng sứ).

**New Table:** `template_phase_services`

```sql
CREATE TABLE template_phase_services (
    template_phase_id BIGINT REFERENCES template_phases(phase_id),
    service_id BIGINT REFERENCES services(service_id),
    sequence_number INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,  -- Số lần thực hiện service (e.g., 24 lần siết niềng)
    PRIMARY KEY (template_phase_id, service_id, sequence_number)
);
```

### Use Cases

**1. Orthodontics (Niềng răng 2 năm)**

- Template: `TPL_ORTHO_METAL`
- Phase 3: "Giai đoạn điều trị"
- Service: `ORTHO_ADJUST` (Siết niềng)
- **Quantity: 24** (1 lần/tháng × 24 tháng)

**Example Data:**

```sql
INSERT INTO template_phase_services (template_phase_id, service_id, sequence_number, quantity) VALUES
(3, (SELECT service_id FROM services WHERE service_code = 'ORTHO_ADJUST'), 1, 24);
```

This generates 24 patient plan items:

- Item 305: "Lần 1/24: Siết niềng"
- Item 306: "Lần 2/24: Siết niềng"
- ...
- Item 328: "Lần 24/24: Siết niềng"

**2. Dental Implant (Cấy ghép)**

- Template: `TPL_IMPLANT_OSSTEM`
- Phase 2: "Cấy ghép Implant"
- Service: `IMP_SURGERY` (Phẫu thuật cấy ghép)
- **Quantity: 1** (1 lần duy nhất)

### Business Rules

**1. Service Duration Affects Templates**
If you change `services.duration_minutes`:

```sql
UPDATE services SET duration_minutes = 45 WHERE service_code = 'ORTHO_ADJUST';  -- Changed from 30 to 45
```

→ All future appointments booked from treatment plans will use NEW duration (45 minutes)
→ Existing appointments NOT affected (duration locked when created)

**2. Service Deletion Restrictions**
Services used in **active templates** should NOT be deleted:

```sql
-- Check before deletion
SELECT tp.template_code, tp.template_name, COUNT(*) as usage_count
FROM template_phase_services tps
JOIN template_phases ph ON tps.template_phase_id = ph.phase_id
JOIN treatment_plan_templates tp ON ph.template_id = tp.template_id
WHERE tps.service_id = :serviceId
  AND tp.is_active = TRUE
GROUP BY tp.template_id;
```

If used → Return 400 Bad Request:

```json
{
  "errorCode": "SERVICE_IN_USE_BY_TEMPLATES",
  "message": "Cannot delete service ORTHO_ADJUST. Used in 2 active templates: TPL_ORTHO_METAL, TPL_ORTHO_CERAMIC"
}
```

**3. Price Changes**
Changing `services.price` affects:

-  **New treatment plans**: Use updated price
-  **Existing patient plans**: Use price locked when plan created (stored in `patient_plan_items.price`)

**4. Service Deactivation**
Setting `is_active = FALSE`:

-  Cannot be added to NEW templates
-  Existing templates still valid (historical data)
-  Existing patient plans continue using service
- ️ UI should show warning: "Service inactive but required by treatment plan"

### Integration Flow

```
1. Admin creates Treatment Plan Template
   POST /api/v1/treatment-plan-templates
   {
     "templateCode": "TPL_ORTHO_METAL",
     "phases": [
       {
         "services": [
           { "serviceCode": "ORTHO_ADJUST", "quantity": 24 }  ← Links to services table
         ]
       }
     ]
   }

2. Doctor assigns template to patient
   POST /api/v1/patient-treatment-plans
   {
     "patientCode": "BN-1001",
     "templateCode": "TPL_ORTHO_METAL"
   }
   → System generates 24 patient_plan_items (each linked to service ORTHO_ADJUST)

3. Receptionist books appointment from plan
   POST /api/v1/appointments
   {
     "patientCode": "BN-1001",
     "patientPlanItemIds": [307, 308]  ← Items 307, 308 both reference ORTHO_ADJUST service
   }
   → System extracts service_id from items
   → Creates appointment with ORTHO_ADJUST (duration from services table)
   → Updates items status: READY_FOR_BOOKING → SCHEDULED
```

### Query Examples

**Find all templates using a service:**

```sql
SELECT
    tp.template_code,
    tp.template_name,
    ph.phase_name,
    s.service_name,
    tps.quantity
FROM template_phase_services tps
JOIN template_phases ph ON tps.template_phase_id = ph.phase_id
JOIN treatment_plan_templates tp ON ph.template_id = tp.template_id
JOIN services s ON tps.service_id = s.service_id
WHERE s.service_code = 'ORTHO_ADJUST';

-- Result:
-- TPL_ORTHO_METAL | Niềng răng kim loại 2 năm | Giai đoạn điều trị | Tái khám Chỉnh nha / Siết niềng | 24
-- TPL_ORTHO_CERAMIC | Niềng răng sứ 2 năm | Giai đoạn điều trị | Tái khám Chỉnh nha / Siết niềng | 24
```

**Find patient appointments booked from plan items:**

```sql
SELECT
    a.appointment_code,
    a.appointment_start_time,
    pi.item_name,
    s.service_name
FROM appointments a
JOIN appointment_plan_items api ON a.appointment_id = api.appointment_id
JOIN patient_plan_items pi ON api.item_id = pi.item_id
JOIN services s ON pi.service_id = s.service_id
WHERE a.patient_id = 1
ORDER BY a.appointment_start_time;

-- Result:
-- APT-20251208-001 | 2025-12-08 14:00:00 | Lần 3/24: Siết niềng | Tái khám Chỉnh nha / Siết niềng
-- APT-20251208-001 | 2025-12-08 14:00:00 | Lần 4/24: Siết niềng | Tái khám Chỉnh nha / Siết niềng
```

### Admin Recommendations

**1. Service Naming for Templates**
Use clear names indicating frequency:

-  "Tái khám Chỉnh nha / Siết niềng" (implies monthly visits)
-  "Kiểm tra Implant sau cấy ghép" (implies follow-ups)
-  "Khám răng" (too generic)

**2. Duration Accuracy**
Set realistic `duration_minutes` for services used in templates:

- `ORTHO_ADJUST`: 30 minutes (15 min treatment + 15 min consultation)
- `IMP_CHECKUP`: 20 minutes (quick follow-up)
- `CROWN_FIT`: 60 minutes (longer for adjustments)

**3. Price Strategy**
For long-term plans (2-year orthodontics):

- Option A: Set `services.price` to per-visit price (e.g., 200,000 VND/visit)
- Option B: Set `services.price` to 0, lock total price at plan level (e.g., 30,000,000 VND for entire plan)

**4. Category Assignment**
Assign treatment plan services to appropriate categories:

- Orthodontics services → Category "C. Orthodontics"
- Implant services → Category "D. Dental Implant & Surgery"
- Crown services → Category "B. Cosmetic & Restoration"

This ensures proper display in public price list AND treatment plan UI.

### Error Handling

**Error: Service not found when creating template**

```json
{
  "errorCode": "SERVICE_NOT_FOUND",
  "message": "Service ORTHO_ADJUST not found. Cannot add to template phase."
}
```

→ Ensure service exists and is active before linking to template

**Error: Service inactive when booking appointment**

```json
{
  "errorCode": "SERVICE_INACTIVE",
  "message": "Service ORTHO_ADJUST is inactive. Cannot book appointment from plan item 307."
}
```

→ Reactivate service or update patient plan to use different service

### Frontend Integration

**Display service info in Treatment Plan UI:**

```javascript
// Fetch template with service details
GET /api/v1/treatment-plan-templates/TPL_ORTHO_METAL

// Response includes services:
{
  "phases": [
    {
      "phaseName": "Giai đoạn điều trị",
      "services": [
        {
          "serviceCode": "ORTHO_ADJUST",
          "serviceName": "Tái khám Chỉnh nha / Siết niềng",
          "price": 200000.00,
          "durationMinutes": 30,
          "quantity": 24  ← Show "24 lần × 200,000 = 4,800,000 VND"
        }
      ]
    }
  ]
}
```

**Calculate total treatment cost:**

```javascript
const totalCost = template.phases.reduce((sum, phase) => {
  return (
    sum +
    phase.services.reduce((phaseSum, service) => {
      return phaseSum + service.price * service.quantity;
    }, 0)
  );
}, 0);

// Example: TPL_ORTHO_METAL
// Phase 1: 1×500,000 (khám) + 1×200,000 (X-quang) = 700,000
// Phase 2: 1×5,000,000 (mắc niềng) = 5,000,000
// Phase 3: 24×200,000 (siết niềng) = 4,800,000
// Phase 4: 1×300,000 (tháo niềng) + 1×1,500,000 (retainer) = 1,800,000
// TOTAL: 12,300,000 VND
```

---

## Related Documentation

- [Service Category API](./service-category/ServiceCategory.md) - Category management
- [Appointment API](../booking/appointment/Appointment.md) - Service usage in appointments
- [Treatment Plan API](../treatment-plan/TreatmentPlan.md) - Template & patient plan management ⭐ NEW
