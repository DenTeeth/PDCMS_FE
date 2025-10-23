# Appointment System Flow Diagram

## 📊 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Employee Appointments Page                  │
│                     (Main Container)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─── View Mode Tabs
                     │      ├─ Calendar View
                     │      └─ List View
                     │
                     ├─── New Appointment Button
                     │
                     └─── Modals Layer
                            ├─ CreateAppointmentModal
                            ├─ AppointmentDetailsModal
                            ├─ RescheduleModal
                            └─ CancelModal
```

## 🔄 User Flow: Create Appointment

```
┌──────────────┐
│ Click "New"  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Step 1: Search       │ → Enter patient name/phone
│ Select Patient       │ → Select from results
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Step 2: Choose       │ → View services list
│ Select Service       │ → Select one service
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Step 3: Pick         │ → Choose date
│ Select Date & Time   │ → View available slots
│                      │ → Select time slot
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Step 4: Confirm      │ → Auto-assigned dentist
│ Assigned Dentist     │ → View dentist info
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Step 5: Add Info     │ → Reason for visit
│ Add Notes (Optional) │ → Additional notes
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Step 6: Review       │ → Review all details
│ Confirm              │ → Check conflicts
│                      │ → Create appointment
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Success! ✓           │ → Toast notification
│ Return to Calendar   │ → Calendar refreshed
└──────────────────────┘
```

## 📅 Calendar View Interactions

```
Calendar Display
├─── Day View
│    └─── Hourly slots (8:00 - 20:00)
│
├─── Week View
│    └─── 7 days with time slots
│
└─── Month View
     └─── Monthly grid with events

User Actions:
├─── Click event → View Details Modal
├─── Change view → Day/Week/Month
├─── Navigate → Today/Previous/Next
└─── View legend → Status colors
```

## 📝 List View Interactions

```
Appointment List
├─── Tabs
│    ├─ Today
│    ├─ Upcoming
│    ├─ Past
│    └─ Cancelled
│
├─── Search Bar
│    └─── Filter by: patient, dentist, service, phone
│
└─── Actions per Appointment
     ├─ View → Details Modal
     └─ Edit → Reschedule Modal (if applicable)
```

## 🔄 State Management Flow

```
┌─────────────────┐
│ User Action     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component       │ → useState/useEffect
│ Local State     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Call    │ → appointmentService.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Request     │ → axios via apiClient
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend API     │ → (To be implemented)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Response        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update UI       │ → Toast notification
│                 │ → Refresh data
└─────────────────┘
```

## 🎨 Status Color Flow

```
Appointment Created
      │
      ▼
┌─────────────┐ Blue
│ SCHEDULED   │────────→ Patient books appointment
└─────┬───────┘
      │
      ▼
┌─────────────┐ Green
│ CONFIRMED   │────────→ Staff confirms
└─────┬───────┘
      │
      ▼
┌─────────────┐ Orange
│ CHECKED_IN  │────────→ Patient arrives
└─────┬───────┘
      │
      ▼
┌─────────────┐ Purple
│ IN_PROGRESS │────────→ Treatment starts
└─────┬───────┘
      │
      ▼
┌─────────────┐ Green
│ COMPLETED   │────────→ Treatment done
└─────────────┘

Alternative Paths:
├─── CANCELLED (Red) → Patient/Staff cancels
└─── NO_SHOW (Gray) → Patient doesn't arrive
```

## 🔍 Conflict Detection Flow

```
User Selects Date/Time
      │
      ▼
┌──────────────────────┐
│ Check Available      │
│ Slots API            │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Filter Dentists      │ → Show only available
│ with Available Slots │
└──────┬───────────────┘
       │
       ▼
User Selects Slot
      │
      ▼
┌──────────────────────┐
│ Before Submit:       │
│ Check Conflicts API  │
└──────┬───────────────┘
       │
       ├─── No Conflict → ✓ Create Appointment
       │
       └─── Has Conflict → ✗ Show Error
                             ↓
                      User Selects Different Slot
```

## 📱 Responsive Design Flow

```
Screen Size Detection
      │
      ├─── Desktop (≥768px)
      │    └─── Table Layout
      │         ├─ All columns visible
      │         ├─ Inline actions
      │         └─ Full calendar view
      │
      └─── Mobile (<768px)
           └─── Card Layout
                ├─ Stacked information
                ├─ Bottom action buttons
                └─ Compact calendar
```

## 🔐 Permission Flow (Future)

```
User Accesses Page
      │
      ▼
┌──────────────────────┐
│ Check Permissions    │
└──────┬───────────────┘
       │
       ├─── VIEW_APPOINTMENT ────→ Can view
       │
       ├─── CREATE_APPOINTMENT ──→ Can create
       │
       ├─── UPDATE_APPOINTMENT ──→ Can reschedule
       │
       └─── DELETE_APPOINTMENT ──→ Can cancel
```

## 📊 Data Flow Summary

```
Component Layer
    ↕ (Props, State)
Service Layer (appointmentService.ts)
    ↕ (HTTP Requests)
API Layer (apiClient)
    ↕ (REST API)
Backend Server
    ↕ (Database Queries)
Database
```

## 🎯 Key Integration Points

1. **appointmentService.ts** → Central API integration
2. **types/appointment.ts** → Shared type definitions
3. **apiClient** → Axios instance with auth
4. **Toast notifications** → User feedback (sonner)
5. **FullCalendar** → Calendar rendering
6. **React Hook Form** → Form management
7. **Zod** → Form validation
