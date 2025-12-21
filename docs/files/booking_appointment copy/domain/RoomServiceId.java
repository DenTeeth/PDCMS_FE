package com.dental.clinic.management.booking_appointment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite Primary Key for room_services table (V16).
 * <p>
 * Represents the many-to-many relationship between rooms and services.
 * A room can support multiple services, and a service can be performed in
 * multiple rooms.
 * </p>
 *
 * <p>
 * <b>Business Context:</b>
 * </p>
 * <ul>
 * <li>Example: "Phòng Implant P-04" can do "Cắm trụ Implant" and "Nâng
 * xoang"</li>
 * <li>Example: "Dịch vụ Cạo vôi" can be performed in "P-01", "P-02",
 * "P-03"</li>
 * </ul>
 *
 * @since V16
 * @see RoomService
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomServiceId implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Foreign key to rooms table.
     * Type: String (matches Room.roomId which uses IdGenerator pattern
     * "GHE-XXXXXXX")
     */
    @Column(name = "room_id", nullable = false)
    private String roomId;

    /**
     * Foreign key to services table.
     * Type: Integer (matches DentalService.serviceId SERIAL auto-increment)
     */
    @Column(name = "service_id", nullable = false)
    private Integer serviceId;

    /**
     * Override equals to compare composite keys.
     * Required for JPA @EmbeddedId.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        RoomServiceId that = (RoomServiceId) o;
        return Objects.equals(roomId, that.roomId) &&
                Objects.equals(serviceId, that.serviceId);
    }

    /**
     * Override hashCode for composite keys.
     * Required for JPA @EmbeddedId.
     */
    @Override
    public int hashCode() {
        return Objects.hash(roomId, serviceId);
    }
}
