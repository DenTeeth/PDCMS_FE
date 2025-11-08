# 🎯 PART_TIME_FLEX Dynamic Quota Implementation Specification

**Created:** November 6, 2025  
**Status:** 📋 Planning Phase  
**Feature:** Dynamic quota tracking for PART_TIME_FLEX employees with flexible registration periods

---

## 📊 Current vs New System Comparison

### ❌ OLD IMPLEMENTATION (Static 3-month quota)

```
Manager creates part_time_slot:
- quota: 2
- effectiveFrom: 2025-01-01
- effectiveTo: 2025-04-01 (auto-calculated 3 months)
- registered: 0/2

Employee A claims → registered: 1/2 → works for 3 MONTHS
Employee B claims → registered: 2/2 → works for 3 MONTHS
Slot becomes UNAVAILABLE → no more employees can claim

After 3 months → slot expires → both employees freed
```

**Problems:**
- ❌ Fixed 3-month commitment (không linh hoạt)
- ❌ First-come-first-serve (không fair cho late comers)
- ❌ Static quota không theo dõi theo ngày
- ❌ Nhân viên không thể chọn thời gian linh hoạt

---

### ✅ NEW IMPLEMENTATION (Dynamic daily quota tracking)

```
Manager creates part_time_slot:
- workShiftId: WKS_MORNING_01 (8h-11h)
- effectiveFrom: 2025-11-09
- effectiveTo: 2025-11-30
- daysOfWeek: [FRIDAY, SATURDAY]
- quota: 2 (per day)
- Total work days: 6 days (14 Fri, 15 Sat, 21 Fri, 22 Sat, 28 Fri, 29 Sat)

PART_TIME_FLEX Employee A sends REQUEST:
- requestedFrom: 2025-11-09
- requestedTo: 2025-11-16
- Status: PENDING → Manager APPROVES
- Works: 2 days (14 Fri, 15 Sat)

PART_TIME_FLEX Employee B sends REQUEST:
- requestedFrom: 2025-11-09
- requestedTo: 2025-11-30
- Status: PENDING → Manager APPROVES
- Works: 6 days (14 Fri, 15 Sat, 21 Fri, 22 Sat, 28 Fri, 29 Sat)

Dynamic Quota Status:
- 2025-11-09 to 2025-11-16: registered 2/2 (A + B) → UNAVAILABLE
- 2025-11-17 to 2025-11-30: registered 1/2 (B only) → AVAILABLE again!

PART_TIME_FLEX Employee C can now send REQUEST for 2025-11-21 to 2025-11-30!
```

**Advantages:**
- ✅ Linh hoạt cho employees (choose own dates)
- ✅ Manager approval required (quality control)
- ✅ Dynamic quota theo ngày (thực tế hơn)
- ✅ Slot có thể AVAILABLE lại khi emp kết thúc contract
- ✅ Public fair cho tất cả employees (không first-come)

---

## 🗄️ Database Schema Changes

### 1. **Update `part_time_slots` Table**

```sql
ALTER TABLE part_time_slots
-- Remove old 3-month auto calculation
ADD COLUMN effective_to DATE NULL, -- Now manager sets explicitly (was auto-calculated)
-- Keep existing columns
-- quota: number of people needed PER DAY
-- registered: total registrations (deprecated - now calculated dynamically)
-- Add new tracking column
ADD COLUMN days_of_week VARCHAR(255) NOT NULL; -- JSON array: ["FRIDAY","SATURDAY"]
```

**New structure:**
```sql
CREATE TABLE part_time_slots (
  slot_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  work_shift_id VARCHAR(20) NOT NULL,
  work_shift_name VARCHAR(255),
  days_of_week VARCHAR(255) NOT NULL, -- ["FRIDAY","SATURDAY"]
  quota INT NOT NULL DEFAULT 2, -- Number of people needed per day
  registered INT DEFAULT 0, -- Deprecated: use daily_registrations
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_to DATE NULL, -- Manager sets explicitly
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (work_shift_id) REFERENCES work_shifts(work_shift_id)
);
```

---

### 2. **Update `employee_shift_registrations` Table**

```sql
ALTER TABLE employee_shift_registrations
-- Add approval workflow
ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
ADD COLUMN requested_from DATE NOT NULL, -- Employee chooses start date
ADD COLUMN requested_to DATE NULL, -- Employee chooses end date (flexible)
ADD COLUMN approved_by INT NULL, -- Manager employee_id
ADD COLUMN approved_at TIMESTAMP NULL,
ADD COLUMN rejection_reason TEXT NULL;
```

**New structure:**
```sql
CREATE TABLE employee_shift_registrations (
  registration_id VARCHAR(20) PRIMARY KEY, -- REG-YYMMDD-SEQ
  employee_id INT NOT NULL,
  part_time_slot_id BIGINT NOT NULL, -- FK to part_time_slots
  
  -- Flexible date range (employee chooses)
  requested_from DATE NOT NULL,
  requested_to DATE NULL,
  
  -- Approval workflow
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  
  -- Legacy fields (keep for backward compatibility)
  effective_from DATE NOT NULL, -- Same as requested_from if APPROVED
  effective_to DATE, -- Same as requested_to if APPROVED
  days_of_week VARCHAR(255), -- Inherited from part_time_slot
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
  FOREIGN KEY (part_time_slot_id) REFERENCES part_time_slots(slot_id),
  FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
);
```

---

### 3. **New Helper Table: `daily_registrations_view`** (Optional optimization)

```sql
-- Materialized view to track registrations per day
CREATE TABLE daily_registrations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  part_time_slot_id BIGINT NOT NULL,
  work_date DATE NOT NULL,
  registered_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_slot_date (part_time_slot_id, work_date),
  FOREIGN KEY (part_time_slot_id) REFERENCES part_time_slots(slot_id)
);

-- Trigger to update daily_registrations when registration APPROVED/CANCELLED
```

---

## 🔄 Business Logic Changes

### **1. Part-Time Slot Creation (Manager)**

**Endpoint:** `POST /api/v1/part-time-slots`

**Request:**
```json
{
  "workShiftId": "WKS_MORNING_01",
  "daysOfWeek": ["FRIDAY", "SATURDAY"],
  "quota": 2,
  "effectiveFrom": "2025-11-09",
  "effectiveTo": "2025-11-30" // Manager sets explicitly (no auto 3-month)
}
```

**Response:**
```json
{
  "slotId": 1,
  "workShiftId": "WKS_MORNING_01",
  "workShiftName": "Morning Shift (8h-11h)",
  "daysOfWeek": ["FRIDAY", "SATURDAY"],
  "quota": 2,
  "registered": 0,
  "isActive": true,
  "effectiveFrom": "2025-11-09",
  "effectiveTo": "2025-11-30",
  "totalWorkDays": 6, // Calculated: Fridays (14, 21, 28) + Saturdays (15, 22, 29)
  "availableDates": [
    "2025-11-14", "2025-11-15",
    "2025-11-21", "2025-11-22",
    "2025-11-28", "2025-11-29"
  ]
}
```

---

### **2. View Available Slots (PART_TIME_FLEX Employee)**

**Endpoint:** `GET /api/v1/part-time-slots/available`

**Query Params:**
```
?startDate=2025-11-09&endDate=2025-11-30
```

**Response:**
```json
{
  "slots": [
    {
      "slotId": 1,
      "workShiftName": "Morning Shift (8h-11h)",
      "daysOfWeek": ["FRIDAY", "SATURDAY"],
      "quota": 2,
      "effectiveFrom": "2025-11-09",
      "effectiveTo": "2025-11-30",
      "availability": [
        {
          "date": "2025-11-14",
          "dayOfWeek": "FRIDAY",
          "registered": 0,
          "available": 2,
          "status": "AVAILABLE"
        },
        {
          "date": "2025-11-15",
          "dayOfWeek": "SATURDAY",
          "registered": 1,
          "available": 1,
          "status": "AVAILABLE"
        },
        {
          "date": "2025-11-21",
          "dayOfWeek": "FRIDAY",
          "registered": 2,
          "available": 0,
          "status": "FULL"
        }
      ],
      "canRequest": true
    }
  ]
}
```

---

### **3. Send Registration Request (PART_TIME_FLEX Employee)**

**Endpoint:** `POST /api/v1/shift-registrations/request`

**Request:**
```json
{
  "employeeId": 123,
  "partTimeSlotId": 1,
  "requestedFrom": "2025-11-09",
  "requestedTo": "2025-11-16"
}
```

**Validation Rules:**
1. ✅ Employee must be PART_TIME_FLEX
2. ✅ requestedFrom >= part_time_slot.effectiveFrom
3. ✅ requestedTo <= part_time_slot.effectiveTo
4. ✅ requestedFrom must be future date
5. ⚠️ No duplicate PENDING/APPROVED requests for same slot

**Response:**
```json
{
  "registrationId": "REG-251106-001",
  "employeeId": 123,
  "partTimeSlotId": 1,
  "requestedFrom": "2025-11-09",
  "requestedTo": "2025-11-16",
  "status": "PENDING",
  "workDays": [
    "2025-11-14",
    "2025-11-15"
  ],
  "totalWorkDays": 2
}
```

---

### **4. Manager Approves/Rejects Request**

**Endpoint:** `PATCH /api/v1/shift-registrations/{registrationId}/approve`

**Request:**
```json
{
  "action": "APPROVE" // or "REJECT"
  "rejectionReason": "Không đủ kinh nghiệm" // if REJECT
}
```

**Business Logic:**
1. Check quota availability for all work days in requested period
2. If APPROVE:
   - Set status = APPROVED
   - Set approved_by = current_manager_id
   - Set approved_at = now()
   - Set effective_from = requested_from
   - Set effective_to = requested_to
   - Update daily_registrations for each work day +1
3. If REJECT:
   - Set status = REJECTED
   - Set rejection_reason

**Response:**
```json
{
  "registrationId": "REG-251106-001",
  "status": "APPROVED",
  "approvedBy": 5,
  "approvedAt": "2025-11-06T10:30:00",
  "effectiveFrom": "2025-11-09",
  "effectiveTo": "2025-11-16"
}
```

---

### **5. Dynamic Quota Calculation**

**Endpoint:** `GET /api/v1/part-time-slots/{slotId}/quota-status`

**Query Params:**
```
?date=2025-11-21 // Check quota for specific date
```

**Response:**
```json
{
  "slotId": 1,
  "date": "2025-11-21",
  "dayOfWeek": "FRIDAY",
  "quota": 2,
  "registered": 1,
  "available": 1,
  "status": "AVAILABLE",
  "registeredEmployees": [
    {
      "employeeId": 456,
      "employeeName": "Bác sĩ B",
      "registrationId": "REG-251106-002"
    }
  ]
}
```

**SQL Query:**
```sql
SELECT COUNT(DISTINCT esr.employee_id) as registered
FROM employee_shift_registrations esr
WHERE esr.part_time_slot_id = :slotId
  AND esr.status = 'APPROVED'
  AND esr.is_active = TRUE
  AND :targetDate BETWEEN esr.effective_from AND COALESCE(esr.effective_to, '9999-12-31')
  AND JSON_CONTAINS(
    (SELECT days_of_week FROM part_time_slots WHERE slot_id = :slotId),
    JSON_QUOTE(DAYNAME(:targetDate))
  );
```

---

## 🎨 Frontend Changes

### **1. Update TypeScript Types**

**File:** `src/types/workSlot.ts`

```typescript
export interface PartTimeSlot {
  slotId: number;
  workShiftId: string;
  workShiftName: string;
  daysOfWeek: DayOfWeek[]; // Changed from single to array
  quota: number;
  registered: number; // Deprecated - use dailyQuotaStatus
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null; // Manager sets explicitly
  totalWorkDays?: number; // Frontend calculated
  availableDates?: string[]; // Frontend calculated
}

export interface DailyQuotaStatus {
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  quota: number;
  registered: number;
  available: number;
  status: 'AVAILABLE' | 'FULL' | 'EXPIRED';
  registeredEmployees?: RegisteredEmployeeInfo[];
}

export interface PartTimeSlotWithQuota extends PartTimeSlot {
  dailyQuotaStatus: DailyQuotaStatus[];
}
```

**File:** `src/types/shiftRegistration.ts`

```typescript
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface ShiftRegistration {
  registrationId: string;
  employeeId: number;
  partTimeSlotId: number;
  
  // Flexible dates
  requestedFrom: string;
  requestedTo: string | null;
  
  // Approval workflow
  status: RegistrationStatus;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  
  // Effective dates (same as requested if APPROVED)
  effectiveFrom: string;
  effectiveTo: string | null;
  daysOfWeek: DayOfWeek[];
  isActive: boolean;
  
  // Calculated
  workDays?: string[]; // Frontend calculated
  totalWorkDays?: number;
}

export interface CreateShiftRegistrationRequest {
  employeeId: number;
  partTimeSlotId: number;
  requestedFrom: string;
  requestedTo: string | null;
}

export interface ApproveRegistrationRequest {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}
```

---

### **2. Update Services**

**File:** `src/services/workSlotService.ts`

```typescript
class WorkSlotService {
  // ... existing methods

  /**
   * Get available slots for PART_TIME_FLEX employees
   * Returns slots with daily quota status
   */
  async getAvailableSlotsWithQuota(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<PartTimeSlotWithQuota[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/part-time-slots/available', { params });
    return response.data.slots || [];
  }

  /**
   * Get quota status for specific date
   */
  async getQuotaStatus(slotId: number, date: string): Promise<DailyQuotaStatus> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/part-time-slots/${slotId}/quota-status`, {
      params: { date }
    });
    return response.data;
  }

  /**
   * Get all work days for a slot in a date range
   */
  calculateWorkDays(
    daysOfWeek: DayOfWeek[],
    startDate: string,
    endDate: string
  ): string[] {
    const workDays: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const dayNameToDayOfWeek: Record<string, DayOfWeek> = {
      'Sunday': DayOfWeek.SUNDAY,
      'Monday': DayOfWeek.MONDAY,
      'Tuesday': DayOfWeek.TUESDAY,
      'Wednesday': DayOfWeek.WEDNESDAY,
      'Thursday': DayOfWeek.THURSDAY,
      'Friday': DayOfWeek.FRIDAY,
      'Saturday': DayOfWeek.SATURDAY
    };
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      if (daysOfWeek.includes(dayNameToDayOfWeek[dayName])) {
        workDays.push(d.toISOString().split('T')[0]);
      }
    }
    
    return workDays;
  }
}
```

**File:** `src/services/shiftRegistrationService.ts`

```typescript
class ShiftRegistrationService {
  // ... existing methods

  /**
   * Send registration request (PART_TIME_FLEX employee)
   */
  async requestRegistration(data: CreateShiftRegistrationRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post('/shift-registrations/request', data);
    return response.data;
  }

  /**
   * Approve or reject registration (Manager)
   */
  async approveRegistration(
    registrationId: string,
    data: ApproveRegistrationRequest
  ): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.patch(
      `/shift-registrations/${registrationId}/approve`,
      data
    );
    return response.data;
  }

  /**
   * Get pending registrations (Manager view)
   */
  async getPendingRegistrations(params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ShiftRegistration>> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/shift-registrations/pending', { params });
    return response.data;
  }
}
```

---

### **3. Create New Employee UI Page**

**File:** `src/app/employee/part-time-slots/available/page.tsx`

```tsx
"use client";

import { useState, useEffect } from 'react';
import { workSlotService } from '@/services/workSlotService';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { PartTimeSlotWithQuota, DailyQuotaStatus } from '@/types/workSlot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AvailableSlotsPage() {
  const [slots, setSlots] = useState<PartTimeSlotWithQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<PartTimeSlotWithQuota | null>(null);
  const [requestFrom, setRequestFrom] = useState('');
  const [requestTo, setRequestTo] = useState('');

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      const data = await workSlotService.getAvailableSlotsWithQuota({
        startDate: new Date().toISOString().split('T')[0]
      });
      setSlots(data);
    } catch (error) {
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedSlot || !requestFrom) {
      toast.error('Please select dates');
      return;
    }

    try {
      await shiftRegistrationService.requestRegistration({
        employeeId: currentUser.employeeId,
        partTimeSlotId: selectedSlot.slotId,
        requestedFrom: requestFrom,
        requestedTo: requestTo || null
      });
      toast.success('Request sent successfully! Waiting for manager approval.');
      setSelectedSlot(null);
      fetchAvailableSlots();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Available Part-Time Slots</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slots.map((slot) => (
          <Card key={slot.slotId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {slot.workShiftName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Days of Week:</p>
                  <div className="flex gap-2 mt-1">
                    {slot.daysOfWeek.map((day) => (
                      <Badge key={day} variant="outline">{day}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Period:</p>
                  <p className="font-medium">
                    {slot.effectiveFrom} → {slot.effectiveTo || 'Open-ended'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Daily Quota Status:</p>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {slot.dailyQuotaStatus.map((day) => (
                      <div
                        key={day.date}
                        className={`flex justify-between items-center p-2 rounded ${
                          day.status === 'AVAILABLE' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <span className="text-sm">
                          {day.date} ({day.dayOfWeek})
                        </span>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {day.registered}/{day.quota}
                          </span>
                          {day.status === 'AVAILABLE' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedSlot(slot)}
                  className="w-full"
                  disabled={slot.dailyQuotaStatus.every((d) => d.status === 'FULL')}
                >
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request Modal - simplified for brevity */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Send Registration Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Request From Date</label>
                <input
                  type="date"
                  value={requestFrom}
                  onChange={(e) => setRequestFrom(e.target.value)}
                  min={selectedSlot.effectiveFrom}
                  max={selectedSlot.effectiveTo || undefined}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Request To Date (Optional)</label>
                <input
                  type="date"
                  value={requestTo}
                  onChange={(e) => setRequestTo(e.target.value)}
                  min={requestFrom}
                  max={selectedSlot.effectiveTo || undefined}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendRequest} className="flex-1">
                  Send Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSlot(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

### **4. Create Manager Approval Page**

**File:** `src/app/admin/part-time-management/pending-requests/page.tsx`

```tsx
"use client";

import { useState, useEffect } from 'react';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { ShiftRegistration } from '@/types/shiftRegistration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingRequestsPage() {
  const [requests, setRequests] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await shiftRegistrationService.getPendingRegistrations();
      setRequests(response.content || []);
    } catch (error) {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      await shiftRegistrationService.approveRegistration(registrationId, {
        action: 'APPROVE'
      });
      toast.success('Request approved successfully');
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (registrationId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await shiftRegistrationService.approveRegistration(registrationId, {
        action: 'REJECT',
        rejectionReason: reason
      });
      toast.success('Request rejected');
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pending Registration Requests</h1>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.registrationId}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-yellow-100">
                      <Clock className="h-3 w-3 mr-1" />
                      PENDING
                    </Badge>
                    <span className="font-mono text-sm text-gray-600">
                      {request.registrationId}
                    </span>
                  </div>
                  <p className="font-medium">Employee ID: {request.employeeId}</p>
                  <p className="text-sm text-gray-600">
                    Requested: {request.requestedFrom} → {request.requestedTo || 'Open-ended'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Work Days: {request.workDays?.join(', ')} ({request.totalWorkDays} days)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.registrationId)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(request.registrationId)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Plan

### **Test Case 1: Manager creates part-time slot**
**Steps:**
1. Login as Manager
2. Navigate to `/admin/part-time-management`
3. Click "Create Slot"
4. Fill:
   - Work Shift: Morning (8h-11h)
   - Days: FRIDAY, SATURDAY
   - Quota: 2
   - Effective From: 2025-11-09
   - Effective To: 2025-11-30
5. Submit

**Expected:**
- ✅ Slot created with 6 work days (Fridays + Saturdays)
- ✅ Daily quota shows 0/2 for all days
- ✅ Slot appears in available slots

---

### **Test Case 2: PART_TIME_FLEX sends request**
**Steps:**
1. Login as PART_TIME_FLEX employee
2. Navigate to `/employee/part-time-slots/available`
3. View slot daily quota status
4. Click "Send Request"
5. Select dates: 2025-11-09 → 2025-11-16
6. Submit

**Expected:**
- ✅ Request created with status PENDING
- ✅ Work days calculated: 2 days (14 Fri, 15 Sat)
- ✅ Slot still shows AVAILABLE (request not approved yet)

---

### **Test Case 3: Manager approves request**
**Steps:**
1. Login as Manager
2. Navigate to `/admin/part-time-management/pending-requests`
3. View request details
4. Click "Approve"

**Expected:**
- ✅ Request status → APPROVED
- ✅ Daily quota updated: 14 Fri (1/2), 15 Sat (1/2)
- ✅ Other days still 0/2

---

### **Test Case 4: Second employee sends overlapping request**
**Steps:**
1. Login as another PART_TIME_FLEX
2. Send request: 2025-11-09 → 2025-11-30

**Expected after approval:**
- ✅ Days 14-15 Fri/Sat: 2/2 FULL
- ✅ Days 21-22-28-29: 1/2 AVAILABLE

---

### **Test Case 5: Third employee requests remaining slots**
**Steps:**
1. Login as third PART_TIME_FLEX
2. View available slots
3. See slot shows AVAILABLE for Nov 21-29
4. Send request: 2025-11-21 → 2025-11-30

**Expected:**
- ✅ Can still send request (quota available for some days)
- ✅ After approval: all days become FULL
- ✅ Slot no longer shows in available list

---

### **Test Case 6: Employee contract ends - slot becomes available**
**Steps:**
1. Employee A contract ends on 2025-11-16
2. System automatically sets is_active = false
3. Daily quota recalculated

**Expected:**
- ✅ Nov 21-29 quota: 1/2 AVAILABLE again
- ✅ Slot reappears in available list
- ✅ New employees can register

---

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Update `part_time_slots` table schema
- [ ] Update `employee_shift_registrations` table schema
- [ ] Create `daily_registrations` helper table
- [ ] Implement approval workflow endpoints
- [ ] Implement dynamic quota calculation
- [ ] Write unit tests for quota logic
- [ ] Write integration tests

### Frontend Tasks
- [ ] Update TypeScript types (workSlot.ts, shiftRegistration.ts)
- [ ] Update workSlotService with new methods
- [ ] Update shiftRegistrationService with approval methods
- [ ] Create Available Slots page for employees
- [ ] Create Pending Requests page for managers
- [ ] Update Admin Part-Time Management page
- [ ] Add daily quota status components
- [ ] Write E2E tests with Playwright

### Documentation
- [ ] Update API documentation
- [ ] Create user guide for PART_TIME_FLEX employees
- [ ] Create manager guide for approvals
- [ ] Update permission matrix

---

## 🚀 Deployment Plan

1. **Phase 1:** Database migration
2. **Phase 2:** Backend API implementation
3. **Phase 3:** Frontend implementation
4. **Phase 4:** Testing (staging environment)
5. **Phase 5:** Production deployment
6. **Phase 6:** Monitor and fix issues

---

## ✅ Success Criteria

- ✅ Employees can choose flexible start/end dates
- ✅ Manager can approve/reject requests
- ✅ Quota tracked dynamically per day
- ✅ Slots become available when contracts end
- ✅ No race conditions in quota allocation
- ✅ Clear UI showing daily availability
- ✅ Email notifications for approval/rejection

---

**END OF SPECIFICATION**
