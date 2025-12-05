-- =====================================================
-- SQL SCRIPT KIỂM TRA LỖI PART-TIME SLOT SYSTEM
-- Ngày: 23/11/2025
-- Mục đích: Debug lỗi không cập nhật availability
-- =====================================================

-- =====================================================
-- PART 1: KIỂM TRA TỔNG QUAN SLOTS
-- =====================================================
SELECT 
    '=== TỔNG QUAN PART-TIME SLOTS ===' as section,
    NULL as slot_id, NULL as detail, NULL as value;

SELECT 
    'Slot Overview' as section,
    pts.slot_id,
    CONCAT(ws.shift_name, ' - ', pts.day_of_week) as detail,
    CONCAT(
        'Quota: ', pts.quota, '/tuần | ',
        'Period: ', pts.effective_from, ' → ', pts.effective_to, ' | ',
        'Active: ', IF(pts.is_active, 'Yes', 'No')
    ) as value
FROM part_time_slots pts
LEFT JOIN work_shifts ws ON pts.work_shift_id = ws.shift_id
WHERE pts.is_active = true
ORDER BY pts.slot_id;

-- =====================================================
-- PART 2: TÍNH TOÁN CHI TIẾT CHO TỪNG SLOT
-- =====================================================
SELECT 
    '=== DETAILED CALCULATION PER SLOT ===' as section,
    NULL as slot_id, NULL as metric, NULL as calculated_value, NULL as status;

SELECT 
    'Calculation' as section,
    pts.slot_id,
    'Total Weeks' as metric,
    CEIL(TIMESTAMPDIFF(DAY, pts.effective_from, pts.effective_to) / 7) as calculated_value,
    '✅ From effectiveFrom to effectiveTo' as status
FROM part_time_slots pts
WHERE pts.is_active = true

UNION ALL

SELECT 
    'Calculation' as section,
    pts.slot_id,
    'Total Quota' as metric,
    CEIL(TIMESTAMPDIFF(DAY, pts.effective_from, pts.effective_to) / 7) * pts.quota as calculated_value,
    '✅ Total weeks × quota per week' as status
FROM part_time_slots pts
WHERE pts.is_active = true

UNION ALL

SELECT 
    'Calculation' as section,
    pts.slot_id,
    'Total Registrations' as metric,
    COUNT(sr.registration_id) as calculated_value,
    CONCAT('(APPROVED: ', 
           SUM(CASE WHEN sr.status = 'APPROVED' THEN 1 ELSE 0 END),
           ', PENDING: ',
           SUM(CASE WHEN sr.status = 'PENDING' THEN 1 ELSE 0 END),
           ')') as status
FROM part_time_slots pts
LEFT JOIN shift_registrations sr ON pts.slot_id = sr.part_time_slot_id
WHERE pts.is_active = true
GROUP BY pts.slot_id

UNION ALL

SELECT 
    'Calculation' as section,
    pts.slot_id,
    'Registered Quota (APPROVED only)' as metric,
    SUM(CASE 
        WHEN sr.status = 'APPROVED' 
        THEN CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) * pts.quota
        ELSE 0 
    END) as calculated_value,
    '✅ Sum of all approved registrations' as status
FROM part_time_slots pts
LEFT JOIN shift_registrations sr ON pts.slot_id = sr.part_time_slot_id
WHERE pts.is_active = true
GROUP BY pts.slot_id

UNION ALL

SELECT 
    'Calculation' as section,
    pts.slot_id,
    '🎯 REMAINING QUOTA (Correct)' as metric,
    (CEIL(TIMESTAMPDIFF(DAY, pts.effective_from, pts.effective_to) / 7) * pts.quota) -
    COALESCE(SUM(CASE 
        WHEN sr.status = 'APPROVED' 
        THEN CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) * pts.quota
        ELSE 0 
    END), 0) as calculated_value,
    '✅ Total quota - registered quota' as status
FROM part_time_slots pts
LEFT JOIN shift_registrations sr ON pts.slot_id = sr.part_time_slot_id
WHERE pts.is_active = true
GROUP BY pts.slot_id

ORDER BY slot_id, 
         FIELD(metric, 
               'Total Weeks', 
               'Total Quota', 
               'Total Registrations', 
               'Registered Quota (APPROVED only)', 
               '🎯 REMAINING QUOTA (Correct)');

-- =====================================================
-- PART 3: CHI TIẾT REGISTRATIONS CHO TỪNG SLOT
-- =====================================================
SELECT 
    '=== REGISTRATION DETAILS ===' as section,
    NULL as slot_id, NULL as registration_id, NULL as employee, 
    NULL as period, NULL as status, NULL as quota_used;

SELECT 
    'Registrations' as section,
    sr.part_time_slot_id as slot_id,
    sr.registration_id,
    CONCAT('EMP-', sr.employee_id, ' (', e.employee_name, ')') as employee,
    CONCAT(sr.effective_from, ' → ', sr.effective_to, 
           ' (', CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7), ' weeks)') as period,
    sr.status,
    CASE 
        WHEN sr.status = 'APPROVED' 
        THEN CONCAT(CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) * pts.quota, ' lượt')
        ELSE 'Not counted (PENDING/REJECTED)'
    END as quota_used
FROM shift_registrations sr
JOIN part_time_slots pts ON sr.part_time_slot_id = pts.slot_id
LEFT JOIN employees e ON sr.employee_id = e.employee_id
WHERE pts.is_active = true
ORDER BY sr.part_time_slot_id, sr.created_at DESC;

-- =====================================================
-- PART 4: AVAILABILITY BY MONTH (DETAILED)
-- =====================================================
SELECT 
    '=== MONTHLY AVAILABILITY BREAKDOWN ===' as section,
    NULL as slot_id, NULL as month, NULL as total_working_days,
    NULL as dates_available, NULL as dates_partial, NULL as dates_full;

-- Note: Cần table calendar_dates hoặc generate dates
-- Đây là pseudo-code, cần adjust theo structure database thực tế

/*
WITH RECURSIVE date_range AS (
    SELECT 
        pts.slot_id,
        pts.effective_from as date,
        pts.effective_to as end_date,
        pts.quota,
        pts.day_of_week
    FROM part_time_slots pts
    WHERE pts.is_active = true
    
    UNION ALL
    
    SELECT 
        slot_id,
        DATE_ADD(date, INTERVAL 1 DAY),
        end_date,
        quota,
        day_of_week
    FROM date_range
    WHERE date < end_date
),
slot_availability AS (
    SELECT 
        dr.slot_id,
        dr.date,
        DATE_FORMAT(dr.date, '%Y-%m') as month,
        dr.quota,
        dr.quota - COUNT(sr.registration_id) as available_slots
    FROM date_range dr
    LEFT JOIN shift_registrations sr 
        ON dr.date BETWEEN sr.effective_from AND sr.effective_to
        AND sr.part_time_slot_id = dr.slot_id
        AND sr.status = 'APPROVED'
        AND DAYNAME(dr.date) = CASE dr.day_of_week
            WHEN 'MONDAY' THEN 'Monday'
            WHEN 'TUESDAY' THEN 'Tuesday'
            WHEN 'WEDNESDAY' THEN 'Wednesday'
            WHEN 'THURSDAY' THEN 'Thursday'
            WHEN 'FRIDAY' THEN 'Friday'
            WHEN 'SATURDAY' THEN 'Saturday'
            WHEN 'SUNDAY' THEN 'Sunday'
        END
    WHERE DAYNAME(dr.date) = CASE dr.day_of_week
        WHEN 'MONDAY' THEN 'Monday'
        WHEN 'TUESDAY' THEN 'Tuesday'
        WHEN 'WEDNESDAY' THEN 'Wednesday'
        WHEN 'THURSDAY' THEN 'Thursday'
        WHEN 'FRIDAY' THEN 'Friday'
        WHEN 'SATURDAY' THEN 'Saturday'
        WHEN 'SUNDAY' THEN 'Sunday'
    END
    GROUP BY dr.slot_id, dr.date, dr.quota
)
SELECT 
    'Monthly' as section,
    sa.slot_id,
    sa.month,
    COUNT(*) as total_working_days,
    SUM(CASE WHEN available_slots = quota THEN 1 ELSE 0 END) as dates_available,
    SUM(CASE WHEN available_slots > 0 AND available_slots < quota THEN 1 ELSE 0 END) as dates_partial,
    SUM(CASE WHEN available_slots = 0 THEN 1 ELSE 0 END) as dates_full
FROM slot_availability sa
GROUP BY sa.slot_id, sa.month
ORDER BY sa.slot_id, sa.month;
*/

-- =====================================================
-- PART 5: TEST SPECIFIC SLOT (Thay slot_id = 123)
-- =====================================================
SELECT 
    '=== TEST SLOT ID = 123 ===' as section,
    NULL as info;

-- Thông tin slot
SELECT 
    'Slot Info' as type,
    pts.slot_id,
    ws.shift_name,
    pts.day_of_week,
    pts.quota as quota_per_week,
    pts.effective_from,
    pts.effective_to,
    CEIL(TIMESTAMPDIFF(DAY, pts.effective_from, pts.effective_to) / 7) as total_weeks,
    CEIL(TIMESTAMPDIFF(DAY, pts.effective_from, pts.effective_to) / 7) * pts.quota as total_quota
FROM part_time_slots pts
LEFT JOIN work_shifts ws ON pts.work_shift_id = ws.shift_id
WHERE pts.slot_id = 123;

-- Registrations
SELECT 
    'Registrations' as type,
    sr.registration_id,
    sr.employee_id,
    e.employee_name,
    sr.effective_from,
    sr.effective_to,
    CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) as weeks,
    sr.status,
    CASE 
        WHEN sr.status = 'APPROVED' 
        THEN CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) * 
             (SELECT quota FROM part_time_slots WHERE slot_id = 123)
        ELSE 0 
    END as quota_used
FROM shift_registrations sr
LEFT JOIN employees e ON sr.employee_id = e.employee_id
WHERE sr.part_time_slot_id = 123
ORDER BY sr.created_at DESC;

-- Tổng hợp
SELECT 
    'Summary' as type,
    (SELECT CEIL(TIMESTAMPDIFF(DAY, effective_from, effective_to) / 7) * quota 
     FROM part_time_slots WHERE slot_id = 123) as total_quota,
    COALESCE(SUM(CASE 
        WHEN sr.status = 'APPROVED' 
        THEN CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) * pts.quota
        ELSE 0 
    END), 0) as registered_quota,
    (SELECT CEIL(TIMESTAMPDIFF(DAY, effective_from, effective_to) / 7) * quota 
     FROM part_time_slots WHERE slot_id = 123) -
    COALESCE(SUM(CASE 
        WHEN sr.status = 'APPROVED' 
        THEN CEIL(TIMESTAMPDIFF(DAY, sr.effective_from, sr.effective_to) / 7) * pts.quota
        ELSE 0 
    END), 0) as remaining_quota,
    COUNT(CASE WHEN sr.status = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN sr.status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN sr.status = 'REJECTED' THEN 1 END) as rejected_count
FROM shift_registrations sr
JOIN part_time_slots pts ON sr.part_time_slot_id = pts.slot_id
WHERE sr.part_time_slot_id = 123;

-- =====================================================
-- PART 6: IDENTIFY THE BUG - SO SÁNH VỚI API RESPONSE
-- =====================================================
SELECT 
    '=== 🐛 BUG DETECTION ===' as section,
    'Compare database calculation vs API response' as instruction;

SELECT 
    '⚠️ CHECK THIS' as alert,
    'Run GET /api/v1/registrations/part-time-flex/slots/{slotId}/details' as instruction,
    'Compare overallRemaining from API with remaining_quota from SQL above' as step_1,
    'If they do NOT match → BUG CONFIRMED: Backend not updating availability' as step_2,
    'If they match but still wrong → Check calculation logic in backend' as step_3;

-- =====================================================
-- PART 7: FIX VERIFICATION QUERIES
-- =====================================================
SELECT 
    '=== AFTER FIX: RUN THESE TO VERIFY ===' as section;

-- Query 1: Verify slot remaining after creating registration
SELECT 
    'Test: Create registration and verify' as test,
    '1. Note current remaining_quota value' as step_1,
    '2. Create new registration via API' as step_2,
    '3. Run this query again' as step_3,
    '4. Remaining quota should DECREASE by (weeks × quota)' as expected_result;

-- Query 2: Verify approval updates
SELECT 
    'Test: Approve pending registration' as test,
    '1. Create registration with PENDING status' as step_1,
    '2. Note remaining_quota (should NOT change if PENDING not counted)' as step_2,
    '3. Approve the registration via API' as step_3,
    '4. Run query again - remaining_quota should DECREASE' as expected_result;

-- Query 3: Verify rejection/deletion
SELECT 
    'Test: Reject or delete registration' as test,
    '1. Note current remaining_quota' as step_1,
    '2. Reject or delete an APPROVED registration' as step_2,
    '3. Run query again - remaining_quota should INCREASE back' as expected_result;

-- =====================================================
-- NOTES
-- =====================================================
/*
IMPORTANT NOTES:
1. This script assumes standard table names. Adjust if needed:
   - part_time_slots
   - shift_registrations
   - work_shifts
   - employees

2. Date calculations assume:
   - effectiveFrom and effectiveTo are DATE or DATETIME
   - One week = 7 days
   - Registration covers full weeks

3. Status values assumed:
   - 'APPROVED' - counted toward quota
   - 'PENDING' - not counted (or counted based on business logic)
   - 'REJECTED' - not counted

4. For monthly breakdown (Part 4), you may need a calendar table
   or use recursive CTE to generate dates.

5. Replace slot_id = 123 with actual slot ID to test specific cases.
*/

-- =====================================================
-- END OF SCRIPT
-- =====================================================
SELECT '✅ Script completed. Review results above.' as final_message;
