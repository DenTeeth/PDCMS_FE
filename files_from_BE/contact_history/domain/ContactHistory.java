
package com.dental.clinic.management.contact_history.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.dental.clinic.management.contact_history.enums.ContactHistoryAction;
import com.dental.clinic.management.utils.IdGenerator;
import java.time.LocalDateTime;

/**
 * Contact interaction / audit record.
 */
@Entity
@Table(name = "contact_history")
public class ContactHistory {

    @Transient
    private static IdGenerator idGenerator;

    @Id
    @Column(name = "history_id", length = 20)
    private String historyId;

    @NotBlank
    @Size(max = 20)
    @Column(name = "contact_id", length = 20, nullable = false, insertable = false, updatable = false)
    private String contactId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", nullable = false)
    private com.dental.clinic.management.customer_contact.domain.CustomerContact contact;

    @Column(name = "employee_id", insertable = false, updatable = false)
    private Integer employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private com.dental.clinic.management.employee.domain.Employee employee;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "action", length = 20, nullable = false)
    private ContactHistoryAction action;

    @NotBlank
    @Size(max = 2000)
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ContactHistory() {
    }

    // Setter for IdGenerator (will be injected via service layer)
    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @PrePersist
    protected void onCreate() {
        if (historyId == null && idGenerator != null) {
            historyId = idGenerator.generateId("CTH");
        }
        this.createdAt = LocalDateTime.now();
    }

    // Getters / setters
    public String getHistoryId() {
        return historyId;
    }

    public void setHistoryId(String historyId) {
        this.historyId = historyId;
    }

    public String getContactId() {
        return contactId;
    }

    public void setContactId(String contactId) {
        this.contactId = contactId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // equality by historyId (consistent with Employee entity style)
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof ContactHistory))
            return false;
        ContactHistory that = (ContactHistory) o;
        return historyId != null && historyId.equals(that.historyId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "ContactHistory{" +
                "historyId='" + historyId + '\'' +
                ", contactId='" + contactId + '\'' +
                ", employeeId='" + employeeId + '\'' +
                ", action=" + action +
                ", createdAt=" + createdAt +
                '}';
    }
}
