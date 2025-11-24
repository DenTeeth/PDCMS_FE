package com.dental.clinic.management.specialization.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * A Specialization entity.
 */
@Entity
@Table(name = "specializations")
public class Specialization {

    @Id
    @Column(name = "specialization_id")
    private Integer specializationId;

    @NotBlank
    @Size(max = 20)
    @Column(name = "specialization_code", unique = true, nullable = false, length = 20)
    private String specializationCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "specialization_name", nullable = false, length = 100)
    private String specializationName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonIgnore
    @ManyToMany(mappedBy = "specializations", fetch = FetchType.LAZY)
    private Set<Employee> employees = new HashSet<>();

    // Constructors
    public Specialization() {
    }

    public Specialization(Integer specializationId, String specializationCode, String specializationName) {
        this.specializationId = specializationId;
        this.specializationCode = specializationCode;
        this.specializationName = specializationName;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getSpecializationId() {
        return specializationId;
    }

    public void setSpecializationId(Integer specializationId) {
        this.specializationId = specializationId;
    }

    public String getSpecializationCode() {
        return specializationCode;
    }

    public void setSpecializationCode(String specializationCode) {
        this.specializationCode = specializationCode;
    }

    public String getSpecializationName() {
        return specializationName;
    }

    public void setSpecializationName(String specializationName) {
        this.specializationName = specializationName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<Employee> getEmployees() {
        return employees;
    }

    public void setEmployees(Set<Employee> employees) {
        this.employees = employees;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Specialization))
            return false;
        Specialization that = (Specialization) o;
        return specializationId != null && specializationId.equals(that.getSpecializationId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Specialization{" +
                "specializationId=" + specializationId +
                ", specializationCode='" + specializationCode + '\'' +
                ", specializationName='" + specializationName + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
