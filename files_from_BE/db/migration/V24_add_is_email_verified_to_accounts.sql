-- V24 Migration: Add is_email_verified to accounts
-- Fixes FE Issue #6: PatientInfoResponse missing isEmailVerified field
--
-- Problem: Account entity does not have is_email_verified column to track
-- whether the user has verified their email address.
--
-- Solution: Add is_email_verified column to accounts table with default FALSE.
-- Existing accounts will be marked as not verified by default.
--
-- Date: 2025-11-25
-- Author: Backend Team

-- Step 1: Add is_email_verified column (default FALSE)
ALTER TABLE accounts
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing employee accounts to verified (they were created by admin)
UPDATE accounts
SET is_email_verified = TRUE
WHERE role_id IN (
    SELECT role_id FROM roles WHERE role_id IN ('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_DENTIST',
                                                  'ROLE_RECEPTIONIST', 'ROLE_NURSE',
                                                  'ROLE_INVENTORY_MANAGER')
);

-- Step 3: Patient accounts with status ACTIVE should also be verified
UPDATE accounts
SET is_email_verified = TRUE
WHERE role_id = 'ROLE_PATIENT'
  AND status = 'ACTIVE';

-- Step 4: Verify migration
-- SELECT
--   account_id,
--   username,
--   email,
--   status,
--   is_email_verified,
--   role_id
-- FROM accounts
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Note:
-- - New patient accounts will have is_email_verified = FALSE by default
-- - Email verification will be set to TRUE when patient clicks verification link
-- - Employee accounts are pre-verified because they are created by admin
