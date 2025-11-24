package com.dental.clinic.management.contact_history.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.contact_history.domain.ContactHistory;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContactHistoryRepository extends JpaRepository<ContactHistory, String> {
    List<ContactHistory> findByContactIdOrderByCreatedAtDesc(String contactId);

    // for daily sequence generation
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}
