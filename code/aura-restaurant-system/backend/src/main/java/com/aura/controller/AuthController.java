package com.aura.controller;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login and user registration")
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     *
     * Public endpoint — any client can call this to get a JWT.
     * Used by: admin dashboard, kitchen tablet, staff POS.
     *
     * Request:  { "username": "admin", "password": "password123" }
     * Response: { "token": "eyJ...", "username": "admin", "role": "ADMIN", "expiresIn": 86400 }
     */
    @PostMapping("/login")
    @Operation(summary = "Login and receive a JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * POST /api/auth/register
     *
     * 
     * 
     *
     * Request:  { "username": "chef_bob", "password": "secure123", "firstName": "Bob", "lastName": "Chef" , "email": "bob.chef@example.com", "phone": "123-456-7890" }
     * Response: { "token": "eyJ...", "username": "chef_bob", "role": "CUSTOMER", "expiresIn": 86400 }
     */
    @PostMapping("/register") // customer login only. need another endpoint for staff
    //@PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new customer")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody CustomerRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    /* TEMPORARY endpoint to generate BCrypt hash */
    @GetMapping("/hash")
    public String generateHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        return encoder.encode("Admin@1234");
    }
}
