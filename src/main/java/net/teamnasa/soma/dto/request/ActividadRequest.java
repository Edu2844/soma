package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import net.teamnasa.soma.models.enums.TipoActividad;

import java.time.LocalDate;

public record ActividadRequest(
        @NotBlank String astronautaId,
        @NotBlank String nombre,
        String descripcion,
        @NotNull TipoActividad tipo,
        @NotNull LocalDate fecha,
        @Positive Integer duracionMin) {}