## Issue: WebSocket đã CONNECT/SUBSCRIBE thành công nhưng không có thông báo nào được tạo/gửi về FE

### Bối cảnh

- Sau khi fix phần Security + `WebSocketAuthInterceptor`, Frontend đã:
  - Kết nối WebSocket thành công tới `/ws` (SockJS).
  - STOMP `CONNECT` với header `Authorization: Bearer <JWT>` thành công.
  - Nhận frame `CONNECTED` với `user-name = <account_id>` và SUBSCRIBE:

```text
[STOMP] <<< CONNECTED
user-name:12
...
[STOMP] >>> SUBSCRIBE
destination:/topic/notifications/12
[WS] Subscribed to /topic/notifications/12
```

- REST API `/api/v1/notifications` và `/api/v1/notifications/unread-count` cũng trả về **200 OK**, nhưng `content` rỗng và `unreadCount = 0`.
- UI hiển thị "Không có thông báo" mặc dù đã thao tác các hành động dự kiến phải sinh ra notification.

### Các trường hợp đã test

1. **Patient account** (ví dụ account_id = 12)
   - Đăng nhập FE bằng tài khoản bệnh nhân (token chứa `account_id = 12`).
   - WebSocket log: `Subscribed to /topic/notifications/12`.
   - Thực hiện các thao tác:
     - Đặt lịch hẹn mới cho chính bệnh nhân đó (theo flow BE).
   - Kết quả:
     - Không thấy notification mới qua WebSocket.
     - `GET /api/v1/notifications` vẫn trả về `Page 1 of 0` cho userId 12.

2. **Admin account**
   - Đăng nhập FE bằng admin (`ROLE_ADMIN`, `MANAGE_NOTIFICATION`).
   - WebSocket log: `Subscribed to /topic/notifications/<admin_account_id>`.
   - Tạo lịch hẹn / thao tác quản trị khác.
   - Kết quả:
     - Không có notification nào được tạo cho admin (REST trả về trống, WebSocket không push).

3. **Employee account** (bác sĩ / nhân viên)
   - Đăng nhập FE bằng tài khoản nhân viên.
   - WebSocket SUBSCRIBE tới `/topic/notifications/{employee_account_id}` thành công.
   - Thao tác scheduling / liên quan đến công việc.
   - Kết quả tương tự: không có bản ghi notification trong REST, không có push WS.

### Quan sát từ code BE (theo repo docs)

- `AppointmentCreationService.createAppointmentInternal()` có gọi:

```java
Integer userId = patient.getAccount().getAccountId();
CreateNotificationRequest notificationRequest = CreateNotificationRequest.builder()
    .userId(userId)
    .type(NotificationType.APPOINTMENT_CREATED)
    .title("Đặt lịch thành công")
    .message(String.format("Cuộc hẹn %s đã được đặt thành công vào %s", appointmentCode, formattedTime))
    .relatedEntityType(NotificationEntityType.APPOINTMENT)
    .relatedEntityId(appointmentCode)
    .build();

notificationService.createNotification(notificationRequest);
```

- `NotificationServiceImpl.createNotification(...)`:
  - Lưu `Notification` vào DB với `userId = request.getUserId()`.
  - Gửi WS tới `/topic/notifications/{userId}` bằng `SimpMessagingTemplate.convertAndSend(...)`.

### Nghi ngờ hiện tại

1. **Notification không được tạo trong DB**
   - Mặc dù log có dòng `Getting notifications for user: 12`, nhưng response luôn là `Page 1 of 0`.
   - Có thể:
     - Branch gọi `createNotification(...)` không chạy (ví dụ điều kiện if, catch nuốt lỗi).
     - Transaction rollback do lỗi bên trong nhưng bị catch và ghi log "Failed to send notification..." mà không rethrow.

2. **Sai mapping userId / account_id**
   - WebSocket đang SUBSCRIBE `/topic/notifications/{account_id}` (theo JWT claim `account_id`).
   - Cần đảm bảo `Notification.userId` cũng lưu đúng `account_id` tương ứng.
   - Nếu `Notification.userId` đang lưu `user_id` khác (ví dụ `patient_id`), thì:
     - REST filter `where n.user_id = :userId` sẽ trả rỗng.
     - WS gửi tới `/topic/notifications/{Notification.userId}` cũng không khớp kênh FE đang subscribe.

3. **Roles khác ngoài Patient (Admin/Employee) chưa có luồng tạo Notification**
   - Trong code hiện tại mới thấy luồng cho **Patient** khi tạo appointment.
   - Chưa thấy luồng tạo notification cho Admin / Employee (ví dụ khi có yêu cầu mới, phê duyệt, v.v.).

### Yêu cầu cho BE

1. **Xác nhận luồng tạo Notification đang chạy thực tế**
   - Log chi tiết trong `NotificationServiceImpl.createNotification`:
     - Input `userId`, `type`, `title`, `message`.
     - Kết quả `savedNotification.getNotificationId()`.
   - Kiểm tra DB sau khi đặt lịch hẹn xem có bản ghi mới trong bảng `notifications` với `user_id = account_id` tương ứng hay không.

2. **Đảm bảo `Notification.userId` dùng đúng `account_id` từ JWT / Account**
   - Đồng bộ giữa:
     - `NotificationController` (REST) → filter theo `userId` lấy từ JWT `account_id`.
     - `NotificationServiceImpl` → dùng cùng loại ID khi lưu `Notification.userId` và khi gửi WS tới `/topic/notifications/{userId}`.

3. **Bổ sung / xác nhận event cho tất cả tài khoản liên quan (Patient / Dentist / Staff / Admin)**
   - Làm rõ và triển khai đầy đủ các luồng sinh notification theo yêu cầu nghiệp vụ:
     - Khi **tạo lịch hẹn**:
       - Gửi notification `"Đặt lịch thành công"` cho **patient** (account_id của bệnh nhân).
       - Gửi notification phù hợp cho **bác sĩ chính** của lịch hẹn (employeeCode chính trong `AppointmentCreateRequest`).
       - Nếu có **người tham gia (participants)**, gửi notification cho các account tương ứng.
       - Nếu cần, gửi notification cho **Admin / lễ tân** khi có lịch mới được tạo.
     - Khi **cập nhật / đổi lịch / hủy lịch / hoàn tất**:
       - Gửi notification với `type = APPOINTMENT_UPDATED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_COMPLETED`… cho **tất cả tài khoản liên quan** (patient + bác sĩ + các participant + admin nếu có yêu cầu).
   - Các service như `AppointmentCreationService`, `RegistrationRequestService`, `ShiftRegistrationService`, v.v. nên gọi `notificationService.createNotification(...)` cho **từng account liên quan**, sử dụng `account_id` đúng như trong JWT để đảm bảo FE nhận được ở kênh `/topic/notifications/{account_id}`.

4. **Ghi chú về endpoint test-send (đã HOẠT ĐỘNG)**
   - BE đã thêm endpoint `POST /api/v1/notifications/test-send` và hiện tại:
     - FE gọi thành công, BE tạo bản ghi `SYSTEM_ANNOUNCEMENT` cho chính `account_id` đang login.
     - WebSocket push về kênh `/topic/notifications/{account_id}` và FE hiển thị được thông báo.
   - → Kết luận: pipeline JWT → REST → DB → WebSocket đang hoạt động đúng với endpoint test.
   - Vấn đề còn lại của issue này chỉ nằm ở **các luồng business thật** (tạo lịch hẹn, thao tác admin/employee) chưa tạo/gửi notification như mong đợi.

### Kỳ vọng sau khi BE xử lý

- Khi đăng nhập bằng **patient**, đặt lịch hẹn mới → thấy notification "Đặt lịch thành công" trong dropdown + badge tăng + WS log nhận được message.
- Khi đăng nhập bằng **admin / employee**, các luồng nghiệp vụ được định nghĩa cũng sinh notification tương ứng và hiển thị trên FE thông qua:
  - `GET /api/v1/notifications`
  - WebSocket `/topic/notifications/{account_id}`.


