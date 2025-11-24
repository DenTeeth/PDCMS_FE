package com.dental.clinic.management.working_schedule.exception;

import com.dental.clinic.management.employee.enums.EmploymentType;

/**
 * Exception thrown when an employee with wrong employment type tries to register for part-time flex slots.
 */
public class InvalidEmployeeTypeException extends RuntimeException {
    private final EmploymentType employeeType;
    private final EmploymentType requiredType;

    public InvalidEmployeeTypeException(EmploymentType employeeType) {
        super(String.format("Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt. " +
                        "Nhân viên %s phải sử dụng đăng ký ca cố định.",
                employeeType));
        this.employeeType = employeeType;
        this.requiredType = EmploymentType.PART_TIME_FLEX;
    }

    public EmploymentType getEmployeeType() {
        return employeeType;
    }

    public EmploymentType getRequiredType() {
        return requiredType;
    }
}
