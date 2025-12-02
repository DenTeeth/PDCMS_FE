-- ============================================
-- V21 Migration: Add VIEW_ALL_TREATMENT_PLANS Permission
-- ============================================
-- Purpose: Enable managers to view all treatment plans across all patients
-- Feature: Manager Dashboard - System-wide treatment plan overview
-- Issue: FE Issue 4 - Manager permission to view all plans
-- Date: 2025-11-17
-- ============================================

-- Step 1: Add new permission VIEW_ALL_TREATMENT_PLANS
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_ALL_TREATMENT_PLANS', 'VIEW_ALL_TREATMENT_PLANS', 'TREATMENT_PLAN',
 'Xem TẤT CẢ phác đồ điều trị TOÀN HỆ THỐNG (Quản lý - Manager Dashboard)',
 266, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;

-- Step 2: Assign permission to ROLE_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_MANAGER', 'VIEW_ALL_TREATMENT_PLANS')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 3: Verify the permission was added
-- Run this query to confirm:
-- SELECT * FROM permissions WHERE permission_id = 'VIEW_ALL_TREATMENT_PLANS';
-- SELECT * FROM role_permissions WHERE permission_id = 'VIEW_ALL_TREATMENT_PLANS';

-- ============================================
-- NOTES FOR DEVELOPERS
-- ============================================
-- 1. This permission enables the new API endpoint:
--    GET /api/v1/treatment-plans
--
-- 2. Differences from existing permissions:
--    - VIEW_TREATMENT_PLAN_ALL: View all plans for a SPECIFIC patient
--    - VIEW_ALL_TREATMENT_PLANS: View all plans across ALL patients (system-wide)
--
-- 3. Use Cases:
--    - Manager dashboard showing all treatment plans
--    - Approval queue (filter by PENDING_REVIEW status)
--    - Doctor performance tracking
--    - Cross-patient reporting
--
-- 4. The endpoint supports filtering by:
--    - approvalStatus: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
--    - status: PENDING, ACTIVE, COMPLETED, CANCELLED
--    - doctorEmployeeCode: Filter by specific doctor
--    - Pagination: page, size, sort
--
-- 5. Response is lightweight (no phase/item details) for better performance
--
-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- DELETE FROM role_permissions WHERE permission_id = 'VIEW_ALL_TREATMENT_PLANS';
-- DELETE FROM permissions WHERE permission_id = 'VIEW_ALL_TREATMENT_PLANS';
-- ============================================
