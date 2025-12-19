# API 11.3 - Mark Notification As Read (Danh Dau Thong Bao Da Doc)

## Endpoint

```
PATCH /api/v1/notifications/{id}/read
```

## Mo ta

Danh dau 1 thong bao cu the da duoc doc boi user.

## Yeu cau Permission

- `VIEW_NOTIFICATION` - Xem thong bao cua ban than

## Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

## Path Parameters

| Parameter | Type | Required | Mo ta                                |
| --------- | ---- | -------- | ------------------------------------ |
| id        | Long | Yes      | ID cua thong bao can danh dau da doc |

## Response Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Danh dau thong bao da doc thanh cong"
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
  "message": "User khong co quyen danh dau thong bao nay"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Notification not found with ID: 999"
}
```

## Business Rules

- Chi user so huu thong bao moi co the danh dau da doc
- Neu thong bao da duoc danh dau da doc truoc do, API van tra ve thanh cong (idempotent)
- Sau khi danh dau da doc, field `isRead` se duoc set = true va `readAt` se duoc set = thoi gian hien tai

## Luu y

- FE nen goi API nay khi:
  - User click vao thong bao de xem chi tiet
  - User mo dropdown notification va thong bao duoc hien thi
- Sau khi goi thanh cong, nen cap nhat lai unread count (goi API 11.2)

## Test Case

### TC1: Danh dau thong bao chua doc thanh da doc

**Given:**

- User admin@dental.com dang dang nhap (accountId=1)
- Thong bao ID=1 thuoc ve user nay va dang o trang thai isRead=false

**When:**

```bash
PATCH /api/v1/notifications/1/read
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Message: "Danh dau thong bao da doc thanh cong"
- Database: notification ID=1 co isRead=true va readAt=thoi gian hien tai

### TC2: Danh dau thong bao da doc thanh da doc (idempotent)

**Given:**

- Thong bao ID=1 da duoc danh dau da doc truoc do

**When:**

```bash
PATCH /api/v1/notifications/1/read
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Message: "Danh dau thong bao da doc thanh cong"
- Database: khong thay doi (van la isRead=true)

### TC3: Danh dau thong bao cua user khac

**Given:**

- User receptionist@dental.com dang dang nhap (accountId=2)
- Thong bao ID=1 thuoc ve admin (accountId=1)

**When:**

```bash
PATCH /api/v1/notifications/1/read
Authorization: Bearer <receptionist_token>
```

**Then:**

- Status code: 403
- Message: "User khong co quyen danh dau thong bao nay"

### TC4: Danh dau thong bao khong ton tai

**When:**

```bash
PATCH /api/v1/notifications/999/read
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 404
- Message: "Notification not found with ID: 999"

### TC5: Danh dau thong bao khong co token

**When:**

```bash
PATCH /api/v1/notifications/1/read
```

**Then:**

- Status code: 401
- Message: "Unauthorized"

## Use Case - FE Implementation

### Danh dau da doc khi user click thong bao

```javascript
const markAsRead = async (notificationId) => {
  try {
    await axios.patch(
      `/api/v1/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Cap nhat UI: xoa styling "unread"
    updateNotificationUI(notificationId, { isRead: true });

    // Cap nhat unread count
    updateUnreadCount();
  } catch (error) {
    console.error("Failed to mark as read:", error);
  }
};

// Goi khi user click vao notification item
notificationItem.addEventListener("click", () => {
  markAsRead(notification.notificationId);
  navigateToDetail(notification.relatedEntityId);
});
```
