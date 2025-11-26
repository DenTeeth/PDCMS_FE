# BE-403 Appointment Management API

Base URL: /api/v1/appointments
Auth: Bearer Token
Permissions: CREATE_APPOINTMENT, VIEW_APPOINTMENT_ALL, VIEW_APPOINTMENT_OWN

---

##  **PROGRESSIVE BOOKING FLOW** (Recommended for FE)

**Problem:** Old flow forced receptionist to "guess" all 5 parameters (Doctor, Room, Time, Assistants, Services) upfront, leading to validation errors at the final step (e.g., "Doctor not qualified", "Patient has conflict").

**Solution:** Progressive Discovery - FE calls 3 lightweight APIs first to guide receptionist step-by-step, then calls the final validation API.

### **Flow Diagram**

```
Step 1: Receptionist selects Patient + Services + Date
   ↓
Step 2: GET /api/v1/availability/doctors → FE shows ONLY qualified doctors with shifts
   ↓
Step 3: GET /api/v1/availability/slots → FE shows ONLY available time slots
   ↓
Step 4: GET /api/v1/availability/resources → FE shows ONLY available rooms + assistants
   ↓
Step 5: POST /api/v1/appointments → Final validation + Create appointment
```

### **Why This Works**

 **Faster UX**: Receptionist never sees invalid options
 **Less Errors**: 99% of POST requests succeed (validation already done)
 **Backward Compatible**: Old `GET /available-times` API still works
 **Progressive Disclosure**: Each step narrows down choices

---

##  API SUMMARY

### **NEW: Availability APIs (Progressive Flow)**

| Endpoint                  | Method | Permission         | Description                                    |
| ------------------------- | ------ | ------------------ | ---------------------------------------------- |
| `/availability/doctors`   | GET    | CREATE_APPOINTMENT | **Step 2**: Bác sĩ có chuyên môn + ca làm việc |
| `/availability/slots`     | GET    | CREATE_APPOINTMENT | **Step 3**: Khe giờ trống của bác sĩ           |
| `/availability/resources` | GET    | CREATE_APPOINTMENT | **Step 4**: Phòng + Phụ tá rảnh                |

### **Main Appointment APIs**

| Endpoint                    | Method | Permission                                     | Description                                 |
| --------------------------- | ------ | ---------------------------------------------- | ------------------------------------------- |
| `/available-times`          | GET    | CREATE_APPOINTMENT                             | ️ Legacy: Tìm slot (all-in-one)            |
| `/`                         | POST   | CREATE_APPOINTMENT                             | **Step 5**: Tạo lịch hẹn (final validation) |
| `/`                         | GET    | VIEW_APPOINTMENT_ALL hoặc VIEW_APPOINTMENT_OWN | Dashboard - Danh sách lịch hẹn              |
| `/{appointmentCode}`        | GET    | VIEW_APPOINTMENT_ALL hoặc VIEW_APPOINTMENT_OWN | Chi tiết lịch hẹn                           |
| `/{appointmentCode}/status` | PATCH  | UPDATE_APPOINTMENT_STATUS                      | Cập nhật trạng thái lịch hẹn ⭐             |

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**NEW APIs: PROGRESSIVE BOOKING FLOW**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## API 4.1: Get Available Doctors

**Endpoint:** `GET /api/v1/availability/doctors`

**Use Case:** After receptionist selects services + date, FE calls this to show ONLY qualified doctors with shifts.

**Query Params:**

- `date` (String, Required): YYYY-MM-DD
- `serviceCodes` (Array, Required): Comma-separated service codes

**Request Example:**

```bash
GET /api/v1/availability/doctors?date=2025-11-10&serviceCodes=SCALING_L1,GEN_EXAM
Authorization: Bearer <token>
```

**Response 200 OK:**

```json
[
  {
    "employeeCode": "DR_KHOA",
    "fullName": "Dr. Le An Khoa",
    "specializations": ["General Dentistry", "Periodontics"],
    "shiftTimes": ["08:00-12:00", "14:00-18:00"]
  },
  {
    "employeeCode": "DR_BINH",
    "fullName": "Dr. Tran Binh An",
    "specializations": ["General Dentistry"],
    "shiftTimes": ["08:00-12:00"]
  }
]
```

**Logic:**

1. Check which specializations are required by selected services
2. Find doctors who have ALL required specializations + STANDARD spec (ID 8)
3. Filter doctors who have shifts on the selected date
4. Return list with shift times

**Error Responses:**

- `400 Bad Request`: Services not found
- `403 Forbidden`: No CREATE_APPOINTMENT permission

---

## API 4.2: Get Available Time Slots

**Endpoint:** `GET /api/v1/availability/slots`

**Use Case:** After receptionist selects doctor, FE calls this to show free time slots (gaps in schedule).

**Query Params:**

- `date` (String, Required): YYYY-MM-DD
- `employeeCode` (String, Required): Selected doctor code
- `durationMinutes` (Integer, Required): Total duration needed

**Request Example:**

```bash
GET /api/v1/availability/slots?date=2025-11-10&employeeCode=DR_KHOA&durationMinutes=75
Authorization: Bearer <token>
```

**Response 200 OK:**

```json
[
  {
    "start": "08:30:00",
    "end": "11:00:00",
    "suggested": true
  },
  {
    "start": "14:00:00",
    "end": "15:30:00",
    "suggested": false
  }
]
```

**Logic:**

1. Get doctor's shifts on the date
2. Get doctor's existing appointments
3. Find gaps in schedule >= durationMinutes
4. Mark first slot as "suggested"

**Notes:**

- Returns empty array `[]` if doctor has no shifts
- `suggested: true` helps UI highlight earliest slot

**Error Responses:**

- `404 Not Found`: Doctor not found or inactive
- `403 Forbidden`: No CREATE_APPOINTMENT permission

---

## API 4.3: Get Available Resources

**Endpoint:** `GET /api/v1/availability/resources`

**Use Case:** After receptionist selects time slot, FE calls this to show available rooms + assistants.

**Query Params:**

- `startTime` (String, Required): ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
- `endTime` (String, Required): ISO 8601 format
- `serviceCodes` (Array, Required): Comma-separated service codes

**Request Example:**

```bash
GET /api/v1/availability/resources?startTime=2025-11-10T09:00:00&endTime=2025-11-10T10:15:00&serviceCodes=SCALING_L1,GEN_EXAM
Authorization: Bearer <token>
```

**Response 200 OK:**

```json
{
  "availableRooms": [
    {
      "roomCode": "P-01",
      "roomName": "Phòng 01"
    },
    {
      "roomCode": "P-03",
      "roomName": "Phòng 03"
    }
  ],
  "availableAssistants": [
    {
      "employeeCode": "PT_NGUYEN",
      "fullName": "Phụ tá Nguyên"
    }
  ]
}
```

**Logic:**

1. Find rooms that support ALL selected services (via `room_services`)
2. Filter rooms not booked during the time range
3. Find assistants (medical staff with STANDARD spec) who:
   - Have shifts covering the time range
   - Are not busy (as primary doctor OR participant)

**Notes:**

- Returns rooms/assistants separately for flexibility
- FE can display "No assistants needed" option if list is empty

**Error Responses:**

- `400 Bad Request`: Invalid time range or services not found
- `403 Forbidden`: No CREATE_APPOINTMENT permission

---

##  **Frontend Integration Example**

### **Complete Booking Flow (5 Steps)**

```javascript
// Step 1: Receptionist Input
const bookingData = {
  patientCode: "BN-1001",
  serviceCodes: ["SCALING_L1", "GEN_EXAM"],
  date: "2025-11-10",
};

// Calculate total duration from service list
const totalDuration = services.reduce((sum, s) => sum + s.duration, 0); // 75 minutes

// Step 2: Get Available Doctors
const doctorsResponse = await fetch(
  `/api/v1/availability/doctors?date=${
    bookingData.date
  }&serviceCodes=${bookingData.serviceCodes.join(",")}`
);
const doctors = await doctorsResponse.json();
// Result: [{ employeeCode: "DR_KHOA", shiftTimes: ["08:00-12:00"] }, ...]

// FE displays dropdown with ONLY these 2 doctors (not all 50 doctors in DB)
const selectedDoctor = "DR_KHOA"; // User picks from dropdown

// Step 3: Get Available Time Slots
const slotsResponse = await fetch(
  `/api/v1/availability/slots?date=${bookingData.date}&employeeCode=${selectedDoctor}&durationMinutes=${totalDuration}`
);
const slots = await slotsResponse.json();
// Result: [{ start: "08:30:00", end: "11:00:00", suggested: true }, ...]

// FE displays calendar/picker with ONLY these free slots (highlighted)
const selectedSlot = "09:00:00"; // User picks 09:00
const endTime = calculateEndTime(selectedSlot, totalDuration); // 10:15:00

// Step 4: Get Available Resources
const resourcesResponse = await fetch(
  `/api/v1/availability/resources?startTime=${
    bookingData.date
  }T${selectedSlot}&endTime=${
    bookingData.date
  }T${endTime}&serviceCodes=${bookingData.serviceCodes.join(",")}`
);
const resources = await resourcesResponse.json();
// Result: { availableRooms: [{ roomCode: "P-01" }], availableAssistants: [{ employeeCode: "PT_NGUYEN" }] }

// FE displays dropdowns with ONLY these available options
const selectedRoom = "P-01";
const selectedAssistants = ["PT_NGUYEN"]; // Optional, can be empty

// Step 5: Create Appointment (Final Validation)
const createResponse = await fetch("/api/v1/appointments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    patientCode: bookingData.patientCode,
    employeeCode: selectedDoctor,
    roomCode: selectedRoom,
    appointmentStartTime: `${bookingData.date}T${selectedSlot}`,
    serviceCodes: bookingData.serviceCodes,
    participantCodes: selectedAssistants,
    notes: "Regular checkup",
  }),
});

if (createResponse.ok) {
  // Success! Appointment created
  const appointment = await createResponse.json();
  console.log("Created:", appointment.appointmentCode);
} else {
  // Rare edge case: Another receptionist booked the same slot 1 second ago
  const error = await createResponse.json();
  console.error("Conflict:", error.message); // "EMPLOYEE_SLOT_TAKEN"
}
```

### **Key Benefits**

 **No More "Vỡ lẽ" Errors**: Receptionist never picks invalid doctor
 **Fast UX**: Each API call < 100ms (no heavy validation)
 **Guided Workflow**: FE UI can disable/hide invalid options
 **99% Success Rate**: Final POST rarely fails (already pre-validated)

### **Error Handling Strategy**

```javascript
// If Step 2 returns empty array
if (doctors.length === 0) {
  showMessage(
    "No doctors available with required specializations on this date"
  );
  // Allow user to pick different date or different services
}

// If Step 3 returns empty array
if (slots.length === 0) {
  showMessage(
    "Doctor has no free slots on this date. Try another doctor or date."
  );
}

// If Step 4 returns no rooms
if (resources.availableRooms.length === 0) {
  showMessage("No compatible rooms available. Try different time slot.");
}

// If Step 5 fails (rare race condition)
if (!createResponse.ok) {
  showError(
    "Slot was just booked by another user. Please select a different time."
  );
  // Refresh Step 3 (get new slots)
}
```

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**LEGACY API** (All-in-one, still supported)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## GET AVAILABLE TIMES

️ **Note:** This is the old all-in-one API. For better UX, use the **Progressive Flow APIs** (4.1 → 4.2 → 4.3) instead.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET AVAILABLE TIMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoint:
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAM

Query Params:

- date (String Required) YYYY-MM-DD
- employeeCode (String Required) Mã bác sĩ
- serviceCodes (Array Required) Repeat: serviceCodes=A&serviceCodes=B
- participantCodes (Array Optional) Mã phụ tá

Response 200:

```json
{
  "totalDurationNeeded": 40,
  "availableSlots": [
    {
      "startTime": "2025-11-15T08:00:00",
      "availableCompatibleRoomCodes": ["P-01", "P-02"]
    }
  ]
}
```

Errors:

```json
{"message":"EMPLOYEE_NOT_QUALIFIED"}
{"message":"Doctor has no shifts on 2025-12-25"}
{"message":"Employee not found"}
```

Test Cases:

Basic - 1 Service
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAM

Basic - Multiple Services
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&serviceCodes=SCALING_L1

Advanced - Multiple Services with Participant
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAM&serviceCodes=SCALING_L1&participantCodes=EMP007

Advanced - Complex: 3 Services + 2 Participants
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&serviceCodes=SCALING_L1&serviceCodes=CROWN_EMAX&participantCodes=EMP007&participantCodes=EMP008

Basic - With Participant
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAM&participantCodes=EMP007

Edge Case - Part-time Dentist (Ca Sáng)
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=EXTRACT_MILK

Edge Case - Part-time Dentist (Ca Chiều)
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP004&serviceCodes=EXTRACT_NORM

Critical - Full-time Dentist (Both Morning & Afternoon Shifts)
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAM
Expected: Returns slots from 08:00-11:15 (morning) AND 13:00-16:15 (afternoon)

Error Case - Not Qualified (EMP001 không có Nội nha)
GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=FILLING_COMP

Error Case - No Shifts (Chủ nhật không làm việc)
GET /api/v1/appointments/available-times?date=2025-11-16&employeeCode=EMP001&serviceCodes=GEN_EXAM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST CREATE APPOINTMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

️ IMPORTANT: URL must NOT have trailing slash!
 Correct: POST http://localhost:8080/api/v1/appointments
 Wrong: POST http://localhost:8080/api/v1/appointments/

Endpoint:
POST /api/v1/appointments

Request Body:

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "serviceCodes": ["GEN_EXAM"],
  "appointmentStartTime": "2025-11-15T10:00:00",
  "participantCodes": ["EMP007"],
  "notes": "Khám tổng quát"
}
```

Request Fields:

- patientCode (String Required) - Generated by system when creating patient (format: BN-XXXX)
- employeeCode (String Required)
- roomCode (String Required) - Use room_code from rooms table (e.g., "P-01", "P-02", "P-04-IMPLANT")
- serviceCodes (Array Required)
- appointmentStartTime (String Required)
- participantCodes (Array Optional)
- notes (String Optional)

Response 201:

```json
{
  "appointmentCode": "APT-20251115-001",
  "status": "SCHEDULED",
  "appointmentStartTime": "2025-11-15T10:00:00",
  "appointmentEndTime": "2025-11-15T10:40:00",
  "expectedDurationMinutes": 40,
  "patient": { "patientCode": "BN-1001", "fullName": "Đoàn Thanh Phong" },
  "doctor": { "employeeCode": "EMP001", "fullName": "Lê Anh Khoa" },
  "room": { "roomCode": "P-01", "roomName": "Phòng thường 1" },
  "services": [
    { "serviceCode": "GEN_EXAM", "serviceName": "Khám tổng quát & Tư vấn" }
  ],
  "participants": [
    {
      "employeeCode": "EMP007",
      "fullName": "Đoàn Nguyễn Khôi Nguyên",
      "role": "ASSISTANT"
    }
  ]
}
```

Errors:

```json
{"message":"Patient code is required"}
{"message":"DOCTOR_NOT_AVAILABLE"}
{"message":"Patient not found"}
```

Test Cases:

Valid - Basic Appointment

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "serviceCodes": ["GEN_EXAM"],
  "appointmentStartTime": "2025-11-15T10:00:00"
}
```

Advanced - Multiple Services (2 services)

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "serviceCodes": ["GEN_EXAM", "SCALING_L1"],
  "appointmentStartTime": "2025-11-15T10:00:00",
  "notes": "Khám và cạo vôi"
}
```

Advanced - Multiple Services + Multiple Participants (Complex case)

```json
{
  "patientCode": "BN-1002",
  "employeeCode": "EMP002",
  "roomCode": "P-02",
  "serviceCodes": ["GEN_EXAM", "SCALING_L1", "CROWN_EMAX"],
  "appointmentStartTime": "2025-11-15T09:00:00",
  "participantCodes": ["EMP007", "EMP008", "EMP012"],
  "notes": "Ca phức tạp - 3 dịch vụ, 3 phụ tá"
}
```

Note: EMP007 (Nguyên) and EMP008 (Khang) are full-time nurses available both morning & afternoon. EMP012 (Linh) is part-time intern.

Valid - Multiple Services + Participant

```json
{
  "patientCode": "BN-1002",
  "employeeCode": "EMP002",
  "roomCode": "P-02",
  "serviceCodes": ["GEN_EXAM", "SCALING_L1"],
  "appointmentStartTime": "2025-11-15T09:00:00",
  "participantCodes": ["EMP007"],
  "notes": "Khám và cạo vôi"
}
```

Note: EMP007 (Đoàn Nguyễn Khôi Nguyên) is full-time nurse, has both morning & afternoon shifts.

Valid - Part-time Dentist (Chiều)

```json
{
  "patientCode": "BN-1003",
  "employeeCode": "EMP004",
  "roomCode": "P-01",
  "serviceCodes": ["EXTRACT_NORM"],
  "appointmentStartTime": "2025-11-15T14:00:00"
}
```

Critical - Afternoon Appointment with Participant (Test full-time schedule)

```json
{
  "patientCode": "BN-1004",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "serviceCodes": ["GEN_EXAM"],
  "appointmentStartTime": "2025-11-15T14:30:00",
  "participantCodes": ["EMP007"],
  "notes": "Ca chiều - Full-time doctor"
}
```

️ CONFLICT WARNING: This test case may fail with ROOM_SLOT_TAKEN if room P-01 is already booked during 14:30-15:15.
The error will now include conflicting appointment details: "Conflicting appointment: APT-XXXXXXXX-XXX (2025-11-15T14:00:00 to 2025-11-15T14:45:00)"
Expected on success: 201 Created with created_by = 0 (SYSTEM for admin)

Admin Create - Using SYSTEM employee

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "serviceCodes": ["GEN_EXAM"],
  "appointmentStartTime": "2025-11-15T15:00:00",
  "notes": "Tạo bởi Admin"
}
```

Token: Login as admin / 123456
Expected: created_by = 0 (SYSTEM employee)

Error Case - Double Booking
Create the same appointment twice
Expected: 400 DOCTOR_NOT_AVAILABLE

Error Case - Wrong Shift Time
Ca Sáng (8-12h) but book at 14:00
Expected: 400 DOCTOR_NOT_AVAILABLE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **TREATMENT PLAN BOOKING INTEGRATION** (V2 - NEW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Two Booking Modes

Starting from V2, API 3.2 (Create Appointment) supports TWO booking modes:

### **Mode 1: Standalone Booking** (Luồng 1 - Đặt lẻ)  EXISTING

Receptionist manually selects services for walk-in patients or one-time appointments.

**Request Example:**

```json
{
  "patientCode": "BN-1001",
  "serviceCodes": ["SCALING_L1", "GEN_EXAM"],
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "appointmentStartTime": "2025-11-15T10:00:00",
  "notes": "Walk-in patient for cleaning and checkup"
}
```

**Response (201 Created):**

```json
{
  "appointmentCode": "APT-20251115-012",
  "appointmentStartTime": "2025-11-15T10:00:00",
  "appointmentEndTime": "2025-11-15T10:45:00",
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Nguyễn Văn A"
  },
  "doctor": {
    "employeeCode": "EMP001",
    "fullName": "Dr. Lê Anh Khoa"
  },
  "room": {
    "roomCode": "P-01",
    "roomName": "Phòng khám 1"
  },
  "services": [
    {
      "serviceCode": "GEN_EXAM",
      "serviceName": "Khám tổng quát",
      "estimatedTimeMinutes": 15
    },
    {
      "serviceCode": "SCALING_L1",
      "serviceName": "Lấy cao răng (Mức 1)",
      "estimatedTimeMinutes": 30
    }
  ],
  "linkedPlanItems": null,
  "status": "SCHEDULED",
  "createdAt": "2025-11-15T09:00:00"
}
```

**Use Case:** Walk-in patients, emergency cases, single service appointments

---

### **Mode 2: Treatment Plan Booking** (Luồng 2 - Đặt theo lộ trình) ⭐ NEW

Receptionist books appointments directly from patient's treatment plan items.

**Request Example:**

```json
{
  "patientCode": "BN-1001",
  "patientPlanItemIds": [307, 308],
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "appointmentStartTime": "2025-12-08T14:00:00",
  "notes": "Orthodontic adjustment - Sessions 3 & 4"
}
```

**Response (201 Created):**

```json
{
  "appointmentCode": "APT-20251208-015",
  "appointmentStartTime": "2025-12-08T14:00:00",
  "appointmentEndTime": "2025-12-08T14:30:00",
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Nguyễn Văn A"
  },
  "doctor": {
    "employeeCode": "EMP001",
    "fullName": "Dr. Lê Anh Khoa"
  },
  "room": {
    "roomCode": "P-01",
    "roomName": "Phòng khám 1"
  },
  "services": [
    {
      "serviceCode": "ORTHO_ADJUST",
      "serviceName": "Siết niềng định kỳ",
      "estimatedTimeMinutes": 30
    }
  ],
  "linkedPlanItems": [
    {
      "itemId": 307,
      "itemName": "Lần 3/24: Siết niềng",
      "status": "SCHEDULED"
    },
    {
      "itemId": 308,
      "itemName": "Lần 4/24: Siết niềng",
      "status": "SCHEDULED"
    }
  ],
  "status": "SCHEDULED",
  "treatmentPlanCode": "PLAN-20251001-001",
  "createdAt": "2025-12-08T09:00:00"
}
```

**Use Case:** Patients with treatment plans (Niềng răng, Implant, Bọc sứ), scheduled follow-ups

**Business Flow:**

1. Receptionist opens patient's treatment plan (see `docs/api-guides/treatment-plan/TreatmentPlan.md`)
2. Sees list of items with status `READY_FOR_BOOKING` (e.g., "Lần 3/24: Siết niềng")
3. Selects items to book (can book multiple items in one appointment)
4. System extracts serviceId from items (e.g., ORTHO_ADJUST)
5. After appointment created:
   - Insert bridge records into `appointment_plan_items` table
   - Update item status: `READY_FOR_BOOKING` → `SCHEDULED`
6. Patient can track progress in their plan dashboard

---

## XOR Validation Rule (️ IMPORTANT)

**CRITICAL:** Request MUST provide **EITHER** `serviceCodes` **OR** `patientPlanItemIds`, **NOT BOTH** and **NOT NEITHER**.

This is enforced via `@AssertTrue` validation in DTO:

```java
@AssertTrue(message = "Please provide either serviceCodes for standalone booking or patientPlanItemIds for treatment plan booking, but not both and not neither")
private boolean isValidBookingType() {
    boolean hasServiceCodes = serviceCodes != null && !serviceCodes.isEmpty();
    boolean hasPlanItems = patientPlanItemIds != null && !patientPlanItemIds.isEmpty();
    return hasServiceCodes ^ hasPlanItems; // XOR: exactly one must be true
}
```

**XOR Rule Explanation:**
-  **Valid Option 1:** Provide only `serviceCodes` (standalone booking for walk-in patients)
-  **Valid Option 2:** Provide only `patientPlanItemIds` (treatment plan booking)
-  **Invalid:** Providing both `serviceCodes` AND `patientPlanItemIds`
-  **Invalid:** Providing neither (empty or null for both fields)

**Error Examples:**

 **Both provided (violates XOR):**

```json
{
  "serviceCodes": ["SCALING_L1"],
  "patientPlanItemIds": [307]
}
```

→ 400 Bad Request: "Please provide either serviceCodes for standalone booking or patientPlanItemIds for treatment plan booking, but not both and not neither"

 **Neither provided (violates XOR):**

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "appointmentStartTime": "2025-11-15T10:00:00"
}
```

→ 400 Bad Request: "Please provide either serviceCodes for standalone booking or patientPlanItemIds for treatment plan booking, but not both and not neither"

 **Correct Example 1 - Standalone Booking:**

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "serviceCodes": ["GEN_EXAM", "SCALING_L1"],
  "appointmentStartTime": "2025-11-15T10:00:00",
  "notes": "Walk-in patient"
}
```

 **Correct Example 2 - Treatment Plan Booking:**

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "patientPlanItemIds": [307, 308],
  "appointmentStartTime": "2025-12-08T14:00:00",
  "notes": "Orthodontic adjustment session 3 & 4"
}
```

**Response (201 Created):**

```json
{
  "appointmentCode": "APT-20251208-015",
  "appointmentStartTime": "2025-12-08T14:00:00",
  "appointmentEndTime": "2025-12-08T14:30:00",
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Nguyễn Văn A"
  },
  "doctor": {
    "employeeCode": "EMP001",
    "fullName": "Dr. Lê Anh Khoa"
  },
  "room": {
    "roomCode": "P-01",
    "roomName": "Phòng khám 1"
  },
  "services": [
    {
      "serviceCode": "ORTHO_ADJUST",
      "serviceName": "Siết niềng định kỳ",
      "estimatedTimeMinutes": 30
    }
  ],
  "linkedPlanItems": [
    {
      "itemId": 307,
      "itemName": "Lần 3/24: Siết niềng",
      "status": "SCHEDULED"
    },
    {
      "itemId": 308,
      "itemName": "Lần 4/24: Siết niềng", 
      "status": "SCHEDULED"
    }
  ],
  "status": "SCHEDULED",
  "createdAt": "2025-12-08T09:00:00"
}
```

---

## Treatment Plan Validation Rules

When using `patientPlanItemIds`, the system performs 3 strict checks:

### **Check 1: All items must exist**

```json
{
  "patientPlanItemIds": [999, 1000] // Items don't exist in DB
}
```

→ 400 Bad Request:

```json
{
  "message": "Patient plan items not found: [999, 1000]",
  "errorCode": "PLAN_ITEMS_NOT_FOUND"
}
```

### **Check 2: All items must belong to THIS patient**

**Security Check:** Prevents booking patient A's plan items for patient B.

```json
{
  "patientCode": "BN-1002", // Patient B
  "patientPlanItemIds": [307] // Item belongs to Patient A
}
```

→ 400 Bad Request:

```json
{
  "message": "Patient plan items do not belong to patient 2. Item IDs: [307]",
  "errorCode": "PLAN_ITEMS_WRONG_PATIENT"
}
```

**Backend Logic:**

```java
boolean allBelongToPatient = items.stream()
    .allMatch(item -> item.getPhase().getPlan().getPatientId().equals(patientId));
```

### **Check 3: All items must be READY_FOR_BOOKING**

**Status Flow:** `READY_FOR_BOOKING` → `SCHEDULED` → `IN_PROGRESS` → `COMPLETED`

```json
{
  "patientPlanItemIds": [306] // Item already SCHEDULED (appointment APT-20251208-001)
}
```

→ 400 Bad Request:

```json
{
  "message": "Some patient plan items are not ready for booking: [306 (status: SCHEDULED)]",
  "errorCode": "PLAN_ITEMS_NOT_READY"
}
```

**Valid Statuses:** Only `READY_FOR_BOOKING` items can be booked
**Invalid Statuses:** `SCHEDULED`, `IN_PROGRESS`, `COMPLETED` items will be rejected

---

## Complete Examples

### **Example 1: Treatment Plan Booking (Happy Path)**

**Precondition:**

- Patient BN-1001 has plan `PLAN-20251107-001` (Niềng răng 2 năm)
- Phase 3 has items:
  - Item 307: "Lần 3/24: Siết niềng" (status: READY_FOR_BOOKING)
  - Item 308: "Lần 4/24: Siết niềng" (status: READY_FOR_BOOKING)

**Request:**

```json
POST /api/v1/appointments
{
  "patientCode": "BN-1001",
  "patientPlanItemIds": [307, 308],
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "appointmentStartTime": "2025-12-08T14:00:00",
  "participantCodes": ["EMP007"],
  "notes": "Tái khám niềng răng lần 3 và 4 - Theo lộ trình"
}
```

**Response 201 Created:**

```json
{
  "appointmentCode": "APT-20251208-001",
  "status": "SCHEDULED",
  "appointmentStartTime": "2025-12-08T14:00:00",
  "appointmentEndTime": "2025-12-08T15:00:00",
  "expectedDurationMinutes": 60,
  "patient": { "patientCode": "BN-1001", "fullName": "Nguyễn Văn A" },
  "doctor": { "employeeCode": "EMP001", "fullName": "Dr. Lê Anh Khoa" },
  "room": { "roomCode": "P-01", "roomName": "Phòng thường 1" },
  "services": [
    {
      "serviceCode": "ORTHO_ADJUST",
      "serviceName": "Tái khám Chỉnh nha / Siết niềng"
    }
  ],
  "participants": [
    {
      "employeeCode": "EMP007",
      "fullName": "Đoàn Nguyễn Khôi Nguyên",
      "role": "ASSISTANT"
    }
  ]
}
```

**Backend Actions:**

1.  Validated items 307, 308 exist
2.  Validated items belong to patient BN-1001
3.  Validated items status = READY_FOR_BOOKING
4.  Extracted service `ORTHO_ADJUST` from items
5.  Validated doctor has Orthodontics specialization
6.  Validated room P-01 supports ORTHO_ADJUST service
7.  Created appointment APT-20251208-001
8.  Inserted 2 bridge records: `appointment_plan_items`
   - (appointment_id: 123, item_id: 307)
   - (appointment_id: 123, item_id: 308)
9.  Updated items 307, 308: status READY_FOR_BOOKING → SCHEDULED

**Database State After:**

```sql
SELECT item_id, item_name, status FROM patient_plan_items WHERE item_id IN (307, 308);
-- 307 | Lần 3/24: Siết niềng | SCHEDULED
-- 308 | Lần 4/24: Siết niềng | SCHEDULED

SELECT * FROM appointment_plan_items WHERE appointment_id = 123;
-- appointment_id | item_id | created_at
-- 123            | 307     | 2025-12-08 10:00:00
-- 123            | 308     | 2025-12-08 10:00:00
```

---

### **Example 2: Mixed Services from Plan Items**

**Scenario:** Patient has plan with different services (Khám + Cạo vôi in one appointment)

**Request:**

```json
POST /api/v1/appointments
{
  "patientCode": "BN-1001",
  "patientPlanItemIds": [301, 303],  // 301: "Khám tổng quát", 303: "Cạo vôi"
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "appointmentStartTime": "2025-11-08T09:00:00"
}
```

**Response:**

- System extracts 2 services: `GEN_EXAM` (from item 301) + `SCALING_L1` (from item 303)
- Total duration: 30 + 45 = 75 minutes
- Appointment end time: 10:15

---

### **Example 3: Error - Item Already Scheduled**

**Request:**

```json
POST /api/v1/appointments
{
  "patientCode": "BN-1001",
  "patientPlanItemIds": [306],  // Already SCHEDULED
  "employeeCode": "EMP002",
  "roomCode": "P-02",
  "appointmentStartTime": "2025-12-15T10:00:00"
}
```

**Response 400 Bad Request:**

```json
{
  "type": "https://www.jhipster.tech/problem/problem-with-message",
  "title": "Bad Request",
  "status": 400,
  "detail": "Some patient plan items are not ready for booking: [306 (status: SCHEDULED)]",
  "path": "/api/v1/appointments",
  "message": "error.PLAN_ITEMS_NOT_READY",
  "errorCode": "PLAN_ITEMS_NOT_READY"
}
```

---

### **Example 4: Error - Wrong Patient**

**Request:**

```json
POST /api/v1/appointments
{
  "patientCode": "BN-1002",  // Patient B
  "patientPlanItemIds": [307],  // Item belongs to Patient A (BN-1001)
  "employeeCode": "EMP001",
  "roomCode": "P-01",
  "appointmentStartTime": "2025-12-08T14:00:00"
}
```

**Response 400 Bad Request:**

```json
{
  "status": 400,
  "detail": "Patient plan items do not belong to patient 2. Item IDs: [307]",
  "errorCode": "PLAN_ITEMS_WRONG_PATIENT"
}
```

---

## Rollback Safety

**CRITICAL:** All operations are wrapped in `@Transactional`. If ANY validation fails after items are marked as SCHEDULED, the transaction rolls back automatically.

**Rollback Scenarios:**

1. **Doctor Conflict Detected:**

   ```
   Items 307, 308 temporarily marked SCHEDULED
   → checkDoctorConflict() finds conflict
   → Transaction rollback
   → Items revert to READY_FOR_BOOKING 
   ```

2. **Room Conflict Detected:**

   ```
   Items marked SCHEDULED
   → checkRoomConflict() finds conflict
   → Transaction rollback
   → Items remain READY_FOR_BOOKING 
   ```

3. **Status Update Fails:**
   ```
   Appointment created
   → updatePlanItemsStatus() throws exception
   → Entire transaction rollback
   → Appointment NOT created
   → Items remain READY_FOR_BOOKING 
   ```

**Implementation:**

```java
@Transactional
public CreateAppointmentResponse createAppointment(CreateAppointmentRequest request) {
    // All validations...

    Appointment appointment = insertAppointment(...);
    insertAppointmentServices(...);
    insertAppointmentParticipants(...);

    if (isBookingFromPlan) {
        insertAppointmentPlanItems(appointment, request.getPatientPlanItemIds());
        updatePlanItemsStatus(request.getPatientPlanItemIds(), SCHEDULED);  // If this fails, ALL rollback
    }

    insertAuditLog(...);
    return buildResponse(...);
}
```

---

## Frontend Integration Example

**Step 1: Fetch bookable items from patient plan**

```javascript
// GET /api/v1/patient-treatment-plans/101/bookable-items
const response = await fetch(
  "/api/v1/patient-treatment-plans/101/bookable-items"
);
const data = await response.json();

// Response:
// {
//   "bookableItems": [
//     { "itemId": 307, "itemName": "Lần 3/24: Siết niềng", "serviceCode": "ORTHO_ADJUST", ... },
//     { "itemId": 308, "itemName": "Lần 4/24: Siết niềng", "serviceCode": "ORTHO_ADJUST", ... }
//   ]
// }
```

**Step 2: Display in UI with checkboxes**

```jsx
<Checkbox label="️ Lần 3/24: Siết niềng (30 phút)" value={307} />
<Checkbox label="️ Lần 4/24: Siết niềng (30 phút)" value={308} />
```

**Step 3: Create appointment with selected items**

```javascript
const selectedItemIds = [307, 308]; // From checkbox state

await fetch("/api/v1/appointments", {
  method: "POST",
  body: JSON.stringify({
    patientCode: "BN-1001",
    patientPlanItemIds: selectedItemIds, // Treatment Plan Booking mode
    employeeCode: "EMP001",
    roomCode: "P-01",
    appointmentStartTime: "2025-12-08T14:00:00",
  }),
});
```

**Step 4: Show success + updated status**

```
 Appointment created: APT-20251208-001
 Items updated:
   - Lần 3/24: Siết niềng → SCHEDULED
   - Lần 4/24: Siết niềng → SCHEDULED
```

---

## Error Handling Summary

| Error Code                 | HTTP Status | Meaning                                    | Solution                                                   |
| -------------------------- | ----------- | ------------------------------------------ | ---------------------------------------------------------- |
| `PLAN_ITEMS_NOT_FOUND`     | 400         | Item IDs không tồn tại                     | Check item IDs from treatment plan API                     |
| `PLAN_ITEMS_WRONG_PATIENT` | 400         | Items không thuộc về bệnh nhân             | Verify patientCode matches plan owner                      |
| `PLAN_ITEMS_NOT_READY`     | 400         | Items không ở trạng thái READY_FOR_BOOKING | Check item status (may be SCHEDULED/IN_PROGRESS/COMPLETED) |
| `INVALID_BOOKING_TYPE`     | 400         | Vi phạm XOR rule                           | Provide EITHER serviceCodes (standalone) OR patientPlanItemIds (treatment plan), not both and not neither |

---

## Status Flow Diagram

```
Treatment Plan Item Lifecycle:
┌─────────────────────┐
│ READY_FOR_BOOKING   │ ← Initial state when plan created
└──────────┬──────────┘
           │
           │ Receptionist books appointment
           │ POST /api/v1/appointments (patientPlanItemIds)
           ↓
┌─────────────────────┐
│    SCHEDULED        │ ← After appointment created + bridge records inserted
└──────────┬──────────┘
           │
           │ Appointment checked-in
           │ PATCH /api/v1/appointments/{code}/status
           ↓
┌─────────────────────┐
│   IN_PROGRESS       │ ← During treatment
└──────────┬──────────┘
           │
           │ Treatment finished
           │ PATCH /api/v1/appointments/{code}/status
           ↓
┌─────────────────────┐
│    COMPLETED        │ ← Final state
└─────────────────────┘
```

**Key Points:**

- Only `READY_FOR_BOOKING` items can be booked (all other states rejected)
- Status updates are automatic when appointment status changes
- If appointment cancelled, items revert to `READY_FOR_BOOKING`

---

## Business Rules

1. **One Appointment, Multiple Items**: Can book multiple plan items in one appointment (e.g., "Lần 3" + "Lần 4")
2. **Cross-Phase Booking**: Cannot book items from different phases in one appointment (validation will be added in future)
3. **Sequential Booking**: System does NOT enforce sequential booking (e.g., can book "Lần 5" before "Lần 3")
4. **Service Extraction**: System automatically extracts serviceId from items (no need to provide serviceCodes)
5. **Duplicate Services**: If multiple items have same serviceId, system merges them (appointment_services table will have 1 row)
6. **Payment Tracking**: Treatment plan items track completion, NOT payment (payment handled separately)

---

## Migration Notes (V1 → V2)

**Backward Compatible:** Existing clients using `serviceCodes` continue to work without changes.

**New Clients:** Can choose either mode based on use case:

- Walk-in patients → Use `serviceCodes` (Mode 1)
- Treatment plan patients → Use `patientPlanItemIds` (Mode 2)

**Database Changes:**

- No breaking changes to existing tables
- New tables: `patient_plan_items`, `appointment_plan_items` (bridge)
- New enum: `PlanItemStatus` (READY_FOR_BOOKING, SCHEDULED, IN_PROGRESS, COMPLETED)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET APPOINTMENT LIST (DASHBOARD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoint:
GET /api/v1/appointments

Authorization (PERMISSION-BASED, NOT ROLE-BASED):

- VIEW_APPOINTMENT_ALL: Lễ tân/Quản lý - Xem tất cả, dùng filters tự do
- VIEW_APPOINTMENT_OWN: Bác sĩ/Y tá/OBSERVER/Bệnh nhân - Filters bị GHI ĐÈ

️ CRITICAL: Logic kiểm tra PERMISSION_ID, KHÔNG kiểm tra role_id

Query Params (All Optional):

- page (Number) Default: 0
- size (Number) Default: 10
- sortBy (String) Default: "appointmentStartTime"
- sortDirection (String) Default: "ASC" (ASC|DESC)
- datePreset (String)  NEW - Quick date filter: TODAY | THIS_WEEK | NEXT_7_DAYS | THIS_MONTH
- dateFrom (String) YYYY-MM-DD - Từ ngày (inclusive)
- dateTo (String) YYYY-MM-DD - Đến ngày (inclusive)
- today (Boolean) DEPRECATED - Dùng datePreset=TODAY thay thế
- status (Array) Repeat: status=SCHEDULED&status=CHECKED_IN
- patientCode (String) Mã bệnh nhân (VIEW_ALL only)
- patientName (String)  NEW - Search tên bệnh nhân LIKE (VIEW_ALL only)
- patientPhone (String)  NEW - Search SĐT bệnh nhân LIKE (VIEW_ALL only)
- employeeCode (String) Mã bác sĩ chính (VIEW_ALL only)
- roomCode (String) Mã phòng
- serviceCode (String)  NEW - Mã dịch vụ (JOIN appointment_services)

RBAC Logic (Permission-based):

1. VIEW_APPOINTMENT_ALL (Lễ tân/Quản lý):
   → Kiểm tra: auth.authorities contains "VIEW_APPOINTMENT_ALL"
   → Xem TẤT CẢ appointments
   → Filters hoạt động bình thường
   →  Có thể search by patient name/phone

2. VIEW_APPOINTMENT_OWN + Employee (Bác sĩ/Y tá/OBSERVER):
   → Kiểm tra: auth.authorities contains "VIEW_APPOINTMENT_OWN"
   → OVERRIDE: WHERE (appointments.employee_id = [my_employee_id]
   OR EXISTS (participant where employee_id = [my_employee_id]))
   → PHỚT LỜI employeeCode từ client
   → ️ OBSERVER (Thực tập sinh):
   • Có quyền VIEW_APPOINTMENT_OWN
   • Thấy appointments MÀ HỌ THAM GIA (role = OBSERVER trong participants)
   • KHÔNG thấy toàn bộ appointments (security)
   • Frontend cần thêm permission để xem medical history

3. VIEW_APPOINTMENT_OWN + Patient (Bệnh nhân):
   → Kiểm tra: auth.authorities contains "VIEW_APPOINTMENT_OWN"
   → OVERRIDE: WHERE appointments.patient_id = [my_patient_id]
   → PHỚT LỜI patientCode từ client

Response 200:

```json
{
  "content": [
    {
      "appointmentCode": "APT-20251115-001",
      "status": "SCHEDULED",
      "computedStatus": "LATE",
      "minutesLate": 15,
      "appointmentStartTime": "2025-11-15T10:00:00",
      "appointmentEndTime": "2025-11-15T10:40:00",
      "expectedDurationMinutes": 40,
      "patient": {
        "patientCode": "BN-1001",
        "fullName": "Đoàn Thanh Phong"
      },
      "doctor": {
        "employeeCode": "EMP001",
        "fullName": "Lê Anh Khoa"
      },
      "room": {
        "roomCode": "P-01",
        "roomName": "Phòng thường 1"
      },
      "services": [
        {
          "serviceCode": "GEN_EXAM",
          "serviceName": "Khám tổng quát & Tư vấn"
        }
      ],
      "participants": [
        {
          "employeeCode": "EMP007",
          "fullName": "Đoàn Nguyễn Khôi Nguyên",
          "role": "ASSISTANT"
        }
      ],
      "notes": "Khám tổng quát"
    }
  ],
  "page": 0,
  "size": 10,
  "totalPages": 5,
  "totalElements": 50
}
```

Computed Fields Explanation:

- computedStatus: Tính dựa trên status + appointmentStartTime vs NOW()
  • CANCELLED: status == CANCELLED
  • COMPLETED: status == COMPLETED
  • NO_SHOW: status == NO_SHOW
  • CHECKED_IN: status == CHECKED_IN
  • IN_PROGRESS: status == IN_PROGRESS
  • LATE: status == SCHEDULED && NOW() > appointmentStartTime (Bệnh nhân chưa check-in)
  • UPCOMING: status == SCHEDULED && NOW() <= appointmentStartTime

- minutesLate: Số phút trễ (chỉ có khi computedStatus = LATE)
  • Tính: Duration.between(appointmentStartTime, NOW()).toMinutes()
  • Use case: Dashboard hiển thị "Trễ 15 phút" với màu đỏ

Test Cases:

Dashboard - Lễ tân - Xem tất cả lịch hôm nay (DatePreset)
GET /api/v1/appointments?datePreset=TODAY
Token: Lễ tân (username: thuan.dk) với permission VIEW_APPOINTMENT_ALL
Backend: Auto tính dateFrom=2025-11-04, dateTo=2025-11-04

Dashboard - Lễ tân - Xem lịch tuần này (DatePreset)
GET /api/v1/appointments?datePreset=THIS_WEEK
Backend: Auto tính dateFrom=Monday, dateTo=Sunday của tuần hiện tại

Dashboard - Lễ tân - Xem lịch 7 ngày tới (DatePreset)
GET /api/v1/appointments?datePreset=NEXT_7_DAYS
Backend: Auto tính dateFrom=2025-11-04, dateTo=2025-11-10

Dashboard - Lễ tân - Xem lịch tháng này (DatePreset)
GET /api/v1/appointments?datePreset=THIS_MONTH
Backend: Auto tính dateFrom=2025-11-01, dateTo=2025-11-30

Critical - Lễ tân - TÌM THEO TÊN BỆNH NHÂN
GET /api/v1/appointments?patientName=Phong
Backend: LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%phong%'
Expected: Trả về appointments của "Đoàn Thanh Phong" + "Phạm Văn Phong"

Critical - Lễ tân - TÌM THEO SỐ ĐIỆN THOẠI
GET /api/v1/appointments?patientPhone=0912
Backend: phone LIKE '%0912%'
Expected: Trả về appointments có SĐT chứa "0912"

Advanced - Lễ tân - TÌM THEO TÊN + SĐT KẾT HỢP
GET /api/v1/appointments?patientName=Thanh&patientPhone=0909&datePreset=THIS_MONTH
Use case: "Tìm tất cả bệnh nhân tên Thanh, SĐT có 0909 trong tháng này"

Dashboard - Lễ tân - Lọc theo ngày + status + bác sĩ
GET /api/v1/appointments?dateFrom=2025-11-15&dateTo=2025-11-15&status=SCHEDULED&status=CHECKED_IN&employeeCode=EMP001

Critical - Lễ tân - LỌC THEO DỊCH VỤ
GET /api/v1/appointments?serviceCode=IMPL_SURGERY_KR&dateFrom=2025-11-15&dateTo=2025-11-15
Backend: JOIN appointment_services WHERE service_code = 'IMPL_SURGERY_KR'
Use case: "Tháng này có bao nhiêu ca Implant?"

Advanced - Lễ tân - LỌC THEO NHIỀU DỊCH VỤ (Multi-service filter)
GET /api/v1/appointments?serviceCode=GEN_EXAM&serviceCode=SCALING_L1&datePreset=THIS_WEEK
Use case: "Tuần này có bao nhiêu ca khám tổng quát hoặc cạo vôi?"

**NEW: Combined Search (searchCode Parameter)**

Critical - Lễ tân - TÌM KIẾM TỔNG HỢP THEO MÃ HOẶC TÊN
GET /api/v1/appointments?searchCode=Nguyễn
Backend: Tìm trong patient name, doctor name, participant name, room name, service name
Expected: Trả về tất cả lịch hẹn có liên quan đến "Nguyễn" (bệnh nhân, bác sĩ, phụ tá)

Critical - Lễ tân - TÌM THEO TÊN BÁC SĨ
GET /api/v1/appointments?searchCode=Dr. An&datePreset=TODAY
Backend: ILIKE '%Dr. An%' trên employee full_name hoặc employee_code
Expected: Trả về lịch hôm nay của bác sĩ có tên chứa "Dr. An"

Critical - Lễ tân - TÌM THEO TÊN BỆNH NHÂN
GET /api/v1/appointments?searchCode=Thanh Phong
Backend: ILIKE '%Thanh Phong%' trên patient full_name
Expected: Trả về lịch của bệnh nhân "Đoàn Thanh Phong"

Critical - Lễ tân - TÌM THEO TÊN DỊCH VỤ
GET /api/v1/appointments?searchCode=Cạo vôi&datePreset=THIS_WEEK
Backend: ILIKE '%Cạo vôi%' trên service_name
Expected: Trả về tất cả lịch hẹn có dịch vụ "Cạo vôi răng" tuần này

Critical - Lễ tân - TÌM THEO MÃ (Fallback to code search)
GET /api/v1/appointments?searchCode=BN-1001
Backend: Tìm theo patient_code = 'BN-1001'
Expected: Trả về lịch của bệnh nhân mã BN-1001

Advanced - Lễ tân - TÌM THEO TÊN PHÒNG
GET /api/v1/appointments?searchCode=VIP&datePreset=TODAY
Backend: ILIKE '%VIP%' trên room_name
Expected: Trả về lịch hôm nay ở các phòng VIP

**Lưu ý về searchCode:**

- Tìm kiếm **cả code VÀ name** (không phân biệt hoa thường)
- Hỗ trợ **partial match** (tìm "Nguyễn" sẽ khớp "Nguyễn Văn A")
- Khi dùng `searchCode`, các filter khác (patientCode, employeeCode, etc.) bị bỏ qua
- Chỉ hoạt động cho user có permission `VIEW_APPOINTMENT_ALL`

Dashboard - Lễ tân - Lọc theo phòng
GET /api/v1/appointments?roomCode=P-01

Advanced - Lễ tân - Lọc phức tạp (Complex filter)
GET /api/v1/appointments?datePreset=THIS_MONTH&status=SCHEDULED&status=CHECKED_IN&employeeCode=EMP001&serviceCode=GEN_EXAM&sortBy=appointmentStartTime&sortDirection=ASC
Use case: "Tháng này bác sĩ Khoa có bao nhiêu lịch khám tổng quát đã đặt hoặc đã check-in?"

Dashboard - Bác sĩ - Xem lịch của mình (Auto-filter)
GET /api/v1/appointments?today=true
Token: Bác sĩ Lê Anh Khoa (username: khoa.la) với permission VIEW_APPOINTMENT_OWN
Backend: findByAccount_Username("khoa.la") returns employeeId = EMP001
Backend auto applies: WHERE (employee_id=EMP001 OR EXISTS participant)
Note: Backend PHỚT LỜI nếu client cố gửi employeeCode=EMP002

Dashboard - Bác sĩ - Xem lịch tuần tới
GET /api/v1/appointments?dateFrom=2025-11-11&dateTo=2025-11-17&sortBy=appointmentStartTime&sortDirection=ASC
Token: Bác sĩ (VIEW_APPOINTMENT_OWN)

Dashboard - Y tá/Phụ tá - Xem lịch tham gia
GET /api/v1/appointments?today=true
Token: Y tá Đoàn Nguyễn Khôi Nguyên (username: nguyen.dnk) với VIEW_APPOINTMENT_OWN
Backend: Trả về appointments WHERE participant.employee_id = EMP007

Critical - OBSERVER (Thực tập sinh) - Xem lịch được mời quan sát
GET /api/v1/appointments?today=true
Token: Thực tập sinh Nguyễn Khánh Linh (username: linh.nk) với permission VIEW_APPOINTMENT_OWN
Backend: findByAccount_Username("linh.nk") returns employeeId = 12 (EMP012)
Backend: WHERE EXISTS (participant WHERE employee_id = 12 AND role = 'OBSERVER')
Security: CHỈ THẤY appointments mà họ được thêm vào danh sách participants
Security: KHÔNG leak thông tin bệnh nhân của appointments khác
Test Data: EMP012 - Nguyễn Khánh Linh - Thực tập sinh (ROLE_DENTIST_INTERN)
Expected: Trống ban đầu, sau khi add vào participant list mới thấy

Advanced - OBSERVER - Thêm vào participant, verify thấy appointment
Step 1: Admin adds EMP012 to APT-20251115-001 as OBSERVER
Step 2: Login as linh.nk
Step 3: GET /api/v1/appointments?datePreset=TODAY
Step 4: Should return APT-20251115-001 in response

Advanced - OBSERVER - Xóa khỏi participant, verify không còn thấy
Step 1: Admin removes EMP012 from APT-20251115-001
Step 2: Login as linh.nk
Step 3: GET /api/v1/appointments?datePreset=TODAY
Step 4: Should return empty list

Dashboard - Bệnh nhân - Xem lịch của mình
GET /api/v1/appointments
Token: Bệnh nhân Đoàn Thanh Phong (username: phong.dt) với VIEW_APPOINTMENT_OWN
Backend: TODO - Cần mapping Patient.account
Backend tự động: WHERE patient_id = BN-1001

Dashboard - Bệnh nhân - Xem lịch sắp tới
GET /api/v1/appointments?dateFrom=2025-11-15&status=SCHEDULED&sortBy=appointmentStartTime&sortDirection=ASC
Token: Bệnh nhân (VIEW_APPOINTMENT_OWN)

Security - Bệnh nhân cố xem lịch người khác - PHỚT LỜI filter
GET /api/v1/appointments?patientCode=BN-1002
Token: Bệnh nhân BN-1001 với VIEW_APPOINTMENT_OWN
Backend: OVERRIDE - Vẫn chỉ trả về appointments của BN-1001
Security: Prevent privilege escalation

Security - Bác sĩ cố xem lịch bác sĩ khác - PHỚT LỜI filter
GET /api/v1/appointments?employeeCode=EMP002
Token: Bác sĩ EMP001 với VIEW_APPOINTMENT_OWN
Backend: OVERRIDE - Vẫn chỉ trả về appointments của EMP001
Security: Prevent data leak

Security - OBSERVER cố xem tất cả lịch - BỊ GIỚI HẠN
GET /api/v1/appointments?dateFrom=2025-11-01&dateTo=2025-11-30
Token: OBSERVER với VIEW_APPOINTMENT_OWN
Backend: CHỈ trả về appointments mà OBSERVER THAM GIA
Security: Không có permission VIEW_APPOINTMENT_ALL nên không thấy toàn bộ

Error Case - Unauthorized - Không có quyền VIEW
GET /api/v1/appointments
Token: Không có VIEW_APPOINTMENT_ALL hoặc VIEW_APPOINTMENT_OWN
Expected: 403 Forbidden

Implementation Notes:

CRITICAL IMPROVEMENTS (vs Initial Design):

1. Search by Patient Name/Phone (FIXED)

   - JOIN patients table
   - LIKE search: LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%search%'
   - Real-world use case: Lễ tân gõ "Lan" thay vì nhớ "BN-1234"

2. Filter by Service Code (ADDED)

   - JOIN appointment_services + services
   - Use case: "Tháng này có bao nhiêu ca Implant?"

3. Permission-based Auth (FIXED)

   - Check "VIEW_APPOINTMENT_ALL" in authorities
   - NOT check role_id
   - Data-driven: Easy to add new roles via database

4. OBSERVER Role Security (CLARIFIED)

   - OBSERVER có permission VIEW_APPOINTMENT_OWN
   - CHỈ thấy appointments họ được mời tham gia
   - Principle of Least Privilege
   - Medical data privacy protection
   - Test user: EMP012 - Nguyễn Khánh Linh (linh.nk)

5. DatePreset Enum (IMPLEMENTED)

   - TODAY, THIS_WEEK, NEXT_7_DAYS, THIS_MONTH
   - Backend tự động tính dateFrom/dateTo
   - KHÔNG cần thay đổi DB Schema V16
   - Use case: Dashboard quick filters

6. Computed Fields (IMPLEMENTED)

   - computedStatus: UPCOMING | LATE | IN_PROGRESS | CHECKED_IN | COMPLETED | CANCELLED
   - minutesLate: Số phút trễ (Duration.between)
   - Real-time calculation based on NOW()
   - Use case: Dashboard color coding (red for LATE)

7. N+1 Query Warning (Noted - TODO)

   - Current: Load patient/employee per appointment (N+1)
   - TODO: Batch loading or @EntityGraph
   - Impact: Performance with 100+ appointments

8. Patient RBAC Mapping (TODO)
   - Employee mapping: DONE (findByAccount_Username)
   - Patient mapping: TODO (need Patient.account relationship)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEED DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Accounts:

- admin (Admin) - ROLE_ADMIN - All permissions (username: admin, password: 123456)
- thuan.dk (Lễ tân) - ROLE_RECEPTIONIST - Permission: VIEW_APPOINTMENT_ALL
- khoa.la (Bác sĩ) - ROLE_DENTIST - Permission: VIEW_APPOINTMENT_OWN
- nguyen.dnk (Y tá) - ROLE_NURSE - Permission: VIEW_APPOINTMENT_OWN
- linh.nk (Thực tập sinh)  NEW - ROLE_DENTIST_INTERN - Permission: VIEW_APPOINTMENT_OWN
- phong.dt (Bệnh nhân) - ROLE_PATIENT - Permission: VIEW_APPOINTMENT_OWN (TODO: mapping)

Employees (Ca Sáng 8-12h on 2025-11-15):

- EMP001 - Lê Anh Khoa - Nha sĩ (Full-time) - Chỉnh nha (ID 1), Phục hồi (ID 4), STANDARD (ID 8) -  BOTH SHIFTS
- EMP002 - Trịnh Công Thái - Nha sĩ (Full-time) - Nội nha (ID 2), Răng thẩm mỹ (ID 7), STANDARD (ID 8) -  BOTH SHIFTS
- EMP003 - Jimmy Donaldson - Nha sĩ (Part-time flex) - Nha khoa trẻ em (ID 6), STANDARD (ID 8) - Morning only
- EMP007 - Đoàn Nguyễn Khôi Nguyên - Y tá (Full-time) - STANDARD (ID 8) -  BOTH SHIFTS
- EMP008 - Nguyễn Trần Tuấn Khang - Y tá (Full-time) - STANDARD (ID 8) -  BOTH SHIFTS
- EMP009 - Huỳnh Tấn Quang Nhật - Y tá (Part-time fixed) - STANDARD (ID 8) - Morning only

Employees (Ca Chiều 13-17h on 2025-11-15):

- EMP001 - Lê Anh Khoa - Nha sĩ (Full-time) -  BOTH SHIFTS
- EMP002 - Trịnh Công Thái - Nha sĩ (Full-time) -  BOTH SHIFTS
- EMP004 - Junya Ota - Nha sĩ (Part-time fixed) - Phẫu thuật (ID 5), STANDARD (ID 8) - Afternoon only
- EMP007 - Đoàn Nguyễn Khôi Nguyên - Y tá (Full-time) -  BOTH SHIFTS
- EMP008 - Nguyễn Trần Tuấn Khang - Y tá (Full-time) -  BOTH SHIFTS
- EMP010 - Ngô Đình Chính - Y tá (Part-time flex) - STANDARD (ID 8) - Afternoon only

️ IMPORTANT: When selecting participants for test cases:

- Morning appointments (08:00-12:00): Can use EMP007, EMP008, EMP009
- Afternoon appointments (13:00-17:00): Can use EMP007, EMP008, EMP010
- EMP007 and EMP008 are FULL-TIME, available both morning & afternoon
- Part-time employees only work specific shifts

Services:

- GEN_EXAM (30 min + 15 buffer) STANDARD (ID 8)
- SCALING_L1 (45 min + 15 buffer) Nha chu (ID 3)
- ORTHO_BRACES_ON (90 min + 30 buffer) Chỉnh nha (ID 1)
- CROWN_EMAX (60 min + 15 buffer) Phục hồi (ID 4)
- IMPL_SURGERY_KR (90 min + 30 buffer) Phục hồi (ID 4)

Rooms:

- P-01 (STANDARD) - Compatible với tất cả STANDARD services
- P-02 (STANDARD) - Compatible với tất cả STANDARD services
- P-03 (STANDARD) - Compatible với tất cả STANDARD services
- P-04-IMPLANT (IMPLANT) - Compatible với IMPLANT + tất cả STANDARD services

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET APPOINTMENT DETAIL (P3.4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoint:
GET /api/v1/appointments/{appointmentCode}

Permission:

- VIEW_APPOINTMENT_ALL: Có thể xem bất kỳ appointment nào
- VIEW_APPOINTMENT_OWN:
  - Patient chỉ xem được appointment của mình
  - Employee chỉ xem được appointment mà họ là doctor HOẶC participant

Response 200:

```json
{
  "appointmentId": 1,
  "appointmentCode": "APT-20251104-001",
  "status": "SCHEDULED",
  "computedStatus": "LATE",
  "minutesLate": 74,
  "appointmentStartTime": "2025-11-04T09:00:00",
  "appointmentEndTime": "2025-11-04T09:45:00",
  "expectedDurationMinutes": 45,
  "actualStartTime": null,
  "actualEndTime": null,
  "cancellationReason": null,
  "notes": "Bệnh nhân có tiền sử cao huyết áp",
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Đoàn Thanh Phong",
    "phone": "0909123456",
    "dateOfBirth": "1990-01-01"
  },
  "doctor": {
    "employeeCode": "EMP001",
    "fullName": "Lê Anh Khoa"
  },
  "room": {
    "roomCode": "P-01",
    "roomName": "Room P-01"
  },
  "services": [
    {
      "serviceCode": "GEN_EXAM",
      "serviceName": "Khám tổng quát & Tư vấn"
    }
  ],
  "participants": [
    {
      "employeeCode": "EMP007",
      "fullName": "Đoàn Nguyễn Khôi Nguyên",
      "role": "ASSISTANT"
    }
  ],
  "createdBy": "Đỗ Khánh Thuận",
  "createdAt": "2025-11-03T14:00:00"
}
```

Response 404 (Appointment Not Found):

```json
{
  "type": "https://dental-clinic.com/problems/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Appointment not found with code: APT-99999-999",
  "errorCode": "APPOINTMENT_NOT_FOUND"
}
```

Response 403 (Access Denied):

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "You can only view your own appointments"
}
```

Test Cases:

### Success Case 1: Admin/Receptionist xem bất kỳ appointment nào (VIEW_APPOINTMENT_ALL)

**Login as**: admin (hoặc thuan.dk - Receptionist)

```
GET /api/v1/appointments/APT-20251104-001
Authorization: Bearer {{admin_token}}
```

**Expected**: 200 OK với full details

### Success Case 2: Patient xem appointment của chính mình (VIEW_APPOINTMENT_OWN)

**Login as**: phong.dt (Bệnh nhân BN-1001)

```
GET /api/v1/appointments/APT-20251104-001
Authorization: Bearer {{phong_token}}
```

**Pre-condition**: Appointment APT-20251104-001 phải thuộc về patient BN-1001

**Expected**: 200 OK với full details

### Success Case 3: Doctor xem appointment mà mình là bác sĩ chính (VIEW_APPOINTMENT_OWN)

**Login as**: khoa.la (Doctor EMP001 - Lê Anh Khoa)

```
GET /api/v1/appointments/APT-20251104-001
Authorization: Bearer {{khoa_token}}
```

**Pre-condition**: Appointment APT-20251104-001 phải có employeeId = EMP001

**Expected**: 200 OK với full details

### Success Case 4: Employee xem appointment mà mình là participant (VIEW_APPOINTMENT_OWN)

**Login as**: nguyen.dnk (Nurse EMP007 - Đoàn Nguyễn Khôi Nguyên)

```
GET /api/v1/appointments/APT-20251104-001
Authorization: Bearer {{nguyen_token}}
```

**Pre-condition**: Appointment APT-20251104-001 phải có EMP007 trong participants

**Expected**: 200 OK với full details

### Error Case 1: Patient cố gắng xem appointment của người khác (403 FORBIDDEN)

**Login as**: phong.dt (Patient BN-1001)

```
GET /api/v1/appointments/APT-20251104-002
Authorization: Bearer {{phong_token}}
```

**Pre-condition**: Appointment APT-20251104-002 thuộc về patient BN-1002 (không phải BN-1001)

**Expected**: 403 FORBIDDEN

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "You can only view your own appointments"
}
```

### Error Case 2: Employee không liên quan cố gắng xem appointment (403 FORBIDDEN)

**Login as**: khoa.la (Doctor EMP001)

```
GET /api/v1/appointments/APT-20251104-003
Authorization: Bearer {{khoa_token}}
```

**Pre-condition**:

- Appointment APT-20251104-003 có employeeId = EMP002 (không phải EMP001)
- EMP001 KHÔNG có trong participants của appointment này

**Expected**: 403 FORBIDDEN

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "You can only view appointments where you are involved"
}
```

### Error Case 3: Appointment không tồn tại (404 NOT FOUND)

**Login as**: admin

```
GET /api/v1/appointments/APT-99999-999
Authorization: Bearer {{admin_token}}
```

**Expected**: 404 NOT FOUND

```json
{
  "type": "https://dental-clinic.com/problems/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Appointment not found with code: APT-99999-999",
  "errorCode": "APPOINTMENT_NOT_FOUND"
}
```

### Edge Case 1: Appointment đã CANCELLED - Hiển thị cancellationReason

**Login as**: admin

```
GET /api/v1/appointments/APT-CANCELLED-001
Authorization: Bearer {{admin_token}}
```

**Pre-condition**:

- Appointment có status = CANCELLED
- Có audit log với actionType = CANCEL và notes = "Bệnh nhân hủy do bận đột xuất"

**Expected**: 200 OK

```json
{
  "appointmentCode": "APT-CANCELLED-001",
  "status": "CANCELLED",
  "computedStatus": "CANCELLED",
  "cancellationReason": "PATIENT_REQUEST: Bệnh nhân hủy do bận đột xuất",
  ...
}
```

### Edge Case 2: Appointment đã COMPLETED - Hiển thị actualStartTime/actualEndTime

**Login as**: admin

```
GET /api/v1/appointments/APT-COMPLETED-001
Authorization: Bearer {{admin_token}}
```

**Pre-condition**: Appointment có status = COMPLETED

**Expected**: 200 OK

```json
{
  "appointmentCode": "APT-COMPLETED-001",
  "status": "COMPLETED",
  "computedStatus": "COMPLETED",
  "appointmentStartTime": "2025-11-03T09:00:00",
  "appointmentEndTime": "2025-11-03T09:45:00",
  "actualStartTime": "2025-11-03T09:05:00",
  "actualEndTime": "2025-11-03T09:50:00",
  ...
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION NOTES (P3.4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. RBAC Logic

   - Kiểm tra permission VIEW_APPOINTMENT_ALL trước
   - Nếu không có, check VIEW_APPOINTMENT_OWN:
     - base_role = patient: So sánh patientId
     - base_role = employee: Kiểm tra employeeId HOẶC participant

2. Cancellation Reason

   - Chỉ load khi status = CANCELLED
   - Query appointment_audit_logs với actionType = CANCEL
   - Ghép reasonCode + notes thành chuỗi
   - Nếu không có audit log → cancellationReason = null

3. Response Fields

   - appointmentId: Internal PK (cho FE dễ reference)
   - actualStartTime/actualEndTime: Từ DB (nullable)
   - patient.phone, patient.dateOfBirth: Bổ sung cho detail view
   - createdBy: Tên của employee (JOIN với employees table)

4. Performance

   - N+1 query acceptable cho detail view (1 appointment at a time)
   - Future: Batch load participants nếu cần

5. Security

   - Token PHẢI chứa: account_id, base_role, patient_id (if patient), employee_id (if employee)
   - AccessDeniedException → Spring Security tự động trả về 403
     The AT command has been deprecated. Please use schtasks.exe instead.

The request is not supported.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATCH UPDATE APPOINTMENT STATUS (P3.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ CRITICAL API - Most important for daily clinic operations

Endpoint:
PATCH /api/v1/appointments/{appointmentCode}/status

Permission:

- UPDATE_APPOINTMENT_STATUS

Description:
Cập nhật trạng thái vận hành của lịch hẹn (Check-in, Bắt đầu khám, Hoàn thành, Hủy, Vắng mặt).
API này sử dụng SELECT FOR UPDATE để tránh race condition khi nhiều lễ tân/bác sĩ cập nhật cùng lúc.

️ State Machine (CRITICAL - Must Follow):

```
SCHEDULED (Đã đặt lịch)
   ├─> CHECKED_IN (Bệnh nhân đến, ngồi phòng chờ)
   ├─> CANCELLED (Hủy lịch)
   └─> NO_SHOW (Không đến)

CHECKED_IN (Đã check-in)
   ├─> IN_PROGRESS (Bác sĩ bắt đầu khám)
   └─> CANCELLED (Hủy sau khi đã check-in)

IN_PROGRESS (Đang khám)
   ├─> COMPLETED (Hoàn thành)
   └─> CANCELLED (Hủy giữa chừng - hiếm gặp)

COMPLETED (Terminal state - không chuyển được)
CANCELLED (Terminal state - không chuyển được)
NO_SHOW (Terminal state - không chuyển được)
```

⏰ Timestamp Logic (CRITICAL):

```
SCHEDULED -> CHECKED_IN:
    KHÔNG cập nhật actualStartTime
    Bệnh nhân chỉ mới đến, chưa vào ghế

CHECKED_IN -> IN_PROGRESS:
    CẬP NHẬT actualStartTime = NOW()
    Bác sĩ bắt đầu khám thực sự

IN_PROGRESS -> COMPLETED:
    CẬP NHẬT actualEndTime = NOW()
    Kết thúc điều trị
```

Request Body (Case 1: Check-in):

```json
{
  "status": "CHECKED_IN",
  "notes": "Bệnh nhân đến đúng giờ"
}
```

Request Body (Case 2: Bắt đầu khám):

```json
{
  "status": "IN_PROGRESS",
  "notes": "Bắt đầu khám"
}
```

Request Body (Case 3: Hoàn thành):

```json
{
  "status": "COMPLETED",
  "notes": "Hoàn thành điều trị"
}
```

Request Body (Case 4: Hủy lịch - REQUIRED reasonCode):

```json
{
  "status": "CANCELLED",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Bệnh nhân báo bận đột xuất"
}
```

Request Body (Case 5: Bệnh nhân không đến):

```json
{
  "status": "NO_SHOW",
  "notes": "Đã gọi 3 lần không nghe máy"
}
```

Request Fields:

- status (String Required) - CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
- reasonCode (String) - Bắt buộc khi status=CANCELLED (VD: PATIENT_REQUEST, DOCTOR_UNAVAILABLE)
- notes (String Optional) - Ghi chú thêm

Response 200 (Same structure as API 3.4):

```json
{
  "appointmentId": 1,
  "appointmentCode": "APT-20251104-001",
  "status": "IN_PROGRESS",
  "computedStatus": "IN_PROGRESS",
  "minutesLate": 0,
  "appointmentStartTime": "2025-11-04T09:00:00",
  "appointmentEndTime": "2025-11-04T09:45:00",
  "expectedDurationMinutes": 45,
  "actualStartTime": "2025-11-04T09:05:00",
  "actualEndTime": null,
  "cancellationReason": null,
  "notes": "Bắt đầu khám",
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Đoàn Thanh Phong",
    "phone": "0909123456",
    "dateOfBirth": "1990-01-01"
  },
  "doctor": {
    "employeeCode": "EMP001",
    "fullName": "Lê Anh Khoa"
  },
  "room": {
    "roomCode": "P-01",
    "roomName": "Room P-01"
  },
  "services": [
    {
      "serviceCode": "GEN_EXAM",
      "serviceName": "Khám tổng quát & Tư vấn"
    }
  ],
  "participants": [
    {
      "employeeCode": "EMP007",
      "fullName": "Đoàn Nguyễn Khôi Nguyên",
      "role": "ASSISTANT"
    }
  ],
  "createdBy": "Đỗ Khánh Thuận",
  "createdAt": "2025-11-03T14:00:00"
}
```

Response 404 (Appointment Not Found):

```json
{
  "type": "https://dental-clinic.com/problems/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Appointment not found with code: APT-99999-999",
  "errorCode": "APPOINTMENT_NOT_FOUND"
}
```

Response 409 (Invalid State Transition):

```json
{
  "type": "about:blank",
  "title": "Business Rule Violation",
  "status": 409,
  "detail": "Cannot transition from COMPLETED to CHECKED_IN. Allowed transitions: []",
  "errorCode": "INVALID_STATE_TRANSITION"
}
```

Response 400 (Missing Reason Code):

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Reason code is required when cancelling an appointment",
  "errorCode": "REASON_CODE_REQUIRED"
}
```

Test Cases:

### Success Case 1: Lễ tân check-in bệnh nhân (SCHEDULED -> CHECKED_IN)

**Login as**: thuan.dk (Receptionist)

```
PATCH /api/v1/appointments/APT-20251104-001/status
Authorization: Bearer {{receptionist_token}}

{
  "status": "CHECKED_IN",
  "notes": "Bệnh nhân đến đúng giờ"
}
```

**Expected**: 200 OK

- status = "CHECKED_IN"
- actualStartTime = null (Chưa vào ghế)
- actualEndTime = null

**Use case**: Bệnh nhân đến phòng khám, lễ tân bấm check-in, bệnh nhân ngồi phòng chờ.

### Success Case 2: Bác sĩ bắt đầu khám (CHECKED_IN -> IN_PROGRESS)

**Login as**: khoa.la (Doctor EMP001)

```
PATCH /api/v1/appointments/APT-20251104-001/status
Authorization: Bearer {{doctor_token}}

{
  "status": "IN_PROGRESS",
  "notes": "Bắt đầu khám"
}
```

**Expected**: 200 OK

- status = "IN_PROGRESS"
- actualStartTime = "2025-11-04T09:05:00" (NOW - Thời điểm gọi API)
- actualEndTime = null

**Use case**: Bệnh nhân vào ghế, bác sĩ bấm "Bắt đầu", hệ thống ghi thời gian khám thực tế.

### Success Case 3: Bác sĩ hoàn thành khám (IN_PROGRESS -> COMPLETED)

**Login as**: khoa.la (Doctor EMP001)

```
PATCH /api/v1/appointments/APT-20251104-001/status
Authorization: Bearer {{doctor_token}}

{
  "status": "COMPLETED",
  "notes": "Hoàn thành điều trị"
}
```

**Expected**: 200 OK

- status = "COMPLETED"
- actualStartTime = "2025-11-04T09:05:00" (Từ step trước)
- actualEndTime = "2025-11-04T09:50:00" (NOW - Thời điểm gọi API)

**Business Metrics**:

- Patient Wait Time = actualStartTime - (CHECKED_IN time)
- Treatment Duration = actualEndTime - actualStartTime

### Success Case 4: Lễ tân hủy lịch với lý do (SCHEDULED -> CANCELLED)

**Login as**: thuan.dk (Receptionist)

```
PATCH /api/v1/appointments/APT-20251104-002/status
Authorization: Bearer {{receptionist_token}}

{
  "status": "CANCELLED",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Bệnh nhân gọi điện báo bận đột xuất"
}
```

**Expected**: 200 OK

- status = "CANCELLED"
- cancellationReason = "PATIENT_REQUEST: Bệnh nhân gọi điện báo bận đột xuất"

**Audit Log**: INSERT với actionType = STATUS_CHANGE, reasonCode = PATIENT_REQUEST

### Success Case 5: Lễ tân đánh dấu bệnh nhân không đến (SCHEDULED -> NO_SHOW)

**Login as**: thuan.dk (Receptionist)

```
PATCH /api/v1/appointments/APT-20251104-003/status
Authorization: Bearer {{receptionist_token}}

{
  "status": "NO_SHOW",
  "notes": "Đã gọi 3 lần không nghe máy"
}
```

**Expected**: 200 OK

- status = "NO_SHOW"

**Use case**: Quá giờ hẹn 15 phút, lễ tân đánh dấu không đến.

### Error Case 1: Chuyển từ trạng thái cuối (COMPLETED -> CHECKED_IN)

**Login as**: admin

```
PATCH /api/v1/appointments/APT-COMPLETED-001/status
Authorization: Bearer {{admin_token}}

{
  "status": "CHECKED_IN"
}
```

**Expected**: 409 CONFLICT

```json
{
  "errorCode": "INVALID_STATE_TRANSITION",
  "detail": "Cannot transition from COMPLETED to CHECKED_IN. Allowed transitions: []"
}
```

**Reason**: COMPLETED là trạng thái cuối, không thể chuyển.

### Error Case 2: Hủy lịch mà không có reasonCode

**Login as**: thuan.dk (Receptionist)

```
PATCH /api/v1/appointments/APT-20251104-004/status
Authorization: Bearer {{receptionist_token}}

{
  "status": "CANCELLED"
}
```

**Expected**: 400 BAD REQUEST

```json
{
  "errorCode": "REASON_CODE_REQUIRED",
  "detail": "Reason code is required when cancelling an appointment"
}
```

### Error Case 3: Bỏ qua bước check-in (SCHEDULED -> IN_PROGRESS)

**Login as**: khoa.la (Doctor)

```
PATCH /api/v1/appointments/APT-20251104-005/status
Authorization: Bearer {{doctor_token}}

{
  "status": "IN_PROGRESS"
}
```

**Expected**: 409 CONFLICT

```json
{
  "errorCode": "INVALID_STATE_TRANSITION",
  "detail": "Cannot transition from SCHEDULED to IN_PROGRESS. Allowed transitions: [CHECKED_IN, CANCELLED, NO_SHOW]"
}
```

**Reason**: Phải check-in trước khi bắt đầu khám.

### Error Case 4: Appointment không tồn tại

**Login as**: admin

```
PATCH /api/v1/appointments/APT-99999-999/status
Authorization: Bearer {{admin_token}}

{
  "status": "CHECKED_IN"
}
```

**Expected**: 404 NOT FOUND

### Edge Case 1: Hủy sau khi đã check-in (CHECKED_IN -> CANCELLED)

**Login as**: thuan.dk (Receptionist)

```
PATCH /api/v1/appointments/APT-20251104-006/status
Authorization: Bearer {{receptionist_token}}

{
  "status": "CANCELLED",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Bệnh nhân đến rồi nhưng không muốn khám nữa"
}
```

**Expected**: 200 OK

- status = "CANCELLED"
- cancellationReason = "PATIENT_REQUEST: Bệnh nhân đến rồi nhưng không muốn khám nữa"

**Use case**: Bệnh nhân đã check-in nhưng sau đó từ chối khám.

### Edge Case 2: Hủy giữa chừng (IN_PROGRESS -> CANCELLED)

**Login as**: khoa.la (Doctor)

```
PATCH /api/v1/appointments/APT-20251104-007/status
Authorization: Bearer {{doctor_token}}

{
  "status": "CANCELLED",
  "reasonCode": "MEDICAL_EMERGENCY",
  "notes": "Bệnh nhân có phản ứng dị ứng, chuyển cấp cứu"
}
```

**Expected**: 200 OK

- status = "CANCELLED"
- actualStartTime = "2025-11-04T09:05:00" (Vẫn giữ)
- actualEndTime = null (Chưa hoàn thành)

**Use case**: Trường hợp khẩn cấp phải dừng điều trị.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION NOTES (P3.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SELECT FOR UPDATE (Pessimistic Locking)

   - Query: SELECT \* FROM appointments WHERE appointment_code = ? FOR UPDATE
   - JPA: @Lock(LockModeType.PESSIMISTIC_WRITE)
   - Purpose: Ngăn 2 lễ tân/bác sĩ cùng update status một lúc
   - Transaction: MUST use @Transactional

2. State Machine Validation

   - Hard-coded map: VALID_TRANSITIONS
   - Example: SCHEDULED -> [CHECKED_IN, CANCELLED, NO_SHOW]
   - Invalid transition → 409 CONFLICT
   - Terminal states (COMPLETED, CANCELLED, NO_SHOW) → Empty set

3. Timestamp Update Logic (CRITICAL)

   CHECKED_IN (Lễ tân):

   -  KHÔNG cập nhật actual_start_time
   -  Bệnh nhân chỉ đến phòng chờ, chưa vào ghế

   IN_PROGRESS (Bác sĩ):

   -  CẬP NHẬT actual_start_time = NOW()
   -  Bắt đầu điều trị thực sự

   COMPLETED:

   -  CẬP NHẬT actual_end_time = NOW()
   -  Kết thúc điều trị

   Business Value:

   - Patient Wait Time = actual_start_time - (CHECKED_IN timestamp from audit log)
   - Treatment Duration = actual_end_time - actual_start_time
   - Chair Utilization = Treatment Duration / Expected Duration

4. Business Rule Validation

   - CANCELLED: reasonCode is REQUIRED
   - Validation: Check before updating DB
   - Error: 400 BAD_REQUEST

5. Audit Logging

   - Table: appointment_audit_logs
   - Fields: action_type = STATUS_CHANGE, old_status, new_status, reason_code, notes, changed_by_employee_id
   - Use case: Compliance, tracking who changed what

6. Response Format

   - Return full detail DTO (same as API 3.4)
   - FE can immediately update UI without re-fetching
   - Include actualStartTime, actualEndTime in response

7. Security

   - Permission: UPDATE_APPOINTMENT_STATUS
   - Employee ID from token: auth.principal.username -> employees.account_id
   - If not found → changed_by_employee_id = 0 (SYSTEM)

8. Performance

   - Pessimistic lock: Blocks concurrent updates on SAME appointment
   - Does NOT block updates on DIFFERENT appointments
   - Lock released on transaction commit/rollback

9. Error Handling

   - 404: Appointment not found
   - 409: Invalid state transition
   - 400: Missing reasonCode for CANCELLED
   - 500: Database error (transaction rollback)

10. Future Enhancements (Optional)

    - CHECK_IN_TOO_EARLY validation (>30 minutes before scheduled time)
    - Auto NO_SHOW after 15 minutes late
    - SMS notification on status change
    - WebSocket real-time update to dashboard

11. **Treatment Plan Item Auto-Update (IMPLEMENTED - V21.5)** 

    **Feature**: When appointment status changes, linked treatment plan items automatically update to stay synchronized.

    **Status Mapping**:
    - Appointment `IN_PROGRESS` → Plan items `IN_PROGRESS`
    - Appointment `COMPLETED` → Plan items `COMPLETED` (with `completed_at` timestamp)
    - Appointment `CANCELLED` → Plan items `READY_FOR_BOOKING` (allow re-booking)

    **Implementation** (`AppointmentStatusService.java`):
    ```java
    // Line 132-133: Auto-update trigger
    updateLinkedPlanItemsStatus(appointment.getAppointmentId(), newStatus, now);

    // Lines 286-357: Implementation
    private void updateLinkedPlanItemsStatus(Integer appointmentId, AppointmentStatus appointmentStatus, LocalDateTime timestamp) {
        // 1. Find linked items via appointment_plan_items bridge table
        // 2. Map appointment status to plan item status
        // 3. Update items via SQL (for performance)
        // 4. Log changes for audit trail
    }
    ```

    **Database Query**:
    ```sql
    -- Find linked plan items
    SELECT item_id FROM appointment_plan_items WHERE appointment_id = ?

    -- Update items to COMPLETED (example)
    UPDATE patient_plan_items 
    SET status = CAST(? AS plan_item_status), completed_at = ? 
    WHERE item_id IN (?, ?, ...)
    ```

    **Business Value**:
    -  **Data Consistency**: Plan items always reflect actual treatment progress
    -  **No Manual Updates**: Automatic synchronization reduces errors
    -  **Accurate Tracking**: Treatment plan progress is real-time
    -  **Better UX**: Doctors see correct status without manual updates

    **Testing Notes** (Verified 2025-11-22):
    -  Status transition SCHEDULED → IN_PROGRESS → COMPLETED updates items correctly
    -  CANCELLED appointments revert items to READY_FOR_BOOKING
    -  Standalone appointments (no plan items) are not affected
    -  Transactional safety: rollback if any update fails

12. **Phase Auto-Completion (IMPLEMENTED - V21.5)** 

    **Feature**: When appointment completes and ALL items in a phase are done, the phase automatically updates to COMPLETED.

    **Trigger**: Only when appointment status changes to `COMPLETED`

    **Logic**:
    1. Get unique phase IDs from updated plan items
    2. For each phase, check if ALL items are COMPLETED or SKIPPED
    3. If yes, update phase status to COMPLETED and set completion_date
    4. If no, phase remains in current status (IN_PROGRESS/PENDING)

    **Implementation** (`AppointmentStatusService.java`):
    ```java
    // Line 392: Phase completion trigger
    checkAndCompleteAffectedPhases(itemIds, appointmentStatus);

    // Lines 395-443: Get phases and check each
    private void checkAndCompleteAffectedPhases(List<Long> itemIds, AppointmentStatus appointmentStatus) {
        if (appointmentStatus != AppointmentStatus.COMPLETED) return;
        
        // Get unique phase IDs
        Set<Long> phaseIds = ...;
        
        // Check each phase
        for (Long phaseId : phaseIds) {
            checkAndCompleteSinglePhase(phaseId);
        }
    }

    // Lines 445-491: Check and complete single phase
    private void checkAndCompleteSinglePhase(Long phaseId) {
        PatientPlanPhase phase = phaseRepository.findByIdWithPlanAndItems(phaseId);
        
        // Check if all items COMPLETED or SKIPPED
        boolean allDone = phase.getItems().stream()
            .allMatch(item -> item.getStatus() == COMPLETED || item.getStatus() == SKIPPED);
        
        if (allDone) {
            phase.setStatus(PhaseStatus.COMPLETED);
            phase.setCompletionDate(LocalDate.now());
            phaseRepository.save(phase);
        }
    }
    ```

    **Test Results** (Verified 2025-11-22):
    ```
    Setup: Phase 2 with 4 items
    - Items 4, 5: Already COMPLETED (previous appointments)
    - Items 6, 7: Linked to appointment APT-20251201-001

    Action: Update appointment to COMPLETED

    Result:
     Items 6, 7 → COMPLETED
     Phase 2 → COMPLETED (all 4/4 items done)
     Phase completion_date = 2025-11-22
    ```

    **Business Value**:
    -  **Automatic Progress Tracking**: Phases complete without manual updates
    -  **Accurate Treatment Plans**: Phase status reflects reality
    -  **Better Analytics**: Completion dates for reporting
    -  **Reduced Workload**: No need to manually mark phases complete

    **Edge Cases**:
    -  Partial completion: Phase with 2/4 items done remains IN_PROGRESS
    -  Multiple phases: Each phase checked independently
    -  Error handling: Phase check failure doesn't break main flow

    **Logging** (for debugging):
    ```
    DEBUG: Checking 1 phases for auto-completion
    INFO:  Phase 2 auto-completed: all 4 items are done
    DEBUG: Phase 3 not completed yet: 2/8 items done
    ```

---

## PATCH DELAY APPOINTMENT (P3.6)

**Endpoint:** `PATCH /api/v1/appointments/{appointmentCode}/delay`

**Permission:** `DELAY_APPOINTMENT`

**Roles with Permission:**

- RECEPTIONIST (reschedule for patients)
- DENTIST (delay when needed)
- MANAGER (full control)

### 1. Overview

Delay (reschedule) an appointment to a new time slot. This API:

- Only works for SCHEDULED or CHECKED_IN appointments
- Validates new time is after original time
- Checks conflicts for doctor, room, patient, and participants
- Creates audit log with DELAY action type
- Preserves appointment status (still SCHEDULED/CHECKED_IN after delay)

### 2. Business Rules

1. **Status Validation:**

   - Only `SCHEDULED` or `CHECKED_IN` can be delayed
   - Terminal states (COMPLETED, CANCELLED, NO_SHOW) cannot be delayed
   - IN_PROGRESS cannot be delayed (treatment already started)

2. **Time Validation:**

   - `newStartTime` MUST be after `appointmentStartTime`
   - `newStartTime` should NOT be in the past
   - Duration remains the same (`expectedDurationMinutes`)
   - `newEndTime` = `newStartTime` + `expectedDurationMinutes`

3. **Conflict Checking:**

   - Doctor availability (no conflicting appointments)
   - Room availability (not occupied)
   - Patient availability (no double-booking)
   - Participants availability (nurses, assistants)

4. **Audit Trail:**
   - Action type: `DELAY`
   - Records `oldStartTime` and `newStartTime`
   - Preserves `oldStatus` = `newStatus` (status unchanged)
   - Includes `reasonCode` and `notes`

### 3. Request

#### Path Parameters

- `appointmentCode` (string, required): Appointment code (e.g., "APT-20251115-001")

#### Request Body

```json
{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Bệnh nhân yêu cầu hoãn vì bận việc đột xuất"
}
```

#### Fields

| Field          | Type                  | Required | Description                      |
| -------------- | --------------------- | -------- | -------------------------------- |
| `newStartTime` | LocalDateTime         | Yes      | New start time (ISO 8601 format) |
| `reasonCode`   | AppointmentReasonCode | Yes      | Reason for delay (ENUM)          |
| `notes`        | String                | No       | Additional explanation           |

#### Valid Reason Codes for DELAY

```java
public enum AppointmentReasonCode {
    PATIENT_REQUEST,        // Bệnh nhân yêu cầu
    DOCTOR_EMERGENCY,       // Bác sĩ có việc khẩn cấp
    EQUIPMENT_FAILURE,      // Thiết bị hỏng
    TRAFFIC_DELAY,          // Kẹt xe
    FAMILY_EMERGENCY,       // Gia đình có việc khẩn cấp
    WEATHER_CONDITION,      // Thời tiết xấu
    DOUBLE_BOOKING_ERROR,   // Nhầm lịch trùng
    OTHER_REASON            // Lý do khác
}
```

### 4. Response

#### Success Response (200 OK)

Returns full appointment detail (same as GET /{appointmentCode}):

```json
{
  "appointmentId": 1,
  "appointmentCode": "APT-20251115-001",
  "appointmentStartTime": "2025-11-15T15:00:00",
  "appointmentEndTime": "2025-11-15T15:45:00",
  "status": "SCHEDULED",
  "computedStatus": "SCHEDULED",
  "patient": {
    "patientId": 10,
    "fullName": "Nguyễn Văn An",
    "phone": "0909123456",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE"
  },
  "doctor": {
    "employeeId": 1,
    "employeeCode": "EMP001",
    "fullName": "Dr. Lê Thị Anh",
    "specialization": "ORTHODONTICS"
  },
  "room": {
    "roomId": "R001",
    "roomName": "Phòng khám 1",
    "roomType": "EXAMINATION"
  },
  "services": [
    {
      "serviceId": 1,
      "serviceName": "Niềng răng",
      "serviceDuration": 45
    }
  ],
  "expectedDurationMinutes": 45,
  "actualStartTime": null,
  "actualEndTime": null,
  "cancellationReason": null,
  "participants": [],
  "createdBy": "letan1",
  "createdAt": "2025-11-14T09:00:00"
}
```

#### Error Responses

**400 Bad Request - New time in past**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot delay appointment to a time in the past: 2025-11-14T14:00:00"
}
```

**400 Bad Request - New time before original**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "New start time (2025-11-15T07:00:00) must be after original start time (2025-11-15T08:00:00)"
}
```

**403 Forbidden - No permission**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied"
}
```

**404 Not Found**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Appointment not found: APT-20251115-999"
}
```

**409 Conflict - Invalid status**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Cannot delay appointment in status COMPLETED. Only SCHEDULED or CHECKED_IN appointments can be delayed."
}
```

**409 Conflict - Doctor unavailable**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Doctor has conflicting appointment during 2025-11-15T15:00:00 - 2025-11-15T15:45:00"
}
```

**409 Conflict - Room occupied**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Room R001 is occupied during 2025-11-15T15:00:00 - 2025-11-15T15:45:00"
}
```

**409 Conflict - Patient double-booked**

```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Patient already has another appointment during 2025-11-15T15:00:00 - 2025-11-15T15:45:00"
}
```

### 5. Test Cases

#### Test 1: Success - RECEPTIONIST delays SCHEDULED appointment

**Prerequisites:**

- Login as `letan1` (RECEPTIONIST, has DELAY_APPOINTMENT permission)
- Appointment APT-20251115-001 exists
- Status: SCHEDULED
- Original time: 2025-11-15 08:00
- New time slot 15:00-15:45 is available (doctor, room, patient free)

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Bệnh nhân yêu cầu hoãn vì bận việc đột xuất"
}
```

**Expected Response:**

- Status: `200 OK`
- `appointmentStartTime`: "2025-11-15T15:00:00"
- `appointmentEndTime`: "2025-11-15T15:45:00"
- `status`: "SCHEDULED" (unchanged)
- Audit log created with action=DELAY

**Verification:**

```sql
-- Check appointment updated
SELECT appointment_code, appointment_start_time, appointment_end_time, status
FROM appointments
WHERE appointment_code = 'APT-20251115-001';

-- Check audit log
SELECT action_type, old_start_time, new_start_time, reason_code, notes
FROM appointment_audit_logs
WHERE appointment_id = (SELECT appointment_id FROM appointments WHERE appointment_code = 'APT-20251115-001')
ORDER BY created_at DESC
LIMIT 1;
```

---

#### Test 2: Success - DENTIST delays CHECKED_IN appointment

**Prerequisites:**

- Login as `letran` (DENTIST, has DELAY_APPOINTMENT permission)
- Appointment APT-20251115-002 exists
- Status: CHECKED_IN (patient waiting)
- Original time: 2025-11-15 09:00
- New time slot 10:00-10:45 is available

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-002/delay
Authorization: Bearer {{letran_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T10:00:00",
  "reasonCode": "DOCTOR_EMERGENCY",
  "notes": "Bác sĩ bận xử lý ca khẩn cấp trước"
}
```

**Expected Response:**

- Status: `200 OK`
- `status`: "CHECKED_IN" (unchanged)
- Times updated correctly

---

#### Test 3: Error - Cannot delay COMPLETED appointment

**Prerequisites:**

- Appointment APT-20251114-001 exists
- Status: COMPLETED
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251114-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-16T10:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Test"
}
```

**Expected Response:**

- Status: `409 Conflict`
- Message: "Cannot delay appointment in status COMPLETED..."

---

#### Test 4: Error - New time before original

**Prerequisites:**

- Appointment APT-20251115-001 exists
- Original time: 2025-11-15 08:00
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T07:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Test"
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Message: "New start time (07:00) must be after original start time (08:00)"

---

#### Test 5: Error - Doctor has conflicting appointment

**Prerequisites:**

- Appointment APT-20251115-001 exists (Dr. Lê Trần, 08:00-08:45)
- Appointment APT-20251115-003 exists (Dr. Lê Trần, 15:00-15:45)
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST"
}
```

**Expected Response:**

- Status: `409 Conflict`
- Message: "Doctor has conflicting appointment during 15:00 - 15:45"

---

#### Test 6: Error - Room occupied

**Prerequisites:**

- Appointment APT-20251115-001 exists (Room R001, 08:00-08:45)
- Appointment APT-20251115-004 exists (Room R001, 15:00-16:00)
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "EQUIPMENT_FAILURE"
}
```

**Expected Response:**

- Status: `409 Conflict`
- Message: "Room R001 is occupied during 15:00 - 15:45"

---

#### Test 7: Error - Patient double-booked

**Prerequisites:**

- Patient Nguyễn Văn An has appointment APT-20251115-001 at 08:00
- Same patient has appointment APT-20251115-005 at 15:00
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST"
}
```

**Expected Response:**

- Status: `409 Conflict`
- Message: "Patient already has another appointment during 15:00 - 15:45"

---

#### Test 8: Error - No permission (PATIENT role)

**Prerequisites:**

- Login as `patient_user` (ROLE_PATIENT, does NOT have DELAY_APPOINTMENT)
- Appointment APT-20251115-001 exists (owned by this patient)

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{patient_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST"
}
```

**Expected Response:**

- Status: `403 Forbidden`
- Message: "Access Denied"

---

#### Test 9: Edge Case - Delay to same day (cross date boundary warning)

**Prerequisites:**

- Appointment APT-20251115-001 exists at 2025-11-15 17:00
- Delay to next day 2025-11-16 08:00
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-16T08:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "notes": "Hoãn sang ngày mai"
}
```

**Expected Response:**

- Status: `200 OK`
- Times updated successfully
- Log contains warning: "Appointment delayed from 2025-11-15 to 2025-11-16 (crosses date boundary)"

---

#### Test 10: Success - Delay with participants (nurses)

**Prerequisites:**

- Appointment APT-20251115-001 has participants: Nurse A (08:00-08:45)
- New time slot 15:00-15:45 is free for doctor, room, patient, AND Nurse A
- Login as `letan1`

**Request:**

```http
PATCH /api/v1/appointments/APT-20251115-001/delay
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newStartTime": "2025-11-15T15:00:00",
  "reasonCode": "PATIENT_REQUEST"
}
```

**Expected Response:**

- Status: `200 OK`
- All conflict checks passed (including participant)
- Appointment delayed successfully

**Verification:**

```sql
-- Check participants still assigned
SELECT ap.employee_id, ap.participant_role
FROM appointment_participants ap
JOIN appointments a ON ap.appointment_id = a.appointment_id
WHERE a.appointment_code = 'APT-20251115-001';
```

---

### 6. Database Impact

#### Tables Modified

1. **appointments:**

   - `appointment_start_time`: Updated to new start time
   - `appointment_end_time`: Recalculated (start + duration)
   - `status`: Unchanged (still SCHEDULED/CHECKED_IN)

2. **appointment_audit_logs:**
   - New row inserted:
     - `action_type`: DELAY
     - `old_status`: Same as current status
     - `new_status`: Same as current status
     - `old_start_time`: Original start time
     - `new_start_time`: New start time
     - `reason_code`: From request
     - `notes`: From request
     - `performed_by_employee_id`: Current employee ID

#### Example Audit Log Entry

```sql
INSERT INTO appointment_audit_logs (
    appointment_id,
    action_type,
    old_status,
    new_status,
    old_start_time,
    new_start_time,
    reason_code,
    notes,
    performed_by_employee_id,
    created_at
) VALUES (
    1,
    'DELAY',
    'SCHEDULED',
    'SCHEDULED',
    '2025-11-15 08:00:00',
    '2025-11-15 15:00:00',
    'PATIENT_REQUEST',
    'Bệnh nhân yêu cầu hoãn vì bận việc đột xuất',
    1,
    NOW()
);
```

### 7. Security

- **Permission:** `DELAY_APPOINTMENT`
- **Roles:** RECEPTIONIST, DENTIST, MANAGER
- **Employee ID extraction:** `auth.principal.username` → `employees.account_id`
- **Pessimistic Lock:** Prevents concurrent modifications to same appointment

### 8. Performance

- **Pessimistic Lock:** `SELECT FOR UPDATE` blocks concurrent delays
- **4 Conflict Queries:** Doctor, Room, Patient, Participants (N+1 for participants)
- **Transaction:** All operations atomic (rollback on any conflict)
- **Index Required:**
  - `appointments(employee_id, status, appointment_start_time, appointment_end_time)`
  - `appointments(room_id, status, appointment_start_time, appointment_end_time)`
  - `appointments(patient_id, status, appointment_start_time, appointment_end_time)`
  - `appointment_participants(appointment_id, employee_id)`

### 9. Error Handling

| Status | Scenario              | Message                                                          |
| ------ | --------------------- | ---------------------------------------------------------------- |
| 400    | New time in past      | "Cannot delay appointment to a time in the past: {newStartTime}" |
| 400    | New time ≤ original   | "New start time must be after original start time"               |
| 403    | No permission         | "Access Denied"                                                  |
| 404    | Appointment not found | "Appointment not found: {appointmentCode}"                       |
| 409    | Invalid status        | "Cannot delay appointment in status {status}..."                 |
| 409    | Terminal state        | "Cannot delay appointment in terminal state: {status}"           |
| 409    | Doctor conflict       | "Doctor has conflicting appointment during {start} - {end}"      |
| 409    | Room conflict         | "Room {roomId} is occupied during {start} - {end}"               |
| 409    | Patient conflict      | "Patient already has another appointment during {start} - {end}" |
| 409    | Participant conflict  | "Participant (employeeId={id}) has conflicting appointment..."   |
| 500    | Database error        | Transaction rollback                                             |

### 10. Future Enhancements

- **Notification:** Send SMS/Email to patient about schedule change
- **Auto-reschedule:** Suggest available time slots based on conflicts
- **Bulk delay:** Delay multiple appointments at once (e.g., doctor sick leave)
- **Recurring appointments:** Delay all future occurrences

---

## API 3.7: Reschedule Appointment (Cancel Old + Create New)

### ️ SEED DATA & CONSTRAINTS (Current: Nov 6, 2025)

####  Critical Fixes Applied

1. **Fixed JPA Query Error**: `appointment_start_time` → `appointmentStartTime` (camelCase for JPQL)
2. **Added Future Shifts**: 25+ employee shifts for Nov 6-8 (EMP001-EMP004, nurses)
3. **Added Future Appointments**: 5 appointments for Nov 6-8 for realistic testing
4. **Fixed EMP001**: Now HAS shifts (was empty before)

####  Holiday Constraints

-  **Nov 5, 2025 is MAINTENANCE_WEEK holiday** - NO appointments/shifts allowed
-  **Nov 6-8, 2025** are valid working days with full shift coverage

#### ‍️ Employee Shift Coverage (Nov 6-8, 2025)

**Dentists:**

- **EMP001 (Lê Anh Khoa)**:  Nov 6 (morning+afternoon), Nov 7-8 (morning)
- **EMP002 (Trịnh Công Thái)**:  Nov 6 (morning), Nov 7-8 (morning/afternoon)
- **EMP003 (Jimmy Donaldson)**:  Nov 6 (afternoon), Nov 7 (morning)
- **EMP004 (Junya Ota)**:  Nov 6-7 (morning)

**Nurses:**

- **EMP007 (Y tá Nguyên)**:  Full coverage Nov 6-8 (morning+afternoon)
- **EMP008 (Y tá Khang)**:  Full coverage Nov 6-8 (morning+afternoon)

####  Available Test Appointments

| Code                 | Date           | Time      | Patient     | Doctor     | Room     | Services              | Status        |
| -------------------- | -------------- | --------- | ----------- | ---------- | -------- | --------------------- | ------------- |
| APT-20251104-001     | 2025-11-04     | 09:00     | BN-1001     | EMP001     | P-01     | GEN_EXAM+SCALING      | SCHEDULED     |
| APT-20251104-002     | 2025-11-04     | 14:00     | BN-1002     | EMP002     | P-02     | GEN_EXAM              | SCHEDULED     |
| APT-20251104-003     | 2025-11-04     | 08:00     | BN-1003     | EMP001     | P-01     | GEN_EXAM              | SCHEDULED     |
| **APT-20251106-001** | **2025-11-06** | **09:00** | **BN-1001** | **EMP001** | **P-01** | **GEN_EXAM**          | **SCHEDULED** |
| **APT-20251106-002** | **2025-11-06** | **14:00** | **BN-1002** | **EMP001** | **P-02** | **GEN_EXAM+SCALING**  | **SCHEDULED** |
| **APT-20251107-001** | **2025-11-07** | **10:00** | **BN-1003** | **EMP003** | **P-03** | **GEN_EXAM**          | **SCHEDULED** |
| **APT-20251107-002** | **2025-11-07** | **15:00** | **BN-1004** | **EMP002** | **P-02** | **GEN_EXAM**          | **SCHEDULED** |
| **APT-20251108-001** | **2025-11-08** | **09:30** | **BN-1002** | **EMP001** | **P-01** | **GEN_EXAM+SCALING2** | **SCHEDULED** |

####  Seed Data Resources

**Employees**: EMP001-EMP012 (all have codes, only EMP001-EMP004 are doctors)
**Rooms**: P-01, P-02, P-03, P-04-IMPLANT (use `roomCode`, NOT `room_id`)
**Patients**: BN-1001, BN-1002, BN-1003, BN-1004
**Services**: GEN_EXAM (id=1), SCALING_L1 (id=3), SCALING_L2 (id=4)

####  Recommended Test Cases

-  Reschedule **APT-20251106-001** to Nov 7 (tomorrow)
  --  Reschedule **APT-20251106-002** to Nov 7 with different doctor (example: from EMP001 → EMP002)
-  Do NOT reschedule to Nov 5 (holiday - will fail)
-  Do NOT use Nov 9+ (no shifts defined - will fail)

---

### 1. Overview

**Endpoint:** `POST /api/v1/appointments/{appointmentCode}/reschedule`

**Permission Required:** `CREATE_APPOINTMENT` (Same as create new appointment)

**Business Rationale:**

Rescheduling is fundamentally different from delaying:

- **Delay (API 3.6):** Same appointment, new time (same patient, same services, potentially same doctor/room)
- **Reschedule (API 3.7):** Cancel old appointment + Create new appointment (new time, new doctor, new room)

**Transaction Guarantees:**

- Both operations (cancel + create) happen in ONE database transaction
- If creation fails → Old appointment remains unchanged (rollback)
- Audit trail links both appointments via `rescheduled_to_appointment_id`

**Use Cases:**

1. **Doctor unavailable:** Patient needs different doctor at different time
2. **Room change:** Original room under maintenance
3. **Patient request:** "Can I see Dr. Binh instead of Dr. An?"
4. **Operational flexibility:** Receptionists can reschedule without dual operations

---

### 2. Request Specification

#### HTTP Method & URL

```http
POST /api/v1/appointments/{appointmentCode}/reschedule
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

#### Path Parameters

| Parameter         | Type   | Required | Description                                                |
| ----------------- | ------ | -------- | ---------------------------------------------------------- |
| `appointmentCode` | string |        | Code of appointment to reschedule (e.g., APT-20251105-001) |

#### Request Body (JSON)

```json
{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-06T14:00:00",
  "newParticipantCodes": ["EMP007"],
  "reasonCode": "DOCTOR_UNAVAILABLE",
  "cancelNotes": "BS Lê Anh Khoa bận đột xuất, chuyển cho BS Trịnh Công Thái"
}
```

| Field                 | Type     | Required | Description                                       |
| --------------------- | -------- | -------- | ------------------------------------------------- |
| `newEmployeeCode`     | string   |        | New primary doctor code (e.g., EMP001, EMP002)    |
| `newRoomCode`         | string   |        | New treatment room code (e.g., P-01, P-02)        |
| `newStartTime`        | datetime |        | New start time (ISO 8601: YYYY-MM-DDTHH:MM:SS)    |
| `newParticipantCodes` | string[] |        | Optional: New participants (e.g., EMP007, EMP008) |
| `reasonCode`          | string   |        | Reason for cancellation (old appointment)         |
| `cancelNotes`         | string   |        | Additional cancellation notes                     |

**Business Rules:**

1. **Services Reused:** API 3.7 V1 does NOT allow changing services. The new appointment will have the same services as the old one.
   - Rationale: Changing services requires different validation logic (specialization, room compatibility, duration calculation)
   - If services need to change → Use Cancel (3.5) + Create New (3.2) separately
2. **Patient Unchanged:** Same patient. Cannot reschedule to a different patient.
3. **Validation:** New appointment goes through full validation (shifts, conflicts, room compatibility)
4. **Time Constraint:** newStartTime must not be in the past

---

### 3. Response Specification

#### Success Response

**HTTP Status:** `200 OK` (Not 201 CREATED - because it's an update operation that cancels + creates)

**Response Body:**

```json
{
  "cancelledAppointment": {
    "appointmentCode": "APT-20251105-001",
    "status": "CANCELLED",
    "appointmentStartTime": "2025-11-05T09:00:00",
    "appointmentEndTime": "2025-11-05T09:45:00",
    "patient": {
      "patientCode": "BN-1001",
      "fullName": "Đoàn Thanh Phong"
    },
    "doctor": {
      "employeeCode": "EMP001",
      "fullName": "Lê Anh Khoa"
    },
    "room": {
      "roomCode": "P-01",
      "roomName": "Phòng thường 1"
    },
    "services": [
      {
        "serviceCode": "GEN_EXAM",
        "serviceName": "Khám tổng quát & Tư vấn",
        "price": 100000
      }
    ],
    "cancellationReason": {
      "reasonCode": "DOCTOR_UNAVAILABLE",
      "notes": "BS Lê Anh Khoa bận đột xuất, chuyển cho BS Trịnh Công Thái"
    },
    "rescheduledToAppointmentId": 245
  },
  "newAppointment": {
    "appointmentCode": "APT-20251106-005",
    "status": "SCHEDULED",
    "appointmentStartTime": "2025-11-06T14:00:00",
    "appointmentEndTime": "2025-11-06T14:30:00",
    "patient": {
      "patientCode": "BN-1001",
      "fullName": "Đoàn Thanh Phong"
    },
    "doctor": {
      "employeeCode": "EMP002",
      "fullName": "Trịnh Công Thái"
    },
    "room": {
      "roomCode": "P-02",
      "roomName": "Phòng thường 2"
    },
    "services": [
      {
        "serviceCode": "GEN_EXAM",
        "serviceName": "Khám tổng quát & Tư vấn",
        "price": 100000
      }
    ],
    "participants": [
      {
        "employeeCode": "EMP007",
        "fullName": "Đoàn Nguyễn Khôi Nguyên",
        "role": "ASSISTANT"
      }
    ]
  }
}
```

---

### 4. Business Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Lock Old Appointment (SELECT FOR UPDATE)            │
│ - Prevent concurrent modifications                         │
│ - Ensures only one reschedule operation at a time          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Validate Old Appointment Status                     │
│ - Only SCHEDULED or CHECKED_IN can be rescheduled          │
│ - COMPLETED/CANCELLED/NO_SHOW → Error 409                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Get Patient & Services from Old Appointment         │
│ - Query patient table to get patient_code                  │
│ - Query appointment_services to get service_codes          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Build CreateAppointmentRequest                      │
│ - patientCode: from old appointment                        │
│ - serviceCodes: from old appointment                       │
│ - newEmployeeCode, newRoomCode: from request               │
│ - newStartTime: from request                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Create New Appointment (Reuse Creation Logic)       │
│ - Validate doctor, room, services                          │
│ - Check specializations & room compatibility              │
│ - Validate shifts (doctor + participants)                 │
│ - Check conflicts (doctor, room, patient, participants)   │
│ - Insert appointment, services, participants               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Cancel Old Appointment                              │
│ - Set status = CANCELLED                                   │
│ - Set rescheduled_to_appointment_id = new appointment ID   │
│ - Update in database                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Create Dual Audit Logs                              │
│ - Old: action_type = RESCHEDULE_SOURCE                     │
│ - New: action_type = RESCHEDULE_TARGET                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 8: Return Both Appointments                            │
│ - cancelledAppointment: Full details with cancellation     │
│ - newAppointment: Full details of new booking              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Authorization & RBAC

**Permission Required:** `CREATE_APPOINTMENT`

**Rationale:** Since the operation creates a new appointment, it reuses the same permission.

**Who Can Reschedule:**

-  **RECEPTIONIST** (has CREATE_APPOINTMENT)
-  **DENTIST** (has CREATE_APPOINTMENT)
-  **MANAGER** (has CREATE_APPOINTMENT)
-  **PATIENT** (typically does not have this permission - must request via staff)
-  **OBSERVER** (does not have this permission)

**Security Check:**

```java
@PreAuthorize("hasAuthority('CREATE_APPOINTMENT')")
```

**Note:** No new permission (`RESCHEDULE_APPOINTMENT`) was created because:

1. Reschedule = Cancel + Create (both existing operations)
2. Anyone who can create appointments can reschedule them
3. Simplifies RBAC management

---

### 6. Database Impact

#### Tables Modified

| Table                            | Operation | Description                                                  |
| -------------------------------- | --------- | ------------------------------------------------------------ |
| `appointments` (old)             | UPDATE    | Set status=CANCELLED, rescheduled_to_appointment_id={new_id} |
| `appointments` (new)             | INSERT    | Create new appointment record                                |
| `appointment_services` (new)     | INSERT    | Copy services from old appointment                           |
| `appointment_participants` (new) | INSERT    | Insert new participants                                      |
| `appointment_audit_logs`         | INSERT x2 | Two logs: RESCHEDULE_SOURCE and RESCHEDULE_TARGET            |

#### Database State Example

**Before Reschedule:**

```sql
-- appointments table
| appointment_id | appointment_code    | status    | appointment_start_time | ... |
| -------------- | ------------------- | --------- | ---------------------- | --- |
| 123            | APT-20251105-001    | SCHEDULED | 2025-11-05 09:00       | ... |
```

**After Reschedule:**

```sql
-- appointments table (old appointment)
| appointment_id | appointment_code    | status     | rescheduled_to_appointment_id | ... |
| -------------- | ------------------- | ---------- | ----------------------------- | --- |
| 123            | APT-20251105-001    | CANCELLED  | 245                           | ... |

-- appointments table (new appointment)
| appointment_id | appointment_code    | status    | appointment_start_time | ... |
| -------------- | ------------------- | --------- | ---------------------- | --- |
| 245            | APT-20251106-005    | SCHEDULED | 2025-11-06 14:00       | ... |

-- appointment_audit_logs
| log_id | appointment_id | action_type        | old_status | new_status | reason_code         | notes                      |
| ------ | -------------- | ------------------ | ---------- | ---------- | ------------------- | -------------------------- |
| 501    | 123            | RESCHEDULE_SOURCE  | SCHEDULED  | CANCELLED  | DOCTOR_UNAVAILABLE  | BS An Khoa bận đột xuất... |
| 502    | 245            | RESCHEDULE_TARGET  | NULL       | SCHEDULED  | DOCTOR_UNAVAILABLE  | Rescheduled from APT-...   |
```

---

### 7. Validation Rules

#### Validation 1: Old Appointment Status

**Rule:** Only `SCHEDULED` or `CHECKED_IN` appointments can be rescheduled.

**Invalid Statuses:**

- `COMPLETED` → Cannot reschedule finished appointments
- `CANCELLED` → Cannot reschedule already cancelled appointments
- `NO_SHOW` → Cannot reschedule no-show appointments

**Error Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Cannot reschedule appointment in status COMPLETED. Code: APPOINTMENT_NOT_RESCHEDULABLE"
}
```

#### Validation 2: New Time Not in Past

**Rule:** `newStartTime` must be ≥ current time.

**Error Response:**

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot reschedule appointment to a time in the past: 2025-11-01T09:00:00"
}
```

#### Validation 3: Doctor Shift Coverage

**Rule:** New doctor must have working hours covering `newStartTime → newEndTime`.

**Checked via:** `working_schedule` table (fixed shifts + part-time approvals)

**Error Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Doctor EMP002 does not have shift covering 2025-11-06 14:00-14:45"
}
```

#### Validation 4: No Conflicts (Doctor, Room, Patient, Participants)

**Checks:**

1. **Doctor conflict:** New doctor must be available during new time slot
2. **Room conflict:** New room must be available
3. **Patient conflict:** Patient must not have another appointment at same time
4. **Participant conflicts:** All participants must be available

**Error Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Doctor EMP002 has conflicting appointment during 2025-11-06 14:00-14:45"
}
```

#### Validation 5: Room Compatibility

**Rule:** New room must support all services in the appointment.

**Example:** Cannot reschedule XRAY service to a room without X-ray equipment.

**Error Response:**

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Room P-01 does not support service XRAY"
}
```

---

### 8. Test Cases

#### Test 1: Success - Reschedule SCHEDULED appointment

** UPDATED: Using current date Nov 6, 2025 with NEW seed data**

**Prerequisites:**

- Login as `letan1` (RECEPTIONIST, has CREATE_APPOINTMENT permission)
- **NEW Appointment APT-20251106-001** exists (from updated seed data)
  - Status: SCHEDULED
  - Patient: BN-1001 (Đoàn Thanh Phong)
  - Original doctor: EMP001 (Lê Anh Khoa) - NOW HAS SHIFT!
  - Original room: P-01 (room_id=GHE251103001)
  - Original time: 2025-11-06 09:00-09:30
  - Services: GEN_EXAM
- Reschedule to **Nov 7** (tomorrow) with different doctor EMP002
- Room P-02 is available

**Request:**

```http
POST /api/v1/appointments/APT-20251106-001/reschedule
Authorization: Bearer {{letan1_token}}
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-07T09:00:00",
  "newParticipantCodes": ["EMP008"],
  "reasonCode": "DOCTOR_UNAVAILABLE",
  "cancelNotes": "BS Lê Anh Khoa bận đột xuất, chuyển cho BS Trịnh Công Thái ngày 7/11"
}
```

**Expected Response:**

- Status: `200 OK`
- `cancelledAppointment.appointmentCode`: "APT-20251106-001"
- `cancelledAppointment.status`: "CANCELLED"
- `cancelledAppointment.rescheduledToAppointmentId`: Not null
- `newAppointment.status`: "SCHEDULED"
- `newAppointment.appointmentCode`: New code (e.g., APT-20251107-003)
- `newAppointment.doctor.employeeCode`: "EMP002" (changed doctor)
- `newAppointment.room.roomCode`: "P-02" (changed room)
- `newAppointment.appointmentStartTime`: "2025-11-07T09:00:00" (next day)
- Services: Same as old appointment (GEN_EXAM)

**Database Verification:**

```sql
-- Old appointment cancelled
SELECT status, rescheduled_to_appointment_id
FROM appointments
WHERE appointment_code = 'APT-20251104-002';
-- Expected: status=CANCELLED, rescheduled_to_appointment_id IS NOT NULL

-- New appointment created
SELECT appointment_code, status, employee_id, room_id
FROM appointments
WHERE appointment_id = (
  SELECT rescheduled_to_appointment_id
  FROM appointments
  WHERE appointment_code = 'APT-20251104-002'
);
-- Expected: status=SCHEDULED, different employee/room

-- Audit logs created
SELECT action_type, reason_code
FROM appointment_audit_logs
WHERE appointment_id IN (
  SELECT appointment_id FROM appointments WHERE appointment_code = 'APT-20251104-002'
  UNION
  SELECT rescheduled_to_appointment_id FROM appointments WHERE appointment_code = 'APT-20251104-002'
)
ORDER BY created_at DESC;
-- Expected: Two logs (RESCHEDULE_SOURCE, RESCHEDULE_TARGET)
```

---

#### Test 2: Success - Reschedule with multiple services

** UPDATED: Using APT-20251106-002 (current date Nov 6)**

**Prerequisites:**

- **NEW Appointment APT-20251106-002** exists (from updated seed data)
- Status: SCHEDULED
- Patient: BN-1002 (Phạm Văn Phong)
- Original doctor: EMP001 (Lê Anh Khoa) -- NOTE: seed data corrected to EMP001 (has PERIODONTICS specialization)
- Original room: P-02
- Original time: 2025-11-06 14:00-14:45 (afternoon today)
- Services: GEN_EXAM + SCALING_L1 (2 services)
- Reschedule to **tomorrow morning** (Nov 7) with EMP002 (example: EMP001 → EMP002)

**Request:**

```http
POST /api/v1/appointments/APT-20251106-002/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-07T09:00:00",
  "newParticipantCodes": ["EMP008"],
  "reasonCode": "PATIENT_REQUEST",
  "cancelNotes": "Bệnh nhân yêu cầu đổi sang sáng mai. Chuyển từ BS Khoa sang BS Thái"
}
```

**Expected Response:**

- Status: `200 OK`
- `cancelledAppointment.appointmentCode`: "APT-20251106-002"
- `newAppointment.appointmentCode`: New code (e.g., APT-20251107-004)
- `newAppointment.doctor.employeeCode`: "EMP002" (changed doctor)
- `newAppointment.appointmentStartTime`: "2025-11-07T09:00:00" (next day)
- **Services preserved**: GEN_EXAM + SCALING_L1 (both services transferred)
- **Participant changed**: EMP008 (Y tá Khang) remains as participant in this example

**Business Note:** When rescheduling, all services are automatically transferred to the new appointment.

---

#### Test 3: Error - Cannot reschedule COMPLETED appointment

**Prerequisites:**

- Create appointment APT-20251104-001, then mark as COMPLETED via API 3.5
- Status: COMPLETED

**Request:**

```http
POST /api/v1/appointments/APT-20251104-001/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-06T09:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "cancelNotes": "NOTE: Avoiding Nov 5 (holiday)"
}
```

**Expected Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Cannot reschedule completed appointment. Code: APPOINTMENT_NOT_RESCHEDULABLE"
}
```

---

#### Test 4: Error - Cannot reschedule CANCELLED appointment

**Prerequisites:**

- Create appointment, then mark as CANCELLED via API 3.5
- Status: CANCELLED

**Request:** (Use a cancelled appointment code)

**Expected Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Cannot reschedule cancelled appointment. Code: APPOINTMENT_NOT_RESCHEDULABLE"
}
```

---

#### Test 5: Error - New time in the past

**Prerequisites:**

- Appointment APT-20251104-003 exists (from seed data)
- Status: SCHEDULED
- Current time: 2025-11-04 12:00

**Request:**

```http
POST /api/v1/appointments/APT-20251104-003/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-04T07:00:00",
  "reasonCode": "DOCTOR_UNAVAILABLE"
}
```

**Expected Response:**

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot reschedule appointment to a time in the past: 2025-11-04T07:00:00"
}
```

---

#### Test 6: Error - New doctor has conflict

**Prerequisites:**

- Appointment APT-20251104-002 exists (Status: SCHEDULED)
- Doctor EMP002 (Trịnh Công Thái) already has APT-20251104-002 at 2025-11-04 14:00-14:30
- Try to reschedule APT-20251104-001 to same time with same doctor

**Request:**

```http
POST /api/v1/appointments/APT-20251104-001/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-04T14:00:00",
  "reasonCode": "PATIENT_REQUEST"
}
```

**Expected Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Doctor EMP002 has conflicting appointment during 2025-11-04 14:00:00 - 14:30:00"
}
```

**Note:** EMP002 already has APT-20251104-002 at this time

---

#### Test 7: Error - New room occupied

**Prerequisites:**

- Try to reschedule APT-20251104-001 to room P-02
- But P-02 is already occupied by APT-20251104-002 at 14:00-14:30

**Request:**

```http
POST /api/v1/appointments/APT-20251104-001/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP001",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-04T14:00:00",
  "reasonCode": "ROOM_MAINTENANCE"
}
```

**Expected Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Room P-02 is occupied during 2025-11-04 14:00:00 - 14:30:00"
}
```

---

#### Test 8: Error - Patient has conflict

**Prerequisites:**

- Patient BN-1001 already has APT-20251104-001 at 09:00-09:45
- Create new appointment for BN-1001, then try to reschedule to overlapping time

**Request:**

```http
POST /api/v1/appointments/{new-appointment-code}/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-04T09:15:00",
  "reasonCode": "DOCTOR_UNAVAILABLE"
}
```

**Expected Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Patient already has another appointment during 2025-11-04 09:15:00 - 10:00:00"
}
```

---

#### Test 9: Error - Doctor does not have shift

**Prerequisites:**

- Appointment APT-20251104-001 exists
- Doctor EMP002 (Trịnh Công Thái) does NOT work on Sundays (2025-11-09)

**Request:**

```http
POST /api/v1/appointments/APT-20251104-001/reschedule
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-09T09:00:00",
  "reasonCode": "PATIENT_REQUEST"
}
```

**Expected Response:**

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Doctor EMP002 does not have shift covering 2025-11-09 09:00:00 - 09:45:00"
}
```

---

#### Test 10: Error - No CREATE_APPOINTMENT permission

**Prerequisites:**

- Login as `patient_user` (PATIENT role, does NOT have CREATE_APPOINTMENT permission)
- Appointment APT-20251104-001 exists

**Request:**

```http
POST /api/v1/appointments/APT-20251104-001/reschedule
Authorization: Bearer {{patient_token}}
Content-Type: application/json

{
  "newEmployeeCode": "EMP002",
  "newRoomCode": "P-02",
  "newStartTime": "2025-11-06T14:00:00",
  "reasonCode": "PATIENT_REQUEST",
  "cancelNotes": "NOTE: Avoiding Nov 5 holiday"
}
```

**Expected Response:**

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied"
}
```

**Note:** Patients cannot reschedule their own appointments. They must contact reception staff.

---

### 9. Seed Data Validation & Testing Guide

####  Pre-Restart Checklist

Before restarting application, verify seed data was updated correctly:

```bash
# Check if new shifts were added to seed file
grep -c "EMS251106" src/main/resources/db/dental-clinic-seed-data.sql
# Expected: 9 (new shift IDs for Nov 6)

grep -c "APT-20251106" src/main/resources/db/dental-clinic-seed-data.sql
# Expected: 2 (new appointments for Nov 6)
```

####  Post-Restart Validation

After application starts successfully, run these SQL queries:

**1. Verify Employee Shifts (Nov 6-8):**

```sql
SELECT
    e.employee_code,
    e.first_name || ' ' || e.last_name as name,
    COUNT(*) as shift_count,
    MIN(es.work_date) as first_shift,
    MAX(es.work_date) as last_shift
FROM employee_shifts es
JOIN employees e ON es.employee_id = e.employee_id
WHERE es.work_date >= '2025-11-06'
  AND es.work_date <= '2025-11-08'
  AND e.employee_id IN (1,2,3,4,7,8)
GROUP BY e.employee_code, e.first_name, e.last_name
ORDER BY e.employee_id;

-- Expected Output:
-- EMP001 (Lê Anh Khoa): 5 shifts (Nov 6 morning+afternoon, Nov 7-8 morning+afternoon)
-- EMP002 (Trịnh Công Thái): 3 shifts
-- EMP003 (Jimmy Donaldson): 2 shifts
-- EMP004 (Junya Ota): 2 shifts
-- EMP007 (Y tá Nguyên): 4 shifts
-- EMP008 (Y tá Khang): 4 shifts
```

**2. Verify New Appointments:**

```sql
SELECT
    a.appointment_code,
    a.appointment_start_time,
    e.employee_code as doctor,
    p.patient_code,
    r.room_code,
    a.status,
    COUNT(asvc.service_id) as service_count
FROM appointments a
JOIN employees e ON a.employee_id = e.employee_id
JOIN patients p ON a.patient_id = p.patient_id
JOIN rooms r ON a.room_id = r.room_id
LEFT JOIN appointment_services asvc ON a.appointment_id = asvc.appointment_id
WHERE a.appointment_code LIKE 'APT-202511%'
GROUP BY a.appointment_code, a.appointment_start_time, e.employee_code, p.patient_code, r.room_code, a.status
ORDER BY a.appointment_start_time;

-- Expected: 8 appointments (3 old Nov 4 + 5 new Nov 6-8)
-- APT-20251106-001: Nov 6 09:00, EMP001, BN-1001, P-01, 1 service
-- APT-20251106-002: Nov 6 14:00, EMP001, BN-1002, P-02, 2 services
-- APT-20251107-001: Nov 7 10:00, EMP003, BN-1003, P-03, 1 service
-- APT-20251107-002: Nov 7 15:00, EMP002, BN-1004, P-02, 1 service
-- APT-20251108-001: Nov 8 09:30, EMP001, BN-1002, P-01, 2 services
```

**3. Verify Holiday Blocking:**

```sql
SELECT holiday_date, definition_id, description
FROM holiday_dates
WHERE holiday_date = '2025-11-05';

-- Expected: 1 row (Nov 5 is MAINTENANCE_WEEK holiday)
```

**4. Verify Specializations (Critical for doctors):**

```sql
SELECT
    e.employee_code,
    e.first_name || ' ' || e.last_name as name,
    array_agg(es.specialization_id ORDER BY es.specialization_id) as specializations,
    CASE WHEN 8 = ANY(array_agg(es.specialization_id))
         THEN ' HAS STANDARD'
         ELSE ' MISSING STANDARD'
    END as has_required_standard
FROM employees e
JOIN employee_specializations es ON e.employee_id = es.employee_id
WHERE e.employee_id IN (1,2,3,4)
GROUP BY e.employee_code, e.first_name, e.last_name
ORDER BY e.employee_id;

-- Expected: ALL doctors should show " HAS STANDARD"
-- EMP001: [1,3,4,8] - Chỉnh nha + Nha chu + Phục hồi + STANDARD
-- EMP002: [2,7,8] - Nội nha + Thẩm mỹ + STANDARD
-- EMP003: [6,8] - Trẻ em + STANDARD
-- EMP004: [4,5,8] - Phục hồi + Phẫu thuật + STANDARD
```

####  API Testing Workflow

**Step 1: Test GET appointments (verify JPA fix)**

```bash
# Login as bacsi1 (employee_id=1, EMP001)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bacsi1","password":"password123"}'

# Get appointments for bacsi1
curl -X GET "http://localhost:8080/api/v1/appointments" \
  -H "Authorization: Bearer ${BACSI1_TOKEN}"

# Expected: 200 OK (no JPQL error), returns APT-20251106-001, APT-20251108-001
```

**Step 2: Test Reschedule Today → Tomorrow**

```bash
# Reschedule APT-20251106-001 (today 9am) to tomorrow 9am
curl -X POST http://localhost:8080/api/v1/appointments/APT-20251106-001/reschedule \
  -H "Authorization: Bearer ${LETAN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "newEmployeeCode": "EMP002",
    "newRoomCode": "P-02",
    "newStartTime": "2025-11-07T09:00:00",
    "newParticipantCodes": ["EMP008"],
    "reasonCode": "DOCTOR_UNAVAILABLE",
    "cancelNotes": "BS Khoa busy, reschedule to BS Thai tomorrow"
  }'

# Expected: 200 OK
# Response includes cancelledAppointment + newAppointment
```

**Step 3: Verify Database Changes**

```sql
-- Check old appointment cancelled
SELECT appointment_code, status, rescheduled_to_appointment_id
FROM appointments
WHERE appointment_code = 'APT-20251106-001';
-- Expected: status='CANCELLED', rescheduled_to_appointment_id NOT NULL

-- Check new appointment created
SELECT a.appointment_code, a.status, e.employee_code, r.room_code, a.appointment_start_time
FROM appointments a
JOIN employees e ON a.employee_id = e.employee_id
JOIN rooms r ON a.room_id = r.room_id
WHERE a.appointment_id = (
  SELECT rescheduled_to_appointment_id
  FROM appointments
  WHERE appointment_code = 'APT-20251106-001'
);
-- Expected: status='SCHEDULED', employee_code='EMP002', room_code='P-02', date='2025-11-07 09:00'

-- Check audit logs
SELECT action_type, reason_code, notes
FROM appointment_audit_logs
WHERE appointment_id IN (
  SELECT appointment_id FROM appointments WHERE appointment_code = 'APT-20251106-001'
  UNION
  SELECT rescheduled_to_appointment_id FROM appointments WHERE appointment_code = 'APT-20251106-001'
)
ORDER BY created_at DESC;
-- Expected: 2 rows (RESCHEDULE_SOURCE, RESCHEDULE_TARGET)
```

#### ️ Common Errors & Solutions

**Error 1: "Doctor EMP001 has no shift on 2025-11-09"**

- **Cause**: Trying to reschedule beyond Nov 8 (no shifts defined)
- **Solution**: Only reschedule to Nov 6-8

**Error 2: "Cannot reschedule to past date"**

- **Cause**: Using Nov 4 or Nov 5 as target date
- **Solution**: Use Nov 7+ for future appointments

**Error 3: "Duplicate key violates unique constraint uk_employee_date_shift"**

- **Cause**: Seed data has duplicate employee shifts
- **Solution**: Already fixed - manager shifted to Nov 10-11

**Error 4: "Could not resolve attribute 'appointment_start_time'"**

- **Cause**: JPQL query uses snake_case instead of camelCase
- **Solution**: Already fixed in AppointmentRepository.java line 321

---

### 10. Error Handling

| Status | Error Code               | Message Example                                                  |
| ------ | ------------------------ | ---------------------------------------------------------------- |
| 400    | Bad Request              | "New start time cannot be in the past"                           |
| 400    | Invalid room             | "Room P-BASIC-01 does not support service SV-X-QUANG"            |
| 403    | Forbidden                | "Access Denied" (no CREATE_APPOINTMENT permission)               |
| 404    | Appointment not found    | "Appointment not found: APT-20251105-999"                        |
| 409    | Invalid status           | "Cannot reschedule appointment in status COMPLETED..."           |
| 409    | Doctor conflict          | "Doctor has conflicting appointment during {start} - {end}"      |
| 409    | Room conflict            | "Room is occupied during {start} - {end}"                        |
| 409    | Patient conflict         | "Patient already has another appointment during {start} - {end}" |
| 409    | Participant conflict     | "Participant has conflicting appointment during {start} - {end}" |
| 409    | Doctor shift unavailable | "Doctor does not have shift covering {start} - {end}"            |
| 500    | Database error           | Transaction rollback (both cancel and create are reverted)       |

---

### 10. Comparison with Related APIs

| Feature                 | API 3.5 (Cancel)         | API 3.6 (Delay)     | API 3.7 (Reschedule)         |
| ----------------------- | ------------------------ | ------------------- | ---------------------------- |
| HTTP Method             | PATCH                    | PATCH               | POST                         |
| Operation               | Update status            | Update times        | Cancel + Create              |
| Changes doctor          |  No                    |  No               |  Yes                       |
| Changes room            |  No                    |  No (typically)   |  Yes                       |
| Changes patient         |  No                    |  No               |  No                        |
| Changes services        |  No                    |  No               |  No (V1)                   |
| Requires reasonCode     |  Yes                   |  Yes              |  Yes                       |
| Creates new appointment |  No                    |  No               |  Yes                       |
| Database transactions   | 1 (UPDATE)               | 1 (UPDATE)          | 2 (UPDATE + INSERT)          |
| Audit log count         | 1                        | 1                   | 2 (source + target)          |
| Permission required     | CANCEL_APPOINTMENT       | DELAY_APPOINTMENT   | CREATE_APPOINTMENT           |
| Typical use case        | Patient no longer coming | Doctor running late | Different doctor/room needed |

**Decision Tree:**

```
Is appointment still happening?
│
├─ No → Use API 3.5 (Cancel)
│
└─ Yes → Will it involve same doctor/room?
         │
         ├─ Yes (just time change) → Use API 3.6 (Delay)
         │
         └─ No (different doctor/room) → Use API 3.7 (Reschedule)
```

---

### 11. Frontend Integration

#### Display Rescheduled Appointments

**Cancelled Appointment View:**

```typescript
// Show in appointment history
if (appointment.rescheduledToAppointmentId) {
  return (
    <div className="appointment-card cancelled">
      <Badge color="gray">Cancelled (Rescheduled)</Badge>
      <p>Original time: {appointment.appointmentStartTime}</p>
      <Link to={`/appointments/${appointment.rescheduledToAppointmentCode}`}>
        View rescheduled appointment →
      </Link>
    </div>
  );
}
```

**Success Message:**

```javascript
onRescheduleSuccess(response) {
  toast.success(
    `Appointment ${response.cancelledAppointment.appointmentCode} has been cancelled.\n` +
    `New appointment ${response.newAppointment.appointmentCode} created for ` +
    `${response.newAppointment.appointmentStartTime}`
  );
}
```

#### Reschedule Button Visibility

```typescript
canReschedule(appointment: Appointment): boolean {
  return (
    userHasPermission('CREATE_APPOINTMENT') &&
    (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN')
  );
}
```

---

### 12. Future Enhancements

1. **Service Changes:** Allow changing services during reschedule (requires complex validation)
2. **Batch Reschedule:** Reschedule multiple appointments at once (e.g., doctor sick leave)
3. **Smart Suggestions:** AI-powered suggestion of best alternative doctor/time slots
4. **Patient Notification:** Auto-send SMS/Email about reschedule with new details
5. **Undo Reschedule:** Revert within 5 minutes (restore old appointment, cancel new)
6. **Recurring Appointments:** Reschedule all future occurrences
7. **Wait List Integration:** Offer cancelled slot to wait-listed patients
8. **Price Adjustment:** Handle price differences if services change in future versions

---

### 13. FINAL SUMMARY - API 3.7 Implementation

####  Code Changes Completed

**1. Backend Files Modified (5 files):**

- `AppointmentRepository.java`: Fixed JPQL query (line 321) - `appointmentStartTime` camelCase
- `RescheduleAppointmentRequest.java`: Request DTO with newEmployeeCode, newRoomCode, newStartTime, etc.
- `RescheduleAppointmentResponse.java`: Response DTO with cancelledAppointment + newAppointment
- `AppointmentRescheduleService.java`: Transaction logic (cancel + create in one transaction)
- `AppointmentController.java`: POST /{code}/reschedule endpoint

**2. Seed Data Updates:**

- Added 25+ employee_shifts for Nov 6-8 (EMP001-EMP004, EMP007-EMP008)
- Added 5 new appointments for Nov 6-8 (APT-20251106-001 through APT-20251108-001)
- Fixed EMP001 shifts (was empty, now has 5 shifts)
- Fixed duplicate shift error (manager moved to Nov 10-11)

**3. Documentation:**

- Complete API 3.7 guide with 12 sections
- 8 test cases (2 success, 6 error scenarios)
- Seed data validation SQL queries
- Testing workflow with curl examples
- Error troubleshooting guide

####  Key Features Implemented

 **Atomic Transaction**: Cancel old + Create new in ONE database transaction
 **Audit Trail**: 2 audit logs (RESCHEDULE_SOURCE + RESCHEDULE_TARGET) with link
 **Service Preservation**: All services from old appointment transferred to new
 **Validation**: Same as create appointment (shift, conflict, specialization checks)
 **Permission**: CREATE_APPOINTMENT required (same as creating new appointment)
 **Flexible Changes**: Can change doctor, room, time, participants in one operation

####  Seed Data Summary (Current: Nov 6, 2025)

**Available Appointments for Testing:**

- **Past**: APT-20251104-001/002/003 (Nov 4) - can reschedule to future
- **Today**: APT-20251106-001/002 (Nov 6) - can reschedule to tomorrow
- **Future**: APT-20251107-001/002, APT-20251108-001 (Nov 7-8)

**Doctor Shift Coverage:**

- **EMP001**: Nov 6-8 (5 shifts total)
- **EMP002**: Nov 6-8 (3 shifts total)
- **EMP003**: Nov 6-7 (2 shifts total)
- **EMP004**: Nov 6-7 (2 shifts total)

**Constraints:**

-  Nov 5 is holiday - CANNOT create appointments
-  Nov 9+ no shifts - CANNOT reschedule beyond Nov 8
-  Nov 6-8 full coverage - CAN reschedule freely

####  Quick Start Test

```bash
# 1. Start application (auto-loads seed data)
./mvnw spring-boot:run

# 2. Login as receptionist
TOKEN=$(curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"letan1","password":"password123"}' \
  | jq -r '.data.access_token')

# 3. Reschedule today's appointment to tomorrow
curl -X POST http://localhost:8080/api/v1/appointments/APT-20251106-001/reschedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newEmployeeCode": "EMP002",
    "newRoomCode": "P-02",
    "newStartTime": "2025-11-07T09:00:00",
    "newParticipantCodes": ["EMP008"],
    "reasonCode": "DOCTOR_UNAVAILABLE",
    "cancelNotes": "Test reschedule - doctor unavailable"
  }'

# 4. Verify result (should return 200 OK with both appointments)
```

####  Validation Checklist

Before deployment, verify:

- [ ] Application starts without errors
- [ ] All 8 appointments exist in database
- [ ] All doctors (EMP001-EMP004) have shifts Nov 6-8
- [ ] All doctors have specialization ID 8 (STANDARD - required)
- [ ] Nov 5 holiday exists in holiday_dates table
- [ ] JPA query error fixed (GET /appointments returns 200 OK)
- [ ] Reschedule API returns 200 OK for valid requests
- [ ] Audit logs created for both old and new appointments
- [ ] Services transferred correctly to new appointment
- [ ] Transaction rollback works (test with invalid data)

####  Lessons Learned

1. **Seed Data Matters**: Wrong test data wastes hours - always verify against real database
2. **JPA vs SQL**: JPQL uses camelCase (appointmentStartTime), SQL uses snake_case (appointment_start_time)
3. **Holiday Blocking**: Business rules trump everything - holiday dates block all operations
4. **Required Data**: Doctors MUST have both shifts AND specialization ID 8 (STANDARD)
5. **Duplicate Keys**: Always check for unique constraints before adding seed data
6. **Documentation**: Keep one source of truth (Appointment.md) - don't split into multiple files

---
