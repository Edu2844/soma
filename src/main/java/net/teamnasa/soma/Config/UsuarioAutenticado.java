package net.teamnasa.soma.config;

import net.teamnasa.soma.models.enums.RolUsuario;

import java.security.Principal;

public record UsuarioAutenticado(String id, String codigo, RolUsuario rol, String astronautaId) implements Principal {
    @Override
    public String getName() {
        return id;
    }
}