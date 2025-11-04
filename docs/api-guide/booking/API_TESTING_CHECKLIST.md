# Booking APIs - Testing Checklist

## 📋 Tổng Quan

Checklist này để test tất cả các API changes đã được sửa để verify với backend trước khi implement Phase 1.

---

## 🧪 Test Environment Setup

### Prerequisites
- [ ] Backend server đang chạy (localhost:8080 hoặc staging)
- [ ] Có valid access token (Bearer token)
- [ ] Truy cập `/admin/test-api` để load data từ database
- [ ] Có test data từ database (sẽ được load tự động trong test page):
  - [ ] **Rooms**: Load từ `RoomService.getActiveRooms()` - Ghi lại các room codes thực tế
  - [ ] **Services**: Load từ `ServiceService.getServices()` - Ghi lại các service codes thực tế
  - [ ] **Employees**: Load từ `EmployeeService.getEmployees()` - Ghi lại các employee codes thực tế
  - [ ] **Patients**: Load từ `PatientService.getPatients()` - Ghi lại các patient codes thực tế

### 📝 Data Mẫu từ Database

**Lưu ý**: Sau khi load data trong test page, hãy ghi lại các giá trị thực tế từ database vào phần này:

#### Rooms (Load từ database)
- Room Code 1: `[Điền room code thực tế từ dropdown]` - `[Tên phòng]`
- Room Code 2: `[Điền room code thực tế từ dropdown]` - `[Tên phòng]`
- Room Code 3: `[Điền room code thực tế từ dropdown]` - `[Tên phòng]`
- Invalid Room Code: `[Điền code không tồn tại để test 404]`

**Example** (nếu có):
- Room Code 1: `P-01` - `Phòng khám tổng quát 01`
- Room Code 2: `P-04` - `Phòng Implant`
- Invalid: `P-99`

#### Services (Load từ database)
- Service Code 1: `[Điền service code thực tế]` - `[Tên dịch vụ]`
- Service Code 2: `[Điền service code thực tế]` - `[Tên dịch vụ]`
- Service Code 3: `[Điền service code thực tế]` - `[Tên dịch vụ]`
- Invalid Service Code: `[Điền code không tồn tại để test 404]`

**Example** (nếu có):
- Service Code 1: `SV-CAOVOI` - `Cạo vôi răng và Đánh bóng`
- Service Code 2: `SV-NHORANG` - `Nhổ răng thường`
- Invalid: `SV-INVALID`

#### Employees/Doctors (Load từ database)
- Employee Code 1: `[Điền employee code thực tế]` - `[Tên nhân viên]`
- Employee Code 2: `[Điền employee code thực tế]` - `[Tên nhân viên]`
- Participant Code 1: `[Điền participant code thực tế]` - `[Tên người hỗ trợ]`
- Invalid Employee Code: `[Điền code không tồn tại để test 404]`

**Example** (nếu có):
- Employee Code 1: `BS-001` - `Bác sĩ Nguyễn Văn A`
- Employee Code 2: `BS-002` - `Bác sĩ Trần Thị B`
- Participant Code 1: `PT-001` - `Phụ tá Văn C`
- Invalid: `BS-999`

#### Patients (Load từ database)
- Patient Code 1: `[Điền patient code thực tế]` - `[Tên bệnh nhân]`
- Patient Code 2: `[Điền patient code thực tế]` - `[Tên bệnh nhân]`
- Invalid Patient Code: `[Điền code không tồn tại để test 404]`

**Example** (nếu có):
- Patient Code 1: `BN-001` - `Nguyễn Văn D`
- Patient Code 2: `BN-002` - `Trần Thị E`
- Invalid: `BN-999`

### Tools
- [ ] Postman/Insomnia
- [ ] Browser DevTools (Network tab)
- [ ] Console logs trong code

---

## 1️⃣ ROOM SERVICE TESTS (BE-401)

### Test 1.1: Get Room by Code
**Endpoint**: `GET /api/v1/rooms/code/{roomCode}` (Note: Backend uses `/code/` path)  
**Method**: `RoomService.getRoomByCode(roomCode)`

**Test Cases**:
- [ ] **TC1.1.1**: Get room by valid code (sử dụng room code từ database)
  - Request: Room code thực tế từ database (ví dụ: room code đầu tiên trong dropdown)
  - Expected: 200 OK, returns room data
  - Verify: `roomCode`, `roomName`, `roomType`, `isActive` fields
  - **Actual Room Code used**: `[Ghi lại room code thực tế đã test]`
  
- [ ] **TC1.1.2**: Get room by invalid code
  - Request: Room code không tồn tại (ví dụ: "P-99" hoặc code không có trong database)
  - Expected: 404 Not Found
  - Verify: Error message "Room not found with code: [code]"
  - **Invalid Code used**: `[Ghi lại invalid code đã test]`

- [ ] **TC1.1.3**: Get room by code with special characters
  - Request: Room code có ký tự đặc biệt (nếu có trong DB)
  - Expected: Handle correctly or 404

**Code to Test**:
```typescript
// Test in browser console or component
import { RoomService } from '@/services/roomService';

// Test 1: Sử dụng room code thực tế từ database
// Lấy room code từ dropdown trong test page
const room = await RoomService.getRoomByCode('[ROOM_CODE_FROM_DB]');
console.log('Room by code:', room);

// Test 2: Invalid code
try {
  await RoomService.getRoomByCode('[INVALID_CODE]');
} catch (error) {
  console.log('Expected 404:', error);
}
```

**Test trong Test Page**:
1. Mở `/admin/test-api`
2. Chọn room từ dropdown trong "Room Service Tests" → "Get Room by Code"
3. Click "Test Get Room by Code"
4. Xem kết quả trong "Test Results"

---

### Test 1.2: Get Room Services (V16 - NEW)
**Endpoint**: `GET /api/v1/rooms/{roomCode}/services`  
**Method**: `RoomService.getRoomServices(roomCode)`

**Test Cases**:
- [ ] **TC1.2.1**: Get services for room with services assigned
  - Request: Room code thực tế từ database (nên chọn room đã có services)
  - Expected: 200 OK, returns `RoomServicesResponse`
  - Verify: `roomId`, `roomCode`, `roomName`, `compatibleServices[]` array
  - Verify: Each service has `serviceId`, `serviceCode`, `serviceName`, `price`
  - **Actual Room Code used**: `[Ghi lại room code đã test]`
  - **Services found**: `[Ghi lại số lượng services và các service codes]`

- [ ] **TC1.2.2**: Get services for room with NO services assigned
  - Request: Room code thực tế chưa có services (hoặc room mới)
  - Expected: 200 OK, returns empty `compatibleServices: []`
  - **Actual Room Code used**: `[Ghi lại room code đã test]`

- [ ] **TC1.2.3**: Get services for invalid room code
  - Request: Room code không tồn tại
  - Expected: 404 Not Found
  - **Invalid Code used**: `[Ghi lại invalid code đã test]`

**Code to Test**:
```typescript
// Test 1: Room with services (sử dụng room code thực tế)
const roomServices = await RoomService.getRoomServices('[ROOM_CODE_WITH_SERVICES]');
console.log('Room services:', roomServices);
console.log('Compatible services count:', roomServices.compatibleServices.length);
console.log('Service codes:', roomServices.compatibleServices.map(s => s.serviceCode));

// Test 2: Room without services (sử dụng room code thực tế)
const emptyRoom = await RoomService.getRoomServices('[ROOM_CODE_WITHOUT_SERVICES]');
console.log('Empty room services:', emptyRoom);
console.log('Is empty:', emptyRoom.compatibleServices.length === 0);
```

**Test trong Test Page**:
1. Chọn room từ dropdown trong "Room Service Tests" → "Get Room Services"
2. Click "Test Get Room Services"
3. Xem danh sách services trong response

---

### Test 1.3: Update Room Services (V16 - NEW)
**Endpoint**: `PUT /api/v1/rooms/{roomCode}/services`  
**Method**: `RoomService.updateRoomServices(roomCode, request)`

**Test Cases**:
- [ ] **TC1.3.1**: Update room services with valid service codes
  - Request: Room code thực tế + Service codes thực tế từ database (chọn từ checkboxes)
  - Request body: `{ serviceCodes: ["[SERVICE_CODE_1]", "[SERVICE_CODE_2]"] }`
  - Expected: 200 OK, returns updated `RoomServicesResponse`
  - Verify: Services are replaced (not added)
  - Verify: Only requested services are in response
  - **Actual Room Code used**: `[Ghi lại]`
  - **Service Codes used**: `[Ghi lại các service codes đã test]`

- [ ] **TC1.3.2**: Update room services with empty array
  - Request: Room code thực tế + Empty array `{ serviceCodes: [] }`
  - Expected: 400 Bad Request
  - Verify: Error message "Danh sách mã dịch vụ không được rỗng"
  - **Note**: Test page sẽ không cho phép submit nếu không chọn service nào

- [ ] **TC1.3.3**: Update room services with invalid service code
  - Request: `{ serviceCodes: ["[INVALID_SERVICE_CODE]"] }`
  - Expected: 404 Not Found
  - Verify: Error message "Service not found with codes: [INVALID_SERVICE_CODE]"
  - **Note**: Cần nhập manual service code không tồn tại

- [ ] **TC1.3.4**: Update room services with inactive service
  - Request: Service code có `isActive = false`
  - Expected: 400 Bad Request
  - Verify: Error message "Cannot assign inactive services to room"
  - **Note**: Cần có service inactive trong DB

- [ ] **TC1.3.5**: Update room services with invalid room code
  - Request: Room code không tồn tại
  - Expected: 404 Not Found

**Code to Test**:
```typescript
// Test 1: Update with valid services (sử dụng codes thực tế từ database)
const updated = await RoomService.updateRoomServices('[ROOM_CODE_FROM_DB]', {
  serviceCodes: ['[SERVICE_CODE_1]', '[SERVICE_CODE_2]']
});
console.log('Updated room services:', updated);
console.log('Services after update:', updated.compatibleServices.map(s => s.serviceCode));

// Test 2: Empty array (should fail) - Test page sẽ validate
// Test 3: Invalid service code - Cần test manual
```

**Test trong Test Page**:
1. Chọn room từ dropdown
2. Chọn services từ checkboxes (multi-select)
3. Click "Test Update Room Services"
4. Xem kết quả - Services sẽ được replace hoàn toàn

---

## 2️⃣ SERVICE SERVICE TESTS (BE-402)

### Test 2.1: Get Service by Code
**Endpoint**: `GET /api/v1/services/{serviceCode}`  
**Method**: `ServiceService.getServiceByCode(serviceCode)`

**Test Cases**:
- [ ] **TC2.1.1**: Get service by valid code (standard path)
  - Request: Service code thực tế từ database (chọn từ dropdown)
  - Expected: 200 OK, returns service data
  - Verify: Service details đầy đủ: `serviceCode`, `serviceName`, `price`, `defaultDurationMinutes`, etc.
  - **Actual Service Code used**: `[Ghi lại service code đã test]`

- [ ] **TC2.1.2**: Get service by invalid code
  - Request: Service code không tồn tại
  - Expected: 404 Not Found
  - **Invalid Code used**: `[Ghi lại invalid code đã test]`

**Code to Test**:
```typescript
// Test 1: Valid service code (sử dụng service code thực tế từ database)
const service = await ServiceService.getServiceByCode('[SERVICE_CODE_FROM_DB]');
console.log('Service by code:', service);
console.log('Service details:', {
  code: service.serviceCode,
  name: service.serviceName,
  price: service.price,
  duration: service.defaultDurationMinutes,
  buffer: service.defaultBufferMinutes
});

// Test 2: Invalid service code
try {
  await ServiceService.getServiceByCode('[INVALID_CODE]');
} catch (error) {
  console.log('Expected 404:', error);
}
```

**Test trong Test Page**:
- Service này có thể test qua dropdown trong "Service Service Tests"
- Hoặc có thể test trực tiếp trong code

---

### Test 2.2: Update Service (Changed to serviceCode)
**Endpoint**: `PUT /api/v1/services/{serviceCode}`  
**Method**: `ServiceService.updateService(serviceCode, data)`

**Test Cases**:
- [ ] **TC2.2.1**: Update service with valid serviceCode
  - Request: Service code thực tế từ database + Update data
  - Request body: `{ serviceName: "Updated Name", price: 350000 }`
  - Expected: 200 OK, returns updated service
  - Verify: Service is updated correctly
  - **Actual Service Code used**: `[Ghi lại service code đã test]`
  - **⚠️ Note**: Test này sẽ thay đổi dữ liệu thực tế - nên dùng service test hoặc restore sau khi test

- [ ] **TC2.2.2**: Update service with duplicate serviceCode
  - Request: Service code thực tế + Update với serviceCode đã tồn tại
  - Request body: `{ serviceCode: "[EXISTING_SERVICE_CODE]" }`
  - Expected: 400 Bad Request
  - Verify: Error message "Service code already exists"
  - **Note**: Cần có ít nhất 2 services trong DB để test

- [ ] **TC2.2.3**: Update service with invalid serviceCode parameter
  - Request: Service code không tồn tại
  - Expected: 404 Not Found
  - **Invalid Code used**: `[Ghi lại invalid code đã test]`

**Code to Test**:
```typescript
// Test 1: Update service (sử dụng service code thực tế)
// ⚠️ WARNING: Test này sẽ thay đổi dữ liệu thực tế
const updated = await ServiceService.updateService('[SERVICE_CODE_FROM_DB]', {
  serviceName: 'Cạo vôi răng (Updated)',
  price: 350000
});
console.log('Updated service:', updated);

// Test 2: Invalid service code
try {
  await ServiceService.updateService('[INVALID_CODE]', {
    serviceName: 'Test'
  });
} catch (error) {
  console.log('Expected 404:', error);
}
```

**Test trong Test Page**:
1. Chọn service từ dropdown trong "Service Service Tests"
2. Click "Test Update Service (by Code)"
3. ⚠️ Service sẽ được update với tên "Test Updated Service" và giá 350,000

---

### Test 2.3: Delete Service (Changed to serviceCode)
**Endpoint**: `DELETE /api/v1/services/{serviceCode}`  
**Method**: `ServiceService.deleteService(serviceCode)`

**Test Cases**:
- [ ] **TC2.3.1**: Delete service with valid serviceCode
  - Request: Service code thực tế từ database
  - Expected: 204 No Content (or 200 OK)
  - Verify: Service is soft deleted (`isActive = false`)
  - **Actual Service Code used**: `[Ghi lại service code đã test]`
  - **⚠️ WARNING**: Test này sẽ soft delete service thực tế - nên dùng service test hoặc restore sau khi test

- [ ] **TC2.3.2**: Delete service with invalid serviceCode
  - Request: Service code không tồn tại
  - Expected: 404 Not Found
  - **Invalid Code used**: `[Ghi lại invalid code đã test]`

- [ ] **TC2.3.3**: Verify service is soft deleted (not hard deleted)
  - After delete, get service by code
  - Expected: 200 OK, but `isActive = false`
  - Verify: Service vẫn có thể get được nhưng `isActive = false`

**Code to Test**:
```typescript
// Test 1: Delete service (sử dụng service code thực tế)
// ⚠️ WARNING: Test này sẽ soft delete service thực tế
await ServiceService.deleteService('[SERVICE_CODE_FROM_DB]');
console.log('Service deleted');

// Test 2: Verify soft delete
const deleted = await ServiceService.getServiceByCode('[SERVICE_CODE_FROM_DB]');
console.log('Service isActive:', deleted.isActive); // Should be false
console.log('Service still exists:', deleted); // Should return service data

// Test 3: Invalid service code
try {
  await ServiceService.deleteService('[INVALID_CODE]');
} catch (error) {
  console.log('Expected 404:', error);
}
```

**Test trong Test Page**:
1. Chọn service từ dropdown trong "Service Service Tests"
2. Click "Test Delete Service (by Code)" (button đỏ)
3. ⚠️ Service sẽ bị soft delete
4. Reload data để thấy service đã bị inactive

---

## 3️⃣ APPOINTMENT SERVICE TESTS (BE-403)

### Test 3.1: Find Available Times (P3.1 - NEW)
**Endpoint**: `GET /api/v1/appointments/available-times`  
**Method**: `appointmentService.findAvailableTimes(request)`

**Test Cases**:
- [ ] **TC3.1.1**: Find available times with valid inputs
  - Request: 
    - Date: Ngày trong tương lai (sử dụng date picker)
    - Employee Code: Employee code thực tế từ database (chọn từ dropdown)
    - Service Codes: Service codes thực tế từ database (chọn từ checkboxes)
  - Expected: 200 OK, returns `AvailableTimesResponse`
  - Verify: `totalDurationNeeded` is calculated correctly (sum of service durations + buffers)
  - Verify: `availableSlots[]` array has slots (nếu có)
  - Verify: Each slot has `startTime` (ISO 8601) and `availableCompatibleRoomCodes[]`
  - **Actual Data used**:
    - Date: `[Ghi lại date đã test]`
    - Employee Code: `[Ghi lại employee code đã test]`
    - Service Codes: `[Ghi lại service codes đã test]`
    - Total Duration: `[Ghi lại totalDurationNeeded từ response]`
    - Slots Found: `[Ghi lại số lượng slots]`

- [ ] **TC3.1.2**: Find available times with multiple services
  - Request: Chọn nhiều services từ checkboxes (2-3 services)
  - Expected: 200 OK
  - Verify: `totalDurationNeeded` = sum of all service durations + buffers
  - **Actual Data used**:
    - Service Codes: `[Ghi lại multiple service codes]`
    - Total Duration: `[Ghi lại totalDurationNeeded]`
    - Verify: Duration = Service1(duration + buffer) + Service2(duration + buffer) + ...

- [ ] **TC3.1.3**: Find available times with participants
  - Request: Chọn participants từ checkboxes (1-2 participants)
  - Expected: 200 OK
  - Verify: Slots exclude times when participants are busy
  - **Actual Data used**:
    - Participant Codes: `[Ghi lại participant codes đã test]`
    - Verify: So sánh số slots với và không có participants

- [ ] **TC3.1.4**: Find available times with date in past
  - Request: Chọn date trong quá khứ (ví dụ: hôm qua)
  - Expected: 400 Bad Request
  - Verify: Error message "DATE_IN_PAST"
  - **Actual Date used**: `[Ghi lại date trong quá khứ đã test]`

- [ ] **TC3.1.5**: Find available times with invalid employee code
  - Request: Employee code không tồn tại (cần nhập manual)
  - Expected: 404 Not Found
  - Verify: Error message "EMPLOYEE_NOT_FOUND"
  - **Note**: Test page chỉ cho phép chọn từ dropdown, cần test manual hoặc thêm input field

- [ ] **TC3.1.6**: Find available times with invalid service code
  - Request: Service code không tồn tại (cần nhập manual)
  - Expected: 404 Not Found
  - Verify: Error message "SERVICES_NOT_FOUND"
  - **Note**: Test page chỉ cho phép chọn từ checkboxes, cần test manual

- [ ] **TC3.1.7**: Find available times with inactive service
  - Request: Service có `isActive = false`
  - Expected: 400 Bad Request
  - Verify: Error message "SERVICES_INACTIVE"
  - **Note**: Test page chỉ load active services, cần test manual với inactive service

- [ ] **TC3.1.8**: Find available times - no compatible rooms
  - Request: Services mà không có room nào hỗ trợ
  - Expected: 200 OK, but `availableSlots: []` and `message: "Không có phòng nào hỗ trợ các dịch vụ này"`
  - **Note**: Cần có service không có room nào hỗ trợ, hoặc chọn services không compatible với bất kỳ room nào

- [ ] **TC3.1.9**: Find available times - doctor has no shifts
  - Request: Employee không có shift trong ngày được chọn
  - Expected: 200 OK, but `availableSlots: []`
  - **Actual Data used**:
    - Employee Code: `[Ghi lại employee code không có shift]`
    - Date: `[Ghi lại date không có shift]`

- [ ] **TC3.1.10**: Find available times - all slots busy
  - Request: Tất cả slots đã được book hết
  - Expected: 200 OK, but `availableSlots: []`
  - **Note**: Cần tạo nhiều appointments để fill hết slots

**Code to Test**:
```typescript
// Test 1: Basic available times (sử dụng data thực tế từ database)
const slots = await appointmentService.findAvailableTimes({
  date: '[DATE_FROM_PICKER]', // Format: YYYY-MM-DD
  employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
  serviceCodes: ['[SERVICE_CODE_FROM_DB]']
});
console.log('Available slots:', slots);
console.log('Total duration:', slots.totalDurationNeeded);
console.log('Slots count:', slots.availableSlots.length);
console.log('First slot:', slots.availableSlots[0]);
console.log('Compatible rooms:', slots.availableSlots[0]?.availableCompatibleRoomCodes);

// Test 2: Multiple services
const multiSlots = await appointmentService.findAvailableTimes({
  date: '[DATE_FROM_PICKER]',
  employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
  serviceCodes: ['[SERVICE_CODE_1]', '[SERVICE_CODE_2]']
});
console.log('Multi-service duration:', multiSlots.totalDurationNeeded);
// Verify: totalDurationNeeded = sum of (service1.duration + service1.buffer + service2.duration + service2.buffer)

// Test 3: With participants
const withParticipants = await appointmentService.findAvailableTimes({
  date: '[DATE_FROM_PICKER]',
  employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
  serviceCodes: ['[SERVICE_CODE_FROM_DB]'],
  participantCodes: ['[PARTICIPANT_CODE_FROM_DB]']
});
console.log('With participants:', withParticipants);
console.log('Slots with participants:', withParticipants.availableSlots.length);
// Compare với test không có participants để verify slots bị filter

// Test 4: Date in past (should fail)
try {
  await appointmentService.findAvailableTimes({
    date: '[PAST_DATE]', // Ví dụ: hôm qua
    employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
    serviceCodes: ['[SERVICE_CODE_FROM_DB]']
  });
} catch (error) {
  console.log('Expected 400:', error);
  console.log('Error message:', error.response?.data?.message);
}
```

**Test trong Test Page**:
1. Chọn Date từ date picker (ngày trong tương lai)
2. Chọn Employee từ dropdown
3. Chọn Services từ checkboxes (có thể chọn nhiều)
4. Chọn Participants (optional) từ checkboxes
5. Click "Test Find Available Times (P3.1)"
6. Xem kết quả:
   - `totalDurationNeeded`: Tổng thời gian cần
   - `availableSlots`: Danh sách slots có thể book
   - Mỗi slot có `startTime` và `availableCompatibleRoomCodes[]`
7. Nếu có slots, start time và room sẽ tự động được fill vào form "Create Appointment"

---

### Test 3.2: Create Appointment (P3.2 - Updated Request Format)
**Endpoint**: `POST /api/v1/appointments`  
**Method**: `appointmentService.createAppointment(request)`

**Test Cases**:
- [ ] **TC3.2.1**: Create appointment with valid new format
  - Request: Sử dụng data thực tế từ database:
    - Patient Code: Chọn từ dropdown
    - Employee Code: Chọn từ dropdown
    - Room Code: Chọn từ dropdown (hoặc từ available slots)
    - Service Codes: Chọn từ checkboxes (ít nhất 1)
    - Appointment Start Time: Từ available slots (sau khi test Find Available Times)
    - Notes: Optional
  - Expected: 201 Created, returns `CreateAppointmentResponse`
  - Verify: `appointmentCode` is generated (format: APT-YYYYMMDD-XXX)
  - Verify: `status` is "SCHEDULED"
  - Verify: `appointmentEndTime` is calculated (startTime + totalDuration)
  - Verify: `expectedDurationMinutes` matches sum of service durations
  - Verify: Response includes `patient`, `doctor`, `room`, `services` objects with codes
  - **Actual Data used**:
    - Patient Code: `[Ghi lại]`
    - Employee Code: `[Ghi lại]`
    - Room Code: `[Ghi lại]`
    - Service Codes: `[Ghi lại]`
    - Start Time: `[Ghi lại]`
    - Appointment Code: `[Ghi lại appointment code được tạo]`
    - Duration: `[Ghi lại expectedDurationMinutes]`

- [ ] **TC3.2.2**: Create appointment with multiple services
  - Request: Chọn 2-3 services từ checkboxes
  - Expected: 201 Created
  - Verify: `expectedDurationMinutes` = sum of all services (duration + buffer)
  - Verify: `services[]` array has all services
  - **Actual Data used**:
    - Service Codes: `[Ghi lại multiple service codes]`
    - Total Duration: `[Ghi lại expectedDurationMinutes]`
    - Verify: Duration = Service1(duration + buffer) + Service2(duration + buffer) + ...

- [ ] **TC3.2.3**: Create appointment with participants
  - Request: Chọn participants từ checkboxes (1-2 participants)
  - Expected: 201 Created
  - Verify: `participants[]` array includes all participants
  - Verify: Each participant has `employeeCode`, `fullName`, `role`
  - **Actual Data used**:
    - Participant Codes: `[Ghi lại participant codes]`
    - Verify: Response có `participants` array với đầy đủ thông tin

- [ ] **TC3.2.4**: Create appointment with invalid patient code
  - Request: Patient code không tồn tại (cần nhập manual)
  - Expected: 400 Bad Request
  - Verify: Error message "PATIENT_NOT_FOUND" hoặc errorKey tương ứng
  - **Note**: Test page chỉ cho phép chọn từ dropdown, cần test manual

- [ ] **TC3.2.5**: Create appointment with invalid employee code
  - Request: Employee code không tồn tại (cần nhập manual)
  - Expected: 400 Bad Request
  - Verify: Error message "EMPLOYEE_NOT_FOUND"
  - **Note**: Test page chỉ cho phép chọn từ dropdown, cần test manual

- [ ] **TC3.2.6**: Create appointment with invalid room code
  - Request: Room code không tồn tại (cần nhập manual)
  - Expected: 400 Bad Request
  - Verify: Error message "ROOM_NOT_FOUND"
  - **Note**: Test page chỉ cho phép chọn từ dropdown, cần test manual

- [ ] **TC3.2.7**: Create appointment with invalid service code
  - Request: Service code không tồn tại (cần nhập manual)
  - Expected: 400 Bad Request
  - Verify: Error message "SERVICES_NOT_FOUND"
  - **Note**: Test page chỉ cho phép chọn từ checkboxes, cần test manual

- [ ] **TC3.2.8**: Create appointment - doctor not qualified
  - Request: Service requires specialization that doctor doesn't have
  - Expected: 409 Conflict
  - Verify: Error message "EMPLOYEE_NOT_QUALIFIED"
  - **Test scenario**: Chọn doctor không có specialization phù hợp với service
  - **Note**: Cần có doctor và service không match specialization

- [ ] **TC3.2.9**: Create appointment - room not compatible
  - Request: Room doesn't support requested services (room chưa được config services)
  - Expected: 409 Conflict
  - Verify: Error message "ROOM_NOT_COMPATIBLE"
  - **Test scenario**: Chọn room chưa được config service đó
  - **Note**: Cần có room chưa có service được chọn trong room-services config

- [ ] **TC3.2.10**: Create appointment - doctor busy (slot taken)
  - Request: Doctor đã có appointment tại thời điểm đó
  - Expected: 409 Conflict
  - Verify: Error message "EMPLOYEE_SLOT_TAKEN"
  - **Test scenario**: 
    1. Tạo appointment với doctor và time cụ thể
    2. Tạo lại appointment với cùng doctor và time
    3. Expected: 409 Conflict

- [ ] **TC3.2.11**: Create appointment - room busy (slot taken)
  - Request: Room đã có appointment tại thời điểm đó
  - Expected: 409 Conflict
  - Verify: Error message "ROOM_SLOT_TAKEN"
  - **Test scenario**:
    1. Tạo appointment với room và time cụ thể
    2. Tạo lại appointment với cùng room và time (khác doctor)
    3. Expected: 409 Conflict

- [ ] **TC3.2.12**: Create appointment - patient has conflict
  - Request: Patient đã có appointment tại thời điểm đó
  - Expected: 409 Conflict
  - Verify: Error message "PATIENT_HAS_CONFLICT"
  - **Test scenario**:
    1. Tạo appointment với patient và time cụ thể
    2. Tạo lại appointment với cùng patient và time (khác doctor/room)
    3. Expected: 409 Conflict

- [ ] **TC3.2.13**: Create appointment - participant busy
  - Request: Participant đã có appointment tại thời điểm đó
  - Expected: 409 Conflict
  - Verify: Error message "PARTICIPANT_SLOT_TAKEN"
  - **Test scenario**:
    1. Tạo appointment với participant và time cụ thể
    2. Tạo lại appointment với cùng participant và time
    3. Expected: 409 Conflict

- [ ] **TC3.2.14**: Create appointment - start time in past
  - Request: `{ appointmentStartTime: "[PAST_DATETIME]" }` (ví dụ: hôm qua)
  - Expected: 400 Bad Request
  - Verify: Error message "START_TIME_IN_PAST"
  - **Note**: Test page sẽ validate, cần test với time trong quá khứ

**Code to Test**:
```typescript
// Test 1: Create appointment with new format (sử dụng data thực tế từ database)
// ⚠️ WARNING: Test này sẽ tạo appointment thực tế trong database
const appointment = await appointmentService.createAppointment({
  patientCode: '[PATIENT_CODE_FROM_DB]',
  employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
  roomCode: '[ROOM_CODE_FROM_DB]', // Nên lấy từ available slots
  serviceCodes: ['[SERVICE_CODE_FROM_DB]'],
  appointmentStartTime: '[START_TIME_FROM_AVAILABLE_SLOTS]', // Format: ISO 8601
  notes: 'Test appointment from API testing'
});
console.log('Created appointment:', appointment);
console.log('Appointment code:', appointment.appointmentCode);
console.log('Status:', appointment.status);
console.log('Duration:', appointment.expectedDurationMinutes);
console.log('Start time:', appointment.appointmentStartTime);
console.log('End time:', appointment.appointmentEndTime);
console.log('Patient:', appointment.patient);
console.log('Doctor:', appointment.doctor);
console.log('Room:', appointment.room);
console.log('Services:', appointment.services);

// Test 2: Multiple services
const multiAppointment = await appointmentService.createAppointment({
  patientCode: '[PATIENT_CODE_FROM_DB]',
  employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
  roomCode: '[ROOM_CODE_FROM_DB]',
  serviceCodes: ['[SERVICE_CODE_1]', '[SERVICE_CODE_2]'],
  appointmentStartTime: '[START_TIME_FROM_AVAILABLE_SLOTS]'
});
console.log('Multi-service appointment:', multiAppointment);
console.log('Total duration:', multiAppointment.expectedDurationMinutes);
// Verify: expectedDurationMinutes = sum of all services

// Test 3: With participants
const withParticipants = await appointmentService.createAppointment({
  patientCode: '[PATIENT_CODE_FROM_DB]',
  employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
  roomCode: '[ROOM_CODE_FROM_DB]',
  serviceCodes: ['[SERVICE_CODE_FROM_DB]'],
  appointmentStartTime: '[START_TIME_FROM_AVAILABLE_SLOTS]',
  participantCodes: ['[PARTICIPANT_CODE_1]', '[PARTICIPANT_CODE_2]']
});
console.log('With participants:', withParticipants);
console.log('Participants:', withParticipants.participants);
// Verify: participants array có đầy đủ thông tin

// Test 4: Invalid patient code (should fail)
try {
  await appointmentService.createAppointment({
    patientCode: '[INVALID_PATIENT_CODE]',
    employeeCode: '[EMPLOYEE_CODE_FROM_DB]',
    roomCode: '[ROOM_CODE_FROM_DB]',
    serviceCodes: ['[SERVICE_CODE_FROM_DB]'],
    appointmentStartTime: '[START_TIME_FROM_AVAILABLE_SLOTS]'
  });
} catch (error) {
  console.log('Expected 400:', error);
  console.log('Error message:', error.response?.data?.message);
  console.log('Error key:', error.response?.data?.errorKey);
}
```

**Test trong Test Page**:
1. **Bước 1**: Test Find Available Times trước (sẽ auto-fill start time và room)
2. **Bước 2**: Chọn Patient từ dropdown
3. **Bước 3**: Chọn Employee từ dropdown (nên giống với employee trong Find Available Times)
4. **Bước 4**: Room Code đã được auto-fill từ available slots (hoặc chọn manual)
5. **Bước 5**: Service Codes đã được chọn từ Find Available Times (hoặc chọn lại)
6. **Bước 6**: Start Time đã được auto-fill từ available slots (hoặc chọn manual)
7. **Bước 7**: Chọn Participants (optional) từ checkboxes
8. **Bước 8**: Nhập Notes (optional)
9. **Bước 9**: Click "Test Create Appointment (P3.2)"
10. **Xem kết quả**:
    - Appointment code được tạo
    - Status = "SCHEDULED"
    - End time được tính toán
    - Duration = sum of services
    - Response có đầy đủ patient, doctor, room, services, participants

---

## 📝 Test Results Template

### Test Execution Summary

**Date**: [Date]  
**Tester**: [Name]  
**Environment**: [Development/Staging]  
**Backend Version**: [Version]

### Results Summary

| Category | Total Tests | Passed | Failed | Skipped |
|----------|-------------|--------|--------|---------|
| Room Service | X | X | X | X |
| Service Service | X | X | X | X |
| Appointment Service | X | X | X | X |
| **TOTAL** | **X** | **X** | **X** | **X** |

### Issues Found

#### Critical Issues (Block Phase 1)
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

#### Major Issues (Should fix before Phase 1)
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

#### Minor Issues (Can fix during Phase 1)
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Notes

- [ ] All endpoints match docs
- [ ] All error codes match docs
- [ ] All response formats match docs
- [ ] Performance is acceptable (< 500ms for available-times)
- [ ] Backward compatibility maintained

---

## ✅ Next Steps

After testing:

1. **If all tests pass**: Proceed to Phase 1
2. **If critical issues found**: 
   - Document issues
   - Contact backend team
   - Wait for fixes before Phase 1
3. **If minor issues found**: 
   - Document issues
   - Proceed to Phase 1 with workarounds
   - Fix issues during Phase 1

---

**Last Updated**: [Current Date]  
**Status**: Ready for Testing  
**Next Steps**: Execute test cases and document results

