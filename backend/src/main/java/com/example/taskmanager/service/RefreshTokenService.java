package com.example.taskmanager.service;

import com.example.taskmanager.model.RefreshToken;
import com.example.taskmanager.model.Usuario;
import com.example.taskmanager.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;

    @Value("${app.refresh.token.expiration:1209600000}") // 14 days default
    private long refreshTokenDurationMs;

    public RefreshTokenService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    public RefreshToken createRefreshToken(Usuario usuario) {
        RefreshToken token = new RefreshToken();
        token.setUsuario(usuario);
        token.setToken(UUID.randomUUID().toString() + UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        token.setRevoked(false);
        return repository.save(token);
    }

    public java.util.List<RefreshToken> listByUser(Usuario usuario) {
        return repository.findByUsuario(usuario);
    }

    public RefreshToken rotate(RefreshToken existing) {
        existing.setRevoked(true);
        repository.save(existing);
        RefreshToken replacement = new RefreshToken();
        replacement.setUsuario(existing.getUsuario());
        replacement.setToken(UUID.randomUUID().toString() + UUID.randomUUID().toString());
        replacement.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        replacement.setRevoked(false);
        return repository.save(replacement);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return repository.findByToken(token);
    }

    public boolean isValid(RefreshToken token) {
        if (token == null) return false;
        if (token.isRevoked()) return false;
        return token.getExpiryDate().isAfter(Instant.now());
    }

    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        repository.save(token);
    }

    public void revokeAllForUser(Usuario usuario) {
        repository.deleteByUsuario(usuario);
    }
}
