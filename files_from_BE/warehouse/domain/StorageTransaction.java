package com.dental.clinic.management.warehouse.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

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
