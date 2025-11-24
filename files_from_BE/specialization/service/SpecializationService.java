package com.dental.clinic.management.specialization.service;

import com.dental.clinic.management.specialization.domain.Specialization;
import com.dental.clinic.management.specialization.repository.SpecializationRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN;
import static com.dental.clinic.management.utils.security.AuthoritiesConstants.VIEW_SPECIALIZATION;

import java.util.List;

@Service
@Transactional
public class SpecializationService {

    private final SpecializationRepository specializationRepository;

    public SpecializationService(SpecializationRepository specializationRepository) {
        this.specializationRepository = specializationRepository;
    }

    /**
     * Get all active specializations
     *
     * @return List of active specializations
     */
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('" + VIEW_SPECIALIZATION + "')")
    @Transactional(readOnly = true)
    public List<Specialization> getAllActiveSpecializations() {
        return specializationRepository.findAllActiveSpecializations();
    }
}
