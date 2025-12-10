# API 8.1: Get Clinical Record for Appointment

## Overview

Retrieve the clinical record for a specific appointment, including diagnosis, vital signs, procedures performed, prescriptions issued, and complete metadata (appointment details, doctor info, patient info).

## Endpoint

```
GET /api/v1/appointments/{appointmentId}/clinical-record
```

## Authorization

Required Permissions (OR logic):

- `ROLE_ADMIN` - Full access to all clinical records
- `VIEW_APPOINTMENT_ALL` - View all clinical records (Receptionist, Manager)
- `VIEW_APPOINTMENT_OWN` - View only related records (Doctor, Patient, Observer)

### RBAC Rules

1. **Admin**: Can access all clinical records
2. **VIEW_APPOINTMENT_ALL** (Receptionist/Manager): Can access all clinical records
3. **VIEW_APPOINTMENT_OWN**:
   - **Doctor**: Can only view clinical records for appointments where they are the primary doctor
   - **Patient**: Can only view clinical records for their own appointments
   - **Observer/Nurse**: (TODO) Can view clinical records for appointments where they are participants

## Request

### Path Parameters

| Parameter     | Type    | Required | Description        |
| ------------- | ------- | -------- | ------------------ |
| appointmentId | Integer | Yes      | The appointment ID |

### Example Requests

```bash
# As Admin - View any clinical record
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{admin_token}}"

# As Doctor - View own appointment's clinical record
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{khoa_token}}"

# As Patient - View own appointment's clinical record
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{patient_token}}"
```

## Response

### Success Response (200 OK)

```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "clinicalRecordId": 1,
    "diagnosis": "Gingivitis (Viêm lợi) + Dental calculus (Cao răng)",
    "vitalSigns": {
      "blood_pressure": "120/80",
      "heart_rate": "72",
      "temperature": "36.5"
    },
    "chiefComplaint": "Đau nhức và chảy máu lợi khi đánh răng, cảm giác răng ố vàng",
    "examinationFindings": "Lợi sưng đỏ, có nhiều mảng cao răng, không có sâu răng",
    "treatmentNotes": "Đã thực hiện lấy cao răng (scaling), hướng dẫn cách đánh răng đúng cách",
    "createdAt": "2025-11-04 09:45:00",
    "updatedAt": "2025-11-04 09:45:00",
    "appointment": {
      "appointmentId": 1,
      "appointmentCode": "APT-20251104-001",
      "roomId": "GHE251103001",
      "appointmentStartTime": "2025-11-04 09:00:00",
      "appointmentEndTime": "2025-11-04 09:45:00",
      "expectedDurationMinutes": 45,
      "status": "COMPLETED",
      "notes": "Khám tổng quát + Lấy cao răng"
    },
    "doctor": {
      "employeeId": 1,
      "employeeCode": "EMP001",
      "fullName": "Lê Anh Khoa",
      "phone": "0901234567",
      "email": "khoa.la@dentalclinic.com"
    },
    "patient": {
      "patientId": 1,
      "patientCode": "BN-1001",
      "fullName": "Đoàn Thanh Phong",
      "phone": "0987654321",
      "email": "phong.dt@gmail.com",
      "dateOfBirth": "1995-05-15",
      "gender": "MALE"
    },
    "procedures": [
      {
        "procedureId": 1,
        "serviceCode": "GEN_EXAM",
        "serviceName": "Khám tổng quát răng miệng",
        "patientPlanItemId": null,
        "toothNumber": null,
        "procedureDescription": "Khám tổng quát răng miệng",
        "notes": "Bệnh nhân không có sâu răng",
        "createdAt": "2025-11-04 09:45:00"
      },
      {
        "procedureId": 2,
        "serviceCode": "SCALING_L1",
        "serviceName": "Lấy cao răng (Level 1)",
        "patientPlanItemId": null,
        "toothNumber": null,
        "procedureDescription": "Lấy cao răng (Scaling Level 1)",
        "notes": "Đã lấy cao răng toàn hàm",
        "createdAt": "2025-11-04 09:45:00"
      }
    ],
    "prescriptions": [
      {
        "prescriptionId": 1,
        "prescriptionNotes": "Thuốc súc miệng và giảm đau",
        "createdAt": "2025-11-04 09:45:00",
        "items": [
          {
            "prescriptionItemId": 1,
            "itemCode": "MED-MW-01",
            "itemName": "Nước súc miệng Listerine",
            "quantity": 1,
            "dosageInstructions": "Súc miệng 2 lần/ngày sau khi đánh răng",
            "createdAt": "2025-11-04 09:45:00"
          },
          {
            "prescriptionItemId": 2,
            "itemCode": "MED-PARA-01",
            "itemName": "Paracetamol 500mg",
            "quantity": 10,
            "dosageInstructions": "Uống 1 viên khi đau, cách 4-6 giờ, tối đa 3 viên/ngày",
            "createdAt": "2025-11-04 09:45:00"
          }
        ]
      }
    ]
  }
}
```

### Error Responses

#### 404 RECORD_NOT_FOUND - No Clinical Record

When an appointment exists but has no clinical record yet. Frontend should display a CREATE form.

```json
{
  "type": "https://api.dentalclinic.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Clinical record not found for appointment ID: 5",
  "errorCode": "RECORD_NOT_FOUND"
}
```

#### 404 APPOINTMENT_NOT_FOUND - Appointment Doesn't Exist

```json
{
  "type": "https://api.dentalclinic.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Appointment not found with ID: 999",
  "errorCode": "APPOINTMENT_NOT_FOUND"
}
```

#### 403 Access Denied - User Not Authorized

```json
{
  "timestamp": "2025-11-04T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You can only view clinical records for appointments where you are the primary doctor",
  "path": "/api/v1/appointments/2/clinical-record"
}
```

## Test Cases

### Prerequisites

1. Start backend server
2. Obtain authentication tokens:
   - Admin token: Login as `admin`
   - Doctor token (EMP001): Login as `khoa.la`
   - Doctor token (EMP002): Login as `huy.nguyen`
   - Patient token (BN-1001): Login as patient account for Đoàn Thanh Phong

### Test Case 1: Admin Views Clinical Record (SUCCESS)

**Description**: Admin can view any clinical record

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{admin_token}}"
```

**Expected Result**:

- HTTP Status: 200 OK
- Response contains full clinical record with nested appointment, doctor, patient, procedures, prescriptions
- `clinicalRecordId`: 1
- `diagnosis`: "Gingivitis (Viêm lợi) + Dental calculus (Cao răng)"
- `procedures`: Array with 2 items (GEN_EXAM, SCALING_L1)
- `prescriptions`: Array with 1 item containing 2 medicines

### Test Case 2: Doctor Views Own Appointment's Clinical Record (SUCCESS)

**Description**: Doctor EMP001 (Lê Anh Khoa) views clinical record for their own appointment

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{khoa_token}}"
```

**Pre-condition**:

- Appointment ID 1 has `employee_id = 1` (EMP001 - Lê Anh Khoa)
- User `khoa.la` maps to `employee_id = 1`

**Expected Result**:

- HTTP Status: 200 OK
- Same response as Test Case 1
- Log should show: "Employee 1 is the primary doctor for appointment 1"

### Test Case 3: Doctor Attempts to View Another Doctor's Clinical Record (FORBIDDEN)

**Description**: Doctor EMP001 attempts to view clinical record for EMP002's appointment

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/2/clinical-record" \
  -H "Authorization: Bearer {{khoa_token}}"
```

**Pre-condition**:

- Appointment ID 2 has `employee_id = 2` (EMP002 - Nguyễn Văn Huy)
- User `khoa.la` maps to `employee_id = 1` (not the primary doctor)

**Expected Result**:

- HTTP Status: 403 Forbidden
- Error message: "You can only view clinical records for appointments where you are the primary doctor"
- Log should show: "Employee 1 is not the primary doctor for appointment 2"

### Test Case 4: Patient Views Own Clinical Record (SUCCESS)

**Description**: Patient BN-1001 views their own clinical record

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{patient_bn1001_token}}"
```

**Pre-condition**:

- Appointment ID 1 has `patient_id = 1` (BN-1001 - Đoàn Thanh Phong)
- Patient token belongs to `patient_id = 1`

**Expected Result**:

- HTTP Status: 200 OK
- Same response as Test Case 1
- Log should show: "Patient 1 is the owner of appointment 1"

### Test Case 5: Patient Attempts to View Another Patient's Clinical Record (FORBIDDEN)

**Description**: Patient BN-1001 attempts to view clinical record for patient BN-1002

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/2/clinical-record" \
  -H "Authorization: Bearer {{patient_bn1001_token}}"
```

**Pre-condition**:

- Appointment ID 2 has `patient_id = 2` (BN-1002 - Nguyễn Văn B)
- Patient token belongs to `patient_id = 1` (not the owner)

**Expected Result**:

- HTTP Status: 403 Forbidden
- Error message: "You can only view clinical records for your own appointments"
- Log should show: "Patient 1 is not the owner of appointment 2"

### Test Case 6: Clinical Record Not Found (404)

**Description**: Appointment exists but has no clinical record yet

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/5/clinical-record" \
  -H "Authorization: Bearer {{admin_token}}"
```

**Pre-condition**:

- Appointment ID 5 exists in database
- No clinical record linked to appointment ID 5

**Expected Result**:

- HTTP Status: 404 Not Found
- Error code: "RECORD_NOT_FOUND"
- Error message: "Clinical record not found for appointment ID: 5"
- Frontend should display CREATE clinical record form

### Test Case 7: Appointment Not Found (404)

**Description**: Appointment doesn't exist

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/999/clinical-record" \
  -H "Authorization: Bearer {{admin_token}}"
```

**Expected Result**:

- HTTP Status: 404 Not Found
- Error code: "APPOINTMENT_NOT_FOUND"
- Error message: "Appointment not found with ID: 999"

### Test Case 8: Clinical Record with Treatment Plan Link (SUCCESS)

**Description**: View clinical record with procedure linked to treatment plan

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/3/clinical-record" \
  -H "Authorization: Bearer {{admin_token}}"
```

**Expected Result**:

- HTTP Status: 200 OK
- `clinicalRecordId`: 3
- `diagnosis`: "Orthodontic treatment progress check"
- `procedures`: Contains item with `patientPlanItemId`: 1 (linked to treatment plan)
- `prescriptions`: Empty array (orthodontic follow-up doesn't need medicine)

### Test Case 9: Receptionist Views Clinical Record (SUCCESS)

**Description**: Receptionist with VIEW_APPOINTMENT_ALL can view any clinical record

**Request**:

```bash
curl -X GET "http://localhost:8080/api/v1/appointments/1/clinical-record" \
  -H "Authorization: Bearer {{receptionist_token}}"
```

**Pre-condition**:

- User has `VIEW_APPOINTMENT_ALL` permission

**Expected Result**:

- HTTP Status: 200 OK
- Same response as Test Case 1
- Log should show: "User {{receptionist}} has VIEW_APPOINTMENT_ALL, can access all clinical records"

## Business Rules

1. **1-to-1 Relationship**: Each appointment can have at most ONE clinical record
2. **No Workflow States**: Clinical records are "write once, query many" - no PENDING/VALIDATED states
3. **Flexible Vital Signs**: `vital_signs` is JSONB field, can contain any health metrics
4. **Optional Links**:
   - Procedures may or may not link to services (`service_id` nullable)
   - Procedures may link to treatment plan items (`patient_plan_item_id` nullable)
   - Prescription items may or may not link to inventory (`item_master_id` nullable)
5. **Authorization**: Clinical record access follows appointment access rules

## Data Model

### Clinical Record Fields

| Field               | Type     | Description                                                          |
| ------------------- | -------- | -------------------------------------------------------------------- |
| clinicalRecordId    | Integer  | Primary key (auto-increment)                                         |
| diagnosis           | String   | Doctor's diagnosis (e.g., "Gingivitis + Dental calculus")            |
| vitalSigns          | JSONB    | Flexible vital signs (blood pressure, heart rate, temperature, etc.) |
| chiefComplaint      | String   | Patient-reported symptoms (main reason for visit)                    |
| examinationFindings | String   | Doctor's observations during examination                             |
| treatmentNotes      | String   | Treatment performed and recommendations                              |
| createdAt           | DateTime | Record creation timestamp                                            |
| updatedAt           | DateTime | Record last update timestamp                                         |

### Nested Objects

- **appointment**: Appointment metadata (code, room, times, status, notes)
- **doctor**: Primary doctor info (employee code, name, contact)
- **patient**: Patient info (patient code, name, contact, DOB, gender)
- **procedures**: Array of procedures performed (with service links)
- **prescriptions**: Array of prescriptions issued (with medicine items)

## Frontend Integration

### Display Logic

1. **Load Clinical Record**: Call GET API on page load
2. **Handle 404 RECORD_NOT_FOUND**: Show "CREATE Clinical Record" button
3. **Handle 404 APPOINTMENT_NOT_FOUND**: Show "Appointment not found" error
4. **Handle 403 Forbidden**: Show "Access Denied" message
5. **Display Nested Data**:
   - Show appointment details at top (code, date/time, room, status)
   - Show doctor and patient info
   - List procedures with service names
   - List prescriptions with dosage instructions

### Example UI Flow

```javascript
async function loadClinicalRecord(appointmentId) {
  try {
    const response = await fetch(
      `/api/v1/appointments/${appointmentId}/clinical-record`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.status === 404) {
      const error = await response.json();
      if (error.errorCode === "RECORD_NOT_FOUND") {
        showCreateButton(); // Appointment exists but no record yet
      } else {
        showError("Appointment not found");
      }
      return;
    }

    if (response.status === 403) {
      showError("You do not have permission to view this clinical record");
      return;
    }

    const data = await response.json();
    displayClinicalRecord(data.result);
  } catch (error) {
    showError("Failed to load clinical record");
  }
}

function displayClinicalRecord(record) {
  // Show appointment info
  document.getElementById("appointmentCode").innerText =
    record.appointment.appointmentCode;
  document.getElementById("appointmentDate").innerText =
    record.appointment.appointmentStartTime;

  // Show doctor info
  document.getElementById("doctorName").innerText = record.doctor.fullName;

  // Show patient info
  document.getElementById("patientName").innerText = record.patient.fullName;

  // Show diagnosis
  document.getElementById("diagnosis").innerText = record.diagnosis;

  // Show vital signs
  if (record.vitalSigns) {
    document.getElementById("bloodPressure").innerText =
      record.vitalSigns.blood_pressure;
    document.getElementById("heartRate").innerText =
      record.vitalSigns.heart_rate;
  }

  // Show procedures
  record.procedures.forEach((proc) => {
    addProcedureRow(proc.serviceName, proc.procedureDescription, proc.notes);
  });

  // Show prescriptions
  record.prescriptions.forEach((presc) => {
    presc.items.forEach((item) => {
      addPrescriptionRow(item.itemName, item.quantity, item.dosageInstructions);
    });
  });
}
```

## Notes

- This API is READ-ONLY (GET method)
- CREATE/UPDATE clinical record APIs will be implemented in future tickets
- Participant validation (Observer/Nurse) is TODO - currently only primary doctor can view
- All timestamps are returned in `yyyy-MM-dd HH:mm:ss` format
- Date of birth is returned in `yyyy-MM-dd` format
