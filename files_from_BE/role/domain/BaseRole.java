package com.dental.clinic.management.role.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * BaseRole entity - 3 loại vai trò cơ bản: admin, employee, patient.
 * Xác định layout FE - FE tự xử lý routing.
 */
@Entity
@Table(name = "base_roles")
public class BaseRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "base_role_id")
    private Integer baseRoleId;

    @NotBlank
    @Column(name = "base_role_name", unique = true, nullable = false, length = 50)
    private String baseRoleName; // 'admin', 'employee', 'patient'

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "baseRole", fetch = FetchType.LAZY)
    private Set<Role> roles = new HashSet<>();

    // Constructors
    public BaseRole() {
    }

    public BaseRole(String baseRoleName, String description) {
        this.baseRoleName = baseRoleName;
        this.description = description;
        this.isActive = true;
    }

    // Getters and Setters
    public Integer getBaseRoleId() {
        return baseRoleId;
    }

    public void setBaseRoleId(Integer baseRoleId) {
        this.baseRoleId = baseRoleId;
    }

    public String getBaseRoleName() {
        return baseRoleName;
    }

    public void setBaseRoleName(String baseRoleName) {
        this.baseRoleName = baseRoleName;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof BaseRole))
            return false;
        BaseRole baseRole = (BaseRole) o;
        return baseRoleId != null && baseRoleId.equals(baseRole.getBaseRoleId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "BaseRole{" +
                "baseRoleId=" + baseRoleId +
                ", baseRoleName='" + baseRoleName + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
