import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BoardShareService, BoardShare, ShareBoardRequest } from '../../services/board-share.service';
import { BoardDto } from '../../services/board.service';

@Component({
  selector: 'app-board-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] text-white p-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <h2 class="text-xl font-bold">Compartilhar Board</h2>
            <p class="text-white/90 text-sm">{{ data.board.nome }}</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 max-h-96 overflow-y-auto">
        <!-- Formulário para novo compartilhamento -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-[var(--text)] mb-4">Adicionar Colaborador</h3>
          <form [formGroup]="shareForm" (ngSubmit)="onShare()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text)] mb-2">Email do colaborador</label>
              <input type="email" 
                     formControlName="email"
                     placeholder="colaborador@empresa.com"
                     class="input w-full" />
              <div *ngIf="shareForm.get('email')?.touched && shareForm.get('email')?.invalid" class="text-sm text-red-500 mt-1">
                <span *ngIf="shareForm.get('email')?.hasError('required')">Email é obrigatório</span>
                <span *ngIf="shareForm.get('email')?.hasError('email')">Por favor, insira um email válido</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--text)] mb-2">Nível de acesso</label>
              <select formControlName="permission" class="input w-full">
                <option value="VIEW">👁️ Apenas Visualizar - Pode ver boards e tarefas, mas não editar</option>
                <option value="EDIT">✏️ Visualizar e Editar - Pode criar, editar e mover tarefas</option>
              </select>
            </div>

            <button type="submit" 
                    [disabled]="shareForm.invalid || loading()"
                    class="btn w-full disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="!loading()">
                <span class="mr-2">👥</span>
                Compartilhar Board
              </span>
              <span *ngIf="loading()" class="flex items-center gap-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Compartilhando...
              </span>
            </button>
          </form>
        </div>

        <!-- Lista de usuários com acesso -->
        <div *ngIf="sharedUsers().length > 0">
          <h3 class="text-lg font-semibold text-[var(--text)] mb-4">
            Colaboradores Ativos ({{ sharedUsers().length }})
          </h3>
          <div class="space-y-3">
            <div *ngFor="let share of sharedUsers(); trackBy: trackByShareId" 
                 class="bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold text-[var(--text)]">{{ share.sharedWith.nomeUsuario }}</div>
                  <div class="text-sm text-[var(--text-soft)]">{{ share.sharedWith.email }}</div>
                  <div class="text-xs text-[var(--text-soft)] mt-1">
                    🕒 Compartilhado {{ formatSharedDate(share.sharedAt) }}
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="px-3 py-1 rounded-full text-xs font-medium"
                        [class]="share.permission === 'VIEW' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'">
                    {{ share.permission === 'VIEW' ? '👁️ Visualizar' : '✏️ Editar' }}
                  </span>
                  <button (click)="removeShare(share)"
                          [disabled]="loading()"
                          class="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center justify-center transition disabled:opacity-50"
                          title="Remover acesso">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vazio -->
        <div *ngIf="sharedUsers().length === 0" class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-[var(--bg-soft)] rounded-full flex items-center justify-center text-2xl">
            👥
          </div>
          <h4 class="font-semibold text-[var(--text)] mb-2">Nenhum colaborador ainda</h4>
          <p class="text-[var(--text-soft)] text-sm">Compartilhe este board para trabalhar em equipe!</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-[var(--border)] p-4 flex justify-end">
        <button (click)="onCancel()" class="btn-secondary">
          Fechar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .share-dialog {
      min-width: 550px;
      max-width: 650px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #3b82f6;
      margin-bottom: 0;
      font-size: 24px;
      font-weight: 600;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f5f9;
    }

    .dialog-title mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #3b82f6;
    }

    .dialog-content {
      padding: 24px 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .share-form {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }

    .share-form::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
    }

    .share-form h3 {
      margin: 0 0 20px 0;
      color: #1e293b;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .share-form h3::before {
      content: '👥';
      font-size: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .form-actions button {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
    }

    .form-actions button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 12px -1px rgba(59, 130, 246, 0.4);
    }

    .shared-users {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .shared-users h3 {
      margin: 0;
      color: #1e293b;
      font-size: 18px;
      font-weight: 600;
      padding: 20px 24px;
      background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .shared-users h3::before {
      content: '🤝';
      font-size: 20px;
    }

    .user-share-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s ease;
      background: white;
    }

    .user-share-item:hover {
      background: #f8fafc;
      transform: scale(1.01);
    }

    .user-share-item:last-child {
      border-bottom: none;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-name::before {
      content: '👤';
      font-size: 14px;
    }

    .user-email {
      font-size: 14px;
      color: #64748b;
      font-weight: 400;
    }

    .permission-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .view-permission {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .edit-permission {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .permission-info button {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      color: white;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    }

    .permission-info button:hover {
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
    }

    .no-shares {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border: 2px dashed #cbd5e1;
    }

    .no-shares mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #94a3b8;
    }

    .no-shares p {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }

    /* Material form field customization */
    ::ng-deep .mat-mdc-form-field {
      --mdc-filled-text-field-container-shape: 8px;
      --mdc-outlined-text-field-container-shape: 8px;
    }

    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: rgba(59, 130, 246, 0.04);
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      border-radius: 8px;
    }

    /* Dialog actions styling */
    ::ng-deep .mat-mdc-dialog-actions {
      padding: 20px 24px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .share-dialog {
        background-color: #1e293b;
        color: #f1f5f9;
      }

      .share-form {
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        border-color: #475569;
      }

      .share-form h3,
      .shared-users h3 {
        color: #f1f5f9;
      }

      .shared-users {
        background: #334155;
        border-color: #475569;
      }

      .shared-users h3 {
        background: linear-gradient(135deg, #475569 0%, #334155 100%);
        border-color: #64748b;
      }

      .user-share-item {
        background: #334155;
        border-color: #475569;
      }

      .user-share-item:hover {
        background: #475569;
      }

      .user-name {
        color: #f1f5f9;
      }

      .user-email {
        color: #cbd5e1;
      }

      .no-shares {
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        border-color: #64748b;
        color: #cbd5e1;
      }

      .dialog-title {
        color: #60a5fa;
        border-color: #475569;
      }

      ::ng-deep .mat-mdc-dialog-actions {
        background: #334155;
        border-color: #475569;
      }
    }

    /* Animations */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .share-dialog {
      animation: slideInUp 0.3s ease-out;
    }

    .user-share-item {
      animation: slideInUp 0.2s ease-out;
    }

    .user-share-item:nth-child(2) { animation-delay: 0.1s; }
    .user-share-item:nth-child(3) { animation-delay: 0.2s; }
    .user-share-item:nth-child(4) { animation-delay: 0.3s; }
  `]
})
export class BoardShareDialogComponent implements OnInit {
  shareForm: FormGroup;
  sharedUsers = signal<BoardShare[]>([]);
  loading = signal(false);

  constructor(
    private dialogRef: MatDialogRef<BoardShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { board: BoardDto },
    private fb: FormBuilder,
    private boardShareService: BoardShareService,
    private snackBar: MatSnackBar
  ) {
    this.shareForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      permission: ['VIEW', Validators.required]
    });
  }

  ngOnInit() {
    this.loadSharedUsers();
  }

  loadSharedUsers() {
    this.loading.set(true);
    this.boardShareService.getSharedUsers(this.data.board.id).subscribe({
      next: (shares) => {
        this.sharedUsers.set(shares);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar compartilhamentos:', error);
        this.snackBar.open('Erro ao carregar compartilhamentos', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onShare() {
    if (this.shareForm.valid) {
      this.loading.set(true);
      const request: ShareBoardRequest = this.shareForm.value;
      
      this.boardShareService.shareBoard(this.data.board.id, request).subscribe({
        next: (share) => {
          this.snackBar.open(
            'Board compartilhado com ' + share.sharedWith.nomeUsuario, 
            'Fechar', 
            { duration: 3000 }
          );
          this.shareForm.reset({ permission: 'VIEW' });
          this.loadSharedUsers(); // Recarrega a lista
        },
        error: (error) => {
          console.error('Erro ao compartilhar board:', error);
          const message = error.error?.message || 'Erro ao compartilhar board';
          this.snackBar.open(message, 'Fechar', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  removeShare(share: BoardShare) {
    this.loading.set(true);
    
    this.boardShareService.unshareBoard(this.data.board.id, { 
      emailRemover: share.sharedWith.email 
    }).subscribe({
      next: () => {
        this.snackBar.open(
          'Acesso removido de ' + share.sharedWith.nomeUsuario, 
          'Fechar', 
          { duration: 3000 }
        );
        this.loadSharedUsers(); // Recarrega a lista
      },
      error: (error) => {
        console.error('Erro ao remover compartilhamento:', error);
        const message = error.error?.message || 'Erro ao remover compartilhamento';
        this.snackBar.open(message, 'Fechar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  trackByShareId(index: number, share: BoardShare): number {
    return share.id;
  }

  formatSharedDate(sharedAt: string): string {
    try {
      const date = new Date(sharedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'hoje';
      if (diffDays === 1) return 'ontem';
      if (diffDays < 7) return 'há ' + diffDays + ' dias';
      if (diffDays < 30) return 'há ' + Math.floor(diffDays / 7) + ' semanas';
      return 'há ' + Math.floor(diffDays / 30) + ' meses';
    } catch {
      return 'recentemente';
    }
  }
}