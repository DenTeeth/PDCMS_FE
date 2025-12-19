# API 11.5 - Delete Notification (Xoa Thong Bao)

## Endpoint

```
DELETE /api/v1/notifications/{id}
```

## Mo ta

Xoa 1 thong bao cu the cua user.

## Yeu cau Permission

- `DELETE_NOTIFICATION` - Xoa thong bao cua ban than

## Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

## Path Parameters

| Parameter | Type | Required | Mo ta                    |
| --------- | ---- | -------- | ------------------------ |
| id        | Long | Yes      | ID cua thong bao can xoa |

## Response Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Xoa thong bao thanh cong"
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
  "message": "User khong co quyen xoa thong bao nay"
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

- Chi user so huu thong bao moi co the xoa
- Thong bao bi xoa se bi xoa vinh vien khoi database (hard delete)
- Sau khi xoa, neu thong bao chua doc, unread count se giam 1

## Luu y

- FE nen hien thi xac nhan truoc khi xoa
- Sau khi xoa thanh cong, nen:
  - Xoa thong bao khoi UI
  - Cap nhat lai unread count (goi API 11.2)
  - Hien thi toast thong bao thanh cong

## Test Case

### TC1: Xoa thong bao thanh cong

**Given:**

- User admin@dental.com dang dang nhap (accountId=1)
- Thong bao ID=1 thuoc ve user nay

**When:**

```bash
DELETE /api/v1/notifications/1
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Message: "Xoa thong bao thanh cong"
- Database: thong bao ID=1 bi xoa khoi table notifications

### TC2: Xoa thong bao cua user khac

**Given:**

- User receptionist@dental.com dang dang nhap (accountId=2)
- Thong bao ID=1 thuoc ve admin (accountId=1)

**When:**

```bash
DELETE /api/v1/notifications/1
Authorization: Bearer <receptionist_token>
```

**Then:**

- Status code: 403
- Message: "User khong co quyen xoa thong bao nay"
- Database: thong bao ID=1 van ton tai

### TC3: Xoa thong bao khong ton tai

**When:**

```bash
DELETE /api/v1/notifications/999
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 404
- Message: "Notification not found with ID: 999"

### TC4: Xoa thong bao chua doc va cap nhat unread count

**Given:**

- User co 5 thong bao chua doc
- Thong bao ID=1 la chua doc (isRead=false)

**When:**

```bash
DELETE /api/v1/notifications/1
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Database: thong bao ID=1 bi xoa
- Goi API 11.2: unread count giam tu 5 xuong 4

### TC5: Xoa thong bao khong co token

**When:**

```bash
DELETE /api/v1/notifications/1
```

**Then:**

- Status code: 401
- Message: "Unauthorized"

### TC6: Xoa thong bao voi role khong co permission DELETE_NOTIFICATION

**Given:**

- User co role ROLE_DENTIST_INTERN
- Role nay khong duoc gan DELETE_NOTIFICATION permission

**When:**

```bash
DELETE /api/v1/notifications/1
Authorization: Bearer <intern_token>
```

**Then:**

- Status code: 403
- Message: "Khong co quyen truy cap"

## Use Case - FE Implementation

### Xoa thong bao voi xac nhan

```javascript
const deleteNotification = async (notificationId) => {
  // Hien thi confirm dialog
  const confirmed = await showConfirmDialog({
    title: "Xac nhan xoa",
    message: "Ban co chac chan muon xoa thong bao nay?",
    confirmText: "Xoa",
    cancelText: "Huy",
  });

  if (!confirmed) return;

  try {
    await axios.delete(`/api/v1/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Xoa khoi UI
    removeNotificationFromUI(notificationId);

    // Cap nhat unread count
    updateUnreadCount();

    // Hien thi toast
    showToast("Xoa thong bao thanh cong", "success");
  } catch (error) {
    console.error("Failed to delete notification:", error);
    showToast("Co loi xay ra khi xoa thong bao", "error");
  }
};

// Button xoa trong notification item
<button onClick={() => deleteNotification(notification.notificationId)}>
  <TrashIcon />
</button>;
```

### Swipe to delete (Mobile)

```javascript
// Su dung thu vien nhu react-swipeable
<Swipeable onSwipedLeft={() => deleteNotification(notification.notificationId)}>
  <NotificationItem {...notification} />
</Swipeable>
```
