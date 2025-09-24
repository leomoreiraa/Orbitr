package com.example.taskmanager.repository;

import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.BoardShare;
import com.example.taskmanager.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardShareRepository extends JpaRepository<BoardShare, Long> {
    
    // Busca todos os compartilhamentos de um board
    List<BoardShare> findByBoard(Board board);
    
    // Busca todas as boards compartilhadas com um usuário
    List<BoardShare> findBySharedWith(Usuario user);
    
    // Busca todas as boards compartilhadas com um usuário, carregando board e usuário proprietário
    @Query("SELECT bs FROM BoardShare bs JOIN FETCH bs.board b JOIN FETCH b.usuario WHERE bs.sharedWith = :user")
    List<BoardShare> findBySharedWithWithBoardAndOwner(@Param("user") Usuario user);
    
    // Verifica se um board foi compartilhado com um usuário específico
    Optional<BoardShare> findByBoardAndSharedWith(Board board, Usuario user);
    
    // Lista todos os usuários que têm acesso a um board (inclui o dono)
    @Query("SELECT DISTINCT bs.sharedWith FROM BoardShare bs WHERE bs.board = :board")
    List<Usuario> findUsersWithAccessToBoard(@Param("board") Board board);
    
    // Remove todos os compartilhamentos de um board
    void deleteByBoard(Board board);
    
    // Remove compartilhamento específico
    void deleteByBoardAndSharedWith(Board board, Usuario user);
}