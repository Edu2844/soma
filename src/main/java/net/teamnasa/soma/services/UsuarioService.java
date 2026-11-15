package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Usuario;
import net.teamnasa.soma.models.enums.RolUsuario;
import net.teamnasa.soma.repositories.AstronautaRepository;
import net.teamnasa.soma.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final AstronautaRepository astronautaRepository;


    public Usuario crear(String codigo, String passwordPlano, RolUsuario rol, String astronautaId){



    }
}
