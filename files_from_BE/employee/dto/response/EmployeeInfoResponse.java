
package com.dental.clinic.management.employee.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

import com.dental.clinic.management.employee.enums.EmploymentType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for Employee information.
 *
 * This class represents the response structure for employee data
 * returned by the API, including personal information, role details,
 * specializations, and associated account information.
 *
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeInfoResponse {

  private Integer employeeId;
  private String employeeCode;
  private String firstName;
  private String lastName;
  private String fullName;
  private EmploymentType employeeType;
  private String phone;
  private LocalDate dateOfBirth;
  private String address;
  private String roleId;
  private String roleName;
  private Set<SpecializationResponse> specializations;
  private Boolean isActive;
  private LocalDateTime createdAt;
  private AccountInfoResponse account;

  /**
   * Response DTO for Specialization information.
   */
  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationResponse {
    private Integer specializationId;
    private String name;
    private String description;
  }

  /**
   * Response DTO for Account basic information.
   */
  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AccountInfoResponse {
    private Integer accountId;
    private String accountCode;
    private String username;
    private String email;
    private String status;
  }
}
