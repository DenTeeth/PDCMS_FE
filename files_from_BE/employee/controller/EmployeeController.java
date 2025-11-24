package com.dental.clinic.management.employee.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dental.clinic.management.employee.dto.request.CreateEmployeeRequest;
import com.dental.clinic.management.employee.dto.request.ReplaceEmployeeRequest;
import com.dental.clinic.management.employee.dto.request.UpdateEmployeeRequest;
import com.dental.clinic.management.employee.dto.response.EmployeeInfoResponse;
import com.dental.clinic.management.employee.service.EmployeeService;
import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.utils.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.net.URI;
import java.net.URISyntaxException;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employee Management", description = "APIs for managing employees (doctors, receptionists, etc.)")
public class EmployeeController {

  private final EmployeeService employeeService;

  public EmployeeController(EmployeeService employeeService) {
    this.employeeService = employeeService;
  }

  @GetMapping("")
  @Operation(summary = "Get all active employees", description = "Retrieve a paginated list of active employees with optional search and filters")
  @ApiMessage("Get all active employees successfully")
  public ResponseEntity<Page<EmployeeInfoResponse>> getAllActiveEmployees(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "employeeCode") String sortBy,
      @RequestParam(defaultValue = "ASC") String sortDirection,
      @Parameter(description = "Search by employee code, first name, or last name") @RequestParam(required = false) String search,
      @Parameter(description = "Filter by role ID (e.g., ROLE_DENTIST)") @RequestParam(required = false) String roleId,
      @Parameter(description = "Filter by employment type (FULL_TIME, PART_TIME_FIXED, PART_TIME_FLEX)") @RequestParam(required = false) String employmentType) {

    Page<EmployeeInfoResponse> response = employeeService.getAllActiveEmployees(page, size, sortBy, sortDirection, search, roleId, employmentType);
    return ResponseEntity.ok().body(response);
  }

  /**
   * Get ALL employees including deleted ones (isActive = true AND false)
   * This endpoint is for admin management purposes only
   */
  @GetMapping("/admin/all")
  @Operation(summary = "Get all employees (Admin)", description = "Retrieve all employees including deleted ones (Admin only)")
  @ApiMessage("Get all employees including deleted successfully")
  public ResponseEntity<Page<EmployeeInfoResponse>> getAllEmployeesIncludingDeleted(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "employeeCode") String sortBy,
      @RequestParam(defaultValue = "ASC") String sortDirection) {

    Page<EmployeeInfoResponse> response = employeeService.getAllEmployeesIncludingDeleted(page, size, sortBy,
        sortDirection);
    return ResponseEntity.ok().body(response);
  }

  /**
   * Get ACTIVE employee by code (isActive = true only)
   * This is the default endpoint for normal operations
   */
  @GetMapping("/{employeeCode}")
  @Operation(summary = "Get employee by code", description = "Get active employee details by employee code")
  @ApiMessage("Get active employee by Employee Code successfully")
  public ResponseEntity<EmployeeInfoResponse> getActiveEmployeeByCode(
      @Parameter(description = "Employee code (e.g., EMP001)", required = true) @PathVariable("employeeCode") String employeeCode) {
    EmployeeInfoResponse response = employeeService.getActiveEmployeeByCode(employeeCode);
    return ResponseEntity.ok(response);
  }

  /**
   * Get employee by code INCLUDING deleted ones (isActive = true or false)
   * This endpoint is for admin management purposes only
   */
  @GetMapping("/admin/{employeeCode}")
  @Operation(summary = "Get employee by code (Admin)", description = "Get employee details including deleted ones (Admin only)")
  @ApiMessage("Get employee by code including deleted successfully")
  public ResponseEntity<EmployeeInfoResponse> getEmployeeByCodeIncludingDeleted(
      @PathVariable("employeeCode") String employeeCode) {
    EmployeeInfoResponse response = employeeService.getEmployeeByCodeIncludingDeleted(employeeCode);
    return ResponseEntity.ok(response);
  }

  /**
   * {@code POST  /employees} : Create a new employee.
   * Supports two modes:
   * 1. With existing account: provide accountId
   * 2. With new account: provide username, email, password (accountId
   * auto-generated)
   *
   * @param request the employee data to create.
   * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with
   *         body the new employee, or with status {@code 400 (Bad Request)} if
   *         validation fails.
   * @throws URISyntaxException if the Location URI syntax is incorrect.
   */
  @PostMapping("")
  @Operation(summary = "Create new employee", description = "Create employee with existing account OR create new account automatically")
  @ApiMessage("Create employee successfully")
  public ResponseEntity<EmployeeInfoResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request)
      throws URISyntaxException {

    EmployeeInfoResponse response = employeeService.createEmployee(request);

    return ResponseEntity
        .created(new URI("/api/v1/employees/" + response.getEmployeeCode()))
        .body(response);
  }

  /**
   * {@code PATCH  /employees/:employeeCode} : Partial updates given fields of an
   * existing employee, field will ignore if it is null
   *
   * @param employeeCode the code of the employee to save.
   * @param request      the employee data to update.
   * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body
   *         the updated employee,
   *         or with status {@code 400 (Bad Request)} if the employee is not
   *         valid,
   *         or with status {@code 404 (Not Found)} if the employee is not found,
   *         or with status {@code 500 (Internal Server Error)} if the employee
   *         couldn't be updated.
   */
  @PatchMapping("/{employeeCode}")
  @Operation(summary = "Update employee (partial)", description = "Update specific fields of an employee (null fields are ignored)")
  @ApiMessage("Update employee successfully")
  public ResponseEntity<EmployeeInfoResponse> updateEmployee(
      @Parameter(description = "Employee code", required = true) @PathVariable("employeeCode") String employeeCode,
      @Valid @RequestBody UpdateEmployeeRequest request) {

    EmployeeInfoResponse response = employeeService.updateEmployee(employeeCode, request);
    return ResponseEntity.ok(response);
  }

  /**
   * {@code PUT  /employees/:employeeCode} : Replace (full update) an existing
   * employee.
   * All fields are required. This replaces the entire employee resource.
   *
   * @param employeeCode the code of the employee to replace.
   * @param request      the employee data to replace with (all fields required).
   * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body
   *         the replaced employee,
   *         or with status {@code 400 (Bad Request)} if the employee data is not
   *         valid,
   *         or with status {@code 404 (Not Found)} if the employee is not found.
   */
  @PutMapping("/{employeeCode}")
  @Operation(summary = "Replace employee (full update)", description = "Replace entire employee data (all fields required)")
  @ApiMessage("Replace employee successfully")
  public ResponseEntity<EmployeeInfoResponse> replaceEmployee(
      @Parameter(description = "Employee code", required = true) @PathVariable("employeeCode") String employeeCode,
      @Valid @RequestBody ReplaceEmployeeRequest request) {

    EmployeeInfoResponse response = employeeService.replaceEmployee(employeeCode, request);
    return ResponseEntity.ok(response);
  }

  /**
   * {@code DELETE  /employees/:employeeCode} : delete the employee by employee
   * code.
   *
   * @param employeeCode the code of the employee to delete.
   * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
   */
  @DeleteMapping("/{employeeCode}")
  @Operation(summary = "Delete employee (soft delete)", description = "Soft delete employee by setting isActive to false")
  @ApiMessage("Delete employee successfully")
  public ResponseEntity<Void> deleteEmployee(
      @Parameter(description = "Employee code", required = true) @PathVariable("employeeCode") String employeeCode) {
    employeeService.deleteEmployee(employeeCode);
    return ResponseEntity.noContent().build();
  }

  /**
   * Get all active specializations
   *
   * @return List of active specializations
   */
  @GetMapping("/specializations")
  @Operation(summary = "Get all specializations", description = "Retrieve list of all active specializations")
  @ApiMessage("Get all specializations successfully")
  public ResponseEntity<java.util.List<Specialization>> getAllSpecializations() {
    java.util.List<Specialization> specializations = employeeService.getAllActiveSpecializations();
    return ResponseEntity.ok(specializations);
  }

  /**
   * Get active medical staff only (employees with specializations)
   * Used for appointment doctor/participant selection dropdown
   * Excludes Admin/Receptionist who don't have medical specializations
   *
   * @return List of medical staff (doctors, nurses, assistants)
   */
  @GetMapping("/medical-staff")
  @Operation(summary = "Get medical staff for appointments", description = "Get active employees with specializations (excludes admin/receptionist)")
  @ApiMessage("Get medical staff successfully")
  public ResponseEntity<java.util.List<EmployeeInfoResponse>> getActiveMedicalStaff() {
    java.util.List<EmployeeInfoResponse> medicalStaff = employeeService.getActiveMedicalStaff();
    return ResponseEntity.ok(medicalStaff);
  }
}
