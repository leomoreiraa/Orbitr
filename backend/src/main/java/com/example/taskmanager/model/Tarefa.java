package com.example.taskmanager.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * Entidade que representa uma tarefa atribuída a um usuário.
 */
@Entity
@Table(name = "tarefas")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Identificador único

    @NotBlank
    @Size(min = 3, max = 150)
    private String titulo; // Título resumido da tarefa

    @Column(length = 2000)
    private String descricao; // Descrição detalhada

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusTarefa status = StatusTarefa.PENDENTE; // Status atual

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao; // Data/hora de criação

    private LocalDateTime dataConclusao; // Data/hora de conclusão (quando CONCLUIDA)

    private LocalDateTime dataLimite; // Data/hora limite (deadline)

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private PrioridadeTarefa prioridade = PrioridadeTarefa.NORMAL; // Prioridade da tarefa

    private Integer posicao; // Ordem dentro da coluna (status ou column)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", foreignKey = @ForeignKey(name = "fk_tarefa_board"))
    private Board board; // board ao qual a tarefa pertence

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", foreignKey = @ForeignKey(name = "fk_tarefa_column"))
    private BoardColumn column; // coluna dinâmica

    /**
     * Relacionamento muitos-para-um com Usuário. Muitas tarefas podem pertencer a um usuário.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_tarefa_usuario"))
    @JsonIgnore
    private Usuario usuario; // Usuário dono da tarefa

    public Tarefa() {}

    public Tarefa(String titulo, String descricao, Usuario usuario) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.usuario = usuario;
    }

    // Callbacks para preencher datas automaticamente
    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
    }

    @PostLoad
    public void postLoad() {
        // Poderia ser usado para inicializações adicionais
    }

    // Atualiza dataConclusao quando status muda para CONCLUIDA
    public void setStatus(StatusTarefa status) {
        this.status = status;
        if (status == StatusTarefa.CONCLUIDA) {
            this.dataConclusao = LocalDateTime.now();
        }
    }

    // Getters e Setters restantes
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public StatusTarefa getStatus() { return status; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public LocalDateTime getDataConclusao() { return dataConclusao; }
    public void setDataConclusao(LocalDateTime dataConclusao) { this.dataConclusao = dataConclusao; }

    public LocalDateTime getDataLimite() { return dataLimite; }
    public void setDataLimite(LocalDateTime dataLimite) { this.dataLimite = dataLimite; }

    public Integer getPosicao() { return posicao; }
    public void setPosicao(Integer posicao) { this.posicao = posicao; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Board getBoard() { return board; }
    public void setBoard(Board board) { this.board = board; }
    public BoardColumn getColumn() { return column; }
    public void setColumn(BoardColumn column) { this.column = column; }

    public PrioridadeTarefa getPrioridade() { return prioridade; }
    public void setPrioridade(PrioridadeTarefa prioridade) { this.prioridade = prioridade; }
}
