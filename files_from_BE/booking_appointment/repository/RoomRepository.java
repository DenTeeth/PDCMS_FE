package com.dental.clinic.management.booking_appointment.repository;

import com.dental.clinic.management.booking_appointment.domain.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the Room entity.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

       /**
        * Find room by room code
        */
       Optional<Room> findByRoomCode(String roomCode);

       /**
        * Check if room code exists
        */
       boolean existsByRoomCode(String roomCode);

       /**
        * Find all active rooms (no pagination, for dropdowns)
        */
       List<Room> findByIsActiveTrue();

       /**
        * Find all active rooms (with pagination)
        */
       Page<Room> findByIsActiveTrue(Pageable pageable);

       /**
        * Find rooms by active status (with pagination)
        */
       Page<Room> findByIsActive(Boolean isActive, Pageable pageable);

       /**
        * Find rooms by type
        */
       List<Room> findByRoomType(String roomType);

       /**
        * Find rooms by type (with pagination)
        */
       Page<Room> findByRoomType(String roomType, Pageable pageable);

       /**
        * Find active rooms by type
        */
       List<Room> findByRoomTypeAndIsActiveTrue(String roomType);

       /**
        * Find active rooms by type (with pagination)
        */
       Page<Room> findByRoomTypeAndIsActiveTrue(String roomType, Pageable pageable);

       /**
        * Find rooms by type and active status (with pagination)
        */
       Page<Room> findByRoomTypeAndIsActive(String roomType, Boolean isActive, Pageable pageable);

       /**
        * Search rooms by code or name (case-insensitive)
        */
       @Query("SELECT r FROM Room r WHERE " +
                     "LOWER(r.roomCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(r.roomName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
       List<Room> searchByCodeOrName(String keyword);

       /**
        * Search rooms by code or name (with pagination)
        */
       @Query("SELECT r FROM Room r WHERE " +
                     "LOWER(r.roomCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(r.roomName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
       Page<Room> searchByCodeOrName(String keyword, Pageable pageable);

       /**
        * Search active rooms by code or name
        */
       @Query("SELECT r FROM Room r WHERE r.isActive = true AND (" +
                     "LOWER(r.roomCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(r.roomName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
       List<Room> searchActiveByCodeOrName(String keyword);

       /**
        * Search active rooms by code or name (with pagination)
        */
       @Query("SELECT r FROM Room r WHERE r.isActive = true AND (" +
                     "LOWER(r.roomCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(r.roomName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
       Page<Room> searchActiveByCodeOrName(String keyword, Pageable pageable);

       /**
        * Search inactive rooms by code or name (with pagination)
        */
       @Query("SELECT r FROM Room r WHERE r.isActive = false AND (" +
                     "LOWER(r.roomCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(r.roomName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
       Page<Room> searchInactiveByCodeOrName(String keyword, Pageable pageable);

       /**
        * Find rooms by list of room IDs (for appointment availability)
        */
       List<Room> findByRoomIdIn(List<String> roomIds);

       /**
        * Find active rooms by list of room IDs (for appointment availability)
        */
       List<Room> findByRoomIdInAndIsActiveTrue(List<String> roomIds);
}
