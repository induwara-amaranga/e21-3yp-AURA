package com.aura.system.repositories;

import com.aura.system.entities.Account;
import com.aura.system.entities.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    // Find by linked account
    Optional<Staff> findByAccount(Account account);

    // Find by account's username
    Optional<Staff> findByAccount_Username(String username);

    // Find by email
    Optional<Staff> findByEmail(String email);

    // Check if email already used
    boolean existsByEmail(String email);

    // Find by role (via account)
    List<Staff> findByAccount_Role(Account.Role role);

    // Find only active staff (via account)
    List<Staff> findByAccount_Active(boolean active);
}