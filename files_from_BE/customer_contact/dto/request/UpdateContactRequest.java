package com.dental.clinic.management.customer_contact.dto.request;

import com.dental.clinic.management.customer_contact.enums.CustomerContactSource;
import com.dental.clinic.management.customer_contact.enums.CustomerContactStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for partial updating an existing contact.
 * All fields are optional - service will apply only non-null values.
 * Follow style of UpdateEmployeeRequest for clean, explicit code.
 */
public class UpdateContactRequest {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Size(max = 15, message = "Phone must not exceed 15 characters")
    @Pattern(regexp = "^[0-9+\\- ]{6,15}$", message = "Invalid phone")
    private String phone;

    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    private CustomerContactSource source;

    @Size(max = 100, message = "Service interested must not exceed 100 characters")
    private String serviceInterested;

    @Size(max = 2000, message = "Message must not exceed 2000 characters")
    private String message;

    private CustomerContactStatus status;

    private Integer assignedTo;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;

    public UpdateContactRequest() {
    }

    // Getters / Setters
    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public CustomerContactSource getSource() {
        return source;
    }

    public void setSource(CustomerContactSource source) {
        this.source = source;
    }

    public String getServiceInterested() {
        return serviceInterested;
    }

    public void setServiceInterested(String serviceInterested) {
        this.serviceInterested = serviceInterested;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public CustomerContactStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerContactStatus status) {
        this.status = status;
    }

    public Integer getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Integer assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return "UpdateContactRequest{" +
                "fullName='" + fullName + '\'' +
                ", phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                ", source=" + source +
                ", serviceInterested='" + serviceInterested + '\'' +
                ", status=" + status +
                ", assignedTo='" + assignedTo + '\'' +
                ", notes='" + (notes == null ? null : (notes.length() > 60 ? notes.substring(0, 60) + "..." : notes)) + '\'' +
                '}';
    }
}
