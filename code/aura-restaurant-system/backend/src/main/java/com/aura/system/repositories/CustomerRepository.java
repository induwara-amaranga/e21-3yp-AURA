package com.aura.system.repositories;

import com.aura.system.entities.Account;
import com.aura.system.entities.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // Find by linked account
    Optional<Customer> findByAccount(Account account);

    // Find by account's username — useful after JWT auth
    Optional<Customer> findByAccount_Username(String username);

    // Find by email
    Optional<Customer> findByEmail(String email);

    // Find by phone
    Optional<Customer> findByPhone(String phone);

    // Duplicate checks
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    // Search by name (case-insensitive)
    List<Customer> findByFirstNameContainingIgnoreCase(String firstName);
    List<Customer> findByLastNameContainingIgnoreCase(String lastName);
}