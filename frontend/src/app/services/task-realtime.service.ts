import { Injectable, inject } from '@angular/core';
import { TaskService, TarefaDto } from './task.service';
import { effect, signal } from '@angular/core';

interface TaskEventCreated { type: 'TASK_CREATED' | 'TASK_UPDATED'; task: TarefaDto; by?: string }
interface TaskEventDeleted { type: 'TASK_DELETED'; id: number; by?: string }
interface TaskEventReordered { type: 'TASKS_REORDERED'; boardId: number }
interface BoardEventShared { type: 'BOARD_SHARED'; board: any; sharedWith?: string; by?: string }
interface BoardEventUnshared { type: 'BOARD_UNSHARED'; boardId: number; unsharedFrom?: string; by?: string }
interface BoardEventUpdated { type: 'BOARD_UPDATED'; board: any; by?: string }

@Injectable({ providedIn: 'root' })
export class TaskRealtimeService {
  private taskService = inject(TaskService);
  private source?: EventSource;
  connected = signal(false);
  // signal that components can react to connection changes
  connectionChange = signal<number>(0);
  eventsLog = signal<any[]>([]);
  private listeners: Array<(evt: any) => void> = [];

  connect() {
    if (this.source) return;
    this.source = new EventSource('http://localhost:8080/tarefas/stream');
    this.source.onopen = () => this.connected.set(true);
  this.source.onerror = () => { this.connected.set(false); this.connectionChange.update(n => n+1); };
    this.source.addEventListener('task', (e: any) => {
      try {
        const data = JSON.parse(e.data);
          // keep recent raw events (max 50) to inspect in runtime
          this.eventsLog.update(l => [...l.slice(-50), data]);
          this.dispatch(data);
      } catch {}
    });
  }

  private dispatch(evt: any) {
    try { console.debug('[realtime] dispatching event', evt); } catch {}
    // Call all registered listeners
    for (const l of this.listeners.slice()) {
      try { l(evt); } catch (e) { console.error('Realtime listener error', e); }
    }
    // keep old single-handle behaviour compatibility
    try { (this as any).handle && (this as any).handle(evt); } catch {}
  }

  private ensureConnected() {
    if (!this.source) this.connect();
  }

  /**
   * Returns whether the client currently believes the EventSource connection is active.
   */
  isConnected(): boolean {
    return this.connected();
  }

  // Backwards-compatible single-handle slot (kept for older code paths)
  handle(evt: any) { return; }

  /**
   * Register a generic listener. Returns an unsubscribe function.
   */
  addListener(cb: (evt: any) => void): () => void {
    this.ensureConnected();
    this.listeners.push(cb);
    return () => {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  notifyTaskMoved(taskId: number, fromColumnId: number, toColumnId: number) {
    // Método para notificar movimento de tarefa
    // Pode ser usado para logging ou notificações futuras
  // task moved notification (no debug log)
  }

  // NOTE events helpers
  onNoteCreated(cb: (note: any) => void) {
    return this.addListener((evt: any) => { if (evt?.type === 'NOTE_CREATED') cb(evt.note); });
  }

  onNoteUpdated(cb: (note: any) => void) {
    return this.addListener((evt: any) => { if (evt?.type === 'NOTE_UPDATED') cb(evt.note); });
  }

  onNoteDeleted(cb: (id: number) => void) {
    return this.addListener((evt: any) => { if (evt?.type === 'NOTE_DELETED') cb(evt.id); });
  }
}
