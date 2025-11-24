
package com.dental.clinic.management.customer_contact.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.repository.AccountRepository;

/**
 * Spring Security {@link UserDetailsService} implementation loading
 * {@code Account}
 * with associated roles & permissions to build authorities.
 */
@Service("userDetailsService")
@Transactional
public class CustomUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    public CustomUserDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    /**
     * Load a user by username including roles and permissions.
     *
     * @param username account username
     * @return {@link UserDetails} principal
     * @throws UsernameNotFoundException if account not found / inactive / locked
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByUsernameWithRoleAndPermissions(username)
                .orElseThrow(() -> new UsernameNotFoundException("Account not found with username: " + username));

        if (!account.isActive()) {
            throw new UsernameNotFoundException("Account is not active: " + username);
        }

        return new CustomUserPrincipal(account);
    }

    /**
     * Load a user by email including roles and permissions.
     *
     * @param email account email
     * @return {@link UserDetails} principal
     * @throws UsernameNotFoundException if account not found / inactive / locked
     */
    public UserDetails loadUserByEmail(String email) throws UsernameNotFoundException {
        Account account = accountRepository.findByEmailWithRoleAndPermissions(email)
                .orElseThrow(() -> new UsernameNotFoundException("Account not found with email: " + email));

        if (!account.isActive()) {
            throw new UsernameNotFoundException("Account is not active: " + email);
        }

        return new CustomUserPrincipal(account);
    }

    /**
     * Custom Spring Security principal backed by {@link Account}.
     */
    public static class CustomUserPrincipal implements UserDetails {
        private final Account account;
        private final Collection<? extends GrantedAuthority> authorities;

        /**
         * Construct principal from persistent {@link Account}.
         *
         * @param account account entity
         */
        public CustomUserPrincipal(Account account) {
            this.account = account;
            this.authorities = getAuthorities(account);
        }

        private Collection<? extends GrantedAuthority> getAuthorities(Account account) {
            Set<GrantedAuthority> authorities = new HashSet<>();

            // Add role with ROLE_ prefix (single role)
            if (account.getRole() != null) {
                String roleName = account.getRole().getRoleName().startsWith("ROLE_")
                        ? account.getRole().getRoleName()
                        : "ROLE_" + account.getRole().getRoleName();
                authorities.add(new SimpleGrantedAuthority(roleName));

                // Add permissions from the role
                account.getRole().getPermissions().forEach(permission -> {
                    authorities.add(new SimpleGrantedAuthority(permission.getPermissionName()));
                });
            }

            return authorities;
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return authorities;
        }

        @Override
        public String getPassword() {
            return account.getPassword();
        }

        @Override
        public String getUsername() {
            return account.getUsername();
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return account.isActive();
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return account.isActive();
        }

        /**
         * Underlying account entity.
         */
        public Account getAccount() {
            return account;
        }

        public Integer getAccountId() {
            return account.getAccountId();
        }

        public String getEmail() {
            return account.getEmail();
        }

        public String getFullName() {
            return account.getEmployee() != null
                    ? account.getEmployee().getFirstName() + " " + account.getEmployee().getLastName()
                    : "";
        }
    }
}
