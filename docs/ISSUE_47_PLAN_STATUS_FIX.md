# Issue #47: Treatment Plan Status Fix Guide

**Status:** RESOLVED
**Priority:** HIGH
**Date:** 2025-12-07
**Type:** DATA CONSISTENCY FIX

## Problem Summary

Existing treatment plans trong database có `status = null` mặc dù tất cả phases đã `COMPLETED`. Điều này xảy ra vì:

- Issue #40 fix chỉ áp dụng cho new actions (complete items)
- Plans được tạo/completed trước khi fix → status vẫn null
- API 5.5 trả về `status = null` cho các plans này

## Root Cause

**File:** `treatment_plans/service/TreatmentPlanItemService.java` (line 472-523)

Method `checkAndCompletePlan()` chỉ được gọi khi có **item status update**. Existing plans với tất cả phases completed nhưng chưa có action mới → không được check.

## Solution: SQL Direct Fix

**KHÔNG TẠO** migration files hoặc background jobs (vi phạm quy tắc 2 SQL files duy nhất).

Thay vào đó, chạy SQL command trực tiếp trong database để fix existing data.

## Step 1: Verify Problem

Kết nối database và chạy query để tìm plans bị ảnh hưởng:

```sql
-- Find plans with all phases completed but status = null
SELECT
    p.plan_id,
    p.plan_code,
    p.plan_name,
    p.status as plan_status,
    p.approval_status,
    COUNT(DISTINCT ph.patient_phase_id) as total_phases,
    SUM(CASE WHEN ph.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_phases
FROM patient_treatment_plans p
LEFT JOIN patient_plan_phases ph ON p.plan_id = ph.plan_id
WHERE p.status IS NULL
  AND p.approval_status = 'APPROVED'
GROUP BY p.plan_id, p.plan_code, p.plan_name, p.status, p.approval_status
HAVING
    COUNT(DISTINCT ph.patient_phase_id) > 0
    AND COUNT(DISTINCT ph.patient_phase_id) = SUM(CASE WHEN ph.status = 'COMPLETED' THEN 1 ELSE 0 END);
```

**Expected Result:**

- Nếu query trả về plans → Bug confirmed
- Nếu không trả về gì → Database đã đúng

## Step 2: Apply Fix

Chạy UPDATE command để fix existing data:

```sql
-- Update plans with all phases completed but status = null
UPDATE patient_treatment_plans p
SET status = 'COMPLETED'
WHERE p.status IS NULL
  AND p.approval_status = 'APPROVED'
  AND EXISTS (
    SELECT 1
    FROM patient_plan_phases ph
    WHERE ph.plan_id = p.plan_id
    GROUP BY ph.plan_id
    HAVING
      COUNT(DISTINCT ph.patient_phase_id) > 0
      AND COUNT(DISTINCT ph.patient_phase_id) = SUM(
        CASE WHEN ph.status = 'COMPLETED' THEN 1 ELSE 0 END
      )
  );
```

## Step 3: Verify Fix

Sau khi chạy UPDATE, verify kết quả:

```sql
-- Verify: Should return 0 rows
SELECT
    p.plan_id,
    p.plan_code,
    p.status
FROM patient_treatment_plans p
LEFT JOIN patient_plan_phases ph ON p.plan_id = ph.plan_id
WHERE p.status IS NULL
  AND p.approval_status = 'APPROVED'
GROUP BY p.plan_id, p.plan_code, p.status
HAVING
    COUNT(DISTINCT ph.patient_phase_id) > 0
    AND COUNT(DISTINCT ph.patient_phase_id) = SUM(CASE WHEN ph.status = 'COMPLETED' THEN 1 ELSE 0 END);
```

**Expected:** Query không trả về rows nào.

## Step 4: Test API 5.5

Sau khi fix database, test API:

```bash
# Login as admin or dentist
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"EMP001","password":"123456"}'

# Get treatment plans list
curl -X GET "http://localhost:8080/api/v1/patient-treatment-plans?page=0&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

- Plans with all phases completed → `status: "COMPLETED"`
- No plans with `status: null` (unless they are truly incomplete)

## Future Prevention

Issue #40 fix đã đảm bảo:

- Khi complete items → BE auto-complete phase
- Khi complete all phases → BE auto-complete plan
- Status được update realtime trong database

Plans mới sẽ KHÔNG gặp vấn đề này.

## Related Files

**Backend Logic (Already Fixed in Issue #40):**

- `treatment_plans/service/TreatmentPlanItemService.java` - Method: `checkAndCompletePlan()`

**Database:**

- `patient_treatment_plans` table - column: `status`
- `patient_plan_phases` table - column: `status`

## Testing Notes

**Test Account:** EMP001 / 123456 (ROLE_DENTIST)

**Test Scenarios:**

1. Verify existing plans với all phases completed → status = COMPLETED
2. Create new plan và complete all items → status auto-update to COMPLETED
3. API 5.5 list → trả về đúng status cho tất cả plans

## Additional Notes

**Why No Migration File?**

Project quy định chỉ 2 SQL files:

- `schema.sql` - Table structure documentation
- `dental-clinic-seed-data.sql` - ENUMs + seed data

Migration scripts vi phạm quy tắc này. Thay vào đó, chạy SQL trực tiếp trong database.

**Idempotent SQL:**

UPDATE command là idempotent (có thể chạy nhiều lần an toàn):

- Chỉ update plans với `status IS NULL` và all phases completed
- Nếu chạy lại → không có plans nào bị update (vì status đã COMPLETED)

**Rollback:**

Nếu cần rollback:

```sql
-- Revert specific plans to NULL (if needed)
UPDATE patient_treatment_plans
SET status = NULL
WHERE plan_id IN (1, 2, 3);  -- Replace with actual IDs
```

---

**RESOLUTION:** Run SQL UPDATE command directly in database. No code changes or migration files needed.
