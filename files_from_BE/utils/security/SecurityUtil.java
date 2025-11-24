package com.dental.clinic.management.utils.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import com.dental.clinic.management.exception.authentication.JwtValidationException;

@Component
public class SecurityUtil {

    public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS512;
    public static final String AUTHORITIES_CLAIM = "authorities";

    // JWT Claim Names for roles and permissions
    public static final String ROLES_CLAIM = "roles";
    public static final String PERMISSIONS_CLAIM = "permissions";
    public static final String TOKEN_TYPE_CLAIM = "type";

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;

    @Value("${dentalclinic.jwt.access-token-validity-in-seconds}")
    private long jwtExpiration;

    @Value("${dentalclinic.jwt.refresh-token-validity-in-seconds}")
    private long refreshExpiration;

    public SecurityUtil(JwtEncoder jwtEncoder, JwtDecoder jwtDecoder) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    public String createAccessToken(String username, List<String> roles, List<String> permissions,
            Integer accountId, String patientCode, String employeeCode) {
        Instant now = Instant.now();
        Instant validity = now.plus(jwtExpiration, ChronoUnit.SECONDS);

        // Ensure roles have ROLE_ prefix for Spring Security RBAC
        List<String> formattedRoles = roles.stream()
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .collect(Collectors.toList());

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(username)
                .claim(ROLES_CLAIM, formattedRoles)
                .claim(PERMISSIONS_CLAIM, permissions)
                .claim("account_id", accountId);

        // Add patientCode if present (FE Issue 3.3 fix)
        if (patientCode != null) {
            claimsBuilder.claim("patient_code", patientCode);
        }

        // Add employeeCode if present (FE Issue 3.3 fix)
        if (employeeCode != null) {
            claimsBuilder.claim("employee_code", employeeCode);
        }

        JwtClaimsSet claims = claimsBuilder.build();

        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    public String createRefreshToken(String username) {
        Instant now = Instant.now();
        Instant validity = now.plus(refreshExpiration, ChronoUnit.SECONDS);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(username)
                .claim(TOKEN_TYPE_CLAIM, "refresh")
                .build();
        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    /**
     * Validate and decode a refresh token; returns Jwt if valid and of
     * type=refresh.
     * Throws JwtValidationException if invalid/expired/wrong type.
     */
    public Jwt decodeRefreshToken(String refreshToken) {
        try {
            // This automatically validates:
            // - Token signature
            // - Token expiration
            // - Token format
            Jwt jwt = jwtDecoder.decode(refreshToken);

            // Additionally check if it's a refresh token
            Object typeClaim = jwt.getClaims().get("type");
            if (typeClaim == null || !"refresh".equals(typeClaim.toString())) {
                throw new JwtValidationException("Token is not a refresh token");
            }
            return jwt;
        } catch (JwtException e) {
            // Convert Spring's JwtException to our custom exception
            throw new JwtValidationException(e.getMessage(), e);
        }
    }

    public long getAccessTokenValiditySeconds() {
        return jwtExpiration;
    }

    public long getRefreshTokenValiditySeconds() {
        return refreshExpiration;
    }

    /**
     * Get the login of the current user.
     */
    public static Optional<String> getCurrentUserLogin() {
        SecurityContextHolder.getContext().getAuthentication();
        return Optional.ofNullable(extractPrincipal(SecurityContextHolder.getContext().getAuthentication()));
    }

    private static String extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        } else if (authentication.getPrincipal() instanceof String) {
            return (String) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * Check if a user has a specific role
     */
    public static boolean hasCurrentUserRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_" + role));
    }

    /**
     * Check if a user has a specific permission
     */
    public static boolean hasCurrentUserPermission(String permission) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals(permission));
    }

    /**
     * Get current user authorities
     */
    public static List<String> getCurrentUserAuthorities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
        }
        return List.of();
    }
}
