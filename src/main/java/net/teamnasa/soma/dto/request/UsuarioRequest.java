package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import net.teamnasa.soma.models.enums.RolUsuario;

public record UsuarioRequest(
        @NotBlank @Size(min = 3, max = 30) String codigo,
        @NotBlank @Size(min = 8, max = 64) String password,
        @NotNull RolUsuario rol,
        String astronautaId) {

}
