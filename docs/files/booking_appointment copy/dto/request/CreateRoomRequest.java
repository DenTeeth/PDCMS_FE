package com.dental.clinic.management.booking_appointment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new room")
public class CreateRoomRequest {

    @SuppressWarnings("deprecation")
    @NotBlank(message = "Room code is required")
    @Size(max = 20, message = "Room code must not exceed 20 characters")
    @Schema(description = "Unique room code", example = "P1", required = true)
    private String roomCode;

    @SuppressWarnings("deprecation")
    @NotBlank(message = "Room name is required")
    @Size(max = 100, message = "Room name must not exceed 100 characters")
    @Schema(description = "Room name", example = "Phòng 01", required = true)
    private String roomName;

    @Size(max = 50, message = "Room type must not exceed 50 characters")
    @Schema(description = "Room type", example = "STANDARD", allowableValues = { "STANDARD", "XRAY", "IMPLANT" })
    private String roomType;
}
