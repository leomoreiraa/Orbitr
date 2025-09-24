package com.example.taskmanager.controller;

import com.example.taskmanager.model.NotaTarefa;
import com.example.taskmanager.service.NotaTarefaService;
import com.example.taskmanager.realtime.TaskStreamService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Endpoints para gerenciar Notas de Tarefa.
 */
@RestController
@RequestMapping("/notas")
public class NotaTarefaController {

    private final NotaTarefaService notaService;
    private final TaskStreamService streamService;

    public NotaTarefaController(NotaTarefaService notaService, TaskStreamService streamService) {
        this.notaService = notaService;
        this.streamService = streamService;
    }

    /**
     * Cria uma nova nota para uma tarefa
     */
    @PostMapping("/tarefa/{tarefaId}")
    public ResponseEntity<NotaTarefa> criarNota(@PathVariable Long tarefaId, @Valid @RequestBody Map<String, Object> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        String conteudo = (String) request.get("conteudo");
        Boolean publica = (Boolean) request.getOrDefault("publica", true);
        Long destinatarioId = request.get("destinatarioId") != null ? 
            Long.parseLong(request.get("destinatarioId").toString()) : null;
        
        NotaTarefa nota = notaService.criarNota(tarefaId, email, conteudo, publica, destinatarioId);
        try {
            Long boardId = nota.getTarefa() != null && nota.getTarefa().getBoard() != null ? nota.getTarefa().getBoard().getId() : null;
            streamService.sendGeneric(Map.of("type", "NOTE_CREATED", "note", nota, "tarefaId", nota.getTarefa().getId(), "boardId", boardId));
        } catch (Exception ignored) {}
        return ResponseEntity.created(URI.create("/notas/" + nota.getId())).body(nota);
    }

    /**
     * Lista notas visíveis para o usuário em uma tarefa
     */
    @GetMapping("/tarefa/{tarefaId}")
    public ResponseEntity<List<NotaTarefa>> listarNotasTarefa(@PathVariable Long tarefaId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        List<NotaTarefa> notas = notaService.listarNotasVisiveis(tarefaId, email);
        return ResponseEntity.ok(notas);
    }

    /**
     * Marca uma nota como visualizada
     */
    @PatchMapping("/{notaId}/visualizar")
    public ResponseEntity<NotaTarefa> marcarComoVista(@PathVariable Long notaId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        NotaTarefa nota = notaService.marcarComoVista(notaId, email);
        try {
            Long boardId = nota.getTarefa() != null && nota.getTarefa().getBoard() != null ? nota.getTarefa().getBoard().getId() : null;
            streamService.sendGeneric(Map.of("type", "NOTE_UPDATED", "note", nota, "tarefaId", nota.getTarefa().getId(), "boardId", boardId));
        } catch (Exception ignored) {}
        return ResponseEntity.ok(nota);
    }

    /**
     * Conta notas não lidas de uma tarefa
     */
    @GetMapping("/tarefa/{tarefaId}/nao-lidas")
    public ResponseEntity<Map<String, Long>> contarNaoLidas(@PathVariable Long tarefaId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        long count = notaService.contarNaoLidas(tarefaId, email);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Deleta uma nota (apenas autor)
     */
    @DeleteMapping("/{notaId}")
    public ResponseEntity<Void> deletarNota(@PathVariable Long notaId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        try {
            NotaTarefa nota = notaService.buscarPorId(notaId);
            Long tarefaId = nota.getTarefa() != null ? nota.getTarefa().getId() : null;
            Long boardId = nota.getTarefa() != null && nota.getTarefa().getBoard() != null ? nota.getTarefa().getBoard().getId() : null;
            notaService.deletarNota(notaId, email);
            try { streamService.sendGeneric(Map.of("type", "NOTE_DELETED", "id", notaId, "tarefaId", tarefaId, "boardId", boardId)); } catch (Exception ignored) {}
        } catch (Exception e) {
            notaService.deletarNota(notaId, email);
            try { streamService.sendGeneric(Map.of("type", "NOTE_DELETED", "id", notaId)); } catch (Exception ignored) {}
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Busca nota por ID
     */
    @GetMapping("/{notaId}")
    public ResponseEntity<NotaTarefa> buscarNota(@PathVariable Long notaId) {
        NotaTarefa nota = notaService.buscarPorId(notaId);
        return ResponseEntity.ok(nota);
    }
}