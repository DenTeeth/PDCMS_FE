package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 🔥 Đơn vị đo lường vật tư - Hỗ trợ hierarchy
 * VD: 1 Hộp = 10 Vỉ, 1 Vỉ = 10 Viên
 */
@Entity
@Table(name = "item_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "unit_id")
    private Long unitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_master_id", nullable = false)
    private ItemMaster itemMaster;

    /**
     * Tên đơn vị: "Hộp", "Vỉ", "Viên", "Tuýp", "Lọ", "Gói"
     */
    @Column(name = "unit_name", nullable = false, length = 50)
    private String unitName;

    /**
     * Tỷ lệ quy đổi về đơn vị cơ bản
     * VD: 1 Hộp = 10 Vỉ → conversionRate = 10
     * 1 Vỉ = 10 Viên → conversionRate = 10
     * 1 Viên (base unit) → conversionRate = 1
     */
    @Column(name = "conversion_rate", nullable = false)
    private Integer conversionRate;

    /**
     * Đơn vị cơ bản nhỏ nhất (Viên, Chiếc, Gram)
     * TRUE = đơn vị base, không thể chia nhỏ thêm
     */
    @Column(name = "is_base_unit", nullable = false)
    @Builder.Default
    private Boolean isBaseUnit = false;

    /**
     * Thứ tự hiển thị (từ lớn đến nhỏ)
     * Hộp (1) → Vỉ (2) → Viên (3)
     */
    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
