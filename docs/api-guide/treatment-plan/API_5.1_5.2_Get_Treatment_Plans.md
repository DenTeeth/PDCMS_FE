# API 5.1 & 5.2 - Get Treatment Plans

**Module**: Treatment Plan Management
**Version**: V1.0
**Status**:  Production Ready
**Last Updated**: 2025-11-12
**Source**: `TreatmentPlanController.java`, `TreatmentPlanService.java`, `TreatmentPlanDetailService.java`

---

##  Table of Contents

1. [API 5.1 - Get Treatment Plans List](#api-51---get-treatment-plans-list)
2. [API 5.2 - Get Treatment Plan Detail](#api-52---get-treatment-plan-detail)
3. [RBAC Permissions](#rbac-permissions)
4. [Response Models](#response-models)
5. [Testing Guide](#testing-guide)
6. [Error Handling](#error-handling)

---

## API 5.1 - Get Treatment Plans List

### Overview

Retrieve all treatment plans for a specific patient with pagination support.

### Endpoint

```
GET /api/v1/patients/{patientCode}/treatment-plans
```

### Path Parameters

| Parameter     | Type   | Required | Description           | Example |
| ------------- | ------ | -------- | --------------------- | ------- |
| `patientCode` | String | Yes      | Patient business code | BN-1001 |

### Query Parameters (Pagination)

| Parameter | Type    | Required | Default | Description              | Example        |
| --------- | ------- | -------- | ------- | ------------------------ | -------------- |
| `page`    | Integer | No       | 0       | Page number (0-indexed)  | 0              |
| `size`    | Integer | No       | 10      | Number of items per page | 20             |
| `sort`    | String  | No       | -       | Sort field and direction | createdAt,desc |

### Security & Permissions

**@PreAuthorize Annotation**:

```java
@PreAuthorize("hasRole('ROLE_ADMIN') or " +
              "hasAuthority('VIEW_TREATMENT_PLAN_ALL') or " +
              "hasAuthority('VIEW_TREATMENT_PLAN_OWN')")
```

**Allowed Roles**:

-  **Admin** - Full access (always allowed via `hasRole('ROLE_ADMIN')`)
-  **Manager** - Has `VIEW_TREATMENT_PLAN_ALL` permission (sees all patients' plans)
-  **Dentist** - Has `VIEW_TREATMENT_PLAN_ALL` permission (sees all patients' plans)
-  **Receptionist** - Has `VIEW_TREATMENT_PLAN_ALL` permission (sees all patients' plans)
-  **Patient** - Has `VIEW_TREATMENT_PLAN_OWN` permission (sees only their own plans)

**Permission Check Logic**:

1. First checks if user has `ROLE_ADMIN` role → Full access
2. Checks if user has `VIEW_TREATMENT_PLAN_ALL` → Can view any patient's plans
3. Checks if user has `VIEW_TREATMENT_PLAN_OWN` → RBAC filtering applied in service layer
4. Returns `403 Forbidden` if no permissions match

### Example Request

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans?page=0&size=20&sort=createdAt,desc
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

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
    },
    {
      "patientPlanId": 3,
      "planCode": "PLAN-20241115-002",
      "planName": "Lộ trình điều trị tủy + Bọc răng sứ",
      "status": "PENDING",
      "doctor": {
        "employeeCode": "EMP-001",
        "fullName": "Bác sĩ Nguyễn Văn A"
      },
      "startDate": null,
      "expectedEndDate": "2025-01-15",
      "totalCost": 7500000,
      "discountAmount": 500000,
      "finalCost": 7000000,
      "paymentType": "FULL"
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
  "last": true,
  "totalPages": 1,
  "totalElements": 2,
  "size": 20,
  "number": 0,
  "first": true,
  "numberOfElements": 2,
  "empty": false
}
```

### Response Fields

#### Page Object

| Field              | Type    | Description                            |
| ------------------ | ------- | -------------------------------------- |
| `content`          | Array   | Array of treatment plan summaries      |
| `totalElements`    | Long    | Total number of items across all pages |
| `totalPages`       | Integer | Total number of pages                  |
| `number`           | Integer | Current page number (0-indexed)        |
| `size`             | Integer | Page size                              |
| `first`            | Boolean | Is this the first page?                |
| `last`             | Boolean | Is this the last page?                 |
| `numberOfElements` | Integer | Number of items in current page        |

#### TreatmentPlanSummaryDTO

| Field             | Type       | Description                                 |
| ----------------- | ---------- | ------------------------------------------- |
| `patientPlanId`   | Long       | Internal database ID                        |
| `planCode`        | String     | **Business key** (e.g., PLAN-20251001-001)  |
| `planName`        | String     | Treatment plan name                         |
| `status`          | String     | PENDING, IN_PROGRESS, COMPLETED, CANCELLED  |
| `doctor`          | Object     | Doctor information (employeeCode, fullName) |
| `startDate`       | Date       | Start date (null if not started yet)        |
| `expectedEndDate` | Date       | Expected completion date                    |
| `totalCost`       | BigDecimal | Total price before discount                 |
| `discountAmount`  | BigDecimal | Discount amount                             |
| `finalCost`       | BigDecimal | Final cost after discount                   |
| `paymentType`     | String     | FULL, PHASED, INSTALLMENT                   |

---

## API 5.2 - Get Treatment Plan Detail

### Overview

Retrieve complete details of a specific treatment plan, including phases, items, and linked appointments.

### Endpoint

```
GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}
```

### Path Parameters

| Parameter     | Type   | Required | Description                  | Example           |
| ------------- | ------ | -------- | ---------------------------- | ----------------- |
| `patientCode` | String | Yes      | Patient business code        | BN-1001           |
| `planCode`    | String | Yes      | Treatment plan business code | PLAN-20251001-001 |

### Example Request

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans/PLAN-20251001-001
Authorization: Bearer {jwt_token}
```

### Response (200 OK)

```json
{
  "planId": 1,
  "planCode": "PLAN-20251001-001",
  "planName": "Lộ trình Niềng răng Mắc cài Kim loại",
  "status": "IN_PROGRESS",
  "doctor": {
    "employeeCode": "EMP-001",
    "fullName": "Bác sĩ Nguyễn Văn A"
  },
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Đoàn Thanh Phong"
  },
  "startDate": "2025-10-01",
  "expectedEndDate": "2027-10-01",
  "createdAt": "2025-10-01T08:30:00",
  "totalPrice": 35000000,
  "discountAmount": 0,
  "finalCost": 35000000,
  "paymentType": "INSTALLMENT",
  "progressSummary": {
    "totalPhases": 4,
    "completedPhases": 1,
    "totalItems": 15,
    "completedItems": 3,
    "progressPercentage": 20.0
  },
  "phases": [
    {
      "patientPhaseId": 1,
      "phaseNumber": 1,
      "phaseName": "Giai đoạn 1: Chuẩn bị và Kiểm tra",
      "status": "COMPLETED",
      "startDate": "2025-10-01",
      "completionDate": "2025-10-06",
      "estimatedDurationDays": 7,
      "items": [
        {
          "itemId": 1,
          "sequenceNumber": 1,
          "itemName": "Khám tổng quát và chụp X-quang",
          "status": "COMPLETED",
          "estimatedTimeMinutes": 30,
          "price": 500000,
          "completedAt": "2025-10-02T09:00:00",
          "linkedAppointments": []
        },
        {
          "itemId": 2,
          "sequenceNumber": 2,
          "itemName": "Lấy cao răng trước niềng",
          "status": "COMPLETED",
          "estimatedTimeMinutes": 45,
          "price": 800000,
          "completedAt": "2025-10-03T10:30:00",
          "linkedAppointments": []
        },
        {
          "itemId": 3,
          "sequenceNumber": 3,
          "itemName": "Hàn trám răng sâu (nếu có)",
          "status": "COMPLETED",
          "estimatedTimeMinutes": 60,
          "price": 1500000,
          "completedAt": "2025-10-05T14:00:00",
          "linkedAppointments": []
        }
      ]
    },
    {
      "patientPhaseId": 2,
      "phaseNumber": 2,
      "phaseName": "Giai đoạn 2: Lắp Mắc cài và Điều chỉnh ban đầu",
      "status": "IN_PROGRESS",
      "startDate": "2025-10-15",
      "completionDate": null,
      "estimatedDurationDays": 60,
      "items": [
        {
          "itemId": 4,
          "sequenceNumber": 1,
          "itemName": "Lắp mắc cài kim loại hàm trên",
          "status": "COMPLETED",
          "estimatedTimeMinutes": 90,
          "price": 8000000,
          "completedAt": "2025-10-16T09:00:00",
          "linkedAppointments": []
        },
        {
          "itemId": 5,
          "sequenceNumber": 2,
          "itemName": "Lắp mắc cài kim loại hàm dưới",
          "status": "COMPLETED",
          "estimatedTimeMinutes": 90,
          "price": 8000000,
          "completedAt": "2025-10-17T10:00:00",
          "linkedAppointments": []
        },
        {
          "itemId": 6,
          "sequenceNumber": 3,
          "itemName": "Điều chỉnh lần 1 (sau 1 tháng)",
          "status": "READY_FOR_BOOKING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        }
      ]
    },
    {
      "patientPhaseId": 3,
      "phaseNumber": 3,
      "phaseName": "Giai đoạn 3: Điều chỉnh định kỳ (8 tháng)",
      "status": "PENDING",
      "startDate": null,
      "completionDate": null,
      "estimatedDurationDays": 240,
      "items": [
        {
          "itemId": 8,
          "sequenceNumber": 1,
          "itemName": "Điều chỉnh tháng 3",
          "status": "READY_FOR_BOOKING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 9,
          "sequenceNumber": 2,
          "itemName": "Điều chỉnh tháng 4",
          "status": "READY_FOR_BOOKING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        }
      ]
    }
  ]
}
```

### Response Fields

#### TreatmentPlanDetailResponse (Root)

| Field             | Type       | Description                                |
| ----------------- | ---------- | ------------------------------------------ |
| `planId`          | Long       | Internal database ID                       |
| `planCode`        | String     | Business key (e.g., PLAN-20251001-001)     |
| `planName`        | String     | Treatment plan name                        |
| `status`          | String     | PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| `doctor`          | Object     | Doctor information                         |
| `patient`         | Object     | Patient information                        |
| `startDate`       | Date       | Treatment start date (null if not started) |
| `expectedEndDate` | Date       | Expected completion date                   |
| `createdAt`       | DateTime   | When this plan was created                 |
| `totalPrice`      | BigDecimal | Total price before discount                |
| `discountAmount`  | BigDecimal | Discount amount                            |
| `finalCost`       | BigDecimal | Final cost after discount                  |
| `paymentType`     | String     | FULL, PHASED, INSTALLMENT                  |
| `progressSummary` | Object     | Progress statistics                        |
| `phases`          | Array      | List of phases with nested items           |

#### ProgressSummaryDTO

| Field                | Type    | Description                             |
| -------------------- | ------- | --------------------------------------- |
| `totalPhases`        | Integer | Total number of phases                  |
| `completedPhases`    | Integer | Number of completed phases              |
| `totalItems`         | Integer | Total number of items across all phases |
| `completedItems`     | Integer | Number of completed items               |
| `progressPercentage` | Double  | Completion percentage (0-100)           |

#### PhaseDetailDTO

| Field                   | Type    | Description                              |
| ----------------------- | ------- | ---------------------------------------- |
| `patientPhaseId`        | Long    | Phase ID                                 |
| `phaseNumber`           | Integer | Phase number (1, 2, 3, ...)              |
| `phaseName`             | String  | Phase name                               |
| `status`                | String  | PENDING, IN_PROGRESS, COMPLETED          |
| `startDate`             | Date    | When phase started (null if not started) |
| `completionDate`        | Date    | When phase completed (null if ongoing)   |
| `estimatedDurationDays` | Integer | Estimated duration in days               |
| `items`                 | Array   | List of items in this phase              |

#### ItemDetailDTO

| Field                  | Type       | Description                                                   |
| ---------------------- | ---------- | ------------------------------------------------------------- |
| `itemId`               | Long       | Item ID                                                       |
| `sequenceNumber`       | Integer    | Sequence within phase                                         |
| `itemName`             | String     | Item/service name                                             |
| `status`               | String     | PENDING, READY_FOR_BOOKING, SCHEDULED, IN_PROGRESS, COMPLETED |
| `estimatedTimeMinutes` | Integer    | Estimated time for this service                               |
| `price`                | BigDecimal | Item price (snapshot from service)                            |
| `completedAt`          | DateTime   | When completed (null if not done)                             |
| `linkedAppointments`   | Array      | List of appointments for this item                            |

---

## RBAC Permissions

### VIEW_TREATMENT_PLAN_ALL

**Who has it**: Admin, Manager, Staff

**What they can do**:

- View **ANY** patient's treatment plans
- No restrictions on `patientCode`

**Example**:

```bash
# Staff can view plans for any patient
GET /api/v1/patients/BN-1001/treatment-plans  #  Allowed
GET /api/v1/patients/BN-1002/treatment-plans  #  Allowed
GET /api/v1/patients/BN-1003/treatment-plans  #  Allowed
```

### VIEW_TREATMENT_PLAN_OWN

**Who has it**: Patient

**What they can do**:

- View **ONLY** their own treatment plans
- System automatically validates: `{patientCode}` must match current user's patient record

**Example**:

```bash
# Patient BN-1001 logged in
GET /api/v1/patients/BN-1001/treatment-plans  #  Allowed (own plan)
GET /api/v1/patients/BN-1002/treatment-plans  #  403 Forbidden (other patient)
```

### Permission Matrix

| User Role       | Permission              | Can View BN-1001? | Can View BN-1002? |
| --------------- | ----------------------- | ----------------- | ----------------- |
| Admin           | VIEW_TREATMENT_PLAN_ALL |  Yes            |  Yes            |
| Staff           | VIEW_TREATMENT_PLAN_ALL |  Yes            |  Yes            |
| Patient BN-1001 | VIEW_TREATMENT_PLAN_OWN |  Yes (own)      |  No             |
| Patient BN-1002 | VIEW_TREATMENT_PLAN_OWN |  No             |  Yes (own)      |

---

## Response Models

### TreatmentPlanSummaryDTO (Java)

```java
{
  patientPlanId: Long,
  planCode: String,           // Business key - REQUIRED for navigation
  planName: String,
  status: TreatmentPlanStatus,
  doctor: {
    employeeCode: String,
    fullName: String
  },
  startDate: LocalDate,       // Can be null
  expectedEndDate: LocalDate,
  totalCost: BigDecimal,
  discountAmount: BigDecimal,
  finalCost: BigDecimal,
  paymentType: PaymentType
}
```

### TreatmentPlanDetailResponse (Java)

```java
{
  planId: Long,
  planCode: String,
  planName: String,
  status: String,
  doctor: DoctorInfoDTO,
  patient: PatientInfoDTO,
  startDate: LocalDate,
  expectedEndDate: LocalDate,
  createdAt: LocalDateTime,
  totalPrice: BigDecimal,
  discountAmount: BigDecimal,
  finalCost: BigDecimal,
  paymentType: String,
  progressSummary: ProgressSummaryDTO,
  phases: List<PhaseDetailDTO>
}
```

---

## Testing Guide

### Test 1: List Plans with Pagination

**Seed Data**: Patient BN-1001 has 2 treatment plans

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans?page=0&size=10
Authorization: Bearer {admin_token}
```

**Verify**:

-  Status: 200 OK
-  `totalElements` = 2
-  `content` array has 2 items
-  Each item has `planCode` field
-  Each item has `doctor.employeeCode` and `doctor.fullName`

### Test 2: Get Plan Detail

**Seed Data**: Plan PLAN-20251001-001 exists with 3 phases

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans/PLAN-20251001-001
Authorization: Bearer {admin_token}
```

**Verify**:

-  Status: 200 OK
-  `planCode` = "PLAN-20251001-001"
-  `phases` array has items
-  Phase 1 `status` = "COMPLETED"
-  Phase 1 has 3 items, all `status` = "COMPLETED"
-  `progressSummary.completedPhases` >= 1

### Test 3: Patient Access Control (Own Plan - Success)

**Seed Data**: Patient BN-1001 logged in

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans
Authorization: Bearer {patient_bn1001_token}
```

**Verify**:

-  Status: 200 OK
-  Returns patient's own plans

### Test 4: Patient Access Control (Other Patient - Fail)

**Seed Data**: Patient BN-1001 logged in

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1002/treatment-plans
Authorization: Bearer {patient_bn1001_token}
```

**Verify**:

-  Status: 403 Forbidden
- Error: "Access denied - insufficient permissions"

### Test 5: Pagination

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans?page=0&size=2
Authorization: Bearer {admin_token}
```

**Verify**:

-  `size` = 2
-  `content` array has at most 2 items
-  `first` = true
-  `totalPages` calculated correctly

### Test 6: Sorting

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans?sort=createdAt,desc
Authorization: Bearer {admin_token}
```

**Verify**:

-  Items sorted by creation date (newest first)

### Test 7: Patient Not Found

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/INVALID-CODE/treatment-plans
Authorization: Bearer {admin_token}
```

**Verify**:

-  Status: 404 Not Found
- Error: "Patient not found"

### Test 8: Plan Not Found

**Request**:

```bash
GET http://localhost:8080/api/v1/patients/BN-1001/treatment-plans/INVALID-PLAN
Authorization: Bearer {admin_token}
```

**Verify**:

-  Status: 404 Not Found
- Error: "Treatment plan not found"

---

## Error Handling

### Common Errors

| HTTP | Error Code               | Description                                |
| ---- | ------------------------ | ------------------------------------------ |
| 404  | PATIENT_NOT_FOUND        | Patient code not found in database         |
| 404  | TREATMENT_PLAN_NOT_FOUND | Treatment plan code not found              |
| 403  | ACCESS_DENIED            | User trying to access other patient's plan |
| 401  | UNAUTHORIZED             | Missing or invalid JWT token               |

### Error Response Example

```json
{
  "type": "https://www.jhipster.tech/problem/problem-with-message",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access denied - insufficient permissions or accessing another patient's plan",
  "path": "/api/v1/patients/BN-1002/treatment-plans",
  "message": "error.ACCESS_DENIED"
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: Dental Clinic Development Team
**Verified Against**: TreatmentPlanController.java (lines 47-134), TreatmentPlanSummaryDTO.java, TreatmentPlanDetailResponse.java, dental-clinic-seed-data.sql
