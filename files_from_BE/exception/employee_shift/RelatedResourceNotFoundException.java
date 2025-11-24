package com.dental.clinic.management.exception.employee_shift;

/**
 * Exception thrown when related resources (Employee, WorkShift) are not found.
 * Error Code: RELATED_RESOURCE_NOT_FOUND
 */
public class RelatedResourceNotFoundException extends RuntimeException {

    public RelatedResourceNotFoundException(String resourceType, String resourceId) {
        super(String.format("Không tìm thấy %s với ID: %s", resourceType, resourceId));
    }

    public RelatedResourceNotFoundException(String message) {
        super(message);
    }

    public RelatedResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
