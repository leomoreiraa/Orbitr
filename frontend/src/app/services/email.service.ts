import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmailTestRequest {
  email: string;
}

export interface EmailTestResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = 'http://localhost:8080/api/email';

  constructor(private http: HttpClient) { }

  testarEmail(email: string): Observable<EmailTestResponse> {
    const request: EmailTestRequest = { email };
    return this.http.post<EmailTestResponse>(`${this.apiUrl}/test`, request);
  }
}