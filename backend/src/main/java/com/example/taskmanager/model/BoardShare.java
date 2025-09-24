package com.example.taskmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_shares", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "shared_with_id"}))
public class BoardShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false, foreignKey = @ForeignKey(name = "fk_share_board"))
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_by_id", nullable = false, foreignKey = @ForeignKey(name = "fk_share_shared_by"))
    private Usuario sharedBy; // Quem compartilhou

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_with_id", nullable = false, foreignKey = @ForeignKey(name = "fk_share_shared_with"))
    private Usuario sharedWith; // Com quem foi compartilhado

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SharePermission permission = SharePermission.VIEW; // VIEW, EDIT

    @Column(nullable = false, updatable = false)
    private LocalDateTime sharedAt;

    @PrePersist
    public void prePersist() {
        this.sharedAt = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Board getBoard() { return board; }
    public void setBoard(Board board) { this.board = board; }

    public Usuario getSharedBy() { return sharedBy; }
    public void setSharedBy(Usuario sharedBy) { this.sharedBy = sharedBy; }

    public Usuario getSharedWith() { return sharedWith; }
    public void setSharedWith(Usuario sharedWith) { this.sharedWith = sharedWith; }

    public SharePermission getPermission() { return permission; }
    public void setPermission(SharePermission permission) { this.permission = permission; }

    public LocalDateTime getSharedAt() { return sharedAt; }
    public void setSharedAt(LocalDateTime sharedAt) { this.sharedAt = sharedAt; }
}