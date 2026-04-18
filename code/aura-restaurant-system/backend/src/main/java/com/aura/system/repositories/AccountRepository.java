package com.aura.system.repositories;

import com.aura.system.entities.Account;
import com.aura.system.entities.Account.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    // Login — used by UserDetailsService
    Optional<Account> findByUsername(String username);

    // Registration check
    boolean existsByUsername(String username);

    // Find by role
    List<Account> findByRole(Role role);

    // Find active/inactive accounts
    List<Account> findByActive(boolean active);

    // Find by role and active status
    List<Account> findByRoleAndActive(Role role, boolean active);
}