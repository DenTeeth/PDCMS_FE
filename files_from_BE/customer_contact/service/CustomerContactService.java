package com.dental.clinic.management.customer_contact.service;

import com.dental.clinic.management.contact_history.domain.ContactHistory;
import com.dental.clinic.management.contact_history.dto.response.ContactHistoryResponse;
import com.dental.clinic.management.contact_history.mapper.ContactHistoryMapper;
import com.dental.clinic.management.contact_history.repository.ContactHistoryRepository;
import com.dental.clinic.management.customer_contact.enums.CustomerContactSource;
import com.dental.clinic.management.customer_contact.enums.CustomerContactStatus;
import com.dental.clinic.management.customer_contact.domain.CustomerContact;
import com.dental.clinic.management.customer_contact.dto.request.CreateContactRequest;
import com.dental.clinic.management.customer_contact.dto.request.UpdateContactRequest;
import com.dental.clinic.management.customer_contact.dto.response.ContactInfoResponse;
import com.dental.clinic.management.customer_contact.mapper.CustomerContactMapper;
import com.dental.clinic.management.customer_contact.repository.CustomerContactRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.patient.dto.request.CreatePatientRequest;
import com.dental.clinic.management.patient.dto.response.PatientInfoResponse;
import com.dental.clinic.management.patient.service.PatientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

@Service
public class CustomerContactService {
    private final Logger log = LoggerFactory.getLogger(CustomerContactService.class);

    private final CustomerContactRepository repository;
    private final CustomerContactMapper mapper;
    private final ContactHistoryRepository historyRepository;
    private final ContactHistoryMapper historyMapper;
    private final EmployeeRepository employeeRepository;
    private final PatientService patientService; // ← Thêm này

    public CustomerContactService(CustomerContactRepository repository,
            CustomerContactMapper mapper,
            ContactHistoryRepository historyRepository,
            ContactHistoryMapper historyMapper,
            EmployeeRepository employeeRepository,
            PatientService patientService) { // ← Thêm này
        this.repository = repository;
        this.mapper = mapper;
        this.historyRepository = historyRepository;
        this.historyMapper = historyMapper;
        this.employeeRepository = employeeRepository;
        this.patientService = patientService;
    }

    // List: VIEW_CONTACT permission or ROLE_ADMIN
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_CONTACT + "')")
    @Transactional(readOnly = true)
    public Page<ContactInfoResponse> listContacts(int page, int size, String sortBy, String sortDirection) {
        page = Math.max(0, page);
        size = (size <= 0 || size > 100) ? 10 : size;
        Sort.Direction direction = sortDirection != null && sortDirection.equalsIgnoreCase("DESC") ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy == null ? "createdAt" : sortBy));
        return repository.findAll(pageable).map(mapper::toContactInfoResponse);
    }

    // Get by id: VIEW_CONTACT permission or ROLE_ADMIN
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_CONTACT + "')")
    @Transactional(readOnly = true)
    public ContactInfoResponse getContact(String contactId) {
        CustomerContact contact = repository.findOneByContactId(contactId)
                .orElseThrow(() -> new BadRequestAlertException("Contact not found: " + contactId, "customer_contact",
                        "contactnotfound"));

        ContactInfoResponse resp = mapper.toContactInfoResponse(contact);

        // load history and attach
        List<ContactHistory> historyEntities = historyRepository.findByContactIdOrderByCreatedAtDesc(contactId);
        List<ContactHistoryResponse> history = historyMapper.toResponseList(historyEntities);
        resp.setHistory(history);

        return resp;
    }

    // Create: CREATE_CONTACT permission or ROLE_ADMIN
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + CREATE_CONTACT + "')")
    @Transactional
    public ContactInfoResponse createContact(CreateContactRequest request) {
        if (request == null) {
            throw new BadRequestAlertException("Request required", "customer_contact", "request.required");
        }

        if (request.getPhone() != null && repository.existsByPhone(request.getPhone())) {
            log.warn("Duplicate phone creating contact: {}", request.getPhone());
        }

        // validate assignedTo if provided -> do NOT throw, just ignore and log if
        // employee not found
        if (request.getAssignedTo() != null) {
            if (!employeeRepository.existsById(request.getAssignedTo())) {
                log.warn("Assigned employee not found, ignoring assignedTo: {}", request.getAssignedTo());
                request.setAssignedTo(null);
            }
        }

        CustomerContact entity = mapper.toEntity(request);

        // generate contactId as CT + YYYYMMDD + SEQ (daily) if not provided; fallback
        // to UUID
        if (entity.getContactId() == null || entity.getContactId().isBlank()) {
            try {
                LocalDate today = LocalDate.now();
                LocalDateTime from = today.atStartOfDay();
                LocalDateTime to = today.plusDays(1).atStartOfDay().minusNanos(1);
                long seq = repository.countByCreatedAtBetween(from, to) + 1;
                String date = today.format(DateTimeFormatter.BASIC_ISO_DATE);
                String seqStr = String.format("%03d", seq);
                entity.setContactId("CT" + date + seqStr);
            } catch (Exception ex) {
                // fallback
                entity.setContactId(UUID.randomUUID().toString());
            }
        }

        if (entity.getStatus() == null) {
            entity.setStatus(CustomerContactStatus.NEW);
        }

        if (entity.getSource() == null) {
            entity.setSource(CustomerContactSource.WEBSITE);
        }

        CustomerContact saved = repository.save(entity);
        log.debug("Created contact {}", saved.getContactId());
        return mapper.toContactInfoResponse(saved);
    }

    // Update: UPDATE_CONTACT permission or ROLE_ADMIN
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_CONTACT + "')")
    @Transactional
    public ContactInfoResponse updateContact(String contactId, UpdateContactRequest request) {
        CustomerContact contact = repository.findOneByContactId(contactId)
                .orElseThrow(() -> new BadRequestAlertException("Contact not found: " + contactId, "customer_contact",
                        "contactnotfound"));

        // validate assignedTo if provided in update -> do NOT throw, ignore if employee
        // not found
        if (request != null && request.getAssignedTo() != null) {
            if (!employeeRepository.existsById(request.getAssignedTo())) {
                log.warn("Assigned employee not found, ignoring assignedTo update: {}", request.getAssignedTo());
                request.setAssignedTo(null); // leave existing assignedTo unchanged
            }
        }

        mapper.updateContactFromRequest(request, contact);
        CustomerContact saved = repository.save(contact);
        log.debug("Updated contact {}", saved.getContactId());
        return mapper.toContactInfoResponse(saved);
    }

    // Delete (soft): DELETE_CONTACT permission or ROLE_ADMIN
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + DELETE_CONTACT + "')")
    @Transactional
    public void deleteContact(String contactId) {
        CustomerContact contact = repository.findOneByContactId(contactId)
                .orElseThrow(() -> new BadRequestAlertException("Contact not found: " + contactId, "customer_contact",
                        "contactnotfound"));
        contact.setStatus(CustomerContactStatus.NOT_INTERESTED);
        repository.save(contact);
        log.debug("Soft-deleted contact {}", contactId);
    }

    /**
     * Assign contact to a specific employee (manual) or auto-assign to receptionist
     * with least NEW contacts.
     * Manual mode: validate employee exists and has role "Receptionist"
     * Auto mode: assign to receptionist with least NEW contacts
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_CONTACT + "')")
    @Transactional
    public ContactInfoResponse assignContact(String contactId, Integer employeeId /* nullable -> auto */) {
        CustomerContact contact = repository.findOneByContactId(contactId)
                .orElseThrow(() -> new BadRequestAlertException("Contact not found: " + contactId, "customer_contact",
                        "contactnotfound"));

        if (employeeId != null) {
            // Manual mode: validate employee exists and has Receptionist role
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new BadRequestAlertException("Assigned employee not found: " + employeeId,
                            "customer_contact", "employee_not_found"));

            // Validate employee has Receptionist role (check from Account)
            if (employee.getAccount() == null || employee.getAccount().getRole() == null ||
                    !"ROLE_RECEPTIONIST".equals(employee.getAccount().getRole().getRoleId())) {
                String currentRole = employee.getAccount() != null && employee.getAccount().getRole() != null
                        ? employee.getAccount().getRole().getRoleId()
                        : "NONE";
                throw new BadRequestAlertException(
                        "Employee must have Receptionist role. Current roleId: " + currentRole,
                        "customer_contact", "invalid_role");
            }

            contact.setAssignedTo(employeeId);
            log.debug("Manually assigned contact {} to employee {}", contactId, employeeId);
        } else {
            // Auto mode: find receptionist with least NEW contacts
            List<Employee> allEmployees = employeeRepository.findAll();

            // Filter only active receptionists (check role from Account)
            List<Employee> receptionists = allEmployees.stream()
                    .filter(e -> e.getIsActive() != null && e.getIsActive())
                    .filter(e -> e.getAccount() != null && e.getAccount().getRole() != null &&
                            "ROLE_RECEPTIONIST".equals(e.getAccount().getRole().getRoleId()))
                    .toList();

            if (receptionists.isEmpty()) {
                log.warn("No active receptionists found for auto-assign, leaving assignedTo as null");
                // Don't throw error, just leave assignedTo unchanged (or set to null)
                contact.setAssignedTo(null);
            } else {
                // Find receptionist with minimum NEW contacts
                Employee best = receptionists.get(0);
                long bestCount = repository.countByAssignedToAndStatus(best.getEmployeeId(), CustomerContactStatus.NEW);

                for (Employee e : receptionists) {
                    long cnt = repository.countByAssignedToAndStatus(e.getEmployeeId(), CustomerContactStatus.NEW);
                    if (cnt < bestCount) {
                        best = e;
                        bestCount = cnt;
                    }
                }

                contact.setAssignedTo(best.getEmployeeId());
                log.debug("Auto-assigned contact {} to receptionist {} (has {} NEW contacts)",
                        contactId, best.getEmployeeId(), bestCount);
            }
        }

        CustomerContact saved = repository.save(contact);
        return mapper.toContactInfoResponse(saved);
    }

    /**
     * Convert contact -> patient (creates real patient record).
     * Validations: contact.status != CONVERTED && != NOT_INTERESTED
     * Creates a new Patient and links it via convertedPatientId.
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_CONTACT + "')")
    @Transactional
    public ContactInfoResponse convertContact(String contactId) {
        CustomerContact contact = repository.findOneByContactId(contactId)
                .orElseThrow(() -> new BadRequestAlertException("Contact not found: " + contactId, "customer_contact",
                        "contactnotfound"));

        if (contact.getStatus() == CustomerContactStatus.CONVERTED) {
            throw new BadRequestAlertException("Contact already converted: " + contactId, "customer_contact",
                    "already_converted");
        }
        if (contact.getStatus() == CustomerContactStatus.NOT_INTERESTED) {
            throw new BadRequestAlertException("Contact not eligible to convert: " + contactId, "customer_contact",
                    "not_interested");
        }

        // ✅ Tạo Patient thực sự
        CreatePatientRequest patientRequest = new CreatePatientRequest();

        // Map từ contact sang patient
        String[] names = contact.getFullName().split(" ", 2);
        patientRequest.setFirstName(names.length > 0 ? names[0] : contact.getFullName());
        patientRequest.setLastName(names.length > 1 ? names[1] : "");
        patientRequest.setEmail(contact.getEmail());
        patientRequest.setPhone(contact.getPhone());
        // Set các field khác nếu cần...

        // Tạo patient
        PatientInfoResponse patient = patientService.createPatient(patientRequest);

        // Link patient với contact
        contact.setConvertedPatientId(patient.getPatientId());
        contact.setStatus(CustomerContactStatus.CONVERTED);

        CustomerContact saved = repository.save(contact);
        return mapper.toContactInfoResponse(saved);
    }

    /**
     * Stats: counts by status, by source, by assignedTo (simple aggregated maps)
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_CONTACT + "')")
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        List<CustomerContact> all = repository.findAll();
        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(c -> (c.getStatus() == null ? "UNKNOWN" : c.getStatus().name()),
                        Collectors.counting()));
        Map<String, Long> bySource = all.stream()
                .collect(Collectors.groupingBy(c -> (c.getSource() == null ? "UNKNOWN" : c.getSource().name()),
                        Collectors.counting()));
        Map<String, Long> byAssigned = all.stream()
                .collect(Collectors.groupingBy(
                        c -> (c.getAssignedTo() == null ? "UNASSIGNED" : c.getAssignedTo().toString()),
                        Collectors.counting()));

        Map<String, Object> out = new HashMap<>();
        out.put("byStatus", byStatus);
        out.put("bySource", bySource);
        out.put("byAssigned", byAssigned);
        out.put("total", all.size());
        return out;
    }

    /**
     * Conversion rate = converted / total (safe divide)
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_CONTACT + "')")
    @Transactional(readOnly = true)
    public Map<String, Object> getConversionRate() {
        List<CustomerContact> all = repository.findAll();
        long total = all.size();
        long converted = all.stream().filter(c -> c.getStatus() == CustomerContactStatus.CONVERTED).count();
        double rate = total == 0 ? 0.0 : (100.0 * converted / total);
        Map<String, Object> out = new HashMap<>();
        out.put("total", total);
        out.put("converted", converted);
        out.put("ratePercent", rate);
        return out;
    }
}
