import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface BoardDto { id: number; nome: string; criadoEm?: string; icon?: string; }
export interface BoardColumnDto { id: number; titulo: string; ordem: number; legacyStatus?: string; }

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/boards';

  boardsCache = signal<BoardDto[] | null>(null);
  columnsCache = new Map<number, BoardColumnDto[] | null>();

  listBoards(): Observable<BoardDto[]> {
    return this.http.get<BoardDto[]>(this.baseUrl);
  }

  createBoard(nome: string, icon?: string): Observable<BoardDto> {
    return this.http.post<BoardDto>(this.baseUrl, { nome, icon });
  }

  renameBoard(id: number, nome: string): Observable<BoardDto> {
    return this.http.patch<BoardDto>(`${this.baseUrl}/${id}`, { nome });
  }

  deleteBoard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listColumns(boardId: number): Observable<BoardColumnDto[]> {
    return this.http.get<BoardColumnDto[]>(`${this.baseUrl}/${boardId}/columns`);
  }

  createColumn(boardId: number, titulo: string): Observable<BoardColumnDto> {
    return this.http.post<BoardColumnDto>(`${this.baseUrl}/${boardId}/columns`, { titulo });
  }

  renameColumn(columnId: number, titulo: string): Observable<BoardColumnDto> {
    return this.http.patch<BoardColumnDto>(`${this.baseUrl}/columns/${columnId}`, { titulo });
  }

  deleteColumn(columnId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/columns/${columnId}`);
  }

  // Método para buscar boards separadas
  getBoardsSeparated(): Observable<{own: BoardDto[], shared: BoardDto[]}> {
    return this.http.get<{own: BoardDto[], shared: BoardDto[]}>(`${this.baseUrl}/separated`);
  }

  // Buscar membros de um board específico
  getBoardMembers(boardId: number): Observable<{id: number, nome: string, email: string}[]> {
    const headers = new HttpHeaders({ 'X-Skip-Auth-Redirect': 'true' });
    return this.http.get<{id: number, nome: string, email: string}[]>(`${this.baseUrl}/${boardId}/members`, { headers }).pipe(
      catchError((error) => {
        console.warn('Erro ao carregar membros do board (ignorando):', error.status);
        return of([]); // Retorna array vazio em caso de erro
      })
    );
  }
}
