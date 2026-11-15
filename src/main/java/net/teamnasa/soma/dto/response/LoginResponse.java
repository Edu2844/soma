package net.teamnasa.soma.dto.response;

public record LoginResponse(
        String token,
        UsuarioResponse usuario) {}