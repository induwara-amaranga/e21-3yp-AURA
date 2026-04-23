package com.aura.controller;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.ChangePasswordRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.MessageResponse;
import com.aura.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login and user registration")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login and receive a JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new customer")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody CustomerRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current user")
    public ResponseEntity<MessageResponse> logout(Authentication authentication) {
        String username = authentication.getName();
        String message = authService.logout(username);
        return ResponseEntity.ok(new MessageResponse(message));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user")
    public ResponseEntity<MessageResponse> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {

        String username = authentication.getName();
        authService.changePassword(username, request);

        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    /* TEMPORARY endpoint to generate BCrypt hash */
    @GetMapping("/hash")
    public String generateHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        return encoder.encode("Admin@1234");
    }
}