package com.example.taskmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_codes")
public class VerificationCode {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false, length = 6)
    private String code;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private boolean used = false;
    
    private LocalDateTime usedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationType type;
    
    // Construtores
    public VerificationCode() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(15); // Expira em 15 minutos
        this.code = generateCode();
    }
    
    /**
     * Gera um código de 6 dígitos aleatório
     */
    private String generateCode() {
        return String.format("%06d", (int)(Math.random() * 1000000));
    }
    
    public VerificationCode(String email, String code, VerificationType type) {
        this();
        this.email = email;
        this.code = code;
        this.type = type;
    }
    
    // Getters e Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public boolean isUsed() {
        return used;
    }
    
    public void setUsed(boolean used) {
        this.used = used;
    }
    
    public LocalDateTime getUsedAt() {
        return usedAt;
    }
    
    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
    
    public VerificationType getType() {
        return type;
    }
    
    public void setType(VerificationType type) {
        this.type = type;
    }
    
    // Métodos utilitários
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isValid() {
        return !used && !isExpired();
    }
    
    public enum VerificationType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET,
        ACCOUNT_ACTIVATION
    }
}