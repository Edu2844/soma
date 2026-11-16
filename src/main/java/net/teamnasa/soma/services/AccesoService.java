package net.teamnasa.soma.services;

import net.teamnasa.soma.config.UsuarioAutenticado;
import net.teamnasa.soma.models.enums.RolUsuario;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("acceso")
public class AccesoService {
    public boolean esPropio(Authentication auth, String astronautaId) {
        return auth != null
                && auth.getPrincipal() instanceof UsuarioAutenticado u
                && u.rol() == RolUsuario.TRIPULANTE
                && astronautaId != null
                && astronautaId.equals(u.astronautaId());
    }

    /** ADMIN o MEDICO. */
    public boolean esStaff(Authentication auth) {
        return auth != null
                && auth.getPrincipal() instanceof UsuarioAutenticado u
                && (u.rol() == RolUsuario.ADMIN || u.rol() == RolUsuario.MEDICO);
    }

    /**
     * Lanza AccessDeniedException (403) si el usuario actual no es personal médico/admin
     * ni el propio astronauta. Los procesos internos sin usuario (por ejemplo el DataSeeder
     * al arrancar) no tienen autenticación y se permiten.
     */
    public void exigirStaffOPropio(String astronautaId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return;
        }
        if (esStaff(auth) || esPropio(auth, astronautaId)) {
            return;
        }
        throw new AccessDeniedException("No puedes acceder a los datos de otro astronauta");
    }
}
