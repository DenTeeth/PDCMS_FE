# API 6.6 - Transaction History Testing Guide

## 🎯 Testing Overview

Testing suite for API 6.6 - Transaction History with payment tracking, approval workflow, and appointment linking.

## 📋 Prerequisites

### 1. Database Setup

```bash
# Run migrations
./mvnw flyway:migrate

# Verify tables
psql -d dental_clinic -c "SELECT * FROM storage_transactions LIMIT 5;"
```

### 2. Authentication

```bash
# Get JWT token
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "employeeCode": "MANAGER001",
  "password": "password123"
}

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

## 🧪 Test Suite

### Test 1: Get All Transactions (Basic)

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?page=0&size=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:

```json
{
  "statusCode": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    "meta": {
      "page": 0,
      "size": 20,
      "totalPages": 5,
      "totalElements": 98
    },
    "stats": {
      "periodStart": null,
      "periodEnd": null,
      "totalImportValue": 500000000,
      "totalExportValue": 250000000,
      "pendingApprovalCount": 2
    },
    "content": [...]
  }
}
```

### Test 2: Search by Transaction Code

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?search=PX-20251125" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Find transactions with code matching "PX-20251125"

### Test 3: Filter by Transaction Type

```bash
# Import only
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=IMPORT&page=0&size=10" \
  -H "Authorization: Bearer $TOKEN"

# Export only
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=EXPORT&page=0&size=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 4: Filter by Payment Status (Accountant Use Case)

```bash
# Unpaid invoices
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=IMPORT&paymentStatus=UNPAID" \
  -H "Authorization: Bearer $TOKEN"

# Partial payment
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=IMPORT&paymentStatus=PARTIAL" \
  -H "Authorization: Bearer $TOKEN"

# Fully paid
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=IMPORT&paymentStatus=PAID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Financial data visible (paidAmount, remainingDebt) if user has VIEW_COST permission

### Test 5: Filter by Approval Status (Manager Use Case)

```bash
# Pending approval
curl -X GET "http://localhost:8080/api/warehouse/transactions?status=PENDING_APPROVAL" \
  -H "Authorization: Bearer $TOKEN"

# Approved
curl -X GET "http://localhost:8080/api/warehouse/transactions?status=APPROVED&page=0&size=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Find transactions with matching approval status

### Test 6: Date Range Filter (Monthly Reconciliation)

```bash
# November 2025 transactions
curl -X GET "http://localhost:8080/api/warehouse/transactions?fromDate=2025-11-01&toDate=2025-11-30" \
  -H "Authorization: Bearer $TOKEN"

# Last 7 days
curl -X GET "http://localhost:8080/api/warehouse/transactions?fromDate=2025-11-18&toDate=2025-11-25" \
  -H "Authorization: Bearer $TOKEN"
```

### Test 7: Filter by Supplier (Vendor Performance Analysis)

```bash
# Get supplier ID first
curl -X GET "http://localhost:8080/api/v1/suppliers" -H "Authorization: Bearer $TOKEN"

# Filter by supplier (e.g., ID=1)
curl -X GET "http://localhost:8080/api/warehouse/transactions?supplierId=1&type=IMPORT" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Only import transactions from supplier ID=1

### Test 8: Filter by Appointment (Doctor Traceability)

```bash
# Find appointment ID from seed data
curl -X GET "http://localhost:8080/api/v1/appointments" -H "Authorization: Bearer $TOKEN"

# Filter exports for appointment (e.g., ID=5)
curl -X GET "http://localhost:8080/api/warehouse/transactions?appointmentId=5&type=EXPORT" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Export transactions linked to appointment ID=5, includes patientName

### Test 9: Combined Filters (Complex Query)

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?\
type=IMPORT&\
status=APPROVED&\
paymentStatus=PARTIAL&\
fromDate=2025-11-01&\
toDate=2025-11-30&\
sortBy=dueDate&\
sortDir=asc&\
page=0&\
size=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Approved import transactions with partial payment in Nov 2025, sorted by due date

### Test 10: Pagination & Sorting

```bash
# Page 2, sorted by transactionDate ascending
curl -X GET "http://localhost:8080/api/warehouse/transactions?page=1&size=10&sortBy=transactionDate&sortDir=asc" \
  -H "Authorization: Bearer $TOKEN"

# Page 0, sorted by totalValue descending (requires VIEW_COST)
curl -X GET "http://localhost:8080/api/warehouse/transactions?page=0&size=20&sortBy=totalValue&sortDir=desc" \
  -H "Authorization: Bearer $TOKEN"
```

## 🔐 RBAC Testing

### Test 11: User with VIEW_COST Permission (Manager/Accountant)

```bash
# Login as Manager (has VIEW_COST)
POST http://localhost:8080/api/auth/login
{
  "employeeCode": "MANAGER001",
  "password": "password123"
}

# Get transactions
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=IMPORT&page=0&size=5" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected**: Response includes:

- `totalValue`: 122500000.00
- `paidAmount`: 61250000.00
- `remainingDebt`: 61250000.00
- `stats.totalImportValue`: 500000000
- `stats.totalExportValue`: 250000000

### Test 12: User without VIEW_COST Permission (Receptionist)

```bash
# Login as Receptionist (no VIEW_COST)
POST http://localhost:8080/api/auth/login
{
  "employeeCode": "RECEPTIONIST001",
  "password": "password123"
}

# Get transactions
curl -X GET "http://localhost:8080/api/warehouse/transactions?type=IMPORT&page=0&size=5" \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN"
```

**Expected**: Response shows:

- `totalValue`: **null** (masked)
- `paidAmount`: **null** (masked)
- `remainingDebt`: **null** (masked)
- `stats.totalImportValue`: **null** (masked)
- `stats.totalExportValue`: **null** (masked)

### Test 13: User without VIEW_WAREHOUSE Permission (Doctor)

```bash
# Login as Doctor (no VIEW_WAREHOUSE)
POST http://localhost:8080/api/auth/login
{
  "employeeCode": "DOCTOR001",
  "password": "password123"
}

# Try to get transactions
curl -X GET "http://localhost:8080/api/warehouse/transactions" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

**Expected**: `403 Forbidden` - Access Denied

## ❌ Error Handling Testing

### Test 14: Invalid Date Range

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?fromDate=2025-12-01&toDate=2025-11-01" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:

```json
{
  "statusCode": 400,
  "message": "fromDate cannot be after toDate",
  "error": "INVALID_DATE_RANGE"
}
```

### Test 15: Invalid Page Size

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?page=0&size=101" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:

```json
{
  "statusCode": 400,
  "message": "Size must be between 1 and 100",
  "error": "INVALID_SIZE"
}
```

### Test 16: Invalid Sort Direction

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?sortDir=invalid" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:

```json
{
  "statusCode": 400,
  "message": "Sort direction must be 'asc' or 'desc'",
  "error": "INVALID_SORT_DIR"
}
```

### Test 17: Negative Page Number

```bash
curl -X GET "http://localhost:8080/api/warehouse/transactions?page=-1" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:

```json
{
  "statusCode": 400,
  "message": "Page number cannot be negative",
  "error": "INVALID_PAGE"
}
```

## [YES] Verification Checklist

### Database Verification

```sql
-- Check permission exists
SELECT * FROM permissions WHERE permission_id = 'VIEW_COST';

-- Check role assignments
SELECT r.role_id, p.permission_id
FROM role_permissions r
JOIN permissions p ON r.permission_id = p.permission_id
WHERE p.permission_id IN ('VIEW_COST', 'VIEW_WAREHOUSE', 'APPROVE_TRANSACTION');

-- Check transactions with payment tracking
SELECT transaction_code, payment_status, paid_amount, remaining_debt, due_date
FROM storage_transactions
WHERE payment_status IS NOT NULL
LIMIT 10;

-- Check transactions with approval workflow
SELECT transaction_code, approval_status, approved_by, approved_at
FROM storage_transactions
WHERE approval_status = 'PENDING_APPROVAL';

-- Check transactions linked to appointments
SELECT st.transaction_code, st.related_appointment_id, a.appointment_code, p.full_name
FROM storage_transactions st
LEFT JOIN appointments a ON st.related_appointment_id = a.appointment_id
LEFT JOIN patients p ON a.patient_id = p.patient_id
WHERE st.related_appointment_id IS NOT NULL;
```

### Response Validation

- [x] `meta` object present with correct pagination info
- [x] `stats` object present with period dates
- [x] `stats.pendingApprovalCount` is integer
- [x] `content` is array of transactions
- [x] Import transactions have `supplierName`, `invoiceNumber`
- [x] Export transactions have `relatedAppointmentId`, `patientName`
- [x] Payment fields present for IMPORT type
- [x] Financial data masked for users without VIEW_COST
- [x] `createdByName`, `approvedByName` are human-readable names

## 🚀 Performance Testing

### Test 18: Large Dataset Query

```bash
# Query all transactions (no filters)
time curl -X GET "http://localhost:8080/api/warehouse/transactions?page=0&size=100" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Response time < 2 seconds

### Test 19: Complex Filter Query

```bash
# Multiple filters + search
time curl -X GET "http://localhost:8080/api/warehouse/transactions?\
search=PN&\
type=IMPORT&\
status=APPROVED&\
fromDate=2025-01-01&\
toDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Response time < 3 seconds

## 📊 Business Scenario Tests

### Scenario 1: Accountant End-of-Month Reconciliation

```bash
# Step 1: Get all import transactions in November
curl -X GET "http://localhost:8080/api/warehouse/transactions?\
type=IMPORT&\
fromDate=2025-11-01&\
toDate=2025-11-30&\
page=0&\
size=50" \
  -H "Authorization: Bearer $ACCOUNTANT_TOKEN"

# Step 2: Filter unpaid invoices
curl -X GET "http://localhost:8080/api/warehouse/transactions?\
type=IMPORT&\
paymentStatus=UNPAID&\
fromDate=2025-11-01&\
toDate=2025-11-30" \
  -H "Authorization: Bearer $ACCOUNTANT_TOKEN"

# Step 3: Check overdue payments
curl -X GET "http://localhost:8080/api/warehouse/transactions?\
type=IMPORT&\
paymentStatus=UNPAID&\
toDate=2025-11-25" \
  -H "Authorization: Bearer $ACCOUNTANT_TOKEN"
```

### Scenario 2: Doctor Traceability (Adverse Reaction)

```bash
# Patient had allergic reaction - need to trace medications used
# Step 1: Find appointment
curl -X GET "http://localhost:8080/api/v1/appointments?patientId=5&date=2025-11-24" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Step 2: Get export transactions for that appointment
curl -X GET "http://localhost:8080/api/warehouse/transactions?\
appointmentId=1523&\
type=EXPORT" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

**Expected**: See exact items exported (thuốc tê Septodont, găng tay, etc.)

### Scenario 3: Manager Approval Workflow

```bash
# Step 1: Check pending transactions
curl -X GET "http://localhost:8080/api/warehouse/transactions?status=PENDING_APPROVAL" \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Step 2: Approve/Reject (future API 6.7)
# PUT /api/warehouse/transactions/602/approve
# PUT /api/warehouse/transactions/603/reject
```

## 📝 Test Results Template

```
Test Date: 2025-11-25
Tester: [Your Name]
Environment: Development

| Test # | Test Case | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Get All Transactions | [YES] | Response time: 1.2s |
| 2 | Search by Code | [YES] | Found PX-20251125-888 |
| 3 | Filter by Type | [YES] | IMPORT/EXPORT working |
| 4 | Payment Status Filter | [YES] | PARTIAL shows correct debt |
| 5 | Approval Status Filter | [YES] | Found 2 PENDING |
| 6 | Date Range Filter | [YES] | Nov 2025: 45 transactions |
| 7 | Filter by Supplier | [YES] | Supplier #1: 12 imports |
| 8 | Filter by Appointment | [YES] | Linked to APT-xxx |
| 9 | Combined Filters | [YES] | All filters working together |
| 10 | Pagination & Sorting | [YES] | Correct page navigation |
| 11 | RBAC - WITH VIEW_COST | [YES] | Financial data visible |
| 12 | RBAC - NO VIEW_COST | [YES] | Financial data masked (null) |
| 13 | RBAC - NO WAREHOUSE | [YES] | 403 Forbidden |
| 14-17 | Error Handling | [YES] | All validations working |
| 18-19 | Performance | [YES] | < 2s for large queries |
```

---

**Testing Completed**: [YES] / ❌
**Date**: 2025-11-25
**Version**: API 6.6 v1
