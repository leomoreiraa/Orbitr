package com.example.taskmanager.service;

import com.example.taskmanager.model.*;
import com.example.taskmanager.repository.*;
import com.example.taskmanager.realtime.TaskStreamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
@Transactional
public class BoardService {
    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);

    private final BoardRepository boardRepository;
    private final BoardColumnRepository columnRepository;
    private final UsuarioRepository usuarioRepository;
    private final TarefaRepository tarefaRepository;
    private final BoardShareRepository boardShareRepository;
    private final TaskStreamService taskStreamService;
    private final EmailService emailService;
    private final NotaTarefaRepository notaTarefaRepository;

    public BoardService(BoardRepository boardRepository, BoardColumnRepository columnRepository,
                        UsuarioRepository usuarioRepository, TarefaRepository tarefaRepository,
                        BoardShareRepository boardShareRepository, TaskStreamService taskStreamService,
                        EmailService emailService, NotaTarefaRepository notaTarefaRepository) {
        this.boardRepository = boardRepository;
        this.columnRepository = columnRepository;
        this.usuarioRepository = usuarioRepository;
        this.tarefaRepository = tarefaRepository;
        this.boardShareRepository = boardShareRepository;
        this.taskStreamService = taskStreamService;
        this.emailService = emailService;
        this.notaTarefaRepository = notaTarefaRepository;
    }

    public Board criarParaEmail(String email, String nome, String icon) {
        logger.debug("BOARD CRIAR - Email: {}, Nome: {}", email, nome);
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        logger.debug("BOARD CRIAR - Usuario ID: {}, Nome: {}", usuario.getId(), usuario.getNome());

        Board b = new Board();
        b.setNome(nome);
        b.setUsuario(usuario);
        if (icon != null && !icon.isBlank()) b.setIcon(icon.trim());
        Board salvo = boardRepository.save(b);
        logger.info("Board criado com ID: {}", salvo.getId());

        // Cria uma coluna default
        BoardColumn c = new BoardColumn();
        c.setBoard(salvo);
        c.setTitulo("Geral");
        c.setOrdem(1);
        columnRepository.save(c);
        logger.info("Coluna default criada para board ID: {}", salvo.getId());
        return salvo;
    }

    @Transactional(readOnly = true)
    public List<Board> listar(String email) {
        logger.debug("BOARD LISTAR - Email: {}", email);
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        logger.debug("BOARD LISTAR - Usuario ID: {}, Nome: {}", usuario.getId(), usuario.getNome());

        // Boards próprias
        List<Board> ownBoards = boardRepository.findByUsuarioOrderByCriadoEmAsc(usuario);
        logger.debug("BOARD LISTAR - Own boards count: {}", ownBoards.size());
        ownBoards.forEach(b -> logger.trace("Own Board: {} - {}", b.getId(), b.getNome()));

        // Boards compartilhadas comigo - FORÇAR INICIALIZAÇÃO PARA EVITAR PROXY
        List<BoardShare> sharedBoards = boardShareRepository.findBySharedWith(usuario);
        List<Board> sharedBoardsList = sharedBoards.stream()
            .map(share -> {
                Board board = share.getBoard();
                // Força a inicialização do proxy do Hibernate
                board.getId();
                board.getNome();
                return board;
            })
            .toList();
        logger.debug("BOARD LISTAR - Shared boards count: {}", sharedBoardsList.size());
        sharedBoardsList.forEach(b -> logger.trace("Shared Board: {} - {}", b.getId(), b.getNome()));

        // Criar uma nova lista para evitar problemas de referência
        List<Board> allBoards = new ArrayList<>(ownBoards);
        allBoards.addAll(sharedBoardsList);
        logger.debug("BOARD LISTAR - Total boards returned: {}", allBoards.size());
        return allBoards;
    }

    @Transactional(readOnly = true)
    public com.example.taskmanager.dto.BoardsSeparatedResponse listarSeparadas(String email) {
        logger.debug("BOARD LISTAR SEPARADAS - Email: {}", email);
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        // Boards próprias
        List<Board> ownBoards = boardRepository.findByUsuarioOrderByCriadoEmAsc(usuario);
        logger.debug("BOARD LISTAR SEPARADAS - Own boards: {}", ownBoards.size());

        // Boards compartilhadas comigo - usando query com JOIN FETCH para evitar proxies lazy
        List<BoardShare> sharedBoards = boardShareRepository.findBySharedWithWithBoardAndOwner(usuario);
        List<Board> sharedBoardsList = sharedBoards.stream()
            .map(BoardShare::getBoard)
            .toList();
        logger.debug("BOARD LISTAR SEPARADAS - Shared boards: {}", sharedBoardsList.size());

        return new com.example.taskmanager.dto.BoardsSeparatedResponse(ownBoards, sharedBoardsList);
    }

    @Transactional(readOnly = true)
    public List<BoardColumn> colunas(Long boardId) {
        Board b = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        return columnRepository.findByBoardOrderByOrdemAsc(b);
    }

    public BoardColumn criarColuna(Long boardId, String titulo) {
        Board b = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        int ordem = columnRepository.findByBoardOrderByOrdemAsc(b).size() + 1;
        BoardColumn c = new BoardColumn();
        c.setBoard(b);
        c.setTitulo(titulo);
        c.setOrdem(ordem);
        BoardColumn saved = columnRepository.save(c);
        // Emitir evento realtime para criação de coluna
        try {
            Map<String,Object> colDto = Map.of(
                    "id", saved.getId(),
                    "titulo", saved.getTitulo(),
                    "ordem", saved.getOrdem(),
                    "boardId", boardId
            );
            taskStreamService.sendGeneric(Map.of("type", "COLUMN_CREATED", "column", colDto, "boardId", boardId));
        } catch (Exception e) {
            logger.warn("Erro ao emitir evento COLUMN_CREATED: {}", e.getMessage());
        }
        return saved;
    }
    
    public BoardColumn renomearColuna(Long columnId, String titulo) {
        BoardColumn c = columnRepository.findById(columnId).orElseThrow(() -> new IllegalArgumentException("Coluna não encontrada"));
        c.setTitulo(titulo);
        BoardColumn saved = columnRepository.save(c);
        try {
            Map<String,Object> colDto = Map.of(
                    "id", saved.getId(),
                    "titulo", saved.getTitulo(),
                    "ordem", saved.getOrdem(),
                    "boardId", saved.getBoard().getId()
            );
            taskStreamService.sendGeneric(Map.of("type", "COLUMN_UPDATED", "column", colDto, "boardId", saved.getBoard().getId()));
        } catch (Exception e) {
            logger.warn("Erro ao emitir evento COLUMN_UPDATED: {}", e.getMessage());
        }
        return saved;
    }

    public Board renomear(Long id, String nome) {
        Board b = boardRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        b.setNome(nome);
        return b;
    }

    @Transactional
    public void deletar(Long id) {
        Board b = boardRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        
        // Primeiro, deletar todas as notas das tarefas do board
        notaTarefaRepository.deleteByTarefaBoardId(b.getId());
        
        // Depois remove todas as tarefas do board
        tarefaRepository.deleteByBoard(b);
        
        // Remove colunas
        List<BoardColumn> cols = columnRepository.findByBoardOrderByOrdemAsc(b);
        for (BoardColumn c : cols) {
            columnRepository.delete(c);
        }
        
        // Remove o board
        boardRepository.delete(b);
    }

    @Transactional
    public void deletarColuna(Long columnId) {
        BoardColumn c = columnRepository.findById(columnId).orElseThrow(() -> new IllegalArgumentException("Coluna não encontrada"));
        Board board = c.getBoard();

        // Primeiro, remover todas as visualizações das notas das tarefas da coluna
        notaTarefaRepository.deleteVisualizacoesByColumnId(columnId);

        // Depois, deletar todas as notas das tarefas da coluna
        notaTarefaRepository.deleteByTarefaColumnId(columnId);

        // Depois deletar todas as tarefas da coluna
        tarefaRepository.deleteByColumn(c);

        // Depois deletar a coluna
        columnRepository.delete(c);

        // Emitir evento realtime para remoção de coluna
        try {
            taskStreamService.sendGeneric(Map.of("type", "COLUMN_DELETED", "columnId", columnId, "boardId", board.getId()));
        } catch (Exception e) {
            logger.warn("Erro ao emitir evento COLUMN_DELETED: {}", e.getMessage());
        }

        // Reordena restantes
        List<BoardColumn> restantes = columnRepository.findByBoardOrderByOrdemAsc(board);
        int ordem = 1;
        for (BoardColumn rc : restantes) {
            if (rc.getOrdem() != ordem) rc.setOrdem(ordem);
            ordem++;
        }
    }

    // === MÉTODOS DE COMPARTILHAMENTO ===
    
    public BoardShare compartilharBoard(Long boardId, String emailCompartilhar, String emailProprietario, SharePermission permission) {
        Board board = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        Usuario proprietario = usuarioRepository.findByEmail(emailProprietario).orElseThrow(() -> new IllegalArgumentException("Proprietário não encontrado"));
        Usuario usuarioCompartilhar = usuarioRepository.findByEmail(emailCompartilhar).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        
        // Verifica se é o dono do board
        if (!board.getUsuario().equals(proprietario)) {
            throw new IllegalArgumentException("Apenas o proprietário pode compartilhar o board");
        }
        
        // Verifica se já existe compartilhamento
        Optional<BoardShare> existente = boardShareRepository.findByBoardAndSharedWith(board, usuarioCompartilhar);
        if (existente.isPresent()) {
            // Atualiza permissão
            BoardShare share = existente.get();
            share.setPermission(permission);
            BoardShare savedShare = boardShareRepository.save(share);
            
            // Envia notificação de atualização
            // include actor name (owner real name)
            taskStreamService.sendBoardUpdated(board, proprietario.getNome());
            
            return savedShare;
        }
        
        // Cria novo compartilhamento
        BoardShare share = new BoardShare();
        share.setBoard(board);
        share.setSharedBy(proprietario);
        share.setSharedWith(usuarioCompartilhar);
        share.setPermission(permission);
        BoardShare savedShare = boardShareRepository.save(share);
        
    // Envia notificação em tempo real (include shared with real name)
    taskStreamService.sendGeneric(Map.of("type","BOARD_SHARED","board",board,"sharedWith",usuarioCompartilhar.getNome(),"by",proprietario.getNome()));
        
        // Envia email de notificação
        try {
            emailService.enviarNotificacaoCompartilhamentoHTML(board, proprietario, usuarioCompartilhar, permission.name());
        } catch (Exception e) {
            // Log do erro mas não falha a operação
            logger.error("Erro ao enviar email: {}", e.getMessage(), e);
        }
        
        return savedShare;
    }
    
    public void removerCompartilhamento(Long boardId, String emailRemover, String emailProprietario) {
        Board board = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        Usuario proprietario = usuarioRepository.findByEmail(emailProprietario).orElseThrow(() -> new IllegalArgumentException("Proprietário não encontrado"));
        Usuario usuarioRemover = usuarioRepository.findByEmail(emailRemover).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        
        // Verifica se é o dono do board
        if (!board.getUsuario().equals(proprietario)) {
            throw new IllegalArgumentException("Apenas o proprietário pode remover compartilhamentos");
        }
        
        boardShareRepository.deleteByBoardAndSharedWith(board, usuarioRemover);
        
    // Envia notificação em tempo real (use real name)
    taskStreamService.sendGeneric(Map.of("type","BOARD_UNSHARED","boardId",boardId,"unsharedFrom",usuarioRemover.getNome(),"by",proprietario.getNome()));
        
        // Envia email de notificação de remoção
        try {
            emailService.enviarNotificacaoRemocaoCompartilhamento(
                usuarioRemover.getEmail(), 
                board.getNome(), 
                proprietario.getNomeUsuario()
            );
        } catch (Exception e) {
            logger.error("Erro ao enviar email de remoção: {}", e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<BoardShare> listarCompartilhamentos(Long boardId, String emailProprietario) {
        Board board = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        Usuario proprietario = usuarioRepository.findByEmail(emailProprietario).orElseThrow(() -> new IllegalArgumentException("Proprietário não encontrado"));
        
        // Verifica se é o dono do board
        if (!board.getUsuario().equals(proprietario)) {
            throw new IllegalArgumentException("Apenas o proprietário pode ver compartilhamentos");
        }
        
        return boardShareRepository.findByBoard(board);
    }
    
    @Transactional(readOnly = true)  
    public boolean temPermissao(Long boardId, String email, SharePermission permissaoMinima) {
        Board board = boardRepository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        
        // Proprietário sempre tem todas as permissões
        if (board.getUsuario().equals(usuario)) {
            return true;
        }
        
        // Verifica compartilhamento
        Optional<BoardShare> share = boardShareRepository.findByBoardAndSharedWith(board, usuario);
        if (share.isEmpty()) {
            return false;
        }
        
        SharePermission permissaoUsuario = share.get().getPermission();
        
        // VIEW < EDIT
        if (permissaoMinima == SharePermission.VIEW) {
            return true; // Qualquer permissão serve para VIEW
        } else if (permissaoMinima == SharePermission.EDIT) {
            return permissaoUsuario == SharePermission.EDIT;
        }
        
        return false;
    }

    // Método temporário para debug
    @Transactional(readOnly = true)
    public List<Object[]> debugAllShares() {
        return boardShareRepository.findAll().stream()
            .map(share -> new Object[]{
                share.getId(),
                share.getBoard().getId(),
                share.getBoard().getNome(),
                share.getBoard().getUsuario().getEmail(),
                share.getSharedWith().getEmail(),  
                share.getPermission().toString(),
                share.getSharedAt()
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public boolean debugUserExists(String email) {
        return usuarioRepository.findByEmail(email).isPresent();
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> listarMembros(Long boardId, String email) {
        // Busca o usuário que está fazendo a requisição
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        
        // Busca o board
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new IllegalArgumentException("Board não encontrado"));
        
        // Verifica se o usuário tem acesso ao board (é o dono ou tem acesso compartilhado)
        boolean temAcesso = board.getUsuario().equals(usuario) || 
                           boardShareRepository.findByBoardAndSharedWith(board, usuario).isPresent();
        
        if (!temAcesso) {
            throw new IllegalArgumentException("Acesso negado ao board");
        }
        
        List<java.util.Map<String, Object>> membros = new ArrayList<>();
        
        // Adiciona o dono do board
        java.util.Map<String, Object> owner = new java.util.HashMap<>();
        owner.put("id", board.getUsuario().getId());
        owner.put("nome", board.getUsuario().getNome());
        owner.put("email", board.getUsuario().getEmail());
        owner.put("role", "owner");
        membros.add(owner);
        
        // Adiciona usuários com quem o board foi compartilhado
        List<BoardShare> shares = boardShareRepository.findByBoard(board);
        for (BoardShare share : shares) {
            java.util.Map<String, Object> member = new java.util.HashMap<>();
            member.put("id", share.getSharedWith().getId());
            member.put("nome", share.getSharedWith().getNome());
            member.put("email", share.getSharedWith().getEmail());
            member.put("role", share.getPermission().toString().toLowerCase());
            membros.add(member);
        }
        
        return membros;
    }

    @Transactional(readOnly = true)
    public List<Object[]> debugSharedBoardsForUser(String email) {
        try {
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            if (usuario == null) {
                return List.of();
            }
            
            List<BoardShare> shares = boardShareRepository.findBySharedWith(usuario);
            return shares.stream()
                .map(share -> new Object[]{
                    share.getId(),
                    share.getBoard().getId(),
                    share.getBoard().getNome(),
                    share.getSharedWith().getEmail(),
                    share.getPermission().toString()
                })
                .toList();
        } catch (Exception e) {
            return List.of();
        }
    }
}
