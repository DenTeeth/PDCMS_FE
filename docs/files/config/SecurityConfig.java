package com.dental.clinic.management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

import com.dental.clinic.management.customer_contact.service.CustomUserDetailsService;

@Configuration
public class SecurityConfig {

        private final CustomUserDetailsService userDetailsService;
        private final JwtAuthenticationConverter jwtAuthenticationConverter;
        private final JwtBlacklistFilter jwtBlacklistFilter;

        public SecurityConfig(CustomUserDetailsService userDetailsService,
                        JwtAuthenticationConverter jwtAuthenticationConverter,
                        JwtBlacklistFilter jwtBlacklistFilter) {
                this.userDetailsService = userDetailsService;
                this.jwtAuthenticationConverter = jwtAuthenticationConverter;
                this.jwtBlacklistFilter = jwtBlacklistFilter;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(userDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder());
                return authProvider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        SecurityFilterChain filterChain(HttpSecurity http, MvcRequestMatcher.Builder mvc) throws Exception {
                http
                                .csrf(c -> c.disable())
                                .cors(Customizer.withDefaults())

                                // Security Headers
                                .headers(headers -> headers
                                                // Content Security Policy - Prevent XSS attacks
                                                .contentSecurityPolicy(csp -> csp.policyDirectives(
                                                                "default-src 'self'; " +
                                                                                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                                                                                +
                                                                                "style-src 'self' 'unsafe-inline'; " +
                                                                                "img-src 'self' data: https:; " +
                                                                                "font-src 'self' data:; " +
                                                                                "connect-src 'self'"))
                                                // Frame Options - Prevent clickjacking
                                                .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                                                // Referrer Policy - Control referrer information
                                                .referrerPolicy(referrer -> referrer.policy(
                                                                ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                                                // Permissions Policy - Control browser features
                                                .permissionsPolicy(permissions -> permissions.policy(
                                                                "camera=(), fullscreen=(self), geolocation=(), gyroscope=(), "
                                                                                +
                                                                                "magnetometer=(), microphone=(), midi=(), payment=(), sync-xhr=()")))

                                // Authorization Rules - Using MvcRequestMatcher for better security
                                .authorizeHttpRequests(authz -> authz
                                                // Public endpoints - Health Check & Monitoring
                                                .requestMatchers(mvc.pattern("/actuator/health/**")).permitAll()

                                                // Public endpoints - API Documentation
                                                .requestMatchers(mvc.pattern("/v3/api-docs/**")).permitAll()
                                                .requestMatchers(mvc.pattern("/swagger-ui/**")).permitAll()
                                                .requestMatchers(mvc.pattern("/swagger-ui.html")).permitAll()

                                                // Public endpoints - WebSocket SockJS handshake
                                                // SockJS info endpoint does not support Authorization header
                                                // Authentication handled at STOMP CONNECT frame level
                                                .requestMatchers(mvc.pattern("/ws/info/**")).permitAll()
                                                .requestMatchers(mvc.pattern("/ws/**")).permitAll()

                                                // Public endpoints - Authentication
                                                .requestMatchers(mvc.pattern("/api/v1/auth/login")).permitAll()
                                                .requestMatchers(mvc.pattern("/api/v1/auth/refresh-token")).permitAll()
                                                .requestMatchers(mvc.pattern("/api/v1/auth/logout")).permitAll()

                                                // Public endpoints - Email verification & password reset
                                                .requestMatchers(mvc.pattern("/api/v1/auth/verify-email")).permitAll()
                                                .requestMatchers(mvc.pattern("/api/v1/auth/resend-verification"))
                                                .permitAll()
                                                .requestMatchers(mvc.pattern("/api/v1/auth/forgot-password"))
                                                .permitAll()
                                                .requestMatchers(mvc.pattern("/api/v1/auth/reset-password")).permitAll()

                                                // Public endpoints - Setup & Error
                                                .requestMatchers(mvc.pattern("/api/v1/setup/**")).permitAll()
                                                .requestMatchers(mvc.pattern("/error")).permitAll()

                                                // Authenticated endpoints - Account management
                                                .requestMatchers(mvc.pattern("/api/v1/account/**")).authenticated()

                                                // Test endpoints (remove in production)
                                                .requestMatchers(mvc.pattern("/api/v1/test-security/public"))
                                                .permitAll()
                                                .requestMatchers(mvc.pattern("/api/v1/test-security/**"))
                                                .authenticated()

                                                // All other endpoints require authentication
                                                // Fine-grained RBAC applied at service layer with @PreAuthorize
                                                .anyRequest().authenticated())

                                // JWT Resource Server configuration
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))

                                // Exception Handling
                                .exceptionHandling(exceptions -> exceptions
                                                // 401 Unauthorized - Authentication failed (invalid/expired token)
                                                .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                                                // 403 Forbidden - Access denied (insufficient permissions)
                                                .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))

                                // Custom JWT Blacklist Filter - Our improvement over JHipster
                                .addFilterBefore(jwtBlacklistFilter, UsernamePasswordAuthenticationFilter.class)

                                // Stateless session for JWT
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

                return http.build();
        }

        /**
         * MvcRequestMatcher.Builder bean - Learned from JHipster
         * Provides more secure request matching using Spring MVC path matching
         * - Prevents path traversal attacks
         * - Handles trailing slashes automatically
         * - Aware of Spring MVC controller mappings
         */
        @Bean
        MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
                return new MvcRequestMatcher.Builder(introspector);
        }
}
