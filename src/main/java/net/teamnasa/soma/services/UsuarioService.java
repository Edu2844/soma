package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Usuario;
import net.teamnasa.soma.models.enums.RolUsuario;
import net.teamnasa.soma.repositories.AstronautaRepository;
import net.teamnasa.soma.repositories.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final AstronautaRepository astronautaRepository;
    private final PasswordEncoder passwordEncoder;

    public Usuario crear(String codigo, String passwordPlano, RolUsuario rol, String astronautaId){
        if (usuarioRepository.existsByCodigo(codigo)){
            throw new IllegalStateException("Ya existe un usuario con el código: " + codigo);
        }

        if (rol == RolUsuario.TRIPULANTE || rol == RolUsuario.MEDICO) {
            if (astronautaId == null || astronautaId.isBlank()) {
                throw new IllegalArgumentException("Los tripulantes y médicos deben estar vinculados a un astronauta");
            }
            if (!astronautaRepository.existsById(astronautaId)) {
                throw new NoSuchElementException("Astronauta no encontrado: " + astronautaId);
            }
            if (usuarioRepository.existsByAstronautaId(astronautaId)) {
                throw new IllegalStateException("Ese astronauta ya tiene una cuenta de usuario");
            }
        }

        return usuarioRepository.save(Usuario.builder()
                .codigo(codigo)
                .passwordHash(passwordEncoder.encode(passwordPlano))
                .rol(rol)
                .astronautaId(astronautaId)
                .activo(true)
                .build()
        );
    }

    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    public Usuario obtener(String id) {
        return usuarioRepository.findById(id).orElseThrow(()-> new NoSuchElementException("Usuario no encontrado" + id));
    }

    public Usuario cambiarPassword(String id, String nuevaPassword) {
        Usuario u = obtener(id);
        u.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        return usuarioRepository.save(u);
    }

    public Usuario cambiarEstado(String id, boolean activo){
        Usuario u = obtener(id);
        u.setActivo(activo);
        return usuarioRepository.save(u);
    }
}
