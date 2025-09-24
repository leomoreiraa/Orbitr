import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TaskService } from '../../services/task.service';

export interface TaskEditDialogData {
  task: any;
  boardId: string;
}

@Component({
  selector: 'app-task-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="max-w-[700px] bg-[var(--bg)] text-[var(--text)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative overflow-hidden">
        <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div class="relative z-10">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h2 class="text-xl font-bold mb-2">{{ isEditingMode() ? 'Editar Tarefa' : data.task.titulo }}</h2>
              <div class="flex items-center gap-2 text-blue-100">
                <span class="text-sm opacity-90">{{ data.task.column?.titulo || 'Sem coluna' }}</span>
              </div>
            </div>
            <button (click)="close()" class="text-white/80 hover:text-white hover:bg-white/20 transition-colors p-2 rounded-lg">
              <span class="text-2xl">×</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Conteúdo - Visualização -->
      <div *ngIf="!isEditingMode()" class="p-6 space-y-6">
        <!-- Descrição -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wide">Descrição</h3>
          <div class="bg-[var(--bg-soft)] rounded-lg p-4 min-h-[80px]">
            <p class="text-[var(--text)] leading-relaxed">
              {{ data.task.descricao || 'Nenhuma descrição foi adicionada para esta tarefa.' }}
            </p>
          </div>
        </div>

        <!-- Informações adicionais -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Status -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wide">Status</h3>
            <div class="bg-[var(--bg-soft)] rounded-lg p-3">
              <span class="text-[var(--text)]">
                {{ data.task.column?.titulo || 'Sem coluna' }}
              </span>
            </div>
          </div>

          <!-- Data de criação -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wide">Criada em</h3>
            <div class="bg-[var(--bg-soft)] rounded-lg p-3">
              <span class="text-[var(--text)]">
                {{ data.task.criadoEm | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-2" *ngIf="data.task.tags && data.task.tags.length">
          <h3 class="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wide">Tags</h3>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let tag of data.task.tags" 
                  class="px-3 py-1 bg-[var(--brand)]/20 text-[var(--brand)] rounded-full text-sm font-medium">
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Prazo -->
        <div class="space-y-2" *ngIf="data.task.dueDate">
          <h3 class="text-sm font-semibold text-[var(--text-soft)] uppercase tracking-wide">Prazo</h3>
          <div class="bg-[var(--bg-soft)] rounded-lg p-3">
            <span class="text-[var(--text)]">
              {{ data.task.dueDate | date:'dd/MM/yyyy HH:mm' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Conteúdo - Edição -->
      <div *ngIf="isEditingMode()" class="p-6">
        <form [formGroup]="editForm" class="space-y-4">
          <!-- Título -->
          <div>
            <label class="block text-sm font-medium text-[var(--text)] mb-2">Título</label>
            <input type="text" formControlName="titulo" 
                   class="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] bg-[var(--bg)] text-[var(--text)]">
          </div>

          <!-- Descrição -->
          <div>
            <label class="block text-sm font-medium text-[var(--text)] mb-2">Descrição</label>
            <textarea formControlName="descricao" rows="4"
                      class="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] bg-[var(--bg)] text-[var(--text)]"
                      placeholder="Descreva sua tarefa..."></textarea>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-[var(--text)] mb-2">Tags (separadas por vírgula)</label>
            <input type="text" formControlName="tagsString" 
                   class="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] bg-[var(--bg)] text-[var(--text)]"
                   placeholder="tag1, tag2, tag3">
          </div>

          <!-- Prioridade -->
          <div>
            <label class="block text-sm font-medium text-[var(--text)] mb-2">Prioridade</label>
            <select formControlName="prioridade"
                    class="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] bg-[var(--bg)] text-[var(--text)]">
              <option value="BAIXA">🟢 Baixa</option>
              <option value="NORMAL">🟡 Normal</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="URGENTE">🔴 Urgente</option>
            </select>
          </div>

          <!-- Prazo -->
          <div>
            <label class="block text-sm font-medium text-[var(--text)] mb-2">Prazo</label>
            <input type="datetime-local" formControlName="dueDate"
                   class="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] bg-[var(--bg)] text-[var(--text)]">
          </div>
        </form>
      </div>

      <!-- Footer com ações -->
      <div class="bg-[var(--bg-soft)] px-6 py-4 flex justify-between border-t border-[var(--border)]">
        <div>
          <button *ngIf="!isEditingMode()" (click)="deleteTask()" 
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <span>🗑️</span>
            Excluir
          </button>
        </div>
        <div class="flex gap-3">
          <button (click)="isEditingMode() ? cancelEdit() : close()" 
                  class="px-6 py-2 text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
            {{ isEditingMode() ? 'Cancelar' : 'Fechar' }}
          </button>
          <button *ngIf="!isEditingMode()" (click)="startEdit()" 
                  class="px-6 py-2 bg-[var(--brand)] hover:opacity-90 text-white rounded-lg transition-colors">
            Editar
          </button>
          <button *ngIf="isEditingMode()" (click)="saveChanges()" [disabled]="editForm.invalid || isSaving()"
                  class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
            {{ isSaving() ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TaskEditDialogComponent {
  editForm: FormGroup;
  isEditing = signal(false);
  saving = signal(false);

  constructor(
    public dialogRef: MatDialogRef<TaskEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskEditDialogData,
    private fb: FormBuilder,
    private taskService: TaskService
  ) {
    this.editForm = this.createForm();
  }

  isEditingMode(): boolean {
    return this.isEditing();
  }

  isSaving(): boolean {
    return this.saving();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      titulo: [this.data.task.titulo || '', [Validators.required]],
      descricao: [this.data.task.descricao || ''],
      tagsString: [this.data.task.tags ? this.data.task.tags.join(', ') : ''],
      prioridade: [this.data.task.prioridade || 'NORMAL'],
      dueDate: [this.data.task.dueDate ? this.formatDateForInput(this.data.task.dueDate) : '']
    });
  }

  private formatDateForInput(date: string | Date): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  }

  startEdit(): void {
    this.isEditing.set(true);
    this.editForm = this.createForm(); // Reinicializa o form com os dados atuais
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editForm = this.createForm(); // Reseta o form para os valores originais
  }

  async saveChanges(): Promise<void> {
    if (this.editForm.invalid || this.saving()) return;

    this.saving.set(true);

    try {
      const formData = this.editForm.value;
      const updatedTask = {
        ...this.data.task,
        titulo: formData.titulo,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        tags: formData.tagsString 
          ? formData.tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
          : [],
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };

      const savedTask = await this.taskService.update(updatedTask.id, updatedTask).toPromise();
      
      // Retorna a tarefa atualizada para o componente pai
      this.dialogRef.close({ action: 'updated', task: savedTask });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      // Poderia mostrar uma notificação de erro aqui
    } finally {
      this.saving.set(false);
    }
  }

  async deleteTask(): Promise<void> {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await this.taskService.delete(this.data.task.id).toPromise();
        this.dialogRef.close({ action: 'deleted', taskId: this.data.task.id });
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
      }
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}