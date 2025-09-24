import { Component, inject, input, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaTarefaService, NotaTarefaDto, CriarNotaRequest } from '../../services/nota-tarefa.service';
import { AuthService } from '../../services/auth.service';
import { TarefaDto } from '../../services/task.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TaskRealtimeService } from '../../services/task-realtime.service';

@Component({
  selector: 'app-task-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Notas</span>
          <span *ngIf="unreadCount() > 0" 
                class="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            {{ unreadCount() }}
          </span>
        </div>
        <button (click)="toggleExpanded()" 
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <span [innerHTML]="expanded() ? '▼' : '▲'"></span>
        </button>
      </div>

      <!-- Content -->
      <div *ngIf="expanded()" class="p-4 space-y-4">
        <!-- Notes List -->
        <div class="max-h-60 overflow-y-auto space-y-3">
          <div *ngFor="let nota of notas(); trackBy: trackByNota" 
               class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 relative">
            
            <!-- Note Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {{ getInitials(nota.autor?.nome || 'Anônimo') }}
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ nota.autor?.nome || 'Anônimo' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ nota.dataCriacao | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
                <div *ngIf="!nota.publica" class="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <span>🔒</span>
                  <span>Privada</span>
                </div>
              </div>
              
              <!-- Delete Button (only for author) -->
              <button *ngIf="canDeleteNote(nota)" 
                      (click)="deleteNote(nota.id!)" 
                      class="text-red-500 hover:text-red-700 text-xs">
                🗑️
              </button>
            </div>

            <!-- Note Content -->
            <div class="text-sm text-gray-800 dark:text-gray-200 mb-2">
              {{ nota.conteudo }}
            </div>

            <!-- View Status -->
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span *ngIf="nota.usuariosQueVisualizaram && nota.usuariosQueVisualizaram.length > 0">
                Visualizada por {{ nota.usuariosQueVisualizaram.length }} pessoa(s)
              </span>
              <span *ngIf="!nota.publica && nota.destinatario">
                Para: {{ nota.destinatario.nome }}
              </span>
            </div>
          </div>

          <div *ngIf="notas().length === 0" class="text-center text-gray-500 dark:text-gray-400 py-4">
            Nenhuma nota ainda. Seja o primeiro a adicionar uma!
          </div>
        </div>

        <!-- Add Note Form -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="space-y-3">
            <textarea 
              [(ngModel)]="newNoteContent" 
              placeholder="Adicionar uma nota..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              rows="2">
            </textarea>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" 
                         [(ngModel)]="newNotePublic" 
                         class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  <span class="text-gray-700 dark:text-gray-300">Pública</span>
                </label>
                
                <!-- TODO: Add user selection for private notes -->
                <div *ngIf="!newNotePublic" class="text-xs text-gray-500">
                  (Nota privada - implementar seleção de destinatário)
                </div>
              </div>
              
              <div class="flex gap-2">
                <button (click)="clearForm()" 
                        class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  Cancelar
                </button>
                <button (click)="addNote()" 
                        [disabled]="!newNoteContent.trim() || loading()"
                        class="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ loading() ? 'Enviando...' : 'Enviar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TaskNotesComponent implements OnDestroy {
  private notaService = inject(NotaTarefaService);
  private authService = inject(AuthService);
  private realtime = inject(TaskRealtimeService);
  
  // Inputs
  task = input.required<TarefaDto>();
  
  // State
  notas = signal<NotaTarefaDto[]>([]);
  unreadCount = signal(0);
  expanded = signal(false);
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

    // Register realtime handlers (store unsubscribes)
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
    } catch (e) {
      // ignore if realtime not connected
    }
  }
  
  ngOnDestroy() {
    this.stopAutoRefresh();
    for (const u of this.realtimeUnsubscribes) try { u(); } catch {}
  }
  
  toggleExpanded() {
    this.expanded.set(!this.expanded());
    if (this.expanded()) {
      this.loadNotes();
      this.markAllAsRead();
    }
  }
  
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
    if (!confirm('Tem certeza que deseja excluir esta nota?')) return;
    
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
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.email === nota.autor?.email;
  }
  
  getInitials(name: string): string {
    return name.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
    
    // Refresh every 5 seconds when expanded
    this.refreshSubscription = interval(5000)
      .pipe(
        switchMap(() => {
          if (this.expanded()) {
            return this.notaService.listarNotas(this.task().id!);
          }
          return [];
        })
      )
      .subscribe({
        next: (notas) => {
          if (Array.isArray(notas) && notas.length >= 0) {
            this.notas.set(notas);
          }
        },
        error: (error) => {
          console.error('Erro no auto-refresh das notas:', error);
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