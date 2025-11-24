package com.dental.clinic.management.account.repository;

import com.dental.clinic.management.account.enums.AccountStatus;
import com.dental.clinic.management.account.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the {@link Account} entity.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {

        Optional<Account> findOneByEmail(String email);

        Optional<Account> findOneByUsername(String username);

        Boolean existsByEmail(String email);

        Boolean existsByUsername(String username);

        /**
         * Fetch account by email eagerly with role, base role and permissions.
         */
        @Query("SELECT a FROM Account a " +
                        "JOIN FETCH a.role r " +
                        "JOIN FETCH r.baseRole " +
                        "JOIN FETCH r.permissions " +
                        "WHERE a.email = :email")
        Optional<Account> findByEmailWithRoleAndPermissions(@Param("email") String email);

        /**
         * Fetch account by username eagerly with role, base role and permissions.
         */
        @Query("SELECT a FROM Account a " +
                        "JOIN FETCH a.role r " +
                        "JOIN FETCH r.baseRole " +
                        "JOIN FETCH r.permissions " +
                        "WHERE a.username = :username")
        Optional<Account> findByUsernameWithRoleAndPermissions(@Param("username") String username);

        /**
         * Fetch account by id eagerly with role, base role and permissions.
         */
        @Query("SELECT a FROM Account a " +
                        "JOIN FETCH a.role r " +
                        "JOIN FETCH r.baseRole " +
                        "JOIN FETCH r.permissions " +
                        "WHERE a.accountId = :accountId")
        Optional<Account> findByAccountIdWithRoleAndPermissions(@Param("accountId") Integer accountId);

        /**
         * Find all active accounts.
         */
        List<Account> findByStatus(AccountStatus status);

        /**
         * Find account by email (simple query for email verification and password
         * reset)
         */
        Optional<Account> findByEmail(String email);
}
