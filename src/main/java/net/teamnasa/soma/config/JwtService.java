package net.teamnasa.soma.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.teamnasa.soma.models.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;

@Slf4j
@Service
public class JwtService {
    private static final int MIN_BYTES_CLAVE = 32;

    private final SecretKey key;
    @Getter
    private final long expiracionMs;

    public JwtService(@Value("${soma.jwt.secret:}") String secret, @Value("${soma.jwt.expiracion-ms}") long expiracionMs) {
        byte[] bytes = (secret == null) ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_BYTES_CLAVE) {
            if (bytes.length > 0) {
                log.warn("soma.jwt.secret tiene menos de {} caracteres y no es segura: se ignora", MIN_BYTES_CLAVE);
            }
            log.warn("JWT_SECRET no esta definida: se genero una clave aleatoria temporal. "
                    + "Los tokens dejaran de valer al reiniciar el servidor.");
            bytes = new byte[64];
            new SecureRandom().nextBytes(bytes);
        }
        this.key = Keys.hmacShaKeyFor(bytes);
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

    public Claims parsear(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
