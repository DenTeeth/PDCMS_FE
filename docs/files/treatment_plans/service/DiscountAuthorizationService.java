package com.dental.clinic.management.treatment_plans.service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.ErrorResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Business Rules Service for Discount Authorization
 * 
 * Implements:
 * - Rule #28: Receptionist can discount max 5%. Discounts >5% require Manager approval
 */
@Service
public class DiscountAuthorizationService {

    private static final BigDecimal MAX_RECEPTIONIST_DISCOUNT_PERCENT = BigDecimal.valueOf(5);

    /**
     * Rule #28: Validate discount authority based on user role
     * 
     * Business Rule:
     * - Receptionist: Can discount up to 5%
     * - Manager/Admin: Can discount >5%
     * 
     * @param totalCost Total cost before discount
     * @param discountAmount Discount amount being applied
     * @throws ForbiddenException if user lacks authority for the discount amount
     */
    public void validateDiscountAuthority(BigDecimal totalCost, BigDecimal discountAmount) {
        if (totalCost == null || discountAmount == null) {
            return; // No validation needed
        }

        if (discountAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return; // No discount or negative discount (no restriction)
        }

        if (totalCost.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total cost cannot be zero when applying discount");
        }

        // Calculate discount percentage
        BigDecimal discountPercent = discountAmount
            .divide(totalCost, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        // Get current user's role
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN, 
                "Không thể xác định người dùng hiện tại"
            );
            problemDetail.setTitle("Unauthorized");
            problemDetail.setProperty("errorCode", "UNAUTHORIZED");
            throw new ErrorResponseException(HttpStatus.FORBIDDEN, problemDetail, null);
        }

        boolean isManager = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(auth -> auth.equals("ROLE_ADMIN") || 
                             auth.equals("ROLE_MANAGER") ||
                             auth.contains("MANAGE_"));

        boolean isReceptionist = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(auth -> auth.equals("ROLE_RECEPTIONIST"));

        // Receptionist: Max 5% discount
        if (isReceptionist && !isManager) {
            if (discountPercent.compareTo(MAX_RECEPTIONIST_DISCOUNT_PERCENT) > 0) {
                String message = String.format(
                    "Giảm giá %.2f%% vượt quá quyền hạn Lễ tân (tối đa 5%%). " +
                    "Vui lòng yêu cầu Quản lý xác nhận. " +
                    "Giảm giá: %s VND / Tổng: %s VND",
                    discountPercent,
                    discountAmount,
                    totalCost
                );
                ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                    HttpStatus.FORBIDDEN, 
                    message
                );
                problemDetail.setTitle("Discount Requires Manager Approval");
                problemDetail.setProperty("errorCode", "DISCOUNT_REQUIRES_MANAGER_APPROVAL");
                problemDetail.setProperty("discountPercent", discountPercent);
                problemDetail.setProperty("maxAllowed", MAX_RECEPTIONIST_DISCOUNT_PERCENT);
                throw new ErrorResponseException(HttpStatus.FORBIDDEN, problemDetail, null);
            }
        }

        // Manager/Admin: No restrictions (allow any discount)
        // No validation needed for managers
    }

    /**
     * Calculate discount percentage from amounts
     * 
     * @param totalCost Total cost before discount
     * @param discountAmount Discount amount
     * @return Discount percentage (e.g., 5.25 for 5.25%)
     */
    public BigDecimal calculateDiscountPercent(BigDecimal totalCost, BigDecimal discountAmount) {
        if (totalCost == null || discountAmount == null || totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return discountAmount
            .divide(totalCost, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }
}
