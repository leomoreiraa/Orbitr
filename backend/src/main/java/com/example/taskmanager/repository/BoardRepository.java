package com.example.taskmanager.repository;

import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    List<Board> findByUsuarioOrderByCriadoEmAsc(Usuario usuario);
}
