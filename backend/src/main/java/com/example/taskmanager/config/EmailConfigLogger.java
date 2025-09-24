package com.example.taskmanager.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class EmailConfigLogger implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailConfigLogger.class);
    
    private final Environment env;
    private final JavaMailSender mailSender;
    
    public EmailConfigLogger(Environment env, JavaMailSender mailSender) {
        this.env = env;
        this.mailSender = mailSender;
    }
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("📧 ========== CONFIGURAÇÕES DE EMAIL ==========");
        logger.info("📧 Host SMTP: {}", env.getProperty("spring.mail.host"));
        logger.info("📧 Porta SMTP: {}", env.getProperty("spring.mail.port"));
        logger.info("📧 Username: {}", env.getProperty("spring.mail.username"));
        logger.info("📧 Senha configurada: {}", 
            env.getProperty("spring.mail.password") != null ? "SIM" : "NÃO");
        logger.info("📧 STARTTLS: {}", env.getProperty("spring.mail.properties.mail.smtp.starttls.enable"));
        logger.info("📧 Auth: {}", env.getProperty("spring.mail.properties.mail.smtp.auth"));
        logger.info("📧 Debug: {}", env.getProperty("spring.mail.properties.mail.debug"));
        logger.info("📧 From Address: {}", env.getProperty("app.email.from-address"));
        logger.info("📧 JavaMailSender disponível: {}", mailSender != null ? "SIM" : "NÃO");
        logger.info("📧 ============================================");
    }
}