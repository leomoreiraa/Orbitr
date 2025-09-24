import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-email-test',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatInputModule, 
    MatCardModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="email-test-container">
      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>email</mat-icon>
            Teste de Email
          </mat-card-title>
          <mat-card-subtitle>
            Testar configuração do sistema de notificações
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="form-container">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email para teste</mat-label>
              <input 
                matInput 
                type="email" 
                [(ngModel)]="emailTeste"
                placeholder="seu@email.com"
                [disabled]="enviando">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>
            
            <div class="status-container" *ngIf="resultado">
              <div class="status" [ngClass]="statusClass">
                <mat-icon>{{ statusIcon }}</mat-icon>
                <span>{{ resultado.message }}</span>
              </div>
            </div>
          </div>
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button 
            mat-raised-button 
            color="primary"
            (click)="enviarTeste()"
            [disabled]="!emailTeste || enviando">
            <mat-spinner *ngIf="enviando" diameter="20" class="spinner"></mat-spinner>
            <mat-icon *ngIf="!enviando">send</mat-icon>
            {{ enviando ? 'Enviando...' : 'Enviar Teste' }}
          </button>
        </mat-card-actions>
      </mat-card>
      
      <div class="info-card" *ngIf="!resultado">
        <mat-card>
          <mat-card-content>
            <h4>ℹ️ Informações do Teste</h4>
            <ul>
              <li><strong>Remetente:</strong> Orbitr</li>
              <li><strong>Assunto:</strong> 🧪 Teste de Configuração</li>
              <li><strong>Formato:</strong> HTML Profissional</li>
            </ul>
            <p class="note">
              💡 O email pode demorar alguns minutos para chegar. 
              Verifique sua pasta de spam se não receber.
            </p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .email-test-container {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .test-card {
      margin-bottom: 20px;
    }
    
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 16px 0;
    }
    
    .full-width {
      width: 100%;
    }
    
    .status-container {
      margin-top: 16px;
    }
    
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .status.success {
      background-color: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }
    
    .status.error {
      background-color: #ffebee;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
    }
    
    .spinner {
      margin-right: 8px;
    }
    
    .info-card mat-card {
      background-color: #f5f5f5;
    }
    
    .info-card h4 {
      margin: 0 0 12px 0;
      color: #333;
    }
    
    .info-card ul {
      margin: 0 0 12px 0;
      padding-left: 20px;
    }
    
    .info-card li {
      margin-bottom: 8px;
    }
    
    .note {
      font-size: 14px;
      color: #666;
      margin: 0;
      padding: 12px;
      background-color: #fff3cd;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
    }
    
    mat-card-header {
      margin-bottom: 16px;
    }
    
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class EmailTestComponent {
  private emailService = inject(EmailService);
  
  emailTeste = 'leonardo.moreira6854@gmail.com';
  enviando = false;
  resultado: any = null;
  
  get statusClass() {
    if (!this.resultado) return '';
    return this.resultado.success ? 'success' : 'error';
  }
  
  get statusIcon() {
    if (!this.resultado) return '';
    return this.resultado.success ? 'check_circle' : 'error';
  }
  
  enviarTeste() {
    if (!this.emailTeste) return;
    
    this.enviando = true;
    this.resultado = null;
    
    this.emailService.testarEmail(this.emailTeste).subscribe({
      next: (resposta) => {
        this.resultado = resposta;
        this.enviando = false;
        
      },
      error: (erro) => {
        this.resultado = {
          success: false,
          message: `❌ Erro: ${erro.error?.message || erro.message || 'Falha na comunicação com servidor'}`
        };
        this.enviando = false;
        console.error('Erro no teste de email:', erro);
      }
    });
  }
}