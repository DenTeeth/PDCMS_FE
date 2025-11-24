package com.dental.clinic.management.authentication.domain;

import com.dental.clinic.management.account.domain.Account;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing blacklisted JWT tokens (invalidated before expiry).
 * <p>
 * Use cases:
 * - User explicitly logs out
 * - Admin revokes user session
 * - Password changed (invalidate all existing tokens)
 * </p>
 */
@Entity
@Table(name = "blacklisted_tokens")
public class BlacklistedToken {

    @Id
    @Column(name = "token_hash", length = 512)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "blacklisted_at", nullable = false)
    private LocalDateTime blacklistedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "reason", length = 50)
    private String reason; // LOGOUT, PASSWORD_CHANGED, ADMIN_REVOKED

    // Constructors
    public BlacklistedToken() {
    }

    public BlacklistedToken(String tokenHash, Account account, LocalDateTime expiresAt, String reason) {
        this.tokenHash = tokenHash;
        this.account = account;
        this.blacklistedAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.reason = reason;
    }

    // Getters and Setters
    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public LocalDateTime getBlacklistedAt() {
        return blacklistedAt;
    }

    public void setBlacklistedAt(LocalDateTime blacklistedAt) {
        this.blacklistedAt = blacklistedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    // Helper method
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }
}
