package com.aura.dto;

import com.aura.system.entities.Account.Role;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    /**
     * POST /api/auth/login
     * Same for all roles — everyone logs in the same way.
     */
    public record LoginRequest(
            @NotBlank(message = "Username is required")
            String username,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    /**
     * POST /api/auth/register
     * Public — self-registration for CUSTOMERS only.
     * Role is NOT accepted here — always defaults to CUSTOMER in AuthService.
     */
    public record CustomerRegisterRequest(
            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 50, message = "Username must be 3–50 characters")
            String username,

            @NotBlank(message = "Password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            String password,

            @NotBlank(message = "First name is required")
            String firstName,

            @NotBlank(message = "Last name is required")
            String lastName,

            @Email(message = "Invalid email format")
            String email,

            String phone
    ) {}

    /**
     * POST /api/admin/staff/create
     * ADMIN only — creates STAFF, KITCHEN, or ADMIN accounts.
     * Role is explicitly set by the admin.
     */
    public record StaffCreateRequest(
            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 50, message = "Username must be 3–50 characters")
            String username,

            @NotBlank(message = "Password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            String password,

            @NotBlank(message = "First name is required")
            String firstName,

            @NotBlank(message = "Last name is required")
            String lastName,

            @Email(message = "Invalid email format")
            String email,

            String phone,
            
            @JsonProperty("role")
            Role role   // STAFF | KITCHEN | ADMIN — set by admin
    ) {}

    /**
     * Response for login and register.
     * Returns JWT token and basic account info.
     */
    public record AuthResponse(
            String token,
            String username,
            String role,
            long expiresIn   // seconds
    ) {}
}