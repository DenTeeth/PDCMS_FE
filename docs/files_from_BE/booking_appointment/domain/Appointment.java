package com.dental.clinic.management.booking_appointment.domain;

import com.dental.clinic.management.booking_appointment.enums.AppointmentStatus;
import com.dental.clinic.management.utils.IdGenerator;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * Appointment Entity - Lịch hẹn trung tâm
 * Khóa tài nguyên: Bác sĩ chính + Ghế/Phòng
 *
 * Design Notes:
 * - Sử dụng INTEGER foreign keys để tương thích với schema hiện tại
 * - API layer sẽ nhận/trả codes (employeeCode, roomCode)
 * - Service layer resolve codes -> IDs trước khi persist
 */
@Entity
@Table(name = "appointments")
public class Appointment {

    @Transient
    private static IdGenerator idGenerator;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_id")
    private Integer appointmentId;

    @Column(name = "appointment_code", unique = true, nullable = false, length = 20)
    private String appointmentCode;

    /**
     * Foreign key to patients table
     * API nhận patientId (hoặc patientCode nếu cần)
     */
    @NotNull(message = "Patient ID is required")
    @Column(name = "patient_id", nullable = false)
    private Integer patientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, insertable = false, updatable = false)
    private com.dental.clinic.management.patient.domain.Patient patient;

    /**
     * Foreign key to employees table - Bác sĩ CHÍNH
     * API nhận employeeCode (String), service layer resolve -> employeeId
     */
    @NotNull(message = "Employee ID is required")
    @Column(name = "employee_id", nullable = false)
    private Integer employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, insertable = false, updatable = false)
    private com.dental.clinic.management.employee.domain.Employee employee;

    /**
     * Foreign key to rooms table - Ghế/Phòng CHÍNH
     * Schema: room_id VARCHAR(50) matching rooms.room_id
     * API nhận roomCode (String), service layer resolve -> roomId (String)
     */
    @NotNull(message = "Room ID is required")
    @Column(name = "room_id", nullable = false, length = 50)
    private String roomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, insertable = false, updatable = false)
    private Room room;

    @NotNull(message = "Appointment start time is required")
    @Column(name = "appointment_start_time", nullable = false)
    private LocalDateTime appointmentStartTime;

    @NotNull(message = "Appointment end time is required")
    @Column(name = "appointment_end_time", nullable = false)
    private LocalDateTime appointmentEndTime;

    @NotNull(message = "Expected duration is required")
    @Column(name = "expected_duration_minutes", nullable = false)
    private Integer expectedDurationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    /**
     * Self-referencing FK - appointment này được reschedule sang appointment nào
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rescheduled_to_appointment_id")
    private Appointment rescheduledToAppointment;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * FK to employees - Lễ tân tạo lịch hẹn này
     */
    @Column(name = "created_by", insertable = false, updatable = false)
    private Integer createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private com.dental.clinic.management.employee.domain.Employee createdByEmployee;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Setter for IdGenerator
    public static void setIdGenerator(IdGenerator generator) {
        idGenerator = generator;
    }

    @PrePersist
    protected void onCreate() {
        if (appointmentCode == null && idGenerator != null) {
            appointmentCode = idGenerator.generateId("APT");
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = AppointmentStatus.SCHEDULED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public Appointment() {
    }

    public Appointment(Integer patientId, Integer employeeId, String roomId,
            LocalDateTime startTime, LocalDateTime endTime,
            Integer expectedDuration) {
        this.patientId = patientId;
        this.employeeId = employeeId;
        this.roomId = roomId;
        this.appointmentStartTime = startTime;
        this.appointmentEndTime = endTime;
        this.expectedDurationMinutes = expectedDuration;
        this.status = AppointmentStatus.SCHEDULED;
    }

    // Getters and Setters
    public Integer getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Integer appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getAppointmentCode() {
        return appointmentCode;
    }

    public void setAppointmentCode(String appointmentCode) {
        this.appointmentCode = appointmentCode;
    }

    public Integer getPatientId() {
        return patientId;
    }

    public void setPatientId(Integer patientId) {
        this.patientId = patientId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public LocalDateTime getAppointmentStartTime() {
        return appointmentStartTime;
    }

    public void setAppointmentStartTime(LocalDateTime appointmentStartTime) {
        this.appointmentStartTime = appointmentStartTime;
    }

    public LocalDateTime getAppointmentEndTime() {
        return appointmentEndTime;
    }

    public void setAppointmentEndTime(LocalDateTime appointmentEndTime) {
        this.appointmentEndTime = appointmentEndTime;
    }

    public Integer getExpectedDurationMinutes() {
        return expectedDurationMinutes;
    }

    public void setExpectedDurationMinutes(Integer expectedDurationMinutes) {
        this.expectedDurationMinutes = expectedDurationMinutes;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public LocalDateTime getActualStartTime() {
        return actualStartTime;
    }

    public void setActualStartTime(LocalDateTime actualStartTime) {
        this.actualStartTime = actualStartTime;
    }

    public LocalDateTime getActualEndTime() {
        return actualEndTime;
    }

    public void setActualEndTime(LocalDateTime actualEndTime) {
        this.actualEndTime = actualEndTime;
    }

    public Integer getRescheduledToAppointmentId() {
        return rescheduledToAppointment != null ? rescheduledToAppointment.getAppointmentId() : null;
    }

    public void setRescheduledToAppointmentId(Integer rescheduledToAppointmentId) {
        // For backward compatibility - set the entity to null if rescheduledToAppointmentId is null
        if (rescheduledToAppointmentId == null) {
            this.rescheduledToAppointment = null;
        }
        // Entity will be loaded lazily when needed
    }

    public Appointment getRescheduledToAppointment() {
        return rescheduledToAppointment;
    }

    public void setRescheduledToAppointment(Appointment rescheduledToAppointment) {
        this.rescheduledToAppointment = rescheduledToAppointment;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Appointment))
            return false;
        Appointment that = (Appointment) o;
        return appointmentId != null && appointmentId.equals(that.getAppointmentId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Appointment{" +
                "appointmentId=" + appointmentId +
                ", appointmentCode='" + appointmentCode + '\'' +
                ", patientId=" + patientId +
                ", employeeId=" + employeeId +
                ", roomId=" + roomId +
                ", startTime=" + appointmentStartTime +
                ", status=" + status +
                '}';
    }
}
