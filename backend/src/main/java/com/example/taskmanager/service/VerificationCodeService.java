package com.example.taskmanager.service;

import com.example.taskmanager.model.VerificationCode;
import com.example.taskmanager.model.VerificationCode.VerificationType;
import com.example.taskmanager.repository.VerificationCodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class VerificationCodeService {
    private static final Logger logger = LoggerFactory.getLogger(VerificationCodeService.class);
    
    @Autowired
    private VerificationCodeRepository verificationCodeRepository;
    
    @Autowired
    private EmailService emailService;

    @Autowired
    private com.example.taskmanager.config.EmailConfig emailConfig;
    
    /**
     * Gera um novo código de verificação para um email
     */
    public VerificationCode generateVerificationCode(String email, VerificationType type) {
        logger.info("Gerando código de verificação para email: {} e tipo: {}", email, type);
        
        // Invalida códigos antigos do mesmo tipo para este email
        verificationCodeRepository.invalidateAllCodesByEmailAndType(email, type);
        
        // Cria novo código
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setType(type);
        
        VerificationCode savedCode = verificationCodeRepository.save(verificationCode);
        
        logger.info("Código de verificação gerado com sucesso. ID: {}, Código: {}", 
            savedCode.getId(), savedCode.getCode());
            
        return savedCode;
    }
    
    /**
     * Gera e envia código de verificação por email
     */
    public boolean generateAndSendVerificationCode(String email, VerificationType type) {
        try {
            VerificationCode code = generateVerificationCode(email, type);
            
            String subject = getEmailSubject(type);
            String htmlContent = generateEmailContent(code, type);
            
            emailService.sendHtmlEmail(email, subject, htmlContent);
            
            logger.info("Código de verificação enviado com sucesso para: {}", email);
            return true;
            
        } catch (Exception e) {
            logger.error("Erro ao gerar e enviar código de verificação para: {}", email, e);
            return false;
        }
    }
    
    /**
     * Valida um código de verificação
     */
    public boolean validateVerificationCode(String email, String code, VerificationType type) {
        logger.info("Validando código de verificação para email: {} e tipo: {}", email, type);
        
        Optional<VerificationCode> verificationCodeOpt = verificationCodeRepository
            .findValidCode(email, code, type, LocalDateTime.now());
            
        if (verificationCodeOpt.isEmpty()) {
            logger.warn("Código de verificação inválido ou expirado para email: {}", email);
            return false;
        }
        
        VerificationCode verificationCode = verificationCodeOpt.get();
        verificationCode.setUsed(true);
        verificationCode.setUsedAt(LocalDateTime.now());
        verificationCodeRepository.save(verificationCode);
        
        logger.info("Código de verificação validado com sucesso para email: {}", email);
        return true;
    }
    
    /**
     * Verifica se existe um código válido para um email e tipo
     */
    public boolean hasValidCode(String email, VerificationType type) {
        return verificationCodeRepository
            .findValidCodeByEmailAndType(email, type, LocalDateTime.now())
            .isPresent();
    }
    
    /**
     * Gera o conteúdo HTML do email baseado no tipo
     */
    private String generateEmailContent(VerificationCode code, VerificationType type) {
    String template = """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s - Código de Verificação</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 10px;
                }
                .subtitle {
                    color: #6c757d;
                    font-size: 16px;
                }
                .code-container {
                    background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                    border-radius: 8px;
                    padding: 30px;
                    text-align: center;
                    margin: 30px 0;
                }
                .verification-code {
                    font-size: 36px;
                    font-weight: bold;
                    color: white;
                    letter-spacing: 4px;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .code-label {
                    color: rgba(255,255,255,0.9);
                    font-size: 14px;
                    margin-top: 10px;
                }
                .message {
                    text-align: center;
                    margin: 25px 0;
                    font-size: 16px;
                    line-height: 1.5;
                }
                .expiry-info {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 6px;
                    padding: 15px;
                    text-align: center;
                    color: #856404;
                    font-size: 14px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #6c757d;
                    font-size: 14px;
                }
                .security-note {
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #495057;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">%s</div>
                    <div class="subtitle">Seu espaço de produtividade</div>
                </div>
                
                <div class="message">
                    %s
                </div>
                
                <div class="code-container">
                    <div class="verification-code">%s</div>
                    <div class="code-label">Código de Verificação</div>
                </div>
                
                <div class="expiry-info">
                    ⏰ Este código expira em 15 minutos (%s)
                </div>
                
                <div class="security-note">
                    🔒 <strong>Importante:</strong> Nunca compartilhe este código com outras pessoas. 
                    A equipe do Orbitr nunca solicitará seu código de verificação.
                </div>
                
                    <div class="footer">
                    <p>Este é um email automático do %s.<br>
                    Se você não solicitou este código, pode ignorar este email com segurança.</p>
                    <p style="margin-top: 15px;">
                        <strong>%s</strong> - Transformando ideias em realidade
                    </p>
                </div>
            </div>
        </body>
        </html>
        """;
        
        String brand = (emailConfig != null && emailConfig.getFromName() != null) ? emailConfig.getFromName() : "Orbitr";
        String message = getEmailMessage(type);
        String expiryTime = code.getExpiresAt().toString().replace("T", " às ");

        // placeholders: 1=brand (title), 2=brand (logo), 3=message, 4=code, 5=expiry, 6=brand (footer text), 7=brand (footer strong)
        return String.format(template, brand, brand, message, code.getCode(), expiryTime, brand, brand);
    }
    
    /**
     * Retorna o assunto do email baseado no tipo
     */
    private String getEmailSubject(VerificationType type) {
        return switch (type) {
            case EMAIL_VERIFICATION -> "Orbitr Task Manager - Confirme seu email";
            case PASSWORD_RESET -> "Orbitr Task Manager - Redefinição de senha";
            case ACCOUNT_ACTIVATION -> "Orbitr Task Manager - Ative sua conta";
        };
    }
    
    /**
     * Retorna a mensagem do email baseada no tipo
     */
    private String getEmailMessage(VerificationType type) {
        return switch (type) {
            case EMAIL_VERIFICATION -> 
                "Bem-vindo ao <strong>Orbitr Task Manager</strong>!<br><br>" +
                "Para concluir seu cadastro, confirme seu email utilizando o código abaixo:";
            case PASSWORD_RESET -> 
                "Recebemos uma solicitação para redefinir sua senha no <strong>Orbitr Task Manager</strong>.<br><br>" +
                "Use o código abaixo para criar uma nova senha:";
            case ACCOUNT_ACTIVATION -> 
                "Sua conta no <strong>Orbitr Task Manager</strong> está quase ativa!<br><br>" +
                "Use o código abaixo para ativar sua conta:";
        };
    }
    
    /**
     * Limpeza automática de códigos expirados (executa a cada hora)
     */
    @Scheduled(fixedRate = 3600000) // 1 hora
    public void cleanupExpiredCodes() {
        logger.info("Iniciando limpeza automática de códigos expirados");
        try {
            verificationCodeRepository.deleteExpiredCodes(LocalDateTime.now());
            logger.info("Limpeza de códigos expirados concluída com sucesso");
        } catch (Exception e) {
            logger.error("Erro durante limpeza de códigos expirados", e);
        }
    }
}