package com.example.taskmanager.service;

import com.example.taskmanager.model.Usuario;
import com.example.taskmanager.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Camada de serviço para regras de negócio relacionadas a Usuario.
 */
@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cria um novo usuário após validar unicidade de email e codificar senha.
     */
    public Usuario criar(Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        // Verificar se nome de usuário é único (se fornecido)
        if (usuario.getNomeUsuario() != null && !usuario.getNomeUsuario().trim().isEmpty()) {
            if (usuarioRepository.existsByNomeUsuario(usuario.getNomeUsuario())) {
                throw new IllegalArgumentException("Nome de usuário já está em uso");
            }
        }
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        return usuarioRepository.save(usuario);
    }

    /**
     * Retorna todos os usuários (em sistemas reais considerar paginação / restrições de acesso).
     */
    @Transactional(readOnly = true)
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    /**
     * Busca usuário por ID ou lança exceção.
     */
    @Transactional(readOnly = true)
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
    }

    /**
     * Atualiza dados básicos (nome e email). Senha tem rota própria (não implementada aqui).
     */
    public Usuario atualizar(Long id, Usuario dados) {
        Usuario existente = buscarPorId(id);
        if (!existente.getEmail().equals(dados.getEmail()) && usuarioRepository.existsByEmail(dados.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        existente.setNome(dados.getNome());
        existente.setEmail(dados.getEmail());
        return usuarioRepository.save(existente);
    }

    /**
     * Exclui usuário por ID.
     */
    public void deletar(Long id) {
        Usuario existente = buscarPorId(id);
        usuarioRepository.delete(existente);
    }

    /**
     * Busca usuário por email (suporte para autenticação).
     */
    @Transactional(readOnly = true)
    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }
    
    /**
     * Busca usuário por nome de usuário
     */
    @Transactional(readOnly = true)
    public Optional<Usuario> buscarPorNomeUsuario(String nomeUsuario) {
        return usuarioRepository.findByNomeUsuario(nomeUsuario);
    }
}
