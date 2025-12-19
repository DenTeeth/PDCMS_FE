# Notification System API Reference for Frontend

## Overview

Complete WebSocket + REST API notification system with real-time push notifications for appointments.

---

## 📋 Table of Contents

1. [WebSocket Setup](#websocket-setup)
2. [REST API Endpoints](#rest-api-endpoints)
3. [Data Models](#data-models)
4. [Testing Guide](#testing-guide)
5. [Troubleshooting](#troubleshooting)

---

## 🔌 WebSocket Setup

### Connection URL

```
ws://localhost:8081/ws
```

### JavaScript Client (SockJS + STOMP)

```javascript
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// 1. Get JWT token from login response
const token = localStorage.getItem("jwt_token");

// 2. Create SockJS socket
const socket = new SockJS("http://localhost:8081/ws");

// 3. Create STOMP client
const stompClient = new Client({
  webSocketFactory: () => socket,
  connectHeaders: {
    Authorization: `Bearer ${token}`, // IMPORTANT: Include JWT in CONNECT frame
  },
  debug: (str) => {
    console.log("STOMP Debug:", str);
  },
  onConnect: (frame) => {
    console.log("✅ WebSocket Connected:", frame);

    // 4. Subscribe to user's notification topic
    const accountId = getUserAccountIdFromJWT(token); // Extract from JWT claims
    stompClient.subscribe(`/topic/notifications/${accountId}`, (message) => {
      const notification = JSON.parse(message.body);
      console.log("🔔 New Notification:", notification);

      // Update UI: show notification badge, dropdown, etc.
      handleNewNotification(notification);
    });
  },
  onStompError: (frame) => {
    console.error("❌ STOMP Error:", frame);
  },
});

// 5. Activate connection
stompClient.activate();

// 6. Helper function to extract account_id from JWT
function getUserAccountIdFromJWT(token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.account_id; // Integer
}

// 7. Cleanup on logout
function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
  }
}
```

### Subscription Topic Pattern

```
/topic/notifications/{account_id}
```

**Example**: User with `account_id=12` subscribes to `/topic/notifications/12`

### Message Format (Pushed via WebSocket)

```json
{
  "notificationId": 123,
  "userId": 12,
  "type": "APPOINTMENT_CREATED",
  "title": "Đặt lịch thành công",
  "message": "Cuộc hẹn APT-001 đã được đặt thành công vào 17/12/2024 10:00",
  "relatedEntityType": "APPOINTMENT",
  "relatedEntityId": "APT-001",
  "isRead": false,
  "createdAt": "2024-12-17T10:00:00"
}
```

---

## 🌐 REST API Endpoints

### Base URL

```
http://localhost:8081/api/v1/notifications
```

### Authentication

All endpoints require **Bearer Token** in Authorization header:

```
Authorization: Bearer {jwt_token}
```

---

### 1. Get User's Notifications (Paginated)

**GET** `/api/v1/notifications`

**Query Parameters**:

- `page` (optional, default=0): Page number (0-indexed)
- `size` (optional, default=20): Page size
- `sort` (optional, default="createdAt,desc"): Sort field and direction

**Request**:

```bash
GET /api/v1/notifications?page=0&size=20&sort=createdAt,desc
Authorization: Bearer {token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Lấy danh sách thông báo thành công",
  "data": {
    "content": [
      {
        "notificationId": 2,
        "userId": 12,
        "type": "APPOINTMENT_UPDATED",
        "title": "Lịch hẹn đã được cập nhật",
        "message": "Cuộc hẹn APT-001 đã được cập nhật thời gian sang 18/12/2024 14:00",
        "relatedEntityType": "APPOINTMENT",
        "relatedEntityId": "APT-001",
        "isRead": false,
        "createdAt": "2024-12-17T11:30:00"
      },
      {
        "notificationId": 1,
        "userId": 12,
        "type": "APPOINTMENT_CREATED",
        "title": "Đặt lịch thành công",
        "message": "Cuộc hẹn APT-001 đã được đặt thành công vào 17/12/2024 10:00",
        "relatedEntityType": "APPOINTMENT",
        "relatedEntityId": "APT-001",
        "isRead": true,
        "createdAt": "2024-12-17T10:00:00"
      }
    ],
    "totalElements": 2,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

---

### 2. Get Unread Notification Count

**GET** `/api/v1/notifications/unread-count`

**Request**:

```bash
GET /api/v1/notifications/unread-count
Authorization: Bearer {token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Lấy số thông báo chưa đọc thành công",
  "data": {
    "unreadCount": 5
  }
}
```

**Usage**: Display badge on notification icon (e.g., 🔔 **5**)

---

### 3. Mark Notification as Read

**PATCH** `/api/v1/notifications/{id}/read`

**Request**:

```bash
PATCH /api/v1/notifications/1/read
Authorization: Bearer {token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Đánh dấu đã đọc thành công",
  "data": {
    "notificationId": 1,
    "userId": 12,
    "type": "APPOINTMENT_CREATED",
    "title": "Đặt lịch thành công",
    "message": "Cuộc hẹn APT-001 đã được đặt thành công vào 17/12/2024 10:00",
    "relatedEntityType": "APPOINTMENT",
    "relatedEntityId": "APT-001",
    "isRead": true,
    "createdAt": "2024-12-17T10:00:00"
  }
}
```

---

### 4. Mark All Notifications as Read

**PATCH** `/api/v1/notifications/read-all`

**Request**:

```bash
PATCH /api/v1/notifications/read-all
Authorization: Bearer {token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Đánh dấu tất cả đã đọc thành công",
  "data": null
}
```

---

### 5. Delete Notification

**DELETE** `/api/v1/notifications/{id}`

**Request**:

```bash
DELETE /api/v1/notifications/1
Authorization: Bearer {token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Xóa thông báo thành công",
  "data": null
}
```

---

### 6. Create Notification (Manual/Test)

**POST** `/api/v1/notifications`

**Request Body**:

```json
{
  "userId": 12,
  "type": "SYSTEM_ANNOUNCEMENT",
  "title": "Thông báo bảo trì hệ thống",
  "message": "Hệ thống sẽ bảo trì từ 22:00 đến 23:00 ngày 20/12/2024",
  "relatedEntityType": "SYSTEM",
  "relatedEntityId": null
}
```

**Response (201 CREATED)**:

```json
{
  "success": true,
  "message": "Tạo thông báo thành công",
  "data": {
    "notificationId": 10,
    "userId": 12,
    "type": "SYSTEM_ANNOUNCEMENT",
    "title": "Thông báo bảo trì hệ thống",
    "message": "Hệ thống sẽ bảo trì từ 22:00 đến 23:00 ngày 20/12/2024",
    "relatedEntityType": "SYSTEM",
    "relatedEntityId": null,
    "isRead": false,
    "createdAt": "2024-12-17T15:00:00"
  }
}
```

**Note**: This endpoint is primarily for testing. Real notifications are created automatically by appointment workflows.

---

### 7. Test WebSocket Notification (Development Only)

**POST** `/api/v1/notifications/test-send`

**Description**: Creates a test notification for the current user and pushes via WebSocket.

**Request**:

```bash
POST /api/v1/notifications/test-send
Authorization: Bearer {token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "notificationId": 99,
    "userId": 12,
    "type": "APPOINTMENT_CREATED",
    "title": "🧪 Test Notification",
    "message": "This is a test notification sent at 2024-12-17T15:30:00",
    "relatedEntityType": "SYSTEM",
    "relatedEntityId": "TEST-001",
    "isRead": false,
    "createdAt": "2024-12-17T15:30:00"
  }
}
```

**WebSocket Push**: If WebSocket is connected, user will receive the same notification via `/topic/notifications/{account_id}`.

---

## 📦 Data Models

### NotificationType Enum

```java
APPOINTMENT_CREATED       // Lịch hẹn được tạo
APPOINTMENT_UPDATED       // Lịch hẹn được cập nhật
APPOINTMENT_CANCELLED     // Lịch hẹn bị hủy
APPOINTMENT_DELAYED       // Lịch hẹn bị hoãn
APPOINTMENT_COMPLETED     // Lịch hẹn hoàn thành
TREATMENT_PLAN_CREATED    // Phác đồ điều trị được tạo
TREATMENT_PLAN_UPDATED    // Phác đồ điều trị được cập nhật
PAYMENT_RECEIVED          // Thanh toán đã nhận
SYSTEM_ANNOUNCEMENT       // Thông báo hệ thống
```

### NotificationEntityType Enum

```java
APPOINTMENT     // Liên quan đến lịch hẹn
TREATMENT_PLAN  // Liên quan đến phác đồ điều trị
PAYMENT         // Liên quan đến thanh toán
SYSTEM          // Thông báo hệ thống
```

### Notification DTO

```typescript
interface NotificationDTO {
  notificationId: number;
  userId: number; // account_id of recipient
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: NotificationEntityType;
  relatedEntityId: string | null; // e.g., "APT-001", "TP-001"
  isRead: boolean;
  createdAt: string; // ISO 8601 datetime
}
```

---

## 🧪 Testing Guide

### Step 1: Test WebSocket Connection

1. Login as patient (benhnhan1/123456, account_id=12)
2. Extract JWT token from login response
3. Connect to WebSocket: `ws://localhost:8081/ws`
4. Include `Authorization: Bearer {token}` in CONNECT frame
5. Subscribe to `/topic/notifications/12`
6. **Expected**: Connection successful, no errors

### Step 2: Test WebSocket Push

1. Call **POST /test-send** endpoint with patient's token
2. **Expected WebSocket Message**:
   ```json
   {
     "notificationId": 99,
     "type": "APPOINTMENT_CREATED",
     "title": "🧪 Test Notification",
     "message": "This is a test notification...",
     ...
   }
   ```
3. **Expected UI**: Notification badge updates, dropdown shows new notification

### Step 3: Test REST API CRUD

```bash
# 1. Get notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/v1/notifications?page=0&size=20

# 2. Get unread count
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/v1/notifications/unread-count

# 3. Mark notification as read
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/v1/notifications/1/read

# 4. Mark all as read
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/v1/notifications/read-all

# 5. Delete notification
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/v1/notifications/1
```

### Step 4: Test Real Appointment Creation

1. Login as receptionist (letan1/123456)
2. Create appointment for patient (benhnhan1)
3. Assign dentist (dentist1) and assistant (assistant1)
4. **Expected Notifications**:
   - Patient receives: "Đặt lịch thành công - Cuộc hẹn APT-XXX..."
   - Dentist receives: "Bạn đã được phân công làm Bác sĩ - Cuộc hẹn APT-XXX..."
   - Assistant receives: "Bạn đã được phân công làm Trợ lý - Cuộc hẹn APT-XXX..."
5. **Check WebSocket**: All 3 parties should receive push notifications
6. **Check Database**:
   ```sql
   SELECT * FROM notifications
   WHERE related_entity_id = 'APT-XXX'
   ORDER BY created_at;
   ```
   **Expected**: 3 rows (patient, dentist, assistant)

---

## 🐛 Troubleshooting

### Issue 1: WebSocket Connection Fails (403 Forbidden)

**Symptom**: `/ws/info` returns 403
**Cause**: Security config blocks SockJS handshake
**Solution**: Ensure `SecurityConfig` permits `/ws/**`:

```java
.requestMatchers("/ws/**", "/ws/info/**").permitAll()
```

### Issue 2: WebSocket Connects but STOMP CONNECT Fails

**Symptom**: SockJS handshake OK, but STOMP frame rejected
**Cause**: Missing or invalid JWT in `Authorization` header
**Solution**:

1. Include JWT in `connectHeaders`: `Authorization: Bearer {token}`
2. Verify JWT is valid and not expired
3. Check `WebSocketAuthInterceptor` logs for authentication errors

### Issue 3: No WebSocket Messages Received

**Symptom**: Connection OK, subscription OK, but no messages
**Cause**: Subscribed to wrong topic or notifications not created
**Solution**:

1. Verify subscription topic matches user's `account_id`: `/topic/notifications/{account_id}`
2. Check database: `SELECT * FROM notifications WHERE user_id = {account_id}`
3. Review BE logs: "WebSocket notification sent to user: {userId}"

### Issue 4: Notification Created but No WebSocket Push

**Symptom**: Database has notification, but WebSocket silent
**Cause**: `SimpMessagingTemplate.convertAndSend()` failed silently
**Solution**:

1. Check logs for "WebSocket notification sent to user: X"
2. Verify user is subscribed to `/topic/notifications/X`
3. Ensure WebSocket connection is active (not disconnected)

### Issue 5: 404 Not Found on REST APIs

**Symptom**: `/api/v1/notifications` returns 404
**Cause**: Wrong base URL or controller not registered
**Solution**:

1. Verify URL: `http://localhost:8081/api/v1/notifications` (NOT `/api/notifications`)
2. Check `NotificationController` has `@RequestMapping("/api/v1/notifications")`
3. Review BE logs for controller registration

### Issue 6: 401 Unauthorized on Protected Endpoints

**Symptom**: All notification endpoints return 401
**Cause**: Missing or invalid JWT token
**Solution**:

1. Include `Authorization: Bearer {token}` header in ALL requests
2. Verify token is valid: decode JWT payload and check `exp` claim
3. Re-login if token expired

---

## 📊 Expected Database Schema

### Table: `notifications`

```sql
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- FK to accounts.account_id
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type notification_entity_type,
    related_entity_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 🎯 Frontend Integration Checklist

### Setup Phase

- [ ] Install dependencies: `sockjs-client`, `@stomp/stompjs`
- [ ] Create WebSocket service/context
- [ ] Extract `account_id` from JWT token
- [ ] Connect WebSocket on user login
- [ ] Subscribe to `/topic/notifications/{account_id}`
- [ ] Disconnect WebSocket on logout

### UI Components

- [ ] Notification bell icon with badge (unread count)
- [ ] Notification dropdown with list of recent notifications
- [ ] "Mark as read" button for each notification
- [ ] "Mark all as read" button
- [ ] "Delete" button for each notification
- [ ] Click notification → navigate to related entity (e.g., appointment detail)

### Real-time Updates

- [ ] WebSocket message received → add to notification list
- [ ] WebSocket message received → increment badge count
- [ ] WebSocket message received → show toast/snackbar (optional)
- [ ] Mark as read → decrement badge count
- [ ] Delete → remove from list and decrement count

### Error Handling

- [ ] Handle WebSocket disconnect → show warning banner
- [ ] Handle WebSocket reconnect → re-subscribe to topic
- [ ] Handle REST API errors → show error message
- [ ] Handle JWT expiration → redirect to login

---

## 🚀 Deployment Notes

### Environment Variables

```env
# Backend
WEBSOCKET_ALLOWED_ORIGINS=http://localhost:3000,https://your-fe-domain.com
JWT_SECRET=your-secret-key
```

### Production Considerations

1. **HTTPS/WSS**: Use `wss://` for secure WebSocket in production
2. **CORS**: Configure allowed origins in `CorsConfig`
3. **Load Balancing**: Ensure sticky sessions for WebSocket connections
4. **Monitoring**: Log WebSocket connections/disconnections for debugging

---

## 📞 Support

**Issues**: Report to backend team if:

- WebSocket connection fails
- Notifications not created in database
- WebSocket messages not received
- REST API returns unexpected errors

**Documentation**: [NOTIFICATION_SYSTEM_FIXES_2024-12-17.md](./NOTIFICATION_SYSTEM_FIXES_2024-12-17.md)

---

## ✅ Status

- **WebSocket Pipeline**: ✅ WORKING (tested with test-send endpoint)
- **REST APIs**: ✅ WORKING (all CRUD operations verified)
- **Real Appointment Notifications**: ✅ FIXED (compilation errors resolved)
- **Multi-Party Notifications**: ✅ IMPLEMENTED (patient + all participants)
- **Ready for FE Integration**: ✅ YES

---

**Last Updated**: December 17, 2024
**Version**: 1.0
**Contact**: Backend Team
