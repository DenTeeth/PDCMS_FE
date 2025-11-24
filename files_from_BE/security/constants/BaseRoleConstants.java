package com.dental.clinic.management.security.constants;

/**
 * Constants for Base Role IDs (base_roles table).
 * <p>
 * P0 Fix: Replaces magic numbers (2, 3) with semantic constants.
 * Used for RBAC logic to distinguish between Admin, Employee, and Patient
 * roles.
 * <p>
 * Database Reference:
 * - base_roles table has base_role_id as PRIMARY KEY
 * - Account → Role → BaseRole relationship
 * <p>
 * Version: V19
 * Date: 2025-01-12
 *
 * @author GitHub Copilot
 */
public final class BaseRoleConstants {

    /**
     * Base Role ID for ADMIN users.
     * Typically has full system access with VIEW_ALL permissions.
     */
    public static final Integer ADMIN = 1;

    /**
     * Base Role ID for EMPLOYEE users (Doctors, Nurses, Receptionists, Managers).
     * Used to identify medical staff in RBAC checks.
     * <p>
     * Example: Doctor with VIEW_TREATMENT_PLAN_OWN can only see plans they created.
     */
    public static final Integer EMPLOYEE = 2;

    /**
     * Base Role ID for PATIENT users.
     * Used to identify patients in RBAC checks.
     * <p>
     * Example: Patient with VIEW_TREATMENT_PLAN_OWN can only see their own plans.
     */
    public static final Integer PATIENT = 3;

    // Private constructor to prevent instantiation
    private BaseRoleConstants() {
        throw new UnsupportedOperationException("This is a constants class and cannot be instantiated");
    }
}
