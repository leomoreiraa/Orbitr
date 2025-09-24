package com.example.taskmanager.controller;

import com.example.taskmanager.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {
    private static final Logger logger = LoggerFactory.getLogger(EmailController.class);

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }
    
    /**
     * Endpoint para testar se o email está funcionando
     * POST /api/email/test
     * Body: { "email": "seu-email@exemplo.com" }
     */
    @PostMapping("/test")
    public ResponseEntity<?> testarEmail(@RequestBody Map<String, String> request) {
    logger.debug("Recebida requisição de teste de email - body={}", request);
        
        try {
            String email = request.get("email");
            logger.debug("Email extraído: {}", email);
            
            if (email == null || email.trim().isEmpty()) {
                logger.warn("Email vazio ou nulo recebido no teste de email");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email é obrigatório"
                ));
            }
            
            boolean sucesso = emailService.testarConexao(email);
            logger.debug("Resultado do teste de conexão SMTP: {}", sucesso);
            
            if (sucesso) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "✅ Email de teste enviado com sucesso! Verifique sua caixa de entrada."
                ));
            } else {
                logger.error("Falha ao enviar email de teste");
                return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "❌ Falha ao enviar email. Verifique as configurações SMTP."
                ));
            }
            
        } catch (Exception e) {
            logger.error("Exceção no EmailController.testarEmail: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erro interno: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Endpoint para enviar email simples de teste
     * POST /api/email/simple-test  
     * Body: { "email": "destino@exemplo.com", "board": "Nome do Board", "owner": "Nome do Proprietário" }
     */
    @PostMapping("/simple-test")
    public ResponseEntity<?> testarEmailSimples(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String board = request.getOrDefault("board", "Board de Teste");
            String owner = request.getOrDefault("owner", "Usuário Teste");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email é obrigatório"
                ));
            }
            
            emailService.enviarNotificacaoCompartilhamento(email, board, owner);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Email de compartilhamento enviado para: " + email
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "❌ Erro ao enviar email: " + e.getMessage()
            ));
        }
    }
}