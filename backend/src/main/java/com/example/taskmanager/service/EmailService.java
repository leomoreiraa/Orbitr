package com.example.taskmanager.service;

import com.example.taskmanager.model.Board;
import com.example.taskmanager.model.Usuario;
import com.example.taskmanager.config.EmailConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    private final EmailConfig emailConfig;
    
    public EmailService(JavaMailSender mailSender, EmailConfig emailConfig) {
        this.mailSender = mailSender;
        this.emailConfig = emailConfig;
    }
    
    /**
     * Envia email simples de compartilhamento de board
     */
    public void enviarNotificacaoCompartilhamento(String destinatario, String nomeBoard, String nomeProprietario) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailConfig.getFromAddress()); // Email remetente configurável (endereço formatado)
            message.setTo(destinatario);
            message.setSubject("📋 Board compartilhado: " + nomeBoard);
            message.setText(
                "Olá!\n\n" +
                nomeProprietario + " compartilhou o board '" + nomeBoard + "' com você.\n\n" +
                "🔗 Acesse agora: " + emailConfig.getAppUrl() + "/login\n\n" +
                "Você pode visualizar e colaborar neste board através da plataforma " + emailConfig.getFromName() + ".\n\n" +
                "---\n" +
                "Equipe " + emailConfig.getFromName() + "\n" +
                "📧 Contato: " + emailConfig.getSupportEmail() + "\n" +
                "🌐 Website: " + emailConfig.getWebsiteUrl()
            );
            
            mailSender.send(message);
            logger.info("✅ Email de compartilhamento enviado para: {} de: {}", destinatario, emailConfig.getFromName());
            
        } catch (Exception e) {
            logger.error("❌ Erro ao enviar email para {}: {}", destinatario, e.getMessage());
            throw new RuntimeException("Falha ao enviar email de notificação", e);
        }
    }
    
    /**
     * Envia email HTML estilizado (versão mais bonita)
     */
    public void enviarNotificacaoCompartilhamentoHTML(Board board, Usuario proprietario, Usuario destinatario, String permissao) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(destinatario.getEmail());
            helper.setSubject("🎯 Novo Board Compartilhado: " + board.getNome());
            // Define remetente com nome amigável
            helper.setFrom(emailConfig.getFromAddress());
            
            String htmlContent = criarTemplateHTML(board, proprietario, destinatario, permissao);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            logger.info("✅ Email HTML de compartilhamento enviado para: {}", destinatario.getEmail());
            
        } catch (MessagingException e) {
            logger.error("❌ Erro ao enviar email HTML para {}: {}", destinatario.getEmail(), e.getMessage());
            throw new RuntimeException("Falha ao enviar email HTML", e);
        }
    }
    
    /**
     * Envia notificação de remoção de compartilhamento
     */
    public void enviarNotificacaoRemocaoCompartilhamento(String destinatario, String nomeBoard, String nomeProprietario) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailConfig.getFromAddress());
            message.setTo(destinatario);
            message.setSubject("🚫 Acesso removido: " + nomeBoard);
            message.setText(
                "Olá!\n\n" +
                nomeProprietario + " removeu seu acesso ao board '" + nomeBoard + "'.\n\n" +
                "Você não consegue mais visualizar ou editar este board.\n\n" +
                "Se isso foi um engano, entre em contato com " + nomeProprietario + ".\n\n" +
                "---\n" +
                "Equipe Orbitr"
            );
            
            mailSender.send(message);
            logger.info("✅ Email de remoção enviado para: {}", destinatario);
            
        } catch (Exception e) {
            logger.error("❌ Erro ao enviar email de remoção para {}: {}", destinatario, e.getMessage());
        }
    }
    
    /**
     * Template HTML bonito para emails
     */
    private String criarTemplateHTML(Board board, Usuario proprietario, Usuario destinatario, String permissao) {
        String permissaoTexto = "EDIT".equals(permissao) ? 
            "✏️ <strong>Editar</strong> - Você pode criar, editar e mover tarefas" : 
            "👁️ <strong>Visualizar</strong> - Você pode apenas visualizar o board";
            
    String htmlTemplate = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; }
                    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px 30px; }
                    .board-info { background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                    .permission-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
                    .edit-permission { background: #fbbf24; color: #92400e; }
                    .view-permission { background: #34d399; color: #065f46; }
                    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 Board Compartilhado!</h1>
                    </div>
                    
                    <div class="content">
                        <p>Olá <strong>{DESTINATARIO}</strong>!</p>
                        
                        <p><strong>{PROPRIETARIO}</strong> compartilhou um board com você no Orbitr.</p>
                        
                        <div class="board-info">
                            <h3>📋 {BOARD_NOME}</h3>
                            <p><strong>Proprietário:</strong> {PROPRIETARIO_NOME}</p>
                            <p><strong>Seu nível de acesso:</strong></p>
                            <div class="permission-badge {PERMISSION_CLASS}">{PERMISSAO_TEXTO}</div>
                        </div>
                        
                        <p>Clique no botão abaixo para acessar o board:</p>
                        
                        <a href="%s/login" class="button">🚀 Abrir no Orbitr</a>
                        
                        <p><small>💡 <strong>Dica:</strong> Faça login com sua conta para ver o board compartilhado na sua lista de boards.</small></p>
                    </div>
                    
                    <div class="footer">
                        <p>📧 Este email foi enviado automaticamente pelo " + emailConfig.getFromName() + "</p>
                        <p>Se você não esperava este email, pode ignorá-lo com segurança.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
            
        // Inject application URL from EmailConfig if available
        String appUrl = emailConfig != null ? emailConfig.getAppUrl() : "http://localhost:4200";
        String formatted = String.format(htmlTemplate, appUrl);
        return formatted
            .replace("{DESTINATARIO}", destinatario.getNomeUsuario())
            .replace("{PROPRIETARIO}", proprietario.getNomeUsuario())
            .replace("{BOARD_NOME}", board.getNome())
            .replace("{PROPRIETARIO_NOME}", proprietario.getNomeUsuario())
            .replace("{PERMISSION_CLASS}", "EDIT".equals(permissao) ? "edit-permission" : "view-permission")
            .replace("{PERMISSAO_TEXTO}", permissaoTexto);
    }
    
    /**
     * Testa se o serviço de email está funcionando
     */
    public boolean testarConexao(String emailTeste) {
        try {
            logger.info("🔍 Iniciando teste de email para: {}", emailTeste);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailConfig.getFromAddress());
            message.setTo(emailTeste);
            message.setSubject("🧪 " + emailConfig.getFromName() + " - Teste de Email");
            message.setText("Parabéns! Se você recebeu este email, a configuração do Orbitr está funcionando perfeitamente! ✅\n\n" +
                           "✅ Sistema de email configurado\n" +
                           "✅ Notificações de compartilhamento ativas\n" +
                           "✅ TaskManager pronto para uso\n\n" +
                           "---\n" +
                        "Equipe " + emailConfig.getFromName());
            
            logger.info("📧 Enviando email de teste...");
            mailSender.send(message);
            logger.info("✅ Email de teste enviado com sucesso para: {}", emailTeste);
            return true;
            
        } catch (Exception e) {
            logger.error("❌ ERRO DETALHADO no teste de email para {}: {}", emailTeste, e.getMessage());
            logger.error("❌ Tipo do erro: {}", e.getClass().getSimpleName());
            if (e.getCause() != null) {
                logger.error("❌ Causa: {}", e.getCause().getMessage());
            }
            return false;
        }
    }
    
    /**
     * Envia email HTML formatado
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        logger.info("📧 Enviando email HTML para: {}", to);
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        // Definimos o remetente com display name (Orbitr)
        helper.setFrom(emailConfig.getFromAddress());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true); // true indica HTML
        
        mailSender.send(message);
        logger.info("✅ Email HTML enviado com sucesso para: {}", to);
    }
}