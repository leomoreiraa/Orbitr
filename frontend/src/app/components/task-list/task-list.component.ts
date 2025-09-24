import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TaskService, TarefaDto } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressBarModule],
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private router = inject(Router);

  displayedColumns = ['id', 'titulo', 'status', 'acoes'];
  data = signal<TarefaDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.taskService.list().subscribe({
      next: tasks => { this.data.set(tasks); this.loading.set(false); },
      error: err => { this.error.set('Erro ao carregar tarefas'); this.loading.set(false); console.error(err); }
    });
  }

  newTask(): void { this.router.navigate(['/tasks/new']); }
  edit(task: TarefaDto): void { if (task.id) this.router.navigate([`/tasks/${task.id}/edit`]); }
  delete(task: TarefaDto): void {
    if (!task.id) return;
    if (!confirm('Excluir tarefa?')) return;
    this.taskService.delete(task.id).subscribe({
      next: () => this.load(),
      error: err => { console.error(err); alert('Erro ao excluir'); }
    });
  }
}
