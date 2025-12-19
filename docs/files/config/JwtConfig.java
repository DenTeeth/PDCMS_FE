package com.dental.clinic.management.config;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

import com.dental.clinic.management.utils.security.SecurityUtil;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;

import io.micrometer.core.instrument.MeterRegistry;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class JwtConfig {

    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);

    @Value("${dentalclinic.jwt.base64-secret}")
    private String jwtKey;

    @Value("${dentalclinic.jwt.access-token-validity-in-seconds}")
    private String jwtKeyExpiration;

    private final MeterRegistry meterRegistry;

    public JwtConfig(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length, SecurityUtil.JWT_ALGORITHM.getName());
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(getSecretKey())
                .macAlgorithm(SecurityUtil.JWT_ALGORITHM)
                .build();

        // Wrap decoder with metrics tracking (learned from JHipster)
        // and strict expiration validation (our improvement)
        return token -> {
            try {
                var jwt = jwtDecoder.decode(token);

                // Strict expiration check: reject if token is expired (no 60s clock skew
                // tolerance)
                // This is more secure than JHipster's default behavior
                var expiresAt = jwt.getExpiresAt();
                if (expiresAt != null && expiresAt.isBefore(java.time.Instant.now())) {
                    // Track expired tokens for monitoring (learned from JHipster)
                    meterRegistry.counter("jwt.validation.expired").increment();

                    throw new JwtException("Token has expired at " + expiresAt);
                }

                // Track successful validations
                meterRegistry.counter("jwt.validation.success").increment();

                return jwt;

            } catch (JwtException e) {
                // Track validation errors by type (learned from JHipster)
                String errorMessage = e.getMessage();

                if (errorMessage.contains("Invalid signature") || errorMessage.contains("signature")) {
                    meterRegistry.counter("jwt.validation.invalid_signature").increment();
                    log.warn("JWT validation failed: Invalid signature");

                } else if (errorMessage.contains("expired")) {
                    // Already tracked above, just log
                    log.debug("JWT validation failed: Token expired");

                } else if (errorMessage.contains("Malformed") ||
                        errorMessage.contains("Invalid JWT") ||
                        errorMessage.contains("Invalid unsecured")) {
                    meterRegistry.counter("jwt.validation.malformed").increment();
                    log.warn("JWT validation failed: Malformed token");

                } else {
                    // Unknown error type
                    meterRegistry.counter("jwt.validation.unknown_error").increment();
                    log.error("Unknown JWT validation error: {}", errorMessage);
                }

                throw e;
            }
        };
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new HashSet<>();

            // Extract roles from JWT using constants (learned from JHipster)
            // Roles are already formatted with ROLE_ prefix by SecurityUtil
            List<String> roles = jwt.getClaimAsStringList(SecurityUtil.ROLES_CLAIM);
            if (roles != null) {
                for (String role : roles) {
                    authorities.add(new SimpleGrantedAuthority(role));
                }
            }

            // Extract permissions from JWT for fine-grained RBAC (our improvement over
            // JHipster)
            // This allows method-level security with
            // @PreAuthorize("hasAuthority('CREATE_EMPLOYEE')")
            List<String> permissions = jwt.getClaimAsStringList(SecurityUtil.PERMISSIONS_CLAIM);
            if (permissions != null) {
                for (String permission : permissions) {
                    authorities.add(new SimpleGrantedAuthority(permission));
                }
            }

            return authorities;
        });

        return converter;
    }

}
