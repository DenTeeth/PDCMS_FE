# Appointment Notes in Treatment Plan - Frontend Integration Guide

##  Overview

**Feature**: Display dentist/assistant notes when viewing appointment details in Treatment Plan tab

**User Story**: When a dentist or assistant completes an appointment and adds notes (e.g., treatment observations, patient condition, next steps), these notes should be visible in the Treatment Plan → Appointment Details section.

**Backend Implementation Date**: November 24, 2025
**API Version**: v1
**Related Entities**: `Appointment`, `PatientTreatmentPlan`, `PatientPlanItem`

---

##  Business Context

### Who Can Add Notes?

-  **Dentists** (DENTIST role)
-  **Dental Assistants** (DENTAL_ASSISTANT role)
-  **NOT Observers** - Observers cannot add notes

### When Are Notes Added?

Notes are added when completing an appointment via:

- **API**: `PATCH /api/v1/appointments/{code}/status`
- **Request Body**: `{ "status": "COMPLETED", "notes": "..." }`

### Where Are Notes Displayed?

Notes appear in:

- **Treatment Plan Detail** → **Phase** → **Item** → **Linked Appointments** → `notes` field
- **API**: `GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}`

---

##  API Endpoint Details

### Get Treatment Plan Detail with Appointment Notes

**Endpoint**: `GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}`

**Authentication**: Required (Bearer Token)

**Path Parameters**:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `patientCode` | String | Patient business code | `BN-1001` |
| `planCode` | String | Treatment plan code | `PLAN-20251120-001` |

**Response Structure**:

```json
{
  "planId": 1,
  "planCode": "PLAN-20251120-001",
  "planName": "Complete Dental Restoration",
  "status": "IN_PROGRESS",
  "approvalStatus": "APPROVED",
  "startDate": "2025-11-20T00:00:00",
  "expectedEndDate": "2025-12-20T00:00:00",
  "totalPrice": 50000000,
  "discountAmount": 5000000,
  "finalCost": 45000000,
  "paymentType": "INSURANCE",
  "createdAt": "2025-11-20T10:30:00",
  "createdBy": {
    "employeeCode": "EMP-001",
    "fullName": "Dr. Nguyen Van A"
  },
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Tran Thi B"
  },
  "phases": [
    {
      "phaseId": 1,
      "phaseNumber": 1,
      "phaseName": "Initial Treatment",
      "status": "IN_PROGRESS",
      "startDate": "2025-11-20T00:00:00",
      "completionDate": null,
      "estimatedDurationDays": 7,
      "items": [
        {
          "itemId": 1,
          "sequenceNumber": 1,
          "itemName": "Root Canal Treatment - Tooth #16",
          "serviceId": 5,
          "serviceCode": "SVC-005",
          "price": 3000000,
          "estimatedTimeMinutes": 90,
          "status": "IN_PROGRESS",
          "completedAt": null,
          "linkedAppointments": [
            {
              "code": "APT-20251120-001",
              "scheduledDate": "2025-11-20T14:00:00",
              "status": "COMPLETED",
              "notes": " First visit completed. Canal cleaned and shaped. Patient tolerated well. Slight sensitivity expected for 24-48 hours. Prescribed pain medication."
            },
            {
              "code": "APT-20251122-002",
              "scheduledDate": "2025-11-22T14:00:00",
              "status": "SCHEDULED",
              "notes": null
            }
          ]
        },
        {
          "itemId": 2,
          "sequenceNumber": 2,
          "itemName": "Tooth Filling - Tooth #15",
          "serviceId": 3,
          "serviceCode": "SVC-003",
          "price": 800000,
          "estimatedTimeMinutes": 45,
          "status": "COMPLETED",
          "completedAt": "2025-11-21T15:30:00",
          "linkedAppointments": [
            {
              "code": "APT-20251121-003",
              "scheduledDate": "2025-11-21T15:00:00",
              "status": "COMPLETED",
              "notes": " Composite filling placed on occlusal surface. Patient advised to avoid hard food for 24 hours. No complications."
            }
          ]
        }
      ]
    }
  ]
}
```

---

##  Field Specifications

### `linkedAppointments[].notes` Field

| Property | Type     | Nullable | Description                                              |
| -------- | -------- | -------- | -------------------------------------------------------- |
| `notes`  | `String` | Yes      | Notes from dentist/assistant when completing appointment |

**Characteristics**:

-  **Can be null** - If appointment not completed or no notes added
-  **Can be empty string** - If dentist submitted without notes
-  **Multi-line support** - Can contain line breaks (`\n`)
-  **Max length** - Database column type: `TEXT` (no practical limit)
-  **Rich content** - Can include observations, prescriptions, next steps

**Example Values**:

```javascript
// Completed appointment with notes
{
  "code": "APT-20251120-001",
  "status": "COMPLETED",
  "notes": "Canal cleaned and shaped. Patient tolerated well. Prescribed pain medication."
}

// Completed appointment without notes
{
  "code": "APT-20251120-002",
  "status": "COMPLETED",
  "notes": null
}

// Scheduled appointment (not completed yet)
{
  "code": "APT-20251122-003",
  "status": "SCHEDULED",
  "notes": null
}
```

---

##  Frontend Implementation Guide

### 1. Display Notes in Treatment Plan View

**Recommended UI Location**:

```
Treatment Plan Tab
└── Phase 1: Initial Treatment
    └── Item 1: Root Canal Treatment - Tooth #16
        └── Linked Appointments
            ├──  APT-20251120-001 - Nov 20, 2025 2:00 PM
            │   ├── Status:  Completed
            │   └──  Notes: "Canal cleaned and shaped. Patient tolerated well..."
            │
            └──  APT-20251122-002 - Nov 22, 2025 2:00 PM
                ├── Status:  Scheduled
                └──  Notes: (Not available yet)
```

### 2. React/Vue Component Example

**React Example**:

```jsx
function LinkedAppointmentCard({ appointment }) {
  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <span className="code">{appointment.code}</span>
        <span className={`status status-${appointment.status.toLowerCase()}`}>
          {appointment.status}
        </span>
      </div>

      <div className="appointment-date">
         {new Date(appointment.scheduledDate).toLocaleString("vi-VN")}
      </div>

      {/* Display notes if available */}
      {appointment.notes && (
        <div className="appointment-notes">
          <div className="notes-header">
            <span className="notes-icon"></span>
            <span className="notes-label">Ghi chú từ bác sĩ/phụ tá:</span>
          </div>
          <div className="notes-content">{appointment.notes}</div>
        </div>
      )}

      {/* Show placeholder for completed appointments without notes */}
      {!appointment.notes && appointment.status === "COMPLETED" && (
        <div className="appointment-notes empty">
          <span className="notes-icon"></span>
          <span className="notes-label">Không có ghi chú</span>
        </div>
      )}
    </div>
  );
}
```

**Vue Example**:

```vue
<template>
  <div class="appointment-card">
    <div class="appointment-header">
      <span class="code">{{ appointment.code }}</span>
      <span :class="`status status-${appointment.status.toLowerCase()}`">
        {{ appointment.status }}
      </span>
    </div>

    <div class="appointment-date">
       {{ formatDate(appointment.scheduledDate) }}
    </div>

    <!-- Display notes if available -->
    <div v-if="appointment.notes" class="appointment-notes">
      <div class="notes-header">
        <span class="notes-icon"></span>
        <span class="notes-label">Ghi chú từ bác sĩ/phụ tá:</span>
      </div>
      <div class="notes-content">
        {{ appointment.notes }}
      </div>
    </div>

    <!-- Show placeholder for completed appointments without notes -->
    <div
      v-else-if="!appointment.notes && appointment.status === 'COMPLETED'"
      class="appointment-notes empty"
    >
      <span class="notes-icon"></span>
      <span class="notes-label">Không có ghi chú</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    appointment: {
      type: Object,
      required: true,
    },
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString("vi-VN");
    },
  },
};
</script>
```

### 3. CSS Styling Suggestions

```css
.appointment-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: #ffffff;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.code {
  font-weight: 600;
  color: #1976d2;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-scheduled {
  background: #fff3e0;
  color: #e65100;
}

.appointment-date {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.appointment-notes {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid #1976d2;
}

.appointment-notes.empty {
  background: #fafafa;
  border-left: 4px solid #bdbdbd;
  font-style: italic;
  color: #999;
}

.notes-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.notes-icon {
  font-size: 16px;
}

.notes-content {
  color: #555;
  line-height: 1.5;
  white-space: pre-wrap; /* Preserve line breaks */
  word-wrap: break-word;
}
```

---

##  Testing Guide

### Test Case 1: Completed Appointment with Notes

**Steps**:

1. Complete an appointment with notes:

   ```bash
   curl -X PATCH http://localhost:8080/api/v1/appointments/APT-20251120-001/status \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "COMPLETED",
       "notes": "Treatment completed successfully. Patient advised to return in 1 week."
     }'
   ```

2. Retrieve treatment plan:

   ```bash
   curl http://localhost:8080/api/v1/patients/BN-1001/treatment-plans/PLAN-20251120-001 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Expected Result**:
   - `linkedAppointments[0].notes` contains the notes
   - Notes display properly in UI

### Test Case 2: Completed Appointment without Notes

**Steps**:

1. Complete an appointment without notes:

   ```bash
   curl -X PATCH http://localhost:8080/api/v1/appointments/APT-20251120-002/status \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "COMPLETED"}'
   ```

2. Retrieve treatment plan

3. **Expected Result**:
   - `linkedAppointments[1].notes` is `null`
   - UI shows "Không có ghi chú" or empty state

### Test Case 3: Scheduled Appointment (Not Completed)

**Steps**:

1. View a treatment plan with scheduled appointments
2. **Expected Result**:
   - `linkedAppointments[].notes` is `null` for scheduled appointments
   - UI should NOT show notes section for scheduled appointments

### Test Case 4: Multi-line Notes

**Steps**:

1. Complete appointment with multi-line notes:

   ```json
   {
     "status": "COMPLETED",
     "notes": "First line: Treatment observations\nSecond line: Patient condition\nThird line: Next steps"
   }
   ```

2. **Expected Result**:
   - Notes display with line breaks preserved
   - Use `white-space: pre-wrap` CSS

---

##  Security & Permissions

### Who Can View Notes?

-  **Dentists** - Can view all notes
-  **Assistants** - Can view all notes
-  **Managers** - Can view all notes
- ️ **Observers** - Can view notes (read-only, cannot add)
-  **Patients** - Can view their own treatment plan notes

### Authorization Check

No additional authorization needed beyond existing treatment plan access control:

- Users who can view treatment plan details can also view appointment notes
- Access control is handled at the treatment plan level (not per-field)

---

##  Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DENTIST/ASSISTANT COMPLETES APPOINTMENT                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PATCH /api/v1/appointments/{code}/status                        │
│ Body: { "status": "COMPLETED", "notes": "..." }                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ AppointmentStatusService.updateStatus()                         │
│ → Saves notes to Appointment.notes field                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND RETRIEVES TREATMENT PLAN                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ GET /api/v1/patients/{code}/treatment-plans/{planCode}          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ TreatmentPlanDetailService.getTreatmentPlanDetail()             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PatientTreatmentPlanRepository.findDetailByPatientCodeAndPlanCode()│
│ → JPQL Query SELECTs: apt.notes                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Service Layer Maps to DTOs                                      │
│ TreatmentPlanDetailDTO.appointmentNotes                         │
│      ↓                                                           │
│ LinkedAppointmentDTO.notes                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND DISPLAYS NOTES IN UI                                │
│ Treatment Plan → Phase → Item → Appointment → Notes             │
└─────────────────────────────────────────────────────────────────┘
```

---

##  FAQ

### Q1: Can notes be edited after appointment completion?

**A**: Currently, notes are set during appointment completion. To edit notes, you would need to update the appointment status again (implementation may vary).

### Q2: What if an appointment has multiple completions?

**A**: Each status update overwrites the previous notes. Only the latest notes are stored.

### Q3: Are notes required when completing an appointment?

**A**: No, `notes` field is optional. Dentists can complete appointments without adding notes.

### Q4: Can I search/filter by appointment notes?

**A**: Not currently supported. Notes are for display purposes in treatment plan context.

### Q5: What's the max length for notes?

**A**: Database column type is `TEXT`, which supports up to 65,535 characters (plenty for clinical notes).

### Q6: Can observers add notes?

**A**:  No, observers cannot add notes. Only dentists and assistants can add notes when completing appointments.

---

##  Support

**Backend Team Contact**: [Your Backend Team]
**API Documentation**: `docs/API_DOCUMENTATION.md`
**Related Guides**:

- `docs/api-guides/booking/appointment/Appointment_Status_Management_API_Guide.md`
- `docs/api-guides/treatment-plan/Treatment_Plan_API_Guide.md`

**Questions?** Open an issue or contact the backend team on Slack/Teams.

---

##  Changelog

| Date       | Version | Changes                                                         |
| ---------- | ------- | --------------------------------------------------------------- |
| 2025-11-24 | 1.0.0   | Initial release - Added `notes` field to `LinkedAppointmentDTO` |

---

**Last Updated**: November 24, 2025
**Document Version**: 1.0.0
**Backend Version**: 0.0.1-SNAPSHOT
