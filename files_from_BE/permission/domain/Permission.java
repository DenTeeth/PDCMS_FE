package com.dental.clinic.management.permission.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.dental.clinic.management.role.domain.Role;

/**
 * A Permission entity.
 */
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @Column(name = "permission_id", length = 30)
    private String permissionId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "permission_name", nullable = false, length = 100)
    private String permissionName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "module", nullable = false, length = 20)
    private String module;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // --- Sidebar fields ---
    // REMOVED: path field - FE handles routing independently

    /**
     * Display order for sorting items within the same module.
     * Example: 10, 20, 30
     */
    @Column(name = "display_order")
    private Integer displayOrder;

    /**
     * Parent permission ID for hierarchical permissions (e.g.,
     * VIEW_REGISTRATION_OWN -> VIEW_REGISTRATION_ALL).
     * If user has parent permission, child permission will be hidden in sidebar.
     */
    @ManyToOne
    @JoinColumn(name = "parent_permission_id")
    private Permission parentPermission;

    // --- End sidebar fields ---

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles = new HashSet<>();

    // Constructors
    public Permission() {
    }

    public Permission(String permissionId, String permissionName, String module, String description) {
        this.permissionId = permissionId;
        this.permissionName = permissionName;
        this.module = module;
        this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(String permissionId) {
        this.permissionId = permissionId;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Permission getParentPermission() {
        return parentPermission;
    }

    public void setParentPermission(Permission parentPermission) {
        this.parentPermission = parentPermission;
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

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Permission))
            return false;
        Permission permission = (Permission) o;
        return permissionId != null && permissionId.equals(permission.getPermissionId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Permission{" +
                "permissionId='" + permissionId + '\'' +
                ", permissionName='" + permissionName + '\'' +
                ", module='" + module + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
