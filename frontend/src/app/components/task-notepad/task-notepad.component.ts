import { Component, computed, inject, input, signal, effect, OnDestroy, ElementRef, ViewChild, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaTarefaService, NotaTarefaDto, CriarNotaRequest } from '../../services/nota-tarefa.service';
import { AuthService } from '../../services/auth.service';
import { TarefaDto } from '../../services/task.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TaskRealtimeService } from '../../services/task-realtime.service';

@Component({
  selector: 'app-task-notepad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div #notepad
         class="notepad-container bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
         [style.left]="position().x + 'px'"
         [style.top]="position().y + 'px'"
         [style.width]="'280px'"
         [style.max-height]="'400px'"
         [style.position]="'fixed'"
         [style.z-index]="'1000'">
      
      <!-- Header minimalista -->
      <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
            {{ task().titulo }}
          </span>
          <span *ngIf="unreadCount() > 0" 
                class="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[16px] text-center">
            {{ unreadCount() > 9 ? '9+' : unreadCount() }}
          </span>
        </div>
        <button (click)="close()" 
                class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">
          ✕
        </button>
      </div>

      <!-- Lista de notas compacta -->
      <div class="overflow-y-auto max-h-48 p-2 space-y-2">
        <div *ngFor="let nota of notas(); trackBy: trackByNota" 
             class="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm">
          
          <div class="flex items-start justify-between mb-1">
            <div class="flex items-center gap-1">
              <div class="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                {{ getInitials(nota.autor?.nome || '?') }}
              </div>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                {{ (nota.autor?.nome || 'Anônimo').split(' ')[0] }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTime(nota.dataCriacao || '') }}
              </span>
            </div>
            <button *ngIf="canDeleteNote(nota) && nota.id" 
                    (click)="deleteNote(nota.id!)" 
                    class="text-red-400 hover:text-red-600 text-xs">
              🗑
            </button>
          </div>
          
          <p class="text-gray-800 dark:text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{{ nota.conteudo }}</p>
          
          <!-- Indicador de visibilidade -->
          <div class="mt-1" *ngIf="!nota.publica">
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-xs rounded">
              <span *ngIf="nota.destinatario">👤</span>
              <span *ngIf="!nota.destinatario">🔒</span>
              <span *ngIf="nota.destinatario">{{ (nota.destinatario.nome || '').split(' ')[0] }}</span>
              <span *ngIf="!nota.destinatario">Privada</span>
            </span>
          </div>
        </div>
        
        <!-- Mensagem quando não há notas -->
        <div *ngIf="notas().length === 0" 
             class="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
          Nenhuma nota ainda
        </div>
      </div>

      <!-- Formulário compacto -->
      <div class="border-t border-gray-200 dark:border-gray-600 p-2">
        <textarea 
          [(ngModel)]="newNoteContent" 
          placeholder="Nova nota..."
          class="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
          rows="2">
        </textarea>
        
        <div class="flex justify-between items-center mt-2">
          <label class="flex items-center gap-1 text-xs">
            <input type="checkbox" 
                   [(ngModel)]="newNotePublic"
                   class="w-3 h-3">
            <span class="text-gray-600 dark:text-gray-400">Pública</span>
          </label>
          
          <button (click)="addNote()" 
                  [disabled]="!newNoteContent.trim() || loading()"
                  class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading() ? '...' : 'Enviar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notepad-container {
      animation: slideIn 0.2s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class TaskNotepadComponent implements OnDestroy {
  @ViewChild('notepad') notepadElement!: ElementRef;
  
  private notaService = inject(NotaTarefaService);
  private authService = inject(AuthService);
  private realtime = inject(TaskRealtimeService);
  
  // Inputs
  task = input.required<TarefaDto>();
  position = input.required<{x: number, y: number}>();
  
  // State
  notas = signal<NotaTarefaDto[]>([]);
  unreadCount = signal(0);
  loading = signal(false);
  
  // Form
  newNoteContent = '';
  newNotePublic = true;
  
  // Subscriptions
  private refreshSubscription?: Subscription;
  private realtimeUnsubscribes: Array<() => void> = [];
  
  constructor() {
    // Load notes when task changes
    effect(() => {
      const currentTask = this.task();
      if (currentTask?.id) {
        this.loadNotes();
        this.loadUnreadCount();
        this.startAutoRefresh();
      }
    });

    // Realtime handlers (store unsubscribes)
    try {
      this.realtimeUnsubscribes.push(this.realtime.onNoteCreated((note: any) => {
        const currentTaskId = this.task()?.id;
        if (note && note.tarefa && note.tarefa.id === currentTaskId) {
          this.notas.set([...this.notas(), note]);
          this.loadUnreadCount();
        }
      }));

      this.realtimeUnsubscribes.push(this.realtime.onNoteUpdated((note: any) => {
        const currentTaskId = this.task()?.id;
        if (note && note.tarefa && note.tarefa.id === currentTaskId) {
          this.notas.set(this.notas().map(n => n.id === note.id ? note : n));
          this.loadUnreadCount();
        }
      }));

      this.realtimeUnsubscribes.push(this.realtime.onNoteDeleted((id: number) => {
        this.notas.set(this.notas().filter(n => n.id !== id));
        this.loadUnreadCount();
      }));
    } catch (e) {}
  }
  
  ngOnDestroy() {
    this.stopAutoRefresh();
    for (const u of this.realtimeUnsubscribes) try { u(); } catch {}
  }
  
  close() {
    // Emitir evento para o componente pai fechar o notepad
    this.onClose.emit();
  }
  
  // Outputs
  onClose = output<void>();
  
  loadNotes() {
    const taskId = this.task()?.id;
    if (!taskId) return;
    
    this.notaService.listarNotas(taskId).subscribe({
      next: (notas) => {
        this.notas.set(notas);
      },
      error: (error) => {
        console.error('Erro ao carregar notas:', error);
      }
    });
  }
  
  loadUnreadCount() {
    const taskId = this.task()?.id;
    if (!taskId) return;
    
    this.notaService.contarNaoLidas(taskId).subscribe({
      next: (result) => {
        this.unreadCount.set(result.count);
      },
      error: (error) => {
        console.error('Erro ao carregar contagem de notas não lidas:', error);
      }
    });
  }
  
  addNote() {
    const taskId = this.task()?.id;
    if (!taskId || !this.newNoteContent.trim()) return;
    
    this.loading.set(true);
    
    const request: CriarNotaRequest = {
      conteudo: this.newNoteContent.trim(),
      publica: this.newNotePublic
    };
    
    this.notaService.criarNota(taskId, request).subscribe({
      next: (nota) => {
        this.loadNotes(); // Reload to get updated list
        this.clearForm();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao criar nota:', error);
        this.loading.set(false);
      }
    });
  }
  
  deleteNote(notaId: number) {
    if (!confirm('Excluir esta nota?')) return;
    
    this.notaService.deletarNota(notaId).subscribe({
      next: () => {
        this.loadNotes(); // Reload list
      },
      error: (error) => {
        console.error('Erro ao deletar nota:', error);
      }
    });
  }
  
  clearForm() {
    this.newNoteContent = '';
    this.newNotePublic = true;
  }
  
  canDeleteNote(nota: NotaTarefaDto): boolean {
    // Qualquer usuário pode deletar qualquer nota
    return true;
  }
  
  getInitials(name: string): string {
    return name.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  formatTime(date: string): string {
    if (!date) return '';
    
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'agora' : `${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  }
  
  trackByNota(index: number, nota: NotaTarefaDto): number {
    return nota.id!;
  }
  
  private markAllAsRead() {
    // Mark all notes as read when expanded
    this.notas().forEach(nota => {
      if (nota.id && nota.autor?.email !== this.authService.getCurrentUser()?.email) {
        this.notaService.marcarComoVista(nota.id).subscribe();
      }
    });
    this.unreadCount.set(0);
  }
  
  private startAutoRefresh() {
    this.stopAutoRefresh();
    
    // Refresh every 10 seconds
    this.refreshSubscription = interval(10000)
      .pipe(
        switchMap(() => {
          const taskId = this.task()?.id;
          if (taskId) {
            return this.notaService.listarNotas(taskId);
          }
          return [];
        })
      )
      .subscribe({
        next: (notas) => {
          this.notas.set(notas);
          this.markAllAsRead();
        },
        error: (error) => {
          console.error('Erro no auto-refresh:', error);
        }
      });
  }
  
  private stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }
}