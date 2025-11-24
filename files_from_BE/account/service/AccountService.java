package com.dental.clinic.management.account.service;

import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.role.domain.Role;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.role.repository.RoleRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    public AccountService(
            AccountRepository accountRepository,
            RoleRepository roleRepository) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional
    public void assignRoleToAccount(Integer accountId, String roleId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Account not found with ID: " + accountId,
                        "account",
                        "accountnotfound"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Role not found with ID: " + roleId,
                        "role",
                        "rolenotfound"));

        account.setRole(role);
        accountRepository.save(account);
    }

    @PreAuthorize("hasRole('" + ADMIN + "')")
    @Transactional(readOnly = true)
    public String getAccountRole(Integer accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BadRequestAlertException(
                        "Account not found with ID: " + accountId,
                        "account",
                        "accountnotfound"));

        return account.getRole() != null ? account.getRole().getRoleName() : null;
    }
}
