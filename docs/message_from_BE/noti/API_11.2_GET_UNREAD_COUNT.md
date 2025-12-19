# API 11.2 - Get Unread Count (Lay So Luong Thong Bao Chua Doc)

## Endpoint

```
GET /api/v1/notifications/unread-count
```

## Mo ta

Lay so luong thong bao chua doc cua user dang dang nhap.

## Yeu cau Permission

- `VIEW_NOTIFICATION` - Xem thong bao cua ban than

## Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

## Response Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Lay so luong thong bao chua doc thanh cong",
  "data": 5
}
```

## Response Error

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Khong co quyen truy cap"
}
```

## Luu y

- Tra ve so nguyen (Integer) dai dien so luong thong bao co `isRead = false`
- FE co the dung de hien thi badge tren icon notification
- Nen goi API nay sau khi user login thanh cong
- Sau khi user danh dau thong bao da doc, goi lai API nay de cap nhat badge

## Test Case

### TC1: Lay unread count voi user co thong bao chua doc

**Given:**

- User admin@dental.com dang dang nhap
- Co 5 thong bao chua doc va 3 thong bao da doc

**When:**

```bash
GET /api/v1/notifications/unread-count
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Response data: 5

### TC2: Lay unread count voi user khong co thong bao chua doc

**Given:**

- User receptionist@dental.com dang dang nhap
- Tat ca thong bao deu da doc

**When:**

```bash
GET /api/v1/notifications/unread-count
Authorization: Bearer <receptionist_token>
```

**Then:**

- Status code: 200
- Response data: 0

### TC3: Lay unread count khong co token

**When:**

```bash
GET /api/v1/notifications/unread-count
```

**Then:**

- Status code: 401
- Message: "Unauthorized"

## Use Case - FE Implementation

### Hien thi badge notification

```javascript
// Lay unread count khi user login
const getUnreadCount = async () => {
  try {
    const response = await axios.get("/api/v1/notifications/unread-count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Hien thi badge tren icon notification
    const unreadCount = response.data.data;
    if (unreadCount > 0) {
      showBadge(unreadCount); // Hien thi so
    } else {
      hideBadge(); // An badge
    }
  } catch (error) {
    console.error("Failed to get unread count:", error);
  }
};

// Goi khi user login thanh cong
getUnreadCount();

// Goi lai sau khi user doc thong bao
socket.on("notification-read", () => {
  getUnreadCount(); // Cap nhat badge
});
```

### Polling unread count (optional)

```javascript
// Polling moi 30 giay de cap nhat badge (neu khong dung WebSocket)
setInterval(() => {
  getUnreadCount();
}, 30000);
```
