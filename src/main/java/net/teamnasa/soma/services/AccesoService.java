package net.teamnasa.soma.services;

import net.teamnasa.soma.config.UsuarioAutenticado;
import net.teamnasa.soma.models.enums.RolUsuario;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("acceso")
public class AccesoService {
    public boolean esPropio(Authentication auth, String astronautaId) {
        return auth.getPrincipal() instanceof UsuarioAutenticado u
                && u.rol() == RolUsuario.TRIPULANTE
                && astronautaId != null
                && astronautaId.equals(u.astronautaId());
    }
}