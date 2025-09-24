package com.example.taskmanager.service;

import com.example.taskmanager.model.NotaTarefa;
import com.example.taskmanager.model.Tarefa;
import com.example.taskmanager.model.Usuario;
import com.example.taskmanager.repository.NotaTarefaRepository;
import com.example.taskmanager.repository.TarefaRepository;
import com.example.taskmanager.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serviço responsável pela lógica de negócio de Notas de Tarefa.
 */
@Service
@Transactional
public class NotaTarefaService {

    private final NotaTarefaRepository notaRepository;
    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;

    public NotaTarefaService(NotaTarefaRepository notaRepository, 
                           TarefaRepository tarefaRepository, 
                           UsuarioRepository usuarioRepository) {
        this.notaRepository = notaRepository;
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Cria uma nova nota para uma tarefa
     */
    public NotaTarefa criarNota(Long tarefaId, String email, String conteudo, Boolean publica, Long destinatarioId) {
        Tarefa tarefa = tarefaRepository.findById(tarefaId)
                .orElseThrow(() -> new IllegalArgumentException("Tarefa não encontrada"));
        
        Usuario autor = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        NotaTarefa nota = new NotaTarefa(conteudo, tarefa, autor);
        nota.setPublica(publica != null ? publica : true);
        
        if (!nota.getPublica() && destinatarioId != null) {
            Usuario destinatario = usuarioRepository.findById(destinatarioId)
                    .orElseThrow(() -> new IllegalArgumentException("Destinatário não encontrado"));
            nota.setDestinatario(destinatario);
        }

        return notaRepository.save(nota);
    }

    /**
     * Lista notas visíveis para um usuário em uma tarefa
     */
    @Transactional(readOnly = true)
    public List<NotaTarefa> listarNotasVisiveis(Long tarefaId, String email) {
        Tarefa tarefa = tarefaRepository.findById(tarefaId)
                .orElseThrow(() -> new IllegalArgumentException("Tarefa não encontrada"));
        
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        return notaRepository.findVisibleByTarefaAndUsuario(tarefa, usuario);
    }

    /**
     * Marca uma nota como visualizada por um usuário
     */
    public NotaTarefa marcarComoVista(Long notaId, String email) {
        NotaTarefa nota = notaRepository.findById(notaId)
                .orElseThrow(() -> new IllegalArgumentException("Nota não encontrada"));
        
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        nota.addVisualizacao(usuario);
        return notaRepository.save(nota);
    }

    /**
     * Deleta uma nota (qualquer usuário pode deletar)
     */
    public void deletarNota(Long notaId, String email) {
        NotaTarefa nota = notaRepository.findById(notaId)
                .orElseThrow(() -> new IllegalArgumentException("Nota não encontrada"));
        
        // Validação removida - qualquer usuário pode deletar qualquer nota
        notaRepository.delete(nota);
    }

    /**
     * Conta notas não lidas de uma tarefa para um usuário
     */
    @Transactional(readOnly = true)
    public long contarNaoLidas(Long tarefaId, String email) {
        Tarefa tarefa = tarefaRepository.findById(tarefaId)
                .orElseThrow(() -> new IllegalArgumentException("Tarefa não encontrada"));
        
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        return notaRepository.countUnreadByTarefaAndUsuario(tarefa, usuario);
    }

    /**
     * Busca nota por ID
     */
    @Transactional(readOnly = true)
    public NotaTarefa buscarPorId(Long id) {
        return notaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota não encontrada"));
    }
}