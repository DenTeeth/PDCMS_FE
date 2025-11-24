package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.treatment_plans.domain.template.TemplatePhase;
import com.dental.clinic.management.treatment_plans.domain.template.TemplatePhaseService;
import com.dental.clinic.management.treatment_plans.domain.template.TreatmentPlanTemplate;
import com.dental.clinic.management.treatment_plans.dto.response.GetTemplateDetailResponse;
import com.dental.clinic.management.treatment_plans.dto.response.TemplateSummaryDTO;
import com.dental.clinic.management.treatment_plans.repository.TreatmentPlanTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for getting treatment plan template details.
 * Used by API 5.8 - Get Template Detail for Hybrid workflow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanTemplateService {

        private final TreatmentPlanTemplateRepository templateRepository;

        /**
         * Get full template detail including phases and services.
         *
         * Business Logic (with P1 & P2 fixes):
         * 1. Validate template exists (404 NOT_FOUND)
         * 2. Validate is_active (410 GONE if inactive) - P2 fix
         * 3. Load template + phases + services (optimized with JOIN FETCH)
         * 4. Filter out inactive services from phases (P1 fix - nested validation)
         * 5. Sort phases by phaseNumber (stepOrder in response)
         * 6. Sort services within each phase by sequenceNumber
         * 7. Calculate summary statistics (totalPhases, totalItemsInTemplate)
         * 8. Build response DTO
         *
         * @param templateCode Template code (e.g., "TPL_ORTHO_METAL")
         * @return GetTemplateDetailResponse with full structure
         * @throws ResponseStatusException 404 if template not found, 410 if inactive
         */
        @Transactional(readOnly = true)
        public GetTemplateDetailResponse getTemplateDetail(String templateCode) {
                log.info("🔍 API 5.8: Fetching template detail for templateCode={}", templateCode);

                // ============================================
                // STEP 1: Validate Template Exists (P2 Fix)
                // ============================================

                TreatmentPlanTemplate template = templateRepository
                                .findByTemplateCodeWithFullStructure(templateCode)
                                .orElseThrow(() -> {
                                        log.error("Template not found with code: {}", templateCode);
                                        return new ResponseStatusException(
                                                        HttpStatus.NOT_FOUND,
                                                        "Treatment plan template not found with code: " + templateCode);
                                });

                log.info("Template found: {} (ID: {})", template.getTemplateName(), template.getTemplateId());

                // ============================================
                // STEP 2: Validate Template is Active (P2 Fix)
                // ============================================

                if (!template.getIsActive()) {
                        log.warn("Template is inactive: {}", templateCode);
                        throw new ResponseStatusException(
                                        HttpStatus.GONE, // 410 GONE (P2 fix - different from NOT_FOUND)
                                        "Treatment plan template is inactive (deprecated): " + templateCode);
                }

                // ============================================
                // STEP 3: Load and Filter Phases (P1 Fix - Nested Validation)
                // ============================================

                List<TemplatePhase> phases = template.getTemplatePhases();
                log.info("📦 Template has {} phases", phases.size());

                // Track statistics for summary
                int totalItemsInTemplate = 0;
                int filteredServicesCount = 0;

                // Build phase DTOs
                List<GetTemplateDetailResponse.PhaseDTO> phaseDTOs = new ArrayList<>();

                for (TemplatePhase phase : phases) {
                        // Access phase services (triggers LAZY load if not already fetched)
                        List<TemplatePhaseService> phaseServices = phase.getPhaseServices();

                        log.debug("Phase {}: {} has {} services",
                                        phase.getPhaseNumber(), phase.getPhaseName(), phaseServices.size());

                        // ============================================
                        // P1 FIX: Filter Inactive Services (Nested Validation)
                        // ============================================

                        List<TemplatePhaseService> activeServices = new ArrayList<>();

                        for (TemplatePhaseService tps : phaseServices) {
                                // Access service to check isActive (triggers LAZY load)
                                if (tps.getService() != null && tps.getService().getIsActive()) {
                                        activeServices.add(tps);
                                } else {
                                        // Log warning for filtered services (P1 requirement)
                                        String serviceInfo = tps.getService() != null
                                                        ? tps.getService().getServiceCode() + " ("
                                                                        + tps.getService().getServiceName() + ")"
                                                        : "UNKNOWN";
                                        log.warn("Filtering inactive service from template: Phase={}, Service={}",
                                                        phase.getPhaseName(), serviceInfo);
                                        filteredServicesCount++;
                                }
                        }

                        // Build service DTOs (sorted by sequenceNumber - already sorted by @OrderBy)
                        List<GetTemplateDetailResponse.PhaseServiceDTO> serviceDTOs = activeServices.stream()
                                        .map(tps -> {
                                                return GetTemplateDetailResponse.PhaseServiceDTO.builder()
                                                                .serviceCode(tps.getService().getServiceCode())
                                                                .serviceName(tps.getService().getServiceName())
                                                                .price(tps.getService().getPrice()) // Giá gốc từ
                                                                                                    // services table
                                                                .quantity(tps.getQuantity())
                                                                .sequenceNumber(tps.getSequenceNumber())
                                                                .build();
                                        })
                                        .collect(Collectors.toList());

                        // Update total items count
                        totalItemsInTemplate += serviceDTOs.size();

                        // Build phase DTO
                        GetTemplateDetailResponse.PhaseDTO phaseDTO = GetTemplateDetailResponse.PhaseDTO.builder()
                                        .phaseTemplateId(phase.getPhaseId())
                                        .phaseName(phase.getPhaseName())
                                        .stepOrder(phase.getPhaseNumber()) // User spec: "stepOrder" = DB phaseNumber
                                        .itemsInPhase(serviceDTOs)
                                        .build();

                        phaseDTOs.add(phaseDTO);
                }

                // Log filtering summary
                if (filteredServicesCount > 0) {
                        log.warn("Filtered {} inactive services from template {}",
                                        filteredServicesCount, templateCode);
                }

                // ============================================
                // STEP 4: Build Summary Statistics (P2 Enhancement)
                // ============================================

                GetTemplateDetailResponse.SummaryDTO summary = GetTemplateDetailResponse.SummaryDTO.builder()
                                .totalPhases(phaseDTOs.size())
                                .totalItemsInTemplate(totalItemsInTemplate)
                                .build();

                log.info("📊 Summary: {} phases, {} items (after filtering)",
                                summary.getTotalPhases(), summary.getTotalItemsInTemplate());

                // ============================================
                // STEP 5: Build Final Response
                // ============================================

                GetTemplateDetailResponse response = GetTemplateDetailResponse.builder()
                                .templateId(template.getTemplateId())
                                .templateCode(template.getTemplateCode())
                                .templateName(template.getTemplateName())
                                .description(template.getDescription())
                                .specialization(template.getSpecialization() != null
                                                ? GetTemplateDetailResponse.SpecializationDTO.builder()
                                                                .id(template.getSpecialization().getSpecializationId())
                                                                .name(template.getSpecialization()
                                                                                .getSpecializationName())
                                                                .build()
                                                : null)
                                .estimatedTotalCost(template.getTotalPrice())
                                .estimatedDurationDays(template.getEstimatedDurationDays())
                                .createdAt(template.getCreatedAt())
                                .isActive(template.getIsActive())
                                .summary(summary)
                                .phases(phaseDTOs)
                                .build();

                log.info("Successfully built template detail response for: {}", templateCode);

                return response;
        }

        /**
         * Get all templates with optional filters (API 6.6).
         *
         * Business Logic:
         * 1. Apply filters: isActive, specializationId (both optional)
         * 2. Load templates with specialization data (LEFT JOIN FETCH)
         * 3. Apply pagination (page, size, sort)
         * 4. Map to TemplateSummaryDTO (lightweight response)
         *
         * Use Cases:
         * - FE dropdown: List active templates for a specialization
         * - Admin management: List all templates (active + inactive)
         * - Filter by specialization: Show only orthodontic templates
         *
         * @param isActive         Filter by active status (null = no filter)
         * @param specializationId Filter by specialization (null = no filter)
         * @param pageable         Pagination parameters (page, size, sort)
         * @return Page of TemplateSummaryDTO
         */
        @Transactional(readOnly = true)
        public Page<TemplateSummaryDTO> getAllTemplates(
                        Boolean isActive,
                        Integer specializationId,
                        Pageable pageable) {

                log.info("API 6.6: Fetching templates with filters - isActive={}, specializationId={}, page={}, size={}",
                                isActive, specializationId, pageable.getPageNumber(), pageable.getPageSize());

                // STEP 1: Query templates with filters
                Page<TreatmentPlanTemplate> templatesPage = templateRepository.findAllWithFilters(
                                isActive,
                                specializationId,
                                pageable);

                log.info("Found {} templates (total={}, page={}/{})",
                                templatesPage.getNumberOfElements(),
                                templatesPage.getTotalElements(),
                                templatesPage.getNumber() + 1,
                                templatesPage.getTotalPages());

                // STEP 2: Map to TemplateSummaryDTO
                Page<TemplateSummaryDTO> response = templatesPage.map(this::mapToSummaryDTO);

                return response;
        }

        /**
         * Map TreatmentPlanTemplate entity to TemplateSummaryDTO.
         * Lightweight mapping (no phases/services included).
         */
        private TemplateSummaryDTO mapToSummaryDTO(TreatmentPlanTemplate template) {
                return TemplateSummaryDTO.builder()
                                .templateId(template.getTemplateId())
                                .templateCode(template.getTemplateCode())
                                .templateName(template.getTemplateName())
                                .description(template.getDescription())
                                .estimatedTotalCost(template.getTotalPrice())
                                .estimatedDurationDays(template.getEstimatedDurationDays())
                                .isActive(template.getIsActive())
                                .specialization(template.getSpecialization() != null
                                                ? TemplateSummaryDTO.SpecializationDTO.builder()
                                                                .id(template.getSpecialization().getSpecializationId())
                                                                .name(template.getSpecialization()
                                                                                .getSpecializationName())
                                                                .build()
                                                : null)
                                .createdAt(template.getCreatedAt())
                                .build();
        }
}
