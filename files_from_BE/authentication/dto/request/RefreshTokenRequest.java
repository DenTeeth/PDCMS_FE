package com.dental.clinic.management.authentication.dto.request;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Getter;

/**
 * Request payload to obtain a new access token using a refresh token.
 */
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class RefreshTokenRequest {
    private String refreshToken;

}
