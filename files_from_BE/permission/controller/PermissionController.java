package com.dental.clinic.management.permission.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dental.clinic.management.permission.dto.request.CreatePermissionRequest;
import com.dental.clinic.management.permission.dto.request.UpdatePermissionRequest;
import com.dental.clinic.management.permission.dto.response.PermissionInfoResponse;
import com.dental.clinic.management.permission.dto.PermissionHierarchyDTO;
import com.dental.clinic.management.permission.service.PermissionService;
import com.dental.clinic.management.utils.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/permissions")
@Tag(name = "Permission Management", description = "APIs for managing system permissions and access control")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @GetMapping("")
    @Operation(summary = "Get all permissions", description = "Retrieve a complete list of all active permissions in the system")
    @ApiMessage("Get all permissions successfully")
    public ResponseEntity<List<PermissionInfoResponse>> getAllPermissions() {
        List<PermissionInfoResponse> response = permissionService.getAllActivePermissions();
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/by-module")
    @Operation(summary = "Get permissions by module", description = "Retrieve permissions grouped by their module (e.g., USER, ADMIN, EMPLOYEE)")
    @ApiMessage("Get permissions grouped by module successfully")
    public ResponseEntity<Map<String, List<PermissionInfoResponse>>> getPermissionsByModule() {
        Map<String, List<PermissionInfoResponse>> response = permissionService.getPermissionsGroupedByModule();
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/grouped")
    @Operation(summary = "Get permissions with hierarchy", description = "Retrieve all permissions grouped by module with parent-child hierarchy information. Used for frontend permission management UI with three-level selection: NONE (no permission), OWN (child permission), ALL (parent permission)")
    @ApiMessage("Get grouped permissions with hierarchy successfully")
    public ResponseEntity<Map<String, List<PermissionHierarchyDTO>>> getGroupedPermissions() {
        Map<String, List<PermissionHierarchyDTO>> response = permissionService.getGroupedPermissions();
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/grouped-simple")
    @Operation(summary = "Get permissions grouped by module ", description = "Retrieve permissions grouped by module in a simple, readable format. Returns Map<Module, List<PermissionId>> for easy frontend display")
    @ApiMessage("Get permissions grouped by module successfully")
    public ResponseEntity<Map<String, List<String>>> getGroupedPermissionsSimple() {
        Map<String, List<String>> response = permissionService.getPermissionsGroupedByModuleSimple();
        return ResponseEntity.ok().body(response);
    }

    @Hidden
    @GetMapping("/active")
    @ApiMessage("Get all active permissions successfully")
    public ResponseEntity<List<PermissionInfoResponse>> getAllActivePermissions() {
        List<PermissionInfoResponse> response = permissionService.getAllActivePermissions();
        return ResponseEntity.ok().body(response);
    }

    @Hidden
    @GetMapping("/{permissionId}")
    @ApiMessage("Get permission by ID successfully")
    public ResponseEntity<PermissionInfoResponse> getPermissionById(@PathVariable String permissionId) {
        PermissionInfoResponse response = permissionService.getPermissionById(permissionId);
        return ResponseEntity.ok().body(response);
    }

    @Hidden
    @GetMapping("/module/{module}")
    @ApiMessage("Get permissions by module successfully")
    public ResponseEntity<List<PermissionInfoResponse>> getPermissionsByModule(@PathVariable String module) {
        List<PermissionInfoResponse> response = permissionService.getPermissionsByModule(module);
        return ResponseEntity.ok().body(response);
    }

    @Hidden
    @PostMapping("")
    @ApiMessage("Create permission successfully")
    public ResponseEntity<PermissionInfoResponse> createPermission(@Valid @RequestBody CreatePermissionRequest request)
            throws URISyntaxException {
        PermissionInfoResponse response = permissionService.createPermission(request);
        return ResponseEntity.created(new URI("/api/v1/permissions/" + response.getPermissionId())).body(response);
    }

    @Hidden
    @PatchMapping("/{permissionId}")
    @ApiMessage("Update permission successfully")
    public ResponseEntity<PermissionInfoResponse> updatePermission(
            @PathVariable String permissionId,
            @Valid @RequestBody UpdatePermissionRequest request) {
        PermissionInfoResponse response = permissionService.updatePermission(permissionId, request);
        return ResponseEntity.ok().body(response);
    }

    @Hidden
    @DeleteMapping("/{permissionId}")
    @ApiMessage("Delete permission successfully")
    public ResponseEntity<Void> deletePermission(@PathVariable String permissionId) {
        permissionService.deletePermission(permissionId);
        return ResponseEntity.noContent().build();
    }

    @Hidden
    @DeleteMapping("/{permissionId}/hard")
    @ApiMessage("Hard delete permission successfully")
    public ResponseEntity<Void> hardDeletePermission(@PathVariable String permissionId) {
        permissionService.hardDeletePermission(permissionId);
        return ResponseEntity.noContent().build();
    }

    @Hidden
    @GetMapping("/exists/{permissionName}")
    @ApiMessage("Check if permission name exists")
    public ResponseEntity<Boolean> existsByPermissionName(@PathVariable String permissionName) {
        boolean exists = permissionService.existsByPermissionName(permissionName);
        return ResponseEntity.ok().body(exists);
    }
}
