import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../services/auth.service';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import { EmailVerificationComponent } from '../email-verification/email-verification.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule, PhoneInputComponent, EmailVerificationComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  showVerification = signal(false);
  verificationEmail = signal<string>('');
  formData = signal<any>(null);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    nomeUsuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    telefone: [''],
    dataNascimento: ['', [Validators.required]],
    senha: ['', [Validators.required, this.strongPasswordValidator]],
    confirmarSenha: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const hasLowerCase = /[a-z]/.test(value);
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 8;
    
    const errors: any = {};
    if (!hasMinLength) errors.minLength = true;
    if (!hasLowerCase) errors.lowercase = true;
    if (!hasUpperCase) errors.uppercase = true;
    if (!hasNumber) errors.number = true;
    if (!hasSpecialChar) errors.specialChar = true;
    
    return Object.keys(errors).length ? errors : null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('senha');
    const confirmarSenha = control.get('confirmarSenha');
    
    if (!senha || !confirmarSenha) {
      return null;
    }
    
    return senha.value === confirmarSenha.value ? null : { passwordMismatch: true };
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    
    const { nome, nomeUsuario, email, telefone, dataNascimento, senha } = this.form.value;
    const payload = {
      nome: nome!,
      nomeUsuario: nomeUsuario!,
      email: email!,
      telefone: telefone || undefined,
      dataNascimento: dataNascimento!,
      senha: senha!
    };

    // Primeira etapa: enviar código de verificação
    this.auth.sendVerificationCode(payload).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        if (response.success) {
          this.formData.set(payload);
          this.verificationEmail.set(email!);
          this.showVerification.set(true);
        } else {
          this.error.set(response.message);
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao enviar código de verificação');
        console.error('Erro no registro:', err);
      }
    });
  }
}
