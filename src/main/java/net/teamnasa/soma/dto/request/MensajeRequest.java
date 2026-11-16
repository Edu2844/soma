package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import net.teamnasa.soma.models.enums.PrioridadMensaje;

public record MensajeRequest(
        @NotBlank String astronautaId,
        @NotBlank @Size(max = 500) String texto,
        PrioridadMensaje prioridad) {}
