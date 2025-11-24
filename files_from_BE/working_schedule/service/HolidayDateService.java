package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.working_schedule.domain.HolidayDate;
import com.dental.clinic.management.working_schedule.domain.HolidayDateId;
import com.dental.clinic.management.working_schedule.dto.request.HolidayDateRequest;
import com.dental.clinic.management.working_schedule.dto.response.HolidayDateResponse;
import com.dental.clinic.management.working_schedule.mapper.HolidayDateMapper;
import com.dental.clinic.management.working_schedule.repository.HolidayDateRepository;
import com.dental.clinic.management.working_schedule.repository.HolidayDefinitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing holiday dates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HolidayDateService {

    private final HolidayDateRepository holidayDateRepository;
    private final HolidayDefinitionRepository holidayDefinitionRepository;
    private final HolidayDateMapper holidayDateMapper;

    /**
     * Create a new holiday date.
     */
    public HolidayDateResponse createHolidayDate(HolidayDateRequest request) {
        log.info("Creating holiday date: {} for definition: {}", 
                 request.getHolidayDate(), request.getDefinitionId());

        // Validate that definition exists
        holidayDefinitionRepository.findById(request.getDefinitionId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "HOLIDAY_DEFINITION_NOT_FOUND",
                "Holiday definition not found with ID: " + request.getDefinitionId()));

        // Check if this date already exists for this definition
        HolidayDateId id = new HolidayDateId(request.getHolidayDate(), request.getDefinitionId());
        if (holidayDateRepository.existsById(id)) {
            throw new com.dental.clinic.management.exception.holiday.DuplicateHolidayDateException(
                request.getHolidayDate(), request.getDefinitionId());
        }

        HolidayDate holidayDate = holidayDateMapper.toEntity(request);
        HolidayDate savedDate = holidayDateRepository.save(holidayDate);

        log.info("Holiday date created successfully: {}", savedDate.getHolidayDate());
        return holidayDateMapper.toResponse(savedDate);
    }

    /**
     * Get all holiday dates.
     */
    @Transactional(readOnly = true)
    public List<HolidayDateResponse> getAllHolidayDates() {
        log.info("Fetching all holiday dates");
        
        return holidayDateRepository.findAll()
            .stream()
            .map(holidayDateMapper::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get holiday dates by definition ID.
     */
    @Transactional(readOnly = true)
    public List<HolidayDateResponse> getHolidayDatesByDefinition(String definitionId) {
        log.info("Fetching holiday dates for definition: {}", definitionId);

        // Validate that definition exists
        if (!holidayDefinitionRepository.existsById(definitionId)) {
            throw new ResourceNotFoundException(
                "HOLIDAY_DEFINITION_NOT_FOUND",
                "Holiday definition not found with ID: " + definitionId);
        }

        return holidayDateRepository.findByDefinitionId(definitionId)
            .stream()
            .map(holidayDateMapper::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get holiday dates within a date range.
     */
    @Transactional(readOnly = true)
    public List<HolidayDateResponse> getHolidayDatesByRange(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching holiday dates between {} and {}", startDate, endDate);

        // Validate date range
        if (startDate.isAfter(endDate)) {
            throw new com.dental.clinic.management.exception.holiday.InvalidDateRangeException(
                startDate, endDate);
        }

        return holidayDateRepository.findByDateRange(startDate, endDate)
            .stream()
            .map(holidayDateMapper::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get a specific holiday date.
     */
    @Transactional(readOnly = true)
    public HolidayDateResponse getHolidayDate(LocalDate holidayDate, String definitionId) {
        log.info("Fetching holiday date: {} for definition: {}", holidayDate, definitionId);

        HolidayDateId id = new HolidayDateId(holidayDate, definitionId);
        HolidayDate date = holidayDateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "HOLIDAY_DATE_NOT_FOUND",
                "Holiday date not found: " + holidayDate + " for definition: " + definitionId));

        return holidayDateMapper.toResponse(date);
    }

    /**
     * Update a holiday date (only description can be updated).
     */
    public HolidayDateResponse updateHolidayDate(
            LocalDate holidayDate, String definitionId, HolidayDateRequest request) {
        
        log.info("Updating holiday date: {} for definition: {}", holidayDate, definitionId);

        HolidayDateId id = new HolidayDateId(holidayDate, definitionId);
        HolidayDate date = holidayDateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "HOLIDAY_DATE_NOT_FOUND",
                "Holiday date not found: " + holidayDate + " for definition: " + definitionId));

        holidayDateMapper.updateEntity(date, request);
        HolidayDate updatedDate = holidayDateRepository.save(date);

        log.info("Holiday date updated successfully: {}", holidayDate);
        return holidayDateMapper.toResponse(updatedDate);
    }

    /**
     * Delete a holiday date.
     */
    public void deleteHolidayDate(LocalDate holidayDate, String definitionId) {
        log.info("Deleting holiday date: {} for definition: {}", holidayDate, definitionId);

        HolidayDateId id = new HolidayDateId(holidayDate, definitionId);
        if (!holidayDateRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                "HOLIDAY_DATE_NOT_FOUND",
                "Holiday date not found: " + holidayDate + " for definition: " + definitionId);
        }

        holidayDateRepository.deleteById(id);

        log.info("Holiday date deleted: {}", holidayDate);
    }

    /**
     * Check if a specific date is a holiday.
     */
    @Transactional(readOnly = true)
    public boolean isHoliday(LocalDate date) {
        return holidayDateRepository.isHoliday(date);
    }
}
