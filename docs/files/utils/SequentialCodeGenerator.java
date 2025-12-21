package com.dental.clinic.management.utils;

import org.springframework.stereotype.Component;

/**
 * Utility class for generating sequential codes based on entity IDs.
 * Format: PREFIX### where ### is the entity's auto-increment ID
 * 
 * Example: ACC001 (for account with ID=1), EMP150 (for employee with ID=150)
 * 
 * This approach ensures codes are consistent with database IDs and don't 
 * require separate counter management.
 */
@Component
public class SequentialCodeGenerator {
    
    /**
     * Generate a code based on the entity's ID
     * 
     * @param prefix The prefix for the code (e.g., "ACC", "EMP", "PAT")
     * @param id The entity's auto-increment ID
     * @return Generated code in format PREFIX### (e.g., ACC001, EMP002, PAT150)
     */
    public String generateCode(String prefix, Integer id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("ID must be a positive integer");
        }
        
        // Format: PREFIX### (e.g., ACC001, EMP002)
        // Using 3 digits with leading zeros for IDs up to 999
        // For IDs >= 1000, it will naturally expand (e.g., ACC1000)
        return String.format("%s%03d", prefix, id);
    }
    
    /**
     * Generate account code from account ID
     * 
     * @param accountId The account's ID
     * @return Account code (e.g., ACC001)
     */
    public String generateAccountCode(Integer accountId) {
        return generateCode("ACC", accountId);
    }
    
    /**
     * Generate employee code from employee ID
     * 
     * @param employeeId The employee's ID
     * @return Employee code (e.g., EMP001)
     */
    public String generateEmployeeCode(Integer employeeId) {
        return generateCode("EMP", employeeId);
    }
    
    /**
     * Generate patient code from patient ID
     * 
     * @param patientId The patient's ID
     * @return Patient code (e.g., PAT001)
     */
    public String generatePatientCode(Integer patientId) {
        return generateCode("PAT", patientId);
    }
}
