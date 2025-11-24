package com.dental.clinic.management.working_schedule.repository;

import com.dental.clinic.management.working_schedule.domain.LeaveBalanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveBalanceHistoryRepository extends JpaRepository<LeaveBalanceHistory, Long> {

    List<LeaveBalanceHistory> findByBalanceIdOrderByCreatedAtDesc(Long balanceId);

    List<LeaveBalanceHistory> findByChangedByOrderByCreatedAtDesc(Integer changedBy);
}
