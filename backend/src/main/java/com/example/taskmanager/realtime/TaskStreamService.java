package com.example.taskmanager.realtime;

import com.example.taskmanager.model.Tarefa;
import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.Usuario;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TaskStreamService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private static final long TIMEOUT = 0L; // never time out (client controls)

    public SseEmitter register() {
        SseEmitter emitter = new SseEmitter(TIMEOUT);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        // Send a ping/hello event
        sendRaw(emitter, Map.of(
                "type","INIT",
                "ts", Instant.now().toString()
        ));
        return emitter;
    }

    private void sendRaw(SseEmitter emitter, Object data) {
        try { emitter.send(SseEmitter.event().name("task").data(data, MediaType.APPLICATION_JSON)); }
        catch (IOException e) { emitter.complete(); emitters.remove(emitter); }
    }

    private void broadcast(Object payload) {
        for (SseEmitter emitter : emitters) {
            sendRaw(emitter, payload);
        }
    }

    /**
     * Broadcast an arbitrary payload (useful for ad-hoc events)
     */
    public void sendGeneric(Map<String,Object> payload) {
        broadcast(payload);
    }

    public void sendTask(String type, Tarefa t) {
        if (t == null) return;
        broadcast(Map.of(
                "type", type,
                "task", t
        ));
    }

    public void sendTask(String type, Tarefa t, String actorName) {
        if (t == null) return;
        broadcast(Map.of(
                "type", type,
                "task", t,
                "by", actorName
        ));
    }

    public void sendDeleted(Long id) {
        broadcast(Map.of(
                "type","TASK_DELETED",
                "id", id
        ));
    }

    public void sendReorder(Long boardId) {
        broadcast(Map.of(
                "type","TASKS_REORDERED",
                "boardId", boardId
        ));
    }

    public void sendBoardShared(Board board, Usuario usuarioComQuemCompartilhou) {
        // delegate to generic with real name when possible
        String sharedWith = usuarioComQuemCompartilhou == null ? null : usuarioComQuemCompartilhou.getNome();
        sendGeneric(Map.of("type","BOARD_SHARED","board",board,"sharedWith",sharedWith));
    }

    public void sendBoardUnshared(Long boardId, String nomeUsuario) {
        sendGeneric(Map.of("type","BOARD_UNSHARED","boardId",boardId,"unsharedFrom",nomeUsuario));
    }

    public void sendBoardUpdated(Board board) {
        broadcast(Map.of(
                "type", "BOARD_UPDATED",
                "board", board
        ));
    }

    public void sendBoardUpdated(Board board, String actorName) {
        sendGeneric(Map.of("type","BOARD_UPDATED","board",board,"by",actorName));
    }
}
