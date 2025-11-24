package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.FixedRegistrationDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for FixedRegistrationDay entity.
 */
@Repository
public interface FixedRegistrationDayRepository
        extends JpaRepository<FixedRegistrationDay, FixedRegistrationDay.FixedRegistrationDayId> {
    // Basic CRUD operations are inherited from JpaRepository
    // No custom methods needed as we use cascade operations from parent entity
}
