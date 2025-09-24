import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface AuthResponse {
  token: string;
}

interface RegisterRequest {
  nome: string;
  nomeUsuario: string;
  email: string;
  telefone?: string;
  dataNascimento: string;
  senha: string;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  email?: string;
  user?: any;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = 'http://localhost:8080/auth';
  private tokenKey = 'auth_token';
  private tokenSignal = signal<string | null>(null);
  authChanged = signal<boolean>(false);

  constructor() {
    // Só inicializa estado de autenticação no browser para evitar ReferenceError no SSR
    if (isPlatformBrowser(this.platformId)) {
      // Tentar restaurar token da sessão ou chamar /auth/refresh para obter novo access token
      const stored = sessionStorage.getItem(this.tokenKey);
      if (stored) {
        this.tokenSignal.set(stored);
        this.authChanged.set(true);
      } else {
        // Tentar refresh usando cookie HttpOnly (se existir)
        this.http.post<{token: string}>('http://localhost:8080/auth/refresh', {}, { withCredentials: true }).subscribe({
          next: res => {
            if (res?.token) {
              this.setToken(res.token);
            }
          },
          error: () => {
            this.clearToken();
          }
        });
      }
    }
  }

  login(email: string, senha: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, senha }, { withCredentials: true })
      .pipe(tap(res => this.setToken(res.token)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data, { withCredentials: true })
      .pipe(tap(res => this.setToken(res.token)));
  }

  // Novos métodos para verificação de email
  sendVerificationCode(data: RegisterRequest): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/register/send-code`, data, { withCredentials: true });
  }

  verifyEmailAndRegister(payload: { email: string; codigo: string; dadosUsuario: RegisterRequest }): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/register/verify`, payload, { withCredentials: true })
      .pipe(tap(res => {
        if (res.success && res.token) {
          this.setToken(res.token);
        }
      }));
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.tokenKey, token);
      this.tokenSignal.set(token);
      this.authChanged.set(true);
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.tokenSignal() || sessionStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.tokenKey);
      this.tokenSignal.set(null);
      this.authChanged.set(false);
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verifica se o token não está expirado
    const payload = this.decodePayload();
    if (!payload || !payload.exp) return true; // Se não tem exp, assume válido
    
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < now;
    
    if (isExpired) {
  // token expired, perform logout
      this.clearToken();
      return false;
    }
    
    return true;
  }

  private decodePayload(): any | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const json = atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'));
      return JSON.parse(json);
    } catch { return null; }
  }

  getUsernameClaim(): string | null {
    const payload = this.decodePayload();
    if (!payload) return null;
    // Priorizar nomeUsuario, depois nome, depois email como fallback
    return payload.nomeUsuario || payload.nome || payload.name || payload.sub || payload.email || null;
  }

  getFriendlyName(): string | null {
    const raw = this.getUsernameClaim();
    if(!raw) return null;
    // Se for email, extrai parte antes do @
    const base = raw.includes('@') ? raw.split('@')[0] : raw;
    // Capitaliza primeira letra e mantém resto
    if(!base.length) return raw;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  getCurrentUser(): {email: string; nome: string} | null {
    const payload = this.decodePayload();
    if (!payload) return null;
    
    return {
      email: payload.sub || payload.email || null,
      nome: payload.nomeUsuario || payload.nome || payload.name || 'Usuário'
    };
  }
}
