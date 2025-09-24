package com.example.taskmanager.controller;

import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.BoardColumn;
import com.example.taskmanager.service.BoardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @GetMapping
    public ResponseEntity<List<Board>> listar() {
        return ResponseEntity.ok(boardService.listar(currentEmail()));
    }

    @GetMapping("/separated")
    public ResponseEntity<com.example.taskmanager.dto.BoardsSeparatedResponse> listarSeparadas() {
        return ResponseEntity.ok(boardService.listarSeparadas(currentEmail()));
    }

    @PostMapping
    public ResponseEntity<Board> criar(@RequestBody Map<String,String> body) {
        String nome = body.getOrDefault("nome","Board");
        String icon = body.getOrDefault("icon","");
        Board b = boardService.criarParaEmail(currentEmail(), nome, icon);
        return ResponseEntity.created(URI.create("/api/boards/"+ b.getId())).body(b);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Board> renomear(@PathVariable Long id, @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(boardService.renomear(id, body.getOrDefault("nome","Board")));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> listarMembros(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.listarMembros(id, currentEmail()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        boardService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/columns")
    public ResponseEntity<List<BoardColumn>> colunas(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.colunas(id));
    }

    @PostMapping("/{id}/columns")
    public ResponseEntity<BoardColumn> criarColuna(@PathVariable Long id, @RequestBody Map<String,String> body) {
        BoardColumn c = boardService.criarColuna(id, body.getOrDefault("titulo","Coluna"));
        return ResponseEntity.created(URI.create("/api/boards/"+id+"/columns/"+c.getId())).body(c);
    }

    @PatchMapping("/columns/{columnId}")
    public ResponseEntity<BoardColumn> renomearColuna(@PathVariable Long columnId, @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(boardService.renomearColuna(columnId, body.getOrDefault("titulo","Coluna")));
    }

    @DeleteMapping("/columns/{columnId}")
    public ResponseEntity<Void> deletarColuna(@PathVariable Long columnId) {
        boardService.deletarColuna(columnId);
        return ResponseEntity.noContent().build();
    }

    // === ENDPOINTS DE COMPARTILHAMENTO ===

    // Endpoint temporário para debug - sem autenticação
    @GetMapping("/debug/shares/{email}")
    public ResponseEntity<Map<String, Object>> debugShares(@PathVariable String email) {
        Map<String, Object> debug = new HashMap<>();
        debug.put("requestedUser", email);
        
        try {
            List<Board> boards = boardService.listar(email);
            debug.put("totalBoards", boards.size());
            debug.put("boards", boards.stream().map(b -> Map.of(
                "id", b.getId(),
                "nome", b.getNome(),
                "owner", b.getUsuario().getEmail()
            )).toList());
            
            // Debug das shares no banco
            List<Object[]> allShares = boardService.debugAllShares();
            debug.put("allSharesInDatabase", allShares);
            
            // Debug do usuário
            debug.put("userExists", boardService.debugUserExists(email));
            debug.put("sharedBoardsForUser", boardService.debugSharedBoardsForUser(email));
            
        } catch (Exception e) {
            debug.put("error", e.getMessage());
            debug.put("stackTrace", java.util.Arrays.toString(e.getStackTrace()));
        }
        
        return ResponseEntity.ok(debug);
    }

}
