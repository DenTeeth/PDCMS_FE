package com.dental.clinic.management.config;

import org.springframework.context.annotation.Configuration;

import com.dental.clinic.management.contact_history.domain.ContactHistory;
import com.dental.clinic.management.customer_contact.domain.CustomerContact;
import com.dental.clinic.management.working_schedule.domain.EmployeeShiftRegistration;
import com.dental.clinic.management.working_schedule.domain.OvertimeRequest;
import com.dental.clinic.management.working_schedule.domain.ShiftRenewalRequest;
import com.dental.clinic.management.working_schedule.domain.TimeOffRequest;
import com.dental.clinic.management.utils.IdGenerator;

import jakarta.annotation.PostConstruct;

/**
 * Configuration class to inject IdGenerator into entity classes.
 * This is necessary because JPA entities cannot have constructor injection.
 *
 * Note: Only for entities using date-based ID format (CTC-YYMMDD-SEQ).
 * Entities using sequential codes (ACC001, EMP001, PAT001) use
 * SequentialCodeGenerator
 * in their service layer after entity is saved.
 */
@Configuration
public class EntityIdGeneratorConfig {

    private final IdGenerator idGenerator;

    public EntityIdGeneratorConfig(IdGenerator idGenerator) {
        this.idGenerator = idGenerator;
    }

    @PostConstruct
    public void configureEntities() {
        // Inject IdGenerator into static fields of entities that use date-based IDs
        CustomerContact.setIdGenerator(idGenerator);
        ContactHistory.setIdGenerator(idGenerator);
        EmployeeShiftRegistration.setIdGenerator(idGenerator);
        TimeOffRequest.setIdGenerator(idGenerator);
        OvertimeRequest.setIdGenerator(idGenerator);
        ShiftRenewalRequest.setIdGenerator(idGenerator);
    }
}
