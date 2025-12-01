# API 5.4 - Create Custom Treatment Plan

**Module**: Treatment Plan Management
**Version**: V1.0
**Status**:  Production Ready
**Last Updated**: 2025-11-12
**Source**: `TreatmentPlanController.java`, `CustomTreatmentPlanService.java`, `CreateCustomPlanRequest.java`

---

##  Table of Contents

1. [Overview](#overview)
2. [API Specification](#api-specification)
3. [Request Model](#request-model)
4. [Response Model](#response-model)
5. [Business Logic](#business-logic)
6. [Quantity Expansion](#quantity-expansion)
7. [Approval Workflow](#approval-workflow)
8. [Testing Guide](#testing-guide)
9. [Error Handling](#error-handling)

---

## Overview

API 5.4 creates a **custom treatment plan from scratch** without using templates. Doctor manually selects services, sets prices, defines phases, and specifies quantities.

**Key Features**:

-  **Quantity Expansion**: `quantity: 5` → creates 5 separate items
-  **Price Override**: Custom pricing (must be within 50%-150% of service default)
-  **Approval Workflow**: Created with `approval_status = DRAFT` (requires manager approval)
-  **Phase Duration**: Set `estimated_duration_days` for each phase
-  **Flexible Structure**: No template restrictions

**Use Case**: Doctor wants to create a unique treatment plan not covered by standard templates.

---

## API Specification

### Endpoint

```
POST /api/v1/patients/{patientCode}/treatment-plans/custom
```

### Path Parameters

| Parameter     | Type   | Required | Description           | Example |
| ------------- | ------ | -------- | --------------------- | ------- |
| `patientCode` | String | Yes      | Patient business code | BN-1001 |

### Request Headers

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Security & Permissions

**@PreAuthorize Annotation**:

```java
@PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('CREATE_TREATMENT_PLAN')")
```

**Allowed Roles**:

-  **Admin** - Full access (always allowed via `hasRole('ROLE_ADMIN')`)
-  **Manager** - Has `CREATE_TREATMENT_PLAN` permission
-  **Dentist** - Has `CREATE_TREATMENT_PLAN` permission
-  **Receptionist** - No permission (read-only access)
-  **Patient** - No permission

**Permission Check Logic**:

1. First checks if user has `ROLE_ADMIN` role → Immediate access
2. If not admin, checks if user has `CREATE_TREATMENT_PLAN` authority
3. Returns `403 Forbidden` if neither condition is met

**Note**: Custom plans are created with `approval_status=DRAFT` and require manager approval before activation.

### Request Body

```json
{
  "planName": "Lộ trình niềng răng tùy chỉnh (6 tháng)",
  "doctorEmployeeCode": "EMP-001",
  "discountAmount": 0,
  "paymentType": "INSTALLMENT",
  "startDate": null,
  "expectedEndDate": null,
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Giai đoạn 1: Khám và Chuẩn bị",
      "estimatedDurationDays": 7,
      "items": [
        {
          "serviceCode": "EXAM_GENERAL",
          "price": 500000,
          "sequenceNumber": 1,
          "quantity": 1
        },
        {
          "serviceCode": "SCALE_CLEAN",
          "price": 800000,
          "sequenceNumber": 2,
          "quantity": 1
        }
      ]
    },
    {
      "phaseNumber": 2,
      "phaseName": "Giai đoạn 2: Điều chỉnh định kỳ",
      "estimatedDurationDays": 180,
      "items": [
        {
          "serviceCode": "ORTHO_ADJUST",
          "price": 500000,
          "sequenceNumber": 1,
          "quantity": 6
        }
      ]
    }
  ]
}
```

### Complete Example Request

```bash
curl -X POST "http://localhost:8080/api/v1/patients/BN-1001/treatment-plans/custom" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "Lộ trình niềng răng tùy chỉnh (6 tháng)",
    "doctorEmployeeCode": "EMP-001",
    "discountAmount": 0,
    "paymentType": "INSTALLMENT",
    "startDate": null,
    "expectedEndDate": null,
    "phases": [
      {
        "phaseNumber": 1,
        "phaseName": "Giai đoạn 1: Khám và Chuẩn bị",
        "estimatedDurationDays": 7,
        "items": [
          {
            "serviceCode": "EXAM_GENERAL",
            "price": 500000,
            "sequenceNumber": 1,
            "quantity": 1
          }
        ]
      },
      {
        "phaseNumber": 2,
        "phaseName": "Giai đoạn 2: Điều chỉnh",
        "estimatedDurationDays": 180,
        "items": [
          {
            "serviceCode": "ORTHO_ADJUST",
            "price": 500000,
            "sequenceNumber": 1,
            "quantity": 6
          }
        ]
      }
    ]
  }'
```

---

## Request Model

### CreateCustomPlanRequest

| Field                | Type       | Required | Constraints               | Description                              |
| -------------------- | ---------- | -------- | ------------------------- | ---------------------------------------- |
| `planName`           | String     | **Yes**  | Max 255 chars, not blank  | Custom plan name                         |
| `doctorEmployeeCode` | String     | **Yes**  | Not blank                 | Doctor in charge                         |
| `discountAmount`     | BigDecimal | **Yes**  | >= 0                      | Discount amount (default 0)              |
| `paymentType`        | String     | **Yes**  | FULL, PHASED, INSTALLMENT | Payment method                           |
| `startDate`          | Date       | No       | -                         | Start date (optional, null for DRAFT)    |
| `expectedEndDate`    | Date       | No       | -                         | Expected end (optional, auto-calculated) |
| `phases`             | Array      | **Yes**  | Min 1 phase               | List of phases                           |

### PhaseRequest

| Field                   | Type    | Required | Constraints              | Description                 |
| ----------------------- | ------- | -------- | ------------------------ | --------------------------- |
| `phaseNumber`           | Integer | **Yes**  | >= 1, unique within plan | Phase number (1, 2, 3, ...) |
| `phaseName`             | String  | **Yes**  | Max 255 chars, not blank | Phase name                  |
| `estimatedDurationDays` | Integer | No       | >= 0                     | Estimated duration in days  |
| `items`                 | Array   | **Yes**  | Min 1 item               | List of items in this phase |

### ItemRequest

| Field            | Type       | Required | Constraints              | Description                                |
| ---------------- | ---------- | -------- | ------------------------ | ------------------------------------------ |
| `serviceCode`    | String     | **Yes**  | Must exist and be active | Service code from `dental_services` table  |
| `price`          | BigDecimal | **Yes**  | > 0                      | Custom price for this item                 |
| `sequenceNumber` | Integer    | **Yes**  | >= 1                     | Sequence within phase                      |
| `quantity`       | Integer    | **Yes**  | 1-100                    | **Key feature**: Number of items to create |

### Field Validations

#### planName

- Must not be blank
- Max 255 characters
- Example: "Lộ trình niềng răng tùy chỉnh (6 tháng)"

#### doctorEmployeeCode

- Must exist in `employees` table
- Employee must be active
- Example: "EMP-001"

#### phases

- Must have at least 1 phase
- Phase numbers must be unique (no duplicates)
- Each phase must have at least 1 item

#### serviceCode

- Must exist in `dental_services` table
- Service must be active (`is_active = true`)
- Example: "ORTHO_ADJUST", "EXAM_GENERAL"

#### price (Price Override)

- **Validation**: Must be within **50%-150%** of service default price
- If service default price = 1,000,000đ:
  -  Allowed: 500,000đ to 1,500,000đ
  -  Rejected: 400,000đ (too low) or 2,000,000đ (too high)

#### quantity (Quantity Expansion)

- Min: 1
- Max: 100 (prevent abuse)
- Creates multiple `patient_plan_items` with auto-incremented names

---

## Response Model

### Response (201 CREATED)

Same structure as **API 5.2 - TreatmentPlanDetailResponse**

**Key Differences from Template Plans**:

-  `approval_status` = **"DRAFT"** (not APPROVED)
-  `status` = "PENDING" (not started yet)
-  `startDate` = null (will be set when plan is activated)

```json
{
  "planId": 12,
  "planCode": "PLAN-20251112-002",
  "planName": "Lộ trình niềng răng tùy chỉnh (6 tháng)",
  "status": "PENDING",
  "doctor": {
    "employeeCode": "EMP-001",
    "fullName": "Bác sĩ Nguyễn Văn A"
  },
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Đoàn Thanh Phong"
  },
  "startDate": null,
  "expectedEndDate": null,
  "createdAt": "2025-11-12T14:30:00",
  "totalPrice": 3800000,
  "discountAmount": 0,
  "finalCost": 3800000,
  "paymentType": "INSTALLMENT",
  "progressSummary": {
    "totalPhases": 2,
    "completedPhases": 0,
    "totalItems": 8,
    "completedItems": 0,
    "progressPercentage": 0.0
  },
  "phases": [
    {
      "patientPhaseId": 103,
      "phaseNumber": 1,
      "phaseName": "Giai đoạn 1: Khám và Chuẩn bị",
      "status": "PENDING",
      "startDate": null,
      "completionDate": null,
      "estimatedDurationDays": 7,
      "items": [
        {
          "itemId": 301,
          "sequenceNumber": 1,
          "itemName": "Khám tổng quát",
          "status": "PENDING",
          "estimatedTimeMinutes": 30,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 302,
          "sequenceNumber": 2,
          "itemName": "Lấy cao răng",
          "status": "PENDING",
          "estimatedTimeMinutes": 45,
          "price": 800000,
          "completedAt": null,
          "linkedAppointments": []
        }
      ]
    },
    {
      "patientPhaseId": 104,
      "phaseNumber": 2,
      "phaseName": "Giai đoạn 2: Điều chỉnh định kỳ",
      "status": "PENDING",
      "startDate": null,
      "completionDate": null,
      "estimatedDurationDays": 180,
      "items": [
        {
          "itemId": 303,
          "sequenceNumber": 1,
          "itemName": "Điều chỉnh niềng răng (Lần 1)",
          "status": "PENDING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 304,
          "sequenceNumber": 2,
          "itemName": "Điều chỉnh niềng răng (Lần 2)",
          "status": "PENDING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 305,
          "sequenceNumber": 3,
          "itemName": "Điều chỉnh niềng răng (Lần 3)",
          "status": "PENDING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 306,
          "sequenceNumber": 4,
          "itemName": "Điều chỉnh niềng răng (Lần 4)",
          "status": "PENDING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 307,
          "sequenceNumber": 5,
          "itemName": "Điều chỉnh niềng răng (Lần 5)",
          "status": "PENDING",
          "estimatedTimeMinutes": 45,
          "price": 500000,
          "completedAt": null,
          "linkedAppointments": []
        },
        {
          "itemId": 308,
          "sequenceNumber": 6,
          "itemName": "Điều chỉnh niềng răng (Lần 6)",
          "status": "PENDING",
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

**Notice**:

- Phase 2 has `quantity: 6` → Created **6 items** (Lần 1, Lần 2, ..., Lần 6)
- Total items = 2 (phase 1) + 6 (phase 2) = 8 items

---

## Business Logic

### Step 1: Validate Input

```java
// Validate patient
Patient patient = patientRepository.findByPatientCode(patientCode)
  .orElseThrow(() -> new NotFoundException("PATIENT_NOT_FOUND"));

if (!patient.getIsActive()) {
  throw new BadRequestException("PATIENT_INACTIVE");
}

// Validate doctor
Employee doctor = employeeRepository.findByEmployeeCode(doctorEmployeeCode)
  .orElseThrow(() -> new NotFoundException("EMPLOYEE_NOT_FOUND"));

if (!doctor.getIsActive()) {
  throw new BadRequestException("EMPLOYEE_INACTIVE");
}
```

### Step 2: Validate Phases

```java
// Check phase numbers are unique
Set<Integer> phaseNumbers = new HashSet<>();
for (PhaseRequest phase : request.getPhases()) {
  if (!phaseNumbers.add(phase.getPhaseNumber())) {
    throw new BadRequestException("DUPLICATE_PHASE_NUMBER: " + phase.getPhaseNumber());
  }
}

// Check each phase has at least 1 item
for (PhaseRequest phase : request.getPhases()) {
  if (phase.getItems().isEmpty()) {
    throw new BadRequestException("PHASE_HAS_NO_ITEMS: Phase " + phase.getPhaseNumber());
  }
}
```

### Step 3: Validate Services and Prices

```java
for (PhaseRequest phase : request.getPhases()) {
  for (ItemRequest item : phase.getItems()) {
    // Validate service exists
    DentalService service = serviceRepository.findByServiceCode(item.getServiceCode())
      .orElseThrow(() -> new NotFoundException("SERVICE_NOT_FOUND: " + item.getServiceCode()));

    if (!service.getIsActive()) {
      throw new BadRequestException("SERVICE_INACTIVE: " + item.getServiceCode());
    }

    // Validate price override (50%-150% of default price)
    BigDecimal defaultPrice = service.getPrice();
    BigDecimal minPrice = defaultPrice.multiply(new BigDecimal("0.5"));
    BigDecimal maxPrice = defaultPrice.multiply(new BigDecimal("1.5"));

    if (item.getPrice().compareTo(minPrice) < 0 || item.getPrice().compareTo(maxPrice) > 0) {
      throw new BadRequestException(
        String.format("PRICE_OUT_OF_RANGE: Service %s (default: %s, allowed: %s-%s, given: %s)",
          item.getServiceCode(), defaultPrice, minPrice, maxPrice, item.getPrice())
      );
    }
  }
}
```

### Step 4: Create Plan Entity

```java
String planCode = planCodeGenerator.generatePlanCode();

PatientTreatmentPlan plan = PatientTreatmentPlan.builder()
  .planCode(planCode)
  .planName(request.getPlanName())
  .patient(patient)
  .createdBy(doctor)
  .status(TreatmentPlanStatus.PENDING)
  .approvalStatus(ApprovalStatus.DRAFT) // V19: Custom plans need approval
  .paymentType(request.getPaymentType())
  .startDate(request.getStartDate()) // Usually null for DRAFT
  .expectedEndDate(request.getExpectedEndDate())
  .build();

plan = planRepository.save(plan);
```

### Step 5: Create Phases and Items (with Quantity Expansion)

```java
BigDecimal totalCost = BigDecimal.ZERO;

for (PhaseRequest phaseRequest : request.getPhases()) {
  // Create phase
  PatientPlanPhase phase = PatientPlanPhase.builder()
    .plan(plan)
    .phaseNumber(phaseRequest.getPhaseNumber())
    .phaseName(phaseRequest.getPhaseName())
    .estimatedDurationDays(phaseRequest.getEstimatedDurationDays())
    .status(PhaseStatus.PENDING)
    .build();
  phase = phaseRepository.save(phase);

  // Create items with quantity expansion
  int sequenceCounter = 1;
  for (ItemRequest itemRequest : phaseRequest.getItems()) {
    DentalService service = serviceRepository.findByServiceCode(itemRequest.getServiceCode()).get();
    int quantity = itemRequest.getQuantity();

    // QUANTITY EXPANSION LOGIC
    for (int i = 1; i <= quantity; i++) {
      PatientPlanItem item = PatientPlanItem.builder()
        .phase(phase)
        .service(service)
        .sequenceNumber(sequenceCounter++)
        .itemName(generateItemName(service.getServiceName(), quantity, i))
        .status(PlanItemStatus.PENDING)
        .price(itemRequest.getPrice())
        .estimatedTimeMinutes(service.getEstimatedTimeMinutes())
        .build();

      itemRepository.save(item);
      totalCost = totalCost.add(itemRequest.getPrice());
    }
  }
}
```

### Step 6: Calculate Final Cost

```java
BigDecimal discount = request.getDiscountAmount();
if (discount.compareTo(totalCost) > 0) {
  throw new BadRequestException("DISCOUNT_EXCEEDS_TOTAL");
}

BigDecimal finalCost = totalCost.subtract(discount);

// Update plan
plan.setTotalPrice(totalCost);
plan.setDiscountAmount(discount);
plan.setFinalCost(finalCost);
planRepository.save(plan);
```

---

## Quantity Expansion

### Example 1: Single Item (quantity = 1)

**Request**:

```json
{
  "serviceCode": "EXAM_GENERAL",
  "price": 500000,
  "sequenceNumber": 1,
  "quantity": 1
}
```

**Result**: 1 item created

- `itemName`: "Khám tổng quát"
- No suffix because quantity = 1

### Example 2: Multiple Items (quantity = 6)

**Request**:

```json
{
  "serviceCode": "ORTHO_ADJUST",
  "price": 500000,
  "sequenceNumber": 1,
  "quantity": 6
}
```

**Result**: 6 items created

1. `itemName`: "Điều chỉnh niềng răng (Lần 1)"
2. `itemName`: "Điều chỉnh niềng răng (Lần 2)"
3. `itemName`: "Điều chỉnh niềng răng (Lần 3)"
4. `itemName`: "Điều chỉnh niềng răng (Lần 4)"
5. `itemName`: "Điều chỉnh niềng răng (Lần 5)"
6. `itemName`: "Điều chỉnh niềng răng (Lần 6)"

All items have same price (500,000đ) but are tracked separately.

### Item Name Generation Logic

```java
String generateItemName(String serviceName, int quantity, int currentIndex) {
  if (quantity > 1) {
    return serviceName + " (Lần " + currentIndex + ")";
  } else {
    return serviceName;
  }
}
```

---

## Approval Workflow

### Status Flow

```
1. Plan Created
   ↓
   status = PENDING
   approval_status = DRAFT

2. Submit for Approval (Future API)
   ↓
   approval_status = PENDING_APPROVAL

3. Manager Approves (Future API)
   ↓
   approval_status = APPROVED

4. Plan Can Start
   ↓
   status = IN_PROGRESS
```

### Current Behavior (V19)

- **Created**: `approval_status = DRAFT`
- **Required Permission**: `CREATE_TREATMENT_PLAN` (Doctor, Manager)
- **Next Step**: Manager must approve via separate API (not yet implemented)
- **Difference from Template Plans**: Template plans are auto-approved (`APPROVED`), custom plans require manual approval (`DRAFT`)

---

## Testing Guide

### Test 1: Create Custom Plan (Basic)

**Request**:

```bash
POST http://localhost:8080/api/v1/patients/BN-1001/treatment-plans/custom

{
  "planName": "Lộ trình điều trị tủy",
  "doctorEmployeeCode": "EMP-001",
  "discountAmount": 0,
  "paymentType": "FULL",
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Giai đoạn 1: Điều trị",
      "estimatedDurationDays": 7,
      "items": [
        {
          "serviceCode": "ENDO_ROOT",
          "price": 2000000,
          "sequenceNumber": 1,
          "quantity": 1
        }
      ]
    }
  ]
}
```

**Expected**:

-  Status: 201 CREATED
-  `planCode`: Auto-generated (PLAN-YYYYMMDD-XXX)
-  `approval_status`: "DRAFT"
-  `status`: "PENDING"
-  `totalPrice`: 2000000
-  `phases`: 1 phase
-  `items`: 1 item

### Test 2: Quantity Expansion

**Request**:

```json
{
  "planName": "Lộ trình niềng răng",
  "doctorEmployeeCode": "EMP-001",
  "discountAmount": 0,
  "paymentType": "INSTALLMENT",
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Điều chỉnh định kỳ",
      "estimatedDurationDays": 180,
      "items": [
        {
          "serviceCode": "ORTHO_ADJUST",
          "price": 500000,
          "sequenceNumber": 1,
          "quantity": 6
        }
      ]
    }
  ]
}
```

**Expected**:

-  `totalPrice`: 3000000 (500000 × 6)
-  Phase 1 has **6 items**:
  - "Điều chỉnh niềng răng (Lần 1)"
  - "Điều chỉnh niềng răng (Lần 2)"
  - ...
  - "Điều chỉnh niềng răng (Lần 6)"

### Test 3: Price Override Validation (Success)

**Setup**: Service "EXAM_GENERAL" default price = 500,000đ

**Request**:

```json
{
  "serviceCode": "EXAM_GENERAL",
  "price": 600000,
  "sequenceNumber": 1,
  "quantity": 1
}
```

**Expected**:

-  Accepted (600,000 is within 250,000 - 750,000 range)

### Test 4: Price Override Validation (Fail - Too Low)

**Request**:

```json
{
  "serviceCode": "EXAM_GENERAL",
  "price": 200000,
  "sequenceNumber": 1,
  "quantity": 1
}
```

**Expected**:

-  Status: 400 BAD REQUEST
- Error: "PRICE_OUT_OF_RANGE" (200,000 < 250,000)

### Test 5: Duplicate Phase Numbers

**Request**:

```json
{
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Phase 1",
      "items": [...]
    },
    {
      "phaseNumber": 1,
      "phaseName": "Phase 1 again",
      "items": [...]
    }
  ]
}
```

**Expected**:

-  Status: 400 BAD REQUEST
- Error: "DUPLICATE_PHASE_NUMBER: 1"

### Test 6: Empty Phase (No Items)

**Request**:

```json
{
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Phase 1",
      "items": []
    }
  ]
}
```

**Expected**:

-  Status: 400 BAD REQUEST
- Error: "PHASE_HAS_NO_ITEMS: Phase 1"

---

## Error Handling

### Common Errors

| HTTP | Error Code             | Description                                        |
| ---- | ---------------------- | -------------------------------------------------- |
| 404  | PATIENT_NOT_FOUND      | Patient code not found                             |
| 404  | EMPLOYEE_NOT_FOUND     | Doctor employee code not found                     |
| 404  | SERVICE_NOT_FOUND      | Service code not found                             |
| 400  | PATIENT_INACTIVE       | Patient account is inactive                        |
| 400  | EMPLOYEE_INACTIVE      | Doctor account is inactive                         |
| 400  | SERVICE_INACTIVE       | Service is inactive                                |
| 400  | DUPLICATE_PHASE_NUMBER | Phase numbers must be unique                       |
| 400  | PHASE_HAS_NO_ITEMS     | Each phase must have at least 1 item               |
| 400  | PRICE_OUT_OF_RANGE     | Price not within 50%-150% of service default       |
| 400  | DISCOUNT_EXCEEDS_TOTAL | Discount amount > total price                      |
| 403  | ACCESS_DENIED          | User doesn't have CREATE_TREATMENT_PLAN permission |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: Dental Clinic Development Team
**Verified Against**: TreatmentPlanController.java (lines 220-270), CustomTreatmentPlanService.java, CreateCustomPlanRequest.java
