
package com.dental.clinic.management.contact_history.mapper;

import com.dental.clinic.management.contact_history.domain.ContactHistory;
import com.dental.clinic.management.contact_history.dto.response.ContactHistoryResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for ContactHistory <-> ContactHistoryResponse
 */
@Component
public class ContactHistoryMapper {

    public ContactHistoryResponse toResponse(ContactHistory h) {
        if (h == null) return null;
        ContactHistoryResponse r = new ContactHistoryResponse();
        r.setHistoryId(h.getHistoryId());
        r.setContactId(h.getContactId());
        r.setEmployeeId(h.getEmployeeId());
        r.setAction(h.getAction());
        r.setContent(h.getContent());
        r.setCreatedAt(h.getCreatedAt());
        return r;
    }

    public List<ContactHistoryResponse> toResponseList(List<ContactHistory> list) {
        if (list == null) return List.of();
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
