package com.example.taskmanager.controller;

import com.example.taskmanager.model.*;
import com.example.taskmanager.repository.BoardColumnRepository;
import com.example.taskmanager.repository.BoardRepository;
import com.example.taskmanager.repository.TarefaRepository;
import com.example.taskmanager.repository.UsuarioRepository;
import com.example.taskmanager.service.TarefaService;
import com.example.taskmanager.realtime.TaskStreamService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import java.util.Map;

/**
 * Endpoints para gerenciar Tarefas.
 */
@RestController
@RequestMapping("/tarefas")
public class TarefaController {

    private final TarefaService tarefaService;
    private final BoardRepository boardRepository;
    private final BoardColumnRepository columnRepository;
    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TaskStreamService streamService;
    public TarefaController(TarefaService tarefaService, BoardRepository boardRepository, BoardColumnRepository columnRepository, TarefaRepository tarefaRepository, UsuarioRepository usuarioRepository, TaskStreamService streamService) {
        this.tarefaService = tarefaService;
        this.boardRepository = boardRepository;
        this.columnRepository = columnRepository;
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
        this.streamService = streamService;
    }

    /**
     * Cria uma tarefa vinculada a um usuário (usuarioId via query param ou body; aqui query param para simplicidade).
     */
    @PostMapping
    public ResponseEntity<Tarefa> criar(@Valid @RequestBody Tarefa tarefa) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String email = auth.getName();
    Tarefa salva = tarefaService.criarParaEmail(email, tarefa);
    String actor = usuarioRepository.findByEmail(email).map(u -> u.getNome()).orElse(email);
    streamService.sendTask("TASK_CREATED", salva, actor);
        return ResponseEntity.created(URI.create("/tarefas/" + salva.getId())).body(salva);
    }

    @PostMapping("/board/{boardId}/column/{columnId}")
    public ResponseEntity<Tarefa> criarEmColuna(@PathVariable Long boardId, @PathVariable Long columnId, @RequestBody Map<String,Object> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Board board = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        BoardColumn col = columnRepository.findById(columnId).orElseThrow(() -> new IllegalArgumentException("Coluna não encontrada"));
        if (!col.getBoard().getId().equals(board.getId())) throw new IllegalArgumentException("Coluna não pertence ao board");
        Tarefa t = new Tarefa();
        t.setTitulo((String) body.getOrDefault("titulo","Nova Tarefa"));
        t.setDescricao((String) body.getOrDefault("descricao",""));
        if (body.get("dueDate") != null) {
            try { t.setDataLimite(java.time.LocalDateTime.parse(body.get("dueDate").toString())); } catch (Exception ignored) {}
        }
        t.setStatus(StatusTarefa.PENDENTE); // status provisório
        t.setBoard(board);
        t.setColumn(col);
    Tarefa salva = tarefaService.criarParaEmail(email, t);
        // Salvar novamente para persistir board e column
        salva = tarefaRepository.save(salva);
    String actor2 = usuarioRepository.findByEmail(email).map(u -> u.getNome()).orElse(email);
    streamService.sendTask("TASK_CREATED", salva, actor2);
        return ResponseEntity.created(URI.create("/tarefas/"+salva.getId())).body(salva);
    }

    /**
     * Lista todas as tarefas.
     */
    @GetMapping
    public ResponseEntity<List<Tarefa>> listar() {
        return ResponseEntity.ok(tarefaService.listarTodas());
    }

    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<Tarefa>> listarPorBoard(@PathVariable Long boardId) {
        Board b = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        return ResponseEntity.ok(tarefaService.listarPorBoard(b));
    }

    /**
     * Lista tarefas por usuário.
     */
    @GetMapping("/por-usuario/{usuarioId}")
    public ResponseEntity<List<Tarefa>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(tarefaService.listarPorUsuario(usuarioId));
    }

    /**
     * Busca tarefa por ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Tarefa> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(tarefaService.buscarPorId(id));
    }

    /**
     * Atualiza dados de uma tarefa.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Tarefa> atualizar(@PathVariable Long id, @Valid @RequestBody Tarefa tarefa) {
    Tarefa upd = tarefaService.atualizar(id, tarefa);
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String email = auth.getName();
    String actor3 = usuarioRepository.findByEmail(email).map(u -> u.getNome()).orElse(email);
    streamService.sendTask("TASK_UPDATED", upd, actor3);
        return ResponseEntity.ok(upd);
    }

    /**
     * Atualiza apenas o status.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Tarefa> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        StatusTarefa status = StatusTarefa.valueOf(body.get("status"));
    Tarefa upd = tarefaService.atualizarStatus(id, status);
    Authentication auth2 = SecurityContextHolder.getContext().getAuthentication();
    String email2 = auth2.getName();
    String actor4 = usuarioRepository.findByEmail(email2).map(u -> u.getNome()).orElse(email2);
    streamService.sendTask("TASK_UPDATED", upd, actor4);
        return ResponseEntity.ok(upd);
    }

    @PatchMapping("/reordenar")
    public ResponseEntity<Void> reordenar(@RequestBody List<Map<String,Object>> payload) {
        tarefaService.reordenar(payload.stream().map(m -> new Object[]{
                ((Number)m.get("id")).longValue(),
                m.get("posicao") == null ? null : ((Number)m.get("posicao")).intValue(),
                m.get("status") == null ? null : StatusTarefa.valueOf(m.get("status").toString()),
                m.get("columnId") == null ? null : ((Number)m.get("columnId")).longValue()
        }).toList());
        // tentar extrair boardId de qualquer item (se backend já inclui) ou simplesmente emitir refresh geral
        Long boardId = null;
        if (!payload.isEmpty()) {
            Object b = payload.get(0).get("boardId");
            if (b instanceof Number n) boardId = n.longValue();
        }
        if (boardId != null) {
            streamService.sendReorder(boardId);
        } else {
            streamService.sendReorder(-1L); // indica reorder genérico
        }
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/coluna/{columnId}")
    public ResponseEntity<Tarefa> moverColuna(@PathVariable Long id, @PathVariable Long columnId) {
    Tarefa upd = tarefaService.atualizarColuna(id, columnId);
    Authentication auth3 = SecurityContextHolder.getContext().getAuthentication();
    String email3 = auth3.getName();
    String actor5 = usuarioRepository.findByEmail(email3).map(u -> u.getNome()).orElse(email3);
    streamService.sendTask("TASK_UPDATED", upd, actor5);
        return ResponseEntity.ok(upd);
    }

    /**
     * Deleta tarefa.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
    Authentication auth4 = SecurityContextHolder.getContext().getAuthentication();
    String email4 = auth4.getName();
    String actor6 = usuarioRepository.findByEmail(email4).map(u -> u.getNome()).orElse(email4);
    tarefaService.deletar(id);
    // sendDeleted keeps only id; include actor in a separate event
    streamService.sendDeleted(id);
    streamService.sendGeneric(Map.of("type","TASK_DELETED_BY","id",id,"by",actor6));
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter stream() {
        return streamService.register();
    }
}
