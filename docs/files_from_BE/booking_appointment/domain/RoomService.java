package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing room_services table (V16).
 * <p>
 * Junction table for many-to-many relationship between Room and DentalService.
 * Defines which services can be performed in which rooms.
 * </p>
 *
 * <p><b>Business Rules:</b></p>
 * <ul>
 *   <li>A room can support multiple services (e.g., "Phòng Implant" → Implant + Bone Graft)</li>
 *   <li>A service can be performed in multiple rooms (e.g., "Cạo vôi" → P-01, P-02, P-03)</li>
 *   <li>Only active services should be assigned to rooms</li>
 *   <li>Receptionist uses this to validate room-service compatibility when booking appointments</li>
 * </ul>
 *
 * <p><b>Example Data:</b></p>
 * <pre>
 * room_id | service_id | service_name       | room_name
 * --------|------------|-------------------|------------------
 * 4       | 35         | Cắm trụ Implant   | Phòng Implant P-04
 * 4       | 36         | Nâng xoang        | Phòng Implant P-04
 * 1       | 1          | Khám tổng quát    | Phòng thường P-01
 * 1       | 3          | Cạo vôi - Mức 1   | Phòng thường P-01
 * </pre>
 *
 * @since V16
 * @see Room
 * @see DentalService
 * @see RoomServiceId
 */
@Entity
@Table(name = "room_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomService {

    /**
     * Composite primary key (room_id, service_id).
     */
    @EmbeddedId
    private RoomServiceId id;

    /**
     * Reference to the Room entity.
     * <p>
     * MapsId ensures that room_id in RoomServiceId is synchronized
     * with the roomId field in this ManyToOne relationship.
     * </p>
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("roomId")
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    /**
     * Reference to the DentalService entity.
     * <p>
     * MapsId ensures that service_id in RoomServiceId is synchronized
     * with the serviceId field in this ManyToOne relationship.
     * </p>
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("serviceId")
    @JoinColumn(name = "service_id", nullable = false)
    private DentalService service;

    /**
     * Timestamp when this room-service mapping was created.
     * <p>
     * Audit field to track when a service was assigned to a room.
     * </p>
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Convenience constructor to create a new room-service mapping.
     *
     * @param room    the room entity
     * @param service the service entity
     */
    public RoomService(Room room, DentalService service) {
        this.room = room;
        this.service = service;
        this.id = new RoomServiceId(room.getRoomId(), service.getServiceId());
    }
}
