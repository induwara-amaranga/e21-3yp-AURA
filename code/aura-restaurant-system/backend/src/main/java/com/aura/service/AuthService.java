package com.aura.service;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.StaffCreateRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.exception.UsernameAlreadyExistsException;
//import com.aura.model.User;
//import com.aura.model.User.Role;
//import com.aura.repository.UserRepository;
import com.aura.security.JwtUtil;
import com.aura.system.entities.Account;
import com.aura.system.entities.Customer;
import com.aura.system.entities.Staff;
import com.aura.system.repositories.AccountRepository;
import com.aura.system.repositories.CustomerRepository;
import com.aura.system.entities.Account.Role;
import com.aura.system.repositories.StaffRepository;

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

    //private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
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
     * Creates a new customer account.Not for other roles.Use admin endpoints to register staff
     
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

    // ─── Staff Register (admin only) ─────────────────────────────────────────

    /**
     * Creates a new staff account. Called exclusively from POST /admin/staff/create.
     *
     * Rejects CUSTOMER and TABLE roles — those are not valid staff roles.
     * The AdminController is already @PreAuthorize("hasRole('ADMIN')") so only
     * admins can reach this method.
     */
    @Transactional
    public AuthResponse registerStaff(StaffCreateRequest request) {

        if (request.role() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        // Guard: prevent invalid roles being assigned through this endpoint
        if (request.role() == Role.CUSTOMER) {
            throw new IllegalArgumentException(
                    "Invalid role for staff registration: " + request.role()
                    + ". Allowed roles: ADMIN, STAFF, KITCHEN ,TABLE"
            );
        }

        if (accountRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException("Username '" + request.username() + "' is already taken");
        }
        log.info("Admin is creating new staff account '{}' with role {}",
                request.username(), request.role());

        Account account = Account.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(request.role())   // role is set explicitly by the admin
                .build();
        accountRepository.save(account);

        log.info("Admin created new staff account '{}' with role {}",
                account.getUsername(), account.getRole());

        // Note: no Customer row is created for staff accounts.
        // If you later add a Staff entity (firstName, lastName, email, phone),
        // save it here the same way Customer is saved in register().
        Staff staff = Staff.builder()
        .account(account)          // links to the Account just saved
        .firstName(request.firstName())
        .lastName(request.lastName())
        .email(request.email())
        .phone(request.phone())
        .build();
        staffRepository.save(staff);

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


