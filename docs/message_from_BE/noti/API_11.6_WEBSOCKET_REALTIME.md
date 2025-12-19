# API 11.6 - WebSocket Real-time Notifications

## Endpoint

```
WS /ws
```

## Mo ta

Ket noi WebSocket de nhan thong bao real-time tu server.

## Yeu cau

- JWT token hop le
- Browser ho tro WebSocket hoac SockJS fallback

## Connection Flow

### Step 1: Ket noi WebSocket

```javascript
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const connectWebSocket = (token, userId) => {
  // Tao SockJS connection
  const socket = new SockJS("https://pdcms.duckdns.org/ws");

  // Tao STOMP client
  const stompClient = Stomp.over(socket);

  // Ket noi voi headers Authorization
  stompClient.connect(
    {
      Authorization: `Bearer ${token}`,
    },
    () => {
      console.log("WebSocket connected");

      // Subscribe to notification channel
      stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
        const notification = JSON.parse(message.body);
        handleNewNotification(notification);
      });
    },
    (error) => {
      console.error("WebSocket connection error:", error);
    }
  );

  return stompClient;
};
```

### Step 2: Lay userId tu JWT

```javascript
import jwt_decode from "jwt-decode";

const getUserIdFromToken = (token) => {
  const decoded = jwt_decode(token);
  return decoded.account_id; // accountId chinh la userId
};

// Su dung
const token = localStorage.getItem("accessToken");
const userId = getUserIdFromToken(token);
const stompClient = connectWebSocket(token, userId);
```

### Step 3: Xu ly thong bao moi

```javascript
const handleNewNotification = (notification) => {
  console.log("New notification received:", notification);

  // Cap nhat UI: them vao dau danh sach
  addNotificationToTop(notification);

  // Tang unread count
  incrementUnreadCount();

  // Hien thi toast/banner
  showNotificationToast(notification.title, notification.message);

  // Play sound (optional)
  playNotificationSound();

  // Browser notification (can xin permission truoc)
  if (Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.message,
      icon: "/logo.png",
    });
  }
};
```

### Step 4: Ngat ket noi khi unmount

```javascript
useEffect(() => {
  const stompClient = connectWebSocket(token, userId);

  // Cleanup khi component unmount
  return () => {
    if (stompClient && stompClient.connected) {
      stompClient.disconnect(() => {
        console.log("WebSocket disconnected");
      });
    }
  };
}, [token, userId]);
```

## Message Format

Khi co thong bao moi, server se push message voi format:

```json
{
  "notificationId": 10,
  "userId": 5,
  "type": "APPOINTMENT_CREATED",
  "title": "Dat lich thanh cong",
  "message": "Cuoc hen APT001 da duoc dat thanh cong vao 17/12/2025 09:00",
  "relatedEntityType": "APPOINTMENT",
  "relatedEntityId": "APT001",
  "isRead": false,
  "readAt": null,
  "createdAt": "2025-12-17T09:00:00"
}
```

## Reconnection Strategy

```javascript
const connectWithRetry = (token, userId, maxRetries = 5) => {
  let retries = 0;

  const connect = () => {
    const socket = new SockJS("https://pdcms.duckdns.org/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log("WebSocket connected");
        retries = 0; // Reset retries on success

        stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
          const notification = JSON.parse(message.body);
          handleNewNotification(notification);
        });
      },
      (error) => {
        console.error("WebSocket error:", error);

        // Retry after delay
        if (retries < maxRetries) {
          retries++;
          const delay = Math.min(1000 * Math.pow(2, retries), 30000);
          console.log(
            `Retrying in ${delay}ms... (attempt ${retries}/${maxRetries})`
          );
          setTimeout(connect, delay);
        } else {
          console.error("Max retries reached. WebSocket connection failed.");
        }
      }
    );

    return stompClient;
  };

  return connect();
};
```

## CORS Configuration

WebSocket endpoint `/ws` da duoc config CORS:

- **Dev:** `http://localhost:3000`, `http://localhost:5173`, `http://localhost:8080`
- **Prod:** Tat ca origins (`*`) hoac config qua env variable `CORS_ALLOWED_ORIGINS`

## Luu y

- Can ket noi WebSocket sau khi user login thanh cong
- Nen ngat ket noi khi user logout
- Su dung SockJS de dam bao fallback cho browser khong ho tro WebSocket
- Notification channel la `/topic/notifications/{userId}` voi userId tu JWT claim `account_id`
- Server se chi push notification den dung user channel (security)

## Test Case

### TC1: Ket noi WebSocket thanh cong

**Given:**

- User admin@dental.com dang login
- JWT token hop le

**When:**

- FE goi connectWebSocket(token, userId)

**Then:**

- WebSocket connected successfully
- Console log: "WebSocket connected"
- Subscribe to `/topic/notifications/1` thanh cong

### TC2: Nhan thong bao real-time

**Given:**

- User admin da ket noi WebSocket
- User dat lich hen thanh cong

**When:**

- Backend tao appointment va trigger notification

**Then:**

- FE nhan duoc message qua WebSocket
- Notification duoc them vao UI
- Unread count tang len 1
- Toast notification hien thi

### TC3: Ket noi voi token khong hop le

**Given:**

- Token da het han hoac khong hop le

**When:**

- FE goi connectWebSocket(invalidToken, userId)

**Then:**

- WebSocket connection failed
- Console error: "WebSocket connection error"
- Retry ket noi sau delay

### TC4: Reconnect sau khi mat ket noi

**Given:**

- User da ket noi WebSocket thanh cong
- Internet mat ket noi tam thoi

**When:**

- Ket noi duoc phuc hoi

**Then:**

- WebSocket tu dong reconnect
- Subscribe lai channel
- Tiep tuc nhan notification

### TC5: Ngat ket noi khi logout

**Given:**

- User da ket noi WebSocket

**When:**

- User click Logout

**Then:**

- stompClient.disconnect() duoc goi
- WebSocket connection closed
- Console log: "WebSocket disconnected"

## Browser Notification Permission

```javascript
// Xin permission hien thi browser notification
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Browser khong ho tro notification");
    return;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
  }
};

// Goi khi app khoi dong
requestNotificationPermission();
```

## Complete Example - React Hook

```javascript
import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import jwt_decode from "jwt-decode";

export const useNotificationWebSocket = (token) => {
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Lay userId tu JWT
    const decoded = jwt_decode(token);
    const userId = decoded.account_id;

    // Ket noi WebSocket
    const socket = new SockJS("https://pdcms.duckdns.org/ws");
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log("WebSocket connected");
        setConnected(true);

        // Subscribe
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          const notification = JSON.parse(message.body);

          // Dispatch custom event
          window.dispatchEvent(
            new CustomEvent("new-notification", { detail: notification })
          );
        });
      },
      (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      }
    );

    setStompClient(client);

    // Cleanup
    return () => {
      if (client && client.connected) {
        client.disconnect();
        setConnected(false);
      }
    };
  }, [token]);

  return { connected, stompClient };
};

// Su dung trong component
const MyComponent = () => {
  const token = localStorage.getItem("accessToken");
  const { connected } = useNotificationWebSocket(token);

  useEffect(() => {
    const handleNotification = (event) => {
      const notification = event.detail;
      console.log("New notification:", notification);
      // Update UI...
    };

    window.addEventListener("new-notification", handleNotification);
    return () =>
      window.removeEventListener("new-notification", handleNotification);
  }, []);

  return <div>WebSocket: {connected ? "Connected" : "Disconnected"}</div>;
};
```
