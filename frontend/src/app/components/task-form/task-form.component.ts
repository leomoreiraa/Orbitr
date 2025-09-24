import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TaskService, TarefaDto } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id: number | null = null;
  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descricao: [''],
    status: ['PENDENTE', Validators.required],
    dueDateDate: [''],
    dueDateTime: ['']
  });

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.id = +paramId;
      this.load();
    }
  }

  load(): void {
    if (!this.id) return;
    this.loading.set(true);
    this.taskService.get(this.id).subscribe({
      next: task => { this.form.patchValue(task); this.loading.set(false); },
      error: err => { this.error.set('Erro ao carregar tarefa'); this.loading.set(false); console.error(err); }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const raw = this.form.value;
    let dueDate: string | undefined;
    if (raw.dueDateDate) {
      const date = raw.dueDateDate as string; // yyyy-MM-dd
      const time = (raw.dueDateTime as string) || '00:00'; // HH:mm
      dueDate = new Date(`${date}T${time}:00`).toISOString();
    }
    const value: TarefaDto = {
      titulo: raw.titulo!,
      descricao: raw.descricao || '',
      status: raw.status!,
      dueDate
    };
    const obs = this.id ? this.taskService.update(this.id, value) : this.taskService.create(value);
    obs.subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/tasks']); },
      error: err => { this.loading.set(false); this.error.set('Erro ao salvar'); console.error(err); }
    });
  }
}
