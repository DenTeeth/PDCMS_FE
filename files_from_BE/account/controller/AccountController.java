
package com.dental.clinic.management.account.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dental.clinic.management.account.dto.response.UserInfoResponse;
import com.dental.clinic.management.account.dto.response.UserPermissionsResponse;
import com.dental.clinic.management.account.dto.response.UserProfileResponse;
import com.dental.clinic.management.account.dto.response.MeResponse;
import com.dental.clinic.management.authentication.service.AuthenticationService;
import com.dental.clinic.management.utils.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * REST controller for account profile operations.
 * <p>
 * Base path: <code>/api/v1/account</code>
 * </p>
 * Provides endpoints to retrieve authenticated user profile information.
 */
@RestController
@RequestMapping("/api/v1/account")
@Tag(name = "Account Profile", description = "APIs for retrieving authenticated user profile, permissions, and account information")
public class AccountController {

    private final AuthenticationService authenticationService;

    public AccountController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    /**
     * Get complete user context (me endpoint).
     * {@code GET /api/v1/account/me}
     * Returns comprehensive user info including role, permissions, sidebar,
     * homePath, and employmentType.
     *
     * @param jwt injected JWT bearer token (lấy username từ claim "sub")
     * @return 200 OK with {@link MeResponse} containing complete user context
     * @throws com.dental.clinic.management.exception.AccountNotFoundException if
     *                                                                         the
     *                                                                         account
     *                                                                         no
     *                                                                         longer
     *                                                                         exists
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user context", description = "Retrieve complete user context including role, permissions, sidebar, and navigation info")
    @ApiMessage("Lấy thông tin người dùng hiện tại thành công")
    public ResponseEntity<MeResponse> getMe(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("sub");
        MeResponse meResponse = authenticationService.getMe(username);
        return ResponseEntity.ok(meResponse);
    }

    /**
     * Get the personal profile of the currently authenticated user.
     * {@code GET /api/v1/account/profile}
     *
     * @param jwt injected JWT bearer token (lấy username từ claim "sub")
     * @return 200 OK with {@link UserProfileResponse} containing personal info and
     *         roles
     * @throws com.dental.clinic.management.exception.AccountNotFoundException if
     *                                                                         the
     *                                                                         account
     *                                                                         no
     *                                                                         longer
     *                                                                         exists
     */
    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Retrieve personal profile information of the currently authenticated user")
    @ApiMessage("Lấy thông tin profile cá nhân thành công")
    public ResponseEntity<UserProfileResponse> getProfile(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("sub");
        UserProfileResponse userProfile = authenticationService.getUserProfile(username);
        return ResponseEntity.ok(userProfile);
    }

    /**
     * Get the permissions of the currently authenticated user.
     * <p>
     * {@code GET /api/v1/account/permissions}
     * </p>
     *
     * @param jwt injected JWT bearer token (lấy username từ claim "sub")
     * @return 200 OK with {@link UserPermissionsResponse} containing permissions
     *         only
     * @throws com.dental.clinic.management.exception.AccountNotFoundException if
     *                                                                         the
     *                                                                         account
     *                                                                         no
     *                                                                         longer
     *                                                                         exists
     */
    @GetMapping("/permissions")
    @Operation(summary = "Get user permissions", description = "Retrieve all permissions of the currently authenticated user")
    @ApiMessage("Lấy quyền hạn người dùng thành công")
    public ResponseEntity<UserPermissionsResponse> getPermissions(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("sub");
        UserPermissionsResponse userPermissions = authenticationService.getUserPermissions(username);
        return ResponseEntity.ok(userPermissions);
    }

    /**
     * Get complete user information including roles and permissions.
     * <p>
     * {@code GET /api/v1/account/info}
     * </p>
     *
     * @param jwt injected JWT bearer token (lấy username từ claim "sub")
     * @return 200 OK with {@link UserInfoResponse} containing complete user info
     * @throws com.dental.clinic.management.exception.AccountNotFoundException if
     *                                                                         the
     *                                                                         account
     *                                                                         no
     *                                                                         longer
     *                                                                         exists
     */
    @GetMapping("/info")
    @Operation(summary = "Get complete user info", description = "Retrieve complete user information including roles and permissions")
    @ApiMessage("Lấy thông tin đầy đủ người dùng thành công")
    public ResponseEntity<UserInfoResponse> getInfo(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("sub");
        UserInfoResponse userInfo = authenticationService.getUserInfo(username);
        return ResponseEntity.ok(userInfo);
    }
}
