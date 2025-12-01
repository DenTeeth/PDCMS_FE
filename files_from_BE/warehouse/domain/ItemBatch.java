package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lô hàng thực tế (Kho vật lý)
 * Chứa quantity_on_hand - Đây mới là bảng lưu số lượng
 */
@Entity
@Table(name = "item_batches", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "item_master_id", "lot_number" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    private Long batchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_master_id", nullable = false)
    private ItemMaster itemMaster;

    @Column(name = "lot_number", nullable = false, length = 100)
    private String lotNumber; // Số lô

    @Column(name = "quantity_on_hand", nullable = false)
    @Builder.Default
    private Integer quantityOnHand = 0;

    /**
     * Số lượng ban đầu khi nhập (Feedback: Tracking)
     * Dùng để so sánh với quantity_on_hand → tính tỷ lệ xuất
     * VD: initial=100, current=30 → đã xuất 70%
     */
    @Column(name = "initial_quantity")
    private Integer initialQuantity;

    /**
     * Parent batch - Hỗ trợ hierarchy
     * VD: Batch "1 Hộp 100 viên" là parent của batch "10 Vỉ (mỗi vỉ 10 viên)"
     * NULL = batch gốc, không có parent
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_batch_id")
    private ItemBatch parentBatch;

    /**
     * API 6.5: Unpacking Tracking Fields
     * Theo góp ý review - tracking chi tiết quá trình xé lẻ
     */
    @Column(name = "is_unpacked")
    @Builder.Default
    private Boolean isUnpacked = false; // Batch này có phải được tạo từ unpacking không?

    @Column(name = "unpacked_at")
    private LocalDateTime unpackedAt; // Thời điểm unpacking

    @Column(name = "unpacked_by_transaction_id")
    private Long unpackedByTransactionId; // Phiếu xuất nào đã unpack batch này

    /**
     * Vị trí kho (Feedback: Warehouse Location)
     * VD: "Kệ A-01", "Tủ lạnh B-03", "Kho C-Tầng 2"
     * Giúp nhân viên tìm hàng nhanh hơn
     */
    @Column(name = "bin_location", length = 50)
    private String binLocation;

    /**
     * Hạn sử dụng - BẮT BUỘC cho TẤT CẢ vật tư
     * Mentor feedback: Không còn exception cho tools
     */
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "imported_at", nullable = false)
    private LocalDateTime importedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.importedAt = LocalDateTime.now();
        if (this.quantityOnHand == null) {
            this.quantityOnHand = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
