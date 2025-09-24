import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TarefaDto } from '../../services/task.service';

@Component({
  selector: 'app-task-simple-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div mat-dialog-content>
      <h2 mat-dialog-title>{{ data.task.titulo }}</h2>
      <p>{{ data.task.descricao || 'Nenhuma descrição' }}</p>
      <p>Status: {{ data.task.status }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="close()">Fechar</button>
      <button mat-button color="primary">Editar</button>
    </div>
  `
})
export class TaskSimpleDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { task: TarefaDto },
    private dialogRef: MatDialogRef<TaskSimpleDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}