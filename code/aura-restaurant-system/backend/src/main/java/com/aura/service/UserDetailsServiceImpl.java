package com.aura.service;

import com.aura.system.repositories.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring Security calls this to load an Account by username
 * during authentication and JWT validation.
 *
 * Account implements UserDetails directly,
 * so we can return it as-is without any wrapper.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final AccountRepository accountRepository;  // ← changed

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return accountRepository.findByUsername(username)  // ← changed
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );
    }
}