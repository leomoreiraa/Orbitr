package com.example.taskmanager.repository;

import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.BoardColumn;
import com.example.taskmanager.model.NotaTarefa;
import com.example.taskmanager.model.Tarefa;
import com.example.taskmanager.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Repositório para entidade NotaTarefa.
 */
public interface NotaTarefaRepository extends JpaRepository<NotaTarefa, Long> {

    /**
     * Remove todas as visualizações das notas das tarefas de uma coluna específica.
     * Usa JOIN para acessar a coluna da tarefa corretamente.
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM nota_visualizacao WHERE nota_id IN (SELECT nt.id FROM notas_tarefa nt JOIN tarefas t ON nt.tarefa_id = t.id WHERE t.column_id = :columnId)", nativeQuery = true)
    void deleteVisualizacoesByColumnId(@Param("columnId") Long columnId);

    /**
     * Lista todas as notas de uma tarefa que o usuário pode visualizar
     * (públicas ou dirigidas especificamente a ele ou criadas por ele)
     */
    @Query("SELECT n FROM NotaTarefa n WHERE n.tarefa = :tarefa AND " +
           "(n.publica = true OR n.destinatario = :usuario OR n.autor = :usuario) " +
           "ORDER BY n.dataCriacao ASC")
    List<NotaTarefa> findVisibleByTarefaAndUsuario(@Param("tarefa") Tarefa tarefa, @Param("usuario") Usuario usuario);

    List<NotaTarefa> findByTarefaAndPublicaTrueOrderByDataCriacaoAsc(Tarefa tarefa);

    List<NotaTarefa> findByTarefaAndAutorOrderByDataCriacaoAsc(Tarefa tarefa, Usuario autor);

    @Query("SELECT COUNT(n) FROM NotaTarefa n WHERE n.tarefa = :tarefa AND " +
           "(n.publica = true OR n.destinatario = :usuario) AND " +
           "n.autor != :usuario AND " +
           ":usuario NOT MEMBER OF n.usuariosQueVisualizaram")
    long countUnreadByTarefaAndUsuario(@Param("tarefa") Tarefa tarefa, @Param("usuario") Usuario usuario);

    void deleteByTarefa(Tarefa tarefa);
       /**
        * Remove notas das tarefas que pertencem à coluna informada (por id).
        * Usamos query nativa para evitar problemas na geração de SQL pelo Hibernate
        * ao tentar limpar tabelas de coleção relacionadas.
        */
       @Modifying
       @Transactional
       @Query(value = "DELETE FROM notas_tarefa WHERE tarefa_id IN (SELECT id FROM tarefas WHERE column_id = :columnId)", nativeQuery = true)
       void deleteByTarefaColumnId(@Param("columnId") Long columnId);

       /**
        * Remove notas das tarefas que pertencem ao board informado (por id).
        */
       @Modifying
       @Transactional
       @Query(value = "DELETE FROM notas_tarefa WHERE tarefa_id IN (SELECT id FROM tarefas WHERE board_id = :boardId)", nativeQuery = true)
       void deleteByTarefaBoardId(@Param("boardId") Long boardId);
}
