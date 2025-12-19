# API 11.1 - Get Notifications (Lay Danh Sach Thong Bao)

## Endpoint

```
GET /api/v1/notifications
```

## Mo ta

Lay danh sach thong bao cua user dang dang nhap (phan trang).

## Yeu cau Permission

- `VIEW_NOTIFICATION` - Xem thong bao cua ban than

## Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

## Query Parameters

| Parameter | Type    | Required | Default | Mo ta                        |
| --------- | ------- | -------- | ------- | ---------------------------- |
| page      | Integer | No       | 0       | So trang (bat dau tu 0)      |
| size      | Integer | No       | 20      | So luong thong bao moi trang |

## Response Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Lay danh sach thong bao thanh cong",
  "data": {
    "content": [
      {
        "notificationId": 1,
        "userId": 5,
        "type": "APPOINTMENT_CREATED",
        "title": "Dat lich thanh cong",
        "message": "Cuoc hen APT001 da duoc dat thanh cong vao 17/12/2025 09:00",
        "relatedEntityType": "APPOINTMENT",
        "relatedEntityId": "APT001",
        "isRead": false,
        "readAt": null,
        "createdAt": "2025-12-17T09:00:00"
      },
      {
        "notificationId": 2,
        "userId": 5,
        "type": "APPOINTMENT_REMINDER",
        "title": "Nhac nho cuoc hen",
        "message": "Ban co cuoc hen vao 18/12/2025 14:00",
        "relatedEntityType": "APPOINTMENT",
        "relatedEntityId": "APT002",
        "isRead": true,
        "readAt": "2025-12-17T10:30:00",
        "createdAt": "2025-12-17T08:00:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 1,
    "totalElements": 2,
    "last": true,
    "size": 20,
    "number": 0,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "numberOfElements": 2,
    "first": true,
    "empty": false
  }
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

## Cac Loai Notification Type

- `APPOINTMENT_CREATED` - Dat lich thanh cong
- `APPOINTMENT_REMINDER` - Nhac nho cuoc hen
- `APPOINTMENT_CANCELLED` - Huy lich hen
- `APPOINTMENT_RESCHEDULED` - Doi lich hen
- `TREATMENT_PLAN_CREATED` - Tao phac do dieu tri
- `TREATMENT_PLAN_UPDATED` - Cap nhat phac do dieu tri
- `PAYMENT_RECEIVED` - Nhan thanh toan
- `SYSTEM_ANNOUNCEMENT` - Thong bao he thong

## Cac Loai Related Entity Type

- `APPOINTMENT` - Lien quan den lich hen
- `TREATMENT_PLAN` - Lien quan den phac do dieu tri
- `PAYMENT` - Lien quan den thanh toan
- `SYSTEM` - Thong bao he thong

## Luu y

- Thong bao duoc sap xep theo `createdAt` DESC (moi nhat o dau)
- Chi hien thi thong bao cua user dang login (filter theo userId tu JWT)
- Tra ve tat ca thong bao (read va unread)
- FE nen hien thi thong bao unread o dau voi style khac biet

## Test Case

### TC1: Lay thong bao voi user co thong bao

**Given:**

- User admin@dental.com (accountId=1) dang dang nhap
- Co 2 thong bao trong database

**When:**

```bash
GET /api/v1/notifications?page=0&size=20
Authorization: Bearer <admin_token>
```

**Then:**

- Status code: 200
- Response chua 2 thong bao
- Cac thong bao duoc sap xep theo createdAt DESC

### TC2: Lay thong bao voi user khong co thong bao

**Given:**

- User receptionist@dental.com dang dang nhap
- Khong co thong bao nao

**When:**

```bash
GET /api/v1/notifications?page=0&size=20
Authorization: Bearer <receptionist_token>
```

**Then:**

- Status code: 200
- Response content la mang rong []
- totalElements = 0

### TC3: Lay thong bao voi pagination

**Given:**

- User co 25 thong bao

**When:**

```bash
GET /api/v1/notifications?page=1&size=10
Authorization: Bearer <user_token>
```

**Then:**

- Status code: 200
- Response chua 10 thong bao (thong bao thu 11-20)
- totalPages = 3
- totalElements = 25

### TC4: Lay thong bao khong co token

**When:**

```bash
GET /api/v1/notifications
```

**Then:**

- Status code: 401
- Message: "Unauthorized"

### TC5: Lay thong bao voi role khong co permission

**Given:**

- User co role ROLE_PATIENT nhung role nay khong duoc gan VIEW_NOTIFICATION

**When:**

```bash
GET /api/v1/notifications
Authorization: Bearer <patient_token>
```

**Then:**

- Status code: 403
- Message: "Khong co quyen truy cap"
