
package com.dental.clinic.management.contact_history.controller;

import com.dental.clinic.management.contact_history.dto.request.CreateContactHistoryRequest;
import com.dental.clinic.management.contact_history.dto.response.ContactHistoryResponse;
import com.dental.clinic.management.contact_history.service.ContactHistoryService;
import com.dental.clinic.management.utils.annotation.ApiMessage;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.Principal;
import java.util.List;

@Tag(name = "Contacts History", description = "APIs for managing contact history entries")
@RestController
@RequestMapping("/api/v1/customer-contacts")
public class ContactHistoryController {

    private final ContactHistoryService historyService;

    public ContactHistoryController(ContactHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/{contactId}/history")
    @Operation(summary = "List contact history")
    // accept ROLE_*, uppercase and lowercase variants to match possible JWT claims

    public ResponseEntity<List<ContactHistoryResponse>> getHistory(@PathVariable String contactId) {
        return ResponseEntity.ok(historyService.listHistoryForContact(contactId));
    }

    @PostMapping("/{contactId}/history")
    @Operation(summary = "Add contact history")
    @ApiMessage("Add contact history successfully")
    // accept ADMIN and RECEPTIONIST for testing; change later if want only
    // receptionists

    public ResponseEntity<ContactHistoryResponse> addHistory(
            @PathVariable String contactId,
            @Valid @RequestBody CreateContactHistoryRequest request,
            Principal principal) throws URISyntaxException {

        if (request.getContactId() == null || request.getContactId().isBlank()) {
            request.setContactId(contactId);
        }

        ContactHistoryResponse created = historyService.addHistory(request);
        return ResponseEntity
                .created(new URI("/api/v1/customer-contacts/" + contactId + "/history/" + created.getHistoryId()))
                .body(created);
    }
}
