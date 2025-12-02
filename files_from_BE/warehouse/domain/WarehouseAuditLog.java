package com.dental.clinic.management.warehouse.domain;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.warehouse.enums.WarehouseActionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 *  WAREHOUSE AUDIT LOG - QUAN TRỌNG
 * Tracking mọi thao tác nhạy cảm trong kho để chống thất thoát
 *
 * Mục đích:
 * - Truy vết ai làm gì, khi nào, tại sao
 * - Phát hiện gian lận (VD: sửa số lượng tồn kho)
 * - Compliance với quy định kiểm toán kho
 * - Hỗ trợ kiểm tra khi có khiếu nại
 */
@Entity
@Table(name = "warehouse_audit_logs", indexes = {
        @Index(name = "idx_audit_item_action", columnList = "item_master_id, action_type"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    /**
     * Vật tư nào bị thay đổi? (nullable)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_master_id")
    private ItemMaster itemMaster;

    /**
     * Lô hàng nào bị thay đổi? (nullable)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private ItemBatch batch;

    /**
     * Phiếu giao dịch nào? (nullable)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private StorageTransaction transaction;

    /**
     * Loại hành động
     * CREATE, UPDATE, DELETE, ADJUST, EXPIRE_ALERT, TRANSFER, DISCARD
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private WarehouseActionType actionType;

    /**
     * Nhân viên thực hiện (Ai làm?)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private Employee performedBy;

    /**
     * Giá trị cũ (trước khi thay đổi)
     * JSON hoặc Text mô tả chi tiết
     * VD: "quantity_on_hand: 50"
     */
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    /**
     * Giá trị mới (sau khi thay đổi)
     * VD: "quantity_on_hand: 30"
     */
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    /**
     * Lý do thay đổi (BẮT BUỘC cho UPDATE, DELETE, ADJUST)
     * VD: "Nhập sai số lượng", "Kiểm kê phát hiện thiếu 20 viên", "Hàng hỏng do hết
     * hạn"
     */
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    /**
     * Thời gian thực hiện
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
