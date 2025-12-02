package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.ServiceConsumable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * API 6.17: Service Consumable Repository
 * Query consumable items (Bill of Materials) for services
 */
@Repository
public interface ServiceConsumableRepository extends JpaRepository<ServiceConsumable, Long> {

    /**
     * Get all consumables for a service with item and unit details
     * Uses JOIN FETCH to avoid N+1 queries
     */
    @Query("""
                SELECT sc FROM ServiceConsumable sc
                JOIN FETCH sc.itemMaster im
                JOIN FETCH sc.unit u
                WHERE sc.serviceId = :serviceId
                AND im.isActive = true
                ORDER BY sc.quantityPerService DESC
            """)
    List<ServiceConsumable> findByServiceIdWithDetails(@Param("serviceId") Long serviceId);

    /**
     * Check if service has any consumables defined
     * Used to return 404 "No consumables defined" vs 200 empty list
     */
    boolean existsByServiceId(Long serviceId);
}
