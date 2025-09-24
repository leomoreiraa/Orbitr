package com.example.taskmanager.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "board_columns")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BoardColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false, foreignKey = @ForeignKey(name = "fk_column_board"))
    private Board board;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(nullable = false)
    private Integer ordem;

    // Campo opcional para mapear antigo status caso precise migrar
    @Column(length = 30)
    private String legacyStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Board getBoard() { return board; }
    public void setBoard(Board board) { this.board = board; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public Integer getOrdem() { return ordem; }
    public void setOrdem(Integer ordem) { this.ordem = ordem; }
    public String getLegacyStatus() { return legacyStatus; }
    public void setLegacyStatus(String legacyStatus) { this.legacyStatus = legacyStatus; }
}
