package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.exception.validation.DuplicateTypeCodeException;
import com.dental.clinic.management.exception.time_off.TimeOffTypeInUseException;
import com.dental.clinic.management.exception.time_off.TimeOffTypeNotFoundException;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.working_schedule.domain.TimeOffType;
import com.dental.clinic.management.working_schedule.dto.request.CreateTimeOffTypeRequest;
import com.dental.clinic.management.working_schedule.dto.request.UpdateTimeOffTypeRequest;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffTypeResponse;
import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;
import com.dental.clinic.management.working_schedule.mapper.TimeOffTypeMapper;
import com.dental.clinic.management.working_schedule.repository.TimeOffRequestRepository;
import com.dental.clinic.management.working_schedule.repository.TimeOffTypeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing time-off types
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TimeOffTypeService {

    private final TimeOffTypeRepository typeRepository;
    private final TimeOffRequestRepository requestRepository;
    private final TimeOffTypeMapper typeMapper;
    private final IdGenerator idGenerator;

    /**
     * GET /api/v1/time-off-types
     * Lấy danh sách tất cả các loại hình nghỉ phép đang hoạt động
     */
    public List<TimeOffTypeResponse> getActiveTimeOffTypes() {
        log.debug("Request to get all active time-off types");

        return typeRepository.findByIsActiveTrue()
                .stream()
                .map(typeMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/v1/admin/time-off-types
     * Lấy tất cả loại nghỉ phép (bao gồm inactive) - Admin view
     * 
     * @param isActive filter by active status (null = all, true = active only, false = inactive only)
     * @param isPaid filter by paid status (null = all, true = paid only, false = unpaid only)
     */
    public List<TimeOffTypeResponse> getAllTimeOffTypes(Boolean isActive, Boolean isPaid) {
        log.debug("Admin request to get all time-off types, isActive={}, isPaid={}", isActive, isPaid);

        List<TimeOffType> types;
        
        // Apply filters
        if (isActive == null && isPaid == null) {
            // No filters - get all
            types = typeRepository.findAll();
        } else if (isActive != null && isPaid != null) {
            // Both filters
            types = typeRepository.findByIsActiveAndIsPaid(isActive, isPaid);
        } else if (isActive != null) {
            // Only isActive filter
            types = typeRepository.findByIsActive(isActive);
        } else {
            // Only isPaid filter
            types = typeRepository.findByIsPaid(isPaid);
        }

        return types.stream()
                .map(typeMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/v1/admin/time-off-types/{typeId}
     * Lấy chi tiết một loại nghỉ phép
     */
    public TimeOffTypeResponse getTimeOffTypeById(String typeId) {
        log.debug("Request to get time-off type by ID: {}", typeId);

        TimeOffType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new TimeOffTypeNotFoundException(typeId));

        return typeMapper.toResponse(type);
    }

    /**
     * POST /api/v1/admin/time-off-types
     * Tạo loại nghỉ phép mới
     */
    @Transactional
    public TimeOffTypeResponse createTimeOffType(CreateTimeOffTypeRequest request) {
        log.debug("Request to create time-off type: {}", request.getTypeCode());

        // Validate unique type_code
        if (typeRepository.existsByTypeCode(request.getTypeCode())) {
            throw new DuplicateTypeCodeException(request.getTypeCode());
        }

        // Validate logic: requiresBalance và defaultDaysPerYear phải match
        validateBalanceAndDefaultDays(request.getRequiresBalance(), request.getDefaultDaysPerYear());

        String typeId = idGenerator.generateId("TOT");

        TimeOffType type = TimeOffType.builder()
                .typeId(typeId)
                .typeCode(request.getTypeCode())
                .typeName(request.getTypeName())
                .description(request.getDescription())
                .requiresBalance(request.getRequiresBalance())
                .defaultDaysPerYear(request.getDefaultDaysPerYear())
                .isPaid(request.getIsPaid())
                .requiresApproval(request.getRequiresApproval() != null ? request.getRequiresApproval() : true)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        TimeOffType saved = typeRepository.save(type);
        log.info("Created time-off type: {}", saved.getTypeId());

        return typeMapper.toResponse(saved);
    }

    /**
     * PATCH /api/v1/admin/time-off-types/{typeId}
     * Cập nhật loại nghỉ phép
     */
    @Transactional
    public TimeOffTypeResponse updateTimeOffType(String typeId, UpdateTimeOffTypeRequest request) {
        log.debug("Request to update time-off type: {}", typeId);

        TimeOffType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new TimeOffTypeNotFoundException(typeId));

        // Update type_code if provided and different
        if (request.getTypeCode() != null && !request.getTypeCode().equals(type.getTypeCode())) {
            // Check unique (excluding current type)
            if (typeRepository.existsByTypeCodeAndTypeIdNot(request.getTypeCode(), typeId)) {
                throw new DuplicateTypeCodeException(request.getTypeCode());
            }
            type.setTypeCode(request.getTypeCode());
        }

        if (request.getTypeName() != null) {
            type.setTypeName(request.getTypeName());
        }

        if (request.getDescription() != null) {
            type.setDescription(request.getDescription());
        }

        if (request.getRequiresBalance() != null) {
            type.setRequiresBalance(request.getRequiresBalance());
        }

        if (request.getDefaultDaysPerYear() != null) {
            type.setDefaultDaysPerYear(request.getDefaultDaysPerYear());
        }

        if (request.getIsPaid() != null) {
            type.setIsPaid(request.getIsPaid());
        }

        if (request.getRequiresApproval() != null) {
            type.setRequiresApproval(request.getRequiresApproval());
        }

        if (request.getIsActive() != null) {
            type.setIsActive(request.getIsActive());
        }

        // Validate logic AFTER all updates: requiresBalance và defaultDaysPerYear phải match
        validateBalanceAndDefaultDays(type.getRequiresBalance(), type.getDefaultDaysPerYear());

        TimeOffType updated = typeRepository.save(type);
        log.info("Updated time-off type: {}", typeId);

        return typeMapper.toResponse(updated);
    }

    /**
     * Helper method: Validate requiresBalance và defaultDaysPerYear logic
     * 
     * Business Rules:
     * - requiresBalance = true  → defaultDaysPerYear PHẢI có giá trị (để dùng cho annual reset)
     * - requiresBalance = false → defaultDaysPerYear PHẢI null (vì không cần balance tracking)
     */
    private void validateBalanceAndDefaultDays(Boolean requiresBalance, Double defaultDaysPerYear) {
        // Case 1: requiresBalance = true VÀ defaultDaysPerYear = null
        if (Boolean.TRUE.equals(requiresBalance) && defaultDaysPerYear == null) {
            throw new BadRequestAlertException(
                "Loại nghỉ phép cần balance tracking (requiresBalance = true) PHẢI có defaultDaysPerYear để sử dụng cho annual reset. " +
                "Vui lòng set defaultDaysPerYear (ví dụ: 12.0 cho 12 ngày phép/năm).",
                "TimeOffType",
                "MISSING_DEFAULT_DAYS"
            );
        }

        // Case 2: requiresBalance = false VÀ defaultDaysPerYear != null
        if (Boolean.FALSE.equals(requiresBalance) && defaultDaysPerYear != null) {
            throw new BadRequestAlertException(
                "Loại nghỉ phép không cần balance tracking (requiresBalance = false) KHÔNG thể có defaultDaysPerYear. " +
                "Field defaultDaysPerYear chỉ dùng cho các loại nghỉ phép cần check số dư (requiresBalance = true). " +
                "Vui lòng set defaultDaysPerYear = null.",
                "TimeOffType",
                "INVALID_DEFAULT_DAYS"
            );
        }
    }

    /**
     * DELETE /api/v1/admin/time-off-types/{typeId}
     * Vô hiệu hóa/Kích hoạt lại loại nghỉ phép (soft delete)
     */
    @Transactional
    public TimeOffTypeResponse toggleTimeOffTypeActive(String typeId) {
        log.debug("Request to toggle time-off type active status: {}", typeId);

        TimeOffType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new TimeOffTypeNotFoundException(typeId));

        // If deactivating, check for pending requests
        if (type.getIsActive()) {
            boolean hasPendingRequests = requestRepository
                    .existsByTimeOffTypeIdAndStatus(typeId, TimeOffStatus.PENDING);

            if (hasPendingRequests) {
                throw new TimeOffTypeInUseException(typeId);
            }
        }

        // Toggle status
        type.setIsActive(!type.getIsActive());
        TimeOffType updated = typeRepository.save(type);

        log.info("Toggled time-off type {} to is_active={}", typeId, updated.getIsActive());

        return typeMapper.toResponse(updated);
    }
}
