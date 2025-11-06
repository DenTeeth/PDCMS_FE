# Booking APIs - Analysis Report & Implementation Plan

## 📋 Executive Summary

Sau khi đọc và phân tích tất cả 3 tài liệu API trong `docs/api-guide/booking`, báo cáo này tổng hợp:
1. Các API đã có trong dự án hiện tại
2. Các API còn thiếu hoặc chưa đúng spec
3. Các vấn đề cần sửa
4. Kế hoạch implementation

---

## 📊 Status Overview

| Module | Total APIs | ✅ Implemented | ⚠️ Needs Fix | ❌ Missing |
|--------|------------|----------------|--------------|------------|
| **Room Management (BE-401)** | 8 | 5 | 2 | 3 |
| **Service Management (BE-402)** | 5 | 3 | 3 | 0 |
| **Appointment Management (BE-403)** | 2 | 1 | 1 | 1 |
| **TOTAL** | **15** | **9** | **6** | **4** |

---

## 1️⃣ ROOM MANAGEMENT (BE-401)

### ✅ APIs Đã Implement Đúng

1. **GET `/api/v1/rooms`** - Get all rooms (paginated)
   - ✅ Implemented: `RoomService.getRooms()`
   - ✅ Supports: pagination, filters, sorting, keyword search
   - ✅ Status: Working correctly

2. **GET `/api/v1/rooms/active`** - Get active rooms
   - ✅ Implemented: `RoomService.getActiveRooms()`
   - ✅ Status: Working correctly

3. **POST `/api/v1/rooms`** - Create new room
   - ✅ Implemented: `RoomService.createRoom()`
   - ✅ Request body matches docs
   - ✅ Status: Working correctly

### ⚠️ APIs Cần Sửa

4. **GET `/api/v1/rooms/{roomCode}`** - Get room by code
   - ⚠️ **Current**: `RoomService.getRoomById(roomId: string)` - Uses `roomId`
   - 📝 **Docs require**: `GET /api/v1/rooms/{roomCode}` - Uses `roomCode`
   - 🔧 **Fix needed**: Add `getRoomByCode(roomCode: string)` method

5. **PUT `/api/v1/rooms/{roomId}`** - Update room
   - ⚠️ **Current**: `RoomService.updateRoom(roomId: string, ...)` - Uses `roomId`
   - 📝 **Docs specify**: `PUT /api/v1/rooms/{roomId}` - Actually matches! ✅
   - 🔧 **Note**: Docs show `roomId` in path, but P1.2 uses `roomCode`. Need clarification from BE.

### ❌ APIs Chưa Có (V16 - NEW)

6. **GET `/api/v1/rooms/{roomCode}/services`** - Get room services
   - ❌ **Status**: Not implemented
   - 📝 **Purpose**: View which services a room supports
   - 🔧 **Priority**: High (needed for appointment booking)

7. **PUT `/api/v1/rooms/{roomCode}/services`** - Update room services
   - ❌ **Status**: Not implemented
   - 📝 **Purpose**: Configure which services a room can perform
   - 🔧 **Priority**: High (needed for room-service compatibility)

8. **DELETE `/api/v1/rooms/{roomId}`** - Soft delete
   - ✅ **Current**: `RoomService.toggleRoomStatus()` - Working but named differently
   - 📝 **Docs specify**: DELETE endpoint
   - ✅ **Note**: Implementation exists but method name could be clearer

---

## 2️⃣ SERVICE MANAGEMENT (BE-402)

### ✅ APIs Đã Implement Đúng

1. **GET `/api/v1/services`** - Get all services (paginated)
   - ✅ Implemented: `ServiceService.getServices()`
   - ✅ Supports: pagination, filters, sorting, keyword search
   - ✅ Status: Working correctly

2. **POST `/api/v1/services`** - Create new service
   - ✅ Implemented: `ServiceService.createService()`
   - ✅ Request body matches docs
   - ✅ Status: Working correctly

3. **GET `/api/v1/services/code/{serviceCode}`** - Get service by code
   - ✅ Implemented: `ServiceService.getServiceByCode()`
   - ⚠️ **Note**: Endpoint is `/code/{serviceCode}` not `/{serviceCode}` as docs show
   - 🔧 **Action**: Verify with BE if docs are correct or code needs update

### ⚠️ APIs Cần Sửa

4. **GET `/api/v1/services/{serviceCode}`** - Get service by code (according to docs)
   - ⚠️ **Current**: `ServiceService.getServiceByCode()` uses `/code/{serviceCode}`
   - 📝 **Docs specify**: `GET /api/v1/services/{serviceCode}` (without `/code/`)
   - 🔧 **Fix needed**: Update endpoint path or verify with BE which is correct

5. **PUT `/api/v1/services/{serviceCode}`** - Update service
   - ⚠️ **Current**: `ServiceService.updateService(serviceId: number, ...)` - Uses `serviceId`
   - 📝 **Docs specify**: `PUT /api/v1/services/{serviceCode}` - Uses `serviceCode`
   - 🔧 **Fix needed**: Change parameter from `serviceId` to `serviceCode`

6. **DELETE `/api/v1/services/{serviceCode}`** - Soft delete
   - ⚠️ **Current**: `ServiceService.deleteService(serviceId: number)` - Uses `serviceId`
   - 📝 **Docs specify**: `DELETE /api/v1/services/{serviceCode}` - Uses `serviceCode`
   - 🔧 **Fix needed**: Change parameter from `serviceId` to `serviceCode`

---

## 3️⃣ APPOINTMENT MANAGEMENT (BE-403)

### ❌ APIs Thiếu (CRITICAL)

1. **GET `/api/v1/appointments/available-times`** - Find available times (P3.1)
   - ❌ **Status**: Not implemented
   - 📝 **Purpose**: Find available time slots for booking before creating appointment
   - 🔧 **Priority**: **CRITICAL** - Core functionality for booking workflow
   - 📋 **Query Params**:
     - `date` (required): YYYY-MM-DD
     - `employeeCode` (required): Doctor code
     - `serviceCodes[]` (required): Array of service codes
     - `participantCodes[]` (optional): Array of assistant codes
   - 📋 **Response**:
     ```typescript
     {
       totalDurationNeeded: number;
       availableSlots: Array<{
         startTime: string; // ISO 8601
         availableCompatibleRoomCodes: string[];
         note?: string | null;
       }>;
       message?: string | null;
     }
     ```

### ⚠️ APIs Cần Sửa

2. **POST `/api/v1/appointments`** - Create appointment (P3.2)
   - ⚠️ **Current Request Body**:
     ```typescript
     {
       patientId: number;
       dentistId: number;
       serviceId: number;
       appointmentDate: string;
       startTime: string;
       endTime: string;
       notes?: string;
       reasonForVisit?: string;
     }
     ```
   - 📝 **Docs Require**:
     ```typescript
     {
       patientCode: string;        // ✅ Should be code, not ID
       employeeCode: string;          // ✅ Should be code, not ID
       roomCode: string;              // ❌ MISSING - Required!
       serviceCodes: string[];       // ✅ Should be array of codes, not single ID
       appointmentStartTime: string;   // ✅ ISO 8601 format
       participantCodes?: string[];   // ❌ MISSING - Optional but important
       notes?: string;
     }
     ```
   - 🔧 **Fix needed**: 
     - Change from IDs to Codes
     - Add `roomCode` (required)
     - Change `serviceId` to `serviceCodes[]` (array)
     - Change `appointmentDate` + `startTime` to `appointmentStartTime` (ISO 8601)
     - Add `participantCodes[]` (optional)
     - Remove `endTime` (calculated by BE from service durations)

---

## 🔍 Issues Found

### Issue 1: Inconsistent ID vs Code Usage

**Problem**: Some APIs use IDs while docs specify Codes.

**Affected APIs**:
- Room: `getRoomById()` vs `GET /rooms/{roomCode}`
- Service: `updateService(serviceId)` vs `PUT /services/{serviceCode}`
- Service: `deleteService(serviceId)` vs `DELETE /services/{serviceCode}`

**Root Cause**: FE was implemented before V2 spec change (docs mention "V2: Changed endpoints from serviceId to serviceCode")

### Issue 2: Missing Room-Service Compatibility (V16)

**Problem**: Room-service compatibility feature (V16) is completely missing.

**Impact**: Cannot validate room-service compatibility when booking appointments.

**Missing APIs**:
- `GET /api/v1/rooms/{roomCode}/services`
- `PUT /api/v1/rooms/{roomCode}/services`

### Issue 3: Appointment API Mismatch

**Problem**: Current appointment creation API doesn't match new BE-403 spec.

**Key Differences**:
1. Uses IDs instead of Codes
2. Missing `roomCode` field
3. Uses single `serviceId` instead of `serviceCodes[]` array
4. Missing `participantCodes[]` for assistants
5. Uses separate `appointmentDate` + `startTime` instead of `appointmentStartTime`
6. Sends `endTime` which should be calculated by BE

### Issue 4: Missing Available Times API (P3.1)

**Problem**: No way to find available slots before booking.

**Impact**: Users must manually guess available times or rely on separate calendar views.

**Business Flow Break**: The intended workflow `P3.1 (Find Times) → P3.2 (Create)` cannot work.

---

## 📋 Implementation Plan

### Phase 1: Fix Existing APIs (Priority: HIGH)

#### 1.1 Room Service Updates
- [ ] Add `getRoomByCode(roomCode: string)` method
- [ ] Verify `PUT /rooms/{roomId}` vs `PUT /rooms/{roomCode}` with BE team
- [ ] Add room-services compatibility endpoints (V16)

#### 1.2 Service Service Updates
- [ ] Change `updateService()` to use `serviceCode` instead of `serviceId`
- [ ] Change `deleteService()` to use `serviceCode` instead of `serviceId`
- [ ] Verify `GET /services/{serviceCode}` endpoint path (current: `/code/{serviceCode}`)

#### 1.3 Appointment Service Updates
- [ ] Refactor `createAppointment()` request body to match P3.2 spec
- [ ] Add `GET /appointments/available-times` endpoint (P3.1)

### Phase 2: Add Missing Features (Priority: CRITICAL)

#### 2.1 Room-Service Compatibility (V16)
- [ ] Create types for room-services
- [ ] Implement `getRoomServices(roomCode: string)`
- [ ] Implement `updateRoomServices(roomCode: string, serviceCodes: string[])`
- [ ] Add UI in room management page to configure services

#### 2.2 Appointment Available Times (P3.1)
- [ ] Create types for available times request/response
- [ ] Implement `findAvailableTimes()` method
- [ ] Create UI component for slot selection
- [ ] Integrate with appointment creation flow

### Phase 3: Update UI Components (Priority: MEDIUM)

#### 3.1 Room Management Page
- [ ] Add "Configure Services" button/modal
- [ ] Display compatible services in room details
- [ ] Add room-service management UI

#### 3.2 Appointment Creation Flow
- [ ] Update form to use codes instead of IDs
- [ ] Add service multi-select (array)
- [ ] Add participant selection (optional)
- [ ] Add room selection (required)
- [ ] Integrate available times API for slot selection

---

## 🎯 Recommended Implementation Order

1. **Week 1: Critical Fixes**
   - Implement `GET /appointments/available-times` (P3.1) ⭐ CRITICAL
   - Fix `POST /appointments` request body to match P3.2 spec

2. **Week 2: Service & Room Fixes**
   - Fix Service update/delete to use `serviceCode`
   - Add Room-Service compatibility APIs (V16)
   - Fix Room endpoints to use `roomCode` where needed

3. **Week 3: UI Integration**
   - Update appointment creation UI
   - Add room-service configuration UI
   - Integrate available times into booking flow

---

## ❓ Questions for Backend Team

1. **Room Endpoints**: Does `PUT /rooms/{roomId}` or `PUT /rooms/{roomCode}`? Docs show both in different sections.

2. **Service Endpoints**: Does `GET /services/{serviceCode}` exist, or only `/services/code/{serviceCode}`?

3. **Appointment Schema**: Confirm the final request body format for `POST /appointments` - are we migrating from IDs to Codes?

4. **Room Availability**: Docs mention room conflict checking is "temporarily disabled" due to schema mismatch. When will this be fixed?

5. **Error Codes**: Should FE handle new error codes like `EMPLOYEE_NOT_QUALIFIED`, `ROOM_NOT_COMPATIBLE`, `PATIENT_HAS_CONFLICT`?

---

## ✅ Testing Checklist

### Room APIs
- [ ] Test `getRoomByCode()` returns correct room
- [ ] Test room-services endpoints return correct services
- [ ] Test updating room services replaces all services
- [ ] Test empty service codes array is rejected

### Service APIs
- [ ] Test `updateService()` with `serviceCode` parameter
- [ ] Test `deleteService()` with `serviceCode` parameter
- [ ] Verify error handling for duplicate service codes

### Appointment APIs
- [ ] Test `findAvailableTimes()` returns correct slots
- [ ] Test with multiple services calculates total duration
- [ ] Test with participants filters out busy slots
- [ ] Test `createAppointment()` with new request format
- [ ] Verify room compatibility validation works
- [ ] Test conflict detection (patient, doctor, room, participants)

---

## 📝 Notes

- All APIs require Bearer token authentication
- All APIs follow RESTful conventions
- Error responses include `errorKey` for programmatic handling
- Pagination uses 0-indexed pages (Spring Boot standard)
- Date formats: YYYY-MM-DD for dates, ISO 8601 for datetimes

---

**Last Updated**: [Current Date]  
**Prepared by**: AI Assistant  
**Review Status**: Pending BE Team Review


