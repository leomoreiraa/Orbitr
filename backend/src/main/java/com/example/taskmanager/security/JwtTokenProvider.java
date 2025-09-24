package com.example.taskmanager.security;

import com.example.taskmanager.model.Usuario;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Responsável por gerar e validar tokens JWT.
 */
@Component
public class JwtTokenProvider {

    private final JwtProperties properties;
    private final Key key;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes());
    }

    /**
     * Gera um token JWT contendo subject (username/email) e data de expiração.
     */
    public String gerarToken(Authentication authentication, Usuario usuario) {
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + properties.getExpirationMillis());
        return Jwts.builder()
                .setSubject(principal.getUsername())
                .claim("nome", usuario.getNome())
                .claim("nomeUsuario", usuario.getNomeUsuario())
                .setIssuedAt(agora)
                .setExpiration(expiracao)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extrai o username (email) do token.
     */
    public String getUsernameDoToken(String token) {
        return parser().parseClaimsJws(token).getBody().getSubject();
    }

    /**
     * Extrai o nome de usuário do token.
     */
    public String getNomeUsuarioDoToken(String token) {
        return parser().parseClaimsJws(token).getBody().get("nomeUsuario", String.class);
    }

    /**
     * Extrai o nome completo do token.
     */
    public String getNomeDoToken(String token) {
        return parser().parseClaimsJws(token).getBody().get("nome", String.class);
    }

    /**
     * Valida token verificando assinatura e expiração.
     */
    public boolean tokenValido(String token) {
        try {
            parser().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private JwtParser parser() {
        return Jwts.parserBuilder().setSigningKey(key).build();
    }
}
