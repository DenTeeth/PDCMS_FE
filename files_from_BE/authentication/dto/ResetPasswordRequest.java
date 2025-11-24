package com.dental.clinic.management.authentication.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to reset password with token")
public class ResetPasswordRequest {

    @NotBlank(message = "Token không được để trống")
    @Schema(description = "Password reset token from email", example = "550e8400-e29b-41d4-a716-446655440000")
    private String token;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, max = 50, message = "Mật khẩu phải từ 6-50 ký tự")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).+$", message = "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số")
    @Schema(description = "New password (6-50 chars, must contain letters and numbers)", example = "NewPass123")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    @Schema(description = "Confirm new password", example = "NewPass123")
    private String confirmPassword;
}
