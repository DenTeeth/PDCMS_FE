# API 11.4 - Mark All As Read (Danh Dau Tat Ca Da Doc)

## Endpoint

```
PATCH /api/v1/notifications/read-all
```

## Mo ta

Danh dau tat ca thong bao chua doc cua user thanh da doc.

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
  "message": "Danh dau tat ca thong bao da doc thanh cong"
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

## Business Rules

- Chi danh dau cac thong bao thuoc ve user dang login
- Neu user khong co thong bao chua doc nao, API van tra ve thanh cong
- Tat ca thong bao co `isRead = false` se duoc set thanh `isRead = true` va `readAt = thoi gian hien tai`

## Luu y

- FE nen hien thi button "Mark all as read" trong dropdown notification
- Sau khi goi thanh cong, unread count se ve 0
- Nen goi lai API 11.2 (Get Unread Count) de cap nhat badge

## Test Case

### TC1: Danh dau tat ca thong bao chua doc

**Given:**

- User admin@dental.com dang dang nhap (accountId=1)
- User co 5 thong bao chua doc va 3 thong bao da doc

**When:**

```bash
PATCH /api/v1/notifications/read-all
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Message: "Danh dau tat ca thong bao da doc thanh cong"
- Database: 5 thong bao chua doc duoc set isRead=true va readAt=thoi gian hien tai
- 3 thong bao da doc khong thay doi

### TC2: Danh dau tat ca khi khong co thong bao chua doc

**Given:**

- User receptionist@dental.com dang dang nhap
- Tat ca thong bao deu da doc

**When:**

```bash
PATCH /api/v1/notifications/read-all
Authorization: Bearer <receptionist_token>
```

**Then:**

- Status code: 200
- Message: "Danh dau tat ca thong bao da doc thanh cong"
- Database: khong co thay doi

### TC3: Danh dau tat ca chi anh huong den user hien tai

**Given:**

- User admin co 3 thong bao chua doc
- User receptionist co 2 thong bao chua doc

**When:**

```bash
PATCH /api/v1/notifications/read-all
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Chi 3 thong bao cua admin duoc danh dau da doc
- 2 thong bao cua receptionist van giu nguyen trang thai chua doc

### TC4: Danh dau tat ca khong co token

**When:**

```bash
PATCH /api/v1/notifications/read-all
```

**Then:**

- Status code: 401
- Message: "Unauthorized"

## Use Case - FE Implementation

### Button "Mark all as read" trong dropdown

```javascript
const markAllAsRead = async () => {
  try {
    await axios.patch(
      "/api/v1/notifications/read-all",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Cap nhat UI: xoa styling "unread" cho tat ca notifications
    updateAllNotificationsUI({ isRead: true });

    // Cap nhat unread count ve 0
    setUnreadCount(0);

    // Hien thi toast thanh cong
    showToast("Tat ca thong bao da duoc danh dau da doc");
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    showToast("Co loi xay ra", "error");
  }
};

// Button trong notification dropdown
<button onClick={markAllAsRead}>Mark all as read</button>;
```

### Kiem tra truoc khi goi API

```javascript
// Chi hien thi button neu co thong bao chua doc
const showMarkAllButton = unreadCount > 0;

{
  showMarkAllButton && (
    <button onClick={markAllAsRead}>Mark all as read</button>
  );
}
```
