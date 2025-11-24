package com.dental.clinic.management.customer_contact.mapper;

import com.dental.clinic.management.customer_contact.enums.CustomerContactSource;
import com.dental.clinic.management.customer_contact.domain.CustomerContact;
import com.dental.clinic.management.customer_contact.dto.request.CreateContactRequest;
import com.dental.clinic.management.customer_contact.dto.request.UpdateContactRequest;
import com.dental.clinic.management.customer_contact.dto.response.ContactInfoResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for CustomerContact <-> ContactInfoResponse and request updates.
 */
@Component
public class CustomerContactMapper {

    public CustomerContact toEntity(CreateContactRequest req) {
        if (req == null)
            return null;
        CustomerContact c = new CustomerContact();
        c.setFullName(req.getFullName());
        c.setPhone(req.getPhone());
        c.setEmail(req.getEmail());
        c.setSource(req.getSource() != null ? req.getSource() : CustomerContactSource.WEBSITE);
        // map optional fields if present on request
        try {
            c.setServiceInterested(req.getServiceInterested());
        } catch (Throwable ignored) {
        }
        try {
            c.setMessage(req.getMessage());
        } catch (Throwable ignored) {
        }
        try {
            c.setAssignedTo(req.getAssignedTo());
        } catch (Throwable ignored) {
        }
        // note: do NOT call req.getNotes() because CreateContactRequest in this project
        // doesn't define it
        return c;
    }

    public ContactInfoResponse toContactInfoResponse(CustomerContact c) {
        if (c == null)
            return null;
        ContactInfoResponse r = new ContactInfoResponse();
        r.setContactId(c.getContactId());
        r.setFullName(c.getFullName());
        r.setPhone(c.getPhone());
        r.setEmail(c.getEmail());
        r.setSource(c.getSource());
        try {
            r.getClass().getMethod("setServiceInterested", String.class).invoke(r, c.getServiceInterested());
        } catch (Exception ignored) {
        }
        try {
            r.getClass().getMethod("setMessage", String.class).invoke(r, c.getMessage());
        } catch (Exception ignored) {
        }
        r.setStatus(c.getStatus());
        r.setAssignedTo(c.getAssignedTo());
        r.setNotes(c.getNotes());
        r.setConvertedPatientId(c.getConvertedPatientId());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }

    public void updateContactFromRequest(UpdateContactRequest req, CustomerContact c) {
        if (req == null || c == null)
            return;
        if (req.getFullName() != null)
            c.setFullName(req.getFullName());
        if (req.getPhone() != null)
            c.setPhone(req.getPhone());
        if (req.getEmail() != null)
            c.setEmail(req.getEmail());
        if (req.getSource() != null)
            c.setSource(req.getSource());
        if (req.getServiceInterested() != null)
            c.setServiceInterested(req.getServiceInterested());
        if (req.getMessage() != null)
            c.setMessage(req.getMessage());
        if (req.getStatus() != null)
            c.setStatus(req.getStatus());
        if (req.getAssignedTo() != null)
            c.setAssignedTo(req.getAssignedTo());
        if (req.getNotes() != null)
            c.setNotes(req.getNotes());
    }

    public List<ContactInfoResponse> toResponseList(List<CustomerContact> list) {
        if (list == null)
            return List.of();
        return list.stream().map(this::toContactInfoResponse).collect(Collectors.toList());
    }
}
