# Room & Service Management - Unit Tests

## Tổng quan

Test suite cho **RoomController** và **ServiceController** đã được tạo nhưng chưa chạy thành công do vấn đề `ApplicationContext`.

## Vấn đề hiện tại

❌ **ApplicationContext failure** - `@WebMvcTest` cố tải toàn bộ dependencies (JPA, Database, Security, etc.)

## Giải pháp đề xuất

### Option 1: Sử dụng @WebMvcTest với exclude filters (Recommended)

Thêm exclude filters để bỏ qua các auto-configurations không cần thiết:

```java
@WebMvcTest(controllers = RoomController.class,
    excludeAutoConfiguration = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        JwtConfig.class,
        SecurityConfig.class
    })
class RoomControllerTest {
    // Test code...
}
```

### Option 2: Sử dụng @SpringBootTest + @AutoConfigureMockMvc

Chuyển sang integration test với full application context:

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoomControllerIntegrationTest {
    // Test code...
}
```

### Option 3: Manual testing với Swagger/Postman

Vì project đã có Swagger UI, bạn có thể test trực tiếp:

## Manual Testing Guide

### 1. Compile project

```bash
cd /d/Code/PDCMS_BE
./mvnw clean compile -DskipTests
```

### 2. Restart application

Stop current terminal và chạy lại:

```bash
./mvnw spring-boot:run
```

### 3. Login to get JWT token

```bash
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

Copy `accessToken` từ response.

### 4. Test Room APIs

#### a. Get all rooms

```bash
GET http://localhost:8080/api/v1/rooms?page=0&size=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### b. Get all rooms with filters

```bash
GET http://localhost:8080/api/v1/rooms?isActive=true&roomType=STANDARD&keyword=phòng
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### c. Get active rooms (dropdown)

```bash
GET http://localhost:8080/api/v1/rooms/active
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### d. Get room by ID

```bash
GET http://localhost:8080/api/v1/rooms/P-01
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### e. Create room

```bash
POST http://localhost:8080/api/v1/rooms
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "roomCode": "P-05",
  "roomName": "Phòng VIP",
  "roomType": "VIP"
}
```

#### f. Update room

```bash
PUT http://localhost:8080/api/v1/rooms/P-05
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "roomName": "Phòng VIP - Đã sửa",
  "roomType": "VIP",
  "isActive": true
}
```

#### g. Soft delete room

```bash
DELETE http://localhost:8080/api/v1/rooms/P-05
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### h. Permanent delete room (Admin only)

```bash
DELETE http://localhost:8080/api/v1/rooms/P-05/permanent
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 5. Test Service APIs

#### a. Get all services

```bash
GET http://localhost:8080/api/v1/services?page=0&size=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### b. Get services with filters

```bash
GET http://localhost:8080/api/v1/services?isActive=true&specializationId=3&keyword=titan
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### c. Get service by ID

```bash
GET http://localhost:8080/api/v1/services/1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### d. Get service by code (FIXED - no more conflict)

```bash
GET http://localhost:8080/api/v1/services/code/CROWN_TITAN
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### e. Create service

```bash
POST http://localhost:8080/api/v1/services
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "serviceCode": "TEST_SERVICE",
  "serviceName": "Test Service",
  "description": "Test description",
  "defaultDurationMinutes": 30,
  "defaultBufferMinutes": 10,
  "price": 100000,
  "specializationId": 1,
  "isActive": true
}
```

#### f. Update service

```bash
PUT http://localhost:8080/api/v1/services/1
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "serviceName": "Cạo vôi răng - UPDATED",
  "price": 350000
}
```

#### g. Soft delete service

```bash
DELETE http://localhost:8080/api/v1/services/1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### h. Activate service (FIXED endpoint)

```bash
PATCH http://localhost:8080/api/v1/services/1/activate
Authorization: Bearer YOUR_ACCESS_TOKEN
```

⚠️ **LƯU Ý**: Endpoint đúng là `/activate` chứ KHÔNG phải `/active`!

## Lỗi đã sửa

### 1. ServiceController - Endpoint `/activate` conflict

**Vấn đề cũ:** Bạn gọi `/109/active` nhưng endpoint là `/109/activate`

**Đã sửa:**

- ✅ Đổi thứ tự endpoints - `PATCH /{serviceId}/activate` đứng TRƯỚC `DELETE /{serviceId}`
- ✅ Đổi response type từ `Void` sang `ServiceResponse` để FE nhận được dữ liệu updated

```java
@PatchMapping("/{serviceId}/activate")
public ResponseEntity<ServiceResponse> activateService(@PathVariable Integer serviceId) {
    serviceService.activateService(serviceId);
    return ResponseEntity.ok(serviceService.getServiceById(serviceId));
}
```

### 2. DTOs không có @Builder

**Vấn đề:** Unit tests dùng `.builder()` nhưng DTOs không có annotation

**Đã sửa:** Thêm `@Builder` vào tất cả DTOs:

- ✅ `RoomResponse`
- ✅ `CreateRoomRequest`
- ✅ `UpdateRoomRequest`
- ✅ `ServiceResponse`
- ✅ `CreateServiceRequest`
- ✅ `UpdateServiceRequest`

### 3. RoomResponse thiếu field `updatedAt`

**Đã sửa:** Thêm field `updatedAt` vào `RoomResponse`

## Kết quả đã đạt được

✅ **Rooms seed data** - 4 phòng (P-01, P-02, P-03 STANDARD + P-04 IMPLANT)
✅ **Services seed data** - 50+ dịch vụ nha khoa
✅ **ServiceController** - Fixed `/activate` endpoint + Return `ServiceResponse`
✅ **DTOs** - Thêm `@Builder` cho tất cả DTOs
✅ **Unit Tests** - Đã tạo RoomControllerTest + ServiceControllerTest (cần fix ApplicationContext)

## Các bước tiếp theo

1. **Compile project**: `./mvnw clean compile -DskipTests` ✅
2. **Restart application**: Load seed data mới
3. **Test manual**: Dùng Swagger UI hoặc Postman
4. **Fix unit tests**: Thêm exclude filters hoặc chuyển sang integration tests

## Swagger UI

Sau khi restart app, truy cập:

- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **API Docs**: http://localhost:8080/api-docs

Tìm sections:

- **Room Management** - 7 endpoints
- **Service Management** - 7 endpoints

---

**Created by:** GitHub Copilot
**Date:** October 29, 2025
