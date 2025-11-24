
package com.dental.clinic.management.authentication.service;

import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.domain.AccountVerificationToken;
import com.dental.clinic.management.account.domain.PasswordResetToken;
import com.dental.clinic.management.account.dto.response.UserInfoResponse;
import com.dental.clinic.management.account.dto.response.UserPermissionsResponse;
import com.dental.clinic.management.account.dto.response.UserProfileResponse;
import com.dental.clinic.management.account.dto.response.MeResponse;
import com.dental.clinic.management.account.enums.AccountStatus;
import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.account.repository.AccountVerificationTokenRepository;
import com.dental.clinic.management.account.repository.PasswordResetTokenRepository;
import com.dental.clinic.management.authentication.dto.request.LoginRequest;
import com.dental.clinic.management.authentication.dto.request.RefreshTokenRequest;
import com.dental.clinic.management.authentication.dto.response.LoginResponse;
import com.dental.clinic.management.authentication.dto.response.RefreshTokenResponse;
import com.dental.clinic.management.authentication.repository.RefreshTokenRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.exception.account.AccountNotFoundException;
import com.dental.clinic.management.exception.account.AccountNotVerifiedException;
import com.dental.clinic.management.exception.authentication.InvalidTokenException;
import com.dental.clinic.management.exception.authentication.TokenExpiredException;
import com.dental.clinic.management.permission.domain.Permission;
import com.dental.clinic.management.role.domain.Role;
import com.dental.clinic.management.utils.EmailService;
import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.exception.account.BadCredentialsException;

/**
 * Service layer for authentication & user identity operations.
 * <p>
 * Chức năng: xác thực, phát hành access/refresh token, làm mới access token,
 * lấy thông tin người dùng.
 * </p>
 */
@Service
@Transactional
public class AuthenticationService {

        private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

        private final AuthenticationManager authenticationManager;
        private final SecurityUtil securityUtil;
        private final AccountRepository accountRepository;
        private final RefreshTokenRepository refreshTokenRepository;
        private final AccountVerificationTokenRepository verificationTokenRepository;
        private final PasswordResetTokenRepository passwordResetTokenRepository;
        private final EmailService emailService;
        private final PasswordEncoder passwordEncoder;

        public AuthenticationService(
                        AuthenticationManager authenticationManager,
                        SecurityUtil securityUtil,
                        AccountRepository accountRepository,
                        RefreshTokenRepository refreshTokenRepository,
                        AccountVerificationTokenRepository verificationTokenRepository,
                        PasswordResetTokenRepository passwordResetTokenRepository,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder) {
                this.authenticationManager = authenticationManager;
                this.securityUtil = securityUtil;
                this.accountRepository = accountRepository;
                this.refreshTokenRepository = refreshTokenRepository;
                this.verificationTokenRepository = verificationTokenRepository;
                this.passwordResetTokenRepository = passwordResetTokenRepository;
                this.emailService = emailService;
                this.passwordEncoder = passwordEncoder;
        }

        /**
         * Authenticate user credentials and build a {@link LoginResponse} with roles &
         * permissions.
         *
         * @param request login payload (username & password)
         * @return populated {@link LoginResponse}
         * @throws org.springframework.security.authentication.BadCredentialsException if
         *                                                                             authentication
         *                                                                             fails
         */
        public LoginResponse login(LoginRequest request) {
                // Xác thực thông tin đăng nhập - throws BadCredentialsException if fails
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.getUsername(),
                                                request.getPassword()));

                // Lấy thông tin tài khoản kèm role và quyền hạn
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(request.getUsername())
                                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException(
                                                "Account not found"));

                // Check if account is verified (seeded accounts are ACTIVE, new accounts are
                // PENDING_VERIFICATION)
                if (account.getStatus() == AccountStatus.PENDING_VERIFICATION) {
                        log.warn("Login attempt for unverified account: {}", account.getUsername());
                        throw new AccountNotVerifiedException(
                                        "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.");
                }

                Role role = account.getRole();
                String roleName = role.getRoleName();

                // Lấy tất cả quyền hạn từ role
                List<String> permissionIds = role.getPermissions().stream()
                                .map(Permission::getPermissionId)
                                .distinct()
                                .collect(Collectors.toList());

                // Group permissions by module for efficient FE processing
                Map<String, List<String>> groupedPermissions = role.getPermissions().stream()
                                .collect(Collectors.groupingBy(
                                                Permission::getModule,
                                                Collectors.mapping(Permission::getPermissionId, Collectors.toList())));

                // Collect patientCode and employeeCode for FE navigation (Issue 3.3)
                String patientCode = null;
                String employeeCode = null;
                if (account.getPatient() != null) {
                        patientCode = account.getPatient().getPatientCode();
                }
                if (account.getEmployee() != null) {
                        employeeCode = account.getEmployee().getEmployeeCode();
                }

                // Tạo JWT token chứa thông tin user (including account_id, patientCode,
                // employeeCode)
                String accessToken = securityUtil.createAccessToken(account.getUsername(),
                                List.of(roleName), permissionIds, account.getAccountId(), patientCode, employeeCode);
                String refreshToken = securityUtil.createRefreshToken(account.getUsername());

                long now = Instant.now().getEpochSecond();
                long accessExp = now + securityUtil.getAccessTokenValiditySeconds();
                long refreshExp = now + securityUtil.getRefreshTokenValiditySeconds();

                // Save refresh token to database for token rotation and invalidation
                try {
                        String tokenHash = hashToken(refreshToken);
                        com.dental.clinic.management.authentication.domain.RefreshToken refreshTokenEntity = new com.dental.clinic.management.authentication.domain.RefreshToken(
                                        java.util.UUID.randomUUID().toString(),
                                        account,
                                        tokenHash,
                                        java.time.LocalDateTime.now()
                                                        .plusSeconds(securityUtil.getRefreshTokenValiditySeconds()));
                        refreshTokenEntity.setIsActive(true);
                        refreshTokenRepository.save(refreshTokenEntity);
                        log.debug("Refresh token saved to database for user: {}", account.getUsername());
                } catch (Exception e) {
                        log.error("Failed to save refresh token to database", e);
                        // Continue even if save fails - token is still valid in JWT
                }

                LoginResponse response = new LoginResponse(
                                accessToken,
                                accessExp,
                                refreshToken,
                                refreshExp,
                                account.getUsername(),
                                account.getEmail(),
                                List.of(roleName),
                                permissionIds);

                response.setGroupedPermissions(groupedPermissions); // Grouped permissions by module

                // Set baseRole for FE layout determination
                response.setBaseRole(role.getBaseRole().getBaseRoleName());

                // Set employmentType if user is an employee
                if (account.getEmployee() != null) {
                        response.setEmploymentType(account.getEmployee().getEmploymentType());
                }

                // Set mustChangePassword flag
                response.setMustChangePassword(
                                account.getMustChangePassword() != null && account.getMustChangePassword());

                // Debug logging
                log.info("Login response prepared for user: {}", account.getUsername());
                log.info("  role: {}", roleName);
                log.info("  baseRole: {}", response.getBaseRole());
                log.info("  groupedPermissions modules: {}",
                                groupedPermissions != null ? groupedPermissions.keySet() : null);
                log.info("  employmentType: {}", response.getEmploymentType());

                return response;
        }

        /**
         * Refresh the access token using a valid refresh token.
         *
         * @param request the incoming refresh token wrapper
         * @return a response containing a new access token plus existing refresh token
         *         & its expiry
         * @throws com.dental.clinic.management.exception.BadCredentialsException if the
         *                                                                        refresh
         *                                                                        token
         *                                                                        is
         *                                                                        invalid
         *                                                                        or
         *                                                                        expired
         */
        public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
                log.debug("Refresh token request received");

                if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
                        log.warn("Refresh token is missing in request");
                        throw new BadCredentialsException(
                                        "Refresh token is missing");
                }

                // Giải mã và kiểm tra refresh token
                // JwtException will be caught by GlobalExceptionHandler and return 401
                log.debug("Decoding refresh token");
                var jwt = securityUtil.decodeRefreshToken(request.getRefreshToken());
                String username = jwt.getSubject();
                log.debug("Refresh token decoded successfully for user: {}", username);

                // Lấy thông tin tài khoản với role/permissions
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                                .orElseThrow(() -> {
                                        log.error("Account not found for username: {}", username);
                                        return new AccountNotFoundException(username);
                                });

                // Check if account is active
                if (!account.isActive()) {
                        log.warn("Account {} is not active", username);
                        throw new BadCredentialsException(
                                        "Account is not active");
                }

                log.debug("Generating new tokens for user: {}", username);
                Role role = account.getRole();
                List<String> roles = List.of(role.getRoleName());
                List<String> permissions = role.getPermissions().stream()
                                .map(Permission::getPermissionId).distinct().collect(Collectors.toList());

                // Collect patientCode and employeeCode for token refresh (Issue 3.3)
                String patientCode = null;
                String employeeCode = null;
                if (account.getPatient() != null) {
                        patientCode = account.getPatient().getPatientCode();
                }
                if (account.getEmployee() != null) {
                        employeeCode = account.getEmployee().getEmployeeCode();
                }

                // Tạo access token mới (including account_id, patientCode, employeeCode)
                String newAccess = securityUtil.createAccessToken(username, roles, permissions,
                                account.getAccountId(), patientCode, employeeCode);
                long now = Instant.now().getEpochSecond();
                long accessExp = now + securityUtil.getAccessTokenValiditySeconds();

                // Tạo refresh token mới (refresh token rotation for security)
                String newRefresh = securityUtil.createRefreshToken(username);
                long refreshExp = now + securityUtil.getRefreshTokenValiditySeconds();

                // TOKEN ROTATION: Invalidate old refresh token and save new one
                try {
                        String oldTokenHash = hashToken(request.getRefreshToken());

                        // Deactivate old refresh token
                        refreshTokenRepository.findByTokenHash(oldTokenHash).ifPresent(oldToken -> {
                                oldToken.setIsActive(false);
                                refreshTokenRepository.save(oldToken);
                                log.debug("Old refresh token deactivated for user: {}", username);
                        });

                        // Save new refresh token
                        String newTokenHash = hashToken(newRefresh);
                        com.dental.clinic.management.authentication.domain.RefreshToken newTokenEntity = new com.dental.clinic.management.authentication.domain.RefreshToken(
                                        java.util.UUID.randomUUID().toString(),
                                        account,
                                        newTokenHash,
                                        java.time.LocalDateTime.now()
                                                        .plusSeconds(securityUtil.getRefreshTokenValiditySeconds()));
                        newTokenEntity.setIsActive(true);
                        refreshTokenRepository.save(newTokenEntity);
                        log.debug("New refresh token saved to database for user: {}", username);
                } catch (Exception e) {
                        log.error("Failed to rotate refresh token in database", e);
                        // Continue even if save fails - token is still valid in JWT
                }

                log.info("Refresh token successful for user: {}", username);
                return new RefreshTokenResponse(newAccess, accessExp, newRefresh, refreshExp);
        }

        /**
         * Load extended user profile info including roles and permissions.
         *
         * @param username account username
         * @return {@link UserInfoResponse} with profile & authorization data
         * @throws AccountNotFoundException if account does not exist
         */
        public UserInfoResponse getUserInfo(String username) {
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                                .orElseThrow(() -> new AccountNotFoundException(username));

                UserInfoResponse response = new UserInfoResponse();
                response.setId(account.getAccountId());
                response.setUsername(account.getUsername());
                response.setEmail(account.getEmail());
                response.setAccountStatus(account.getStatus() != null ? account.getStatus().name() : null);

                // Lấy vai trò
                Role role = account.getRole();
                response.setRoles(List.of(role.getRoleName()));

                // Lấy tất cả quyền hạn từ role
                List<String> permissions = role.getPermissions().stream()
                                .map(Permission::getPermissionId)
                                .distinct()
                                .collect(Collectors.toList());
                response.setPermissions(permissions);

                // Thông tin chi tiết nếu employee có profile
                if (account.getEmployee() != null) {
                        Employee profile = account.getEmployee();
                        response.setFullName(profile.getFullName());
                        response.setPhoneNumber(profile.getPhone());
                        response.setAddress(profile.getAddress());
                        response.setDateOfBirth(
                                        profile.getDateOfBirth() != null ? profile.getDateOfBirth().toString() : null);

                        // Lấy chuyên khoa chính (nếu có)
                        if (!profile.getSpecializations().isEmpty()) {
                                response.setSpecializationName(
                                                profile.getSpecializations().iterator().next().getSpecializationName());
                        }

                        response.setCreatedAt(profile.getCreatedAt());
                }

                return response;
        }

        /**
         * Get user profile with roles but without permissions.
         *
         * @param username account username
         * @return {@link UserProfileResponse} with profile & roles only
         * @throws AccountNotFoundException if account does not exist
         */
        public UserProfileResponse getUserProfile(String username) {
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                                .orElseThrow(() -> new AccountNotFoundException(username));

                UserProfileResponse response = new UserProfileResponse();
                response.setId(account.getAccountId());
                response.setUsername(account.getUsername());
                response.setEmail(account.getEmail());
                response.setAccountStatus(account.getStatus() != null ? account.getStatus().name() : null);

                // Lấy vai trò
                Role role = account.getRole();
                response.setRoles(List.of(role.getRoleName()));

                // Thông tin chi tiết nếu employee có profile
                if (account.getEmployee() != null) {
                        Employee profile = account.getEmployee();
                        response.setFullName(profile.getFullName());
                        response.setPhoneNumber(profile.getPhone());
                        response.setAddress(profile.getAddress());
                        response.setDateOfBirth(
                                        profile.getDateOfBirth() != null ? profile.getDateOfBirth().toString() : null);

                        // Lấy chuyên khoa chính (nếu có)
                        if (!profile.getSpecializations().isEmpty()) {
                                response.setSpecializationName(
                                                profile.getSpecializations().iterator().next().getSpecializationName());
                        }

                        response.setCreatedAt(profile.getCreatedAt());
                }

                return response;
        }

        /**
         * Get user permissions only.
         *
         * @param username account username
         * @return {@link UserPermissionsResponse} with permissions only
         * @throws AccountNotFoundException if account does not exist
         */
        public UserPermissionsResponse getUserPermissions(String username) {
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                                .orElseThrow(() -> new AccountNotFoundException(username));

                // Lấy tất cả quyền hạn từ role
                List<String> permissions = account.getRole().getPermissions().stream()
                                .map(Permission::getPermissionId)
                                .distinct()
                                .collect(Collectors.toList());

                return new UserPermissionsResponse(account.getUsername(), permissions);
        }

        /**
         * Get complete user context for /me endpoint.
         * Includes role, permissions, sidebar, homePath, and employmentType.
         *
         * @param username account username
         * @return {@link MeResponse} with complete user context
         * @throws AccountNotFoundException if account does not exist
         */
        public MeResponse getMe(String username) {
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                                .orElseThrow(() -> new AccountNotFoundException(username));

                MeResponse response = new MeResponse();

                // Basic account info
                response.setAccountId(account.getAccountId());
                response.setUsername(account.getUsername());
                response.setEmail(account.getEmail());
                response.setAccountStatus(account.getStatus() != null ? account.getStatus().name() : null);

                // Role info
                Role role = account.getRole();
                response.setRole(role.getRoleName());
                response.setBaseRole(role.getBaseRole().getBaseRoleName());

                // Permissions
                List<String> permissions = role.getPermissions().stream()
                                .map(Permission::getPermissionId)
                                .distinct()
                                .collect(Collectors.toList());
                response.setPermissions(permissions);

                // Grouped permissions by module
                Map<String, List<String>> groupedPermissions = role.getPermissions().stream()
                                .collect(Collectors.groupingBy(
                                                Permission::getModule,
                                                Collectors.mapping(Permission::getPermissionId, Collectors.toList())));
                response.setGroupedPermissions(groupedPermissions);

                // Employee-specific info
                if (account.getEmployee() != null) {
                        Employee employee = account.getEmployee();
                        response.setFullName(employee.getFullName());
                        response.setPhoneNumber(employee.getPhone());
                        response.setEmployeeCode(employee.getEmployeeCode());
                        response.setEmploymentType(employee.getEmploymentType());

                        // Get primary specialization if exists
                        if (!employee.getSpecializations().isEmpty()) {
                                response.setSpecializationName(
                                                employee.getSpecializations().iterator().next()
                                                                .getSpecializationName());
                        }
                }

                return response;
        }

        /**
         * Logout user by invalidating their refresh token.
         *
         * @param refreshToken the refresh token to invalidate
         * @throws com.dental.clinic.management.exception.BadCredentialsException if
         *                                                                        refresh
         *                                                                        token
         *                                                                        is
         *                                                                        invalid
         */
        public void logout(String refreshToken) {
                if (refreshToken == null || refreshToken.isBlank()) {
                        return; // Không có token để xóa
                }

                try {
                        // Hash refresh token to find in database
                        String tokenHash = hashToken(refreshToken);

                        // Mark token as inactive instead of deleting (for audit trail)
                        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                                token.setIsActive(false);
                                refreshTokenRepository.save(token);
                                log.info("Refresh token deactivated for user: {}",
                                                token.getAccount().getUsername());
                        });

                } catch (Exception e) {
                        log.error("Logout failed", e);
                        throw new RuntimeException("Logout failed", e);
                }
        }

        /**
         * Hash a token using SHA-512 for secure storage.
         * Never store raw JWT tokens in database - always hash them.
         *
         * @param token the raw token string
         * @return hex-encoded SHA-512 hash
         */
        private String hashToken(String token) {
                try {
                        MessageDigest digest = MessageDigest.getInstance("SHA-512");
                        byte[] hashBytes = digest.digest(token.getBytes());
                        StringBuilder hexString = new StringBuilder();
                        for (byte b : hashBytes) {
                                String hex = Integer.toHexString(0xff & b);
                                if (hex.length() == 1) {
                                        hexString.append('0');
                                }
                                hexString.append(hex);
                        }
                        return hexString.toString();
                } catch (Exception e) {
                        throw new RuntimeException("Failed to hash token", e);
                }
        }

        /**
         * Get permissions of the current user, grouped by module.
         * This returns only the permission IDs that the user has access to.
         *
         * @param username the username of the current user
         * @return Map of module name to list of permission IDs
         * @throws AccountNotFoundException if account not found
         */
        public Map<String, List<String>> getMyPermissionsGrouped(String username) {
                Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                                .orElseThrow(() -> new AccountNotFoundException(username));

                Role role = account.getRole();

                // Group user's permissions by module
                Map<String, List<String>> groupedPermissions = role.getPermissions().stream()
                                .filter(Permission::getIsActive) // Only active permissions
                                .sorted((p1, p2) -> {
                                        // Sort by module first
                                        int moduleCompare = p1.getModule().compareTo(p2.getModule());
                                        if (moduleCompare != 0)
                                                return moduleCompare;

                                        // Then by displayOrder
                                        if (p1.getDisplayOrder() != null && p2.getDisplayOrder() != null) {
                                                return p1.getDisplayOrder().compareTo(p2.getDisplayOrder());
                                        }
                                        if (p1.getDisplayOrder() != null)
                                                return -1;
                                        if (p2.getDisplayOrder() != null)
                                                return 1;

                                        // Finally by permission ID
                                        return p1.getPermissionId().compareTo(p2.getPermissionId());
                                })
                                .collect(Collectors.groupingBy(
                                                Permission::getModule,
                                                java.util.LinkedHashMap::new, // Maintain order
                                                Collectors.mapping(Permission::getPermissionId, Collectors.toList())));

                return groupedPermissions;
        }

        /**
         * Verify email using verification token sent via email
         *
         * @param token the verification token from email link
         * @throws InvalidTokenException if token not found
         * @throws TokenExpiredException if token has expired
         */
        public void verifyEmail(String token) {
                log.info("Verifying email with token: {}", token);

                AccountVerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                                .orElseThrow(() -> new InvalidTokenException("Token xác thực không hợp lệ"));

                if (verificationToken.isExpired()) {
                        log.warn("Verification token expired for account: {}",
                                        verificationToken.getAccount().getUsername());
                        throw new TokenExpiredException(
                                        "Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.");
                }

                if (verificationToken.isVerified()) {
                        log.warn("Token already verified for account: {}",
                                        verificationToken.getAccount().getUsername());
                        throw new InvalidTokenException("Token này đã được sử dụng");
                }

                Account account = verificationToken.getAccount();
                account.setStatus(AccountStatus.ACTIVE);
                accountRepository.save(account);

                verificationToken.setVerifiedAt(LocalDateTime.now());
                verificationTokenRepository.save(verificationToken);

                log.info("✅ Email verified successfully for account: {}", account.getUsername());
        }

        /**
         * Resend verification email to user
         *
         * @param email the email address to resend verification
         * @throws AccountNotFoundException if account not found
         */
        public void resendVerificationEmail(String email) {
                log.info("Resending verification email to: {}", email);

                Account account = accountRepository.findByEmail(email)
                                .orElseThrow(() -> new AccountNotFoundException("Email không tồn tại trong hệ thống"));

                if (account.getStatus() == AccountStatus.ACTIVE) {
                        log.warn("Account already verified: {}", email);
                        throw new IllegalArgumentException("Tài khoản đã được xác thực");
                }

                // Delete old verification tokens
                verificationTokenRepository.deleteByAccount(account);

                // Create new verification token
                AccountVerificationToken verificationToken = new AccountVerificationToken(account);
                verificationTokenRepository.save(verificationToken);

                // Send verification email
                emailService.sendVerificationEmail(account.getEmail(), account.getUsername(),
                                verificationToken.getToken());

                log.info("✅ Verification email resent to: {}", email);
        }

        /**
         * Initiate password reset process by sending reset email
         *
         * @param email the email address to reset password
         * @throws AccountNotFoundException if account not found
         */
        public void forgotPassword(String email) {
                log.info("Password reset requested for email: {}", email);

                Account account = accountRepository.findByEmail(email)
                                .orElseThrow(() -> new AccountNotFoundException("Email không tồn tại trong hệ thống"));

                // Delete old password reset tokens
                passwordResetTokenRepository.deleteByAccount(account);

                // Create new password reset token
                PasswordResetToken resetToken = new PasswordResetToken(account);
                passwordResetTokenRepository.save(resetToken);

                // Send password reset email
                emailService.sendPasswordResetEmail(account.getEmail(), account.getUsername(), resetToken.getToken());

                log.info("✅ Password reset email sent to: {}", email);
        }

        /**
         * Reset password using reset token from email
         *
         * @param token           the password reset token from email
         * @param newPassword     the new password
         * @param confirmPassword confirm new password
         * @throws InvalidTokenException    if token not found or already used
         * @throws TokenExpiredException    if token has expired
         * @throws IllegalArgumentException if passwords don't match
         */
        public void resetPassword(String token, String newPassword, String confirmPassword) {
                log.info("Resetting password with token: {}", token);

                if (!newPassword.equals(confirmPassword)) {
                        throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
                }

                PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                                .orElseThrow(() -> new InvalidTokenException("Token đặt lại mật khẩu không hợp lệ"));

                if (resetToken.isExpired()) {
                        log.warn("Password reset token expired for account: {}", resetToken.getAccount().getUsername());
                        throw new TokenExpiredException(
                                        "Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.");
                }

                if (resetToken.isUsed()) {
                        log.warn("Password reset token already used for account: {}",
                                        resetToken.getAccount().getUsername());
                        throw new InvalidTokenException("Token này đã được sử dụng");
                }

                Account account = resetToken.getAccount();
                account.setPassword(passwordEncoder.encode(newPassword));
                account.setPasswordChangedAt(LocalDateTime.now());
                account.setMustChangePassword(false); // Password has been changed
                accountRepository.save(account);

                resetToken.setUsedAt(LocalDateTime.now());
                passwordResetTokenRepository.save(resetToken);

                log.info("✅ Password reset successfully for account: {}", account.getUsername());
        }
}
