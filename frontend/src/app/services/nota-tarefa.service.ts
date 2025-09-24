import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface NotaTarefaDto {
  id?: number;
  conteudo: string;
  publica?: boolean;
  dataCriacao?: string;
  tarefa?: any;
  autor?: {
    id: number;
    nome: string;
    email: string;
  };
  destinatario?: {
    id: number;
    nome: string;
    email: string;
  };
  usuariosQueVisualizaram?: any[];
}

export interface CriarNotaRequest {
  conteudo: string;
  publica?: boolean;
  destinatarioId?: number;
}

@Injectable({ providedIn: 'root' })
export class NotaTarefaService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/notas';

  /**
   * Lista notas de uma tarefa - versão segura que não causa logout automático
   */
  listarNotasSafe(tarefaId: number): Observable<NotaTarefaDto[]> {
    // Adiciona header especial para indicar que não deve fazer logout automático
    const headers = new HttpHeaders({ 'X-Skip-Auth-Redirect': 'true' });
    
    return this.http.get<NotaTarefaDto[]>(`${this.baseUrl}/tarefa/${tarefaId}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('Erro ao carregar notas (ignorando):', error.status);
        // Retorna array vazio em caso de erro, sem propagar o erro
        return of([]);
      })
    );
  }

  /**
   * Lista notas de uma tarefa
   */
  listarNotas(tarefaId: number): Observable<NotaTarefaDto[]> {
    return this.http.get<NotaTarefaDto[]>(`${this.baseUrl}/tarefa/${tarefaId}`);
  }

  /**
   * Cria uma nova nota
   */
  criarNota(tarefaId: number, nota: CriarNotaRequest): Observable<NotaTarefaDto> {
    return this.http.post<NotaTarefaDto>(`${this.baseUrl}/tarefa/${tarefaId}`, nota);
  }

  /**
   * Marca nota como visualizada
   */
  marcarComoVista(notaId: number): Observable<NotaTarefaDto> {
    return this.http.patch<NotaTarefaDto>(`${this.baseUrl}/${notaId}/visualizar`, {});
  }

  /**
   * Conta notas não lidas
   */
  contarNaoLidas(tarefaId: number): Observable<{count: number}> {
    return this.http.get<{count: number}>(`${this.baseUrl}/tarefa/${tarefaId}/nao-lidas`);
  }

  /**
   * Deleta uma nota
   */
  deletarNota(notaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${notaId}`);
  }

  /**
   * Busca nota por ID
   */
  buscarNota(notaId: number): Observable<NotaTarefaDto> {
    return this.http.get<NotaTarefaDto>(`${this.baseUrl}/${notaId}`);
  }
}