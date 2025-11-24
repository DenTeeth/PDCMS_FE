package com.dental.clinic.management.working_schedule.exception;

import com.dental.clinic.management.employee.enums.EmploymentType;

/**
 * Exception thrown when an employee with incorrect type attempts to register for Part-Time Flex work slots.
 * Only employees with type PART_TIME_FLEX are allowed to register.
 */
public class InvalidEmployeeTypeForFlexRegistrationException extends RuntimeException {

    private final EmploymentType employeeType;
    private final EmploymentType requiredType;

    public InvalidEmployeeTypeForFlexRegistrationException(EmploymentType employeeType, EmploymentType requiredType) {
        super(String.format("Employee type %s is not allowed to register for Part-Time Flex work slots. Required type: %s", 
                employeeType, requiredType));
        this.employeeType = employeeType;
        this.requiredType = requiredType;
    }

    public EmploymentType getEmployeeType() {
        return employeeType;
    }

    public EmploymentType getRequiredType() {
        return requiredType;
    }
}
