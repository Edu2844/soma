package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.response.UsuarioResponse;
import net.teamnasa.soma.models.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(u.getId(),
                u.getCodigo(),
                u.getRol(),
                u.getAstronautaId(),
                u.isActivo()
        );
    }
}