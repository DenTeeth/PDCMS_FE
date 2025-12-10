package com.dental.clinic.management.booking_appointment.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for PUT /api/v1/rooms/{roomCode}/services.
 * <p>
 * Replaces all service assignments for a room (DELETE old + INSERT new).
 * </p>
 *
 * <p>
 * <b>Validation Rules:</b>
 * </p>
 * <ul>
 * <li>serviceCodes cannot be null or empty</li>
 * <li>All serviceCodes must exist in database</li>
 * <li>All services must be active (is_active = true)</li>
 * </ul>
 *
 * <p>
 * <b>Example JSON:</b>
 * </p>
 * 
 * <pre>
 * {
 *   "serviceCodes": [
 *     "IMPL_SURGERY_KR",
 *     "IMPL_BONE_GRAFT",
 *     "IMPL_SINUS_LIFT"
 *   ]
 * }
 * </pre>
 *
 * <p>
 * <b>Business Logic:</b>
 * </p>
 * <ol>
 * <li>DELETE FROM room_services WHERE room_id = {roomId}</li>
 * <li>FOR EACH serviceCode:
 * <ul>
 * <li>Find serviceId by serviceCode</li>
 * <li>INSERT INTO room_services (room_id, service_id)</li>
 * </ul>
 * </li>
 * <li>All operations in 1 transaction</li>
 * </ol>
 *
 * @since V16
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoomServicesRequest {

    /**
     * List of service codes to assign to the room.
     * <p>
     * Replaces ALL existing assignments (not append).
     * Empty list is allowed (means "remove all services").
     * </p>
     *
     * <p>
     * <b>Example values:</b>
     * </p>
     * <ul>
     * <li>"IMPL_SURGERY_KR" → Phẫu thuật đặt trụ Implant Hàn Quốc</li>
     * <li>"SCALING_L1" → Cạo vôi răng & Đánh bóng - Mức 1</li>
     * <li>"GEN_EXAM" → Khám tổng quát & Tư vấn</li>
     * </ul>
     */
    @NotEmpty(message = "Danh sách mã dịch vụ không được rỗng")
    private List<String> serviceCodes;
}
