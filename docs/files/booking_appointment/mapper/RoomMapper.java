package com.dental.clinic.management.booking_appointment.mapper;

import com.dental.clinic.management.booking_appointment.domain.Room;
import com.dental.clinic.management.booking_appointment.dto.request.CreateRoomRequest;
import com.dental.clinic.management.booking_appointment.dto.response.RoomResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for Room entity and DTOs
 */
@Component
public class RoomMapper {

    /**
     * Convert Room entity to RoomResponse DTO
     */
    public RoomResponse toResponse(Room room) {
        if (room == null) {
            return null;
        }

        RoomResponse response = new RoomResponse();
        response.setRoomId(room.getRoomId());
        response.setRoomCode(room.getRoomCode());
        response.setRoomName(room.getRoomName());
        response.setRoomType(room.getRoomType());
        response.setIsActive(room.getIsActive());
        response.setCreatedAt(room.getCreatedAt());

        return response;
    }

    /**
     * Convert CreateRoomRequest to Room entity
     */
    public Room toEntity(CreateRoomRequest request) {
        if (request == null) {
            return null;
        }

        Room room = new Room();
        room.setRoomCode(request.getRoomCode());
        room.setRoomName(request.getRoomName());
        room.setRoomType(request.getRoomType());
        room.setIsActive(true);

        return room;
    }
}
