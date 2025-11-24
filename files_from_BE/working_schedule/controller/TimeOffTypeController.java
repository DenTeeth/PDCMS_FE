package com.dental.clinic.management.working_schedule.controller;

import com.dental.clinic.management.working_schedule.dto.response.TimeOffTypeResponse;
import com.dental.clinic.management.working_schedule.service.TimeOffTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for Time-Off Type Management
 */
@RestController
@RequestMapping("/api/v1/time-off-types")
@RequiredArgsConstructor
@Slf4j
public class TimeOffTypeController {

    private final TimeOffTypeService typeService;

    /**
     * GET /api/v1/time-off-types
     * Lấy danh sách tất cả các loại hình nghỉ phép đang hoạt động
     *
     * Authorization: Yêu cầu đã xác thực (authenticated user)
     *
     * Response:
     * - 200 OK: Trả về danh sách các loại hình nghỉ phép với is_active = true
     *
     * @return List of TimeOffTypeResponse
     */
    @GetMapping
    public ResponseEntity<List<TimeOffTypeResponse>> getActiveTimeOffTypes() {
        log.info("REST request to get all active time-off types");
        List<TimeOffTypeResponse> types = typeService.getActiveTimeOffTypes();
        return ResponseEntity.ok(types);
    }
}
