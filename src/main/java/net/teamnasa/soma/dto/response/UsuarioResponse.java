package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.enums.RolUsuario;

public record UsuarioResponse(
        String id, String codigo, RolUsuario rol, String astronautaId, boolean activo) {}
