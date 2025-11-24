package com.dental.clinic.management.working_schedule.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.dental.clinic.management.working_schedule.enums.DayOfWeek;

/**
 * Request DTO for PATCH /api/v1/registrations/{registration_id}
 * All fields are optional - only provided fields will be updated
 */
public class UpdateShiftRegistrationRequest {

    private String workShiftId;
    private List<DayOfWeek> daysOfWeek;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean isActive;

    // Getters and Setters
    public String getWorkShiftId() {
        return workShiftId;
    }

    public void setWorkShiftId(String workShiftId) {
        this.workShiftId = workShiftId;
    }

    public List<DayOfWeek> getDaysOfWeek() {
        return daysOfWeek;
    }

    public void setDaysOfWeek(List<DayOfWeek> daysOfWeek) {
        this.daysOfWeek = daysOfWeek;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    @Override
    public String toString() {
        return "UpdateShiftRegistrationRequest{" +
                "workShiftId='" + workShiftId + '\'' +
                ", daysOfWeek=" + daysOfWeek +
                ", effectiveFrom=" + effectiveFrom +
                ", effectiveTo=" + effectiveTo +
                ", isActive=" + isActive +
                '}';
    }
}
