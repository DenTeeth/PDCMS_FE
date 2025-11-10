package com.dental.clinic.management.working_schedule.repository;

// V2 Migration: RegistrationDays entity has been removed in V2 schema
// Each registration now links to a single PartTimeSlot instead of having multiple days
// This repository is no longer needed and is commented out to prevent compilation errors

/*
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.working_schedule.domain.RegistrationDays;
import com.dental.clinic.management.working_schedule.domain.RegistrationDaysId;

import java.util.List;

@Repository
public interface RegistrationDaysRepository extends JpaRepository<RegistrationDays, RegistrationDaysId> {

    List<RegistrationDays> findByIdRegistrationId(String registrationId);
}
*/
