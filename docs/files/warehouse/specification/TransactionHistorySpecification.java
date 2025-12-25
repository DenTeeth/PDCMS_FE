package com.dental.clinic.management.warehouse.specification;

import com.dental.clinic.management.warehouse.domain.StorageTransaction;
import com.dental.clinic.management.warehouse.dto.request.TransactionHistoryRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * API 6.6: Transaction History Specification
 * Dynamic query builder for complex filtering
 */
public class TransactionHistorySpecification {

    public static Specification<StorageTransaction> buildSpecification(TransactionHistoryRequest request) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Search by transaction_code or invoice_number (LIKE %...%)
            if (request.getSearch() != null && !request.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + request.getSearch().toLowerCase() + "%";
                Predicate codePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("transactionCode")),
                        searchPattern);
                Predicate invoicePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("invoiceNumber")),
                        searchPattern);
                predicates.add(criteriaBuilder.or(codePredicate, invoicePredicate));
            }

            // 2. Filter by transaction type (IMPORT, EXPORT, ADJUSTMENT)
            if (request.getType() != null) {
                predicates.add(criteriaBuilder.equal(root.get("transactionType"), request.getType()));
            }

            // 3. Filter by approval status (PENDING_APPROVAL, APPROVED, REJECTED)
            if (request.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("approvalStatus"), request.getStatus()));
            }

            // 4. Filter by payment status (UNPAID, PARTIAL, PAID) - Only for IMPORT
            if (request.getPaymentStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("paymentStatus"), request.getPaymentStatus()));
            }

            // 5. Date range filter (transaction_date BETWEEN fromDate AND toDate)
            if (request.getFromDate() != null) {
                LocalDateTime startOfDay = request.getFromDate().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), startOfDay));
            }
            if (request.getToDate() != null) {
                LocalDateTime endOfDay = request.getToDate().atTime(LocalTime.MAX);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), endOfDay));
            }

            // 6. Filter by supplier (for IMPORT transactions)
            if (request.getSupplierId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("supplier").get("id"), request.getSupplierId()));
            }

            // 7. Filter by related appointment (for EXPORT transactions)
            if (request.getAppointmentId() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("relatedAppointment").get("appointmentId"),
                        request.getAppointmentId()));
            }

            // 8. Filter by creator (created_by employee_id)
            if (request.getCreatedBy() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("createdBy").get("employeeId"),
                        request.getCreatedBy()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
