package com.example.taskmanager.service;

import com.example.taskmanager.model.*;
import com.example.taskmanager.repository.TarefaRepository;
import com.example.taskmanager.repository.BoardColumnRepository;
import com.example.taskmanager.repository.BoardRepository;
import com.example.taskmanager.repository.UsuarioRepository;
import com.example.taskmanager.repository.NotaTarefaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serviço responsável pela lógica de negócio de Tarefas.
 */
@Service
@Transactional
public class TarefaService {

    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;
    private final BoardRepository boardRepository;
    private final BoardColumnRepository columnRepository;
    private final NotaTarefaRepository notaTarefaRepository;

    public TarefaService(TarefaRepository tarefaRepository, UsuarioRepository usuarioRepository, BoardRepository boardRepository, BoardColumnRepository columnRepository, NotaTarefaRepository notaTarefaRepository) {
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
        this.boardRepository = boardRepository;
        this.columnRepository = columnRepository;
        this.notaTarefaRepository = notaTarefaRepository;
    }

    /**
     * Cria tarefa para um usuário específico.
     */
    public Tarefa criar(Long usuarioId, Tarefa tarefa) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        tarefa.setUsuario(usuario);
        if (tarefa.getPosicao() == null) {
            int next = tarefaRepository.maxPosicaoByUsuarioAndStatus(usuario, tarefa.getStatus());
            tarefa.setPosicao(next + 1);
        }
        return tarefaRepository.save(tarefa);
    }

    /**
     * Cria tarefa para usuário identificado pelo email (subject do token).
     */
    public Tarefa criarParaEmail(String email, Tarefa tarefa) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        tarefa.setUsuario(usuario);
        if (tarefa.getPosicao() == null) {
            int next = tarefaRepository.maxPosicaoByUsuarioAndStatus(usuario, tarefa.getStatus());
            tarefa.setPosicao(next + 1);
        }
        return tarefaRepository.save(tarefa);
    }

    /**
     * Lista todas as tarefas (em produção considerar paginação / filtragem por usuário corrente).
     */
    @Transactional(readOnly = true)
    public List<Tarefa> listarTodas() {
        // Em produção: filtrar por usuário autenticado. Aqui mantém todas ordenadas somente para consistência.
        return tarefaRepository.findAll().stream()
                .sorted((a,b) -> {
                    int s = a.getStatus().name().compareTo(b.getStatus().name());
                    if (s != 0) return s;
                    Integer pa = a.getPosicao();
                    Integer pb = b.getPosicao();
                    if (pa == null && pb == null) return 0;
                    if (pa == null) return 1;
                    if (pb == null) return -1;
                    return pa.compareTo(pb);
                }).toList();
    }

    /**
     * Lista tarefas por usuário.
     */
    @Transactional(readOnly = true)
    public List<Tarefa> listarPorUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        return tarefaRepository.findByUsuario(usuario);
    }

    @Transactional(readOnly = true)
    public List<Tarefa> listarPorBoard(Board board) {
        return tarefaRepository.findByBoard(board).stream()
                .sorted((a,b) -> {
                    BoardColumn ca = a.getColumn();
                    BoardColumn cb = b.getColumn();
                    int co = 0;
                    if (ca != null && cb != null) co = Integer.compare(ca.getOrdem(), cb.getOrdem());
                    else if (ca != null) co = -1; else if (cb != null) co = 1;
                    if (co != 0) return co;
                    Integer pa = a.getPosicao();
                    Integer pb = b.getPosicao();
                    if (pa == null && pb == null) return 0;
                    if (pa == null) return 1; if (pb == null) return -1;
                    return pa.compareTo(pb);
                }).toList();
    }

    /**
     * Busca uma tarefa pelo ID.
     */
    @Transactional(readOnly = true)
    public Tarefa buscarPorId(Long id) {
        return tarefaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tarefa não encontrada"));
    }

    /**
     * Atualiza campos de uma tarefa existente.
     */
    public Tarefa atualizar(Long id, Tarefa dados) {
        Tarefa existente = buscarPorId(id);
        existente.setTitulo(dados.getTitulo());
        existente.setDescricao(dados.getDescricao());
        if (dados.getDataLimite() != null) {
            existente.setDataLimite(dados.getDataLimite());
        }
        if (dados.getStatus() != null) {
            existente.setStatus(dados.getStatus());
        }
        if (dados.getPrioridade() != null) {
            existente.setPrioridade(dados.getPrioridade());
        }
        return tarefaRepository.save(existente);
    }

    /**
     * Atualiza status de uma tarefa.
     */
    public Tarefa atualizarStatus(Long id, StatusTarefa status) {
        Tarefa existente = buscarPorId(id);
        existente.setStatus(status);
        return tarefaRepository.save(existente);
    }

    /**
     * Remove tarefa.
     */
    @Transactional
    public void deletar(Long id) {
        Tarefa existente = buscarPorId(id);
        
        // Primeiro, deletar todas as notas da tarefa
        notaTarefaRepository.deleteByTarefa(existente);
        
        // Depois deletar a tarefa
        tarefaRepository.delete(existente);
    }

    /**
     * Reordena e/ou move tarefas de acordo com lista de triples [id,posicao,status].
     */
    public void reordenar(List<Object[]> dados) {
        for (Object[] arr : dados) {
            Long id = (Long) arr[0];
            Integer pos = (Integer) arr[1];
            StatusTarefa status = (StatusTarefa) arr[2];
            Long columnId = arr.length > 3 ? (Long) arr[3] : null;
            Tarefa t = buscarPorId(id);
            if (status != null && status != t.getStatus()) {
                t.setStatus(status); // legado até remoção
            }
            if (columnId != null) {
                BoardColumn col = columnRepository.findById(columnId).orElseThrow(() -> new IllegalArgumentException("Coluna não encontrada"));
                t.setColumn(col);
                t.setBoard(col.getBoard());
            }
            if (pos != null) {
                t.setPosicao(pos);
            }
        }
    }

    public Tarefa atualizarColuna(Long tarefaId, Long columnId) {
        Tarefa t = buscarPorId(tarefaId);
        BoardColumn col = columnRepository.findById(columnId).orElseThrow(() -> new IllegalArgumentException("Coluna não encontrada"));
        t.setColumn(col);
        t.setBoard(col.getBoard());
        // recalcular posicao: coloca no final da coluna
        int max = tarefaRepository.findByBoard(col.getBoard()).stream().filter(x -> col.equals(x.getColumn())).map(Tarefa::getPosicao).filter(p -> p != null).mapToInt(Integer::intValue).max().orElse(0);
        t.setPosicao(max + 1);
        return t;
    }
}
