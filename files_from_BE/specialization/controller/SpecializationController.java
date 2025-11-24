
package com.dental.clinic.management.specialization.controller;

import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.specialization.service.SpecializationService;
import com.dental.clinic.management.utils.annotation.ApiMessage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/specializations")
@Tag(name = "Specialization Management", description = "APIs for managing specializations")
public class SpecializationController {

    private final SpecializationService specializationService;

    public SpecializationController(SpecializationService specializationService) {
        this.specializationService = specializationService;
    }

    /**
     * Get all active specializations
     * 
     * @return List of active specializations
     */
    @GetMapping("")
    @Operation(summary = "Get all active specializations", description = "Retrieve list of all active specializations for dropdown/selection")
    @ApiMessage("Get all active specializations successfully")
    public ResponseEntity<List<Specialization>> getAllActiveSpecializations() {
        List<Specialization> specializations = specializationService.getAllActiveSpecializations();
        return ResponseEntity.ok(specializations);
    }
}
