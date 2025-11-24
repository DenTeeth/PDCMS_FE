package com.dental.clinic.management.authentication.repository;

import com.dental.clinic.management.authentication.domain.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for managing blacklisted tokens.
 */
@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, String> {

    /**
     * Check if a token is blacklisted.
     *
     * @param tokenHash hashed token value
     * @return true if token exists in blacklist
     */
    boolean existsByTokenHash(String tokenHash);

    /**
     * Find a blacklisted token by hash.
     *
     * @param tokenHash hashed token value
     * @return Optional containing the blacklisted token if found
     */
    Optional<BlacklistedToken> findByTokenHash(String tokenHash);

    /**
     * Delete expired blacklisted tokens (cleanup job).
     * Should be called periodically to prevent table bloat.
     *
     * @param now current timestamp
     * @return number of deleted records
     */
    @Modifying
    @Query("DELETE FROM BlacklistedToken bt WHERE bt.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);

    /**
     * Blacklist all tokens for a specific account.
     * Used when password is changed or account is deactivated.
     *
     * @param accountId the account ID
     * @return number of tokens blacklisted
     */
    @Query("SELECT COUNT(bt) FROM BlacklistedToken bt WHERE bt.account.accountId = :accountId")
    long countByAccountId(Integer accountId);
}
