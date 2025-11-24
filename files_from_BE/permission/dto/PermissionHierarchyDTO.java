package com.dental.clinic.management.permission.dto;

/**
 * DTO for permission with parent-child hierarchy.
 * Used for FE permission checkboxes display.
 */
public class PermissionHierarchyDTO {

    private String permissionId;
    private String permissionName;
    private Integer displayOrder;
    private String parentPermissionId; // Parent permission ID (nullable)

    // For radio button selection in FE
    private String selectionLevel; // "NONE", "OWN", "ALL"

    // Constructors
    public PermissionHierarchyDTO() {
    }

    public PermissionHierarchyDTO(String permissionId, String permissionName,
            Integer displayOrder, String parentPermissionId) {
        this.permissionId = permissionId;
        this.permissionName = permissionName;
        this.displayOrder = displayOrder;
        this.parentPermissionId = parentPermissionId;
        this.selectionLevel = "NONE";
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public String getParentPermissionId() {
        return parentPermissionId;
    }

    public void setParentPermissionId(String parentPermissionId) {
        this.parentPermissionId = parentPermissionId;
    }

    public String getSelectionLevel() {
        return selectionLevel;
    }

    public void setSelectionLevel(String selectionLevel) {
        this.selectionLevel = selectionLevel;
    }
}
