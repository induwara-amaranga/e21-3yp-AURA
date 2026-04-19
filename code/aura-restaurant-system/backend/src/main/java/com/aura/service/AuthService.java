package com.aura.service;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.exception.UsernameAlreadyExistsException;
import com.aura.model.User;
import com.aura.repository.UserRepository;
import com.aura.security.JwtUtil;
import com.aura.system.entities.Account;
import com.aura.system.entities.Customer;
import com.aura.system.repositories.AccountRepository;
import com.aura.system.repositories.CustomerRepository;
import com.aura.system.entities.Account.Role;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.expiry}")
    private long expiryMs;

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Authenticates a staff member and returns a signed JWT.
     * Loads from 'staff' table to match UserDetailsServiceImpl.
     */
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(),
                            request.password()
                    )
            );
        } catch (AuthenticationException e) {
            throw new BadCredentialsException("Invalid username or password");
        }

        // Load from staff table — must match what UserDetailsServiceImpl loads
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        String token = jwtUtil.generateToken(user);
        log.info("User '{}' logged in with role {}", user.getUsername(), user.getRole());

        return buildStaffResponse(token, user);
    }

    // ─── Register (Customer) ─────────────────────────────────────────────────

    /**
     * Creates a new customer account with CUSTOMER role.
     * Customers cannot choose their role; it is always set to CUSTOMER.
     */
    @Transactional
    public AuthResponse register(CustomerRegisterRequest request) {
        if (accountRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException("Username already taken");
        }

        // Always CUSTOMER — role cannot be chosen by the user
        Account account = Account.builder()
            .username(request.username())
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(Role.CUSTOMER)
            .build();
        accountRepository.save(account);

        Customer customer = Customer.builder()
            .account(account)
            .firstName(request.firstName())
            .lastName(request.lastName())
            .email(request.email())
            .phone(request.phone())
            .build();
        customerRepository.save(customer);

        String token = jwtUtil.generateToken(account);
        return buildAccountResponse(token, account);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    // Used for staff login (from staff table)
    private AuthResponse buildStaffResponse(String token, User user) {
        return new AuthResponse(
                token,
                user.getUsername(),
                user.getRole().name(),
                expiryMs / 1000
        );
    }

    // Used for customer register (from accounts table)
    private AuthResponse buildAccountResponse(String token, Account account) {
        return new AuthResponse(
                token,
                account.getUsername(),
                account.getRole().name(),
                expiryMs / 1000
        );
    }
}