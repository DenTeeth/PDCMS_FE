package com.dental.clinic.management.specialization.dto.response;

import java.time.LocalDateTime;

public class SpecializationResponse {
    private String specializationId;
    private String specializationCode;
    private String specializationName;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public SpecializationResponse() {
    }

    public SpecializationResponse(String specializationId, String specializationCode, String specializationName,
            String description, Boolean isActive, LocalDateTime createdAt) {
        this.specializationId = specializationId;
        this.specializationCode = specializationCode;
        this.specializationName = specializationName;
        this.description = description;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public String getSpecializationId() {
        return specializationId;
    }

    public void setSpecializationId(String specializationId) {
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

}
