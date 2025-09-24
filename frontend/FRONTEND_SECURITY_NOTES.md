Frontend Security Notes

Resumo rápido
- Atualmente o token JWT é armazenado em `localStorage` (arquivo: `src/app/services/auth.service.ts`).
- Risco: tokens em `localStorage` são vulneráveis a XSS e podem ser roubados.

Recomendações de implementação (ordem sugerida)
1) Mudar para cookie `HttpOnly`, `Secure`, `SameSite=Strict` para armazenar o refresh token.
   - O access token pode continuar em memória com curta expiração (ex: 10-15 minutos).
   - Implementar endpoint `/auth/refresh` que lê o cookie HttpOnly e emite novo access token.
2) Habilitar CSRF protection no backend quando usar cookies (Spring Security CSRF).
3) Reduzir tempo de expiração do JWT e usar refresh tokens rotativos.
4) Continuar validando tudo server-side (validação de senha, sanitização).

Notas de implementação prática
- Backend: ao autenticar, devolver `accessToken` no corpo e setar `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=...`
- Frontend: remover escrita de token em `localStorage`; usar requisições que confiam no cookie para refresh.

Exemplo rápido de endpoint de refresh (esboço):
- POST `/auth/refresh` -> lê cookie `refreshToken`, valida no servidor, gera novo access token e, opcionalmente, um novo refresh token.

Próximo passo que posso fazer por você:
- Implementar o endpoint de refresh e mudar o `AuthService` para usar cookies/rotacionamento (mudança tanto no backend quanto frontend).
