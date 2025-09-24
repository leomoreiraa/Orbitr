package com.example.taskmanager.repository;

import com.example.taskmanager.model.*;
import com.example.taskmanager.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repositório para entidade Tarefa.
 */
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
    /**
     * Lista tarefas pertencentes a um usuário específico.
     */
    List<Tarefa> findByUsuario(Usuario usuario);

    List<Tarefa> findByUsuarioOrderByStatusAscPosicaoAsc(Usuario usuario);

    @Query("select coalesce(max(t.posicao),0) from Tarefa t where t.usuario = :usuario and t.status = :status")
    Integer maxPosicaoByUsuarioAndStatus(@Param("usuario") Usuario usuario, @Param("status") com.example.taskmanager.model.StatusTarefa status);

    List<Tarefa> findByBoard(Board board);
    
    void deleteByBoard(Board board);
    
    void deleteByColumn(BoardColumn column);
}
