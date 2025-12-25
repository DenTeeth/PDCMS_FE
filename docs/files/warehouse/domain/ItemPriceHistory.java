package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Lịch sử biến động giá vật tư (Feedback: Price History)
 * Tracking giá nhập từ từng NCC theo thời gian
 * Dùng để phân tích xu hướng giá, chọn NCC tốt nhất
 */
@Entity
@Table(name = "item_price_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_master_id", nullable = false)
    private ItemMaster itemMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    /**
     * Giá cũ (lần nhập trước)
     */
    @Column(name = "old_import_price", precision = 15, scale = 2)
    private BigDecimal oldImportPrice;

    /**
     * Giá mới (lần nhập hiện tại)
     */
    @Column(name = "new_import_price", precision = 15, scale = 2)
    private BigDecimal newImportPrice;

    /**
     * Ngày có hiệu lực
     */
    @Column(name = "effective_date", nullable = false)
    @Builder.Default
    private LocalDate effectiveDate = LocalDate.now();

    /**
     * Ghi chú lý do thay đổi giá
     * VD: "NCC tăng giá do lạm phát", "Khuyến mãi cuối năm"
     */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (this.effectiveDate == null) {
            this.effectiveDate = LocalDate.now();
        }
    }
}
