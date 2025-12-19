-- ============================================
-- POSTGRESQL ENUM TYPES FOR DENTAL CLINIC
-- ============================================
-- This file contains ONLY ENUM type definitions
-- Must be created BEFORE Hibernate generates tables
-- ============================================

-- Appointment ENUMs
DROP TYPE IF EXISTS appointment_action_type CASCADE;
CREATE TYPE appointment_action_type AS ENUM ('CREATE', 'DELAY', 'RESCHEDULE_SOURCE', 'RESCHEDULE_TARGET', 'CANCEL', 'STATUS_CHANGE');
DROP TYPE IF EXISTS appointment_status_enum CASCADE;
CREATE TYPE appointment_status_enum AS ENUM ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
DROP TYPE IF EXISTS appointment_participant_role_enum CASCADE;
CREATE TYPE appointment_participant_role_enum AS ENUM ('ASSISTANT', 'SECONDARY_DOCTOR', 'OBSERVER');
DROP TYPE IF EXISTS appointment_reason_code CASCADE;
CREATE TYPE appointment_reason_code AS ENUM ('PREVIOUS_CASE_OVERRUN', 'DOCTOR_UNAVAILABLE', 'EQUIPMENT_FAILURE', 'PATIENT_REQUEST', 'OPERATIONAL_REDIRECT', 'OTHER');

-- Account & Employee ENUMs
DROP TYPE IF EXISTS gender CASCADE;
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
DROP TYPE IF EXISTS employment_type CASCADE;
CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME_FIXED', 'PART_TIME_FLEX');
DROP TYPE IF EXISTS account_status CASCADE;
CREATE TYPE account_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION');

-- Customer Contact ENUMs
DROP TYPE IF EXISTS contact_history_action CASCADE;
CREATE TYPE contact_history_action AS ENUM ('CALL', 'MESSAGE', 'NOTE');
DROP TYPE IF EXISTS customer_contact_status CASCADE;
CREATE TYPE customer_contact_status AS ENUM ('NEW', 'CONTACTED', 'APPOINTMENT_SET', 'NOT_INTERESTED', 'CONVERTED');
DROP TYPE IF EXISTS customer_contact_source CASCADE;
CREATE TYPE customer_contact_source AS ENUM ('WEBSITE', 'FACEBOOK', 'ZALO', 'WALK_IN', 'REFERRAL');

-- Working Schedule ENUMs
DROP TYPE IF EXISTS shift_status CASCADE;
CREATE TYPE shift_status AS ENUM ('SCHEDULED', 'ON_LEAVE', 'COMPLETED', 'ABSENT', 'CANCELLED');
DROP TYPE IF EXISTS request_status CASCADE;
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
DROP TYPE IF EXISTS work_shift_category CASCADE;
CREATE TYPE work_shift_category AS ENUM ('NORMAL', 'NIGHT');
DROP TYPE IF EXISTS shift_source CASCADE;
CREATE TYPE shift_source AS ENUM ('BATCH_JOB', 'REGISTRATION_JOB', 'OT_APPROVAL', 'MANUAL_ENTRY');
DROP TYPE IF EXISTS employee_shifts_source CASCADE;
CREATE TYPE employee_shifts_source AS ENUM ('BATCH_JOB', 'REGISTRATION_JOB', 'OT_APPROVAL', 'MANUAL_ENTRY');
DROP TYPE IF EXISTS day_of_week CASCADE;
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
DROP TYPE IF EXISTS holiday_type CASCADE;
CREATE TYPE holiday_type AS ENUM ('NATIONAL', 'COMPANY');
DROP TYPE IF EXISTS renewal_status CASCADE;
CREATE TYPE renewal_status AS ENUM ('PENDING_ACTION', 'CONFIRMED', 'FINALIZED', 'DECLINED', 'EXPIRED');
DROP TYPE IF EXISTS time_off_status CASCADE;
CREATE TYPE time_off_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
DROP TYPE IF EXISTS balance_change_reason CASCADE;
CREATE TYPE balance_change_reason AS ENUM ('ANNUAL_RESET', 'APPROVED_REQUEST', 'REJECTED_REQUEST', 'CANCELLED_REQUEST', 'MANUAL_ADJUSTMENT');
DROP TYPE IF EXISTS registrationstatus CASCADE;
CREATE TYPE registrationstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Treatment Plan ENUMs
DROP TYPE IF EXISTS approval_status CASCADE;
CREATE TYPE approval_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
DROP TYPE IF EXISTS plan_item_status CASCADE;
CREATE TYPE plan_item_status AS ENUM ('READY_FOR_BOOKING', 'SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED','WAITING_FOR_PREREQUISITE','SKIPPED');
DROP TYPE IF EXISTS treatmentplanstatus CASCADE;
CREATE TYPE treatmentplanstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
DROP TYPE IF EXISTS paymenttype CASCADE;
CREATE TYPE paymenttype AS ENUM ('FULL', 'PHASED', 'INSTALLMENT');
DROP TYPE IF EXISTS phasestatus CASCADE;
CREATE TYPE phasestatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
DROP TYPE IF EXISTS planactiontype CASCADE;
CREATE TYPE planactiontype AS ENUM ('STATUS_CHANGE', 'PRICE_UPDATE', 'PHASE_UPDATE', 'APPROVAL');

-- Patient Tooth Status ENUM (Odontogram)
DROP TYPE IF EXISTS tooth_condition_enum CASCADE;
CREATE TYPE tooth_condition_enum AS ENUM (
    'HEALTHY',           -- Răng khỏe
    'CARIES_MILD',       -- Sâu răng nhẹ (mức 1)
    'CARIES_MODERATE',   -- Sâu răng trung bình (mức 2)
    'CARIES_SEVERE',     -- Sâu răng nặng (mức 3)
    'FILLED',            -- Răng trám
    'CROWN',             -- Bọc sứ
    'MISSING',           -- Mất răng
    'IMPLANT',           -- Cấy ghép
    'ROOT_CANAL',        -- Điều trị tủy
    'FRACTURED',         -- Gãy răng
    'IMPACTED'           -- Mọc ngầm
);

-- Clinical Record Attachment ENUM
DROP TYPE IF EXISTS attachment_type_enum CASCADE;
CREATE TYPE attachment_type_enum AS ENUM ('XRAY', 'PHOTO_BEFORE', 'PHOTO_AFTER', 'LAB_RESULT', 'CONSENT_FORM', 'OTHER');

-- Patient Image Type ENUM
DROP TYPE IF EXISTS image_type CASCADE;
CREATE TYPE image_type AS ENUM ('XRAY', 'PHOTO', 'BEFORE_TREATMENT', 'AFTER_TREATMENT', 'SCAN', 'OTHER');

-- Warehouse ENUMs
DROP TYPE IF EXISTS batchstatus CASCADE;
CREATE TYPE batchstatus AS ENUM ('ACTIVE', 'EXPIRED', 'DEPLETED');
DROP TYPE IF EXISTS exporttype CASCADE;
CREATE TYPE exporttype AS ENUM ('SERVICE', 'SALE', 'WASTAGE', 'TRANSFER');
DROP TYPE IF EXISTS suppliertier CASCADE;
CREATE TYPE suppliertier AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'BRONZE');
DROP TYPE IF EXISTS stockstatus CASCADE;
CREATE TYPE stockstatus AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');
DROP TYPE IF EXISTS transactionstatus CASCADE;
CREATE TYPE transactionstatus AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
DROP TYPE IF EXISTS paymentstatus CASCADE;
CREATE TYPE paymentstatus AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
DROP TYPE IF EXISTS warehousetype CASCADE;
CREATE TYPE warehousetype AS ENUM ('MAIN', 'BRANCH');
DROP TYPE IF EXISTS warehouseactiontype CASCADE;
CREATE TYPE warehouseactiontype AS ENUM ('IMPORT', 'EXPORT', 'TRANSFER', 'ADJUSTMENT');
DROP TYPE IF EXISTS transactiontype CASCADE;
CREATE TYPE transactiontype AS ENUM ('PURCHASE', 'SALE', 'SERVICE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');

-- Notification ENUMs
DROP TYPE IF EXISTS notification_type CASCADE;
CREATE TYPE notification_type AS ENUM (
    'APPOINTMENT_CREATED',
    'APPOINTMENT_UPDATED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_REMINDER',
    'APPOINTMENT_COMPLETED',
    'TREATMENT_PLAN_APPROVED',
    'TREATMENT_PLAN_UPDATED',
    'PAYMENT_RECEIVED',
    'SYSTEM_ANNOUNCEMENT'
);

DROP TYPE IF EXISTS notification_entity_type CASCADE;
CREATE TYPE notification_entity_type AS ENUM ('APPOINTMENT', 'TREATMENT_PLAN', 'PAYMENT', 'SYSTEM');

-- ============================================
-- END: 41 ENUM TYPES CREATED
-- ============================================
