package com.dental.clinic.management.booking_appointment.service;

import com.dental.clinic.management.booking_appointment.domain.Room;
import com.dental.clinic.management.booking_appointment.dto.request.CreateRoomRequest;
import com.dental.clinic.management.booking_appointment.dto.request.UpdateRoomRequest;
import com.dental.clinic.management.booking_appointment.dto.request.UpdateRoomServicesRequest;
import com.dental.clinic.management.booking_appointment.dto.response.CompatibleServiceDTO;
import com.dental.clinic.management.booking_appointment.dto.response.RoomResponse;
import com.dental.clinic.management.booking_appointment.dto.response.RoomServicesResponse;
import com.dental.clinic.management.booking_appointment.mapper.RoomMapper;
import com.dental.clinic.management.booking_appointment.repository.BookingDentalServiceRepository;
import com.dental.clinic.management.booking_appointment.repository.RoomRepository;
import com.dental.clinic.management.booking_appointment.repository.RoomServiceRepository;
import com.dental.clinic.management.exception.DuplicateResourceException;
import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.utils.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing rooms
 */
@Service
@RequiredArgsConstructor
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;
    private final IdGenerator idGenerator;
    private final RoomServiceRepository roomServiceRepository;
    private final BookingDentalServiceRepository dentalServiceRepository;

    /**
     * Inject IdGenerator into Room entity after bean creation
     */
    @PostConstruct
    public void init() {
        Room.setIdGenerator(idGenerator);
        log.info("IdGenerator injected into Room entity");
    }

    /**
     * Get all rooms with pagination and filters
     * Supports filtering by: isActive, roomType, keyword (search by code or name)
     */
    @Transactional(readOnly = true)
    public Page<RoomResponse> getAllRooms(
            int page,
            int size,
            String sortBy,
            String sortDirection,
            Boolean isActive,
            String roomType,
            String keyword) {

        log.debug(
                "Request to get all rooms - page: {}, size: {}, sortBy: {}, sortDirection: {}, isActive: {}, roomType: {}, keyword: {}",
                page, size, sortBy, sortDirection, isActive, roomType, keyword);

        // Validate inputs
        page = Math.max(0, page);
        size = (size <= 0 || size > 100) ? 10 : size;

        Sort.Direction direction = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // If no filters, return all
        if (isActive == null && roomType == null && (keyword == null || keyword.trim().isEmpty())) {
            return roomRepository.findAll(pageable).map(roomMapper::toResponse);
        }

        // Apply filters based on priority
        Page<Room> rooms;

        if (keyword != null && !keyword.trim().isEmpty()) {
            // Search by keyword (highest priority)
            if (isActive != null) {
                if (isActive) {
                    rooms = roomRepository.searchActiveByCodeOrName(keyword, pageable);
                } else {
                    // Search inactive rooms: Need custom query
                    rooms = roomRepository.searchInactiveByCodeOrName(keyword, pageable);
                }
            } else {
                rooms = roomRepository.searchByCodeOrName(keyword, pageable);
            }
        } else if (roomType != null && !roomType.trim().isEmpty()) {
            // Filter by room type
            if (isActive != null) {
                rooms = roomRepository.findByRoomTypeAndIsActive(roomType, isActive, pageable);
            } else {
                rooms = roomRepository.findByRoomType(roomType, pageable);
            }
        } else if (isActive != null) {
            // Filter by isActive only
            rooms = roomRepository.findByIsActive(isActive, pageable);
        } else {
            // No filters - return all
            rooms = roomRepository.findAll(pageable);
        }

        return rooms.map(roomMapper::toResponse);
    }

    /**
     * Get all active rooms (no pagination, for dropdown/select options)
     */
    @Transactional(readOnly = true)
    public List<RoomResponse> getAllActiveRooms() {
        log.debug("Request to get all active rooms");

        return roomRepository.findByIsActiveTrue().stream()
                .map(roomMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get room by ID
     */
    @Transactional(readOnly = true)
    public RoomResponse getRoomById(String roomId) {
        log.debug("Request to get room by ID: {}", roomId);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Room not found with ID: " + roomId,
                        "room",
                        "notfound"));

        return roomMapper.toResponse(room);
    }

    /**
     * Get room by room code (business key)
     */
    @Transactional(readOnly = true)
    public RoomResponse getRoomByCode(String roomCode) {
        log.debug("Request to get room by code: {}", roomCode);

        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Room not found with code: " + roomCode,
                        "room",
                        "notfound"));

        return roomMapper.toResponse(room);
    }

    /**
     * Create a new room
     */
    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        log.debug("Request to create room: {}", request);

        // Check if room code already exists
        if (roomRepository.existsByRoomCode(request.getRoomCode())) {
            throw new DuplicateResourceException(
                    "ROOM_CODE_EXISTS",
                    "Room code already exists: " + request.getRoomCode());
        }

        Room room = roomMapper.toEntity(request);
        room = roomRepository.save(room);

        log.info("Created room with ID: {} and code: {}", room.getRoomId(), room.getRoomCode());

        return roomMapper.toResponse(room);
    }

    /**
     * Update a room
     */
    @Transactional
    public RoomResponse updateRoom(String roomId, UpdateRoomRequest request) {
        log.debug("Request to update room ID: {} with data: {}", roomId, request);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ROOM_NOT_FOUND",
                        "Room not found with ID: " + roomId));

        // Check if new room code already exists (and it's not the current room)
        if (request.getRoomCode() != null &&
                !request.getRoomCode().equals(room.getRoomCode()) &&
                roomRepository.existsByRoomCode(request.getRoomCode())) {
            throw new DuplicateResourceException(
                    "ROOM_CODE_EXISTS",
                    "Room code already exists: " + request.getRoomCode());
        }

        // Update fields if provided
        if (request.getRoomCode() != null) {
            room.setRoomCode(request.getRoomCode());
        }
        if (request.getRoomName() != null) {
            room.setRoomName(request.getRoomName());
        }
        if (request.getRoomType() != null) {
            room.setRoomType(request.getRoomType());
        }
        if (request.getIsActive() != null) {
            room.setIsActive(request.getIsActive());
        }

        room = roomRepository.save(room);

        log.info("Updated room with ID: {}", roomId);

        return roomMapper.toResponse(room);
    }

    /**
     * Delete a room (soft delete by setting isActive = false)
     */
    @Transactional
    public void deleteRoom(String roomId) {
        log.debug("Request to delete room ID: {}", roomId);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ROOM_NOT_FOUND",
                        "Room not found with ID: " + roomId));

        room.setIsActive(false);
        roomRepository.save(room);

        log.info("Soft deleted room with ID: {}", roomId);
    }

    /**
     * Permanently delete a room (hard delete)
     */
    @Transactional
    public void permanentlyDeleteRoom(String roomId) {
        log.debug("Request to permanently delete room ID: {}", roomId);

        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException(
                    "ROOM_NOT_FOUND",
                    "Room not found with ID: " + roomId);
        }

        roomRepository.deleteById(roomId);

        log.info("Permanently deleted room with ID: {}", roomId);
    }

    /**
     * Get all services compatible with a room (P1.5)
     * Returns list of services that can be performed in this room
     *
     * @param roomCode The business key of the room (e.g., "P-01", "GHE-01")
     * @return RoomServicesResponse containing room details and compatible services
     */
    @Transactional(readOnly = true)
    public RoomServicesResponse getRoomServices(String roomCode) {
        log.debug("Request to get services for room code: {}", roomCode);

        // Find room by code
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ROOM_NOT_FOUND",
                        "Room not found with code: " + roomCode));

        // Get all room-service mappings for this room
        List<com.dental.clinic.management.booking_appointment.domain.RoomService> roomServices = roomServiceRepository
                .findByIdRoomId(room.getRoomId());

        // Map to CompatibleServiceDTO
        List<CompatibleServiceDTO> compatibleServices = roomServices.stream()
                .map(rs -> CompatibleServiceDTO.builder()
                        .serviceId(rs.getService().getServiceId().longValue())
                        .serviceCode(rs.getService().getServiceCode())
                        .serviceName(rs.getService().getServiceName())
                        .price(rs.getService().getPrice())
                        .build())
                .collect(Collectors.toList());

        log.info("Found {} compatible services for room: {}", compatibleServices.size(), roomCode);

        return RoomServicesResponse.builder()
                .roomId(room.getRoomId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .compatibleServices(compatibleServices)
                .build();
    }

    /**
     * Update services for a room (P1.6)
     * Replaces all existing room-service mappings with new ones
     *
     * @param roomCode The business key of the room
     * @param request  Contains list of service codes to assign
     * @return Updated RoomServicesResponse
     */
    @Transactional
    public RoomServicesResponse updateRoomServices(String roomCode, UpdateRoomServicesRequest request) {
        log.debug("Request to update services for room code: {} with {} services",
                roomCode, request.getServiceCodes().size());

        // 1. Validate room exists
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ROOM_NOT_FOUND",
                        "Room not found with code: " + roomCode));

        // 2. Validate all serviceCodes exist
        List<com.dental.clinic.management.booking_appointment.domain.DentalService> services = dentalServiceRepository
                .findByServiceCodeIn(request.getServiceCodes());

        if (services.size() != request.getServiceCodes().size()) {
            // Find missing codes
            List<String> foundCodes = services.stream()
                    .map(com.dental.clinic.management.booking_appointment.domain.DentalService::getServiceCode)
                    .collect(Collectors.toList());

            List<String> missingCodes = request.getServiceCodes().stream()
                    .filter(code -> !foundCodes.contains(code))
                    .collect(Collectors.toList());

            throw new ResourceNotFoundException(
                    "SERVICE_NOT_FOUND",
                    "Service(s) not found with code(s): " + String.join(", ", missingCodes));
        }

        // 3. Validate all services are active
        List<com.dental.clinic.management.booking_appointment.domain.DentalService> inactiveServices = services.stream()
                .filter(s -> !s.getIsActive())
                .collect(Collectors.toList());

        if (!inactiveServices.isEmpty()) {
            List<String> inactiveCodes = inactiveServices.stream()
                    .map(com.dental.clinic.management.booking_appointment.domain.DentalService::getServiceCode)
                    .collect(Collectors.toList());

            throw new BadRequestAlertException(
                    "Cannot assign inactive service(s): " + String.join(", ", inactiveCodes),
                    "service",
                    "inactive");
        }

        // 4. Delete all existing room-service mappings for this room
        roomServiceRepository.deleteByIdRoomId(room.getRoomId());
        roomServiceRepository.flush(); // Ensure delete is executed before insert

        // 5. Create new room-service mappings
        List<com.dental.clinic.management.booking_appointment.domain.RoomService> newRoomServices = services.stream()
                .map(service -> new com.dental.clinic.management.booking_appointment.domain.RoomService(room, service))
                .collect(Collectors.toList());

        roomServiceRepository.saveAll(newRoomServices);

        log.info("Updated room {} with {} services", roomCode, services.size());

        // 6. Return updated response
        return getRoomServices(roomCode);
    }
}
