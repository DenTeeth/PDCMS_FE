package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Mapping giữa Supplier và ItemMaster
 * Lưu thông tin NCC nào cung cấp vật tư nào
 */
@Entity
@Table(name = "supplier_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "supplier_id", "item_master_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "supplier_item_id")
    private Long supplierItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_master_id", nullable = false)
    private ItemMaster itemMaster;

    @Column(name = "supplier_item_code", length = 100)
    private String supplierItemCode; // Mã vật tư của NCC

    @Column(name = "last_purchase_date")
    private LocalDateTime lastPurchaseDate;

    /**
     * NCC ưu tiên cho vật tư này
     */
    @Column(name = "is_preferred", nullable = false)
    @Builder.Default
    private Boolean isPreferred = false;

    @PrePersist
    protected void onCreate() {
        if (this.isPreferred == null) {
            this.isPreferred = false;
        }
    }
}
