package com.example.taskmanager.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidade que representa uma nota/comentário em uma tarefa.
 */
@Entity
@Table(name = "notas_tarefa")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class NotaTarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 1000)
    @Column(nullable = false, length = 1000)
    private String conteudo;

    @Column(nullable = false)
    private Boolean publica = true; // Se false, é apenas para usuário específico

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tarefa_id", nullable = false)
    private Tarefa tarefa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id")
    private Usuario destinatario; // Apenas se não for pública

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "nota_visualizacao",
        joinColumns = @JoinColumn(name = "nota_id"),
        inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private Set<Usuario> usuariosQueVisualizaram = new HashSet<>();

    public NotaTarefa() {}

    public NotaTarefa(String conteudo, Tarefa tarefa, Usuario autor) {
        this.conteudo = conteudo;
        this.tarefa = tarefa;
        this.autor = autor;
    }

    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }

    public Boolean getPublica() { return publica; }
    public void setPublica(Boolean publica) { this.publica = publica; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public Tarefa getTarefa() { return tarefa; }
    public void setTarefa(Tarefa tarefa) { this.tarefa = tarefa; }

    public Usuario getAutor() { return autor; }
    public void setAutor(Usuario autor) { this.autor = autor; }

    public Usuario getDestinatario() { return destinatario; }
    public void setDestinatario(Usuario destinatario) { this.destinatario = destinatario; }

    public Set<Usuario> getUsuariosQueVisualizaram() { return usuariosQueVisualizaram; }
    public void setUsuariosQueVisualizaram(Set<Usuario> usuariosQueVisualizaram) { this.usuariosQueVisualizaram = usuariosQueVisualizaram; }

    public void addVisualizacao(Usuario usuario) {
        this.usuariosQueVisualizaram.add(usuario);
    }

    public void removeVisualizacao(Usuario usuario) {
        this.usuariosQueVisualizaram.remove(usuario);
    }
}