package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Nhà cung cấp
 */
@Entity
@Table(name = "suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "supplier_code", nullable = false, unique = true, length = 50)
    private String supplierCode;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    /**
     * 🔥 Phân loại ưu tiên nhà cung cấp (Feedback Upgrade)
     * TIER_1: Ưu tiên cao nhất (chất lượng tốt, giá tốt, giao hàng nhanh)
     * TIER_2: Ổn định
     * TIER_3: Dự phòng (default cho NCC mới)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tier_level", nullable = false)
    @Builder.Default
    private com.dental.clinic.management.warehouse.enums.SupplierTier tierLevel = com.dental.clinic.management.warehouse.enums.SupplierTier.TIER_3;

    /**
     * Điểm đánh giá chất lượng nhà cung cấp (0-5.0)
     * Dựa trên: chất lượng hàng, thời gian giao, giá cả, dịch vụ
     */
    @Column(name = "rating_score", precision = 3, scale = 1)
    @Builder.Default
    private java.math.BigDecimal ratingScore = java.math.BigDecimal.ZERO;

    /**
     * Tổng số đơn hàng đã nhập từ NCC này
     * Dùng để đánh giá độ tin cậy
     */
    @Column(name = "total_orders")
    @Builder.Default
    private Integer totalOrders = 0;

    /**
     * Ngày nhập hàng gần nhất
     * Dùng để tracking hoạt động của NCC
     */
    @Column(name = "last_order_date")
    private java.time.LocalDate lastOrderDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
