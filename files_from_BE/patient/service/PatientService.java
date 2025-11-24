package com.dental.clinic.management.patient.service;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.account.enums.AccountStatus;
import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.domain.AccountVerificationToken;
import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.account.repository.AccountVerificationTokenRepository;
import com.dental.clinic.management.patient.domain.Patient;
import com.dental.clinic.management.patient.dto.request.CreatePatientRequest;
import com.dental.clinic.management.patient.dto.request.ReplacePatientRequest;
import com.dental.clinic.management.patient.dto.request.UpdatePatientRequest;
import com.dental.clinic.management.patient.dto.response.PatientInfoResponse;
import com.dental.clinic.management.patient.mapper.PatientMapper;
import com.dental.clinic.management.patient.repository.PatientRepository;
import com.dental.clinic.management.utils.EmailService;
import com.dental.clinic.management.utils.SequentialCodeGenerator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

/**
 * Service for managing patients
 */
@Service
public class PatientService {
    private static final Logger log = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final SequentialCodeGenerator codeGenerator;
    private final AccountVerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

    public PatientService(
            PatientRepository patientRepository,
            PatientMapper patientMapper,
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            SequentialCodeGenerator codeGenerator,
            AccountVerificationTokenRepository verificationTokenRepository,
            EmailService emailService) {
        this.patientRepository = patientRepository;
        this.patientMapper = patientMapper;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.codeGenerator = codeGenerator;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
    }

    /**
     * Get all ACTIVE patients only (isActive = true) with pagination and sorting
     *
     * @param page          page number (zero-based)
     * @param size          number of items per page
     * @param sortBy        field name to sort by
     * @param sortDirection ASC or DESC
     * @return Page of PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_PATIENT + "')")
    public Page<PatientInfoResponse> getAllActivePatients(
            int page, int size, String sortBy, String sortDirection) {

        // Validate inputs
        page = Math.max(0, page);
        size = (size <= 0 || size > 100) ? 10 : size;

        Sort.Direction direction = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Filter only active patients using Specification
        Specification<Patient> spec = (root, query, cb) -> cb.equal(root.get("isActive"), true);

        Page<Patient> patientPage = patientRepository.findAll(spec, pageable);

        return patientPage.map(patientMapper::toPatientInfoResponse);
    }

    /**
     * Get ALL patients including deleted ones (Admin only)
     *
     * @param page          page number (zero-based)
     * @param size          number of items per pageThere is no data provider
     *                      registered that can provide view data.
     * @param sortBy        field name to sort by
     * @param sortDirection ASC or DESC
     * @return Page of PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_PATIENT + "')")
    public Page<PatientInfoResponse> getAllPatientsIncludingDeleted(
            int page, int size, String sortBy, String sortDirection) {

        page = Math.max(0, page);
        size = (size <= 0 || size > 100) ? 10 : size;

        Sort.Direction direction = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Patient> patientPage = patientRepository.findAll(pageable);

        return patientPage.map(patientMapper::toPatientInfoResponse);
    }

    /**
     * Get active patient by patient code
     *
     * @param patientCode the patient code
     * @return PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_PATIENT + "')")
    public PatientInfoResponse getActivePatientByCode(String patientCode) {
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Patient not found with code: " + patientCode,
                        "Patient",
                        "patientnotfound"));

        if (!patient.getIsActive()) {
            throw new BadRequestAlertException(
                    "Patient is inactive",
                    "Patient",
                    "patientinactive");
        }

        return patientMapper.toPatientInfoResponse(patient);
    }

    /**
     * Get patient by code including deleted ones (Admin only)
     *
     * @param patientCode the patient code
     * @return PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_PATIENT + "')")
    public PatientInfoResponse getPatientByCodeIncludingDeleted(String patientCode) {
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Patient not found with code: " + patientCode,
                        "Patient",
                        "patientnotfound"));

        return patientMapper.toPatientInfoResponse(patient);
    }

    /**
     * Create new patient with account
     *
     * FLOW: Tạo Patient → Tự động tạo Account mới
     * - Admin/Receptionist tạo patient
     * - System tự động tạo account với username/password
     * - Patient có thể đăng nhập xem hồ sơ
     *
     * @param request patient information including username/password
     * @return PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + CREATE_PATIENT + "')")
    @Transactional
    public PatientInfoResponse createPatient(CreatePatientRequest request) {
        log.debug("Request to create patient: {}", request);

        Account account = null;

        // Check if patient needs account (username & password provided)
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()
                && request.getPassword() != null && !request.getPassword().trim().isEmpty()) {

            log.debug("Creating account for patient with username: {}", request.getUsername());

            // Validate email required for account
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                throw new BadRequestAlertException(
                        "Email is required when creating account",
                        "patient",
                        "emailrequired");
            }

            // Check uniqueness
            if (accountRepository.existsByUsername(request.getUsername())) {
                throw new BadRequestAlertException(
                        "Username already exists",
                        "account",
                        "usernameexists");
            }

            if (accountRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestAlertException(
                        "Email already exists",
                        "account",
                        "emailexists");
            }

            // Create account for patient (NEW accounts require email verification)
            account = new Account();
            account.setUsername(request.getUsername());
            account.setEmail(request.getEmail());
            account.setPassword(passwordEncoder.encode(request.getPassword()));
            account.setStatus(AccountStatus.PENDING_VERIFICATION); // NEW: Require email verification
            account.setMustChangePassword(true); // Force password change on first login
            account.setCreatedAt(java.time.LocalDateTime.now());

            account = accountRepository.save(account);
            account.setAccountCode(codeGenerator.generateAccountCode(account.getAccountId()));
            account = accountRepository.save(account);
            log.info("Created account with ID: {} and code: {} for patient (PENDING_VERIFICATION)",
                    account.getAccountId(), account.getAccountCode());

            // Create and send verification token
            AccountVerificationToken verificationToken = new AccountVerificationToken(account);
            verificationTokenRepository.save(verificationToken);

            // Send verification email asynchronously
            emailService.sendVerificationEmail(account.getEmail(), account.getUsername(), verificationToken.getToken());
            log.info("✅ Verification email sent to: {}", account.getEmail());
        } else {
            log.debug("Creating patient without account (no username/password provided)");
        }

        // Convert DTO to entity
        Patient patient = patientMapper.toPatient(request);

        // Set active status
        patient.setIsActive(true);

        // Link account if created
        if (account != null) {
            patient.setAccount(account);
        }

        // Save to get auto-generated ID
        Patient savedPatient = patientRepository.save(patient);

        // Generate and set code
        savedPatient.setPatientCode(codeGenerator.generatePatientCode(savedPatient.getPatientId()));
        savedPatient = patientRepository.save(savedPatient);
        log.info("Created patient with code: {} and ID: {}", savedPatient.getPatientCode(),
                savedPatient.getPatientId());

        return patientMapper.toPatientInfoResponse(savedPatient);
    }

    /**
     * Update patient (PATCH - partial update)
     *
     * @param patientCode the patient code
     * @param request     the update information
     * @return PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_PATIENT + "')")
    @Transactional
    public PatientInfoResponse updatePatient(String patientCode, UpdatePatientRequest request) {
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Patient not found with code: " + patientCode,
                        "Patient",
                        "patientnotfound"));

        // Update only non-null fields
        patientMapper.updatePatientFromRequest(request, patient);

        Patient updatedPatient = patientRepository.save(patient);

        return patientMapper.toPatientInfoResponse(updatedPatient);
    }

    /**
     * Replace patient (PUT - full replacement)
     *
     * @param patientCode the patient code
     * @param request     the replacement information
     * @return PatientInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_PATIENT + "')")
    @Transactional
    public PatientInfoResponse replacePatient(String patientCode, ReplacePatientRequest request) {
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Patient not found with code: " + patientCode,
                        "Patient",
                        "patientnotfound"));

        // Replace all fields
        patientMapper.replacePatientFromRequest(request, patient);

        Patient replacedPatient = patientRepository.save(patient);

        return patientMapper.toPatientInfoResponse(replacedPatient);
    }

    /**
     * Soft delete patient
     *
     * @param patientCode the patient code
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + DELETE_PATIENT + "')")
    @Transactional
    public void deletePatient(String patientCode) {
        Patient patient = patientRepository.findOneByPatientCode(patientCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Patient not found with code: " + patientCode,
                        "Patient",
                        "patientnotfound"));

        // Soft delete
        patient.setIsActive(false);
        patientRepository.save(patient);
    }
}
