package com.dental.clinic.management.warehouse.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Định mức tiêu hao vật tư cho từng dịch vụ (BOM - Bill of Materials)
 * Feedback: Forecasting - Dự báo nhu cầu nhập hàng
 *
 * VD: Dịch vụ "Nhổ răng khôn" cần:
 * - 2 viên Amoxicillin
 * - 1 ống Lidocaine
 * - 2 đôi găng tay
 */
@Entity
@Table(name = "service_consumables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceConsumable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "link_id")
    private Long linkId;

    /**
     * Dịch vụ nào cần vật tư này?
     */
    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    /**
     * Vật tư gì?
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_master_id", nullable = false)
    private ItemMaster itemMaster;

    /**
     * Định mức: 1 ca điều trị cần bao nhiêu?
     * VD: 2.5 (2.5 viên thuốc), 1.0 (1 ống), 0.5 (nửa tuýp)
     */
    @Column(name = "quantity_per_service", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityPerService;

    /**
     * Đơn vị tính
     * VD: Viên, Ống, Đôi, Tuýp
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private ItemUnit unit;

    /**
     * Ghi chú
     * VD: "Dùng cho bệnh nhân không dị ứng", "Chỉ dùng cho ca phức tạp"
     */
    @Column(columnDefinition = "TEXT")
    private String notes;
}
