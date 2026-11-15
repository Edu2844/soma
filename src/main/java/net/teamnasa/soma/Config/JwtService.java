package net.teamnasa.soma.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import net.teamnasa.soma.models.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    @Getter
    private final long expiracionMs;

    public JwtService(@Value("${soma.jwt.secret}") String secret, @Value("${soma.jwt.expiracion-ms}") long expiracionMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracionMs = expiracionMs;
    }

    public String generar(Usuario u) {
        Date ahora = new Date();
        return Jwts.builder()
                .subject(u.getId())
                .claim("codigo", u.getCodigo())
                .claim("rol", u.getRol().name())
                .claim("astronautaId", u.getAstronautaId())
                .issuedAt(ahora)
                .expiration(new Date(ahora.getTime() + getExpiracionMs()))
                .signWith(key)
                .compact();
    }

    // Lanza JwtException si el token es inválido, está manipulado o expiró
    public Claims parsear(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}