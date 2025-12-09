package com.dental.clinic.management.booking_appointment.dto.availability;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for API 4.3: Available Resources (Rooms + Assistants)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableResourcesDTO {

    /**
     * Rooms that:
     * 1. Support all selected services (via room_services)
     * 2. Are not booked during the time range
     */
    private List<RoomBrief> availableRooms;

    /**
     * Assistants (employees with STANDARD specialization) who:
     * 1. Have shifts covering the time range
     * 2. Are not busy in other appointments
     */
    private List<AssistantBrief> availableAssistants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomBrief {
        private String roomCode;
        private String roomName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssistantBrief {
        private String employeeCode;
        private String fullName;
    }
}
