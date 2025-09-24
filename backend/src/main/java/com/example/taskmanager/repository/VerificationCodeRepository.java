package com.example.taskmanager.repository;

import com.example.taskmanager.model.VerificationCode;
import com.example.taskmanager.model.VerificationCode.VerificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    
    /**
     * Busca um código válido (não usado e não expirado) para um email e tipo específicos
     */
    @Query("SELECT vc FROM VerificationCode vc WHERE vc.email = :email AND vc.type = :type AND vc.used = false AND vc.expiresAt > :now ORDER BY vc.createdAt DESC")
    Optional<VerificationCode> findValidCodeByEmailAndType(
        @Param("email") String email, 
        @Param("type") VerificationType type, 
        @Param("now") LocalDateTime now
    );
    
    /**
     * Busca um código específico válido
     */
    @Query("SELECT vc FROM VerificationCode vc WHERE vc.email = :email AND vc.code = :code AND vc.type = :type AND vc.used = false AND vc.expiresAt > :now")
    Optional<VerificationCode> findValidCode(
        @Param("email") String email, 
        @Param("code") String code, 
        @Param("type") VerificationType type, 
        @Param("now") LocalDateTime now
    );
    
    /**
     * Marca todos os códigos de um email e tipo como usados (para invalidar códigos antigos)
     */
    @Modifying
    @Query("UPDATE VerificationCode vc SET vc.used = true WHERE vc.email = :email AND vc.type = :type AND vc.used = false")
    void invalidateAllCodesByEmailAndType(@Param("email") String email, @Param("type") VerificationType type);
    
    /**
     * Remove códigos expirados (limpeza automática)
     */
    @Modifying
    @Query("DELETE FROM VerificationCode vc WHERE vc.expiresAt < :now")
    void deleteExpiredCodes(@Param("now") LocalDateTime now);
}