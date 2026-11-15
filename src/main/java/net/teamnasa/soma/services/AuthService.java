package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.exception.CredencialesInvalidasException;
import net.teamnasa.soma.models.Usuario;
import net.teamnasa.soma.repositories.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public Usuario autenticar(String codigo, String password) {
        Usuario u = usuarioRepository.findByCodigo(codigo)
                .filter(Usuario::isActivo)
                .filter(x -> passwordEncoder.matches(password, x.getPasswordHash()))
                .orElseThrow(CredencialesInvalidasException::new);
        return u;
    }
}