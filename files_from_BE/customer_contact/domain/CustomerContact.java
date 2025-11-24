package com.dental.clinic.management.customer_contact.domain;

import com.dental.clinic.management.customer_contact.enums.CustomerContactSource;
import com.dental.clinic.management.customer_contact.enums.CustomerContactStatus;
import com.dental.clinic.management.utils.IdGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "customer_contacts")
public class CustomerContact {

    @Transient
    private static IdGenerator idGenerator;

    @Id
    @Column(name = "contact_id", length = 20)
    private String contactId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotBlank
    @Size(max = 15)
    @Column(name = "phone", nullable = false, length = 15)
    private String phone;

    @Size(max = 100)
    @Column(name = "email", length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20)
    private CustomerContactSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private CustomerContactStatus status;

    @Size(max = 100)
    @Column(name = "service_interested", length = 100)
    private String serviceInterested;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "assigned_to")
    private Integer assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", insertable = false, updatable = false)
    private com.dental.clinic.management.employee.domain.Employee assignedToEmployee;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "converted_patient_id")
    private Integer convertedPatientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_patient_id", insertable = false, updatable = false)
    private com.dental.clinic.management.patient.domain.Patient convertedPatient;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public CustomerContact() {
    }

    // Setter for IdGenerator (will be injected via service layer)
    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @PrePersist
    protected void onCreate() {
        if (contactId == null && idGenerator != null) {
            contactId = idGenerator.generateId("CTC");
        }
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters / Setters
    public String getContactId() {
        return contactId;
    }

    public void setContactId(String contactId) {
        this.contactId = contactId;
    }

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

    public CustomerContactStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerContactStatus status) {
        this.status = status;
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

    public com.dental.clinic.management.employee.domain.Employee getAssignedToEmployee() {
        return assignedToEmployee;
    }

    public void setAssignedToEmployee(com.dental.clinic.management.employee.domain.Employee assignedToEmployee) {
        this.assignedToEmployee = assignedToEmployee;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getConvertedPatientId() {
        return convertedPatientId;
    }

    public void setConvertedPatientId(Integer convertedPatientId) {
        this.convertedPatientId = convertedPatientId;
    }

    public com.dental.clinic.management.patient.domain.Patient getConvertedPatient() {
        return convertedPatient;
    }

    public void setConvertedPatient(com.dental.clinic.management.patient.domain.Patient convertedPatient) {
        this.convertedPatient = convertedPatient;
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

    // equality by contactId
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;

        CustomerContact that = (CustomerContact) o;
        return contactId != null && contactId.equals(that.contactId);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(contactId);
    }

    @Override
    public String toString() {
        return "CustomerContact{" +
                "contactId='" + contactId + '\'' +
                ", fullName='" + fullName + '\'' +
                ", phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                ", source=" + source +
                ", status=" + status +
                ", assignedTo='" + getAssignedTo() + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
