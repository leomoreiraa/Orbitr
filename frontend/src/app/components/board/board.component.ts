import { Component, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, TarefaDto } from '../../services/task.service';
import { BoardService, BoardDto, BoardColumnDto } from '../../services/board.service';
import { BoardStateService } from '../../services/board-state.service';
import { FilterService } from '../../services/filter.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { NotaTarefaService, NotaTarefaDto, CriarNotaRequest } from '../../services/nota-tarefa.service';
// Removido CDK Drag Drop para implementação nativa
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog.component';
import { TaskSimpleDialogComponent } from '../task-simple-dialog/task-simple-dialog.component';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';
import { TaskCreateDialogComponent } from '../task-create-dialog/task-create-dialog.component';
import { TaskRealtimeService } from '../../services/task-realtime.service';
import { TaskNotepadComponent } from '../task-notepad/task-notepad.component';

interface ColumnState { id: number; titulo: string; ordem: number; }

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, TaskNotepadComponent],
  templateUrl: './board.component.html',
  styles: [`
    .drop-zone {
      transition: all 0.2s ease;
    }
    
    .drop-zone.drag-over {
      background: rgba(59, 130, 246, 0.1);
      border: 2px dashed #3b82f6;
      border-radius: 12px;
      transform: scale(1.02);
    }
    
    .task-card {
      cursor: pointer;
      transition: all 0.2s ease;
      max-height: 300px;
      overflow: hidden;
      background: var(--surface) !important;
      border: 1px solid var(--border) !important;
      border-radius: 0.75rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    
    .task-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
    }
    
    .task-card.dragging {
      transform: scale(1.05) rotate(3deg);
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      z-index: 1000;
      position: fixed;
      pointer-events: none;
    }
    
    .drag-handle {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .task-card:hover .drag-handle {
      opacity: 1;
    }
    
    .column {
      min-height: 100px;
    }
  `]
})
export class BoardComponent implements OnDestroy {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private boardState = inject(BoardStateService);
  private filters = inject(FilterService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private notaTarefaService = inject(NotaTarefaService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private realtime = inject(TaskRealtimeService);
  private realtimeUnsubscribe?: () => void;

  loading = signal(false);
  error = signal<string | null>(null);
  tasks = signal<TarefaDto[]>([]);
  boards = this.boardState.boards;
  currentBoardId = this.boardState.currentBoardId;
  columns = signal<ColumnState[]>([]);
  editingColumnId = signal<number | null>(null);
  editingTaskId = signal<number | null>(null);
  tempEditText = signal<string>('');
  showNewBoardForm = signal(false); // descontinuado: mantido p/ backward; agora usamos dialog
  newBoardName = signal('');
  showNewColumnForm = signal(false);
  newColumnTitle = signal('');
  
  // Notepad flutuante
  activeNotepad = signal<{task: TarefaDto, position: {x: number, y: number}} | null>(null);
  private tasksRefreshSubscription?: Subscription;
  private realtimeFallbackSubscription?: Subscription;
  
  currentBoardName = computed(() => {
    const boardId = this.currentBoardId();
    return this.boards().find(b => b.id === boardId)?.nome || 'Board';
  });

  tasksByColumn = computed(() => {
    const map: Record<number, TarefaDto[]> = {};
    this.columns().forEach(c => map[c.id] = []);
    const term = this.filters.search().trim().toLowerCase();
    
  // debug logs removed
    
    for (const t of this.tasks()) {
      if (term && !(`${t.titulo} ${t.descricao || ''}`.toLowerCase().includes(term))) continue;
      const sf = this.filters.status();
      if (sf === 'PENDING' && t.status === 'CONCLUIDA') continue;
      if (sf === 'DONE' && t.status !== 'CONCLUIDA') continue;
      
      // Usa column_id como fonte principal
      const colId = t.column_id || t.column?.id;
  // internal tracing removed
      if (colId && map[colId]) {
        map[colId].push(t);
  // debug removed
      } else {
  // debug removed
      }
    }
  // debug removed
    return map;
  });

  total = computed(() => this.tasks().length);
  done = computed(() => this.tasks().filter(t => t.status === 'CONCLUIDA').length); // provisório até remover status

  constructor() { 
    this.init(); 
    
    // Reage às mudanças no estado de autenticação
    effect(() => {
      const isAuth = this.authService.authChanged();
      if (isAuth) this.boardState.loadBoards(true);
    });
    
    // Reage a mudanças do board atual
    effect(() => {
      const id = this.currentBoardId();
      if (id) {
        this.loadColumns(id);
        this.loadTasks(id);
        this.startAutoRefreshTasks();
      } else {
        this.columns.set([]);
        this.tasks.set([]);
        this.stopAutoRefreshTasks();
      }
    });

    // Fallback polling if realtime disconnects
    effect(() => {
      // Use connectionChange signal so effect runs when connection toggles
      const change = this.realtime.connectionChange();
      // If not connected, start fallback polling
      if (!this.realtime.isConnected()) {
        this.startRealtimeFallback();
      } else {
        this.stopRealtimeFallback();
      }
    });
  }

  private init() {
    // Verifica autenticação na inicialização
    if (this.authService.isAuthenticated()) {
      this.boardState.loadBoards(true);
    }
    
    this.realtime.connect();
    if (typeof window !== 'undefined') {
      window.addEventListener('open-new-column-form', () => {
        this.showNewColumnForm.set(true);
        setTimeout(()=>{
          const el = document.querySelector('input[name="columnTitle"]') as HTMLInputElement | null;
          el?.focus();
        },50);
      });
    }
    // Register realtime listener (do not overwrite global handle)
    this.realtimeUnsubscribe = this.realtime.addListener((evt: any) => {
      const type = evt.type;
      if (type === 'TASK_CREATED') {
        const t = evt.task as any;
        const taskBoardId = t?.board?.id ?? t?.board_id ?? t?.boardId ?? (t?.column?.board?.id ?? t?.column?.boardId ?? null);
        const current = this.currentBoardId();
        if (current && taskBoardId && taskBoardId === current) {
          if (!this.tasks().some(x => x.id === t.id)) this.tasks.set([...this.tasks(), t]);
        } else if (current && (!taskBoardId || taskBoardId !== current)) {
          // If we can't determine board or it's for another board, refresh current board to be safe
          this.loadTasks(current);
        }
      } else if (type === 'TASK_UPDATED') {
        const t = evt.task as any;
        const taskBoardId = t?.board?.id ?? t?.board_id ?? t?.boardId ?? (t?.column?.board?.id ?? t?.column?.boardId ?? null);
        const current = this.currentBoardId();
        if (current && taskBoardId && taskBoardId === current) {
          this.tasks.set(this.tasks().map(x => x.id === t.id ? t : x));
        } else if (current) {
          this.loadTasks(current);
        }
      } else if (type === 'TASK_DELETED') {
        const id = evt.id;
        if (id != null) {
          this.tasks.set(this.tasks().filter(t => t.id !== id));
        } else {
          const current = this.currentBoardId(); if (current) this.loadTasks(current);
        }
      } else if (type === 'TASKS_REORDERED') {
        const current = this.currentBoardId();
        if (evt.boardId && current === evt.boardId) {
          if (current != null) this.loadTasks(current);
        } else if (evt.boardId === -1 && current != null) {
          // fallback genérico
          this.loadTasks(current);
        }
      }
      // Column events
      else if (type === 'COLUMN_CREATED') {
        const col = evt.column as any;
        const boardId = evt.boardId ?? col?.board?.id ?? col?.boardId;
        const current = this.currentBoardId();
        if (current && boardId === current) {
          // append and sort by ordem if available
          const cols = [...this.columns()];
          cols.push({ id: col.id, titulo: col.titulo, ordem: col.ordem ?? cols.length + 1 });
          cols.sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0));
          this.columns.set(cols);
        }
      } else if (type === 'COLUMN_UPDATED') {
        const col = evt.column as any;
        const boardId = evt.boardId ?? col?.board?.id ?? col?.boardId;
        const current = this.currentBoardId();
        if (current && boardId === current) {
          this.columns.set(this.columns().map(c => c.id === col.id ? { id: col.id, titulo: col.titulo, ordem: col.ordem ?? c.ordem } : c));
        }
      } else if (type === 'COLUMN_DELETED') {
        const colId = evt.columnId ?? evt.id;
        const boardId = evt.boardId;
        const current = this.currentBoardId();
        if (current && boardId === current) {
          this.columns.set(this.columns().filter(c => c.id !== colId));
          // also remove tasks that belonged to that column
          this.tasks.set(this.tasks().filter(t => (t.column?.id ?? t.column_id) !== colId));
        }
      }
      // Board-related events
      if (type === 'BOARD_SHARED' || type === 'BOARD_UNSHARED' || type === 'BOARD_UPDATED') {
        this.boardState.loadBoards(true);
      }
    });
  }

  ngOnDestroy(): void {
    try { this.realtimeUnsubscribe && this.realtimeUnsubscribe(); } catch {}
    try { this.closeNotepad(); } catch {}
    try { this.stopAutoRefreshTasks(); } catch {}
  }


  private startAutoRefreshTasks() {
    this.stopAutoRefreshTasks();
    this.tasksRefreshSubscription = interval(5000)
      .pipe(
        switchMap(() => {
          const boardId = this.currentBoardId();
          if (boardId) return this.taskService.listByBoard(boardId);
          return [] as any;
        })
      )
      .subscribe({
        next: (list: any) => {
          if (Array.isArray(list)) this.tasks.set(list);
        },
        error: (err) => console.error('Erro no auto-refresh das tarefas:', err)
      });
  }

  private startRealtimeFallback() {
    this.stopRealtimeFallback();
    const boardId = this.currentBoardId();
    if (!boardId) return;
    this.realtimeFallbackSubscription = interval(5000)
      .pipe(
        switchMap(() => this.taskService.listByBoard(boardId))
      )
      .subscribe({ next: (list: any) => { if (Array.isArray(list)) this.tasks.set(list); }, error: () => {} });
  }

  private stopRealtimeFallback() {
    if (this.realtimeFallbackSubscription) {
      this.realtimeFallbackSubscription.unsubscribe();
      this.realtimeFallbackSubscription = undefined;
    }
  }

  private stopAutoRefreshTasks() {
    if (this.tasksRefreshSubscription) {
      this.tasksRefreshSubscription.unsubscribe();
      this.tasksRefreshSubscription = undefined;
    }
  }

  selectBoard(id: number) {
    if (this.currentBoardId() === id) return;
    this.boardState.select(id);
    this.loadColumns(id);
    this.loadTasks(id);
  }

  openCreateBoardDialog() {
    const ref = this.dialog.open(CreateBoardDialogComponent, {
      panelClass: 'task-detail-dialog',
      disableClose: true
    });
    ref.afterClosed().subscribe(result => {
      if (result?.nome) {
        this.boardService.createBoard(result.nome, result.icon).subscribe({
          next: b => { this.boardState.add(b, () => this.boardState.select(b.id)); },
          error: err => console.error('Erro criar board', err)
        });
      }
    });
  }

  // Compatibilidade: ainda existe botão em empty state chamando createBoard()
  createBoard() { this.openCreateBoardDialog(); }

  renameCurrentBoard() {
    const id = this.currentBoardId();
    if (!id) return;
    const atual = this.boards().find(b => b.id === id)?.nome || '';
    const nome = prompt('Renomear board:', atual);
    if (!nome) return;
    this.boardService.renameBoard(id, nome).subscribe({
      next: b => this.boardState.update(b),
      error: err => console.error('Erro renomear', err)
    });
  }

  loadColumns(boardId: number) {
    this.boardService.listColumns(boardId).subscribe({
      next: cols => this.columns.set(cols.map(c => ({ id: c.id, titulo: c.titulo, ordem: c.ordem }))),
      error: err => console.error('Erro colunas', err)
    });
  }

  addColumn() {
    const boardId = this.currentBoardId();
    if (!boardId) return;
    const titulo = this.newColumnTitle().trim();
    if (!titulo) { return; }
    this.boardService.createColumn(boardId, titulo).subscribe({
      next: c => { this.columns.set([...this.columns(), { id: c.id, titulo: c.titulo, ordem: c.ordem }].sort((a,b)=>a.ordem-b.ordem)); this.newColumnTitle.set(''); this.showNewColumnForm.set(false); },
      error: err => console.error('Erro criar coluna', err)
    });
  }

  deleteCurrentBoard() {
    const id = this.currentBoardId();
    if (!id) return;
    if (!confirm('Excluir este board e suas colunas?')) return;
    this.boardService.deleteBoard(id).subscribe({
      next: () => { this.boardState.remove(id); this.columns.set([]); this.tasks.set([]); },
      error: err => console.error('Erro excluir board', err)
    });
  }

  deleteColumn(col: ColumnState) {
    if (!confirm('Excluir coluna e tarefas associadas?')) return;
    this.boardService.deleteColumn(col.id).subscribe({
      next: () => { this.columns.set(this.columns().filter(c => c.id!==col.id)); this.tasks.set(this.tasks().filter(t => t.column?.id !== col.id)); },
      error: err => console.error('Erro excluir coluna', err)
    });
  }

  loadTasks(boardId: number) {
  // load tasks for board
    this.loading.set(true);
    this.taskService.listByBoard(boardId).subscribe({
      next: list => { this.tasks.set(list); this.loading.set(false); },
      error: err => { this.error.set('Erro ao carregar tarefas'); this.loading.set(false); }
    });
  }

  // Sistema de drag and drop melhorado
  isDragging = signal(false);
  draggedTask = signal<TarefaDto | null>(null);
  dragPreview = signal<HTMLElement | null>(null);
  dragStartPosition = signal<{x: number, y: number} | null>(null);
  dropZoneColumn = signal<number | null>(null);
  isDragReady = signal(false);
  dragStartTime = signal(0);
  
  // Novos métodos de drag and drop
  onTaskClick(task: TarefaDto, event: Event) {
    // Só abre detalhes se não for drag nem clique em botões
    if (!this.isDragReady() && !(event.target as HTMLElement).closest('button')) {
      this.openDetails(task, event as MouseEvent);
    }
  }

  onTaskMouseDown(event: MouseEvent, task: TarefaDto) {
    // Só inicia drag se clicar no drag handle
    if (!(event.target as HTMLElement).closest('.drag-handle')) {
      return;
    }

    if (event.button !== 0) return; // Apenas botão esquerdo
    
    event.preventDefault();
    event.stopPropagation();
    
    this.dragStartTime.set(Date.now());
    this.dragStartPosition.set({ x: event.clientX, y: event.clientY });
    this.draggedTask.set(task);
    this.isDragReady.set(true);
    
    // Adiciona listeners globais para detectar movimento
    document.addEventListener('mousemove', this.onDragMouseMove.bind(this));
    document.addEventListener('mouseup', this.onDragMouseUp.bind(this));
    document.body.style.userSelect = 'none';
  }

  private onDragMouseMove(event: MouseEvent) {
    if (!this.isDragReady() && !this.isDragging()) return;
    
    const startPos = this.dragStartPosition();
    if (!startPos) return;
    
    const distance = Math.sqrt(
      Math.pow(event.clientX - startPos.x, 2) + 
      Math.pow(event.clientY - startPos.y, 2)
    );
    
    // Só inicia drag se mover pelo menos 5px
    if (distance > 5 && this.isDragReady()) {
      this.startDragging(event);
    }
    
    if (this.isDragging()) {
      this.updateDragPreview(event);
      this.updateDropZone(event);
    }
  }

  private startDragging(event: MouseEvent) {
    this.isDragging.set(true);
    this.isDragReady.set(false);
    
    const task = this.draggedTask();
    if (!task) return;
    
    // Cria preview
    this.createDragPreview(event, task);
    document.body.style.cursor = 'grabbing';
  }

  private createDragPreview(event: MouseEvent, task: TarefaDto) {
    const preview = document.createElement('div');
    preview.innerHTML = `
      <div style="background: var(--surface); color: var(--text); border-radius: 0.5rem; padding: 0.75rem; max-width: 20rem; pointer-events: none; box-shadow: 0 10px 25px -10px rgba(0,0,0,0.4); border: 1px solid var(--border);">
        <div style="font-weight:500; font-size:0.9rem;">${task.titulo}</div>
        <div style="font-size:0.75rem; color: var(--text-soft); margin-top:0.25rem;">${task.column?.titulo || ''}</div>
      </div>
    `;
    preview.style.position = 'fixed';
    preview.style.top = `${event.clientY - 20}px`;
    preview.style.left = `${event.clientX - 50}px`;
    preview.style.zIndex = '1000';
    preview.style.pointerEvents = 'none';
    preview.style.transform = 'rotate(5deg) scale(1.05)';
    preview.style.transition = 'transform 0.2s ease';
    
    document.body.appendChild(preview);
    this.dragPreview.set(preview);
  }

  private updateDragPreview(event: MouseEvent) {
    const preview = this.dragPreview();
    if (!preview) return;
    
    preview.style.left = `${event.clientX - 50}px`;
    preview.style.top = `${event.clientY - 20}px`;
  }

  private updateDropZone(event: MouseEvent) {
    // Remove classes anteriores
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    // Detecta zona de drop
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
    const dropZone = elementUnderMouse?.closest('[data-column-id]') as HTMLElement;
    
    if (dropZone) {
      const columnId = parseInt(dropZone.dataset['columnId'] || '0');
      const draggedTask = this.draggedTask();
      
      if (draggedTask && columnId !== draggedTask.column?.id) {
        this.dropZoneColumn.set(columnId);
        dropZone.classList.add('drag-over');
        document.body.style.cursor = 'grabbing';
      } else {
        this.dropZoneColumn.set(null);
        document.body.style.cursor = 'not-allowed';
      }
    } else {
      this.dropZoneColumn.set(null);
      document.body.style.cursor = 'grabbing';
    }
  }

  private onDragMouseUp(event: MouseEvent) {
    // Limpa listeners
    document.removeEventListener('mousemove', this.onDragMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onDragMouseUp.bind(this));
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (this.isDragging()) {
      this.completeDrag();
    } else if (this.isDragReady()) {
      // Era um clique simples, não drag
      this.isDragReady.set(false);
    }
    
    this.resetDragState();
  }

  private completeDrag() {
    const preview = this.dragPreview();
    const dropColumnId = this.dropZoneColumn();
    const draggedTask = this.draggedTask();
    
    if (preview) {
      if (dropColumnId && draggedTask && dropColumnId !== draggedTask.column?.id) {
        // Animação de sucesso
        preview.style.transform = 'scale(0.8) rotate(0deg)';
        preview.style.opacity = '0.8';
        this.moveTaskToColumn(draggedTask, dropColumnId);
      } else {
        // Animação de falha
        preview.style.transform = 'scale(0.5) rotate(-10deg)';
        preview.style.opacity = '0';
      }
      
      setTimeout(() => {
        preview.remove();
        this.dragPreview.set(null);
      }, 200);
    }
    
    // Remove classes de drop zone
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  }

  private resetDragState() {
    this.isDragging.set(false);
    this.isDragReady.set(false);
    this.draggedTask.set(null);
    this.dropZoneColumn.set(null);
    this.dragStartPosition.set(null);
    this.dragStartTime.set(0);
  }

  private moveTaskToColumn(task: TarefaDto, newColumnId: number) {
    // Verifica se a tarefa tem ID válido
    if (!task.id) {
      console.error('Tarefa sem ID válido');
      return;
    }
    
    const previousColumnId = task.column?.id;
    const targetColumn = this.columns().find(c => c.id === newColumnId);
    
    if (!targetColumn) {
      console.error('Coluna de destino não encontrada');
      return;
    }
    
    // Atualização otimista com informações corretas da coluna
    const currentTasks = this.tasks();
    const updatedTasks = currentTasks.map(t => 
      t.id === task.id ? { 
        ...t, 
        column: { 
          id: newColumnId, 
          titulo: targetColumn.titulo, 
          ordem: targetColumn.ordem 
        } 
      } : t
    );
    this.tasks.set(updatedTasks);
    
    // Atualiza no backend
    this.taskService.moveToColumn(task.id, newColumnId).subscribe({
      next: (updated: any) => {
        // Atualiza com dados do servidor (garantindo que a coluna está correta)
        const finalTasks = this.tasks().map(t => 
          t.id === task.id ? { 
            ...updated, 
            column: updated.column || { 
              id: newColumnId, 
              titulo: targetColumn.titulo, 
              ordem: targetColumn.ordem 
            } 
          } : t
        );
        this.tasks.set(finalTasks);
        this.recalculatePositionsColumns();
        this.persistReorderColumns();
        
        // Notifica mudança
        if (typeof previousColumnId === 'number' && typeof task.id === 'number') {
          this.realtime.notifyTaskMoved(task.id, previousColumnId, newColumnId);
        }
      },
      error: (err) => {
        console.error('Erro ao mover tarefa:', err);
        // Reverte mudança
        const boardId = this.currentBoardId();
        if (boardId) this.loadTasks(boardId);
        this.error.set('Erro ao mover tarefa. Tente novamente.');
      }
    });
  }

  private recalculatePositions() {
    const all = this.tasks();
    const byStatus: Record<string, TarefaDto[]> = {};
    for (const t of all) {
      const k = t.status || 'PENDENTE';
      (byStatus[k] ||= []).push(t);
    }
    Object.values(byStatus).forEach(list => {
      // manter ordem atual do array e apenas reatribuir posições sequenciais
      list.forEach((t,i) => t.position = i+1);
    });
  }

  private recalculatePositionsColumns() {
    const byColumn: Record<number, TarefaDto[]> = {} as any;
    for (const t of this.tasks()) {
      const cid = t.column?.id; if (!cid) continue;
      (byColumn[cid] ||= []).push(t);
    }
    Object.values(byColumn).forEach(list => list.forEach((t,i) => t.position = i+1));
  }

  private persistReorder() {
    const bid = this.currentBoardId();
    const payload = this.tasks().map(t => ({ id: t.id, posicao: t.position, status: t.status, boardId: bid }));
    this.taskService.reorderTasks(payload).subscribe({
      error: err => { console.error('Falha ao reordenar', err); const b = this.currentBoardId(); if (b) this.loadTasks(b); }
    });
  }

  private persistReorderColumns() {
    const bid = this.currentBoardId();
    const payload = this.tasks().map(t => ({ id: t.id, posicao: t.position, status: t.status, columnId: t.column?.id, boardId: bid }));
    this.taskService.reorderTasks(payload).subscribe({
      error: err => { console.error('Falha ao reordenar colunas', err); const b = this.currentBoardId(); if (b) this.loadTasks(b); }
    });
  }

  onSelectBoard(event: Event) {
    const sel = event.target as HTMLSelectElement | null;
    if (sel && sel.value) this.selectBoard(+sel.value);
  }

  onEditInput(event: Event) {
    const inp = event.target as HTMLInputElement | null;
    if (inp) this.tempEditText.set(inp.value);
  }

  formatDue(t: TarefaDto) {
    if (!t.dueDate) return '';
    try { return this.relativeTime(new Date(t.dueDate)); } catch { return t.dueDate; }
  }

  private relativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const abs = Math.abs(diffMs);
    const minutes = Math.round(abs / 60000);
    if (minutes < 1) return diffMs < 0 ? 'agora (atrasada)' : 'agora';
    if (minutes < 60) return diffMs < 0 ? `${minutes}m atrasada` : `em ${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return diffMs < 0 ? `${hours}h atrasada` : `em ${hours}h`;
    const days = Math.round(hours / 24);
    return diffMs < 0 ? `${days}d atrasada` : `em ${days}d`;
  }

  isOverdue(t: TarefaDto): boolean {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getTime() < Date.now();
  }

  isDueSoon(t: TarefaDto): boolean {
    if (!t.dueDate) return false;
    const now = Date.now();
    const d = new Date(t.dueDate).getTime();
    if (d < now) return false;
    const THRESHOLD = 36 * 60 * 60 * 1000; // 36h
    return d - now <= THRESHOLD;
  }

  /**
   * Calcula o status do prazo baseado no tempo restante vs tempo total
   * Retorna: 'verde' | 'amarelo' | 'vermelho' | 'vermelho-escuro' | null
   */
  getDeadlineStatus(t: TarefaDto): string | null {
    if (!t.dueDate || !t.criadoEm) return null;
    
    const now = Date.now();
    const deadline = new Date(t.dueDate).getTime();
    const created = new Date(t.criadoEm).getTime();
    
    if (deadline <= now) {
      return 'vermelho-escuro'; // Prazo já passou
    }
    
    const totalTime = deadline - created;
    const remainingTime = deadline - now;
    const percentRemaining = remainingTime / totalTime;
    
    // Últimas 10% do tempo total (vermelho escuro)
    if (percentRemaining <= 0.1) {
      return 'vermelho-escuro';
    }
    // Últimas 25% do tempo total (vermelho)
    else if (percentRemaining <= 0.25) {
      return 'vermelho';
    }
    // 25% a 50% do tempo restante (amarelo)
    else if (percentRemaining <= 0.5) {
      return 'amarelo';
    }
    // Mais de 50% do tempo restante (verde)
    else {
      return 'verde';
    }
  }

  /**
   * Retorna a cor CSS para o status de prazo
   */
  getDeadlineColor(status: string | null): string {
    switch (status) {
      case 'verde': return '#10b981'; // green-500
      case 'amarelo': return '#f59e0b'; // amber-500
      case 'vermelho': return '#ef4444'; // red-500
      case 'vermelho-escuro': return '#dc2626'; // red-600
      default: return 'transparent';
    }
  }

  /**
   * Retorna a cor da borda baseada na prioridade
   */
  getPriorityBorderColor(prioridade?: string): string {
    switch (prioridade?.toLowerCase()) {
      case 'baixa': return '#10b981'; // green-500
      case 'normal': return '#3b82f6'; // blue-500
      case 'alta': return '#f59e0b'; // amber-500
      case 'urgente': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  }

  quickAddInColumn(col: ColumnState) {
    const boardId = this.currentBoardId(); if (!boardId) return;
    
    const ref = this.dialog.open(TaskCreateDialogComponent, { disableClose: true });
    ref.afterClosed().subscribe(result => {
      
      if (result?.titulo) {
        const payload: any = { titulo: result.titulo, descricao: result.descricao };
        if (result.dueDate) payload.dueDate = result.dueDate;
        
        this.taskService.createInBoardColumn(boardId, col.id, payload).subscribe({
          next: (t:any) => {
            this.tasks.set([...this.tasks(), t]);
            // Recarregar tarefas para garantir sincronização
            setTimeout(() => this.loadTasks(boardId), 100);
          },
          error: err => {
            console.error('🔍 [CREATE TASK DEBUG] Erro criar tarefa:', err);
          }
        });
      }
    });
  }

  startEditColumn(col: ColumnState) { this.editingColumnId.set(col.id); this.tempEditText.set(col.titulo); }
  commitEditColumn(col: ColumnState) {
    const val = this.tempEditText().trim();
    if (!val || val === col.titulo) { this.editingColumnId.set(null); return; }
    this.boardService.renameColumn(col.id, val).subscribe({
      next: upd => { this.columns.set(this.columns().map(c => c.id===col.id ? { ...c, titulo: upd.titulo } : c)); this.editingColumnId.set(null); },
      error: err => { console.error('Erro renomear coluna', err); this.editingColumnId.set(null); }
    });
  }
  cancelEditColumn() { this.editingColumnId.set(null); }

  startEditTask(t: TarefaDto) { this.editingTaskId.set(t.id!); this.tempEditText.set(t.titulo); }
  commitEditTask(t: TarefaDto) {
    const val = this.tempEditText().trim();
    if (!val || val === t.titulo) { this.editingTaskId.set(null); return; }
    this.taskService.update(t.id!, { ...t, titulo: val }).subscribe({
      next: upd => { this.tasks.set(this.tasks().map(x => x.id===t.id ? { ...x, titulo: upd.titulo } : x)); this.editingTaskId.set(null); },
      error: err => { console.error('Erro atualizar tarefa', err); this.editingTaskId.set(null); }
    });
  }
  cancelEditTask() { this.editingTaskId.set(null); }

  openDetails(t: TarefaDto, ev: Event) {
    if ((ev.target as HTMLElement).closest('.drag-handle')) return; // ignora clique no handle
    
    
    const dialogRef = this.dialog.open(TaskEditDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      hasBackdrop: true,
      disableClose: false,
      data: { task: t }
    });

    dialogRef.afterClosed().subscribe(result => {
    
      if (result?.action === 'updated') {
        // Atualiza a tarefa específica no estado local
        const updatedTask = result.task;
        this.tasks.set(this.tasks().map(t => t.id === updatedTask.id ? updatedTask : t));
      } else if (result?.action === 'deleted') {
        // Remove a tarefa do estado local
        this.tasks.set(this.tasks().filter(t => t.id !== result.taskId));
      }
    });
  }

  openTaskNotes(t: TarefaDto, event: Event) {
    event.stopPropagation();
    // Abre o dialog de detalhes da tarefa que já contém o componente de notas
    this.openDetails(t, event);
  }

  async openShareDialog() {
    if (!this.currentBoardId()) return;
    
    const currentBoard = this.boards().find(b => b.id === this.currentBoardId());
    if (!currentBoard) return;

    const { BoardShareDialogComponent } = await import('../board-share-dialog/board-share-dialog.component');
    this.dialog.open(BoardShareDialogComponent, {
      width: '550px',
      maxWidth: '90vw',
      data: { board: currentBoard }
    });
  }

  // ===== MÉTODOS PARA NOTEPAD FLUTUANTE =====
  
  stopPropagation(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  
  toggleNotesPanel(task: TarefaDto, event: Event) {
    // Múltiplas proteções contra propagação
    this.stopPropagation(event);
    
    const currentNotepad = this.activeNotepad();
    if (currentNotepad && currentNotepad.task.id === task.id) {
      this.closeNotepad();
    } else {
      this.openNotepad(task, event);
    }
  }

  private openNotepad(task: TarefaDto, event: Event) {
    // Calcula posição ao lado do card da tarefa
    const target = event.target as HTMLElement;
    const taskCard = target.closest('.task-card') as HTMLElement;
    
    if (taskCard) {
      const rect = taskCard.getBoundingClientRect();
      const position = {
        x: rect.right + 10, // 10px à direita do card
        y: rect.top
      };
      
      // Ajusta para não sair da tela
      if (position.x + 280 > window.innerWidth) {
        position.x = rect.left - 290; // Move para esquerda se não cabe à direita
      }
      
      if (position.y + 400 > window.innerHeight) {
        position.y = window.innerHeight - 410; // Ajusta altura se não cabe
      }
      
      this.activeNotepad.set({ task, position });
    }
  }

  closeNotepad() {
    this.activeNotepad.set(null);
  }

  onNotepadClose() {
    this.closeNotepad();
  }

}