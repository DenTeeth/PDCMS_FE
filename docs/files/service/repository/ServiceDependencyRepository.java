package com.dental.clinic.management.service.repository;

import com.dental.clinic.management.service.domain.DependencyRuleType;
import com.dental.clinic.management.service.domain.ServiceDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ServiceDependency entity (V21 - Clinical Rules Engine)
 *
 * Provides queries to fetch clinical rules for validation and UI suggestions.
 *
 * @since V21
 * @see ServiceDependency
 * @see DependencyRuleType
 */
@Repository
public interface ServiceDependencyRepository extends JpaRepository<ServiceDependency, Long> {

    /**
     * Find all rules where the given service is the primary service (Service A)
     *
     * Use Case: When booking Service B, find all prerequisites/restrictions
     *
     * Example: serviceId = 5 (Trám răng)
     * Returns: Rule "GEN_EXAM (1) -> FILLING_COMP (5), REQUIRES_PREREQUISITE"
     *
     * @param serviceId The service ID
     * @return List of dependency rules
     */
    @Query("SELECT sd FROM ServiceDependency sd " +
            "JOIN FETCH sd.service s " +
            "JOIN FETCH sd.dependentService ds " +
            "WHERE s.serviceId = :serviceId")
    List<ServiceDependency> findByServiceId(@Param("serviceId") Long serviceId);

    /**
     * Find all rules where the given service is the dependent service (Service B)
     *
     * Use Case: When booking Service A, check if it has dependent services
     *
     * Example: dependentServiceId = 25 (Cắt chỉ)
     * Returns: Rule "EXTRACT_WISDOM (10) -> SURG_CHECKUP (25), REQUIRES_MIN_DAYS:
     * 7"
     *
     * @param dependentServiceId The dependent service ID
     * @return List of dependency rules
     */
    @Query("SELECT sd FROM ServiceDependency sd " +
            "JOIN FETCH sd.service s " +
            "JOIN FETCH sd.dependentService ds " +
            "WHERE ds.serviceId = :dependentServiceId")
    List<ServiceDependency> findByDependentServiceId(@Param("dependentServiceId") Long dependentServiceId);

    /**
     * Find rules by service ID and rule type
     *
     * Use Case: Fetch only REQUIRES_PREREQUISITE rules for a service
     *
     * @param serviceId The service ID
     * @param ruleType  The rule type to filter
     * @return List of matching rules
     */
    @Query("SELECT sd FROM ServiceDependency sd " +
            "JOIN FETCH sd.service s " +
            "JOIN FETCH sd.dependentService ds " +
            "WHERE s.serviceId = :serviceId AND sd.ruleType = :ruleType")
    List<ServiceDependency> findByServiceIdAndRuleType(
            @Param("serviceId") Long serviceId,
            @Param("ruleType") DependencyRuleType ruleType);

    /**
     * Find all BUNDLES_WITH rules for a service (both directions)
     *
     * Use Case: API 6.5 GET /services/grouped - show "bundlesWith" suggestions
     *
     * Example: serviceId = 1 (Khám)
     * Returns: Rules where service_id=1 OR dependent_service_id=1,
     * rule_type=BUNDLES_WITH
     *
     * Result: [(1 -> 3, BUNDLES_WITH), (3 -> 1, BUNDLES_WITH)]
     * Means: "Khám" bundles with "Cạo vôi"
     *
     * @param serviceId The service ID
     * @return List of bundle suggestions
     */
    @Query("SELECT sd FROM ServiceDependency sd " +
            "JOIN FETCH sd.service s " +
            "JOIN FETCH sd.dependentService ds " +
            "WHERE (s.serviceId = :serviceId OR ds.serviceId = :serviceId) " +
            "AND sd.ruleType = 'BUNDLES_WITH'")
    List<ServiceDependency> findBundlesByServiceId(@Param("serviceId") Long serviceId);

    /**
     * Find EXCLUDES_SAME_DAY rules for a list of services
     *
     * Use Case: API 3.2 POST /appointments - validate service combinations
     *
     * Example: serviceIds = [10, 15] (Nhổ răng, Tẩy trắng)
     * Returns: Rule "EXTRACT_WISDOM (10) -> BLEACH (15), EXCLUDES_SAME_DAY"
     *
     * @param serviceIds List of service IDs being booked together
     * @return List of exclusion rules
     */
    @Query("SELECT sd FROM ServiceDependency sd " +
            "JOIN FETCH sd.service s " +
            "JOIN FETCH sd.dependentService ds " +
            "WHERE s.serviceId IN :serviceIds " +
            "AND ds.serviceId IN :serviceIds " +
            "AND sd.ruleType = 'EXCLUDES_SAME_DAY'")
    List<ServiceDependency> findExclusionRulesForServices(@Param("serviceIds") List<Long> serviceIds);

    /**
     * Find all hard rules (non-BUNDLES_WITH) for a service
     *
     * Use Case: Validation - get all rules that must be enforced
     *
     * @param serviceId The service ID
     * @return List of hard rules (REQUIRES_PREREQUISITE, REQUIRES_MIN_DAYS,
     *         EXCLUDES_SAME_DAY)
     */
    @Query("SELECT sd FROM ServiceDependency sd " +
            "JOIN FETCH sd.service s " +
            "JOIN FETCH sd.dependentService ds " +
            "WHERE s.serviceId = :serviceId " +
            "AND sd.ruleType != 'BUNDLES_WITH'")
    List<ServiceDependency> findHardRulesByServiceId(@Param("serviceId") Long serviceId);

    /**
     * Check if a specific rule exists between two services
     *
     * Use Case: Quick check if Service A has a specific rule for Service B
     *
     * @param serviceId          Primary service ID
     * @param dependentServiceId Dependent service ID
     * @param ruleType           Rule type to check
     * @return true if rule exists, false otherwise
     */
    @Query("SELECT COUNT(sd) > 0 FROM ServiceDependency sd " +
            "WHERE sd.service.serviceId = :serviceId " +
            "AND sd.dependentService.serviceId = :dependentServiceId " +
            "AND sd.ruleType = :ruleType")
    boolean existsByServiceAndDependentAndRuleType(
            @Param("serviceId") Long serviceId,
            @Param("dependentServiceId") Long dependentServiceId,
            @Param("ruleType") DependencyRuleType ruleType);
}
