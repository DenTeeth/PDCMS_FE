
package com.dental.clinic.management.employee.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.dto.request.CreateEmployeeRequest;
import com.dental.clinic.management.employee.dto.request.UpdateEmployeeRequest;
import com.dental.clinic.management.employee.dto.request.ReplaceEmployeeRequest;
import com.dental.clinic.management.employee.dto.response.EmployeeInfoResponse;
import com.dental.clinic.management.employee.enums.EmploymentType;
import com.dental.clinic.management.employee.mapper.EmployeeMapper;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.exception.employee.EmployeeNotFoundException;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import com.dental.clinic.management.working_schedule.repository.FixedShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;

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

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import com.dental.clinic.management.account.enums.AccountStatus;
import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.role.domain.Role;
import com.dental.clinic.management.role.repository.RoleRepository;
import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.specialization.repository.SpecializationRepository;
import com.dental.clinic.management.utils.SequentialCodeGenerator;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class EmployeeService {
    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;
    private final AccountRepository accountRepository;
    private final SpecializationRepository specializationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SequentialCodeGenerator codeGenerator;
    
    // Job P3 related repositories for cleanup when employee deactivated
    private final FixedShiftRegistrationRepository fixedRegistrationRepository;
    private final PartTimeRegistrationRepository partTimeRegistrationRepository;
    private final EmployeeShiftRepository employeeShiftRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            EmployeeMapper employeeMapper,
            AccountRepository accountRepository,
            SpecializationRepository specializationRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            SequentialCodeGenerator codeGenerator,
            FixedShiftRegistrationRepository fixedRegistrationRepository,
            PartTimeRegistrationRepository partTimeRegistrationRepository,
            EmployeeShiftRepository employeeShiftRepository) {
        this.employeeRepository = employeeRepository;
        this.employeeMapper = employeeMapper;
        this.accountRepository = accountRepository;
        this.specializationRepository = specializationRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.codeGenerator = codeGenerator;
        this.fixedRegistrationRepository = fixedRegistrationRepository;
        this.partTimeRegistrationRepository = partTimeRegistrationRepository;
        this.employeeShiftRepository = employeeShiftRepository;
    }

    /**
     * Get all ACTIVE employees only (isActive = true) with pagination, sorting,
     * search and filters
     * This is the default method for normal operations
     *
     * @param page           page number (zero-based)
     * @param size           number of items per page
     * @param sortBy         field name to sort by
     * @param sortDirection  ASC or DESC
     * @param search         search by employee code, first name, or last name
     * @param roleId         filter by role ID
     * @param employmentType filter by employment type
     * @return Page of EmployeeInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_EMPLOYEE')")
    public Page<EmployeeInfoResponse> getAllActiveEmployees(
            int page, int size, String sortBy, String sortDirection,
            String search, String roleId, String employmentType) {

        // Validate and sanitize inputs
        page = Math.max(0, page); // Ensure page is not negative
        size = (size <= 0 || size > 100) ? 10 : size; // Default to 10 if invalid, max 100

        // Create sort direction
        Sort.Direction direction = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        // Create sort object
        Sort sort = Sort.by(direction, sortBy);

        // Create pageable
        Pageable pageable = PageRequest.of(page, size, sort);

        // Create specification to filter only active employees
        Specification<Employee> spec = (root, query, criteriaBuilder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            
            // Always filter by isActive = true
            predicates.add(criteriaBuilder.equal(root.get("isActive"), true));
            
            // Add search filter (employee code, first name, or last name)
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("employeeCode")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), searchPattern)
                ));
            }
            
            // Add roleId filter (role is in Account entity, roleId is in Role entity)
            if (roleId != null && !roleId.trim().isEmpty()) {
                var accountJoin = root.join("account");
                var roleJoin = accountJoin.join("role");
                predicates.add(criteriaBuilder.equal(roleJoin.get("roleId"), roleId));
            }
            
            // Add employmentType filter (EmploymentType enum)
            if (employmentType != null && !employmentType.trim().isEmpty()) {
                try {
                    EmploymentType empType = EmploymentType.valueOf(employmentType);
                    predicates.add(criteriaBuilder.equal(root.get("employmentType"), empType));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid employment type: {}", employmentType);
                }
            }
            
            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        // Fetch employees and map to DTO
        Page<Employee> employeePage = employeeRepository.findAll(spec, pageable);
        return employeePage.map(employeeMapper::toEmployeeInfoResponse);
    }

    /**
     * Get ALL employees including deleted ones (isActive = true AND false)
     * This method is for admin management purposes only
     *
     * @param page          page number (zero-based)
     * @param size          number of items per page
     * @param sortBy        field name to sort by
     * @param sortDirection ASC or DESC
     * @return Page of EmployeeInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "')")
    public Page<EmployeeInfoResponse> getAllEmployeesIncludingDeleted(
            int page, int size, String sortBy, String sortDirection) {

        // Validate and sanitize inputs
        page = Math.max(0, page); // Ensure page is not negative
        size = (size <= 0 || size > 100) ? 10 : size; // Default to 10 if invalid, max 100

        // Create sort direction
        Sort.Direction direction = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        // Create sort object
        Sort sort = Sort.by(direction, sortBy);

        // Create pageable
        Pageable pageable = PageRequest.of(page, size, sort);

        // Fetch ALL employees (no filter) and map to DTO
        Page<Employee> employeePage = employeeRepository.findAll(pageable);
        return employeePage.map(employeeMapper::toEmployeeInfoResponse);
    }

    /**
     * Get ACTIVE employee by employee code with DTO response (isActive = true only)
     * This is the default method for normal operations
     *
     * @param employeeCode the code of the employee
     * @return EmployeeInfoResponse
     * @throws EmployeeNotFoundException if employee not found or deleted
     */
    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public EmployeeInfoResponse getActiveEmployeeByCode(String employeeCode) {
        Employee employee = findActiveEmployeeByCode(employeeCode);
        return employeeMapper.toEmployeeInfoResponse(employee);
    }

    /**
     * Get employee by code INCLUDING deleted ones (isActive = true or false)
     * This method is for admin management purposes only
     *
     * @param employeeCode the code of the employee
     * @return EmployeeInfoResponse
     * @throws EmployeeNotFoundException if employee not found
     */
    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public EmployeeInfoResponse getEmployeeByCodeIncludingDeleted(String employeeCode) {
        if (employeeCode == null || employeeCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Employee code cannot be null or empty");
        }

        Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with code: " + employeeCode));

        return employeeMapper.toEmployeeInfoResponse(employee);
    }

    /**
     * Find ACTIVE employee entity by code (isActive = true only)
     *
     * @param employeeCode the code of the employee
     * @return Employee entity
     * @throws EmployeeNotFoundException if employee not found or deleted
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + READ_EMPLOYEE_BY_CODE + "')")
    @Transactional(readOnly = true)
    public Employee findActiveEmployeeByCode(String employeeCode) {
        if (employeeCode == null || employeeCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Employee code cannot be null or empty");
        }

        Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
                .orElseThrow(() -> new EmployeeNotFoundException(employeeCode));

        // Check if employee is active (not soft-deleted)
        if (employee.getIsActive() == null || !employee.getIsActive()) {
            throw new EmployeeNotFoundException(employeeCode);
        }

        return employee;
    }

    /**
     * Create new employee with account
     *
     * FLOW: Tạo Employee → Tự động tạo Account mới
     * - Admin tạo employee
     * - System tự động tạo account với username/password
     * - Gửi thông tin đăng nhập cho employee
     *
     * @param request employee information including username/password
     * @return EmployeeInfoResponse
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + CREATE_EMPLOYEE + "')")
    @Transactional
    public EmployeeInfoResponse createEmployee(CreateEmployeeRequest request) {
        log.debug("Request to create employee: {}", request);

        // Validate required fields
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BadRequestAlertException(
                    "Username is required",
                    "employee",
                    "usernamerequired");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestAlertException(
                    "Email is required",
                    "employee",
                    "emailrequired");
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new BadRequestAlertException(
                    "Password is required",
                    "employee",
                    "passwordrequired");
        }

        // Validate role and specialization requirements
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new BadRequestAlertException(
                        "Role not found with ID: " + request.getRoleId(),
                        "role",
                        "rolenotfound"));

        // Check if role requires specialization
        boolean hasSpecializations = request.getSpecializationIds() != null
                && !request.getSpecializationIds().isEmpty();

        if (Boolean.TRUE.equals(role.getRequiresSpecialization()) && !hasSpecializations) {
            throw new BadRequestAlertException(
                    "Specialization is required for role: " + role.getRoleName(),
                    "employee",
                    "specializationrequired");
        }

        if (Boolean.FALSE.equals(role.getRequiresSpecialization()) && hasSpecializations) {
            throw new BadRequestAlertException(
                    "Specialization is not allowed for role: " + role.getRoleName(),
                    "employee",
                    "specializationnotallowed");
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

        // Create new account for employee
        Account account = new Account();
        account.setUsername(request.getUsername());
        account.setEmail(request.getEmail());
        account.setPassword(passwordEncoder.encode(request.getPassword()));
        account.setStatus(AccountStatus.ACTIVE);
        account.setCreatedAt(java.time.LocalDateTime.now());

        // Assign role to account (single role)
        account.setRole(role); // Use the role we already fetched above

        account = accountRepository.save(account);
        account.setAccountCode(codeGenerator.generateAccountCode(account.getAccountId()));
        account = accountRepository.save(account);
        log.info("Created account with ID: {} and code: {} and role: {} for employee",
                account.getAccountId(), account.getAccountCode(), role.getRoleName());

        // Create new employee
        Employee employee = new Employee();
        employee.setAccount(account);
        // Note: roleId is now in Account, not Employee
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPhone(request.getPhone());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setAddress(request.getAddress());
        employee.setEmploymentType(request.getEmploymentType()); // Set employment type
        employee.setIsActive(true);
        employee.setCreatedAt(java.time.LocalDateTime.now());

        // Add specializations if provided
        if (request.getSpecializationIds() != null && !request.getSpecializationIds().isEmpty()) {
            Set<Specialization> specializations = new HashSet<>();
            for (Integer specializationId : request.getSpecializationIds()) {
                Specialization specialization = specializationRepository.findById(specializationId)
                        .orElseThrow(() -> new BadRequestAlertException(
                                "Specialization not found with ID: " + specializationId,
                                "specialization",
                                "specializationnotfound"));
                specializations.add(specialization);
            }
            employee.setSpecializations(specializations);
        }

        // Save employee to get auto-generated ID
        Employee savedEmployee = employeeRepository.save(employee);

        // Generate and set employee code
        savedEmployee.setEmployeeCode(codeGenerator.generateEmployeeCode(savedEmployee.getEmployeeId()));
        savedEmployee = employeeRepository.save(savedEmployee);

        // Return DTO response
        return employeeMapper.toEmployeeInfoResponse(savedEmployee);
    }

    /**
     * Partial update of an employee
     * Only non-null fields will be updated
     *
     * @param employeeCode the code of the employee to update
     * @param request      the update data
     * @return the updated employee as DTO
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_EMPLOYEE + "')")
    @Transactional
    public EmployeeInfoResponse updateEmployee(String employeeCode, UpdateEmployeeRequest request) {
        // Find existing employee
        Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with code: " + employeeCode));

        // Update only non-null fields
        if (request.getRoleId() != null) {
            // Update role in account, not in employee
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new BadRequestAlertException(
                            "Role not found with ID: " + request.getRoleId(),
                            "role",
                            "rolenotfound"));
            employee.getAccount().setRole(role);
        }

        if (request.getFirstName() != null) {
            employee.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            employee.setLastName(request.getLastName());
        }

        if (request.getPhone() != null) {
            employee.setPhone(request.getPhone());
        }

        if (request.getDateOfBirth() != null) {
            employee.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getAddress() != null) {
            employee.setAddress(request.getAddress());
        }

        if (request.getEmploymentType() != null) {
            employee.setEmploymentType(request.getEmploymentType());
        }

        if (request.getIsActive() != null) {
            boolean wasActive = employee.getIsActive();
            boolean newActiveStatus = request.getIsActive();
            
            employee.setIsActive(newActiveStatus);
            
            // Job P3 INLINE CLEANUP: When employee is deactivated, cleanup their registrations
            if (wasActive && !newActiveStatus) {
                log.info("Employee {} ({}) is being deactivated. Cleaning up registrations and future shifts...",
                    employee.getEmployeeCode(), employee.getFullName());
                
                // Deactivate Fixed registrations
                int fixedCount = fixedRegistrationRepository.deactivateByEmployeeId(employee.getEmployeeId());
                log.info("  - Deactivated {} Fixed registration(s)", fixedCount);
                
                // Deactivate Flex registrations
                int flexCount = partTimeRegistrationRepository.deactivateByEmployeeId(employee.getEmployeeId());
                log.info("  - Deactivated {} Flex registration(s)", flexCount);
                
                // Delete future SCHEDULED shifts (work_date >= TODAY)
                java.time.LocalDate today = java.time.LocalDate.now();
                int shiftsCount = employeeShiftRepository.deleteFutureScheduledShiftsByEmployeeId(
                    employee.getEmployeeId(), today);
                log.info("  - Deleted {} future SCHEDULED shift(s)", shiftsCount);
                
                log.info("✅ Cleanup completed for deactivated employee {}", employee.getEmployeeCode());
            }
        }

        // Update specializations if provided
        if (request.getSpecializationIds() != null) {
            Set<Specialization> specializations = new HashSet<>();
            for (Integer specializationId : request.getSpecializationIds()) {
                Specialization specialization = specializationRepository.findById(specializationId)
                        .orElseThrow(() -> new BadRequestAlertException(
                                "Specialization not found with ID: " + specializationId,
                                "specialization",
                                "specializationnotfound"));
                specializations.add(specialization);
            }
            employee.setSpecializations(specializations);
        }

        // Save updated employee
        Employee updatedEmployee = employeeRepository.save(employee);

        // Return DTO response
        return employeeMapper.toEmployeeInfoResponse(updatedEmployee);
    }

    /**
     * Replace (full update) an employee - all fields are required
     * This is a PUT operation that replaces the entire resource
     *
     * @param employeeCode the code of the employee to replace
     * @param request      the replacement data (all fields required)
     * @return the replaced employee as DTO
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + UPDATE_EMPLOYEE + "')")
    @Transactional
    public EmployeeInfoResponse replaceEmployee(String employeeCode,
            ReplaceEmployeeRequest request) {
        // Find existing employee
        Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with code: " + employeeCode));

        // Verify role exists
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new BadRequestAlertException(
                        "Role not found with ID: " + request.getRoleId(),
                        "role",
                        "rolenotfound"));

        // Replace ALL fields (required by PUT semantics)
        // Update role in account, not in employee
        employee.getAccount().setRole(role);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPhone(request.getPhone());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setAddress(request.getAddress());
        employee.setEmploymentType(request.getEmploymentType()); // Set employment type
        employee.setIsActive(request.getIsActive());

        // Replace specializations
        if (request.getSpecializationIds() != null && !request.getSpecializationIds().isEmpty()) {
            Set<Specialization> specializations = new HashSet<>();
            for (Integer specializationId : request.getSpecializationIds()) {
                Specialization specialization = specializationRepository.findById(specializationId)
                        .orElseThrow(() -> new BadRequestAlertException(
                                "Specialization not found with ID: " + specializationId,
                                "specialization",
                                "specializationnotfound"));
                specializations.add(specialization);
            }
            employee.setSpecializations(specializations);
        } else {
            // Clear specializations if none provided
            employee.setSpecializations(new HashSet<>());
        }

        // Save replaced employee
        Employee replacedEmployee = employeeRepository.save(employee);

        // Return DTO response
        return employeeMapper.toEmployeeInfoResponse(replacedEmployee);
    }

    /**
     * Delete an employee (soft delete - set isActive to false)
     *
     * @param employeeCode the code of the employee to delete
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + DELETE_EMPLOYEE + "')")
    @Transactional
    public void deleteEmployee(String employeeCode) {
        // Find existing employee
        Employee employee = employeeRepository.findOneByEmployeeCode(employeeCode)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with code: " + employeeCode));

        // Soft delete - set isActive to false
        employee.setIsActive(false);
        employeeRepository.save(employee);
    }

    /**
     * Get all active specializations
     *
     * @return List of active specializations
     */
    @Transactional(readOnly = true)
    public java.util.List<Specialization> getAllActiveSpecializations() {
        return specializationRepository.findAllActiveSpecializations();
    }

    /**
     * Get active medical staff only (employees with STANDARD specialization ID 8)
     * Used for appointment doctor/participant selection
     * Excludes Admin/Receptionist who don't have STANDARD specialization
     *
     * @return List of employees with STANDARD specialization (ID 8)
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + READ_ALL_EMPLOYEES + "')")
    @Transactional(readOnly = true)
    public java.util.List<EmployeeInfoResponse> getActiveMedicalStaff() {
        java.util.List<Employee> employees = employeeRepository.findActiveEmployeesWithSpecializations();
        return employees.stream()
                .map(employeeMapper::toEmployeeInfoResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Check if employee is medical staff (has specializations)
     *
     * @param employeeId Employee ID
     * @return True if employee has at least one specialization
     */
    @Transactional(readOnly = true)
    public boolean isMedicalStaff(Integer employeeId) {
        return employeeRepository.hasSpecializations(employeeId);
    }
}
