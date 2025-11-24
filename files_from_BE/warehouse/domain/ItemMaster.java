package com.dental.clinic.management.warehouse.domain;

import com.dental.clinic.management.warehouse.enums.WarehouseType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Định nghĩa vật tư (Master Data)
 * KHÔNG chứa quantity - Chỉ chứa thông tin định nghĩa
 */
@Entity
@Table(name = "item_masters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_master_id")
    private Long itemMasterId;

    @Column(name = "item_code", nullable = false, unique = true, length = 50)
    private String itemCode;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ItemCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "warehouse_type", nullable = false)
    @Builder.Default
    private WarehouseType warehouseType = WarehouseType.NORMAL;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure; // "Hộp", "Lọ", "Cái", "Túi", "Hộp 100 chiếc"

    @Column(name = "min_stock_level", nullable = false)
    @Builder.Default
    private Integer minStockLevel = 0;

    @Column(name = "max_stock_level", nullable = false)
    @Builder.Default
    private Integer maxStockLevel = 0;

    /**
     * 🔥 Giá thị trường tham chiếu (Feedback)
     * Dùng để so sánh với giá nhập thực tế
     * Giúp đánh giá NCC có báo giá hợp lý không
     */
    @Column(name = "current_market_price", precision = 15, scale = 2)
    private java.math.BigDecimal currentMarketPrice;

    /**
     * @deprecated Không còn sử dụng sau mentor feedback
     *             Tất cả items đều phải có expiry_date (kể cả tools)
     *             Giữ lại cho backward compatibility
     */
    @Deprecated
    @Column(name = "is_tool", nullable = false)
    @Builder.Default
    private Boolean isTool = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.isTool == null) {
            this.isTool = false;
        }
        if (this.warehouseType == null) {
            this.warehouseType = WarehouseType.NORMAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
