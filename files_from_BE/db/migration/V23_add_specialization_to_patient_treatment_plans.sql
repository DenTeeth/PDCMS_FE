-- V23 Migration: Add specialization_id to patient_treatment_plans
-- Fixes FE Issue #1: Treatment plan specialization mismatch
--
-- Problem: When creating a treatment plan from a template, the plan entity
-- does not have direct access to specialization. FE has to traverse through
-- sourceTemplate to get specialization, which is inefficient and error-prone.
--
-- Solution: Add specialization_id column to patient_treatment_plans table
-- and snapshot specialization from template at plan creation time.
--
-- Date: 2025-11-25
-- Author: Backend Team

-- Step 1: Add specialization_id column (nullable for backward compatibility)
ALTER TABLE patient_treatment_plans
ADD COLUMN specialization_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE patient_treatment_plans
ADD CONSTRAINT fk_patient_plans_specialization
FOREIGN KEY (specialization_id) REFERENCES specializations(specialization_id);

-- Step 3: Backfill existing plans with specialization from their templates
UPDATE patient_treatment_plans ptp
SET specialization_id = tpt.specialization_id
FROM treatment_plan_templates tpt
WHERE ptp.template_id = tpt.template_id
  AND ptp.specialization_id IS NULL;

-- Step 4: Verify migration
-- SELECT
--   plan_code,
--   plan_name,
--   specialization_id,
--   template_id
-- FROM patient_treatment_plans
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Note: We keep specialization_id as nullable because:
-- 1. Custom plans (created via API 5.4) may not have a template
-- 2. Plans created before this migration will have NULL specialization
-- 3. Future requirement may allow plans without specialization
