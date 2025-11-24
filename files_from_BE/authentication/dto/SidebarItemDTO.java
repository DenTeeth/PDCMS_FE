package com.dental.clinic.management.authentication.dto;

/**
 * DTO representing a single sidebar menu item.
 * Used for FE sidebar navigation rendering.
 */
public class SidebarItemDTO {

    private String title;
    private String path;

    // Constructors
    public SidebarItemDTO() {
    }

    public SidebarItemDTO(String title, String path) {
        this.title = title;
        this.path = path;
    }

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    @Override
    public String toString() {
        return "SidebarItemDTO{" +
                "title='" + title + '\'' +
                ", path='" + path + '\'' +
                '}';
    }
}
