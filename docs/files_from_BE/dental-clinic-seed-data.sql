-- ============================================
-- HỆ THỐNG QUẢN LÝ PHÒNG KHÁM NHA KHOA
-- Dental Clinic Management System - Seed Data V6
-- ============================================
-- NOTE:
-- - This is the ONLY SQL file used in the project
-- - Contains: ENUM types + Initial seed data (INSERT statements)
-- - Tables are automatically created by Hibernate (ddl-auto: update)
-- - This file runs AFTER Hibernate creates schema (defer-datasource-initialization: true)
-- - ENUMs MUST be created in this file to survive database drops
-- ============================================

-- ============================================
-- STEP 0: CREATE ALL POSTGRESQL ENUM TYPES
-- ============================================
-- These ENUMs MUST exist before Hibernate creates tables
-- Spring Boot SQL parser cannot handle DO blocks, so using simple CREATE TYPE
-- continue-on-error=true will ignore "already exists" errors
-- ============================================

-- Appointment ENUMs
CREATE TYPE appointment_action_type AS ENUM ('CREATE', 'DELAY', 'RESCHEDULE_SOURCE', 'RESCHEDULE_TARGET', 'CANCEL', 'STATUS_CHANGE');
CREATE TYPE appointment_status_enum AS ENUM ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE appointment_participant_role_enum AS ENUM ('ASSISTANT', 'SECONDARY_DOCTOR', 'OBSERVER');
CREATE TYPE appointment_reason_code AS ENUM ('PREVIOUS_CASE_OVERRUN', 'DOCTOR_UNAVAILABLE', 'EQUIPMENT_FAILURE', 'PATIENT_REQUEST', 'OPERATIONAL_REDIRECT', 'OTHER');

-- Account & Employee ENUMs
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME_FIXED', 'PART_TIME_FLEX');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION');

-- Customer Contact ENUMs
CREATE TYPE contact_history_action AS ENUM ('CALL', 'MESSAGE', 'NOTE');
CREATE TYPE customer_contact_status AS ENUM ('NEW', 'CONTACTED', 'APPOINTMENT_SET', 'NOT_INTERESTED', 'CONVERTED');
CREATE TYPE customer_contact_source AS ENUM ('WEBSITE', 'FACEBOOK', 'ZALO', 'WALK_IN', 'REFERRAL');

-- Working Schedule ENUMs
CREATE TYPE shift_status AS ENUM ('SCHEDULED', 'ON_LEAVE', 'COMPLETED', 'ABSENT', 'CANCELLED');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE work_shift_category AS ENUM ('NORMAL', 'NIGHT');
CREATE TYPE shift_source AS ENUM ('BATCH_JOB', 'REGISTRATION_JOB', 'OT_APPROVAL', 'MANUAL_ENTRY');
CREATE TYPE employee_shifts_source AS ENUM ('BATCH_JOB', 'REGISTRATION_JOB', 'OT_APPROVAL', 'MANUAL_ENTRY');
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE holiday_type AS ENUM ('NATIONAL', 'COMPANY');
CREATE TYPE renewal_status AS ENUM ('PENDING_ACTION', 'CONFIRMED', 'FINALIZED', 'DECLINED', 'EXPIRED');
CREATE TYPE time_off_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE balance_change_reason AS ENUM ('ANNUAL_RESET', 'APPROVED_REQUEST', 'REJECTED_REQUEST', 'CANCELLED_REQUEST', 'MANUAL_ADJUSTMENT');
CREATE TYPE registrationstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Treatment Plan ENUMs
CREATE TYPE approval_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE plan_item_status AS ENUM ('READY_FOR_BOOKING', 'SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED','WAITING_FOR_PREREQUISITE','SKIPPED');
CREATE TYPE treatmentplanstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE paymenttype AS ENUM ('FULL', 'PHASED', 'INSTALLMENT');
CREATE TYPE phasestatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE planactiontype AS ENUM ('STATUS_CHANGE', 'PRICE_UPDATE', 'PHASE_UPDATE', 'APPROVAL');

-- Patient Tooth Status ENUM (Odontogram)
CREATE TYPE tooth_condition_enum AS ENUM ('HEALTHY', 'CARIES', 'FILLED', 'CROWN', 'MISSING', 'IMPLANT', 'ROOT_CANAL', 'FRACTURED', 'IMPACTED');

-- Clinical Record Attachment ENUM
CREATE TYPE attachment_type_enum AS ENUM ('XRAY', 'PHOTO_BEFORE', 'PHOTO_AFTER', 'LAB_RESULT', 'CONSENT_FORM', 'OTHER');

-- Warehouse ENUMs
CREATE TYPE batchstatus AS ENUM ('ACTIVE', 'EXPIRED', 'DEPLETED');
CREATE TYPE exporttype AS ENUM ('SERVICE', 'SALE', 'WASTAGE', 'TRANSFER');
CREATE TYPE suppliertier AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'BRONZE');
CREATE TYPE stockstatus AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');
CREATE TYPE transactionstatus AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE paymentstatus AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
CREATE TYPE warehousetype AS ENUM ('MAIN', 'BRANCH');
CREATE TYPE warehouseactiontype AS ENUM ('IMPORT', 'EXPORT', 'TRANSFER', 'ADJUSTMENT');
CREATE TYPE transactiontype AS ENUM ('PURCHASE', 'SALE', 'SERVICE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');

-- ============================================
-- END ENUM TYPE DEFINITIONS (38 types total)
-- ============================================

-- ============================================
-- FIX CONSTRAINTS AFTER HIBERNATE AUTO-GENERATION
-- ============================================
-- Fix patient_treatment_plans status constraint to include PENDING
-- Hibernate may generate constraint missing PENDING due to old migration files
ALTER TABLE patient_treatment_plans DROP CONSTRAINT IF EXISTS patient_treatment_plans_status_check;
ALTER TABLE patient_treatment_plans ADD CONSTRAINT patient_treatment_plans_status_check
CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- ============================================
-- BƯỚC 1: TẠO BASE ROLES (3 loại cố định)
-- ============================================
-- Base roles xác định LAYOUT FE (AdminLayout/EmployeeLayout/PatientLayout)

INSERT INTO base_roles (base_role_id, base_role_name, description, is_active, created_at)
VALUES
(1, 'admin', 'Admin Portal - Quản trị viên hệ thống', TRUE, NOW()),
(2, 'employee', 'Employee Portal - Nhân viên phòng khám', TRUE, NOW()),
(3, 'patient', 'Patient Portal - Bệnh nhân', TRUE, NOW())
ON CONFLICT (base_role_id) DO NOTHING;


-- ============================================
-- BƯỚC 2: TẠO CÁC VAI TRÒ (ROLES)
-- ============================================
-- Mỗi role có base_role_id xác định layout FE
-- FE tự xử lý routing dựa trên baseRole và permissions
-- ============================================

INSERT INTO roles (role_id, role_name, base_role_id, description, requires_specialization, is_active, created_at)
VALUES
-- Admin Portal (base_role_id = 1)
('ROLE_ADMIN', 'ROLE_ADMIN', 1, 'Quản trị viên hệ thống - Toàn quyền quản lý', FALSE, TRUE, NOW()),

-- Employee Portal (base_role_id = 2)
('ROLE_DENTIST', 'ROLE_DENTIST', 2, 'Bác sĩ nha khoa - Khám và điều trị bệnh nhân', TRUE, TRUE, NOW()),
('ROLE_NURSE', 'ROLE_NURSE', 2, 'Y tá - Hỗ trợ điều trị và chăm sóc bệnh nhân', TRUE, TRUE, NOW()),
('ROLE_RECEPTIONIST', 'ROLE_RECEPTIONIST', 2, 'Lễ tân - Tiếp đón và quản lý lịch hẹn', FALSE, TRUE, NOW()),
('ROLE_ACCOUNTANT', 'ROLE_ACCOUNTANT', 2, 'Kế toán - Quản lý tài chính và thanh toán', FALSE, TRUE, NOW()),
('ROLE_INVENTORY_MANAGER', 'ROLE_INVENTORY_MANAGER', 2, 'Quản lý kho - Quản lý vật tư và thuốc men', FALSE, TRUE, NOW()),
('ROLE_MANAGER', 'ROLE_MANAGER', 2, 'Quản lý - Quản lý vận hành và nhân sự', FALSE, TRUE, NOW()),
('ROLE_DENTIST_INTERN', 'ROLE_DENTIST_INTERN', 2, 'Thực tập sinh nha khoa', FALSE, TRUE, NOW()),

-- Patient Portal (base_role_id = 3)
('ROLE_PATIENT', 'ROLE_PATIENT', 3, 'Bệnh nhân - Xem hồ sơ và đặt lịch khám', FALSE, TRUE, NOW())
ON CONFLICT (role_id) DO NOTHING;


-- ============================================
-- BƯỚC 3: TẠO CÁC QUYỀN (PERMISSIONS) - MERGED MODULES
-- ============================================
-- 10 modules sau khi merge (giảm từ 12 modules):
-- 1. ACCOUNT (4 perms)
-- 2. EMPLOYEE (6 perms)
-- 3. PATIENT (4 perms)
-- 4. TREATMENT (3 perms)
-- 5. APPOINTMENT (5 perms)
-- 6. CUSTOMER_MANAGEMENT (8 perms) = CONTACT + CONTACT_HISTORY
-- 7. SCHEDULE_MANAGEMENT (27 perms) = WORK_SHIFTS + REGISTRATION + SHIFT_RENEWAL
-- 8. LEAVE_MANAGEMENT (29 perms) = TIME_OFF + OVERTIME + TIME_OFF_MANAGEMENT
-- 9. SYSTEM_CONFIGURATION (12 perms) = ROLE + PERMISSION + SPECIALIZATION
-- 10. HOLIDAY (4 perms) = Holiday Management (NEW)
--
-- ============================================

-- MODULE 1: ACCOUNT
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_ACCOUNT', 'VIEW_ACCOUNT', 'ACCOUNT', 'Xem danh sách tài khoản', 10, NULL, TRUE, NOW()),
('CREATE_ACCOUNT', 'CREATE_ACCOUNT', 'ACCOUNT', 'Tạo tài khoản mới', 11, NULL, TRUE, NOW()),
('UPDATE_ACCOUNT', 'UPDATE_ACCOUNT', 'ACCOUNT', 'Cập nhật tài khoản', 12, NULL, TRUE, NOW()),
('DELETE_ACCOUNT', 'DELETE_ACCOUNT', 'ACCOUNT', 'Xóa tài khoản', 13, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 2: EMPLOYEE
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_EMPLOYEE', 'VIEW_EMPLOYEE', 'EMPLOYEE', 'Xem danh sách nhân viên', 20, NULL, TRUE, NOW()),
('READ_ALL_EMPLOYEES', 'READ_ALL_EMPLOYEES', 'EMPLOYEE', 'Đọc tất cả thông tin nhân viên', 21, NULL, TRUE, NOW()),
('READ_EMPLOYEE_BY_CODE', 'READ_EMPLOYEE_BY_CODE', 'EMPLOYEE', 'Đọc thông tin nhân viên theo mã', 22, NULL, TRUE, NOW()),
('CREATE_EMPLOYEE', 'CREATE_EMPLOYEE', 'EMPLOYEE', 'Tạo nhân viên mới', 23, NULL, TRUE, NOW()),
('UPDATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'EMPLOYEE', 'Cập nhật thông tin nhân viên', 24, NULL, TRUE, NOW()),
('DELETE_EMPLOYEE', 'DELETE_EMPLOYEE', 'EMPLOYEE', 'Xóa nhân viên', 25, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 3: PATIENT
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_PATIENT', 'VIEW_PATIENT', 'PATIENT', 'Xem danh sách bệnh nhân', 30, NULL, TRUE, NOW()),
('CREATE_PATIENT', 'CREATE_PATIENT', 'PATIENT', 'Tạo hồ sơ bệnh nhân mới', 31, NULL, TRUE, NOW()),
('UPDATE_PATIENT', 'UPDATE_PATIENT', 'PATIENT', 'Cập nhật hồ sơ bệnh nhân', 32, NULL, TRUE, NOW()),
('DELETE_PATIENT', 'DELETE_PATIENT', 'PATIENT', 'Xóa hồ sơ bệnh nhân', 33, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 4: TREATMENT
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_TREATMENT', 'VIEW_TREATMENT', 'TREATMENT', 'Xem danh sách điều trị', 40, NULL, TRUE, NOW()),
('CREATE_TREATMENT', 'CREATE_TREATMENT', 'TREATMENT', 'Tạo phác đồ điều trị mới', 41, NULL, TRUE, NOW()),
('UPDATE_TREATMENT', 'UPDATE_TREATMENT', 'TREATMENT', 'Cập nhật phác đồ điều trị', 42, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 5: APPOINTMENT
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_APPOINTMENT', 'VIEW_APPOINTMENT', 'APPOINTMENT', 'Xem danh sách lịch hẹn (deprecated - use VIEW_APPOINTMENT_ALL or VIEW_APPOINTMENT_OWN)', 50, NULL, TRUE, NOW()),
-- NEW: RBAC-compliant permissions (P3.3)
('VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_ALL', 'APPOINTMENT', 'Xem TẤT CẢ lịch hẹn (Lễ tân/Quản lý)', 51, NULL, TRUE, NOW()),
('VIEW_APPOINTMENT_OWN', 'VIEW_APPOINTMENT_OWN', 'APPOINTMENT', 'Chỉ xem lịch hẹn LIÊN QUAN (Bác sĩ/Y tá/Observer/Bệnh nhân)', 52, 'VIEW_APPOINTMENT_ALL', TRUE, NOW()),
('CREATE_APPOINTMENT', 'CREATE_APPOINTMENT', 'APPOINTMENT', 'Đặt lịch hẹn mới', 53, NULL, TRUE, NOW()),
('UPDATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'APPOINTMENT', 'Cập nhật lịch hẹn', 54, NULL, TRUE, NOW()),
('UPDATE_APPOINTMENT_STATUS', 'UPDATE_APPOINTMENT_STATUS', 'APPOINTMENT', 'Cập nhật trạng thái lịch hẹn (Check-in, In-progress, Completed, Cancelled) - API 3.5', 55, NULL, TRUE, NOW()),
('DELAY_APPOINTMENT', 'DELAY_APPOINTMENT', 'APPOINTMENT', 'Hoãn lịch hẹn sang thời gian khác (chỉ SCHEDULED/CHECKED_IN) - API 3.6', 56, NULL, TRUE, NOW()),
('CANCEL_APPOINTMENT', 'CANCEL_APPOINTMENT', 'APPOINTMENT', 'Hủy lịch hẹn', 57, NULL, TRUE, NOW()),
('DELETE_APPOINTMENT', 'DELETE_APPOINTMENT', 'APPOINTMENT', 'Xóa lịch hẹn', 58, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 6: CUSTOMER_MANAGEMENT (MERGED: CONTACT + CONTACT_HISTORY)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- Contact management
('VIEW_CONTACT', 'VIEW_CONTACT', 'CUSTOMER_MANAGEMENT', 'Xem danh sách liên hệ khách hàng', 60, NULL, TRUE, NOW()),
('CREATE_CONTACT', 'CREATE_CONTACT', 'CUSTOMER_MANAGEMENT', 'Tạo liên hệ khách hàng mới', 61, NULL, TRUE, NOW()),
('UPDATE_CONTACT', 'UPDATE_CONTACT', 'CUSTOMER_MANAGEMENT', 'Cập nhật liên hệ khách hàng', 62, NULL, TRUE, NOW()),
('DELETE_CONTACT', 'DELETE_CONTACT', 'CUSTOMER_MANAGEMENT', 'Xóa liên hệ khách hàng', 63, NULL, TRUE, NOW()),
-- Contact history
('VIEW_CONTACT_HISTORY', 'VIEW_CONTACT_HISTORY', 'CUSTOMER_MANAGEMENT', 'Xem lịch sử liên hệ', 64, NULL, TRUE, NOW()),
('CREATE_CONTACT_HISTORY', 'CREATE_CONTACT_HISTORY', 'CUSTOMER_MANAGEMENT', 'Tạo lịch sử liên hệ', 65, NULL, TRUE, NOW()),
('UPDATE_CONTACT_HISTORY', 'UPDATE_CONTACT_HISTORY', 'CUSTOMER_MANAGEMENT', 'Cập nhật lịch sử liên hệ', 66, NULL, TRUE, NOW()),
('DELETE_CONTACT_HISTORY', 'DELETE_CONTACT_HISTORY', 'CUSTOMER_MANAGEMENT', 'Xóa lịch sử liên hệ', 67, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 7: SCHEDULE_MANAGEMENT (MERGED: WORK_SHIFTS + REGISTRATION + SHIFT_RENEWAL)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- Work shifts
('VIEW_WORK_SHIFTS', 'VIEW_WORK_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Xem danh sách mẫu ca làm việc', 80, NULL, TRUE, NOW()),
('CREATE_WORK_SHIFTS', 'CREATE_WORK_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Tạo mẫu ca làm việc mới', 81, NULL, TRUE, NOW()),
('UPDATE_WORK_SHIFTS', 'UPDATE_WORK_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Cập nhật mẫu ca làm việc', 82, NULL, TRUE, NOW()),
('DELETE_WORK_SHIFTS', 'DELETE_WORK_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Xóa mẫu ca làm việc', 83, NULL, TRUE, NOW()),
-- Part-time slot management (V2 - BE-307)
('MANAGE_WORK_SLOTS', 'MANAGE_WORK_SLOTS', 'SCHEDULE_MANAGEMENT', 'Quản lý suất part-time (tạo/sửa/xóa)', 84, NULL, TRUE, NOW()),
('VIEW_AVAILABLE_SLOTS', 'VIEW_AVAILABLE_SLOTS', 'SCHEDULE_MANAGEMENT', 'Xem suất part-time khả dụng', 85, NULL, TRUE, NOW()),
-- Part-time registration approval (BE-403)
('MANAGE_PART_TIME_REGISTRATIONS', 'MANAGE_PART_TIME_REGISTRATIONS', 'SCHEDULE_MANAGEMENT', 'Duyệt/từ chối đăng ký part-time', 86, NULL, TRUE, NOW()),
-- Shift registration (parent-child pattern)
('VIEW_REGISTRATION_ALL', 'VIEW_REGISTRATION_ALL', 'SCHEDULE_MANAGEMENT', 'Xem tất cả đăng ký ca làm việc', 90, NULL, TRUE, NOW()),
('VIEW_REGISTRATION_OWN', 'VIEW_REGISTRATION_OWN', 'SCHEDULE_MANAGEMENT', 'Xem đăng ký ca làm việc của bản thân', 91, 'VIEW_REGISTRATION_ALL', TRUE, NOW()),
('CREATE_REGISTRATION', 'CREATE_REGISTRATION', 'SCHEDULE_MANAGEMENT', 'Tạo đăng ký ca làm việc', 92, NULL, TRUE, NOW()),
('UPDATE_REGISTRATION', 'UPDATE_REGISTRATION', 'SCHEDULE_MANAGEMENT', 'Cập nhật đăng ký ca', 93, NULL, TRUE, NOW()),
('UPDATE_REGISTRATIONS_ALL', 'UPDATE_REGISTRATIONS_ALL', 'SCHEDULE_MANAGEMENT', 'Cập nhật tất cả đăng ký ca', 93, NULL, TRUE, NOW()),
('UPDATE_REGISTRATION_OWN', 'UPDATE_REGISTRATION_OWN', 'SCHEDULE_MANAGEMENT', 'Cập nhật đăng ký ca của bản thân', 94, 'UPDATE_REGISTRATIONS_ALL', TRUE, NOW()),
('CANCEL_REGISTRATION_OWN', 'CANCEL_REGISTRATION_OWN', 'SCHEDULE_MANAGEMENT', 'Hủy đăng ký ca của bản thân', 95, NULL, TRUE, NOW()),
('DELETE_REGISTRATION', 'DELETE_REGISTRATION', 'SCHEDULE_MANAGEMENT', 'Xóa đăng ký ca', 96, NULL, TRUE, NOW()),
('DELETE_REGISTRATION_ALL', 'DELETE_REGISTRATION_ALL', 'SCHEDULE_MANAGEMENT', 'Xóa tất cả đăng ký ca', 97, NULL, TRUE, NOW()),
('DELETE_REGISTRATION_OWN', 'DELETE_REGISTRATION_OWN', 'SCHEDULE_MANAGEMENT', 'Xóa đăng ký ca của bản thân', 98, 'DELETE_REGISTRATION_ALL', TRUE, NOW()),
-- Shift renewal
('VIEW_RENEWAL_OWN', 'VIEW_RENEWAL_OWN', 'SCHEDULE_MANAGEMENT', 'Xem yêu cầu gia hạn ca của bản thân', 99, NULL, TRUE, NOW()),
('RESPOND_RENEWAL_OWN', 'RESPOND_RENEWAL_OWN', 'SCHEDULE_MANAGEMENT', 'Phản hồi yêu cầu gia hạn ca của bản thân', 100, NULL, TRUE, NOW()),
-- Employee shift management (BE-302)
('VIEW_SHIFTS_ALL', 'VIEW_SHIFTS_ALL', 'SCHEDULE_MANAGEMENT', 'Xem tất cả ca làm việc nhân viên', 101, NULL, TRUE, NOW()),
('VIEW_SHIFTS_OWN', 'VIEW_SHIFTS_OWN', 'SCHEDULE_MANAGEMENT', 'Xem ca làm việc của bản thân', 102, 'VIEW_SHIFTS_ALL', TRUE, NOW()),
('VIEW_SHIFTS_SUMMARY', 'VIEW_SHIFTS_SUMMARY', 'SCHEDULE_MANAGEMENT', 'Xem thống kê ca làm việc', 103, NULL, TRUE, NOW()),
('CREATE_SHIFTS', 'CREATE_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Tạo ca làm việc thủ công', 104, NULL, TRUE, NOW()),
('UPDATE_SHIFTS', 'UPDATE_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Cập nhật ca làm việc', 105, NULL, TRUE, NOW()),
('DELETE_SHIFTS', 'DELETE_SHIFTS', 'SCHEDULE_MANAGEMENT', 'Hủy ca làm việc', 106, NULL, TRUE, NOW()),
-- Fixed shift registration management (BE-307 V2)
('MANAGE_FIXED_REGISTRATIONS', 'MANAGE_FIXED_REGISTRATIONS', 'SCHEDULE_MANAGEMENT', 'Quản lý đăng ký ca cố định (tạo/sửa/xóa)', 107, NULL, TRUE, NOW()),
('VIEW_FIXED_REGISTRATIONS_ALL', 'VIEW_FIXED_REGISTRATIONS_ALL', 'SCHEDULE_MANAGEMENT', 'Xem tất cả đăng ký ca cố định', 108, NULL, TRUE, NOW()),
('VIEW_FIXED_REGISTRATIONS_OWN', 'VIEW_FIXED_REGISTRATIONS_OWN', 'SCHEDULE_MANAGEMENT', 'Xem đăng ký ca cố định của bản thân', 109, 'VIEW_FIXED_REGISTRATIONS_ALL', TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 8: LEAVE_MANAGEMENT (MERGED: TIME_OFF + OVERTIME + TIME_OFF_MANAGEMENT)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- View permissions (parent-child)
('VIEW_LEAVE_ALL', 'VIEW_LEAVE_ALL', 'LEAVE_MANAGEMENT', 'Xem tất cả yêu cầu nghỉ phép & tăng ca', 110, NULL, TRUE, NOW()),
('VIEW_LEAVE_OWN', 'VIEW_LEAVE_OWN', 'LEAVE_MANAGEMENT', 'Xem yêu cầu nghỉ phép & tăng ca của bản thân', 111, 'VIEW_LEAVE_ALL', TRUE, NOW()),
-- Time-off view aliases (for AuthoritiesConstants compatibility)
('VIEW_TIMEOFF_ALL', 'VIEW_TIMEOFF_ALL', 'LEAVE_MANAGEMENT', 'Xem tất cả yêu cầu nghỉ phép (alias)', 112, NULL, TRUE, NOW()),
('VIEW_TIMEOFF_OWN', 'VIEW_TIMEOFF_OWN', 'LEAVE_MANAGEMENT', 'Xem yêu cầu nghỉ phép của bản thân (alias)', 113, 'VIEW_TIMEOFF_ALL', TRUE, NOW()),
-- Overtime view permissions (aliases for compatibility with AuthoritiesConstants)
('VIEW_OT_ALL', 'VIEW_OT_ALL', 'LEAVE_MANAGEMENT', 'Xem tất cả yêu cầu tăng ca', 114, NULL, TRUE, NOW()),
('VIEW_OT_OWN', 'VIEW_OT_OWN', 'LEAVE_MANAGEMENT', 'Xem yêu cầu tăng ca của bản thân', 115, 'VIEW_OT_ALL', TRUE, NOW()),
('CREATE_OT', 'CREATE_OT', 'LEAVE_MANAGEMENT', 'Tạo yêu cầu tăng ca (alias)', 116, NULL, TRUE, NOW()),
('APPROVE_OT', 'APPROVE_OT', 'LEAVE_MANAGEMENT', 'Phê duyệt yêu cầu tăng ca (alias)', 117, NULL, TRUE, NOW()),
('REJECT_OT', 'REJECT_OT', 'LEAVE_MANAGEMENT', 'Từ chối yêu cầu tăng ca (alias)', 118, NULL, TRUE, NOW()),
('CANCEL_OT_OWN', 'CANCEL_OT_OWN', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu tăng ca của bản thân (alias)', 119, NULL, TRUE, NOW()),
('CANCEL_OT_PENDING', 'CANCEL_OT_PENDING', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu tăng ca đang chờ (alias)', 120, NULL, TRUE, NOW()),
-- Time off actions
('CREATE_TIME_OFF', 'CREATE_TIME_OFF', 'LEAVE_MANAGEMENT', 'Tạo yêu cầu nghỉ phép', 125, NULL, TRUE, NOW()),
('CREATE_TIMEOFF', 'CREATE_TIMEOFF', 'LEAVE_MANAGEMENT', 'Tạo yêu cầu nghỉ phép (alias)', 126, NULL, TRUE, NOW()),
('APPROVE_TIME_OFF', 'APPROVE_TIME_OFF', 'LEAVE_MANAGEMENT', 'Phê duyệt yêu cầu nghỉ phép', 127, NULL, TRUE, NOW()),
('APPROVE_TIMEOFF', 'APPROVE_TIMEOFF', 'LEAVE_MANAGEMENT', 'Phê duyệt yêu cầu nghỉ phép (alias)', 128, NULL, TRUE, NOW()),
('REJECT_TIME_OFF', 'REJECT_TIME_OFF', 'LEAVE_MANAGEMENT', 'Từ chối yêu cầu nghỉ phép', 129, NULL, TRUE, NOW()),
('REJECT_TIMEOFF', 'REJECT_TIMEOFF', 'LEAVE_MANAGEMENT', 'Từ chối yêu cầu nghỉ phép (alias)', 130, NULL, TRUE, NOW()),
('CANCEL_TIME_OFF_OWN', 'CANCEL_TIME_OFF_OWN', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu nghỉ phép của bản thân', 131, NULL, TRUE, NOW()),
('CANCEL_TIMEOFF_OWN', 'CANCEL_TIMEOFF_OWN', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu nghỉ phép của bản thân (alias)', 132, NULL, TRUE, NOW()),
('CANCEL_TIME_OFF_PENDING', 'CANCEL_TIME_OFF_PENDING', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu nghỉ phép đang chờ', 133, NULL, TRUE, NOW()),
('CANCEL_TIMEOFF_PENDING', 'CANCEL_TIMEOFF_PENDING', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu nghỉ phép đang chờ (alias)', 134, NULL, TRUE, NOW()),
-- Overtime actions
('CREATE_OVERTIME', 'CREATE_OVERTIME', 'LEAVE_MANAGEMENT', 'Tạo yêu cầu tăng ca', 140, NULL, TRUE, NOW()),
('APPROVE_OVERTIME', 'APPROVE_OVERTIME', 'LEAVE_MANAGEMENT', 'Phê duyệt yêu cầu tăng ca', 141, NULL, TRUE, NOW()),
('REJECT_OVERTIME', 'REJECT_OVERTIME', 'LEAVE_MANAGEMENT', 'Từ chối yêu cầu tăng ca', 132, NULL, TRUE, NOW()),
('CANCEL_OVERTIME_OWN', 'CANCEL_OVERTIME_OWN', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu tăng ca của bản thân', 133, NULL, TRUE, NOW()),
('CANCEL_OVERTIME_PENDING', 'CANCEL_OVERTIME_PENDING', 'LEAVE_MANAGEMENT', 'Hủy yêu cầu tăng ca đang chờ', 134, NULL, TRUE, NOW()),
-- Time off type management
('VIEW_TIMEOFF_TYPE', 'VIEW_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Xem danh sách loại nghỉ phép', 140, NULL, TRUE, NOW()),
('VIEW_TIMEOFF_TYPE_ALL', 'VIEW_TIMEOFF_TYPE_ALL', 'LEAVE_MANAGEMENT', 'Xem/Quản lý tất cả loại nghỉ phép (alias)', 141, NULL, TRUE, NOW()),
('CREATE_TIMEOFF_TYPE', 'CREATE_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Tạo loại nghỉ phép mới', 142, NULL, TRUE, NOW()),
('UPDATE_TIMEOFF_TYPE', 'UPDATE_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Cập nhật loại nghỉ phép', 143, NULL, TRUE, NOW()),
('DELETE_TIMEOFF_TYPE', 'DELETE_TIMEOFF_TYPE', 'LEAVE_MANAGEMENT', 'Xóa loại nghỉ phép', 144, NULL, TRUE, NOW()),
-- Leave balance management
('VIEW_LEAVE_BALANCE_ALL', 'VIEW_LEAVE_BALANCE_ALL', 'LEAVE_MANAGEMENT', 'Xem số dư nghỉ phép của nhân viên', 150, NULL, TRUE, NOW()),
('ADJUST_LEAVE_BALANCE', 'ADJUST_LEAVE_BALANCE', 'LEAVE_MANAGEMENT', 'Điều chỉnh số dư nghỉ phép', 151, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 9: SYSTEM_CONFIGURATION (MERGED: ROLE + PERMISSION + SPECIALIZATION)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- Role management
('VIEW_ROLE', 'VIEW_ROLE', 'SYSTEM_CONFIGURATION', 'Xem danh sách vai trò', 200, NULL, TRUE, NOW()),
('CREATE_ROLE', 'CREATE_ROLE', 'SYSTEM_CONFIGURATION', 'Tạo vai trò mới', 201, NULL, TRUE, NOW()),
('UPDATE_ROLE', 'UPDATE_ROLE', 'SYSTEM_CONFIGURATION', 'Cập nhật vai trò', 202, NULL, TRUE, NOW()),
('DELETE_ROLE', 'DELETE_ROLE', 'SYSTEM_CONFIGURATION', 'Xóa vai trò', 203, NULL, TRUE, NOW()),
-- Permission management
('VIEW_PERMISSION', 'VIEW_PERMISSION', 'SYSTEM_CONFIGURATION', 'Xem danh sách quyền', 210, NULL, TRUE, NOW()),
('CREATE_PERMISSION', 'CREATE_PERMISSION', 'SYSTEM_CONFIGURATION', 'Tạo quyền mới', 211, NULL, TRUE, NOW()),
('UPDATE_PERMISSION', 'UPDATE_PERMISSION', 'SYSTEM_CONFIGURATION', 'Cập nhật quyền', 212, NULL, TRUE, NOW()),
('DELETE_PERMISSION', 'DELETE_PERMISSION', 'SYSTEM_CONFIGURATION', 'Xóa quyền', 213, NULL, TRUE, NOW()),
-- Specialization management
('VIEW_SPECIALIZATION', 'VIEW_SPECIALIZATION', 'SYSTEM_CONFIGURATION', 'Xem danh sách chuyên khoa', 220, NULL, TRUE, NOW()),
('CREATE_SPECIALIZATION', 'CREATE_SPECIALIZATION', 'SYSTEM_CONFIGURATION', 'Tạo chuyên khoa mới', 221, NULL, TRUE, NOW()),
('UPDATE_SPECIALIZATION', 'UPDATE_SPECIALIZATION', 'SYSTEM_CONFIGURATION', 'Cập nhật chuyên khoa', 222, NULL, TRUE, NOW()),
('DELETE_SPECIALIZATION', 'DELETE_SPECIALIZATION', 'SYSTEM_CONFIGURATION', 'Xóa chuyên khoa', 223, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 10: HOLIDAY (Holiday Management)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_HOLIDAY', 'VIEW_HOLIDAY', 'HOLIDAY', 'Xem danh sách ngày nghỉ lễ', 230, NULL, TRUE, NOW()),
('CREATE_HOLIDAY', 'CREATE_HOLIDAY', 'HOLIDAY', 'Tạo ngày nghỉ lễ mới', 231, NULL, TRUE, NOW()),
('UPDATE_HOLIDAY', 'UPDATE_HOLIDAY', 'HOLIDAY', 'Cập nhật ngày nghỉ lễ', 232, NULL, TRUE, NOW()),
('DELETE_HOLIDAY', 'DELETE_HOLIDAY', 'HOLIDAY', 'Xóa ngày nghỉ lễ', 233, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 11: ROOM_MANAGEMENT (Quản lý phòng khám/ghế nha khoa)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- Room management
('VIEW_ROOM', 'VIEW_ROOM', 'ROOM_MANAGEMENT', 'Xem danh sách và chi tiết phòng', 240, NULL, TRUE, NOW()),
('CREATE_ROOM', 'CREATE_ROOM', 'ROOM_MANAGEMENT', 'Tạo phòng/ghế mới', 241, NULL, TRUE, NOW()),
('UPDATE_ROOM', 'UPDATE_ROOM', 'ROOM_MANAGEMENT', 'Cập nhật thông tin phòng', 242, NULL, TRUE, NOW()),
('DELETE_ROOM', 'DELETE_ROOM', 'ROOM_MANAGEMENT', 'Vô hiệu hóa phòng (soft delete)', 243, NULL, TRUE, NOW()),
-- V16: Room-Service compatibility management
('UPDATE_ROOM_SERVICES', 'UPDATE_ROOM_SERVICES', 'ROOM_MANAGEMENT', 'Gán/cập nhật dịch vụ cho phòng', 244, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 12: SERVICE_MANAGEMENT (Quản lý danh mục dịch vụ nha khoa)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- Service management
('VIEW_SERVICE', 'VIEW_SERVICE', 'SERVICE_MANAGEMENT', 'Xem danh sách và chi tiết dịch vụ', 250, NULL, TRUE, NOW()),
('CREATE_SERVICE', 'CREATE_SERVICE', 'SERVICE_MANAGEMENT', 'Tạo dịch vụ mới', 251, NULL, TRUE, NOW()),
('UPDATE_SERVICE', 'UPDATE_SERVICE', 'SERVICE_MANAGEMENT', 'Cập nhật thông tin dịch vụ', 252, NULL, TRUE, NOW()),
('DELETE_SERVICE', 'DELETE_SERVICE', 'SERVICE_MANAGEMENT', 'Vô hiệu hóa dịch vụ (soft delete)', 253, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 13: TREATMENT_PLAN (Quản lý phác đồ điều trị bệnh nhân)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
-- Treatment plan management (RBAC: ALL vs OWN pattern)
('VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_ALL', 'TREATMENT_PLAN', 'Xem TẤT CẢ phác đồ điều trị (Bác sĩ/Lễ tân)', 260, NULL, TRUE, NOW()),
('VIEW_ALL_TREATMENT_PLANS', 'VIEW_ALL_TREATMENT_PLANS', 'TREATMENT_PLAN', 'Xem danh sách lộ trình toàn hệ thống (Manager)', 261, NULL, TRUE, NOW()),
('VIEW_TREATMENT_PLAN_OWN', 'VIEW_TREATMENT_PLAN_OWN', 'TREATMENT_PLAN', 'Chỉ xem phác đồ điều trị của bản thân (Bệnh nhân)', 262, 'VIEW_TREATMENT_PLAN_ALL', TRUE, NOW()),
('CREATE_TREATMENT_PLAN', 'CREATE_TREATMENT_PLAN', 'TREATMENT_PLAN', 'Tạo phác đồ điều trị mới', 263, NULL, TRUE, NOW()),
('UPDATE_TREATMENT_PLAN', 'UPDATE_TREATMENT_PLAN', 'TREATMENT_PLAN', 'Cập nhật phác đồ điều trị', 264, NULL, TRUE, NOW()),
('DELETE_TREATMENT_PLAN', 'DELETE_TREATMENT_PLAN', 'TREATMENT_PLAN', 'Vô hiệu hóa phác đồ (soft delete)', 265, NULL, TRUE, NOW()),
('APPROVE_TREATMENT_PLAN', 'APPROVE_TREATMENT_PLAN', 'TREATMENT_PLAN', 'Duyệt/Từ chối lộ trình điều trị', 266, NULL, TRUE, NOW()),
('MANAGE_PLAN_PRICING', 'MANAGE_PLAN_PRICING', 'TREATMENT_PLAN', 'Điều chỉnh giá/chiết khấu phác đồ điều trị', 267, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- MODULE 14: WAREHOUSE (Quản lý kho vật tư API 6.6, 6.7, 6.9)
INSERT INTO permissions (permission_id, permission_name, module, description, display_order, parent_permission_id, is_active, created_at)
VALUES
('VIEW_ITEMS', 'VIEW_ITEMS', 'WAREHOUSE', 'Xem danh sách vật tư (cho Bác sĩ/Lễ tân)', 269, NULL, TRUE, NOW()),
('VIEW_MEDICINES', 'VIEW_MEDICINES', 'WAREHOUSE', 'Xem và tìm kiếm thuốc men (chỉ MEDICINE category) - Cho Bác sĩ kê đơn - API 6.1.1', 268, NULL, TRUE, NOW()),
('VIEW_WAREHOUSE', 'VIEW_WAREHOUSE', 'WAREHOUSE', 'Xem danh sách giao dịch kho', 270, NULL, TRUE, NOW()),
('CREATE_ITEMS', 'CREATE_ITEMS', 'WAREHOUSE', 'Tạo vật tư mới với hệ thống đơn vị', 271, NULL, TRUE, NOW()),
('UPDATE_ITEMS', 'UPDATE_ITEMS', 'WAREHOUSE', 'Cập nhật thông tin vật tư và đơn vị tính', 272, NULL, TRUE, NOW()),
('CREATE_WAREHOUSE', 'CREATE_WAREHOUSE', 'WAREHOUSE', 'Tạo danh mục, nhà cung cấp', 273, NULL, TRUE, NOW()),
('UPDATE_WAREHOUSE', 'UPDATE_WAREHOUSE', 'WAREHOUSE', 'Cập nhật danh mục, nhà cung cấp', 274, NULL, TRUE, NOW()),
('DELETE_WAREHOUSE', 'DELETE_WAREHOUSE', 'WAREHOUSE', 'Xóa vật tư, danh mục, nhà cung cấp', 275, NULL, TRUE, NOW()),
('VIEW_WAREHOUSE_COST', 'VIEW_WAREHOUSE_COST', 'WAREHOUSE', 'Xem giá tiền kho (unitCost, totalValue, totalCost) - Chỉ Admin/Kế toán', 276, NULL, TRUE, NOW()),
('IMPORT_ITEMS', 'IMPORT_ITEMS', 'WAREHOUSE', 'Tạo phiếu nhập kho', 277, NULL, TRUE, NOW()),
('EXPORT_ITEMS', 'EXPORT_ITEMS', 'WAREHOUSE', 'Tạo phiếu xuất kho', 278, NULL, TRUE, NOW()),
('DISPOSE_ITEMS', 'DISPOSE_ITEMS', 'WAREHOUSE', 'Tạo phiếu thanh lý', 279, NULL, TRUE, NOW()),
('APPROVE_TRANSACTION', 'APPROVE_TRANSACTION', 'WAREHOUSE', 'Duyệt/Từ chối phiếu nhập xuất kho', 280, NULL, TRUE, NOW()),
('CANCEL_WAREHOUSE', 'CANCEL_WAREHOUSE', 'WAREHOUSE', 'Hủy phiếu nhập xuất kho (API 6.6.3)', 281, NULL, TRUE, NOW()),
('MANAGE_SUPPLIERS', 'MANAGE_SUPPLIERS', 'WAREHOUSE', 'Quản lý nhà cung cấp (API 6.13, 6.14)', 282, NULL, TRUE, NOW()),
('MANAGE_CONSUMABLES', 'MANAGE_CONSUMABLES', 'WAREHOUSE', 'Quản lý định mức tiêu hao vật tư (BOM) - API 6.18, 6.19', 283, NULL, TRUE, NOW()),
('MANAGE_WAREHOUSE', 'MANAGE_WAREHOUSE', 'WAREHOUSE', 'Toàn quyền quản lý kho', 284, NULL, TRUE, NOW()),
('WRITE_CLINICAL_RECORD', 'WRITE_CLINICAL_RECORD', 'CLINICAL_RECORDS', 'Tạo và cập nhật bệnh án, thêm thủ thuật (API 8.5, 9.2, 9.3)', 285, NULL, TRUE, NOW()),
('UPLOAD_ATTACHMENT', 'UPLOAD_ATTACHMENT', 'CLINICAL_RECORDS', 'Upload file đính kèm vào bệnh án (X-quang, ảnh, PDF) - API 8.11', 286, NULL, TRUE, NOW()),
('VIEW_ATTACHMENT', 'VIEW_ATTACHMENT', 'CLINICAL_RECORDS', 'Xem danh sách file đính kèm của bệnh án - API 8.12', 287, NULL, TRUE, NOW()),
('DELETE_ATTACHMENT', 'DELETE_ATTACHMENT', 'CLINICAL_RECORDS', 'Xóa file đính kèm (chỉ Admin hoặc người upload) - API 8.13', 288, NULL, TRUE, NOW())
ON CONFLICT (permission_id) DO NOTHING;


-- ============================================
-- BƯỚC 4: PHÂN QUYỀN CHO CÁC VAI TRÒ
-- ============================================

-- Admin có TẤT CẢ quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ROLE_ADMIN', permission_id FROM permissions WHERE is_active = TRUE
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Dentist (Fix: ROLE_DENTIST → ROLE_DENTIST)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_PATIENT'), ('ROLE_DENTIST', 'UPDATE_PATIENT'),
('ROLE_DENTIST', 'VIEW_TREATMENT'), ('ROLE_DENTIST', 'CREATE_TREATMENT'), ('ROLE_DENTIST', 'UPDATE_TREATMENT'),
('ROLE_DENTIST', 'VIEW_APPOINTMENT'), -- Deprecated
('ROLE_DENTIST', 'VIEW_APPOINTMENT_OWN'), -- NEW: Only see own appointments
('ROLE_DENTIST', 'UPDATE_APPOINTMENT_STATUS'), -- NEW API 3.5: Start, Complete treatment
('ROLE_DENTIST', 'DELAY_APPOINTMENT'), -- NEW API 3.6: Delay appointment when needed
('ROLE_DENTIST', 'VIEW_REGISTRATION_OWN'), ('ROLE_DENTIST', 'VIEW_RENEWAL_OWN'), ('ROLE_DENTIST', 'RESPOND_RENEWAL_OWN'),
('ROLE_DENTIST', 'CREATE_REGISTRATION'),
('ROLE_DENTIST', 'VIEW_LEAVE_OWN'), ('ROLE_DENTIST', 'CREATE_TIME_OFF'), ('ROLE_DENTIST', 'CREATE_OVERTIME'),
('ROLE_DENTIST', 'CANCEL_TIME_OFF_OWN'), ('ROLE_DENTIST', 'CANCEL_OVERTIME_OWN'),
('ROLE_DENTIST', 'VIEW_HOLIDAY'),
-- Treatment Plan permissions
('ROLE_DENTIST', 'VIEW_TREATMENT_PLAN_OWN'),
('ROLE_DENTIST', 'CREATE_TREATMENT_PLAN'),
('ROLE_DENTIST', 'UPDATE_TREATMENT_PLAN'),
('ROLE_DENTIST', 'DELETE_TREATMENT_PLAN'),
('ROLE_DENTIST', 'VIEW_SERVICE'),
('ROLE_DENTIST', 'VIEW_ITEMS'),
('ROLE_DENTIST', 'VIEW_MEDICINES'),
('ROLE_DENTIST', 'WRITE_CLINICAL_RECORD'),
('ROLE_DENTIST', 'UPLOAD_ATTACHMENT'),
('ROLE_DENTIST', 'VIEW_ATTACHMENT'),
('ROLE_DENTIST', 'DELETE_ATTACHMENT')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Nurse
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_NURSE', 'VIEW_PATIENT'), ('ROLE_NURSE', 'VIEW_TREATMENT'),
('ROLE_NURSE', 'VIEW_APPOINTMENT'), -- Deprecated
('ROLE_NURSE', 'VIEW_APPOINTMENT_OWN'), -- NEW: Only see participating appointments
('ROLE_NURSE', 'UPDATE_APPOINTMENT_STATUS'), -- NEW API 3.5: Help check-in patients
('ROLE_NURSE', 'VIEW_REGISTRATION_OWN'), ('ROLE_NURSE', 'VIEW_RENEWAL_OWN'), ('ROLE_NURSE', 'RESPOND_RENEWAL_OWN'),
('ROLE_NURSE', 'CREATE_REGISTRATION'),
('ROLE_NURSE', 'VIEW_LEAVE_OWN'), ('ROLE_NURSE', 'CREATE_TIME_OFF'), ('ROLE_NURSE', 'CREATE_OVERTIME'),
('ROLE_NURSE', 'CANCEL_TIME_OFF_OWN'), ('ROLE_NURSE', 'CANCEL_OVERTIME_OWN'),
('ROLE_NURSE', 'VIEW_HOLIDAY'),
('ROLE_NURSE', 'VIEW_ATTACHMENT')
ON CONFLICT (role_id, permission_id) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST_INTERN', 'VIEW_APPOINTMENT_OWN'), -- Chỉ thấy appointments họ tham gia
('ROLE_DENTIST_INTERN', 'VIEW_PATIENT'), -- Chỉ xem thông tin cơ bản bệnh nhân (không có medical history)
('ROLE_DENTIST_INTERN', 'VIEW_REGISTRATION_OWN'), -- Xem ca làm của mình
('ROLE_DENTIST_INTERN', 'CREATE_REGISTRATION'), -- Đăng ký ca làm
('ROLE_DENTIST_INTERN', 'VIEW_LEAVE_OWN'), -- Xem nghỉ phép của mình
('ROLE_DENTIST_INTERN', 'CREATE_TIME_OFF'), -- Tạo đơn xin nghỉ
('ROLE_DENTIST_INTERN', 'CANCEL_TIME_OFF_OWN'), -- Hủy đơn nghỉ của mình
('ROLE_DENTIST_INTERN', 'VIEW_HOLIDAY') -- Xem lịch nghỉ lễ
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Receptionist
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_RECEPTIONIST', 'VIEW_PATIENT'), ('ROLE_RECEPTIONIST', 'CREATE_PATIENT'), ('ROLE_RECEPTIONIST', 'UPDATE_PATIENT'),
('ROLE_RECEPTIONIST', 'VIEW_APPOINTMENT'), -- Deprecated
('ROLE_RECEPTIONIST', 'VIEW_APPOINTMENT_ALL'), -- NEW: Xem TẤT CẢ lịch hẹn
('ROLE_RECEPTIONIST', 'CREATE_APPOINTMENT'),
('ROLE_RECEPTIONIST', 'UPDATE_APPOINTMENT'),
('ROLE_RECEPTIONIST', 'UPDATE_APPOINTMENT_STATUS'), -- NEW API 3.5: Check-in, In-progress, Complete
('ROLE_RECEPTIONIST', 'DELAY_APPOINTMENT'), -- NEW API 3.6: Delay appointment for patients
('ROLE_RECEPTIONIST', 'DELETE_APPOINTMENT'),
-- CUSTOMER_MANAGEMENT
('ROLE_RECEPTIONIST', 'VIEW_CONTACT'), ('ROLE_RECEPTIONIST', 'CREATE_CONTACT'),
('ROLE_RECEPTIONIST', 'UPDATE_CONTACT'), ('ROLE_RECEPTIONIST', 'DELETE_CONTACT'),
('ROLE_RECEPTIONIST', 'VIEW_CONTACT_HISTORY'), ('ROLE_RECEPTIONIST', 'CREATE_CONTACT_HISTORY'),
('ROLE_RECEPTIONIST', 'UPDATE_CONTACT_HISTORY'), ('ROLE_RECEPTIONIST', 'DELETE_CONTACT_HISTORY'),
-- SCHEDULE & LEAVE
('ROLE_RECEPTIONIST', 'VIEW_REGISTRATION_OWN'),
('ROLE_RECEPTIONIST', 'CREATE_REGISTRATION'),
('ROLE_RECEPTIONIST', 'VIEW_LEAVE_OWN'), ('ROLE_RECEPTIONIST', 'CREATE_TIME_OFF'), ('ROLE_RECEPTIONIST', 'CREATE_OVERTIME'),
('ROLE_RECEPTIONIST', 'CANCEL_TIME_OFF_OWN'), ('ROLE_RECEPTIONIST', 'CANCEL_OVERTIME_OWN'),
('ROLE_RECEPTIONIST', 'VIEW_HOLIDAY'),
('ROLE_RECEPTIONIST', 'VIEW_TREATMENT_PLAN_ALL'),
('ROLE_RECEPTIONIST', 'VIEW_WAREHOUSE'),
('ROLE_RECEPTIONIST', 'VIEW_ITEMS')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Manager (Full management permissions)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_MANAGER', 'VIEW_EMPLOYEE'), ('ROLE_MANAGER', 'CREATE_EMPLOYEE'),
('ROLE_MANAGER', 'UPDATE_EMPLOYEE'), ('ROLE_MANAGER', 'DELETE_EMPLOYEE'),
('ROLE_MANAGER', 'VIEW_PATIENT'), ('ROLE_MANAGER', 'VIEW_APPOINTMENT'),
('ROLE_MANAGER', 'VIEW_APPOINTMENT_ALL'), -- See all appointments
('ROLE_MANAGER', 'UPDATE_APPOINTMENT_STATUS'), -- NEW API 3.5: Full appointment status control
('ROLE_MANAGER', 'DELAY_APPOINTMENT'), -- NEW API 3.6: Reschedule appointments
-- CUSTOMER_MANAGEMENT
('ROLE_MANAGER', 'VIEW_CONTACT'), ('ROLE_MANAGER', 'CREATE_CONTACT'),
('ROLE_MANAGER', 'UPDATE_CONTACT'), ('ROLE_MANAGER', 'DELETE_CONTACT'),
('ROLE_MANAGER', 'VIEW_CONTACT_HISTORY'), ('ROLE_MANAGER', 'CREATE_CONTACT_HISTORY'),
('ROLE_MANAGER', 'UPDATE_CONTACT_HISTORY'), ('ROLE_MANAGER', 'DELETE_CONTACT_HISTORY'),
-- SCHEDULE_MANAGEMENT (full)
('ROLE_MANAGER', 'VIEW_WORK_SHIFTS'), ('ROLE_MANAGER', 'CREATE_WORK_SHIFTS'),
('ROLE_MANAGER', 'UPDATE_WORK_SHIFTS'), ('ROLE_MANAGER', 'DELETE_WORK_SHIFTS'),
('ROLE_MANAGER', 'MANAGE_WORK_SLOTS'), ('ROLE_MANAGER', 'VIEW_AVAILABLE_SLOTS'),
('ROLE_MANAGER', 'MANAGE_PART_TIME_REGISTRATIONS'),
('ROLE_MANAGER', 'VIEW_REGISTRATION_ALL'), ('ROLE_MANAGER', 'CREATE_REGISTRATION'),
('ROLE_MANAGER', 'UPDATE_REGISTRATION'), ('ROLE_MANAGER', 'DELETE_REGISTRATION'),
('ROLE_MANAGER', 'UPDATE_REGISTRATIONS_ALL'), ('ROLE_MANAGER', 'CANCEL_REGISTRATION_OWN'),
-- Employee shift management (BE-302)
('ROLE_MANAGER', 'VIEW_SHIFTS_ALL'), ('ROLE_MANAGER', 'VIEW_SHIFTS_SUMMARY'),
('ROLE_MANAGER', 'CREATE_SHIFTS'), ('ROLE_MANAGER', 'UPDATE_SHIFTS'), ('ROLE_MANAGER', 'DELETE_SHIFTS'),
-- Fixed shift registration management (BE-307 V2)
('ROLE_MANAGER', 'MANAGE_FIXED_REGISTRATIONS'), ('ROLE_MANAGER', 'VIEW_FIXED_REGISTRATIONS_ALL'),
-- Shift renewal management (P7)
('ROLE_MANAGER', 'VIEW_RENEWAL_OWN'), ('ROLE_MANAGER', 'RESPOND_RENEWAL_OWN'),
-- LEAVE_MANAGEMENT (full management)
('ROLE_MANAGER', 'VIEW_LEAVE_ALL'),
('ROLE_MANAGER', 'APPROVE_TIME_OFF'), ('ROLE_MANAGER', 'REJECT_TIME_OFF'), ('ROLE_MANAGER', 'CANCEL_TIME_OFF_PENDING'),
('ROLE_MANAGER', 'VIEW_OT_ALL'), ('ROLE_MANAGER', 'APPROVE_OT'), ('ROLE_MANAGER', 'REJECT_OT'), ('ROLE_MANAGER', 'CANCEL_OT_PENDING'),
('ROLE_MANAGER', 'APPROVE_OVERTIME'), ('ROLE_MANAGER', 'REJECT_OVERTIME'), ('ROLE_MANAGER', 'CANCEL_OVERTIME_PENDING'),
('ROLE_MANAGER', 'VIEW_TIMEOFF_TYPE'), ('ROLE_MANAGER', 'VIEW_TIMEOFF_TYPE_ALL'), ('ROLE_MANAGER', 'CREATE_TIMEOFF_TYPE'),
('ROLE_MANAGER', 'UPDATE_TIMEOFF_TYPE'), ('ROLE_MANAGER', 'DELETE_TIMEOFF_TYPE'),
('ROLE_MANAGER', 'VIEW_LEAVE_BALANCE_ALL'), ('ROLE_MANAGER', 'ADJUST_LEAVE_BALANCE'),
-- SYSTEM_CONFIGURATION (limited)
('ROLE_MANAGER', 'VIEW_ROLE'), ('ROLE_MANAGER', 'VIEW_SPECIALIZATION'),
('ROLE_MANAGER', 'CREATE_SPECIALIZATION'), ('ROLE_MANAGER', 'UPDATE_SPECIALIZATION'),
-- HOLIDAY
('ROLE_MANAGER', 'VIEW_HOLIDAY'),
-- ROOM_MANAGEMENT (V16: Full management of rooms and room-service compatibility)
('ROLE_MANAGER', 'VIEW_ROOM'), ('ROLE_MANAGER', 'CREATE_ROOM'),
('ROLE_MANAGER', 'UPDATE_ROOM'), ('ROLE_MANAGER', 'DELETE_ROOM'),
('ROLE_MANAGER', 'UPDATE_ROOM_SERVICES'),
-- SERVICE_MANAGEMENT (V16: Full management of services)
('ROLE_MANAGER', 'VIEW_SERVICE'), ('ROLE_MANAGER', 'CREATE_SERVICE'),
('ROLE_MANAGER', 'UPDATE_SERVICE'), ('ROLE_MANAGER', 'DELETE_SERVICE'),
-- TREATMENT_PLAN (V19/V20/V21: Full management of treatment plans)
('ROLE_MANAGER', 'VIEW_TREATMENT_PLAN_ALL'), -- Can view all patients' treatment plans
('ROLE_MANAGER', 'VIEW_ALL_TREATMENT_PLANS'), -- V21: Can view system-wide treatment plan list
('ROLE_MANAGER', 'CREATE_TREATMENT_PLAN'), -- Can create treatment plans
('ROLE_MANAGER', 'UPDATE_TREATMENT_PLAN'), -- Can update treatment plans
('ROLE_MANAGER', 'DELETE_TREATMENT_PLAN'), -- Can delete treatment plans
('ROLE_MANAGER', 'APPROVE_TREATMENT_PLAN'), -- V20: Can approve/reject treatment plans (API 5.9)
('ROLE_MANAGER', 'MANAGE_PLAN_PRICING'), -- V21: Can adjust pricing/discounts on treatment plans
('ROLE_MANAGER', 'VIEW_WAREHOUSE'),
('ROLE_MANAGER', 'VIEW_WAREHOUSE_COST'), -- Can view cost/price fields in warehouse APIs
('ROLE_MANAGER', 'VIEW_ITEMS'),
('ROLE_MANAGER', 'IMPORT_ITEMS'),
('ROLE_MANAGER', 'EXPORT_ITEMS'),
('ROLE_MANAGER', 'APPROVE_TRANSACTION'),
('ROLE_MANAGER', 'CANCEL_WAREHOUSE'), -- Can cancel import/export transactions (API 6.6.3)
('ROLE_MANAGER', 'MANAGE_SUPPLIERS'), -- V28: Can manage suppliers (API 6.13, 6.14)
('ROLE_MANAGER', 'MANAGE_CONSUMABLES'), -- V30: Can manage service consumables BOM (API 6.18, 6.19)
('ROLE_MANAGER', 'MANAGE_WAREHOUSE') -- V28: Full warehouse management authority
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Accountant & Inventory Manager (LEAVE only)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_ACCOUNTANT', 'VIEW_LEAVE_OWN'), ('ROLE_ACCOUNTANT', 'CREATE_TIME_OFF'), ('ROLE_ACCOUNTANT', 'CREATE_OVERTIME'),
('ROLE_ACCOUNTANT', 'CANCEL_TIME_OFF_OWN'), ('ROLE_ACCOUNTANT', 'CANCEL_OVERTIME_OWN'),
('ROLE_ACCOUNTANT', 'VIEW_HOLIDAY'),
-- TREATMENT_PLAN (V21: Accountant can adjust pricing - API 5.x)
('ROLE_ACCOUNTANT', 'VIEW_TREATMENT_PLAN_ALL'), -- Can view all treatment plans
('ROLE_ACCOUNTANT', 'MANAGE_PLAN_PRICING'), -- Can adjust pricing/discounts
-- WAREHOUSE (V22: Accountant can view transactions and financial data - API 6.6)
('ROLE_ACCOUNTANT', 'VIEW_WAREHOUSE'), -- Can view transaction history
('ROLE_ACCOUNTANT', 'VIEW_WAREHOUSE_COST'), -- Can view financial data (cost, payment info)
('ROLE_INVENTORY_MANAGER', 'VIEW_LEAVE_OWN'), ('ROLE_INVENTORY_MANAGER', 'CREATE_TIME_OFF'), ('ROLE_INVENTORY_MANAGER', 'CREATE_OVERTIME'),
('ROLE_INVENTORY_MANAGER', 'CANCEL_TIME_OFF_OWN'), ('ROLE_INVENTORY_MANAGER', 'CANCEL_OVERTIME_OWN'),
('ROLE_INVENTORY_MANAGER', 'VIEW_HOLIDAY'),
-- WAREHOUSE (V28: Full warehouse management - API 6.6, 6.9, 6.10, 6.11, 6.13, 6.14)
('ROLE_INVENTORY_MANAGER', 'VIEW_ITEMS'), -- Can view item list and units (API 6.8, 6.11)
('ROLE_INVENTORY_MANAGER', 'VIEW_WAREHOUSE'), -- Can view transaction history
('ROLE_INVENTORY_MANAGER', 'CREATE_ITEMS'), -- Can create item masters (API 6.9)
('ROLE_INVENTORY_MANAGER', 'UPDATE_ITEMS'), -- Can update item masters (API 6.10)
('ROLE_INVENTORY_MANAGER', 'CREATE_WAREHOUSE'), -- Can create categories/suppliers
('ROLE_INVENTORY_MANAGER', 'UPDATE_WAREHOUSE'), -- Can update items/categories/suppliers
('ROLE_INVENTORY_MANAGER', 'DELETE_WAREHOUSE'), -- Can delete items/categories/suppliers
-- REMOVED VIEW_WAREHOUSE_COST: Inventory Manager only sees quantities, NOT prices
('ROLE_INVENTORY_MANAGER', 'IMPORT_ITEMS'), -- Can create import transactions
('ROLE_INVENTORY_MANAGER', 'EXPORT_ITEMS'), -- Can create export transactions
('ROLE_INVENTORY_MANAGER', 'DISPOSE_ITEMS'), -- Can create disposal transactions
('ROLE_INVENTORY_MANAGER', 'APPROVE_TRANSACTION'), -- Can approve transactions
('ROLE_INVENTORY_MANAGER', 'CANCEL_WAREHOUSE'), -- Can cancel import/export transactions (API 6.6.3)
('ROLE_INVENTORY_MANAGER', 'MANAGE_SUPPLIERS'), -- Can manage suppliers (API 6.13, 6.14)
('ROLE_INVENTORY_MANAGER', 'MANAGE_WAREHOUSE') -- Full warehouse management authority
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Patient (basic view only)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_PATIENT', 'VIEW_PATIENT'), ('ROLE_PATIENT', 'VIEW_TREATMENT'),
('ROLE_PATIENT', 'VIEW_APPOINTMENT'), -- Deprecated (use VIEW_APPOINTMENT_OWN)
('ROLE_PATIENT', 'VIEW_APPOINTMENT_OWN'), -- NEW: Patient can view their own appointments
('ROLE_PATIENT', 'CREATE_APPOINTMENT'),
-- NEW: Treatment Plan permissions
('ROLE_PATIENT', 'VIEW_TREATMENT_PLAN_OWN'), -- Can only view their own treatment plans
('ROLE_PATIENT', 'VIEW_ATTACHMENT') -- Can view attachments of own clinical records
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant basic Overtime permissions to all employee roles (idempotent)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_OT_OWN'), ('ROLE_DENTIST', 'CREATE_OT'), ('ROLE_DENTIST', 'CANCEL_OT_OWN'),
('ROLE_NURSE', 'VIEW_OT_OWN'), ('ROLE_NURSE', 'CREATE_OT'), ('ROLE_NURSE', 'CANCEL_OT_OWN'),
('ROLE_RECEPTIONIST', 'VIEW_OT_OWN'), ('ROLE_RECEPTIONIST', 'CREATE_OT'), ('ROLE_RECEPTIONIST', 'CANCEL_OT_OWN'),
('ROLE_ACCOUNTANT', 'VIEW_OT_OWN'), ('ROLE_ACCOUNTANT', 'CREATE_OT'), ('ROLE_ACCOUNTANT', 'CANCEL_OT_OWN'),
('ROLE_INVENTORY_MANAGER', 'VIEW_OT_OWN'), ('ROLE_INVENTORY_MANAGER', 'CREATE_OT'), ('ROLE_INVENTORY_MANAGER', 'CANCEL_OT_OWN'),
('ROLE_MANAGER', 'VIEW_OT_OWN'), ('ROLE_MANAGER', 'CREATE_OT'), ('ROLE_MANAGER', 'CANCEL_OT_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant VIEW_WORK_SHIFTS to all employee roles (idempotent)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_WORK_SHIFTS'),
('ROLE_NURSE', 'VIEW_WORK_SHIFTS'),
('ROLE_RECEPTIONIST', 'VIEW_WORK_SHIFTS'),
('ROLE_ACCOUNTANT', 'VIEW_WORK_SHIFTS'),
('ROLE_INVENTORY_MANAGER', 'VIEW_WORK_SHIFTS')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant VIEW_SHIFTS_OWN to all employee roles (BE-307)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_SHIFTS_OWN'),
('ROLE_NURSE', 'VIEW_SHIFTS_OWN'),
('ROLE_RECEPTIONIST', 'VIEW_SHIFTS_OWN'),
('ROLE_ACCOUNTANT', 'VIEW_SHIFTS_OWN'),
('ROLE_INVENTORY_MANAGER', 'VIEW_SHIFTS_OWN'),
('ROLE_MANAGER', 'VIEW_SHIFTS_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant CREATE_REGISTRATION to all employee roles (idempotent) - Allow self shift registration
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'CREATE_REGISTRATION'),
('ROLE_NURSE', 'CREATE_REGISTRATION'),
('ROLE_RECEPTIONIST', 'CREATE_REGISTRATION'),
('ROLE_ACCOUNTANT', 'CREATE_REGISTRATION'),
('ROLE_INVENTORY_MANAGER', 'CREATE_REGISTRATION')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant VIEW_AVAILABLE_SLOTS to all employee roles (BE-307 V2) - Allow viewing available part-time slots
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_AVAILABLE_SLOTS'),
('ROLE_NURSE', 'VIEW_AVAILABLE_SLOTS'),
('ROLE_RECEPTIONIST', 'VIEW_AVAILABLE_SLOTS'),
('ROLE_ACCOUNTANT', 'VIEW_AVAILABLE_SLOTS'),
('ROLE_INVENTORY_MANAGER', 'VIEW_AVAILABLE_SLOTS')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant CANCEL_REGISTRATION_OWN to all employee roles (BE-307 V2) - Allow canceling own registrations
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'CANCEL_REGISTRATION_OWN'),
('ROLE_NURSE', 'CANCEL_REGISTRATION_OWN'),
('ROLE_RECEPTIONIST', 'CANCEL_REGISTRATION_OWN'),
('ROLE_ACCOUNTANT', 'CANCEL_REGISTRATION_OWN'),
('ROLE_INVENTORY_MANAGER', 'CANCEL_REGISTRATION_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant VIEW_TIMEOFF_OWN to all employee roles (idempotent)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_TIMEOFF_OWN'),
('ROLE_NURSE', 'VIEW_TIMEOFF_OWN'),
('ROLE_RECEPTIONIST', 'VIEW_TIMEOFF_OWN'),
('ROLE_ACCOUNTANT', 'VIEW_TIMEOFF_OWN'),
('ROLE_INVENTORY_MANAGER', 'VIEW_TIMEOFF_OWN'),
('ROLE_MANAGER', 'VIEW_TIMEOFF_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant UPDATE_REGISTRATION_OWN to all employee roles (idempotent) - Allow employees to edit their own shifts
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'UPDATE_REGISTRATION_OWN'),
('ROLE_NURSE', 'UPDATE_REGISTRATION_OWN'),
('ROLE_RECEPTIONIST', 'UPDATE_REGISTRATION_OWN'),
('ROLE_ACCOUNTANT', 'UPDATE_REGISTRATION_OWN'),
('ROLE_INVENTORY_MANAGER', 'UPDATE_REGISTRATION_OWN'),
('ROLE_MANAGER', 'UPDATE_REGISTRATION_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant DELETE_REGISTRATION_OWN to all employee roles (idempotent) - Allow employees to delete their own shifts
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'DELETE_REGISTRATION_OWN'),
('ROLE_NURSE', 'DELETE_REGISTRATION_OWN'),
('ROLE_RECEPTIONIST', 'DELETE_REGISTRATION_OWN'),
('ROLE_ACCOUNTANT', 'DELETE_REGISTRATION_OWN'),
('ROLE_INVENTORY_MANAGER', 'DELETE_REGISTRATION_OWN'),
('ROLE_MANAGER', 'DELETE_REGISTRATION_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant CREATE_TIMEOFF to all employee roles (idempotent) - Allow all employees to request time-off
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'CREATE_TIMEOFF'),
('ROLE_NURSE', 'CREATE_TIMEOFF'),
('ROLE_RECEPTIONIST', 'CREATE_TIMEOFF'),
('ROLE_ACCOUNTANT', 'CREATE_TIMEOFF'),
('ROLE_INVENTORY_MANAGER', 'CREATE_TIMEOFF'),
('ROLE_MANAGER', 'CREATE_TIMEOFF')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant CANCEL_TIMEOFF_OWN to all employee roles (idempotent) - Allow employees to cancel their own time-off requests
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'CANCEL_TIMEOFF_OWN'),
('ROLE_NURSE', 'CANCEL_TIMEOFF_OWN'),
('ROLE_RECEPTIONIST', 'CANCEL_TIMEOFF_OWN'),
('ROLE_ACCOUNTANT', 'CANCEL_TIMEOFF_OWN'),
('ROLE_INVENTORY_MANAGER', 'CANCEL_TIMEOFF_OWN'),
('ROLE_MANAGER', 'CANCEL_TIMEOFF_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- Grant VIEW_FIXED_REGISTRATIONS_OWN to all employee roles (BE-307 V2) - Allow viewing own fixed registrations
INSERT INTO role_permissions (role_id, permission_id)
VALUES
('ROLE_DENTIST', 'VIEW_FIXED_REGISTRATIONS_OWN'),
('ROLE_NURSE', 'VIEW_FIXED_REGISTRATIONS_OWN'),
('ROLE_RECEPTIONIST', 'VIEW_FIXED_REGISTRATIONS_OWN'),
('ROLE_ACCOUNTANT', 'VIEW_FIXED_REGISTRATIONS_OWN'),
('ROLE_INVENTORY_MANAGER', 'VIEW_FIXED_REGISTRATIONS_OWN'),
('ROLE_MANAGER', 'VIEW_FIXED_REGISTRATIONS_OWN')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ============================================
-- BƯỚC 5: TẠO CHUYÊN KHOA
-- ============================================
INSERT INTO specializations (specialization_id, specialization_code, specialization_name, description, is_active, created_at)
VALUES
(1, 'SPEC001', 'Chỉnh nha', 'Orthodontics - Niềng răng, chỉnh hình răng mặt', TRUE, NOW()),
(2, 'SPEC002', 'Nội nha', 'Endodontics - Điều trị tủy, chữa răng sâu', TRUE, NOW()),
(3, 'SPEC003', 'Nha chu', 'Periodontics - Điều trị nướu, mô nha chu', TRUE, NOW()),
(4, 'SPEC004', 'Phục hồi răng', 'Prosthodontics - Làm răng giả, cầu răng, implant', TRUE, NOW()),
(5, 'SPEC005', 'Phẫu thuật hàm mặt', 'Oral Surgery - Nhổ răng khôn, phẫu thuật', TRUE, NOW()),
(6, 'SPEC006', 'Nha khoa trẻ em', 'Pediatric Dentistry - Chuyên khoa nhi', TRUE, NOW()),
(7, 'SPEC007', 'Răng thẩm mỹ', 'Cosmetic Dentistry - Tẩy trắng, bọc sứ', TRUE, NOW()),
(8, 'SPEC-STANDARD', 'STANDARD - Y tế cơ bản', 'Baseline medical qualification - Required for all doctors/nurses', TRUE, NOW()),
(9, 'SPEC-INTERN', 'Thực tập sinh', 'Intern/Trainee - Nhân viên đang đào tạo, học việc', TRUE, NOW())
ON CONFLICT (specialization_id) DO NOTHING;


-- ============================================
-- BƯỚC 6: TẠO TÀI KHOẢN - STATUS = ACTIVE (SKIP VERIFICATION)
-- ============================================
-- Seeded accounts = ACTIVE (demo data, skip email verification)
-- New accounts created via API = PENDING_VERIFICATION (require email)
-- Default password: "123456" (BCrypt encoded)
-- ============================================

INSERT INTO accounts (account_id, account_code, username, email, password, role_id, status, is_email_verified, created_at)
VALUES
-- Dentists (Nha sĩ)
-- EMP001 - Lê Anh Khoa - FULL_TIME (Cả sáng 08:00-12:00 và chiều 13:00-17:00)
(1, 'ACC001', 'bacsi1', 'khoa.la@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_DENTIST', 'ACTIVE', TRUE, NOW()),

-- EMP002 - Trịnh Công Thái - FULL_TIME (Cả sáng 08:00-12:00 và chiều 13:00-17:00)
(2, 'ACC002', 'bacsi2', 'thai.tc@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_DENTIST', 'ACTIVE', TRUE, NOW()),

-- EMP003 - Jimmy Donaldson - PART_TIME_FLEX (Chỉ sáng 08:00-12:00)
(3, 'ACC003', 'bacsi3', 'jimmy.d@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_DENTIST', 'ACTIVE', TRUE, NOW()),

-- EMP004 - Junya Ota - PART_TIME_FIXED (Chỉ chiều 13:00-17:00)
(4, 'ACC004', 'bacsi4', 'junya.o@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_DENTIST', 'ACTIVE', TRUE, NOW()),

-- Staff
-- EMP005 - Đỗ Khánh Thuận - Lễ tân - FULL_TIME
(5, 'ACC005', 'letan1', 'thuan.dkb@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_RECEPTIONIST', 'ACTIVE', TRUE, NOW()),

-- EMP006 - Chử Quốc Thành - Kế toán - FULL_TIME
(6, 'ACC006', 'ketoan1', 'thanh.cq@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_ACCOUNTANT', 'ACTIVE', TRUE, NOW()),

-- Nurses (Y tá)
-- EMP007 - Đoàn Nguyễn Khôi Nguyên - FULL_TIME (Cả sáng và chiều)
(7, 'ACC007', 'yta1', 'nguyen.dnkn@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_NURSE', 'ACTIVE', TRUE, NOW()),

-- EMP008 - Nguyễn Trần Tuấn Khang - FULL_TIME (Cả sáng và chiều)
(8, 'ACC008', 'yta2', 'khang.nttk@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_NURSE', 'ACTIVE', TRUE, NOW()),

-- EMP009 - Huỳnh Tấn Quang Nhật - PART_TIME_FIXED (Chỉ sáng 08:00-12:00)
(9, 'ACC009', 'yta3', 'nhat.htqn@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_NURSE', 'ACTIVE', TRUE, NOW()),

-- EMP010 - Ngô Đình Chính - PART_TIME_FLEX (Chỉ chiều 13:00-17:00)
(10, 'ACC010', 'yta4', 'chinh.nd@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_NURSE', 'ACTIVE', TRUE, NOW()),

-- Manager
-- EMP011 - Võ Ngọc Minh Quân - Quản lý - FULL_TIME
(11, 'ACC011', 'quanli1', 'quan.vnm@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_MANAGER', 'ACTIVE', TRUE, NOW()),

-- Patients (Bệnh nhân) - All with is_email_verified = TRUE for demo data
-- Patient BN-1001 - Đoàn Thanh Phong
(12, 'ACC012', 'benhnhan1', 'phong.dt@email.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),

-- Patient BN-1002 - Phạm Văn Phong
(13, 'ACC013', 'benhnhan2', 'phong.pv@email.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),

-- Patient BN-1003 - Nguyễn Thị Anh
(14, 'ACC014', 'benhnhan3', 'anh.nt@email.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),

-- Patient BN-1004 - Mít tơ bít
(15, 'ACC015', 'benhnhan4', 'mit.bit@email.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),

-- EMP012 - Nguyễn Khánh Linh - Thực tập sinh - PART_TIME_FLEX
(16, 'ACC016', 'thuctap1', 'linh.nk@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_DENTIST_INTERN', 'ACTIVE', TRUE, NOW()),

-- Admin account - Super user
(17, 'ACC017', 'admin', 'admin@dentalclinic.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_ADMIN', 'ACTIVE', TRUE, NOW()),

-- Patient BN-1005 - Trần Văn Nam (for Treatment Plan testing)
(18, 'ACC018', 'benhnhan5', 'nam.tv@email.com',
'$2a$10$XOePZT251MQ7sdsoqH/jsO.vAuDoFrdWu/pAJSCD49/iwyIHQubf2', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW())
ON CONFLICT (account_id) DO NOTHING;



-- ============================================
-- BƯỚC 7: TẠO ROOMS (PHÒNG KHÁM/GHẾ NHA KHOA)
-- ============================================
-- Seed data cho các phòng khám/ghế nha khoa
-- Note: room_id must be provided manually in SQL since @PrePersist only works with JPA save()
-- Format: GHE + YYMMDD + sequence (e.g., GHE251103001)
-- ============================================

INSERT INTO rooms (room_id, room_code, room_name, room_type, is_active, created_at)
VALUES
('GHE251103001', 'P-01', 'Phòng thường 1', 'STANDARD', TRUE, NOW()),
('GHE251103002', 'P-02', 'Phòng thường 2', 'STANDARD', TRUE, NOW()),
('GHE251103003', 'P-03', 'Phòng thường 3', 'STANDARD', TRUE, NOW()),
('GHE251103004', 'P-04-IMPLANT', 'Phòng Implant', 'IMPLANT', TRUE, NOW())
ON CONFLICT (room_id) DO NOTHING;


-- ============================================
-- BƯỚC 8-14: EMPLOYEES, PATIENTS, WORK_SHIFTS, ETC
-- (Giữ nguyên như cũ)
-- ============================================

INSERT INTO employees (employee_id, account_id, employee_code, first_name, last_name, phone, date_of_birth, address, employment_type, is_active, created_at)
VALUES
-- SYSTEM user for admin account
(0, 17, 'SYSTEM', 'System', 'Administrator', '0000000000', '1970-01-01', 'System', 'FULL_TIME', TRUE, NOW()),
-- Dentists (Nha sĩ)
(1, 1, 'EMP001', 'Lê Anh', 'Khoa', '0901111111', '1990-01-15', '123 Nguyễn Văn Cừ, Q5, TPHCM', 'FULL_TIME', TRUE, NOW()),
(2, 2, 'EMP002', 'Trịnh Công', 'Thái', '0902222222', '1988-05-20', '456 Lý Thường Kiệt, Q10, TPHCM', 'FULL_TIME', TRUE, NOW()),
(3, 3, 'EMP003', 'Jimmy', 'Donaldson', '0903333333', '1995-07-10', '789 Điện Biên Phủ, Q3, TPHCM', 'PART_TIME_FLEX', TRUE, NOW()),
(4, 4, 'EMP004', 'Junya', 'Ota', '0904444444', '1992-11-25', '321 Võ Văn Tần, Q3, TPHCM', 'PART_TIME_FIXED', TRUE, NOW()),
-- Staff (Nhân viên hỗ trợ)
(5, 5, 'EMP005', 'Đinh Khắc Bá', 'Thuận', '0905555555', '1998-03-08', '111 Hai Bà Trưng, Q1, TPHCM', 'FULL_TIME', TRUE, NOW()), -- Lễ tân
(6, 6, 'EMP006', 'Chu Quốc', 'Thành', '0906666666', '1985-12-15', '222 Trần Hưng Đạo, Q5, TPHCM', 'FULL_TIME', TRUE, NOW()), -- Kế toán
-- Nurses (Y tá)
(7, 7, 'EMP007', 'Đoàn Nguyễn Khôi', 'Nguyên', '0907777777', '1996-06-20', '333 Lê Lợi, Q1, TPHCM', 'FULL_TIME', TRUE, NOW()),
(8, 8, 'EMP008', 'Nguyễn Trần Tuấn', 'Khang', '0908888888', '1997-08-18', '444 Pasteur, Q3, TPHCM', 'FULL_TIME', TRUE, NOW()),
(9, 9, 'EMP009', 'Huỳnh Tấn Quang', 'Nhật', '0909999999', '1999-04-12', '555 Cách Mạng Tháng 8, Q10, TPHCM', 'PART_TIME_FIXED', TRUE, NOW()),
(10, 10, 'EMP010', 'Ngô Đình', 'Chính', '0910101010', '2000-02-28', '666 Nguyễn Thị Minh Khai, Q3, TPHCM', 'PART_TIME_FLEX', TRUE, NOW()),
-- Manager
(11, 11, 'EMP011', 'Võ Nguyễn Minh', 'Quân', '0911111111', '1987-09-05', '777 Nguyễn Huệ, Q1, TPHCM', 'FULL_TIME', TRUE, NOW()),
-- NEW: Thực tập sinh (OBSERVER for testing P3.3)
(12, 16, 'EMP012', 'Nguyễn Khánh', 'Linh', '0912121212', '2003-05-15', '888 Võ Thị Sáu, Q3, TPHCM', 'PART_TIME_FLEX', TRUE, NOW())
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employee_specializations (employee_id, specialization_id)
VALUES
-- Dentist 1: Lê Anh Khoa - Chỉnh nha + Nha chu + Phục hồi + STANDARD (REQUIRED)
(1, 1), (1, 3), (1, 4), (1, 8),
-- Dentist 2: Trịnh Công Thái - Nội nha + Răng thẩm mỹ + STANDARD (REQUIRED)
(2, 2), (2, 7), (2, 8),
-- Dentist 3: Jimmy Donaldson - Nha khoa trẻ em + STANDARD (REQUIRED)
(3, 6), (3, 8),
-- Dentist 4: Junya Ota - Phẫu thuật hàm mặt + Phục hồi + STANDARD (REQUIRED)
(4, 4), (4, 5), (4, 8),
-- Nurses + Staff - STANDARD (REQUIRED for medical staff)
(7, 8), -- Y tá Nguyên
(8, 8), -- Y tá Khang
(9, 8), -- Y tá Nhật (Part-time fixed)
(10, 8), -- Y tá Chính (Part-time flex)
-- NEW: Thực tập sinh - INTERN specialization
(12, 9) -- Thực tập sinh Linh
ON CONFLICT (employee_id, specialization_id) DO NOTHING;


INSERT INTO patients (patient_id, account_id, patient_code, first_name, last_name, email, phone, date_of_birth, address, gender, is_active, created_at, updated_at)
VALUES
(1, 12, 'BN-1001', 'Đoàn Thanh', 'Phong', 'phong.dt@email.com', '0971111111', '1995-03-15', '123 Lê Văn Việt, Q9, TPHCM', 'MALE', TRUE, NOW(), NOW()),
(2, 13, 'BN-1002', 'Phạm Văn', 'Phong', 'phong.pv@email.com', '0972222222', '1990-07-20', '456 Võ Văn Ngân, Thủ Đức, TPHCM', 'MALE', TRUE, NOW(), NOW()),
(3, 14, 'BN-1003', 'Nguyễn Tuấn', 'Anh', 'anh.nt@email.com', '0973333333', '1988-11-10', '789 Đường D2, Bình Thạnh, TPHCM', 'MALE', TRUE, NOW(), NOW()),
(4, 15, 'BN-1004', 'Mít tơ', 'Bít', 'mit.bit@email.com', '0974444444', '2000-01-01', '321 Nguyễn Thị Minh Khai, Q1, TPHCM', 'OTHER', TRUE, NOW(), NOW()),
(5, 18, 'BN-1005', 'Trần Văn', 'Nam', 'nam.tv@email.com', '0975555555', '1992-05-25', '555 Hoàng Diệu, Q4, TPHCM', 'MALE', TRUE, NOW(), NOW())
ON CONFLICT (patient_id) DO NOTHING;

-- NEW PATIENTS (All with verified emails - da setup password)
INSERT INTO accounts (account_id, account_code, username, email, password, role_id, status, is_email_verified, created_at)
VALUES
(19, 'ACC019', 'patient006', 'hoa.lt@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkW', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),
(20, 'ACC020', 'patient007', 'khanh.vv@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkW', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),
(21, 'ACC021', 'patient008', 'mai.tt@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkW', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),
(22, 'ACC022', 'patient009', 'tu.pv@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkW', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW()),
(23, 'ACC023', 'patient010', 'lan.nt@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhkW', 'ROLE_PATIENT', 'ACTIVE', TRUE, NOW())
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO patients (patient_id, account_id, patient_code, first_name, last_name, email, phone, date_of_birth, address, gender, is_active, created_at, updated_at)
VALUES
(6, 19, 'BN-1006', 'Lê Thị', 'Hoa', 'hoa.lt@email.com', '0976666666', '1993-08-12', '88 Trần Hưng Đạo, Q5, TPHCM', 'FEMALE', TRUE, NOW(), NOW()),
(7, 20, 'BN-1007', 'Võ Văn', 'Khánh', 'khanh.vv@email.com', '0977777777', '1985-04-18', '99 Lê Lợi, Q1, TPHCM', 'MALE', TRUE, NOW(), NOW()),
(8, 21, 'BN-1008', 'Trần Thị', 'Mai', 'mai.tt@email.com', '0978888888', '1998-12-25', '77 Nguyễn Huệ, Q1, TPHCM', 'FEMALE', TRUE, NOW(), NOW()),
(9, 22, 'BN-1009', 'Phan Văn', 'Tú', 'tu.pv@email.com', '0979999999', '1991-06-30', '66 Pasteur, Q3, TPHCM', 'MALE', TRUE, NOW(), NOW()),
(10, 23, 'BN-1010', 'Nguyễn Thị', 'Lan', 'lan.nt@email.com', '0970000000', '1996-09-15', '55 Cách Mạng Tháng 8, Q10, TPHCM', 'FEMALE', TRUE, NOW(), NOW())
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO work_shifts (work_shift_id, shift_name, start_time, end_time, category, is_active)
VALUES
('WKS_MORNING_01', 'Ca Sáng (8h-12h)', '08:00:00', '12:00:00', 'NORMAL', TRUE),
('WKS_AFTERNOON_01', 'Ca Chiều (13h-17h)', '13:00:00', '17:00:00', 'NORMAL', TRUE),
('WKS_MORNING_02', 'Ca Part-time Sáng (8h-12h)', '08:00:00', '12:00:00', 'NORMAL', TRUE),
('WKS_AFTERNOON_02', 'Ca Part-time Chiều (13h-17h)', '13:00:00', '17:00:00', 'NORMAL', TRUE)
ON CONFLICT (work_shift_id) DO NOTHING;


-- Clean up old time_off_types with TOTxxx format
DELETE FROM leave_balance_history WHERE balance_id IN (
    SELECT balance_id FROM employee_leave_balances WHERE time_off_type_id LIKE 'TOT%'
);
DELETE FROM employee_leave_balances WHERE time_off_type_id LIKE 'TOT%';
DELETE FROM time_off_types WHERE type_id LIKE 'TOT%';

INSERT INTO time_off_types (type_id, type_code, type_name, is_paid, requires_approval, requires_balance, default_days_per_year, is_active)
VALUES
-- type_id = type_code for easier reference
('ANNUAL_LEAVE', 'ANNUAL_LEAVE', 'Nghỉ phép năm', TRUE, TRUE, TRUE, 12.0, TRUE),
('UNPAID_PERSONAL', 'UNPAID_PERSONAL', 'Nghỉ việc riêng không lương', FALSE, TRUE, FALSE, NULL, TRUE),
('SICK_LEAVE', 'SICK_LEAVE', 'Nghỉ ốm có bảo hiểm xã hội', TRUE, TRUE, FALSE, 30.0, TRUE),
('MATERNITY_LEAVE', 'MATERNITY_LEAVE', 'Nghỉ thai sản (6 tháng)', TRUE, TRUE, FALSE, 180.0, TRUE),
('PATERNITY_LEAVE', 'PATERNITY_LEAVE', 'Nghỉ chăm con (khi vợ sinh)', TRUE, TRUE, FALSE, NULL, TRUE),
('MARRIAGE_LEAVE', 'MARRIAGE_LEAVE', 'Nghỉ kết hôn', TRUE, TRUE, FALSE, 3.0, TRUE),
('BEREAVEMENT_LEAVE', 'BEREAVEMENT_LEAVE', 'Nghỉ tang lễ', TRUE, TRUE, FALSE, 3.0, TRUE),
('EMERGENCY_LEAVE', 'EMERGENCY_LEAVE', 'Nghỉ khẩn cấp', FALSE, TRUE, FALSE, NULL, TRUE),
('STUDY_LEAVE', 'STUDY_LEAVE', 'Nghỉ học tập/đào tạo', TRUE, TRUE, FALSE, NULL, TRUE),
('COMPENSATORY_LEAVE', 'COMPENSATORY_LEAVE', 'Nghỉ bù (sau làm thêm giờ)', TRUE, TRUE, TRUE, NULL, TRUE),
('RECOVERY_LEAVE', 'RECOVERY_LEAVE', 'Nghỉ dưỡng sức phục hồi sau ốm', TRUE, TRUE, FALSE, 10.0, TRUE),
('CONTRACEPTION_LEAVE', 'CONTRACEPTION_LEAVE', 'Nghỉ thực hiện biện pháp tránh thai', TRUE, TRUE, FALSE, 15.0, TRUE),
('MILITARY_EXAM_LEAVE', 'MILITARY_EXAM_LEAVE', 'Nghỉ khám Nghĩa vụ quân sự', TRUE, TRUE, FALSE, NULL, TRUE)
ON CONFLICT (type_id) DO UPDATE SET
    type_code = EXCLUDED.type_code,
    type_name = EXCLUDED.type_name,
    is_paid = EXCLUDED.is_paid,
    requires_approval = EXCLUDED.requires_approval,
    requires_balance = EXCLUDED.requires_balance,
    default_days_per_year = EXCLUDED.default_days_per_year,
    is_active = EXCLUDED.is_active;

-- Sequences sync
SELECT setval(pg_get_serial_sequence('base_roles', 'base_role_id'), COALESCE((SELECT MAX(base_role_id) FROM base_roles), 0)+1, false);
SELECT setval(pg_get_serial_sequence('accounts', 'account_id'), COALESCE((SELECT MAX(account_id) FROM accounts), 0)+1, false);
SELECT setval(pg_get_serial_sequence('employees', 'employee_id'), COALESCE((SELECT MAX(employee_id) FROM employees), 0)+1, false);
SELECT setval(pg_get_serial_sequence('patients', 'patient_id'), COALESCE((SELECT MAX(patient_id) FROM patients), 0)+1, false);
SELECT setval(pg_get_serial_sequence('specializations', 'specialization_id'), COALESCE((SELECT MAX(specialization_id) FROM specializations), 0)+1, false);

-- ============================================
-- BƯỚC 14: SAMPLE DATA FOR TIME-OFF, RENEWAL, HOLIDAYS
-- ============================================

--  OLD DATA (November 2025) - Sample time-off requests
INSERT INTO time_off_requests (request_id, employee_id, time_off_type_id, work_shift_id, start_date, end_date, status, approved_by, approved_at, requested_at, requested_by)
VALUES
('TOR251025001', 2, 'ANNUAL_LEAVE', 'WKS_MORNING_01', '2025-10-28', '2025-10-29', 'PENDING', NULL, NULL, NOW(), 2),
('TOR251025002', 3, 'SICK_LEAVE', 'WKS_AFTERNOON_01', '2025-11-02', '2025-11-02', 'APPROVED', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', 3),
('TOR251025003', 4, 'UNPAID_PERSONAL', 'WKS_MORNING_02', '2025-11-05', '2025-11-06', 'REJECTED', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', 4)
ON CONFLICT (request_id) DO NOTHING;

--  NEW DATA (December 2025) - Sample time-off requests
INSERT INTO time_off_requests (request_id, employee_id, time_off_type_id, work_shift_id, start_date, end_date, status, approved_by, approved_at, requested_at, requested_by)
VALUES
('TOR251201001', 2, 'ANNUAL_LEAVE', 'WKS_MORNING_01', '2025-12-10', '2025-12-11', 'PENDING', NULL, NULL, NOW(), 2),
('TOR251201002', 3, 'SICK_LEAVE', 'WKS_AFTERNOON_01', '2025-12-15', '2025-12-15', 'APPROVED', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', 3),
('TOR251201003', 4, 'UNPAID_PERSONAL', 'WKS_MORNING_02', '2025-12-20', '2025-12-21', 'REJECTED', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', 4)
ON CONFLICT (request_id) DO NOTHING;

--  NEW DATA (January 2026) - Sample time-off requests
INSERT INTO time_off_requests (request_id, employee_id, time_off_type_id, work_shift_id, start_date, end_date, status, approved_by, approved_at, requested_at, requested_by)
VALUES
('TOR260101001', 2, 'ANNUAL_LEAVE', 'WKS_MORNING_01', '2026-01-15', '2026-01-16', 'PENDING', NULL, NULL, NOW(), 2),
('TOR260101002', 3, 'SICK_LEAVE', 'WKS_AFTERNOON_01', '2026-01-20', '2026-01-20', 'APPROVED', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', 3),
('TOR260101003', 4, 'UNPAID_PERSONAL', 'WKS_MORNING_02', '2026-01-25', '2026-01-26', 'REJECTED', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', 4)
ON CONFLICT (request_id) DO NOTHING;


-- ============================================
--  OLD DATA (November 2025) - SAMPLE OVERTIME REQUESTS (BE-304)
-- ============================================
-- Sample OT requests covering all statuses for FE testing
-- PENDING, APPROVED, REJECTED, CANCELLED

INSERT INTO overtime_requests (
    request_id, employee_id, requested_by, work_date, work_shift_id,
    reason, status, approved_by, approved_at, rejected_reason, cancellation_reason, created_at
)
VALUES
-- PENDING overtime requests (for testing approval/rejection/cancellation)
('OTR251030005', 2, 2, '2025-11-18', 'WKS_AFTERNOON_02',
 'Hoàn thành báo cáo cuối tháng', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

('OTR251030006', 3, 3, '2025-11-20', 'WKS_MORNING_01',
 'Hỗ trợ dự án khẩn cấp', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

('OTR251030007', 4, 4, '2025-11-22', 'WKS_AFTERNOON_01',
 'Hỗ trợ tiếp đón bệnh nhân ca tối', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

-- APPROVED overtime requests (with auto-created employee shifts)
('OTR251030008', 5, 5, '2025-11-25', 'WKS_MORNING_02',
 'Xử lý công việc kế toán tồn đọng', 'APPROVED', 7, NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '3 days'),

('OTR251030009', 6, 6, '2025-11-27', 'WKS_AFTERNOON_02',
 'Chăm sóc bệnh nhân đặc biệt', 'APPROVED', 7, NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '2 days'),

-- REJECTED overtime request
('OTR251030010', 2, 2, '2025-11-28', 'WKS_MORNING_01',
 'Yêu cầu tăng ca thêm', 'REJECTED', 7, NOW() - INTERVAL '1 day', 'Đã đủ nhân sự cho ngày này', NULL, NOW() - INTERVAL '2 days'),

-- CANCELLED overtime request (self-cancelled)
('OTR251030011', 3, 3, '2025-11-30', 'WKS_AFTERNOON_01',
 'Yêu cầu tăng ca cuối tháng', 'CANCELLED', NULL, NULL, NULL, 'Có việc đột xuất không thể tham gia', NOW() - INTERVAL '1 day')
ON CONFLICT (request_id) DO NOTHING;

--  NEW DATA (December 2025) - OVERTIME REQUESTS
INSERT INTO overtime_requests (
    request_id, employee_id, requested_by, work_date, work_shift_id,
    reason, status, approved_by, approved_at, rejected_reason, cancellation_reason, created_at
)
VALUES
-- PENDING overtime requests
('OTR251201001', 2, 2, '2025-12-18', 'WKS_AFTERNOON_02',
 'Hoàn thành báo cáo cuối năm', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

('OTR251201002', 3, 3, '2025-12-20', 'WKS_MORNING_01',
 'Hỗ trợ dự án khẩn cấp', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

-- APPROVED overtime requests
('OTR251201003', 5, 5, '2025-12-25', 'WKS_MORNING_02',
 'Xử lý công việc kế toán cuối năm', 'APPROVED', 7, NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '3 days'),

('OTR251201004', 6, 6, '2025-12-27', 'WKS_AFTERNOON_02',
 'Chăm sóc bệnh nhân ngày lễ', 'APPROVED', 7, NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '2 days'),

-- REJECTED
('OTR251201005', 2, 2, '2025-12-28', 'WKS_MORNING_01',
 'Yêu cầu tăng ca thêm', 'REJECTED', 7, NOW() - INTERVAL '1 day', 'Đã đủ nhân sự cho ngày này', NULL, NOW() - INTERVAL '2 days')
ON CONFLICT (request_id) DO NOTHING;

--  NEW DATA (January 2026) - OVERTIME REQUESTS
INSERT INTO overtime_requests (
    request_id, employee_id, requested_by, work_date, work_shift_id,
    reason, status, approved_by, approved_at, rejected_reason, cancellation_reason, created_at
)
VALUES
-- PENDING overtime requests
('OTR260101001', 2, 2, '2026-01-18', 'WKS_AFTERNOON_02',
 'Hoàn thành báo cáo đầu năm', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

('OTR260101002', 3, 3, '2026-01-20', 'WKS_MORNING_01',
 'Hỗ trợ triển khai hệ thống mới', 'PENDING', NULL, NULL, NULL, NULL, NOW()),

-- APPROVED overtime requests
('OTR260101003', 5, 5, '2026-01-25', 'WKS_MORNING_02',
 'Xử lý công việc kế toán đầu năm', 'APPROVED', 7, NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '3 days'),

('OTR260101004', 6, 6, '2026-01-27', 'WKS_AFTERNOON_02',
 'Chăm sóc bệnh nhân dịp Tết', 'APPROVED', 7, NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '2 days')
ON CONFLICT (request_id) DO NOTHING;



--  OLD DATA (November 2025) - Create corresponding employee shifts for APPROVED OT requests
INSERT INTO employee_shifts (
    employee_shift_id, created_at, created_by, is_overtime, notes,
    source, source_off_request_id, source_ot_request_id, status, updated_at,
    work_date, employee_id, work_shift_id
)
VALUES
-- Auto-created shift for OTR251030008 (Accountant Tuan)
('EMS251030003', NOW() - INTERVAL '2 days', 7, TRUE,
 'Tạo từ yêu cầu OT OTR251030008 - Xử lý công việc kế toán tồn đọng',
 'OT_APPROVAL', NULL, 'OTR251030008', 'SCHEDULED', NULL,
 '2025-11-25', 5, 'WKS_MORNING_02'),

-- Auto-created shift for OTR251030009 (Nurse Hoa)
('EMS251030004', NOW() - INTERVAL '1 day', 7, TRUE,
 'Tạo từ yêu cầu OT OTR251030009 - Chăm sóc bệnh nhân đặc biệt',
 'OT_APPROVAL', NULL, 'OTR251030009', 'SCHEDULED', NULL,
 '2025-11-27', 6, 'WKS_AFTERNOON_02')
ON CONFLICT (employee_shift_id) DO NOTHING;

--  NEW DATA (December 2025) - Employee shifts for APPROVED OT requests
INSERT INTO employee_shifts (
    employee_shift_id, created_at, created_by, is_overtime, notes,
    source, source_off_request_id, source_ot_request_id, status, updated_at,
    work_date, employee_id, work_shift_id
)
VALUES
('EMS251201001', NOW() - INTERVAL '2 days', 7, TRUE,
 'Tạo từ yêu cầu OT OTR251201003 - Xử lý công việc kế toán cuối năm',
 'OT_APPROVAL', NULL, 'OTR251201003', 'SCHEDULED', NULL,
 '2025-12-25', 5, 'WKS_MORNING_02'),

('EMS251201002', NOW() - INTERVAL '1 day', 7, TRUE,
 'Tạo từ yêu cầu OT OTR251201004 - Chăm sóc bệnh nhân ngày lễ',
 'OT_APPROVAL', NULL, 'OTR251201004', 'SCHEDULED', NULL,
 '2025-12-27', 6, 'WKS_AFTERNOON_02')
ON CONFLICT (employee_shift_id) DO NOTHING;

--  NEW DATA (January 2026) - Employee shifts for APPROVED OT requests
INSERT INTO employee_shifts (
    employee_shift_id, created_at, created_by, is_overtime, notes,
    source, source_off_request_id, source_ot_request_id, status, updated_at,
    work_date, employee_id, work_shift_id
)
VALUES
('EMS260101001', NOW() - INTERVAL '2 days', 7, TRUE,
 'Tạo từ yêu cầu OT OTR260101003 - Xử lý công việc kế toán đầu năm',
 'OT_APPROVAL', NULL, 'OTR260101003', 'SCHEDULED', NULL,
 '2026-01-25', 5, 'WKS_MORNING_02'),

('EMS260101002', NOW() - INTERVAL '1 day', 7, TRUE,
 'Tạo từ yêu cầu OT OTR260101004 - Chăm sóc bệnh nhân dịp Tết',
 'OT_APPROVAL', NULL, 'OTR260101004', 'SCHEDULED', NULL,
 '2026-01-27', 6, 'WKS_AFTERNOON_02')
ON CONFLICT (employee_shift_id) DO NOTHING;


-- ============================================
--  OLD DATA (November 2025) - EMPLOYEE SHIFT SAMPLE DATA (BE-302)
-- ============================================
-- Sample employee shifts for testing Employee Shift Management API
-- Covers different statuses, shift types, and scenarios
-- employee_id mapping: 2=nhasi1, 3=nhasi2, 4=letan, 5=ketoan, 6=yta, 7=manager

INSERT INTO employee_shifts (
    employee_shift_id, created_at, created_by, is_overtime, notes,
    source, status, updated_at, work_date, employee_id, work_shift_id
)
VALUES
--  November 2025 shifts (OLD DATA for testing)
-- Dr. Minh (employee_id=2) - SCHEDULED shifts
('EMS251101001', NOW(), NULL, FALSE, 'Ca sáng thứ 2', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-03', 2, 'WKS_MORNING_01'),
('EMS251101002', NOW(), NULL, FALSE, 'Ca chiều thứ 3', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-04', 2, 'WKS_AFTERNOON_01'),
('EMS251101003', NOW(), NULL, FALSE, 'Ca tự động từ batch job', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-05', 2, 'WKS_MORNING_01'),

-- Dr. Lan (employee_id=3) - COMPLETED shifts
('EMS251101004', NOW(), NULL, FALSE, 'Ca sáng đã hoàn thành', 'MANUAL_ENTRY', 'COMPLETED', NOW(), '2025-11-01', 3, 'WKS_MORNING_01'),
('EMS251101005', NOW(), NULL, FALSE, 'Ca chiều đã hoàn thành', 'BATCH_JOB', 'COMPLETED', NOW(), '2025-11-02', 3, 'WKS_AFTERNOON_01'),

-- Receptionist Mai (employee_id=4) - CANCELLED shifts
('EMS251101006', NOW(), NULL, FALSE, 'Ca bị hủy do bận việc', 'MANUAL_ENTRY', 'CANCELLED', NOW(), '2025-11-03', 4, 'WKS_MORNING_02'),
('EMS251101007', NOW(), NULL, FALSE, 'Ca part-time chiều', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-04', 4, 'WKS_AFTERNOON_02'),

-- Accountant Tuan (employee_id=5) - Mixed statuses
('EMS251101008', NOW(), NULL, FALSE, 'Ca sáng thứ 4', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 5, 'WKS_MORNING_01'),
('EMS251101009', NOW(), NULL, FALSE, 'Ca chiều từ batch job', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 5, 'WKS_AFTERNOON_01'),
('EMS251101010', NOW(), NULL, FALSE, 'Ca đã hoàn thành', 'MANUAL_ENTRY', 'COMPLETED', NOW(), '2025-11-01', 5, 'WKS_MORNING_01'),

-- Nurse Hoa (employee_id=6) - ON_LEAVE status
('EMS251101011', NOW(), NULL, FALSE, 'Nghỉ phép có đăng ký', 'BATCH_JOB', 'ON_LEAVE', NOW(), '2025-11-05', 6, 'WKS_MORNING_02'),
('EMS251101012', NOW(), NULL, FALSE, 'Ca part-time chiều', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 6, 'WKS_AFTERNOON_02'),

-- Manager Quan (employee_id=11) - All permissions (CHANGED from 7 to 11 - correct manager ID)
('EMS251101013', NOW(), NULL, FALSE, 'Ca quản lý', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-10', 11, 'WKS_MORNING_01'),
('EMS251101014', NOW(), NULL, FALSE, 'Ca quản lý từ batch job', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 11, 'WKS_AFTERNOON_01'),


-- EMP001 (Lê Anh Khoa) - DENTIST - NOW HAS SHIFTS!
('EMS251106001', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Khoa', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 1, 'WKS_MORNING_01'),
('EMS251106002', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - BS Khoa', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 1, 'WKS_AFTERNOON_01'),
('EMS251107001', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 1, 'WKS_MORNING_01'),
('EMS251108001', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-08', 1, 'WKS_MORNING_01'),
('EMS251108002', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-08', 1, 'WKS_AFTERNOON_01'),

-- EMP002 (Trịnh Công Thái) - DENTIST - Additional future shifts
('EMS251106003', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Thái', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 2, 'WKS_MORNING_01'),
('EMS251107002', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 2, 'WKS_AFTERNOON_01'),
('EMS251108003', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-08', 2, 'WKS_MORNING_01'),

-- EMP003 (Jimmy Donaldson) - DENTIST - Part-time flex
('EMS251106004', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - BS Jimmy', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 3, 'WKS_AFTERNOON_01'),
('EMS251107003', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Jimmy', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 3, 'WKS_MORNING_01'),

-- EMP004 (Junya Ota) - DENTIST - Part-time fixed
('EMS251106005', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Junya', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-06', 4, 'WKS_MORNING_02'),
('EMS251107004', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Junya', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 4, 'WKS_MORNING_02'),

-- EMP007 (Y tá Nguyên) - NURSE - Full shifts Nov 6-8
('EMS251106006', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-06', 7, 'WKS_MORNING_01'),
('EMS251106007', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-06', 7, 'WKS_AFTERNOON_01'),
('EMS251107005', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 7, 'WKS_MORNING_01'),
('EMS251108004', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-08', 7, 'WKS_MORNING_01'),

-- EMP008 (Y tá Khang) - NURSE - Full shifts Nov 6-8
('EMS251106008', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-06', 8, 'WKS_MORNING_01'),
('EMS251106009', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-06', 8, 'WKS_AFTERNOON_01'),
('EMS251107006', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-07', 8, 'WKS_AFTERNOON_01'),
('EMS251108005', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-08', 8, 'WKS_AFTERNOON_01'),


--  NEW DATA (November 2025 Week 2) - FULL WEEK SCHEDULE (Mon-Fri, Nov 10-14, 2025)
-- Full-time employees: 10 shifts each (Mon-Fri morning+afternoon)
-- Part-time employees: 2-3 shifts overlapping with full-time hours
-- All shifts created by BATCH_JOB

-- EMP001 (BS Khoa) - FULL_TIME - Monday-Friday full week (10 shifts)
('EMS251110001', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 1, 'WKS_MORNING_01'),
('EMS251110002', NOW(), NULL, FALSE, 'Ca chiều thứ 2 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 1, 'WKS_AFTERNOON_01'),
('EMS251111001', NOW(), NULL, FALSE, 'Ca sáng thứ 3 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 1, 'WKS_MORNING_01'),
('EMS251111002', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 1, 'WKS_AFTERNOON_01'),
('EMS251112001', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 1, 'WKS_MORNING_01'),
('EMS251112002', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 1, 'WKS_AFTERNOON_01'),
('EMS251113001', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 1, 'WKS_MORNING_01'),
('EMS251113002', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 1, 'WKS_AFTERNOON_01'),
('EMS251114001', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 1, 'WKS_MORNING_01'),
('EMS251114002', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 1, 'WKS_AFTERNOON_01'),

-- EMP002 (BS Thái) - FULL_TIME - Monday-Friday full week (10 shifts)
('EMS251110003', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 2, 'WKS_MORNING_01'),
('EMS251110004', NOW(), NULL, FALSE, 'Ca chiều thứ 2 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 2, 'WKS_AFTERNOON_01'),
('EMS251111003', NOW(), NULL, FALSE, 'Ca sáng thứ 3 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 2, 'WKS_MORNING_01'),
('EMS251111004', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 2, 'WKS_AFTERNOON_01'),
('EMS251112003', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 2, 'WKS_MORNING_01'),
('EMS251112004', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 2, 'WKS_AFTERNOON_01'),
('EMS251113003', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 2, 'WKS_MORNING_01'),
('EMS251113004', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 2, 'WKS_AFTERNOON_01'),
('EMS251114003', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 2, 'WKS_MORNING_01'),
('EMS251114004', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 2, 'WKS_AFTERNOON_01'),

-- EMP007 (Y tá Nguyên) - FULL_TIME - Monday-Friday full week (10 shifts)
('EMS251110005', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 7, 'WKS_MORNING_01'),
('EMS251110006', NOW(), NULL, FALSE, 'Ca chiều thứ 2 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 7, 'WKS_AFTERNOON_01'),
('EMS251111005', NOW(), NULL, FALSE, 'Ca sáng thứ 3 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 7, 'WKS_MORNING_01'),
('EMS251111006', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 7, 'WKS_AFTERNOON_01'),
('EMS251112005', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 7, 'WKS_MORNING_01'),
('EMS251112006', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 7, 'WKS_AFTERNOON_01'),
('EMS251113005', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 7, 'WKS_MORNING_01'),
('EMS251113006', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 7, 'WKS_AFTERNOON_01'),
('EMS251114005', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 7, 'WKS_MORNING_01'),
('EMS251114006', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 7, 'WKS_AFTERNOON_01'),

-- EMP008 (Y tá Khang) - FULL_TIME - Monday-Friday full week (10 shifts)
('EMS251110007', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 8, 'WKS_MORNING_01'),
('EMS251110008', NOW(), NULL, FALSE, 'Ca chiều thứ 2 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 8, 'WKS_AFTERNOON_01'),
('EMS251111007', NOW(), NULL, FALSE, 'Ca sáng thứ 3 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 8, 'WKS_MORNING_01'),
('EMS251111008', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 8, 'WKS_AFTERNOON_01'),
('EMS251112007', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 8, 'WKS_MORNING_01'),
('EMS251112008', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 8, 'WKS_AFTERNOON_01'),
('EMS251113007', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 8, 'WKS_MORNING_01'),
('EMS251113008', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 8, 'WKS_AFTERNOON_01'),
('EMS251114007', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 8, 'WKS_MORNING_01'),
('EMS251114008', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 8, 'WKS_AFTERNOON_01'),

-- EMP005 (Lễ tân Thuận) - FULL_TIME - Monday-Friday full week (10 shifts)
('EMS251110011', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 5, 'WKS_MORNING_01'),
('EMS251110012', NOW(), NULL, FALSE, 'Ca chiều thứ 2 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 5, 'WKS_AFTERNOON_01'),
('EMS251111011', NOW(), NULL, FALSE, 'Ca sáng thứ 3 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 5, 'WKS_MORNING_01'),
('EMS251111012', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 5, 'WKS_AFTERNOON_01'),
('EMS251112011', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 5, 'WKS_MORNING_01'),
('EMS251112012', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 5, 'WKS_AFTERNOON_01'),
('EMS251113011', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 5, 'WKS_MORNING_01'),
('EMS251113012', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 5, 'WKS_AFTERNOON_01'),
('EMS251114011', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 5, 'WKS_MORNING_01'),
('EMS251114012', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 5, 'WKS_AFTERNOON_01'),

-- EMP011 (Quản lý Quân) - FULL_TIME - Monday-Friday full week (10 shifts)
('EMS251110013', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 11, 'WKS_MORNING_01'),
('EMS251110014', NOW(), NULL, FALSE, 'Ca chiều thứ 2 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-10', 11, 'WKS_AFTERNOON_01'),
('EMS251111013', NOW(), NULL, FALSE, 'Ca sáng thứ 3 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 11, 'WKS_MORNING_01'),
('EMS251111014', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-11', 11, 'WKS_AFTERNOON_01'),
('EMS251112013', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 11, 'WKS_MORNING_01'),
('EMS251112014', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-12', 11, 'WKS_AFTERNOON_01'),
('EMS251113013', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 11, 'WKS_MORNING_01'),
('EMS251113014', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-13', 11, 'WKS_AFTERNOON_01'),
('EMS251114013', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 11, 'WKS_MORNING_01'),
('EMS251114014', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-11-14', 11, 'WKS_AFTERNOON_01'),

-- EMP003 (BS Minh) - PART_TIME_FLEX - Mon, Wed, Fri mornings (3 shifts overlapping)
('EMS251110009', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - BS Minh', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-10', 3, 'WKS_MORNING_02'),
('EMS251112009', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Minh', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-12', 3, 'WKS_MORNING_02'),
('EMS251114009', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Minh', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-14', 3, 'WKS_MORNING_02'),

-- EMP004 (BS Lan) - PART_TIME_FIXED - Tue, Thu afternoons (2 shifts overlapping)
('EMS251111009', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - BS Lan', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-11', 4, 'WKS_AFTERNOON_02'),
('EMS251113009', NOW(), NULL, FALSE, 'Ca chiều thứ 5 - BS Lan', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-13', 4, 'WKS_AFTERNOON_02'),

-- EMP009 (Y tá Nhật) - PART_TIME_FIXED - Mon, Wed, Fri mornings (M/W/F as per spec)
('EMS251110015', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - Y tá Nhật', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-10', 9, 'WKS_MORNING_02'),
('EMS251112015', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - Y tá Nhật', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-12', 9, 'WKS_MORNING_02'),
('EMS251114015', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - Y tá Nhật', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-14', 9, 'WKS_MORNING_02'),

-- EMP010 (Y tá Chính) - PART_TIME_FLEX - Wed, Fri afternoons (2 shifts overlapping)
('EMS251112011', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - Y tá Chính', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-12', 10, 'WKS_AFTERNOON_02'),
('EMS251114011', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - Y tá Chính', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-11-14', 10, 'WKS_AFTERNOON_02'),


--  NEW DATA (December 2025) - Employee shifts for normal operations
('EMS251203001', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - BS Minh', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-03', 2, 'WKS_MORNING_01'),
('EMS251203002', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - BS Lan', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-04', 3, 'WKS_AFTERNOON_01'),
('EMS251203003', NOW(), NULL, FALSE, 'Ca tự động từ batch job', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 2, 'WKS_MORNING_01'),
('EMS251203004', NOW(), NULL, FALSE, 'Ca sáng đã hoàn thành', 'MANUAL_ENTRY', 'COMPLETED', NOW(), '2025-12-01', 3, 'WKS_MORNING_01'),
('EMS251203005', NOW(), NULL, FALSE, 'Ca chiều đã hoàn thành', 'BATCH_JOB', 'COMPLETED', NOW(), '2025-12-02', 3, 'WKS_AFTERNOON_01'),
('EMS251206001', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Khoa', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-06', 1, 'WKS_MORNING_01'),
('EMS251206002', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - BS Khoa', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-06', 1, 'WKS_AFTERNOON_01'),
('EMS251207001', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-07', 1, 'WKS_MORNING_01'),
('EMS251208001', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-08', 1, 'WKS_MORNING_01'),

--  NEW DATA (January 2026) - Employee shifts for normal operations
('EMS260103001', NOW(), NULL, FALSE, 'Ca sáng thứ 2 - BS Minh', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-03', 2, 'WKS_MORNING_01'),
('EMS260103002', NOW(), NULL, FALSE, 'Ca chiều thứ 3 - BS Lan', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-04', 3, 'WKS_AFTERNOON_01'),
('EMS260103003', NOW(), NULL, FALSE, 'Ca tự động từ batch job', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-05', 2, 'WKS_MORNING_01'),
('EMS260106001', NOW(), NULL, FALSE, 'Ca sáng thứ 4 - BS Khoa', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-06', 1, 'WKS_MORNING_01'),
('EMS260106002', NOW(), NULL, FALSE, 'Ca chiều thứ 4 - BS Khoa', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-06', 1, 'WKS_AFTERNOON_01'),
('EMS260107001', NOW(), NULL, FALSE, 'Ca sáng thứ 5 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 1, 'WKS_MORNING_01'),
('EMS260108001', NOW(), NULL, FALSE, 'Ca sáng thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 1, 'WKS_MORNING_01'),
('EMS260108002', NOW(), NULL, FALSE, 'Ca chiều thứ 6 - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 1, 'WKS_AFTERNOON_01'),

-- ============================================
--  NEW DATA (December 2025) - FULL WEEK SCHEDULES FOR FULL-TIME EMPLOYEES
-- Tuần đầy đủ từ thứ 2 đến thứ 6 (Dec 2-6, 2025)
-- ============================================

-- BS Khoa (EMP001 - FULL_TIME DENTIST) - Full week Mon-Fri
('EMS251202001', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 1, 'WKS_MORNING_01'),
('EMS251202002', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 1, 'WKS_AFTERNOON_01'),
('EMS251203011', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 1, 'WKS_MORNING_01'),
('EMS251203012', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 1, 'WKS_AFTERNOON_01'),
('EMS251204001', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 1, 'WKS_MORNING_01'),
('EMS251204002', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 1, 'WKS_AFTERNOON_01'),
('EMS251205001', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 1, 'WKS_MORNING_01'),
('EMS251205002', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 1, 'WKS_AFTERNOON_01'),
('EMS251206011', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 1, 'WKS_MORNING_01'),
('EMS251206012', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 1, 'WKS_AFTERNOON_01'),

-- BS Thái (EMP002 - FULL_TIME DENTIST) - Full week Mon-Fri
('EMS251202011', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 2, 'WKS_MORNING_01'),
('EMS251202012', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 2, 'WKS_AFTERNOON_01'),
('EMS251203021', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 2, 'WKS_MORNING_01'),
('EMS251203022', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 2, 'WKS_AFTERNOON_01'),
('EMS251204011', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 2, 'WKS_MORNING_01'),
('EMS251204012', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 2, 'WKS_AFTERNOON_01'),
('EMS251205011', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 2, 'WKS_MORNING_01'),
('EMS251205012', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 2, 'WKS_AFTERNOON_01'),
('EMS251206021', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 2, 'WKS_MORNING_01'),
('EMS251206022', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 2, 'WKS_AFTERNOON_01'),

-- Y tá Nguyên (EMP007 - FULL_TIME NURSE) - Full week Mon-Fri
('EMS251202031', NOW(), NULL, FALSE, 'Thứ 2 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 7, 'WKS_MORNING_01'),
('EMS251202032', NOW(), NULL, FALSE, 'Thứ 2 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 7, 'WKS_AFTERNOON_01'),
('EMS251203031', NOW(), NULL, FALSE, 'Thứ 3 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 7, 'WKS_MORNING_01'),
('EMS251203032', NOW(), NULL, FALSE, 'Thứ 3 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 7, 'WKS_AFTERNOON_01'),
('EMS251204031', NOW(), NULL, FALSE, 'Thứ 4 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 7, 'WKS_MORNING_01'),
('EMS251204032', NOW(), NULL, FALSE, 'Thứ 4 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 7, 'WKS_AFTERNOON_01'),
('EMS251205031', NOW(), NULL, FALSE, 'Thứ 5 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 7, 'WKS_MORNING_01'),
('EMS251205032', NOW(), NULL, FALSE, 'Thứ 5 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 7, 'WKS_AFTERNOON_01'),
('EMS251206031', NOW(), NULL, FALSE, 'Thứ 6 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 7, 'WKS_MORNING_01'),
('EMS251206032', NOW(), NULL, FALSE, 'Thứ 6 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 7, 'WKS_AFTERNOON_01'),

-- Y tá Khang (EMP008 - FULL_TIME NURSE) - Full week Mon-Fri
('EMS251202041', NOW(), NULL, FALSE, 'Thứ 2 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 8, 'WKS_MORNING_01'),
('EMS251202042', NOW(), NULL, FALSE, 'Thứ 2 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 8, 'WKS_AFTERNOON_01'),
('EMS251203041', NOW(), NULL, FALSE, 'Thứ 3 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 8, 'WKS_MORNING_01'),
('EMS251203042', NOW(), NULL, FALSE, 'Thứ 3 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 8, 'WKS_AFTERNOON_01'),
('EMS251204041', NOW(), NULL, FALSE, 'Thứ 4 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 8, 'WKS_MORNING_01'),
('EMS251204042', NOW(), NULL, FALSE, 'Thứ 4 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 8, 'WKS_AFTERNOON_01'),
('EMS251205041', NOW(), NULL, FALSE, 'Thứ 5 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 8, 'WKS_MORNING_01'),
('EMS251205042', NOW(), NULL, FALSE, 'Thứ 5 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 8, 'WKS_AFTERNOON_01'),
('EMS251206041', NOW(), NULL, FALSE, 'Thứ 6 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 8, 'WKS_MORNING_01'),
('EMS251206042', NOW(), NULL, FALSE, 'Thứ 6 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 8, 'WKS_AFTERNOON_01'),

-- Lễ tân Thuận (EMP005 - FULL_TIME RECEPTIONIST) - Full week Mon-Fri
('EMS251202081', NOW(), NULL, FALSE, 'Thứ 2 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 5, 'WKS_MORNING_01'),
('EMS251202082', NOW(), NULL, FALSE, 'Thứ 2 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 5, 'WKS_AFTERNOON_01'),
('EMS251203081', NOW(), NULL, FALSE, 'Thứ 3 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 5, 'WKS_MORNING_01'),
('EMS251203082', NOW(), NULL, FALSE, 'Thứ 3 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 5, 'WKS_AFTERNOON_01'),
('EMS251204081', NOW(), NULL, FALSE, 'Thứ 4 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 5, 'WKS_MORNING_01'),
('EMS251204082', NOW(), NULL, FALSE, 'Thứ 4 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 5, 'WKS_AFTERNOON_01'),
('EMS251205081', NOW(), NULL, FALSE, 'Thứ 5 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 5, 'WKS_MORNING_01'),
('EMS251205082', NOW(), NULL, FALSE, 'Thứ 5 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 5, 'WKS_AFTERNOON_01'),
('EMS251206081', NOW(), NULL, FALSE, 'Thứ 6 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 5, 'WKS_MORNING_01'),
('EMS251206082', NOW(), NULL, FALSE, 'Thứ 6 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 5, 'WKS_AFTERNOON_01'),

-- Quản lý Quân (EMP011 - FULL_TIME MANAGER) - Full week Mon-Fri
('EMS251202091', NOW(), NULL, FALSE, 'Thứ 2 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 11, 'WKS_MORNING_01'),
('EMS251202092', NOW(), NULL, FALSE, 'Thứ 2 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-02', 11, 'WKS_AFTERNOON_01'),
('EMS251203091', NOW(), NULL, FALSE, 'Thứ 3 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 11, 'WKS_MORNING_01'),
('EMS251203092', NOW(), NULL, FALSE, 'Thứ 3 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-03', 11, 'WKS_AFTERNOON_01'),
('EMS251204091', NOW(), NULL, FALSE, 'Thứ 4 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 11, 'WKS_MORNING_01'),
('EMS251204092', NOW(), NULL, FALSE, 'Thứ 4 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-04', 11, 'WKS_AFTERNOON_01'),
('EMS251205091', NOW(), NULL, FALSE, 'Thứ 5 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 11, 'WKS_MORNING_01'),
('EMS251205092', NOW(), NULL, FALSE, 'Thứ 5 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-05', 11, 'WKS_AFTERNOON_01'),
('EMS251206091', NOW(), NULL, FALSE, 'Thứ 6 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 11, 'WKS_MORNING_01'),
('EMS251206092', NOW(), NULL, FALSE, 'Thứ 6 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-06', 11, 'WKS_AFTERNOON_01'),

-- ============================================
--  PART-TIME EMPLOYEES working same hours with FULL-TIME
-- Part-time làm chung giờ với full-time employees
-- ============================================

-- BS Minh (EMP003 - PART_TIME_FLEX DENTIST) - Works Mon, Wed, Fri mornings (same time as full-time)
('EMS251202051', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Minh (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-02', 3, 'WKS_MORNING_01'),
('EMS251204051', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Minh (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-04', 3, 'WKS_MORNING_01'),
('EMS251206051', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Minh (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-06', 3, 'WKS_MORNING_01'),

-- BS Lan (EMP004 - PART_TIME_FIXED DENTIST) - Works Tue, Thu afternoons (same time as full-time)
('EMS251203051', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Lan (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-03', 4, 'WKS_AFTERNOON_02'),
('EMS251205051', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Lan (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-05', 4, 'WKS_AFTERNOON_02'),

-- Y tá Nhật (EMP009 - PART_TIME_FIXED NURSE) - Works Mon, Wed, Fri mornings (M/W/F as per spec)
('EMS251202101', NOW(), NULL, FALSE, 'Thứ 2 sáng - Y tá Nhật (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-02', 9, 'WKS_MORNING_02'),
('EMS251204101', NOW(), NULL, FALSE, 'Thứ 4 sáng - Y tá Nhật (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-04', 9, 'WKS_MORNING_02'),
('EMS251206101', NOW(), NULL, FALSE, 'Thứ 6 sáng - Y tá Nhật (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2025-12-06', 9, 'WKS_MORNING_02'),

-- October 2025 shifts (Past month for historical data)
('EMS251001001', NOW(), NULL, FALSE, 'Ca tháng trước đã hoàn thành', 'MANUAL_ENTRY', 'COMPLETED', NOW(), '2025-10-15', 2, 'WKS_MORNING_01'),
('EMS251001002', NOW(), NULL, FALSE, 'Ca tháng trước đã hoàn thành', 'BATCH_JOB', 'COMPLETED', NOW(), '2025-10-16', 3, 'WKS_AFTERNOON_01'),
('EMS251001003', NOW(), NULL, FALSE, 'Ca tháng trước bị hủy', 'MANUAL_ENTRY', 'CANCELLED', NOW(), '2025-10-17', 5, 'WKS_MORNING_01'),


-- ============================================
--  NEW DATA (January 2026 Week 1) - FULL WEEK SCHEDULE (Mon-Fri, Jan 6-10, 2026)
-- Next month coverage for Issue #29
-- Full-time employees: 10 shifts each (Mon-Fri morning+afternoon)
-- Part-time employees: 2-3 shifts overlapping with full-time hours
-- ============================================

-- BS Khoa (EMP001 - FULL_TIME DENTIST) - Full week Mon-Fri
('EMS260106011', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 1, 'WKS_MORNING_01'),
('EMS260106012', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 1, 'WKS_AFTERNOON_01'),
('EMS260107011', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 1, 'WKS_MORNING_01'),
('EMS260107012', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 1, 'WKS_AFTERNOON_01'),
('EMS260108011', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 1, 'WKS_MORNING_01'),
('EMS260108012', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 1, 'WKS_AFTERNOON_01'),
('EMS260109011', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 1, 'WKS_MORNING_01'),
('EMS260109012', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 1, 'WKS_AFTERNOON_01'),
('EMS260110011', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 1, 'WKS_MORNING_01'),
('EMS260110012', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Khoa', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 1, 'WKS_AFTERNOON_01'),

-- BS Thái (EMP002 - FULL_TIME DENTIST) - Full week Mon-Fri
('EMS260106021', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 2, 'WKS_MORNING_01'),
('EMS260106022', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 2, 'WKS_AFTERNOON_01'),
('EMS260107021', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 2, 'WKS_MORNING_01'),
('EMS260107022', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 2, 'WKS_AFTERNOON_01'),
('EMS260108021', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 2, 'WKS_MORNING_01'),
('EMS260108022', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 2, 'WKS_AFTERNOON_01'),
('EMS260109021', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 2, 'WKS_MORNING_01'),
('EMS260109022', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 2, 'WKS_AFTERNOON_01'),
('EMS260110021', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 2, 'WKS_MORNING_01'),
('EMS260110022', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 2, 'WKS_AFTERNOON_01'),

-- Y tá Nguyên (EMP007 - FULL_TIME NURSE) - Full week Mon-Fri
('EMS260106031', NOW(), NULL, FALSE, 'Thứ 2 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 7, 'WKS_MORNING_01'),
('EMS260106032', NOW(), NULL, FALSE, 'Thứ 2 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 7, 'WKS_AFTERNOON_01'),
('EMS260107031', NOW(), NULL, FALSE, 'Thứ 3 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 7, 'WKS_MORNING_01'),
('EMS260107032', NOW(), NULL, FALSE, 'Thứ 3 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 7, 'WKS_AFTERNOON_01'),
('EMS260108031', NOW(), NULL, FALSE, 'Thứ 4 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 7, 'WKS_MORNING_01'),
('EMS260108032', NOW(), NULL, FALSE, 'Thứ 4 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 7, 'WKS_AFTERNOON_01'),
('EMS260109031', NOW(), NULL, FALSE, 'Thứ 5 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 7, 'WKS_MORNING_01'),
('EMS260109032', NOW(), NULL, FALSE, 'Thứ 5 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 7, 'WKS_AFTERNOON_01'),
('EMS260110031', NOW(), NULL, FALSE, 'Thứ 6 sáng - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 7, 'WKS_MORNING_01'),
('EMS260110032', NOW(), NULL, FALSE, 'Thứ 6 chiều - Y tá Nguyên', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 7, 'WKS_AFTERNOON_01'),

-- Y tá Khang (EMP008 - FULL_TIME NURSE) - Full week Mon-Fri
('EMS260106041', NOW(), NULL, FALSE, 'Thứ 2 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 8, 'WKS_MORNING_01'),
('EMS260106042', NOW(), NULL, FALSE, 'Thứ 2 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 8, 'WKS_AFTERNOON_01'),
('EMS260107041', NOW(), NULL, FALSE, 'Thứ 3 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 8, 'WKS_MORNING_01'),
('EMS260107042', NOW(), NULL, FALSE, 'Thứ 3 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 8, 'WKS_AFTERNOON_01'),
('EMS260108041', NOW(), NULL, FALSE, 'Thứ 4 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 8, 'WKS_MORNING_01'),
('EMS260108042', NOW(), NULL, FALSE, 'Thứ 4 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 8, 'WKS_AFTERNOON_01'),
('EMS260109041', NOW(), NULL, FALSE, 'Thứ 5 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 8, 'WKS_MORNING_01'),
('EMS260109042', NOW(), NULL, FALSE, 'Thứ 5 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 8, 'WKS_AFTERNOON_01'),
('EMS260110041', NOW(), NULL, FALSE, 'Thứ 6 sáng - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 8, 'WKS_MORNING_01'),
('EMS260110042', NOW(), NULL, FALSE, 'Thứ 6 chiều - Y tá Khang', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 8, 'WKS_AFTERNOON_01'),

-- Lễ tân Thuận (EMP005 - FULL_TIME RECEPTIONIST) - Full week Mon-Fri
('EMS260106081', NOW(), NULL, FALSE, 'Thứ 2 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 5, 'WKS_MORNING_01'),
('EMS260106082', NOW(), NULL, FALSE, 'Thứ 2 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 5, 'WKS_AFTERNOON_01'),
('EMS260107081', NOW(), NULL, FALSE, 'Thứ 3 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 5, 'WKS_MORNING_01'),
('EMS260107082', NOW(), NULL, FALSE, 'Thứ 3 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 5, 'WKS_AFTERNOON_01'),
('EMS260108081', NOW(), NULL, FALSE, 'Thứ 4 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 5, 'WKS_MORNING_01'),
('EMS260108082', NOW(), NULL, FALSE, 'Thứ 4 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 5, 'WKS_AFTERNOON_01'),
('EMS260109081', NOW(), NULL, FALSE, 'Thứ 5 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 5, 'WKS_MORNING_01'),
('EMS260109082', NOW(), NULL, FALSE, 'Thứ 5 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 5, 'WKS_AFTERNOON_01'),
('EMS260110081', NOW(), NULL, FALSE, 'Thứ 6 sáng - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 5, 'WKS_MORNING_01'),
('EMS260110082', NOW(), NULL, FALSE, 'Thứ 6 chiều - Lễ tân Thuận', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 5, 'WKS_AFTERNOON_01'),

-- Quản lý Quân (EMP011 - FULL_TIME MANAGER) - Full week Mon-Fri
('EMS260106091', NOW(), NULL, FALSE, 'Thứ 2 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 11, 'WKS_MORNING_01'),
('EMS260106092', NOW(), NULL, FALSE, 'Thứ 2 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-06', 11, 'WKS_AFTERNOON_01'),
('EMS260107091', NOW(), NULL, FALSE, 'Thứ 3 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 11, 'WKS_MORNING_01'),
('EMS260107092', NOW(), NULL, FALSE, 'Thứ 3 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-07', 11, 'WKS_AFTERNOON_01'),
('EMS260108091', NOW(), NULL, FALSE, 'Thứ 4 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 11, 'WKS_MORNING_01'),
('EMS260108092', NOW(), NULL, FALSE, 'Thứ 4 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-08', 11, 'WKS_AFTERNOON_01'),
('EMS260109091', NOW(), NULL, FALSE, 'Thứ 5 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 11, 'WKS_MORNING_01'),
('EMS260109092', NOW(), NULL, FALSE, 'Thứ 5 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-09', 11, 'WKS_AFTERNOON_01'),
('EMS260110091', NOW(), NULL, FALSE, 'Thứ 6 sáng - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 11, 'WKS_MORNING_01'),
('EMS260110092', NOW(), NULL, FALSE, 'Thứ 6 chiều - Quản lý Quân', 'BATCH_JOB', 'SCHEDULED', NOW(), '2026-01-10', 11, 'WKS_AFTERNOON_01'),

-- BS Minh (EMP003 - PART_TIME_FLEX DENTIST) - Mon, Wed, Fri mornings
('EMS260106051', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Minh (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-06', 3, 'WKS_MORNING_02'),
('EMS260108051', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Minh (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-08', 3, 'WKS_MORNING_02'),
('EMS260110051', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Minh (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-10', 3, 'WKS_MORNING_02'),

-- BS Lan (EMP004 - PART_TIME_FIXED DENTIST) - Tue, Thu afternoons
('EMS260107051', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Lan (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-07', 4, 'WKS_AFTERNOON_02'),
('EMS260109051', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Lan (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-09', 4, 'WKS_AFTERNOON_02'),

-- Y tá Nhật (EMP009 - PART_TIME_FIXED NURSE) - Mon, Wed, Fri mornings (M/W/F as per spec)
('EMS260106101', NOW(), NULL, FALSE, 'Thứ 2 sáng - Y tá Nhật (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-06', 9, 'WKS_MORNING_02'),
('EMS260108101', NOW(), NULL, FALSE, 'Thứ 4 sáng - Y tá Nhật (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-08', 9, 'WKS_MORNING_02'),
('EMS260110101', NOW(), NULL, FALSE, 'Thứ 6 sáng - Y tá Nhật (Part-time)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-10', 9, 'WKS_MORNING_02'),

-- Y tá Chính (EMP010 - PART_TIME_FLEX NURSE) - Wed, Fri afternoons
('EMS260108071', NOW(), NULL, FALSE, 'Thứ 4 chiều - Y tá Chính (Part-time flex)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-08', 10, 'WKS_AFTERNOON_02'),
('EMS260110071', NOW(), NULL, FALSE, 'Thứ 6 chiều - Y tá Chính (Part-time flex)', 'MANUAL_ENTRY', 'SCHEDULED', NOW(), '2026-01-10', 10, 'WKS_AFTERNOON_02'),

-- ============================================
--  NEW DATA - Thêm lịch làm cho BS Thái (EMP002) cho tháng 12/2025
-- Week Dec 9-13, 2025 (Thứ 2 - Thứ 6)
-- ============================================
('EMS251209021', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-09', 2, 'WKS_MORNING_01'),
('EMS251209022', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-09', 2, 'WKS_AFTERNOON_01'),
('EMS251210021', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-10', 2, 'WKS_MORNING_01'),
('EMS251210022', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-10', 2, 'WKS_AFTERNOON_01'),
('EMS251211021', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-11', 2, 'WKS_MORNING_01'),
('EMS251211022', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-11', 2, 'WKS_AFTERNOON_01'),
('EMS251212021', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-12', 2, 'WKS_MORNING_01'),
('EMS251212022', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-12', 2, 'WKS_AFTERNOON_01'),
('EMS251213021', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-13', 2, 'WKS_MORNING_01'),
('EMS251213022', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-13', 2, 'WKS_AFTERNOON_01'),

-- Week Dec 16-20, 2025 (Thứ 2 - Thứ 6)
('EMS251216021', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-16', 2, 'WKS_MORNING_01'),
('EMS251216022', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-16', 2, 'WKS_AFTERNOON_01'),
('EMS251217021', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-17', 2, 'WKS_MORNING_01'),
('EMS251217022', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-17', 2, 'WKS_AFTERNOON_01'),
('EMS251218021', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-18', 2, 'WKS_MORNING_01'),
('EMS251218022', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-18', 2, 'WKS_AFTERNOON_01'),
('EMS251219021', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-19', 2, 'WKS_MORNING_01'),
('EMS251219022', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-19', 2, 'WKS_AFTERNOON_01'),
('EMS251220021', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-20', 2, 'WKS_MORNING_01'),
('EMS251220022', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-20', 2, 'WKS_AFTERNOON_01'),

-- Week Dec 23-27, 2025 (Thứ 2 - Thứ 6)
('EMS251223021', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-23', 2, 'WKS_MORNING_01'),
('EMS251223022', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-23', 2, 'WKS_AFTERNOON_01'),
('EMS251224021', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-24', 2, 'WKS_MORNING_01'),
('EMS251224022', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-24', 2, 'WKS_AFTERNOON_01'),
('EMS251225021', NOW(), NULL, FALSE, 'Thứ 4 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-25', 2, 'WKS_MORNING_01'),
('EMS251225022', NOW(), NULL, FALSE, 'Thứ 4 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-25', 2, 'WKS_AFTERNOON_01'),
('EMS251226021', NOW(), NULL, FALSE, 'Thứ 5 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-26', 2, 'WKS_MORNING_01'),
('EMS251226022', NOW(), NULL, FALSE, 'Thứ 5 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-26', 2, 'WKS_AFTERNOON_01'),
('EMS251227021', NOW(), NULL, FALSE, 'Thứ 6 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-27', 2, 'WKS_MORNING_01'),
('EMS251227022', NOW(), NULL, FALSE, 'Thứ 6 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-27', 2, 'WKS_AFTERNOON_01'),

-- Week Dec 30-31, 2025 (Thứ 2 - Thứ 4)
('EMS251230021', NOW(), NULL, FALSE, 'Thứ 2 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-30', 2, 'WKS_MORNING_01'),
('EMS251230022', NOW(), NULL, FALSE, 'Thứ 2 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-30', 2, 'WKS_AFTERNOON_01'),
('EMS251231021', NOW(), NULL, FALSE, 'Thứ 3 sáng - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-31', 2, 'WKS_MORNING_01'),
('EMS251231022', NOW(), NULL, FALSE, 'Thứ 3 chiều - BS Thái', 'BATCH_JOB', 'SCHEDULED', NOW(), '2025-12-31', 2, 'WKS_AFTERNOON_01')

ON CONFLICT (employee_shift_id) DO NOTHING;



-- ============================================
-- HOLIDAY DEFINITIONS (New Schema with 2 tables)
-- ============================================
-- Production holidays: TET_2025, LIBERATION_DAY, LABOR_DAY, NATIONAL_DAY, NEW_YEAR, HUNG_KINGS
-- Test holidays: MAINTENANCE_WEEK (for FE testing shift blocking)
-- ============================================

-- Step 1: Insert holiday definitions (one by one to avoid conflicts)
INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('TET_2025', 'Tết Nguyên Đán 2025', 'NATIONAL', 'Lunar New Year 2025 - Vietnamese traditional holiday', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;

INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('LIBERATION_DAY', 'Ngày Giải phóng miền Nam', 'NATIONAL', 'Reunification Day - April 30th', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;

INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('LABOR_DAY', 'Ngày Quốc tế Lao động', 'NATIONAL', 'International Labor Day - May 1st', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;

INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('NATIONAL_DAY', 'Ngày Quốc khánh', 'NATIONAL', 'Vietnam National Day - September 2nd', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;

INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('NEW_YEAR', 'Tết Dương lịch', 'NATIONAL', 'Gregorian New Year', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;

INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('HUNG_KINGS', 'Giỗ Tổ Hùng Vương', 'NATIONAL', 'Hung Kings Commemoration Day', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;


-- Step 2: Insert holiday dates (specific dates for each definition)
-- Tết Nguyên Đán 2025 (Jan 29 - Feb 4, 2025)
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-01-29', 'TET_2025', 'Ngày Tết Nguyên Đán (30 Tết)', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-01-30', 'TET_2025', 'Mùng 1 Tết', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-01-31', 'TET_2025', 'Mùng 2 Tết', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-02-01', 'TET_2025', 'Mùng 3 Tết', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-02-02', 'TET_2025', 'Mùng 4 Tết', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-02-03', 'TET_2025', 'Mùng 5 Tết', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-02-04', 'TET_2025', 'Mùng 6 Tết', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;


-- Liberation Day & Labor Day (April 30 - May 1, 2025)
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-04-30', 'LIBERATION_DAY', 'Ngày Giải phóng miền Nam', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-05-01', 'LABOR_DAY', 'Ngày Quốc tế Lao động', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;


-- Hung Kings Commemoration Day 2025 (April 18, 2025 - lunar March 10th)
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-04-18', 'HUNG_KINGS', 'Giỗ Tổ Hùng Vương', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;


-- National Day (September 2, 2025)
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-09-02', 'NATIONAL_DAY', 'Quốc khánh Việt Nam', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;


-- New Year (January 1, 2025)
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-01-01', 'NEW_YEAR', 'Tết Dương lịch 2025', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;


-- ============================================
-- TEST DATA: MAINTENANCE_WEEK (For FE Testing)
-- ============================================
-- Purpose: Test holiday blocking functionality for shifts
-- Use Case: FE can test shift creation blocking on holidays
-- Dates: Next week (Monday, Wednesday, Friday)
-- Note: These are example dates - update as needed for testing
-- ============================================

INSERT INTO holiday_definitions (definition_id, holiday_name, holiday_type, description, created_at, updated_at)
VALUES ('MAINTENANCE_WEEK', 'System Maintenance Week', 'COMPANY', 'Scheduled system maintenance - For testing holiday blocking', NOW(), NOW())
ON CONFLICT (definition_id) DO NOTHING;


--  OLD DATA (November 2025) - Add 3 maintenance days (Monday, Wednesday, Friday of a test week)
-- Example: November 3, 5, 7, 2025
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-11-03', 'MAINTENANCE_WEEK', 'Monday maintenance - Test holiday blocking', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-11-05', 'MAINTENANCE_WEEK', 'Wednesday maintenance - Test holiday blocking', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-11-07', 'MAINTENANCE_WEEK', 'Friday maintenance - Test holiday blocking', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

--  NEW DATA (December 2025) - Add Christmas and Year-end maintenance days
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-12-25', 'MAINTENANCE_WEEK', 'Christmas Day - System maintenance', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2025-12-31', 'MAINTENANCE_WEEK', 'New Year Eve - System maintenance', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

--  NEW DATA (January 2026) - Add New Year and Tet preparation maintenance days
INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2026-01-01', 'NEW_YEAR', 'Tết Dương lịch 2026', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2026-01-26', 'MAINTENANCE_WEEK', 'Pre-Tet system maintenance', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;

INSERT INTO holiday_dates (holiday_date, definition_id, description, created_at, updated_at)
VALUES ('2026-01-27', 'MAINTENANCE_WEEK', 'Pre-Tet system maintenance', NOW(), NOW())
ON CONFLICT (holiday_date, definition_id) DO NOTHING;


--  Expected Behavior (OLD DATA - November 2025):
-- Creating shifts on 2025-11-04 (Tuesday) or 2025-11-06 (Thursday) should SUCCEED
-- Creating shifts on 2025-11-03 (Monday), 2025-11-05 (Wednesday), or 2025-11-07 (Friday) should return 409 HOLIDAY_CONFLICT
-- Time-off requests spanning these dates should SUCCEED (expected behavior)
-- Batch jobs should SKIP these dates when auto-creating shifts

-- ============================================
-- WORKING SCHEDULE SAMPLE DATA (Schema V14 Hybrid)
-- ============================================
-- Sample data for testing Hybrid Schedule System:
-- - Luồng 1 (Fixed): fixed_shift_registrations + fixed_registration_days
-- - Luồng 2 (Flex): part_time_slots + part_time_registrations (UPDATED V14)
-- ============================================

-- ============================================
-- LUỒNG 1: FIXED SHIFT REGISTRATIONS
-- For FULL_TIME and PART_TIME_FIXED employees
-- ============================================

-- Fixed registration for Dr. Minh (FULL_TIME) - Weekdays Morning Shift
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(1, 2, 'WKS_MORNING_01', '2025-01-01', '2026-12-31', TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(1, 'MONDAY'),
(1, 'TUESDAY'),
(1, 'WEDNESDAY'),
(1, 'THURSDAY'),
(1, 'FRIDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


-- Fixed registration for Dr. Lan (FULL_TIME) - Weekdays Afternoon Shift
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(2, 3, 'WKS_AFTERNOON_01', '2025-01-01', '2026-12-31', TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(2, 'MONDAY'),
(2, 'TUESDAY'),
(2, 'WEDNESDAY'),
(2, 'THURSDAY'),
(2, 'FRIDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


--  OLD DATA (November 2025 start date) - Fixed registration for Receptionist Mai (FULL_TIME) - Weekdays Morning Part-time
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(3, 4, 'WKS_MORNING_02', '2025-11-01', '2026-10-31', TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(3, 'MONDAY'),
(3, 'TUESDAY'),
(3, 'WEDNESDAY'),
(3, 'THURSDAY'),
(3, 'FRIDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


-- Fixed registration for Accountant Tuan (FULL_TIME) - Full week Morning
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(4, 5, 'WKS_MORNING_01', '2025-01-01', NULL, TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(4, 'MONDAY'),
(4, 'TUESDAY'),
(4, 'WEDNESDAY'),
(4, 'THURSDAY'),
(4, 'FRIDAY'),
(4, 'SATURDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


--  OLD DATA (November 2025 start date) - Fixed registration for Nurse Hoa (PART_TIME_FIXED) - Monday, Wednesday, Friday Morning
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(5, 6, 'WKS_MORNING_02', '2025-11-01', '2026-04-30', TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(5, 'MONDAY'),
(5, 'WEDNESDAY'),
(5, 'FRIDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


-- Fixed registration for Manager Quan (FULL_TIME) - Flexible schedule
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(6, 7, 'WKS_MORNING_01', '2025-01-01', NULL, TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(6, 'TUESDAY'),
(6, 'THURSDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


--  OLD DATA (November 2025 start date) - Fixed registration for Nurse Trang (PART_TIME_FIXED) - Tuesday, Thursday, Saturday Afternoon
INSERT INTO fixed_shift_registrations (
    registration_id, employee_id, work_shift_id,
    effective_from, effective_to, is_active, created_at
)
VALUES
(7, 9, 'WKS_AFTERNOON_02', '2025-11-01', '2026-10-31', TRUE, NOW())
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO fixed_registration_days (registration_id, day_of_week)
VALUES
(7, 'TUESDAY'),
(7, 'THURSDAY'),
(7, 'SATURDAY')
ON CONFLICT (registration_id, day_of_week) DO NOTHING;


-- Reset sequence for fixed_shift_registrations to prevent duplicate key errors
SELECT setval('fixed_shift_registrations_registration_id_seq',
    COALESCE((SELECT MAX(registration_id) FROM fixed_shift_registrations), 0) + 1,
    false);

-- ============================================
--  OLD DATA (November 2025 dates) - SCHEMA MIGRATION: Add effective_from, effective_to to part_time_slots
-- BE-403: Dynamic quota system for part-time flex scheduling
-- ============================================
ALTER TABLE part_time_slots
ADD COLUMN IF NOT EXISTS effective_from DATE NOT NULL DEFAULT '2025-11-04',
ADD COLUMN IF NOT EXISTS effective_to DATE NOT NULL DEFAULT '2026-02-04';

-- Remove default values after adding columns
ALTER TABLE part_time_slots
ALTER COLUMN effective_from DROP DEFAULT,
ALTER COLUMN effective_to DROP DEFAULT;

-- ============================================
-- LUỒNG 2: PART-TIME FLEX REGISTRATIONS
-- For PART_TIME_FLEX employees
-- ============================================

-- STEP 1: Create Part-Time Slots (Admin creates available slots)
-- Week schedule with varied quotas
-- BE-403: Added effective_from, effective_to for dynamic quota system
-- REDUCED TO 5 SLOTS FOR CLEANER TESTING

--  OLD DATA (November 2025 dates) - MONDAY Slots
INSERT INTO part_time_slots (
    slot_id, work_shift_id, day_of_week, quota, is_active, effective_from, effective_to, created_at
)
VALUES
(1, 'WKS_MORNING_02', 'MONDAY', 2, TRUE, '2025-11-04', '2026-02-04', NOW())
ON CONFLICT (slot_id) DO NOTHING;


--  OLD DATA (November 2025 dates) - WEDNESDAY Slots
INSERT INTO part_time_slots (
    slot_id, work_shift_id, day_of_week, quota, is_active, effective_from, effective_to, created_at
)
VALUES
(2, 'WKS_AFTERNOON_02', 'WEDNESDAY', 2, TRUE, '2025-11-04', '2026-02-04', NOW())
ON CONFLICT (slot_id) DO NOTHING;


--  OLD DATA (November 2025 dates) - FRIDAY Slots
INSERT INTO part_time_slots (
    slot_id, work_shift_id, day_of_week, quota, is_active, effective_from, effective_to, created_at
)
VALUES
(3, 'WKS_MORNING_02', 'FRIDAY', 2, TRUE, '2025-11-04', '2026-02-04', NOW())
ON CONFLICT (slot_id) DO NOTHING;


--  OLD DATA (November 2025 dates) - SATURDAY Slots (Higher quota for weekend)
INSERT INTO part_time_slots (
    slot_id, work_shift_id, day_of_week, quota, is_active, effective_from, effective_to, created_at
)
VALUES
(4, 'WKS_AFTERNOON_02', 'SATURDAY', 3, TRUE, '2025-11-04', '2026-02-04', NOW())
ON CONFLICT (slot_id) DO NOTHING;


--  OLD DATA (November 2025 dates) - SUNDAY Slots (Inactive slot for testing)
INSERT INTO part_time_slots (
    slot_id, work_shift_id, day_of_week, quota, is_active, effective_from, effective_to, created_at
)
VALUES
(5, 'WKS_MORNING_02', 'SUNDAY', 1, FALSE, '2025-11-04', '2026-02-04', NOW())
ON CONFLICT (slot_id) DO NOTHING;


-- Reset sequence after manual inserts with explicit IDs
-- This prevents "duplicate key value violates unique constraint" errors
SELECT setval('part_time_slots_slot_id_seq',
              (SELECT COALESCE(MAX(slot_id), 0) + 1 FROM part_time_slots),
              false);

-- One FULL slot for testing SLOT_IS_FULL error
-- NOTE: Using slot_id=1 (MONDAY morning, quota=2) for "full slot" test scenario
-- It will have 2 registrations to make it full

-- STEP 2: Part-Time Registrations (BE-403: Dynamic Quota System)
-- ============================================
-- IMPORTANT: New Registration Flow (Updated for dayOfWeek API)
-- ============================================
-- Part-time registrations are now created through the API endpoint:
-- POST /api/v1/registrations/part-time
-- with body: {"partTimeSlotId": X, "effectiveFrom": "...", "effectiveTo": "...", "dayOfWeek": ["MONDAY", "THURSDAY"]}
--
-- The system will:
-- 1. Calculate all dates matching the dayOfWeek within the date range
-- 2. Check availability (quota) for each date
-- 3. Create PENDING registration with only available dates
-- 4. Manager approves/rejects via: PATCH /api/v1/admin/registrations/part-time/{id}/status
--
-- DO NOT manually insert APPROVED registrations - this bypasses quota validation!
-- Use the API endpoints to ensure proper quota enforcement.
-- ============================================

-- Example: To create test data, use API calls or create PENDING registrations and approve them properly
-- Uncomment below if you need sample registrations for testing (but prefer API usage):

-- Nurse Linh (employee_id=8, PART_TIME_FLEX) - NO PRE-SEEDED REGISTRATIONS
-- Users should create registrations via API to test the new dayOfWeek flow

-- Additional PART_TIME_FLEX employees for testing
-- These employees have NO pre-seeded registrations - use API to create registrations for testing

-- Test Employee 13: PART_TIME_FLEX (for multi-employee quota testing)
INSERT INTO accounts (account_id, username, password, email, status, role_id, created_at)
VALUES
(20, 'yta13', '$2a$10$RI1iV7k4XJFBWpQUCr.5L.ufNjjXlqvP0z1XrTiT8bKvYpHEtUQ8O', 'yta13@test.com', 'ACTIVE', 'ROLE_NURSE', NOW())
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO employees (employee_id, account_id, employee_code, first_name, last_name, phone, date_of_birth, address, employment_type, is_active, created_at)
VALUES
(13, 20, 'EMP013', 'Minh', 'Lê Thị', '0909999999', '2000-01-15', '789 Nguyễn Huệ, Q1, TPHCM', 'PART_TIME_FLEX', TRUE, NOW())
ON CONFLICT (employee_id) DO NOTHING;


-- Test Employee 14: PART_TIME_FLEX
INSERT INTO accounts (account_id, username, password, email, status, role_id, created_at)
VALUES
(21, 'yta14', '$2a$10$RI1iV7k4XJFBWpQUCr.5L.ufNjjXlqvP0z1XrTiT8bKvYpHEtUQ8O', 'yta14@test.com', 'ACTIVE', 'ROLE_NURSE', NOW())
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO employees (employee_id, account_id, employee_code, first_name, last_name, phone, date_of_birth, address, employment_type, is_active, created_at)
VALUES
(14, 21, 'EMP014', 'Hương', 'Phạm Thị', '0901111111', '1999-05-20', '321 Lê Lợi, Q1, TPHCM', 'PART_TIME_FLEX', TRUE, NOW())
ON CONFLICT (employee_id) DO NOTHING;


-- ============================================
-- NO LEGACY REGISTRATIONS - Clean slate for testing new API flow
-- ============================================
-- All part-time registrations should be created via API endpoints:
-- 1. Employee creates: POST /api/v1/registrations/part-time with dayOfWeek
-- 2. Manager approves: PATCH /api/v1/admin/registrations/part-time/{id}/status
-- This ensures proper quota validation and per-day tracking

-- ============================================
-- RESET ALL SEQUENCES AFTER MANUAL INSERTS
-- ============================================
-- This prevents "duplicate key value violates unique constraint" errors
-- when Hibernate tries to insert new records after database restart

-- Reset accounts sequence
SELECT setval('accounts_account_id_seq',
              (SELECT COALESCE(MAX(account_id), 0) + 1 FROM accounts),
              false);

-- Reset employees sequence
SELECT setval('employees_employee_id_seq',
              (SELECT COALESCE(MAX(employee_id), 0) + 1 FROM employees),
              false);

-- Reset part_time_registrations sequence (NEW - Schema V14)
SELECT setval('part_time_registrations_registration_id_seq',
              (SELECT COALESCE(MAX(registration_id), 0) + 1 FROM part_time_registrations),
              false);

-- Note: part_time_slots sequence is already reset after its inserts above
-- Note: fixed_shift_registrations sequence is already reset after its inserts above

-- ============================================
-- SAMPLE DATA SUMMARY
-- ============================================
-- LUỒNG 1 (FIXED) - 7 registrations:
--   - Dr. Minh (2): M-F Morning
--   - Dr. Lan (3): M-F Afternoon
--   - Receptionist Mai (4): M-F Morning Part-time
--   - Accountant Tuan (5): M-Sa Morning
--   - Nurse Hoa (6): M/W/F Morning Part-time (PART_TIME_FIXED)
--   - Manager Quan (7): Tu/Th Morning
--   - Nurse Trang (9): Tu/Th/Sa Afternoon Part-time (PART_TIME_FIXED)
--
-- LUỒNG 2 (FLEX) - 5 slots (REDUCED FOR CLEANER TESTING):
--   - 5 part-time slots created (4 active, 1 inactive)
--   - Monday Morning, Wednesday Afternoon, Friday Morning, Saturday Afternoon (active)
--   - Sunday Morning (inactive for testing)
--   - NO pre-seeded registrations - use API to create test data
-- ============================================

-- ============================================
-- EMPLOYEE LEAVE BALANCES - ANNUAL LEAVE (P5.2)
-- ============================================
-- Seed initial annual leave balances for all employees
-- Each employee gets 12 days per year for 2025
-- ============================================

-- Delete existing annual leave balances for 2025 to avoid duplicates
DELETE FROM employee_leave_balances
WHERE time_off_type_id = 'ANNUAL_LEAVE' AND cycle_year = 2025;

INSERT INTO employee_leave_balances (
    employee_id, time_off_type_id, cycle_year,
    total_days_allowed, days_taken, notes
)
VALUES
-- Admin (employee_id=1) - 2025
(1, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Dr. Minh (employee_id=2) - 2025
(2, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Dr. Lan (employee_id=3) - 2025
(3, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Receptionist Mai (employee_id=4) - 2025
(4, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Accountant Tuan (employee_id=5) - 2025
(5, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Nurse Hoa (employee_id=6) - 2025
(6, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Manager Quan (employee_id=7) - 2025
(7, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Nurse Linh (employee_id=8) - 2025 (Part-time flex)
(8, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo'),

-- Nurse Trang (employee_id=9) - 2025 (Part-time fixed)
(9, 'ANNUAL_LEAVE', 2025, 12.0, 0.0, 'Phép năm 2025 - Khởi tạo');

-- =============================================
-- SEED DATA CHO SERVICES & TREATMENT PLANS (V17)
-- =============================================

-- =============================================
-- BƯỚC 1: INSERT SERVICE CATEGORIES (V17)
-- =============================================
-- Category grouping for services with display ordering
-- Used by FE to organize service selection UI
-- =============================================

INSERT INTO service_categories (category_code, category_name, display_order, is_active, created_at) VALUES
('A_GENERAL', 'A. Nha khoa tổng quát', 1, true, NOW()),
('B_COSMETIC', 'B. Thẩm mỹ & Phục hình', 2, true, NOW()),
('C_IMPLANT', 'C. Cắm ghép Implant', 3, true, NOW()),
('D_ORTHO', 'D. Chỉnh nha', 4, true, NOW()),
('E_PROS_DENTURE', 'E. Phục hình Tháo lắp', 5, true, NOW()),
('F_OTHER', 'F. Dịch vụ khác', 6, true, NOW())
ON CONFLICT (category_code) DO NOTHING;


-- =============================================
-- BƯỚC 2: INSERT DỊCH VỤ (SERVICES) - V17 UPDATED
-- =============================================
-- Specialization IDs mapping:
-- 1: Chỉnh nha (Orthodontics)
-- 2: Nội nha (Endodontics)
-- 3: Nha chu (Periodontics)
-- 4: Phục hồi răng (Prosthodontics)
-- 5: Phẫu thuật hàm mặt (Oral Surgery)
-- 6: Nha khoa trẻ em (Pediatric Dentistry)
-- 7: Răng thẩm mỹ (Cosmetic Dentistry)
-- 8: STANDARD - Y tế cơ bản (Required for all medical staff)
--
-- V17 Changes:
-- - Added category_id (FK to service_categories)
-- - Added display_order (for ordering within category)
-- =============================================

INSERT INTO services (service_code, service_name, description, default_duration_minutes, default_buffer_minutes, price, specialization_id, category_id, display_order, is_active, created_at)
SELECT
    vals.service_code,
    vals.service_name,
    vals.description,
    vals.default_duration_minutes,
    vals.default_buffer_minutes,
    vals.price,
    vals.specialization_id,
    sc.category_id,
    vals.display_order,
    vals.is_active,
    vals.created_at
FROM (VALUES
-- A. Nha khoa tổng quát (category_code = 'A_GENERAL')
('GEN_EXAM', 'Khám tổng quát & Tư vấn', 'Khám tổng quát, chụp X-quang phim nhỏ nếu cần thiết để chẩn đoán.', 30, 15, 100000, 8, 'A_GENERAL', 1, true, NOW()),
('GEN_XRAY_PERI', 'Chụp X-Quang quanh chóp', 'Chụp phim X-quang nhỏ tại ghế.', 10, 5, 50000, 8, 'A_GENERAL', 2, true, NOW()),
('SCALING_L1', 'Cạo vôi răng & Đánh bóng - Mức 1', 'Làm sạch vôi răng và mảng bám mức độ ít/trung bình.', 45, 15, 300000, 3, 'A_GENERAL', 3, true, NOW()),
('SCALING_L2', 'Cạo vôi răng & Đánh bóng - Mức 2', 'Làm sạch vôi răng và mảng bám mức độ nhiều.', 60, 15, 400000, 3, 'A_GENERAL', 4, true, NOW()),
('SCALING_VIP', 'Cạo vôi VIP không đau', 'Sử dụng máy rung siêu âm ít ê buốt.', 60, 15, 500000, 3, 'A_GENERAL', 5, true, NOW()),
('FILLING_COMP', 'Trám răng Composite', 'Trám răng sâu, mẻ bằng vật liệu composite thẩm mỹ.', 45, 15, 400000, 2, 'A_GENERAL', 6, true, NOW()),
('FILLING_GAP', 'Đắp kẽ răng thưa Composite', 'Đóng kẽ răng thưa nhỏ bằng composite.', 60, 15, 500000, 7, 'A_GENERAL', 7, true, NOW()),
('EXTRACT_MILK', 'Nhổ răng sữa', 'Nhổ răng sữa cho trẻ em.', 15, 15, 50000, 6, 'A_GENERAL', 8, true, NOW()),
('EXTRACT_NORM', 'Nhổ răng thường', 'Nhổ răng vĩnh viễn đơn giản (không phải răng khôn).', 45, 15, 500000, 5, 'A_GENERAL', 9, true, NOW()),
('EXTRACT_WISDOM_L1', 'Nhổ răng khôn mức 1 (Dễ)', 'Tiểu phẫu nhổ răng khôn mọc thẳng, ít phức tạp.', 60, 30, 1500000, 5, 'A_GENERAL', 10, true, NOW()),
('EXTRACT_WISDOM_L2', 'Nhổ răng khôn mức 2 (Khó)', 'Tiểu phẫu nhổ răng khôn mọc lệch, ngầm.', 90, 30, 2500000, 5, 'A_GENERAL', 11, true, NOW()),
('ENDO_TREAT_ANT', 'Điều trị tủy răng trước', 'Lấy tủy, làm sạch, trám bít ống tủy cho răng cửa/răng nanh.', 60, 15, 1500000, 2, 'A_GENERAL', 12, true, NOW()),
('ENDO_TREAT_POST', 'Điều trị tủy răng sau', 'Lấy tủy, làm sạch, trám bít ống tủy cho răng tiền cối/răng cối.', 75, 15, 2000000, 2, 'A_GENERAL', 13, true, NOW()),
('ENDO_POST_CORE', 'Đóng chốt tái tạo cùi răng', 'Đặt chốt vào ống tủy đã chữa để tăng cường lưu giữ cho mão sứ.', 45, 15, 500000, 4, 'A_GENERAL', 14, true, NOW()),

-- B. Thẩm mỹ & Phục hình (category_code = 'B_COSMETIC')
('BLEACH_ATHOME', 'Tẩy trắng răng tại nhà', 'Cung cấp máng và thuốc tẩy trắng tại nhà.', 30, 15, 800000, 7, 'B_COSMETIC', 1, true, NOW()),
('BLEACH_INOFFICE', 'Tẩy trắng răng tại phòng (Laser)', 'Tẩy trắng bằng đèn chiếu hoặc laser.', 90, 15, 1200000, 7, 'B_COSMETIC', 2, true, NOW()),
('CROWN_PFM', 'Mão răng sứ Kim loại thường', 'Mão sứ sườn kim loại Cr-Co hoặc Ni-Cr.', 60, 15, 1000000, 4, 'B_COSMETIC', 3, true, NOW()),
('CROWN_TITAN', 'Mão răng sứ Titan', 'Mão sứ sườn hợp kim Titan.', 60, 15, 2500000, 4, 'B_COSMETIC', 4, true, NOW()),
('CROWN_ZIR_KATANA', 'Mão răng toàn sứ Katana/Zir HT', 'Mão sứ 100% Zirconia phổ thông.', 60, 15, 3500000, 4, 'B_COSMETIC', 5, true, NOW()),
('CROWN_ZIR_CERCON', 'Mão răng toàn sứ Cercon HT', 'Mão sứ 100% Zirconia cao cấp (Đức).', 60, 15, 5000000, 4, 'B_COSMETIC', 6, true, NOW()),
('CROWN_EMAX', 'Mão răng sứ thủy tinh Emax', 'Mão sứ Lithium Disilicate thẩm mỹ cao.', 60, 15, 6000000, 4, 'B_COSMETIC', 7, true, NOW()),
('CROWN_ZIR_LAVA', 'Mão răng toàn sứ Lava Plus', 'Mão sứ Zirconia đa lớp (Mỹ).', 60, 15, 8000000, 4, 'B_COSMETIC', 8, true, NOW()),
('VENEER_EMAX', 'Mặt dán sứ Veneer Emax', 'Mặt dán sứ Lithium Disilicate mài răng tối thiểu.', 75, 15, 6000000, 7, 'B_COSMETIC', 9, true, NOW()),
('VENEER_LISI', 'Mặt dán sứ Veneer Lisi Ultra', 'Mặt dán sứ Lithium Disilicate (Mỹ).', 75, 15, 8000000, 7, 'B_COSMETIC', 10, true, NOW()),
('INLAY_ONLAY_ZIR', 'Trám sứ Inlay/Onlay Zirconia', 'Miếng trám gián tiếp bằng sứ Zirconia CAD/CAM.', 60, 15, 2000000, 4, 'B_COSMETIC', 11, true, NOW()),
('INLAY_ONLAY_EMAX', 'Trám sứ Inlay/Onlay Emax', 'Miếng trám gián tiếp bằng sứ Emax Press.', 60, 15, 3000000, 4, 'B_COSMETIC', 12, true, NOW()),

-- C. Cắm ghép Implant (category_code = 'C_IMPLANT')
('IMPL_CONSULT', 'Khám & Tư vấn Implant', 'Khám, đánh giá tình trạng xương, tư vấn kế hoạch.', 45, 15, 0, 4, 'C_IMPLANT', 1, true, NOW()),
('IMPL_CT_SCAN', 'Chụp CT Cone Beam (Implant)', 'Chụp phim 3D phục vụ cắm ghép Implant.', 30, 15, 500000, 4, 'C_IMPLANT', 2, true, NOW()),
('IMPL_SURGERY_KR', 'Phẫu thuật đặt trụ Implant Hàn Quốc', 'Phẫu thuật cắm trụ Implant (VD: Osstem, Biotem).', 90, 30, 15000000, 4, 'C_IMPLANT', 3, true, NOW()),
('IMPL_SURGERY_EUUS', 'Phẫu thuật đặt trụ Implant Thụy Sĩ/Mỹ', 'Phẫu thuật cắm trụ Implant (VD: Straumann, Nobel).', 90, 30, 25000000, 4, 'C_IMPLANT', 4, true, NOW()),
('IMPL_BONE_GRAFT', 'Ghép xương ổ răng', 'Phẫu thuật bổ sung xương cho vị trí cắm Implant.', 60, 30, 5000000, 5, 'C_IMPLANT', 5, true, NOW()),
('IMPL_SINUS_LIFT', 'Nâng xoang hàm (Hở/Kín)', 'Phẫu thuật nâng xoang để cắm Implant hàm trên.', 75, 30, 8000000, 5, 'C_IMPLANT', 6, true, NOW()),
('IMPL_HEALING', 'Gắn trụ lành thương (Healing Abutment)', 'Gắn trụ giúp nướu lành thương đúng hình dạng.', 20, 10, 500000, 4, 'C_IMPLANT', 7, true, NOW()),
('IMPL_IMPRESSION', 'Lấy dấu Implant', 'Lấy dấu để làm răng sứ trên Implant.', 30, 15, 0, 4, 'C_IMPLANT', 8, true, NOW()),
('IMPL_CROWN_TITAN', 'Mão sứ Titan trên Implant', 'Làm và gắn mão sứ Titan trên Abutment.', 45, 15, 3000000, 4, 'C_IMPLANT', 9, true, NOW()),
('IMPL_CROWN_ZIR', 'Mão sứ Zirconia trên Implant', 'Làm và gắn mão sứ Zirconia trên Abutment.', 45, 15, 5000000, 4, 'C_IMPLANT', 10, true, NOW()),

-- D. Chỉnh nha (category_code = 'D_ORTHO')
('ORTHO_CONSULT', 'Khám & Tư vấn Chỉnh nha', 'Khám, phân tích phim, tư vấn kế hoạch niềng.', 45, 15, 0, 1, 'D_ORTHO', 1, true, NOW()),
('ORTHO_FILMS', 'Chụp Phim Chỉnh nha (Pano, Ceph)', 'Chụp phim X-quang Toàn cảnh và Sọ nghiêng.', 30, 15, 500000, 1, 'D_ORTHO', 2, true, NOW()),
('ORTHO_BRACES_ON', 'Gắn mắc cài kim loại/sứ', 'Gắn bộ mắc cài lên răng.', 90, 30, 5000000, 1, 'D_ORTHO', 3, true, NOW()),
('ORTHO_ADJUST', 'Tái khám Chỉnh nha / Siết niềng', 'Điều chỉnh dây cung, thay thun định kỳ.', 30, 15, 500000, 1, 'D_ORTHO', 4, true, NOW()),
('ORTHO_INVIS_SCAN', 'Scan mẫu hàm Invisalign', 'Scan 3D mẫu hàm để gửi làm khay Invisalign.', 45, 15, 1000000, 1, 'D_ORTHO', 5, true, NOW()),
('ORTHO_INVIS_ATTACH', 'Gắn Attachment Invisalign', 'Gắn các điểm tạo lực trên răng cho Invisalign.', 60, 15, 2000000, 1, 'D_ORTHO', 6, true, NOW()),
('ORTHO_MINIVIS', 'Cắm Mini-vis Chỉnh nha', 'Phẫu thuật nhỏ cắm vít hỗ trợ niềng răng.', 45, 15, 1500000, 1, 'D_ORTHO', 7, true, NOW()),
('ORTHO_BRACES_OFF', 'Tháo mắc cài & Vệ sinh', 'Tháo bỏ mắc cài sau khi kết thúc niềng.', 60, 15, 1000000, 1, 'D_ORTHO', 8, true, NOW()),
('ORTHO_RETAINER_FIXED', 'Gắn hàm duy trì cố định', 'Dán dây duy trì mặt trong răng.', 30, 15, 1000000, 1, 'D_ORTHO', 9, true, NOW()),
('ORTHO_RETAINER_REMOV', 'Làm hàm duy trì tháo lắp', 'Lấy dấu và giao hàm duy trì (máng trong/Hawley).', 30, 15, 1000000, 1, 'D_ORTHO', 10, true, NOW()),

-- E. Phục hình Tháo lắp (category_code = 'E_PROS_DENTURE')
('PROS_CEMENT', 'Gắn sứ / Thử sứ (Lần 2)', 'Hẹn lần 2 để thử và gắn vĩnh viễn mão sứ, cầu răng, veneer.', 30, 15, 0, 4, 'E_PROS_DENTURE', 1, true, NOW()),
('DENTURE_CONSULT', 'Khám & Lấy dấu Hàm Tháo Lắp', 'Lấy dấu lần đầu để làm hàm giả tháo lắp.', 45, 15, 1000000, 4, 'E_PROS_DENTURE', 2, true, NOW()),
('DENTURE_TRYIN', 'Thử sườn/Thử răng Hàm Tháo Lắp', 'Hẹn thử khung kim loại hoặc thử răng sáp.', 30, 15, 0, 4, 'E_PROS_DENTURE', 3, true, NOW()),
('DENTURE_DELIVERY', 'Giao hàm & Chỉnh khớp cắn', 'Giao hàm hoàn thiện, chỉnh sửa các điểm vướng cộm.', 30, 15, 0, 4, 'E_PROS_DENTURE', 4, true, NOW()),

-- F. Dịch vụ khác (category_code = 'F_OTHER')
('OTHER_DIAMOND', 'Đính đá/kim cương lên răng', 'Gắn đá thẩm mỹ lên răng.', 30, 15, 300000, 7, 'F_OTHER', 1, true, NOW()),
('OTHER_GINGIVECTOMY', 'Phẫu thuật cắt nướu (thẩm mỹ)', 'Làm dài thân răng, điều trị cười hở lợi.', 60, 30, 1000000, 5, 'F_OTHER', 2, true, NOW()),
('EMERG_PAIN', 'Khám cấp cứu / Giảm đau', 'Khám và xử lý khẩn cấp các trường hợp đau nhức, sưng, chấn thương.', 30, 15, 150000, 8, 'F_OTHER', 3, true, NOW()),
('SURG_CHECKUP', 'Tái khám sau phẫu thuật / Cắt chỉ', 'Kiểm tra vết thương sau nhổ răng khôn, cắm Implant, cắt nướu.', 15, 10, 0, 5, 'F_OTHER', 4, true, NOW())
) AS vals(service_code, service_name, description, default_duration_minutes, default_buffer_minutes, price, specialization_id, category_code_ref, display_order, is_active, created_at)
LEFT JOIN service_categories sc ON sc.category_code = vals.category_code_ref
ON CONFLICT (service_code) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order;

-- ============================================
-- ROOM-SERVICES MAPPINGS (V16)
-- Map services to rooms based on room type compatibility
-- NOTE: This MUST be placed AFTER services are inserted!
-- LOGIC: IMPLANT room = ALL STANDARD services + IMPLANT-specific services
-- ============================================
INSERT INTO room_services (room_id, service_id, created_at)
SELECT r.room_id, s.service_id, NOW()
FROM rooms r
CROSS JOIN services s
WHERE
    -- STANDARD rooms (P-01, P-02, P-03) - General services only
    (r.room_type = 'STANDARD' AND s.service_code IN (
        'GEN_EXAM', 'GEN_XRAY_PERI', 'SCALING_L1', 'SCALING_L2', 'SCALING_VIP',
        'FILLING_COMP', 'FILLING_GAP', 'EXTRACT_MILK', 'EXTRACT_NORM',
        'ENDO_TREAT_ANT', 'ENDO_TREAT_POST', 'ENDO_POST_CORE',
        'BLEACH_ATHOME', 'BLEACH_INOFFICE',
        'CROWN_PFM', 'CROWN_TITAN', 'CROWN_ZIR_KATANA', 'CROWN_ZIR_CERCON',
        'CROWN_EMAX', 'CROWN_ZIR_LAVA', 'VENEER_EMAX', 'VENEER_LISI',
        'INLAY_ONLAY_ZIR', 'INLAY_ONLAY_EMAX',
        'PROS_CEMENT', 'DENTURE_CONSULT', 'DENTURE_TRYIN', 'DENTURE_DELIVERY',
        'OTHER_DIAMOND', 'EMERG_PAIN', 'SURG_CHECKUP',
        -- V17 FIX: Added ORTHO services (was missing and caused booking bug)
        'ORTHO_RETAINER_REMOV', 'ORTHO_RETAINER_FIXED', 'ORTHO_BRACES_OFF',
        'ORTHO_MINIVIS', 'ORTHO_INVIS_ATTACH', 'ORTHO_ADJUST', 'ORTHO_BRACES_METAL',
        'ORTHO_BRACES_CERAMIC', 'ORTHO_BRACES_SELF', 'ORTHO_INVISALIGN'
    ))
    OR
    -- IMPLANT room (P-04) - ALL STANDARD services + IMPLANT-specific services
    (r.room_type = 'IMPLANT' AND s.service_code IN (
        -- ALL services from STANDARD rooms
        'GEN_EXAM', 'GEN_XRAY_PERI', 'SCALING_L1', 'SCALING_L2', 'SCALING_VIP',
        'FILLING_COMP', 'FILLING_GAP', 'EXTRACT_MILK', 'EXTRACT_NORM',
        'ENDO_TREAT_ANT', 'ENDO_TREAT_POST', 'ENDO_POST_CORE',
        'BLEACH_ATHOME', 'BLEACH_INOFFICE',
        'CROWN_PFM', 'CROWN_TITAN', 'CROWN_ZIR_KATANA', 'CROWN_ZIR_CERCON',
        'CROWN_EMAX', 'CROWN_ZIR_LAVA', 'VENEER_EMAX', 'VENEER_LISI',
        'INLAY_ONLAY_ZIR', 'INLAY_ONLAY_EMAX',
        'PROS_CEMENT', 'DENTURE_CONSULT', 'DENTURE_TRYIN', 'DENTURE_DELIVERY',
        'OTHER_DIAMOND', 'EMERG_PAIN', 'SURG_CHECKUP',
        -- ORTHO services
        'ORTHO_RETAINER_REMOV', 'ORTHO_RETAINER_FIXED', 'ORTHO_BRACES_OFF',
        'ORTHO_MINIVIS', 'ORTHO_INVIS_ATTACH', 'ORTHO_ADJUST', 'ORTHO_BRACES_METAL',
        'ORTHO_BRACES_CERAMIC', 'ORTHO_BRACES_SELF', 'ORTHO_INVISALIGN',
        -- PLUS Implant-specific services
        'IMPL_CONSULT', 'IMPL_CT_SCAN', 'IMPL_SURGERY_KR', 'IMPL_SURGERY_EUUS',
        'IMPL_BONE_GRAFT', 'IMPL_SINUS_LIFT', 'IMPL_HEALING',
        'IMPL_IMPRESSION', 'IMPL_CROWN_TITAN', 'IMPL_CROWN_ZIR',
        'EXTRACT_WISDOM_L1', 'EXTRACT_WISDOM_L2', 'OTHER_GINGIVECTOMY'
    ))
ON CONFLICT (room_id, service_id) DO NOTHING;


-- =============================================
-- BƯỚC 2.5: INSERT SERVICE DEPENDENCIES (V21 - Clinical Rules Engine)
-- =============================================
-- Quy tắc lâm sàng để đảm bảo an toàn và hiệu quả điều trị
-- =============================================

-- ❌ REMOVED: Rule 1 - GEN_EXAM prerequisite for FILLING_COMP
-- (Removed per Issue #43 - Business requirement: No prerequisite services)
-- Reason: prerequisite rules cause items to be set to WAITING_FOR_PREREQUISITE status
-- which prevents users from booking appointments immediately after plan approval

-- Rule 2: EXTRACT_WISDOM_L2 (Nhổ răng khôn) -> SURG_CHECKUP (Cắt chỉ) phải cách nhau ÍT NHẤT 7 ngày
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, min_days_apart, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'REQUIRES_MIN_DAYS',
    7,
    'Cắt chỉ SAU nhổ răng khôn ít nhất 7 ngày (lý tưởng 7-10 ngày).',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'EXTRACT_WISDOM_L2'
  AND s2.service_code = 'SURG_CHECKUP'
ON CONFLICT DO NOTHING;

-- Rule 3: EXTRACT_WISDOM_L2 (Nhổ răng khôn) và BLEACH_INOFFICE (Tẩy trắng) LOẠI TRỪ cùng ngày
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'EXCLUDES_SAME_DAY',
    'KHÔNG được đặt Nhổ răng khôn và Tẩy trắng cùng ngày (nguy hiểm).',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'EXTRACT_WISDOM_L2'
  AND s2.service_code = 'BLEACH_INOFFICE'
ON CONFLICT DO NOTHING;

-- Rule 3b: Reverse rule - BLEACH_INOFFICE cũng loại trừ EXTRACT_WISDOM_L2
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'EXCLUDES_SAME_DAY',
    'KHÔNG được đặt Tẩy trắng và Nhổ răng khôn cùng ngày (nguy hiểm).',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'BLEACH_INOFFICE'
  AND s2.service_code = 'EXTRACT_WISDOM_L2'
ON CONFLICT DO NOTHING;

-- Rule 4: GEN_EXAM (Khám) và SCALING_L1 (Cạo vôi) GỢI Ý đặt chung (Soft rule)
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'BUNDLES_WITH',
    'Gợi ý: Nên đặt Khám + Cạo vôi cùng lúc để tiết kiệm thời gian.',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'GEN_EXAM'
  AND s2.service_code = 'SCALING_L1'
ON CONFLICT DO NOTHING;

-- Rule 4b: Reverse bundle - SCALING_L1 cũng gợi ý bundle với GEN_EXAM
INSERT INTO service_dependencies (service_id, dependent_service_id, rule_type, receptionist_note, created_at)
SELECT
    s1.service_id,
    s2.service_id,
    'BUNDLES_WITH',
    'Gợi ý: Nên đặt Cạo vôi + Khám cùng lúc để tiết kiệm thời gian.',
    NOW()
FROM services s1, services s2
WHERE s1.service_code = 'SCALING_L1'
  AND s2.service_code = 'GEN_EXAM'
ON CONFLICT DO NOTHING;

-- =============================================
-- BƯỚC 3: INSERT TREATMENT PLAN TEMPLATES
-- =============================================
-- Treatment Plan Templates for common dental procedures
-- Used by doctors to create structured treatment plans
-- =============================================

-- Template 1: Niềng răng mắc cài kim loại (2 năm - 24 tái khám)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_ORTHO_METAL', 'Niềng răng mắc cài kim loại trọn gói 2 năm',
        'Gói điều trị chỉnh nha toàn diện với mắc cài kim loại, bao gồm 24 lần tái khám siết niềng định kỳ.',
        730, 30000000, 1, true, NOW())
ON CONFLICT (template_code) DO NOTHING;


-- Template 2: Implant Hàn Quốc (6 tháng) - Changed specialization_id from 5 to 4 (all services are spec 4)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_IMPLANT_OSSTEM', 'Cấy ghép Implant Hàn Quốc (Osstem) - Trọn gói',
        'Gói cấy ghép Implant hoàn chỉnh từ phẫu thuật đến gắn răng sứ, sử dụng trụ Osstem Hàn Quốc.',
        180, 19000000, 4, true, NOW())
ON CONFLICT (template_code) DO NOTHING;


-- Template 3A: Bọc răng sứ Cercon HT đơn giản (4 ngày)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_CROWN_CERCON_SIMPLE', 'Bọc răng sứ Cercon HT - 1 răng (đơn giản)',
        'Gói bọc răng sứ toàn sứ Cercon HT cho răng đã điều trị tủy hoặc răng còn tủy sống không cần điều trị.',
        4, 3500000, 4, true, NOW())
ON CONFLICT (template_code) DO NOTHING;

-- Template 3B: Disable old mixed-spec template
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_CROWN_CERCON_ENDO', 'Bọc răng sứ Cercon HT - 1 răng (kèm điều trị tủy) - DEPRECATED',
        'DEPRECATED: Template cũ có mixed specializations. Use TPL_ENDO_TREATMENT and TPL_CROWN_AFTER_ENDO instead.',
        7, 5000000, 4, false, NOW())
ON CONFLICT (template_code) DO UPDATE SET is_active = false;

-- ============================================
--  NEW TEMPLATES - One specialization per template
-- ============================================

-- Template 4: Điều trị tủy răng (spec 2: Nội nha) - Only endodontic treatment
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_ENDO_TREATMENT', 'Điều trị tủy răng sau',
        'Gói điều trị tủy răng tiền cối/răng cối, bao gồm lấy tủy, làm sạch và trám bít ống tủy.',
        3, 2000000, 2, true, NOW())
ON CONFLICT (template_code) DO NOTHING;

-- Template 5: Bọc sứ sau điều trị tủy (spec 4: Phục hồi răng) - Restorative work
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_CROWN_AFTER_ENDO', 'Bọc sứ sau điều trị tủy',
        'Gói bọc răng sứ Cercon HT cho răng đã điều trị tủy, bao gồm đóng chốt tái tạo cùi răng, mài răng, lấy dấu và gắn sứ.',
        4, 4500000, 4, true, NOW())
ON CONFLICT (template_code) DO NOTHING;

-- Template 6: Cạo vôi răng định kỳ (spec 3: Nha chu)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_PERIO_SCALING', 'Cạo vôi răng toàn hàm',
        'Gói cạo vôi răng định kỳ cho cả 2 hàm, bao gồm cạo vôi cơ bản + đánh bóng răng.',
        1, 500000, 3, true, NOW())
ON CONFLICT (template_code) DO NOTHING;

-- Template 7: Nhổ răng khôn (spec 5: Phẫu thuật hàm mặt)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_SURGERY_WISDOM', 'Nhổ răng khôn',
        'Gói nhổ răng khôn mọc lệch/ngầm, bao gồm chụp phim, phẫu thuật và tái khám.',
        7, 2000000, 5, true, NOW())
ON CONFLICT (template_code) DO NOTHING;

-- Template 8: Trám răng sữa trẻ em (spec 6: Nha khoa trẻ em)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_PEDO_FILLING', 'Trám răng sữa',
        'Gói trám răng sữa bị sâu cho trẻ em, sử dụng vật liệu GIC an toàn.',
        1, 300000, 6, true, NOW())
ON CONFLICT (template_code) DO NOTHING;

-- Template 9: Tẩy trắng răng (spec 7: Răng thẩm mỹ)
INSERT INTO treatment_plan_templates (template_code, template_name, description, estimated_duration_days, total_price, specialization_id, is_active, created_at)
VALUES ('TPL_COSMETIC_BLEACHING', 'Tẩy trắng răng tại phòng khám',
        'Gói tẩy trắng răng bằng công nghệ Laser/Zoom, bao gồm kiểm tra và làm sạch răng trước tẩy trắng.',
        1, 3000000, 7, true, NOW())
ON CONFLICT (template_code) DO NOTHING;


-- =============================================
-- BƯỚC 4: INSERT TEMPLATE PHASES (Giai đoạn điều trị)
-- =============================================

-- TPL_ORTHO_METAL: 4 giai đoạn
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Giai đoạn 1: Khám & Chuẩn bị', 14, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_ORTHO_METAL'
ON CONFLICT (template_id, phase_number) DO NOTHING;


INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 2, 'Giai đoạn 2: Gắn mắc cài', 1, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_ORTHO_METAL'
ON CONFLICT (template_id, phase_number) DO NOTHING;


INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 3, 'Giai đoạn 3: Điều chỉnh định kỳ (8 tháng)', 715, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_ORTHO_METAL'
ON CONFLICT (template_id, phase_number) DO NOTHING;


INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 4, 'Giai đoạn 4: Tháo niềng & Duy trì', 0, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_ORTHO_METAL'
ON CONFLICT (template_id, phase_number) DO NOTHING;


-- TPL_IMPLANT_OSSTEM: 3 giai đoạn
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Giai đoạn 1: Khám & Chẩn đoán hình ảnh', 7, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_IMPLANT_OSSTEM'
ON CONFLICT (template_id, phase_number) DO NOTHING;


INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 2, 'Giai đoạn 2: Phẫu thuật cắm Implant', 120, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_IMPLANT_OSSTEM'
ON CONFLICT (template_id, phase_number) DO NOTHING;


INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 3, 'Giai đoạn 3: Làm & Gắn răng sứ', 14, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_IMPLANT_OSSTEM'
ON CONFLICT (template_id, phase_number) DO NOTHING;


-- TPL_CROWN_CERCON_SIMPLE: 1 giai đoạn (chỉ bọc sứ)
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Giai đoạn 1: Mài răng, Lấy dấu & Gắn sứ', 4, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_CROWN_CERCON_SIMPLE'
ON CONFLICT (template_id, phase_number) DO NOTHING;

-- TPL_CROWN_CERCON_ENDO: 2 giai đoạn (điều trị tủy + bọc sứ)
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Giai đoạn 1: Điều trị tủy & Trụ sợi', 3, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_CROWN_CERCON_ENDO'
ON CONFLICT (template_id, phase_number) DO NOTHING;


INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 2, 'Giai đoạn 2: Mài răng, Lấy dấu & Gắn sứ', 4, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_CROWN_CERCON_ENDO'
ON CONFLICT (template_id, phase_number) DO NOTHING;


-- =============================================
-- BƯỚC 5: INSERT TEMPLATE PHASE SERVICES (Dịch vụ trong từng giai đoạn)
-- V19: Added sequence_number for ordered item creation
-- =============================================

-- TPL_ORTHO_METAL - Phase 1: Khám & Chuẩn bị (3 services in order)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ORTHO_CONSULT'
WHERE t.template_code = 'TPL_ORTHO_METAL' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ORTHO_FILMS'
WHERE t.template_code = 'TPL_ORTHO_METAL' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;

-- REMOVED SCALING_L1 - periodontics service doesn't belong in orthodontics template


-- TPL_ORTHO_METAL - Phase 2: Gắn mắc cài (1 service)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 90, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ORTHO_BRACES_ON'
WHERE t.template_code = 'TPL_ORTHO_METAL' AND tp.phase_number = 2
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_ORTHO_METAL - Phase 3: Tái khám 8 lần (quantity = 8) - FIXED: Reduced from 24 to 8 for realistic seed data
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 8, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ORTHO_ADJUST'
WHERE t.template_code = 'TPL_ORTHO_METAL' AND tp.phase_number = 3
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_ORTHO_METAL - Phase 4: Tháo niềng & Duy trì (2 services in order)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 60, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ORTHO_BRACES_OFF'
WHERE t.template_code = 'TPL_ORTHO_METAL' AND tp.phase_number = 4
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ORTHO_RETAINER_REMOV'
WHERE t.template_code = 'TPL_ORTHO_METAL' AND tp.phase_number = 4
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_IMPLANT_OSSTEM - Phase 1: Khám & Chẩn đoán (2 services in order)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'IMPL_CONSULT'
WHERE t.template_code = 'TPL_IMPLANT_OSSTEM' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'IMPL_CT_SCAN'
WHERE t.template_code = 'TPL_IMPLANT_OSSTEM' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_IMPLANT_OSSTEM - Phase 2: Phẫu thuật (2 services in order: surgery first, then healing cap)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 90, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'IMPL_SURGERY_KR'
WHERE t.template_code = 'TPL_IMPLANT_OSSTEM' AND tp.phase_number = 2
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 20, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'IMPL_HEALING'
WHERE t.template_code = 'TPL_IMPLANT_OSSTEM' AND tp.phase_number = 2
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_IMPLANT_OSSTEM - Phase 3: Làm răng sứ (2 services in order: impression first, then crown)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'IMPL_IMPRESSION'
WHERE t.template_code = 'TPL_IMPLANT_OSSTEM' AND tp.phase_number = 3
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'IMPL_CROWN_ZIR'
WHERE t.template_code = 'TPL_IMPLANT_OSSTEM' AND tp.phase_number = 3
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_CROWN_CERCON_SIMPLE - Phase 1: Bọc sứ đơn giản (2 services: crown prep + cementing)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 60, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'CROWN_ZIR_CERCON'
WHERE t.template_code = 'TPL_CROWN_CERCON_SIMPLE' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'PROS_CEMENT'
WHERE t.template_code = 'TPL_CROWN_CERCON_SIMPLE' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_CROWN_CERCON_ENDO - Phase 1: Điều trị tủy (2 services: endo treatment + post & core)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 75, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ENDO_TREAT_POST'
WHERE t.template_code = 'TPL_CROWN_CERCON_ENDO' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ENDO_POST_CORE'
WHERE t.template_code = 'TPL_CROWN_CERCON_ENDO' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_CROWN_CERCON_ENDO - Phase 2: Bọc sứ (2 services: crown prep + cementing)
INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 60, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'CROWN_ZIR_CERCON'
WHERE t.template_code = 'TPL_CROWN_CERCON_ENDO' AND tp.phase_number = 2
ON CONFLICT (phase_id, service_id) DO NOTHING;


INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'PROS_CEMENT'
WHERE t.template_code = 'TPL_CROWN_CERCON_ENDO' AND tp.phase_number = 2
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- =============================================
--  NEW TEMPLATE PHASES AND SERVICES
-- =============================================

-- TPL_ENDO_TREATMENT: 1 phase (spec 2: Nội nha) - ONLY spec 2 services
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Điều trị tủy răng sau', 3, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_ENDO_TREATMENT'
ON CONFLICT (template_id, phase_number) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 75, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ENDO_TREAT_POST'
WHERE t.template_code = 'TPL_ENDO_TREATMENT' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_CROWN_AFTER_ENDO: 1 phase (spec 4: Phục hồi răng) - Includes post/core for restored teeth
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Đóng chốt + Bọc răng sứ Cercon HT', 4, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_CROWN_AFTER_ENDO'
ON CONFLICT (template_id, phase_number) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'ENDO_POST_CORE'
WHERE t.template_code = 'TPL_CROWN_AFTER_ENDO' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 2, 1, 60, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'CROWN_ZIR_CERCON'
WHERE t.template_code = 'TPL_CROWN_AFTER_ENDO' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 3, 1, 30, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'PROS_CEMENT'
WHERE t.template_code = 'TPL_CROWN_AFTER_ENDO' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_PERIO_SCALING: 1 phase (spec 3: Nha chu)
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Cạo vôi răng + Đánh bóng', 1, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_PERIO_SCALING'
ON CONFLICT (template_id, phase_number) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'SCALING_L1'
WHERE t.template_code = 'TPL_PERIO_SCALING' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_SURGERY_WISDOM: 1 phase (spec 5: Phẫu thuật)
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Nhổ răng khôn + Tái khám', 7, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_SURGERY_WISDOM'
ON CONFLICT (template_id, phase_number) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 60, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'EXTRACT_WISDOM_L1'
WHERE t.template_code = 'TPL_SURGERY_WISDOM' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_PEDO_FILLING: 1 phase (spec 6: Nha khoa trẻ em)
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Trám răng sữa', 1, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_PEDO_FILLING'
ON CONFLICT (template_id, phase_number) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 45, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'FILLING_COMP'
WHERE t.template_code = 'TPL_PEDO_FILLING' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;


-- TPL_COSMETIC_BLEACHING: 1 phase (spec 7: Răng thẩm mỹ)
INSERT INTO template_phases (template_id, phase_number, phase_name, estimated_duration_days, created_at)
SELECT t.template_id, 1, 'Tẩy trắng răng Laser', 1, NOW()
FROM treatment_plan_templates t WHERE t.template_code = 'TPL_COSMETIC_BLEACHING'
ON CONFLICT (template_id, phase_number) DO NOTHING;

INSERT INTO template_phase_services (phase_id, service_id, sequence_number, quantity, estimated_time_minutes, created_at)
SELECT tp.phase_id, s.service_id, 1, 1, 90, NOW()
FROM template_phases tp
JOIN treatment_plan_templates t ON tp.template_id = t.template_id
JOIN services s ON s.service_code = 'BLEACH_INOFFICE'
WHERE t.template_code = 'TPL_COSMETIC_BLEACHING' AND tp.phase_number = 1
ON CONFLICT (phase_id, service_id) DO NOTHING;



-- 4. EMAIL VERIFICATION:
--   - Seeded accounts: ACTIVE (skip verification)
--   - New accounts via API: PENDING_VERIFICATION (require email)
--   - Default password: 123456 (must change on first login)
--
-- ============================================


-- =====================================================
-- =====================================================

-- Fix specialization_code length error
ALTER TABLE specializations ALTER COLUMN specialization_code TYPE varchar(20);

INSERT INTO specializations (specialization_id, specialization_code, specialization_name, description, is_active, created_at)
VALUES
    (901, 'TEST-IMPLANT', 'Test Implant Specialist', 'Chuyên khoa Cấy ghép Implant (Test)', true, CURRENT_TIMESTAMP),
    (902, 'TEST-ORTHO', 'Test Orthodontics', 'Chuyên khoa Chỉnh nha (Test)', true, CURRENT_TIMESTAMP),
    (903, 'TEST-GENERAL', 'Test General Dentistry', 'Nha khoa tổng quát (Test)', true, CURRENT_TIMESTAMP)
ON CONFLICT (specialization_id) DO NOTHING;

-- =====================================================
--  OLD DATA (November 2025) - 8. EMPLOYEE SHIFTS (Test date: 2025-11-15 - Thứ Bảy)
-- Phòng khám KHÔNG làm Chủ nhật - muốn làm phải overtime
-- Full-time: Ca Sáng (8h-12h) + Ca Chiều (13h-17h)
-- Part-time fixed: Ca Part-time Sáng (8h-12h) hoặc Ca Part-time Chiều (13h-17h)
-- Part-time flex: Đăng ký linh hoạt

--  OLD DATA - Dentist 1: Lê Anh Khoa (Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115001', 1, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 1: Lê Anh Khoa (Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115001B', 1, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 2: Trịnh Công Thái (Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115002', 2, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 2: Trịnh Công Thái (Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115002B', 2, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 3: Jimmy Donaldson (Part-time flex) - Ca Part-time Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115003', 3, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 4: Junya Ota (Part-time fixed) - Ca Part-time Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115004', 4, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 1: Đoàn Nguyễn Khôi Nguyên (Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115007', 7, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 1: Đoàn Nguyễn Khôi Nguyên (Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115007B', 7, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 2: Nguyễn Trần Tuấn Khang (Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115008A', 8, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 2: Nguyễn Trần Tuấn Khang (Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115008', 8, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 3: Huỳnh Tấn Quang Nhật (Part-time fixed) - Ca Part-time Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115009', 9, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 4: Ngô Đình Chính (Part-time flex) - Ca Part-time Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251115010', 10, DATE '2025-11-15', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- ============================================
--  OLD DATA (November 2025) - SHIFTS FOR 2025-11-21 (FOR TESTING TREATMENT PLAN BOOKING)
-- ============================================

--  OLD DATA - Dentist 1: Lê Anh Khoa (EMP001 - Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251121001', 1, DATE '2025-11-21', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 1: Lê Anh Khoa (EMP001 - Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251121001B', 1, DATE '2025-11-21', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 2: Trịnh Công Thái (EMP002 - Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251121002', 2, DATE '2025-11-21', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 2: Trịnh Công Thái (EMP002 - Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251121002B', 2, DATE '2025-11-21', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 3: Jimmy Donaldson (EMP003 - Part-time flex) - Ca Part-time Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251121003', 3, DATE '2025-11-21', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 4: Junya Ota (EMP004 - Part-time fixed) - Ca Part-time Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251121004', 4, DATE '2025-11-21', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- ============================================
--  OLD DATA (November 2025) - SHIFTS FOR 2025-11-25 (FOR TESTING TREATMENT PLAN BOOKING)
-- ============================================

--  OLD DATA - Dentist 1: Lê Anh Khoa (EMP001 - Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125001', 1, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 1: Lê Anh Khoa (EMP001 - Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125001B', 1, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 2: Trịnh Công Thái (EMP002 - Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125002', 2, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 2: Trịnh Công Thái (EMP002 - Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125002B', 2, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- ============================================
-- NEW SHIFTS FOR EMPLOYEE 2 (Trịnh Công Thái) - December 2025, January 2026, February 2026
-- ============================================

-- December 2025: 10 shifts (Dec 2-6)
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251202001', 2, DATE '2025-12-02', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251202002', 2, DATE '2025-12-02', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251203001', 2, DATE '2025-12-03', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251203002', 2, DATE '2025-12-03', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251204001', 2, DATE '2025-12-04', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251204002', 2, DATE '2025-12-04', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251205001', 2, DATE '2025-12-05', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251205002', 2, DATE '2025-12-05', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251206001', 2, DATE '2025-12-06', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS251206002', 2, DATE '2025-12-06', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW()
ON CONFLICT (employee_shift_id) DO NOTHING;

-- January 2026: 10 shifts (Jan 5-9)
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS260105001', 2, DATE '2026-01-05', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260105002', 2, DATE '2026-01-05', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260106001', 2, DATE '2026-01-06', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260106002', 2, DATE '2026-01-06', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260107001', 2, DATE '2026-01-07', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260107002', 2, DATE '2026-01-07', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260108001', 2, DATE '2026-01-08', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260108002', 2, DATE '2026-01-08', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260109001', 2, DATE '2026-01-09', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260109002', 2, DATE '2026-01-09', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW()
ON CONFLICT (employee_shift_id) DO NOTHING;

-- February 2026: 8 shifts (Feb 3-6)
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS260203001', 2, DATE '2026-02-03', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260203002', 2, DATE '2026-02-03', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260204001', 2, DATE '2026-02-04', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260204002', 2, DATE '2026-02-04', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260205001', 2, DATE '2026-02-05', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260205002', 2, DATE '2026-02-05', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260206001', 2, DATE '2026-02-06', 'WKS_MORNING_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW() UNION ALL
SELECT 'EMS260206002', 2, DATE '2026-02-06', 'WKS_AFTERNOON_01', 'MANUAL_ENTRY', FALSE, 'SCHEDULED', NOW()
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 3: Jimmy Donaldson (EMP003 - Part-time flex) - Ca Part-time Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125003', 3, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Dentist 4: Junya Ota (EMP004 - Part-time fixed) - Ca Part-time Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125004', 4, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 1: Đoàn Nguyễn Khôi Nguyên (EMP007 - Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125007', 7, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 1: Đoàn Nguyễn Khôi Nguyên (EMP007 - Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125007B', 7, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 2: Nguyễn Trần Tuấn Khang (EMP008 - Full-time) - Ca Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125008A', 8, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 2: Nguyễn Trần Tuấn Khang (EMP008 - Full-time) - Ca Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125008', 8, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 3: Huỳnh Tấn Quang Nhật (EMP009 - Part-time fixed) - Ca Part-time Sáng
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125009', 9, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Sáng (8h-12h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- Y tá 4: Ngô Đình Chính (EMP010 - Part-time flex) - Ca Part-time Chiều
INSERT INTO employee_shifts (employee_shift_id, employee_id, work_date, work_shift_id, source, is_overtime, status, created_at)
SELECT 'EMS251125010', 10, DATE '2025-11-25', work_shift_id, 'MANUAL_ENTRY', FALSE, 'SCHEDULED', CURRENT_TIMESTAMP
FROM work_shifts WHERE shift_name = 'Ca Part-time Chiều (13h-17h)' LIMIT 1
ON CONFLICT (employee_shift_id) DO NOTHING;

-- ============================================
--  OLD DATA (November 2025) - 9. SAMPLE APPOINTMENTS (Test date: 2025-11-04)
-- For testing GET /api/v1/appointments with OBSERVER role
-- ============================================

--  OLD DATA - APT-001: Lịch hẹn Ca Sáng - Bác sĩ Khoa + Y tá Nguyên + OBSERVER (EMP012)
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    1, 'APT-20251104-001', 1, 1, 'GHE251103001',
    '2025-11-04 09:00:00', '2025-11-04 09:45:00', 45,
    'SCHEDULED', 'Khám tổng quát + Lấy cao răng - Test OBSERVER', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

-- Services cho APT-001
INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (1, 1),  -- GEN_EXAM (service_id=1, first in services table)
    (1, 3)   -- SCALING_L1 (service_id=3, third in services table)
ON CONFLICT (appointment_id, service_id) DO NOTHING;


-- Participants cho APT-001: Y tá + OBSERVER
INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES
    (1, 7, 'ASSISTANT'),    -- EMP007 - Y tá Nguyên
    (1, 12, 'OBSERVER')    -- EMP012 - Thực tập sinh Linh (TEST DATA)
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


--  OLD DATA - APT-002: Lịch hẹn Ca Chiều - Bác sĩ Thái (KHÔNG có OBSERVER)
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    2, 'APT-20251104-002', 2, 2, 'GHE251103002',
    '2025-11-04 14:00:00', '2025-11-04 14:30:00', 30,
    'SCHEDULED', 'Khám tổng quát - NO OBSERVER', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

-- Services cho APT-002
INSERT INTO appointment_services (appointment_id, service_id)
VALUES (2, 1)  -- GEN_EXAM service_id=1
ON CONFLICT (appointment_id, service_id) DO NOTHING;


--  OLD DATA - APT-003: Lịch hẹn LATE (quá giờ 15 phút) - Test computedStatus
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    3, 'APT-20251104-003', 3, 1, 'GHE251103001',
    '2025-11-04 08:00:00', '2025-11-04 08:30:00', 30,
    'SCHEDULED', 'Test LATE status - Bệnh nhân chưa check-in', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

-- Services cho APT-003
INSERT INTO appointment_services (appointment_id, service_id)
VALUES (3, 1)  -- GEN_EXAM service_id=1
ON CONFLICT (appointment_id, service_id) DO NOTHING;


-- Participants cho APT-003: Thực tập sinh Linh làm OBSERVER
INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (3, 12, 'OBSERVER')  -- EMP012 - Thực tập sinh Linh
ON CONFLICT (appointment_id, employee_id) DO NOTHING;



-- ============================================
--  OLD DATA (November 2025) - NEW: FUTURE APPOINTMENTS (Nov 6-8, 2025) for current date testing
-- ============================================

--  OLD DATA - APT-004: Nov 6 Morning - BS Khoa (EMP001) - NOW HAS SHIFT!
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    4, 'APT-20251106-001', 1, 1, 'GHE251103001',
    '2025-11-06 09:00:00', '2025-11-06 09:30:00', 30,
    'IN_PROGRESS', 'Khám tổng quát - BS Khoa ca sáng - Benh nhan dang kham', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (4, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (4, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-005: Nov 6 Afternoon - BS Lê Anh Khoa (EMP001) - FIXED: EMP001 has PERIODONTICS specialization
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    5, 'APT-20251106-002', 2, 1, 'GHE251103002',
    '2025-11-06 14:00:00', '2025-11-06 14:45:00', 45,
    'SCHEDULED', 'Lấy cao răng + Khám - BS Khoa ca chiều', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (5, 1),  -- GEN_EXAM
    (5, 3)   -- SCALING_L1 (requires specialization_id=3 PERIODONTICS, EMP001 has it)
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (5, 8, 'ASSISTANT')  -- EMP008 - Y tá Khang
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-006: Nov 7 Morning - BS Jimmy (EMP003)
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    6, 'APT-20251107-001', 3, 3, 'GHE251103003',
    '2025-11-07 10:00:00', '2025-11-07 10:30:00', 30,
    'SCHEDULED', 'Khám nha khoa trẻ em - BS Jimmy', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (6, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (6, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-007: Nov 7 Afternoon - BS Thái (EMP002) - Can be used for reschedule testing
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    7, 'APT-20251107-002', 4, 2, 'GHE251103002',
    '2025-11-07 15:00:00', '2025-11-07 15:30:00', 30,
    'SCHEDULED', 'Khám định kỳ - BN Mít tơ bít', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (7, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (7, 8, 'ASSISTANT')  -- EMP008 - Y tá Khang
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-008: Nov 8 Morning - BS Khoa (EMP001) - Multiple services
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    8, 'APT-20251108-001', 2, 1, 'GHE251103001',
    '2025-11-08 09:30:00', '2025-11-08 10:15:00', 45,
    'SCHEDULED', 'Lấy cao răng nâng cao - BS Khoa', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (8, 1),  -- GEN_EXAM
    (8, 4)   -- SCALING_L2 (Advanced scaling)
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (8, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- Reset appointments sequence after seed data
SELECT setval('appointments_appointment_id_seq',
              (SELECT COALESCE(MAX(appointment_id), 0) FROM appointments) + 1,
              false);

-- ============================================
--  NEW DATA (December 2025) - APPOINTMENTS
-- ============================================

-- APT-D001: Dec 4 Morning - BS Khoa + Y tá Nguyên + OBSERVER (EMP012)
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    101, 'APT-20251204-001', 1, 1, 'GHE251103001',
    '2025-12-04 09:00:00', '2025-12-04 09:45:00', 45,
    'SCHEDULED', 'Khám tổng quát + Lấy cao răng - Test OBSERVER', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (101, 1),  -- GEN_EXAM
    (101, 3)   -- SCALING_L1
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES
    (101, 7, 'ASSISTANT'),    -- EMP007 - Y tá Nguyên
    (101, 12, 'OBSERVER')    -- EMP012 - Thực tập sinh Linh
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-D002: Dec 4 Afternoon - BS Thái (NO OBSERVER)
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    102, 'APT-20251204-002', 2, 2, 'GHE251103002',
    '2025-12-04 14:00:00', '2025-12-04 14:30:00', 30,
    'SCHEDULED', 'Khám tổng quát - NO OBSERVER', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (102, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


-- APT-D003: Dec 4 Early Morning - Test LATE status
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    103, 'APT-20251204-003', 3, 1, 'GHE251103001',
    '2025-12-04 08:00:00', '2025-12-04 08:30:00', 30,
    'SCHEDULED', 'Test LATE status - Bệnh nhân chưa check-in', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (103, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (103, 12, 'OBSERVER')  -- EMP012 - Thực tập sinh Linh
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-D004: Dec 6 Morning - BS Khoa
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    104, 'APT-20251206-001', 1, 1, 'GHE251103001',
    '2025-12-06 09:00:00', '2025-12-06 09:30:00', 30,
    'SCHEDULED', 'Khám tổng quát - BS Khoa ca sáng', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (104, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


-- APT-D005: Dec 6 Afternoon - BS Minh
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    105, 'APT-20251206-002', 3, 3, 'GHE251103003',
    '2025-12-06 14:30:00', '2025-12-06 15:00:00', 30,
    'SCHEDULED', 'Khám tổng quát - BS Minh ca chiều', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (105, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (105, 8, 'ASSISTANT')  -- EMP008 - Y tá Khang
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-D006: Dec 7 Morning - BS Lan + Multiple services
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    106, 'APT-20251207-001', 4, 4, 'GHE251103004',
    '2025-12-07 10:00:00', '2025-12-07 10:45:00', 45,
    'SCHEDULED', 'Khám tổng quát + Nhổ răng - BS Lan', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (106, 1),  -- GEN_EXAM
    (106, 7)   -- EXTRACTION (Nhổ răng)
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (106, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-D007: Dec 7 Afternoon - BS Thái
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    107, 'APT-20251207-002', 4, 2, 'GHE251103002',
    '2025-12-07 15:00:00', '2025-12-07 15:30:00', 30,
    'SCHEDULED', 'Khám định kỳ - BN Mít tơ bít', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (107, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (107, 8, 'ASSISTANT')  -- EMP008 - Y tá Khang
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-D008: Dec 8 Morning - BS Khoa + Multiple services
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    108, 'APT-20251208-001', 2, 1, 'GHE251103001',
    '2025-12-08 09:30:00', '2025-12-08 10:15:00', 45,
    'SCHEDULED', 'Lấy cao răng nâng cao - BS Khoa', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (108, 1),  -- GEN_EXAM
    (108, 4)   -- SCALING_L2 (Advanced scaling)
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (108, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- ============================================
--  NEW DATA (January 2026) - APPOINTMENTS
-- ============================================

-- APT-J001: Jan 6 Morning - BS Khoa + Y tá Nguyên + OBSERVER
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    201, 'APT-20260106-001', 1, 1, 'GHE251103001',
    '2026-01-06 09:00:00', '2026-01-06 09:45:00', 45,
    'SCHEDULED', 'Khám tổng quát + Lấy cao răng - Test OBSERVER', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (201, 1),  -- GEN_EXAM
    (201, 3)   -- SCALING_L1
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES
    (201, 7, 'ASSISTANT'),    -- EMP007 - Y tá Nguyên
    (201, 12, 'OBSERVER')    -- EMP012 - Thực tập sinh Linh
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-J002: Jan 6 Afternoon - BS Thái (NO OBSERVER)
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    202, 'APT-20260106-002', 2, 2, 'GHE251103002',
    '2026-01-06 14:00:00', '2026-01-06 14:30:00', 30,
    'SCHEDULED', 'Khám tổng quát - NO OBSERVER', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (202, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


-- APT-J003: Jan 6 Early Morning - Test LATE status
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    203, 'APT-20260106-003', 3, 1, 'GHE251103001',
    '2026-01-06 08:00:00', '2026-01-06 08:30:00', 30,
    'SCHEDULED', 'Test LATE status - Bệnh nhân chưa check-in', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (203, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (203, 12, 'OBSERVER')  -- EMP012 - Thực tập sinh Linh
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-J004: Jan 8 Morning - BS Khoa
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    204, 'APT-20260108-001', 1, 1, 'GHE251103001',
    '2026-01-08 09:00:00', '2026-01-08 09:30:00', 30,
    'SCHEDULED', 'Khám tổng quát - BS Khoa ca sáng', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (204, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;


-- APT-J005: Jan 8 Afternoon - BS Minh
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    205, 'APT-20260108-002', 3, 3, 'GHE251103003',
    '2026-01-08 14:30:00', '2026-01-08 15:00:00', 30,
    'SCHEDULED', 'Khám tổng quát - BS Minh ca chiều', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (205, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (205, 8, 'ASSISTANT')  -- EMP008 - Y tá Khang
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-J006: Jan 9 Morning - BS Lan + Multiple services
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    206, 'APT-20260109-001', 4, 4, 'GHE251103004',
    '2026-01-09 10:00:00', '2026-01-09 10:45:00', 45,
    'SCHEDULED', 'Khám tổng quát + Nhổ răng - BS Lan', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (206, 1),  -- GEN_EXAM
    (206, 7)   -- EXTRACTION (Nhổ răng)
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (206, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-J007: Jan 9 Afternoon - BS Thái
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    207, 'APT-20260109-002', 4, 2, 'GHE251103002',
    '2026-01-09 15:00:00', '2026-01-09 15:30:00', 30,
    'SCHEDULED', 'Khám định kỳ - BN Mít tơ bít', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES (207, 1)  -- GEN_EXAM
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (207, 8, 'ASSISTANT')  -- EMP008 - Y tá Khang
ON CONFLICT (appointment_id, employee_id) DO NOTHING;


-- APT-J008: Jan 10 Morning - BS Khoa + Multiple services
INSERT INTO appointments (
    appointment_id, appointment_code, patient_id, employee_id, room_id,
    appointment_start_time, appointment_end_time, expected_duration_minutes,
    status, notes, created_by, created_at, updated_at
) VALUES (
    208, 'APT-20260110-001', 2, 1, 'GHE251103001',
    '2026-01-10 09:30:00', '2026-01-10 10:15:00', 45,
    'SCHEDULED', 'Lấy cao răng nâng cao - BS Khoa', 5, NOW(), NOW()
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO appointment_services (appointment_id, service_id)
VALUES
    (208, 1),  -- GEN_EXAM
    (208, 4)   -- SCALING_L2 (Advanced scaling)
ON CONFLICT (appointment_id, service_id) DO NOTHING;

INSERT INTO appointment_participants (appointment_id, employee_id, participant_role)
VALUES (208, 7, 'ASSISTANT')  -- EMP007 - Y tá Nguyên
ON CONFLICT (appointment_id, employee_id) DO NOTHING;

-- ============================================

-- Fix appointment_audit_logs table if missing columns (with correct ENUM types)
-- NOTE: Uncomment ONLY if you have an old database with missing/wrong columns
-- For new databases, schema.sql creates this table correctly
-- Better solution: Drop the table and let Hibernate recreate it correctly
--
-- If you must migrate existing data, run these commands separately:
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS action_type appointment_action_type;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS reason_code appointment_reason_code;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS old_value TEXT;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS old_start_time TIMESTAMP;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS new_start_time TIMESTAMP;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS old_status appointment_status_enum;
-- ALTER TABLE appointment_audit_logs ADD COLUMN IF NOT EXISTS new_status appointment_status_enum;

-- ============================================
-- TREATMENT PLANS SEED DATA
-- ============================================

-- Treatment Plan 1: Bệnh nhân BN-1001 (Đoàn Thanh Phong) - Niềng răng
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    patient_consent_date, approved_by, approved_at, created_at
) VALUES (
    1, 'PLAN-20251001-001', 'Lộ trình Niềng răng Mắc cài Kim loại', 1, 1,
    'IN_PROGRESS', 'APPROVED', '2025-10-01', '2027-10-01',
    35000000, 0, 35000000, 'INSTALLMENT',
    '2025-10-01 08:30:00', 3, '2025-10-02 09:00:00', NOW()
)
ON CONFLICT (plan_id) DO NOTHING;

-- Phase 1: Chuẩn bị
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    1, 1, 1, 'Giai đoạn 1: Chuẩn bị và Kiểm tra',
    'COMPLETED', '2025-10-01', '2025-10-06', 7, NOW()
)
ON CONFLICT (patient_phase_id) DO NOTHING;

-- Items for Phase 1
INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (1, 1, 1, 1, 'Khám tổng quát và chụp X-quang', 'COMPLETED', 30, 500000, '2025-10-02 09:00:00', NOW()),
    (2, 1, 3, 2, 'Lấy cao răng trước niềng', 'COMPLETED', 45, 800000, '2025-10-03 10:30:00', NOW()),
    (3, 1, 7, 3, 'Hàn trám răng sâu (nếu có)', 'COMPLETED', 60, 1500000, '2025-10-05 14:00:00', NOW())
ON CONFLICT (item_id) DO NOTHING;


-- Phase 2: Lắp mắc cài
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    2, 1, 2, 'Giai đoạn 2: Lắp Mắc cài và Điều chỉnh ban đầu',
    'IN_PROGRESS', '2025-10-15', 60, NOW()
)
ON CONFLICT (patient_phase_id) DO NOTHING;

-- Items for Phase 2
INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (4, 2, 38, 1, 'Lắp mắc cài kim loại hàm trên', 'COMPLETED', 90, 8000000, '2025-10-16 09:00:00', NOW()),
    (5, 2, 38, 2, 'Lắp mắc cài kim loại hàm dưới', 'COMPLETED', 90, 8000000, '2025-10-17 10:00:00', NOW()),
    (6, 2, 39, 3, 'Điều chỉnh lần 1 (sau 1 tháng)', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (7, 2, 39, 4, 'Điều chỉnh lần 2 (sau 2 tháng)', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW())
ON CONFLICT (item_id) DO NOTHING;


-- Phase 3: Điều chỉnh định kỳ (FIXED: 24→8 months for realistic seed data)
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    3, 1, 3, 'Giai đoạn 3: Điều chỉnh định kỳ (8 tháng)',
    'PENDING', NULL, 240, NOW()
)
ON CONFLICT (patient_phase_id) DO NOTHING;

-- Items for Phase 3 (8 adjustment sessions - months 3 to 10)
INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (8, 3, 39, 1, 'Điều chỉnh tháng 3', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (9, 3, 39, 2, 'Điều chỉnh tháng 4', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (10, 3, 39, 3, 'Điều chỉnh tháng 5', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (11, 3, 39, 4, 'Điều chỉnh tháng 6', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (12, 3, 39, 5, 'Điều chỉnh tháng 7', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (13, 3, 39, 6, 'Điều chỉnh tháng 8', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (14, 3, 39, 7, 'Điều chỉnh tháng 9', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW()),
    (15, 3, 39, 8, 'Điều chỉnh tháng 10', 'READY_FOR_BOOKING', 45, 500000, NULL, NOW())
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 2: Bệnh nhân BN-1002 (Phạm Văn Phong) - Implant
-- FIX: Changed creator from 2 (Dentist Thái - no Implant spec) to 4 (Dentist Junya - has spec 5)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    patient_consent_date, approved_by, approved_at, created_at
) VALUES (
    2, 'PLAN-20240515-001', 'Lộ trình Implant 2 răng cửa', 2, 4,
    'COMPLETED', 'APPROVED', '2024-05-15', '2024-08-20',
    40000000, 5000000, 35000000, 'FULL',
    '2024-05-14 15:00:00', 3, '2024-05-14 16:00:00', '2024-05-15 10:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

-- Phase 1: Chuẩn bị Implant
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    4, 2, 1, 'Giai đoạn 1: Khám và Chuẩn bị',
    'COMPLETED', '2024-05-15', '2024-05-20', 7, '2024-05-15 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (16, 4, 1, 1, 'Khám tổng quát và chụp CT', 'COMPLETED', 45, 1500000, '2024-05-15 11:00:00', '2024-05-15 10:00:00'),
    (17, 4, 3, 2, 'Vệ sinh răng miệng', 'COMPLETED', 30, 800000, '2024-05-16 09:00:00', '2024-05-15 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Phase 2: Cấy Implant
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    5, 2, 2, 'Giai đoạn 2: Cấy trụ Implant',
    'COMPLETED', '2024-06-01', '2024-06-05', 5, '2024-05-15 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (18, 5, 29, 1, 'Cấy Implant răng cửa số 11', 'COMPLETED', 120, 18000000, '2024-06-01 14:00:00', '2024-05-15 10:00:00'),
    (19, 5, 29, 2, 'Cấy Implant răng cửa số 21', 'COMPLETED', 120, 18000000, '2024-06-02 10:00:00', '2024-05-15 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Phase 3: Lắp răng sứ
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    6, 2, 3, 'Giai đoạn 3: Lắp mão sứ (sau 3 tháng lành xương)',
    'COMPLETED', '2024-08-15', '2024-08-20', 90, '2024-05-15 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (20, 6, 22, 1, 'Lắp mão sứ Titan răng 11', 'COMPLETED', 60, 6000000, '2024-08-15 10:00:00', '2024-05-15 10:00:00'),
    (21, 6, 22, 2, 'Lắp mão sứ Titan răng 21', 'COMPLETED', 60, 6000000, '2024-08-16 10:00:00', '2024-05-15 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 3: Bệnh nhân BN-1003 (Nguyễn Tuấn Anh) - Tẩy trắng răng
-- FIX: Changed creator from 1 (Dentist Khoa - no Cosmetic spec) to 2 (Dentist Thái - has spec 7)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    approved_by, approved_at, created_at
) VALUES (
    3, 'PLAN-20251105-001', 'Lộ trình Tẩy trắng răng Laser', 3, 2,
    'PENDING', 'APPROVED', '2025-11-15', '2025-11-30',
    8000000, 800000, 7200000, 'FULL',
    3, '2025-11-05 14:00:00', NOW()
)
ON CONFLICT (plan_id) DO NOTHING;

-- Phase 1: Chuẩn bị tẩy trắng
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    7, 3, 1, 'Giai đoạn 1: Kiểm tra và Vệ sinh',
    'PENDING', NULL, 3, NOW()
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (22, 7, 1, 1, 'Khám răng miệng tổng quát', 'READY_FOR_BOOKING', 30, 500000, NULL, NOW()),
    (23, 7, 3, 2, 'Lấy cao răng', 'READY_FOR_BOOKING', 45, 800000, NULL, NOW())
ON CONFLICT (item_id) DO NOTHING;


-- Phase 2: Tẩy trắng
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    8, 3, 2, 'Giai đoạn 2: Tẩy trắng Laser',
    'PENDING', NULL, 14, NOW()
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (24, 8, 17, 1, 'Tẩy trắng răng răng Laser lần 1', 'READY_FOR_BOOKING', 90, 5000000, NULL, NOW()),
    (25, 8, 17, 2, 'Kiểm tra và tư vấn sau tẩy trắng', 'READY_FOR_BOOKING', 30, 0, NULL, NOW())
ON CONFLICT (item_id) DO NOTHING;


-- ============================================
-- V20: ADDITIONAL TREATMENT PLANS FOR API 5.5 TESTING
-- ============================================
-- Purpose: Add more treatment plans with various statuses and approval states
-- Coverage: Multiple patients/doctors, date ranges, approval workflows

-- Treatment Plan 4: BN-1003 - Nhổ răng khôn + Tẩy trắng (Doctor EMP-2, PENDING, DRAFT)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    created_at
) VALUES (
    4, 'PLAN-20250110-001', 'Nhổ răng khôn và Tẩy trắng', 3, 2,
    'PENDING', 'DRAFT', '2025-01-20', '2025-02-20',
    8500000, 500000, 8000000, 'FULL',
    '2025-01-10 10:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

-- Phase 1: Nhổ răng khôn
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    9, 4, 1, 'Giai đoạn 1: Nhổ răng khôn',
    'PENDING', '2025-01-20', 7, '2025-01-10 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, created_at
) VALUES
    (26, 9, 14, 1, 'Nhổ răng khôn hàm dưới bên trái', 'READY_FOR_BOOKING', 60, 2500000, '2025-01-10 10:00:00'),
    (27, 9, 14, 2, 'Nhổ răng khôn hàm dưới bên phải', 'READY_FOR_BOOKING', 60, 2500000, '2025-01-10 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Phase 2: Tẩy trắng
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    10, 4, 2, 'Giai đoạn 2: Tẩy trắng răng',
    'PENDING', '2025-02-05', 14, '2025-01-10 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, created_at
) VALUES
    (28, 10, 31, 1, 'Tẩy trắng răng Laser', 'READY_FOR_BOOKING', 90, 3500000, '2025-01-10 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 5: BN-1004 - Bọc răng sứ 6 răng (Doctor EMP-1, IN_PROGRESS, APPROVED)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    approved_by, approved_at, created_at
) VALUES (
    5, 'PLAN-20241215-001', 'Bọc răng sứ thẩm mỹ 6 răng cửa', 4, 1,
    'IN_PROGRESS', 'APPROVED', '2024-12-15', '2025-02-15',
    42000000, 2000000, 40000000, 'INSTALLMENT',
    3, '2024-12-16 09:00:00', '2024-12-15 14:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

-- Phase 1: Khám và chuẩn bị (COMPLETED)
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    11, 5, 1, 'Giai đoạn 1: Khám và chuẩn bị',
    'COMPLETED', '2024-12-15', '2024-12-20', 5, '2024-12-15 14:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (29, 11, 1, 1, 'Khám tổng quát và tư vấn', 'COMPLETED', 30, 500000, '2024-12-15 15:00:00', '2024-12-15 14:00:00'),
    (30, 11, 3, 2, 'Vệ sinh răng miệng', 'COMPLETED', 45, 800000, '2024-12-17 10:00:00', '2024-12-15 14:00:00'),
    (31, 11, 7, 3, 'Mài răng chuẩn bị bọc sứ', 'COMPLETED', 120, 3000000, '2024-12-19 14:00:00', '2024-12-15 14:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Phase 2: Bọc răng sứ (IN_PROGRESS)
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    12, 5, 2, 'Giai đoạn 2: Lắp răng sứ',
    'IN_PROGRESS', '2025-01-05', 30, '2024-12-15 14:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (32, 12, 22, 1, 'Bọc răng sứ Titan răng 11', 'COMPLETED', 60, 6000000, '2025-01-05 10:00:00', '2024-12-15 14:00:00'),
    (33, 12, 22, 2, 'Bọc răng sứ Titan răng 12', 'COMPLETED', 60, 6000000, '2025-01-05 11:00:00', '2024-12-15 14:00:00'),
    (34, 12, 22, 3, 'Bọc răng sứ Titan răng 21', 'COMPLETED', 60, 6000000, '2025-01-06 10:00:00', '2024-12-15 14:00:00'),
    (35, 12, 22, 4, 'Bọc răng sứ Titan răng 22', 'READY_FOR_BOOKING', 60, 6000000, NULL, '2024-12-15 14:00:00'),
    (36, 12, 22, 5, 'Bọc răng sứ Titan răng 13', 'READY_FOR_BOOKING', 60, 6000000, NULL, '2024-12-15 14:00:00'),
    (37, 12, 22, 6, 'Bọc răng sứ Titan răng 23', 'READY_FOR_BOOKING', 60, 6000000, NULL, '2024-12-15 14:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 6: BN-1005 - Trồng răng Implant (Doctor EMP-3, COMPLETED, APPROVED)
-- FIX: Changed creator from 3 (Dentist Jimmy - no Implant spec) to 4 (Dentist Junya - has spec 5)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    approved_by, approved_at, created_at
) VALUES (
    6, 'PLAN-20240815-001', 'Trồng răng Implant răng hàm', 5, 4,
    'COMPLETED', 'APPROVED', '2024-08-15', '2024-12-20',
    25000000, 1000000, 24000000, 'FULL',
    7, '2024-08-16 09:00:00', '2024-08-15 10:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

-- All phases completed
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    13, 6, 1, 'Giai đoạn 1: Khám và Chụp CT', 'COMPLETED', '2024-08-15', '2024-08-20', 5, '2024-08-15 10:00:00'),
    (14, 6, 2, 'Giai đoạn 2: Cấy trụ Implant', 'COMPLETED', '2024-09-01', '2024-09-10', 10, '2024-08-15 10:00:00'),
    (15, 6, 3, 'Giai đoạn 3: Lắp mão sứ', 'COMPLETED', '2024-12-10', '2024-12-20', 10, '2024-08-15 10:00:00')
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (38, 13, 1, 1, 'Khám và chụp CT 3D', 'COMPLETED', 45, 1500000, '2024-08-15 11:00:00', '2024-08-15 10:00:00'),
    (39, 13, 3, 2, 'Vệ sinh răng miệng', 'COMPLETED', 30, 800000, '2024-08-17 10:00:00', '2024-08-15 10:00:00'),
    (40, 14, 29, 1, 'Cấy trụ Implant răng 36', 'COMPLETED', 120, 18000000, '2024-09-01 14:00:00', '2024-08-15 10:00:00'),
    (41, 15, 22, 1, 'Lắp mão sứ Titan răng 36', 'COMPLETED', 60, 6000000, '2024-12-15 10:00:00', '2024-08-15 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 7: BN-1001 - Điều trị nướu răng (Doctor EMP-2, PENDING, DRAFT)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    created_at
) VALUES (
    7, 'PLAN-20250108-001', 'Điều trị viêm nướu và chăm sóc nha chu', 1, 2,
    'PENDING', 'DRAFT', '2025-01-15', '2025-03-15',
    5500000, 0, 5500000, 'FULL',
    '2025-01-08 11:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    16, 7, 1, 'Giai đoạn 1: Vệ sinh và điều trị nướu',
    'PENDING', '2025-01-15', 60, '2025-01-08 11:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, created_at
) VALUES
    (42, 16, 3, 1, 'Vệ sinh răng miệng sâu', 'READY_FOR_BOOKING', 60, 1200000, '2025-01-08 11:00:00'),
    (43, 16, 4, 2, 'Điều trị viêm nướu (Lần 1)', 'READY_FOR_BOOKING', 45, 1500000, '2025-01-08 11:00:00'),
    (44, 16, 4, 3, 'Điều trị viêm nướu (Lần 2)', 'READY_FOR_BOOKING', 45, 1500000, '2025-01-08 11:00:00'),
    (45, 16, 4, 4, 'Kiểm tra và tái khám', 'READY_FOR_BOOKING', 30, 800000, '2025-01-08 11:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 8: BN-1002 - Niềng răng Invisalign (Doctor EMP-1, IN_PROGRESS, APPROVED)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    approved_by, approved_at, created_at
) VALUES (
    8, 'PLAN-20241101-001', 'Niềng răng trong suốt Invisalign', 2, 1,
    'IN_PROGRESS', 'APPROVED', '2024-11-01', '2025-11-01',
    85000000, 5000000, 80000000, 'INSTALLMENT',
    7, '2024-11-02 09:00:00', '2024-11-01 10:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

-- Phase 1: Chuẩn bị (COMPLETED)
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    17, 8, 1, 'Giai đoạn 1: Khám và lập kế hoạch',
    'COMPLETED', '2024-11-01', '2024-11-10', 10, '2024-11-01 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (46, 17, 1, 1, 'Khám tổng quát và chụp CT 3D', 'COMPLETED', 45, 2000000, '2024-11-01 11:00:00', '2024-11-01 10:00:00'),
    (47, 17, 3, 2, 'Vệ sinh răng miệng', 'COMPLETED', 45, 800000, '2024-11-05 10:00:00', '2024-11-01 10:00:00'),
    (48, 17, 40, 3, 'Thiết kế khay Invisalign', 'COMPLETED', 60, 10000000, '2024-11-08 14:00:00', '2024-11-01 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Phase 2: Điều chỉnh (IN_PROGRESS)
INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    18, 8, 2, 'Giai đoạn 2: Đeo khay và điều chỉnh (12 tháng)',
    'IN_PROGRESS', '2024-11-15', 365, '2024-11-01 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (49, 18, 40, 1, 'Bộ khay số 1-5', 'COMPLETED', 30, 15000000, '2024-11-15 10:00:00', '2024-11-01 10:00:00'),
    (50, 18, 40, 2, 'Bộ khay số 6-10', 'COMPLETED', 30, 15000000, '2024-12-15 10:00:00', '2024-11-01 10:00:00'),
    (51, 18, 40, 3, 'Bộ khay số 11-15', 'READY_FOR_BOOKING', 30, 15000000, NULL, '2024-11-01 10:00:00'),
    (52, 18, 40, 4, 'Bộ khay số 16-20', 'READY_FOR_BOOKING', 30, 15000000, NULL, '2024-11-01 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 9: BN-1003 - Hàn răng sâu (Doctor EMP-1, COMPLETED, APPROVED)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    approved_by, approved_at, created_at
) VALUES (
    9, 'PLAN-20240920-001', 'Hàn răng sâu và điều trị tủy', 3, 1,
    'COMPLETED', 'APPROVED', '2024-09-20', '2024-10-05',
    7500000, 500000, 7000000, 'FULL',
    3, '2024-09-21 09:00:00', '2024-09-20 14:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, completion_date, estimated_duration_days, created_at
) VALUES (
    19, 9, 1, 'Giai đoạn 1: Điều trị và hàn răng',
    'COMPLETED', '2024-09-20', '2024-10-05', 15, '2024-09-20 14:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (53, 19, 1, 1, 'Khám và chụp X-quang', 'COMPLETED', 30, 500000, '2024-09-20 15:00:00', '2024-09-20 14:00:00'),
    (54, 19, 8, 2, 'Điều trị tủy răng 16', 'COMPLETED', 90, 3500000, '2024-09-25 10:00:00', '2024-09-20 14:00:00'),
    (55, 19, 7, 3, 'Hàn răng composite 16', 'COMPLETED', 60, 1500000, '2024-09-30 14:00:00', '2024-09-20 14:00:00'),
    (56, 19, 7, 4, 'Hàn răng composite 26', 'COMPLETED', 60, 1500000, '2024-10-02 10:00:00', '2024-09-20 14:00:00'),
    (57, 19, 1, 5, 'Tái khám sau điều trị', 'COMPLETED', 30, 500000, '2024-10-05 11:00:00', '2024-09-20 14:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- Treatment Plan 10: BN-1004 - Cạo vôi răng định kỳ (Doctor EMP-2, IN_PROGRESS, APPROVED)
INSERT INTO patient_treatment_plans (
    plan_id, plan_code, plan_name, patient_id, created_by,
    status, approval_status, start_date, expected_end_date,
    total_price, discount_amount, final_cost, payment_type,
    approved_by, approved_at, created_at
) VALUES (
    10, 'PLAN-20250105-001', 'Vệ sinh răng miệng và chăm sóc định kỳ', 4, 2,
    'IN_PROGRESS', 'APPROVED', '2025-01-05', '2025-07-05',
    3600000, 0, 3600000, 'FULL',
    7, '2025-01-06 09:00:00', '2025-01-05 10:00:00'
)
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO patient_plan_phases (
    patient_phase_id, plan_id, phase_number, phase_name,
    status, start_date, estimated_duration_days, created_at
) VALUES (
    20, 10, 1, 'Giai đoạn 1: Vệ sinh 6 tháng',
    'IN_PROGRESS', '2025-01-05', 180, '2025-01-05 10:00:00'
)
ON CONFLICT (patient_phase_id) DO NOTHING;

INSERT INTO patient_plan_items (
    item_id, phase_id, service_id, sequence_number, item_name,
    status, estimated_time_minutes, price, completed_at, created_at
) VALUES
    (58, 20, 3, 1, 'Cạo vôi răng lần 1', 'COMPLETED', 45, 800000, '2025-01-05 11:00:00', '2025-01-05 10:00:00'),
    (59, 20, 1, 2, 'Khám tổng quát lần 1', 'COMPLETED', 30, 500000, '2025-01-05 12:00:00', '2025-01-05 10:00:00'),
    (60, 20, 3, 3, 'Cạo vôi răng lần 2 (sau 3 tháng)', 'READY_FOR_BOOKING', 45, 800000, NULL, '2025-01-05 10:00:00'),
    (61, 20, 1, 4, 'Khám tổng quát lần 2', 'READY_FOR_BOOKING', 30, 500000, NULL, '2025-01-05 10:00:00'),
    (62, 20, 3, 5, 'Cạo vôi răng lần 3 (sau 6 tháng)', 'READY_FOR_BOOKING', 45, 800000, NULL, '2025-01-05 10:00:00'),
    (63, 20, 1, 6, 'Khám tổng quát lần 3', 'READY_FOR_BOOKING', 30, 500000, NULL, '2025-01-05 10:00:00')
ON CONFLICT (item_id) DO NOTHING;


-- ============================================
-- RESET SEQUENCES
-- ============================================
SELECT setval('patient_treatment_plans_plan_id_seq', (SELECT MAX(plan_id) FROM patient_treatment_plans));
SELECT setval('patient_plan_phases_patient_phase_id_seq', (SELECT MAX(patient_phase_id) FROM patient_plan_phases));
SELECT setval('patient_plan_items_item_id_seq', (SELECT MAX(item_id) FROM patient_plan_items));

-- ============================================
-- FIX: Add PENDING status to patient_plan_items constraint
-- (Required for API 5.3 - Create Treatment Plan from Template)
-- ============================================
-- Ensure 'status' column exists (some DB schemas may be missing this column).
-- We add the column if it does not exist, with a kssensible default 'PENDING'.
ALTER TABLE patient_plan_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';

-- Recreate or add the status check constraint to enforce allowed workflow states
ALTER TABLE patient_plan_items DROP CONSTRAINT IF EXISTS patient_plan_items_status_check;
ALTER TABLE patient_plan_items ADD CONSTRAINT patient_plan_items_status_check
    CHECK (status IN ('PENDING', 'READY_FOR_BOOKING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'WAITING_FOR_PREREQUISITE', 'SKIPPED'));


-- ============================================
-- SEED DATA CHO WAREHOUSE MODULE (V3 API)
-- ============================================

-- =============================================
-- ITEM CATEGORIES (Danh mục vật tư)
-- =============================================
-- Seed data for warehouse item categories
-- Used in CreateItemMasterModal dropdown: "Nhóm Vật Tư"
-- FE Endpoint: GET /api/v1/inventory/categories
-- =============================================
INSERT INTO item_categories (category_code, category_name, description, is_active, created_at)
VALUES
  ('CONSUMABLE', 'Vật tư tiêu hao', 'Vật tư sử dụng một lần (gạc, băng, kim tiêm, bông, khẩu trang, găng tay, ống hút)', true, NOW()),
  ('EQUIPMENT', 'Dụng cụ y tế', 'Thiết bị và dụng cụ tái sử dụng (khay, kìm, kéo, gương nha khoa, đục, dũa, máy siêu âm)', true, NOW()),
  ('MEDICINE', 'Thuốc men', 'Thuốc và dược phẩm (kháng sinh, giảm đau, sát trùng, thuốc gây tê, thuốc kháng viêm)', true, NOW()),
  ('CHEMICAL', 'Hóa chất nha khoa', 'Hóa chất y tế (dung dịch tẩy trắng, chất trám, composite, xi măng, keo dán, acid)', true, NOW()),
  ('MATERIAL', 'Vật liệu nha khoa', 'Vật liệu chuyên dụng (dây chỉnh nha, bracket, implant, crown, veneer, răng giả)', true, NOW()),
  ('LAB_SUPPLY', 'Vật tư phòng LAB', 'Vật tư phòng thí nghiệm (mẫu thử, ống nghiệm, que test, khay đúc, thạch cao)', true, NOW()),
  ('STERILIZE', 'Vật tư khử khuẩn', 'Vật tư cho quy trình khử khuẩn (túi hấp, chỉ thị sinh học, dung dịch khử trùng, băng keo)', true, NOW()),
  ('XRAY', 'Vật tư X-quang', 'Phim X-quang, sensor kỹ thuật số, chất hiện hình, túi bảo vệ, máy chụp', true, NOW()),
  ('OFFICE', 'Văn phòng phẩm', 'Giấy tờ, hồ sơ bệnh án, bút, tem nhãn, hộp lưu trữ, kệ tài liệu', true, NOW()),
  ('PROTECTIVE', 'Đồ bảo hộ', 'Trang phục bảo hộ cho nhân viên (áo blouse, mũ, kính, tạp dề, giày, khẩu trang N95)', true, NOW())
ON CONFLICT (category_code) DO NOTHING;

-- =============================================
-- RESET SEQUENCES
-- =============================================
SELECT setval('item_categories_category_id_seq', (SELECT MAX(category_id) FROM item_categories));

-- =============================================
-- VERIFICATION QUERY (Optional - for testing)
-- =============================================
-- SELECT category_id, category_code, category_name, is_active, display_order
-- FROM item_categories
-- ORDER BY display_order;

-- ============================================
-- WAREHOUSE DATA SEEDING - ITEM MASTERS
-- Thêm dữ liệu vật tư, thuốc, hóa chất thực tế
-- Note: purchase_price & total_value = NULL (Phase 2 update)
-- ============================================

-- 1. NHÓM VẬT TƯ TIÊU HAO (CONSUMABLE)
INSERT INTO item_masters (item_code, item_name, category_id, unit_of_measure, warehouse_type, description, min_stock_level, max_stock_level, is_tool, is_prescription_required, is_active, created_at)
SELECT t.code, t.name, cat.category_id, t.unit, 'NORMAL', t.descr, 10, 1000, FALSE, FALSE, TRUE, NOW()
FROM item_categories cat
CROSS JOIN (VALUES
    ('CON-GLOVE-01', 'Găng tay y tế', 'Đôi', 'Găng tay cao su khám bệnh dùng một lần'),
    ('CON-MASK-01', 'Khẩu trang y tế', 'Cái', 'Khẩu trang y tế 3-4 lớp'),
    ('CON-CUP-01', 'Ly súc miệng', 'Cái', 'Ly nhựa/giấy dùng một lần'),
    ('CON-EJECT-01', 'Ống hút nước bọt', 'Cái', 'Ống hút nha khoa dẻo'),
    ('CON-BIB-01', 'Khăn trải ngực (Bib)', 'Cái', 'Khăn giấy chống thấm cho bệnh nhân'),
    ('CON-NEEDLE-01', 'Kim tiêm nha khoa', 'Cái', 'Kim tiêm gây tê chuyên dụng'),
    ('CON-GAUZE-01', 'Bông gạc phẫu thuật', 'Gói', 'Gạc vô trùng thấm hút tốt'),
    ('CON-SPON-01', 'Spongel (Cầm máu)', 'Viên', 'Xốp gelatin cầm máu tại chỗ'),
    ('CON-SUT-01', 'Chỉ khâu phẫu thuật', 'Tép', 'Chỉ khâu y tế tự tiêu/không tiêu'),
    ('CON-BLADE-01', 'Lưỡi dao mổ', 'Cái', 'Lưỡi dao phẫu thuật thép không gỉ'),
    ('CON-TIP-01', 'Đầu bơm keo', 'Cái', 'Đầu bơm composite/keo dùng 1 lần'),
    ('CON-PAPER-01', 'Giấy cắn', 'Tờ', 'Giấy kiểm tra khớp cắn'),
    ('CON-MATRX-01', 'Đai trám (Matrix)', 'Cái', 'Khuôn trám răng'),
    ('CON-DAM-01', 'Đê cao su', 'Miếng', 'Màng cao su cô lập răng'),
    ('CON-PPOINT-01', 'Côn giấy', 'Cây', 'Côn giấy thấm hút ống tủy'),
    ('CON-GUTTA-01', 'Côn Gutta Percha', 'Cây', 'Côn cao su trám bít ống tủy'),
    ('CON-BRUSH-01', 'Chổi đánh bóng', 'Cái', 'Chổi cước đánh bóng bề mặt răng'),
    ('CON-RETR-01', 'Banh miệng', 'Cái', 'Dụng cụ banh miệng nhựa dẻo')
) AS t(code, name, unit, descr)
WHERE cat.category_code = 'CONSUMABLE'
ON CONFLICT (item_code) DO NOTHING;

-- 2. NHÓM THUỐC (MEDICINE)
INSERT INTO item_masters (item_code, item_name, category_id, unit_of_measure, warehouse_type, description, min_stock_level, max_stock_level, is_tool, is_prescription_required, is_active, created_at)
SELECT t.code, t.name, cat.category_id, t.unit, 'COLD', t.descr, 5, 500, FALSE, TRUE, TRUE, NOW()
FROM item_categories cat
CROSS JOIN (VALUES
    ('MED-SEPT-01', 'Thuốc tê (Septodont)', 'Ống', 'Thuốc tê tiêm nha khoa (Pháp)'),
    ('MED-GEL-01', 'Thuốc tê bôi (Gel)', 'g', 'Gel gây tê bề mặt niêm mạc'),
    ('MED-BETA-01', 'Dung dịch Betadine', 'ml', 'Dung dịch sát khuẩn Povidone-Iodine'),
    ('MED-CAOH-01', 'Ca(OH)2 (Đặt tủy)', 'g', 'Canxi Hydroxide đặt ống tủy'),
    ('MED-WASH-01', 'Nước súc miệng', 'ml', 'Nước súc miệng sát khuẩn chuyên dụng'),
    ('MED-SENS-01', 'Gel chống ê buốt', 'g', 'Gel bôi giảm ê buốt ngà răng')
) AS t(code, name, unit, descr)
WHERE cat.category_code = 'MEDICINE'
ON CONFLICT (item_code) DO NOTHING;

-- 3. NHÓM VẬT LIỆU NHA KHOA & HÓA CHẤT (MATERIAL / CHEMICAL)
INSERT INTO item_masters (item_code, item_name, category_id, unit_of_measure, warehouse_type, description, min_stock_level, max_stock_level, is_tool, is_prescription_required, is_active, created_at)
SELECT t.code, t.name, cat.category_id, t.unit, 'NORMAL', t.descr, 2, 200, FALSE, FALSE, TRUE, NOW()
FROM item_categories cat
CROSS JOIN (VALUES
    ('MAT-COMP-01', 'Trám Composite', 'g', 'Vật liệu trám thẩm mỹ (Quy cách đóng gói: Tuýp)'),
    ('MAT-ETCH-01', 'Etching Gel (Axit)', 'ml', 'Gel axit xói mòn men răng 37%'),
    ('MAT-BOND-01', 'Bonding Agent (Keo)', 'Giọt', 'Keo dán nha khoa (Quy cách: Lọ/ml)'),
    ('MAT-RESIN-01', 'Composite Resin 3M', 'g', 'Composite đặc 3M cao cấp'),
    ('MAT-NAOCL-01', 'NaOCl (Bơm rửa)', 'ml', 'Dung dịch bơm rửa ống tủy Sodium Hypochlorite'),
    ('MAT-EDTA-01', 'Dung dịch EDTA', 'g', 'Gel bôi trơn và làm sạch ống tủy'),
    ('MAT-SEAL-01', 'Xi măng Sealer', 'g', 'Vật liệu trám bít ống tủy'),
    ('MAT-POL-01', 'Sò đánh bóng', 'g', 'Bột/Sáp đánh bóng (Tính theo g)'),
    ('MAT-GUM-01', 'Gel che nướu', 'ml', 'Gel bảo vệ nướu khi tẩy trắng'),
    ('MAT-WHIT-01', 'Thuốc tẩy trắng', 'Set', 'Bộ kít thuốc tẩy trắng răng')
) AS t(code, name, unit, descr)
WHERE cat.category_code IN ('MATERIAL', 'CHEMICAL')
ON CONFLICT (item_code) DO NOTHING;

-- =============================================
-- RESET SEQUENCES for item_masters
-- =============================================
SELECT setval('item_masters_item_master_id_seq', (SELECT COALESCE(MAX(item_master_id), 0) FROM item_masters));

-- =============================================
-- INITIALIZE CACHE COLUMNS (V23 - API 6.7)
-- =============================================
UPDATE item_masters SET
    cached_total_quantity = 0,
    cached_last_import_date = NULL,
    cached_last_updated = NOW()
WHERE cached_total_quantity IS NULL;

-- =============================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =============================================
-- Check item masters by category
-- SELECT im.item_code, im.item_name, ic.category_name, im.unit_name, im.min_stock_level, im.max_stock_level
-- FROM item_masters im
-- JOIN item_categories ic ON im.category_id = ic.category_id
-- ORDER BY ic.display_order, im.item_code;

-- Count by category
-- SELECT ic.category_name, COUNT(im.item_id) as item_count
-- FROM item_categories ic
-- LEFT JOIN item_masters im ON ic.category_id = im.category_id
-- GROUP BY ic.category_name
-- ORDER BY ic.display_order;

-- =============================================
-- BUOC 8: WAREHOUSE SAMPLE DATA (API 6.6)
-- =============================================

-- 1. SUPPLIERS (Nha cung cap)
INSERT INTO suppliers (supplier_code, supplier_name, phone_number, email, address, tier_level, rating_score, total_orders, last_order_date, is_blacklisted, notes, is_active, created_at)
VALUES
('SUP-001', 'Cong ty Vat tu Nha khoa A', '0901234567', 'info@vatlieunk.vn', '123 Nguyen Van Linh, Q.7, TP.HCM', 'TIER_1', 4.8, 25, '2024-01-15', FALSE, 'Nha cung cap chinh, chat luong tot', TRUE, NOW() - INTERVAL '6 months'),
('SUP-002', 'Cong ty Duoc pham B', '0912345678', 'contact@duocphamb.com', '456 Le Van Viet, Q.9, TP.HCM', 'TIER_2', 4.2, 18, '2024-01-10', FALSE, 'Cung cap thuoc va hoa chat', TRUE, NOW() - INTERVAL '5 months'),
('SUP-003', 'Cong ty Thiet bi Y te C', '0923456789', 'sales@thietbiyc.vn', '789 Pham Van Dong, Thu Duc, TP.HCM', 'TIER_1', 4.7, 15, '2024-01-12', FALSE, 'Thiet bi cao cap, gia hop ly', TRUE, NOW() - INTERVAL '4 months'),
('SUP-004', 'Cong ty Vat tu Nha khoa D', '0934567890', 'support@vatlieud.com', '321 Tran Hung Dao, Q.1, TP.HCM', 'TIER_3', 3.9, 8, '2023-12-20', FALSE, 'Nha cung cap du phong', TRUE, NOW() - INTERVAL '7 months'),
('SUP-099', 'Cong ty Ma - BLACKLISTED', '0999999999', 'fraud@blacklisted.com', '666 Duong Bi Cam, Quan 13, TP.HCM', 'TIER_3', 1.0, 3, '2023-06-01', TRUE, 'CANH BAO: Chat luong kem, giao hang tre', FALSE, NOW() - INTERVAL '8 months')
ON CONFLICT (supplier_code) DO NOTHING;

-- Reset supplier sequence
SELECT setval('suppliers_supplier_id_seq', (SELECT COALESCE(MAX(supplier_id), 0) FROM suppliers));

-- =============================================
-- BUOC 9: STORAGE TRANSACTIONS TEST DATA (API 6.6)
-- Note: Hibernate auto-creates storage_transactions table from @Entity
-- This section only contains INSERT statements for test data
-- =============================================
-- Transaction 1: IMPORT - APPROVED, PAID (Da thanh toan day du)
INSERT INTO storage_transactions (transaction_code, type, transaction_date, invoice_number, total_value, created_by_id, supplier_id,
    payment_status, paid_amount, remaining_debt, due_date, approval_status, approved_by_id, approved_at, status, description, created_at)
VALUES ('IMP-2024-001', 'IMPORT', NOW() - INTERVAL '15 days', 'INV-20240101-001', 15000000.00, 6, 1,
    'PAID', 15000000.00, 0.00, NULL, 'APPROVED', 3, NOW() - INTERVAL '10 days', 'COMPLETED', 'Nhap vat tu nha khoa thang 1', NOW() - INTERVAL '15 days');

-- Transaction 2: IMPORT - APPROVED, PARTIAL payment (Chua thanh toan het)
INSERT INTO storage_transactions (transaction_code, type, transaction_date, invoice_number, total_value, created_by_id, supplier_id,
    payment_status, paid_amount, remaining_debt, due_date, approval_status, approved_by_id, approved_at, status, description, created_at)
VALUES ('IMP-2024-002', 'IMPORT', NOW() - INTERVAL '12 days', 'INV-20240105-002', 25000000.00, 6, 2,
    'PARTIAL', 15000000.00, 10000000.00, CURRENT_DATE + INTERVAL '15 days', 'APPROVED', 3, NOW() - INTERVAL '8 days', 'COMPLETED', 'Nhap thuoc va hoa chat', NOW() - INTERVAL '12 days');

-- Transaction 3: IMPORT - PENDING_APPROVAL, UNPAID (Cho duyet)
INSERT INTO storage_transactions (transaction_code, type, transaction_date, invoice_number, total_value, created_by_id, supplier_id,
    payment_status, paid_amount, remaining_debt, due_date, approval_status, approved_by_id, approved_at, status, description, created_at)
VALUES ('IMP-2024-003', 'IMPORT', NOW() - INTERVAL '2 days', 'INV-20240110-003', 18000000.00, 6, 3,
    'UNPAID', 0.00, 18000000.00, CURRENT_DATE + INTERVAL '30 days', 'PENDING_APPROVAL', NULL, NULL, 'DRAFT', 'Nhap thiet bi cao cap', NOW() - INTERVAL '2 days');

-- Transaction 4: EXPORT - APPROVED (Xuat kho lien ket voi lich hen 1)
INSERT INTO storage_transactions (transaction_code, type, transaction_date, invoice_number, total_value, created_by_id, supplier_id,
    payment_status, paid_amount, remaining_debt, due_date, approval_status, approved_by_id, approved_at, status, related_appointment_id, description, created_at)
VALUES ('EXP-2024-001', 'EXPORT', NOW() - INTERVAL '7 days', NULL, NULL, 2, NULL,
    NULL, NULL, NULL, NULL, 'APPROVED', 3, NOW() - INTERVAL '5 days', 'COMPLETED', 1, 'Xuat vat tu cho dieu tri benh nhan Nguyen Van A', NOW() - INTERVAL '7 days');

-- Transaction 5: EXPORT - APPROVED (Xuat kho lien ket voi lich hen 2)
INSERT INTO storage_transactions (transaction_code, type, transaction_date, invoice_number, total_value, created_by_id, supplier_id,
    payment_status, paid_amount, remaining_debt, due_date, approval_status, approved_by_id, approved_at, status, related_appointment_id, description, created_at)
VALUES ('EXP-2024-002', 'EXPORT', NOW() - INTERVAL '4 days', NULL, NULL, 2, NULL,
    NULL, NULL, NULL, NULL, 'APPROVED', 3, NOW() - INTERVAL '3 days', 'COMPLETED', 2, 'Xuat vat tu cho dieu tri benh nhan Tran Thi B', NOW() - INTERVAL '4 days');

-- Transaction 6: IMPORT - REJECTED (Bi tu choi)
INSERT INTO storage_transactions (transaction_code, type, transaction_date, invoice_number, total_value, created_by_id, supplier_id,
    payment_status, paid_amount, remaining_debt, due_date, approval_status, rejected_by_id, rejected_at, status, rejection_reason, created_at)
VALUES ('IMP-2024-004', 'IMPORT', NOW() - INTERVAL '3 days', 'INV-20240115-004', 12000000.00, 6, 4,
    'UNPAID', 0.00, 12000000.00, CURRENT_DATE + INTERVAL '20 days', 'REJECTED', 3, NOW() - INTERVAL '1 day', 'CANCELLED', 'Nhap vat tu khong dat chuan - tu choi', NOW() - INTERVAL '3 days');

-- Reset storage_transactions sequence
SELECT setval('storage_transactions_storage_transaction_id_seq', (SELECT COALESCE(MAX(storage_transaction_id), 0) FROM storage_transactions));


-- =============================================
-- ISSUE #7: COMPLETE WAREHOUSE SEED DATA
-- Missing tables: item_units, item_batches, storage_transaction_items, warehouse_audit_logs, supplier_items
-- Date: 2025-11-26
-- Purpose: Enable FE warehouse module with realistic test data
-- =============================================

-- =============================================
-- STEP 0: DATA INTEGRITY CONSTRAINTS
-- Date: 2025-11-30
-- Purpose: Prevent duplicate unit insertions when seed script runs multiple times
-- =============================================

-- Add unique constraint on (item_master_id, unit_name) to prevent duplicate unit names per item
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_item_unit_name'
    ) THEN
        ALTER TABLE item_units ADD CONSTRAINT uq_item_unit_name UNIQUE (item_master_id, unit_name);
    END IF;
END $$;

-- Add unique partial index to ensure only one base unit per item
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_item_units_one_base_per_item'
    ) THEN
        CREATE UNIQUE INDEX idx_item_units_one_base_per_item ON item_units (item_master_id) WHERE is_base_unit = true;
    END IF;
END $$;

-- =============================================
-- STEP 1: ITEM_UNITS (Don vi do luong - Unit hierarchy)
-- =============================================
-- Consumables: Gang tay y te
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Chiec', 1, TRUE, TRUE, FALSE, TRUE, 3, NOW()
FROM item_masters im WHERE im.item_code = 'CON-GLOVE-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Cap', 2, FALSE, TRUE, FALSE, FALSE, 2, NOW()
FROM item_masters im WHERE im.item_code = 'CON-GLOVE-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Hop', 200, FALSE, TRUE, TRUE, FALSE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'CON-GLOVE-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

-- Khau trang y te
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Cái', 1, TRUE, TRUE, FALSE, TRUE, 3, NOW()
FROM item_masters im WHERE im.item_code = 'CON-MASK-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Hop', 50, FALSE, TRUE, TRUE, FALSE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'CON-MASK-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

-- Kim tiem nha khoa
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Cái', 1, TRUE, TRUE, FALSE, TRUE, 2, NOW()
FROM item_masters im WHERE im.item_code = 'CON-NEEDLE-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Hop', 100, FALSE, TRUE, TRUE, FALSE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'CON-NEEDLE-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

-- Medicine: Thuoc te Septodont
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Ong', 1, TRUE, TRUE, FALSE, TRUE, 2, NOW()
FROM item_masters im WHERE im.item_code = 'MED-SEPT-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Hop', 50, FALSE, TRUE, TRUE, FALSE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'MED-SEPT-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

-- Material: Composite
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'g', 1, TRUE, TRUE, FALSE, TRUE, 2, NOW()
FROM item_masters im WHERE im.item_code = 'MAT-COMP-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Tuyp', 4, FALSE, TRUE, TRUE, FALSE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'MAT-COMP-01'
ON CONFLICT (item_master_id, unit_name) DO NOTHING;

-- Missing units for API 6.17 service_consumables
-- Fix: Add Doi, Goi, ml, Giot units for consumable items
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Đôi', 1, TRUE, TRUE, FALSE, TRUE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'CON-GLOVE-01'
ON CONFLICT DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'Gói', 1, TRUE, TRUE, FALSE, TRUE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'CON-GAUZE-01'
ON CONFLICT DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'ml', 1, TRUE, TRUE, FALSE, TRUE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'MAT-ETCH-01'
ON CONFLICT DO NOTHING;

INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, is_active, is_default_import_unit, is_default_export_unit, display_order, created_at)
SELECT im.item_master_id, 'drop', 1, TRUE, TRUE, FALSE, TRUE, 1, NOW()
FROM item_masters im WHERE im.item_code = 'MAT-BOND-01'
ON CONFLICT DO NOTHING;

-- Reset sequence
SELECT setval('item_units_unit_id_seq', (SELECT COALESCE(MAX(unit_id), 0) FROM item_units));


-- =============================================
-- STEP 2: ITEM_BATCHES (Lo hang thuc te)
-- =============================================
-- Batch 1: Găng tay (NORMAL storage, good stock, expiring in 90 days)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-GLOVE-2024-001', 150, 200, CURRENT_DATE + INTERVAL '90 days', 1, NOW() - INTERVAL '30 days', 'Kệ A-01', NOW()
FROM item_masters im WHERE im.item_code = 'CON-GLOVE-01'
ON CONFLICT DO NOTHING;

-- Batch 2: Găng tay (Low stock, expiring soon - 20 days)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-GLOVE-2023-012', 30, 200, CURRENT_DATE + INTERVAL '20 days', 1, NOW() - INTERVAL '350 days', 'Kệ A-02', NOW()
FROM item_masters im WHERE im.item_code = 'CON-GLOVE-01'
ON CONFLICT DO NOTHING;

-- Batch 3: Khẩu trang (Good stock)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-MASK-2024-001', 800, 1000, CURRENT_DATE + INTERVAL '120 days', 2, NOW() - INTERVAL '25 days', 'Kệ A-03', NOW()
FROM item_masters im WHERE im.item_code = 'CON-MASK-01'
ON CONFLICT DO NOTHING;

-- Batch 4: Kim tiêm (Good stock)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-NEEDLE-2024-001', 450, 500, CURRENT_DATE + INTERVAL '180 days', 1, NOW() - INTERVAL '20 days', 'Kệ B-01', NOW()
FROM item_masters im WHERE im.item_code = 'CON-NEEDLE-01'
ON CONFLICT DO NOTHING;

-- Batch 5: Thuốc tê (COLD storage, good stock)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-SEPT-2024-001', 180, 200, CURRENT_DATE + INTERVAL '150 days', 2, NOW() - INTERVAL '15 days', 'Tủ lạnh A-01', NOW()
FROM item_masters im WHERE im.item_code = 'MED-SEPT-01'
ON CONFLICT DO NOTHING;

-- Batch 6: Thuốc tê (COLD storage, expiring soon - 15 days)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-SEPT-2023-010', 25, 200, CURRENT_DATE + INTERVAL '15 days', 2, NOW() - INTERVAL '335 days', 'Tủ lạnh A-02', NOW()
FROM item_masters im WHERE im.item_code = 'MED-SEPT-01'
ON CONFLICT DO NOTHING;

-- Batch 7: Composite (NORMAL, good stock)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-COMP-2024-001', 35, 40, CURRENT_DATE + INTERVAL '200 days', 3, NOW() - INTERVAL '10 days', 'Kệ C-01', NOW()
FROM item_masters im WHERE im.item_code = 'MAT-COMP-01'
ON CONFLICT DO NOTHING;

-- Batch 8: Composite (EXPIRED - for testing)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-COMP-2022-005', 0, 40, CURRENT_DATE - INTERVAL '10 days', 3, NOW() - INTERVAL '400 days', 'Kệ C-05 (HẾT HẠN)', NOW()
FROM item_masters im WHERE im.item_code = 'MAT-COMP-01'
ON CONFLICT DO NOTHING;

-- Batch 9: Ly súc miệng
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-CUP-2024-001', 950, 1000, CURRENT_DATE + INTERVAL '100 days', 1, NOW() - INTERVAL '5 days', 'Kệ A-04', NOW()
FROM item_masters im WHERE im.item_code = 'CON-CUP-01'
ON CONFLICT DO NOTHING;

-- Batch 10: Bông gạc
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-GAUZE-2024-001', 280, 300, CURRENT_DATE + INTERVAL '180 days', 2, NOW() - INTERVAL '18 days', 'Kệ B-02', NOW()
FROM item_masters im WHERE im.item_code = 'CON-GAUZE-01'
ON CONFLICT DO NOTHING;

-- Batch 11: Bonding Agent (Keo dán)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-BOND-2024-001', 45, 50, CURRENT_DATE + INTERVAL '220 days', 3, NOW() - INTERVAL '8 days', 'Kệ C-02', NOW()
FROM item_masters im WHERE im.item_code = 'MAT-BOND-01'
ON CONFLICT DO NOTHING;

-- Batch 12: NaOCl (Bơm rửa ống tủy)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity, expiry_date, supplier_id, imported_at, bin_location, created_at)
SELECT im.item_master_id, 'BATCH-NAOCL-2024-001', 190, 200, CURRENT_DATE + INTERVAL '140 days', 2, NOW() - INTERVAL '12 days', 'Tủ lạnh B-01', NOW()
FROM item_masters im WHERE im.item_code = 'MAT-NAOCL-01'
ON CONFLICT DO NOTHING;

-- Reset sequence
SELECT setval('item_batches_batch_id_seq', (SELECT COALESCE(MAX(batch_id), 0) FROM item_batches));


-- =============================================
-- STEP 3: STORAGE_TRANSACTION_ITEMS (Chi tiet phieu nhap/xuat)
-- =============================================
-- Transaction IMP-2024-001 items (3 items)
INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'CON-GLOVE-01', 200, 150000, 30000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-001'
AND b.lot_number = 'BATCH-GLOVE-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'CON-MASK-01', 1000, 50000, 50000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-001'
AND b.lot_number = 'BATCH-MASK-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'CON-NEEDLE-01', 500, 80000, 40000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-001'
AND b.lot_number = 'BATCH-NEEDLE-2024-001'
ON CONFLICT DO NOTHING;

-- Transaction IMP-2024-002 items (4 items - medicines and materials)
INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'MED-SEPT-01', 200, 120000, 24000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-002'
AND b.lot_number = 'BATCH-SEPT-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'MAT-COMP-01', 40, 500000, 20000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-002'
AND b.lot_number = 'BATCH-COMP-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'CON-GAUZE-01', 300, 30000, 9000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-002'
AND b.lot_number = 'BATCH-GAUZE-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'MAT-BOND-01', 50, 400000, 20000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-002'
AND b.lot_number = 'BATCH-BOND-2024-001'
ON CONFLICT DO NOTHING;

-- Transaction IMP-2024-003 items (PENDING approval)
INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'CON-CUP-01', 1000, 10000, 10000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-003'
AND b.lot_number = 'BATCH-CUP-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, price, total_line_value)
SELECT st.transaction_id, b.batch_id, 'MAT-NAOCL-01', 200, 40000, 8000000
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'IMP-2024-003'
AND b.lot_number = 'BATCH-NAOCL-2024-001'
ON CONFLICT DO NOTHING;

-- Transaction EXP-2024-001 items (EXPORT for appointment - negative quantities)
INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, notes)
SELECT st.transaction_id, b.batch_id, 'CON-GLOVE-01', -10, 'Xuất cho lịch hẹn APT-20251106-001'
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'EXP-2024-001'
AND b.lot_number = 'BATCH-GLOVE-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, notes)
SELECT st.transaction_id, b.batch_id, 'CON-MASK-01', -5, 'Xuất cho lịch hẹn APT-20251106-001'
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'EXP-2024-001'
AND b.lot_number = 'BATCH-MASK-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, notes)
SELECT st.transaction_id, b.batch_id, 'MED-SEPT-01', -2, 'Xuất cho lịch hẹn APT-20251106-001'
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'EXP-2024-001'
AND b.lot_number = 'BATCH-SEPT-2024-001'
ON CONFLICT DO NOTHING;

-- Transaction EXP-2024-002 items (EXPORT for appointment)
INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, notes)
SELECT st.transaction_id, b.batch_id, 'CON-GLOVE-01', -8, 'Xuất cho lịch hẹn APT-20251106-002'
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'EXP-2024-002'
AND b.lot_number = 'BATCH-GLOVE-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, notes)
SELECT st.transaction_id, b.batch_id, 'MAT-COMP-01', -5, 'Xuất composite cho lịch hẹn APT-20251106-002'
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'EXP-2024-002'
AND b.lot_number = 'BATCH-COMP-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO storage_transaction_items (transaction_id, batch_id, item_code, quantity_change, notes)
SELECT st.transaction_id, b.batch_id, 'CON-GAUZE-01', -20, 'Xuất bông gạc cho lịch hẹn APT-20251106-002'
FROM storage_transactions st
CROSS JOIN item_batches b
WHERE st.transaction_code = 'EXP-2024-002'
AND b.lot_number = 'BATCH-GAUZE-2024-001'
ON CONFLICT DO NOTHING;

-- Reset sequence
SELECT setval('storage_transaction_items_transaction_item_id_seq', (SELECT COALESCE(MAX(transaction_item_id), 0) FROM storage_transaction_items));

-- =============================================
-- SERVICE CONSUMABLES (API 6.17)
-- =============================================
-- Dinh muc tieu hao vat tu cho dich vu (BOM - Bill of Materials)
-- VD: Dich vu "Cao voi rang" can bao nhieu goi bong gac, khau trang, etc.

-- Dich vu: Kham tong quat
INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Dung khi kham sang loc ban dau' FROM services s, item_masters im, item_units u WHERE s.service_code = 'GEN_EXAM' AND im.item_code = 'CON-GLOVE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Đôi' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Bao ve bac si va benh nhan' FROM services s, item_masters im, item_units u WHERE s.service_code = 'GEN_EXAM' AND im.item_code = 'CON-MASK-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Cái' ON CONFLICT (service_id, item_master_id) DO NOTHING;

-- Dich vu: Cao voi rang Muc 1
INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 2, u.unit_id, 'Thay doi 2 lan trong qua trinh cao voi' FROM services s, item_masters im, item_units u WHERE s.service_code = 'SCALING_L1' AND im.item_code = 'CON-GLOVE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Đôi' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Khau trang bao ve' FROM services s, item_masters im, item_units u WHERE s.service_code = 'SCALING_L1' AND im.item_code = 'CON-MASK-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Cái' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 3, u.unit_id, 'Lau mau va nuoc bot' FROM services s, item_masters im, item_units u WHERE s.service_code = 'SCALING_L1' AND im.item_code = 'CON-GAUZE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Gói' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 15, u.unit_id, 'Sau khi cao voi' FROM services s, item_masters im, item_units u WHERE s.service_code = 'SCALING_L1' AND im.item_code = 'MAT-POL-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'g' ON CONFLICT (service_id, item_master_id) DO NOTHING;

-- Dich vu: Tram rang Composite
INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Thay doi khi tiep xuc chat long' FROM services s, item_masters im, item_units u WHERE s.service_code = 'FILLING_COMP' AND im.item_code = 'CON-GLOVE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Đôi' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Bao ve bac si' FROM services s, item_masters im, item_units u WHERE s.service_code = 'FILLING_COMP' AND im.item_code = 'CON-MASK-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Cái' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 2, u.unit_id, 'Thau nuoc bot va lau kho' FROM services s, item_masters im, item_units u WHERE s.service_code = 'FILLING_COMP' AND im.item_code = 'CON-GAUZE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Gói' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 8, u.unit_id, 'Tram 1 rang trung binh' FROM services s, item_masters im, item_units u WHERE s.service_code = 'FILLING_COMP' AND im.item_code = 'MAT-COMP-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'g' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 3, u.unit_id, 'Gel xoi mon men rang truoc khi tram' FROM services s, item_masters im, item_units u WHERE s.service_code = 'FILLING_COMP' AND im.item_code = 'MAT-ETCH-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'ml' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 5, u.unit_id, 'Keo dan tram' FROM services s, item_masters im, item_units u WHERE s.service_code = 'FILLING_COMP' AND im.item_code = 'MAT-BOND-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'drop' ON CONFLICT (service_id, item_master_id) DO NOTHING;

-- Dich vu: Nhoi rang sua
INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Gang tay cho thao tac nhe nhang' FROM services s, item_masters im, item_units u WHERE s.service_code = 'EXTRACT_MILK' AND im.item_code = 'CON-GLOVE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Đôi' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 5, u.unit_id, 'Cam mau sau khi nhoi' FROM services s, item_masters im, item_units u WHERE s.service_code = 'EXTRACT_MILK' AND im.item_code = 'CON-GAUZE-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'Gói' ON CONFLICT (service_id, item_master_id) DO NOTHING;

INSERT INTO service_consumables (service_id, item_master_id, quantity_per_service, unit_id, notes) SELECT s.service_id, im.item_master_id, 1, u.unit_id, 'Te boi neu tre khong hop tac' FROM services s, item_masters im, item_units u WHERE s.service_code = 'EXTRACT_MILK' AND im.item_code = 'MED-GEL-01' AND u.item_master_id = im.item_master_id AND u.unit_name = 'g' ON CONFLICT (service_id, item_master_id) DO NOTHING;

-- Reset sequence
SELECT setval('service_consumables_link_id_seq', (SELECT COALESCE(MAX(link_id), 0) FROM service_consumables));

-- =============================================
-- WAREHOUSE SEED DATA COMPLETE
-- =============================================
-- Note: warehouse_audit_logs and supplier_items are NOT seeded
-- These tables will be populated through normal application usage
-- Audit logs: Created automatically when transactions are approved/rejected
-- Supplier items: Managed through supplier management UI

-- =============================================
-- CLINICAL RECORDS MODULE (Module #9)
-- =============================================
-- Test data for API 8.1: GET /api/v1/appointments/{appointmentId}/clinical-record
-- Test scenarios:
--   1. Appointment 1: Has clinical record (SUCCESS case for admin/doctor/patient)
--   2. Appointment 2: Has clinical record (SUCCESS case for another doctor)
--   3. Appointment 5: No clinical record (404 RECORD_NOT_FOUND - shows CREATE form)

-- Clinical Record #1 (for appointment_id=1, patient_id=1, employee_id=1)
INSERT INTO clinical_records (
    clinical_record_id, appointment_id, diagnosis, vital_signs,
    chief_complaint, examination_findings, treatment_notes,
    created_at, updated_at
) VALUES (
    1, 1,
    'Gingivitis (Viêm lợi) + Dental calculus (Cao răng)',
    '{"blood_pressure": "120/80", "heart_rate": "72", "temperature": "36.5"}',
    'Đau nhức và chảy máu lợi khi đánh răng, cảm giác răng ố vàng',
    'Lợi sưng đỏ, có nhiều mảng cao răng, không có sâu răng',
    'Đã thực hiện lấy cao răng (scaling), hướng dẫn cách đánh răng đúng cách',
    NOW(), NOW()
) ON CONFLICT (clinical_record_id) DO NOTHING;

-- Procedures for Clinical Record #1
INSERT INTO clinical_record_procedures (
    procedure_id, clinical_record_id, service_id, patient_plan_item_id,
    tooth_number, procedure_description, notes, created_at
) VALUES
(1, 1, 1, NULL, NULL, 'Khám tổng quát răng miệng', 'Bệnh nhân không có sâu răng', NOW()),
(2, 1, 3, NULL, NULL, 'Lấy cao răng (Scaling Level 1)', 'Đã lấy cao răng toàn hàm', NOW())
ON CONFLICT (procedure_id) DO NOTHING;

-- Prescription for Clinical Record #1
INSERT INTO clinical_prescriptions (
    prescription_id, clinical_record_id, prescription_notes, created_at
) VALUES (
    1, 1, 'Thuốc súc miệng và giảm đau', NOW()
) ON CONFLICT (prescription_id) DO NOTHING;

-- Prescription Items for Prescription #1
INSERT INTO clinical_prescription_items (
    prescription_item_id, prescription_id, item_master_id, item_name,
    quantity, dosage_instructions, created_at
) VALUES
(1, 1, 10, 'Nước súc miệng Listerine', 1, 'Súc miệng 2 lần/ngày sau khi đánh răng', NOW()),
(2, 1, 11, 'Paracetamol 500mg', 10, 'Uống 1 viên khi đau, cách 4-6 giờ, tối đa 3 viên/ngày', NOW())
ON CONFLICT (prescription_item_id) DO NOTHING;

-- Tooth Status for Patient #1
-- Patient 1 has multiple tooth conditions for testing odontogram
INSERT INTO patient_tooth_status (
    tooth_status_id, patient_id, tooth_number, status, notes, recorded_at
) VALUES
(1, 1, '18', 'MISSING', 'Rang khon da nhổ năm 2023', NOW()),
(2, 1, '36', 'CROWN', 'Boc su kim loai', NOW()),
(3, 1, '46', 'CARIES', 'Sau rang sau, can dieu tri', NOW()),
(4, 1, '21', 'IMPLANT', 'Cay ghep Implant thanh cong', NOW())
ON CONFLICT (patient_id, tooth_number) DO NOTHING;

-- Clinical Record #2 (for appointment_id=2, patient_id=2, employee_id=2)
INSERT INTO clinical_records (
    clinical_record_id, appointment_id, diagnosis, vital_signs,
    chief_complaint, examination_findings, treatment_notes,
    created_at, updated_at
) VALUES (
    2, 2,
    'Dental caries (Sâu răng) - răng số 36',
    '{"blood_pressure": "115/75", "heart_rate": "68"}',
    'Đau răng hàm dưới bên trái khi ăn đồ ngọt và lạnh',
    'Phát hiện lỗ sâu sâu trên bề mặt nhai răng số 36, chưa tổn thương tủy',
    'Đã trám răng composite, khuyên theo dõi và tái khám sau 6 tháng',
    NOW(), NOW()
) ON CONFLICT (clinical_record_id) DO NOTHING;

-- Procedures for Clinical Record #2
INSERT INTO clinical_record_procedures (
    procedure_id, clinical_record_id, service_id, patient_plan_item_id,
    tooth_number, procedure_description, notes, created_at
) VALUES
(3, 2, 1, NULL, NULL, 'Khám tổng quát răng miệng', 'Phát hiện sâu răng số 36', NOW()),
(4, 2, 5, NULL, '36', 'Trám răng Composite', 'Đã trám hoàn tất, bệnh nhân không đau', NOW())
ON CONFLICT (procedure_id) DO NOTHING;

-- Prescription for Clinical Record #2
INSERT INTO clinical_prescriptions (
    prescription_id, clinical_record_id, prescription_notes, created_at
) VALUES (
    2, 2, 'Thuốc giảm đau dự phòng', NOW()
) ON CONFLICT (prescription_id) DO NOTHING;

-- Prescription Items for Prescription #2
INSERT INTO clinical_prescription_items (
    prescription_item_id, prescription_id, item_master_id, item_name,
    quantity, dosage_instructions, created_at
) VALUES
(3, 2, 11, 'Paracetamol 500mg', 6, 'Uống 1 viên khi đau, tối đa 3 viên/ngày', NOW())
ON CONFLICT (prescription_item_id) DO NOTHING;

-- Tooth Status for Patient #2
INSERT INTO patient_tooth_status (
    tooth_status_id, patient_id, tooth_number, status, notes, recorded_at
) VALUES
(5, 2, '36', 'FILLED', 'Đã trám răng composite', NOW())
ON CONFLICT (patient_id, tooth_number) DO NOTHING;

-- Clinical Record #3 (for appointment_id=3, patient_id=3, employee_id=1)
-- This one has procedure linked to treatment plan
INSERT INTO clinical_records (
    clinical_record_id, appointment_id, diagnosis, vital_signs,
    chief_complaint, examination_findings, treatment_notes,
    created_at, updated_at
) VALUES (
    3, 3,
    'Orthodontic treatment progress check',
    '{"blood_pressure": "118/78"}',
    'Tái khám niềng răng định kỳ',
    'Răng đã dịch chuyển tốt, không có viêm nướu',
    'Thay dây cung mới, hẹn tái khám sau 4 tuần',
    NOW(), NOW()
) ON CONFLICT (clinical_record_id) DO NOTHING;

-- Procedures for Clinical Record #3 (linked to treatment plan)
INSERT INTO clinical_record_procedures (
    procedure_id, clinical_record_id, service_id, patient_plan_item_id,
    tooth_number, procedure_description, notes, created_at
) VALUES
(5, 3, 1, NULL, NULL, 'Khám tổng quát răng miệng', 'Kiểm tra tiến độ niềng răng', NOW()),
(6, 3, 7, 1, NULL, 'Thay dây cung niềng răng', 'Đã thay dây cung theo kế hoạch điều trị', NOW())
ON CONFLICT (procedure_id) DO NOTHING;

-- No prescription for this record (orthodontic follow-up doesn't need medicine)

-- Tooth Status History (audit trail)
INSERT INTO patient_tooth_status_history (
    history_id, patient_id, tooth_number, old_status, new_status, changed_by, changed_at, reason
) VALUES
(1, 1, '18', 'HEALTHY', 'MISSING', 1, '2023-05-15 10:00:00', 'Nhổ rang khon ham tren phai do mac ngam'),
(2, 1, '36', 'CARIES', 'CROWN', 1, '2024-03-20 14:30:00', 'Boc su kim loai sau khi dieu tri tuy'),
(3, 1, '21', 'MISSING', 'IMPLANT', 1, '2024-08-10 11:00:00', 'Cay ghep Implant thanh cong'),
(4, 2, '36', 'CARIES', 'FILLED', 2, NOW(), 'Tram rang composite')
ON CONFLICT DO NOTHING;

-- Reset sequences
SELECT setval('clinical_records_clinical_record_id_seq', (SELECT COALESCE(MAX(clinical_record_id), 0) FROM clinical_records));
SELECT setval('clinical_record_procedures_procedure_id_seq', (SELECT COALESCE(MAX(procedure_id), 0) FROM clinical_record_procedures));
SELECT setval('clinical_prescriptions_prescription_id_seq', (SELECT COALESCE(MAX(prescription_id), 0) FROM clinical_prescriptions));
SELECT setval('clinical_prescription_items_prescription_item_id_seq', (SELECT COALESCE(MAX(prescription_item_id), 0) FROM clinical_prescription_items));
SELECT setval('patient_tooth_status_tooth_status_id_seq', (SELECT COALESCE(MAX(tooth_status_id), 0) FROM patient_tooth_status));
SELECT setval('patient_tooth_status_history_history_id_seq', (SELECT COALESCE(MAX(history_id), 0) FROM patient_tooth_status_history));

-- =============================================
-- CLINICAL RECORDS SEED DATA COMPLETE
-- =============================================
-- Test cases:
-- 1. GET /api/v1/appointments/1/clinical-record (SUCCESS - has record)
-- 2. GET /api/v1/appointments/2/clinical-record (SUCCESS - has record)
-- 3. GET /api/v1/appointments/3/clinical-record (SUCCESS - has record with plan link)
-- 4. GET /api/v1/appointments/5/clinical-record (404 RECORD_NOT_FOUND - no record)
-- Authorization test:
-- - Admin token: Can access all records
-- - Doctor token (employee_id=1): Can access appointment 1, 3 (own appointments)
-- - Doctor token (employee_id=2): Can access appointment 2 (own appointment)
-- - Patient token (patient_id=1): Can access appointment 1 (own appointment)
-- - Patient token (patient_id=2): Can access appointment 2 (own appointment)
