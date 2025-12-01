# API 5.5 - Get All Treatment Plans with RBAC

**Module**: Treatment Plan Management
**Version**: V1.0
**Status**:  Production Ready
**Last Updated**: 2025-11-12
**Source**: `TreatmentPlanController.java` (lines 283-392), `TreatmentPlanService.java`

---

##  Overview

**Smart RBAC Endpoint** - Automatically filters data based on user role:

- **Admin** (`VIEW_TREATMENT_PLAN_ALL`): Sees ALL plans, can filter by doctor/patient
- **Doctor** (`VIEW_TREATMENT_PLAN_OWN`): Sees only plans they created
- **Patient** (`VIEW_TREATMENT_PLAN_OWN`): Sees only their own plans

**Advanced Features**:

-  Date range filtering (startDate, createdAt)
-  Search term (plan name, patient name)
-  Status and approval filters
-  Full pagination support
-  Performance optimized (JPA Specification + JOIN FETCH)

---

## API Specification

### Endpoint

```
GET /api/v1/patient-treatment-plans
```

### Query Parameters

| Parameter            | Type    | Required | Description                                 | Example        |
| -------------------- | ------- | -------- | ------------------------------------------- | -------------- |
| `page`               | Integer | No       | Page number (0-indexed)                     | 0              |
| `size`               | Integer | No       | Page size (default 20)                      | 20             |
| `sort`               | String  | No       | Sort field and direction                    | createdAt,desc |
| `status`             | String  | No       | PENDING, IN_PROGRESS, COMPLETED, CANCELLED  | IN_PROGRESS    |
| `approvalStatus`     | String  | No       | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED | APPROVED       |
| `planCode`           | String  | No       | Filter by plan code (starts with)           | PLAN-20251112  |
| `doctorEmployeeCode` | String  | No       | **Admin only** - Filter by doctor           | EMP-001        |
| `patientCode`        | String  | No       | **Admin only** - Filter by patient          | BN-1001        |
| `startDateFrom`      | Date    | No       | Filter start date >= this (yyyy-MM-dd)      | 2025-01-01     |
| `startDateTo`        | Date    | No       | Filter start date <= this (yyyy-MM-dd)      | 2025-12-31     |
| `createdAtFrom`      | Date    | No       | Filter created date >= this (yyyy-MM-dd)    | 2025-01-01     |
| `createdAtTo`        | Date    | No       | Filter created date <= this (yyyy-MM-dd)    | 2025-12-31     |
| `searchTerm`         | String  | No       | Search in plan name, patient name           | orthodontics   |

### Security & Permissions

**@PreAuthorize Annotation**:

```java
@PreAuthorize("hasRole('ROLE_ADMIN') or " +
              "hasAuthority('VIEW_TREATMENT_PLAN_ALL') or " +
              "hasAuthority('VIEW_TREATMENT_PLAN_OWN')")
```

**Allowed Roles**:

-  **Admin** - Full access (always allowed via `hasRole('ROLE_ADMIN')`)
-  **Manager** - Has `VIEW_TREATMENT_PLAN_ALL` permission
-  **Dentist** - Has `VIEW_TREATMENT_PLAN_ALL` permission
-  **Receptionist** - Has `VIEW_TREATMENT_PLAN_ALL` permission
-  **Patient** - Has `VIEW_TREATMENT_PLAN_OWN` permission

**Permission Check Logic**:

1. First checks if user has `ROLE_ADMIN` role → Full access
2. Checks if user has `VIEW_TREATMENT_PLAN_ALL` → Can view and filter all plans
3. Checks if user has `VIEW_TREATMENT_PLAN_OWN` → Auto-filtered by patient/doctor
4. Returns `403 Forbidden` if no permissions match

**CRITICAL**: Role `ADMIN` is checked FIRST before permissions. Admin always has full access regardless of permission assignments.

### Example Requests

**Admin - Get all ACTIVE plans**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?status=IN_PROGRESS&approvalStatus=APPROVED&page=0&size=20
Authorization: Bearer {admin_token}
```

**Admin - Get plans for specific doctor**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?doctorEmployeeCode=EMP-001&status=IN_PROGRESS
Authorization: Bearer {admin_token}
```

**Doctor - Get my patients' plans** (auto-filtered):

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?status=IN_PROGRESS
Authorization: Bearer {doctor_token}
# System automatically adds: createdBy = current doctor
```

**Patient - Get my plans** (auto-filtered):

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans
Authorization: Bearer {patient_token}
# System automatically adds: patient = current patient
```

**Search plans created this month**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?createdAtFrom=2025-11-01&createdAtTo=2025-11-30
Authorization: Bearer {admin_token}
```

**Search plans by name**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?searchTerm=orthodontics
Authorization: Bearer {admin_token}
```

---

## Response (200 OK)

Same pagination structure as **API 5.1**:

```json
{
  "content": [
    {
      "patientPlanId": 1,
      "planCode": "PLAN-20251001-001",
      "planName": "Lộ trình Niềng răng Mắc cài Kim loại",
      "status": "IN_PROGRESS",
      "doctor": {
        "employeeCode": "EMP-001",
        "fullName": "Bác sĩ Nguyễn Văn A"
      },
      "startDate": "2025-10-01",
      "expectedEndDate": "2027-10-01",
      "totalCost": 35000000,
      "discountAmount": 0,
      "finalCost": 35000000,
      "paymentType": "INSTALLMENT"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

## RBAC Logic

### Admin Mode (VIEW_TREATMENT_PLAN_ALL)

**Behavior**:

- Sees **ALL** treatment plans in system
- Can use `doctorEmployeeCode` and `patientCode` filters
- No automatic filtering applied

**Example**:

```bash
# Get all plans for doctor EMP-001
GET /api/v1/patient-treatment-plans?doctorEmployeeCode=EMP-001

# Get all plans for patient BN-1001
GET /api/v1/patient-treatment-plans?patientCode=BN-1001

# Get all DRAFT plans (need approval)
GET /api/v1/patient-treatment-plans?approvalStatus=DRAFT
```

### Doctor Mode (VIEW_TREATMENT_PLAN_OWN)

**Behavior**:

- Sees **ONLY** plans created by them (`createdBy = currentEmployee`)
- `doctorEmployeeCode` filter is **IGNORED** (security)
- `patientCode` filter is **IGNORED** (security)
- Can still use status, approvalStatus, date filters

**Example**:

```bash
# Doctor EMP-001 logged in
GET /api/v1/patient-treatment-plans?status=IN_PROGRESS

# System automatically adds: WHERE createdBy.employeeCode = 'EMP-001'
# Returns only plans created by this doctor
```

### Patient Mode (VIEW_TREATMENT_PLAN_OWN)

**Behavior**:

- Sees **ONLY** their own plans (`patient = currentPatient`)
- `doctorEmployeeCode` filter is **IGNORED** (security)
- `patientCode` filter is **IGNORED** (security)
- Can still use status, approvalStatus filters

**Example**:

```bash
# Patient BN-1001 logged in
GET /api/v1/patient-treatment-plans

# System automatically adds: WHERE patient.patientCode = 'BN-1001'
# Returns only this patient's plans
```

---

## Filtering Examples

### Filter by Status

```bash
# Get all completed plans
GET /api/v1/patient-treatment-plans?status=COMPLETED

# Get all active plans
GET /api/v1/patient-treatment-plans?status=IN_PROGRESS
```

### Filter by Approval Status (V19)

```bash
# Get all DRAFT plans (need approval)
GET /api/v1/patient-treatment-plans?approvalStatus=DRAFT

# Get all APPROVED plans
GET /api/v1/patient-treatment-plans?approvalStatus=APPROVED
```

### Filter by Date Range

```bash
# Plans starting in 2025
GET /api/v1/patient-treatment-plans?startDateFrom=2025-01-01&startDateTo=2025-12-31

# Plans created this month
GET /api/v1/patient-treatment-plans?createdAtFrom=2025-11-01&createdAtTo=2025-11-30
```

### Search by Term

```bash
# Search "orthodontics" in plan name or patient name
GET /api/v1/patient-treatment-plans?searchTerm=orthodontics

# Search patient name
GET /api/v1/patient-treatment-plans?searchTerm=Phong
```

### Combine Multiple Filters

```bash
# Active, approved plans for doctor EMP-001, created this month
GET /api/v1/patient-treatment-plans?doctorEmployeeCode=EMP-001&status=IN_PROGRESS&approvalStatus=APPROVED&createdAtFrom=2025-11-01&createdAtTo=2025-11-30
```

---

## Testing Guide

### Test 1: Admin - Get All Plans

**Request**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?page=0&size=20
Authorization: Bearer {admin_token}
```

**Expected**:

-  Returns all plans in system
-  Pagination working

### Test 2: Doctor - Get My Plans

**Setup**: Doctor EMP-001 created plans 1, 2, 3. Doctor EMP-002 created plan 4.

**Request**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans
Authorization: Bearer {doctor_emp001_token}
```

**Expected**:

-  Returns only plans 1, 2, 3 (created by EMP-001)
-  Does NOT return plan 4 (created by EMP-002)

### Test 3: Patient - Get My Plans

**Setup**: Patient BN-1001 has plans 1, 2. Patient BN-1002 has plan 3.

**Request**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans
Authorization: Bearer {patient_bn1001_token}
```

**Expected**:

-  Returns only plans 1, 2 (patient BN-1001)
-  Does NOT return plan 3 (patient BN-1002)

### Test 4: Filter by Status

**Request**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?status=IN_PROGRESS
Authorization: Bearer {admin_token}
```

**Expected**:

-  Returns only plans with status = IN_PROGRESS

### Test 5: Search Term

**Request**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?searchTerm=niềng
Authorization: Bearer {admin_token}
```

**Expected**:

-  Returns plans with "niềng" in plan name or patient name

### Test 6: Date Range Filter

**Request**:

```bash
GET http://localhost:8080/api/v1/patient-treatment-plans?createdAtFrom=2025-11-01&createdAtTo=2025-11-30
Authorization: Bearer {admin_token}
```

**Expected**:

-  Returns only plans created in November 2025

---

## Error Handling

| HTTP | Error Code    | Description                                      |
| ---- | ------------- | ------------------------------------------------ |
| 403  | ACCESS_DENIED | User doesn't have VIEW_TREATMENT_PLAN permission |
| 401  | UNAUTHORIZED  | Missing or invalid JWT token                     |

---

## Performance Notes

- **Optimized**: Uses JPA Specification with JOIN FETCH (no N+1 queries)
- **Expected Time**: < 200ms for typical query (50 plans)
- **Pagination**: Always use pagination for large datasets

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: Dental Clinic Development Team
**Verified Against**: TreatmentPlanController.java (lines 283-392), TreatmentPlanService.getAllTreatmentPlans()
