package com.example.taskmanager.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Entidade que representa um usuário do sistema.
 */
@Entity
@Table(name = "usuarios", uniqueConstraints = {
        @UniqueConstraint(name = "uk_usuario_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_usuario_nome_usuario", columnNames = "nomeUsuario")
})
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Identificador único

    @NotBlank
    @Size(min = 2, max = 100)
    private String nome; // Nome completo do usuário

    @NotBlank
    @Email
    @Size(max = 120)
    private String email; // Email único (login)

    @NotBlank
    @Size(min = 6)
    @JsonIgnore
    private String senha; // Senha codificada (BCrypt)

    @Size(max = 30)
    private String nomeUsuario; // Nome de usuário único

    @Size(max = 20)
    private String telefone; // Telefone (opcional)

    private java.time.LocalDate dataNascimento; // Data de nascimento

    /**
     * Relacionamento OneToMany inverso com tarefa. Mapeado pelo atributo 'usuario' em Tarefa.
     * Fetch LAZY para não carregar automaticamente todas as tarefas de um usuário em cada consulta.
     */
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Tarefa> tarefas = new ArrayList<>();

    // Construtor padrão exigido pelo JPA
    public Usuario() {}

    public Usuario(String nome, String email, String senha) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    public String getNomeUsuario() { return nomeUsuario; }
    public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public java.time.LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(java.time.LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }

    public List<Tarefa> getTarefas() { return tarefas; }
    public void setTarefas(List<Tarefa> tarefas) { this.tarefas = tarefas; }

    // Métodos utilitários para manter consistência bidirecional
    public void addTarefa(Tarefa tarefa) {
        tarefas.add(tarefa);
        tarefa.setUsuario(this);
    }

    public void removeTarefa(Tarefa tarefa) {
        tarefas.remove(tarefa);
        tarefa.setUsuario(null);
    }
}
