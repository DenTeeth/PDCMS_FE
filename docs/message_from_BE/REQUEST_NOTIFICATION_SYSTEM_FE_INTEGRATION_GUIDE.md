# Employee Request Notification System - FE Integration Guide

**Feature**: Real-time notifications for employee requests (Time-off, Overtime, Part-time Registration)
**Branch**: feat/BE-904-push-notification
**Date**: December 22, 2025
**Status**: Production Ready

---

## Overview

System automatically sends real-time notifications to ALL ADMIN users when employees submit:

1. Time-off requests (nghi phep)
2. Overtime requests (tang ca)
3. Part-time flex registration requests

**Design Philosophy**: Simple, direct notification to managers without over-engineering. Suitable for small-medium dental clinics.

---

## 1. New Notification Types

### Backend Enum Updates

**File**: `NotificationType.java`

```java
public enum NotificationType {
    // Existing types
    APPOINTMENT_CREATED,
    APPOINTMENT_UPDATED,
    APPOINTMENT_CANCELLED,
    APPOINTMENT_REMINDER,
    APPOINTMENT_COMPLETED,
    TREATMENT_PLAN_APPROVED,
    TREATMENT_PLAN_UPDATED,
    PAYMENT_RECEIVED,
    SYSTEM_ANNOUNCEMENT,

    // NEW: Employee Request Types
    REQUEST_TIME_OFF_PENDING,      // Yeu cau nghi phep
    REQUEST_OVERTIME_PENDING,       // Yeu cau tang ca
    REQUEST_PART_TIME_PENDING       // Yeu cau dang ky part-time
}
```

**File**: `NotificationEntityType.java`

```java
public enum NotificationEntityType {
    APPOINTMENT,
    TREATMENT_PLAN,
    PAYMENT,
    SYSTEM,

    // NEW: Request Entity Types
    TIME_OFF_REQUEST,
    OVERTIME_REQUEST,
    PART_TIME_REGISTRATION
}
```

---

## 2. Notification Payload Structure

### Example Notification Objects

#### 2.1 Time-off Request Notification

```json
{
  "notificationId": 123,
  "userId": 1,
  "type": "REQUEST_TIME_OFF_PENDING",
  "title": "Yeu cau nghi phep tu Nguyen Van A",
  "message": "Nguyen Van A da gui yeu cau nghi phep tu 2025-12-25 den 2025-12-27",
  "relatedEntityType": "TIME_OFF_REQUEST",
  "relatedEntityId": "TOR251222001",
  "isRead": false,
  "createdAt": "2025-12-22T08:30:00",
  "readAt": null
}
```

#### 2.2 Overtime Request Notification

```json
{
  "notificationId": 124,
  "userId": 1,
  "type": "REQUEST_OVERTIME_PENDING",
  "title": "Yeu cau tang ca tu Tran Thi B",
  "message": "Tran Thi B da gui yeu cau tang ca ngay 2025-12-24 ca Sang",
  "relatedEntityType": "OVERTIME_REQUEST",
  "relatedEntityId": "OTR251222001",
  "isRead": false,
  "createdAt": "2025-12-22T09:15:00",
  "readAt": null
}
```

#### 2.3 Part-time Registration Notification

```json
{
  "notificationId": 125,
  "userId": 1,
  "type": "REQUEST_PART_TIME_PENDING",
  "title": "Yeu cau dang ky part-time tu Le Van C",
  "message": "Le Van C da gui yeu cau dang ky part-time tu 2025-12-23 den 2025-12-30",
  "relatedEntityType": "PART_TIME_REGISTRATION",
  "relatedEntityId": "42",
  "isRead": false,
  "createdAt": "2025-12-22T10:00:00",
  "readAt": null
}
```

---

## 3. WebSocket Integration

### 3.1 Subscribe to Notifications

**Endpoint**: `/topic/notifications/{userId}`

```javascript
// Example: React WebSocket Hook
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const useNotificationWebSocket = (userId) => {
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
      stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
        const notification = JSON.parse(message.body);

        // Handle different notification types
        switch (notification.type) {
          case "REQUEST_TIME_OFF_PENDING":
            handleTimeOffNotification(notification);
            break;
          case "REQUEST_OVERTIME_PENDING":
            handleOvertimeNotification(notification);
            break;
          case "REQUEST_PART_TIME_PENDING":
            handlePartTimeNotification(notification);
            break;
          default:
            handleGenericNotification(notification);
        }
      });
    });

    return () => {
      if (stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, [userId]);
};
```

### 3.2 Notification Handlers

```javascript
const handleTimeOffNotification = (notification) => {
  // Show toast notification
  toast.info(notification.title, {
    description: notification.message,
    action: {
      label: "View Request",
      onClick: () => navigateToTimeOffRequest(notification.relatedEntityId),
    },
  });

  // Update notification badge count
  updateBadgeCount();

  // Play notification sound (optional)
  playNotificationSound();
};

const handleOvertimeNotification = (notification) => {
  toast.info(notification.title, {
    description: notification.message,
    action: {
      label: "View Request",
      onClick: () => navigateToOvertimeRequest(notification.relatedEntityId),
    },
  });
  updateBadgeCount();
};

const handlePartTimeNotification = (notification) => {
  toast.info(notification.title, {
    description: notification.message,
    action: {
      label: "View Registration",
      onClick: () =>
        navigateToPartTimeRegistration(notification.relatedEntityId),
    },
  });
  updateBadgeCount();
};
```

---

## 4. REST API Endpoints

### 4.1 Get User Notifications (Paginated)

**Endpoint**: `GET /api/v1/notifications`

**Query Parameters**:

- `page` (default: 0)
- `size` (default: 20)
- `sort` (default: createdAt,desc)

**Response**:

```json
{
  "content": [
    {
      "notificationId": 123,
      "userId": 1,
      "type": "REQUEST_TIME_OFF_PENDING",
      "title": "Yeu cau nghi phep tu Nguyen Van A",
      "message": "Nguyen Van A da gui yeu cau nghi phep tu 2025-12-25 den 2025-12-27",
      "relatedEntityType": "TIME_OFF_REQUEST",
      "relatedEntityId": "TOR251222001",
      "isRead": false,
      "createdAt": "2025-12-22T08:30:00",
      "readAt": null
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 45,
  "totalPages": 3
}
```

### 4.2 Get Unread Count

**Endpoint**: `GET /api/v1/notifications/unread-count`

**Response**:

```json
{
  "unreadCount": 12
}
```

### 4.3 Mark Notification as Read

**Endpoint**: `PATCH /api/v1/notifications/{notificationId}/read`

**Response**: `204 No Content`

### 4.4 Mark All as Read

**Endpoint**: `PATCH /api/v1/notifications/mark-all-read`

**Response**: `204 No Content`

### 4.5 Delete Notification

**Endpoint**: `DELETE /api/v1/notifications/{notificationId}`

**Response**: `204 No Content`

---

## 5. Frontend UI Recommendations

### 5.1 Notification Bell Icon

```jsx
const NotificationBell = () => {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-500 text-white
                       text-xs rounded-full h-5 w-5 flex items-center
                       justify-center"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
};
```

### 5.2 Notification Dropdown/Panel

```jsx
const NotificationPanel = ({ notifications, onMarkAsRead, onViewDetails }) => {
  // Group notifications by type
  const groupedNotifications = {
    timeOff: notifications.filter((n) => n.type === "REQUEST_TIME_OFF_PENDING"),
    overtime: notifications.filter(
      (n) => n.type === "REQUEST_OVERTIME_PENDING"
    ),
    partTime: notifications.filter(
      (n) => n.type === "REQUEST_PART_TIME_PENDING"
    ),
    others: notifications.filter((n) => !n.type.startsWith("REQUEST_")),
  };

  return (
    <div className="notification-panel">
      <Tabs>
        <TabList>
          <Tab>Nghi phep ({groupedNotifications.timeOff.length})</Tab>
          <Tab>Tang ca ({groupedNotifications.overtime.length})</Tab>
          <Tab>Part-time ({groupedNotifications.partTime.length})</Tab>
          <Tab>Khac ({groupedNotifications.others.length})</Tab>
        </TabList>

        <TabPanel>
          <NotificationList
            notifications={groupedNotifications.timeOff}
            onItemClick={(notif) => {
              onMarkAsRead(notif.notificationId);
              router.push(`/time-off-requests/${notif.relatedEntityId}`);
            }}
          />
        </TabPanel>

        {/* Similar panels for other tabs */}
      </Tabs>
    </div>
  );
};
```

### 5.3 Navigation Logic

```javascript
const navigateToTimeOffRequest = (requestId) => {
  // Navigate to time-off request details page
  router.push(`/admin/time-off-requests/${requestId}`);
};

const navigateToOvertimeRequest = (requestId) => {
  // Navigate to overtime request details page
  router.push(`/admin/overtime-requests/${requestId}`);
};

const navigateToPartTimeRegistration = (registrationId) => {
  // Navigate to part-time registration approval page
  router.push(`/admin/part-time-registrations/${registrationId}`);
};
```

---

## 6. Testing Guide

### 6.1 Test User Accounts (from seed data)

**Admin Account** (receives all notifications):

- Username: `admin`
- Password: `123456`
- Employee ID: `1`

**Test Doctor** (submits requests):

- Username: `doctor`
- Password: `123456`
- Employee ID: `2`

### 6.2 Test Scenarios

#### Scenario 1: Time-off Request Notification

1. Login as `doctor` (employeeId: 2)
2. Create time-off request:
   ```bash
   POST /api/v1/time-off-requests
   {
     "employeeId": 2,
     "timeOffTypeId": "TOT001",
     "startDate": "2025-12-25",
     "endDate": "2025-12-27",
     "reason": "Test notification"
   }
   ```
3. Login as `admin` (employeeId: 1)
4. Verify notification received via:
   - WebSocket subscription
   - GET /api/v1/notifications API
   - Check unread count increased

#### Scenario 2: Overtime Request Notification

1. Login as `doctor`
2. Create overtime request:
   ```bash
   POST /api/v1/overtime-requests
   {
     "employeeId": 2,
     "workDate": "2025-12-24",
     "workShiftId": "WS001",
     "reason": "Test OT notification"
   }
   ```
3. Verify admin receives notification

#### Scenario 3: Part-time Registration Notification

1. Login as part-time employee
2. Submit part-time registration:
   ```bash
   POST /api/v1/shift-registrations/claim
   {
     "partTimeSlotId": 1,
     "effectiveFrom": "2025-12-23",
     "effectiveTo": "2025-12-30"
   }
   ```
3. Verify admin receives notification

---

## 7. Business Rules

### 7.1 Notification Recipients

- **Target Users**: ALL accounts with role "ADMIN"
- **Logic**: System queries all ADMIN accounts and sends notification to each admin's employeeId
- **Rationale**: Small-medium clinic - all managers need to be aware of pending requests

### 7.2 Notification Timing

- **Trigger**: Immediately when request/registration is created (status = PENDING)
- **Delivery**: Real-time via WebSocket + Persistent storage in database
- **No Batching**: Each request creates individual notification (not daily summary)

### 7.3 Notification Lifecycle

- **Created**: When employee submits request
- **Read**: When admin clicks notification or views request page
- **Not Deleted**: When request is approved/rejected (notification remains for audit trail)
- **Manual Delete**: Admin can manually delete notification from their panel

---

## 8. Error Handling

### 8.1 Notification Service Failures

Backend is designed to be **fault-tolerant**:

- If notification service fails, request creation still succeeds
- Errors are logged but don't block the main transaction
- Admin can still see pending requests via request list pages

```java
// Backend error handling example
try {
    notificationService.createTimeOffRequestNotification(...);
    log.info("Notification sent to all ADMIN users");
} catch (Exception e) {
    log.error("Failed to send notification: {}", e.getMessage());
    // Don't throw - request creation should not fail
}
```

### 8.2 Frontend Error Handling

```javascript
// Handle WebSocket disconnection
stompClient.onDisconnect = () => {
  console.warn("WebSocket disconnected");
  // Show reconnection indicator
  showReconnectionBanner();

  // Attempt reconnection
  setTimeout(() => reconnectWebSocket(), 5000);
};

// Fallback: Poll for new notifications every 30 seconds
useEffect(() => {
  const pollInterval = setInterval(async () => {
    if (!isWebSocketConnected) {
      await fetchNotifications();
    }
  }, 30000);

  return () => clearInterval(pollInterval);
}, [isWebSocketConnected]);
```

---

## 9. Database Schema Changes

### 9.1 Enum Types (enums.sql)

```sql
-- Updated notification_type enum
CREATE TYPE notification_type AS ENUM (
    'APPOINTMENT_CREATED',
    'APPOINTMENT_UPDATED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_REMINDER',
    'APPOINTMENT_COMPLETED',
    'TREATMENT_PLAN_APPROVED',
    'TREATMENT_PLAN_UPDATED',
    'PAYMENT_RECEIVED',
    'SYSTEM_ANNOUNCEMENT',
    'REQUEST_TIME_OFF_PENDING',      -- NEW
    'REQUEST_OVERTIME_PENDING',       -- NEW
    'REQUEST_PART_TIME_PENDING'       -- NEW
);

-- Updated notification_entity_type enum
CREATE TYPE notification_entity_type AS ENUM (
    'APPOINTMENT',
    'TREATMENT_PLAN',
    'PAYMENT',
    'SYSTEM',
    'TIME_OFF_REQUEST',              -- NEW
    'OVERTIME_REQUEST',               -- NEW
    'PART_TIME_REGISTRATION'          -- NEW
);
```

### 9.2 Notifications Table (unchanged)

Existing `notifications` table structure remains the same:

```sql
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type notification_entity_type,
    related_entity_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employees(employee_id)
);
```

---

## 10. Performance Considerations

### 10.1 Notification Volume

**Small-Medium Clinic Assumptions**:

- 10-30 employees
- 5-15 requests per day on average
- 2-3 admin users

**Expected Load**:

- ~15 notifications per day total
- ~5 notifications per admin per day
- Low risk of notification spam

### 10.2 Database Queries

**Optimizations Applied**:

- Index on `notifications.user_id` for fast lookup
- Index on `notifications.created_at` for sorting
- Query uses `findByRole_RoleName("ADMIN")` with JOIN FETCH to minimize queries

### 10.3 WebSocket Scalability

**Current Design**:

- Single WebSocket connection per user
- Notifications sent to individual user topics: `/topic/notifications/{userId}`
- No broadcast to all users (only ADMIN users receive request notifications)

---

## 11. Migration Checklist

### Backend (Completed)

- [x] Update NotificationType enum
- [x] Update NotificationEntityType enum
- [x] Update enums.sql with new types
- [x] Create notification helper methods in NotificationService
- [x] Integrate with TimeOffRequestService
- [x] Integrate with OvertimeRequestService
- [x] Integrate with EmployeeShiftRegistrationService
- [x] Add AccountRepository.findByRole_RoleName() method
- [x] Build and test project

### Frontend (To Do)

- [ ] Add REQUEST_TIME_OFF_PENDING, REQUEST_OVERTIME_PENDING, REQUEST_PART_TIME_PENDING to notification type enum
- [ ] Update WebSocket subscription to handle new notification types
- [ ] Create notification handlers for each request type
- [ ] Update notification dropdown UI to group by request type
- [ ] Implement navigation logic to request detail pages
- [ ] Add toast notifications for real-time alerts
- [ ] Test WebSocket connection and notification delivery
- [ ] Test mark as read functionality
- [ ] Test navigation from notification to request detail
- [ ] Verify badge count updates correctly

---

## 12. Support & Troubleshooting

### Common Issues

**Issue 1: Admin not receiving notifications**

- Check: Is user's account role = "ADMIN"?
- Check: Does user's account have an associated employee record?
- Check: Is WebSocket connection active?

**Issue 2: Notification count incorrect**

- Solution: Call `/api/v1/notifications/unread-count` API to sync
- Check: Are notifications being marked as read correctly?

**Issue 3: WebSocket disconnects frequently**

- Solution: Implement reconnection logic (see Error Handling section)
- Check: Network stability, firewall rules

**Issue 4: Notifications not appearing in real-time**

- Solution: Verify WebSocket subscription endpoint matches userId
- Fallback: Implement polling mechanism as backup

---

## 13. Future Enhancements (Out of Scope for BE-904)

**Potential Improvements** (not implemented):

- Notification preferences (allow admins to mute certain notification types)
- Daily summary email of pending requests
- Push notifications (mobile app)
- Notification history search/filter
- Mark multiple notifications as read at once
- Request approval directly from notification panel

**Current Design Rationale**:
Keep it simple for small-medium clinic. Avoid over-engineering. Focus on core functionality: notify managers of pending requests.

---

## Appendix A: API Request Examples

### Create Time-off Request (triggers notification)

```bash
curl -X POST http://localhost:8080/api/v1/time-off-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 2,
    "timeOffTypeId": "TOT001",
    "startDate": "2025-12-25",
    "endDate": "2025-12-27",
    "reason": "Family vacation"
  }'
```

### Create Overtime Request (triggers notification)

```bash
curl -X POST http://localhost:8080/api/v1/overtime-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workDate": "2025-12-24",
    "workShiftId": "WS001",
    "reason": "Emergency patient care"
  }'
```

### Get Notifications

```bash
curl -X GET "http://localhost:8080/api/v1/notifications?page=0&size=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark as Read

```bash
curl -X PATCH http://localhost:8080/api/v1/notifications/123/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Appendix B: WebSocket Connection Code

### Full React WebSocket Hook

```javascript
import { useEffect, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/notifications?page=0&size=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      setNotifications(data.content);

      // Fetch unread count
      const countResponse = await fetch(`/api/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const countData = await countResponse.json();
      setUnreadCount(countData.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socket);

    client.connect(
      {},
      () => {
        setIsConnected(true);
        setStompClient(client);

        // Subscribe to user's notification topic
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          const notification = JSON.parse(message.body);

          // Add to notifications list
          setNotifications((prev) => [notification, ...prev]);

          // Increment unread count
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          showToast(notification);
        });

        // Fetch initial notifications after connection
        fetchNotifications();
      },
      (error) => {
        console.error("WebSocket connection error:", error);
        setIsConnected(false);

        // Retry connection after 5 seconds
        setTimeout(() => {
          console.log("Retrying WebSocket connection...");
          // Reconnection logic handled by useEffect cleanup and re-run
        }, 5000);
      }
    );

    // Cleanup on unmount
    return () => {
      if (client.connected) {
        client.disconnect();
      }
    };
  }, [userId, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`/api/v1/notifications/mark-all-read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const showToast = (notification) => {
    // Implement your toast notification library here
    // e.g., react-hot-toast, sonner, etc.
    console.log("New notification:", notification);
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
```

---

**End of Document**

For questions or issues, contact the backend team or refer to:

- docs/NOTIFICATION_SYSTEM_FE_BE_INTEGRATION_GUIDE.md (general notifications)
- docs/API_DOCUMENTATION.md (API reference)
