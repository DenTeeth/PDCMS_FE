
package com.dental.clinic.management.patient.dto.request;


import com.dental.clinic.management.employee.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;


import java.time.LocalDate;

/**
 * DTO for creating a new patient
 *
 * FLOW 1: Patient CÓ ACCOUNT (có thể đăng nhập)
 * - Cung cấp: username, password + thông tin patient
 * - System tạo account + patient
 *
 * FLOW 2: Patient KHÔNG ACCOUNT (chỉ lưu hồ sơ)
 * - Không cung cấp username/password
 * - System chỉ tạo patient (không tạo account)
 */
public class CreatePatientRequest {

    // ===== ACCOUNT FIELDS (Optional - nếu muốn patient đăng nhập) =====

    /**
     * Username for patient account (optional)
     * Nếu cung cấp username → cần cả password và email
     */
    @Size(max = 50)
    private String username;

    /**
     * Password for patient account (optional)
     * Bắt buộc nếu có username
     */
    @Size(min = 8, max = 100)
    private String password;

    // ===== PATIENT FIELDS =====

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @Email
    @Size(max = 100)
    private String email;

    @Pattern(regexp = "^[0-9]{10,15}$")
    private String phone;

    @Past
    private LocalDate dateOfBirth;

    @Size(max = 500)
    private String address;

    private Gender gender;

    @Size(max = 1000)
    private String medicalHistory;

    @Size(max = 500)
    private String allergies;

    @Size(max = 100)
    private String emergencyContactName;

    @Pattern(regexp = "^[0-9]{10,15}$")
    private String emergencyContactPhone;

    // Constructors
    public CreatePatientRequest() {
    }

    public CreatePatientRequest(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public String getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(String medicalHistory) {
        this.medicalHistory = medicalHistory;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public void setEmergencyContactPhone(String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
    }

    @Override
    public String toString() {
        return "CreatePatientRequest{" +
                "firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", gender='" + gender + '\'' +
                '}';
    }
}
