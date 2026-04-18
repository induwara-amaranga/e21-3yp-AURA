package com.aura.service;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.exception.UsernameAlreadyExistsException;
import com.aura.model.User;
//import com.aura.model.User.Role;
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
     * Throws BadCredentialsException for wrong username or password —
     * we use the same error message for both to prevent user enumeration.
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
            // Do NOT reveal whether username or password was wrong
            throw new BadCredentialsException("Invalid username or password");
        }

        Account account = accountRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        String token = jwtUtil.generateToken(account);
        log.info("User '{}' logged in with role {}", account.getUsername(), account.getRole());

        return buildResponse(token, account);
    }

    // ─── Register ────────────────────────────────────────────────────────────

    /**
     * Creates a new customer account.
     
     */
   @Transactional
    public AuthResponse register(CustomerRegisterRequest request) {
        if (accountRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException("Username already taken");
        }

        // ✅ Always CUSTOMER — role cannot be chosen by the user
        Account account = Account.builder()
            .username(request.username())
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(Role.CUSTOMER)  // hardcoded, ignore request.role()
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
        return buildResponse(token, account);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private AuthResponse buildResponse(String token, Account account) {
    return new AuthResponse(
            token,
            account.getUsername(),
            account.getRole().name(),
            expiryMs / 1000
    );
}
}


