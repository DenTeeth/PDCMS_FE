
package com.dental.clinic.management.patient.controller;

import com.dental.clinic.management.patient.dto.request.CreatePatientRequest;
import com.dental.clinic.management.patient.dto.request.ReplacePatientRequest;
import com.dental.clinic.management.patient.dto.request.UpdatePatientRequest;
import com.dental.clinic.management.patient.dto.response.PatientInfoResponse;
import com.dental.clinic.management.patient.service.PatientService;
import com.dental.clinic.management.utils.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * REST controller for managing patients
 */
@RestController
@RequestMapping("/api/v1/patients")
@Tag(name = "Patient Management", description = "APIs for managing patients with RBAC (Admin and authorized roles only)")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    /**
     * {@code GET  /patients} : get all active patients with pagination
     *
     * @param page          page number (zero-based)
     * @param size          number of items per page
     * @param sortBy        field name to sort by
     * @param sortDirection ASC or DESC
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list
     *         of patients in body
     */
    @GetMapping("")
    @Operation(summary = "Get all active patients", description = "Retrieve a paginated list of active patients only")
    @ApiMessage("Get all active patients successfully")
    public ResponseEntity<Page<PatientInfoResponse>> getAllActivePatients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "patientCode") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {

        Page<PatientInfoResponse> response = patientService.getAllActivePatients(page, size, sortBy, sortDirection);
        return ResponseEntity.ok().body(response);
    }

    /**
     * {@code GET  /patients/admin/all} : get ALL patients including deleted ones
     * This endpoint is for admin management purposes only
     *
     * @param page          page number (zero-based)
     * @param size          number of items per page
     * @param sortBy        field name to sort by
     * @param sortDirection ASC or DESC
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list
     *         of patients in body
     */
    @GetMapping("/admin/all")
    @Operation(summary = "Get all patients (Admin)", description = "Retrieve all patients including deleted ones (Admin only)")
    @ApiMessage("Get all patients including deleted successfully")
    public ResponseEntity<Page<PatientInfoResponse>> getAllPatientsIncludingDeleted(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "patientCode") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {

        Page<PatientInfoResponse> response = patientService.getAllPatientsIncludingDeleted(page, size, sortBy,
                sortDirection);
        return ResponseEntity.ok().body(response);
    }

    /**
     * {@code GET  /patients/:patientCode} : get active patient by patient code
     *
     * @param patientCode the code of the patient to retrieve
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and patient
     *         in body
     */
    @GetMapping("/{patientCode}")
    @Operation(summary = "Get patient by code", description = "Get active patient details by patient code")
    @ApiMessage("Get active patient by code successfully")
    public ResponseEntity<PatientInfoResponse> getActivePatientByCode(
            @Parameter(description = "Patient code (e.g., PAT001)", required = true) @PathVariable("patientCode") String patientCode) {
        PatientInfoResponse response = patientService.getActivePatientByCode(patientCode);
        return ResponseEntity.ok(response);
    }

    /**
     * {@code GET  /patients/admin/:patientCode} : get patient by code including
     * deleted ones
     * This endpoint is for admin management purposes only
     *
     * @param patientCode the code of the patient to retrieve
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and patient
     *         in body
     */
    @GetMapping("/admin/{patientCode}")
    @Operation(summary = "Get patient by code (Admin)", description = "Get patient details including deleted ones (Admin only)")
    @ApiMessage("Get patient by code including deleted successfully")
    public ResponseEntity<PatientInfoResponse> getPatientByCodeIncludingDeleted(
            @Parameter(description = "Patient code (e.g., PAT001)", required = true) @PathVariable("patientCode") String patientCode) {
        PatientInfoResponse response = patientService.getPatientByCodeIncludingDeleted(patientCode);
        return ResponseEntity.ok(response);
    }

    /**
     * {@code POST  /patients} : create a new patient
     *
     * @param request the patient information to create
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with
     *         body the new patient
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("")
    @Operation(summary = "Create new patient", description = "Create a new patient record (Admin or authorized roles only)")
    @ApiMessage("Create patient successfully")
    public ResponseEntity<PatientInfoResponse> createPatient(@Valid @RequestBody CreatePatientRequest request)
            throws URISyntaxException {
        PatientInfoResponse result = patientService.createPatient(request);
        return ResponseEntity
                .created(new URI("/api/v1/patients/" + result.getPatientCode()))
                .body(result);
    }

    /**
     * {@code PATCH  /patients/:patientCode} : Partial updates given fields of an
     * existing patient
     * Field will be updated only if value is not null
     *
     * @param patientCode the code of the patient to update
     * @param request     the patient information to update
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body
     *         the updated patient
     */
    @PatchMapping("/{patientCode}")
    @Operation(summary = "Update patient (partial)", description = "Update specific fields of a patient (null fields are ignored)")
    @ApiMessage("Update patient successfully")
    public ResponseEntity<PatientInfoResponse> updatePatient(
            @Parameter(description = "Patient code", required = true) @PathVariable("patientCode") String patientCode,
            @Valid @RequestBody UpdatePatientRequest request) {
        PatientInfoResponse result = patientService.updatePatient(patientCode, request);
        return ResponseEntity.ok().body(result);
    }

    /**
     * {@code PUT  /patients/:patientCode} : Replace (full update) an existing
     * patient
     * All fields will be updated with the provided values
     *
     * @param patientCode the code of the patient to replace
     * @param request     the patient information to replace
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body
     *         the replaced patient
     */
    @PutMapping("/{patientCode}")
    @Operation(summary = "Replace patient (full update)", description = "Replace entire patient data (all fields required)")
    @ApiMessage("Replace patient successfully")
    public ResponseEntity<PatientInfoResponse> replacePatient(
            @Parameter(description = "Patient code", required = true) @PathVariable("patientCode") String patientCode,
            @Valid @RequestBody ReplacePatientRequest request) {
        PatientInfoResponse result = patientService.replacePatient(patientCode, request);
        return ResponseEntity.ok().body(result);
    }

    /**
     * {@code DELETE  /patients/:patientCode} : soft delete the patient by patient
     * code
     *
     * @param patientCode the code of the patient to delete
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}
     */
    @DeleteMapping("/{patientCode}")
    @Operation(summary = "Delete patient (soft delete)", description = "Soft delete patient by setting isActive to false")
    @ApiMessage("Delete patient successfully")
    public ResponseEntity<Void> deletePatient(
            @Parameter(description = "Patient code", required = true) @PathVariable("patientCode") String patientCode) {
        patientService.deletePatient(patientCode);
        return ResponseEntity.noContent().build();
    }
}
