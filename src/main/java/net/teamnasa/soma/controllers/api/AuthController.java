package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.config.JwtService;
import net.teamnasa.soma.dto.request.LoginRequest;
import net.teamnasa.soma.dto.response.LoginResponse;
import net.teamnasa.soma.dto.response.UsuarioResponse;
import net.teamnasa.soma.mapper.UsuarioMapper;
import net.teamnasa.soma.models.Usuario;
import net.teamnasa.soma.services.AuthService;
import net.teamnasa.soma.services.UsuarioService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UsuarioService usuarioService;
    private final JwtService jwtService;
    private final UsuarioMapper usuarioMapper;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Usuario u = authService.autenticar(request.codigo(), request.password());
        return new LoginResponse(jwtService.generar(u), usuarioMapper.toResponse(u));
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication auth) {
        return usuarioMapper.toResponse(usuarioService.obtener(auth.getName()));
    }
}