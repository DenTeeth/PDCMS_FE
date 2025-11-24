package com.dental.clinic.management.employee.mapper;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.dto.response.EmployeeInfoResponse;
import com.dental.clinic.management.specialization.domain.Specialization;

@Component
public class EmployeeMapper {

  public EmployeeInfoResponse toEmployeeInfoResponse(Employee employee) {
    if (employee == null) {
      return null;
    }

    EmployeeInfoResponse response = new EmployeeInfoResponse();

    response.setEmployeeId(employee.getEmployeeId());
    response.setEmployeeCode(employee.getEmployeeCode());
    response.setFirstName(employee.getFirstName());
    response.setLastName(employee.getLastName());
    response.setFullName(employee.getFirstName() + " " + employee.getLastName());
    response.setEmployeeType(employee.getEmploymentType());
    response.setPhone(employee.getPhone());
    response.setDateOfBirth(employee.getDateOfBirth());
    response.setAddress(employee.getAddress());

    if (employee.getAccount() != null && employee.getAccount().getRole() != null) {
      response.setRoleId(employee.getAccount().getRole().getRoleId());
      response.setRoleName(employee.getAccount().getRole().getRoleName());
    }

    response.setIsActive(employee.getIsActive());
    response.setCreatedAt(employee.getCreatedAt());

    if (employee.getSpecializations() != null) {
      Set<EmployeeInfoResponse.SpecializationResponse> specializationResponses = employee.getSpecializations().stream()
          .map(this::toSpecializationResponse)
          .collect(Collectors.toSet());
      response.setSpecializations(specializationResponses);
    }

    if (employee.getAccount() != null) {
      EmployeeInfoResponse.AccountInfoResponse accountResponse = new EmployeeInfoResponse.AccountInfoResponse();
      accountResponse.setAccountId(employee.getAccount().getAccountId());
      accountResponse.setUsername(employee.getAccount().getUsername());
      accountResponse.setEmail(employee.getAccount().getEmail());
      accountResponse.setStatus(employee.getAccount().getStatus().name());
      response.setAccount(accountResponse);
    }

    return response;
  }

  public List<EmployeeInfoResponse> toEmployeeInfoResponseList(List<Employee> employees) {
    if (employees == null) {
      return null;
    }

    return employees.stream()
        .map(this::toEmployeeInfoResponse)
        .collect(Collectors.toList());
  }

  private EmployeeInfoResponse.SpecializationResponse toSpecializationResponse(Specialization specialization) {
    if (specialization == null) {
      return null;
    }

    EmployeeInfoResponse.SpecializationResponse response = new EmployeeInfoResponse.SpecializationResponse();
    response.setSpecializationId(specialization.getSpecializationId());
    response.setName(specialization.getSpecializationName());
    response.setDescription(specialization.getDescription());

    return response;
  }
}
