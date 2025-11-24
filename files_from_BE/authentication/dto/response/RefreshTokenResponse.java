package com.dental.clinic.management.authentication.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response containing a new access token generated from a valid refresh token.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenResponse {
    private String accessToken;
    private long accessTokenExpiresAt; // epoch seconds
    private String refreshToken; // May be rotated
    private Long refreshTokenExpiresAt; // nullable if not rotated
}
