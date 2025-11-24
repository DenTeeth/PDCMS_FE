package com.dental.clinic.management.customer_contact.dto.request;

import com.dental.clinic.management.customer_contact.enums.CustomerContactSource;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new customer contact.
 * Follows style of CreateEmployeeRequest (explicit getters/setters).
 */
public class CreateContactRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Phone is required")
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

    private Integer assignedTo;

    public CreateContactRequest() {
    }

    public CreateContactRequest(String fullName, String phone, String email, CustomerContactSource source,
                                String serviceInterested, String message, Integer assignedTo) {
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.source = source;
        this.serviceInterested = serviceInterested;
        this.message = message;
        this.assignedTo = assignedTo;
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

    public Integer getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Integer assignedTo) {
        this.assignedTo = assignedTo;
    }

    @Override
    public String toString() {
        return "CreateContactRequest{" +
                "fullName='" + fullName + '\'' +
                ", phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                ", source=" + source +
                ", serviceInterested='" + serviceInterested + '\'' +
                ", assignedTo='" + assignedTo + '\'' +
                '}';
    }
}
