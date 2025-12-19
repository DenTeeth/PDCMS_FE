package com.dental.clinic.management.notification.config;

import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Get Authorization header from STOMP CONNECT frame
            List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");

            if (authorizationHeaders != null && !authorizationHeaders.isEmpty()) {
                String authHeader = authorizationHeaders.get(0);

                if (authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);

                    try {
                        // Decode and validate JWT
                        Jwt jwt = jwtDecoder.decode(token);

                        // Extract account_id from JWT claims - handle Long/Integer/String
                        Object accountIdClaim = jwt.getClaim("account_id");
                        if (accountIdClaim == null) {
                            throw new IllegalArgumentException("JWT token missing account_id claim");
                        }

                        Integer accountId;
                        if (accountIdClaim instanceof Integer) {
                            accountId = (Integer) accountIdClaim;
                        } else if (accountIdClaim instanceof Number) {
                            accountId = ((Number) accountIdClaim).intValue();
                        } else if (accountIdClaim instanceof String) {
                            try {
                                accountId = Integer.parseInt((String) accountIdClaim);
                            } catch (NumberFormatException e) {
                                throw new IllegalArgumentException(
                                        "Invalid account_id format in JWT: " + accountIdClaim, e);
                            }
                        } else {
                            throw new IllegalStateException(
                                    "Unsupported account_id claim type: " + accountIdClaim.getClass().getName());
                        }

                        // Extract authorities from JWT (try both 'authorities' and 'permissions'
                        // claims)
                        List<String> authoritiesList = jwt.getClaim("authorities");
                        if (authoritiesList == null) {
                            authoritiesList = jwt.getClaim("permissions");
                        }

                        List<GrantedAuthority> grantedAuthorities = List.of();
                        if (authoritiesList != null && !authoritiesList.isEmpty()) {
                            grantedAuthorities = authoritiesList.stream()
                                    .map(SimpleGrantedAuthority::new)
                                    .map(auth -> (GrantedAuthority) auth)
                                    .toList();
                        }

                        // Create authentication with account_id as principal
                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                                accountId.toString(),
                                null,
                                grantedAuthorities);

                        // Set authentication in STOMP session
                        accessor.setUser(authentication);

                        log.info("WebSocket authenticated successfully for account_id: {}", accountId);

                    } catch (Exception e) {
                        log.error("WebSocket authentication failed: {}", e.getMessage());
                        throw new IllegalArgumentException("Invalid JWT token for WebSocket connection");
                    }
                } else {
                    log.warn("WebSocket connection without Bearer token");
                }
            } else {
                log.warn("WebSocket connection without Authorization header");
            }
        }

        return message;
    }
}
