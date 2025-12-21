package com.dental.clinic.management.booking_appointment.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Room information response")
public class RoomResponse {

    @Schema(description = "Room ID", example = "GHE001")
    private String roomId;

    @Schema(description = "Room code", example = "P1")
    private String roomCode;

    @Schema(description = "Room name", example = "Phòng 01")
    private String roomName;

    @Schema(description = "Room type", example = "STANDARD")
    private String roomType;

    @Schema(description = "Is room active", example = "true")
    private Boolean isActive;

    @Schema(description = "Created timestamp", example = "2025-10-27T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Updated timestamp", example = "2025-10-27T10:00:00")
    private LocalDateTime updatedAt;
}
