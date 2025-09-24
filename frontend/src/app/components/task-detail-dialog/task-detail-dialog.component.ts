import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TarefaDto, TaskService } from '../../services/task.service';
import { TaskNotesComponent } from '../task-notes/task-notes.component';

export interface TaskDetailData { task: TarefaDto; }

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, TaskNotesComponent],
  template: `
  <div class="w-[600px] max-w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h2 class="text-xl font-bold mb-2">{{ data.task.titulo }}</h2>
          <div class="flex items-center gap-4 text-sm opacity-90">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" [class]="getStatusColor()"></span>
              {{ getStatusLabel() }}
            </span>
            <span *ngIf="data.task.dueDate" class="flex items-center gap-1">
              <span>⏰</span>
              {{ data.task.dueDate | date:'dd/MM/yyyy HH:mm' }}
            </span>
          </div>
        </div>
        <button 
          (click)="close()" 
          class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <span class="text-lg">✕</span>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-6">
      <!-- Descrição -->
      <div class="space-y-2">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Descrição</h3>
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <p 
            *ngIf="data.task.descricao; else noDesc" 
            class="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap"
          >
            {{ data.task.descricao }}
          </p>
          <ng-template #noDesc>
            <p class="text-gray-500 dark:text-gray-400 italic">Nenhuma descrição foi adicionada para esta tarefa.</p>
          </ng-template>
        </div>
      </div>

      <!-- Informações adicionais -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Coluna</h3>
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <span class="text-gray-800 dark:text-gray-200">
              {{ data.task.column?.titulo || 'Sem coluna' }}
            </span>
          </div>
        </div>
        
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Criada em</h3>
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <span class="text-gray-800 dark:text-gray-200">
              {{ data.task.criadoEm | date:'dd/MM/yyyy HH:mm' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tags (se existirem) -->
      <div *ngIf="data.task.tags && data.task.tags.length > 0" class="space-y-2">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tags</h3>
        <div class="flex flex-wrap gap-2">
          <span 
            *ngFor="let tag of data.task.tags" 
            class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Task Notes Section -->
    <app-task-notes [task]="data.task"></app-task-notes>

    <!-- Footer -->
    <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
      <button 
        (click)="close()" 
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        Fechar
      </button>
      <button 
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
      >
        Editar Tarefa
      </button>
    </div>
  </div>
  `,
  styles: []
})
export class TaskDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TaskDetailData,
    private dialogRef: MatDialogRef<TaskDetailDialogComponent>
  ) {}

  getStatusLabel(): string {
    switch (this.data.task.status) {
      case 'CONCLUIDA': return 'Concluída';
      case 'PENDENTE': return 'Pendente';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      default: return 'Pendente';
    }
  }

  getStatusColor(): string {
    switch (this.data.task.status) {
      case 'CONCLUIDA': return 'bg-green-500';
      case 'PENDENTE': return 'bg-yellow-500';
      case 'EM_ANDAMENTO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  }

  close() { 
    this.dialogRef.close(); 
  }
}
