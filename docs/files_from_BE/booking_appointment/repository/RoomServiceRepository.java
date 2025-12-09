package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.RoomService;
import com.dental.clinic.management.booking_appointment.domain.RoomServiceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for room_services table (V16).
 * <p>
 * Manages the many-to-many relationship between Room and DentalService.
 * </p>
 *
 * <p>
 * <b>Key Operations:</b>
 * </p>
 * <ul>
 * <li>Find all services compatible with a room → GET API</li>
 * <li>Delete all room-service mappings → PUT API (bulk replace)</li>
 * <li>Save all new room-service mappings → PUT API (bulk replace)</li>
 * </ul>
 *
 * @since V16
 * @see RoomService
 * @see RoomServiceId
 */
@Repository
public interface RoomServiceRepository extends JpaRepository<RoomService, RoomServiceId> {

    /**
     * Find all RoomService entities by room ID.
     * <p>
     * Used by GET /api/v1/rooms/{roomCode}/services to retrieve
     * all services compatible with a specific room.
     * </p>
     *
     * <p>
     * <b>SQL Equivalent:</b>
     * </p>
     *
     * <pre>
     * SELECT rs.* FROM room_services rs
     * WHERE rs.room_id = :roomId
     * </pre>
     *
     * @param roomId the room ID (String type matching Room.roomId from IdGenerator)
     * @return list of RoomService entities for this room
     */
    List<RoomService> findByIdRoomId(String roomId);

    /**
     * Delete all RoomService entities by room ID.
     * <p>
     * Used by PUT /api/v1/rooms/{roomCode}/services to delete
     * all existing mappings before inserting new ones.
     * </p>
     *
     * <p>
     * <b>SQL Equivalent:</b>
     * </p>
     *
     * <pre>
     * DELETE FROM room_services
     * WHERE room_id = :roomId
     * </pre>
     *
     * <p>
     * <b>Important:</b> This method MUST be called within a @Transactional context.
     * </p>
     *
     * @param roomId the room ID (String type matching Room.roomId)
     */
    @Modifying
    @Query("DELETE FROM RoomService rs WHERE rs.id.roomId = :roomId")
    void deleteByIdRoomId(@Param("roomId") String roomId);

    /**
     * Find all rooms that support a specific service.
     * <p>
     * Future use case: When scheduling an appointment for a specific service,
     * we can find all available rooms that can perform that service.
     * </p>
     *
     * <p>
     * <b>SQL Equivalent:</b>
     * </p>
     *
     * <pre>
     * SELECT rs.* FROM room_services rs
     * WHERE rs.service_id = :serviceId
     * </pre>
     *
     * @param serviceId the service ID (Integer type matching
     *                  DentalService.serviceId)
     * @return list of RoomService entities for this service
     */
    List<RoomService> findByIdServiceId(Integer serviceId);

    /**
     * Check if a specific room-service mapping exists.
     * <p>
     * Future use case: Validate if a room can perform a service
     * when creating an appointment.
     * </p>
     *
     * <p>
     * <b>SQL Equivalent:</b>
     * </p>
     *
     * <pre>
     * SELECT COUNT(*) > 0 FROM room_services
     * WHERE room_id = :roomId AND service_id = :serviceId
     * </pre>
     *
     * @param roomId    the room ID (String)
     * @param serviceId the service ID (Integer)
     * @return true if mapping exists, false otherwise
     */
    boolean existsByIdRoomIdAndIdServiceId(String roomId, Integer serviceId);

    /**
     * Find rooms that support ALL specified services.
     * <p>
     * Used by P3.1 (Available Times API) to find compatible rooms.
     * A room is compatible only if it supports ALL requested services.
     * </p>
     *
     * <p>
     * <b>SQL Logic:</b>
     * </p>
     *
     * <pre>
     * SELECT room_id FROM room_services
     * WHERE service_id IN (:serviceIds)
     * GROUP BY room_id
     * HAVING COUNT(DISTINCT service_id) = :serviceCount
     * </pre>
     *
     * @param serviceIds   list of service IDs (all must be supported)
     * @param serviceCount number of services (for HAVING clause)
     * @return list of room IDs (String) that support ALL services
     */
    @Query("SELECT rs.id.roomId FROM RoomService rs " +
            "WHERE rs.id.serviceId IN :serviceIds " +
            "GROUP BY rs.id.roomId " +
            "HAVING COUNT(DISTINCT rs.id.serviceId) = :serviceCount")
    List<String> findRoomsSupportingAllServices(
            @Param("serviceIds") List<Integer> serviceIds,
            @Param("serviceCount") long serviceCount);
}
