import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatProgressBarModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
      <div class="w-full max-w-md">
        <!-- Logo e branding -->
        <div class="text-center mb-8">
          <img src="assets/icon.png" alt="Orbitr" class="w-12 h-12 mx-auto mb-4" />
          <h1 class="text-2xl font-bold text-[var(--text)] mb-2">Verificação de Email</h1>
          <p class="text-[var(--text-soft)]">
            Enviamos um código de 6 dígitos para<br>
            <strong class="text-[var(--text)]">{{ email() }}</strong>
          </p>
        </div>

        <!-- Card principal -->
        <div class="bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)] p-8">
          <form [formGroup]="verificationForm" (ngSubmit)="verifyCode()" class="space-y-6">
            <!-- Campo do código -->
            <div>
              <label for="code" class="block text-sm font-semibold text-[var(--text)] mb-2">
                Código de Verificação
              </label>
              <input 
                id="code"
                type="text" 
                formControlName="code" 
                placeholder="000000"
                maxlength="6"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                class="w-full px-4 py-4 text-center text-2xl font-mono rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition tracking-widest"
                (input)="onCodeInput($event)"
              />
              
              <!-- Mensagens de erro -->
              <div *ngIf="verificationForm.get('code')?.touched && verificationForm.get('code')?.invalid" class="text-sm text-red-500 mt-2">
                <span *ngIf="verificationForm.get('code')?.hasError('required')">Código é obrigatório</span>
                <span *ngIf="verificationForm.get('code')?.hasError('pattern')">Código deve conter apenas números</span>
                <span *ngIf="verificationForm.get('code')?.hasError('minlength')">Código deve ter 6 dígitos</span>
              </div>
              
              <p class="text-xs text-[var(--text-soft)] mt-2">Digite o código de 6 dígitos recebido por email</p>
            </div>

            <!-- Mensagens de status -->
            <div *ngIf="error()" class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="text-red-500">⚠️</span>
                <p class="text-sm text-red-600">{{ error() }}</p>
              </div>
            </div>

            <div *ngIf="success()" class="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="text-green-500">✅</span>
                <p class="text-sm text-green-600">{{ success() }}</p>
              </div>
            </div>

            <!-- Botões -->
            <div class="space-y-3">
              <button 
                type="submit" 
                [disabled]="verificationForm.invalid || loading()"
                class="w-full btn h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="!loading()">Verificar Código</span>
                <span *ngIf="loading()" class="flex items-center gap-2">
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              </button>

              <button 
                type="button" 
                (click)="resendCode()"
                [disabled]="loading() || resendCooldown() > 0"
                class="w-full btn-secondary h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="resendCooldown() > 0">Reenviar em {{ resendCooldown() }}s</span>
                <span *ngIf="resendCooldown() === 0">Reenviar Código</span>
              </button>
            </div>
          </form>

          <!-- Link de voltar -->
          <div class="text-center mt-6 pt-6 border-t border-[var(--border)]">
            <button 
              type="button"
              (click)="goBack()" 
              [disabled]="loading()"
              class="text-sm text-[var(--text-soft)] hover:text-[var(--brand)] transition disabled:opacity-50"
            >
              ← Voltar para login
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .verification-card {
      max-width: 500px;
      width: 100%;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border-radius: 16px;
    }

    .header-content {
      text-align: center;
      width: 100%;
    }

    .verification-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #667eea;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .code-input {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 4px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    .verify-button {
      height: 48px;
      font-size: 16px;
      font-weight: 600;
    }

    .resend-button {
      height: 40px;
    }

    .button-progress {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      transform: translateY(-50%);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background-color: #ffebee;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4caf50;
      background-color: #e8f5e8;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    mat-card-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    mat-card-subtitle {
      font-size: 16px;
      color: #666;
      line-height: 1.4;
    }
  `]
})
export class EmailVerificationComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  email = input.required<string>();
  userData = input.required<any>();

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  resendCooldown = signal(0);

  verificationForm = this.fb.group({
    code: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]+$/),
      Validators.minLength(6),
      Validators.maxLength(6)
    ]]
  });

  private cooldownInterval?: number;

  onCodeInput(event: any): void {
    // Permitir apenas números
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.verificationForm.patchValue({ code: value });
    
    // Auto-verificar quando atingir 6 dígitos
    if (value.length === 6) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

  verifyCode(): void {
    if (this.verificationForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const code = this.verificationForm.value.code!;
    const payload = {
      email: this.email(),
      codigo: code,
      dadosUsuario: this.userData()
    };

    this.auth.verifyEmailAndRegister(payload).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.success.set(response.message);
          // Salvar token e redirecionar
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          setTimeout(() => {
            this.router.navigate(['/board']);
          }, 1500);
        } else {
          this.error.set(response.message);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao verificar código. Tente novamente.');
        console.error('Erro na verificação:', err);
      }
    });
  }

  resendCode(): void {
    if (this.resendCooldown() > 0) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.auth.sendVerificationCode(this.userData()).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.success.set('Novo código enviado!');
          this.startCooldown();
        } else {
          this.error.set(response.message);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erro ao reenviar código. Tente novamente.');
        console.error('Erro ao reenviar código:', err);
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown.set(60); // 60 segundos
    this.cooldownInterval = window.setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  goBack(): void {
    this.router.navigate(['/register']);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }
}