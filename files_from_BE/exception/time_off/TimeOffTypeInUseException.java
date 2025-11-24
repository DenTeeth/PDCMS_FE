package com.dental.clinic.management.exception.time_off;

public class TimeOffTypeInUseException extends RuntimeException {
    public TimeOffTypeInUseException(String typeId) {
        super("Cannot delete time off type " + typeId + ". There are active requests using this type.");
    }
}
