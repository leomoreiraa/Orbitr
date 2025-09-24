import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  
  if (token && !req.headers.has('Authorization')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verifica se a requisição tem o header para pular redirecionamento
      const skipAuthRedirect = req.headers.has('X-Skip-Auth-Redirect');
      
      // Se receber 401 ou 403 e NÃO deve pular o redirecionamento
      if ((error.status === 401 || error.status === 403) && !skipAuthRedirect) {
        
        auth.clearToken();
        router.navigate(['/login']);
      } else if (skipAuthRedirect) {
        
      }
      
      return throwError(() => error);
    })
  );
};
