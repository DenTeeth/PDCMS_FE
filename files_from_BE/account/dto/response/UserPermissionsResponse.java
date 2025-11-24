package com.dental.clinic.management.account.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * User permissions response containing only authorization data.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionsResponse {

    private String username;
    private List<String> permissions;
}
