# Appointment Management API - Complete Guide (Module BE-403)# Appointment Management API - Complete Guide (Module BE-403)# BE-403: Appointment Management API Guide# BE-403: Appointment Management API Guide

## 📋 Table of Contents

1. [Overview](#overview)## 📋 Table of Contents

2. [API Endpoints Summary](#api-endpoints-summary)

3. [P3.1 - Get Available Time Slots](#p31---get-available-time-slots)

4. [P3.2 - Create Appointment](#p32---create-appointment)

5. [P3.3 - Get Appointment by ID](#p33---get-appointment-by-id)1. [Overview](#overview)## Quick Test URLs## 📌 Quick Reference for Testing

6. [P3.4 - Update Appointment](#p34---update-appointment)

7. [P3.5 - Cancel Appointment](#p35---cancel-appointment)2. [API Endpoints Summary](#api-endpoints-summary)

8. [Data Models](#data-models)

9. [Error Handling](#error-handling)3. [P3.1 - Get Available Time Slots](#p31---get-available-time-slots)

10. [Postman Testing Guide](#postman-testing-guide)

11. [P3.2 - Create Appointment](#p32---create-appointment)

---

5. [P3.3 - Get Appointment by ID](#p33---get-appointment-by-id)Copy-paste these URLs directly into Postman (tested with seed data):**Copy-paste these URLs directly into Postman** (all should return 200 OK):

## Overview

6. [P3.4 - Update Appointment](#p34---update-appointment)

**Module**: Appointment Management (BE-403)

**Purpose**: Quản lý lịch hẹn khám, bao gồm: kiểm tra khung giờ trống, tạo lịch hẹn mới, cập nhật và hủy lịch hẹn.7. [P3.5 - Cancel Appointment](#p35---cancel-appointment)

**Base URL**: `/api/v1/appointments`

**Authentication**: Required (Bearer Token)8. [Data Models](#data-models)

### Business Context9. [Error Handling](#error-handling)``````

Appointments (lịch hẹn) là trung tâm của hệ thống đặt lịch:10. [Postman Testing Guide](#postman-testing-guide)

- **Get Available Times**: Kiểm tra khung giờ trống của bác sĩ chính, dịch vụ và phụ táSUCCESS Test 1 - Simple GEN_EXAM:✅ Test 1 - Simple GEN_EXAM:

- **Create Appointment**: Tạo lịch hẹn mới với bác sĩ, nhiều dịch vụ, phụ tá và phòng khám

- **Reschedule**: Chuyển lịch hẹn sang ngày/giờ khác---

- **Cancel**: Hủy lịch hẹn (soft delete với status CANCELLED)

GET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAMGET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM

**Key Features**:

## Overview

- Hỗ trợ nhiều dịch vụ trong 1 lịch hẹn (serviceCodes: List)

- Hỗ trợ nhiều phụ tá (participantCodes: List)

- Kiểm tra tính khả dụng của bác sĩ chính và phụ tá dựa trên ca làm việc

- Validate chuyên môn bác sĩ phù hợp với từng dịch vụ**Module**: Appointment Management (BE-403)

- Tự động tính toán thời gian kết thúc dựa trên tổng duration + buffer

- Prevent double booking cho bác sĩ, phòng khám, phụ tá và bệnh nhân**Purpose**: Quản lý lịch hẹn khám, bao gồm: kiểm tra khung giờ trống, tạo lịch hẹn mới, cập nhật và hủy lịch hẹn.SUCCESS Test 2 - Nội nha services:✅ Test 2 - Nội nha services:

---**Base URL**: `/api/v1/appointments`

## API Endpoints Summary**Authentication**: Required (Bearer Token)GET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=FILLING_COMP&serviceCodes=ENDO_TREAT_ANTGET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=FILLING_COMP&serviceCodes=ENDO_TREAT_ANT

| Method | Endpoint | Permission | Description | Version |

| ------ | ------------------------------------------- | --------------------- | ------------------------------- | ------- |

| GET | `/api/v1/appointments/available-times` | `CREATE_APPOINTMENT` | Get available time slots | V1 |### Business Context

| POST | `/api/v1/appointments` | `CREATE_APPOINTMENT` | Create new appointment | V1 |

| GET | `/api/v1/appointments/{appointmentId}` | `VIEW_APPOINTMENT` | Get appointment by ID | V1 |

| PUT | `/api/v1/appointments/{appointmentId}` | `UPDATE_APPOINTMENT` | Update appointment | V1 |

| DELETE | `/api/v1/appointments/{appointmentId}` | `CANCEL_APPOINTMENT` | Cancel appointment (soft delete)| V1 |Appointments (lịch hẹn) là trung tâm của hệ thống đặt lịch:SUCCESS Test 3 - With participants:✅ Test 3 - With participants:

---

## P3.1 - Get Available Time Slots- **Get Available Times**: Kiểm tra khung giờ trống của bác sĩ cho dịch vụ cụ thểGET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&participantCodes=EMP004GET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&participantCodes=EMP004

### Request- **Create Appointment**: Tạo lịch hẹn mới với bác sĩ, dịch vụ, phòng khám

```http- **Reschedule**: Chuyển lịch hẹn sang ngày/giờ khác

GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL&serviceCodes=SCALING_L1&participantCodes=EMP004

Authorization: Bearer {access_token}- **Cancel**: Hủy lịch hẹn (soft delete với status CANCELLED)

```

SUCCESS Test 4 - Răng thẩm mỹ:✅ Test 4 - Răng thẩm mỹ:

### Query Parameters

**Key Features**:

| Parameter | Type | Required | Description |

| ------------------ | ------------ | -------- | --------------------------------------------------- |GET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=VENEER_EMAXGET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=VENEER_EMAX

| `date` | String | Yes | Ngày cần kiểm tra (format: YYYY-MM-DD) |

| `employeeCode` | String | Yes | Mã bác sĩ chính (e.g., EMP002) |- Kiểm tra tính khả dụng của bác sĩ dựa trên ca làm việc (work shifts)

| `serviceCodes` | List<String> | Yes | Danh sách mã dịch vụ (có thể nhiều service) |

| `participantCodes` | List<String> | No | Danh sách mã phụ tá (optional) |- Validate chuyên môn bác sĩ phù hợp với dịch vụ

**Note**: `serviceCodes` và `participantCodes` là array parameters. Trong URL, repeat parameter name:- Tự động tính toán thời gian kết thúc dựa trên duration + buffer

- `serviceCodes=SVC1&serviceCodes=SVC2`

- `participantCodes=EMP004&participantCodes=EMP005`- Prevent double booking cho bác sĩ, phòng khám và bệnh nhânERROR Test 5 - Admin cannot be doctor (should return 400):❌ Test 5 - Admin cannot be doctor (should return 400):

### Response (200 OK)

```````json---GET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAMGET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP001&serviceCodes=GEN_EXAM

{

  "employeeCode": "EMP002",

  "employeeName": "Minh Nguyễn Văn",

  "date": "2025-11-15",## API Endpoints Summary

  "serviceCodes": ["ORTHO_BRACES_METAL", "SCALING_L1"],

  "serviceNames": ["Niềng răng kim loại", "Cạo vôi loại 1"],

  "totalDuration": 135,

  "availableSlots": [| Method | Endpoint                                    | Permission            | Description                     | Version |ERROR Test 6 - Doctor not qualified (should return 400):❌ Test 6 - Doctor not qualified (should return 400):

    {

      "startTime": "08:00:00",| ------ | ------------------------------------------- | --------------------- | ------------------------------- | ------- |

      "endTime": "10:15:00",

      "compatibleRooms": ["P-01", "P-02"]| GET    | `/api/v1/appointments/available-times`      | `VIEW_APPOINTMENT`    | Get available time slots        | V1      |GET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=VENEER_EMAXGET http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=VENEER_EMAX

    },

    {| POST   | `/api/v1/appointments`                      | `CREATE_APPOINTMENT`  | Create new appointment          | V1      |

      "startTime": "10:30:00",

      "endTime": "12:45:00",| GET    | `/api/v1/appointments/{appointmentId}`      | `VIEW_APPOINTMENT`    | Get appointment by ID           | V1      |``````

      "compatibleRooms": ["P-01"]

    },| PUT    | `/api/v1/appointments/{appointmentId}`      | `UPDATE_APPOINTMENT`  | Update appointment              | V1      |

    {

      "startTime": "13:00:00",| DELETE | `/api/v1/appointments/{appointmentId}`      | `CANCEL_APPOINTMENT`  | Cancel appointment (soft delete)| V1      |

      "endTime": "15:15:00",

      "compatibleRooms": ["P-01", "P-02"]

    }

  ]---------

}

```````

### Error Responses## P3.1 - Get Available Time Slots

#### 400 Bad Request - Bác sĩ không có ca làm việc ngày đó

````json### Request## Table of Contents## Table of Contents

{

  "timestamp": "2025-11-03T10:30:00",

  "status": 400,

  "error": "Bad Request",```http

  "message": "Doctor has no shifts on 2025-11-15",

  "path": "/api/v1/appointments/available-times"GET /api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=ORTHO_BRACES_METAL&date=2025-11-15

}

```Authorization: Bearer {access_token}1. [Overview](#overview)1. [Overview](#overview)



#### 400 Bad Request - Bác sĩ không đủ chuyên môn```



```json2. [Seed Data Reference](#seed-data-reference)2. [P3.1: Find Available Times](#p31-find-available-times)

{

  "timestamp": "2025-11-03T10:30:00",### Query Parameters

  "status": 400,

  "error": "Bad Request",3. [P3.1: Find Available Times](#p31-find-available-times)3. [P3.2: Create Appointment](#p32-create-appointment)

  "message": "EMPLOYEE_NOT_QUALIFIED: Employee EMP002 is not qualified for service IMPLANT_L1",

  "path": "/api/v1/appointments/available-times"| Parameter      | Type   | Required | Description                                |

}

```| -------------- | ------ | -------- | ------------------------------------------ |4. [P3.2: Create Appointment](#p32-create-appointment)4. [P3.3: Medical Staff Selection (GET /employees/medical-staff)](#p33-medical-staff-selection-get-employeesmedical-staff) 🆕



#### 404 Not Found - Bác sĩ không tồn tại| `employeeCode` | String | Yes      | Mã bác sĩ (e.g., EMP002)                   |



```json| `serviceCode`  | String | Yes      | Mã dịch vụ (e.g., ORTHO_BRACES_METAL)      |5. [P3.3: Medical Staff Selection](#p33-medical-staff-selection)5. [Business Rules](#business-rules)

{

  "timestamp": "2025-11-03T10:30:00",| `date`         | String | Yes      | Ngày cần kiểm tra (format: YYYY-MM-DD)     |

  "status": 404,

  "error": "Not Found",6. [Business Rules](#business-rules)6. [Request/Response Examples](#requestresponse-examples)

  "message": "Employee not found with code: EMP999",

  "path": "/api/v1/appointments/available-times"### Response (200 OK)

}

```7. [Error Handling](#error-handling)7. [Error Scenarios](#error-scenarios)



#### 404 Not Found - Dịch vụ không tồn tại```json



```json{8. [Postman Testing Guide](#postman-testing-guide)8. [Postman Testing Guide](#postman-testing-guide)

{

  "timestamp": "2025-11-03T10:30:00",  "employeeCode": "EMP002",

  "status": 404,

  "error": "Not Found",  "employeeName": "Minh Nguyễn Văn",9. [TypeScript Integration](#typescript-integration)9. [TypeScript Integration](#typescript-integration)

  "message": "Service not found with code: INVALID_SVC",

  "path": "/api/v1/appointments/available-times"  "date": "2025-11-15",

}

```  "serviceCode": "ORTHO_BRACES_METAL",10. [Performance Notes](#performance-notes)



### Curl Example  "serviceName": "Niềng răng kim loại",



```bash  "serviceDuration": 90,---11. [Workflow: P3.1 → P3.2](#workflow-p31--p32)

curl -X GET "http://localhost:8080/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL&serviceCodes=SCALING_L1" \

  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  "availableSlots": [

````

    {

### V2 SEED DATA - Test Cases

      "startTime": "08:00:00",

#### Test Case 1: EMP002 + 1 Service (Niềng răng)

      "endTime": "09:45:00"## Overview---

```http

GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL    },

```

    {

✅ Expected: Available slots from 08:00-16:00 (Ca Sáng)

      "startTime": "10:00:00",

**Employee**: EMP002 - Minh Nguyễn Văn

- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD] "endTime": "11:45:00"This guide covers the complete Appointment Management module (BE-403) with three main APIs:## Overview

- Shifts on 2025-11-15: Ca Sáng (8h-16h)

  },

**Service**: ORTHO_BRACES_METAL (Niềng răng kim loại)

- Duration: 90 minutes {

- Buffer: 15 minutes

- Required Specialization: 1 (Chỉnh nha) ✅ Match! "startTime": "13:00:00",

#### Test Case 2: EMP002 + Multiple Services (Niềng răng + Cạo vôi) "endTime": "14:45:00"- **P3.1: Find Available Times** - Query available time slots before bookingThis guide covers the complete Appointment Management module (BE-403) with two main APIs:

````http }

GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL&serviceCodes=SCALING_L1

```  ]- **P3.2: Create Appointment** - Book the appointment after selecting a slot



✅ Expected: Available slots with total duration = 90+15+30+10 = 145 minutes}



**Services**:```- **P3.3: Medical Staff Selection** - Get list of medical staff for UI dropdowns**P3.1: Find Available Times** - Query available time slots before booking

- ORTHO_BRACES_METAL: 90 min + 15 buffer

- SCALING_L1: 30 min + 10 buffer

- Total: 145 minutes

### Error Responses**P3.2: Create Appointment** - Book the appointment after selecting a slot

#### Test Case 3: EMP002 + 1 Service + 1 Participant



```http

GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=CROWN_EMAX&participantCodes=EMP004#### 400 Bad Request - Bác sĩ không có ca làm việc ngày đó### Key Concept: Specialization Matching

````

✅ Expected: Intersection of EMP002 and EMP004 availability

````json### 🔥 CRITICAL: Understanding Specialization Matching

**Main Doctor**: EMP002 - Ca Sáng (8h-16h)

**Participant**: EMP004 - Ca Sáng (8h-16h){

**Intersection**: 08:00-16:00

  "timestamp": "2025-11-03T10:30:00",**CRITICAL**: Each service requires specific specializations. Doctor MUST have required specialization.

#### Test Case 4: EMP003 + Điều trị tủy

  "status": 400,

```http

GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=ENDO_SIMPLE  "error": "Bad Request",**Before testing, you MUST understand how employees and services match:**

````

"message": "Doctor has no shifts on 2025-11-15",

✅ Expected: Available slots from 08:00-16:00 (Ca Sáng)

"path": "/api/v1/appointments/available-times"**Rule**: All medical staff MUST have specialization ID 8 (STANDARD). This is the baseline qualification.

**Employee**: EMP003 - Lan Trần Thị

- Specializations: [2-Nội nha, 4-Phục hồi, 8-STANDARD]}

- Shifts on 2025-11-15: Ca Sáng (8h-16h)

````#### Seed Data Summary

**Service**: ENDO_SIMPLE (Điều trị tủy đơn giản)

- Duration: 60 minutes

- Buffer: 15 minutes

- Required Specialization: 2 (Nội nha) ✅ Match!#### 400 Bad Request - Bác sĩ không đủ chuyên môn---



#### Test Case 5: EMP002 + Cấy ghép Implant (ERROR - Không đủ chuyên môn)



```http```json| Employee | Code | Name | Specializations | Can Do Services |

GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=IMPLANT_L1

```{



❌ Expected: 400 Bad Request - EMPLOYEE_NOT_QUALIFIED  "timestamp": "2025-11-03T10:30:00",## Seed Data Reference|----------|------|------|-----------------|----------------|



**Employee**: EMP002 - Minh Nguyễn Văn  "status": 400,

- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]

  "error": "Bad Request",| **EMP001** | Admin | Admin Hệ thống | ❌ **NO specializations** | ❌ Cannot be assigned to appointments |

**Service**: IMPLANT_L1 (Cấy ghép Implant loại 1)

- Required Specialization: 6 (Cấy ghép Implant) ❌ NOT Match!  "message": "EMPLOYEE_NOT_QUALIFIED: Employee EMP002 is not qualified for service IMPLANT_L1",



---  "path": "/api/v1/appointments/available-times"### Employees Available for Testing| **EMP002** | Doctor | Minh Nguyễn Văn | ✅ 1-Chỉnh nha, 7-Răng thẩm mỹ, **8-STANDARD** | GEN_EXAM, VENEER_EMAX, BLEACH_*, etc. |



## P3.2 - Create Appointment}



### Request```| **EMP003** | Doctor | Lan Trần Thị | ✅ 2-Nội nha, 4-Phục hồi, **8-STANDARD** | FILLING_COMP, ENDO_TREAT_*, CROWN_*, etc. |



```http

POST /api/v1/appointments

Authorization: Bearer {access_token}#### 404 Not Found - Bác sĩ không tồn tại| Code | Name | Role | Specializations | Valid Services || **EMP004** | Nurse | Mai Lê Thị | ✅ **8-STANDARD only** | Can be participant ✅ |

Content-Type: application/json

````

### Request Body```json|------|------|------|-----------------|----------------|| **EMP005** | Nurse | Tuấn Hoàng Văn | ✅ **8-STANDARD only** | Can be participant ✅ |

```json{

{

  "patientId": 1,  "timestamp": "2025-11-03T10:30:00",| **EMP001** | Admin Hệ thống | Admin | NONE | CANNOT be assigned to appointments |

  "employeeCode": "EMP002",

  "serviceCodes": ["ORTHO_BRACES_METAL"],  "status": 404,

  "participantCodes": ["EMP004"],

  "roomCode": "P-01",  "error": "Not Found",| **EMP002** | Minh Nguyễn Văn | Doctor | 1-Chỉnh nha, 7-Răng thẩm mỹ, **8-STANDARD** | GEN_EXAM, VENEER_EMAX, BLEACH_* |#### Service Specialization Requirements

  "appointmentDate": "2025-11-15",

  "appointmentTime": "10:00:00",  "message": "Employee not found with code: EMP999",

  "notes": "Bệnh nhân lần đầu niềng răng"

}  "path": "/api/v1/appointments/available-times"| **EMP003** | Lan Trần Thị | Doctor | 2-Nội nha, 4-Phục hồi, **8-STANDARD** | FILLING_COMP, ENDO_TREAT_*, CROWN_* |

```

}

### Request Body Parameters

````| **EMP004** | Mai Lê Thị | Nurse | **8-STANDARD only** | Can be participant || Service Code | Service Name | Required Specialization | Which Employees Can Do |

| Field              | Type         | Required | Description                                   |

| ------------------ | ------------ | -------- | --------------------------------------------- |

| `patientId`        | Integer      | Yes      | ID bệnh nhân (FK to patients table)           |

| `employeeCode`     | String       | Yes      | Mã bác sĩ chính (e.g., EMP002)                |#### 404 Not Found - Dịch vụ không tồn tại| **EMP005** | Tuấn Hoàng Văn | Nurse | **8-STANDARD only** | Can be participant ||--------------|--------------|------------------------|------------------------|

| `serviceCodes`     | List<String> | Yes      | Danh sách mã dịch vụ                          |

| `participantCodes` | List<String> | No       | Danh sách mã phụ tá (optional)                |

| `roomCode`         | String       | Yes      | Mã phòng khám (e.g., P-01)                    |

| `appointmentDate`  | String       | Yes      | Ngày hẹn (YYYY-MM-DD)                         |```json| `GEN_EXAM` | Khám tổng quát | **8-STANDARD** | ✅ EMP002, EMP003, EMP004, EMP005 |

| `appointmentTime`  | String       | Yes      | Giờ bắt đầu (HH:mm:ss)                        |

| `notes`            | String       | No       | Ghi chú từ lễ tân hoặc bệnh nhân              |{



### Response (201 Created)  "timestamp": "2025-11-03T10:30:00",NOTE: Seed data includes employee_shifts for all above employees on date 2025-11-15 (Full Day 08:00-17:00).| `GEN_XRAY_PERI` | Chụp X-Quang | **8-STANDARD** | ✅ EMP002, EMP003, EMP004, EMP005 |



```json  "status": 404,

{

  "appointmentId": 1,  "error": "Not Found",| `SCALING_L1` | Cạo vôi răng | **3-Nha chu** | ❌ **NONE** (no employee has ID 3) |

  "appointmentCode": "APT202511040001",

  "patientId": 1,  "message": "Service not found with code: INVALID_SVC",

  "patientName": "Nguyễn Văn A",

  "employeeCode": "EMP002",  "path": "/api/v1/appointments/available-times"### Service Specialization Requirements| `FILLING_COMP` | Trám răng Composite | **2-Nội nha** | ✅ EMP003 only |

  "employeeName": "Minh Nguyễn Văn",

  "serviceCodes": ["ORTHO_BRACES_METAL"],}

  "serviceNames": ["Niềng răng kim loại"],

  "participantCodes": ["EMP004"],```| `ENDO_TREAT_ANT` | Điều trị tủy răng trước | **2-Nội nha** | ✅ EMP003 only |

  "participantNames": ["Mai Lê Thị"],

  "roomCode": "P-01",

  "roomName": "Phòng khám tổng quát 01",

  "appointmentStartTime": "2025-11-15T10:00:00",### Curl Example| Service Code | Service Name | Required Spec ID | Which Employees || `ENDO_TREAT_POST` | Điều trị tủy răng sau | **2-Nội nha** | ✅ EMP003 only |

  "appointmentEndTime": "2025-11-15T11:45:00",

  "expectedDurationMinutes": 105,

  "status": "SCHEDULED",

  "notes": "Bệnh nhân lần đầu niềng răng",```bash|--------------|--------------|------------------|-----------------|| `CROWN_PFM` | Mão răng sứ Kim loại | **4-Phục hồi răng** | ✅ EMP003 only |

  "createdAt": "2025-11-04T14:30:00"

}curl -X GET "http://localhost:8080/api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=ORTHO_BRACES_METAL&date=2025-11-15" \

````

-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."| `GEN_EXAM` | Khám tổng quát | **8-STANDARD** | EMP002, EMP003, EMP004, EMP005 || `VENEER_EMAX` | Mặt dán sứ Veneer | **7-Răng thẩm mỹ** | ✅ EMP002 only |

### Error Responses

````

#### 400 Bad Request - Validation Error

| `GEN_XRAY_PERI` | Chụp X-Quang | **8-STANDARD** | EMP002, EMP003, EMP004, EMP005 || `BLEACH_INOFFICE` | Tẩy trắng răng Laser | **7-Răng thẩm mỹ** | ✅ EMP002 only |

```json

{### V2 SEED DATA - Test Cases

  "timestamp": "2025-11-04T14:30:00",

  "status": 400,| `SCALING_L1` | Cạo vôi răng | **3-Nha chu** | NONE (no employee has spec 3) || `EXTRACT_NORM` | Nhổ răng thường | **5-Phẫu thuật** | ❌ **NONE** (no employee has ID 5) |

  "error": "Bad Request",

  "message": "Appointment time is required",#### Test Case 1: EMP002 + Niềng răng kim loại (2025-11-15)

  "path": "/api/v1/appointments"

}| `FILLING_COMP` | Trám răng Composite | **2-Nội nha** | EMP003 only |

````

````http

#### 400 Bad Request - Doctor Not Available

GET /api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=ORTHO_BRACES_METAL&date=2025-11-15| `ENDO_TREAT_ANT` | Điều trị tủy răng trước | **2-Nội nha** | EMP003 only |#### ⚠️ Common Errors & How to Avoid

```json

{```

  "timestamp": "2025-11-04T14:30:00",

  "status": 400,| `ENDO_TREAT_POST` | Điều trị tủy răng sau | **2-Nội nha** | EMP003 only |

  "error": "Bad Request",

  "message": "DOCTOR_NOT_AVAILABLE: Doctor EMP002 is not available at 2025-11-15 10:00:00",✅ Expected: Available slots from 08:00-16:00 (Ca Sáng)

  "path": "/api/v1/appointments"

}| `CROWN_PFM` | Mão răng sứ | **4-Phục hồi** | EMP003 only |**Error 1: EMPLOYEE_NOT_MEDICAL_STAFF**

````

**Employee**: EMP002 - Minh Nguyễn Văn

#### 400 Bad Request - Room Not Available

- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]| `VENEER_EMAX` | Mặt dán sứ Veneer | **7-Răng thẩm mỹ** | EMP002 only |```json

```json

{- Shifts on 2025-11-15: Ca Sáng (8h-16h)

  "timestamp": "2025-11-04T14:30:00",

  "status": 400,| `BLEACH_INOFFICE` | Tẩy trắng răng Laser | **7-Răng thẩm mỹ** | EMP002 only |❌ Request: employeeCode=EMP001, serviceCodes=GEN_EXAM

  "error": "Bad Request",

  "message": "ROOM_NOT_AVAILABLE: Room P-01 is not available at 2025-11-15 10:00:00",**Service**: ORTHO_BRACES_METAL (Niềng răng kim loại)

  "path": "/api/v1/appointments"

}- Duration: 90 minutes| `EXTRACT_NORM` | Nhổ răng thường | **5-Phẫu thuật** | NONE (no employee has spec 5) |❌ Problem: EMP001 is Admin (NO specialization 8)

```

- Buffer: 15 minutes

#### 404 Not Found - Patient Not Found

- Required Specialization: 1 (Chỉnh nha) ✅ Match!✅ Solution: Use EMP002 or EMP003 (have STANDARD ID 8)

````json

{

  "timestamp": "2025-11-04T14:30:00",

  "status": 404,#### Test Case 2: EMP002 + Bọc răng sứ thẩm mỹ (2025-11-15)### Common Matching Errors```

  "error": "Not Found",

  "message": "Patient not found with ID: 999",

  "path": "/api/v1/appointments"

}```http

````

GET /api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=CROWN_EMAX&date=2025-11-15

### Curl Example

```````**ERROR 1: EMPLOYEE_NOT_MEDICAL_STAFF****Error 2: EMPLOYEE_NOT_QUALIFIED**

```bash

curl -X POST "http://localhost:8080/api/v1/appointments" \

  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \

  -H "Content-Type: application/json" \✅ Expected: Available slots from 08:00-16:00 (Ca Sáng)``````json

  -d '{

    "patientId": 1,

    "employeeCode": "EMP002",

    "serviceCodes": ["ORTHO_BRACES_METAL"],**Employee**: EMP002 - Minh Nguyễn VănRequest: employeeCode=EMP001, serviceCodes=GEN_EXAM❌ Request: employeeCode=EMP003, serviceCodes=SCALING_L1

    "participantCodes": ["EMP004"],

    "roomCode": "P-01",- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]

    "appointmentDate": "2025-11-15",

    "appointmentTime": "10:00:00",- Shifts on 2025-11-15: Ca Sáng (8h-16h)Problem: EMP001 is Admin (NO specialization 8)❌ Problem: SCALING_L1 requires specialization 3 (Nha chu), but EMP003 only has [2, 4, 8]

    "notes": "Bệnh nhân lần đầu niềng răng"

  }'

```````

**Service**: CROWN_EMAX (Bọc răng sứ E.max)Solution: Use EMP002 or EMP003 (have STANDARD ID 8)✅ Solution: Use EMP003 with FILLING_COMP or ENDO_TREAT_ANT (requires ID 2 which EMP003 has)

---

- Duration: 60 minutes

## P3.3 - Get Appointment by ID

- Buffer: 15 minutes```

### Request

- Required Specialization: 7 (Răng thẩm mỹ) ✅ Match!

```````http

GET /api/v1/appointments/1❌ Request: employeeCode=EMP002, serviceCodes=FILLING_COMP

Authorization: Bearer {access_token}

```#### Test Case 3: EMP003 + Điều trị tủy (2025-11-15)



### Response (200 OK)**ERROR 2: EMPLOYEE_NOT_QUALIFIED**❌ Problem: FILLING_COMP requires specialization 2 (Nội nha), but EMP002 only has [1, 7, 8]



```json```http

{

  "appointmentId": 1,GET /api/v1/appointments/available-times?employeeCode=EMP003&serviceCode=ENDO_SIMPLE&date=2025-11-15```✅ Solution: Use EMP002 with GEN_EXAM or VENEER_EMAX (requires ID 8 or ID 7 which EMP002 has)

  "appointmentCode": "APT202511040001",

  "patientId": 1,```

  "patientName": "Nguyễn Văn A",

  "employeeCode": "EMP002",Request: employeeCode=EMP003, serviceCodes=SCALING_L1```

  "employeeName": "Minh Nguyễn Văn",

  "serviceCodes": ["ORTHO_BRACES_METAL"],✅ Expected: Available slots from 08:00-16:00 (Ca Sáng)

  "serviceNames": ["Niềng răng kim loại"],

  "participantCodes": ["EMP004"],Problem: SCALING_L1 requires spec 3 (Nha chu), but EMP003 only has [2, 4, 8]

  "participantNames": ["Mai Lê Thị"],

  "roomCode": "P-01",**Employee**: EMP003 - Lan Trần Thị

  "roomName": "Phòng khám tổng quát 01",

  "appointmentStartTime": "2025-11-15T10:00:00",- Specializations: [2-Nội nha, 4-Phục hồi, 8-STANDARD]Solution: Use EMP003 with FILLING_COMP (requires spec 2 which EMP003 has)**Error 3: PARTICIPANT_NOT_MEDICAL_STAFF**

  "appointmentEndTime": "2025-11-15T11:45:00",

  "expectedDurationMinutes": 105,- Shifts on 2025-11-15: Ca Sáng (8h-16h)

  "status": "SCHEDULED",

  "notes": "Bệnh nhân lần đầu niềng răng",```json

  "createdBy": 1,

  "createdAt": "2025-11-04T14:30:00"**Service**: ENDO_SIMPLE (Điều trị tủy đơn giản)

}

```- Duration: 60 minutesRequest: employeeCode=EMP002, serviceCodes=FILLING_COMP❌ Request: participantCodes=EMP001



### Error Responses- Buffer: 15 minutes



#### 404 Not Found - Appointment Not Exists- Required Specialization: 2 (Nội nha) ✅ Match!Problem: FILLING_COMP requires spec 2 (Nội nha), but EMP002 only has [1, 7, 8]❌ Problem: EMP001 has NO specialization 8 (STANDARD)



```json

{

  "timestamp": "2025-11-04T14:30:00",#### Test Case 4: EMP002 + Cấy ghép Implant (ERROR)Solution: Use EMP002 with GEN_EXAM or VENEER_EMAX (requires spec 8 or 7)✅ Solution: Use EMP004 or EMP005 (nurses with STANDARD ID 8)

  "status": 404,

  "error": "Not Found",

  "message": "Appointment not found with ID: 999",

  "path": "/api/v1/appointments/999"```http``````

}

```GET /api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=IMPLANT_L1&date=2025-11-15



### Curl Example```



```bash

curl -X GET "http://localhost:8080/api/v1/appointments/1" \

  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."❌ Expected: 400 Bad Request - EMPLOYEE_NOT_QUALIFIED**ERROR 3: PARTICIPANT_NOT_MEDICAL_STAFF**#### ✅ Working Test Cases (Copy-Paste Ready)

```````

---

**Employee**: EMP002 - Minh Nguyễn Văn```

## P3.4 - Update Appointment

- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]

### Request

Request: participantCodes=EMP001**Test 1: Simple GEN_EXAM with EMP002**

````http

PUT /api/v1/appointments/1**Service**: IMPLANT_L1 (Cấy ghép Implant loại 1)

Authorization: Bearer {access_token}

Content-Type: application/json- Required Specialization: 6 (Cấy ghép Implant) ❌ NOT Match!Problem: EMP001 has NO specialization 8 (STANDARD)```

````

### Request Body

---Solution: Use EMP004 or EMP005 (nurses with STANDARD ID 8)GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM

````json

{

  "employeeCode": "EMP003",

  "serviceCodes": ["ENDO_SIMPLE"],## P3.2 - Create Appointment```✅ Works: EMP002 has STANDARD (ID 8) ✅

  "participantCodes": [],

  "roomCode": "P-02",

  "appointmentDate": "2025-11-16",

  "appointmentTime": "14:00:00",### Request```

  "notes": "Đổi sang bác sĩ Lan - Điều trị tủy"

}

````

```````http### Working Test Case Examples

### Response (200 OK)

POST /api/v1/appointments

```json

{Authorization: Bearer {access_token}**Test 2: Nội nha services with EMP003**

  "appointmentId": 1,

  "appointmentCode": "APT202511040001",Content-Type: application/json

  "patientId": 1,

  "patientName": "Nguyễn Văn A",```**Test 1: Simple GEN_EXAM with EMP002**```

  "employeeCode": "EMP003",

  "employeeName": "Lan Trần Thị",

  "serviceCodes": ["ENDO_SIMPLE"],

  "serviceNames": ["Điều trị tủy đơn giản"],### Request Body```GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=FILLING_COMP&serviceCodes=ENDO_TREAT_ANT

  "participantCodes": [],

  "participantNames": [],

  "roomCode": "P-02",

  "roomName": "Phòng khám tổng quát 02",```jsonGET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM✅ Works: EMP003 has Nội nha (ID 2) ✅

  "appointmentStartTime": "2025-11-16T14:00:00",

  "appointmentEndTime": "2025-11-16T15:15:00",{

  "expectedDurationMinutes": 75,

  "status": "SCHEDULED",  "patientId": 1,Success: EMP002 has STANDARD (ID 8)```

  "notes": "Đổi sang bác sĩ Lan - Điều trị tủy",

  "createdBy": 1,  "employeeCode": "EMP002",

  "createdAt": "2025-11-04T14:30:00",

  "updatedAt": "2025-11-04T15:00:00"  "serviceCode": "ORTHO_BRACES_METAL",```

}

```  "roomCode": "P-01",



### Error Responses  "appointmentDate": "2025-11-15",**Test 3: With nurse participant**



Same as Create Appointment (404 Not Found, 400 Bad Request for validation/availability)  "appointmentTime": "10:00:00",



### Curl Example  "notes": "Bệnh nhân lần đầu niềng răng"**Test 2: Nội nha services with EMP003**```



```bash}

curl -X PUT "http://localhost:8080/api/v1/appointments/1" \

  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \``````GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&participantCodes=EMP004

  -H "Content-Type: application/json" \

  -d '{

    "employeeCode": "EMP003",

    "serviceCodes": ["ENDO_SIMPLE"],### Request Body ParametersGET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=FILLING_COMP&serviceCodes=ENDO_TREAT_ANT✅ Works: Both have STANDARD (ID 8) ✅

    "participantCodes": [],

    "roomCode": "P-02",

    "appointmentDate": "2025-11-16",

    "appointmentTime": "14:00:00",| Field              | Type    | Required | Description                                   |Success: EMP003 has Nội nha (ID 2)```

    "notes": "Đổi sang bác sĩ Lan - Điều trị tủy"

  }'| ------------------ | ------- | -------- | --------------------------------------------- |

```````

| `patientId` | Integer | Yes | ID bệnh nhân (FK to patients table) |```

---

| `employeeCode` | String | Yes | Mã bác sĩ (e.g., EMP002) |

## P3.5 - Cancel Appointment

| `serviceCode` | String | Yes | Mã dịch vụ (e.g., ORTHO_BRACES_METAL) |**Test 4: Răng thẩm mỹ with EMP002**

### Request

| `roomCode` | String | Yes | Mã phòng khám (e.g., P-01) |

````http

DELETE /api/v1/appointments/1| `appointmentDate`  | String  | Yes      | Ngày hẹn (YYYY-MM-DD)                         |**Test 3: With nurse participant**```

Authorization: Bearer {access_token}

```| `appointmentTime`  | String  | Yes      | Giờ bắt đầu (HH:mm:ss)                        |



### Response (204 No Content)| `notes`            | String  | No       | Ghi chú từ lễ tân hoặc bệnh nhân              |```GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=VENEER_EMAX



No response body. HTTP status 204 indicates successful cancellation.



### Error Responses### Response (201 Created)GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&participantCodes=EMP004✅ Works: EMP002 has Răng thẩm mỹ (ID 7) ✅



#### 404 Not Found - Appointment Not Exists



```json```jsonSuccess: Both have STANDARD (ID 8)```

{

  "timestamp": "2025-11-04T15:00:00",{

  "status": 404,

  "error": "Not Found",  "appointmentId": 1,```

  "message": "Appointment not found with ID: 999",

  "path": "/api/v1/appointments/999"  "patientId": 1,

}

```  "patientName": "Nguyễn Văn A",---



#### 400 Bad Request - Appointment Already Cancelled  "employeeCode": "EMP002",



```json  "employeeName": "Minh Nguyễn Văn",**Test 4: Răng thẩm mỹ with EMP002**

{

  "timestamp": "2025-11-04T15:00:00",  "serviceCode": "ORTHO_BRACES_METAL",

  "status": 400,

  "error": "Bad Request",  "serviceName": "Niềng răng kim loại",```## P3.1: Find Available Times

  "message": "Appointment is already cancelled",

  "path": "/api/v1/appointments/1"  "roomCode": "P-01",

}

```  "roomName": "Phòng khám tổng quát 01",GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=VENEER_EMAX



### Curl Example  "appointmentStartTime": "2025-11-15T10:00:00",



```bash  "appointmentEndTime": "2025-11-15T11:45:00",Success: EMP002 has Răng thẩm mỹ (ID 7)**Purpose**: Find available time slots for booking appointments based on:

curl -X DELETE "http://localhost:8080/api/v1/appointments/1" \

  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  "expectedDurationMinutes": 105,

````

"status": "SCHEDULED",```

---

"notes": "Bệnh nhân lần đầu niềng răng",

## Data Models

"createdAt": "2025-11-03T14:30:00"- Doctor's availability (work shifts minus busy appointments)

### AppointmentStatus Enum

}

````java

public enum AppointmentStatus {```---- Services requested (duration + buffer time calculation)

    SCHEDULED,      // Đã đặt lịch

    CHECKED_IN,     // Bệnh nhân đã đến

    IN_PROGRESS,    // Đang điều trị

    COMPLETED,      // Hoàn thành### Error Responses- Participants' availability (optional assistants)

    CANCELLED,      // Đã hủy

    NO_SHOW         // Không đến

}

```#### 400 Bad Request - Validation Error## P3.1: Find Available Times- Compatible rooms (based on room_services V16)



### AppointmentParticipantRole Enum



```java```json

public enum AppointmentParticipantRole {

    ASSISTANT,          // Phụ tá{

    SECONDARY_DOCTOR,   // Bác sĩ phụ

    OBSERVER            // Quan sát viên  "timestamp": "2025-11-03T14:30:00",**Purpose**: Find available time slots for booking appointments based on:**Use Case**: Receptionist needs to find free slots to book a patient for "Cắm trụ Implant" with Dr. Nguyen on Oct 30, 2025.

}

```  "status": 400,



### AvailableTimesRequest  "error": "Bad Request",



```typescript  "message": "Appointment time is required",

interface AvailableTimesRequest {

  date: string; // YYYY-MM-DD  "path": "/api/v1/appointments"- Doctor's availability (work shifts minus busy appointments)**Algorithm**: Intersection-based availability check

  employeeCode: string;

  serviceCodes: string[]; // Array of service codes}

  participantCodes?: string[]; // Optional array of participant codes

}```- Services requested (duration + buffer time calculation)

````

### AvailableTimesResponse

#### 400 Bad Request - Doctor Not Available- Participants' availability (optional assistants)1. Validate inputs (date not in past, employee/services active)

````typescript

interface AvailableTimesResponse {

  employeeCode: string;

  employeeName: string;```json- Compatible rooms (based on room_services)2. Calculate total duration: SUM(serviceDuration + buffer)

  date: string; // YYYY-MM-DD

  serviceCodes: string[];{

  serviceNames: string[];

  totalDuration: number; // minutes  "timestamp": "2025-11-03T14:30:00",3. Check doctor has required specializations

  availableSlots: TimeSlot[];

}  "status": 400,



interface TimeSlot {  "error": "Bad Request",**Algorithm**: Intersection-based availability check4. Filter compatible rooms (room_services junction table)

  startTime: string; // HH:mm:ss

  endTime: string; // HH:mm:ss  "message": "DOCTOR_NOT_AVAILABLE: Doctor EMP002 is not available at 2025-11-15 10:00:00",

  compatibleRooms: string[]; // Room codes that support all services

}  "path": "/api/v1/appointments"5. Get doctor's work shifts (employee_shifts) - "source of truth"

````

}

### CreateAppointmentRequest

````1. Validate inputs (date not in past, employee/services active)6. Subtract busy times (appointments + participants' busy times)

```typescript

interface CreateAppointmentRequest {

  patientId: number;

  employeeCode: string;#### 400 Bad Request - Room Not Available2. Calculate total duration: SUM(serviceDuration + buffer)7. Split free intervals into 15-min slots

  serviceCodes: string[]; // Array of service codes

  participantCodes?: string[]; // Optional array of participant codes

  roomCode: string;

  appointmentDate: string; // YYYY-MM-DD```json3. Check doctor has required specializations8. Return slots with available compatible rooms

  appointmentTime: string; // HH:mm:ss

  notes?: string;{

}

```  "timestamp": "2025-11-03T14:30:00",4. Filter compatible rooms (room_services junction table)



### AppointmentResponse  "status": 400,



```typescript  "error": "Bad Request",5. Get doctor's work shifts (employee_shifts)---

interface AppointmentResponse {

  appointmentId: number;  "message": "ROOM_NOT_AVAILABLE: Room P-01 is not available at 2025-11-15 10:00:00",

  appointmentCode: string;

  patientId: number;  "path": "/api/v1/appointments"6. Subtract busy times (appointments + participants' busy times)

  patientName: string;

  employeeCode: string;}

  employeeName: string;

  serviceCodes: string[];```7. Split free intervals into 15-min slots## API Specification

  serviceNames: string[];

  participantCodes: string[];

  participantNames: string[];

  roomCode: string;#### 404 Not Found - Patient Not Found8. Return slots with available compatible rooms

  roomName: string;

  appointmentStartTime: string; // ISO 8601

  appointmentEndTime: string; // ISO 8601

  expectedDurationMinutes: number;```json### Endpoint

  status: AppointmentStatus;

  notes?: string;{

  createdBy?: number;

  createdAt: string; // ISO 8601  "timestamp": "2025-11-03T14:30:00",### Endpoint

  updatedAt?: string; // ISO 8601

}  "status": 404,

````

"error": "Not Found",```

---

"message": "Patient not found with ID: 999",

## Error Handling

"path": "/api/v1/appointments"```GET /api/v1/appointments/available-times

### Common Error Codes

}

| HTTP Status | Error Code | Description |

| ----------- | ----------------------- | ------------------------------------------------ |`GET /api/v1/appointments/available-times`

| 400 | BAD_REQUEST | Invalid input (missing required fields, etc.) |

| 400 | EMPLOYEE_NOT_QUALIFIED | Bác sĩ không có chuyên môn phù hợp |

| 400 | DOCTOR_NOT_AVAILABLE | Bác sĩ không rảnh vào thời gian này |

| 400 | ROOM_NOT_AVAILABLE | Phòng khám đã được đặt |### Curl Example```

| 400 | PATIENT_NOT_AVAILABLE | Bệnh nhân đã có lịch hẹn khác (double booking) |

| 404 | NOT_FOUND | Employee/Service/Room/Patient không tồn tại |

| 401 | UNAUTHORIZED | Token không hợp lệ hoặc hết hạn |

| 403 | FORBIDDEN | Không có quyền truy cập endpoint này |```bash### Authorization

### Error Response Formatcurl -X POST "http://localhost:8080/api/v1/appointments" \

All errors follow this standard format: -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \### Authorization

````json -H "Content-Type: application/json" \

{

  "timestamp": "2025-11-04T10:30:00",  -d '{```

  "status": 400,

  "error": "Bad Request",    "patientId": 1,

  "message": "Detailed error message here",

  "path": "/api/v1/appointments"    "employeeCode": "EMP002",```Required Permission: CREATE_APPOINTMENT

}

```    "serviceCode": "ORTHO_BRACES_METAL",



---    "roomCode": "P-01",Required Permission: CREATE_APPOINTMENT```



## Postman Testing Guide    "appointmentDate": "2025-11-15",



### Environment Variables    "appointmentTime": "10:00:00",```



Set up these variables in Postman environment:    "notes": "Bệnh nhân lần đầu niềng răng"



```javascript  }'### Query Parameters

// Environment: PDCMS_Local

base_url = http://localhost:8080```

admin_token = <get from login API>

receptionist_token = <get from login API>### Query Parameters

doctor_token = <get from login API>

```---



### Test Collection Structure| Parameter          | Type          | Required | Description                                      | Example                        |



#### Scenario 1: Get Available Times## P3.3 - Get Appointment by ID



**Test 1**: Valid request - EMP002 + 1 Service| Parameter | Type | Required | Description | Example || ------------------ | ------------- | -------- | ------------------------------------------------ | ------------------------------ |



```### Request

GET {{base_url}}/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL

Authorization: Bearer {{receptionist_token}}|-----------|------|----------|-------------|---------|| `date`             | String        | ✅ Yes   | Date to search (YYYY-MM-DD), must not be in past | `2025-10-30`                   |

````

```http

✅ Expected: 200 OK with available slots

GET /api/v1/appointments/1| `date` | String | YES | Date to search (YYYY-MM-DD) | `2025-11-15` || `employeeCode`     | String        | ✅ Yes   | Employee code of primary doctor                  | `BS-NGUYEN-VAN-A`              |

**Test 2**: Valid request - EMP002 + Multiple Services

Authorization: Bearer {access_token}

```

GET {{base_url}}/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL&serviceCodes=SCALING_L1```| `employeeCode`| String | YES | Employee code of primary doctor |`EMP002`||`serviceCodes`    | Array<String> | ✅ Yes   | List of service codes (at least 1)               |`["IMPLANT_01", "BONE_GRAFT"]` |

Authorization: Bearer {{receptionist_token}}

```````



✅ Expected: 200 OK with slots matching total duration### Response (200 OK)| `serviceCodes` | Array<String> | YES | List of service codes (at least 1) | `["GEN_EXAM"]` || `participantCodes` | Array<String> | ❌ No    | List of participant codes (assistants)           | `["PT-001", "PT-002"]`         |



**Test 3**: Valid request - With Participants



``````json| `participantCodes` | Array<String> | NO | List of participant codes | `["EMP004"]` |

GET {{base_url}}/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=CROWN_EMAX&participantCodes=EMP004

Authorization: Bearer {{receptionist_token}}{

```````

"appointmentId": 1,### Response Format

✅ Expected: 200 OK with intersection of doctor + participant availability

"patientId": 1,

**Test 4**: Invalid - Bác sĩ không đủ chuyên môn

"patientName": "Nguyễn Văn A",### Response Format

````

GET {{base_url}}/api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=IMPLANT_L1  "employeeCode": "EMP002",

Authorization: Bearer {{receptionist_token}}

```  "employeeName": "Minh Nguyễn Văn",**Success (200 OK)**:



❌ Expected: 400 Bad Request - EMPLOYEE_NOT_QUALIFIED  "serviceCode": "ORTHO_BRACES_METAL",



**Test 5**: Invalid - Bác sĩ không có ca làm việc  "serviceName": "Niềng răng kim loại",**Success (200 OK)**:



```  "roomCode": "P-01",

GET {{base_url}}/api/v1/appointments/available-times?date=2025-12-25&employeeCode=EMP002&serviceCodes=ORTHO_BRACES_METAL

Authorization: Bearer {{receptionist_token}}  "roomName": "Phòng khám tổng quát 01",```json

````

"appointmentStartTime": "2025-11-15T10:00:00",

❌ Expected: 400 Bad Request - Doctor has no shifts

"appointmentEndTime": "2025-11-15T11:45:00",```json{

#### Scenario 2: Create Appointment

"expectedDurationMinutes": 105,

**Test 1**: Valid appointment creation

"status": "SCHEDULED",{ "totalDurationNeeded": 120,

````

POST {{base_url}}/api/v1/appointments  "notes": "Bệnh nhân lần đầu niềng răng",

Authorization: Bearer {{receptionist_token}}

Body: {  "createdBy": 1,  "totalDurationNeeded": 45,  "availableSlots": [

  "patientId": 1,

  "employeeCode": "EMP002",  "createdAt": "2025-11-03T14:30:00"

  "serviceCodes": ["ORTHO_BRACES_METAL"],

  "participantCodes": ["EMP004"],}  "availableSlots": [    {

  "roomCode": "P-01",

  "appointmentDate": "2025-11-15",```

  "appointmentTime": "10:00:00",

  "notes": "First time braces"    {      "startTime": "2025-10-30T09:30:00",

}

```### Error Responses



✅ Expected: 201 Created      "startTime": "2025-11-15T08:00:00",      "availableCompatibleRoomCodes": ["P-IMPLANT-01", "P-IMPLANT-02"],



**Test 2**: Invalid - Double booking#### 404 Not Found - Appointment Not Exists



```      "availableCompatibleRoomCodes": ["P-GENERAL-01", "P-GENERAL-02"],      "note": null

POST {{base_url}}/api/v1/appointments

Authorization: Bearer {{receptionist_token}}```json

Body: Same as Test 1

```{      "note": null    },



❌ Expected: 400 Bad Request - DOCTOR_NOT_AVAILABLE  "timestamp": "2025-11-03T14:30:00",



#### Scenario 3: Update and Cancel  "status": 404,    },    {



**Test 1**: Update appointment  "error": "Not Found",



```  "message": "Appointment not found with ID: 999",    {      "startTime": "2025-10-30T14:00:00",

PUT {{base_url}}/api/v1/appointments/1

Authorization: Bearer {{receptionist_token}}  "path": "/api/v1/appointments/999"

Body: {

  "employeeCode": "EMP003",}      "startTime": "2025-11-15T08:15:00",      "availableCompatibleRoomCodes": ["P-IMPLANT-01"],

  "serviceCodes": ["ENDO_SIMPLE"],

  "participantCodes": [],```

  "roomCode": "P-02",

  "appointmentDate": "2025-11-16",      "availableCompatibleRoomCodes": ["P-GENERAL-01"],      "note": null

  "appointmentTime": "14:00:00"

}### Curl Example

````

      "note": null    }

✅ Expected: 200 OK with updated data

```bash

**Test 2**: Cancel appointment

curl -X GET "http://localhost:8080/api/v1/appointments/1" \    }  ],

```

DELETE {{base_url}}/api/v1/appointments/1 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Authorization: Bearer {{receptionist_token}}

```````], "message": null



✅ Expected: 204 No Content



------  "message": null}



## Permission Matrix



| API Endpoint                              | Required Permission   | Roles with Access          |## P3.4 - Update Appointment}```

| ----------------------------------------- | --------------------- | -------------------------- |

| GET /api/v1/appointments/available-times  | `CREATE_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |

| POST /api/v1/appointments                 | `CREATE_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |

| GET /api/v1/appointments/{id}             | `VIEW_APPOINTMENT`    | ADMIN, MANAGER, RECEPTIONIST, DOCTOR |### Request```

| PUT /api/v1/appointments/{id}             | `UPDATE_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |

| DELETE /api/v1/appointments/{id}          | `CANCEL_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |



---```http**No Compatible Rooms (200 OK)**:



## Database SchemaPUT /api/v1/appointments/1



### appointments tableAuthorization: Bearer {access_token}**No Compatible Rooms (200 OK)**:



```sqlContent-Type: application/json

CREATE TABLE appointments (

    appointment_id SERIAL PRIMARY KEY,``````json

    appointment_code VARCHAR(50) UNIQUE NOT NULL,

    patient_id INTEGER NOT NULL,

    employee_id INTEGER NOT NULL,

    room_id VARCHAR(50) NOT NULL,### Request Body```json{

    appointment_start_time TIMESTAMP NOT NULL,

    appointment_end_time TIMESTAMP NOT NULL,

    expected_duration_minutes INTEGER NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',```json{  "totalDurationNeeded": 60,

    actual_start_time TIMESTAMP,

    actual_end_time TIMESTAMP,{

    rescheduled_to_appointment_id INTEGER,

    notes TEXT,  "employeeCode": "EMP003",  "totalDurationNeeded": 60,  "availableSlots": [],

    created_by INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  "serviceCode": "ENDO_SIMPLE",

    updated_at TIMESTAMP,

      "roomCode": "P-02",  "availableSlots": [],  "message": "Không có phòng nào hỗ trợ các dịch vụ này"

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),

    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),  "appointmentDate": "2025-11-16",

    FOREIGN KEY (room_id) REFERENCES rooms(room_id),

    FOREIGN KEY (created_by) REFERENCES employees(employee_id)  "appointmentTime": "14:00:00",  "message": "Không có phòng nào hỗ trợ các dịch vụ này"}

);

```  "notes": "Đổi sang bác sĩ Lan - Điều trị tủy"



### appointment_services table}}```



```sql```

CREATE TABLE appointment_services (

    appointment_id INTEGER NOT NULL,```

    service_id INTEGER NOT NULL,

    ### Response (200 OK)

    PRIMARY KEY (appointment_id, service_id),

    ---

    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,

    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE```json

);

```{### Request Examples



### appointment_participants table  "appointmentId": 1,



```sql  "patientId": 1,## Business Rules

CREATE TABLE appointment_participants (

    appointment_id INTEGER NOT NULL,  "patientName": "Nguyễn Văn A",

    employee_id INTEGER NOT NULL,

    participant_role VARCHAR(50) NOT NULL DEFAULT 'ASSISTANT',  "employeeCode": "EMP003",**Example 1: Simple Request (No Participants)**



    PRIMARY KEY (appointment_id, employee_id),  "employeeName": "Lan Trần Thị",



    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,  "serviceCode": "ENDO_SIMPLE",### Rule 1: Date Validation

    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE

);  "serviceName": "Điều trị tủy đơn giản",

```

  "roomCode": "P-02",```http

---

  "roomName": "Phòng khám tổng quát 02",

## V2 Seed Data Reference

  "appointmentStartTime": "2025-11-16T14:00:00",GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM- ✅ **MUST** be in format `YYYY-MM-DD`

### Employees with Specializations

  "appointmentEndTime": "2025-11-16T15:15:00",

```sql

-- EMP002: Minh Nguyễn Văn  "expectedDurationMinutes": 75,```- ✅ **MUST NOT** be in the past (`date >= LocalDate.now()`)

-- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15  "status": "SCHEDULED",



-- EMP003: Lan Trần Thị  "notes": "Đổi sang bác sĩ Lan - Điều trị tủy",- ❌ **Example**: Requesting `2025-10-20` on Oct 25 → `400 DATE_IN_PAST`

-- Specializations: [2-Nội nha, 4-Phục hồi, 8-STANDARD]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15  "createdBy": 1,



-- EMP004: Mai Lê Thị  "createdAt": "2025-11-03T14:30:00",**Example 2: Multiple Services**

-- Specializations: [8-STANDARD only]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15  "updatedAt": "2025-11-03T15:00:00"



-- EMP005: Tuấn Hoàng Văn}### Rule 2: Employee Validation

-- Specializations: [8-STANDARD only]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15```

```

```http

### Services with Specialization Requirements

### Error Responses

```sql

-- GEN_EXAM: Khám tổng quátGET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=FILLING_COMP&serviceCodes=ENDO_TREAT_ANT- ✅ **MUST** exist in database

-- Duration: 30 min, Buffer: 10 min

-- Required: Specialization 8 (STANDARD)Same as Create Appointment (404 Not Found, 400 Bad Request for validation/availability)



-- ORTHO_BRACES_METAL: Niềng răng kim loại```- ✅ **MUST** be active (`is_active = true`)

-- Duration: 90 min, Buffer: 15 min

-- Required: Specialization 1 (Chỉnh nha)### Curl Example



-- CROWN_EMAX: Bọc răng sứ E.max- ❌ **Example**: `BS-JOHN-DOE` not found → `404 EMPLOYEE_NOT_FOUND`

-- Duration: 60 min, Buffer: 15 min

-- Required: Specialization 7 (Răng thẩm mỹ)```bash



-- ENDO_SIMPLE: Điều trị tủy đơn giảncurl -X PUT "http://localhost:8080/api/v1/appointments/1" \**Example 3: With Participants (Assistants)**

-- Duration: 60 min, Buffer: 15 min

-- Required: Specialization 2 (Nội nha)  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \



-- IMPLANT_L1: Cấy ghép Implant loại 1  -H "Content-Type: application/json" \### Rule 3: Services Validation

-- Duration: 120 min, Buffer: 30 min

-- Required: Specialization 6 (Cấy ghép Implant)  -d '{



-- SCALING_L1: Cạo vôi loại 1    "employeeCode": "EMP003",```http

-- Duration: 30 min, Buffer: 10 min

-- Required: Specialization 8 (STANDARD)    "serviceCode": "ENDO_SIMPLE",

```

    "roomCode": "P-02",GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM&participantCodes=EMP004&participantCodes=EMP005- ✅ **ALL** service codes **MUST** exist

---

    "appointmentDate": "2025-11-16",

## Version History

    "appointmentTime": "14:00:00",```- ✅ **ALL** services **MUST** be active

| Version | Date       | Changes                             | Author  |

| ------- | ---------- | ----------------------------------- | ------- |    "notes": "Đổi sang bác sĩ Lan - Điều trị tủy"

| V1      | 2024-11-04 | Initial Appointment Management APIs | BE Team |

  }'- ❌ **Example**: `["IMPLANT_01", "INVALID_CODE"]` → `404 SERVICES_NOT_FOUND`

---

```

## Contact & Support

**Example 4: Using Postman Query Params Tab**- ❌ **Example**: Service is `is_active = false` → `400 SERVICES_INACTIVE`

- **Backend Team**: backend@dentalclinic.com

- **API Issues**: Create issue in JIRA (Project: PDCMS)---

- **Documentation**: https://docs.dentalclinic.com/api/appointments



---

## P3.5 - Cancel Appointment

**Last Updated**: November 4, 2024

**Document Version**: 1.0| KEY | VALUE | Note |### Rule 4: Duration Calculation


### Request

|-----|-------|------|

```http

DELETE /api/v1/appointments/1| date | 2025-11-15 | Future date from seed data |```

Authorization: Bearer {access_token}

```| employeeCode | EMP002 | Doctor with STANDARD + Chỉnh nha + Răng thẩm mỹ |totalDuration = SUM(service.defaultDurationMinutes + service.defaultBufferMinutes)



### Response (204 No Content)| serviceCodes | GEN_EXAM | Requires STANDARD (ID 8) |```



No response body. HTTP status 204 indicates successful cancellation.| participantCodes | EMP004 | Nurse with STANDARD ID 8 |



### Error Responses**Example**:



#### 404 Not Found - Appointment Not Exists---



```json- Service 1: 45 min + 15 min buffer = 60 min

{

  "timestamp": "2025-11-03T15:00:00",## P3.2: Create Appointment- Service 2: 30 min + 10 min buffer = 40 min

  "status": 404,

  "error": "Not Found",- **Total**: 100 min

  "message": "Appointment not found with ID: 999",

  "path": "/api/v1/appointments/999"### Endpoint

}

```### Rule 5: Doctor Specialization Check



#### 400 Bad Request - Appointment Already Cancelled```



```jsonPOST /api/v1/appointments- ✅ Doctor **MUST** have ALL required specializations for the services

{

  "timestamp": "2025-11-03T15:00:00",```- ❌ **Example**: Service requires "Implant Specialist" but doctor doesn't have it → `409 EMPLOYEE_NOT_QUALIFIED`

  "status": 400,

  "error": "Bad Request",

  "message": "Appointment is already cancelled",

  "path": "/api/v1/appointments/1"### Authorization### Rule 6: Compatible Rooms (V16)

}

```



### Curl Example```- ✅ Rooms **MUST** support **ALL** requested services (from `room_services`)



```bashRequired Permission: CREATE_APPOINTMENT- ✅ Uses SQL: `SELECT room_id WHERE service_id IN (...) GROUP BY room_id HAVING COUNT(*) = N`

curl -X DELETE "http://localhost:8080/api/v1/appointments/1" \

  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."```- ❌ **Example**: No room supports both "Implant" AND "X-ray" → Empty slots with message

```



---

### Request Body (JSON)### Rule 7: Holiday Handling

## Data Models



### AppointmentStatus Enum

```json- ✅ **Automatically handled** by `employee_shifts` table

```java

public enum AppointmentStatus {{- ✅ If date is holiday, doctor has no shifts → Empty response

    SCHEDULED,      // Đã đặt lịch

    CHECKED_IN,     // Bệnh nhân đã đến  "patientCode": "BN-1001",- ✅ **Note**: Holiday check is NOT done explicitly in API (shifts are "source of truth")

    IN_PROGRESS,    // Đang điều trị

    COMPLETED,      // Hoàn thành  "employeeCode": "EMP002",

    CANCELLED,      // Đã hủy

    NO_SHOW         // Không đến  "roomCode": "P-GENERAL-01",### Rule 8: Shift as Source of Truth

}

```  "serviceCodes": ["GEN_EXAM"],



### AvailableTimesResponse  "appointmentStartTime": "2025-11-15T09:00:00",- ✅ Only work shifts create availability windows



```typescript  "participantCodes": ["EMP004"],- ✅ Busy appointments SUBTRACT from these windows

interface AvailableTimesResponse {

  employeeCode: string;  "notes": "Bệnh nhân có tiền sử cao huyết áp"- ✅ **Example**: Shift 8:00-17:00, appointment 9:00-10:00 → Available: [8:00-9:00, 10:00-17:00]

  employeeName: string;

  date: string; // YYYY-MM-DD}

  serviceCode: string;

  serviceName: string;```### Rule 9: Participant Availability

  serviceDuration: number; // minutes

  availableSlots: TimeSlot[];

}

| Field | Type | Required | Description |- ✅ If `participantCodes` provided, check their busy times too

interface TimeSlot {

  startTime: string; // HH:mm:ss|-------|------|----------|-------------|- ✅ Participant can be busy as:

  endTime: string; // HH:mm:ss

}| `patientCode` | String | YES | Patient code (must exist & active) |  - Primary doctor in another appointment

```

| `employeeCode` | String | YES | Primary doctor code |  - Participant in another appointment

### CreateAppointmentRequest

| `roomCode` | String | YES | Room code (from P3.1 available slots) |- ❌ **Example**: Assistant busy 10:00-11:00 → That slot excluded from results

```typescript

interface CreateAppointmentRequest {| `serviceCodes` | Array<String> | YES | Service codes (at least 1) |

  patientId: number;

  employeeCode: string;| `appointmentStartTime` | String | YES | ISO 8601 format: YYYY-MM-DDTHH:mm:ss |### Rule 10: Slot Interval

  serviceCode: string;

  roomCode: string;| `participantCodes` | Array<String> | NO | Participant codes |

  appointmentDate: string; // YYYY-MM-DD

  appointmentTime: string; // HH:mm:ss| `notes` | String | NO | Optional notes |- ✅ Slots are split every **15 minutes**

  notes?: string;

}- ✅ Only show slots where full duration fits

```

### Business Logic (9-Step Transaction)- ❌ **Example**: Free 9:00-9:40 with 60 min needed → No slot shown (not enough time)

### AppointmentResponse



```typescript

interface AppointmentResponse {**STEP 1**: Get Creator from SecurityContext---

  appointmentId: number;

  patientId: number;**STEP 2**: Validate Resources (patient, doctor, room, services, participants exist & active)

  patientName: string;

  employeeCode: string;**STEP 3**: Validate Doctor Specializations## Request Examples

  employeeName: string;

  serviceCode: string;**STEP 4**: Validate Room Compatibility

  serviceName: string;

  roomCode: string;**STEP 5**: Calculate Duration = SUM(service.duration + buffer)### Example 1: Simple Request (No Participants)

  roomName: string;

  appointmentStartTime: string; // ISO 8601**STEP 6**: Validate Shifts (doctor and participants must have shifts)

  appointmentEndTime: string; // ISO 8601

  expectedDurationMinutes: number;**STEP 7**: Check Conflicts (doctor, room, patient, participants not busy)```http

  status: AppointmentStatus;

  notes?: string;**STEP 8**: Insert Data (appointments, appointment_services, appointment_participants, audit_logs)GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP002&serviceCodes=GEN_EXAM

  createdBy?: number;

  createdAt: string; // ISO 8601**STEP 9**: Return Response```

  updatedAt?: string; // ISO 8601

}

```

### Response (201 Created)**Explanation**:

---

- **EMP002** (Bác sĩ Minh): Has specializations [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]

## Error Handling

```json- **GEN_EXAM**: Requires specialization 8 (STANDARD) ✅ Match!

### Common Error Codes

{

| HTTP Status | Error Code              | Description                                      |

| ----------- | ----------------------- | ------------------------------------------------ |  "appointmentCode": "APT-20251115-001",### Example 2: Multiple Services

| 400         | BAD_REQUEST             | Invalid input (missing required fields, etc.)    |

| 400         | EMPLOYEE_NOT_QUALIFIED  | Bác sĩ không có chuyên môn phù hợp               |  "status": "SCHEDULED",

| 400         | DOCTOR_NOT_AVAILABLE    | Bác sĩ không rảnh vào thời gian này              |

| 400         | ROOM_NOT_AVAILABLE      | Phòng khám đã được đặt                           |  "appointmentStartTime": "2025-11-15T09:00:00",```http

| 400         | PATIENT_NOT_AVAILABLE   | Bệnh nhân đã có lịch hẹn khác (double booking)  |

| 404         | NOT_FOUND               | Employee/Service/Room/Patient không tồn tại      |  "appointmentEndTime": "2025-11-15T09:45:00",GET /api/v1/appointments/available-times?date=2025-11-15&employeeCode=EMP003&serviceCodes=FILLING_COMP&serviceCodes=ENDO_TREAT_ANT

| 401         | UNAUTHORIZED            | Token không hợp lệ hoặc hết hạn                  |

| 403         | FORBIDDEN               | Không có quyền truy cập endpoint này             |  "expectedDurationMinutes": 45,```



### Error Response Format  "patient": {



All errors follow this standard format:    "patientCode": "BN-1001",**Explanation**:



```json    "fullName": "Nguyen Van A"- **EMP003** (Bác sĩ Lan): Has specializations [2-Nội nha, 4-Phục hồi răng, 8-STANDARD]

{

  "timestamp": "2025-11-03T10:30:00",  },- **FILLING_COMP**: Requires specialization 2 (Nội nha) ✅ Match!

  "status": 400,

  "error": "Bad Request",  "doctor": {- **ENDO_TREAT_ANT**: Requires specialization 2 (Nội nha) ✅ Match!

  "message": "Detailed error message here",

  "path": "/api/v1/appointments"    "employeeCode": "EMP002",

}

```    "fullName": "Minh Nguyễn Văn"### Example 3: With Participants (Assistants)



---  },



## Postman Testing Guide  "room": {```http



### Environment Variables    "roomCode": "P-GENERAL-01",GET /api/v1/appointments/available-times?date=2025-12-01&employeeCode=EMP002&serviceCodes=GEN_EXAM&participantCodes=EMP004&participantCodes=EMP005



Set up these variables in Postman environment:    "roomName": "Phòng khám tổng quát 01"```



```javascript  },

// Environment: PDCMS_Local

base_url = http://localhost:8080  "services": [**Explanation**:

admin_token = <get from login API>

receptionist_token = <get from login API>    {- **EMP002**: Doctor with STANDARD (ID 8) ✅

doctor_token = <get from login API>

```      "serviceCode": "GEN_EXAM",- **EMP004** (Y tá Mai): Has STANDARD (ID 8) ✅ Can be participant



### Test Collection Structure      "serviceName": "Khám tổng quát"- **EMP005** (Y tá Hương): Has STANDARD (ID 8) ✅ Can be participant



#### Scenario 1: Get Available Times    }- **GEN_EXAM**: Requires STANDARD (ID 8) ✅ Match!



**Test 1**: Valid request - EMP002 + Niềng răng  ],



```  "participants": [### Example 4: Using Postman

GET {{base_url}}/api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=ORTHO_BRACES_METAL&date=2025-11-15

Authorization: Bearer {{receptionist_token}}    {

```

      "employeeCode": "EMP004",**Query Params Tab**:

✅ Expected: 200 OK with available slots

      "fullName": "Mai Lê Thị",| KEY | VALUE | Note |

**Test 2**: Invalid - Bác sĩ không đủ chuyên môn

      "role": "ASSISTANT"|-----|-------|------|

```

GET {{base_url}}/api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=IMPLANT_L1&date=2025-11-15    }| date | 2025-11-15 | Future date |

Authorization: Bearer {{receptionist_token}}

```  ]| employeeCode | EMP002 | Bác sĩ Minh (has STANDARD + Chỉnh nha + Răng thẩm mỹ) |



❌ Expected: 400 Bad Request - EMPLOYEE_NOT_QUALIFIED}| serviceCodes | GEN_EXAM | Requires STANDARD (ID 8) ✅ |



**Test 3**: Invalid - Bác sĩ không có ca làm việc```| participantCodes | EMP004 | Y tá Mai (has STANDARD ID 8) ✅ |



```

GET {{base_url}}/api/v1/appointments/available-times?employeeCode=EMP002&serviceCode=ORTHO_BRACES_METAL&date=2025-12-25

Authorization: Bearer {{receptionist_token}}---**⚠️ Common Mistake**:

```

```

❌ Expected: 400 Bad Request - Doctor has no shifts

## P3.3: Medical Staff Selection❌ WRONG: employeeCode=EMP003 + serviceCodes=SCALING_L1

#### Scenario 2: Create Appointment

   → Error: EMPLOYEE_NOT_QUALIFIED

**Test 1**: Valid appointment creation

### Overview   → Reason: SCALING_L1 requires Nha chu (ID 3), but EMP003 only has Nội nha (ID 2)

```

POST {{base_url}}/api/v1/appointments

Authorization: Bearer {{receptionist_token}}

Body: {**Purpose**: Get list of medical staff (employees with STANDARD specialization ID 8) for UI dropdowns.✅ CORRECT: employeeCode=EMP003 + serviceCodes=FILLING_COMP

  "patientId": 1,

  "employeeCode": "EMP002",   → Success: FILLING_COMP requires Nội nha (ID 2), EMP003 has it!

  "serviceCode": "ORTHO_BRACES_METAL",

  "roomCode": "P-01",**Use Case**: Frontend dropdown/autocomplete for selecting:```

  "appointmentDate": "2025-11-15",

  "appointmentTime": "10:00:00",- **Doctor** (main employee for appointment)

  "notes": "First time braces"

}- **Participants** (assistants/nurses)---

```



✅ Expected: 201 Created

### Endpoint## Response Examples

**Test 2**: Invalid - Double booking



```

POST {{base_url}}/api/v1/appointments```http### Success Case: Found Slots

Authorization: Bearer {{receptionist_token}}

Body: Same as Test 1GET /api/v1/employees/medical-staff

```

Authorization: Bearer {access_token}```json

❌ Expected: 400 Bad Request - DOCTOR_NOT_AVAILABLE

```{

#### Scenario 3: Update and Cancel

  "totalDurationNeeded": 120,

**Test 1**: Update appointment

### Authorization  "availableSlots": [

```

PUT {{base_url}}/api/v1/appointments/1    {

Authorization: Bearer {{receptionist_token}}

Body: {```      "startTime": "2025-10-30T08:00:00",

  "employeeCode": "EMP003",

  "serviceCode": "ENDO_SIMPLE",Required Permission: VIEW_EMPLOYEE      "availableCompatibleRoomCodes": [

  "roomCode": "P-02",

  "appointmentDate": "2025-11-16",```        "P-IMPLANT-01",

  "appointmentTime": "14:00:00"

}        "P-IMPLANT-02",

```

### Response (200 OK)        "P-IMPLANT-03"

✅ Expected: 200 OK with updated data

      ],

**Test 2**: Cancel appointment

```json      "note": null

```

DELETE {{base_url}}/api/v1/appointments/1[    },

Authorization: Bearer {{receptionist_token}}

```  {    {



✅ Expected: 204 No Content    "employeeId": 2,      "startTime": "2025-10-30T08:15:00",



---    "employeeCode": "EMP002",      "availableCompatibleRoomCodes": ["P-IMPLANT-01", "P-IMPLANT-03"],



## Permission Matrix    "fullName": "Minh Nguyễn Văn",      "note": null



| API Endpoint                          | Required Permission   | Roles with Access          |    "email": "minh.nguyen@dental.com",    },

| ------------------------------------- | --------------------- | -------------------------- |

| GET /api/v1/appointments/available-times | `VIEW_APPOINTMENT` | ADMIN, MANAGER, RECEPTIONIST |    "phoneNumber": "0901234567",    {

| POST /api/v1/appointments             | `CREATE_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |

| GET /api/v1/appointments/{id}         | `VIEW_APPOINTMENT`    | ADMIN, MANAGER, RECEPTIONIST, DOCTOR |    "roleId": 2,      "startTime": "2025-10-30T14:00:00",

| PUT /api/v1/appointments/{id}         | `UPDATE_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |

| DELETE /api/v1/appointments/{id}      | `CANCEL_APPOINTMENT`  | ADMIN, MANAGER, RECEPTIONIST |    "roleName": "Doctor",      "availableCompatibleRoomCodes": ["P-IMPLANT-02"],



---    "isActive": true,      "note": null



## Database Schema    "specializations": [    }



### appointments table      {  ],



```sql        "specializationId": 1,  "message": null

CREATE TABLE appointments (

    appointment_id SERIAL PRIMARY KEY,        "specializationCode": "SPEC-ORTHO",}

    patient_id INTEGER NOT NULL,

    employee_id INTEGER NOT NULL,        "specializationName": "Chỉnh nha"```

    room_id VARCHAR(50) NOT NULL,

    appointment_start_time TIMESTAMP NOT NULL,      },

    appointment_end_time TIMESTAMP NOT NULL,

    expected_duration_minutes INTEGER NOT NULL,      {**Interpretation**:

    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',

    actual_start_time TIMESTAMP,        "specializationId": 7,

    actual_end_time TIMESTAMP,

    rescheduled_to_appointment_id INTEGER,        "specializationCode": "SPEC-COSMETIC",- Need 120 minutes total

    notes TEXT,

    created_by INTEGER,        "specializationName": "Răng thẩm mỹ"- 3 time slots available

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP,      },- At 8:00, can use any of 3 rooms



    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),      {- At 8:15, room P-IMPLANT-02 became busy

    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),

    FOREIGN KEY (room_id) REFERENCES rooms(room_id),        "specializationId": 8,- At 14:00, only 1 room available

    FOREIGN KEY (created_by) REFERENCES employees(employee_id)

);        "specializationCode": "SPEC-STANDARD",



CREATE INDEX idx_appointments_employee ON appointments(employee_id);        "specializationName": "Y tế cơ bản"### Edge Case: No Compatible Rooms

CREATE INDEX idx_appointments_room ON appointments(room_id);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);      }

CREATE INDEX idx_appointments_date ON appointments(appointment_start_time);

CREATE INDEX idx_appointments_status ON appointments(status);    ]```json

```

  },{

---

  {  "totalDurationNeeded": 60,

## V2 Seed Data Reference

    "employeeId": 4,  "availableSlots": [],

### Employees with Specializations

    "employeeCode": "EMP004",  "message": "Không có phòng nào hỗ trợ các dịch vụ này"

```sql

-- EMP002: Minh Nguyễn Văn    "fullName": "Mai Lê Thị",}

-- Specializations: [1-Chỉnh nha, 7-Răng thẩm mỹ, 8-STANDARD]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15    "roleId": 3,```



-- EMP003: Lan Trần Thị    "roleName": "Nurse",

-- Specializations: [2-Nội nha, 4-Phục hồi, 8-STANDARD]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15    "isActive": true,**Reason**: Services requested require equipment not in any room (e.g., X-ray + Surgery combo)



-- EMP004: Mai Lê Thị    "specializations": [

-- Specializations: [8-STANDARD only]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15      {### Edge Case: Doctor Has No Shifts



-- EMP005: Tuấn Hoàng Văn        "specializationId": 8,

-- Specializations: [8-STANDARD only]

-- Shifts: Ca Sáng (8h-16h) on 2025-11-15        "specializationCode": "SPEC-STANDARD",```json

```

        "specializationName": "Y tế cơ bản"{

### Services with Specialization Requirements

      }  "totalDurationNeeded": 45,

```sql

-- ORTHO_BRACES_METAL: Niềng răng kim loại    ]  "availableSlots": [],

-- Duration: 90 min, Buffer: 15 min

-- Required: Specialization 1 (Chỉnh nha)  }  "message": null



-- CROWN_EMAX: Bọc răng sứ E.max]}

-- Duration: 60 min, Buffer: 15 min

-- Required: Specialization 7 (Răng thẩm mỹ)``````



-- ENDO_SIMPLE: Điều trị tủy đơn giản

-- Duration: 60 min, Buffer: 15 min

-- Required: Specialization 2 (Nội nha)**NOTE**: EMP001 (Admin) will NOT appear because it doesn't have specialization ID 8.**Reason**: Doctor not scheduled to work on that date (or it's a holiday)



-- IMPLANT_L1: Cấy ghép Implant loại 1

-- Duration: 120 min, Buffer: 30 min

-- Required: Specialization 6 (Cấy ghép Implant)### Medical Staff Definition### Edge Case: All Slots Busy

```



---

``````json

## Version History

Medical Staff = Employee with STANDARD Specialization (ID 8){

| Version | Date       | Changes                             | Author  |

| ------- | ---------- | ----------------------------------- | ------- |  "totalDurationNeeded": 30,

| V1      | 2024-11-03 | Initial Appointment Management APIs | BE Team |

ID 8 (SPEC-STANDARD) = Y tế cơ bản - REQUIRED for ALL medical staff  "availableSlots": [],

---

ID 9 (SPEC-INTERN) = Thực tập sinh - Optional  "message": null

## Contact & Support

ID 1-7 = Specific specializations - Optional}

- **Backend Team**: backend@dentalclinic.com

- **API Issues**: Create issue in JIRA (Project: PDCMS)```

- **Documentation**: https://docs.dentalclinic.com/api/appointments

NO ID 8 = Admin/Receptionist - CANNOT be assigned to appointments

---

```**Reason**: Doctor has shifts but all times are booked with appointments

**Last Updated**: November 3, 2024

**Document Version**: 1.0


### Frontend Integration Pattern---



**Step 1: Fetch Medical Staff on Page Load**## Error Scenarios



```typescript### Error 1: Invalid Date Format

import { useEffect, useState } from 'react';

**Request**:

interface EmployeeInfoResponse {

  employeeId: number;```http

  employeeCode: string;GET /api/v1/appointments/available-times?date=30-10-2025&employeeCode=BS-001&serviceCodes=SCALING_L1

  fullName: string;```

  specializations: Array<{

    specializationId: number;**Response**: `400 Bad Request`

    specializationName: string;

  }>;```json

}{

  "title": "Invalid date format: 30-10-2025",

const AppointmentBookingForm = () => {  "entityName": "appointment",

  const [medicalStaff, setMedicalStaff] = useState<EmployeeInfoResponse[]>([]);  "errorKey": "INVALID_DATE"

  }

  useEffect(() => {```

    const fetchMedicalStaff = async () => {

      const response = await fetch(### Error 2: Date in Past

        'http://localhost:8080/api/v1/employees/medical-staff',

        {**Request**:

          headers: {

            Authorization: `Bearer ${accessToken}````http

          }GET /api/v1/appointments/available-times?date=2025-10-01&employeeCode=BS-001&serviceCodes=SCALING_L1

        }```

      );

      const data = await response.json();(Assuming today is Oct 25)

      setMedicalStaff(data);**Response**: `400 Bad Request`

    };

    ```json

    fetchMedicalStaff();{

  }, []);  "title": "Cannot search for past dates: 2025-10-01",

    "entityName": "appointment",

  return (  "errorKey": "DATE_IN_PAST"

    <div>}

      <h2>Book Appointment</h2>```



      <label>Select Doctor:</label>### Error 3: Employee Not Found

      <select name="doctorCode">

        <option value="">-- Choose Doctor --</option>**Request**:

        {medicalStaff

          .filter(emp => emp.roleName === 'Doctor')```http

          .map(emp => (GET /api/v1/appointments/available-times?date=2025-11-01&employeeCode=INVALID_CODE&serviceCodes=SCALING_L1

            <option key={emp.employeeCode} value={emp.employeeCode}>```

              {emp.fullName} ({emp.employeeCode})

            </option>**Response**: `404 Not Found`

          ))}

      </select>```json

      {

      <label>Select Assistants (Optional):</label>  "title": "Employee not found or inactive: INVALID_CODE",

      <select name="participants" multiple>  "entityName": "appointment",

        {medicalStaff  "errorKey": "EMPLOYEE_NOT_FOUND"

          .filter(emp => emp.roleName === 'Nurse' || emp.roleName === 'Assistant')}

          .map(emp => (```

            <option key={emp.employeeCode} value={emp.employeeCode}>

              {emp.fullName} ({emp.employeeCode})### Error 4: Services Not Found

            </option>

          ))}**Request**:

      </select>

    </div>```http

  );GET /api/v1/appointments/available-times?date=2025-11-01&employeeCode=EMP002&serviceCodes=INVALID_SERVICE&serviceCodes=SCALING_L1

};```

```

**Response**: `404 Not Found`

---

```json

## Business Rules{

  "title": "Services not found: INVALID_SERVICE",

### Rule 1: Date Validation  "entityName": "appointment",

  "errorKey": "SERVICES_NOT_FOUND"

- MUST be in format `YYYY-MM-DD`}

- MUST NOT be in the past (`date >= LocalDate.now()`)```



### Rule 2: Employee Validation### Error 5: Services Inactive



- MUST exist in database**Request**:

- MUST be active (`is_active = true`)

```http

### Rule 3: Services ValidationGET /api/v1/appointments/available-times?date=2025-11-01&employeeCode=EMP002&serviceCodes=OLD_SERVICE

```

- ALL service codes MUST exist

- ALL services MUST be active(Assuming OLD_SERVICE has `is_active = false`)

**Response**: `400 Bad Request`

### Rule 4: Duration Calculation

```json

```{

totalDuration = SUM(service.defaultDurationMinutes + service.defaultBufferMinutes)  "title": "Services are inactive: OLD_SERVICE",

```  "entityName": "appointment",

  "errorKey": "SERVICES_INACTIVE"

Example:}

- GEN_EXAM: 30 min + 15 buffer = 45 min total```



### Rule 5: Doctor Specialization Check### Error 6: Employee Not Qualified



- Doctor MUST have ALL required specializations for the services**Request**:

- ALL medical staff MUST have specialization ID 8 (STANDARD)

```http

### Rule 6: Compatible RoomsGET /api/v1/appointments/available-times?date=2025-11-01&employeeCode=EMP001&serviceCodes=IMPLANT_FIXTURE

```

- Rooms MUST support ALL requested services (from `room_services` table)

- Uses SQL: `SELECT room_id WHERE service_id IN (...) GROUP BY room_id HAVING COUNT(*) = N`(EMP001 is admin - doesn't have medical specializations)

**Response**: `409 Conflict`

### Rule 7: Holiday Handling

```json

- Automatically handled by `employee_shifts` table{

- If date is holiday, doctor has no shifts → Empty response  "title": "Employee does not have required specializations for these services",

  "entityName": "appointment",

### Rule 8: Shift as Source of Truth  "errorKey": "EMPLOYEE_NOT_QUALIFIED"

}

- Only work shifts create availability windows```

- Busy appointments SUBTRACT from these windows

### Error 7: Participant Not Found

### Rule 9: Participant Availability

**Request**:

- If `participantCodes` provided, check their busy times too

- Participant can be busy as:```http

  - Primary doctor in another appointmentGET /api/v1/appointments/available-times?date=2025-11-01&employeeCode=EMP002&serviceCodes=EXTRACT_WISDOM_L2&participantCodes=PT-INVALID

  - Participant in another appointment```



### Rule 10: Slot Interval**Response**: `404 Not Found`



- Slots are split every **15 minutes**```json

- Only show slots where full duration fits{

  "title": "Participant not found or inactive: PT-INVALID",

---  "entityName": "appointment",

  "errorKey": "PARTICIPANT_NOT_FOUND"

## Error Handling}

```

### P3.1 Error Codes

---

| HTTP Status | Error Key | Description |

|-------------|-----------|-------------|## Postman Testing Guide

| 400 | `INVALID_DATE` | Invalid date format |

| 400 | `DATE_IN_PAST` | Cannot search for past dates |### Test Case 1: Happy Path - Find Slots Successfully

| 404 | `EMPLOYEE_NOT_FOUND` | Employee not found or inactive |

| 404 | `SERVICES_NOT_FOUND` | Service codes don't exist |**Setup**:

| 400 | `SERVICES_INACTIVE` | Services are inactive |

| 400 | `EMPLOYEE_NOT_MEDICAL_STAFF` | Employee lacks STANDARD (ID 8) |1. Use employee: `EMP002` (Bác sĩ Minh - has STANDARD + Chỉnh nha + Răng thẩm mỹ)

| 409 | `EMPLOYEE_NOT_QUALIFIED` | Employee lacks required specializations |2. Use services: `GEN_EXAM` (Khám tổng quát - requires STANDARD ID 8) ✅

| 404 | `PARTICIPANT_NOT_FOUND` | Participant not found or inactive |3. Ensure EMP002 has shifts on target date 2025-11-15

| 400 | `PARTICIPANT_NOT_MEDICAL_STAFF` | Participant lacks STANDARD (ID 8) |

**Request**:

### P3.2 Error Codes

```

| HTTP Status | Error Key | Description |GET {{base_url}}/appointments/available-times

|-------------|-----------|-------------|  ?date=2025-11-15

| 400 | `PATIENT_NOT_FOUND` | Patient code doesn't exist |  &employeeCode=EMP002

| 400 | `PATIENT_INACTIVE` | Patient is not active |  &serviceCodes=GEN_EXAM

| 409 | `PATIENT_HAS_CONFLICT` | Patient has appointment at same time |```

| 400 | `EMPLOYEE_NOT_FOUND` | Doctor code doesn't exist or inactive |

| 400 | `EMPLOYEE_NOT_MEDICAL_STAFF` | Employee lacks STANDARD (ID 8) |**Expected Response**:

| 409 | `EMPLOYEE_NOT_QUALIFIED` | Doctor lacks required specializations |```json

| 409 | `EMPLOYEE_NOT_SCHEDULED` | Doctor has no shift |{

| 409 | `EMPLOYEE_SLOT_TAKEN` | Doctor is busy |  "totalDurationNeeded": 45,  // 30 min + 15 buffer

| 400 | `ROOM_NOT_FOUND` | Room code doesn't exist |  "availableSlots": [

| 400 | `ROOM_INACTIVE` | Room is not active |    {

| 409 | `ROOM_NOT_COMPATIBLE` | Room doesn't support all services |      "startTime": "2025-11-15T08:00:00",

| 409 | `ROOM_SLOT_TAKEN` | Room is already booked |      "availableCompatibleRoomCodes": ["P-GENERAL-01", "P-GENERAL-02"]

| 400 | `SERVICES_NOT_FOUND` | Service codes don't exist |    }

| 400 | `SERVICES_INACTIVE` | Services are inactive |  ]

| 400 | `PARTICIPANT_NOT_FOUND` | Participant doesn't exist or inactive |}

| 400 | `PARTICIPANT_NOT_MEDICAL_STAFF` | Participant lacks STANDARD (ID 8) |```

| 409 | `PARTICIPANT_NOT_SCHEDULED` | Participant has no shift |

| 409 | `PARTICIPANT_SLOT_TAKEN` | Participant is busy |**Assertions**:

| 400 | `START_TIME_IN_PAST` | Appointment time must be in future |

| 400 | `INVALID_START_TIME` | Invalid ISO 8601 format |```javascript

pm.test("Status is 200", () => pm.response.to.have.status(200));

### Error Examplespm.test("Has totalDurationNeeded", () => {

  const json = pm.response.json();

**Error 1: Date in Past**  pm.expect(json.totalDurationNeeded).to.equal(45); // 30 + 15

});

```jsonpm.test("Has availableSlots array", () => {

{  const json = pm.response.json();

  "title": "Cannot search for past dates: 2025-10-01",  pm.expect(json.availableSlots).to.be.an("array");

  "entityName": "appointment",});

  "errorKey": "DATE_IN_PAST"```

}

```### Test Case 2: Date in Past - Should Return 400



**Error 2: Employee Not Found****Request**:



```json```

{GET {{base_url}}/appointments/available-times

  "title": "Employee not found or inactive: INVALID_CODE",  ?date=2025-10-01

  "entityName": "appointment",  &employeeCode=EMP002

  "errorKey": "EMPLOYEE_NOT_FOUND"  &serviceCodes=GEN_EXAM

}```

```

**Assertions**:

**Error 3: Employee Not Qualified**

```javascript

```jsonpm.test("Status is 400", () => pm.response.to.have.status(400));

{pm.test("Error key is DATE_IN_PAST", () => {

  "title": "Employee does not have required specializations for these services",  const json = pm.response.json();

  "entityName": "appointment",  pm.expect(json.errorKey).to.equal("DATE_IN_PAST");

  "errorKey": "EMPLOYEE_NOT_QUALIFIED"});

}```

```

### Test Case 3: Invalid Employee - Should Return 404

---

**Request**:

## Postman Testing Guide

```

### Test Case 1: Happy Path - Find SlotsGET {{base_url}}/appointments/available-times

  ?date=2025-11-15

**Setup**:  &employeeCode=NONEXISTENT

- Use employee: `EMP002` (has STANDARD + Chỉnh nha + Răng thẩm mỹ)  &serviceCodes=GEN_EXAM

- Use service: `GEN_EXAM` (requires STANDARD ID 8)```

- Seed data has shift for EMP002 on 2025-11-15

**Assertions**:

**Request**:

```javascript

```pm.test("Status is 404", () => pm.response.to.have.status(404));

GET {{base_url}}/appointments/available-timespm.test("Error key is EMPLOYEE_NOT_FOUND", () => {

  ?date=2025-11-15  const json = pm.response.json();

  &employeeCode=EMP002  pm.expect(json.errorKey).to.equal("EMPLOYEE_NOT_FOUND");

  &serviceCodes=GEN_EXAM});

```````

**Expected Response**:### Test Case 4: Admin Cannot Be Doctor - Should Return 400

````json

{**Request**:

  "totalDurationNeeded": 45,

  "availableSlots": [```

    {GET {{base_url}}/appointments/available-times

      "startTime": "2025-11-15T08:00:00",  ?date=2025-11-15

      "availableCompatibleRoomCodes": ["P-GENERAL-01", "P-GENERAL-02"]  &employeeCode=EMP001

    }  &serviceCodes=GEN_EXAM

  ]```

}

```**Expected Error**:

```json

**Assertions**:{

  "statusCode": 400,

```javascript  "error": "EMPLOYEE_NOT_MEDICAL_STAFF",

pm.test("Status is 200", () => pm.response.to.have.status(200));  "message": "Employee must have STANDARD specialization (ID 8) to be assigned to appointments. Employee EMP001 does not have STANDARD specialization (Admin/Receptionist cannot be assigned)"

pm.test("Has totalDurationNeeded", () => {}

  const json = pm.response.json();```

  pm.expect(json.totalDurationNeeded).to.equal(45);

});**Assertions**:

pm.test("Has availableSlots array", () => {

  const json = pm.response.json();```javascript

  pm.expect(json.availableSlots).to.be.an('array');pm.test("Status is 400", () => pm.response.to.have.status(400));

});pm.test("Error is EMPLOYEE_NOT_MEDICAL_STAFF", () => {

```  const json = pm.response.json();

  pm.expect(json.error).to.include("EMPLOYEE_NOT_MEDICAL_STAFF");

### Test Case 2: Date in Past});

````

**Request**:

### Test Case 5: Doctor Not Qualified for Service - Should Return 400

````

GET {{base_url}}/appointments/available-times**Request**:

  ?date=2024-10-01

  &employeeCode=EMP002```

  &serviceCodes=GEN_EXAMGET {{base_url}}/appointments/available-times

```  ?date=2025-11-15

  &employeeCode=EMP003

**Assertions**:  &serviceCodes=VENEER_EMAX

````

```````javascript

pm.test("Status is 400", () => pm.response.to.have.status(400));**Explanation**:

pm.test("Error key is DATE_IN_PAST", () => {- **EMP003**: Has specializations [2-Nội nha, 4-Phục hồi, 8-STANDARD]

  const json = pm.response.json();- **VENEER_EMAX**: Requires specialization 7 (Răng thẩm mỹ)

  pm.expect(json.errorKey).to.equal("DATE_IN_PAST");- **Result**: ❌ EMP003 does NOT have specialization 7

});

```**Expected Error**:

```json

### Test Case 3: Invalid Employee{

  "statusCode": 400,

**Request**:  "error": "EMPLOYEE_NOT_QUALIFIED",

  "message": "Employee does not have required specializations for these services"

```}

GET {{base_url}}/appointments/available-times```

  ?date=2025-11-15

  &employeeCode=NONEXISTENT**Assertions**:

  &serviceCodes=GEN_EXAM

``````javascript

pm.test("Status is 400", () => pm.response.to.have.status(400));

**Assertions**:pm.test("Error is EMPLOYEE_NOT_QUALIFIED", () => {

  const json = pm.response.json();

```javascript  pm.expect(json.error).to.include("EMPLOYEE_NOT_QUALIFIED");

pm.test("Status is 404", () => pm.response.to.have.status(404));});

pm.test("Error key is EMPLOYEE_NOT_FOUND", () => {```

  const json = pm.response.json();

  pm.expect(json.errorKey).to.equal("EMPLOYEE_NOT_FOUND");### Test Case 6: With Valid Participants

});

```**Request**:



### Test Case 4: Admin Cannot Be Doctor```

GET {{base_url}}/appointments/available-times

**Request**:  ?date=2025-11-15

  &employeeCode=EMP003

```  &serviceCodes=FILLING_COMP

GET {{base_url}}/appointments/available-times  &participantCodes=EMP004

  ?date=2025-11-15  &participantCodes=EMP005

  &employeeCode=EMP001```

  &serviceCodes=GEN_EXAM

```**Explanation**:

- **EMP003**: Doctor with Nội nha (ID 2) + STANDARD (ID 8) ✅

**Expected Error**:- **FILLING_COMP**: Requires Nội nha (ID 2) ✅ Match!

```json- **EMP004, EMP005**: Nurses with STANDARD (ID 8) ✅ Can be participants!

{

  "statusCode": 400,**Assertions**:

  "error": "EMPLOYEE_NOT_MEDICAL_STAFF",

  "message": "Employee must have STANDARD specialization (ID 8)"```javascript

}pm.test("Status is 200", () => pm.response.to.have.status(200));

```pm.test("Slots consider participant availability", () => {

  const json = pm.response.json();

**Assertions**:  // Slots should exclude times when participants are busy

  pm.expect(json.availableSlots).to.be.an("array");

```javascript});

pm.test("Status is 400", () => pm.response.to.have.status(400));```

pm.test("Error is EMPLOYEE_NOT_MEDICAL_STAFF", () => {

  const json = pm.response.json();### Test Case 7: Participant Not Medical Staff - Should Return 400

  pm.expect(json.error).to.include("EMPLOYEE_NOT_MEDICAL_STAFF");

});**Request**:

```````

````

### Test Case 5: Doctor Not QualifiedGET {{base_url}}/appointments/available-times

  ?date=2025-11-15

**Request**:  &employeeCode=EMP002

  &serviceCodes=GEN_EXAM

```  &participantCodes=EMP001

GET {{base_url}}/appointments/available-times```

  ?date=2025-11-15

  &employeeCode=EMP003**Explanation**:

  &serviceCodes=VENEER_EMAX- **EMP001**: Admin with NO specialization 8 ❌ Cannot be participant!

````

**Expected Error**:

**Explanation**:```json

- **EMP003**: Has [2-Nội nha, 4-Phục hồi, 8-STANDARD]{

- **VENEER_EMAX**: Requires specialization 7 (Răng thẩm mỹ) "statusCode": 400,

- **Result**: EMP003 does NOT have specialization 7 "error": "PARTICIPANT_NOT_MEDICAL_STAFF",

  "message": "Participants must have STANDARD specialization (ID 8). The following employees do not have STANDARD: EMP001"

**Expected Error**:}

`json`

{

"statusCode": 400,**Assertions**:

"error": "EMPLOYEE_NOT_QUALIFIED",

"message": "Employee does not have required specializations for these services"```javascript

}pm.test("Status is 400", () => pm.response.to.have.status(400));

````pm.test("Error is PARTICIPANT_NOT_MEDICAL_STAFF", () => {

  const json = pm.response.json();

**Assertions**:  pm.expect(json.error).to.include("PARTICIPANT_NOT_MEDICAL_STAFF");

});

```javascript```

pm.test("Status is 400", () => pm.response.to.have.status(400));

pm.test("Error is EMPLOYEE_NOT_QUALIFIED", () => {---

  const json = pm.response.json();

  pm.expect(json.error).to.include("EMPLOYEE_NOT_QUALIFIED");## TypeScript Integration

});

```### Interface Definitions



### Test Case 6: With Valid Participants```typescript

interface AvailableTimesRequest {

**Request**:  date: string; // YYYY-MM-DD

  employeeCode: string;

```  serviceCodes: string[];

GET {{base_url}}/appointments/available-times  participantCodes?: string[];

  ?date=2025-11-15}

  &employeeCode=EMP003

  &serviceCodes=FILLING_COMPinterface TimeSlot {

  &participantCodes=EMP004  startTime: string; // ISO 8601

  &participantCodes=EMP005  availableCompatibleRoomCodes: string[];

```  note?: string | null;

}

**Explanation**:

- **EMP003**: Doctor with Nội nha (ID 2) + STANDARD (ID 8)interface AvailableTimesResponse {

- **FILLING_COMP**: Requires Nội nha (ID 2) - Match!  totalDurationNeeded: number; // minutes

- **EMP004, EMP005**: Nurses with STANDARD (ID 8) - Can be participants!  availableSlots: TimeSlot[];

  message?: string | null;

**Assertions**:}

````

````javascript

pm.test("Status is 200", () => pm.response.to.have.status(200));### Example Usage (React + Axios)

pm.test("Has availableSlots array", () => {

  const json = pm.response.json();```typescript

  pm.expect(json.availableSlots).to.be.an('array');import axios from "axios";

});

```async function findAvailableSlots(

  date: string,

### Test Case 7: Participant Not Medical Staff  doctorCode: string,

  services: string[]

**Request**:): Promise<AvailableTimesResponse> {

  const response = await axios.get<AvailableTimesResponse>(

```    "/api/v1/appointments/available-times",

GET {{base_url}}/appointments/available-times    {

  ?date=2025-11-15      params: {

  &employeeCode=EMP002        date,

  &serviceCodes=GEN_EXAM        employeeCode: doctorCode,

  &participantCodes=EMP001        serviceCodes: services,

```      },

      paramsSerializer: {

**Explanation**:        indexes: null, // Use array format: serviceCodes=A&serviceCodes=B

- **EMP001**: Admin with NO specialization 8 - Cannot be participant!      },

    }

**Expected Error**:  );

```json  return response.data;

{}

  "statusCode": 400,

  "error": "PARTICIPANT_NOT_MEDICAL_STAFF",// Usage

  "message": "Participants must have STANDARD specialization (ID 8)"const slots = await findAvailableSlots("2025-11-15", "EMP002", [

}  "GEN_EXAM",

```]);



**Assertions**:console.log(`Need ${slots.totalDurationNeeded} minutes`);

console.log(`Found ${slots.availableSlots.length} slots`);

```javascript

pm.test("Status is 400", () => pm.response.to.have.status(400));slots.availableSlots.forEach((slot, index) => {

pm.test("Error is PARTICIPANT_NOT_MEDICAL_STAFF", () => {  console.log(`Slot ${index + 1}: ${slot.startTime}`);

  const json = pm.response.json();  console.log(`  Rooms: ${slot.availableCompatibleRoomCodes.join(", ")}`);

  pm.expect(json.error).to.include("PARTICIPANT_NOT_MEDICAL_STAFF");});

});```

````

### Real-World Examples with Seed Data

---

````typescript

## TypeScript Integration// Example 1: GEN_EXAM with EMP002 (has STANDARD ID 8) ✅

const slots1 = await findAvailableSlots("2025-11-15", "EMP002", ["GEN_EXAM"]);

### Interface Definitions

// Example 2: Nội nha services with EMP003 (has Nội nha ID 2) ✅

```typescriptconst slots2 = await findAvailableSlots("2025-11-15", "EMP003", [

interface AvailableTimesRequest {  "FILLING_COMP",

  date: string;  // YYYY-MM-DD  "ENDO_TREAT_ANT",

  employeeCode: string;]);

  serviceCodes: string[];

  participantCodes?: string[];// Example 3: Răng thẩm mỹ with EMP002 (has Răng thẩm mỹ ID 7) ✅

}const slots3 = await findAvailableSlots("2025-11-15", "EMP002", [

  "VENEER_EMAX",

interface TimeSlot {]);

  startTime: string;  // ISO 8601

  availableCompatibleRoomCodes: string[];// Example 4: With participants ✅

  note?: string | null;const slots4 = await findAvailableSlots(

}  "2025-11-15",

  "EMP002",

interface AvailableTimesResponse {  ["GEN_EXAM"],

  totalDurationNeeded: number;  // minutes  ["EMP004", "EMP005"] // Nurses with STANDARD ID 8

  availableSlots: TimeSlot[];);

  message?: string | null;

}// ❌ WRONG Examples (will throw errors)

```try {

  // Admin cannot be doctor

### Example Usage (React + Axios)  await findAvailableSlots("2025-11-15", "EMP001", ["GEN_EXAM"]);

} catch (error) {

```typescript  console.error("EMPLOYEE_NOT_MEDICAL_STAFF"); // EMP001 has no ID 8

import axios from 'axios';}



async function findAvailableSlots(try {

  date: string,  // Doctor not qualified for service

  doctorCode: string,  await findAvailableSlots("2025-11-15", "EMP003", ["VENEER_EMAX"]);

  services: string[]} catch (error) {

): Promise<AvailableTimesResponse> {  console.error("EMPLOYEE_NOT_QUALIFIED"); // EMP003 has no ID 7 (Răng thẩm mỹ)

  const response = await axios.get<AvailableTimesResponse>(}

    '/api/v1/appointments/available-times',

    {slots.availableSlots.forEach((slot, index) => {

      params: {  console.log(`Slot ${index + 1}: ${slot.startTime}`);

        date,  console.log(`  Rooms: ${slot.availableCompatibleRoomCodes.join(", ")}`);

        employeeCode: doctorCode,});

        serviceCodes: services```

      },

      paramsSerializer: {### Display in UI (Example Component)

        indexes: null  // Use array format: serviceCodes=A&serviceCodes=B

      }```tsx

    }function AvailableSlotsPicker({ slots }: { slots: TimeSlot[] }) {

  );  return (

  return response.data;    <div className="slots-grid">

}      {slots.map((slot, i) => (

        <div key={i} className="slot-card">

// Usage          <h4>{formatTime(slot.startTime)}</h4>

const slots = await findAvailableSlots('2025-11-15', 'EMP002', ['GEN_EXAM']);          <p>Available Rooms:</p>

          <ul>

console.log(`Need ${slots.totalDurationNeeded} minutes`);            {slot.availableCompatibleRoomCodes.map((roomCode) => (

console.log(`Found ${slots.availableSlots.length} slots`);              <li key={roomCode}>{roomCode}</li>

            ))}

slots.availableSlots.forEach((slot, index) => {          </ul>

  console.log(`Slot ${index + 1}: ${slot.startTime}`);          <button onClick={() => selectSlot(slot)}>Book This Slot</button>

  console.log(`  Rooms: ${slot.availableCompatibleRoomCodes.join(', ')}`);        </div>

});      ))}

```    </div>

  );

### Real-World Examples with Seed Data}

````

````typescript

// Example 1: GEN_EXAM with EMP002 (has STANDARD ID 8)---

const slots1 = await findAvailableSlots('2025-11-15', 'EMP002', ['GEN_EXAM']);

## Performance Notes

// Example 2: Nội nha services with EMP003 (has Nội nha ID 2)

const slots2 = await findAvailableSlots('2025-11-15', 'EMP003', ['FILLING_COMP', 'ENDO_TREAT_ANT']);### Optimization 1: Caching Employee Shifts



// Example 3: Răng thẩm mỹ with EMP002 (has Răng thẩm mỹ ID 7)```java

const slots3 = await findAvailableSlots('2025-11-15', 'EMP002', ['VENEER_EMAX']);// Consider caching employee_shifts for the day to avoid repeated DB queries

@Cacheable(value = "employeeShifts", key = "#employeeId + '-' + #date")

// WRONG Examples (will throw errors)public List<EmployeeShift> getShiftsForDate(Integer employeeId, LocalDate date) {

try {    return shiftRepository.findByEmployeeAndDate(employeeId, date);

  // Admin cannot be doctor}

  await findAvailableSlots('2025-11-15', 'EMP001', ['GEN_EXAM']);```

} catch (error) {

  console.error('EMPLOYEE_NOT_MEDICAL_STAFF');### Optimization 2: Batch Query for Participants

}

```java

try {// Instead of querying each participant separately, use IN clause

  // Doctor not qualified for serviceList<Integer> participantIds = // ...

  await findAvailableSlots('2025-11-15', 'EMP003', ['VENEER_EMAX']);List<EmployeeShift> allParticipantShifts =

} catch (error) {    shiftRepository.findByEmployeeIdsAndDate(participantIds, date);

  console.error('EMPLOYEE_NOT_QUALIFIED');```

}

```### Optimization 3: Database Indexes



### Display in UI (Example Component)Ensure these indexes exist:



```tsx```sql

function AvailableSlotsPicker({ slots }: { slots: TimeSlot[] }) {CREATE INDEX idx_appt_employee_time ON appointments(employee_id, appointment_start_time, appointment_end_time);

  return (CREATE INDEX idx_appt_room_time ON appointments(room_id, appointment_start_time, appointment_end_time);

    <div className="slots-grid">CREATE INDEX idx_employee_shift_date ON employee_shifts(employee_id, work_date);

      {slots.map((slot, i) => (```

        <div key={i} className="slot-card">

          <h4>{formatTime(slot.startTime)}</h4>### Optimization 4: Limit Slot Generation

          <p>Available Rooms:</p>

          <ul>```java

            {slot.availableCompatibleRoomCodes.map(roomCode => (// Don't generate slots beyond clinic closing time

              <li key={roomCode}>{roomCode}</li>private static final LocalTime CLINIC_CLOSE = LocalTime.of(18, 0);

            ))}

          </ul>while (slotTime.toLocalTime().isBefore(CLINIC_CLOSE)) {

          <button onClick={() => selectSlot(slot)}>Book This Slot</button>    // Generate slot...

        </div>}

      ))}```

    </div>

  );### Performance Expectations

}

```- **Single Employee, 1 Service**: < 100ms

- **With 2 Participants, 3 Services**: < 300ms

---- **Complex (5 Services, 3 Participants)**: < 500ms



## Workflow: P3.1 → P3.2**Note**: If response time > 500ms, consider:



**Step 1: Find Available Times** (P3.1)1. Adding Redis cache for shifts

2. Pre-computing busy times daily

```typescript3. Using database materialized views

const slots = await findAvailableSlots('2025-11-15', 'EMP002', ['GEN_EXAM']);

// Returns: [{ startTime: '2025-11-15T09:00:00', availableCompatibleRoomCodes: ['P-GENERAL-01'] }]---

````

## Known Limitations & Future Enhancements

**Step 2: User Selects Slot**

### Current Limitations

````typescript

const selectedSlot = slots[0];1. **Room Availability Check Disabled**: Due to schema mismatch (`rooms.room_id` VARCHAR vs `appointments.room_id` INTEGER), room conflict checking is temporarily disabled. All compatible rooms are returned without checking if they're busy.

const selectedRoom = selectedSlot.availableCompatibleRoomCodes[0];

```2. **No Equipment Tracking**: Cannot check if specific equipment (e.g., X-ray machine) is available.



**Step 3: Create Appointment** (P3.2)3. **No Priority Slots**: All slots have equal priority (no VIP/urgent slot reservation).



```typescript### Phase 2 Enhancements

const appointment = await createAppointment({

  patientCode: 'BN-1001',1. **Service Dependencies**: Check if patient has completed prerequisite services (e.g., "Nâng xoang" before "Cắm trụ Implant").

  employeeCode: 'EMP002',

  roomCode: selectedRoom,2. **Patient Validation**: Check patient payment status, allergies before showing slots.

  serviceCodes: ['GEN_EXAM'],

  appointmentStartTime: selectedSlot.startTime3. **Smart Recommendations**: Suggest best slots based on doctor's success rate at different times.

});

// Returns: 201 Created with appointmentCode4. **Multi-Day Search**: Find next available slot across multiple days.

````

---

---

## P3.2: Create Appointment

## Contact & Support

### Endpoint

For questions or issues, contact:

````

- **Backend Team**: backend@dentalclinic.comPOST /api/v1/appointments

- **Slack Channel**: #api-support```


### Authorization

````

Required Permission: CREATE_APPOINTMENT

````

### Request Body (JSON)

```json
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP002",
  "roomCode": "P-IMPLANT-01",
  "serviceCodes": ["IMPLANT_FIXTURE", "BONE_GRAFT_SINUS"],
  "appointmentStartTime": "2025-10-30T09:30:00",
  "participantCodes": ["EMP004", "EMP005"],
  "notes": "Bệnh nhân có tiền sử cao huyết áp"
}
````

| Field                  | Type          | Required | Description                               |
| ---------------------- | ------------- | -------- | ----------------------------------------- |
| `patientCode`          | String        | ✅ Yes   | Patient code (must exist & active)        |
| `employeeCode`         | String        | ✅ Yes   | Primary doctor code (must exist & active) |
| `roomCode`             | String        | ✅ Yes   | Room code (from P3.1 available slots)     |
| `serviceCodes`         | Array<String> | ✅ Yes   | Service codes (at least 1)                |
| `appointmentStartTime` | String        | ✅ Yes   | ISO 8601 format: YYYY-MM-DDTHH:mm:ss      |
| `participantCodes`     | Array<String> | ❌ No    | Participant/assistant codes               |
| `notes`                | String        | ❌ No    | Optional notes from receptionist          |

### Business Logic (9-Step Transaction)

**STEP 1: Get Creator**

- Extract `employee_id` from SecurityContext (logged-in user)
- Populate `created_by` field

**STEP 2: Validate Resources**

- ✅ Patient exists & active
- ✅ Doctor exists & active
- ✅ Room exists & active
- ✅ All services exist & active
- ✅ All participants exist & active

**STEP 3: Validate Doctor Specializations**

- Check doctor has ALL required specializations for services
- Uses `employee_specializations` junction table (ManyToMany relationship)

**STEP 4: Validate Room Compatibility** (V16)

- Check room supports ALL services via `room_services` junction table

**STEP 5: Calculate Duration**

- `totalDuration = SUM(service.defaultDurationMinutes + service.defaultBufferMinutes)`
- `appointmentEndTime = startTime + totalDuration`

**STEP 6: Validate Shifts**

- Doctor must have `employee_shifts` covering time range
- All participants must have shifts covering time range

**STEP 7: Check Conflicts** (CRITICAL - Prevents Double Booking)

- ❌ Doctor has no conflicting appointment
- ❌ Room has no conflicting appointment
- ❌ **Patient has no conflicting appointment** (NEW - prevents same-time booking)
- ❌ Participants have no conflicts (as primary doctor OR assistant)

**STEP 8: Insert Data**

```sql
-- Insert appointment
INSERT INTO appointments (...) VALUES (...);

-- Insert services (loop)
INSERT INTO appointment_services (appointment_id, service_id) VALUES (...);

-- Insert participants with default role 'ASSISTANT'
INSERT INTO appointment_participants (appointment_id, employee_id, role)
VALUES (..., ..., 'ASSISTANT');

-- Insert audit log
INSERT INTO appointment_audit_logs (appointment_id, action_type, changed_by_employee_id)
VALUES (..., 'CREATE', ...);
```

**STEP 9: Return Response**

- Build nested response with summaries

### Response (201 Created)

```json
{
  "appointmentCode": "APT-20251030-001",
  "status": "SCHEDULED",
  "appointmentStartTime": "2025-10-30T09:30:00",
  "appointmentEndTime": "2025-10-30T10:15:00",
  "expectedDurationMinutes": 45,
  "patient": {
    "patientCode": "BN-1001",
    "fullName": "Nguyen Van A"
  },
  "doctor": {
    "employeeCode": "EMP002",
    "fullName": "Minh Nguyễn Văn"
  },
  "room": {
    "roomCode": "P-IMPLANT-01",
    "roomName": "Phòng Implant 01"
  },
  "services": [
    {
      "serviceCode": "IMPLANT_FIXTURE",
      "serviceName": "Cắm trụ Implant"
    },
    {
      "serviceCode": "BONE_GRAFT_SINUS",
      "serviceName": "Nâng xoang"
    }
  ],
  "participants": [
    {
      "employeeCode": "EMP004",
      "fullName": "Mai Lê Thị",
      "role": "ASSISTANT"
    },
    {
      "employeeCode": "EMP005",
      "fullName": "Tuấn Hoàng Văn",
      "role": "ASSISTANT"
    }
  ]
}
```

### Error Codes (P3.2)

| HTTP Status | Error Key                   | Description                                  |
| ----------- | --------------------------- | -------------------------------------------- |
| 400         | `PATIENT_NOT_FOUND`         | Patient code doesn't exist                   |
| 400         | `PATIENT_INACTIVE`          | Patient is not active                        |
| 409         | `PATIENT_HAS_CONFLICT`      | Patient already has appointment at same time |
| 400         | `EMPLOYEE_NOT_FOUND`        | Doctor code doesn't exist or inactive        |
| 409         | `EMPLOYEE_NOT_QUALIFIED`    | Doctor lacks required specializations        |
| 409         | `EMPLOYEE_NOT_SCHEDULED`    | Doctor has no shift covering time range      |
| 409         | `EMPLOYEE_SLOT_TAKEN`       | Doctor is busy during requested time         |
| 400         | `ROOM_NOT_FOUND`            | Room code doesn't exist                      |
| 400         | `ROOM_INACTIVE`             | Room is not active                           |
| 409         | `ROOM_NOT_COMPATIBLE`       | Room doesn't support all services            |
| 409         | `ROOM_SLOT_TAKEN`           | Room is already booked                       |
| 400         | `SERVICES_NOT_FOUND`        | One or more service codes don't exist        |
| 400         | `SERVICES_INACTIVE`         | One or more services are inactive            |
| 400         | `PARTICIPANT_NOT_FOUND`     | Participant code doesn't exist or inactive   |
| 409         | `PARTICIPANT_NOT_SCHEDULED` | Participant has no shift                     |
| 409         | `PARTICIPANT_SLOT_TAKEN`    | Participant is busy (as doctor or assistant) |
| 400         | `START_TIME_IN_PAST`        | Appointment time must be in future           |
| 400         | `INVALID_START_TIME`        | Invalid ISO 8601 format                      |
| 401         | `NOT_AUTHENTICATED`         | User not logged in                           |
| 400         | `NOT_EMPLOYEE_ACCOUNT`      | Logged-in account not linked to employee     |

### Postman Test Case (P3.2)

**Test Case 1: Success - Create Appointment**

```
POST {{base_url}}/appointments
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "patientCode": "BN-1001",
  "employeeCode": "EMP002",
  "roomCode": "P-GENERAL-01",
  "serviceCodes": ["SCALING_L1"],
  "appointmentStartTime": "2025-11-15T09:00:00",
  "notes": "Test appointment creation"
}

Assertions:
✅ Status is 201
✅ Response has appointmentCode
✅ Status is "SCHEDULED"
✅ expectedDurationMinutes matches service duration + buffer
```

**Test Case 2: Doctor Already Busy**

```
POST {{base_url}}/appointments
Body: (Same doctor, same time as existing appointment)

Expected:
❌ 409 Conflict
❌ errorKey: "EMPLOYEE_SLOT_TAKEN"
```

**Test Case 3: Patient Double Booking**

```
POST {{base_url}}/appointments
Body: (Same patient, same time, different doctor)

Expected:
❌ 409 Conflict
❌ errorKey: "PATIENT_HAS_CONFLICT"
```

### TypeScript Integration (P3.2)

```typescript
interface CreateAppointmentRequest {
  patientCode: string;
  employeeCode: string;
  roomCode: string;
  serviceCodes: string[];
  appointmentStartTime: string; // ISO 8601
  participantCodes?: string[];
  notes?: string;
}

interface CreateAppointmentResponse {
  appointmentCode: string;
  status: "SCHEDULED";
  appointmentStartTime: string;
  appointmentEndTime: string;
  expectedDurationMinutes: number;
  patient: {
    patientCode: string;
    fullName: string;
  };
  doctor: {
    employeeCode: string;
    fullName: string;
  };
  room: {
    roomCode: string;
    roomName: string;
  };
  services: Array<{
    serviceCode: string;
    serviceName: string;
  }>;
  participants: Array<{
    employeeCode: string;
    fullName: string;
    role: "ASSISTANT" | "SECONDARY_DOCTOR" | "OBSERVER";
  }>;
}

// Example Usage
async function createAppointment(
  request: CreateAppointmentRequest
): Promise<CreateAppointmentResponse> {
  const response = await axios.post<CreateAppointmentResponse>(
    "/api/v1/appointments",
    request
  );
  return response.data;
}

// Usage with P3.1 result
const availableSlot = availableSlots[0]; // From P3.1
const roomCode = availableSlot.availableCompatibleRoomCodes[0];

const appointment = await createAppointment({
  patientCode: "BN-1001",
  employeeCode: "EMP002",
  roomCode: roomCode,
  serviceCodes: ["IMPLANT_FIXTURE"],
  appointmentStartTime: availableSlot.startTime,
  notes: "Booked via web portal",
});

console.log(`Created: ${appointment.appointmentCode}`);
```

---

## P3.3: Medical Staff Selection (GET /employees/medical-staff) 🆕

### Overview

**NEW in V2**: Dedicated endpoint to fetch only medical staff employees who can be assigned to appointments (doctors, nurses, assistants).

**Purpose**: Filter employees by **STANDARD specialization (ID 8)** to ensure only qualified medical personnel appear in appointment booking UI.

**Use Case**: Frontend dropdown/autocomplete for selecting:

- **Doctor** (main employee for appointment)
- **Participants** (assistants/nurses joining the appointment)

---

### Endpoint

```http
GET /api/v1/employees/medical-staff
Authorization: Bearer {access_token}
```

### Authorization

```
Required Permission: VIEW_EMPLOYEE
```

### Query Parameters

None - returns all active medical staff.

### Response (200 OK)

```json
[
  {
    "employeeId": 2,
    "employeeCode": "EMP002",
    "fullName": "Tâm Nguyễn Thị",
    "email": "tam.nguyen@dental.com",
    "phoneNumber": "0909123456",
    "roleId": 2,
    "roleName": "Doctor",
    "isActive": true,
    "specializations": [
      {
        "specializationId": 1,
        "specializationCode": "SPEC-ORTHO",
        "specializationName": "Chỉnh nha"
      },
      {
        "specializationId": 7,
        "specializationCode": "SPEC-COSMETIC",
        "specializationName": "Răng thẩm mỹ"
      },
      {
        "specializationId": 8,
        "specializationCode": "SPEC-STANDARD",
        "specializationName": "Y tế cơ bản"
      }
    ]
  },
  {
    "employeeId": 4,
    "employeeCode": "EMP004",
    "fullName": "Mai Lê Thị",
    "email": "mai.le@dental.com",
    "phoneNumber": "0912345678",
    "roleId": 3,
    "roleName": "Nurse",
    "isActive": true,
    "specializations": [
      {
        "specializationId": 8,
        "specializationCode": "SPEC-STANDARD",
        "specializationName": "Y tế cơ bản"
      }
    ]
  }
]
```

**Note**:

- Admin employees (EMP001) **will NOT appear** in this list because they don't have `specializationId: 8`
- Only employees with `isActive: true` AND `specializationId: 8` are returned

---

### Medical Staff Definition

**Medical Staff = Employee with STANDARD Specialization (ID 8)**

```
✅ ID 8 (SPEC-STANDARD) = Y tế cơ bản - REQUIRED for ALL medical staff
✅ ID 9 (SPEC-INTERN) = Thực tập sinh - Optional, can be combined with ID 8
✅ ID 1-7 = Specific specializations - Optional, can be combined with ID 8

❌ NO ID 8 = Admin/Receptionist - CANNOT be assigned to appointments
```

**Why ID 8 is Required?**

- **Baseline qualification** for all healthcare workers
- **Regulatory compliance** - all staff treating patients must have basic medical training
- **Data integrity** - prevents accidentally assigning admins/receptionists as doctors
- **Audit trail** - clear separation between medical and non-medical staff

---

### Validation Rules for Appointments

**Rule 1: Doctor Validation (P3.1 + P3.2)**

When checking available times or creating appointments, the `employeeCode` (doctor) **MUST** have `specializationId: 8`.

**Error if not**:

```json
{
  "statusCode": 400,
  "error": "EMPLOYEE_NOT_MEDICAL_STAFF",
  "message": "Employee must have STANDARD specialization (ID 8) to be assigned as doctor. Employee EMP001 does not have STANDARD specialization"
}
```

**Rule 2: Participant Validation (P3.1 + P3.2)**

When including `participantCodes` (assistants), **ALL participants** must have `specializationId: 8`.

**Error if any participant lacks ID 8**:

```json
{
  "statusCode": 400,
  "error": "PARTICIPANT_NOT_MEDICAL_STAFF",
  "message": "Participants must have STANDARD specialization (ID 8). The following employees do not have STANDARD: EMP001, EMP999"
}
```

---

### Frontend Integration Pattern

#### Step 1: Fetch Medical Staff on Page Load

**React Example**:

```typescript
import { useEffect, useState } from "react";

interface EmployeeInfoResponse {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  specializations: Array<{
    specializationId: number;
    specializationName: string;
  }>;
}

const AppointmentBookingForm = () => {
  const [medicalStaff, setMedicalStaff] = useState<EmployeeInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicalStaff = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/v1/employees/medical-staff",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch medical staff");

        const data = await response.json();
        setMedicalStaff(data);
      } catch (error) {
        console.error("Error fetching medical staff:", error);
        toast.error("Could not load medical staff");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalStaff();
  }, []);

  return (
    <div>
      <h2>Book Appointment</h2>

      {/* Doctor Selection */}
      <label>Select Doctor:</label>
      <select name="doctorCode">
        <option value="">-- Choose Doctor --</option>
        {medicalStaff
          .filter((emp) => emp.roleName === "Doctor")
          .map((emp) => (
            <option key={emp.employeeCode} value={emp.employeeCode}>
              {emp.fullName} ({emp.employeeCode})
            </option>
          ))}
      </select>

      {/* Participants Selection (Multi-select) */}
      <label>Select Assistants (Optional):</label>
      <select name="participants" multiple>
        {medicalStaff
          .filter(
            (emp) => emp.roleName === "Nurse" || emp.roleName === "Assistant"
          )
          .map((emp) => (
            <option key={emp.employeeCode} value={emp.employeeCode}>
              {emp.fullName} ({emp.employeeCode})
            </option>
          ))}
      </select>

      {/* ... rest of form ... */}
    </div>
  );
};
```

#### Step 2: Handle STANDARD Specialization Display (Optional)

**Display Badge for Medical Staff**:

```typescript
const EmployeeCard = ({ employee }: { employee: EmployeeInfoResponse }) => {
  const hasStandard = employee.specializations.some(
    (spec) => spec.specializationId === 8
  );

  return (
    <div className="employee-card">
      <h3>{employee.fullName}</h3>

      {/* Show STANDARD badge */}
      {hasStandard && (
        <span className="badge badge-success">✅ Medical Staff (ID 8)</span>
      )}

      {/* Show all specializations */}
      <div className="specializations">
        {employee.specializations.map((spec) => (
          <span key={spec.specializationId} className="badge badge-info">
            {spec.specializationName}
          </span>
        ))}
      </div>
    </div>
  );
};
```

#### Step 3: Error Handling for Non-Medical Staff

**Display Validation Error**:

```typescript
const createAppointment = async (formData) => {
  try {
    const response = await fetch("/api/v1/appointments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();

      // Handle specific medical staff validation errors
      if (error.error === "EMPLOYEE_NOT_MEDICAL_STAFF") {
        toast.error(
          "Selected doctor is not qualified medical staff. " +
            "Please select an employee with STANDARD specialization (ID 8)."
        );
        return;
      }

      if (error.error === "PARTICIPANT_NOT_MEDICAL_STAFF") {
        toast.error(
          "Some selected assistants are not qualified medical staff. " +
            error.message
        );
        return;
      }

      throw new Error(error.message);
    }

    const appointment = await response.json();
    toast.success(`Appointment created: ${appointment.appointmentCode}`);
  } catch (error) {
    toast.error("Failed to create appointment");
  }
};
```

---

### Test Scenarios

#### ✅ Success Case 1: Doctor with Multiple Specializations

**Request**:

```http
GET /api/v1/employees/medical-staff
Authorization: Bearer {token}
```

**Response**:

```json
[
  {
    "employeeId": 2,
    "employeeCode": "EMP002",
    "fullName": "Tâm Nguyễn Thị",
    "specializations": [
      { "specializationId": 1, "specializationName": "Chỉnh nha" },
      { "specializationId": 7, "specializationName": "Răng thẩm mỹ" },
      { "specializationId": 8, "specializationName": "Y tế cơ bản" }  ← HAS ID 8 ✅
    ]
  }
]
```

**Use in Appointment**:

```http
POST /api/v1/appointments
{
  "employeeCode": "EMP002",  ← Valid (has ID 8)
  "serviceCodes": ["SV-CAOVOI"]
}
→ 201 CREATED ✅
```

#### ✅ Success Case 2: Nurse with Only STANDARD

**Response**:

```json
[
  {
    "employeeId": 4,
    "employeeCode": "EMP004",
    "fullName": "Mai Lê Thị",
    "specializations": [
      { "specializationId": 8, "specializationName": "Y tế cơ bản" }  ← HAS ID 8 ✅
    ]
  }
]
```

**Use as Participant**:

```http
POST /api/v1/appointments
{
  "employeeCode": "EMP002",
  "participantCodes": ["EMP004"],  ← Valid (has ID 8)
  "serviceCodes": ["SV-IMPLANT"]
}
→ 201 CREATED ✅
```

#### ❌ Error Case 1: Admin Without Specialization

**Request**:

```http
GET /api/v1/employees/medical-staff
```

**Response**:

```json
[
  // EMP001 (Admin) NOT included ❌
  // ... only employees with ID 8 shown
]
```

**If Admin Used in Appointment**:

```http
POST /api/v1/appointments
{
  "employeeCode": "EMP001",  ← Admin (no ID 8) ❌
  "serviceCodes": ["SV-CAOVOI"]
}
→ 400 BAD REQUEST
{
  "error": "EMPLOYEE_NOT_MEDICAL_STAFF",
  "message": "Employee must have STANDARD specialization (ID 8) to be assigned as doctor. Employee EMP001 does not have STANDARD specialization"
}
```

#### ❌ Error Case 2: Participant Without STANDARD

**Request**:

```http
POST /api/v1/appointments
{
  "employeeCode": "EMP002",
  "participantCodes": ["EMP001", "EMP004"],  ← EMP001 has no ID 8 ❌
  "serviceCodes": ["SV-IMPLANT"]
}
→ 400 BAD REQUEST
{
  "error": "PARTICIPANT_NOT_MEDICAL_STAFF",
  "message": "Participants must have STANDARD specialization (ID 8). The following employees do not have STANDARD: EMP001"
}
```

---

### Comparison: GET /employees vs GET /employees/medical-staff

| Endpoint                              | Returns                                      | Use Case                                             |
| ------------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `GET /api/v1/employees`               | **ALL** active employees (including admins)  | Employee management, user directory, role assignment |
| `GET /api/v1/employees/medical-staff` | **ONLY** employees with ID 8 (medical staff) | Appointment booking, doctor/assistant selection      |

**Example**:

```
GET /api/v1/employees
→ Returns: EMP001 (Admin), EMP002 (Doctor), EMP004 (Nurse), ...

GET /api/v1/employees/medical-staff
→ Returns: EMP002 (Doctor), EMP004 (Nurse) ONLY
→ NOT returns: EMP001 (Admin) ❌
```

---

### Database Query Logic

**SQL Equivalent** (for understanding):

```sql
-- GET /api/v1/employees/medical-staff
SELECT DISTINCT e.*
FROM employees e
  INNER JOIN employee_specializations es ON e.employee_id = es.employee_id
WHERE e.is_active = TRUE
  AND es.specialization_id = 8  -- STANDARD specialization
ORDER BY e.employee_code ASC;
```

**Key Points**:

- `INNER JOIN` ensures only employees **with specializations** are included
- `es.specialization_id = 8` specifically filters for **STANDARD** (not any specialization)
- `is_active = TRUE` ensures inactive employees are excluded

---

### Migration Guide for Frontend

**Before (Old - Fetching ALL employees)**:

```typescript
// ❌ OLD - Gets all employees (including non-medical staff)
const response = await fetch("/api/v1/employees");
const allEmployees = await response.json();

// Frontend must manually filter for medical staff
const medicalStaff = allEmployees.filter(
  (emp) => emp.specializations && emp.specializations.length > 0
);
```

**After (New - Fetching medical staff only)** ✅:

```typescript
// ✅ NEW - Gets only medical staff (backend filtered by ID 8)
const response = await fetch("/api/v1/employees/medical-staff");
const medicalStaff = await response.json();

// No frontend filtering needed! All returned employees are valid for appointments
```

**Benefits**:

- **Performance**: Less data transfer (no admin employees in response)
- **Correctness**: Backend enforces ID 8 requirement, not frontend logic
- **Security**: Frontend cannot bypass medical staff validation
- **Simplicity**: No need for frontend filtering logic

---

### Postman Test Case

**Test: Fetch Medical Staff**

```http
GET http://localhost:8080/api/v1/employees/medical-staff
Authorization: Bearer {{access_token}}
```

**Expected Response** (200 OK):

```json
[
  {
    "employeeId": 2,
    "employeeCode": "EMP002",
    "fullName": "Tâm Nguyễn Thị",
    "specializations": [
      { "specializationId": 8, "specializationName": "Y tế cơ bản" }
    ]
  }
  // ... other medical staff with ID 8
]
```

**Assertions**:

1. ✅ Status code is 200
2. ✅ Response is array
3. ✅ **Every employee has** `specializations` array containing **ID 8**
4. ✅ **EMP001 (Admin) is NOT in the list**
5. ✅ All returned employees have `isActive: true`

**Postman Test Script**:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response is array", function () {
  pm.expect(pm.response.json()).to.be.an("array");
});

pm.test("All employees have STANDARD specialization (ID 8)", function () {
  const medicalStaff = pm.response.json();

  medicalStaff.forEach((employee) => {
    const hasStandard = employee.specializations.some(
      (spec) => spec.specializationId === 8
    );
    pm.expect(hasStandard).to.be.true;
  });
});

pm.test("Admin (EMP001) is NOT in medical staff list", function () {
  const medicalStaff = pm.response.json();
  const hasAdmin = medicalStaff.some((emp) => emp.employeeCode === "EMP001");
  pm.expect(hasAdmin).to.be.false;
});
```

---

### Key Takeaways

1. **Medical Staff = Has STANDARD (ID 8)**

   - NO ID 8 = NOT medical staff = CANNOT be assigned to appointments

2. **Use the Right Endpoint**

   - Use `GET /employees/medical-staff` for appointment booking UI
   - Use `GET /employees` for employee management UI

3. **Frontend Responsibility**

   - **Does NOT need** to check for ID 8 (backend filters automatically)
   - **Does NOT need** to handle non-medical staff in doctor dropdowns
   - **Should handle** `EMPLOYEE_NOT_MEDICAL_STAFF` error if somehow invalid employee selected

4. **Backend Enforces**
   - GET /employees/medical-staff returns only ID 8 employees
   - POST /appointments validates doctor has ID 8
   - POST /appointments validates all participants have ID 8

---

## Workflow: P3.1 → P3.2

**Step 1: Find Available Times** (P3.1)

```typescript
const slots = await findAvailableSlots("2025-11-15", "EMP002", [
  "IMPLANT_FIXTURE",
]);
// Returns: [{ startTime: '2025-11-15T09:00:00', availableCompatibleRoomCodes: ['P-IMPLANT-01'] }]
```

**Step 2: User Selects Slot**

```typescript
const selectedSlot = slots[2]; // User picked 3rd slot
const selectedRoom = selectedSlot.availableCompatibleRoomCodes[0]; // First room
```

**Step 3: Create Appointment** (P3.2)

```typescript
const appointment = await createAppointment({
  patientCode: patientCode,
  employeeCode: "EMP002",
  roomCode: selectedRoom,
  serviceCodes: ["IMPLANT_FIXTURE"],
  appointmentStartTime: selectedSlot.startTime,
});
// Returns: 201 Created with appointmentCode
```

---

## Contact & Support

For questions or issues, contact:

- **Backend Team**: backend@dentalclinic.com
- **API Documentation**: https://api.dentalclinic.com/docs
- **Slack Channel**: #api-support
