package com.example.taskmanager.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

/**
 * Propriedades relacionadas ao JWT carregadas do application.properties.
 */
@Component
public class JwtProperties {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expirationMillis;

    public String getSecret() { return secret; }
    public long getExpirationMillis() { return expirationMillis; }

    @PostConstruct
    public void validate() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret is not configured. Set environment variable APP_JWT_SECRET for production.");
        }
        // Ensure the secret is long enough for HS256
        if (secret.getBytes().length < 32) {
            throw new IllegalStateException("JWT secret is too short. Provide at least 32 bytes of entropy (e.g. 32+ character random string).");
        }
    }
}
