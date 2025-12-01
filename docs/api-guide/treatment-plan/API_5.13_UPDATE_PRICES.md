#  API 5.13: Update Treatment Plan Prices (Finance)

**Version**: V21.4
**Release Date**: January 2025
**Permission Required**: `MANAGE_PLAN_PRICING`
**Allowed Roles**: ROLE_MANAGER, ROLE_ACCOUNTANT

---

##  Overview

Allows **Finance/Accountant team** to adjust treatment plan item prices after plan creation. This API was introduced in V21.4 as part of the pricing workflow separation - doctors no longer manage prices, Finance team controls all pricing adjustments.

### Business Context

- **Who uses this**: Finance Manager, Accountant, Clinic Manager
- **When to use**:
  - Seasonal pricing adjustments
  - VIP patient discounts
  - Price corrections
  - Promotional pricing
  - Cost optimization
- **What it does**:
  - Batch update item prices
  - Automatically recalculate plan totals
  - Create audit trail (who/when/why)
  - Prevent unauthorized price changes

---

##  Endpoint Details

### HTTP Method & URL

```http
PATCH /api/v1/patient-treatment-plans/{planCode}/prices
```

### Path Parameters

| Parameter  | Type   | Required | Description                | Example             |
| ---------- | ------ | -------- | -------------------------- | ------------------- |
| `planCode` | String |  Yes   | Unique treatment plan code | `PLAN-20250115-001` |

### Request Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Authentication

- **Type**: JWT Bearer Token
- **Required Permission**: `MANAGE_PLAN_PRICING`
- **Access Control**:
  -  ROLE_MANAGER (full access)
  -  ROLE_ACCOUNTANT (full access)
  -  ROLE_DOCTOR (no access)
  -  ROLE_NURSE (no access)

---

##  Request Body

### Schema

```json
{
  "items": [
    {
      "itemId": 101,
      "newPrice": 4500000,
      "note": "Optional reason (max 500 chars)"
    }
  ]
}
```

### Field Descriptions

#### `items` (Array, Required)

List of price adjustments to apply.

**ItemPriceUpdate Object:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `itemId` | Integer |  Yes | Must exist in plan | Patient plan item ID |
| `newPrice` | Number |  Yes | >= 0 | New price in VND |
| `note` | String |  No | Max 500 chars | Reason for adjustment |

### Validation Rules

1. **itemId**: Must belong to the specified treatment plan
2. **newPrice**:
   - Cannot be negative
   - Must be a valid number
   - Decimals allowed (e.g., 1500000.50)
3. **note**:
   - Optional but recommended for audit trail
   - Max length: 500 characters
   - Used for compliance reporting

---

##  Response

### Success Response (200 OK)

#### Schema

```json
{
  "planCode": "PLAN-20250115-001",
  "itemsUpdated": 2,
  "financialImpact": {
    "previousTotalCost": 15000000,
    "newTotalCost": 13700000,
    "costDifference": -1300000
  },
  "updatedBy": {
    "employeeCode": "EMP-007",
    "fullName": "Nguyễn Thị Kế Toán"
  },
  "updatedAt": "2025-01-15T14:30:00"
}
```

#### Field Descriptions

| Field                               | Type     | Description                            |
| ----------------------------------- | -------- | -------------------------------------- |
| `planCode`                          | String   | Treatment plan code                    |
| `itemsUpdated`                      | Integer  | Number of items successfully updated   |
| `financialImpact.previousTotalCost` | Number   | Total cost before update (VND)         |
| `financialImpact.newTotalCost`      | Number   | Total cost after update (VND)          |
| `financialImpact.costDifference`    | Number   | Change in cost (negative = discount)   |
| `updatedBy.employeeCode`            | String   | Employee code of user who made changes |
| `updatedBy.fullName`                | String   | Full name of user                      |
| `updatedAt`                         | DateTime | Timestamp of update (ISO 8601)         |

---

##  Error Responses

### 400 Bad Request - Invalid Price

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Price must be >= 0",
  "path": "/api/v1/patient-treatment-plans/PLAN-001/prices"
}
```

**Cause**: Negative price value
**Solution**: Ensure all `newPrice` values are >= 0

---

### 403 Forbidden - Access Denied

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied: MANAGE_PLAN_PRICING permission required",
  "path": "/api/v1/patient-treatment-plans/PLAN-001/prices"
}
```

**Cause**: User lacks `MANAGE_PLAN_PRICING` permission
**Solution**:

- Verify user has ROLE_MANAGER or ROLE_ACCOUNTANT
- Check permission assignment in database

---

### 404 Not Found - Plan Not Found

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Treatment plan not found with code: PLAN-999",
  "path": "/api/v1/patient-treatment-plans/PLAN-999/prices"
}
```

**Cause**: Invalid `planCode` parameter
**Solution**: Verify plan exists and code is correct

---

### 404 Not Found - Item Not Found

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Patient plan item not found with ID: 9999",
  "details": {
    "itemId": 9999,
    "planCode": "PLAN-001"
  }
}
```

**Cause**: `itemId` does not exist in the specified plan
**Solution**:

- Verify item ID is correct
- Check item belongs to this specific plan
- Ensure item was not deleted

---

### 409 Conflict - Plan Completed

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Cannot update prices: Treatment plan status is COMPLETED",
  "details": {
    "currentStatus": "COMPLETED",
    "allowedStatuses": ["NOT_STARTED", "IN_PROGRESS", "APPROVED"]
  }
}
```

**Cause**: Plan is in COMPLETED or CANCELLED status
**Solution**:

- Cannot modify prices for finished plans
- Consider creating a new plan if needed

---

##  Business Rules

### Status Validation

| Plan Status | Can Update Prices? | Notes                |
| ----------- | ------------------ | -------------------- |
| NOT_STARTED |  Yes             | Plan not yet started |
| IN_PROGRESS |  Yes             | Active treatment     |
| APPROVED    |  Yes             | Approved by manager  |
| COMPLETED   |  No              | Finished treatment   |
| CANCELLED   |  No              | Cancelled plan       |

### Automatic Calculations

When prices are updated, the system automatically:

1.  Recalculates `total_price` (sum of all item prices)
2.  Recalculates `final_cost` (total - discount)
3.  Updates `updated_at` timestamp
4.  Creates audit log entry

### Audit Trail

Each price change creates the following audit records:

- **Table**: `patient_plan_items`
  - `price_updated_by` → Employee ID
  - `price_updated_at` → Timestamp
  - `price_update_reason` → Note from request
- **Table**: `plan_audit_logs`
  - Action: "PRICE_UPDATED"
  - Details: Before/after prices, items affected

---

##  Examples

### Example 1: Single Price Adjustment

**Scenario**: Reduce price for VIP patient

**Request:**

```bash
curl -X PATCH "https://api.dental.com/api/v1/patient-treatment-plans/PLAN-001/prices" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemId": 101,
        "newPrice": 4000000,
        "note": "Giảm 10% cho khách hàng VIP"
      }
    ]
  }'
```

**Response (200 OK):**

```json
{
  "planCode": "PLAN-001",
  "itemsUpdated": 1,
  "financialImpact": {
    "previousTotalCost": 5000000,
    "newTotalCost": 4000000,
    "costDifference": -1000000
  },
  "updatedBy": {
    "employeeCode": "EMP-007",
    "fullName": "Nguyễn Thị Finance"
  },
  "updatedAt": "2025-01-15T10:30:00"
}
```

---

### Example 2: Batch Price Update

**Scenario**: Update multiple items for seasonal pricing

**Request:**

```json
{
  "items": [
    {
      "itemId": 101,
      "newPrice": 3800000,
      "note": "Khuyến mãi Tết 2025"
    },
    {
      "itemId": 102,
      "newPrice": 2200000,
      "note": "Khuyến mãi Tết 2025"
    },
    {
      "itemId": 103,
      "newPrice": 5500000,
      "note": "Điều chỉnh giá theo thị trường"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "planCode": "PLAN-20250115-001",
  "itemsUpdated": 3,
  "financialImpact": {
    "previousTotalCost": 12000000,
    "newTotalCost": 11500000,
    "costDifference": -500000
  },
  "updatedBy": {
    "employeeCode": "EMP-007",
    "fullName": "Nguyễn Thị Kế Toán"
  },
  "updatedAt": "2025-01-15T14:30:00"
}
```

---

### Example 3: Price Correction

**Scenario**: Fix incorrect pricing

**Request:**

```json
{
  "items": [
    {
      "itemId": 205,
      "newPrice": 4500000,
      "note": "Sửa lỗi nhập giá sai từ ERP"
    }
  ]
}
```

---

##  Testing Guide

### Manual Testing (Postman)

#### Setup

1. **Get JWT Token**

   - Login as Finance/Accountant user
   - Copy access token

2. **Find Treatment Plan**

   ```http
   GET /api/v1/patient-treatment-plans?status=IN_PROGRESS
   ```

   - Copy `planCode` from response

3. **Get Plan Items**
   ```http
   GET /api/v1/patient-treatment-plans/{planCode}
   ```
   - Copy `itemId` values from `phases[].items[]`

#### Test Case 1: Valid Price Update

```http
PATCH /api/v1/patient-treatment-plans/PLAN-001/prices
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "itemId": 101,
      "newPrice": 4500000,
      "note": "Test price update"
    }
  ]
}
```

**Expected Result**:

- Status: 200 OK
- `itemsUpdated`: 1
- `financialImpact.costDifference` shows change

#### Test Case 2: Permission Denied

```http
PATCH /api/v1/patient-treatment-plans/PLAN-001/prices
Authorization: Bearer <doctor-token>
```

**Expected Result**:

- Status: 403 Forbidden
- Error message mentions missing permission

#### Test Case 3: Invalid Item ID

```json
{
  "items": [
    {
      "itemId": 99999,
      "newPrice": 1000000
    }
  ]
}
```

**Expected Result**:

- Status: 404 Not Found
- Error: "Patient plan item not found"

---

##  Security Considerations

### Permission Check

```java
@PreAuthorize("hasAuthority('MANAGE_PLAN_PRICING')")
```

- Enforced at controller level
- Checked before any business logic executes

### Audit Logging

All price changes are logged with:

-  Who made the change (employee ID)
-  When it was made (timestamp)
-  Why it was made (note field)
-  What changed (before/after prices)

### Data Integrity

-  Transaction isolation: READ_COMMITTED
-  Optimistic locking on plan total calculations
-  Foreign key constraints on employee references

---

##  Performance Metrics

### Response Time Targets

- **Expected**: < 500ms for batch of 10 items
- **Acceptable**: < 1000ms for batch of 50 items
- **Optimization**: Bulk SQL updates used internally

### Database Impact

- **Queries**: 3-5 per request
  1. Validate plan exists and status
  2. Validate all items exist
  3. Batch update item prices
  4. Recalculate plan totals
  5. Insert audit log

---

##  Related APIs

- **API 5.1**: Create Custom Treatment Plan (uses auto-filled prices)
- **API 5.7**: Add Items to Phase (uses auto-filled prices)
- **API 5.12**: Submit for Review (triggers after price changes)
- **API 5.9**: Approve/Reject Treatment Plan (Finance may need to adjust before approval)

---

##  Support

**Technical Issues**: Contact Backend Team
**Business Questions**: Contact Finance Manager
**Permission Issues**: Contact System Administrator

---

**Last Updated**: January 2025
**API Version**: V21.4
**Status**:  Production Ready
