package com.dental.clinic.management.booking_appointment.service;

// import com.dental.clinic.management.service.domain.DentalService;
import com.dental.clinic.management.service.repository.DentalServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Business Rule #32: Block Appointments with Extracted Teeth Services
 * 
 * Rule: Cannot book appointments for services on teeth that have been extracted
 * - System maintains dental chart with tooth extraction history
 * - When booking appointment, validate that target teeth are not extracted
 * - Block appointment if any selected service targets an extracted tooth
 * - Applies to ALL services that require specific tooth numbers
 * 
 * Implementation Strategy:
 * 1. validateExtractedTeeth() - Called when creating/updating appointment
 * 2. Get list of extracted teeth for patient (from dental_chart or patient record)
 * 3. Get list of teeth targeted by appointment services
 * 4. Check for intersection between extracted teeth and target teeth
 * 5. Throw ErrorResponseException if conflict detected
 * 
 * Database Schema (assumed):
 * - dental_chart.tooth_number: INT (1-32 for adult teeth)
 * - dental_chart.status: ENUM including 'EXTRACTED'
 * - appointment_services.tooth_number: INT (nullable, specific tooth for service)
 * 
 * Integration Points:
 * - AppointmentCreationService.createAppointment() - before save
 * - AppointmentService.updateAppointmentServices() - before update
 * 
 * Note: This implementation assumes dental_chart table exists or uses patient extraction history.
 * If schema differs, adjust queries accordingly.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExtractedToothValidationService {

    @SuppressWarnings("unused")
    private final DentalServiceRepository dentalServiceRepository;
    // TODO: Add DentalChartRepository when available
    // private final DentalChartRepository dentalChartRepository;

    /**
     * Validate that appointment services don't target extracted teeth.
     * 
     * @param patientId Patient ID
     * @param serviceIds List of service IDs for the appointment
     * @param toothNumbers List of tooth numbers targeted by services (can be null for general services)
     * @throws ErrorResponseException if any service targets an extracted tooth
     */
    @Transactional(readOnly = true)
    public void validateExtractedTeeth(
            Integer patientId,
            List<Long> serviceIds,
            List<Integer> toothNumbers) {

        // Skip validation if no tooth numbers specified (general services)
        if (toothNumbers == null || toothNumbers.isEmpty()) {
            log.debug("No tooth numbers specified, skipping extracted tooth validation");
            return;
        }

        log.info("Validating extracted teeth for patient {} with services {} targeting teeth {}", 
                patientId, serviceIds, toothNumbers);

        // 1. Get extracted teeth for patient
        Set<Integer> extractedTeeth = getExtractedTeeth(patientId);

        if (extractedTeeth.isEmpty()) {
            log.debug("Patient {} has no extracted teeth", patientId);
            return;
        }

        // 2. Check for conflicts
        List<Integer> conflictingTeeth = toothNumbers.stream()
                .filter(extractedTeeth::contains)
                .collect(Collectors.toList());

        // 3. If conflicts exist, throw exception
        if (!conflictingTeeth.isEmpty()) {
            String teethList = conflictingTeeth.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(", "));

            String message = String.format(
                    "Cannot book appointment. The following teeth have been extracted: %s. " +
                    "Please select different teeth or services that don't require these teeth.",
                    teethList
            );

            log.warn("Extracted tooth conflict for patient {}: teeth {}", patientId, teethList);

            ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
            problemDetail.setTitle("Extracted Tooth Conflict");
            problemDetail.setProperty("patientId", patientId);
            problemDetail.setProperty("extractedTeeth", conflictingTeeth);
            throw new ErrorResponseException(HttpStatus.BAD_REQUEST, problemDetail, null);
        }

        log.info("No extracted tooth conflicts found for patient {}", patientId);
    }

    /**
     * Get set of extracted teeth for a patient.
     * 
     * TODO: Implement actual query when dental_chart table is available.
     * Current implementation returns empty set as placeholder.
     * 
     * Real implementation should query:
     * SELECT tooth_number FROM dental_chart 
     * WHERE patient_id = ? AND status = 'EXTRACTED'
     * 
     * @param patientId Patient ID
     * @return Set of extracted tooth numbers
     */
    private Set<Integer> getExtractedTeeth(Integer patientId) {
        // TODO: Replace with actual dental chart query
        // Example query when dental_chart exists:
        // return dentalChartRepository.findByPatientIdAndStatus(patientId, ToothStatus.EXTRACTED)
        //         .stream()
        //         .map(DentalChart::getToothNumber)
        //         .collect(Collectors.toSet());

        log.debug("Dental chart query not yet implemented, returning empty set for patient {}", patientId);
        return Set.of(); // Placeholder: return empty set until dental_chart is available
    }

    /**
     * Check if specific tooth is extracted for patient.
     * Useful for single-tooth validation.
     * 
     * @param patientId Patient ID
     * @param toothNumber Tooth number (1-32)
     * @return true if tooth is extracted
     */
    @Transactional(readOnly = true)
    public boolean isToothExtracted(Integer patientId, Integer toothNumber) {
        Set<Integer> extractedTeeth = getExtractedTeeth(patientId);
        return extractedTeeth.contains(toothNumber);
    }

    /**
     * Get all extracted teeth for a patient.
     * Used by FE to display extraction history or disable tooth selection.
     * 
     * @param patientId Patient ID
     * @return Set of extracted tooth numbers
     */
    @Transactional(readOnly = true)
    public Set<Integer> getPatientExtractedTeeth(Integer patientId) {
        return getExtractedTeeth(patientId);
    }

    /**
     * Validate multiple appointments in batch.
     * Useful for appointment series or bulk operations.
     * 
     * @param validations List of validation requests
     * @return List of validation results (empty if all pass)
     */
    @Transactional(readOnly = true)
    public List<ExtractedToothValidationResult> validateBatch(
            List<ExtractedToothValidationRequest> validations) {
        
        return validations.stream()
                .map(request -> {
                    try {
                        validateExtractedTeeth(
                                request.getPatientId(),
                                request.getServiceIds(),
                                request.getToothNumbers()
                        );
                        return ExtractedToothValidationResult.success(request.getPatientId());
                    } catch (ErrorResponseException e) {
                        return ExtractedToothValidationResult.failure(
                                request.getPatientId(),
                                e.getBody().getDetail()
                        );
                    }
                })
                .filter(result -> !result.isValid())
                .collect(Collectors.toList());
    }

    /**
     * DTO for batch validation request.
     */
    @lombok.Data
    @lombok.Builder
    public static class ExtractedToothValidationRequest {
        private Integer patientId;
        private List<Long> serviceIds;
        private List<Integer> toothNumbers;
    }

    /**
     * DTO for batch validation result.
     */
    @lombok.Data
    @lombok.Builder
    public static class ExtractedToothValidationResult {
        private Integer patientId;
        private boolean isValid;
        private String errorMessage;

        public static ExtractedToothValidationResult success(Integer patientId) {
            return ExtractedToothValidationResult.builder()
                    .patientId(patientId)
                    .isValid(true)
                    .build();
        }

        public static ExtractedToothValidationResult failure(Integer patientId, String errorMessage) {
            return ExtractedToothValidationResult.builder()
                    .patientId(patientId)
                    .isValid(false)
                    .errorMessage(errorMessage)
                    .build();
        }
    }
}
