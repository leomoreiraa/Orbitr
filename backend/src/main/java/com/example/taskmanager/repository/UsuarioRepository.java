package com.example.taskmanager.repository;

import com.example.taskmanager.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repositório para operações de acesso a dados da entidade Usuario.
 * Estende JpaRepository para CRUD padrão.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    /**
     * Busca usuário pelo email (utilizado para login e validação de unicidade).
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Verifica existência por email.
     */
    boolean existsByEmail(String email);

    /**
     * Verifica existência por nome de usuário.
     */
    boolean existsByNomeUsuario(String nomeUsuario);
    
    /**
     * Busca usuário pelo nome de usuário.
     */
    Optional<Usuario> findByNomeUsuario(String nomeUsuario);
}
