package com.dental.clinic.management.treatment_plans.specification;

import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.dto.request.GetAllTreatmentPlansRequest;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic query building in API 5.5.
 * <p>
 * Handles:
 * - Basic filters (status, approvalStatus, planCode)
 * - Admin filters (doctorEmployeeCode, patientCode)
 * - Date range filters (startDate, createdAt)
 * - Search term (plan name, patient name)
 * - RBAC filters (employeeId, patientId)
 * <p>
 * Performance:
 * - Uses JOIN FETCH to avoid N+1 problem
 * - All filters use indexed columns
 * <p>
 * Version: V19
 * Date: 2025-01-12
 */
public class TreatmentPlanSpecification {

    /**
     * Build specification from request filters.
     * <p>
     * NOTE: RBAC filters (employeeId, patientId) are NOT included here.
     * They must be added separately in the service layer based on user role.
     *
     * @param request Filter parameters
     * @return Specification for query building
     */
    public static Specification<PatientTreatmentPlan> buildFromRequest(GetAllTreatmentPlansRequest request) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // JOIN FETCH to avoid N+1 (only for non-count queries)
            if (query.getResultType() == PatientTreatmentPlan.class) {
                root.fetch("patient", JoinType.LEFT);
                root.fetch("createdBy", JoinType.LEFT);
                root.fetch("sourceTemplate", JoinType.LEFT);
                query.distinct(true); // Avoid duplicates from fetch joins
            }

            // Filter: status
            if (request.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), request.getStatus()));
            }

            // Filter: approvalStatus (V19)
            if (request.getApprovalStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("approvalStatus"), request.getApprovalStatus()));
            }

            // Filter: planCode (starts with)
            if (request.getPlanCode() != null && !request.getPlanCode().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        root.get("planCode"),
                        request.getPlanCode() + "%"));
            }

            // Filter: doctorEmployeeCode (Admin only - checked in service)
            if (request.getDoctorEmployeeCode() != null && !request.getDoctorEmployeeCode().isBlank()) {
                Join<Object, Object> employeeJoin = root.join("createdBy", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(
                        employeeJoin.get("employeeCode"),
                        request.getDoctorEmployeeCode()));
            }

            // Filter: patientCode (Admin only - checked in service)
            if (request.getPatientCode() != null && !request.getPatientCode().isBlank()) {
                Join<Object, Object> patientJoin = root.join("patient", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(
                        patientJoin.get("patientCode"),
                        request.getPatientCode()));
            }

            // Filter: templateId (Task #2 - Template filtering)
            if (request.getTemplateId() != null) {
                Join<Object, Object> templateJoin = root.join("sourceTemplate", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(
                        templateJoin.get("templateId"),
                        request.getTemplateId()));
            }

            // Filter: specializationId (Task #2 - Specialization filtering)
            // Filters treatment plans by template's specialization
            if (request.getSpecializationId() != null) {
                Join<Object, Object> templateJoin = root.join("sourceTemplate", JoinType.INNER);
                Join<Object, Object> specializationJoin = templateJoin.join("specialization", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(
                        specializationJoin.get("specializationId"),
                        request.getSpecializationId()));
            }

            // Filter: startDate range (P1 Enhancement)
            if (request.getStartDateFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("startDate"),
                        request.getStartDateFrom()));
            }
            if (request.getStartDateTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("startDate"),
                        request.getStartDateTo()));
            }

            // Filter: createdAt range (P1 Enhancement)
            if (request.getCreatedAtFrom() != null) {
                LocalDateTime startOfDay = request.getCreatedAtFrom().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        startOfDay));
            }
            if (request.getCreatedAtTo() != null) {
                LocalDateTime endOfDay = request.getCreatedAtTo().atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("createdAt"),
                        endOfDay));
            }

            // Filter: searchTerm (P1 Enhancement)
            // Search in: plan_name, patient firstName, patient lastName
            // FIX Issue #34: Handle both SELECT (with fetch) and COUNT (without fetch) queries
            if (request.getSearchTerm() != null && !request.getSearchTerm().isBlank()) {
                String searchPattern = "%" + request.getSearchTerm().toLowerCase().trim() + "%";

                // For COUNT queries, patient fetch doesn't exist, so we need to join
                // For SELECT queries, patient is already fetched, so reuse it
                Path<Object> patientPath;
                if (query.getResultType() == PatientTreatmentPlan.class) {
                    // SELECT query - patient is already fetched, just get the path
                    patientPath = root.get("patient");
                } else {
                    // COUNT query - need to create join
                    patientPath = root.join("patient", JoinType.LEFT);
                }

                Predicate planNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("planName")),
                        searchPattern);
                Predicate patientFirstNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(patientPath.get("firstName")),
                        searchPattern);
                Predicate patientLastNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(patientPath.get("lastName")),
                        searchPattern);

                predicates.add(criteriaBuilder.or(planNameMatch, patientFirstNameMatch, patientLastNameMatch));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Add RBAC filter for Doctor (VIEW_TREATMENT_PLAN_OWN).
     * Only show plans created by this employee.
     *
     * @param employeeId Current employee ID
     * @return Specification with employee filter
     */
    public static Specification<PatientTreatmentPlan> filterByCreatedByEmployee(Integer employeeId) {
        return (root, query, criteriaBuilder) -> {
            Join<Object, Object> createdByJoin = root.join("createdBy", JoinType.INNER);
            return criteriaBuilder.equal(createdByJoin.get("employeeId"), employeeId);
        };
    }

    /**
     * Add RBAC filter for Patient (VIEW_TREATMENT_PLAN_OWN).
     * Only show plans belonging to this patient.
     *
     * @param patientId Current patient ID
     * @return Specification with patient filter
     */
    public static Specification<PatientTreatmentPlan> filterByPatient(Integer patientId) {
        return (root, query, criteriaBuilder) -> {
            Join<Object, Object> patientJoin = root.join("patient", JoinType.INNER);
            return criteriaBuilder.equal(patientJoin.get("patientId"), patientId);
        };
    }
}
