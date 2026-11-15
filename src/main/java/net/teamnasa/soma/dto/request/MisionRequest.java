package net.teamnasa.soma.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.teamnasa.soma.models.embedded.ParametrosMision;

import java.time.Instant;

public record MisionRequest(
        @NotBlank String nombre,
        Instant fechaInicio,
        Instant fechaFinEstimada,
        @Valid @NotNull ParametrosMision parametros) {}