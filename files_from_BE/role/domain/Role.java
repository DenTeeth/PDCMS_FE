package com.dental.clinic.management.role.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.dental.clinic.management.permission.domain.Permission;

/**
 * A Role entity.
 */
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @Column(name = "role_id", length = 50)
    private String roleId;

    @NotBlank
    @Size(max = 50)
    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Base role reference (admin/employee/patient)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_role_id", nullable = false)
    private BaseRole baseRole;

    @Column(name = "requires_specialization")
    private Boolean requiresSpecialization = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"), inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();

    // Constructors
    public Role() {
    }

    public Role(String roleId, String roleName, String description) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BaseRole getBaseRole() {
        return baseRole;
    }

    public void setBaseRole(BaseRole baseRole) {
        this.baseRole = baseRole;
    }

    public Boolean getRequiresSpecialization() {
        return requiresSpecialization;
    }

    public void setRequiresSpecialization(Boolean requiresSpecialization) {
        this.requiresSpecialization = requiresSpecialization;
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

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    // Helper methods
    public void addPermission(Permission permission) {
        this.permissions.add(permission);
        permission.getRoles().add(this);
    }

    public void removePermission(Permission permission) {
        this.permissions.remove(permission);
        permission.getRoles().remove(this);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Role))
            return false;
        Role role = (Role) o;
        return roleId != null && roleId.equals(role.getRoleId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Role{" +
                "roleId='" + roleId + '\'' +
                ", roleName='" + roleName + '\'' +
                ", description='" + description + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
