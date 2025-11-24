package com.dental.clinic.management.contact_history.service;

import com.dental.clinic.management.contact_history.domain.ContactHistory;
import com.dental.clinic.management.contact_history.dto.request.CreateContactHistoryRequest;
import com.dental.clinic.management.contact_history.dto.response.ContactHistoryResponse;
import com.dental.clinic.management.contact_history.mapper.ContactHistoryMapper;
import com.dental.clinic.management.contact_history.repository.ContactHistoryRepository;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

@Service
public class ContactHistoryService {

    private final Logger log = LoggerFactory.getLogger(ContactHistoryService.class);

    private final ContactHistoryRepository repository;
    private final ContactHistoryMapper mapper;
    private final EmployeeRepository employeeRepository;

    public ContactHistoryService(ContactHistoryRepository repository, ContactHistoryMapper mapper,
                                 EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.employeeRepository = employeeRepository;
    }

    /**
     * List history records for a contact (ordered desc).
     * Permissions: VIEW_CONTACT_HISTORY or ROLE_ADMIN
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_CONTACT_HISTORY + "')")
    @Transactional(readOnly = true)
    public List<ContactHistoryResponse> listHistoryForContact(String contactId) {
        if (contactId == null || contactId.trim().isEmpty()) {
            throw new BadRequestAlertException("contactId is required", "contact_history", "contactid.required");
        }
        var list = repository.findByContactIdOrderByCreatedAtDesc(contactId);
        return mapper.toResponseList(list);
    }

    /**
     * Add a history record. employeeId is taken from current authentication.
     * Permissions: CREATE_CONTACT_HISTORY or ROLE_ADMIN
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + CREATE_CONTACT_HISTORY + "')")
    @Transactional
    public ContactHistoryResponse addHistory(CreateContactHistoryRequest req) {
        if (req == null) {
            throw new BadRequestAlertException("Request required", "contact_history", "request.required");
        }
        if (req.getContactId() == null || req.getContactId().trim().isEmpty()) {
            throw new BadRequestAlertException("contactId is required", "contact_history", "contactid.required");
        }
        if (req.getAction() == null) {
            throw new BadRequestAlertException("action is required", "contact_history", "action.required");
        }
        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new BadRequestAlertException("content is required", "contact_history", "content.required");
        }

        ContactHistory h = new ContactHistory();
        h.setContactId(req.getContactId());
        h.setAction(req.getAction());
        h.setContent(req.getContent());

        // set employeeId from current authentication (principal name)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            // Look up employee by username from authentication
            employeeRepository.findByAccount_Username(auth.getName())
                    .ifPresent(employee -> h.setEmployeeId(employee.getEmployeeId()));
        }

        // generate historyId HIST + YYYYMMDD + SEQ (daily). Note: not race-proof.
        LocalDate today = LocalDate.now();
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay().minusNanos(1);
        long seq = repository.countByCreatedAtBetween(from, to) + 1;
        String date = today.format(DateTimeFormatter.BASIC_ISO_DATE);
        String seqStr = String.format("%03d", seq);
        h.setHistoryId("HIST" + date + seqStr);

        ContactHistory saved = repository.save(h);
        log.debug("Created contact history {} for contact {}", saved.getHistoryId(), saved.getContactId());
        return mapper.toResponse(saved);
    }
}
