# Booking APIs - Implementation Plan

## 📋 Tổng Quan

Sau khi sửa các API hiện tại để match với docs, đây là kế hoạch implementation chi tiết chia thành các phases.

---

## ✅ Phase 0: API Fixes (ĐÃ HOÀN THÀNH)

### Room Service (BE-401)
- ✅ Added `getRoomByCode(roomCode)` method
- ✅ Added `getRoomServices(roomCode)` - V16 feature
- ✅ Added `updateRoomServices(roomCode, request)` - V16 feature
- ✅ Added types for room-services compatibility

### Service Service (BE-402)
- ✅ Changed `updateService()` from `serviceId` to `serviceCode`
- ✅ Changed `deleteService()` from `serviceId` to `serviceCode`
- ✅ Updated `getServiceByCode()` to try standard path first, fallback to `/code/` path

### Appointment Service (BE-403)
- ✅ Updated `createAppointment()` request body to match P3.2 spec:
  - Changed from IDs to Codes
  - Added `roomCode` (required)
  - Changed to `serviceCodes[]` array
  - Changed to `appointmentStartTime` (ISO 8601)
  - Added `participantCodes[]` (optional)
- ✅ Added `findAvailableTimes()` method (P3.1)
- ✅ Added types for available times and new appointment response

---

## 🎯 Phase 1: Update Existing UI Components (Priority: HIGH)

### 1.1 Service Management Page (`/admin/services`)
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Update `updateService()` calls to use `serviceCode` instead of `serviceId`
- [ ] Update `deleteService()` calls to use `serviceCode` instead of `serviceId`
- [ ] Verify service code display and selection works correctly
- [ ] Test update/delete operations with new API signatures

**Files to Update**:
- `src/app/admin/services/page.tsx`

**Testing Checklist**:
- [ ] Update service with new serviceCode parameter
- [ ] Delete service with new serviceCode parameter
- [ ] Verify error handling for invalid serviceCode

---

### 1.2 Room Management Page (`/admin/rooms`)
**Estimated Time**: 3-4 hours

**Tasks**:
- [ ] Replace `getRoomById()` calls with `getRoomByCode()` where appropriate
- [ ] Add "Cấu hình Dịch vụ" (Configure Services) button/modal
- [ ] Display compatible services in room details view
- [ ] Implement room-service management UI

**New Components Needed**:
- `RoomServicesModal.tsx` - Modal to configure room services
- Update room details view to show compatible services

**Files to Update**:
- `src/app/admin/rooms/page.tsx`

**UI Mockup**:
```
Room Details:
- Room Code: P-01
- Room Name: Phòng khám tổng quát 01
- Compatible Services: [Configure] button
  - SV-CAOVOI: Cạo vôi răng (300,000 VND)
  - SV-NHORANG: Nhổ răng thường (500,000 VND)
```

**Testing Checklist**:
- [ ] View room services for a room
- [ ] Update room services (replace all)
- [ ] Verify services are filtered to active services only
- [ ] Test empty service codes validation

---

## 🎯 Phase 2: Appointment Booking Flow (Priority: CRITICAL)

### 2.1 Available Times Component
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Create `AvailableTimesPicker.tsx` component
- [ ] Integrate `findAvailableTimes()` API call
- [ ] Display available slots with time and compatible rooms
- [ ] Handle loading and error states
- [ ] Implement slot selection

**Component Structure**:
```tsx
<AvailableTimesPicker
  date={selectedDate}
  employeeCode={selectedDoctorCode}
  serviceCodes={selectedServices}
  participantCodes={selectedParticipants}
  onSlotSelect={(slot) => {...}}
/>
```

**Features**:
- Date picker for appointment date
- Doctor/employee selection dropdown
- Multi-select for services
- Optional participant selection
- Display slots with compatible rooms
- Show total duration needed
- Show message if no compatible rooms

**Files to Create**:
- `src/app/admin/appointments/components/AvailableTimesPicker.tsx`
- `src/app/employee/appointments/components/AvailableTimesPicker.tsx` (if needed)

**Testing Checklist**:
- [ ] Search available times with valid inputs
- [ ] Handle "no compatible rooms" message
- [ ] Handle "doctor has no shifts" case
- [ ] Handle "all slots busy" case
- [ ] Verify participant availability filtering works

---

### 2.2 Appointment Creation Form Update
**Estimated Time**: 5-6 hours

**Tasks**:
- [ ] Update form to use codes instead of IDs
- [ ] Change patient selection from ID to Code
- [ ] Change doctor selection from ID to Code
- [ ] Add room selection (required)
- [ ] Change service selection to multi-select (array)
- [ ] Add participant selection (optional, multi-select)
- [ ] Change date/time input to ISO 8601 format (`appointmentStartTime`)
- [ ] Remove `endTime` field (calculated by BE)
- [ ] Integrate with `AvailableTimesPicker` component

**Form Flow**:
```
Step 1: Select Patient (by code)
Step 2: Select Doctor/Employee (by code)
Step 3: Select Services (multi-select, array of codes)
Step 4: Select Participants (optional, multi-select)
Step 5: Select Date → Show Available Times
Step 6: Select Slot and Room from Available Times
Step 7: Add Notes (optional)
Step 8: Submit → Create Appointment
```

**Files to Update**:
- `src/app/admin/appointments/components/CreateAppointmentModal.tsx` (if exists)
- `src/app/employee/appointments/components/CreateAppointmentModal.tsx`

**Files to Create**:
- `src/app/admin/appointments/components/NewAppointmentForm.tsx` (if needed)
- `src/app/employee/appointments/components/NewAppointmentForm.tsx` (if needed)

**Testing Checklist**:
- [ ] Create appointment with new request format
- [ ] Verify room code is required
- [ ] Verify service codes array works
- [ ] Test with participants
- [ ] Test without participants
- [ ] Verify ISO 8601 datetime format
- [ ] Handle validation errors from BE
- [ ] Handle conflict errors (patient, doctor, room busy)

---

### 2.3 Appointment Creation Integration
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Connect `AvailableTimesPicker` with appointment creation
- [ ] Auto-fill room code from selected slot
- [ ] Auto-fill `appointmentStartTime` from selected slot
- [ ] Update success/error handling for new response format
- [ ] Update appointment list to use new response structure

**Workflow**:
```typescript
// User selects slot from AvailableTimesPicker
const selectedSlot = availableSlots[0];
const selectedRoom = selectedSlot.availableCompatibleRoomCodes[0];

// Auto-fill form
setFormData({
  ...formData,
  roomCode: selectedRoom,
  appointmentStartTime: selectedSlot.startTime,
});

// Submit
await appointmentService.createAppointment({
  patientCode: formData.patientCode,
  employeeCode: formData.employeeCode,
  roomCode: selectedRoom,
  serviceCodes: formData.serviceCodes,
  appointmentStartTime: selectedSlot.startTime,
  participantCodes: formData.participantCodes,
  notes: formData.notes,
});
```

**Testing Checklist**:
- [ ] Slot selection auto-fills room and time
- [ ] Appointment creation succeeds with new format
- [ ] Response includes appointmentCode
- [ ] Response includes calculated endTime
- [ ] Response includes participants array

---

## 🎯 Phase 3: UI Enhancements & Polish (Priority: MEDIUM)

### 3.1 Room-Service Management UI
**Estimated Time**: 3-4 hours

**Features**:
- Modal to configure room services
- Display active services list
- Multi-select for services
- Validation (must select at least 1 service, services must be active)
- Show service details (code, name, price)
- Search/filter services in selection

**Files to Create**:
- `src/app/admin/rooms/components/RoomServicesModal.tsx`

**Testing Checklist**:
- [ ] Open modal from room details
- [ ] Display current room services
- [ ] Select multiple services
- [ ] Save updates (replace all)
- [ ] Verify services are updated correctly
- [ ] Handle error (inactive service, service not found)

---

### 3.2 Appointment Calendar Integration
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Update appointment calendar to use new appointment structure
- [ ] Display room information in calendar events
- [ ] Display services array in event details
- [ ] Display participants in event details
- [ ] Update filters to use codes where needed

**Files to Update**:
- `src/app/admin/appointments/components/AppointmentCalendar.tsx` (if exists)
- `src/app/employee/appointments/components/AppointmentCalendar.tsx` (if exists)

---

### 3.3 Error Handling Improvements
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Add error handling for new error codes:
  - `EMPLOYEE_NOT_QUALIFIED`
  - `ROOM_NOT_COMPATIBLE`
  - `PATIENT_HAS_CONFLICT`
  - `EMPLOYEE_SLOT_TAKEN`
  - `ROOM_SLOT_TAKEN`
  - `PARTICIPANT_SLOT_TAKEN`
- [ ] Add user-friendly error messages
- [ ] Add retry logic for transient errors

**Files to Update**:
- Error handling utilities
- Appointment creation components

---

## 📊 Implementation Timeline

### Week 1: API Fixes & Service/Room Updates
- **Day 1-2**: Fix Service Management UI (Phase 1.1)
- **Day 3-4**: Fix Room Management UI + Add Room-Service config (Phase 1.2)
- **Day 5**: Testing & bug fixes

### Week 2: Appointment Booking Core
- **Day 1-2**: Available Times Component (Phase 2.1)
- **Day 3-4**: Appointment Creation Form Update (Phase 2.2)
- **Day 5**: Integration & Testing (Phase 2.3)

### Week 3: Polish & Enhancements
- **Day 1-2**: Room-Service Management UI polish (Phase 3.1)
- **Day 3-4**: Appointment Calendar Integration (Phase 3.2)
- **Day 5**: Error Handling & Final Testing (Phase 3.3)

**Total Estimated Time**: ~3 weeks

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Test all service methods with new signatures
- [ ] Test type definitions match API responses
- [ ] Test error handling for new error codes

### Integration Tests
- [ ] Test full booking flow: Find times → Select slot → Create appointment
- [ ] Test room-service configuration flow
- [ ] Test error scenarios (conflicts, invalid codes, etc.)

### Manual Testing
- [ ] Test in development environment
- [ ] Test with real backend API
- [ ] Test edge cases (no slots, no rooms, etc.)
- [ ] Test with different user roles (admin, receptionist, employee)

---

## 📝 Notes & Considerations

### Backward Compatibility
- Legacy methods (`getRoomById`, `getServiceById`, `createAppointmentLegacy`) are marked as `@deprecated` but kept for backward compatibility
- Gradually migrate existing code to use new methods
- Remove legacy methods after full migration

### API Path Verification
- `GET /services/{serviceCode}` might not exist - fallback to `/services/code/{serviceCode}`
- Verify with BE team which paths are correct
- Update implementation based on actual API behavior

### Error Codes
- New error codes need user-friendly Vietnamese messages
- Consider creating error code mapping utility

### Performance
- Available times API might be slow with many services/participants
- Consider adding loading states and optimistic UI updates
- Consider caching available times for same day/doctor

---

## ✅ Definition of Done

### Phase 1 Complete
- [ ] All existing UI components updated to use new API signatures
- [ ] No TypeScript errors
- [ ] All existing functionality works with new APIs
- [ ] Room-service configuration UI implemented

### Phase 2 Complete
- [ ] Available times picker component works
- [ ] Appointment creation form updated to new format
- [ ] Full booking flow works end-to-end
- [ ] Error handling implemented

### Phase 3 Complete
- [ ] All UI enhancements implemented
- [ ] Calendar integration updated
- [ ] Error messages are user-friendly
- [ ] All tests pass
- [ ] Code reviewed and approved

---

**Last Updated**: [Current Date]  
**Status**: Ready for Implementation  
**Next Steps**: Begin Phase 1.1 - Update Service Management UI


