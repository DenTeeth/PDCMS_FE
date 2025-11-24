package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Chi tiết từng dòng của phiếu nhập/xuất
 */
@Entity
@Table(name = "storage_transaction_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageTransactionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_item_id")
    private Long transactionItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private StorageTransaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ItemBatch batch;

    /**
     * 🔥 Mã vật tư - Warehouse staff nhận diện vật tư
     * Copy từ ItemMaster.itemCode khi tạo transaction
     */
    @Column(name = "item_code", length = 50)
    private String itemCode;

    /**
     * 🔥 Đơn vị đo - Hỗ trợ giao dịch theo unit (Hộp/Vỉ/Viên)
     * NULL = sử dụng đơn vị mặc định của item
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private ItemUnit unit;

    /**
     * Dương = Nhập
     * Âm = Xuất
     */
    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    /**
     * 🔥 Giá tại thời điểm giao dịch (Feedback: Price History)
     * - Import: Giá nhập từ NCC
     * - Export: Giá xuất (có thể khác giá nhập do tính toán lại)
     * NULL = không tracking giá (VD: điều chỉnh kho)
     */
    @Column(name = "price", precision = 15, scale = 2)
    private java.math.BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
