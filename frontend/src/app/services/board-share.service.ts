import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BoardShare {
  id: number;
  board: {
    id: number;
    nome: string;
    icon: string;
  };
  sharedBy: {
    id: number;
    nomeUsuario: string;
    email: string;
  };
  sharedWith: {
    id: number;
    nomeUsuario: string;
    email: string;
  };
  permission: 'VIEW' | 'EDIT';
  sharedAt: string;
}

export interface ShareBoardRequest {
  email: string;
  permission: 'VIEW' | 'EDIT';
}

export interface UnshareRequest {
  emailRemover: string;
}

@Injectable({
  providedIn: 'root'
})
export class BoardShareService {
  private apiUrl = 'http://localhost:8080/api/boards';

  constructor(private http: HttpClient) {}

  shareBoard(boardId: number, request: ShareBoardRequest): Observable<BoardShare> {
    return this.http.post<BoardShare>(`${this.apiUrl}/${boardId}/share`, request);
  }

  unshareBoard(boardId: number, request: UnshareRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${boardId}/unshare`, request);  
  }

  getSharedUsers(boardId: number): Observable<BoardShare[]> {
    return this.http.get<BoardShare[]>(`${this.apiUrl}/${boardId}/shared`);
  }

  hasPermission(boardId: number, email: string): Observable<{hasPermission: boolean, permission?: 'VIEW' | 'EDIT'}> {
    return this.http.get<{hasPermission: boolean, permission?: 'VIEW' | 'EDIT'}>(`${this.apiUrl}/${boardId}/permission`, {
      params: { email }
    });
  }
}