package com.dental.clinic.management.contact_history.dto.request;

import com.dental.clinic.management.contact_history.enums.ContactHistoryAction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a contact history (interaction) record.
 * employeeId will be taken from authenticated principal in service/controller.
 */
public class CreateContactHistoryRequest {

    @Size(max = 36, message = "contactId must not exceed 36 characters")
    private String contactId;

    @NotNull(message = "action is required")
    private ContactHistoryAction action;

    @NotBlank(message = "content is required")
    @Size(max = 2000, message = "content must not exceed 2000 characters")
    private String content;

    public CreateContactHistoryRequest() {
    }

    public CreateContactHistoryRequest(String contactId, ContactHistoryAction action, String content) {
        this.contactId = contactId;
        this.action = action;
        this.content = content;
    }

    // Getters / Setters
    public String getContactId() {
        return contactId;
    }

    public void setContactId(String contactId) {
        this.contactId = contactId;
    }

    public ContactHistoryAction getAction() {
        return action;
    }

    public void setAction(ContactHistoryAction action) {
        this.action = action;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @Override
    public String toString() {
        return "CreateContactHistoryRequest{" +
                "contactId='" + contactId + '\'' +
                ", action=" + action +
                ", content='" + (content == null ? null : (content.length() > 60 ? content.substring(0, 60) + "..." : content)) + '\'' +
                '}';
    }
}
