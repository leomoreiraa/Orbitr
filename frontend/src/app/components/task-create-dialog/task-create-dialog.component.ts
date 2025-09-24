import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-task-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="w-[480px] max-w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <span class="text-blue-600 dark:text-blue-400 text-lg">📝</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Nova Tarefa</h2>
    </div>
    
    <form (ngSubmit)="confirm()" novalidate class="space-y-5">
      <div class="space-y-2">
        <label for="titulo" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Título da Tarefa
        </label>
        <input 
          id="titulo" 
          autofocus 
          name="titulo" 
          type="text" 
          [ngModel]="titulo()" 
          (ngModelChange)="titulo.set($event)" 
          required 
          minlength="3" 
          placeholder="Ex: Revisar documentação do projeto" 
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
        />
        <div *ngIf="titulo().length > 0 && titulo().length < 3" class="text-xs text-red-500">
          Mínimo 3 caracteres
        </div>
      </div>
      
      <div class="space-y-2">
        <label for="descricao" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descrição (Opcional)
        </label>
        <textarea 
          id="descricao" 
          name="descricao" 
          rows="4" 
          [ngModel]="descricao()" 
          (ngModelChange)="descricao.set($event)" 
          placeholder="Adicione detalhes sobre a tarefa..." 
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-y min-h-[100px] transition-colors"
        ></textarea>
      </div>
      
      <div class="space-y-2">
        <label for="due" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Prazo (Opcional)
        </label>
        <input 
          id="due" 
          name="due" 
          type="datetime-local" 
          [ngModel]="dueDate()" 
          (ngModelChange)="dueDate.set($event)" 
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
        />
      </div>
      
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Prioridade
        </label>
        <div class="flex gap-2">
          <button 
            type="button" 
            *ngFor="let p of priorities" 
            (click)="setPriority(p.value)"
            [class]="'px-3 py-2 text-xs rounded-lg border transition-colors flex items-center gap-2 ' + (priority() === p.value ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600')"
          >
            <span>{{ p.icon }}</span>
            <span>{{ p.label }}</span>
          </button>
        </div>
      </div>
      
      <div class="space-y-2">
        <label for="tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags (Opcional)
        </label>
        <input 
          id="tags" 
          name="tags" 
          type="text" 
          [ngModel]="tagsInput()" 
          (ngModelChange)="tagsInput.set($event)" 
          placeholder="Ex: urgente, design, frontend (separar por vírgula)" 
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
        />
        <div *ngIf="getTags().length > 0" class="flex flex-wrap gap-2 mt-2">
          <span 
            *ngFor="let tag of getTags()" 
            class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      
      <div class="flex gap-3 pt-6">
        <button 
          type="button" 
          (click)="close()" 
          class="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          [disabled]="!valid()" 
          class="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Criar Tarefa
        </button>
      </div>
    </form>
  </div>
  `,
  styles: []
})
export class TaskCreateDialogComponent {
  private ref = inject(MatDialogRef<TaskCreateDialogComponent>);
  titulo = signal('');
  descricao = signal('');
  dueDate = signal<string | undefined>(undefined);
  priority = signal<string>('normal');
  tagsInput = signal('');

  priorities = [
    { value: 'baixa', label: 'Baixa', icon: '🟢' },
    { value: 'normal', label: 'Normal', icon: '🟡' },
    { value: 'alta', label: 'Alta', icon: '🟠' },
    { value: 'urgente', label: 'Urgente', icon: '🔴' }
  ];

  setPriority(value: string) {
    this.priority.set(value);
  }

  getTags(): string[] {
    return this.tagsInput()
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  valid() { 
    return this.titulo().trim().length >= 3; 
  }

  confirm() { 
    if (!this.valid()) return; 
    
      const result = {
        titulo: this.titulo().trim(),
        descricao: this.descricao().trim() || null,
        dueDate: this.dueDate() || null,
        prioridade: this.priority().toUpperCase(), // Converte para uppercase para compatibilidade com enum backend
        tags: this.getTags()
      };    this.ref.close(result); 
  }

  close() { 
    this.ref.close(null); 
  }
}
