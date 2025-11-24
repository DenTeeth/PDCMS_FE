package com.dental.clinic.management.customer_contact.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.customer_contact.enums.CustomerContactStatus;
import com.dental.clinic.management.customer_contact.domain.CustomerContact;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CustomerContactRepository extends JpaRepository<CustomerContact, String> {
    Optional<CustomerContact> findOneByContactId(String contactId);

    boolean existsByPhone(String phone);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // new helper used for auto-assign + simple metrics
    long countByAssignedToAndStatus(Integer assignedTo, CustomerContactStatus status);
}
