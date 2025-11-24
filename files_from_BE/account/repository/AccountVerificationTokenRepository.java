package com.dental.clinic.management.account.repository;

import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.domain.AccountVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountVerificationTokenRepository extends JpaRepository<AccountVerificationToken, String> {

    /**
     * Find verification token by token string
     */
    Optional<AccountVerificationToken> findByToken(String token);

    /**
     * Find unverified token for a specific account
     */
    Optional<AccountVerificationToken> findByAccountAndVerifiedAtIsNull(Account account);

    /**
     * Delete all tokens for a specific account
     */
    void deleteByAccount(Account account);
}
