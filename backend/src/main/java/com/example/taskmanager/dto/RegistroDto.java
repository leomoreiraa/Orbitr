package com.example.taskmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * DTO para registro de usuário.
 */
public class RegistroDto {

    @NotBlank
    @Size(min = 2, max = 100)
    private String nome;

    @Size(max = 30)
    private String nomeUsuario;

    @NotBlank
    @Email
    @Size(max = 120)
    private String email;

    @Size(max = 20)
    private String telefone;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataNascimento;

    @NotBlank
    @Size(min = 8)
    private String senha;

    // Construtores
    public RegistroDto() {}

    public RegistroDto(String nome, String nomeUsuario, String email, String telefone, LocalDate dataNascimento, String senha) {
        this.nome = nome;
        this.nomeUsuario = nomeUsuario;
        this.email = email;
        this.telefone = telefone;
        this.dataNascimento = dataNascimento;
        this.senha = senha;
    }

    // Getters e Setters
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getNomeUsuario() { return nomeUsuario; }
    public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}