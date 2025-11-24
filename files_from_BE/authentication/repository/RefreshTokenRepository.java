
package com.dental.clinic.management.authentication.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.dental.clinic.management.authentication.domain.RefreshToken;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    /**
     * Find refresh token by hash.
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Find active refresh token by hash.
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash AND rt.isActive = true")
    Optional<RefreshToken> findActiveByTokenHash(@Param("tokenHash") String tokenHash);

    /**
     * Find all active tokens for an account.
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.account.accountId = :accountId AND rt.isActive = true")
    List<RefreshToken> findAllActiveByAccountId(@Param("accountId") Integer accountId);

    /**
     * Delete token by hash (logout single device).
     */
    void deleteByTokenHash(String tokenHash);

    /**
     * Deactivate all tokens for a user (logout all devices, password change).
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isActive = false WHERE rt.account.accountId = :accountId")
    int deactivateAllByAccountId(@Param("accountId") Integer accountId);

    /**
     * Delete expired tokens (cleanup job).
     * Should be called periodically to prevent table bloat.
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
}
