package com.dental.clinic.management.warehouse.domain;

import com.dental.clinic.management.booking_appointment.domain.Appointment;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.warehouse.enums.PaymentStatus;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Phiếu Nhập/Xuất Kho (Header)
 */
@Entity
@Table(name = "storage_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 50)
    private String transactionCode; // 'PN-20250117-001', 'PX-20250117-001'

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    /**
     * Chỉ dùng cho IMPORT
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * API 6.4: Enhanced fields for financial tracking and audit
     */
    @Column(name = "invoice_number", unique = true, length = 100)
    private String invoiceNumber; // Số hóa đơn GTGT

    @Column(name = "expected_delivery_date")
    private java.time.LocalDate expectedDeliveryDate; // Ngày giao hàng dự kiến

    @Column(name = "total_value", precision = 15, scale = 2)
    private java.math.BigDecimal totalValue; // Tổng giá trị phiếu nhập

    @Column(name = "status", length = 20)
    private String status; // COMPLETED, DRAFT, CANCELLED (legacy - kept for backward compatibility)

    /**
     * API 6.5: Export-specific fields
     */
    @Column(name = "export_type", length = 20)
    private String exportType; // USAGE, DISPOSAL, RETURN

    @Column(name = "reference_code", length = 100)
    private String referenceCode; // Mã phiếu yêu cầu hoặc mã ca điều trị

    @Column(name = "department_name", length = 200)
    private String departmentName; // Phòng ban xuất hàng

    @Column(name = "requested_by", length = 200)
    private String requestedBy; // Người yêu cầu xuất

    /**
     * API 6.6: Enhanced Transaction History Features
     * Issue #23: Payment status defaults to UNPAID for IMPORT transactions
     */
    // Payment tracking (for IMPORT transactions)
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Default: UNPAID

    @Column(name = "paid_amount", precision = 15, scale = 2)
    private BigDecimal paidAmount; // Số tiền đã thanh toán

    @Column(name = "remaining_debt", precision = 15, scale = 2)
    private BigDecimal remainingDebt; // Số tiền còn nợ

    @Column(name = "due_date")
    private LocalDate dueDate; // Hạn thanh toán

    // Approval workflow
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    private TransactionStatus approvalStatus; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private Employee approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by_id")
    private Employee rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_id")
    private Employee cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    // Appointment linking (for EXPORT transactions)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_appointment_id")
    private Appointment relatedAppointment;

    // Creator tracking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StorageTransactionItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.transactionDate = LocalDateTime.now();
    }

    public void addItem(StorageTransactionItem item) {
        items.add(item);
        item.setTransaction(this);
    }

    public void removeItem(StorageTransactionItem item) {
        items.remove(item);
        item.setTransaction(null);
    }
}
