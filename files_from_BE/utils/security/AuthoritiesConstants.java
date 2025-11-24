package com.dental.clinic.management.utils.security;

public final class AuthoritiesConstants {

    private AuthoritiesConstants() {
    } // ngăn không cho new

    // Roles
    public static final String ADMIN = "ROLE_ADMIN";
    public static final String USER = "ROLE_USER";
    public static final String ACCOUNTANT = "ROLE_ACCOUNTANT";
    public static final String DOCTOR = "ROLE_DOCTOR";
    public static final String RECEPTIONIST = "ROLE_RECEPTIONIST";
    public static final String WAREHOUSE_MANAGER = "ROLE_WAREHOUSE_MANAGER";

    // Permissions
    public static final String READ_ALL_EMPLOYEES = "READ_ALL_EMPLOYEES";
    public static final String READ_EMPLOYEE_BY_CODE = "READ_EMPLOYEE_BY_CODE";
    public static final String CREATE_EMPLOYEE = "CREATE_EMPLOYEE";
    public static final String UPDATE_EMPLOYEE = "UPDATE_EMPLOYEE";
    public static final String DELETE_EMPLOYEE = "DELETE_EMPLOYEE";

    // Patient Permissions
    public static final String VIEW_PATIENT = "VIEW_PATIENT";
    public static final String CREATE_PATIENT = "CREATE_PATIENT";
    public static final String UPDATE_PATIENT = "UPDATE_PATIENT";
    public static final String DELETE_PATIENT = "DELETE_PATIENT";// soft delete

    // Appointment Permissions
    public static final String VIEW_APPOINTMENT = "VIEW_APPOINTMENT";
    public static final String VIEW_APPOINTMENT_ALL = "VIEW_APPOINTMENT_ALL"; // View all clinic appointments (for
                                                                              // Dashboard)
    public static final String VIEW_APPOINTMENT_OWN = "VIEW_APPOINTMENT_OWN"; // View own appointments (Doctor/Patient)
    public static final String CREATE_APPOINTMENT = "CREATE_APPOINTMENT";
    public static final String UPDATE_APPOINTMENT = "UPDATE_APPOINTMENT";
    public static final String UPDATE_APPOINTMENT_STATUS = "UPDATE_APPOINTMENT_STATUS"; // Change status (CHECKED_IN,
                                                                                        // COMPLETED, etc.)
    public static final String DELAY_APPOINTMENT = "DELAY_APPOINTMENT"; // Delay within same day
    public static final String RESCHEDULE_APPOINTMENT = "RESCHEDULE_APPOINTMENT"; // Cancel and rebook to different day
    public static final String CANCEL_APPOINTMENT = "CANCEL_APPOINTMENT";
    public static final String DELETE_APPOINTMENT = "DELETE_APPOINTMENT";

    // Contact (Customer Contacts) Permissions
    public static final String VIEW_CONTACT = "VIEW_CONTACT";
    public static final String CREATE_CONTACT = "CREATE_CONTACT";
    public static final String UPDATE_CONTACT = "UPDATE_CONTACT";
    public static final String DELETE_CONTACT = "DELETE_CONTACT"; // soft delete if implemented

    // Contact History Permissions
    public static final String VIEW_CONTACT_HISTORY = "VIEW_CONTACT_HISTORY";
    public static final String CREATE_CONTACT_HISTORY = "CREATE_CONTACT_HISTORY";
    public static final String UPDATE_CONTACT_HISTORY = "UPDATE_CONTACT_HISTORY";
    public static final String DELETE_CONTACT_HISTORY = "DELETE_CONTACT_HISTORY"; // soft delete if implemented

    // Specialization Permissions
    public static final String VIEW_SPECIALIZATION = "VIEW_SPECIALIZATION";
    public static final String CREATE_SPECIALIZATION = "CREATE_SPECIALIZATION";

    // Work Shifts Permissions
    public static final String VIEW_WORK_SHIFTS = "VIEW_WORK_SHIFTS";
    public static final String CREATE_WORK_SHIFTS = "CREATE_WORK_SHIFTS";
    public static final String UPDATE_WORK_SHIFTS = "UPDATE_WORK_SHIFTS";
    public static final String DELETE_WORK_SHIFTS = "DELETE_WORK_SHIFTS";

    // Overtime Management Permissions
    public static final String VIEW_OT_ALL = "VIEW_OT_ALL";
    public static final String VIEW_OT_OWN = "VIEW_OT_OWN";
    public static final String CREATE_OT = "CREATE_OT";
    public static final String APPROVE_OT = "APPROVE_OT";
    public static final String REJECT_OT = "REJECT_OT";
    public static final String CANCEL_OT_OWN = "CANCEL_OT_OWN";
    public static final String CANCEL_OT_PENDING = "CANCEL_OT_PENDING";

    // Employee Shift Registration Permissions
    public static final String VIEW_REGISTRATION_ALL = "VIEW_REGISTRATION_ALL";
    public static final String VIEW_REGISTRATION_OWN = "VIEW_REGISTRATION_OWN";
    public static final String CREATE_REGISTRATION = "CREATE_REGISTRATION";
    public static final String UPDATE_REGISTRATION_ALL = "UPDATE_REGISTRATION_ALL";
    public static final String UPDATE_REGISTRATION_OWN = "UPDATE_REGISTRATION_OWN";
    public static final String DELETE_REGISTRATION_ALL = "DELETE_REGISTRATION_ALL";
    public static final String DELETE_REGISTRATION_OWN = "DELETE_REGISTRATION_OWN";

    // Time-Off Request Permissions
    public static final String VIEW_TIMEOFF_ALL = "VIEW_TIMEOFF_ALL";
    public static final String VIEW_TIMEOFF_OWN = "VIEW_TIMEOFF_OWN";
    public static final String CREATE_TIMEOFF = "CREATE_TIMEOFF";
    public static final String APPROVE_TIMEOFF = "APPROVE_TIMEOFF";
    public static final String REJECT_TIMEOFF = "REJECT_TIMEOFF";
    public static final String CANCEL_TIMEOFF_OWN = "CANCEL_TIMEOFF_OWN";
    public static final String CANCEL_TIMEOFF_PENDING = "CANCEL_TIMEOFF_PENDING";

    // Time-Off Type Management Permissions
    public static final String VIEW_TIMEOFF_TYPE_ALL = "VIEW_TIMEOFF_TYPE_ALL";
    public static final String CREATE_TIMEOFF_TYPE = "CREATE_TIMEOFF_TYPE";
    public static final String UPDATE_TIMEOFF_TYPE = "UPDATE_TIMEOFF_TYPE";
    public static final String DELETE_TIMEOFF_TYPE = "DELETE_TIMEOFF_TYPE";

    // Leave Balance Management Permissions
    public static final String VIEW_LEAVE_BALANCE_ALL = "VIEW_LEAVE_BALANCE_ALL";
    public static final String ADJUST_LEAVE_BALANCE = "ADJUST_LEAVE_BALANCE";

    // Shift Renewal Permissions
    public static final String VIEW_RENEWAL_OWN = "VIEW_RENEWAL_OWN";
    public static final String RESPOND_RENEWAL_OWN = "RESPOND_RENEWAL_OWN";

    // Room Management Permissions
    public static final String VIEW_ROOM = "VIEW_ROOM";
    public static final String CREATE_ROOM = "CREATE_ROOM";
    public static final String UPDATE_ROOM = "UPDATE_ROOM";
    public static final String UPDATE_ROOM_SERVICES = "UPDATE_ROOM_SERVICES"; // V16: Assign services to rooms
    public static final String DELETE_ROOM = "DELETE_ROOM"; // soft delete

    // Service Management Permissions
    public static final String VIEW_SERVICE = "VIEW_SERVICE";
    public static final String CREATE_SERVICE = "CREATE_SERVICE";
    public static final String UPDATE_SERVICE = "UPDATE_SERVICE";
    public static final String DELETE_SERVICE = "DELETE_SERVICE"; // soft delete

    // Treatment Plan Permissions
    public static final String VIEW_TREATMENT_PLAN_ALL = "VIEW_TREATMENT_PLAN_ALL"; // Staff view all patients' plans
    public static final String VIEW_TREATMENT_PLAN_OWN = "VIEW_TREATMENT_PLAN_OWN"; // Patient view own plans only
    public static final String CREATE_TREATMENT_PLAN = "CREATE_TREATMENT_PLAN"; // Doctor creates new plan
    public static final String UPDATE_TREATMENT_PLAN = "UPDATE_TREATMENT_PLAN"; // Doctor updates plan
    public static final String DELETE_TREATMENT_PLAN = "DELETE_TREATMENT_PLAN"; // soft delete
    public static final String APPROVE_TREATMENT_PLAN = "APPROVE_TREATMENT_PLAN"; // V20: Manager approves/rejects plan
                                                                                  // (API 5.9)
    public static final String VIEW_ALL_TREATMENT_PLANS = "VIEW_ALL_TREATMENT_PLANS"; // V21: Manager view all plans
                                                                                      // across patients
    public static final String MANAGE_PLAN_PRICING = "MANAGE_PLAN_PRICING"; // V21.4: Finance/Accountant adjusts prices
                                                                             // (API 5.13)
}
