package com.dental.clinic.management.working_schedule.domain;

import java.time.LocalDate;

import com.dental.clinic.management.utils.IdGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "employee_shift_registrations")
public class EmployeeShiftRegistration {

    private static IdGenerator idGenerator;

    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @Id
    @Column(name = "registration_id", length = 20)
    private String registrationId;

    @Column(name = "employee_id", nullable = false)
    private Integer employeeId;

    @Column(name = "part_time_slot_id", nullable = false)
    private Long partTimeSlotId;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_active", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    // Constructors
    public EmployeeShiftRegistration() {
    }

    public EmployeeShiftRegistration(String registrationId, Integer employeeId, Long partTimeSlotId,
            LocalDate effectiveFrom, LocalDate effectiveTo, Boolean isActive) {
        this.registrationId = registrationId;
        this.employeeId = employeeId;
        this.partTimeSlotId = partTimeSlotId;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.isActive = isActive;
    }

    // Getters and Setters
    public String getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(String registrationId) {
        this.registrationId = registrationId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public Long getPartTimeSlotId() {
        return partTimeSlotId;
    }

    public void setPartTimeSlotId(Long partTimeSlotId) {
        this.partTimeSlotId = partTimeSlotId;
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

    @PrePersist
    protected void onCreate() {
        if (registrationId == null && idGenerator != null) {
            this.registrationId = idGenerator.generateId("ESR");
        }
    }

    @Override
    public String toString() {
        return "EmployeeShiftRegistration{" +
                "registrationId='" + registrationId + '\'' +
                ", employeeId=" + employeeId +
                ", partTimeSlotId=" + partTimeSlotId +
                ", effectiveFrom=" + effectiveFrom +
                ", effectiveTo=" + effectiveTo +
                ", isActive=" + isActive +
                '}';
    }
}
