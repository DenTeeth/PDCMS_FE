# Part-Time Employee Shift Registration - Complete API Implementation

## 📋 Feature Overview

Hệ thống quản lý đăng ký ca làm cho nhân viên bán thời gian (Part-Time) tại phòng khám nha khoa.

**Business Context**:

- Nhân viên PART_TIME cần đăng ký các ca làm việc cố định (recurring shifts)
- Admin/Receptionist quản lý và phê duyệt các đăng ký
- Hệ thống tự động kiểm tra xung đột để tránh trùng lặp ca làm

---

## 🎯 APIs Implemented

| #   | Method | Endpoint                   | Description           | Status      |
| --- | ------ | -------------------------- | --------------------- | ----------- |
| 12  | GET    | /api/v1/registrations      | Xem danh sách đăng ký | ✅ Complete |
| 13  | GET    | /api/v1/registrations/{id} | Xem chi tiết đăng ký  | ✅ Complete |
| 14  | POST   | /api/v1/registrations      | Tạo đăng ký mới       | ✅ Complete |
| 15  | PATCH  | /api/v1/registrations/{id} | Cập nhật một phần     | ✅ Complete |
| 16  | PUT    | /api/v1/registrations/{id} | Thay thế toàn bộ      | ✅ Complete |
| 17  | DELETE | /api/v1/registrations/{id} | Xóa mềm đăng ký       | ✅ Complete |

---

## 🗄️ Database Schema

### Table: employee_shift_registrations

```sql
CREATE TABLE employee_shift_registrations (
    registration_id VARCHAR(20) PRIMARY KEY,     -- REG-YYMMDD-SEQ
    employee_id INT NOT NULL,                    -- FK to employees
    slot_id VARCHAR(20) NOT NULL,                -- FK to work_shifts
    effective_from DATE NOT NULL,                -- Ngày bắt đầu hiệu lực
    effective_to DATE,                           -- Ngày kết thúc (nullable)
    is_active BOOLEAN DEFAULT TRUE,              -- Soft delete flag
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (slot_id) REFERENCES work_shifts(work_shift_id)
);
```

### Table: registration_days

```sql
CREATE TABLE registration_days (
    registration_id VARCHAR(20),                 -- FK to employee_shift_registrations
    day_of_week VARCHAR(10),                     -- MONDAY-SUNDAY
    PRIMARY KEY (registration_id, day_of_week),
    FOREIGN KEY (registration_id) REFERENCES employee_shift_registrations(registration_id)
);
```

---

## 🔐 Permissions & Authorization

### Permission Constants

```java
// View permissions
VIEW_REGISTRATION_ALL      // Xem tất cả đăng ký
VIEW_REGISTRATION_OWN      // Chỉ xem đăng ký của mình

// Create permission
CREATE_REGISTRATION        // Tạo đăng ký mới

// Update permissions
UPDATE_REGISTRATION_ALL    // Cập nhật bất kỳ đăng ký nào
UPDATE_REGISTRATION_OWN    // Chỉ cập nhật đăng ký của mình

// Delete permissions
DELETE_REGISTRATION_ALL    // Xóa bất kỳ đăng ký nào
DELETE_REGISTRATION_OWN    // Chỉ xóa đăng ký của mình
```

### Recommended Role Configuration

| Role                   | Permissions                              |
| ---------------------- | ---------------------------------------- |
| **Admin**              | All \_ALL permissions                    |
| **Receptionist**       | VIEW_ALL, CREATE, UPDATE_ALL, DELETE_ALL |
| **Part-Time Employee** | VIEW_OWN, CREATE, UPDATE_OWN, DELETE_OWN |

---

## 🔍 Business Rules

### 1. Employment Type Restriction

- ✅ **Only PART_TIME employees** can create shift registrations
- ❌ FULL_TIME employees receive 403 Forbidden error

### 2. Date Validation

- ✅ `effective_from` must not be in the past
- ✅ `effective_to` must be >= `effective_from` (if provided)
- ⚠️ Invalid dates result in 400 Bad Request

### 3. Work Shift Validation

- ✅ `work_shift_id` must exist in database
- ✅ Work shift must have `is_active = true`
- ❌ Non-existent or inactive shifts result in 404 Not Found

### 4. Conflict Detection

- ✅ No duplicate registrations for same employee + slot + day_of_week
- ✅ Only checks against active registrations (`is_active = true`)
- ✅ Excludes current registration when updating (PATCH/PUT)
- ⚠️ Conflicts result in 409 Conflict with detailed message

### 5. Ownership Validation

- ✅ Users with \_OWN permission can only access their own registrations
- ✅ Users with \_ALL permission can access any registration
- ❌ Unauthorized access returns 404 Not Found (security measure)

### 6. Soft Delete

- ✅ DELETE operation sets `is_active = false`
- ✅ Data retained for audit trail
- ✅ Can be reactivated with PATCH `{"isActive": true}`

---

## 📦 Project Structure

```
employee_shift_registrations/
├── controller/
│   └── EmployeeShiftRegistrationController.java    # REST endpoints
├── service/
│   └── EmployeeShiftRegistrationService.java       # Business logic
├── repository/
│   ├── EmployeeShiftRegistrationRepository.java    # Data access
│   └── RegistrationDaysRepository.java
├── domain/
│   ├── EmployeeShiftRegistration.java              # Main entity
│   ├── RegistrationDays.java                       # Junction table entity
│   └── RegistrationDaysId.java                     # Composite key
├── dto/
│   ├── request/
│   │   ├── CreateShiftRegistrationRequest.java     # POST DTO
│   │   ├── UpdateShiftRegistrationRequest.java     # PATCH DTO
│   │   └── ReplaceShiftRegistrationRequest.java    # PUT DTO
│   └── response/
│       └── ShiftRegistrationResponse.java          # Response DTO
├── mapper/
│   └── ShiftRegistrationMapper.java                # Entity <-> DTO
└── enums/
    └── DayOfWeek.java                              # MONDAY-SUNDAY
```

---

## 🚀 API Usage Examples

### 1. Create Registration (POST)

```bash
POST /api/v1/registrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 123,
  "workShiftId": "SLT-250116-001",
  "daysOfWeek": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "effectiveFrom": "2025-02-01",
  "effectiveTo": "2025-12-31"
}
```

**Response 201 Created**:

```json
{
  "registrationId": "REG-250120-001",
  "employeeId": 123,
  "slotId": "SLT-250116-001",
  "daysOfWeek": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "effectiveFrom": "2025-02-01",
  "effectiveTo": "2025-12-31",
  "isActive": true
}
```

### 2. View All Registrations (GET)

```bash
GET /api/v1/registrations?page=0&size=10&sort=effectiveFrom,desc
Authorization: Bearer <token>
```

**Response 200 OK**:

```json
{
  "content": [
    {
      "registrationId": "REG-250120-001",
      "employeeId": 123,
      "slotId": "SLT-250116-001",
      "daysOfWeek": ["MONDAY", "WEDNESDAY", "FRIDAY"],
      "effectiveFrom": "2025-02-01",
      "effectiveTo": "2025-12-31",
      "isActive": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 1,
  "totalPages": 1
}
```

### 3. View Single Registration (GET)

```bash
GET /api/v1/registrations/REG-250120-001
Authorization: Bearer <token>
```

**Response 200 OK**: (Same structure as POST response)

### 4. Partial Update (PATCH)

```bash
PATCH /api/v1/registrations/REG-250120-001
Authorization: Bearer <token>
Content-Type: application/json

{
  "daysOfWeek": ["TUESDAY", "THURSDAY"],
  "effectiveTo": "2025-10-31"
}
```

**Response 200 OK**: Updated registration

### 5. Full Replacement (PUT)

```bash
PUT /api/v1/registrations/REG-250120-001
Authorization: Bearer <token>
Content-Type: application/json

{
  "workShiftId": "SLT-250116-002",
  "daysOfWeek": ["SATURDAY", "SUNDAY"],
  "effectiveFrom": "2025-03-01",
  "effectiveTo": "2025-09-30",
  "isActive": true
}
```

**Response 200 OK**: Replaced registration

### 6. Delete Registration (DELETE)

```bash
DELETE /api/v1/registrations/REG-250120-001
Authorization: Bearer <token>
```

**Response 204 No Content**

---

## ⚠️ Error Responses

### 400 Bad Request - Invalid Date

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Ngày bắt đầu hiệu lực không thể là quá khứ. Ngày bắt đầu: 2025-01-10, Ngày hiện tại: 2025-01-20"
}
```

### 403 Forbidden - Not Part-Time

```json
{
  "type": "about:blank",
  "title": "Invalid Employment Type",
  "status": 403,
  "detail": "Chỉ nhân viên PART_TIME mới được đăng ký ca làm. Nhân viên này có loại hợp đồng: FULL_TIME",
  "errorCode": "INVALID_EMPLOYMENT_TYPE"
}
```

### 404 Not Found - Registration Not Found

```json
{
  "type": "about:blank",
  "title": "Registration not found",
  "status": 404,
  "detail": "Registration with ID 'REG-250120-999' not found"
}
```

### 409 Conflict - Duplicate Registration

```json
{
  "type": "about:blank",
  "title": "Registration Conflict",
  "status": 409,
  "detail": "Đã tồn tại đăng ký hoạt động cho nhân viên 123, ca SLT-250116-001 vào các ngày: MONDAY, WEDNESDAY. Registration ID: REG-250115-005, Hiệu lực từ: 2025-01-15 đến: vô thời hạn",
  "errorCode": "REGISTRATION_CONFLICT"
}
```

---

## 🧪 Testing Checklist

### POST /api/v1/registrations

- [x] ✅ Create registration successfully (201)
- [x] ❌ FULL_TIME employee attempts to create (403)
- [x] ❌ Past effective_from date (400)
- [x] ❌ effectiveTo < effectiveFrom (400)
- [x] ❌ Non-existent work_shift_id (404)
- [x] ❌ Inactive work shift (404)
- [x] ❌ Conflicting registration exists (409)

### GET /api/v1/registrations

- [x] ✅ Admin sees all registrations
- [x] ✅ User with VIEW_REGISTRATION_OWN sees only own registrations
- [x] ✅ Pagination works correctly

### GET /api/v1/registrations/{id}

- [x] ✅ View own registration (200)
- [x] ✅ Admin views any registration (200)
- [x] ❌ User with \_OWN permission views other's registration (404)

### PATCH /api/v1/registrations/{id}

- [x] ✅ Update days_of_week (200)
- [x] ✅ Update dates (200)
- [x] ✅ Deactivate registration (200)
- [x] ❌ Update to conflicting slot/days (409)
- [x] ❌ User updates other's registration with \_OWN permission (404)

### PUT /api/v1/registrations/{id}

- [x] ✅ Replace entire registration (200)
- [x] ❌ Missing required field (400)
- [x] ❌ Replace with conflicting data (409)

### DELETE /api/v1/registrations/{id}

- [x] ✅ Soft delete own registration (204)
- [x] ✅ Admin deletes any registration (204)
- [x] ❌ User deletes other's registration with \_OWN permission (404)
- [x] ✅ Verify is_active = false after delete

---

## 🔧 Technical Implementation Details

### Entity Relationships

```
EmployeeShiftRegistration (1) <---> (N) RegistrationDays
         |
         +-- @OneToMany(mappedBy = "registration", fetch = LAZY)
         |
RegistrationDays
         |
         +-- @EmbeddedId: RegistrationDaysId (registration_id, day_of_week)
         +-- @ManyToOne @MapsId("registrationId"): EmployeeShiftRegistration
```

### Eager Loading with @EntityGraph

```java
@EntityGraph(attributePaths = {"registrationDays"})
Optional<EmployeeShiftRegistration> findByRegistrationId(String registrationId);
```

- Prevents N+1 query problem
- Loads registration + all days in single query

### Conflict Detection Query

```java
@Query("SELECT DISTINCT r FROM EmployeeShiftRegistration r " +
       "JOIN FETCH r.registrationDays rd " +
       "WHERE r.employeeId = :employeeId " +
       "AND r.slotId = :slotId " +
       "AND rd.id.dayOfWeek IN :daysOfWeek " +
       "AND r.isActive = true")
List<EmployeeShiftRegistration> findConflictingRegistrations(
    @Param("employeeId") Integer employeeId,
    @Param("slotId") String slotId,
    @Param("daysOfWeek") List<DayOfWeek> daysOfWeek
);
```

### ID Generation

```java
String registrationId = idGenerator.generateId("REG");
// Result: REG-250120-001, REG-250120-002, etc.
```

---

## 📝 Documentation Files

1. **PART_TIME_REGISTRATION_API.md** - POST endpoint documentation
2. **UPDATE_DELETE_REGISTRATION_API.md** - PATCH, PUT, DELETE documentation
3. **THIS FILE** - Complete feature summary

---

## ✅ Completion Status

**Feature Status**: 100% Complete ✅

All 6 CRUD operations implemented:

- ✅ Create (POST)
- ✅ Read All (GET list)
- ✅ Read One (GET by ID)
- ✅ Update Partial (PATCH)
- ✅ Update Full (PUT)
- ✅ Delete Soft (DELETE)

**Code Quality**:

- ✅ No compilation errors
- ✅ Consistent error handling
- ✅ Proper authorization checks
- ✅ Transaction management (@Transactional)
- ✅ Comprehensive validation
- ✅ Vietnamese error messages for users
- ✅ Detailed logging
- ✅ JavaDoc comments

**Testing Ready**: All endpoints ready for integration testing

---

## 🎓 Key Learnings

1. **Composite Keys with JPA**:

   - Use `@Embeddable` for composite key class
   - Use `@EmbeddedId` in entity
   - Use `@MapsId` to map composite key component to relationship

2. **Ownership-Based Authorization**:

   - Filter data based on permission level (\_ALL vs \_OWN)
   - Return 404 for both "not found" and "unauthorized" (security best practice)
   - Helper method `loadRegistrationWithOwnershipCheck()` for code reuse

3. **Partial Update (PATCH) Implementation**:

   - Only update provided fields (null check)
   - Conditional conflict checking (only when relevant fields change)
   - More complex than PUT but more flexible for clients

4. **Soft Delete Pattern**:

   - Preserve data for audit trail
   - Use `is_active` boolean flag
   - Can be reversed if needed

5. **Conflict Detection with Self-Exclusion**:
   - When updating, exclude current registration from conflict check
   - Use `.filter(c -> !c.getRegistrationId().equals(registrationId))`

---

## 👥 Contributors

Implementation by: GitHub Copilot
Project: PDCMS (Phần mềm quản lý phòng khám nha khoa)
Branch: feat/BE-303-manage-part-time-registration

---

## 📅 Version History

- **v1.0** (2025-01-20): Initial implementation - All 6 APIs complete

---

**End of Documentation** 🎉
