package com.example.taskmanager.repository;

import com.example.taskmanager.model.RefreshToken;
import com.example.taskmanager.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUsuario(Usuario usuario);
    java.util.List<RefreshToken> findByUsuario(Usuario usuario);
}
