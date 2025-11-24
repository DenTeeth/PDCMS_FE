package com.dental.clinic.management.account.repository;

import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    /**
     * Find password reset token by token string
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Find unused token for a specific account
     */
    Optional<PasswordResetToken> findByAccountAndUsedAtIsNull(Account account);

    /**
     * Delete all tokens for a specific account
     */
    void deleteByAccount(Account account);
}
