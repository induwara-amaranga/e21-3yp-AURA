package com.aura.security;

import com.aura.system.entities.Account;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    // Valid Base64-encoded 256-bit key for tests
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtMzItY2hhcnMtbG9uZw==";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiryMs", 86400000L); // 24h
    }

    private Account buildAccount(String username, Account.Role role) {
        return Account.builder()
                .username(username)
                .passwordHash("$2a$12$ignored")
                .role(role)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Generated token contains correct username")
    void generateToken_containsUsername() {
        Account acc = buildAccount("chef_bob", Account.Role.KITCHEN);
        String token = jwtUtil.generateToken(acc);

        assertThat(jwtUtil.extractUsername(token)).isEqualTo("chef_bob");
    }

    @Test
    @DisplayName("Generated token contains correct role claim")
    void generateToken_containsRoleClaim() {
        Account acc = buildAccount("staff_jane", Account.Role.STAFF);
        String token = jwtUtil.generateToken(acc);

        assertThat(jwtUtil.extractRoles(token)).contains("ROLE_STAFF");
    }

    @Test
    @DisplayName("Valid token passes validation")
    void validateToken_validToken_returnsTrue() {
        Account acc = buildAccount("admin", Account.Role.ADMIN);
        String token = jwtUtil.generateToken(acc);

        assertThat(jwtUtil.validateToken(token, acc)).isTrue();
    }

    @Test
    @DisplayName("Token for different user fails validation")
    void validateToken_wrongUser_returnsFalse() {
        Account admin = buildAccount("admin", Account.Role.ADMIN);
        Account other = buildAccount("other_user", Account.Role.STAFF);

        String token = jwtUtil.generateToken(admin);

        assertThat(jwtUtil.validateToken(token, other)).isFalse();
    }

    @Test
    @DisplayName("Expired token throws ExpiredJwtException")
    void expiredToken_throwsException() {
        ReflectionTestUtils.setField(jwtUtil, "expiryMs", -1L);
        Account acc = buildAccount("admin", Account.Role.ADMIN);
        String token = jwtUtil.generateToken(acc);

        assertThatThrownBy(() -> jwtUtil.extractUsername(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("Tampered token fails validation")
    void tamperedToken_failsValidation() {
        Account acc = buildAccount("admin", Account.Role.ADMIN);
        String token = jwtUtil.generateToken(acc) + "tampered";

        assertThat(jwtUtil.validateToken(token, acc)).isFalse();
    }
}