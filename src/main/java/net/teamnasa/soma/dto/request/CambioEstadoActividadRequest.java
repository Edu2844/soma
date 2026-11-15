package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotNull;
import net.teamnasa.soma.models.enums.EstadoActividad;

public record CambioEstadoActividadRequest(
        @NotNull EstadoActividad estado) {}