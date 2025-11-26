# API Guide: Doctor-Specific Service Filtering

**Module:** Booking Appointment
**Version:** 1.0
**Date:** 2025-11-20
**Status:**  Production Ready

---

## Overview

This API endpoint provides automatic service filtering based on the **current logged-in doctor's specializations**. It eliminates the need for frontend to manually pass `specializationId` and prevents doctors from selecting incompatible services when creating custom treatment plans.

---

## Endpoint Details

###  Get Services for Current Doctor

**Endpoint:** `GET /api/v1/booking/services/my-specializations`

**Description:** Returns services matching ANY of the current doctor's specializations. Automatically detects doctor context from JWT token.

**Authentication:** Required (Bearer Token)

**Authorization:** `ROLE_ADMIN` OR `VIEW_SERVICE` permission

---

## Request Parameters

| Parameter       | Type    | Required | Default     | Description                                                    |
| --------------- | ------- | -------- | ----------- | -------------------------------------------------------------- |
| `page`          | Integer | No       | `0`         | Page number (zero-indexed)                                     |
| `size`          | Integer | No       | `10`        | Page size (max 100)                                            |
| `sortBy`        | String  | No       | `serviceId` | Sort field: `serviceId`, `serviceCode`, `serviceName`, `price` |
| `sortDirection` | String  | No       | `ASC`       | Sort direction: `ASC` or `DESC`                                |
| `isActive`      | Boolean | No       | `null`      | Filter by active status                                        |
| `keyword`       | String  | No       | `null`      | Search in service name/code                                    |

---

## Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## Response Format

**Success Response (200 OK):**

```json
{
  "message": "Lấy danh sách dịch vụ theo chuyên môn của bác sĩ thành công",
  "status": 200,
  "data": {
    "content": [
      {
        "serviceId": 1,
        "serviceCode": "DH_TONG_QUAT_BASIC",
        "serviceName": "Dịch vụ khám tổng quát cơ bản",
        "description": "Khám tổng quát răng miệng",
        "defaultDurationMinutes": 30,
        "defaultBufferMinutes": 10,
        "price": 200000,
        "displayOrder": 1,
        "isActive": true,
        "specializationId": 8,
        "specializationName": "STANDARD - General Healthcare Workers",
        "categoryId": null,
        "categoryName": null
      },
      {
        "serviceId": 5,
        "serviceCode": "DH_NHIET_RANG",
        "serviceName": "Điều trị tủy răng",
        "description": "Nhổ tủy, trám bít ống tủy",
        "defaultDurationMinutes": 60,
        "defaultBufferMinutes": 15,
        "price": 800000,
        "displayOrder": 5,
        "isActive": true,
        "specializationId": 2,
        "specializationName": "Nội Nha",
        "categoryId": null,
        "categoryName": null
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 3,
    "totalElements": 25,
    "last": false,
    "size": 10,
    "number": 0,
    "sort": {
      "empty": false,
      "sorted": true,
      "unsorted": false
    },
    "numberOfElements": 10,
    "first": true,
    "empty": false
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "message": "No authenticated user found",
  "status": 401,
  "errorCode": "UNAUTHENTICATED"
}
```

**Error Response (400 Bad Request - Not a Doctor):**

```json
{
  "message": "Employee not found for username: admin@dental.vn",
  "status": 400,
  "errorCode": "EMPLOYEE_NOT_FOUND"
}
```

**Error Response (200 OK - No Specializations):**

```json
{
  "message": "Lấy danh sách dịch vụ theo chuyên môn của bác sĩ thành công",
  "status": 200,
  "data": {
    "content": [],
    "totalElements": 0,
    "totalPages": 0,
    "empty": true
  }
}
```

---

## Examples

### Example 1: Get All Services for Current Doctor

**Request:**

```bash
curl -X GET 'http://localhost:8080/api/v1/booking/services/my-specializations?page=0&size=20' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Use Case:** Doctor viewing all services they can perform

---

### Example 2: Get Active Services Only

**Request:**

```bash
curl -X GET 'http://localhost:8080/api/v1/booking/services/my-specializations?isActive=true&size=20' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Use Case:** Custom treatment plan creation - show only available services

---

### Example 3: Search Services with Keyword

**Request:**

```bash
curl -X GET 'http://localhost:8080/api/v1/booking/services/my-specializations?keyword=nhổ%20răng&isActive=true' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Use Case:** Doctor searching for specific service type (e.g., "nhổ răng")

---

### Example 4: Sort by Price (Expensive First)

**Request:**

```bash
curl -X GET 'http://localhost:8080/api/v1/booking/services/my-specializations?sortBy=price&sortDirection=DESC&isActive=true' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Use Case:** Financial review - show most expensive services first

---

## Algorithm Explanation

### Step-by-Step Process

1. **Extract Username from JWT Token**

   - Uses `SecurityUtil.getCurrentUserLogin()`
   - Throws `UNAUTHENTICATED` error if no token

2. **Find Employee by Username**

   - Query: `employeeRepository.findByAccount_Username(username)`
   - Throws `EMPLOYEE_NOT_FOUND` if not found

3. **Extract Specialization IDs**

   - Gets all specializations from employee entity
   - Example: Doctor has `[1, 2, 8]` (Orthodontics, Endodontics, Standard)

4. **Query Services with OR Logic**

   - For each specialization ID: Query `serviceRepository.findWithFilters()`
   - Merge results using `flatMap()`
   - Apply `.distinct()` to remove duplicates

5. **Apply Additional Filters**

   - Filter by `isActive` if specified
   - Filter by `keyword` (service name/code)

6. **Manual Sorting**

   - Sort by specified field (`serviceId`, `serviceCode`, `serviceName`, `price`)
   - Apply sort direction (ASC/DESC)

7. **Manual Pagination**
   - Calculate `start = page * size`
   - Calculate `end = start + size`
   - Return sublist with total count

---

## Comparison: Old vs New API

| Feature                  | Old API (`GET /services`)                | New API (`GET /services/my-specializations`) |
| ------------------------ | ---------------------------------------- | -------------------------------------------- |
| **Filtering**            | Manual `specializationId` parameter      | Automatic from JWT token                     |
| **Use Case**             | Admin viewing all services               | Doctor selecting services for treatment      |
| **Security**             | ️ FE must validate doctor-service match |  BE enforces automatically                 |
| **Complexity**           | FE must know doctor's specializations    | FE just calls endpoint                       |
| **Error Prevention**     | ️ Allows incompatible service selection |  Only compatible services returned         |
| **Multi-Specialization** |  Single specialization filter          |  OR filter across all doctor specs         |

---

## Business Rules

### Who Can Access This API?

 **Allowed:**

- Doctors with `VIEW_SERVICE` permission
- Admins with `ROLE_ADMIN`

 **Blocked:**

- Receptionists (no specializations)
- Unauthenticated users

### Specialization Logic

- **OR Logic:** Service matches if it belongs to **ANY** of doctor's specializations
- **Example:** Doctor with specs `[1, 2, 8]` will see services from spec 1 OR 2 OR 8

### Standard Specialization (ID 8)

- All medical staff **MUST** have `STANDARD (ID 8)` as baseline
- Services with `specializationId = 8` are visible to all doctors
- Specialized services (1-7) only visible to doctors with those specs

---

## Integration Guide for Frontend

### 1. Custom Treatment Plan Creation (API 5.4)

**Before (Error-Prone):**

```javascript
// FE needs to know doctor's specializationId
const doctorSpecId = getDoctorSpecializationId(); //  Extra complexity
const services = await fetch(
  `/api/v1/booking/services?specializationId=${doctorSpecId}`
);
```

**After (Recommended):**

```javascript
// BE handles specialization filtering automatically
const services = await fetch(
  "/api/v1/booking/services/my-specializations?isActive=true"
);
```

### 2. Appointment Service Selection

**React Example:**

```tsx
const ServiceSelector: React.FC = () => {
  const [services, setServices] = useState([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      const response = await apiClient.get(
        "/api/v1/booking/services/my-specializations",
        {
          params: {
            page: 0,
            size: 50,
            isActive: true,
            keyword: keyword,
            sortBy: "serviceName",
            sortDirection: "ASC",
          },
        }
      );
      setServices(response.data.data.content);
    };

    fetchServices();
  }, [keyword]);

  return (
    <div>
      <input
        type="text"
        placeholder="Tìm kiếm dịch vụ..."
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ul>
        {services.map((service) => (
          <li key={service.serviceId}>
            {service.serviceName} - {service.price.toLocaleString()} VND
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### 3. Error Handling

```typescript
try {
  const response = await apiClient.get(
    "/api/v1/booking/services/my-specializations"
  );

  if (response.data.data.empty) {
    // Doctor has no specializations assigned
    toast.warning(
      "Bạn chưa được phân công chuyên môn. Vui lòng liên hệ quản trị viên."
    );
  } else {
    setServices(response.data.data.content);
  }
} catch (error) {
  if (error.response?.status === 401) {
    // Not authenticated
    router.push("/login");
  } else if (error.response?.errorCode === "EMPLOYEE_NOT_FOUND") {
    // Not a doctor account
    toast.error("Tài khoản của bạn không có quyền xem dịch vụ.");
  }
}
```

---

## Performance Considerations

### Optimization Strategy

1. **In-Memory Deduplication:**

   - Uses `distinct()` to remove duplicate services
   - Memory efficient for typical result sets (<1000 services)

2. **Manual Pagination:**

   - Loads all matching services first
   - Then applies pagination in memory
   - ️ Not ideal for very large datasets (>10,000 services)

3. **Query Optimization:**
   - Uses existing `findWithFilters()` repository method
   - Leverages database indexes on `specializationId`, `isActive`

### Recommended Caching

```java
@Cacheable(value = "doctorServices", key = "#username + '-' + #isActive + '-' + #keyword")
public Page<ServiceResponse> getServicesForCurrentDoctor(...) {
    // Cache results per doctor+filters combination
}
```

---

## Testing

### Unit Test Example

```java
@Test
void testGetServicesForCurrentDoctor_withMultipleSpecializations() {
    // Given
    String username = "doctor1@dental.vn";
    Employee doctor = createDoctorWithSpecializations(1, 2, 8);
    when(employeeRepository.findByAccount_Username(username))
        .thenReturn(Optional.of(doctor));

    DentalService service1 = createService(1, 1); // Spec 1
    DentalService service2 = createService(2, 2); // Spec 2
    DentalService service3 = createService(3, 8); // Spec 8

    when(serviceRepository.findWithFilters(any(), eq(1), any(), any()))
        .thenReturn(new PageImpl<>(List.of(service1)));
    when(serviceRepository.findWithFilters(any(), eq(2), any(), any()))
        .thenReturn(new PageImpl<>(List.of(service2)));
    when(serviceRepository.findWithFilters(any(), eq(8), any(), any()))
        .thenReturn(new PageImpl<>(List.of(service3)));

    // When
    Page<ServiceResponse> result = serviceService.getServicesForCurrentDoctor(
        0, 10, "serviceId", "ASC", true, null);

    // Then
    assertEquals(3, result.getTotalElements());
    assertTrue(result.getContent().stream()
        .anyMatch(s -> s.getServiceId().equals(1)));
}
```

### Integration Test Script

Run the provided test script:

```bash
chmod +x test_doctor_service_filtering.sh
./test_doctor_service_filtering.sh
```

---

## Troubleshooting

### Issue 1: Empty Result Set

**Symptom:** API returns `totalElements: 0`

**Possible Causes:**

1. Doctor has no specializations assigned
2. All services are inactive
3. No services match keyword filter

**Solution:**

```sql
-- Check doctor's specializations
SELECT e.employee_code, s.specialization_name
FROM employees e
JOIN employee_specializations es ON e.employee_id = es.employee_id
JOIN specializations s ON es.specialization_id = s.specialization_id
WHERE e.employee_code = 'BS001';

-- Check active services count
SELECT specialization_id, COUNT(*)
FROM dental_services
WHERE is_active = true
GROUP BY specialization_id;
```

---

### Issue 2: Authentication Error

**Symptom:** `401 Unauthorized`

**Possible Causes:**

1. JWT token expired
2. Missing `Authorization` header
3. Invalid token format

**Solution:**

```bash
# Check token expiration
jwt decode $JWT_TOKEN

# Verify header format
curl -v ... | grep Authorization
```

---

### Issue 3: Performance Issues

**Symptom:** Slow response time (>2s)

**Possible Causes:**

1. Too many specializations (>10)
2. Large service catalog (>5000 services)
3. Missing database indexes

**Solution:**

```sql
-- Add indexes
CREATE INDEX idx_services_specialization_active
ON dental_services(specialization_id, is_active);

CREATE INDEX idx_employee_specializations_emp
ON employee_specializations(employee_id);
```

---

## Security Considerations

### Access Control

 **Protected:**

- JWT token validation (Spring Security)
- Role-based authorization (`@PreAuthorize`)
- Employee-account ownership validation

 **Not Implemented:**

- IP whitelisting
- Rate limiting (consider adding)

### Data Exposure

-  Only returns services matching doctor's specializations
-  Prevents unauthorized service visibility
-  No sensitive data in response (prices are public)

---

## Changelog

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 1.0     | 2025-11-20 | Initial release - automatic doctor service filtering |

---

## Contact & Support

**Backend Team:** [Your Email]
**Documentation:** `SEED_DATA_OPTIMIZATION_SUMMARY.md`
**Related APIs:** Treatment Plan API 5.4 (Create Custom Plan)

---

**End of Guide**
