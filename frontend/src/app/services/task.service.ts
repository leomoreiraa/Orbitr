import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TarefaDto {
  id?: number;
  titulo: string;
  descricao?: string;
  status?: string;
  board?: any;
  column?: any; // BoardColumnDto simplificado
  column_id?: number; // Campo do backend
  dueDate?: string; // dataLimite ISO string
  position?: number;
  criadoEm?: string;
  atualizadoEm?: string;
  tags?: string[];
  prioridade?: string; // BAIXA, NORMAL, ALTA, URGENTE
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/tarefas';

  list(): Observable<TarefaDto[]> {
    return this.http.get<TarefaDto[]>(this.baseUrl);
  }

  listByBoard(boardId: number): Observable<TarefaDto[]> {
    return this.http.get<TarefaDto[]>(`${this.baseUrl}/board/${boardId}`);
  }

  get(id: number): Observable<TarefaDto> {
    return this.http.get<TarefaDto>(`${this.baseUrl}/${id}`);
  }

  create(data: TarefaDto): Observable<TarefaDto> {
    return this.http.post<TarefaDto>(this.baseUrl, data);
  }

  createInColumn(boardId: number, columnId: number, titulo: string): Observable<TarefaDto> {
    return this.http.post<TarefaDto>(`${this.baseUrl}/board/${boardId}/column/${columnId}`, { titulo });
  }

  update(id: number, data: Partial<TarefaDto>): Observable<TarefaDto> {
    return this.http.put<TarefaDto>(`${this.baseUrl}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<TarefaDto> {
    return this.http.patch<TarefaDto>(`${this.baseUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  moveToColumn(id: number, columnId: number): Observable<TarefaDto> {
    return this.http.patch<TarefaDto>(`${this.baseUrl}/${id}/coluna/${columnId}`, {});
  }

  reorderTasks(tasks: any[]): Observable<any> {
    return this.http.patch(`${this.baseUrl}/reordenar`, tasks);
  }

  createInBoardColumn(boardId: number, columnId: number, payload: any): Observable<TarefaDto> {
    return this.http.post<TarefaDto>(`${this.baseUrl}/board/${boardId}/column/${columnId}`, payload);
  }
}
