package com.aura.service;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.ChangePasswordRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.StaffCreateRequest;
import com.aura.exception.UsernameAlreadyExistsException;
import com.aura.security.JwtUtil;
import com.aura.system.entities.Account;
import com.aura.system.entities.Customer;
import com.aura.system.entities.Staff;
import com.aura.system.entities.Account.Role;
import com.aura.system.repositories.AccountRepository;
import com.aura.system.repositories.CustomerRepository;
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

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.expiry}")
    private long expiryMs;

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

        Account account = accountRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        String token = jwtUtil.generateToken(account);
        log.info("User '{}' logged in with role {}", account.getUsername(), account.getRole());

        return buildResponse(token, account);
    }

    /**
     * Stateless JWT logout.
     * The client should remove the token from storage.
     */
    public String logout(String username) {
        log.info("User '{}' logged out", username);
        return "Logged out successfully";
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), account.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), account.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }

        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        accountRepository.save(account);

        log.info("User '{}' changed password successfully", username);
    }

    @Transactional
    public AuthResponse register(CustomerRegisterRequest request) {
        if (accountRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException("Username already taken");
        }

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
        return buildResponse(token, account);
    }

    @Transactional
    public AuthResponse registerStaff(StaffCreateRequest request) {

        if (request.role() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        if (request.role() == Role.CUSTOMER) {
            throw new IllegalArgumentException(
                    "Invalid role for staff registration: " + request.role()
                            + ". Allowed roles: ADMIN, STAFF, KITCHEN"
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
                .role(request.role())
                .build();
        accountRepository.save(account);

        Staff staff = Staff.builder()
                .account(account)
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phone(request.phone())
                .build();
        staffRepository.save(staff);

        String token = jwtUtil.generateToken(account);
        return buildResponse(token, account);
    }

    private AuthResponse buildResponse(String token, Account account) {
        return new AuthResponse(
                token,
                account.getUsername(),
                account.getRole().name(),
                expiryMs / 1000
        );
    }
}