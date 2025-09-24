package com.example.taskmanager.repository;

import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByBoardOrderByOrdemAsc(Board board);
}
