package com.aura.config;

import com.aura.system.entities.Account;
import com.aura.system.repositories.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DevAccountBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevAccountBootstrap.class);

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${aura.auth.seed-default-accounts:true}")
    private boolean seedDefaultAccounts;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedDefaultAccounts) {
            return;
        }

        int repaired = accountRepository.activateNullFlags();
        if (repaired > 0) {
            log.warn("[AURA] Repaired {} account(s) with NULL is_active flag.", repaired);
        }

        ensureAccount("admin", "admin123", Account.Role.ADMIN);
        ensureAccount("kitchen", "kitchen123", Account.Role.KITCHEN);
        ensureAccount("table1", "table_pwd_1", Account.Role.TABLE);
        ensureAccount("table2", "table_pwd_2", Account.Role.TABLE);

        log.info("[AURA] Default login accounts are ready (admin, kitchen, table1, table2).");
    }

    private void ensureAccount(String username, String rawPassword, Account.Role role) {
        Account account = accountRepository.findByUsername(username)
                .orElseGet(() -> Account.builder()
                        .username(username)
                        .passwordHash(passwordEncoder.encode(rawPassword))
                        .role(role)
                        .active(true)
                        .build());

        boolean changed = false;

        if (account.getId() != null) {
            if (!account.isEnabled()) {
                account.setActive(true);
                changed = true;
            }

            if (account.getRole() != role) {
                account.setRole(role);
                changed = true;
            }

            if (!passwordEncoder.matches(rawPassword, account.getPassword())) {
                account.setPasswordHash(passwordEncoder.encode(rawPassword));
                changed = true;
            }

            if (changed) {
                accountRepository.save(account);
                log.warn("[AURA] Refreshed default credentials for '{}'.", username);
            }
            return;
        }

        accountRepository.save(account);
        log.info("[AURA] Created default account '{}'.", username);
    }
}