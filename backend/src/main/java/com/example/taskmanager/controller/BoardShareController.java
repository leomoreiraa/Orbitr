package com.example.taskmanager.controller;

import com.example.taskmanager.model.BoardShare;
import com.example.taskmanager.model.SharePermission;
import com.example.taskmanager.service.BoardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@CrossOrigin(origins = "http://localhost:4200")
public class BoardShareController {
    
    private final BoardService boardService;
    
    public BoardShareController(BoardService boardService) {
        this.boardService = boardService;
    }
    
    @PostMapping("/{boardId}/share")
    public ResponseEntity<BoardShare> compartilharBoard(
            @PathVariable Long boardId,
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        
        String email = request.get("email").toString();
        String permissionStr = request.getOrDefault("permission", "VIEW").toString();
        SharePermission permission = SharePermission.valueOf(permissionStr.toUpperCase());
        
        BoardShare share = boardService.compartilharBoard(boardId, email, auth.getName(), permission);
        return ResponseEntity.ok(share);
    }
    
    @GetMapping("/{boardId}/shared")
    public ResponseEntity<List<BoardShare>> listarCompartilhamentos(
            @PathVariable Long boardId,
            Authentication auth) {
        
        List<BoardShare> shares = boardService.listarCompartilhamentos(boardId, auth.getName());
        return ResponseEntity.ok(shares);
    }
    
    @PostMapping("/{boardId}/unshare")
    public ResponseEntity<Void> removerCompartilhamento(
            @PathVariable Long boardId,
            @RequestBody Map<String, String> request,
            Authentication auth) {
        
        String email = request.get("emailRemover");
        boardService.removerCompartilhamento(boardId, email, auth.getName());
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> verificarPermissao(
            @PathVariable Long boardId,
            @RequestParam(defaultValue = "VIEW") String permission,
            Authentication auth) {
        
        SharePermission perm = SharePermission.valueOf(permission.toUpperCase());
        boolean temPermissao = boardService.temPermissao(boardId, auth.getName(), perm);
        
        return ResponseEntity.ok(Map.of(
            "hasPermission", temPermissao,
            "requestedPermission", permission
        ));
    }
}