package com.example.taskmanager.controller;

import com.example.taskmanager.model.Usuario;
import com.example.taskmanager.model.VerificationCode.VerificationType;
import com.example.taskmanager.security.JwtTokenProvider;
import com.example.taskmanager.service.UsuarioService;
import com.example.taskmanager.service.VerificationCodeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import com.example.taskmanager.service.RefreshTokenService;
import com.example.taskmanager.service.LoginAttemptService;
// ...imports above

/**
 * Endpoints de autenticação: registro e login gerando JWT.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final VerificationCodeService verificationCodeService;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(UsuarioService usuarioService, AuthenticationManager authenticationManager,
                         JwtTokenProvider tokenProvider, VerificationCodeService verificationCodeService,
                         RefreshTokenService refreshTokenService, LoginAttemptService loginAttemptService) {
        this.usuarioService = usuarioService;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.verificationCodeService = verificationCodeService;
        this.refreshTokenService = refreshTokenService;
        this.loginAttemptService = loginAttemptService;
    }

    /**
     * Primeira etapa do registro: envia código de verificação por email
     */
    @PostMapping("/register/send-code")
    public ResponseEntity<?> enviarCodigoRegistro(@Valid @RequestBody com.example.taskmanager.dto.RegistroDto registroDto) {
        try {
            // Verificar se o email já está em uso
            if (usuarioService.buscarPorEmail(registroDto.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Este email já está cadastrado no Orbitr"
                ));
            }
            
            // Verificar se o nome de usuário já está em uso
            if (usuarioService.buscarPorNomeUsuario(registroDto.getNomeUsuario()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Este nome de usuário já está em uso"
                ));
            }
            
            // Gerar e enviar código de verificação
            boolean enviado = verificationCodeService.generateAndSendVerificationCode(
                registroDto.getEmail(), 
                VerificationType.EMAIL_VERIFICATION
            );
            
            if (enviado) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Código de verificação enviado para " + registroDto.getEmail(),
                    "email", registroDto.getEmail()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erro ao enviar código de verificação. Tente novamente."
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erro interno. Tente novamente."
            ));
        }
    }
    
    /**
     * Segunda etapa do registro: verifica código e cria usuário
     */
    @PostMapping("/register/verify")
    public ResponseEntity<?> verificarERegistrar(
            @RequestBody Map<String, Object> payload) {
        try {
            String email = (String) payload.get("email");
            String codigo = (String) payload.get("codigo");
            
            @SuppressWarnings("unchecked")
            Map<String, Object> dadosUsuario = (Map<String, Object>) payload.get("dadosUsuario");
            
            // Validar código de verificação
            boolean codigoValido = verificationCodeService.validateVerificationCode(
                email, codigo, VerificationType.EMAIL_VERIFICATION
            );
            
            if (!codigoValido) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Código de verificação inválido ou expirado"
                ));
            }
            
            // Criar usuário
            Usuario usuario = new Usuario();
            usuario.setNome((String) dadosUsuario.get("nome"));
            usuario.setNomeUsuario((String) dadosUsuario.get("nomeUsuario"));
            usuario.setEmail(email);
            usuario.setTelefone((String) dadosUsuario.get("telefone"));
            usuario.setDataNascimento(java.time.LocalDate.parse((String) dadosUsuario.get("dataNascimento")));
            usuario.setSenha((String) dadosUsuario.get("senha"));
            
            String rawPassword = usuario.getSenha();
            Usuario salvo = usuarioService.criar(usuario);
            
            // Autenticar automaticamente após registro
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(salvo.getEmail(), rawPassword)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.gerarToken(authentication, salvo);

            // Criar refresh token e setar cookie HttpOnly
            var refresh = refreshTokenService.createRefreshToken(salvo);
            Cookie cookie = new Cookie("refreshToken", refresh.getToken());
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            cookie.setMaxAge((int) (refresh.getExpiryDate().toEpochMilli() - System.currentTimeMillis()) / 1000);

            return ResponseEntity.ok().header("Set-Cookie", String.format("refreshToken=%s; HttpOnly; Secure; Path=/; Max-Age=%d; SameSite=Lax", refresh.getToken(), cookie.getMaxAge()))
                .body(Map.of(
                "success", true,
                "message", "Conta criada com sucesso! Bem-vindo ao Orbitr!",
                "user", Map.of(
                    "id", salvo.getId(),
                    "email", salvo.getEmail(),
                    "nome", salvo.getNome(),
                    "nomeUsuario", salvo.getNomeUsuario()
                ),
                "token", token
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erro ao criar conta. Tente novamente."
            ));
        }
    }

    /**
     * Login: autentica credenciais e retorna token JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String senha = payload.get("senha");
        if (loginAttemptService.isBlocked(email)) {
            return ResponseEntity.status(429).body(Map.of("message", "Muitas tentativas inválidas. Tente novamente mais tarde."));
        }
        Authentication authentication = null;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, senha)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            // reset attempts on success
            loginAttemptService.loginSucceeded(email);
        } catch (Exception ex) {
            loginAttemptService.loginFailed(email);
            return ResponseEntity.status(401).body(Map.of("message", "Credenciais inválidas"));
        }
        
        // Buscar o usuário para incluir informações no token
        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        String token = tokenProvider.gerarToken(authentication, usuario);
    var refresh = refreshTokenService.createRefreshToken(usuario);

    return ResponseEntity.ok()
        .header("Set-Cookie", String.format("refreshToken=%s; HttpOnly; Secure; Path=/; Max-Age=%d; SameSite=Lax", refresh.getToken(), (refresh.getExpiryDate().toEpochMilli() - System.currentTimeMillis())/1000))
        .body(Map.of("token", token));
    }

    /**
     * Refresh endpoint: lê cookie refreshToken e emite novo access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return ResponseEntity.status(401).body(Map.of("message", "Refresh token not found"));
        Optional<String> maybe = java.util.Arrays.stream(cookies)
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();

        if (maybe.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Refresh token not found"));

        String token = maybe.get();
        Optional<com.example.taskmanager.model.RefreshToken> stored = refreshTokenService.findByToken(token);
        if (stored.isEmpty() || !refreshTokenService.isValid(stored.get())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid refresh token"));
        }

        // Rotate refresh token to mitigate token replay
        com.example.taskmanager.model.RefreshToken existing = stored.get();
        com.example.taskmanager.model.RefreshToken rotated = refreshTokenService.rotate(existing);

        Usuario usuario = existing.getUsuario();
        org.springframework.security.core.userdetails.UserDetails userDetails = org.springframework.security.core.userdetails.User.withUsername(usuario.getEmail()).password("").authorities(new java.util.ArrayList<>()).build();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        String newToken = tokenProvider.gerarToken(authentication, usuario);

        long maxAge = (rotated.getExpiryDate().toEpochMilli() - System.currentTimeMillis())/1000;
        return ResponseEntity.ok()
                .header("Set-Cookie", String.format("refreshToken=%s; HttpOnly; Secure; Path=/; Max-Age=%d; SameSite=Lax", rotated.getToken(), maxAge))
                .body(Map.of("token", newToken));
    }

    /**
     * Logout: revoga refresh token (se existir) e apaga cookie
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            java.util.Arrays.stream(cookies)
                .filter(c -> "refreshToken".equals(c.getName()))
                .findFirst()
                .ifPresent(c -> {
                    refreshTokenService.findByToken(c.getValue()).ifPresent(refreshTokenService::revoke);
                });
        }
        // Instruir o browser a apagar cookie
        return ResponseEntity.ok().header("Set-Cookie", "refreshToken=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax").body(Map.of("message", "Logged out"));
    }

    /**
     * Lista refresh tokens do usuário autenticado
     */
    @GetMapping("/tokens")
    public ResponseEntity<?> listTokens() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return ResponseEntity.status(401).build();
        String email = auth.getName();
        Usuario usuario = usuarioService.buscarPorEmail(email).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        var tokens = refreshTokenService.listByUser(usuario);
        var simplified = tokens.stream().map(t -> Map.of("id", t.getId(), "token", t.getToken(), "expiryDate", t.getExpiryDate(), "revoked", t.isRevoked())).toList();
        return ResponseEntity.ok(Map.of("tokens", simplified));
    }

    /**
     * Revoga um refresh token do usuário (por token string)
     */
    @PostMapping("/tokens/revoke")
    public ResponseEntity<?> revokeToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return ResponseEntity.status(401).build();
        String email = auth.getName();
        Usuario usuario = usuarioService.buscarPorEmail(email).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        refreshTokenService.findByToken(token).ifPresent(rt -> {
            if (rt.getUsuario().getId().equals(usuario.getId())) refreshTokenService.revoke(rt);
        });
        return ResponseEntity.ok(Map.of("message", "Token revoked if it belonged to you"));
    }
    
    /**
     * Health check endpoint para verificar se a API está funcionando
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "service", "Orbitr API",
            "timestamp", java.time.LocalDateTime.now().toString(),
            "message", "🚀 Orbitr está funcionando perfeitamente!"
        ));
    }
}
