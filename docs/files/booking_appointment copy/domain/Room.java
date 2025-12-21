package com.dental.clinic.management.booking_appointment.domain;

import java.time.LocalDateTime;

import com.dental.clinic.management.utils.IdGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;

/**
 * Room entity - Represents a room/chair in the dental clinic.
 * This is a physical resource used for treatments and appointments.
 */
@Entity
@Table(name = "rooms")
public class Room {

    @Transient
    private static IdGenerator idGenerator;

    @Id
    @Column(name = "room_id", length = 50)
    private String roomId;

    @NotBlank(message = "Room code cannot be blank")
    @Column(name = "room_code", unique = true, nullable = false, length = 20)
    private String roomCode;

    @NotBlank(message = "Room name cannot be blank")
    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;

    @Column(name = "room_type", length = 50)
    private String roomType; // VD: STANDARD, XRAY, IMPLANT (nullable)

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Setter for IdGenerator (will be injected via service layer)
    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @PrePersist
    protected void onCreate() {
        if (roomId == null && idGenerator != null) {
            roomId = idGenerator.generateId("GHE");
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    // Constructors
    public Room() {
    }

    public Room(String roomCode, String roomName, String roomType) {
        this.roomCode = roomCode;
        this.roomName = roomName;
        this.roomType = roomType;
        this.isActive = true;
    }

    // Getters and Setters
    public static IdGenerator getIdGenerator() {
        return idGenerator;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Room))
            return false;
        Room room = (Room) o;
        return roomId != null && roomId.equals(room.getRoomId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // toString
    @Override
    public String toString() {
        return "Room{" +
                "roomId='" + roomId + '\'' +
                ", roomCode='" + roomCode + '\'' +
                ", roomName='" + roomName + '\'' +
                ", roomType='" + roomType + '\'' +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                '}';
    }
}
